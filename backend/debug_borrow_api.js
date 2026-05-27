const http = require('http');

async function testApiCalls() {
  const testCases = [
    { 
      name: '无日期筛选', 
      url: '/api/v1/equipment/borrow/logs?page=1&pageSize=20',
      headers: {}
    },
    { 
      name: '带日期筛选', 
      url: '/api/v1/equipment/borrow/logs?page=1&pageSize=20&start_date=2026-05-01&end_date=2026-05-31',
      headers: {}
    }
  ];

  for (const test of testCases) {
    console.log(`\n=== 测试: ${test.name} ===`);
    console.log(`URL: ${test.url}`);
    
    await new Promise((resolve) => {
      const options = {
        hostname: 'localhost',
        port: 7002,
        path: test.url,
        method: 'GET',
        headers: {
          ...test.headers
        }
      };

      const req = http.request(options, (res) => {
        console.log(`状态码: ${res.statusCode}`);
        console.log(`响应头:`, JSON.stringify(res.headers, null, 2));

        let data = '';
        res.on('data', (chunk) => {
          data += chunk;
        });

        res.on('end', () => {
          console.log('响应数据:');
          try {
            const jsonData = JSON.parse(data);
            console.log(JSON.stringify(jsonData, null, 2));
            if (jsonData.code === 200) {
              console.log('✓ 成功');
            } else {
              console.log(`✗ 失败: ${jsonData.message}`);
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

testApiCalls().catch(e => console.error(e));
