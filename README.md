# Authlete SDK Playground

This project provides an easy-to-set-up development environment for testing the Authlete SDK in various programming languages.
Each language folder contains a simple console application, and the corresponding devcontainer configuration is located in the .devcontainer/{lang} directory.
By using Visual Studio Code Dev Containers or GitHub Codespaces, you can launch a fully configured development environment with minimal setup.

## Supported Languages

The following languages are currently implemented:

- ✅ Java  
- 🚧 C# (Coming Soon)  
- 🚧 Go (Coming Soon)  
- 🚧 JavaScript (Coming Soon)  
- 🚧 Python (Coming Soon)  
- 🚧 Ruby (Coming Soon)  
- 🚧 TypeScript (Coming Soon)

## Prerequisites

- [Visual Studio Code](https://code.visualstudio.com/)
- [Dev Containers Extension](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-containers)
- [Docker](https://www.docker.com/products/docker-desktop)

Or:

- A GitHub account (if using GitHub Codespaces)

## Getting Started

### Using Visual Studio Code Dev Containers

1. Clone this repository:
   ```bash
   git clone https://github.com/your-organization/authlete-sdk-executor.git
   cd authlete-sdk-executor
   ```

2. Set up Authlete credentials:
   - Edit `.env.local` to add your Authlete credentials:
     ```
     AUTHLETE_BASE_URL=https://api.authlete.com
     AUTHLETE_SERVICE_APIKEY=your-api-key
     AUTHLETE_SERVICE_APISECRET=your-api-secret
     ```

     For v3:

     ```
     AUTHLETE_BASE_URL=https://us.authlete.com
     AUTHLETE_SERVICE_APIKEY=your-api-key
     AUTHLETE_SERVICEOWNER_ACCESSTOKEN=your-api-token
     AUTHLETE_API_VERSION=3
     ```

3. Open the project in Visual Studio Code:
   ```bash
   code .
   ```

4. Choose the language you want to work with (e.g., Java):
   - Open the Command Palette (F1 or Ctrl+Shift+P)
   - Select "Dev Containers: Reopen in Container"
   - Choose the specific language container (e.g., "Java")

5. The container will be built and launched, providing a configured environment for the selected language.

6. Open the entry point file for the language (e.g., `src/main/java/com/authlete/sdklab/App.java`) and press F5 to run it.

### Using GitHub Codespaces

1. Navigate to the GitHub repository in your browser.

2. Click the “Code” button and select “Open with Codespaces.”

3. Create a new Codespace.

4. Set Authlete credentials as GitHub Codespaces secrets:
   - Go to the repository settings
   - Navigate to “Secrets > Codespaces”
   - Add the following secrets:
     - `AUTHLETE_BASE_URL`
     - `AUTHLETE_SERVICE_APIKEY`
     - `AUTHLETE_SERVICE_APISECRET`

5. The Codespace will launch with the environment variables properly configured.

## Running the Sample Application

Open the entry point file for the language (e.g., `src/main/java/com/authlete/sdklab/App.java`) and press F5 to run it.

## Environment Variables

The SDK uses the following environment variables:

| Variable | Description | Required |
|----------|-------------|----------|
| AUTHLETE_BASE_URL | Base URL of the Authlete API | Yes |
| AUTHLETE_SERVICE_APIKEY | API key of the Authlete service | Yes |
| AUTHLETE_SERVICE_APISECRET | API secret of the Authlete service | Yes (v2) |
| AUTHLETE_SERVICEOWNER_APIKEY | API key of the Authlete service owner | No |
| AUTHLETE_SERVICEOWNER_APISECRET | API secret of the Authlete service owner | No |
| AUTHLETE_SERVICEOWNER_ACCESSTOKEN | Access token of the Authlete service owner | Yes (v3) |
| AUTHLETE_SERVICE_ACCESSTOKEN | Access token of the Authlete service | No |
| AUTHLETE_DPOP_KEY | DPoP key | No |
| AUTHLETE_CLIENT_CERTIFICATE | Client certificate | No |
| AUTHLETE_API_VERSION | Authlete API version | No |

## Customizing the Environment

Each language environment can be customized by modifying the corresponding files:

- `.devcontainer/{lang}/devcontainer.json`: Dev Container settings  
- `.devcontainer/{lang}/docker-compose.yml` (if applicable): Docker Compose settings  
- `{lang}/Dockerfile` (if applicable): Docker image settings

## Contribution

Contributions are welcome to add support for additional languages or improve existing implementations!

## License

MIT
