const fs = require('fs');
const path = require('path');
const initSqlJs = require('sql.js');

async function testQueries() {
  const SQL = await initSqlJs({
    locateFile: file => `node_modules/sql.js/dist/${file}`
  });

  const dbPath = path.join(__dirname, 'database', 'lab_management.db');
  let db;

  if (fs.existsSync(dbPath)) {
    const data = fs.readFileSync(dbPath);
    db = new SQL.Database(data);
  } else {
    console.log('数据库文件不存在');
    return;
  }

  console.log('=== 测试数据库查询 ===');

  // 测试1: 简单查询
  console.log('\n1. 简单查询所有借还记录:');
  try {
    const result = db.exec('SELECT COUNT(*) as total FROM equ_borrow_record');
    console.log('结果:', result[0]?.values[0][0] || 0);
  } catch (e) {
    console.log('错误:', e.message);
  }

  // 测试2: 带DATE函数的查询
  console.log('\n2. 带DATE函数的查询:');
  try {
    const result = db.exec('SELECT COUNT(*) as total FROM equ_borrow_record WHERE DATE(borrow_date) >= DATE("2026-05-01")');
    console.log('结果:', result[0]?.values[0][0] || 0);
  } catch (e) {
    console.log('错误:', e.message);
  }

  // 测试3: 使用prepare语句
  console.log('\n3. 使用prepare语句:');
  try {
    const stmt = db.prepare('SELECT COUNT(*) as total FROM equ_borrow_record WHERE DATE(borrow_date) >= DATE(?)');
    stmt.bind(['2026-05-01']);
    let result;
    while (stmt.step()) {
      result = stmt.getAsObject();
    }
    stmt.free();
    console.log('结果:', result?.total || 0);
  } catch (e) {
    console.log('错误:', e.message);
  }

  // 测试4: 完整的查询（带JOIN）
  console.log('\n4. 完整的查询（带JOIN）:');
  try {
    const sql = `
      SELECT COUNT(*) as total
      FROM equ_borrow_record b
      LEFT JOIN equ_equipment e ON b.equipment_id = e.id
      LEFT JOIN sys_user a ON b.applicant_id = a.UserID
      WHERE 1=1
    `;
    const result = db.exec(sql);
    console.log('结果:', result[0]?.values[0][0] || 0);
  } catch (e) {
    console.log('错误:', e.message);
  }

  // 测试5: 带参数的完整查询
  console.log('\n5. 带参数的完整查询:');
  try {
    const sql = `
      SELECT COUNT(*) as total
      FROM equ_borrow_record b
      LEFT JOIN equ_equipment e ON b.equipment_id = e.id
      LEFT JOIN sys_user a ON b.applicant_id = a.UserID
      WHERE DATE(b.borrow_date) >= DATE(?)
    `;
    const stmt = db.prepare(sql);
    stmt.bind(['2026-05-01']);
    let result;
    while (stmt.step()) {
      result = stmt.getAsObject();
    }
    stmt.free();
    console.log('结果:', result?.total || 0);
  } catch (e) {
    console.log('错误:', e.message);
  }

  db.close();
}

testQueries().catch(e => console.error(e));
