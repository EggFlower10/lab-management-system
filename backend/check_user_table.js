const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');

const dbPath = path.join(__dirname, 'database', 'lab_management.db');

console.log('数据库路径:', dbPath);
console.log('文件存在:', fs.existsSync(dbPath));

const db = new Database(dbPath);

console.log('');
console.log('=== 检查sys_user表结构 ===');
const tableInfo = db.prepare("PRAGMA table_info(sys_user)").all();
if (tableInfo.length > 0) {
  console.log('表字段:');
  tableInfo.forEach(col => {
    console.log(`  ${col.name} (${col.type})`);
  });
} else {
  console.log('sys_user表不存在');
}

console.log('');
console.log('=== 检查sys_user表数据 ===');
const users = db.prepare("SELECT * FROM sys_user").all();
if (users.length > 0) {
  console.log(`共${users.length}个用户:`);
  users.forEach(user => {
    console.log(`  ID: ${user.UserID || user.id}, 用户名: ${user.UserName || user.username}, 姓名: ${user.RealName || user.realname || '-'}`);
  });
} else {
  console.log('无用户数据');
}

console.log('');
console.log('=== 所有表 ===');
const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
if (tables.length > 0) {
  console.log('表列表:');
  tables.forEach(t => {
    console.log(`  ${t.name}`);
  });
}

db.close();
