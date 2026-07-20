package main

import (
	"crypto/rand"
	"encoding/hex"
	"fmt"
	"net/url"
	"os"
	"strings"
	"testing"

	authlete "github.com/authlete/openapi-for-go"
)

const (
	testRedirectURI = "https://sdk-playground.example.com/callback"
	testSubject     = "sdk-playground-user"
	// The V2 /client/create API requires a developer identifier.
	testDeveloper = "sdk-playground-developer"
)

// TestAuthorizationCodeFlow runs a minimal OAuth 2.0 authorization code flow
// against the Authlete V2 API to verify that the SDK works in this environment:
// create client -> /auth/authorization -> /auth/authorization/issue ->
// /auth/token -> /auth/introspection -> delete client.
func TestAuthorizationCodeFlow(t *testing.T) {
	// Prefer the version-specific variables; fall back to the plain ones
	// when they hold a V2 configuration.
	baseURL := os.Getenv("AUTHLETE_V2_BASE_URL")
	apiKey := os.Getenv("AUTHLETE_V2_SERVICE_APIKEY")
	apiSecret := os.Getenv("AUTHLETE_V2_SERVICE_APISECRET")

	if baseURL == "" && apiKey == "" && apiSecret == "" {
		if v := strings.TrimSpace(os.Getenv("AUTHLETE_API_VERSION")); strings.EqualFold(v, "V3") || v == "3" {
			t.Skip("openapi-for-go supports only the Authlete V2 API")
		}
		baseURL = os.Getenv("AUTHLETE_BASE_URL")
		apiKey = os.Getenv("AUTHLETE_SERVICE_APIKEY")
		apiSecret = os.Getenv("AUTHLETE_SERVICE_APISECRET")
	}
	if baseURL == "" || apiKey == "" || apiSecret == "" {
		t.Skip("AUTHLETE_V2_BASE_URL, AUTHLETE_V2_SERVICE_APIKEY and AUTHLETE_V2_SERVICE_APISECRET (or plain AUTHLETE_* V2 credentials) are required")
	}

	apiClient, err := createSimpleClient(baseURL, "")
	if err != nil {
		t.Fatalf("failed to create Authlete client: %v", err)
	}

	ctx, err := createAPIContext(apiKey, apiSecret, "", "")
	if err != nil {
		t.Fatalf("failed to create API context: %v", err)
	}

	// Step 1: create a disposable client for this test.
	clientName := "sdk-playground-smoke-" + randomString(t)
	newClient := authlete.NewClient()
	newClient.SetClientName(clientName)
	newClient.SetDeveloper(testDeveloper)
	newClient.SetClientType(authlete.CLIENTTYPE_CONFIDENTIAL)
	newClient.SetGrantTypes([]authlete.GrantType{authlete.GRANTTYPE_AUTHORIZATION_CODE})
	newClient.SetResponseTypes([]authlete.ResponseType{authlete.RESPONSETYPE_CODE})
	newClient.SetRedirectUris([]string{testRedirectURI})

	created, _, err := apiClient.ClientManagementApi.ClientCreateApi(ctx).Client(*newClient).Execute()
	if err != nil {
		t.Fatalf("/client/create failed: %v", err)
	}
	clientID := created.GetClientId()
	t.Logf("created client: id=%d name=%s", clientID, clientName)

	// Always clean up the client, even when the flow fails halfway.
	defer func() {
		_, err := apiClient.ClientManagementApi.ClientDeleteApi(ctx, fmt.Sprintf("%d", clientID)).Execute()
		if err != nil {
			t.Errorf("/client/delete failed for client %d: %v", clientID, err)
			return
		}
		t.Logf("deleted client: id=%d", clientID)
	}()

	// Step 2: /auth/authorization
	state := randomString(t)
	authzParams := url.Values{}
	authzParams.Set("response_type", "code")
	authzParams.Set("client_id", fmt.Sprintf("%d", clientID))
	authzParams.Set("redirect_uri", testRedirectURI)
	authzParams.Set("state", state)

	authzReq := authlete.NewAuthorizationRequest(authzParams.Encode())
	authzResp, _, err := apiClient.AuthorizationEndpointApi.AuthAuthorizationApi(ctx).AuthorizationRequest(*authzReq).Execute()
	if err != nil {
		t.Fatalf("/auth/authorization failed: %v", err)
	}
	if action := authzResp.GetAction(); action != "INTERACTION" {
		t.Fatalf("/auth/authorization: expected action INTERACTION, got %q", action)
	}
	ticket := authzResp.GetTicket()
	if ticket == "" {
		t.Fatal("/auth/authorization: ticket is empty")
	}
	t.Logf("/auth/authorization: action=INTERACTION ticket issued")

	// Step 3: /auth/authorization/issue
	issueReq := authlete.NewAuthorizationIssueRequest(ticket, testSubject)
	issueResp, _, err := apiClient.AuthorizationEndpointApi.AuthAuthorizationIssueApi(ctx).AuthorizationIssueRequest(*issueReq).Execute()
	if err != nil {
		t.Fatalf("/auth/authorization/issue failed: %v", err)
	}
	if action := issueResp.GetAction(); action != "LOCATION" {
		t.Fatalf("/auth/authorization/issue: expected action LOCATION, got %q", action)
	}
	location := issueResp.GetResponseContent()
	if !strings.Contains(location, "code=") {
		t.Fatalf("/auth/authorization/issue: no authorization code in response content: %s", location)
	}
	redirect, err := url.Parse(location)
	if err != nil {
		t.Fatalf("/auth/authorization/issue: failed to parse redirect URL %q: %v", location, err)
	}
	if got := redirect.Query().Get("state"); got != state {
		t.Fatalf("/auth/authorization/issue: expected state %q, got %q", state, got)
	}
	code := redirect.Query().Get("code")
	if code == "" {
		t.Fatalf("/auth/authorization/issue: empty authorization code in %q", location)
	}
	t.Logf("/auth/authorization/issue: action=LOCATION authorization code issued")

	// Step 4: /auth/token
	tokenParams := url.Values{}
	tokenParams.Set("grant_type", "authorization_code")
	tokenParams.Set("code", code)
	tokenParams.Set("redirect_uri", testRedirectURI)

	tokenReq := authlete.NewTokenRequest(tokenParams.Encode())
	tokenReq.SetClientId(fmt.Sprintf("%d", clientID))
	tokenReq.SetClientSecret(created.GetClientSecret())
	tokenResp, _, err := apiClient.TokenEndpointApi.AuthTokenApi(ctx).TokenRequest(*tokenReq).Execute()
	if err != nil {
		t.Fatalf("/auth/token failed: %v", err)
	}
	if action := tokenResp.GetAction(); action != "OK" {
		t.Fatalf("/auth/token: expected action OK, got %q (%s)", action, tokenResp.GetResponseContent())
	}
	accessToken := tokenResp.GetAccessToken()
	if accessToken == "" {
		t.Fatal("/auth/token: access token is empty")
	}
	t.Logf("/auth/token: action=OK access token issued")

	// Step 5: /auth/introspection
	introReq := authlete.NewIntrospectionRequest(accessToken)
	introResp, _, err := apiClient.IntrospectionEndpointApi.AuthIntrospectionApi(ctx).IntrospectionRequest(*introReq).Execute()
	if err != nil {
		t.Fatalf("/auth/introspection failed: %v", err)
	}
	if action := introResp.GetAction(); action != "OK" {
		t.Fatalf("/auth/introspection: expected action OK, got %q", action)
	}
	if !introResp.GetUsable() {
		t.Fatal("/auth/introspection: access token is not usable")
	}
	if subject := introResp.GetSubject(); subject != testSubject {
		t.Fatalf("/auth/introspection: expected subject %q, got %q", testSubject, subject)
	}
	t.Logf("/auth/introspection: action=OK access token is valid")
}

func randomString(t *testing.T) string {
	t.Helper()

	buf := make([]byte, 8)
	if _, err := rand.Read(buf); err != nil {
		t.Fatalf("failed to generate random string: %v", err)
	}
	return hex.EncodeToString(buf)
}
