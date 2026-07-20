require 'cgi'
require 'minitest/autorun'
require 'securerandom'
require 'uri'

require 'authlete'

class AuthorizationCodeFlowTest < Minitest::Test
  REDIRECT_URI = 'https://sdk-playground.example.com/callback'
  SUBJECT = 'sdk-playground-user'

  def test_authorization_code_flow
    skip_unless_authlete_configured!

    api = Authlete::Api.new(
      host: ENV.fetch('AUTHLETE_BASE_URL', 'https://api.authlete.com'),
      service_api_key: ENV.fetch('AUTHLETE_SERVICE_APIKEY'),
      service_api_secret: ENV.fetch('AUTHLETE_SERVICE_APISECRET')
    )

    client = nil

    begin
      client_name = "sdk-playground-smoke-#{random_alnum(12)}"
      state = random_alnum(24)

      puts "[smoke] Step 1: creating client #{client_name}"
      client = api.client_create(
        Authlete::Model::Client.new(
          clientName: client_name,
          clientType: 'CONFIDENTIAL',
          grantTypes: ['AUTHORIZATION_CODE'],
          responseTypes: ['CODE'],
          redirectUris: [REDIRECT_URI]
        )
      )

      client_id = read_field(client, :client_id, :clientId)
      client_secret = read_field(client, :client_secret, :clientSecret)
      refute_nil client_id
      refute_equal 0, client_id.to_i
      refute_empty client_secret.to_s
      puts "[smoke] Step 1 result: clientId=#{client_id}"

      authorization_parameters = [
        'response_type=code',
        "client_id=#{CGI.escape(client_id.to_s)}",
        "redirect_uri=#{CGI.escape(REDIRECT_URI)}",
        "state=#{CGI.escape(state)}"
      ].join('&')

      puts '[smoke] Step 2: calling /auth/authorization'
      authorization_response = api.authorization(parameters: authorization_parameters)
      assert_equal 'INTERACTION', read_field(authorization_response, :action)

      ticket = read_field(authorization_response, :ticket)
      refute_empty ticket.to_s
      puts '[smoke] Step 2 result: action=INTERACTION, ticket issued'

      puts '[smoke] Step 3: calling /auth/authorization/issue'
      issue_response = api.authorization_issue(ticket: ticket, subject: SUBJECT)
      assert_equal 'LOCATION', read_field(issue_response, :action)

      redirect_location = read_field(issue_response, :response_content, :responseContent)
      assert_includes redirect_location, 'code='
      assert_includes redirect_location, "state=#{state}"
      puts '[smoke] Step 3 result: action=LOCATION, authorization code issued'

      authorization_code = extract_query_parameter(redirect_location, 'code')
      refute_empty authorization_code.to_s
      puts '[smoke] Extracted authorization code'

      token_parameters = [
        'grant_type=authorization_code',
        "code=#{CGI.escape(authorization_code)}",
        "redirect_uri=#{CGI.escape(REDIRECT_URI)}"
      ].join('&')

      puts '[smoke] Step 4: calling /auth/token'
      token_response = api.token(
        parameters: token_parameters,
        clientId: client_id.to_s,
        clientSecret: client_secret
      )
      assert_equal 'OK', read_field(token_response, :action)

      access_token = read_field(token_response, :access_token, :accessToken)
      refute_empty access_token.to_s
      puts "[smoke] Step 4 result: accessTokenLength=#{access_token.length}"

      puts '[smoke] Step 5: calling /auth/introspection'
      introspection_response = api.introspection(token: access_token)
      assert_equal 'OK', read_field(introspection_response, :action)
      assert_equal true, read_field(introspection_response, :usable),
                   'introspected access token must be usable'
      assert_equal SUBJECT, read_field(introspection_response, :subject),
                   'access token must be bound to the test subject'
      puts "[smoke] Step 5 result: subject=#{read_field(introspection_response, :subject).inspect}"
    ensure
      flow_error = $! # exception currently propagating out of the begin block, if any
      if client
        client_id = read_field(client, :client_id, :clientId)

        unless client_id.to_i.zero?
          puts "[smoke] Cleanup: deleting clientId=#{client_id}"
          begin
            api.client_delete(client_id)
            puts '[smoke] Cleanup result: client deleted'
          rescue StandardError => e
            # Fail the test when cleanup breaks, but never mask an earlier failure.
            raise if flow_error.nil?
            puts "[smoke] WARNING: failed to delete test client: #{e.message}"
          end
        end
      end
    end
  end

  private

  def skip_unless_authlete_configured!
    base_url = ENV['AUTHLETE_BASE_URL'].to_s.strip
    api_key = ENV['AUTHLETE_SERVICE_APIKEY'].to_s.strip
    api_secret = ENV['AUTHLETE_SERVICE_APISECRET'].to_s.strip
    api_version = ENV['AUTHLETE_API_VERSION'].to_s.strip

    if base_url.empty? || api_key.empty? || api_secret.empty?
      skip 'Skipping Authlete smoke test because required environment variables are not set'
    end

    skip 'Skipping Authlete smoke test because authlete gem is V2-only' if %w[3 V3].include?(api_version.upcase)
  end

  def random_alnum(length)
    alphabet = 'abcdefghijklmnopqrstuvwxyz0123456789'
    Array.new(length) { alphabet[SecureRandom.random_number(alphabet.length)] }.join
  end

  def read_field(object, *names)
    names.each do |name|
      return object.public_send(name) if object.respond_to?(name)
    end

    names.each do |name|
      ivar = :"@#{name}"
      return object.instance_variable_get(ivar) if object.instance_variable_defined?(ivar)
    end

    nil
  end

  def extract_query_parameter(url, name)
    uri = URI.parse(url)
    query = uri.query.to_s
    pairs = URI.decode_www_form(query)
    pairs.each do |key, value|
      return value if key == name
    end

    nil
  end
end
