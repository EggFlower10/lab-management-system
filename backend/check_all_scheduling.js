const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');

const dbPath = path.join(__dirname, 'database', 'lab_management.db');
const db = new Database(dbPath);

console.log('=== 检查全部排课数据 ===\n');

// 1. 检查所有排课记录
console.log('1. 所有排课记录 (lab_scheduling):');
const allScheduling = db.prepare('SELECT * FROM lab_scheduling ORDER BY id').all();
console.log(`   共 ${allScheduling.length} 条记录`);
allScheduling.forEach(s => {
  console.log(`   ID:${s.id}, 类型:${s.source_type}, 课程:${s.course_name}, 周次:${s.week_no}, 周${s.week_day}, ${s.time_slot_start}, 状态:${s.status}`);
});

// 2. 检查所有预约记录
console.log('\n2. 所有预约记录 (lab_reservation):');
const allReservations = db.prepare('SELECT * FROM lab_reservation ORDER BY id').all();
console.log(`   共 ${allReservations.length} 条记录`);
allReservations.forEach(r => {
  console.log(`   ID:${r.id}, 编号:${r.reservation_code}, 项目:${r.project_name}, 状态:${r.approval_status}, 周次:${r.week_no}, 周${r.week_day}, ${r.time_slot}`);
});

// 3. 检查排课和预约的关联
console.log('\n3. 预约与排课的关联检查:');
allReservations.forEach(r => {
  const hasScheduling = allScheduling.some(s => 
    s.source_type === 'Reservation' && s.source_id === r.id
  );
  if (hasScheduling) {
    console.log(`   ✓ 预约 ${r.reservation_code} 已关联到排课`);
  } else {
    console.log(`   ✗ 预约 ${r.reservation_code} 未关联到排课 (状态: ${r.approval_status})`);
  }
});

db.close();
