console.log("hello, from typescript playground for authlete api")

// src/index.ts (or dist/index.js after build)
import * as http from 'http';

const PORT = process.env.PORT || 3000;

const server = http.createServer((req: http.IncomingMessage, res: http.ServerResponse) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('Welcome, from your TypeScript API');
});

server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
