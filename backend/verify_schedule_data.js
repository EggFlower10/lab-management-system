const fs = require('fs');
const path = require('path');
const initSqlJs = require('sql.js');

async function verify() {
  const SQL = await initSqlJs({
    locateFile: file => `node_modules/sql.js/dist/${file}`
  });

  const dbPath = path.join(__dirname, 'database', 'lab_management.db');
  const data = fs.readFileSync(dbPath);
  const db = new SQL.Database(new Uint8Array(data));

  console.log('=== 第3周所有排课记录 ===');
  const week3Results = db.exec(`
    SELECT s.id, s.scheduling_code, s.source_type, s.course_name, 
           s.week_no, s.week_day, s.time_slot_start, s.status
    FROM lab_scheduling s
    WHERE s.week_no = 3 AND s.status = 1
    ORDER BY s.week_day, s.time_slot_start
  `);

  if (week3Results.length > 0) {
    console.log('共', week3Results[0].values.length, '条记录:');
    week3Results[0].values.forEach(row => {
      const [id, scheduling_code, source_type, course_name, week_no, week_day, time_slot_start, status] = row;
      console.log(`${scheduling_code} | ${source_type} | ${course_name} | 周${week_no} 周${week_day} ${time_slot_start} | 状态:${status}`);
    });
  }

  console.log('');
  console.log('=== 预约申请及其排课记录 ===');
  const reservationResults = db.exec(`
    SELECT r.reservation_code, r.project_name, r.approval_status,
           s.scheduling_code, s.week_no, s.week_day, s.time_slot_start
    FROM lab_reservation r
    LEFT JOIN lab_scheduling s ON r.id = s.source_id AND s.source_type = 'Reservation'
    ORDER BY r.id
  `);

  if (reservationResults.length > 0) {
    reservationResults[0].values.forEach(row => {
      const [reservation_code, project_name, approval_status, scheduling_code, week_no, week_day, time_slot_start] = row;
      console.log(`${reservation_code} | ${project_name} | ${approval_status} | 排课: ${scheduling_code || '无'} (周${week_no} 周${week_day} ${time_slot_start})`);
    });
  }

  db.close();
}

verify().catch(err => {
  console.error('验证失败:', err);
});
