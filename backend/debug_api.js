const fs = require('fs');
const path = require('path');
const initSqlJs = require('sql.js');

async function testApi() {
  const SQL = await initSqlJs({
    locateFile: file => `node_modules/sql.js/dist/${file}`
  });

  const dbPath = path.join(__dirname, 'database', 'lab_management.db');
  const data = fs.readFileSync(dbPath);
  const db = new SQL.Database(data);

  // 模拟前端调用的查询参数：第3周
  const weekNo = 3;
  const semesterId = 1;

  console.log(`=== 模拟查询第${weekNo}周的排课记录 ===`);
  
  const sql = `
    SELECT s.id, s.scheduling_code, s.source_type, s.course_name, 
           s.week_no, s.week_day, s.time_slot_start, s.room_name, s.building_name
    FROM lab_scheduling s
    WHERE s.status = 1 AND s.semester_id = ? AND s.week_no = ?
    ORDER BY s.week_day, s.time_slot_start
  `;

  const results = db.exec(sql, [semesterId, weekNo]);
  
  if (results.length > 0) {
    console.log('查询结果:', results[0].values.length, '条记录');
    console.log('');
    results[0].values.forEach(r => {
      const [id, scheduling_code, source_type, course_name, week_no, week_day, time_slot_start, room_name, building_name] = r;
      console.log(`ID: ${id}`);
      console.log(`  编号: ${scheduling_code}`);
      console.log(`  来源: ${source_type}`);
      console.log(`  课程: ${course_name}`);
      console.log(`  周次: ${week_no}`);
      console.log(`  星期: ${week_day}`);
      console.log(`  节次: ${time_slot_start}`);
      console.log(`  地点: ${building_name} ${room_name}`);
      console.log('');
    });
  } else {
    console.log('没有找到排课记录');
  }

  db.close();
}

testApi().catch(err => {
  console.error('测试失败:', err);
});
