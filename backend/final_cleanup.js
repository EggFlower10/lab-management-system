const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');

const dbPath = path.join(__dirname, 'database', 'lab_management.db');
const db = new Database(dbPath);

console.log('=== 最终清理 ===');

// 删除没有 source_id 的旧预约排课
const toDelete = db.prepare(`
  SELECT id, scheduling_code FROM lab_scheduling 
  WHERE source_type = 'Reservation' AND (source_id IS NULL OR source_id = 0)
`).all();

toDelete.forEach(r => {
  db.prepare('DELETE FROM lab_scheduling WHERE id = ?').run(r.id);
  console.log('删除:', r.scheduling_code);
});

console.log('');
console.log('=== 最终验证 ===');
const final = db.prepare(`
  SELECT s.scheduling_code, s.source_type, s.course_name, 
         s.week_no, s.week_day, s.time_slot_start, s.source_id
  FROM lab_scheduling s
  WHERE s.source_type = 'Reservation'
`).all();
console.log('有效预约排课记录数:', final.length);
final.forEach(s => {
  console.log(`  ${s.scheduling_code}: ${s.course_name} (周${s.week_no},周${s.week_day},${s.time_slot_start}) - source_id:${s.source_id}`);
});

console.log('');
console.log('=== 第3周所有排课 ===');
const week3 = db.prepare(`
  SELECT s.scheduling_code, s.source_type, s.course_name, 
         s.week_no, s.week_day, s.time_slot_start
  FROM lab_scheduling s
  WHERE s.week_no = 3 AND s.status = 1
  ORDER BY s.week_day, s.time_slot_start
`).all();
console.log('第3周排课数:', week3.length);
week3.forEach(s => {
  console.log(`  ${s.scheduling_code} [${s.source_type}] ${s.course_name} (周${s.week_day},${s.time_slot_start})`);
});

db.close();
console.log('');
console.log('数据库准备完毕');
