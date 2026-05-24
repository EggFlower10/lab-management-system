const mysql = require('mysql2/promise');

async function test() {
  const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '123456',
    database: 'lab_management',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
  });

  try {
    console.log('Testing SQL query...');
    const [rows] = await pool.query(`
      SELECT et.*, s.SemesterName as semester_name, m.MajorName as major_name, 
             c.ClassName as class_name, o.name as org_name, d.DepartmentName as dept_name
      FROM edu_experiment_task et
      LEFT JOIN edu_semester s ON et.semester_id = s.SemesterID
      LEFT JOIN edu_major m ON et.major_id = m.MajorID
      LEFT JOIN edu_class c ON et.class_id = c.ClassID
      LEFT JOIN sys_organization o ON et.org_id = o.id
      LEFT JOIN sys_department d ON et.dept_id = d.DepartmentID
      ORDER BY et.id DESC
    `);
    console.log('Query successful! Rows:', rows.length);
    console.log('First row:', JSON.stringify(rows[0], null, 2));
  } catch (error) {
    console.error('Query error:', error);
  } finally {
    pool.end();
  }
}

test();