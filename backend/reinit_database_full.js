const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');

const dbPath = path.join(__dirname, 'database', 'lab_management.db');
const backupPath = path.join(__dirname, 'database', 'lab_management_backup_' + Date.now() + '.db');
const initSqlPath = path.join(__dirname, 'database', 'init_sqlite.sql');

console.log('=== 重新初始化数据库 ===');
console.log('数据库路径:', dbPath);
console.log('备份路径:', backupPath);
console.log('初始化脚本路径:', initSqlPath);

try {
  // 1. 备份现有数据库
  if (fs.existsSync(dbPath)) {
    console.log('备份现有数据库...');
    fs.copyFileSync(dbPath, backupPath);
    console.log('备份完成:', backupPath);
  }

  // 2. 删除现有数据库
  if (fs.existsSync(dbPath)) {
    fs.unlinkSync(dbPath);
    console.log('删除旧数据库文件');
  }

  // 3. 读取初始化脚本
  console.log('读取初始化脚本...');
  const sqlContent = fs.readFileSync(initSqlPath, 'utf-8');
  console.log('初始化脚本大小:', sqlContent.length, 'bytes');

  // 4. 创建新数据库并执行初始化
  console.log('创建新数据库...');
  const db = new Database(dbPath);
  console.log('执行初始化脚本...');

  // 正确分割SQL语句（处理多行语句）
  let currentStatement = '';
  let statements = [];
  let inMultiLine = false;
  const lines = sqlContent.split('\n');

  for (const line of lines) {
    const trimmedLine = line.trim();
    if (trimmedLine.startsWith('--') || trimmedLine.length === 0) {
      continue;
    }
    currentStatement += line + '\n';
    if (trimmedLine.endsWith(';')) {
      statements.push(currentStatement.trim());
      currentStatement = '';
    }
  }

  if (currentStatement.trim().length > 0) {
    statements.push(currentStatement.trim());
  }

  console.log('准备执行', statements.length, '条语句...');

  let successCount = 0;
  let errorCount = 0;

  for (let i = 0; i < statements.length; i++) {
    const stmt = statements[i];
    try {
      db.exec(stmt);
      successCount++;
    } catch (e) {
      console.error(`执行语句 ${i + 1} 失败:`, e.message);
      console.error('语句片段:', stmt.substring(0, 80));
      errorCount++;
    }
  }

  console.log('');
  console.log('=== 初始化结果 ===');
  console.log('成功:', successCount, '条语句');
  if (errorCount > 0) {
    console.log('失败:', errorCount, '条语句');
  }

  // 5. 验证初始化结果
  console.log('');
  console.log('=== 验证结果 ===');

  try {
    const userCount = db.prepare('SELECT COUNT(*) as count FROM sys_user').get().count;
    console.log('sys_user表记录数:', userCount);

    const users = db.prepare('SELECT UserID, UserName, RealName, Status FROM sys_user').all();
    console.log('');
    console.log('用户列表:');
    users.forEach(u => {
      console.log(`  ${u.UserID}: ${u.UserName} (${u.RealName})`);
    });
  } catch (e) {
    console.log('sys_user表验证失败:', e.message);
  }

  try {
    const scheduleCount = db.prepare('SELECT COUNT(*) as count FROM lab_scheduling').get().count;
    console.log('');
    console.log('lab_scheduling表记录数:', scheduleCount);
  } catch (e) {
    console.log('lab_scheduling表验证失败:', e.message);
  }

  db.close();
  console.log('');
  console.log('=== 初始化完成 ===');

} catch (error) {
  console.error('初始化失败:', error);
  process.exit(1);
}
