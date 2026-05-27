const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');

const dbPath = path.join(__dirname, 'database', 'lab_management.db');
const db = new Database(dbPath);

console.log('=== 重新添加预约排课记录 ===');

const reservation = db.prepare('SELECT * FROM lab_reservation WHERE id = ?').get(1);
if (reservation) {
  console.log('处理预约:', reservation.reservation_code, '-', reservation.project_name);
  console.log('时间:', reservation.week_no, reservation.week_day, reservation.time_slot);
  
  const insertStmt = db.prepare(`
    INSERT INTO lab_scheduling (
      scheduling_code, semester_id, course_name, class_name, teacher_name,
      building_id, building_name, room_id, room_name, room_number,
      week_no, week_day, time_slot_start, time_slot_end, student_count,
      source_type, source_id, status
    ) VALUES (?, 1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Reservation', ?, 1)
  `);
  
  const schedulingCode = 'RV-' + Date.now() + '-' + Math.floor(Math.random() * 1000);
  const result = insertStmt.run(
    schedulingCode,
    reservation.project_name,
    reservation.member_class || '-',
    reservation.project_leader,
    reservation.building_id,
    reservation.building_name,
    reservation.room_id,
    reservation.room_name,
    reservation.room_number,
    reservation.week_no,
    reservation.week_day,
    reservation.time_slot,
    reservation.time_slot,
    reservation.member_count || 0,
    1
  );
  
  console.log('成功添加 ID:', result.lastInsertRowid);
  console.log('编号:', schedulingCode);
}

console.log('');
console.log('=== 验证 ===');
const schedules = db.prepare(`
  SELECT s.scheduling_code, s.source_type, s.course_name, 
         s.week_no, s.week_day, s.time_slot_start, s.source_id
  FROM lab_scheduling s
  WHERE s.source_type = 'Reservation'
`).all();
console.log('预约排课数:', schedules.length);
schedules.forEach(s => {
  console.log(`  ${s.scheduling_code}: ${s.course_name} (周${s.week_no},周${s.week_day},${s.time_slot_start}) - source_id:${s.source_id}`);
});

db.close();
console.log('');
console.log('完成');
