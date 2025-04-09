package main

import (
	"context"
	"fmt"
	"os"

	authlete "github.com/authlete/openapi-for-go"
)

func main() {
	baseURL := os.Getenv("AUTHLETE_BASE_URL")
	apiKey := os.Getenv("AUTHLETE_SERVICE_APIKEY")
	apiSecret := os.Getenv("AUTHLETE_SERVICE_APISECRET")
	apiToken := os.Getenv("AUTHLETE_SERVICEOWNER_ACCESSTOKEN")
	apiVersion := os.Getenv("AUTHLETE_API_VERSION")

	apiClient, err := createSimpleClient(baseURL, apiVersion)
	if err != nil {
		fmt.Printf("Error creating Authlete client: %v\n", err)
		os.Exit(1)
	}

	ctx, err := createAPIContext(apiKey, apiSecret, apiToken, apiVersion)

	if err != nil {
		fmt.Printf("Error creating API context: %v\n", err)
		os.Exit(1)
	}

	resp, httpResp, err := apiClient.ClientManagementApi.ClientGetListApi(ctx).Execute()
	if err != nil {
		fmt.Printf("Error calling ClientGetListApi: %v\n", err)
		if httpResp != nil {
			fmt.Printf("HTTP Status: %s\n", httpResp.Status)
		}
		os.Exit(1)
	}

	for _, client := range resp.Clients {
		fmt.Printf("Client ID: %d, Client Name: %s\n", client.ClientId, *client.ClientName)
	}
}

// createAuthleteClient creates and returns an Authlete API client
func createSimpleClient(baseURL string, apiVersion string) (*authlete.APIClient, error) {

	if apiVersion == "V3" {
		return nil, fmt.Errorf("currently openapi-for-go doesn't support V3 API")
	}

	return createV2Client(baseURL)
}

func createV2Client(baseURL string) (*authlete.APIClient, error) {
	//Client for v2.x API
	cnf := authlete.NewConfiguration()
	cnf.Servers = authlete.ServerConfigurations{
		{URL: baseURL},
	}
	return authlete.NewAPIClient(cnf), nil
}

func createAPIContext(apiKey string, apiSecret string, apiToken string, apiVersion string) (context.Context, error) {
	if apiVersion == "V3" {
		return nil, fmt.Errorf("currently openapi-for-go doesn't support V3 API")
	}
	return context.WithValue(context.Background(), authlete.ContextBasicAuth, authlete.BasicAuth{
		UserName: apiKey,
		Password: apiSecret,
	}), nil
}
