const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');

const dbPath = path.join(__dirname, 'database', 'lab_management.db');
const db = new Database(dbPath);

console.log('=== 最终检查数据库 ===\n');

// 检查第3周的排课
console.log('1. 第3周所有排课：');
const week3 = db.prepare(
  'SELECT * FROM lab_scheduling WHERE week_no = 3 AND status = 1 ORDER BY week_day, time_slot_start'
).all();
week3.forEach(s => {
  console.log(`   ${s.scheduling_code} [${s.source_type}] ${s.course_name} - 周${s.week_day} ${s.time_slot_start} (source_id: ${s.source_id})`);
});

console.log('\n2. 所有预约排课：');
const resSchedules = db.prepare(
  'SELECT s.*, r.approval_status FROM lab_scheduling s LEFT JOIN lab_reservation r ON s.source_id = r.id WHERE s.source_type = ?'
).all('Reservation');
resSchedules.forEach(s => {
  console.log(`   ${s.scheduling_code} - ${s.course_name} (状态: ${s.approval_status})`);
});

console.log('\n3. 所有预约记录：');
const reservations = db.prepare('SELECT * FROM lab_reservation').all();
reservations.forEach(r => {
  console.log(`   ${r.reservation_code} - ${r.project_name} (状态: ${r.approval_status})`);
});

db.close();
