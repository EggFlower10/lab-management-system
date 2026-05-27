const fs = require('fs');
const path = require('path');
const initSqlJs = require('sql.js');

async function testScheduleAPI() {
  const SQL = await initSqlJs({
    locateFile: file => `node_modules/sql.js/dist/${file}`
  });

  const dbPath = path.join(__dirname, 'database', 'lab_management.db');
  const data = fs.readFileSync(dbPath);
  const db = new SQL.Database(data);

  console.log('=== 测试排课检索API (第3周) ===');
  
  const weekNo = 3;
  const semesterId = 1;

  let sql = `
    SELECT 
      s.id,
      s.scheduling_code,
      s.semester_id,
      s.source_type,
      s.source_id,
      s.course_name,
      s.class_name,
      s.teacher_name,
      s.building_name,
      s.room_name,
      s.room_number,
      s.week_no,
      s.week_day,
      s.time_slot_start,
      s.time_slot_end,
      s.status
    FROM lab_scheduling s
    LEFT JOIN ven_building b ON s.building_id = b.BuildingID
    LEFT JOIN ven_room r ON s.room_id = r.RoomID
    LEFT JOIN edu_class c ON s.class_id = c.ClassID
    LEFT JOIN edu_major m ON s.major_id = m.MajorID
    LEFT JOIN edu_course co ON s.course_id = co.CourseID
    LEFT JOIN sys_user u ON s.teacher_id = u.UserID
    WHERE s.status = 1
  `;

  const params = [];

  if (semesterId) {
    sql += ' AND s.semester_id = ?';
    params.push(semesterId);
  }

  if (weekNo) {
    sql += ' AND s.week_no = ?';
    params.push(weekNo);
  }

  sql += ' ORDER BY s.week_day, s.time_slot_start';

  console.log('SQL:', sql);
  console.log('Params:', params);

  const results = db.exec(sql, params);
  
  if (results.length > 0) {
    console.log('');
    console.log('查询结果 (共', results[0].values.length, '条):');
    results[0].values.forEach(row => {
      const [id, scheduling_code, semester_id, source_type, source_id, course_name, 
            class_name, teacher_name, building_name, room_name, room_number, 
            week_no, week_day, time_slot_start, time_slot_end, status] = row;
      
      console.log('');
      console.log(`编号: ${scheduling_code}`);
      console.log(`来源: ${source_type}, 课程: ${course_name}`);
      console.log(`周次: ${week_no}, 星期: ${week_day}, 节次: ${time_slot_start}`);
      console.log(`教室: ${building_name} ${room_name} ${room_number}`);
      console.log(`班级: ${class_name}, 教师: ${teacher_name}`);
    });
  } else {
    console.log('没有找到记录');
  }

  db.close();
}

testScheduleAPI().catch(err => {
  console.error('测试失败:', err);
});
