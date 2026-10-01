# Go Console App (v3)

This sample uses the Authlete Go SDK for the Authlete 3.0 (V3) API:

- [authlete-go-sdk](https://github.com/authlete/authlete-go-sdk)

For the Authlete 2.x (V2) API, see the [Go (v2) sample](../go), which uses `openapi-for-go`.

## Run

```bash
go run .      # lists the clients of the service
go test -v ./...  # OAuth 2.0 authorization code flow smoke test
```

`go run .` reads `AUTHLETE_BASE_URL`, `AUTHLETE_SERVICE_APIKEY` (the service ID) and
`AUTHLETE_SERVICE_ACCESSTOKEN`. The smoke test prefers `AUTHLETE_V3_BASE_URL`,
`AUTHLETE_V3_SERVICE_APIKEY` and `AUTHLETE_V3_SERVICE_ACCESSTOKEN`, and falls back to the
plain `AUTHLETE_*` variables when `AUTHLETE_API_VERSION` is `3` or `V3`. The test is skipped
when the credentials are not set.
