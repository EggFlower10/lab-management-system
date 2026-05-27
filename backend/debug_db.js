const fs = require('fs');
const path = require('path');
const initSqlJs = require('sql.js');

async function debug() {
  const SQL = await initSqlJs({
    locateFile: file => `node_modules/sql.js/dist/${file}`
  });

  const dbPath = path.join(__dirname, 'database', 'lab_management.db');
  
  console.log('数据库路径:', dbPath);
  const data = fs.readFileSync(dbPath);
  console.log('原始文件大小:', data.length, 'bytes');

  const db = new SQL.Database(new Uint8Array(data));

  // 检查表结构
  console.log('');
  console.log('=== 表结构 ===');
  const tables = db.exec("SELECT name, sql FROM sqlite_master WHERE type='table'");
  if (tables.length > 0) {
    tables[0].values.forEach(row => {
      console.log(`表名: ${row[0]}`);
    });
  }

  // 检查 lab_scheduling 表的结构
  console.log('');
  console.log('=== lab_scheduling 表结构 ===');
  const schema = db.exec("PRAGMA table_info(lab_scheduling)");
  if (schema.length > 0) {
    schema[0].values.forEach(row => {
      console.log(`${row[1]} (${row[2]})`);
    });
  }

  // 检查当前的排课记录
  console.log('');
  console.log('=== 当前排课记录数 ===');
  const count = db.exec("SELECT COUNT(*) FROM lab_scheduling");
  console.log('总记录数:', count[0].values[0][0]);

  console.log('');
  console.log('=== 第3周排课记录 ===');
  const week3 = db.exec("SELECT id, scheduling_code, source_type, week_no, week_day, time_slot_start, status FROM lab_scheduling WHERE week_no = 3");
  if (week3.length > 0) {
    week3[0].values.forEach(row => {
      console.log(`${row[1]} | ${row[2]} | 周${row[3]} 周${row[4]} ${row[5]} | 状态:${row[6]}`);
    });
  }

  // 检查预约记录
  console.log('');
  console.log('=== 预约记录 ===');
  const reservations = db.exec("SELECT id, reservation_code, approval_status, week_no, week_day, time_slot FROM lab_reservation");
  if (reservations.length > 0) {
    reservations[0].values.forEach(row => {
      console.log(`${row[1]} | ${row[2]} | 周${row[3]} 周${row[4]} ${row[5]}`);
    });
  }

  // 尝试插入一条测试记录
  console.log('');
  console.log('=== 测试插入 ===');
  try {
    const testCode = 'TEST-' + Date.now();
    db.run(`INSERT INTO lab_scheduling (scheduling_code, semester_id, course_name, week_no, week_day, time_slot_start, time_slot_end, source_type, status) VALUES ('${testCode}', 1, '测试课程', 3, 3, '5-6', '5-6', 'Test', 1)`);
    console.log('插入成功');
    
    const newCount = db.exec("SELECT COUNT(*) FROM lab_scheduling");
    console.log('插入后总记录数:', newCount[0].values[0][0]);
    
    const exportSize = db.export().byteLength;
    console.log('导出数据大小:', exportSize, 'bytes');
    
    // 删除测试记录
    db.run(`DELETE FROM lab_scheduling WHERE scheduling_code = '${testCode}'`);
    console.log('删除测试记录成功');
  } catch (err) {
    console.error('插入失败:', err);
  }

  db.close();
}

debug().catch(err => {
  console.error('调试失败:', err);
});
