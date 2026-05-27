const fs = require('fs');
const path = require('path');
const initSqlJs = require('sql.js');

async function check() {
  const dbPath = path.join(__dirname, 'database', 'lab_management.db');
  console.log('检查数据库:', dbPath);
  
  const SQL = await initSqlJs({ locateFile: file => `node_modules/sql.js/dist/${file}` });
  const data = fs.readFileSync(dbPath);
  const db = new SQL.Database(new Uint8Array(data));
  
  console.log('');
  console.log('=== 检查表 ===');
  const tables = db.exec('SELECT name FROM sqlite_master WHERE type="table"');
  const tableNames = tables[0]?.values.map(t => t[0]) || [];
  console.log('表列表:', tableNames);
  
  console.log('');
  console.log('=== 检查 sys_user ===');
  const hasUserTable = tableNames.includes('sys_user');
  if (hasUserTable) {
    const users = db.exec('SELECT * FROM sys_user');
    if (users.length > 0) {
      console.log('用户数:', users[0].values.length);
      users[0].values.forEach(u => console.log('  ', u[1]));
    }
  } else {
    console.log('缺少 sys_user 表!');
  }
  
  console.log('');
  console.log('=== 检查 lab_reservation ===');
  if (tableNames.includes('lab_reservation')) {
    const res = db.exec('SELECT * FROM lab_reservation');
    console.log('预约数:', res[0]?.values.length || 0);
  }
  
  console.log('');
  console.log('=== 检查 lab_scheduling ===');
  if (tableNames.includes('lab_scheduling')) {
    const s = db.exec('SELECT * FROM lab_scheduling');
    console.log('排课数:', s[0]?.values.length || 0);
  }
  
  db.close();
}

check().catch(console.error);
