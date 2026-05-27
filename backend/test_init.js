const fs = require('fs');
const path = require('path');
const initSqlJs = require('sql.js');

async function testInit() {
  console.log('开始测试数据库初始化...');
  
  try {
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
      console.log('数据库创建成功');
      
      // 检查表数量
      const tables = db.exec("SELECT name FROM sqlite_master WHERE type='table'");
      console.log('表数量:', tables[0]?.values.length || 0);
      
      db.close();
      console.log('测试完成');
    } else {
      console.log('数据库文件不存在');
    }
  } catch (err) {
    console.error('初始化失败:', err);
    process.exit(1);
  }
}

testInit();
