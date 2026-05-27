const http = require('http');

console.log('=== 测试完整排课检索API ===\n');

// 先登录
const loginData = JSON.stringify({ username: 'admin', password: '123456' });
const loginOptions = {
  hostname: 'localhost', port: 7002, path: '/api/v1/auth/login',
  method: 'POST', headers: { 'Content-Type': 'application/json' }
};

const loginReq = http.request(loginOptions, (loginRes) => {
  let loginBody = '';
  loginRes.on('data', d => loginBody += d);
  loginRes.on('end', () => {
    try {
      const loginResult = JSON.parse(loginBody);
      const token = loginResult.data?.token;
      if (!token) {
        console.log('登录失败');
        return;
      }
      console.log('✓ 登录成功\n');

      // 测试获取第3周的排课
      const options = {
        hostname: 'localhost', port: 7002,
        path: '/api/v1/scheduling?weekNo=3',
        method: 'GET', headers: { 'Authorization': `Bearer ${token}` }
      };

      const req = http.request(options, (res) => {
        let body = '';
        res.on('data', d => body += d);
        res.on('end', () => {
          try {
            const result = JSON.parse(body);
            console.log('✓ 排课检索API返回状态:', res.statusCode);
            console.log('\n=== 第3周排课数据 ===');
            
            if (result.code === 200 && result.data) {
              const schedules = result.data;
              console.log(`共 ${schedules.length} 条排课记录：\n`);
              
              schedules.forEach(s => {
                let statusLabel = '';
                if (s.source_type === 'PendingReservation') {
                  statusLabel = '(待审批)';
                } else if (s.source_type === 'Reservation') {
                  statusLabel = '(已批准预约)';
                }
                
                console.log(`  ${s.scheduling_code} [${s.source_type}] ${s.course_name} - 周${s.week_no} 周${s.week_day} ${s.time_slot_start} ${statusLabel}`);
              });
              
              // 统计
              const centralCount = schedules.filter(s => s.source_type === 'CentralScheduling').length;
              const reservationCount = schedules.filter(s => s.source_type === 'Reservation').length;
              const pendingCount = schedules.filter(s => s.source_type === 'PendingReservation').length;
              
              console.log(`\n统计：集中排课 ${centralCount} 条，已批准预约 ${reservationCount} 条，待审批预约 ${pendingCount} 条`);
            }
          } catch (e) {
            console.error('解析失败:', e, body);
          }
        });
      });
      req.on('error', e => console.error('请求失败:', e));
      req.end();
    } catch (e) {
      console.error('登录解析失败:', e);
    }
  });
});
loginReq.write(loginData);
loginReq.end();
