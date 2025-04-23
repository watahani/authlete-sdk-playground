
// src/index.ts (or dist/index.js after build)
// server/index.ts


import express from 'express';
import path from 'path';

console.log("hello, from typescript playground for authlete api");

(globalThis as any).XMLHttpRequest = require('xhr2');


// src/index.ts (or dist/index.js after build)

type RequestArgs = {
  url: string;
  method: string;
  headers: Record<string, string>;
  [key: string]: any;
};

import { Configuration, ClientManagementApi, Middleware, ServiceManagementApi } from '@authlete/openapi-client';

import { ClientAuthorizationGetListApiRequest } from '@authlete/openapi-client';


const app = express();
const port = 3000;

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




const api = new ClientManagementApi(AuthInterceptor.Instance);

const new_api_service = new ServiceManagementApi(AuthInterceptor.Instance);

api.clientGetListApi({ developer: 'kerin', start: 0, end: 10 }).subscribe({
  next: (res) => console.log('Client List:', res),
  error: (err) => console.error('Error:', err)
});

function service_req_send() {
  new_api_service.serviceGetListApi({start: 0, end: 10}).subscribe({
    next: (res) => console.log('V2 Service List:', res),
    error: (err) => console.error('Error:', err)
  });
}

function client_req_send() {
  if(api){
    api.clientGetListApi({ developer: 'kerin', start: 0, end: 10 }).subscribe({
      next: (res) => console.log('Client List:', res),
      error: (err) => console.error('Error:', err)
    });

  }
  else{
    console.log("INVALID CLIENT API Configuration");
  }

}

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, '../public')));

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});

//curl -v https://api.authlete.com/api/service/get/list?start=0\&end=5 \
//-u '19568184929257:Zlkxn79lxNj8V0GrR6v9xBAQBYy45fc-ezIWkYFHDBo'

//curl -v https://api.authlete.com/api/service/get/353960042211339 \
