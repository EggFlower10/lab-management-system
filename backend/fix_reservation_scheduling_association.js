const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');

const dbPath = path.join(__dirname, 'database', 'lab_management.db');
const db = new Database(dbPath);

console.log('=== 修复预约与排课的关联 ===\n');

// 1. 先删除所有没有正确关联的预约排课
const deleted = db.prepare(`
  DELETE FROM lab_scheduling 
  WHERE source_type = 'Reservation' AND (source_id IS NULL OR source_id = 0)
`).run();
console.log(`已删除 ${deleted.changes} 条无效的预约排课记录\n`);

// 2. 为每个预约创建正确的排课记录
const allReservations = db.prepare('SELECT * FROM lab_reservation ORDER BY id').all();
console.log(`处理 ${allReservations.length} 条预约记录：\n`);

allReservations.forEach(r => {
  // 检查是否已有正确关联的排课
  const existing = db.prepare(`
    SELECT id FROM lab_scheduling 
    WHERE source_type = 'Reservation' AND source_id = ?
  `).get(r.id);
  
  if (existing) {
    console.log(`✓ 预约 ${r.reservation_code} (${r.approval_status}) - 已有排课记录`);
  } else {
    const schedulingCode = `RV-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    console.log(`✓ 为预约 ${r.reservation_code} (${r.approval_status}) 创建排课 ${schedulingCode}`);
    
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
  }
});

// 3. 最终验证
console.log('\n=== 最终验证 ===');

console.log('\n1. 所有排课记录:');
const allSchedules = db.prepare(`
  SELECT s.*, r.approval_status as reservation_status
  FROM lab_scheduling s
  LEFT JOIN lab_reservation r ON s.source_id = r.id AND s.source_type = 'Reservation'
  ORDER BY s.source_type, s.week_no, s.week_day
`).all();

const finalStats = {
  CentralScheduling: 0,
  Reservation: 0
};

allSchedules.forEach(s => {
  finalStats[s.source_type] = (finalStats[s.source_type] || 0) + 1;
  const status = s.source_type === 'Reservation' ? `(${s.reservation_status})` : '';
  console.log(`   ${s.scheduling_code} [${s.source_type}] ${s.course_name} - 周${s.week_no} 周${s.week_day} ${status}`);
});

console.log('\n2. 预约与排课关联检查:');
const reservations = db.prepare('SELECT * FROM lab_reservation ORDER BY id').all();
reservations.forEach(r => {
  const schedule = db.prepare(`
    SELECT scheduling_code FROM lab_scheduling 
    WHERE source_type = 'Reservation' AND source_id = ?
  `).get(r.id);
  console.log(`   ✓ ${r.reservation_code} (${r.approval_status}) -> ${schedule?.scheduling_code || '无'}`);
});

console.log('\n3. 待审批数据（API单独返回）:');
const pendingReservations = db.prepare('SELECT * FROM lab_reservation WHERE approval_status = "pending"').all();
console.log(`   待审批预约: ${pendingReservations.length} 条`);

const pendingTeaching = db.prepare('SELECT * FROM lab_teaching_request WHERE approval_status = "pending"').all();
console.log(`   待审批授课申请: ${pendingTeaching.length} 条`);

db.close();

console.log('\n=== 修复完成 ===');
console.log(`总计排课: ${allSchedules.length} 条`);
console.log(`集中排课: ${finalStats.CentralScheduling} 条`);
console.log(`预约排课: ${finalStats.Reservation} 条`);
