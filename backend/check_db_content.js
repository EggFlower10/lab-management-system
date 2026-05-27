const fs = require('fs');
const path = require('path');
const initSqlJs = require('sql.js');

async function check() {
  const SQL = await initSqlJs({
    locateFile: file => `node_modules/sql.js/dist/${file}`
  });

  const dbPath = path.join(__dirname, 'database', 'lab_management.db');
  
  console.log('数据库路径:', dbPath);
  console.log('文件存在:', fs.existsSync(dbPath));
  
  if (fs.existsSync(dbPath)) {
    const data = fs.readFileSync(dbPath);
    console.log('文件大小:', data.length, 'bytes');
    
    const db = new SQL.Database(new Uint8Array(data));
    
    // 检查表
    const tables = db.exec("SELECT name FROM sqlite_master WHERE type='table'");
    console.log('表数量:', tables[0]?.values.length || 0);
    
    if (tables[0]?.values.length > 0) {
      console.log('表列表:');
      tables[0].values.forEach(row => {
        console.log(`  - ${row[0]}`);
      });
      
      // 检查排课记录
      const count = db.exec("SELECT COUNT(*) FROM lab_scheduling");
      console.log('排课记录数:', count[0]?.values[0][0] || 0);
      
      // 检查预约记录
      const resCount = db.exec("SELECT COUNT(*) FROM lab_reservation");
      console.log('预约记录数:', resCount[0]?.values[0][0] || 0);
    }
    
    db.close();
  }
}

check().catch(err => {
  console.error('检查失败:', err);
});
