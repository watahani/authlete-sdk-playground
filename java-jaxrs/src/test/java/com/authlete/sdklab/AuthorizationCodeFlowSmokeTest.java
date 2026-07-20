package com.authlete.sdklab;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.net.URI;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.security.SecureRandom;
import java.util.LinkedHashMap;
import java.util.Map;

import org.junit.jupiter.api.Assumptions;
import org.junit.jupiter.api.Test;

import com.authlete.common.api.AuthleteApi;
import com.authlete.common.api.AuthleteApiFactory;
import com.authlete.common.conf.AuthleteSimpleConfiguration;
import com.authlete.common.dto.AuthorizationIssueRequest;
import com.authlete.common.dto.AuthorizationIssueResponse;
import com.authlete.common.dto.AuthorizationRequest;
import com.authlete.common.dto.AuthorizationResponse;
import com.authlete.common.dto.Client;
import com.authlete.common.dto.IntrospectionRequest;
import com.authlete.common.dto.IntrospectionResponse;
import com.authlete.common.dto.TokenRequest;
import com.authlete.common.dto.TokenResponse;
import com.authlete.common.types.ClientType;
import com.authlete.common.types.GrantType;
import com.authlete.common.types.ResponseType;

/**
 * Smoke test that runs a minimal OAuth 2.0 authorization code flow:
 * create client -> /auth/authorization -> /auth/authorization/issue ->
 * /auth/token -> /auth/introspection -> delete client.
 *
 * The V2 flow uses AUTHLETE_V2_BASE_URL / AUTHLETE_V2_SERVICE_APIKEY /
 * AUTHLETE_V2_SERVICE_APISECRET, and the V3 flow uses AUTHLETE_V3_BASE_URL /
 * AUTHLETE_V3_SERVICE_APIKEY / AUTHLETE_V3_SERVICE_ACCESSTOKEN. When the
 * version-specific variables are not set, each flow falls back to the plain
 * AUTHLETE_* variables if AUTHLETE_API_VERSION matches. A flow whose
 * credentials are missing is skipped.
 */
public class AuthorizationCodeFlowSmokeTest {
    private static final String REDIRECT_URI = "https://sdk-playground.example.com/callback";
    private static final String SUBJECT = "sdk-playground-user";
    private static final SecureRandom RANDOM = new SecureRandom();

    @Test
    void authorizationCodeFlowV2() {
        String baseUrl = envOrFallback("AUTHLETE_V2_BASE_URL", "AUTHLETE_BASE_URL", !isV3Env());
        String apiKey = envOrFallback("AUTHLETE_V2_SERVICE_APIKEY", "AUTHLETE_SERVICE_APIKEY", !isV3Env());
        String apiSecret = envOrFallback("AUTHLETE_V2_SERVICE_APISECRET", "AUTHLETE_SERVICE_APISECRET", !isV3Env());

        Assumptions.assumeTrue(!baseUrl.isBlank() && !apiKey.isBlank() && !apiSecret.isBlank(),
                "Skipping V2 smoke test: AUTHLETE_V2_BASE_URL, AUTHLETE_V2_SERVICE_APIKEY and"
                        + " AUTHLETE_V2_SERVICE_APISECRET (or plain AUTHLETE_* V2 credentials) are not set");

        AuthleteApi api = AuthleteApiFactory.create(new AuthleteSimpleConfiguration()
                .setApiVersion("V2")
                .setBaseUrl(baseUrl)
                .setServiceApiKey(apiKey)
                .setServiceApiSecret(apiSecret));
        assertNotNull(api, "Failed to create an AuthleteApi instance for V2");

        runAuthorizationCodeFlow("V2", api);
    }

    @Test
    void authorizationCodeFlowV3() {
        String baseUrl = envOrFallback("AUTHLETE_V3_BASE_URL", "AUTHLETE_BASE_URL", isV3Env());
        String apiKey = envOrFallback("AUTHLETE_V3_SERVICE_APIKEY", "AUTHLETE_SERVICE_APIKEY", isV3Env());
        String accessToken = envOrFallback("AUTHLETE_V3_SERVICE_ACCESSTOKEN", "AUTHLETE_SERVICE_ACCESSTOKEN", isV3Env());

        Assumptions.assumeTrue(!baseUrl.isBlank() && !apiKey.isBlank() && !accessToken.isBlank(),
                "Skipping V3 smoke test: AUTHLETE_V3_BASE_URL, AUTHLETE_V3_SERVICE_APIKEY and"
                        + " AUTHLETE_V3_SERVICE_ACCESSTOKEN (or plain AUTHLETE_* V3 credentials) are not set");

        AuthleteApi api = AuthleteApiFactory.create(new AuthleteSimpleConfiguration()
                .setApiVersion("V3")
                .setBaseUrl(baseUrl)
                .setServiceApiKey(apiKey)
                .setServiceAccessToken(accessToken));
        assertNotNull(api, "Failed to create an AuthleteApi instance for V3");

        runAuthorizationCodeFlow("V3", api);
    }

    private static void runAuthorizationCodeFlow(String label, AuthleteApi api) {
        Client createdClient = null;
        Throwable failure = null;

        try {
            String clientName = "sdk-playground-smoke-" + randomAlnum(12);
            String state = randomAlnum(24);

            System.out.println("[smoke:" + label + "] Step 1: Creating a confidential authorization-code client: " + clientName);
            Client clientRequest = new Client()
                    .setClientName(clientName)
                    .setClientType(ClientType.CONFIDENTIAL)
                    .setGrantTypes(new GrantType[] { GrantType.AUTHORIZATION_CODE })
                    .setResponseTypes(new ResponseType[] { ResponseType.CODE })
                    .setRedirectUris(new String[] { REDIRECT_URI });
            createdClient = api.createClient(clientRequest);
            assertNotNull(createdClient, "Created client must not be null");
            assertTrue(createdClient.getClientId() > 0, "Created client ID must be positive");
            assertNotNull(createdClient.getClientSecret(), "Created client secret must not be null");
            assertFalse(createdClient.getClientSecret().isBlank(), "Created client secret must not be blank");
            System.out.println("[smoke:" + label + "] Step 1 result: clientId=" + createdClient.getClientId());

            System.out.println("[smoke:" + label + "] Step 2: Calling /auth/authorization");
            String authorizationParameters = "response_type=code"
                    + "&client_id=" + createdClient.getClientId()
                    + "&redirect_uri=" + encode(REDIRECT_URI)
                    + "&state=" + encode(state);
            AuthorizationRequest authorizationRequest = new AuthorizationRequest()
                    .setParameters(authorizationParameters);
            AuthorizationResponse authorizationResponse = api.authorization(authorizationRequest);
            assertEquals(AuthorizationResponse.Action.INTERACTION, authorizationResponse.getAction(),
                    "Authorization action must be INTERACTION");
            assertNotNull(authorizationResponse.getTicket(), "Authorization ticket must not be null");
            System.out.println("[smoke:" + label + "] Step 2 result: action=" + authorizationResponse.getAction());

            System.out.println("[smoke:" + label + "] Step 3: Issuing authorization response");
            AuthorizationIssueRequest issueRequest = new AuthorizationIssueRequest()
                    .setTicket(authorizationResponse.getTicket())
                    .setSubject(SUBJECT);
            AuthorizationIssueResponse issueResponse = api.authorizationIssue(issueRequest);
            assertEquals(AuthorizationIssueResponse.Action.LOCATION, issueResponse.getAction(),
                    "Authorization issue action must be LOCATION");
            assertNotNull(issueResponse.getResponseContent(), "Authorization issue response content must not be null");
            assertTrue(issueResponse.getResponseContent().contains("code="),
                    "Redirect URL must contain an authorization code");
            assertTrue(issueResponse.getResponseContent().contains("state=" + state),
                    "Redirect URL must contain the original state");
            System.out.println("[smoke:" + label + "] Step 3 result: action=" + issueResponse.getAction());

            String authorizationCode = extractQueryParameter(issueResponse.getResponseContent(), "code");
            assertNotNull(authorizationCode, "Authorization code must be present in the redirect URL");
            assertFalse(authorizationCode.isBlank(), "Authorization code must not be blank");

            System.out.println("[smoke:" + label + "] Step 4: Exchanging authorization code for tokens");
            String tokenParameters = "grant_type=authorization_code"
                    + "&code=" + encode(authorizationCode)
                    + "&redirect_uri=" + encode(REDIRECT_URI);
            TokenRequest tokenRequest = new TokenRequest()
                    .setParameters(tokenParameters)
                    .setClientId(String.valueOf(createdClient.getClientId()))
                    .setClientSecret(createdClient.getClientSecret());
            TokenResponse tokenResponse = api.token(tokenRequest);
            assertEquals(TokenResponse.Action.OK, tokenResponse.getAction(), "Token action must be OK");
            assertNotNull(tokenResponse.getAccessToken(), "Access token must not be null");
            assertFalse(tokenResponse.getAccessToken().isBlank(), "Access token must not be blank");
            System.out.println("[smoke:" + label + "] Step 4 result: action=" + tokenResponse.getAction());

            System.out.println("[smoke:" + label + "] Step 5: Introspecting the access token");
            IntrospectionRequest introspectionRequest = new IntrospectionRequest()
                    .setToken(tokenResponse.getAccessToken());
            IntrospectionResponse introspectionResponse = api.introspection(introspectionRequest);
            assertEquals(IntrospectionResponse.Action.OK, introspectionResponse.getAction(),
                    "Introspection action must be OK");
            assertTrue(introspectionResponse.isUsable(), "Introspected access token must be usable");
            assertEquals(SUBJECT, introspectionResponse.getSubject(),
                    "Introspected access token must be bound to the test subject");
            System.out.println("[smoke:" + label + "] Step 5 result: action=" + introspectionResponse.getAction()
                    + ", subject=" + introspectionResponse.getSubject());
        } catch (Throwable t) {
            failure = t;
        } finally {
            // Delete the client without masking the original failure. A cleanup
            // failure is reported as suppressed (or as the failure itself when
            // the flow succeeded).
            if (createdClient != null && createdClient.getClientId() > 0) {
                System.out.println("[smoke:" + label + "] Cleanup: deleting clientId=" + createdClient.getClientId());
                try {
                    api.deleteClient(createdClient.getClientId());
                    System.out.println("[smoke:" + label + "] Cleanup result: client deleted");
                } catch (RuntimeException e) {
                    if (failure != null) {
                        failure.addSuppressed(e);
                    } else {
                        failure = e;
                    }
                }
            }
        }

        if (failure instanceof RuntimeException) {
            throw (RuntimeException) failure;
        }
        if (failure instanceof Error) {
            throw (Error) failure;
        }
        if (failure != null) {
            throw new RuntimeException(failure);
        }
    }

    /**
     * Returns the value of {@code primaryName}. When it is not set and
     * {@code fallbackAllowed} is true, returns the value of
     * {@code fallbackName} instead.
     */
    private static String envOrFallback(String primaryName, String fallbackName, boolean fallbackAllowed) {
        String primary = env(primaryName);

        if (!primary.isBlank() || !fallbackAllowed) {
            return primary;
        }

        return env(fallbackName);
    }

    private static boolean isV3Env() {
        String version = env("AUTHLETE_API_VERSION");
        return version.equalsIgnoreCase("3") || version.equalsIgnoreCase("V3");
    }

    private static String env(String name) {
        String value = System.getenv(name);
        return value == null ? "" : value.trim();
    }

    private static String randomAlnum(int length) {
        final String alphabet = "abcdefghijklmnopqrstuvwxyz0123456789";
        StringBuilder builder = new StringBuilder(length);

        for (int i = 0; i < length; i++) {
            builder.append(alphabet.charAt(RANDOM.nextInt(alphabet.length())));
        }

        return builder.toString();
    }

    private static String encode(String value) {
        return java.net.URLEncoder.encode(value, StandardCharsets.UTF_8);
    }

    private static String extractQueryParameter(String url, String name) {
        URI uri = URI.create(url);
        Map<String, String> queryParameters = parseQuery(uri.getRawQuery());
        return queryParameters.get(name);
    }

    private static Map<String, String> parseQuery(String query) {
        Map<String, String> parameters = new LinkedHashMap<>();

        if (query == null || query.isBlank()) {
            return parameters;
        }

        for (String pair : query.split("&")) {
            String[] elements = pair.split("=", 2);
            String key = decode(elements[0]);
            String value = elements.length > 1 ? decode(elements[1]) : "";
            parameters.put(key, value);
        }

        return parameters;
    }

    private static String decode(String value) {
        return URLDecoder.decode(value, StandardCharsets.UTF_8);
    }
}
