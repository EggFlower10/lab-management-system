const http = require('http');

const options = {
  hostname: 'localhost',
  port: 7002,
  path: '/api/v1/scheduling?weekNo=3',
  method: 'GET',
  headers: {
    'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsInVzZXJuYW1lIjoidXNlcjEiLCJpYXQiOjE3Nzk4NTIyMDB9.a1JZ5Y7r5X4Y5JZ5X4Y5JZ5X4Y5JZ5X4Y5JZ5X4Y'
  }
};

const req = http.request(options, (res) => {
  let data = '';
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('状态码:', res.statusCode);
    console.log('响应数据:', data);
    
    try {
      const result = JSON.parse(data);
      console.log('');
      console.log('=== 排课记录列表 ===');
      if (result.data && result.data.length > 0) {
        result.data.forEach(item => {
          console.log(`${item.scheduling_code} | ${item.source_type} | ${item.course_name} | 周${item.week_no} 周${item.week_day} ${item.time_slot_start}`);
        });
      } else {
        console.log('无排课记录');
      }
    } catch (err) {
      console.error('解析JSON失败:', err);
    }
  });
});

req.on('error', (e) => {
  console.error('请求失败:', e);
});

req.end();
