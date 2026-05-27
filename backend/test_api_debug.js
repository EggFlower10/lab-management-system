const http = require('http');

async function testApi() {
  console.log('=== 测试借还流水API ===');
  
  // 先获取token
  const loginOptions = {
    hostname: 'localhost',
    port: 7002,
    path: '/api/v1/auth/login',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    }
  };

  let token = '';
  
  await new Promise((resolve) => {
    const req = http.request(loginOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          if (result.code === 200 && result.data?.token) {
            token = result.data.token;
            console.log('✓ 登录成功，获取到token');
          } else {
            console.log('✗ 登录失败:', result.message);
          }
        } catch (e) {
          console.log('✗ 登录响应解析失败:', data);
        }
        resolve();
      });
    });
    req.write(JSON.stringify({ username: 'admin', password: '123456' }));
    req.end();
  });

  if (!token) {
    console.log('无法获取token，退出测试');
    return;
  }

  // 测试借还流水API
  const testCases = [
    { name: '无日期筛选', url: '/api/v1/equipment/borrow/logs?page=1&pageSize=20' },
    { name: '带日期筛选', url: '/api/v1/equipment/borrow/logs?page=1&pageSize=20&start_date=2026-05-01&end_date=2026-05-31' },
    { name: '2024年数据', url: '/api/v1/equipment/borrow/logs?page=1&pageSize=20&start_date=2024-09-01&end_date=2024-09-30' }
  ];

  for (const test of testCases) {
    console.log(`\n--- ${test.name} ---`);
    console.log(`URL: ${test.url}`);
    
    await new Promise((resolve) => {
      const options = {
        hostname: 'localhost',
        port: 7002,
        path: test.url,
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      };

      const req = http.request(options, (res) => {
        console.log(`状态码: ${res.statusCode}`);
        
        let data = '';
        res.on('data', (chunk) => data += chunk);
        res.on('end', () => {
          try {
            const result = JSON.parse(data);
            console.log(`响应码: ${result.code}`);
            console.log(`消息: ${result.message}`);
            if (result.code === 200) {
              console.log(`数据条数: ${result.data?.length || 0}`);
              console.log(`总数: ${result.total || 0}`);
              if (result.data && result.data.length > 0) {
                console.log('前2条数据:');
                result.data.slice(0, 2).forEach((item, idx) => {
                  console.log(`${idx + 1}. ${item.borrow_code} - ${item.borrow_date}`);
                });
              }
            }
          } catch (e) {
            console.log('原始响应:', data);
          }
          resolve();
        });
      });

      req.on('error', (error) => {
        console.error('请求错误:', error);
        resolve();
      });

      req.end();
    });
  }
}

testApi().catch(e => console.error(e));
