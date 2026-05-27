const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');

const dbPath = path.join(__dirname, 'database', 'lab_management.db');
const db = new Database(dbPath);

console.log('=== 全面检查排课检索功能 ===\n');

// 1. 检查所有排课记录
console.log('1. 所有排课记录 (lab_scheduling):');
const allScheduling = db.prepare(`
  SELECT s.*, r.approval_status as reservation_status
  FROM lab_scheduling s
  LEFT JOIN lab_reservation r ON s.source_id = r.id AND s.source_type = 'Reservation'
  ORDER BY s.source_type, s.week_no, s.week_day, s.time_slot_start
`).all();

const stats = {
  CentralScheduling: 0,
  Reservation: 0,
  PendingReservation: 0
};

allScheduling.forEach(s => {
  stats[s.source_type] = (stats[s.source_type] || 0) + 1;
  const status = s.source_type === 'Reservation' ? `(${s.reservation_status})` : '';
  console.log(`   ${s.scheduling_code} [${s.source_type}] ${s.course_name} - 周${s.week_no} 周${s.week_day} ${s.time_slot_start} ${status}`);
});

console.log(`\n统计：集中排课 ${stats.CentralScheduling} 条，已批准预约 ${stats.Reservation} 条\n`);

// 2. 检查所有预约记录及其排课关联
console.log('2. 预约记录与排课关联检查:');
const allReservations = db.prepare('SELECT * FROM lab_reservation ORDER BY id').all();
allReservations.forEach(r => {
  const hasScheduling = db.prepare(`
    SELECT id FROM lab_scheduling WHERE source_type = 'Reservation' AND source_id = ?
  `).get(r.id);
  
  if (hasScheduling) {
    console.log(`   ✓ 预约 ${r.reservation_code} (${r.approval_status}) - 已关联排课`);
  } else {
    console.log(`   ✗ 预约 ${r.reservation_code} (${r.approval_status}) - 未关联排课！`);
  }
});

// 3. 检查待审批预约是否会被API返回
console.log('\n3. 待审批预约检查（API会单独查询）:');
const pendingReservations = db.prepare(`
  SELECT * FROM lab_reservation WHERE approval_status = 'pending'
`).all();
console.log(`   待审批预约数量: ${pendingReservations.length}`);
pendingReservations.forEach(r => {
  console.log(`   ${r.reservation_code}: ${r.project_name} - 周${r.week_no} 周${r.week_day} ${r.time_slot}`);
});

// 4. 检查授课申请
console.log('\n4. 授课申请检查:');
const teachingRequests = db.prepare(`
  SELECT * FROM lab_teaching_request WHERE approval_status = 'pending'
`).all();
console.log(`   待审批授课申请数量: ${teachingRequests.length}`);
teachingRequests.forEach(t => {
  console.log(`   ${t.request_code}: ${t.course_name} - 周${t.week_no} 周${t.week_day} ${t.time_slot}`);
});

db.close();

console.log('\n=== 检查总结 ===');
console.log(`✓ 排课总数: ${allScheduling.length} 条`);
console.log(`✓ 集中排课: ${stats.CentralScheduling} 条`);
console.log(`✓ 已批准预约排课: ${stats.Reservation} 条`);
console.log(`✓ 待审批预约: ${pendingReservations.length} 条 (API单独返回)`);
console.log(`✓ 待审批授课申请: ${teachingRequests.length} 条 (API单独返回)`);
