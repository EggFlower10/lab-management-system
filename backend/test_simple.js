const http = require('http');

async function testApi() {
  console.log('=== 测试借还流水API ===\n');
  
  let token = '';
  
  const loginData = await new Promise((resolve) => {
    const req = http.request({
      hostname: 'localhost',
      port: 7002,
      path: '/api/v1/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => resolve(data));
    });
    req.write(JSON.stringify({ username: 'admin', password: '123456' }));
    req.end();
  });
  
  console.log('登录响应:', loginData);
  
  try {
    const loginResult = JSON.parse(loginData);
    token = loginResult.data?.token || '';
  } catch (e) {
    console.log('解析失败');
  }
  
  if (!token) {
    console.log('无法获取token');
    return;
  }
  
  console.log('\n--- 测试无日期筛选 ---');
  const result1 = await new Promise((resolve) => {
    const req = http.request({
      hostname: 'localhost',
      port: 7002,
      path: '/api/v1/equipment/borrow/logs?page=1&pageSize=20',
      method: 'GET',
      headers: { 'Authorization': `Bearer ${token}` }
    }, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => resolve(data));
    });
    req.end();
  });
  
  console.log('响应:', result1);
  
  console.log('\n--- 测试日期筛选 ---');
  const result2 = await new Promise((resolve) => {
    const req = http.request({
      hostname: 'localhost',
      port: 7002,
      path: '/api/v1/equipment/borrow/logs?page=1&pageSize=20&start_date=2026-05-01&end_date=2026-05-31',
      method: 'GET',
      headers: { 'Authorization': `Bearer ${token}` }
    }, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => resolve(data));
    });
    req.end();
  });
  
  console.log('响应:', result2);
}

testApi().catch(e => console.error('错误:', e));
