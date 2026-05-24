const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const mysql = require('mysql2/promise');
const http = require('http');

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
    const [rows] = await pool.query('SELECT * FROM edu_experiment_task ORDER BY id DESC');
    const tasks = rows.map((row) => ({
      TaskID: row.id,
      SemesterID: row.semester_id,
      SemesterName: '',
      MajorID: row.major_id,
      MajorName: '',
      ClassID: row.class_id,
      ClassName: '',
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
      OrgName: '',
      DeptID: row.dept_id,
      DeptName: '',
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
    
    setTimeout(() => {
      const postData = JSON.stringify({ username: 'admin', password: '123456' });
      const options = {
        hostname: 'localhost',
        port: port,
        path: '/api/v1/auth/login',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData)
        }
      };

      const req = http.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => {
          console.log('Login:', data);
          try {
            const result = JSON.parse(data);
            if (result.data && result.data.token) {
              const options2 = {
                hostname: 'localhost',
                port: port,
                path: '/api/v1/experiment-tasks',
                method: 'GET',
                headers: { 'Authorization': 'Bearer ' + result.data.token }
              };

              const req2 = http.request(options2, (res2) => {
                let data2 = '';
                res2.on('data', (chunk) => { data2 += chunk; });
                res2.on('end', () => {
                  console.log('Tasks API Test:', data2);
                });
              });
              req2.end();
            }
          } catch (e) {
            console.error('JSON parse error:', e.message);
          }
        });
      });
      req.write(postData);
      req.end();
    }, 1000);
  });
}).catch(err => {
  console.error('Failed to start server:', err);
});