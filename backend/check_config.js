const db = require('better-sqlite3')('database/lab_management.db');

console.log('=== 现有配置项 ===');
const configs = db.prepare('SELECT * FROM sys_config').all();
console.log('总数:', configs.length);
configs.forEach(r => console.log('-', r.configKey, '|', r.name, '|', r.configValue, '|', r.group));

console.log('\n=== sys_config表结构 ===');
const cols = db.prepare("PRAGMA table_info(sys_config)").all();
console.log(cols.map(c => `${c.name}(${c.type})`).join(', '));

console.log('\n=== 各业务表统计 ===');
const tables = ['equ_equipment', 'consumable', 'ven_room', 'edu_course', 'sys_user', 'reservation', 'teaching_task'];
tables.forEach(t => {
  try {
    const cnt = db.prepare(`SELECT COUNT(*) as cnt FROM ${t}`).get();
    console.log(t, ':', cnt.cnt, '条');
  } catch (e) {
    console.log(t, ':', e.message);
  }
});

db.close();