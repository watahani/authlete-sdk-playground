import assert from "node:assert/strict";
import test from "node:test";
import { randomBytes } from "node:crypto";
import { Authlete } from "@authlete/typescript-sdk";
import {
  type AuthorizationIssueResponse,
  type AuthorizationResponse,
  type Client,
  type IntrospectionResponse,
  type TokenResponse,
  AuthorizationIssueResponseAction,
  AuthorizationResponseAction,
  ClientType,
  GrantType,
  IntrospectionResponseAction,
  ResponseType,
  TokenResponseAction,
} from "@authlete/typescript-sdk/models";

const serviceId = process.env.AUTHLETE_SERVICE_APIKEY;
const bearer = process.env.AUTHLETE_SERVICE_ACCESSTOKEN;
const serverURL = process.env.AUTHLETE_BASE_URL;

const missingEnvVars = [
  ["AUTHLETE_BASE_URL", serverURL],
  ["AUTHLETE_SERVICE_APIKEY", serviceId],
  ["AUTHLETE_SERVICE_ACCESSTOKEN", bearer],
].filter(([, value]) => !value).map(([name]) => name);

function randomSuffix(length = 8): string {
  return randomBytes(length).toString("hex").slice(0, length);
}

function requireEnv(value: string | undefined, name: string): string {
  assert.ok(value, `${name} must be set when the test runs`);
  return value;
}

function logStep(message: string, details?: unknown): void {
  if (details === undefined) {
    console.log(`[auth-code-smoke] ${message}`);
    return;
  }

  console.log(`[auth-code-smoke] ${message}`, details);
}

function extractAuthorizationCode(issueResponse: AuthorizationIssueResponse, state: string): string {
  const responseContent = issueResponse.responseContent;
  assert.ok(responseContent, "authorization issue responseContent must not be empty");
  assert.match(responseContent, /code=/, "authorization issue responseContent must include code");
  assert.match(responseContent, new RegExp(`(?:[?&])state=${state}(?:[&#]|$)`), "authorization issue responseContent must include state");

  const location = new URL(responseContent);
  const code = location.searchParams.get("code");
  const returnedState = location.searchParams.get("state");

  assert.ok(code, "authorization code must be present in the redirect URI");
  assert.equal(returnedState, state, "state must round-trip");

  return code;
}

test("OAuth 2.0 authorization code flow smoke test", async (t) => {
  if (missingEnvVars.length > 0) {
    t.skip(`Missing Authlete env vars: ${missingEnvVars.join(", ")}`);
    return;
  }

  const authlete = new Authlete({
    bearer: requireEnv(bearer, "AUTHLETE_SERVICE_ACCESSTOKEN"),
    serverURL: requireEnv(serverURL, "AUTHLETE_BASE_URL"),
  });
  const resolvedServiceId = requireEnv(serviceId, "AUTHLETE_SERVICE_APIKEY");

  const clientName = `sdk-playground-smoke-${randomSuffix()}`;
  const redirectUri = "https://sdk-playground.example.com/callback";
  const state = `state-${randomSuffix(12)}`;

  let createdClient: Client | undefined;
  let flowError: unknown;

  try {
    logStep("Creating test client", { clientName });
    createdClient = await authlete.client.create({
      serviceId: resolvedServiceId,
      client: {
        clientName,
        clientType: ClientType.Confidential,
        grantTypes: [GrantType.AuthorizationCode],
        responseTypes: [ResponseType.Code],
        redirectUris: [redirectUri],
      },
    });

    assert.ok(createdClient.clientId, "created client must include clientId");
    assert.ok(createdClient.clientSecret, "created client must include clientSecret");

    const clientId = String(createdClient.clientId);
    const clientSecret = createdClient.clientSecret;

    logStep("Calling /auth/authorization", { clientId, redirectUri, state });
    const authorizationResponse: AuthorizationResponse = await authlete.authorization.processRequest({
      serviceId: resolvedServiceId,
      authorizationRequest: {
        parameters: `response_type=code&client_id=${encodeURIComponent(clientId)}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${encodeURIComponent(state)}`,
      },
    });

    assert.equal(
      authorizationResponse.action,
      AuthorizationResponseAction.Interaction,
      `expected authorization action ${AuthorizationResponseAction.Interaction}, got ${authorizationResponse.action}`,
    );
    assert.ok(authorizationResponse.ticket, "authorization response must include ticket");

    logStep("Calling /auth/authorization/issue");
    const authorizationIssueResponse: AuthorizationIssueResponse = await authlete.authorization.issue({
      serviceId: resolvedServiceId,
      authorizationIssueRequest: {
        ticket: authorizationResponse.ticket,
        subject: "sdk-playground-user",
      },
    });

    assert.equal(
      authorizationIssueResponse.action,
      AuthorizationIssueResponseAction.Location,
      `expected authorization issue action ${AuthorizationIssueResponseAction.Location}, got ${authorizationIssueResponse.action}`,
    );

    const code = extractAuthorizationCode(authorizationIssueResponse, state);
    logStep("Extracted authorization code", { codeLength: code.length });

    logStep("Calling /auth/token", { clientId });
    const tokenResponse: TokenResponse = await authlete.token.process({
      serviceId: resolvedServiceId,
      tokenRequest: {
        parameters: `grant_type=authorization_code&code=${encodeURIComponent(code)}&redirect_uri=${encodeURIComponent(redirectUri)}`,
        clientId,
        clientSecret,
      },
    });

    assert.equal(
      tokenResponse.action,
      TokenResponseAction.Ok,
      `expected token action ${TokenResponseAction.Ok}, got ${tokenResponse.action}`,
    );
    assert.ok(tokenResponse.accessToken, "token response must include accessToken");

    logStep("Calling /auth/introspection");
    const introspectionResponse: IntrospectionResponse = await authlete.introspection.process({
      serviceId: resolvedServiceId,
      introspectionRequest: {
        token: tokenResponse.accessToken,
      },
    });

    assert.equal(
      introspectionResponse.action,
      IntrospectionResponseAction.Ok,
      `expected introspection action ${IntrospectionResponseAction.Ok}, got ${introspectionResponse.action}`,
    );
    assert.equal(introspectionResponse.usable, true, "introspection response must mark the token as usable");
    assert.equal(introspectionResponse.subject, "sdk-playground-user", "introspection response must include the subject");
  } catch (error) {
    // Recorded instead of thrown so that cleanup always runs first.
    flowError = error;
  }

  if (createdClient?.clientId) {
    logStep("Deleting test client", { clientId: createdClient.clientId });
    try {
      await authlete.client.delete({
        serviceId: resolvedServiceId,
        clientId: String(createdClient.clientId),
      });
    } catch (error) {
      if (flowError === undefined) {
        flowError = error;
      } else {
        logStep("WARNING: failed to delete test client", error);
      }
    }
  }

  if (flowError !== undefined) {
    throw flowError;
  }
});
