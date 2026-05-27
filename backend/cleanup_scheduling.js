const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');

const dbPath = path.join(__dirname, 'database', 'lab_management.db');
const db = new Database(dbPath);

console.log('=== 清理排课记录 ===');

// 查找没有正确关联 source_id 的预约排课
const badRecords = db.prepare(`
  SELECT id, scheduling_code FROM lab_scheduling 
  WHERE source_type = 'Reservation' AND source_id IS NULL
`).all();

console.log('找到', badRecords.length, '条需要修复的记录');

if (badRecords.length > 0) {
  badRecords.forEach(r => {
    db.prepare('DELETE FROM lab_scheduling WHERE id = ?').run(r.id);
    console.log('删除:', r.scheduling_code);
  });
}

// 检查最终结果
console.log('');
console.log('=== 最终状态 ===');
const final = db.prepare(`
  SELECT s.scheduling_code, s.source_type, s.course_name, 
         s.week_no, s.week_day, s.time_slot_start, s.source_id
  FROM lab_scheduling s
  WHERE s.source_type = 'Reservation'
  ORDER BY s.id
`).all();
console.log('预约排课记录数:', final.length);
final.forEach(s => {
  console.log(`  ${s.scheduling_code}: ${s.course_name} (周${s.week_no}, 周${s.week_day}, ${s.time_slot_start}) - source_id: ${s.source_id}`);
});

db.close();
console.log('');
console.log('完成');
