const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const mysql = require('mysql2/promise');

const app = express();
const port = 7001;

app.use(cors());
app.use(express.json());

let pool;

async function initDatabase() {
  pool = await mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '123456',
    database: 'lab_management',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
  });
  console.log('Database connected');
}

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ code: 401, message: 'Unauthorized' });
  
  jwt.verify(token, 'secret_key', (err, user) => {
    if (err) return res.status(403).json({ code: 403, message: 'Invalid token' });
    req.user = user;
    next();
  });
}

function sendResponse(res, data = null, message = 'Success', code = 200) {
  res.json({ code, message, data });
}

app.post('/api/v1/auth/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const [rows] = await pool.query('SELECT * FROM sys_user WHERE UserName = ?', [username]);
    if (rows.length === 0) {
      return sendResponse(res, null, 'User not found', 401);
    }
    const user = rows[0];
    if (password === user.Password) {
      const token = jwt.sign({ id: user.UserID, username: user.UserName }, 'secret_key', { expiresIn: '1h' });
      sendResponse(res, { token, user: { id: user.UserID, username: user.UserName, name: user.UserName, role: 'admin' } });
    } else {
      sendResponse(res, null, 'Invalid password', 401);
    }
  } catch (error) {
    console.error('Login error:', error);
    sendResponse(res, null, 'Login failed', 500);
  }
});

app.get('/api/v1/experiment-tasks', authenticateToken, async (req, res) => {
  try {
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
    const tasks = rows.map((row) => ({
      TaskID: row.id,
      SemesterID: row.semester_id,
      SemesterName: row.semester_name,
      MajorID: row.major_id,
      MajorName: row.major_name,
      ClassID: row.class_id,
      ClassName: row.class_name,
      StudentCount: row.student_count,
      StudentLevel: row.student_level,
      CourseName: row.course_name,
      CourseCategory: row.course_category,
      IsIndependent: row.is_independent,
      ExperimentTotalHours: row.experiment_total_hours,
      ExperimentCurrentHours: row.experiment_current_hours,
      PracticeTotalHours: row.practice_total_hours,
      PracticeCurrentHours: row.practice_current_hours,
      TrainingTotalHours: row.training_total_hours,
      TrainingCurrentHours: row.training_current_hours,
      OrgID: row.org_id,
      OrgName: row.org_name,
      DeptID: row.dept_id,
      DeptName: row.dept_name,
      TeacherName: row.teacher_name,
      TeacherTitle: row.teacher_title,
      TechnicianName: row.technician_name,
      TechnicianTitle: row.technician_title,
      TextbookName: row.textbook_name,
      GuidebookName: row.guidebook_name,
      Status: row.status
    }));
    sendResponse(res, tasks);
  } catch (error) {
    console.error('Error getting experiment tasks:', error);
    sendResponse(res, null, 'Failed to get experiment tasks', 500);
  }
});

initDatabase().then(() => {
  app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
  });
}).catch(err => {
  console.error('Failed to start server:', err);
});