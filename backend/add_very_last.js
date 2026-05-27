const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');

const dbPath = path.join(__dirname, 'database', 'lab_management.db');
const db = new Database(dbPath);

console.log('=== 最终添加预约排课 ===');

// 先检查
const existing = db.prepare(`
  SELECT id FROM lab_scheduling 
  WHERE source_type = 'Reservation' AND source_id = 1
`).get();

if (existing) {
  console.log('已存在，ID:', existing.id);
} else {
  const reservation = db.prepare('SELECT * FROM lab_reservation WHERE id = 1').get();
  if (reservation) {
    const insert = db.prepare(`
      INSERT INTO lab_scheduling (
        scheduling_code, semester_id, course_name, class_name, teacher_name,
        building_id, building_name, room_id, room_name, room_number,
        week_no, week_day, time_slot_start, time_slot_end, student_count,
        source_type, source_id, status
      ) VALUES (?, 1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Reservation', 1, 1)
    `);
    
    const code = 'RV-' + Date.now() + '-' + Math.floor(Math.random() * 1000);
    insert.run(
      code,
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
      reservation.member_count || 0
    );
    
    console.log('成功添加:', code);
  }
}

// 验证
console.log('');
console.log('=== 第3周排课 ===');
const week3 = db.prepare(`
  SELECT * FROM lab_scheduling WHERE week_no = 3 AND status = 1
`).all();
week3.forEach(s => {
  console.log(`${s.scheduling_code} [${s.source_type}] ${s.course_name} - 周${s.week_day} ${s.time_slot_start} - source_id:${s.source_id}`);
});

db.close();
console.log('');
console.log('完成，现在启动后端服务');
