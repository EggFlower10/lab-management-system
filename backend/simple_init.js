const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');

const dbPath = path.join(__dirname, 'database', 'lab_management.db');
const backupPath = path.join(__dirname, 'database', 'lab_management_backup_' + Date.now() + '.db');
const initSqlPath = path.join(__dirname, 'database', 'init_sqlite.sql');

console.log('=== 简单初始化数据库 ===');

// 1. 备份
if (fs.existsSync(dbPath)) {
  fs.copyFileSync(dbPath, backupPath);
  console.log('已备份到:', backupPath);
  fs.unlinkSync(dbPath);
  console.log('已删除旧数据库');
}

// 2. 读取脚本
const sqlContent = fs.readFileSync(initSqlPath, 'utf-8');

// 3. 创建数据库
const db = new Database(dbPath);

// 4. 执行脚本
console.log('执行初始化脚本...');
try {
  db.exec(sqlContent);
  console.log('执行成功!');
} catch (e) {
  console.error('执行失败:', e);
}

// 5. 验证
console.log('');
console.log('=== 验证结果 ===');
try {
  const users = db.prepare('SELECT UserID, UserName, RealName FROM sys_user').all();
  console.log('sys_user表记录数:', users.length);
  users.forEach(u => {
    console.log(`  ${u.UserID}: ${u.UserName} (${u.RealName})`);
  });
} catch (e) {
  console.error('sys_user查询失败:', e.message);
}

try {
  const count = db.prepare('SELECT COUNT(*) as c FROM lab_scheduling').get().c;
  console.log('');
  console.log('lab_scheduling表记录数:', count);
} catch (e) {
  console.error('lab_scheduling查询失败:', e.message);
}

db.close();
console.log('');
console.log('=== 完成 ===');
