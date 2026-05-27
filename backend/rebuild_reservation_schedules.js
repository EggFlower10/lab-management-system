const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');

const dbPath = path.join(__dirname, 'database', 'lab_management.db');
const db = new Database(dbPath);

console.log('=== 重建预约排课记录 ===\n');

// 删除所有预约排课
db.prepare('DELETE FROM lab_scheduling WHERE source_type = ?').run('Reservation');
console.log('已删除所有预约排课记录\n');

// 获取所有预约
const reservations = db.prepare('SELECT * FROM lab_reservation ORDER BY id').all();
console.log(`处理 ${reservations.length} 条预约记录：\n`);

reservations.forEach(r => {
  const schedulingCode = `RV-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  
  console.log(`创建排课 ${schedulingCode} 对应预约 ${r.reservation_code}`);
  console.log(`  项目: ${r.project_name}`);
  console.log(`  周次: ${r.week_no}, 星期: ${r.week_day}, 节次: ${r.time_slot}`);
  
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
console.log('\n=== 验证结果 ===');
const newSchedules = db.prepare(`
  SELECT s.*, r.approval_status
  FROM lab_scheduling s
  LEFT JOIN lab_reservation r ON s.source_id = r.id
  WHERE s.source_type = 'Reservation'
  ORDER BY s.week_no, s.week_day
`).all();

console.log(`\n成功创建 ${newSchedules.length} 条预约排课记录：`);
newSchedules.forEach(s => {
  console.log(`  ${s.scheduling_code}: ${s.course_name} - 周${s.week_no} 周${s.week_day} ${s.time_slot_start} (${s.approval_status})`);
});

db.close();
console.log('\n完成！现在需要重启后端服务。');
