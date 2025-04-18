console.log("hello, from typescript playground for authlete api")

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

import { Configuration, ClientManagementApi } from '@authlete/openapi-client';


// Create a configuration object.
// NOTE: Replace the following credentials with yours.
const config = {
    baseUrl:               'https://us.authlete.com/api',
    serviceID:         '',
    accessToken: '',
    timeout:               10000
};

type Middleware = {
  pre?(request: RequestArgs): RequestArgs;
};


function getAuthToken(): string {
  return process.env.AUTHLETE_SERVICEOWNER_ACCESSTOKEN || '';
}

export class AuthInterceptor extends Configuration {
  private static config: AuthInterceptor;

  private constructor() {
    const middleware: Middleware[] = [
      {
        pre(request: RequestArgs): RequestArgs {
          const token = getAuthToken();

          return {
            ...request,
            headers: {
              ...request.headers,
              Authorization: `Bearer ${token}`,
            },
          };
        },
      },
    ];

    super({ middleware });
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

server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
