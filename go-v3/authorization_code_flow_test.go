package main

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"errors"
	"math/big"
	"net/http"
	"net/url"
	"os"
	"strconv"
	"strings"
	"testing"
	"time"

	"github.com/authlete/authlete-go-sdk/models/apierrors"
	"github.com/authlete/authlete-go-sdk/models/components"
)

const (
	testRedirectURI = "https://sdk-playground.example.com/callback"
	testSubject     = "sdk-playground-user"
	// Transient errors (429 and 5xx) are retried with exponential backoff.
	maxRetries = 3
)

// callWithRetry executes an Authlete API call, retrying transient errors
// (429 and 5xx) following
// https://www.authlete.com/kb/deployment/performance/ratelimit-best-practices/:
// honor the Ratelimit-Reset header when present, otherwise use exponential
// backoff (500 ms, 1 s, 2 s) with a small random jitter.
//
// The SDK has no retry configuration by default, so this is the only retry
// policy in effect.
func callWithRetry[T any](t *testing.T, label string, call func() (T, error)) (T, error) {
	t.Helper()

	for attempt := 0; ; attempt++ {
		result, err := call()
		httpResp := errorResponse(err)
		if err == nil || httpResp == nil || attempt >= maxRetries || !isRetryableStatus(httpResp.StatusCode) {
			return result, err
		}

		delay := retryDelay(t, attempt, httpResp)
		t.Logf("%s failed with HTTP %d; retrying in %v (attempt %d/%d)",
			label, httpResp.StatusCode, delay, attempt+1, maxRetries)
		time.Sleep(delay)
	}
}

// errorResponse returns the raw HTTP response carried by an SDK error, or nil
// when the error did not come from an HTTP response (e.g. a network error).
func errorResponse(err error) *http.Response {
	var resultErr *apierrors.ResultError
	if errors.As(err, &resultErr) {
		return resultErr.HTTPMeta.Response
	}
	var apiErr *apierrors.APIError
	if errors.As(err, &apiErr) {
		return apiErr.RawResponse
	}
	return nil
}

func isRetryableStatus(statusCode int) bool {
	return statusCode == 429 || statusCode >= 500
}

func retryDelay(t *testing.T, attempt int, httpResp *http.Response) time.Duration {
	t.Helper()

	if value := strings.TrimSpace(httpResp.Header.Get("Ratelimit-Reset")); value != "" {
		if seconds, err := strconv.Atoi(value); err == nil && seconds > 0 {
			if seconds > 30 {
				seconds = 30
			}
			return time.Duration(seconds) * time.Second
		}
	}

	jitter, err := rand.Int(rand.Reader, big.NewInt(250))
	if err != nil {
		t.Fatalf("failed to generate retry jitter: %v", err)
	}
	return time.Duration(500<<attempt)*time.Millisecond + time.Duration(jitter.Int64())*time.Millisecond
}

// TestAuthorizationCodeFlow runs a minimal OAuth 2.0 authorization code flow
// against the Authlete V3 API to verify that the SDK works in this environment:
// create client -> /auth/authorization -> /auth/authorization/issue ->
// /auth/token -> /auth/introspection -> delete client.
func TestAuthorizationCodeFlow(t *testing.T) {
	// Prefer the version-specific variables; fall back to the plain ones
	// when they hold a V3 configuration.
	baseURL := os.Getenv("AUTHLETE_V3_BASE_URL")
	serviceID := os.Getenv("AUTHLETE_V3_SERVICE_APIKEY")
	accessToken := os.Getenv("AUTHLETE_V3_SERVICE_ACCESSTOKEN")

	if baseURL == "" && serviceID == "" && accessToken == "" {
		if v := strings.TrimSpace(os.Getenv("AUTHLETE_API_VERSION")); !strings.EqualFold(v, "V3") && v != "3" {
			t.Skip("authlete-go-sdk supports only the Authlete V3 API")
		}
		baseURL = os.Getenv("AUTHLETE_BASE_URL")
		serviceID = os.Getenv("AUTHLETE_SERVICE_APIKEY")
		accessToken = os.Getenv("AUTHLETE_SERVICE_ACCESSTOKEN")
	}
	if baseURL == "" || serviceID == "" || accessToken == "" {
		t.Skip("AUTHLETE_V3_BASE_URL, AUTHLETE_V3_SERVICE_APIKEY and AUTHLETE_V3_SERVICE_ACCESSTOKEN (or plain AUTHLETE_* V3 credentials) are required")
	}

	ctx := context.Background()
	sdk := createClient(baseURL, accessToken)

	// Step 1: create a disposable client for this test.
	clientName := "sdk-playground-smoke-" + randomString(t)
	clientType := components.ClientTypeConfidential
	newClient := &components.ClientInput{
		ClientName:    &clientName,
		ClientType:    &clientType,
		GrantTypes:    []components.GrantType{components.GrantTypeAuthorizationCode},
		ResponseTypes: []components.ResponseType{components.ResponseTypeCode},
		RedirectUris:  []string{testRedirectURI},
	}

	created, err := callWithRetry(t, "/client/create", func() (*components.Client, error) {
		res, err := sdk.Client.Create(ctx, serviceID, newClient)
		if err != nil {
			return nil, err
		}
		return res.Client, nil
	})
	if err != nil {
		t.Fatalf("/client/create failed: %v", err)
	}
	if created == nil || created.GetClientID() == nil {
		t.Fatal("/client/create: response has no client ID")
	}
	clientID := strconv.FormatInt(*created.GetClientID(), 10)
	t.Logf("created client: id=%s name=%s", clientID, clientName)

	// Always clean up the client, even when the flow fails halfway.
	defer func() {
		_, err := callWithRetry(t, "/client/delete", func() (struct{}, error) {
			_, err := sdk.Client.Delete(ctx, serviceID, clientID)
			return struct{}{}, err
		})
		if err != nil {
			t.Errorf("/client/delete failed for client %s: %v", clientID, err)
			return
		}
		t.Logf("deleted client: id=%s", clientID)
	}()

	// Step 2: /auth/authorization
	state := randomString(t)
	authzParams := url.Values{}
	authzParams.Set("response_type", "code")
	authzParams.Set("client_id", clientID)
	authzParams.Set("redirect_uri", testRedirectURI)
	authzParams.Set("state", state)

	authzResp, err := callWithRetry(t, "/auth/authorization", func() (*components.AuthorizationResponse, error) {
		res, err := sdk.Authorization.ProcessRequest(ctx, serviceID, components.AuthorizationRequest{
			Parameters: authzParams.Encode(),
		})
		if err != nil {
			return nil, err
		}
		return res.AuthorizationResponse, nil
	})
	if err != nil {
		t.Fatalf("/auth/authorization failed: %v", err)
	}
	if action := value(authzResp.GetAction()); action != components.AuthorizationResponseActionInteraction {
		t.Fatalf("/auth/authorization: expected action INTERACTION, got %q", action)
	}
	ticket := value(authzResp.GetTicket())
	if ticket == "" {
		t.Fatal("/auth/authorization: ticket is empty")
	}
	t.Logf("/auth/authorization: action=INTERACTION ticket issued")

	// Step 3: /auth/authorization/issue
	issueResp, err := callWithRetry(t, "/auth/authorization/issue", func() (*components.AuthorizationIssueResponse, error) {
		res, err := sdk.Authorization.Issue(ctx, serviceID, components.AuthorizationIssueRequest{
			Ticket:  ticket,
			Subject: testSubject,
		})
		if err != nil {
			return nil, err
		}
		return res.AuthorizationIssueResponse, nil
	})
	if err != nil {
		t.Fatalf("/auth/authorization/issue failed: %v", err)
	}
	if action := value(issueResp.GetAction()); action != components.AuthorizationIssueResponseActionLocation {
		t.Fatalf("/auth/authorization/issue: expected action LOCATION, got %q", action)
	}
	location := value(issueResp.GetResponseContent())
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

	tokenResp, err := callWithRetry(t, "/auth/token", func() (*components.TokenResponse, error) {
		res, err := sdk.Token.Process(ctx, serviceID, components.TokenRequest{
			Parameters:   tokenParams.Encode(),
			ClientID:     &clientID,
			ClientSecret: created.GetClientSecret(),
		})
		if err != nil {
			return nil, err
		}
		return res.TokenResponse, nil
	})
	if err != nil {
		t.Fatalf("/auth/token failed: %v", err)
	}
	if action := value(tokenResp.GetAction()); action != components.TokenResponseActionOk {
		t.Fatalf("/auth/token: expected action OK, got %q (%s)", action, value(tokenResp.GetResponseContent()))
	}
	issuedToken := value(tokenResp.GetAccessToken())
	if issuedToken == "" {
		t.Fatal("/auth/token: access token is empty")
	}
	t.Logf("/auth/token: action=OK access token issued")

	// Step 5: /auth/introspection
	introResp, err := callWithRetry(t, "/auth/introspection", func() (*components.IntrospectionResponse, error) {
		res, err := sdk.Introspection.Process(ctx, serviceID, components.IntrospectionRequest{
			Token: issuedToken,
		})
		if err != nil {
			return nil, err
		}
		return res.IntrospectionResponse, nil
	})
	if err != nil {
		t.Fatalf("/auth/introspection failed: %v", err)
	}
	if action := value(introResp.GetAction()); action != components.IntrospectionResponseActionOk {
		t.Fatalf("/auth/introspection: expected action OK, got %q", action)
	}
	if !value(introResp.GetUsable()) {
		t.Fatal("/auth/introspection: access token is not usable")
	}
	if subject := value(introResp.GetSubject()); subject != testSubject {
		t.Fatalf("/auth/introspection: expected subject %q, got %q", testSubject, subject)
	}
	t.Logf("/auth/introspection: action=OK access token is valid")
}

// value dereferences an optional SDK field, returning the zero value for nil.
func value[T any](p *T) T {
	if p == nil {
		var zero T
		return zero
	}
	return *p
}

func randomString(t *testing.T) string {
	t.Helper()

	buf := make([]byte, 8)
	if _, err := rand.Read(buf); err != nil {
		t.Fatalf("failed to generate random string: %v", err)
	}
	return hex.EncodeToString(buf)
}
