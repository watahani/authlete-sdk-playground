console.log("hello, from typescript playground for authlete api")

// src/index.ts (or dist/index.js after build)
import * as http from 'http';
import * as fs from 'fs';
import * as path from 'path';

// Create a configuration object.
// NOTE: Replace the following credentials with yours.
const config = {
    baseUrl:               'https://us.authlete.com/api',
    serviceID:         '',
    accessToken: '',
    timeout:               10000
};

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

server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
