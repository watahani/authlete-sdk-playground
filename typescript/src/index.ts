console.log("hello, from typescript playground for authlete api");

(globalThis as any).XMLHttpRequest = require('xhr2');


// src/index.ts (or dist/index.js after build)
import * as http from 'http';
import * as fs from 'fs';
import * as path from 'path';

type RequestArgs = {
  url: string;
  method: string;
  headers: Record<string, string>;
  [key: string]: any;
};

import { Configuration, ClientManagementApi, Middleware, ServiceManagementApi } from '@authlete/openapi-client';

import { ClientAuthorizationGetListApiRequest } from '@authlete/openapi-client';



//Get html elements

const basePath = 'https://api.authlete.com';//(document.getElementById('base-url') as HTMLInputElement)?.value || 'https://api.authlete.com';
// service api for service list const apikey = '19568184929257';//(document.getElementById('api-key') as HTMLInputElement)?.value || process.env.API_KEY;
const apikey = '353960042211339';
// service list const apiSecret = 'Zlkxn79lxNj8V0GrR6v9xBAQBYy45fc-ezIWkYFHDBo'; //(document.getElementById('apiSecret') as HTMLInputElement)?.value || process.env.API_SECRET;
const apiSecret = 'C4wvqbJYEq3g5ddbQP_0QsivDq-5FKqY_dvSg6rfoI0';
const apiVersion = 'v2';//(document.getElementById('apiVersion') as HTMLInputElement)?.value || 'v1';



function getAuthToken(): string {
  return 'Xj_-CVjgplKvhu-TVogzbO05tbvXYJxFxwsxWbSjC00';
}

export class AuthInterceptor extends Configuration {
  private static config: AuthInterceptor;

  private constructor() {
    const middleware: Middleware[] = [
      {
        pre(request: RequestArgs): RequestArgs {
          const token = getAuthToken();
          console.log("TOKEN:", token)
          const authToken = `${apikey}:${apiSecret}`;
          const authHeader = `Basic ${Buffer.from(authToken).toString('base64')}`;
          //console.log("Authorization Header:", authHeader);

          return {
            ...request,
            headers: {
              ...request.headers,
             Authorization: authHeader,
             'X-API-Key': apikey,
             'X-API-Secret': apiSecret,
             'X-API-Version': apiVersion,
            },
          };
        },
      },
    ];

    super({
      basePath,
      middleware
    });
  }

  public static get Instance() {
    return AuthInterceptor.config || (AuthInterceptor.config = new this());
  }
}


const PORT = process.env.PORT || 3000;

const server = http.createServer((req, res) => {
  const file_path = path.join(__dirname, '../public', 'index.html');
  fs.readFile(file_path, 'utf-8', (err, data) => {
    if(err){
      res.writeHead(500, { 'Content-Type': 'text/plain' });
      res.end('Error reading the HTML file.');
    }else {
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(data);
    }
  })
});

const api = new ClientManagementApi(AuthInterceptor.Instance);

const new_api_service = new ServiceManagementApi(AuthInterceptor.Instance);


//console.log(api);

console.log('Service:::', new_api_service);


/*new_api_service.serviceGetListApi({start: 0, end: 10}).subscribe({
  next: (res) => console.log('V2 Service List:', res),
  error: (err) => console.error('Error:', err)
});*/

function req_send() {

  api.clientGetListApi({ developer: 'kerin', start: 0, end: 10 }).subscribe({
    next: (res) => console.log('Client List:', res),
    error: (err) => console.error('Error:', err)
  });

}



server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});

//curl -v https://api.authlete.com/api/service/get/list?start=0\&end=5 \
//-u '19568184929257:Zlkxn79lxNj8V0GrR6v9xBAQBYy45fc-ezIWkYFHDBo'

//curl -v https://api.authlete.com/api/service/get/353960042211339 \
