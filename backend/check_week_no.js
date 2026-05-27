const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');

const dbPath = path.join(__dirname, 'database', 'lab_management.db');
const db = new Database(dbPath);

console.log('=== 检查预约排课的周次字段 ===\n');

// 检查所有预约排课的详细信息
const reservationSchedules = db.prepare(`
  SELECT s.*, r.approval_status
  FROM lab_scheduling s
  LEFT JOIN lab_reservation r ON s.source_id = r.id
  WHERE s.source_type = 'Reservation'
  ORDER BY s.id
`).all();

console.log('预约排课记录：');
reservationSchedules.forEach(s => {
  console.log(`\n  排课编号: ${s.scheduling_code}`);
  console.log(`  课程名称: ${s.course_name}`);
  console.log(`  周次: ${s.week_no}`);
  console.log(`  星期: ${s.week_day}`);
  console.log(`  节次: ${s.time_slot_start}`);
  console.log(`  source_id: ${s.source_id}`);
  console.log(`  预约状态: ${s.approval_status}`);
});

// 检查对应的预约记录
console.log('\n\n预约记录：');
const reservations = db.prepare('SELECT * FROM lab_reservation ORDER BY id').all();
reservations.forEach(r => {
  console.log(`\n  预约编号: ${r.reservation_code}`);
  console.log(`  项目名称: ${r.project_name}`);
  console.log(`  周次: ${r.week_no}`);
  console.log(`  星期: ${r.week_day}`);
  console.log(`  节次: ${r.time_slot}`);
});

db.close();
