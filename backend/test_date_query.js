const fs = require('fs');
const path = require('path');
const initSqlJs = require('sql.js');

async function testDateQuery() {
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

  console.log('=== 测试日期查询 ===');
  
  // 测试1: 查询所有借还记录
  console.log('\n1. 查询所有借还记录:');
  const allRecords = db.exec('SELECT borrow_code, borrow_date FROM equ_borrow_record');
  if (allRecords.length > 0) {
    console.log('列:', allRecords[0].columns);
    allRecords[0].values.forEach(row => {
      console.log(row);
    });
  }

  // 测试2: 测试日期筛选查询（模拟前端传递的参数格式）
  console.log('\n2. 测试日期筛选 (2026-05-01 到 2026-05-31):');
  const dateFiltered = db.exec(`
    SELECT borrow_code, borrow_date 
    FROM equ_borrow_record 
    WHERE borrow_date >= '2026-05-01' AND borrow_date <= '2026-05-31'
  `);
  if (dateFiltered.length > 0) {
    console.log('找到记录:', dateFiltered[0].values.length);
    dateFiltered[0].values.forEach(row => {
      console.log(row);
    });
  } else {
    console.log('未找到记录');
  }

  // 测试3: 测试2024年的数据
  console.log('\n3. 测试2024年数据:');
  const year2024 = db.exec(`
    SELECT borrow_code, borrow_date 
    FROM equ_borrow_record 
    WHERE borrow_date >= '2024-09-01' AND borrow_date <= '2024-09-30'
  `);
  if (year2024.length > 0) {
    console.log('找到记录:', year2024[0].values.length);
    year2024[0].values.forEach(row => {
      console.log(row);
    });
  } else {
    console.log('未找到记录');
  }

  // 测试4: 测试不带日期筛选的查询
  console.log('\n4. 测试不带日期筛选:');
  const noFilter = db.exec(`
    SELECT COUNT(*) as total 
    FROM equ_borrow_record b
    LEFT JOIN equ_equipment e ON b.equipment_id = e.id
    LEFT JOIN sys_user a ON b.applicant_id = a.UserID
  `);
  if (noFilter.length > 0) {
    console.log('总数:', noFilter[0].values[0][0]);
  }

  db.close();
}

testDateQuery().catch(e => console.error(e));
