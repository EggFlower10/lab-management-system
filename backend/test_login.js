const http = require('http');

const loginData = JSON.stringify({
  username: 'admin',
  password: '123456'
});

const options = {
  hostname: 'localhost',
  port: 7002,
  path: '/api/v1/auth/login',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(loginData)
  }
};

const req = http.request(options, (res) => {
  let body = '';
  res.on('data', (chunk) => {
    body += chunk;
  });
  res.on('end', () => {
    console.log('状态码:', res.statusCode);
    console.log('响应:', body);
  });
});

req.on('error', (e) => {
  console.error('请求错误:', e);
});

req.write(loginData);
req.end();
