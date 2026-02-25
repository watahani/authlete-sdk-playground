require 'authlete_ruby_sdk'

$stdout.sync = true

puts 'Authlete SDK Playground (Ruby)'
puts "authlete_ruby_sdk: #{Gem.loaded_specs['authlete_ruby_sdk']&.version}"

base_url     = ENV.fetch('AUTHLETE_BASE_URL', 'https://us.authlete.com')
service_id   = ENV['AUTHLETE_SERVICE_APIKEY']
access_token = ENV['AUTHLETE_SERVICE_ACCESSTOKEN']

if service_id.nil? || access_token.nil?
  warn 'Error: AUTHLETE_SERVICE_APIKEY and AUTHLETE_SERVICE_ACCESSTOKEN must be set.'
  exit 1
end

client = ::Authlete::Client.new(
  bearer:     access_token,
  server_url: base_url
)

begin
  response = client.clients.list(service_id: service_id)

  clients = response&.client_get_list_response&.clients || []

  if clients.empty?
    puts '(no clients found)'
  else
    clients.each do |c|
      puts c.client_name || '(no name)'
    end
  end
rescue => e
  warn "Authlete API call failed: #{e.message}"
  exit 1
end
