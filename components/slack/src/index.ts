const http = require('http');

const hostname = '0.0.0.0';
const port = 3000;

let date = new Date()

const server = http.createServer((req, res) => {
  res.statusCode = 200;
  res.setHeader('Content-Type', 'text/plain');
  res.end(`Hello, World! (Carlos was here :D :D) started: ${date.toISOString()}`);
});

server.listen(port, hostname, () => {
  console.log(`Server running at http://${hostname}:${port}/`);
});