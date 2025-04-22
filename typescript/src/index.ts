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

import { Configuration, ClientManagementApi, Middleware } from '@authlete/openapi-client';

import { ClientAuthorizationGetListApiRequest } from '@authlete/openapi-client';

const req: ClientAuthorizationGetListApiRequest  = {
  subject: 'kerin'
};


//Get html elements

const basePath = 'https://api.authlete.com';//(document.getElementById('base-url') as HTMLInputElement)?.value || 'https://api.authlete.com';
const apikey = '353960042211339';//(document.getElementById('api-key') as HTMLInputElement)?.value || process.env.API_KEY;
const apiSecret = 'C4wvqbJYEq3g5ddbQP_0QsivDq-5FKqY_dvSg6rfoI0'; //(document.getElementById('apiSecret') as HTMLInputElement)?.value || process.env.API_SECRET;
const apiVersion = 'v2';//(document.getElementById('apiVersion') as HTMLInputElement)?.value || 'v1';



function getAuthToken(): string {
  return '4N34ma206V43XvCJ-FlXBZKyVgplpvEgF02kVi2U9Y8';
}

export class AuthInterceptor extends Configuration {
  private static config: AuthInterceptor;

  private constructor() {
    const middleware: Middleware[] = [
      {
        pre(request: RequestArgs): RequestArgs {
          const token = getAuthToken();
          console.log("TOKEN:", token)

          return {
            ...request,
            headers: {
              ...request.headers,
              Authorization: `Bearer ${token}`,
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

console.log(api);

api.clientAuthorizationGetListApi(req).subscribe({
  next: (res) => console.log(res),
  error: (err) => console.error(err)
});


server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
