const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');

const dbPath = path.join(__dirname, 'database', 'lab_management.db');
const db = new Database(dbPath);

console.log('=== 为所有预约创建排课记录 ===\n');

// 获取所有预约
const allReservations = db.prepare('SELECT * FROM lab_reservation ORDER BY id').all();
console.log(`共 ${allReservations.length} 条预约记录\n`);

let addedCount = 0;
let skippedCount = 0;

allReservations.forEach(r => {
  // 检查是否已有排课
  const existing = db.prepare(
    'SELECT id FROM lab_scheduling WHERE source_type = ? AND source_id = ?'
  ).get('Reservation', r.id);
  
  if (existing) {
    console.log(`✓ 预约 ${r.reservation_code} 已有排课记录，跳过`);
    skippedCount++;
  } else {
    console.log(`✓ 为预约 ${r.reservation_code} (${r.approval_status}) 创建排课记录`);
    
    const schedulingCode = `RV-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    
    const insert = db.prepare(`
      INSERT INTO lab_scheduling (
        scheduling_code, semester_id, course_name, class_name, teacher_name,
        building_id, building_name, room_id, room_name, room_number,
        week_no, week_day, time_slot_start, time_slot_end, student_count,
        source_type, source_id, status
      ) VALUES (?, 1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Reservation', ?, 1)
    `);
    
    insert.run(
      schedulingCode,
      r.project_name,
      r.member_class || '-',
      r.project_leader,
      r.building_id,
      r.building_name,
      r.room_id,
      r.room_name,
      r.room_number,
      r.week_no,
      r.week_day,
      r.time_slot,
      r.time_slot,
      r.member_count || 0,
      r.id
    );
    addedCount++;
  }
});

console.log(`\n完成：添加了 ${addedCount} 条排课记录，跳过 ${skippedCount} 条已存在的记录\n`);

// 验证
console.log('=== 验证结果 ===');
const finalScheduling = db.prepare(
  'SELECT * FROM lab_scheduling WHERE source_type = ? ORDER BY id'
).all('Reservation');
console.log(`现在共有 ${finalScheduling.length} 条预约排课记录：`);
finalScheduling.forEach(s => {
  console.log(`  ${s.scheduling_code}: ${s.course_name} - 周${s.week_no} 周${s.week_day} ${s.time_slot_start}`);
});

db.close();
