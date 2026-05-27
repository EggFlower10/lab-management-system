const http = require('http');

console.log('=== 测试登录 + 获取用户信息 ===');

const loginData = JSON.stringify({
  username: 'admin',
  password: '123456'
});

const loginOptions = {
  hostname: 'localhost',
  port: 7002,
  path: '/api/v1/auth/login',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(loginData)
  }
};

const loginReq = http.request(loginOptions, (res) => {
  let responseData = '';
  res.on('data', (chunk) => responseData += chunk);
  res.on('end', () => {
    console.log('登录状态:', res.statusCode);
    const result = JSON.parse(responseData);
    
    if (result.code === 200 && result.data.token) {
      const token = result.data.token;
      console.log('登录成功, Token获取');
      
      // 测试获取用户信息
      const userInfoOptions = {
        hostname: 'localhost',
        port: 7002,
        path: '/api/v1/auth/info',
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      };
      
      const userInfoReq = http.request(userInfoOptions, (res) => {
        let infoData = '';
        res.on('data', (chunk) => infoData += chunk);
        res.on('end', () => {
          console.log('用户信息状态:', res.statusCode);
          console.log('用户信息响应:', infoData);
        });
      });
      userInfoReq.on('error', (e) => console.error('获取用户信息失败:', e));
      userInfoReq.end();
    } else {
      console.log('登录失败:', result.message);
    }
  });
});

loginReq.on('error', (e) => console.error('登录失败:', e));
loginReq.write(loginData);
loginReq.end();
