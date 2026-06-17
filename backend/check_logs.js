const db = require('better-sqlite3')('database/lab_management.db');

console.log('=== 操作日志表检查 ===\n');

// 检查系统操作日志表
try {
  const sysLogCols = db.prepare("PRAGMA table_info(sys_operation_log)").all();
  console.log('sys_operation_log 表结构:');
  if (sysLogCols.length > 0) {
    console.log(sysLogCols.map(c => `${c.name} (${c.type}) ${c.pk ? 'PK' : ''}`).join('\n'));
    const sysLogData = db.prepare('SELECT * FROM sys_operation_log LIMIT 5').all();
    console.log('\nsys_operation_log 数据:', JSON.stringify(sysLogData, null, 2));
  } else {
    console.log('不存在');
  }
} catch (e) {
  console.log('sys_operation_log: 查询失败 -', e.message);
}

console.log('\n---\n');

// 检查设备操作日志表
try {
  const equLogCols = db.prepare("PRAGMA table_info(equ_operation_log)").all();
  console.log('equ_operation_log 表结构:');
  if (equLogCols.length > 0) {
    console.log(equLogCols.map(c => `${c.name} (${c.type}) ${c.pk ? 'PK' : ''}`).join('\n'));
    const equLogData = db.prepare('SELECT * FROM equ_operation_log LIMIT 5').all();
    console.log('\nequ_operation_log 数据:', JSON.stringify(equLogData, null, 2));
  } else {
    console.log('不存在');
  }
} catch (e) {
  console.log('equ_operation_log: 查询失败 -', e.message);
}

db.close();