const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');

const dbPath = path.join(__dirname, 'database', 'lab_management.db');
const db = new Database(dbPath);

console.log('=== 重新创建所有预约排课记录 ===\n');

// 先清理所有旧的预约排课
db.prepare('DELETE FROM lab_scheduling WHERE source_type = ?').run('Reservation');
console.log('已清理旧的预约排课记录\n');

// 获取所有预约
const allReservations = db.prepare('SELECT * FROM lab_reservation ORDER BY id').all();

console.log('共', allReservations.length, '条预约记录');

// 为每个预约创建排课
allReservations.forEach(r => {
  const schedulingCode = `RV-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  
  console.log(`\n✓ 为预约 ${r.reservation_code} 创建排课 ${schedulingCode}`);
  
  db.prepare(`
    INSERT INTO lab_scheduling (
      scheduling_code, semester_id, course_name, class_name, teacher_name,
      building_id, building_name, room_id, room_name, room_number,
      week_no, week_day, time_slot_start, time_slot_end, student_count,
      source_type, source_id, status
    ) VALUES (?, 1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Reservation', ?, 1)
  `).run(
    schedulingCode, r.project_name, r.member_class || '-', r.project_leader,
    r.building_id, r.building_name, r.room_id, r.room_name, r.room_number,
    r.week_no, r.week_day, r.time_slot, r.time_slot, r.member_count || 0, r.id
  );
});

// 验证
console.log('\n=== 最终验证 ===');
const week3Schedules = db.prepare(
  'SELECT * FROM lab_scheduling WHERE week_no = 3 AND status = 1 ORDER BY week_day, time_slot_start'
).all();
console.log('第3周排课：');
week3Schedules.forEach(s => {
  console.log(`   ${s.scheduling_code} [${s.source_type}] ${s.course_name} - 周${s.week_day} ${s.time_slot_start}`);
});

console.log('\n所有预约排课：');
const resSchedules = db.prepare(
  'SELECT s.*, r.approval_status FROM lab_scheduling s LEFT JOIN lab_reservation r ON s.source_id = r.id WHERE s.source_type = ?'
).all('Reservation');
resSchedules.forEach(s => {
  console.log(`   ${s.scheduling_code} - ${s.course_name} (状态: ${s.approval_status})`);
});

db.close();
console.log('\n完成！');
