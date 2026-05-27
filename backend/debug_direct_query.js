const fs = require('fs');
const path = require('path');
const initSqlJs = require('sql.js');

async function testDirectQuery() {
  const SQL = await initSqlJs({
    locateFile: file => `node_modules/sql.js/dist/${file}`
  });

  const dbPath = path.join(__dirname, 'database', 'lab_management.db');
  const data = fs.readFileSync(dbPath);
  const db = new SQL.Database(data);

  console.log('=== 直接测试数据库查询 ===\n');

  // 测试1: 直接执行查询
  console.log('--- 测试1: 直接exec查询 ---');
  const sql = `
    SELECT b.*, 
           e.name as equipment_name,
           e.asset_code,
           a.RealName as applicant_name
    FROM equ_borrow_record b
    LEFT JOIN equ_equipment e ON b.equipment_id = e.id
    LEFT JOIN sys_user a ON b.applicant_id = a.UserID
    WHERE 1=1
    ORDER BY b.created_at DESC LIMIT 20 OFFSET 0
  `;
  console.log('SQL:', sql);
  
  const results = db.exec(sql);
  console.log('exec结果:', results.length, '个结果集');
  
  if (results.length > 0) {
    console.log('列:', results[0].columns);
    console.log('行数:', results[0].values.length);
    if (results[0].values.length > 0) {
      console.log('第一行:', results[0].values[0]);
    }
  }

  // 测试2: 转换为对象
  console.log('\n--- 测试2: 转换为对象 ---');
  const rows = [];
  if (results.length > 0 && results[0].values) {
    const columns = results[0].columns;
    results[0].values.forEach(row => {
      const obj = {};
      row.forEach((val, idx) => {
        obj[columns[idx]] = val;
      });
      rows.push(obj);
    });
  }
  console.log('转换后行数:', rows.length);
  if (rows.length > 0) {
    console.log('第一个对象:', JSON.stringify(rows[0], null, 2));
  }

  // 测试3: 带日期条件
  console.log('\n--- 测试3: 带日期条件 ---');
  const dateSql = `
    SELECT COUNT(*) as total
    FROM equ_borrow_record b
    LEFT JOIN equ_equipment e ON b.equipment_id = e.id
    LEFT JOIN sys_user a ON b.applicant_id = a.UserID
    WHERE b.borrow_date >= '2026-05-01' AND b.borrow_date <= '2026-05-31 23:59:59'
  `;
  const dateResult = db.exec(dateSql);
  console.log('日期筛选结果:', dateResult.length > 0 && dateResult[0].values.length > 0 ? dateResult[0].values[0][0] : 0);

  db.close();
}

testDirectQuery().catch(e => console.error(e));
