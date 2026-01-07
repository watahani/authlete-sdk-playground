# TypeScript Console App

This sample uses the [Authlete TypeScript SDK](https://github.com/authlete/authlete-typescript-sdk) inside a Dev Container.
It mirrors the workflow described in the repository root `README.md`: configure `.env.local`, choose the *TypeScript* Dev Container configuration, and hit F5 (or run `npm run dev`) to execute the sample.

> `.devcontainer/docker-compose-common.yml` automatically loads the repository root `.env.local` file.
> Define every variable there (or in GitHub Codespaces Environment Variables) so all language samples share the same credentials.

> **Note:** This TypeScript sample targets the Authlete API v3 and requires both a service API key (`AUTHLETE_SERVICE_APIKEY`) and a bearer/service access token (`AUTHLETE_SERVICE_ACCESSTOKEN`). v2 API credentials are not supported here.

## Preparing environment variables

1. Open the repository root `.env.local` (shared by every sample) or define environment variables in GitHub Codespaces.
2. Provide the required values:
   - `AUTHLETE_BASE_URL` – e.g. `https://us.authlete.com`
   - `AUTHLETE_SERVICE_APIKEY` – service identifier used by the sample requests.
   - `AUTHLETE_SERVICE_ACCESSTOKEN` – a service-scoped access token.

## Running the sample

```bash
# Install dependencies (already done inside the Dev Container image cache)
npm install

# Run directly from TypeScript sources
npm run dev

# Or build + run from the compiled JavaScript output
npm run build
npm start
```

The script lists the clients under the configured service (using `authlete.client.list`) to verify that the provided API key + access token combination is working correctly.
