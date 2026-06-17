const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = 3000;
const API_TARGET = 'http://localhost:7002';
const distDir = path.join(__dirname, 'dist');

const mimeTypes = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.json': 'application/json',
};

function proxyRequest(req, res) {
  console.log('Proxying:', req.method, req.url);
  const targetUrl = API_TARGET + req.url;
  const options = url.parse(targetUrl);
  
  options.method = req.method;
  options.headers = { ...req.headers };
  options.headers.host = options.host;
  
  const proxyReq = http.request(options, (proxyRes) => {
    console.log('Proxy response:', proxyRes.statusCode);
    res.writeHead(proxyRes.statusCode, proxyRes.headers);
    proxyRes.pipe(res, { end: true });
  });
  
  proxyReq.on('error', (err) => {
    console.error('Proxy error:', err.message);
    res.writeHead(500);
    res.end('Proxy Error: ' + err.message);
  });
  
  req.pipe(proxyReq, { end: true });
}

function serveFile(req, res) {
  let filePath = path.join(distDir, req.url === '/' ? 'index.html' : req.url);
  console.log('Serving file:', filePath);
  
  const extname = String(path.extname(filePath)).toLowerCase();
  const contentType = mimeTypes[extname] || 'application/octet-stream';
  
  fs.readFile(filePath, (error, content) => {
    if (error) {
      if (error.code === 'ENOENT') {
        fs.readFile(path.join(distDir, 'index.html'), (err, indexContent) => {
          if (err) {
            res.writeHead(500);
            res.end('Server Error');
          } else {
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end(indexContent, 'utf-8');
          }
        });
      } else {
        res.writeHead(500);
        res.end('Server Error: ' + error.code);
      }
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content, 'utf-8');
    }
  });
}

const server = http.createServer((req, res) => {
  console.log('Request:', req.method, req.url);
  if (req.url.startsWith('/api/v1')) {
    proxyRequest(req, res);
  } else {
    serveFile(req, res);
  }
});

server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}/`);
});
