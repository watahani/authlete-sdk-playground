
// src/index.ts (or dist/index.js after build)
// server/index.ts
import dotenv from 'dotenv';
import express from 'express';
import bodyParser from 'body-parser';
import path from 'path';

dotenv.config();

console.log("hello, from typescript playground for authlete api");

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


const basePath = 'https://api.authlete.com';//(document.getElementById('base-url') as HTMLInputElement)?.value || 'https://api.authlete.com';
// service api for service list const apikey = '19568184929257';//(document.getElementById('api-key') as HTMLInputElement)?.value || process.env.API_KEY;
const apiVersion = 'v2';//(document.getElementById('apiVersion') as HTMLInputElement)?.value || 'v1';

//uncomment the following if you want to test client list
//const apikey = process.env.API_KEY as string;
  // service list const apiSecret = 'Zlkxn79lxNj8V0GrR6v9xBAQBYy45fc-ezIWkYFHDBo'; //(document.getElementById('apiSecret') as HTMLInputElement)?.value || process.env.API_SECRET;
//uncomment the following spiSecret if you want to test client list
//const apiSecret = process.env.API_SECRET as string;

const apikey = process.env.ACCOUNT_API_KEY as string;
  // service list const apiSecret = 'Zlkxn79lxNj8V0GrR6v9xBAQBYy45fc-ezIWkYFHDBo'; //(document.getElementById('apiSecret') as HTMLInputElement)?.value || process.env.API_SECRET;
const apiSecret = process.env.ACCOUNT_API_SECRET as string;



function getAuthToken(): string {

  return process.env.API_TOKEN as string;
}

console.log("API Key:", apikey);
console.log("API Secret:", apiSecret);


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

app.get('/fetch-api-data', async (req, res) => {
  try {
    const data = await new Promise((resolve, reject) => {
      //change following code to match your request
      new_api_service.serviceGetListApi({start: 0, end: 10}).subscribe({
        next: (response) => {
          console.log('Service List:', response);
          resolve(response);
        },
        error: (err) => {
          console.error('Error fetching client list:', err);
          reject(err);
        }
      });
    });

    res.json(data);  // Directly return the API response
  } catch (error) {
    console.error('Error fetching Service list:', error);
    res.status(500).json({ error: 'Failed to fetch data' });
  }
});


new_api_service.serviceGetListApi({start: 0, end: 10}).subscribe({
    next: (res) => console.log('V2 Service List:', res),
    error: (err) => console.error('Error:', err)
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
