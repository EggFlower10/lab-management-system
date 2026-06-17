const db = require('better-sqlite3')('database/lab_management.db');

console.log('=== Edu_Course表结构 ===');
const cols = db.prepare("PRAGMA table_info(Edu_Course)").all();
cols.forEach(c => console.log(' -', c.name, '(', c.type, c.notnull ? 'NOT NULL' : '', ')'));

console.log('\n=== 数据示例 ===');
const rows = db.prepare('SELECT * FROM Edu_Course LIMIT 2').all();
console.log(JSON.stringify(rows, null, 2));

console.log('\n=== 数据总数 ===');
const count = db.prepare('SELECT COUNT(*) as cnt FROM Edu_Course').get();
console.log('课程总数:', count.cnt);

db.close();