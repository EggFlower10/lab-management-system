const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');

const dbPath = path.join(__dirname, 'database', 'lab_management.db');
const db = new Database(dbPath);

console.log('=== 添加预约排课记录 ===');

// 检查 RES001 是否已存在排课
const existing = db.prepare(`
  SELECT id FROM lab_scheduling 
  WHERE source_type = 'Reservation' AND source_id = ?
`).get(1);

if (existing) {
  console.log('已存在，跳过');
} else {
  console.log('添加预约排课记录...');
  
  // 获取 RES001 的预约信息
  const reservation = db.prepare('SELECT * FROM lab_reservation WHERE id = ?').get(1);
  if (reservation) {
    const insertStmt = db.prepare(`
      INSERT INTO lab_scheduling (
        scheduling_code, semester_id, course_name, class_name, teacher_name,
        building_id, building_name, room_id, room_name, room_number,
        week_no, week_day, time_slot_start, time_slot_end, student_count,
        source_type, source_id, status
      ) VALUES (?, 1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Reservation', ?, 1)
    `);
    
    const schedulingCode = 'RV-' + Date.now();
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
    
    console.log('成功添加记录 ID:', result.lastInsertRowid);
    console.log('排课编号:', schedulingCode);
  } else {
    console.log('预约 RES001 不存在');
  }
}

// 验证
console.log('');
console.log('=== 验证 ===');
const schedules = db.prepare(`
  SELECT s.scheduling_code, s.source_type, s.course_name, 
         s.week_no, s.week_day, s.time_slot_start
  FROM lab_scheduling s
  WHERE s.source_type = 'Reservation'
  ORDER BY s.id
`).all();
console.log('预约排课记录数:', schedules.length);
schedules.forEach(s => {
  console.log(`  ${s.scheduling_code}: ${s.course_name} (周${s.week_no}, 周${s.week_day}, ${s.time_slot_start})`);
});

db.close();
console.log('');
console.log('完成');
