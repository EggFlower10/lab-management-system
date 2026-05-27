const fs = require('fs');
const path = require('path');
const initSqlJs = require('sql.js');

async function checkData() {
  const SQL = await initSqlJs({
    locateFile: file => `node_modules/sql.js/dist/${file}`
  });

  const dbPath = path.join(__dirname, 'database', 'lab_management.db');
  
  if (!fs.existsSync(dbPath)) {
    console.error('数据库文件不存在:', dbPath);
    return;
  }

  const data = fs.readFileSync(dbPath);
  const db = new SQL.Database(data);

  console.log('=== 预约申请记录 ===');
  const reservationResults = db.exec('SELECT id, reservation_code, approval_status, project_name, week_no, week_day, time_slot, room_id FROM lab_reservation');
  if (reservationResults.length > 0) {
    reservationResults[0].values.forEach(r => {
      console.log(`ID:${r[0]}, 编号:${r[1]}, 状态:${r[2]}, 项目:${r[3]}, 周:${r[4]}, 日:${r[5]}, 时间:${r[6]}`);
    });
  } else {
    console.log('无预约申请记录');
  }

  console.log('');
  console.log('=== 所有预约排课记录 ===');
  const reservationSchedResults = db.exec('SELECT id, scheduling_code, source_type, course_name, week_no, week_day, time_slot_start, source_id FROM lab_scheduling WHERE source_type = "Reservation"');
  if (reservationSchedResults.length > 0) {
    console.log('共', reservationSchedResults[0].values.length, '条记录');
    reservationSchedResults[0].values.forEach(r => {
      console.log(`ID:${r[0]}, 编号:${r[1]}, 来源:${r[2]}, 课程:${r[3]}, 周:${r[4]}, 日:${r[5]}, 时间:${r[6]}, source_id:${r[7]}`);
    });
  } else {
    console.log('无预约排课记录');
  }

  console.log('');
  console.log('=== 验证：已通过审批的预约是否都有排课记录 ===');
  const checkResults = db.exec(`
    SELECT r.reservation_code, r.project_name, r.week_no, r.week_day, r.time_slot,
           s.scheduling_code
    FROM lab_reservation r
    LEFT JOIN lab_scheduling s ON r.id = s.source_id AND s.source_type = 'Reservation'
    WHERE r.approval_status = 'approved'
  `);
  if (checkResults.length > 0) {
    checkResults[0].values.forEach(r => {
      const [reservation_code, project_name, week_no, week_day, time_slot, scheduling_code] = r;
      if (scheduling_code) {
        console.log(`✓ ${reservation_code} (${project_name}) - 已生成排课: ${scheduling_code}`);
      } else {
        console.log(`✗ ${reservation_code} (${project_name}) - 缺少排课记录！`);
      }
    });
  }

  db.close();
}

checkData().catch(err => {
  console.error('查询失败:', err);
});
