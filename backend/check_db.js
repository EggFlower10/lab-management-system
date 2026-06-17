const db = require('better-sqlite3')('database/lab_management.db');

console.log('=== 数据库表统计 ===');
const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name").all();
tables.forEach(t => {
  try {
    const count = db.prepare(`SELECT COUNT(*) as cnt FROM ${t.name}`).get();
    console.log(`${t.name}: ${count.cnt} rows`);
  } catch (e) {
    console.log(`${t.name}: ERROR - ${e.message}`);
  }
});

console.log('\n=== 表结构检查 ===');
const keyTables = ['sys_user', 'equ_equipment', 'consumable', 'Ven_Room', 'Edu_Course', 'stock_in'];
keyTables.forEach(table => {
  try {
    const columns = db.prepare(`PRAGMA table_info(${table})`).all();
    console.log(`\n--- ${table} 表结构 ---`);
    console.log(columns.map(c => `${c.name} (${c.type}) ${c.pk ? 'PK' : ''}`).join('\n'));
  } catch (e) {
    console.log(`${table}: ${e.message}`);
  }
});

console.log('\n=== 关键表数据检查 ===');

// 检查用户表
console.log('\n--- 用户表 (sys_user) ---');
try {
  const users = db.prepare('SELECT * FROM sys_user LIMIT 3').all();
  console.log(JSON.stringify(users, null, 2));
} catch (e) {
  console.log('ERROR:', e.message);
}

// 检查设备表
console.log('\n--- 设备表 (equ_equipment) ---');
try {
  const equipments = db.prepare('SELECT * FROM equ_equipment LIMIT 3').all();
  console.log(JSON.stringify(equipments, null, 2));
} catch (e) {
  console.log('ERROR:', e.message);
}

// 检查耗材表
console.log('\n--- 耗材表 (consumable) ---');
try {
  const consumables = db.prepare('SELECT * FROM consumable LIMIT 3').all();
  console.log(JSON.stringify(consumables, null, 2));
} catch (e) {
  console.log('ERROR:', e.message);
}

// 检查入库表
console.log('\n--- 入库表 (stock_in) ---');
try {
  const stockIns = db.prepare('SELECT * FROM stock_in LIMIT 3').all();
  console.log(JSON.stringify(stockIns, null, 2));
} catch (e) {
  console.log('ERROR:', e.message);
}

db.close();