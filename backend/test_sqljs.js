const fs = require('fs');
const path = require('path');
const initSqlJs = require('sql.js');

async function test() {
  const SQL = await initSqlJs({
    locateFile: file => `node_modules/sql.js/dist/${file}`
  });

  // 创建一个新的内存数据库
  const db = new SQL.Database();
  
  // 创建表
  db.run('CREATE TABLE test (id INTEGER PRIMARY KEY, name TEXT)');
  
  // 插入数据
  db.run('INSERT INTO test (name) VALUES (?)', ['test1']);
  db.run('INSERT INTO test (name) VALUES (?)', ['test2']);
  
  // 查询数据
  const result = db.exec('SELECT * FROM test');
  console.log('插入后的数据:');
  result[0].values.forEach(row => {
    console.log(row);
  });
  
  // 导出数据
  const data = db.export();
  console.log('导出数据大小:', data.byteLength, 'bytes');
  
  // 写入临时文件
  const tempPath = path.join(__dirname, 'test_db.sqlite');
  fs.writeFileSync(tempPath, Buffer.from(data));
  console.log('写入文件成功');
  
  // 重新读取验证
  const newData = fs.readFileSync(tempPath);
  console.log('读取文件大小:', newData.length, 'bytes');
  
  // 从文件重新加载
  const db2 = new SQL.Database(new Uint8Array(newData));
  const result2 = db2.exec('SELECT * FROM test');
  console.log('从文件读取的数据:');
  result2[0].values.forEach(row => {
    console.log(row);
  });
  
  // 清理
  fs.unlinkSync(tempPath);
  
  db.close();
  db2.close();
}

test().catch(err => {
  console.error('测试失败:', err);
});
