//Get html elements

export function get_client_config() {

  const apikey_el = document.getElementById('api-key') as HTMLInputElement | null;
  // service list const apiSecret = 'Zlkxn79lxNj8V0GrR6v9xBAQBYy45fc-ezIWkYFHDBo'; //(document.getElementById('apiSecret') as HTMLInputElement)?.value || process.env.API_SECRET;
  const apiSecret_el = document.getElementById('apiSecret') as HTMLInputElement | null;
  const apiVersion = 'v2';//(document.getElementById('apiVersion') as HTMLInputElement)?.value || 'v1';
  const auth_token_el = document.getElementById('ser-apiToken') as HTMLInputElement | null;

  if (apikey_el && apiSecret_el && auth_token_el){
    const apikey = apikey_el.value;
    const apiSecret = apiSecret_el.value;
    const auth_token = auth_token_el.value;
    console.log('Client Configuration:',apikey, apiSecret);
  }
  else{
    console.log('Client Configuration is missing');

  }

  client_req_send();



}

export function get_service_config() {

  const apikey_el = document.getElementById('ser-api-key') as HTMLInputElement | null;
  // service list const apiSecret = 'Zlkxn79lxNj8V0GrR6v9xBAQBYy45fc-ezIWkYFHDBo'; //(document.getElementById('apiSecret') as HTMLInputElement)?.value || process.env.API_SECRET;
  const apiSecret_el = document.getElementById('ser-apiSecret') as HTMLInputElement | null;
  const auth_token_el = document.getElementById('ser-apiToken') as HTMLInputElement | null;
  const apiVersion = 'v2';//(document.getElementById('apiVersion') as HTMLInputElement)?.value || 'v1';

  if (apikey_el && apiSecret_el && auth_token_el){
    const apikey = apikey_el.value;
    const apiSecret = apiSecret_el.value;
    const auth_token = auth_token_el.value;
    console.log('SERVICE Configuration:',apikey,apiSecret);
  }
  else{
    console.log('Service Configuration is missing');
  }

  service_req_send();

}



/*new_api_service.serviceGetListApi({start: 0, end: 10}).subscribe({
  next: (res) => console.log('V2 Service List:', res),
  error: (err) => console.error('Error:', err)
});*/


// Expose it to global `window` so HTML can see it:
(window as any).client_req_send = client_req_send;
(window as any).get_client_config = get_client_config;

//curl -v https://api.authlete.com/api/service/get/list?start=0\&end=5 \
//-u '19568184929257:Zlkxn79lxNj8V0GrR6v9xBAQBYy45fc-ezIWkYFHDBo'

//curl -v https://api.authlete.com/api/service/get/353960042211339 \
