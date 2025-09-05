# PHP Sample (Authlete SDK)

This is a simple console app scaffold that runs inside a Dev Container and uses the Authlete PHP SDK from Packagist.
Configuration is loaded from environment variables via `AuthleteEnvConfiguration`.

## How to run

1. Ensure `.env.local` at repo root is filled with your Authlete credentials (see repository README).
2. Reopen in the "PHP" Dev Container:
   - VS Code Command Palette > "Dev Containers: Reopen in Container" > PHP
3. In the container terminal (inside Dev Container):
    ```bash
    composer install
    php src/main.php
    ```

If SDK is installed and Service credentials are set, it lists client names via the Authlete API.

## Package Info

- Packagist: https://packagist.org/packages/authlete/authlete
- Source: https://github.com/authlete/authlete-php
- API Reference (SDK): https://authlete.github.io/authlete-php/
- API Reference (Authlete): https://docs.authlete.com/

## Required environment variables

Set these in `.env.local` (root) or your container environment:
- `AUTHLETE_BASE_URL` (e.g., https://api.authlete.com or your regional host)
- `AUTHLETE_SERVICE_APIKEY`
- `AUTHLETE_SERVICE_APISECRET`

## Notes

- Xdebug is enabled for step debugging (port 9003). If you run PHP/Composer on your host instead of inside the container, your host PHP may try to load an invalid Xdebug path and print errors like "Failed loading /usr/local/lib/php/extensions/no-debug-non-zts-...". Prefer running inside the Dev Container, or fix your host's `xdebug.ini` so it does not hardcode `zend_extension` to a non-existent path (check `php --ini`).
- The container runs as a non-root `vscode` user.
- Authlete PHP SDK does not support grant_type "TOKEN_EXCHANGE", "JWT_BEARER". if the client support those grant types, the exception will be thrown when calling the API.