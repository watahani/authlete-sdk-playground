
// src/index.ts (or dist/index.js after build)
// server/index.ts
import dotenv from 'dotenv';
import express from 'express';
import bodyParser from 'body-parser';
import path from 'path';

dotenv.config();

console.log("Hello, from Typescript testing playground for the Authlete API!");

(globalThis as any).XMLHttpRequest = require('xhr2');

const app = express();
const port = 3000;

app.use(express.static(path.join(__dirname, '../public')));

// src/index.ts (or dist/index.js after build)

type RequestArgs = {
  url: string;
  method: string;
  headers: Record<string, string>;
  [key: string]: any;
};

import { Configuration, ClientManagementApi, Middleware, ServiceManagementApi } from '@authlete/openapi-client';

import { ClientAuthorizationGetListApiRequest } from '@authlete/openapi-client';

let apiVersion = 'v2';

//uncomment the following if you want to test client list
//const apikey = process.env.API_KEY as string;

//uncomment the following spiSecret if you want to test client list
//const apiSecret = process.env.API_SECRET as string;
let apikey = process.env.ACCOUNT_API_KEY as string;
const apiSecret = process.env.ACCOUNT_API_SECRET as string;
const is_v3 = false;



function getAuthToken(): string {
  return process.env.API_TOKEN as string;
}

console.log("API Key:", apikey);
console.log("API Secret:", apiSecret);


export class AuthInterceptor extends Configuration {
  private static config: AuthInterceptor;
  private static readonly isV3 = false;
  private static readonly basePath = AuthInterceptor.isV3
    ? `https://us.authlete.com/api/${apikey}/`
    : 'https://api.authlete.com';
  private constructor() {
    const middleware: Middleware[] = [
      {
        pre(request: RequestArgs): RequestArgs {
          const token = getAuthToken();
          console.log("TOKEN:", token)
          let authHeader = '';
          let basePath = '';
          if (is_v3) {
            apikey = '55595584';
            apiVersion = 'v3';
            basePath = `https://us.authlete.com/api/${apikey}/`;
            console.log("using V3 and v3 doesnot exists:", basePath);
            authHeader = `Bearer ${token}`;

          }
          else
            {
              //basePath=`https://api.authlete.com`;
              console.log("using V2");
              const authToken = `${apikey}:${apiSecret}`;
              authHeader = `Basic ${Buffer.from(authToken).toString('base64')}`;
            }

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

    super({basePath: AuthInterceptor.basePath, middleware});
      console.log("AUTHHEADER:", middleware);
  }

  public static get Instance() {
    return AuthInterceptor.config || (AuthInterceptor.config = new this());
  }
}

const api = new ClientManagementApi(AuthInterceptor.Instance);

const new_api_service = new ServiceManagementApi(AuthInterceptor.Instance);
console.log("new_api_service:", new_api_service);

/*api.clientGetListApi({ developer: 'kerin', start: 0, end: 10 }).subscribe({
  next: (res) => console.log('Client List:', res),
  error: (err) => console.error('Error:', err)
});*/


new_api_service.serviceGetListApi({start: 0, end: 10}).subscribe({
  next: (response) => {
    console.log('Service List:', response);
  },
  error: (err) => {
    console.error('Error fetching client list:', err);
  }
});

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
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});


//curl -v https://api.authlete.com/api/service/get/list?start=0\&end=5 \
//-u '19568184929257:Zlkxn79lxNj8V0GrR6v9xBAQBYy45fc-ezIWkYFHDBo'

//curl -v https://api.authlete.com/api/service/get/353960042211339 \
