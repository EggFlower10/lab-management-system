const fs = require('fs');
const path = require('path');
const initSqlJs = require('sql.js');

async function checkTable() {
  const SQL = await initSqlJs({
    locateFile: file => `node_modules/sql.js/dist/${file}`
  });

  const dbPath = path.join(__dirname, 'database', 'lab_management.db');
  const data = fs.readFileSync(dbPath);
  const db = new SQL.Database(data);

  console.log('=== 检查表结构 ===');
  
  // 检查表结构
  const tableInfo = db.exec("PRAGMA table_info(equ_borrow_record)");
  console.log('\n1. equ_borrow_record 表结构:');
  if (tableInfo.length > 0) {
    tableInfo[0].values.forEach(row => {
      console.log(`${row[1]} (${row[2]})`);
    });
  }

  // 查询所有记录
  console.log('\n2. 所有借还记录:');
  const records = db.exec("SELECT id, borrow_code, borrow_date, created_at FROM equ_borrow_record");
  if (records.length > 0) {
    console.log('共', records[0].values.length, '条记录');
    records[0].values.forEach(row => {
      console.log(`ID: ${row[0]}, 编号: ${row[1]}, 借期: ${row[2]}, 创建时间: ${row[3]}`);
    });
  }

  // 测试JOIN查询
  console.log('\n3. 测试JOIN查询:');
  const joinResult = db.exec(`
    SELECT b.id, b.borrow_code, e.name as equipment_name, a.RealName as applicant_name
    FROM equ_borrow_record b
    LEFT JOIN equ_equipment e ON b.equipment_id = e.id
    LEFT JOIN sys_user a ON b.applicant_id = a.UserID
  `);
  if (joinResult.length > 0) {
    console.log('JOIN查询结果:', joinResult[0].values.length, '条');
    joinResult[0].values.forEach(row => {
      console.log(`ID: ${row[0]}, 编号: ${row[1]}, 设备: ${row[2]}, 借用人: ${row[3]}`);
    });
  }

  db.close();
}

checkTable().catch(e => console.error(e));
