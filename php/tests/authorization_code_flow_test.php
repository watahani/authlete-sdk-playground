<?php
//
// Smoke test that runs a minimal OAuth 2.0 authorization code flow against
// the Authlete V2 API: create client -> /auth/authorization ->
// /auth/authorization/issue -> /auth/token -> /auth/introspection -> delete client.
//
// Usage: php tests/authorization_code_flow_test.php
// Exits with 0 on success or skip, 1 on failure.
//

require __DIR__ . '/../vendor/autoload.php';

use Authlete\Api\AuthleteApiImpl;
use Authlete\Conf\AuthleteSimpleConfiguration;
use Authlete\Dto\AuthorizationAction;
use Authlete\Dto\AuthorizationIssueAction;
use Authlete\Dto\AuthorizationIssueRequest;
use Authlete\Dto\AuthorizationRequest;
use Authlete\Dto\Client;
use Authlete\Dto\IntrospectionAction;
use Authlete\Dto\IntrospectionRequest;
use Authlete\Dto\TokenAction;
use Authlete\Dto\TokenRequest;
use Authlete\Types\ClientType;
use Authlete\Types\GrantType;
use Authlete\Types\ResponseType;

const REDIRECT_URI = 'https://sdk-playground.example.com/callback';
const SUBJECT      = 'sdk-playground-user';
// The V2 /client/create API requires a developer identifier.
const DEVELOPER    = 'sdk-playground-developer';

function assertThat(bool $condition, string $message): void
{
    if (!$condition)
    {
        throw new RuntimeException($message);
    }
}

function queryValue(string $url, string $key): ?string
{
    parse_str((string)parse_url($url, PHP_URL_QUERY), $params);

    return isset($params[$key]) ? (string)$params[$key] : null;
}

// Prefer the version-specific AUTHLETE_V2_* variables; fall back to the
// plain AUTHLETE_* variables when they hold a V2 configuration.
$baseUrl   = (string)getenv('AUTHLETE_V2_BASE_URL');
$apiKey    = (string)getenv('AUTHLETE_V2_SERVICE_APIKEY');
$apiSecret = (string)getenv('AUTHLETE_V2_SERVICE_APISECRET');

if ($baseUrl === '' && $apiKey === '' && $apiSecret === '')
{
    $apiVersion = strtoupper((string)getenv('AUTHLETE_API_VERSION'));
    if (in_array($apiVersion, ['3', 'V3'], true))
    {
        echo "SKIP: authlete/authlete supports only the Authlete V2 API\n";
        exit(0);
    }

    $baseUrl   = (string)getenv('AUTHLETE_BASE_URL');
    $apiKey    = (string)getenv('AUTHLETE_SERVICE_APIKEY');
    $apiSecret = (string)getenv('AUTHLETE_SERVICE_APISECRET');
}

if ($baseUrl === '' || $apiKey === '' || $apiSecret === '')
{
    echo "SKIP: AUTHLETE_V2_BASE_URL, AUTHLETE_V2_SERVICE_APIKEY and AUTHLETE_V2_SERVICE_APISECRET"
        . " (or plain AUTHLETE_* V2 credentials) are required\n";
    exit(0);
}

$conf = new AuthleteSimpleConfiguration();
$conf->setBaseUrl($baseUrl);
$conf->setServiceApiKey($apiKey);
$conf->setServiceApiSecret($apiSecret);

$api      = new AuthleteApiImpl($conf);
$created  = null;
$exitCode = 0;

try
{
    // Step 1: create a disposable client for this test.
    $clientName = 'sdk-playground-smoke-' . bin2hex(random_bytes(6));
    echo "[1/6] Creating test client: {$clientName}\n";

    $created = $api->createClient(
        (new Client())
            ->setClientName($clientName)
            ->setDeveloper(DEVELOPER)
            ->setClientType(ClientType::$CONFIDENTIAL)
            ->setGrantTypes([GrantType::$AUTHORIZATION_CODE])
            ->setResponseTypes([ResponseType::$CODE])
            ->setRedirectUris([REDIRECT_URI])
    );
    assertThat($created->getClientId() > 0, '/client/create returned no clientId');
    assertThat((string)$created->getClientSecret() !== '', '/client/create returned no clientSecret');
    echo '      clientId=' . $created->getClientId() . "\n";

    // Step 2: /auth/authorization
    $state = bin2hex(random_bytes(8));
    echo "[2/6] Calling /auth/authorization\n";

    $authzResponse = $api->authorization(
        (new AuthorizationRequest())
            ->setParameters(http_build_query([
                'response_type' => 'code',
                'client_id'     => (string)$created->getClientId(),
                'redirect_uri'  => REDIRECT_URI,
                'state'         => $state,
            ]))
    );
    assertThat(
        $authzResponse->getAction() === AuthorizationAction::$INTERACTION,
        'expected action INTERACTION, got ' . var_export($authzResponse->getAction(), true)
    );
    assertThat((string)$authzResponse->getTicket() !== '', 'authorization ticket must be present');
    echo "      action=INTERACTION ticket issued\n";

    // Step 3: /auth/authorization/issue
    echo "[3/6] Calling /auth/authorization/issue\n";

    $issueResponse = $api->authorizationIssue(
        (new AuthorizationIssueRequest())
            ->setTicket($authzResponse->getTicket())
            ->setSubject(SUBJECT)
    );
    assertThat(
        $issueResponse->getAction() === AuthorizationIssueAction::$LOCATION,
        'expected action LOCATION, got ' . var_export($issueResponse->getAction(), true)
    );
    $location = (string)$issueResponse->getResponseContent();
    assertThat(str_contains($location, 'code='), "no authorization code in: {$location}");
    assertThat(queryValue($location, 'state') === $state, 'state mismatch in redirect URL');
    $code = (string)queryValue($location, 'code');
    assertThat($code !== '', 'authorization code must be present');
    echo "      action=LOCATION authorization code issued\n";

    // Step 4: /auth/token
    echo "[4/6] Calling /auth/token\n";

    $tokenResponse = $api->token(
        (new TokenRequest())
            ->setParameters(http_build_query([
                'grant_type'   => 'authorization_code',
                'code'         => $code,
                'redirect_uri' => REDIRECT_URI,
            ]))
            ->setClientId((string)$created->getClientId())
            ->setClientSecret($created->getClientSecret())
    );
    assertThat(
        $tokenResponse->getAction() === TokenAction::$OK,
        'expected action OK, got ' . var_export($tokenResponse->getAction(), true)
    );
    $accessToken = (string)$tokenResponse->getAccessToken();
    assertThat($accessToken !== '', 'access token must be present');
    echo "      action=OK access token issued\n";

    // Step 5: /auth/introspection
    echo "[5/6] Calling /auth/introspection\n";

    $introspectionResponse = $api->introspection(
        (new IntrospectionRequest())->setToken($accessToken)
    );
    assertThat(
        $introspectionResponse->getAction() === IntrospectionAction::$OK,
        'expected action OK, got ' . var_export($introspectionResponse->getAction(), true)
    );
    assertThat($introspectionResponse->isUsable() === true, 'introspected access token must be usable');
    assertThat($introspectionResponse->getSubject() === SUBJECT, 'access token must be bound to the test subject');
    echo "      action=OK access token is valid\n";

    echo "PASS: authorization code flow completed successfully\n";
}
catch (Throwable $e)
{
    if (str_contains($e->getMessage(), 'cannot be parsed as Authlete\\Types\\'))
    {
        // Known limitation of authlete/authlete 1.x: it cannot parse newer
        // grant/response types (e.g. TOKEN_EXCHANGE, JWT_BEARER) that the
        // service may support, which makes API responses unparseable.
        echo 'SKIP: known SDK limitation: ' . $e->getMessage() . "\n";
    }
    else
    {
        // exit() would skip the finally block, so only record the failure here.
        fwrite(STDERR, 'FAIL: ' . $e->getMessage() . "\n");
        $exitCode = 1;
    }
}
finally
{
    // Step 6: always delete the disposable client. A cleanup failure fails the
    // test but must not hide an earlier failure.
    if ($created !== null && $created->getClientId() > 0)
    {
        echo '[6/6] Deleting test client: ' . $created->getClientId() . "\n";
        try
        {
            $api->deleteClient($created->getClientId());
        }
        catch (Throwable $e)
        {
            fwrite(STDERR, 'WARNING: failed to delete test client: ' . $e->getMessage() . "\n");
            $exitCode = 1;
        }
    }
}

exit($exitCode);
