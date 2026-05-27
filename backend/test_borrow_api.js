
const http = require('http');

// 测试借还流水API
const options = {
  hostname: 'localhost',
  port: 7002,
  path: '/api/v1/equipment/borrow/logs?page=1&amp;pageSize=20',
  method: 'GET',
  headers: {
    'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwidXNlcm5hbWUiOiJhZG1pbiIsImlhdCI6MTc3OTYwMTY3OCwiZXhwIjoxNzc5NjA1Mjc4fQ.test' // 这里需要真实的token
  }
};

console.log('正在测试借还流水API...');
console.log('请求地址:', options.path);

const req = http.request(options, (res) =&gt; {
  console.log('状态码:', res.statusCode);
  console.log('响应头:', res.headers);

  let data = '';

  res.on('data', (chunk) =&gt; {
    data += chunk;
  });

  res.on('end', () =&gt; {
    console.log('响应数据:');
    try {
      console.log(JSON.stringify(JSON.parse(data), null, 2));
    } catch (e) {
      console.log(data);
    }
  });
});

req.on('error', (error) =&gt; {
  console.error('请求错误:', error);
});

req.end();

