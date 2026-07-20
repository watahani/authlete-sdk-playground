require 'bundler/setup'
require 'authlete_ruby_sdk'
require 'cgi'
require 'minitest/autorun'
require 'securerandom'
require 'uri'

# Smoke test that runs a minimal OAuth 2.0 authorization code flow against
# the Authlete V3 API: create client -> /auth/authorization ->
# /auth/authorization/issue -> /auth/token -> /auth/introspection -> delete client.
class AuthorizationCodeFlowTest < Minitest::Test
  Components = Authlete::Models::Components

  REDIRECT_URI = 'https://sdk-playground.example.com/callback'
  SUBJECT = 'sdk-playground-user'

  def test_authorization_code_flow
    # Prefer the version-specific variables; fall back to the plain ones.
    base_url = env_or_fallback('AUTHLETE_V3_BASE_URL', 'AUTHLETE_BASE_URL')
    service_id = env_or_fallback('AUTHLETE_V3_SERVICE_APIKEY', 'AUTHLETE_SERVICE_APIKEY')
    access_token = env_or_fallback('AUTHLETE_V3_SERVICE_ACCESSTOKEN', 'AUTHLETE_SERVICE_ACCESSTOKEN')

    if [base_url, service_id, access_token].any? { |value| value.to_s.empty? }
      skip('AUTHLETE_V3_BASE_URL, AUTHLETE_V3_SERVICE_APIKEY and AUTHLETE_V3_SERVICE_ACCESSTOKEN ' \
           '(or plain AUTHLETE_* V3 credentials) are required')
    end

    sdk = Authlete::Client.new(bearer: access_token, server_url: base_url)

    client_name = "sdk-playground-smoke-#{SecureRandom.alphanumeric(8).downcase}"
    state = SecureRandom.alphanumeric(16)
    created = nil

    begin
      puts "[1/6] Creating test client: #{client_name}"
      created = sdk.clients.create(
        service_id: service_id,
        client: Components::ClientInput.new(
          client_name: client_name,
          client_type: Components::ClientType::CONFIDENTIAL,
          grant_types: [Components::GrantType::AUTHORIZATION_CODE],
          response_types: [Components::ResponseType::CODE],
          redirect_uris: [REDIRECT_URI]
        )
      ).client
      refute_nil created, '/client/create returned no client'
      refute_nil created.client_id, 'created client has no client_id'
      refute_nil created.client_secret, 'created client has no client_secret'
      puts "      client_id=#{created.client_id}"

      puts '[2/6] Calling /auth/authorization'
      authz = sdk.authorization.process_request(
        service_id: service_id,
        authorization_request: Components::AuthorizationRequest.new(
          parameters: query_string(
            'response_type' => 'code',
            'client_id' => created.client_id.to_s,
            'redirect_uri' => REDIRECT_URI,
            'state' => state
          )
        )
      ).authorization_response
      refute_nil authz, '/auth/authorization returned no response body'
      assert_equal Components::AuthorizationResponseAction::INTERACTION, authz.action
      refute_empty authz.ticket.to_s, 'authorization ticket must be present'
      puts '      action=INTERACTION ticket issued'

      puts '[3/6] Calling /auth/authorization/issue'
      issue = sdk.authorization.issue_response(
        service_id: service_id,
        authorization_issue_request: Components::AuthorizationIssueRequest.new(
          ticket: authz.ticket,
          subject: SUBJECT
        )
      ).authorization_issue_response
      refute_nil issue, '/auth/authorization/issue returned no response body'
      assert_equal Components::AuthorizationIssueResponseAction::LOCATION, issue.action
      assert_includes issue.response_content.to_s, 'code='
      assert_equal state, query_value(issue.response_content, 'state')
      code = query_value(issue.response_content, 'code')
      refute_empty code.to_s, 'authorization code must be present'
      puts '      action=LOCATION authorization code issued'

      puts '[4/6] Calling /auth/token'
      token = sdk.tokens.process_request(
        service_id: service_id,
        token_request: Components::TokenRequest.new(
          parameters: query_string(
            'grant_type' => 'authorization_code',
            'code' => code,
            'redirect_uri' => REDIRECT_URI
          ),
          client_id: created.client_id.to_s,
          client_secret: created.client_secret
        )
      ).token_response
      refute_nil token, '/auth/token returned no response body'
      assert_equal Components::TokenResponseAction::OK, token.action
      refute_empty token.access_token.to_s, 'access token must be present'
      puts '      action=OK access token issued'

      puts '[5/6] Calling /auth/introspection'
      introspection = sdk.introspection.process_request(
        service_id: service_id,
        introspection_request: Components::IntrospectionRequest.new(token: token.access_token)
      ).introspection_response
      refute_nil introspection, '/auth/introspection returned no response body'
      assert_equal Components::IntrospectionResponseAction::OK, introspection.action
      assert_equal true, introspection.usable, 'introspected access token must be usable'
      assert_equal SUBJECT, introspection.subject, 'access token must be bound to the test subject'
      puts '      action=OK access token is valid'
    ensure
      flow_error = $! # exception currently propagating out of the begin block, if any
      if created&.client_id
        puts "[6/6] Deleting test client: #{created.client_id}"
        begin
          sdk.clients.destroy(service_id: service_id, client_id: created.client_id.to_s)
        rescue StandardError => e
          # Fail the test when cleanup breaks, but never mask an earlier failure.
          raise if flow_error.nil?
          puts "      WARNING: failed to delete test client: #{e.message}"
        end
      end
    end
  end

  private

  def env_or_fallback(primary, fallback)
    value = ENV[primary].to_s
    value.empty? ? ENV[fallback].to_s : value
  end

  def query_string(params)
    params.map { |key, value| "#{key}=#{CGI.escape(value)}" }.join('&')
  end

  def query_value(url, key)
    CGI.parse(URI.parse(url.to_s).query.to_s).fetch(key, []).first
  end
end
