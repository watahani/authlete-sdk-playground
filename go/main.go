package main

import (
	"context"
	"encoding/base64"
	"fmt"
	"os"

	authlete "github.com/authlete/openapi-for-go"
)

// createAuthleteClient creates and returns an Authlete API client
func createSimpleClient() (*authlete.APIClient, error) {
	baseURL := os.Getenv("AUTHLETE_BASE_URL")
	apiKey := os.Getenv("AUTHLETE_SERVICE_APIKEY")
	apiSecret := os.Getenv("AUTHLETE_SERVICE_APISECRET")
	// apiToken  := os.Getenv("AUTHLETE_SERVICEOWNER_ACCESSTOKEN")
	apiVersion := os.Getenv("AUTHLETE_API_VERSION")

	if apiVersion == "V3" {
		return nil, fmt.Errorf("currently openapi-for-go doesn't support V3 API")
	}

	//Client for v2.x API
	cnf := authlete.NewConfiguration()
	cnf.Servers = authlete.ServerConfigurations{
		{URL: baseURL},
	}

	cred := fmt.Sprintf("%s:%s", apiKey, apiSecret)
	basicCred := "Basic " + base64.StdEncoding.EncodeToString([]byte(cred))

	cnf.DefaultHeader = map[string]string{
		"Authorization": basicCred,
	}

	return authlete.NewAPIClient(cnf), nil
}

func main() {
	apiClient, err := createSimpleClient()
	if err != nil {
		fmt.Printf("Error creating Authlete client: %v\n", err)
		os.Exit(1)
	}

	ctx := context.Background()

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
