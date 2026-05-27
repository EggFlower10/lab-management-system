const fs = require('fs');
const path = require('path');
const initSqlJs = require('sql.js');

async function checkStatus() {
  const SQL = await initSqlJs({
    locateFile: file => `node_modules/sql.js/dist/${file}`
  });

  const dbPath = path.join(__dirname, 'database', 'lab_management.db');
  const data = fs.readFileSync(dbPath);
  const db = new SQL.Database(data);

  console.log('=== 检查所有预约排课记录 ===');
  
  const results = db.exec(`
    SELECT id, scheduling_code, source_type, course_name, week_no, week_day, time_slot_start, status, source_id
    FROM lab_scheduling 
    WHERE source_type = "Reservation"
    ORDER BY week_no, week_day, time_slot_start
  `);

  if (results.length > 0) {
    console.log('共', results[0].values.length, '条预约排课记录:');
    results[0].values.forEach(row => {
      const [id, scheduling_code, source_type, course_name, week_no, week_day, time_slot_start, status, source_id] = row;
      console.log('');
      console.log(`ID: ${id}`);
      console.log(`编号: ${scheduling_code}`);
      console.log(`课程: ${course_name}`);
      console.log(`周次: ${week_no}, 星期: ${week_day}, 节次: ${time_slot_start}`);
      console.log(`状态: ${status}, source_id: ${source_id}`);
    });
  } else {
    console.log('无预约排课记录');
  }

  console.log('');
  console.log('=== 检查第3周所有排课记录(包括status=0) ===');
  
  const week3Results = db.exec(`
    SELECT id, scheduling_code, source_type, course_name, week_no, week_day, time_slot_start, status
    FROM lab_scheduling 
    WHERE week_no = 3
    ORDER BY week_day, time_slot_start
  `);

  if (week3Results.length > 0) {
    console.log('共', week3Results[0].values.length, '条记录:');
    week3Results[0].values.forEach(row => {
      const [id, scheduling_code, source_type, course_name, week_no, week_day, time_slot_start, status] = row;
      console.log(`${scheduling_code} | ${source_type} | ${course_name} | 周${week_no} 周${week_day} ${time_slot_start} | 状态:${status}`);
    });
  }

  db.close();
}

checkStatus().catch(err => {
  console.error('检查失败:', err);
});
