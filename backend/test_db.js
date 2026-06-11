const fs = require('fs');
const initSqlJs = require('sql.js');

async function test() {
  try {
    const SQL = await initSqlJs({
      locateFile: f => 'node_modules/sql.js/dist/' + f
    });
    const db = new SQL.Database(fs.readFileSync('database/lab_management.db'));
    
    const result = db.exec("SELECT name FROM sqlite_master WHERE type='table' AND name LIKE 'consumable%'");
    console.log('Consumable tables:', JSON.stringify(result, null, 2));
    
    const categories = db.exec("SELECT * FROM consumable_category");
    console.log('Categories:', JSON.stringify(categories, null, 2));
    
    db.close();
  } catch (error) {
    console.error('Error:', error);
  }
}

test();