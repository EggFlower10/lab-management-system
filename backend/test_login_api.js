const http = require('http');

console.log('=== 测试登录API ===');

const data = JSON.stringify({
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
    'Content-Length': Buffer.byteLength(data)
  }
};

const req = http.request(options, (res) => {
  let responseData = '';

  res.on('data', (chunk) => {
    responseData += chunk;
  });

  res.on('end', () => {
    console.log('状态码:', res.statusCode);
    console.log('响应:', responseData);
    try {
      const parsed = JSON.parse(responseData);
      console.log('');
      console.log('解析结果:');
      if (parsed.code === 200) {
        console.log('  ✓ 登录成功');
        console.log('  Token:', parsed.data.token ? '已获取' : '无');
        console.log('  用户:', parsed.data.user);
      } else {
        console.log('  ✗ 登录失败:', parsed.message);
      }
    } catch (e) {
      console.error('解析失败:', e);
    }
  });
});

req.on('error', (error) => {
  console.error('请求失败:', error.message);
});

req.write(data);
req.end();
