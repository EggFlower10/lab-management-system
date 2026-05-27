// 检查实际的pool.query实现
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

  // 模拟实际的pool.query实现（从app.js复制）
  const pool = {
    query: (sql, params = []) => {
      return new Promise((resolve, reject) => {
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

          // 统一使用 prepare 语句执行所有查询
          try {
            const stmt = db.prepare(sql);
            
            if (params.length > 0) {
              const safeParams = params.map(p => p === undefined ? null : p);
              stmt.bind(safeParams);
            }
            
            while (stmt.step()) {
              results.push(stmt.getAsObject());
            }
            stmt.free();
          } catch (e) {
            console.error('prepare失败:', e.message);
            // 如果 prepare 失败，尝试使用 exec 方式（仅用于无参数查询）
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

          // 检查是否是 INSERT/UPDATE/DELETE 语句
          if (upperSql.startsWith('INSERT') || upperSql.startsWith('UPDATE') || upperSql.startsWith('DELETE')) {
            const changes = db.getRowsModified();
            const insertId = typeof db.lastInsertRowid === 'function' ? db.lastInsertRowid() : db.lastInsertRowid || 0;
            resolve([{ insertId: insertId, affectedRows: changes }]);
          } else {
            resolve([results]);
          }
        } catch (error) {
          console.error('SQL执行错误:', error.message, 'SQL:', sql.substring(0, 100), 'Params:', params);
          reject(error);
        }
      });
    }
  };

  console.log('=== 测试实际的pool.query ===\n');

  // 测试1: 简单查询
  console.log('--- 测试1: COUNT查询 ---');
  try {
    const countSql = `
      SELECT COUNT(*) as total
      FROM equ_borrow_record b
      LEFT JOIN equ_equipment e ON b.equipment_id = e.id
      LEFT JOIN sys_user a ON b.applicant_id = a.UserID
      WHERE 1=1
    `;
    const [countResult] = await pool.query(countSql, []);
    console.log('COUNT结果:', countResult[0]?.total || 0);
  } catch (e) {
    console.error('错误:', e.message);
  }

  // 测试2: 完整查询
  console.log('\n--- 测试2: 完整查询 ---');
  try {
    const sql = `
      SELECT b.*, 
             e.name as equipment_name,
             e.asset_code,
             a.RealName as applicant_name
      FROM equ_borrow_record b
      LEFT JOIN equ_equipment e ON b.equipment_id = e.id
      LEFT JOIN sys_user a ON b.applicant_id = a.UserID
      WHERE 1=1
      ORDER BY b.created_at DESC LIMIT ? OFFSET ?
    `;
    const [rows] = await pool.query(sql, [20, 0]);
    console.log('查询结果:', rows.length, '条');
    rows.forEach(row => {
      console.log(`  - ${row.borrow_code}: ${row.equipment_name}`);
    });
  } catch (e) {
    console.error('错误:', e.message);
  }

  // 测试3: 带日期筛选
  console.log('\n--- 测试3: 带日期筛选 ---');
  try {
    const sql = `
      SELECT b.*, 
             e.name as equipment_name,
             e.asset_code,
             a.RealName as applicant_name
      FROM equ_borrow_record b
      LEFT JOIN equ_equipment e ON b.equipment_id = e.id
      LEFT JOIN sys_user a ON b.applicant_id = a.UserID
      WHERE 1=1
        AND strftime('%Y-%m-%d', b.borrow_date) >= ?
        AND strftime('%Y-%m-%d', b.borrow_date) <= ?
      ORDER BY b.created_at DESC LIMIT ? OFFSET ?
    `;
    const [rows] = await pool.query(sql, ['2026-05-01', '2026-05-31', 20, 0]);
    console.log('查询结果:', rows.length, '条');
    rows.forEach(row => {
      console.log(`  - ${row.borrow_code}: ${row.borrow_date}`);
    });
  } catch (e) {
    console.error('错误:', e.message);
  }

  db.close();
}

main().catch(e => console.error(e));
