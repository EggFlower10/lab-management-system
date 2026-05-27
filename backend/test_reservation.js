const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./database/example_db.sqlite');

db.all('SELECT * FROM lab_scheduling WHERE source_type = "Reservation"', (err, rows) => {
  if (err) {
    console.error('查询错误:', err);
    db.close();
    return;
  }
  console.log('预约排课记录数:', rows.length);
  rows.forEach(row => {
    console.log('ID:', row.id, 'Course:', row.course_name, 'Week:', row.week_no, 'Day:', row.week_day, 'Time:', row.time_slot_start);
  });
  db.close();
});
