const http = require('http');

console.log('=== 检查数据库中的排课数据 ===\n');

const loginData = JSON.stringify({ username: 'admin', password: '123456' });
const loginOptions = {
  hostname: 'localhost', port: 7002, path: '/api/v1/auth/login',
  method: 'POST', headers: { 'Content-Type': 'application/json' }
};

const loginReq = http.request(loginOptions, (loginRes) => {
  let loginBody = '';
  loginRes.on('data', d => loginBody += d);
  loginRes.on('end', () => {
    const loginResult = JSON.parse(loginBody);
    const token = loginResult.data?.token;
    if (!token) {
      console.log('登录失败');
      return;
    }

    // 查询所有排课（不带周次过滤）
    const options = {
      hostname: 'localhost', port: 7002, path: '/api/v1/scheduling',
      method: 'GET', headers: { 'Authorization': `Bearer ${token}` }
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', d => body += d);
      res.on('end', () => {
        const result = JSON.parse(body);
        console.log('所有排课记录：');
        console.log(`共 ${result.data.length} 条记录\n`);
        
        const byType = {};
        result.data.forEach(s => {
          if (!byType[s.source_type]) byType[s.source_type] = [];
          byType[s.source_type].push(s);
        });

        Object.keys(byType).forEach(type => {
          console.log(`${type} (${byType[type].length}条):`);
          byType[type].forEach(s => {
            console.log(`  ${s.scheduling_code}: ${s.course_name} - 周${s.week_no} 周${s.week_day} ${s.time_slot_start}`);
          });
          console.log('');
        });
      });
    });
    req.end();
  });
});
loginReq.write(loginData);
loginReq.end();
