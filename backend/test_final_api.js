const http = require('http');

console.log('=== 测试完整排课检索API ===\n');

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
    console.log('✓ 登录成功\n');

    // 测试第3周排课
    const week3Options = {
      hostname: 'localhost', port: 7002, path: '/api/v1/scheduling?weekNo=3',
      method: 'GET', headers: { 'Authorization': `Bearer ${token}` }
    };

    const week3Req = http.request(week3Options, (res) => {
      let body = '';
      res.on('data', d => body += d);
      res.on('end', () => {
        const result = JSON.parse(body);
        console.log('=== 第3周排课数据 ===');
        console.log(`共 ${result.data.length} 条记录：\n`);
        
        result.data.forEach(s => {
          let typeLabel = '';
          if (s.source_type === 'PendingReservation') typeLabel = '(待审批预约)';
          else if (s.source_type === 'Reservation') typeLabel = '(已批准预约)';
          else if (s.source_type === 'CentralScheduling') typeLabel = '(集中排课)';
          
          console.log(`  ${s.scheduling_code} [${s.source_type}] ${s.course_name} - 周${s.week_day} ${s.time_slot_start} ${typeLabel}`);
        });
        
        console.log(`\n统计：集中排课 ${result.data.filter(s => s.source_type === 'CentralScheduling').length} 条，预约 ${result.data.filter(s => s.source_type === 'Reservation').length} 条，待审批 ${result.data.filter(s => s.source_type === 'PendingReservation').length} 条`);
      });
    });
    week3Req.end();
  });
});
loginReq.write(loginData);
loginReq.end();
