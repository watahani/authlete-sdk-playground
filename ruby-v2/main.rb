require 'authlete'

$stdout.sync = true

puts 'Authlete SDK Playground (Ruby v2)'
puts "authlete gem: #{Gem.loaded_specs['authlete']&.version}"

base_url   = ENV.fetch('AUTHLETE_BASE_URL', 'https://api.authlete.com')
api_key    = ENV['AUTHLETE_SERVICE_APIKEY']
api_secret = ENV['AUTHLETE_SERVICE_APISECRET']

if api_key.nil? || api_secret.nil?
  warn 'Error: AUTHLETE_SERVICE_APIKEY and AUTHLETE_SERVICE_APISECRET must be set.'
  exit 1
end

config = {
  host:               base_url,
  service_api_key:    api_key,
  service_api_secret: api_secret
}

api = Authlete::Api.new(config)

begin
  result = api.client_get_list
  clients = result.clients || []

  if clients.empty?
    puts '(no clients found)'
  else
    clients.each do |client|
      puts client.client_name || '(no name)'
    end
  end
rescue => e
  warn "Authlete API call failed: #{e.message}"
  exit 1
end
