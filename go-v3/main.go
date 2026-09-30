package main

import (
	"context"
	"fmt"
	"os"

	authlete "github.com/authlete/authlete-go-sdk"
)

func main() {
	baseURL := os.Getenv("AUTHLETE_BASE_URL")
	serviceID := os.Getenv("AUTHLETE_SERVICE_APIKEY")
	accessToken := os.Getenv("AUTHLETE_SERVICE_ACCESSTOKEN")

	if baseURL == "" || serviceID == "" || accessToken == "" {
		fmt.Println("AUTHLETE_BASE_URL, AUTHLETE_SERVICE_APIKEY and AUTHLETE_SERVICE_ACCESSTOKEN are required")
		os.Exit(1)
	}

	sdk := createClient(baseURL, accessToken)

	resp, err := sdk.Client.List(context.Background(), serviceID, nil, nil, nil)
	if err != nil {
		fmt.Printf("Error calling Client.List: %v\n", err)
		os.Exit(1)
	}

	if resp.ClientGetListResponse == nil {
		fmt.Println("No clients returned")
		return
	}

	for _, client := range resp.ClientGetListResponse.GetClients() {
		clientID, clientName := int64(0), ""
		if id := client.GetClientID(); id != nil {
			clientID = *id
		}
		if name := client.GetClientName(); name != nil {
			clientName = *name
		}
		fmt.Printf("Client ID: %d, Client Name: %s\n", clientID, clientName)
	}
}

// createClient creates and returns an Authlete V3 API client.
// In V3 the service ID is passed to each API call, and requests are
// authenticated with a service (or organization) access token.
func createClient(baseURL string, accessToken string) *authlete.Authlete {
	return authlete.New(
		authlete.WithServerURL(baseURL),
		authlete.WithSecurity(accessToken),
	)
}
