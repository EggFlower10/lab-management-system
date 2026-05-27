// 模拟后端的数据库查询逻辑
const fs = require('fs');
const path = require('path');
const initSqlJs = require('sql.js');

async function main() {
  const SQL = await initSqlJs({
    locateFile: file => `node_modules/sql.js/dist/${file}`
  });

  const dbPath = path.join(__dirname, 'database', 'lab_management.db');
  const data = fs.readFileSync(dbPath);
  const db = new SQL.Database(data);

  // 模拟后端的pool.query实现
  const pool = {
    query: (sql, params = []) => {
      return new Promise((resolve, reject) => {
        console.log(`执行SQL: ${sql}`);
        console.log(`参数:`, params);
        
        try {
          const upperSql = sql.toUpperCase();
          
          if (upperSql.startsWith('INSERT') || upperSql.startsWith('UPDATE') || 
              upperSql.startsWith('DELETE') || upperSql.startsWith('DROP') ||
              upperSql.startsWith('CREATE') || upperSql.startsWith('ALTER') ||
              upperSql.startsWith('PRAGMA')) {
            db.run(sql);
            resolve([{ affectedRows: 0 }]);
            return;
          }

          let results = [];

          try {
            const stmt = db.prepare(sql);
            
            if (params.length > 0) {
              const safeParams = params.map(p => p === undefined ? null : p);
              console.log('绑定参数:', safeParams);
              stmt.bind(safeParams);
            }
            
            while (stmt.step()) {
              results.push(stmt.getAsObject());
            }
            stmt.free();
            console.log('查询结果:', results.length, '条');
          } catch (e) {
            console.error('prepare失败:', e.message);
            if (params.length === 0) {
              const execResults = db.exec(sql);
              if (execResults.length > 0 && execResults[0].values) {
                const columns = execResults[0].columns;
                execResults[0].values.forEach(row => {
                  const obj = {};
                  row.forEach((val, idx) => {
                    obj[columns[idx]] = val;
                  });
                  results.push(obj);
                });
              }
            } else {
              throw e;
            }
          }

          if (upperSql.startsWith('INSERT') || upperSql.startsWith('UPDATE') || upperSql.startsWith('DELETE')) {
            const changes = db.getRowsModified();
            const insertId = typeof db.lastInsertRowid === 'function' ? db.lastInsertRowid() : db.lastInsertRowid || 0;
            resolve([{ insertId: insertId, affectedRows: changes }]);
          } else {
            resolve([results]);
          }
        } catch (error) {
          console.error('SQL执行错误:', error.message);
          reject(error);
        }
      });
    }
  };

  // 模拟借还流水API的逻辑
  console.log('=== 模拟借还流水API查询 ===\n');

  // 测试1: 无日期筛选
  console.log('--- 测试1: 无日期筛选 ---');
  let countSql = `
    SELECT COUNT(*) as total
    FROM equ_borrow_record b
    LEFT JOIN equ_equipment e ON b.equipment_id = e.id
    LEFT JOIN sys_user a ON b.applicant_id = a.UserID
    WHERE 1=1
  `;
  let sql = `
    SELECT b.*, 
           e.name as equipment_name,
           e.asset_code,
           a.RealName as applicant_name
    FROM equ_borrow_record b
    LEFT JOIN equ_equipment e ON b.equipment_id = e.id
    LEFT JOIN sys_user a ON b.applicant_id = a.UserID
    WHERE 1=1
  `;
  const params = [];

  try {
    const [countResult] = await pool.query(countSql, params.slice(0, params.length / 2));
    const total = countResult[0]?.total || 0;
    console.log('总数:', total);

    const offset = 0;
    sql += ` ORDER BY b.created_at DESC LIMIT ? OFFSET ?`;
    params.push(20, offset);

    const [rows] = await pool.query(sql, params);
    console.log('查询到', rows.length, '条数据');
  } catch (e) {
    console.error('错误:', e.message);
  }

  // 测试2: 带日期筛选
  console.log('\n--- 测试2: 带日期筛选 ---');
  countSql = `
    SELECT COUNT(*) as total
    FROM equ_borrow_record b
    LEFT JOIN equ_equipment e ON b.equipment_id = e.id
    LEFT JOIN sys_user a ON b.applicant_id = a.UserID
    WHERE 1=1
  `;
  sql = `
    SELECT b.*, 
           e.name as equipment_name,
           e.asset_code,
           a.RealName as applicant_name
    FROM equ_borrow_record b
    LEFT JOIN equ_equipment e ON b.equipment_id = e.id
    LEFT JOIN sys_user a ON b.applicant_id = a.UserID
    WHERE 1=1
  `;
  const params2 = [];

  const start_date = '2026-05-01';
  const end_date = '2026-05-31';

  if (start_date) {
    sql += ' AND DATE(b.borrow_date) >= DATE(?)';
    countSql += ' AND DATE(b.borrow_date) >= DATE(?)';
    params2.push(start_date, start_date);
  }
  if (end_date) {
    sql += ' AND DATE(b.borrow_date) <= DATE(?)';
    countSql += ' AND DATE(b.borrow_date) <= DATE(?)';
    params2.push(end_date, end_date);
  }

  try {
    console.log('countSql:', countSql);
    console.log('countParams:', params2.slice(0, params2.length / 2));
    const [countResult] = await pool.query(countSql, params2.slice(0, params2.length / 2));
    const total = countResult[0]?.total || 0;
    console.log('总数:', total);

    const offset = 0;
    sql += ` ORDER BY b.created_at DESC LIMIT ? OFFSET ?`;
    params2.push(20, offset);

    console.log('sql:', sql);
    console.log('params:', params2);
    const [rows] = await pool.query(sql, params2);
    console.log('查询到', rows.length, '条数据');
  } catch (e) {
    console.error('错误:', e.message);
  }

  db.close();
}

main().catch(e => console.error(e));
