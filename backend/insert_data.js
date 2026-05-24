const mysql = require('mysql2/promise');

async function insertData() {
  const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '123456',
    database: 'lab_management'
  });

  try {
    await pool.query('DELETE FROM edu_teaching_task');

    await pool.query(
      'INSERT INTO edu_teaching_task (semester_id, course_id, class_id, teacher_id, weekly_hours, total_hours, classroom, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [1, 1, 1, 2, 4, 64, '101教室', 1]
    );

    const [rows] = await pool.query('SELECT COUNT(*) as cnt FROM edu_teaching_task');
    console.log('教学任务数量:', rows[0].cnt);
    console.log('插入成功');
  } catch (error) {
    console.error('插入失败:', error);
  }
}

insertData();