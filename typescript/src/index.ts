console.log("hello, from typescript playground for authlete api")

// src/index.ts (or dist/index.js after build)
import * as http from 'http';

// import authlete sdk
import { AuthleteApiFactory } from 'https://deno.land/x/authlete_deno@v1.2.10/mod.ts';

// Create a configuration object.
// NOTE: Replace the following credentials with yours.
const config = {
    baseUrl:               'https://us.authlete.com/api',
    serviceID:         '',
    accessToken: '',
    timeout:               10000
};

const PORT = process.env.PORT || 3000;

const server = http.createServer((req: http.IncomingMessage, res: http.ServerResponse) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('Welcome, from your TypeScript Authlete API');
});

server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
