const http = require('http');

const server = http.createServer((req, res) => {
  console.log(`\n=== Request Received ===`);
  console.log(`Method: ${req.method}`);
  console.log(`URL: ${req.url}`);
  console.log(`Headers:`, JSON.stringify(req.headers, null, 2));

  let body = '';
  req.on('data', (chunk) => {
    body += chunk;
  });

  req.on('end', () => {
    console.log(`Body: ${body || '(empty)'}`);

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ code: 200, message: 'Success', data: [] }));
  });
});

server.listen(7003, () => {
  console.log('Test server running on http://localhost:7003');
});