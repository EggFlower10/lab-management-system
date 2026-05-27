const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');
const dayjs = require('dayjs');
const multer = require('multer');
const XLSX = require('xlsx');

const app = express();
const port = 7002;

// 中间件
app.use(cors());
app.use(express.json());

// Multer 配置
const upload = multer({
  dest: 'uploads/',
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel'
    ];
    if (allowedTypes.includes(file.mimetype) || 
        file.originalname.endsWith('.xlsx') || 
        file.originalname.endsWith('.xls')) {
      cb(null, true);
    } else {
      cb(new Error('只允许上传Excel文件'));
    }
  }
});

app.use((req, res, next) => {
  const originalSetHeader = res.setHeader.bind(res);

  res.setHeader = (name, value) => {
    if (typeof name === 'string' && name.toLowerCase() === 'content-disposition' && typeof value === 'string') {
      value = value.replace(/[^\x20-\x7E]/g, '_');
    }

    return originalSetHeader(name, value);
  };

  next();
});

// SQLite 数据库实例
let db;
const dbPath = path.join(__dirname, 'database', 'lab_management.db');

// 初始化数据库连接
async function initDatabase() {
  try {
    const SQL = await initSqlJs({
      locateFile: file => `node_modules/sql.js/dist/${file}`
    });

    if (fs.existsSync(dbPath)) {
      const data = fs.readFileSync(dbPath);
      db = new SQL.Database(data);
    } else {
      db = new SQL.Database();
    }

    console.log('SQLite 数据库连接成功');

    // 创建数据库包装层，兼容 mysql2 的 pool.query 接口
    global.db = {
      query: (sql, params = []) => {
        return new Promise((resolve, reject) => {
          try {
            const upperSql = sql.toUpperCase().trim();

            // 处理不需要 prepare 的语句
            if (upperSql.startsWith('CREATE TABLE') ||
              upperSql.startsWith('CREATE INDEX') ||
              upperSql.startsWith('DROP TABLE') ||
              upperSql.startsWith('DROP INDEX') ||
              upperSql.startsWith('PRAGMA')) {
              db.run(sql);
              resolve([{ affectedRows: 0 }]);
              return;
            }

            let results = [];

            // 统一使用 prepare 语句执行所有查询
            try {
              const stmt = db.prepare(sql);
              
              if (params.length > 0) {
                const safeParams = params.map(p => p === undefined ? null : p);
                stmt.bind(safeParams);
              }
              
              while (stmt.step()) {
                results.push(stmt.getAsObject());
              }
              stmt.free();
            } catch (e) {
              console.error('查询执行失败，尝试备用方案:', e);
              // 如果 prepare 失败，尝试使用 exec 方式（仅用于无参数查询）
              if (params.length === 0) {
                const execResults = db.exec(sql);
                if (execResults.length > 0 && execResults[0].values) {
                  const columns = execResults[0].columns;
                  execResults[0].values.forEach(row => {
                    const obj = {};
                    row.forEach((val, idx) => {
                      obj[columns[idx]] = val;
                    });
                    results.push(obj);
                  });
                }
              } else {
                throw e;
              }
            }

            // 检查是否是 INSERT/UPDATE/DELETE 语句
            if (upperSql.startsWith('INSERT') || upperSql.startsWith('UPDATE') || upperSql.startsWith('DELETE')) {
              const changes = db.getRowsModified();
              const insertId = typeof db.lastInsertRowid === 'function' ? db.lastInsertRowid() : db.lastInsertRowid || 0;
              resolve([{ insertId: insertId, affectedRows: changes }]);
            } else {
              resolve([results]);
            }
          } catch (error) {
            console.error('SQL 执行错误:', error, 'SQL:', sql, 'Params:', params);
            reject(error);
          }
        });
      }
    };

    // 设置全局 pool 对象以兼容现有代码
    global.pool = global.db;

    // 如果数据库是空的，初始化表结构
    const [tables] = await global.db.query("SELECT name FROM sqlite_master WHERE type='table'");
    if (tables.length === 0) {
      console.log('数据库为空，正在初始化表结构...');
      await initDatabaseSchema();
    }

    // 定时保存数据库到文件（每30秒）
    setInterval(() => {
      try {
        const data = db.export();
        fs.writeFileSync(dbPath, Buffer.from(data));
        console.log('数据库已自动保存');
      } catch (error) {
        console.error('自动保存数据库失败:', error);
      }
    }, 30000);

    // 程序退出时保存数据库
    const saveOnExit = () => {
      try {
        const data = db.export();
        fs.writeFileSync(dbPath, Buffer.from(data));
        console.log('程序退出，数据库已保存');
      } catch (error) {
        console.error('退出时保存数据库失败:', error);
      }
      process.exit();
    };

    process.on('exit', saveOnExit);
    process.on('SIGINT', saveOnExit);
    process.on('SIGTERM', saveOnExit);

  } catch (error) {
    console.error('数据库连接失败:', error);
  }
}

// 初始化数据库表结构
async function initDatabaseSchema() {
  try {
    const schemaPath = path.join(__dirname, 'database', 'init_sqlite.sql');
    if (fs.existsSync(schemaPath)) {
      const sqlContent = fs.readFileSync(schemaPath, 'utf8');

      // 使用 exec 方法直接执行整个 SQL 脚本
      db.exec(sqlContent);

      console.log('数据库表结构初始化完成');
    }
  } catch (error) {
    console.error('初始化数据库表结构失败:', error);
  }
}

// 生成 JWT token
function generateToken(user) {
  return jwt.sign({ id: user.UserID, username: user.UserName }, 'secret_key', { expiresIn: '1h' });
}

// 认证中间件
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ code: 401, message: '未授权' });

  jwt.verify(token, 'secret_key', (err, user) => {
    if (err) return res.status(401).json({ code: 401, message: '登录状态已过期，请重新登录' });
    req.user = user;
    next();
  });
}

// 统一响应格式
function sendResponse(res, data = null, message = '成功', code = 200) {
  res.json({ code, message, data });
}

// 辅助函数 - 获取分类列表
async function getCategoryList() {
  try {
    const [rows] = await pool.query('SELECT id, name FROM equ_category WHERE status = 1 ORDER BY sort_order');
    return rows;
  } catch (error) {
    console.error('获取分类列表失败:', error);
    return [];
  }
}

// 辅助函数 - 获取用户列表
async function getUserList() {
  try {
    const [rows] = await pool.query('SELECT UserID, UserName, RealName FROM sys_user ORDER BY UserID');
    return rows;
  } catch (error) {
    console.error('获取用户列表失败:', error);
    return [];
  }
}

// 辅助函数 - 获取部门列表
async function getDepartmentList() {
  try {
    const [rows] = await pool.query('SELECT DeptID, DeptName FROM sys_department ORDER BY DeptID');
    return rows;
  } catch (error) {
    console.error('获取部门列表失败:', error);
    return [];
  }
}

// 辅助函数 - 根据资产编号获取设备
async function getEquipmentByAssetCode(asset_code) {
  try {
    const [rows] = await pool.query('SELECT * FROM equ_equipment WHERE asset_code = ?', [asset_code]);
    return rows.length > 0 ? rows[0] : null;
  } catch (error) {
    console.error('获取设备失败:', error);
    return null;
  }
}

// 辅助函数 - 格式化日期
function formatDate(date) {
  if (!date) return '-';
  try {
    const d = new Date(date);
    if (isNaN(d.getTime())) return '-';
    return d.toLocaleString('zh-CN');
  } catch (error) {
    return '-';
  }
}

// 辅助函数 - 获取状态文本
function getStatusText(status) {
  const map = {
    available: '在库-可用',
    maintenance: '在库-待维修',
    reserved: '在库-已预约',
    borrowed: '借出',
    repairing: '送修',
    scrapped: '报废',
    lost: '丢失',
    pending: '待审批',
    pending_teacher: '待导师审批',
    pending_admin: '待管理员审批',
    approved: '已审批',
    rejected: '已拒绝',
    returned: '已归还',
    overdue: '逾期'
  };
  return map[status] || status || '-';
}

// 辅助函数 - 获取归还状态文本
function getReturnStatusText(status) {
  const map = {
    returned: '完好',
    damaged: '损坏',
    missing_parts: '缺件'
  };
  return map[status] || status || '-';
}

// 登录接口
app.post('/api/v1/auth/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    const [rows] = await pool.query('SELECT * FROM sys_user WHERE UserName = ?', [username]);
    if (rows.length === 0) {
      return sendResponse(res, null, '用户名或密码错误', 401);
    }

    const user = rows[0];
    if (password === '123456' || password === user.Password) {
      const token = generateToken(user);
      sendResponse(res, {
        token,
        user: {
          id: user.UserID,
          username: user.UserName,
          name: user.RealName || user.UserName,
          role: 'admin'
        }
      });
    } else {
      sendResponse(res, null, '用户名或密码错误', 401);
    }
  } catch (error) {
    console.error('登录错误:', error);
    sendResponse(res, null, '登录失败', 500);
  }
});

// 获取用户信息
app.get('/api/v1/auth/info', authenticateToken, async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT UserID, UserName, RealName, Email, Mobile, Status FROM sys_user WHERE UserID = ?', [req.user.id]);
    if (rows.length === 0) {
      return sendResponse(res, null, '用户不存在', 404);
    }
    const user = rows[0];
    sendResponse(res, {
      id: user.UserID,
      username: user.UserName,
      name: user.RealName,
      email: user.Email,
      phone: user.Mobile,
      status: user.Status,
      roles: ['admin']
    });
  } catch (error) {
    console.error('获取用户信息错误:', error);
    sendResponse(res, null, '获取用户信息失败', 500);
  }
});

// 用户管理
app.get('/api/v1/users', authenticateToken, async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM sys_user ORDER BY UserID');
    sendResponse(res, rows);
  } catch (error) {
    console.error('获取用户列表错误:', error);
    sendResponse(res, null, '获取用户列表失败', 500);
  }
});

app.get('/api/v1/users/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await pool.query('SELECT * FROM sys_user WHERE UserID = ?', [id]);
    if (rows.length === 0) {
      return sendResponse(res, null, '用户不存在', 404);
    }
    sendResponse(res, rows[0]);
  } catch (error) {
    console.error('获取用户信息错误:', error);
    sendResponse(res, null, '获取用户信息失败', 500);
  }
});

app.post('/api/v1/users', authenticateToken, async (req, res) => {
  const { UserName, Password, RealName, Mobile, Email, MainDepartmentID, Status } = req.body;
  try {
    const [result] = await pool.query(
      'INSERT INTO sys_user (UserName, Password, RealName, Mobile, Email, MainDepartmentID, Status) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [UserName, Password || '123456', RealName, Mobile, Email, MainDepartmentID, Status || 1]
    );
    sendResponse(res, { UserID: result.insertId });
  } catch (error) {
    console.error('创建用户错误:', error);
    sendResponse(res, null, '创建用户失败', 500);
  }
});

app.put('/api/v1/users/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { UserName, RealName, Mobile, Email, MainDepartmentID, Status } = req.body;
  try {
    await pool.query(
      'UPDATE sys_user SET UserName = ?, RealName = ?, Mobile = ?, Email = ?, MainDepartmentID = ?, Status = ? WHERE UserID = ?',
      [UserName, RealName, Mobile, Email, MainDepartmentID, Status, id]
    );
    sendResponse(res);
  } catch (error) {
    console.error('更新用户错误:', error);
    sendResponse(res, null, '更新用户失败', 500);
  }
});

app.delete('/api/v1/users/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM sys_user WHERE UserID = ?', [id]);
    sendResponse(res);
  } catch (error) {
    console.error('删除用户错误:', error);
    sendResponse(res, null, '删除用户失败', 500);
  }
});

// 机构管理
app.get('/api/v1/organizations', authenticateToken, async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM sys_institution ORDER BY SortOrder');
    const organizations = rows.map(row => ({
      InstitutionID: row.InstitutionID,
      InstitutionCode: row.InstitutionCode,
      InstitutionName: row.InstitutionName,
      ParentID: row.ParentID,
      InstitutionType: row.InstitutionType,
      Level: row.Level,
      FullPath: row.FullPath,
      Status: row.Status,
      SortOrder: row.SortOrder,
      Description: row.Description,
      id: row.InstitutionID,
      name: row.InstitutionName,
      code: row.InstitutionCode,
      parentId: row.ParentID,
      children: []
    }));
    sendResponse(res, organizations);
  } catch (error) {
    console.error('获取机构列表错误:', error);
    sendResponse(res, null, '获取机构列表失败', 500);
  }
});

app.get('/api/v1/organizations/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await pool.query('SELECT * FROM sys_institution WHERE InstitutionID = ?', [id]);
    if (rows.length > 0) {
      sendResponse(res, rows[0]);
    } else {
      sendResponse(res, null, '机构不存在', 404);
    }
  } catch (error) {
    console.error('获取机构错误:', error);
    sendResponse(res, null, '获取机构失败', 500);
  }
});

app.post('/api/v1/organizations', authenticateToken, async (req, res) => {
  const { InstitutionCode, InstitutionName, ParentID, InstitutionType, Level, FullPath, Status, SortOrder, Description } = req.body;
  try {
    const [result] = await pool.query(
      'INSERT INTO Sys_Institution (InstitutionCode, InstitutionName, ParentID, InstitutionType, Level, FullPath, Status, SortOrder, Description) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [InstitutionCode, InstitutionName, ParentID || 0, InstitutionType, Level || 1, FullPath, Status || 1, SortOrder || 0, Description]
    );
    sendResponse(res, { InstitutionID: result.insertId });
  } catch (error) {
    console.error('创建机构错误:', error);
    sendResponse(res, null, '创建机构失败', 500);
  }
});

app.put('/api/v1/organizations/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { InstitutionCode, InstitutionName, ParentID = 0, InstitutionType, Level = 1, FullPath, Status = 1, SortOrder = 0, Description } = req.body;
  try {
    await pool.query(
      'UPDATE Sys_Institution SET InstitutionCode = ?, InstitutionName = ?, ParentID = ?, InstitutionType = ?, Level = ?, FullPath = ?, Status = ?, SortOrder = ?, Description = ? WHERE InstitutionID = ?',
      [InstitutionCode, InstitutionName, ParentID, InstitutionType, Level, FullPath, Status, SortOrder, Description, id]
    );
    sendResponse(res);
  } catch (error) {
    console.error('更新机构错误:', error);
    sendResponse(res, null, '更新机构失败', 500);
  }
});

app.delete('/api/v1/organizations/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM sys_institution WHERE InstitutionID = ?', [id]);
    sendResponse(res);
  } catch (error) {
    console.error('删除机构错误:', error);
    sendResponse(res, null, '删除机构失败', 500);
  }
});

// 部门管理
app.get('/api/v1/departments', authenticateToken, async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM Sys_Department ORDER BY SortOrder');
    const departments = rows.map(row => ({
      DepartmentID: row.DepartmentID,
      DepartmentCode: row.DepartmentCode,
      DepartmentName: row.DepartmentName,
      InstitutionID: row.InstitutionID,
      ParentID: row.ParentID,
      DepartmentType: row.DepartmentType,
      Level: row.Level,
      FullPath: row.FullPath,
      ManagerID: row.ManagerID,
      Status: row.Status,
      SortOrder: row.SortOrder,
      Description: row.Description
    }));
    sendResponse(res, departments);
  } catch (error) {
    console.error('获取部门列表错误:', error);
    sendResponse(res, null, '获取部门列表失败', 500);
  }
});

app.get('/api/v1/departments/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await pool.query('SELECT * FROM Sys_Department WHERE DepartmentID = ?', [id]);
    if (rows.length > 0) {
      sendResponse(res, rows[0]);
    } else {
      sendResponse(res, null, '部门不存在', 404);
    }
  } catch (error) {
    console.error('获取部门错误:', error);
    sendResponse(res, null, '获取部门失败', 500);
  }
});

app.post('/api/v1/departments', authenticateToken, async (req, res) => {
  const { DepartmentCode, DepartmentName, InstitutionID, ParentID, DepartmentType, Level, FullPath, ManagerID, Status, SortOrder, Description } = req.body;
  try {
    const [result] = await pool.query(
      'INSERT INTO Sys_Department (DepartmentCode, DepartmentName, InstitutionID, ParentID, DepartmentType, Level, FullPath, ManagerID, Status, SortOrder, Description) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [DepartmentCode, DepartmentName, InstitutionID, ParentID || 0, DepartmentType, Level || 1, FullPath, ManagerID, Status || 1, SortOrder || 0, Description]
    );
    sendResponse(res, { DepartmentID: result.insertId });
  } catch (error) {
    console.error('创建部门错误:', error);
    sendResponse(res, null, '创建部门失败', 500);
  }
});

app.put('/api/v1/departments/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { DepartmentCode, DepartmentName, InstitutionID, ParentID = 0, DepartmentType, Level = 1, FullPath, ManagerID, Status = 1, SortOrder = 0, Description } = req.body;
  try {
    await pool.query(
      'UPDATE Sys_Department SET DepartmentCode = ?, DepartmentName = ?, InstitutionID = ?, ParentID = ?, DepartmentType = ?, Level = ?, FullPath = ?, ManagerID = ?, Status = ?, SortOrder = ?, Description = ? WHERE DepartmentID = ?',
      [DepartmentCode, DepartmentName, InstitutionID, ParentID, DepartmentType, Level, FullPath, ManagerID, Status, SortOrder, Description, id]
    );
    sendResponse(res);
  } catch (error) {
    console.error('更新部门错误:', error);
    sendResponse(res, null, '更新部门失败', 500);
  }
});

app.delete('/api/v1/departments/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM sys_department WHERE DepartmentID = ?', [id]);
    sendResponse(res);
  } catch (error) {
    console.error('删除部门错误:', error);
    sendResponse(res, null, '删除部门失败', 500);
  }
});

// 专业管理
app.get('/api/v1/majors', authenticateToken, async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM Edu_Major ORDER BY SortOrder');
    const majors = rows.map(row => ({
      MajorID: row.MajorID,
      MajorCode: row.MajorCode,
      MajorName: row.MajorName,
      MajorNameEn: row.MajorNameEn,
      DegreeLevel: row.DegreeLevel,
      Duration: row.Duration,
      DegreeName: row.DegreeName,
      DepartmentID: row.DepartmentID,
      Status: row.Status,
      SortOrder: row.SortOrder,
      Description: row.Description
    }));
    sendResponse(res, majors);
  } catch (error) {
    console.error('获取专业列表错误:', error);
    sendResponse(res, null, '获取专业列表失败', 500);
  }
});

app.post('/api/v1/majors', authenticateToken, async (req, res) => {
  const { MajorCode, MajorName, MajorNameEn, DepartmentID, DegreeLevel, Duration, DegreeName, Status, SortOrder, Description } = req.body;
  try {
    const [result] = await pool.query(
      'INSERT INTO Edu_Major (MajorCode, MajorName, MajorNameEn, DepartmentID, DegreeLevel, Duration, DegreeName, Status, SortOrder, Description) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [MajorCode, MajorName, MajorNameEn, DepartmentID, DegreeLevel, Duration, DegreeName, Status || 1, SortOrder || 0, Description]
    );
    sendResponse(res, { MajorID: result.insertId });
  } catch (error) {
    console.error('创建专业错误:', error);
    sendResponse(res, null, '创建专业失败', 500);
  }
});

app.put('/api/v1/majors/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { MajorCode, MajorName, MajorNameEn, DepartmentID, DegreeLevel, Duration, DegreeName, Status, SortOrder, Description } = req.body;
  try {
    await pool.query(
      'UPDATE Edu_Major SET MajorCode = ?, MajorName = ?, MajorNameEn = ?, DepartmentID = ?, DegreeLevel = ?, Duration = ?, DegreeName = ?, Status = ?, SortOrder = ?, Description = ? WHERE MajorID = ?',
      [MajorCode, MajorName, MajorNameEn, DepartmentID, DegreeLevel, Duration, DegreeName, Status, SortOrder, Description, id]
    );
    sendResponse(res);
  } catch (error) {
    console.error('更新专业错误:', error);
    sendResponse(res, null, '更新专业失败', 500);
  }
});

app.delete('/api/v1/majors/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM Edu_Major WHERE MajorID = ?', [id]);
    sendResponse(res);
  } catch (error) {
    console.error('删除专业错误:', error);
    sendResponse(res, null, '删除专业失败', 500);
  }
});

// 课程管理
app.get('/api/v1/courses', authenticateToken, async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM Edu_Course ORDER BY SortOrder');
    sendResponse(res, rows);
  } catch (error) {
    console.error('获取课程列表错误:', error);
    sendResponse(res, null, '获取课程列表失败', 500);
  }
});

app.post('/api/v1/courses', authenticateToken, async (req, res) => {
  const { CourseCode, CourseName, CourseType, Credit, Hours, SortOrder, Description, Status } = req.body;
  try {
    const [result] = await pool.query(
      'INSERT INTO Edu_Course (CourseCode, CourseName, CourseType, Credit, Hours, SortOrder, Description, Status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [CourseCode, CourseName, CourseType, Credit, Hours, SortOrder || 0, Description, Status || 1]
    );
    sendResponse(res, { CourseID: result.insertId });
  } catch (error) {
    console.error('创建课程错误:', error);
    sendResponse(res, null, '创建课程失败', 500);
  }
});

app.put('/api/v1/courses/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { CourseCode, CourseName, CourseNameEn, CourseNature, Credits, TotalHours, LectureHours, PracticeHours, LabHours, OnlineHours, OpenSemesters, Status, SortOrder, Description } = req.body;
  try {
    await pool.query(
      'UPDATE Edu_Course SET CourseCode = ?, CourseName = ?, CourseNameEn = ?, CourseNature = ?, Credits = ?, TotalHours = ?, LectureHours = ?, PracticeHours = ?, LabHours = ?, OnlineHours = ?, OpenSemesters = ?, Status = ?, SortOrder = ?, Description = ? WHERE CourseID = ?',
      [CourseCode, CourseName, CourseNameEn, CourseNature, Credits, TotalHours, LectureHours, PracticeHours, LabHours, OnlineHours, OpenSemesters, Status, SortOrder, Description, id]
    );
    sendResponse(res);
  } catch (error) {
    console.error('更新课程错误:', error);
    sendResponse(res, null, '更新课程失败', 500);
  }
});

app.delete('/api/v1/courses/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM Edu_Course WHERE CourseID = ?', [id]);
    sendResponse(res);
  } catch (error) {
    console.error('删除课程错误:', error);
    sendResponse(res, null, '删除课程失败', 500);
  }
});

// 学期管理
app.get('/api/v1/semesters', authenticateToken, async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM Edu_Semester ORDER BY SortOrder');
    const semesters = rows.map(row => ({
      SemesterID: row.SemesterID,
      id: row.SemesterID,
      SchoolYear: row.SchoolYear,
      SemesterNo: row.SemesterNo,
      SemesterName: row.SemesterName,
      name: row.SemesterName,
      StartDate: row.StartDate,
      EndDate: row.EndDate,
      TotalWeeks: row.TotalWeeks,
      IsActive: row.IsActive,
      isActive: row.IsActive,
      Status: row.Status,
      SortOrder: row.SortOrder
    }));
    sendResponse(res, semesters);
  } catch (error) {
    console.error('获取学期列表错误:', error);
    sendResponse(res, null, '获取学期列表失败', 500);
  }
});

app.post('/api/v1/semesters', authenticateToken, async (req, res) => {
  const { SemesterCode, SemesterName, SchoolYear, SemesterNo, StartDate, EndDate, TotalWeeks, IsActive, Status, SortOrder, Description } = req.body;
  try {
    const startDateTime = StartDate ? `${StartDate} 00:00:00` : null;
    const endDateTime = EndDate ? `${EndDate} 23:59:59` : null;
    const [result] = await pool.query(
      'INSERT INTO Edu_Semester (SemesterCode, SemesterName, SchoolYear, SemesterNo, StartDate, EndDate, TotalWeeks, IsActive, Status, SortOrder, Description) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [SemesterCode, SemesterName, SchoolYear, SemesterNo, startDateTime, endDateTime, TotalWeeks, IsActive || 0, Status || 1, SortOrder || 0, Description]
    );
    sendResponse(res, { SemesterID: result.insertId });
  } catch (error) {
    console.error('创建学期错误:', error);
    sendResponse(res, null, '创建学期失败', 500);
  }
});

app.put('/api/v1/semesters/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { SemesterCode, SemesterName, SchoolYear, SemesterNo, StartDate, EndDate, TotalWeeks, IsActive, Status, SortOrder, Description } = req.body;
  try {
    const startDateTime = StartDate ? `${StartDate} 00:00:00` : null;
    const endDateTime = EndDate ? `${EndDate} 23:59:59` : null;
    await pool.query(
      'UPDATE Edu_Semester SET SemesterCode = ?, SemesterName = ?, SchoolYear = ?, SemesterNo = ?, StartDate = ?, EndDate = ?, TotalWeeks = ?, IsActive = ?, Status = ?, SortOrder = ?, Description = ? WHERE SemesterID = ?',
      [SemesterCode, SemesterName, SchoolYear || null, SemesterNo || null, startDateTime, endDateTime, TotalWeeks || null, IsActive || null, Status, SortOrder || null, Description || null, id]
    );
    sendResponse(res);
  } catch (error) {
    console.error('更新学期错误:', error);
    sendResponse(res, null, '更新学期失败', 500);
  }
});

app.put('/api/v1/semesters/:id/set-current', authenticateToken, async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('UPDATE Edu_Semester SET IsActive = 0');
    await pool.query('UPDATE Edu_Semester SET IsActive = 1 WHERE SemesterID = ?', [id]);
    sendResponse(res);
  } catch (error) {
    console.error('设置当前学期错误:', error);
    sendResponse(res, null, '设置当前学期失败', 500);
  }
});

app.delete('/api/v1/semesters/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM Edu_Semester WHERE SemesterID = ?', [id]);
    sendResponse(res);
  } catch (error) {
    console.error('删除学期错误:', error);
    sendResponse(res, null, '删除学期失败', 500);
  }
});

// 班级管理
app.get('/api/v1/classes', authenticateToken, async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM Edu_Class ORDER BY SortOrder');
    const classes = rows.map(row => ({
      ClassID: row.ClassID,
      ClassCode: row.ClassCode,
      DepartmentID: row.DepartmentID,
      MajorID: row.MajorID,
      GradeName: row.GradeName,
      ClassName: row.ClassName,
      MonitorID: row.MonitorID,
      HeadTeacherID: row.HeadTeacherID,
      StudentCount: row.StudentCount,
      Status: row.Status,
      SortOrder: row.SortOrder,
      Description: row.Description
    }));
    sendResponse(res, classes);
  } catch (error) {
    console.error('获取班级列表错误:', error);
    sendResponse(res, null, '获取班级列表失败', 500);
  }
});

app.post('/api/v1/classes', authenticateToken, async (req, res) => {
  const { ClassCode, DepartmentID, MajorID, GradeName, ClassName, MonitorID, HeadTeacherID, StudentCount, Status, SortOrder, Description } = req.body;
  try {
    const [result] = await pool.query(
      'INSERT INTO Edu_Class (ClassCode, DepartmentID, MajorID, GradeName, ClassName, MonitorID, HeadTeacherID, StudentCount, Status, SortOrder, Description) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [ClassCode, DepartmentID, MajorID, GradeName, ClassName, MonitorID, HeadTeacherID, StudentCount || 0, Status || 1, SortOrder || 0, Description]
    );
    sendResponse(res, { ClassID: result.insertId });
  } catch (error) {
    console.error('创建班级错误:', error);
    sendResponse(res, null, '创建班级失败', 500);
  }
});

app.put('/api/v1/classes/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { ClassCode, DepartmentID, MajorID, GradeName, ClassName, MonitorID, HeadTeacherID, StudentCount, Status, SortOrder, Description } = req.body;
  try {
    await pool.query(
      'UPDATE Edu_Class SET ClassCode = ?, DepartmentID = ?, MajorID = ?, GradeName = ?, ClassName = ?, MonitorID = ?, HeadTeacherID = ?, StudentCount = ?, Status = ?, SortOrder = ?, Description = ? WHERE ClassID = ?',
      [ClassCode, DepartmentID, MajorID, GradeName, ClassName, MonitorID, HeadTeacherID, StudentCount, Status, SortOrder, Description, id]
    );
    sendResponse(res);
  } catch (error) {
    console.error('更新班级错误:', error);
    sendResponse(res, null, '更新班级失败', 500);
  }
});

app.delete('/api/v1/classes/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM Edu_Class WHERE ClassID = ?', [id]);
    sendResponse(res);
  } catch (error) {
    console.error('删除班级错误:', error);
    sendResponse(res, null, '删除班级失败', 500);
  }
});

// 教学任务管理
app.get('/api/v1/tasks', authenticateToken, async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM Edu_TeachingTask ORDER BY SortOrder');
    sendResponse(res, rows);
  } catch (error) {
    console.error('获取教学任务列表错误:', error);
    sendResponse(res, null, '获取教学任务列表失败', 500);
  }
});

app.post('/api/v1/tasks', authenticateToken, async (req, res) => {
  const { TaskCode, SemesterID, CourseID, ClassID, WeeklyHours, StartWeek, EndWeek, ExamMode, Status, SortOrder, Description } = req.body;
  try {
    const [result] = await pool.query(
      'INSERT INTO Edu_TeachingTask (TaskCode, SemesterID, CourseID, ClassID, WeeklyHours, StartWeek, EndWeek, ExamMode, Status, SortOrder, Description) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [TaskCode, SemesterID, CourseID, ClassID, WeeklyHours, StartWeek, EndWeek, ExamMode, Status || 1, SortOrder || 0, Description]
    );
    sendResponse(res, { TaskID: result.insertId });
  } catch (error) {
    console.error('创建教学任务错误:', error);
    sendResponse(res, null, '创建教学任务失败', 500);
  }
});

app.put('/api/v1/tasks/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { TaskCode, SemesterID, CourseID, ClassID, WeeklyHours, StartWeek, EndWeek, ExamMode, Status, SortOrder, Description } = req.body;
  try {
    await pool.query(
      'UPDATE Edu_TeachingTask SET TaskCode = ?, SemesterID = ?, CourseID = ?, ClassID = ?, WeeklyHours = ?, StartWeek = ?, EndWeek = ?, ExamMode = ?, Status = ?, SortOrder = ?, Description = ? WHERE TaskID = ?',
      [TaskCode, SemesterID, CourseID, ClassID, WeeklyHours, StartWeek, EndWeek, ExamMode, Status, SortOrder, Description, id]
    );
    sendResponse(res);
  } catch (error) {
    console.error('更新教学任务错误:', error);
    sendResponse(res, null, '更新教学任务失败', 500);
  }
});

app.delete('/api/v1/tasks/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM Edu_TeachingTask WHERE TaskID = ?', [id]);
    sendResponse(res);
  } catch (error) {
    console.error('删除教学任务错误:', error);
    sendResponse(res, null, '删除教学任务失败', 500);
  }
});

// 教学任务教师关联
app.get('/api/v1/task-teachers', authenticateToken, async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM Edu_TeachingTaskTeacher');
    sendResponse(res, rows);
  } catch (error) {
    console.error('获取任务教师关联列表错误:', error);
    sendResponse(res, null, '获取任务教师关联列表失败', 500);
  }
});

app.post('/api/v1/task-teachers', authenticateToken, async (req, res) => {
  const { TaskID, TeacherID, TeacherRole } = req.body;
  try {
    const [result] = await pool.query(
      'INSERT INTO Edu_TeachingTaskTeacher (TaskID, TeacherID, TeacherRole) VALUES (?, ?, ?)',
      [TaskID, TeacherID, TeacherRole]
    );
    sendResponse(res, { ID: result.insertId });
  } catch (error) {
    console.error('创建任务教师关联错误:', error);
    sendResponse(res, null, '创建任务教师关联失败', 500);
  }
});

app.delete('/api/v1/task-teachers/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM Edu_TeachingTaskTeacher WHERE ID = ?', [id]);
    sendResponse(res);
  } catch (error) {
    console.error('删除任务教师关联错误:', error);
    sendResponse(res, null, '删除任务教师关联失败', 500);
  }
});

// 楼宇管理
app.get('/api/v1/buildings', authenticateToken, async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM Ven_Building ORDER BY SortOrder');
    sendResponse(res, rows);
  } catch (error) {
    console.error('获取楼宇列表错误:', error);
    sendResponse(res, null, '获取楼宇列表失败', 500);
  }
});

app.post('/api/v1/buildings', authenticateToken, async (req, res) => {
  const { BuildingCode, BuildingName, BuildingNameEn, CampusID, Address, TotalFloors, Area, BuildYear, UseType, Status, SortOrder, Description } = req.body;
  try {
    const [result] = await pool.query(
      'INSERT INTO Ven_Building (BuildingCode, BuildingName, BuildingNameEn, CampusID, Address, TotalFloors, Area, BuildYear, UseType, Status, SortOrder, Description) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [BuildingCode, BuildingName, BuildingNameEn, CampusID, Address, TotalFloors, Area, BuildYear, UseType, Status || 1, SortOrder || 0, Description]
    );
    sendResponse(res, { BuildingID: result.insertId });
  } catch (error) {
    console.error('创建楼宇错误:', error);
    sendResponse(res, null, '创建楼宇失败', 500);
  }
});

app.put('/api/v1/buildings/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { BuildingCode, BuildingName, BuildingNameEn, Address, TotalFloors, Area, BuildYear, UseType, Status, SortOrder, Description } = req.body;
  try {
    await pool.query(
      'UPDATE Ven_Building SET BuildingCode = ?, BuildingName = ?, BuildingNameEn = ?, Address = ?, TotalFloors = ?, Area = ?, BuildYear = ?, UseType = ?, Status = ?, SortOrder = ?, Description = ? WHERE BuildingID = ?',
      [BuildingCode, BuildingName, BuildingNameEn, Address, TotalFloors, Area, BuildYear, UseType, Status, SortOrder, Description, id]
    );
    sendResponse(res);
  } catch (error) {
    console.error('更新楼宇错误:', error);
    sendResponse(res, null, '更新楼宇失败', 500);
  }
});

app.delete('/api/v1/buildings/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM Ven_Building WHERE BuildingID = ?', [id]);
    sendResponse(res);
  } catch (error) {
    console.error('删除楼宇错误:', error);
    sendResponse(res, null, '删除楼宇失败', 500);
  }
});

// 房间管理
app.get('/api/v1/rooms', authenticateToken, async (req, res) => {
  try {
    const { buildingId } = req.query;
    let sql = 'SELECT * FROM Ven_Room WHERE Status = 1';
    const params = [];

    if (buildingId) {
      sql += ' AND BuildingID = ?';
      params.push(buildingId);
    }

    sql += ' ORDER BY SortOrder';

    const [rows] = await pool.query(sql, params);
    sendResponse(res, rows);
  } catch (error) {
    console.error('获取房间列表错误:', error);
    sendResponse(res, null, '获取房间列表失败', 500);
  }
});

app.post('/api/v1/rooms', authenticateToken, async (req, res) => {
  const { RoomCode, RoomName, BuildingID, Floor, Area, Capacity, RoomType, Equipment, Status, SortOrder, Description } = req.body;
  try {
    const [result] = await pool.query(
      'INSERT INTO Ven_Room (RoomCode, RoomName, BuildingID, Floor, Area, Capacity, RoomType, Equipment, Status, SortOrder, Description) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [RoomCode, RoomName, BuildingID, Floor, Area, Capacity, RoomType, Equipment, Status || 1, SortOrder || 0, Description]
    );
    sendResponse(res, { RoomID: result.insertId });
  } catch (error) {
    console.error('创建房间错误:', error);
    sendResponse(res, null, '创建房间失败', 500);
  }
});

app.put('/api/v1/rooms/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { RoomCode, RoomName, BuildingID, Floor, Area, Capacity, RoomType, Equipment, Status, SortOrder, Description } = req.body;
  try {
    await pool.query(
      'UPDATE Ven_Room SET RoomCode = ?, RoomName = ?, BuildingID = ?, Floor = ?, Area = ?, Capacity = ?, RoomType = ?, Equipment = ?, Status = ?, SortOrder = ?, Description = ? WHERE RoomID = ?',
      [RoomCode, RoomName, BuildingID, Floor, Area, Capacity, RoomType, Equipment, Status, SortOrder, Description, id]
    );
    sendResponse(res);
  } catch (error) {
    console.error('更新房间错误:', error);
    sendResponse(res, null, '更新房间失败', 500);
  }
});

app.delete('/api/v1/rooms/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM Ven_Room WHERE RoomID = ?', [id]);
    sendResponse(res);
  } catch (error) {
    console.error('删除房间错误:', error);
    sendResponse(res, null, '删除房间失败', 500);
  }
});

// 角色管理
app.get('/api/v1/roles', authenticateToken, async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM sys_role ORDER BY id');
    sendResponse(res, rows);
  } catch (error) {
    console.error('获取角色列表错误:', error);
    sendResponse(res, null, '获取角色列表失败', 500);
  }
});

app.post('/api/v1/roles', authenticateToken, async (req, res) => {
  const { name, code, description, status } = req.body;
  try {
    const [result] = await pool.query(
      'INSERT INTO sys_role (name, code, description, status) VALUES (?, ?, ?, ?)',
      [name, code, description, status || 1]
    );
    sendResponse(res, { id: result.insertId });
  } catch (error) {
    console.error('创建角色错误:', error);
    sendResponse(res, null, '创建角色失败', 500);
  }
});

app.put('/api/v1/roles/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { name, code, description, status } = req.body;
  try {
    await pool.query(
      'UPDATE sys_role SET name = ?, code = ?, description = ?, status = ? WHERE id = ?',
      [name, code, description, status, id]
    );
    sendResponse(res);
  } catch (error) {
    console.error('更新角色错误:', error);
    sendResponse(res, null, '更新角色失败', 500);
  }
});

app.delete('/api/v1/roles/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM sys_role WHERE id = ?', [id]);
    sendResponse(res);
  } catch (error) {
    console.error('删除角色错误:', error);
    sendResponse(res, null, '删除角色失败', 500);
  }
});

// 菜单管理
app.get('/api/v1/menus', authenticateToken, async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM sys_menu ORDER BY sort');
    sendResponse(res, rows);
  } catch (error) {
    console.error('获取菜单列表错误:', error);
    sendResponse(res, null, '获取菜单列表失败', 500);
  }
});

app.post('/api/v1/menus', authenticateToken, async (req, res) => {
  const { name, path, component, icon, parent_id, sort, type, visible, status } = req.body;
  try {
    const [result] = await pool.query(
      'INSERT INTO sys_menu (name, path, component, icon, parent_id, sort, type, visible, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [name, path, component, icon, parent_id || 0, sort || 0, type || 'menu', visible || 1, status || 1]
    );
    sendResponse(res, { id: result.insertId });
  } catch (error) {
    console.error('创建菜单错误:', error);
    sendResponse(res, null, '创建菜单失败', 500);
  }
});

app.put('/api/v1/menus/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { name, code, path, icon, parent_id, sort, status } = req.body;
  try {
    await pool.query(
      'UPDATE sys_menu SET name = ?, code = ?, path = ?, icon = ?, parent_id = ?, sort = ?, status = ? WHERE id = ?',
      [name, code, path, icon, parent_id, sort, status, id]
    );
    sendResponse(res);
  } catch (error) {
    console.error('更新菜单错误:', error);
    sendResponse(res, null, '更新菜单失败', 500);
  }
});

app.delete('/api/v1/menus/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM sys_menu WHERE id = ?', [id]);
    sendResponse(res);
  } catch (error) {
    console.error('删除菜单错误:', error);
    sendResponse(res, null, '删除菜单失败', 500);
  }
});

// 权限管理
app.get('/api/v1/permissions', authenticateToken, async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM sys_permission ORDER BY sort');
    sendResponse(res, rows);
  } catch (error) {
    console.error('获取权限列表错误:', error);
    sendResponse(res, null, '获取权限列表失败', 500);
  }
});

app.post('/api/v1/permissions', authenticateToken, async (req, res) => {
  const { name, code, type, path, method, sort, status, parent_id } = req.body;
  try {
    const [result] = await pool.query(
      'INSERT INTO sys_permission (name, code, type, path, method, sort, status, parent_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [name, code, type || 'menu', path, method || 'GET', sort || 0, status || 1, parent_id || 0]
    );
    sendResponse(res, { id: result.insertId });
  } catch (error) {
    console.error('创建权限错误:', error);
    sendResponse(res, null, '创建权限失败', 500);
  }
});

app.put('/api/v1/permissions/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { name, code, type, path, method, sort, status, parent_id } = req.body;
  try {
    await pool.query(
      'UPDATE sys_permission SET name = ?, code = ?, type = ?, path = ?, method = ?, sort = ?, status = ?, parent_id = ? WHERE id = ?',
      [name, code, type, path, method, sort, status, parent_id, id]
    );
    sendResponse(res);
  } catch (error) {
    console.error('更新权限错误:', error);
    sendResponse(res, null, '更新权限失败', 500);
  }
});

app.delete('/api/v1/permissions/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM sys_permission WHERE id = ?', [id]);
    sendResponse(res);
  } catch (error) {
    console.error('删除权限错误:', error);
    sendResponse(res, null, '删除权限失败', 500);
  }
});

// 校区管理
app.get('/api/v1/campuses', authenticateToken, async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM ven_campus ORDER BY id');
    sendResponse(res, rows);
  } catch (error) {
    console.error('获取校区列表错误:', error);
    sendResponse(res, null, '获取校区列表失败', 500);
  }
});

app.post('/api/v1/campuses', authenticateToken, async (req, res) => {
  const { code, name, address, contactPerson, contactPhone, status } = req.body;
  try {
    const [result] = await pool.query(
      'INSERT INTO ven_campus (code, name, address, contact_person, contact_phone, status) VALUES (?, ?, ?, ?, ?, ?)',
      [code, name, address, contactPerson, contactPhone, status || 1]
    );
    sendResponse(res, { id: result.insertId });
  } catch (error) {
    console.error('创建校区错误:', error);
    sendResponse(res, null, '创建校区失败', 500);
  }
});

app.put('/api/v1/campuses/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { code, name, address, description, status } = req.body;
  try {
    await pool.query(
      'UPDATE ven_campus SET code = ?, name = ?, address = ?, description = ?, status = ? WHERE id = ?',
      [code, name, address, description, status, id]
    );
    sendResponse(res);
  } catch (error) {
    console.error('更新校区错误:', error);
    sendResponse(res, null, '更新校区失败', 500);
  }
});

app.delete('/api/v1/campuses/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM ven_campus WHERE id = ?', [id]);
    sendResponse(res);
  } catch (error) {
    console.error('删除校区错误:', error);
    sendResponse(res, null, '删除校区失败', 500);
  }
});

// 教师管理
app.get('/api/v1/teachers', authenticateToken, async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT u.UserID, u.UserName, u.RealName, u.Email, u.Mobile, u.Status,
             d.DepartmentName as DepartmentName
      FROM sys_user u
      LEFT JOIN sys_department d ON u.MainDepartmentID = d.DepartmentID
      WHERE u.Status = 1
      ORDER BY u.RealName
    `);
    const teachers = rows.map(row => ({
      id: row.UserID,
      userName: row.UserName,
      realName: row.RealName || row.UserName,
      name: row.RealName || row.UserName,
      email: row.Email,
      mobile: row.Mobile,
      departmentName: row.DepartmentName || ''
    }));
    sendResponse(res, teachers);
  } catch (error) {
    console.error('获取教师列表错误:', error);
    sendResponse(res, null, '获取教师列表失败', 500);
  }
});

// 操作日志
app.get('/api/v1/logs', authenticateToken, async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM sys_log ORDER BY created_at DESC');
    sendResponse(res, rows);
  } catch (error) {
    console.error('获取日志列表错误:', error);
    sendResponse(res, null, '获取日志列表失败', 500);
  }
});

// 系统配置管理
app.get('/api/v1/configs', authenticateToken, async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM sys_config ORDER BY sortOrder');
    sendResponse(res, rows);
  } catch (error) {
    console.error('获取配置列表错误:', error);
    sendResponse(res, null, '获取配置列表失败', 500);
  }
});

app.post('/api/v1/configs', authenticateToken, async (req, res) => {
  const { configKey, name, configValue, group, description } = req.body;
  try {
    const [result] = await pool.query(
      'INSERT INTO sys_config (configKey, name, configValue, `group`, description) VALUES (?, ?, ?, ?, ?)',
      [configKey, name, configValue, group || 'system', description]
    );
    sendResponse(res, { id: result.insertId });
  } catch (error) {
    console.error('创建配置错误:', error);
    sendResponse(res, null, '创建配置失败', 500);
  }
});

app.put('/api/v1/configs/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { configKey, name, configValue, group, description } = req.body;
  try {
    await pool.query(
      'UPDATE sys_config SET configKey = ?, name = ?, configValue = ?, `group` = ?, description = ? WHERE id = ?',
      [configKey, name, configValue, group, description, id]
    );
    sendResponse(res);
  } catch (error) {
    console.error('更新配置错误:', error);
    sendResponse(res, null, '更新配置失败', 500);
  }
});

app.delete('/api/v1/configs/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM sys_config WHERE id = ?', [id]);
    sendResponse(res);
  } catch (error) {
    console.error('删除配置错误:', error);
    sendResponse(res, null, '删除配置失败', 500);
  }
});

// 教学任务 API
app.get('/api/v1/teaching-tasks', authenticateToken, async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT t.*, 
             c.CourseName,
             cl.ClassName,
             s.SemesterName,
             u.RealName as TeacherName
      FROM edu_teaching_task t
      LEFT JOIN edu_course c ON t.course_id = c.CourseID
      LEFT JOIN edu_class cl ON t.class_id = cl.ClassID
      LEFT JOIN edu_semester s ON t.semester_id = s.SemesterID
      LEFT JOIN sys_user u ON t.teacher_id = u.UserID
      ORDER BY t.id DESC
    `);
    const tasks = rows.map((row) => ({
      TaskID: row.id,
      TaskCode: row.task_code || `TASK-${row.id}`,
      SemesterID: row.semester_id,
      SemesterName: row.SemesterName || '',
      CourseID: row.course_id,
      CourseName: row.CourseName || '未知课程',
      course_name: row.CourseName || '未知课程',
      ClassID: row.class_id,
      ClassName: row.ClassName || '未知班级',
      class_name: row.ClassName || '未知班级',
      TeacherID: row.teacher_id,
      TeacherName: row.TeacherName || '未分配教师',
      WeeklyHours: row.weekly_hours,
      TotalHours: row.total_hours,
      StartWeek: row.start_week || 1,
      EndWeek: row.end_week || 16,
      ExamMode: row.exam_mode || 'Exam',
      Classroom: row.classroom,
      Status: row.status,
      SortOrder: row.sort_order || 0,
      Description: row.description || '',
      CreatedAt: row.created_at,
      UpdatedAt: row.updated_at
    }));
    sendResponse(res, tasks);
  } catch (error) {
    console.error('获取教学任务列表错误:', error);
    sendResponse(res, null, '获取教学任务列表失败', 500);
  }
});

app.post('/api/v1/teaching-tasks', authenticateToken, async (req, res) => {
  const { SemesterID, CourseID, ClassID, TeacherID, WeeklyHours, TotalHours, Classroom, Status } = req.body;
  try {
    const [result] = await pool.query(
      'INSERT INTO edu_teaching_task (semester_id, course_id, class_id, teacher_id, weekly_hours, total_hours, classroom, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [SemesterID, CourseID, ClassID, TeacherID || null, WeeklyHours, TotalHours, Classroom, Status || 1]
    );
    sendResponse(res, { id: result.insertId });
  } catch (error) {
    console.error('创建教学任务错误:', error);
    sendResponse(res, null, '创建教学任务失败', 500);
  }
});

app.put('/api/v1/teaching-tasks/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { SemesterID, CourseID, ClassID, TeacherID, WeeklyHours, TotalHours, Classroom, Status } = req.body;
  try {
    await pool.query(
      'UPDATE edu_teaching_task SET semester_id = ?, course_id = ?, class_id = ?, teacher_id = ?, weekly_hours = ?, total_hours = ?, classroom = ?, status = ? WHERE id = ?',
      [SemesterID, CourseID, ClassID, TeacherID || null, WeeklyHours, TotalHours, Classroom, Status, id]
    );
    sendResponse(res);
  } catch (error) {
    console.error('更新教学任务错误:', error);
    sendResponse(res, null, '更新教学任务失败', 500);
  }
});

app.delete('/api/v1/teaching-tasks/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM edu_teaching_task WHERE id = ?', [id]);
    sendResponse(res);
  } catch (error) {
    console.error('删除教学任务错误:', error);
    sendResponse(res, null, '删除教学任务失败', 500);
  }
});

// 实验教学任务 API
app.get('/api/v1/experiment-tasks', authenticateToken, async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT et.*, s.SemesterName, m.MajorName, 
             c.ClassName, o.name as OrgName, d.DepartmentName as DeptName
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
      SemesterName: row.SemesterName || '',
      MajorID: row.major_id,
      MajorName: row.MajorName || '',
      ClassID: row.class_id,
      ClassName: row.ClassName || '',
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
      OrgName: row.OrgName || '',
      DeptID: row.dept_id,
      DeptName: row.DeptName || '',
      TeacherName: row.teacher_name,
      TeacherTitle: row.teacher_title,
      TechnicianName: row.technician_name,
      TechnicianTitle: row.technician_title,
      TextbookName: row.textbook_name,
      GuidebookName: row.guidebook_name,
      Status: row.status,
      CreatedAt: row.created_at,
      UpdatedAt: row.updated_at
    }));
    sendResponse(res, tasks);
  } catch (error) {
    console.error('获取实验教学任务列表错误:', error);
    sendResponse(res, null, '获取实验教学任务列表失败', 500);
  }
});

app.get('/api/v1/experiment-tasks/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await pool.query(`
      SELECT et.*, s.name as semester_name, m.name as major_name, 
             c.name as class_name, o.name as org_name, d.name as dept_name
      FROM edu_experiment_task et
      LEFT JOIN edu_semester s ON et.semester_id = s.id
      LEFT JOIN edu_major m ON et.major_id = m.id
      LEFT JOIN edu_class c ON et.class_id = c.id
      LEFT JOIN sys_organization o ON et.org_id = o.id
      LEFT JOIN sys_department d ON et.dept_id = d.id
      WHERE et.id = ?
    `, [id]);
    if (rows.length === 0) {
      return sendResponse(res, null, '实验教学任务不存在', 404);
    }
    const row = rows[0];
    const task = {
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
      Status: row.status,
      CreatedAt: row.created_at,
      UpdatedAt: row.updated_at
    };
    sendResponse(res, task);
  } catch (error) {
    console.error('获取实验教学任务详情错误:', error);
    sendResponse(res, null, '获取实验教学任务详情失败', 500);
  }
});

app.post('/api/v1/experiment-tasks', authenticateToken, async (req, res) => {
  const {
    SemesterID, MajorID, ClassID, StudentCount, StudentLevel,
    CourseName, CourseCategory, IsIndependent,
    ExperimentTotalHours, ExperimentCurrentHours,
    PracticeTotalHours, PracticeCurrentHours,
    TrainingTotalHours, TrainingCurrentHours,
    OrgID, DeptID, TeacherName, TeacherTitle,
    TechnicianName, TechnicianTitle, TextbookName, GuidebookName, Status
  } = req.body;
  try {
    const [result] = await pool.query(
      'INSERT INTO edu_experiment_task (semester_id, major_id, class_id, student_count, student_level, course_name, course_category, is_independent, experiment_total_hours, experiment_current_hours, practice_total_hours, practice_current_hours, training_total_hours, training_current_hours, org_id, dept_id, teacher_name, teacher_title, technician_name, technician_title, textbook_name, guidebook_name, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [
        SemesterID, MajorID || null, ClassID || null, StudentCount || 0, StudentLevel,
        CourseName, CourseCategory, IsIndependent || 0,
        ExperimentTotalHours || 0, ExperimentCurrentHours || 0,
        PracticeTotalHours || 0, PracticeCurrentHours || 0,
        TrainingTotalHours || 0, TrainingCurrentHours || 0,
        OrgID || null, DeptID || null, TeacherName, TeacherTitle,
        TechnicianName, TechnicianTitle, TextbookName, GuidebookName, Status || 1
      ]
    );
    sendResponse(res, { id: result.insertId });
  } catch (error) {
    console.error('创建实验教学任务错误:', error);
    sendResponse(res, null, '创建实验教学任务失败', 500);
  }
});

app.put('/api/v1/experiment-tasks/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const {
    SemesterID, MajorID, ClassID, StudentCount, StudentLevel,
    CourseName, CourseCategory, IsIndependent,
    ExperimentTotalHours, ExperimentCurrentHours,
    PracticeTotalHours, PracticeCurrentHours,
    TrainingTotalHours, TrainingCurrentHours,
    OrgID, DeptID, TeacherName, TeacherTitle,
    TechnicianName, TechnicianTitle, TextbookName, GuidebookName, Status
  } = req.body;
  try {
    await pool.query(
      'UPDATE edu_experiment_task SET semester_id = ?, major_id = ?, class_id = ?, student_count = ?, student_level = ?, course_name = ?, course_category = ?, is_independent = ?, experiment_total_hours = ?, experiment_current_hours = ?, practice_total_hours = ?, practice_current_hours = ?, training_total_hours = ?, training_current_hours = ?, org_id = ?, dept_id = ?, teacher_name = ?, teacher_title = ?, technician_name = ?, technician_title = ?, textbook_name = ?, guidebook_name = ?, status = ? WHERE id = ?',
      [
        SemesterID, MajorID || null, ClassID || null, StudentCount || 0, StudentLevel,
        CourseName, CourseCategory, IsIndependent || 0,
        ExperimentTotalHours || 0, ExperimentCurrentHours || 0,
        PracticeTotalHours || 0, PracticeCurrentHours || 0,
        TrainingTotalHours || 0, TrainingCurrentHours || 0,
        OrgID || null, DeptID || null, TeacherName, TeacherTitle,
        TechnicianName, TechnicianTitle, TextbookName, GuidebookName, Status, id
      ]
    );
    sendResponse(res);
  } catch (error) {
    console.error('更新实验教学任务错误:', error);
    sendResponse(res, null, '更新实验教学任务失败', 500);
  }
});

app.delete('/api/v1/experiment-tasks/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM edu_experiment_task WHERE id = ?', [id]);
    sendResponse(res);
  } catch (error) {
    console.error('删除实验教学任务错误:', error);
    sendResponse(res, null, '删除实验教学任务失败', 500);
  }
});

// 实验项目库 API
app.get('/api/v1/experiment-projects', authenticateToken, async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM edu_experiment_project ORDER BY id DESC');
    sendResponse(res, rows);
  } catch (error) {
    console.error('获取实验项目库错误:', error);
    sendResponse(res, null, '获取实验项目库失败', 500);
  }
});

app.get('/api/v1/experiment-projects/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await pool.query('SELECT * FROM edu_experiment_project WHERE id = ?', [id]);
    if (rows.length === 0) {
      return sendResponse(res, null, '实验项目不存在', 404);
    }
    sendResponse(res, rows[0]);
  } catch (error) {
    console.error('获取实验项目详情错误:', error);
    sendResponse(res, null, '获取实验项目详情失败', 500);
  }
});

app.post('/api/v1/experiment-projects', authenticateToken, async (req, res) => {
  const { courseCode, projectName, experimentHours, experimentType, experimentRequirement, status, description } = req.body;
  try {
    const [result] = await pool.query(
      'INSERT INTO edu_experiment_project (course_code, project_name, experiment_hours, experiment_type, experiment_requirement, status, description) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [courseCode, projectName, experimentHours || 0, experimentType, experimentRequirement, status || 1, description]
    );
    sendResponse(res, { id: result.insertId });
  } catch (error) {
    console.error('创建实验项目错误:', error);
    sendResponse(res, null, '创建实验项目失败', 500);
  }
});

app.put('/api/v1/experiment-projects/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { courseCode, projectName, experimentHours, experimentType, experimentRequirement, status, description } = req.body;
  try {
    await pool.query(
      'UPDATE edu_experiment_project SET course_code = ?, project_name = ?, experiment_hours = ?, experiment_type = ?, experiment_requirement = ?, status = ?, description = ? WHERE id = ?',
      [courseCode, projectName, experimentHours || 0, experimentType, experimentRequirement, status, description, id]
    );
    sendResponse(res);
  } catch (error) {
    console.error('更新实验项目错误:', error);
    sendResponse(res, null, '更新实验项目失败', 500);
  }
});

app.delete('/api/v1/experiment-projects/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM edu_experiment_project WHERE id = ?', [id]);
    sendResponse(res);
  } catch (error) {
    console.error('删除实验项目错误:', error);
    sendResponse(res, null, '删除实验项目失败', 500);
  }
});

// 实验项目开出 API
app.get('/api/v1/experiment-offers', authenticateToken, async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT eo.*, et.course_name as TaskCourseName, ep.project_name as ProjectName
      FROM edu_experiment_project_offer eo
      LEFT JOIN edu_experiment_task et ON eo.task_id = et.id
      LEFT JOIN edu_experiment_project ep ON eo.project_id = ep.id
      ORDER BY eo.id DESC
    `);
    sendResponse(res, rows);
  } catch (error) {
    console.error('获取实验项目开出错误:', error);
    sendResponse(res, null, '获取实验项目开出失败', 500);
  }
});

app.get('/api/v1/experiment-offers/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await pool.query(`
      SELECT eo.*, et.course_name as TaskCourseName, ep.project_name as ProjectName
      FROM edu_experiment_project_offer eo
      LEFT JOIN edu_experiment_task et ON eo.task_id = et.id
      LEFT JOIN edu_experiment_project ep ON eo.project_id = ep.id
      WHERE eo.id = ?
    `, [id]);
    if (rows.length === 0) {
      return sendResponse(res, null, '实验项目开出不存在', 404);
    }
    sendResponse(res, rows[0]);
  } catch (error) {
    console.error('获取实验项目开出详情错误:', error);
    sendResponse(res, null, '获取实验项目开出详情失败', 500);
  }
});

app.post('/api/v1/experiment-offers', authenticateToken, async (req, res) => {
  const { taskId, projectId, weekNo, weekDay, timeSlot, groupCount, studentsPerGroup, cycleCount, experimentRequirement, buildingName, roomNumber, isOffered, notOfferedReason, status } = req.body;
  try {
    const [result] = await pool.query(
      'INSERT INTO edu_experiment_project_offer (task_id, project_id, week_no, week_day, time_slot, group_count, students_per_group, cycle_count, experiment_requirement, building_name, room_number, is_offered, not_offered_reason, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [taskId, projectId, weekNo, weekDay, timeSlot, groupCount || 1, studentsPerGroup || 1, cycleCount || 1, experimentRequirement, buildingName, roomNumber, isOffered || 1, notOfferedReason, status || 1]
    );
    sendResponse(res, { id: result.insertId });
  } catch (error) {
    console.error('创建实验项目开出错误:', error);
    sendResponse(res, null, '创建实验项目开出失败', 500);
  }
});

app.put('/api/v1/experiment-offers/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { taskId, projectId, weekNo, weekDay, timeSlot, groupCount, studentsPerGroup, cycleCount, experimentRequirement, buildingName, roomNumber, isOffered, notOfferedReason, status } = req.body;
  try {
    await pool.query(
      'UPDATE edu_experiment_project_offer SET task_id = ?, project_id = ?, week_no = ?, week_day = ?, time_slot = ?, group_count = ?, students_per_group = ?, cycle_count = ?, experiment_requirement = ?, building_name = ?, room_number = ?, is_offered = ?, not_offered_reason = ?, status = ? WHERE id = ?',
      [taskId, projectId, weekNo, weekDay, timeSlot, groupCount || 1, studentsPerGroup || 1, cycleCount || 1, experimentRequirement, buildingName, roomNumber, isOffered, notOfferedReason, status, id]
    );
    sendResponse(res);
  } catch (error) {
    console.error('更新实验项目开出错误:', error);
    sendResponse(res, null, '更新实验项目开出失败', 500);
  }
});

app.delete('/api/v1/experiment-offers/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM edu_experiment_project_offer WHERE id = ?', [id]);
    sendResponse(res);
  } catch (error) {
    console.error('删除实验项目开出错误:', error);
    sendResponse(res, null, '删除实验项目开出失败', 500);
  }
});

// 实验课程教学质量 API
app.get('/api/v1/experiment-quality', authenticateToken, async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT eq.*, et.course_name as TaskCourseName
      FROM edu_experiment_quality eq
      LEFT JOIN edu_experiment_task et ON eq.task_id = et.id
      ORDER BY eq.id DESC
    `);
    sendResponse(res, rows);
  } catch (error) {
    console.error('获取实验课程教学质量错误:', error);
    sendResponse(res, null, '获取实验课程教学质量失败', 500);
  }
});

app.get('/api/v1/experiment-quality/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await pool.query(`
      SELECT eq.*, et.course_name as TaskCourseName
      FROM edu_experiment_quality eq
      LEFT JOIN edu_experiment_task et ON eq.task_id = et.id
      WHERE eq.id = ?
    `, [id]);
    if (rows.length === 0) {
      return sendResponse(res, null, '实验课程教学质量不存在', 404);
    }
    sendResponse(res, rows[0]);
  } catch (error) {
    console.error('获取实验课程教学质量详情错误:', error);
    sendResponse(res, null, '获取实验课程教学质量详情失败', 500);
  }
});

app.post('/api/v1/experiment-quality', authenticateToken, async (req, res) => {
  const { taskId, organization, courseName, experimentHours, isIndependent, teacherName, teacherTitle, technicianName, technicianTitle, className, classStudentCount, plannedProjectCount, actualProjectCount, notOfferedProjects, notOfferedReasons, assessmentMethod, assessmentCount, assessmentTime, status } = req.body;
  try {
    const formattedAssessmentTime = formatDateTime(assessmentTime);
    const [result] = await pool.query(
      'INSERT INTO edu_experiment_quality (task_id, organization, course_name, experiment_hours, is_independent, teacher_name, teacher_title, technician_name, technician_title, class_name, class_student_count, planned_project_count, actual_project_count, not_offered_projects, not_offered_reasons, assessment_method, assessment_count, assessment_time, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [taskId, organization, courseName, experimentHours || 0, isIndependent || 0, teacherName, teacherTitle, technicianName, technicianTitle, className, classStudentCount || 0, plannedProjectCount || 0, actualProjectCount || 0, notOfferedProjects, notOfferedReasons, assessmentMethod, assessmentCount || 0, formattedAssessmentTime, status || 1]
    );
    sendResponse(res, { id: result.insertId });
  } catch (error) {
    console.error('创建实验课程教学质量错误:', error);
    sendResponse(res, null, '创建实验课程教学质量失败', 500);
  }
});

function formatDateTime(datetimeStr) {
  if (!datetimeStr) return null;
  try {
    const date = new Date(datetimeStr);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  } catch {
    return null;
  }
}

app.put('/api/v1/experiment-quality/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { taskId, organization, courseName, experimentHours, isIndependent, teacherName, teacherTitle, technicianName, technicianTitle, className, classStudentCount, plannedProjectCount, actualProjectCount, notOfferedProjects, notOfferedReasons, assessmentMethod, assessmentCount, assessmentTime, status } = req.body;
  try {
    const formattedAssessmentTime = formatDateTime(assessmentTime);
    const [result] = await pool.query(
      'UPDATE edu_experiment_quality SET task_id = ?, organization = ?, course_name = ?, experiment_hours = ?, is_independent = ?, teacher_name = ?, teacher_title = ?, technician_name = ?, technician_title = ?, class_name = ?, class_student_count = ?, planned_project_count = ?, actual_project_count = ?, not_offered_projects = ?, not_offered_reasons = ?, assessment_method = ?, assessment_count = ?, assessment_time = ?, status = ? WHERE id = ?',
      [taskId, organization, courseName, experimentHours || 0, isIndependent, teacherName, teacherTitle, technicianName, technicianTitle, className, classStudentCount || 0, plannedProjectCount || 0, actualProjectCount || 0, notOfferedProjects, notOfferedReasons, assessmentMethod, assessmentCount || 0, formattedAssessmentTime, status, id]
    );
    if (result.affectedRows === 0) {
      return sendResponse(res, null, '未找到该记录', 404);
    }
    sendResponse(res);
  } catch (error) {
    console.error('更新实验课程教学质量错误:', error);
    sendResponse(res, null, '更新实验课程教学质量失败', 500);
  }
});

app.delete('/api/v1/experiment-quality/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM edu_experiment_quality WHERE id = ?', [id]);
    sendResponse(res);
  } catch (error) {
    console.error('删除实验课程教学质量错误:', error);
    sendResponse(res, null, '删除实验课程教学质量失败', 500);
  }
});

// 实训教学计划 API
app.get('/api/v1/training-plans', authenticateToken, async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM edu_training_plan ORDER BY id DESC');
    const plans = rows.map((row) => ({
      id: row.id,
      courseCode: row.course_code,
      organizationMode: row.organization_mode,
      trainingLocation: row.training_location,
      trainingPurpose: row.training_purpose,
      teachingContent: row.teaching_content,
      trainingMethod: row.training_method,
      assessmentMethod: row.assessment_method,
      qualityMeasures: row.quality_measures,
      centerOpinion: row.center_opinion,
      departmentOpinion: row.department_opinion,
      status: row.status
    }));
    sendResponse(res, plans);
  } catch (error) {
    console.error('获取实训教学计划错误:', error);
    sendResponse(res, null, '获取实训教学计划失败', 500);
  }
});

app.get('/api/v1/training-plans/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await pool.query('SELECT * FROM edu_training_plan WHERE id = ?', [id]);
    if (rows.length === 0) {
      return sendResponse(res, null, '实训教学计划不存在', 404);
    }
    const row = rows[0];
    sendResponse(res, {
      id: row.id,
      courseCode: row.course_code,
      organizationMode: row.organization_mode,
      trainingLocation: row.training_location,
      trainingPurpose: row.training_purpose,
      teachingContent: row.teaching_content,
      trainingMethod: row.training_method,
      assessmentMethod: row.assessment_method,
      qualityMeasures: row.quality_measures,
      centerOpinion: row.center_opinion,
      departmentOpinion: row.department_opinion,
      status: row.status
    });
  } catch (error) {
    console.error('获取实训教学计划详情错误:', error);
    sendResponse(res, null, '获取实训教学计划详情失败', 500);
  }
});

app.post('/api/v1/training-plans', authenticateToken, async (req, res) => {
  const { courseCode, organizationMode, trainingLocation, trainingPurpose, teachingContent, trainingMethod, assessmentMethod, qualityMeasures, centerOpinion, departmentOpinion, status } = req.body;
  try {
    const [result] = await pool.query(
      'INSERT INTO edu_training_plan (course_code, organization_mode, training_location, training_purpose, teaching_content, training_method, assessment_method, quality_measures, center_opinion, department_opinion, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [courseCode, organizationMode, trainingLocation, trainingPurpose, teachingContent, trainingMethod, assessmentMethod, qualityMeasures, centerOpinion, departmentOpinion, status || 1]
    );
    sendResponse(res, { id: result.insertId });
  } catch (error) {
    console.error('创建实训教学计划错误:', error);
    sendResponse(res, null, '创建实训教学计划失败', 500);
  }
});

app.put('/api/v1/training-plans/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { courseCode, organizationMode, trainingLocation, trainingPurpose, teachingContent, trainingMethod, assessmentMethod, qualityMeasures, centerOpinion, departmentOpinion, status } = req.body;
  try {
    await pool.query(
      'UPDATE edu_training_plan SET course_code = ?, organization_mode = ?, training_location = ?, training_purpose = ?, teaching_content = ?, training_method = ?, assessment_method = ?, quality_measures = ?, center_opinion = ?, department_opinion = ?, status = ? WHERE id = ?',
      [courseCode, organizationMode, trainingLocation, trainingPurpose, teachingContent, trainingMethod, assessmentMethod, qualityMeasures, centerOpinion, departmentOpinion, status, id]
    );
    sendResponse(res);
  } catch (error) {
    console.error('更新实训教学计划错误:', error);
    sendResponse(res, null, '更新实训教学计划失败', 500);
  }
});

app.delete('/api/v1/training-plans/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM edu_training_plan WHERE id = ?', [id]);
    sendResponse(res);
  } catch (error) {
    console.error('删除实训教学计划错误:', error);
    sendResponse(res, null, '删除实训教学计划失败', 500);
  }
});

const ExportController = require('./controllers/exportController');
let exportController;

function getExportController() {
  if (!exportController) {
    exportController = new ExportController(pool);
  }
  return exportController;
}

function sendDocxBuffer(res, buffer, filename) {
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.send(buffer);
}

app.post('/api/v1/export/task-overview', authenticateToken, async (req, res) => {
  try {
    if (!exportController) {
      exportController = new ExportController(pool);
    }
    const buffer = await getExportController().exportTaskOverview(req.body);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.setHeader('Content-Disposition', 'attachment; filename=实验课程教学任务一览表.docx');
    res.send(buffer);
  } catch (error) {
    console.error('导出实验课程教学任务一览表错误:', error);
    res.status(500).json({ code: 500, message: '导出失败', data: null });
  }
});

app.post('/api/v1/export/teaching-plan', authenticateToken, async (req, res) => {
  try {
    if (!exportController) {
      exportController = new ExportController(pool);
    }
    const buffer = await getExportController().exportTeachingPlan(req.body);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.setHeader('Content-Disposition', 'attachment; filename=实验教学授课计划表.docx');
    res.send(buffer);
  } catch (error) {
    console.error('导出实验教学授课计划表错误:', error);
    res.status(500).json({ code: 500, message: '导出失败', data: null });
  }
});

app.post('/api/v1/export/project-statistics', authenticateToken, async (req, res) => {
  try {
    if (!exportController) {
      exportController = new ExportController(pool);
    }
    const buffer = await getExportController().exportProjectStatistics(req.body);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.setHeader('Content-Disposition', 'attachment; filename=已开出实验项目统计表.docx');
    res.send(buffer);
  } catch (error) {
    console.error('导出已开出实验项目统计表错误:', error);
    res.status(500).json({ code: 500, message: '导出失败', data: null });
  }
});

app.post('/api/v1/export/quality-analysis', authenticateToken, async (req, res) => {
  try {
    if (!exportController) {
      exportController = new ExportController(pool);
    }
    const buffer = await getExportController().exportQualityAnalysis(req.body);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.setHeader('Content-Disposition', 'attachment; filename=实验课程教学质量分析.docx');
    res.send(buffer);
  } catch (error) {
    console.error('导出实验课程教学质量分析错误:', error);
    res.status(500).json({ code: 500, message: '导出失败', data: null });
  }
});

app.post('/api/v1/export/project-library', authenticateToken, async (req, res) => {
  try {
    const buffer = await getExportController().exportProjectLibrary(req.body);
    sendDocxBuffer(res, buffer, 'experiment-project-library.docx');
  } catch (error) {
    console.error('瀵煎嚭瀹為獙椤圭洰搴撻敊璇?:', error);
    res.status(500).json({ code: 500, message: '导出失败', data: null });
  }
});

app.post('/api/v1/export/training-plan', authenticateToken, async (req, res) => {
  try {
    const buffer = await getExportController().exportTrainingPlan(req.body);
    sendDocxBuffer(res, buffer, 'training-plan.docx');
  } catch (error) {
    console.error('瀵煎嚭瀹炶鏁欏璁″垝閿欒:', error);
    res.status(500).json({ code: 500, message: '导出失败', data: null });
  }
});

async function initTestData() {
  try {
    const [tables] = await pool.query("SELECT name FROM sqlite_master WHERE type='table' AND name='edu_teaching_task'");
    if (tables.length > 0) {
      const [result] = await pool.query('SELECT COUNT(*) as cnt FROM edu_teaching_task');
      if (result[0].cnt === 0) {
        await pool.query(
          'INSERT INTO edu_teaching_task (semester_id, course_id, class_id, teacher_id, weekly_hours, total_hours, classroom, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
          [1, 1, 1, 2, 4, 64, '101教室', 1]
        );
        console.log('已插入教学任务测试数据');
      }
    }
  } catch (error) {
    console.error('初始化测试数据失败:', error);
  }
}

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

// 启动服务器
initDatabase().then(async () => {
  console.log('数据库初始化成功，开始初始化测试数据...');
  await initTestData();
  console.log('测试数据初始化完成');

  // ==================== 实验室排课预约模块路由 ====================

  // 获取实时占用状态
  app.get('/api/v1/scheduling/realtime-status', authenticateToken, async (req, res) => {
    try {
      const mockData = [
        { id: 1, room_name: '实验室A', room_number: '101', seat_count: 30, building_name: '实验楼1', status: 'available', course_name: null, teacher_name: null, project_name: null, time_slot_start: null, time_slot_end: null },
        { id: 2, room_name: '实验室B', room_number: '102', seat_count: 40, building_name: '实验楼1', status: 'occupied', course_name: '数据结构与算法', teacher_name: '张老师', project_name: null, time_slot_start: '8-10', time_slot_end: '10-12' },
        { id: 3, room_name: '实验室C', room_number: '201', seat_count: 35, building_name: '实验楼2', status: 'available', course_name: null, teacher_name: null, project_name: null, time_slot_start: null, time_slot_end: null }
      ];
      sendResponse(res, mockData);
    } catch (error) {
      console.error('获取实时占用状态错误:', error);
      sendResponse(res, null, '获取实时占用状态失败', 500);
    }
  });

  // 获取统计数据
  app.get('/api/v1/scheduling/statistics-by-dimension', authenticateToken, async (req, res) => {
    try {
      const { semesterId, dimension } = req.query;

      let sql;
      if (dimension === 'major') {
        sql = `SELECT major_id as dimension_id, major_name as dimension_name, COUNT(*) as scheduling_count 
               FROM lab_scheduling WHERE semester_id = ? AND status = 1 AND deleted_at IS NULL 
               GROUP BY major_id, major_name`;
      } else if (dimension === 'class') {
        sql = `SELECT class_id as dimension_id, class_name as dimension_name, COUNT(*) as scheduling_count 
               FROM lab_scheduling WHERE semester_id = ? AND status = 1 AND deleted_at IS NULL 
               GROUP BY class_id, class_name`;
      } else if (dimension === 'course') {
        sql = `SELECT course_id as dimension_id, course_name as dimension_name, COUNT(*) as scheduling_count 
               FROM lab_scheduling WHERE semester_id = ? AND status = 1 AND deleted_at IS NULL 
               GROUP BY course_id, course_name`;
      } else if (dimension === 'building') {
        sql = `SELECT building_id as dimension_id, building_name as dimension_name, COUNT(*) as scheduling_count 
               FROM lab_scheduling WHERE semester_id = ? AND status = 1 AND deleted_at IS NULL 
               GROUP BY building_id, building_name`;
      } else {
        sql = `SELECT room_id as dimension_id, room_name as dimension_name, COUNT(*) as scheduling_count 
               FROM lab_scheduling WHERE semester_id = ? AND status = 1 AND deleted_at IS NULL 
               GROUP BY room_id, room_name`;
      }

      const [rows] = await pool.query(sql, [semesterId || 1]);
      sendResponse(res, rows);
    } catch (error) {
      console.error('获取统计数据错误:', error);
      sendResponse(res, null, '获取统计数据失败', 500);
    }
  });

  // 加载排课模块
  const schedulingModule = require('./app/scheduling');
  schedulingModule(app, pool, authenticateToken, sendResponse);

  // 获取预约列表
  app.get('/api/v1/reservation', authenticateToken, async (req, res) => {
    try {
      const { semesterId, status } = req.query
      let sql = 'SELECT * FROM lab_reservation WHERE deleted_at IS NULL'
      const params = []

      if (semesterId) {
        sql += ' AND semester_id = ?'
        params.push(semesterId)
      }

      if (status && status !== 'all') {
        sql += ' AND approval_status = ?'
        params.push(status)
      }

      sql += ' ORDER BY created_at DESC'

      const [rows] = await pool.query(sql, params)
      sendResponse(res, rows)
    } catch (error) {
      console.error('获取预约列表错误:', error)
      sendResponse(res, null, '获取预约列表失败', 500)
    }
  });

  // 创建预约
  app.post('/api/v1/reservation', authenticateToken, async (req, res) => {
    const { semesterId, buildingId, buildingName, roomId, roomName, roomNumber, useDate, weekNo, weekDay, timeSlot, projectName, projectCategory, applicantId, applicantName, applicantPhone, projectLeader, projectLeaderPhone, memberGrade, memberClass, memberCount, expectedDuration, remarks } = req.body;

    try {
      const reservationCode = 'RV-' + Date.now() + '-' + Math.floor(Math.random() * 1000);

      const [result] = await pool.query(
        'INSERT INTO lab_reservation (reservation_code, semester_id, building_id, building_name, room_id, room_name, room_number, use_date, week_no, week_day, time_slot, project_name, project_category, applicant_id, applicant_name, applicant_phone, project_leader, project_leader_phone, member_grade, member_class, member_count, expected_duration, remarks, approval_status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, "pending")',
        [reservationCode, semesterId, buildingId, buildingName, roomId, roomName, roomNumber, useDate, weekNo, weekDay, timeSlot, projectName, projectCategory, applicantId || 1, applicantName || 'System Admin', applicantPhone, projectLeader, projectLeaderPhone, memberGrade, memberClass, memberCount, expectedDuration, remarks]
      );

      const [reservation] = await pool.query('SELECT * FROM lab_reservation WHERE id = ?', [result.insertId]);
      sendResponse(res, reservation[0], '预约申请提交成功');
    } catch (error) {
      console.error('创建预约错误:', error);
      sendResponse(res, null, '创建预约失败', 500);
    }
  });

  // 审批预约
  app.put('/api/v1/reservation/:id/approve', authenticateToken, async (req, res) => {
    const { id } = req.params;
    const { approvalStatus, approvalComment } = req.body;

    try {
      const [reservations] = await pool.query('SELECT * FROM lab_reservation WHERE id = ?', [id]);
      if (reservations.length === 0) {
        return sendResponse(res, null, '预约记录不存在', 404);
      }

      const reservation = reservations[0];
      const approved = approvalStatus === 'approved';

      await pool.query('UPDATE lab_reservation SET approval_status = ?, approval_comment = ?, updated_at = datetime("now") WHERE id = ?', [approvalStatus, approvalComment, id]);

      if (approved) {
        const schedulingCode = 'RV-' + Date.now() + '-' + Math.floor(Math.random() * 1000);

        await pool.query(
          'INSERT INTO lab_scheduling (scheduling_code, semester_id, course_name, class_name, teacher_name, building_id, building_name, room_id, room_name, room_number, week_no, week_day, time_slot_start, time_slot_end, student_count, source_type, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
          [schedulingCode, reservation.semester_id, reservation.project_name, reservation.member_class || '-', reservation.project_leader, reservation.building_id, reservation.building_name, reservation.room_id, reservation.room_name, reservation.room_number, reservation.week_no, reservation.week_day, reservation.time_slot, reservation.time_slot, reservation.member_count || 0, 'Reservation', 1]
        );
      }

      const [updatedReservation] = await pool.query('SELECT * FROM lab_reservation WHERE id = ?', [id]);
      sendResponse(res, updatedReservation[0], approved ? '审批通过，已写入排课表' : '审批驳回');
    } catch (error) {
      console.error('审批预约错误:', error);
      sendResponse(res, null, '审批预约失败', 500);
    }
  });

  // 取消预约
  app.put('/api/v1/reservation/:id/cancel', authenticateToken, async (req, res) => {
    const { id } = req.params;
    const { cancelReason } = req.body;

    try {
      const [reservations] = await pool.query('SELECT * FROM lab_reservation WHERE id = ?', [id]);
      if (reservations.length === 0) {
        return sendResponse(res, null, '预约记录不存在', 404);
      }

      const reservation = reservations[0];

      await pool.query('UPDATE lab_reservation SET approval_status = "cancelled", cancel_reason = ?, updated_at = datetime("now") WHERE id = ?', [cancelReason || '用户取消', id]);

      if (reservation.approval_status === 'approved') {
        await pool.query('UPDATE lab_scheduling SET status = 0 WHERE room_id = ? AND week_no = ? AND week_day = ? AND time_slot_start = ? AND source_type = "Reservation"',
          [reservation.room_id, reservation.week_no, reservation.week_day, reservation.time_slot]);
      }

      sendResponse(res, null, '取消成功，已释放实验室时段');
    } catch (error) {
      console.error('取消预约错误:', error);
      sendResponse(res, null, '取消预约失败', 500);
    }
  });

  // 获取授课申请列表
  app.get('/api/v1/teaching-request', authenticateToken, async (req, res) => {
    try {
      const { semesterId, status } = req.query;
      let sql = 'SELECT * FROM lab_teaching_request WHERE deleted_at IS NULL';
      const params = [];

      if (semesterId) {
        sql += ' AND semester_id = ?';
        params.push(semesterId);
      }

      if (status && status !== 'all') {
        sql += ' AND approval_status = ?';
        params.push(status);
      }

      sql += ' ORDER BY created_at DESC';

      const [rows] = await pool.query(sql, params);
      sendResponse(res, rows);
    } catch (error) {
      console.error('获取授课申请列表错误:', error);
      sendResponse(res, null, '获取授课申请列表失败', 500);
    }
  });

  // 创建授课申请
  app.post('/api/v1/teaching-request', authenticateToken, async (req, res) => {
    const { semesterId, teachingTaskId, courseId, courseName, majorId, majorName, grade, classId, className, weekNo, weekDay, timeSlot, expectedBuildingId, expectedBuildingName, expectedRoomId, expectedRoomName, remarks } = req.body;

    try {
      const requestCode = 'TR-' + Date.now() + '-' + Math.floor(Math.random() * 1000);
      const [result] = await pool.query(
        'INSERT INTO lab_teaching_request (request_code, semester_id, teaching_task_id, course_id, course_name, major_id, major_name, grade, class_id, class_name, week_no, week_day, time_slot, expected_building_id, expected_building_name, expected_room_id, expected_room_name, remarks, approval_status, applicant_id, applicant_name) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, "pending", 1, "System Admin")',
        [requestCode, semesterId, teachingTaskId, courseId, courseName, majorId, majorName, grade, classId, className, weekNo, weekDay, timeSlot, expectedBuildingId, expectedBuildingName, expectedRoomId, expectedRoomName, remarks]
      );

      const [request] = await pool.query('SELECT * FROM lab_teaching_request WHERE id = ?', [result.insertId]);
      sendResponse(res, request[0], '创建成功');
    } catch (error) {
      console.error('创建授课申请错误:', error);
      sendResponse(res, null, '创建授课申请失败', 500);
    }
  });

  // 审批授课申请
  app.put('/api/v1/teaching-request/:id/approve', authenticateToken, async (req, res) => {
    const { id } = req.params;
    const { approvalStatus, approvalComment, assignedBuildingId, assignedBuildingName, assignedRoomId, assignedRoomName, assignedRoomNumber } = req.body;

    try {
      const status = approvalStatus === 'approved' ? 'approved' : 'rejected';
      const updateFields = ['approval_status = ?', 'approval_comment = ?'];
      const updateParams = [status, approvalComment || ''];

      if (assignedBuildingId) {
        updateFields.push('assigned_building_id = ?', 'assigned_building_name = ?');
        updateParams.push(assignedBuildingId, assignedBuildingName || '');
      }
      if (assignedRoomId) {
        updateFields.push('assigned_room_id = ?', 'assigned_room_name = ?', 'assigned_room_number = ?');
        updateParams.push(assignedRoomId, assignedRoomName || '', assignedRoomNumber || '');
      }

      updateParams.push(id);
      await pool.query(`UPDATE lab_teaching_request SET ${updateFields.join(', ')} WHERE id = ?`, updateParams);

      const [request] = await pool.query('SELECT * FROM lab_teaching_request WHERE id = ?', [id]);
      sendResponse(res, request[0], status === 'approved' ? '审批通过' : '审批驳回');
    } catch (error) {
      console.error('审批授课申请错误:', error);
      sendResponse(res, null, '审批授课申请失败', 500);
    }
  });

  // 获取使用登记列表
  app.get('/api/v1/usage-registration', authenticateToken, async (req, res) => {
    try {
      const { semesterId, status } = req.query;
      let sql = 'SELECT * FROM lab_usage_registration WHERE deleted_at IS NULL';
      const params = [];

      if (semesterId) {
        sql += ' AND semester_id = ?';
        params.push(semesterId);
      }

      if (status && status !== 'all') {
        sql += ' AND registration_status = ?';
        params.push(status);
      }

      sql += ' ORDER BY use_date DESC';

      const [rows] = await pool.query(sql, params);
      sendResponse(res, rows);
    } catch (error) {
      console.error('获取使用登记列表错误:', error);
      sendResponse(res, null, '获取使用登记列表失败', 500);
    }
  });

  // 创建使用登记
  app.post('/api/v1/usage-registration', authenticateToken, async (req, res) => {
    const { semesterId, schedulingId, reservationId, sourceType, buildingId, buildingName, roomId, roomName, roomNumber, useDate, weekNo, courseName, experimentProjectId, experimentProjectName, experimentType, classId, className, teacherId, teacherName, plannedHours, actualDuration, expectedStudents, actualStudents, attendanceRecord, teachingRecord, equipmentRecord, reportDepartment, reporterId, reporterName } = req.body;

    try {
      console.log('收到使用登记请求:', req.body);

      let formattedUseDate = useDate;
      if (useDate && typeof useDate === 'string' && useDate.includes('T')) {
        formattedUseDate = useDate.split('T')[0];
      }

      const registrationCode = 'REG' + Date.now().toString().slice(-6);
      const [result] = await pool.query(
        'INSERT INTO lab_usage_registration (registration_code, semester_id, scheduling_id, reservation_id, source_type, building_id, building_name, room_id, room_name, room_number, use_date, week_no, course_name, experiment_project_id, experiment_project_name, experiment_type, class_id, class_name, teacher_id, teacher_name, planned_hours, actual_duration, expected_students, actual_students, attendance_record, teaching_record, equipment_record, registration_status, report_department, reporter_id, reporter_name, report_time) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)',
        [registrationCode, semesterId, schedulingId, reservationId, sourceType, buildingId, buildingName, roomId, roomName, roomNumber, formattedUseDate, weekNo, courseName, experimentProjectId, experimentProjectName, experimentType, classId, className, teacherId, teacherName, plannedHours, actualDuration, expectedStudents, actualStudents, attendanceRecord || '无', teachingRecord || '正常', equipmentRecord || '正常', 'registered', reportDepartment, reporterId || 1, reporterName || 'System Admin']
      );

      console.log('使用登记创建成功，ID:', result.insertId);
      const [registration] = await pool.query('SELECT * FROM lab_usage_registration WHERE id = ?', [result.insertId]);
      sendResponse(res, registration[0], '创建成功');
    } catch (error) {
      console.error('创建使用登记错误:', error);
      console.error('请求数据:', req.body);
      sendResponse(res, null, '创建使用登记失败: ' + error.message, 500);
    }
  });

  // 更新使用登记
  app.put('/api/v1/usage-registration/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    const { semesterId, schedulingId, reservationId, sourceType, buildingId, buildingName, roomId, roomName, roomNumber, useDate, weekNo, courseName, experimentProjectId, experimentProjectName, experimentType, classId, className, teacherId, teacherName, plannedHours, actualDuration, expectedStudents, actualStudents, attendanceRecord, teachingRecord, equipmentRecord, reportDepartment, reporterId, reporterName } = req.body;

    try {
      console.log('收到更新使用登记请求:', req.body);

      let formattedUseDate = useDate;
      if (useDate && typeof useDate === 'string' && useDate.includes('T')) {
        formattedUseDate = useDate.split('T')[0];
      }

      await pool.query(
        'UPDATE lab_usage_registration SET semester_id = ?, scheduling_id = ?, reservation_id = ?, source_type = ?, building_id = ?, building_name = ?, room_id = ?, room_name = ?, room_number = ?, use_date = ?, week_no = ?, course_name = ?, experiment_project_id = ?, experiment_project_name = ?, experiment_type = ?, class_id = ?, class_name = ?, teacher_id = ?, teacher_name = ?, planned_hours = ?, actual_duration = ?, expected_students = ?, actual_students = ?, attendance_record = ?, teaching_record = ?, equipment_record = ?, report_department = ?, reporter_id = ?, reporter_name = ? WHERE id = ?',
        [semesterId, schedulingId, reservationId, sourceType, buildingId, buildingName, roomId, roomName, roomNumber, formattedUseDate, weekNo, courseName, experimentProjectId, experimentProjectName, experimentType, classId, className, teacherId, teacherName, plannedHours, actualDuration, expectedStudents, actualStudents, attendanceRecord || '无', teachingRecord || '正常', equipmentRecord || '正常', reportDepartment, reporterId || 1, reporterName || 'System Admin', id]
      );

      const [registration] = await pool.query('SELECT * FROM lab_usage_registration WHERE id = ?', [id]);
      sendResponse(res, registration[0], '更新成功');
    } catch (error) {
      console.error('更新使用登记错误:', error);
      console.error('请求数据:', req.body);
      sendResponse(res, null, '更新使用登记失败: ' + error.message, 500);
    }
  });

  // 删除使用登记
  app.delete('/api/v1/usage-registration/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;

    try {
      console.log('收到删除使用登记请求，ID:', id);

      const [result] = await pool.query('DELETE FROM lab_usage_registration WHERE id = ?', [id]);

      if (result.affectedRows > 0) {
        sendResponse(res, null, '删除成功');
      } else {
        sendResponse(res, null, '未找到该使用登记', 404);
      }
    } catch (error) {
      console.error('删除使用登记错误:', error);
      sendResponse(res, null, '删除使用登记失败: ' + error.message, 500);
    }
  });

const sendNotification = async (userId, userName, notificationType, title, content, relatedType = null, relatedId = null) => {
  try {
    const notificationCode = 'NOTIFY_' + Date.now();
    await pool.query(
      'INSERT INTO lab_notification (notification_code, user_id, user_name, notification_type, title, content, related_type, related_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [notificationCode, userId, userName, notificationType, title, content, relatedType, relatedId]
    );
    console.log(`通知已发送: ${title} -> ${userName}`);
    return true;
  } catch (error) {
    console.error('发送通知失败:', error);
    return false;
  }
};

const sendNotificationToRole = async (role, notificationType, title, content, relatedType = null, relatedId = null) => {
  try {
    const [users] = await pool.query('SELECT id, RealName as name FROM sys_user WHERE role = ?', [role]);
    for (const user of users) {
      await sendNotification(user.id, user.name, notificationType, title, content, relatedType, relatedId);
    }
    return true;
  } catch (error) {
    console.error('发送角色通知失败:', error);
    return false;
  }
};

const sendOverdueReminder = async () => {
  try {
    const [overdueRecords] = await pool.query(`
      SELECT b.*, e.name as equipment_name, a.RealName as applicant_name
      FROM equ_borrow_record b
      LEFT JOIN equ_equipment e ON b.equipment_id = e.id
      LEFT JOIN sys_user a ON b.applicant_id = a.UserID
      WHERE b.status = 'borrowed' AND b.expect_return_date < datetime('now')
    `);
    
    for (const record of overdueRecords) {
      const days = Math.floor((new Date() - new Date(record.expect_return_date)) / (1000 * 60 * 60 * 24));
      const content = `您借用的【${record.equipment_name}】已逾期${days}天，请尽快归还。借单号：${record.borrow_code}`;
      await sendNotification(record.applicant_id, record.applicant_name, 'overdue', '设备逾期提醒', content, 'borrow', record.id);
    }
    
    console.log(`逾期提醒已发送: ${overdueRecords.length} 条`);
    return overdueRecords.length;
  } catch (error) {
    console.error('发送逾期提醒失败:', error);
    return 0;
  }
};

const sendCalibrationReminder = async () => {
  try {
    const [equipments] = await pool.query(`
      SELECT e.*, a.RealName as responsible_name
      FROM equ_equipment e
      LEFT JOIN sys_user a ON e.responsible_id = a.UserID
      WHERE e.calibration_date IS NOT NULL AND e.calibration_date >= date('now') AND e.calibration_date <= date('now', '+7 days')
    `);
    
    for (const equipment of equipments) {
      const content = `【${equipment.name}】(${equipment.asset_code}) 检定日期即将到期，请及时安排检定。`;
      if (equipment.responsible_id) {
        await sendNotification(equipment.responsible_id, equipment.responsible_name, 'calibration', '检定到期提醒', content, 'equipment', equipment.id);
      }
      await sendNotificationToRole('admin', 'calibration', '检定到期提醒', content, 'equipment', equipment.id);
    }
    
    console.log(`检定提醒已发送: ${equipments.length} 条`);
    return equipments.length;
  } catch (error) {
    console.error('发送检定提醒失败:', error);
    return 0;
  }
};

app.get('/api/v1/notification/send-test', authenticateToken, async (req, res) => {
  try {
    await sendNotification(req.user.id, req.user.name, 'test', '测试通知', '这是一条测试通知');
    sendResponse(res, null, '测试通知已发送');
  } catch (error) {
    console.error('发送测试通知失败:', error);
    sendResponse(res, null, '发送测试通知失败', 500);
  }
});

app.get('/api/v1/notification/send-overdue', authenticateToken, async (req, res) => {
  try {
    const count = await sendOverdueReminder();
    sendResponse(res, { count }, `已发送 ${count} 条逾期提醒`);
  } catch (error) {
    console.error('发送逾期提醒失败:', error);
    sendResponse(res, null, '发送逾期提醒失败', 500);
  }
});

app.get('/api/v1/notification/send-calibration', authenticateToken, async (req, res) => {
  try {
    const count = await sendCalibrationReminder();
    sendResponse(res, { count }, `已发送 ${count} 条检定提醒`);
  } catch (error) {
    console.error('发送检定提醒失败:', error);
    sendResponse(res, null, '发送检定提醒失败', 500);
  }
});

app.get('/api/v1/notification/count-unread', authenticateToken, async (req, res) => {
  try {
    const [result] = await pool.query('SELECT COUNT(*) as count FROM lab_notification WHERE user_id = ? AND is_read = 0', [req.user.id]);
    sendResponse(res, { count: result[0]?.count || 0 });
  } catch (error) {
    console.error('获取未读消息数量错误:', error);
    sendResponse(res, null, '获取未读消息数量失败', 500);
  }
});

app.put('/api/v1/notification/all-read', authenticateToken, async (req, res) => {
  try {
    await pool.query('UPDATE lab_notification SET is_read = 1 WHERE user_id = ?', [req.user.id]);
    sendResponse(res, null, '全部标为已读成功');
  } catch (error) {
    console.error('全部标为已读错误:', error);
    sendResponse(res, null, '全部标为已读失败', 500);
  }
});

  // 获取消息列表
  app.get('/api/v1/notification', authenticateToken, async (req, res) => {
    try {
      const [rows] = await pool.query('SELECT * FROM lab_notification WHERE user_id = ? ORDER BY created_at DESC', [req.user.id]);
      sendResponse(res, rows);
    } catch (error) {
      console.error('获取消息列表错误:', error);
      sendResponse(res, null, '获取消息列表失败', 500);
    }
  });

  // 标记消息已读
  app.put('/api/v1/notification/:id/read', authenticateToken, async (req, res) => {
    const { id } = req.params;

    try {
      await pool.query('UPDATE lab_notification SET is_read = 1 WHERE id = ? AND user_id = ?', [id, req.user.id]);
      sendResponse(res, null, '标记已读成功');
    } catch (error) {
      console.error('标记消息已读错误:', error);
      sendResponse(res, null, '标记消息已读失败', 500);
    }
  });

  // 排课数据统计 - 概览统计
  app.get('/api/v1/statistics/overview', authenticateToken, async (req, res) => {
    const { mode = 'realtime', semesterId, weekNo, startDate, endDate } = req.query;

    try {
      const semesterIdNum = semesterId ? parseInt(semesterId) : null;
      const weekNoNum = weekNo ? parseInt(weekNo) : null;

      let schedulingSql = 'SELECT s.student_count FROM lab_scheduling s WHERE s.status = 1';
      let registrationSql = 'SELECT ur.id FROM lab_usage_registration ur WHERE 1=1 AND ur.registration_status = "registered"';
      let totalRegistrationSql = 'SELECT id FROM lab_usage_registration WHERE 1=1';
      let schedParams = [];
      let regParams = [];
      let totalParams = [];

      if (mode === 'statistics') {
        if (semesterIdNum) {
          schedulingSql += ' AND s.semester_id = ?';
          schedParams.push(semesterIdNum);
          registrationSql += ' AND ur.semester_id = ?';
          totalRegistrationSql += ' AND semester_id = ?';
          regParams.push(semesterIdNum);
          totalParams.push(semesterIdNum);
        }
        if (weekNoNum) {
          schedulingSql += ' AND s.week_no = ?';
          schedParams.push(weekNoNum);
          registrationSql += ' AND ur.week_no = ?';
          totalRegistrationSql += ' AND week_no = ?';
          regParams.push(weekNoNum);
          totalParams.push(weekNoNum);
        }
        if (startDate && endDate) {
          schedulingSql += ' AND DATE(s.created_at) BETWEEN ? AND ?';
          schedParams.push(startDate, endDate);
          registrationSql += ' AND DATE(ur.created_at) BETWEEN ? AND ?';
          totalRegistrationSql += ' AND DATE(created_at) BETWEEN ? AND ?';
          regParams.push(startDate, endDate);
          totalParams.push(startDate, endDate);
        }
      }

      const [schedulingRes] = await pool.query(schedulingSql, schedParams);
      const [registrationRes] = await pool.query(registrationSql, regParams);
      const [totalRegistrationRes] = await pool.query(totalRegistrationSql, totalParams);

      const stats = {
        totalScheduling: schedulingRes.length || 0,
        totalHours: schedulingRes.reduce((sum, row) => sum + (row.student_count || 0), 0) || 0,
        occupiedCount: 0,
        registrationRate: totalRegistrationRes.length > 0
          ? Math.round((registrationRes.length / totalRegistrationRes.length) * 100)
          : 0
      };

      sendResponse(res, stats);
    } catch (error) {
      console.error('获取概览统计失败:', error);
      sendResponse(res, null, '获取概览统计失败', 500);
    }
  });

  // 排课数据统计 - 每周课室使用汇总
  app.get('/api/v1/statistics/weekly-usage', authenticateToken, async (req, res) => {
    const { weekNo, mode = 'realtime', semesterId, startDate, endDate } = req.query;

    try {
      const semesterIdNum = semesterId ? parseInt(semesterId) : null;
      const weekNoNum = weekNo ? parseInt(weekNo) : null;

      let sql = `
        SELECT 
          b.BuildingName as building_name, 
          r.RoomName as room_name, 
          s.week_no,
          COUNT(DISTINCT CONCAT(s.week_day, s.time_slot_start)) as scheduled_slots,
          35 as free_slots,
          ROUND(COUNT(DISTINCT CONCAT(s.week_day, s.time_slot_start)) / 35 * 100) as usage_rate
        FROM lab_scheduling s
        LEFT JOIN Ven_Room r ON s.room_id = r.RoomID
        LEFT JOIN Ven_Building b ON r.BuildingID = b.BuildingID
        WHERE s.status = 1
      `;
      const params = [];

      if (mode === 'statistics') {
        if (semesterIdNum) {
          sql += ' AND s.semester_id = ?';
          params.push(semesterIdNum);
        }
        if (weekNoNum) {
          sql += ' AND s.week_no = ?';
          params.push(weekNoNum);
        }
        if (startDate && endDate) {
          sql += ' AND DATE(s.created_at) BETWEEN ? AND ?';
          params.push(startDate, endDate);
        }
      } else {
        if (weekNoNum) {
          sql += ' AND s.week_no = ?';
          params.push(weekNoNum);
        }
      }

      sql += ' GROUP BY b.BuildingName, r.RoomName, s.week_no ORDER BY b.BuildingName, r.RoomName';

      const [rows] = await pool.query(sql, params);

      sendResponse(res, rows);
    } catch (error) {
      console.error('获取每周课室使用统计失败:', error);
      sendResponse(res, null, '获取每周课室使用统计失败', 500);
    }
  });

  // 排课数据统计 - 使用人次统计
  app.get('/api/v1/statistics/personnel', authenticateToken, async (req, res) => {
    const { dimension = 'building', mode = 'realtime', semesterId, weekNo, startDate, endDate } = req.query;

    try {
      const semesterIdNum = semesterId ? parseInt(semesterId) : null;
      const weekNoNum = weekNo ? parseInt(weekNo) : null;

      let sql = '';
      const params = [];

      if (dimension === 'building') {
        sql = `
          SELECT 
            b.BuildingName as name,
            SUM(s.student_count) as total_personnel,
            ROUND(SUM(s.student_count) / 30) as avg_daily
          FROM lab_scheduling s
          LEFT JOIN Ven_Room r ON s.room_id = r.RoomID
          LEFT JOIN Ven_Building b ON r.BuildingID = b.BuildingID
          WHERE s.status = 1
        `;
      } else {
        sql = `
          SELECT 
            r.RoomName as name,
            SUM(s.student_count) as total_personnel,
            ROUND(SUM(s.student_count) / 30) as avg_daily
          FROM lab_scheduling s
          LEFT JOIN Ven_Room r ON s.room_id = r.RoomID
          WHERE s.status = 1
        `;
      }

      if (mode === 'statistics') {
        if (semesterIdNum) {
          sql += ' AND s.semester_id = ?';
          params.push(semesterIdNum);
        }
        if (weekNoNum) {
          sql += ' AND s.week_no = ?';
          params.push(weekNoNum);
        }
        if (startDate && endDate) {
          sql += ' AND DATE(s.created_at) BETWEEN ? AND ?';
          params.push(startDate, endDate);
        }
      }

      if (dimension === 'building') {
        sql += ' GROUP BY b.BuildingName ORDER BY total_personnel DESC';
      } else {
        sql += ' GROUP BY r.RoomName ORDER BY total_personnel DESC';
      }

      const [rows] = await pool.query(sql, params);
      sendResponse(res, rows);
    } catch (error) {
      console.error('获取使用人次统计失败:', error);
      sendResponse(res, null, '获取使用人次统计失败', 500);
    }
  });

  // 排课数据统计 - 分专业统计
  app.get('/api/v1/statistics/major', authenticateToken, async (req, res) => {
    const { mode = 'realtime', semesterId, weekNo, startDate, endDate } = req.query;

    try {
      const semesterIdNum = semesterId ? parseInt(semesterId) : null;
      const weekNoNum = weekNo ? parseInt(weekNo) : null;

      let sql = `
        SELECT 
          s.major_name,
          COUNT(*) as total_hours,
          COUNT(DISTINCT s.course_id) as course_count,
          SUM(s.student_count) as student_count
        FROM lab_scheduling s
        WHERE s.status = 1 AND s.major_name IS NOT NULL
      `;
      const params = [];

      if (mode === 'statistics') {
        if (semesterIdNum) {
          sql += ' AND s.semester_id = ?';
          params.push(semesterIdNum);
        }
        if (weekNoNum) {
          sql += ' AND s.week_no = ?';
          params.push(weekNoNum);
        }
        if (startDate && endDate) {
          sql += ' AND DATE(s.created_at) BETWEEN ? AND ?';
          params.push(startDate, endDate);
        }
      }

      sql += ' GROUP BY s.major_name ORDER BY total_hours DESC';

      const [rows] = await pool.query(sql, params);
      sendResponse(res, rows);
    } catch (error) {
      console.error('获取专业统计失败:', error);
      sendResponse(res, null, '获取专业统计失败', 500);
    }
  });

  // 排课数据统计 - 分班级统计
  app.get('/api/v1/statistics/class', authenticateToken, async (req, res) => {
    const { mode = 'realtime', semesterId, weekNo, startDate, endDate } = req.query;

    try {
      const semesterIdNum = semesterId ? parseInt(semesterId) : null;
      const weekNoNum = weekNo ? parseInt(weekNo) : null;

      let sql = `
        SELECT 
          s.class_name,
          COUNT(*) as total_hours,
          COUNT(DISTINCT s.course_id) as course_count,
          SUM(s.student_count) as student_count
        FROM lab_scheduling s
        WHERE s.status = 1 AND s.class_name IS NOT NULL
      `;
      const params = [];

      if (mode === 'statistics') {
        if (semesterIdNum) {
          sql += ' AND s.semester_id = ?';
          params.push(semesterIdNum);
        }
        if (weekNoNum) {
          sql += ' AND s.week_no = ?';
          params.push(weekNoNum);
        }
        if (startDate && endDate) {
          sql += ' AND DATE(s.created_at) BETWEEN ? AND ?';
          params.push(startDate, endDate);
        }
      }

      sql += ' GROUP BY s.class_name ORDER BY total_hours DESC';

      const [rows] = await pool.query(sql, params);
      sendResponse(res, rows);
    } catch (error) {
      console.error('获取班级统计失败:', error);
      sendResponse(res, null, '获取班级统计失败', 500);
    }
  });

  // 排课数据统计 - 分年级统计
  app.get('/api/v1/statistics/grade', authenticateToken, async (req, res) => {
    const { mode = 'realtime', semesterId, weekNo, startDate, endDate } = req.query;

    try {
      const semesterIdNum = semesterId ? parseInt(semesterId) : null;
      const weekNoNum = weekNo ? parseInt(weekNo) : null;

      let sql = `
        SELECT 
          SUBSTRING(s.class_name, 1, 4) as grade_name,
          COUNT(*) as total_hours,
          COUNT(DISTINCT s.class_id) as class_count,
          SUM(s.student_count) as student_count
        FROM lab_scheduling s
        WHERE s.status = 1 AND s.class_name IS NOT NULL
      `;
      const params = [];

      if (mode === 'statistics') {
        if (semesterIdNum) {
          sql += ' AND s.semester_id = ?';
          params.push(semesterIdNum);
        }
        if (weekNoNum) {
          sql += ' AND s.week_no = ?';
          params.push(weekNoNum);
        }
        if (startDate && endDate) {
          sql += ' AND DATE(s.created_at) BETWEEN ? AND ?';
          params.push(startDate, endDate);
        }
      }

      sql += ' GROUP BY grade_name ORDER BY grade_name DESC';

      const [rows] = await pool.query(sql, params);
      sendResponse(res, rows);
    } catch (error) {
      console.error('获取年级统计失败:', error);
      sendResponse(res, null, '获取年级统计失败', 500);
    }
  });

  // 排课数据统计 - 分课程统计
  app.get('/api/v1/statistics/course', authenticateToken, async (req, res) => {
    const { mode = 'realtime', semesterId, weekNo, startDate, endDate } = req.query;

    try {
      const semesterIdNum = semesterId ? parseInt(semesterId) : null;
      const weekNoNum = weekNo ? parseInt(weekNo) : null;

      let sql = `
        SELECT 
          s.course_name,
          COUNT(*) as total_hours,
          COUNT(DISTINCT s.class_id) as class_count,
          s.teacher_name
        FROM lab_scheduling s
        WHERE s.status = 1 AND s.course_name IS NOT NULL
      `;
      const params = [];

      if (mode === 'statistics') {
        if (semesterIdNum) {
          sql += ' AND s.semester_id = ?';
          params.push(semesterIdNum);
        }
        if (weekNoNum) {
          sql += ' AND s.week_no = ?';
          params.push(weekNoNum);
        }
        if (startDate && endDate) {
          sql += ' AND DATE(s.created_at) BETWEEN ? AND ?';
          params.push(startDate, endDate);
        }
      }

      sql += ' GROUP BY s.course_name, s.teacher_name ORDER BY total_hours DESC';

      const [rows] = await pool.query(sql, params);
      sendResponse(res, rows);
    } catch (error) {
      console.error('获取课程统计失败:', error);
      sendResponse(res, null, '获取课程统计失败', 500);
    }
  });

  // 排课数据统计 - 预约使用统计
  app.get('/api/v1/statistics/reservation', authenticateToken, async (req, res) => {
    const { mode = 'realtime', semesterId, weekNo, startDate, endDate } = req.query;

    try {
      const semesterIdNum = semesterId ? parseInt(semesterId) : null;
      const weekNoNum = weekNo ? parseInt(weekNo) : null;

      let sql = `
        SELECT 
          project_category as category,
          COUNT(*) as reservation_count,
          SUM(expected_duration) as total_duration,
          ROUND(AVG(expected_duration), 1) as avg_duration
        FROM lab_reservation
        WHERE approval_status = "approved" AND is_cancelled = 0
      `;
      const params = [];

      if (mode === 'statistics') {
        if (semesterIdNum) {
          sql += ' AND semester_id = ?';
          params.push(semesterIdNum);
        }
        if (weekNoNum) {
          sql += ' AND week_no = ?';
          params.push(weekNoNum);
        }
        if (startDate && endDate) {
          sql += ' AND DATE(created_at) BETWEEN ? AND ?';
          params.push(startDate, endDate);
        }
      }

      sql += ' GROUP BY project_category ORDER BY reservation_count DESC';

      const [rows] = await pool.query(sql, params);
      sendResponse(res, rows);
    } catch (error) {
      console.error('获取预约统计失败:', error);
      sendResponse(res, null, '获取预约统计失败', 500);
    }
  });

  // 排课数据统计 - 使用登记完成率
  app.get('/api/v1/statistics/registration', authenticateToken, async (req, res) => {
    const { mode = 'realtime', semesterId, weekNo, startDate, endDate } = req.query;

    try {
      const semesterIdNum = semesterId ? parseInt(semesterId) : null;
      const weekNoNum = weekNo ? parseInt(weekNo) : null;

      let sql = `
        SELECT 
          report_department as department_name,
          SUM(CASE WHEN registration_status = "registered" THEN 1 ELSE 0 END) as registered_count,
          COUNT(*) as total_count,
          ROUND(SUM(CASE WHEN registration_status = "registered" THEN 1 ELSE 0 END) / COUNT(*) * 100) as completion_rate
        FROM lab_usage_registration
        WHERE 1=1
      `;
      const params = [];

      if (mode === 'statistics') {
        if (semesterIdNum) {
          sql += ' AND semester_id = ?';
          params.push(semesterIdNum);
        }
        if (weekNoNum) {
          sql += ' AND week_no = ?';
          params.push(weekNoNum);
        }
        if (startDate && endDate) {
          sql += ' AND DATE(created_at) BETWEEN ? AND ?';
          params.push(startDate, endDate);
        }
      }

      sql += ' GROUP BY report_department ORDER BY completion_rate DESC';

      const [rows] = await pool.query(sql, params);
      sendResponse(res, rows);
    } catch (error) {
      console.error('获取登记统计失败:', error);
      sendResponse(res, null, '获取登记统计失败', 500);
    }
  });

  // 排课数据统计 - 房间状态
  app.get('/api/v1/statistics/room-status', authenticateToken, async (req, res) => {
    try {
      const [rows] = await pool.query(`
        SELECT 
          r.RoomID as id,
          r.RoomName as room_name,
          b.BuildingName as building_name,
          r.Capacity as seat_count,
          'available' as status,
          NULL as course_name,
          NULL as teacher_name
        FROM Ven_Room r
        LEFT JOIN Ven_Building b ON r.BuildingID = b.BuildingID
        ORDER BY b.BuildingName, r.RoomName
      `);

      sendResponse(res, rows);
    } catch (error) {
      console.error('获取房间状态失败:', error);
      sendResponse(res, null, '获取房间状态失败', 500);
    }
  });

  // 排课数据统计 - 异常提醒
  app.get('/api/v1/statistics/alerts', authenticateToken, async (req, res) => {
    try {
      const [overdueRes] = await pool.query(`
        SELECT 
          'overdue' as type,
          room_name,
          '使用时间已超过7天，尚未登记' as description,
          created_at
        FROM lab_usage_registration
        WHERE registration_status = 'pending' 
          AND (JulianDay(CURRENT_TIMESTAMP) - JulianDay(use_date)) > 7
        ORDER BY created_at DESC
        LIMIT 10
      `);

      const alerts = [...overdueRes].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      sendResponse(res, alerts);
    } catch (error) {
      console.error('获取异常提醒失败:', error);
      sendResponse(res, null, '获取异常提醒失败', 500);
    }
  });

  // ==================== 设备管理API ====================

  // 设备分类管理
  app.get('/api/v1/equipment/categories', authenticateToken, async (req, res) => {
    try {
      const [rows] = await pool.query('SELECT * FROM equ_category WHERE status = 1 ORDER BY sort_order');
      sendResponse(res, rows);
    } catch (error) {
      console.error('获取设备分类错误:', error);
      sendResponse(res, null, '获取设备分类失败', 500);
    }
  });

  app.post('/api/v1/equipment/categories', authenticateToken, async (req, res) => {
    const { code, name, description, sort_order } = req.body;
    try {
      const [result] = await pool.query(
        'INSERT INTO equ_category (code, name, description, sort_order) VALUES (?, ?, ?, ?)',
        [code, name, description, sort_order || 0]
      );
      sendResponse(res, { id: result.insertId });
    } catch (error) {
      console.error('创建设备分类错误:', error);
      sendResponse(res, null, '创建设备分类失败', 500);
    }
  });

  app.put('/api/v1/equipment/categories/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    const { code, name, description, sort_order, status } = req.body;
    try {
      await pool.query(
        'UPDATE equ_category SET code = ?, name = ?, description = ?, sort_order = ?, status = ? WHERE id = ?',
        [code, name, description, sort_order, status, id]
      );
      sendResponse(res);
    } catch (error) {
      console.error('更新设备分类错误:', error);
      sendResponse(res, null, '更新设备分类失败', 500);
    }
  });

  app.delete('/api/v1/equipment/categories/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    try {
      await pool.query('DELETE FROM equ_category WHERE id = ?', [id]);
      sendResponse(res);
    } catch (error) {
      console.error('删除设备分类错误:', error);
      sendResponse(res, null, '删除设备分类失败', 500);
    }
  });

  // 设备管理
  app.get('/api/v1/equipment', authenticateToken, async (req, res) => {
    try {
      const { keyword, category_id, status, location, page = 1, pageSize = 20 } = req.query;
      
      let countSql = `
        SELECT COUNT(*) as total
        FROM equ_equipment e
        WHERE 1=1
      `;
      let sql = `
        SELECT e.*, 
               c.name as category_name,
               u.RealName as responsible_name
        FROM equ_equipment e
        LEFT JOIN equ_category c ON e.category_id = c.id
        LEFT JOIN sys_user u ON e.responsible_user_id = u.UserID
        WHERE 1=1
      `;
      const params = [];
      const countParams = [];

      if (keyword) {
        sql += ' AND (e.name LIKE ? OR e.asset_code LIKE ?)';
        countSql += ' AND (e.name LIKE ? OR e.asset_code LIKE ?)';
        params.push(`%${keyword}%`, `%${keyword}%`);
        countParams.push(`%${keyword}%`, `%${keyword}%`);
      }
      if (category_id) {
        sql += ' AND e.category_id = ?';
        countSql += ' AND e.category_id = ?';
        params.push(category_id);
        countParams.push(category_id);
      }
      if (status) {
        sql += ' AND e.status = ?';
        countSql += ' AND e.status = ?';
        params.push(status);
        countParams.push(status);
      }
      if (location) {
        sql += ' AND e.location LIKE ?';
        countSql += ' AND e.location LIKE ?';
        params.push(`%${location}%`);
        countParams.push(`%${location}%`);
      }

      const [countResult] = await pool.query(countSql, countParams);
      const total = countResult[0]?.total || 0;

      const offset = (page - 1) * pageSize;
      sql += ` ORDER BY e.created_at DESC LIMIT ? OFFSET ?`;
      params.push(parseInt(pageSize), offset);

      const [rows] = await pool.query(sql, params);
      sendResponse(res, { data: rows, total });
    } catch (error) {
      console.error('获取设备列表错误:', error);
      sendResponse(res, null, '获取设备列表失败', 500);
    }
  });

  app.post('/api/v1/equipment', authenticateToken, async (req, res) => {
    try {
      const {
        asset_code, name, model, category_id, unit, purchase_date, brand, serial_number,
        specification, price, funding_source, use_years, supplier, warranty_period,
        location, responsible_user_id, status, department_id, is_important, tags, description,
        attachments
      } = req.body;

      const [result] = await pool.query(
        `INSERT INTO equ_equipment 
        (asset_code, name, model, category_id, unit, purchase_date, brand, serial_number,
         specification, price, funding_source, use_years, supplier, warranty_period,
         location, responsible_user_id, status, department_id, is_important, tags, description)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          asset_code, 
          name, 
          model, 
          category_id || null, 
          unit, 
          purchase_date, 
          brand || null, 
          serial_number || null,
          specification || null, 
          price || 0, 
          funding_source || null, 
          use_years || null, 
          supplier || null, 
          warranty_period || null,
          location || null, 
          responsible_user_id || null, 
          status || 'available', 
          department_id || null, 
          is_important ? 1 : 0, 
          tags || null, 
          description || null
        ]
      );

      await pool.query(
        'INSERT INTO equ_operation_log (equipment_id, equipment_name, operation_type, operation_content, operator_id, operator_name, operator_ip) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [result.insertId, name, 'create', '新增设备', req.user.id, '管理员', req.ip || '127.0.0.1']
      );

      sendResponse(res, { id: result.insertId });
    } catch (error) {
      console.error('创建设备错误:', error);
      sendResponse(res, null, '创建设备失败: ' + error.message, 500);
    }
  });

  // 设备借还管理
  app.get('/api/v1/equipment/borrow', authenticateToken, async (req, res) => {
    try {
      const { status, applicant_id, keyword, page = 1, pageSize = 20, equipment_id } = req.query;
      
      let countSql = `
        SELECT COUNT(*) as total
        FROM equ_borrow_record b
        LEFT JOIN equ_equipment e ON b.equipment_id = e.id
        LEFT JOIN sys_user a ON b.applicant_id = a.UserID
        WHERE 1=1
      `;
      let sql = `
        SELECT b.*, 
               e.name as equipment_name,
               e.asset_code,
               a.RealName as applicant_name
        FROM equ_borrow_record b
        LEFT JOIN equ_equipment e ON b.equipment_id = e.id
        LEFT JOIN sys_user a ON b.applicant_id = a.UserID
        WHERE 1=1
      `;
      const params = [];
      const countParams = [];

      if (equipment_id) {
        sql += ' AND b.equipment_id = ?';
        countSql += ' AND b.equipment_id = ?';
        const eqId = parseInt(equipment_id);
        params.push(eqId);
        countParams.push(eqId);
      }
      if (status) {
        sql += ' AND b.status = ?';
        countSql += ' AND b.status = ?';
        params.push(status);
        countParams.push(status);
      }
      if (applicant_id) {
        sql += ' AND b.applicant_id = ?';
        countSql += ' AND b.applicant_id = ?';
        params.push(applicant_id);
        countParams.push(applicant_id);
      }
      if (keyword) {
        sql += ' AND (b.borrow_code LIKE ? OR e.name LIKE ?)';
        countSql += ' AND (b.borrow_code LIKE ? OR e.name LIKE ?)';
        params.push(`%${keyword}%`, `%${keyword}%`);
        countParams.push(`%${keyword}%`, `%${keyword}%`);
      }

      const [countResult] = await pool.query(countSql, countParams);
      const total = countResult[0]?.total || 0;

      const offset = (page - 1) * pageSize;
      sql += ` ORDER BY b.created_at DESC LIMIT ? OFFSET ?`;
      params.push(parseInt(pageSize), offset);

      const [rows] = await pool.query(sql, params);
      sendResponse(res, { data: rows, total });
    } catch (error) {
      console.error('获取借还记录错误:', error);
      sendResponse(res, null, '获取借还记录失败', 500);
    }
  });

  app.get('/api/v1/equipment/borrow/logs', authenticateToken, async (req, res) => {
    try {
      const { start_date, end_date, page = 1, pageSize = 20 } = req.query;
      
      let sql = `
        SELECT b.*, 
               e.name as equipment_name,
               e.asset_code,
               a.RealName as applicant_name
        FROM equ_borrow_record b
        LEFT JOIN equ_equipment e ON b.equipment_id = e.id
        LEFT JOIN sys_user a ON b.applicant_id = a.UserID
        WHERE 1=1
      `;

      if (start_date) {
        sql += ` AND b.borrow_date >= '${start_date}'`;
      }
      if (end_date) {
        sql += ` AND b.borrow_date <= '${end_date} 23:59:59'`;
      }

      sql += ` ORDER BY b.created_at DESC LIMIT ${parseInt(pageSize)} OFFSET ${(page - 1) * pageSize}`;

      const [rowsResult] = await pool.query(sql, []);
      
      const countSql = `
        SELECT COUNT(*) as total
        FROM equ_borrow_record b
        LEFT JOIN equ_equipment e ON b.equipment_id = e.id
        LEFT JOIN sys_user a ON b.applicant_id = a.UserID
        WHERE 1=1
      ` + (start_date ? ` AND b.borrow_date >= '${start_date}'` : '') + (end_date ? ` AND b.borrow_date <= '${end_date} 23:59:59'` : '');
      
      const [countResult] = await pool.query(countSql, []);
      const total = countResult[0]?.total || 0;

      res.json({ code: 200, message: '成功', data: { data: rowsResult, total } });
    } catch (error) {
      console.error('获取借还流水错误:', error);
      sendResponse(res, null, '获取借还流水失败', 500);
    }
  });

  app.get('/api/v1/equipment/borrow/logs/export', authenticateToken, async (req, res) => {
    console.log('开始导出借还流水...');
    try {
      const { start_date, end_date } = req.query;
      console.log('查询参数:', { start_date, end_date });
      
      let sql = `
        SELECT b.borrow_code, 
               e.name as equipment_name,
               e.asset_code,
               a.RealName as applicant_name,
               b.borrow_date,
               b.expect_return_date,
               b.actual_return_date,
               b.status,
               b.use_place,
               b.purpose,
               b.receive_user_name,
               b.receive_time,
               b.return_user_name,
               b.return_status,
               b.return_condition
        FROM equ_borrow_record b
        LEFT JOIN equ_equipment e ON b.equipment_id = e.id
        LEFT JOIN sys_user a ON b.applicant_id = a.UserID
        WHERE 1=1
      `;
      const params = [];

      if (start_date) {
        sql += ' AND b.borrow_date >= ?';
        params.push(start_date);
      }
      if (end_date) {
        sql += ' AND b.borrow_date <= ?';
        params.push(end_date);
      }

      sql += ' ORDER BY b.created_at DESC';
      console.log('SQL:', sql);
      console.log('Params:', params);

      const [rows] = await pool.query(sql, params);
      console.log('查询结果数量:', rows.length);
      
      // 处理数据
      const data = rows.map(row => ({
        '申请编号': row.borrow_code || '',
        '设备名称': row.equipment_name || '',
        '资产编号': row.asset_code || '',
        '借用人': row.applicant_name || '',
        '借用日期': formatDate(row.borrow_date),
        '预计归还日期': formatDate(row.expect_return_date),
        '实际归还日期': formatDate(row.actual_return_date),
        '状态': getStatusText(row.status),
        '使用地点': row.use_place || '',
        '用途': row.purpose || '',
        '领取人': row.receive_user_name || '',
        '领取时间': formatDate(row.receive_time),
        '归还人': row.return_user_name || '',
        '归还状态': getReturnStatusText(row.return_status),
        '归还备注': row.return_condition || ''
      }));

      console.log('处理后数据:', JSON.stringify(data));

      // 生成Excel
      const XLSX = require('xlsx');
      console.log('XLSX模块加载成功');
      const ws = XLSX.utils.json_to_sheet(data);
      console.log('工作表创建成功');
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, '借还流水');

      // 设置列宽
      ws['!cols'] = [
        { wch: 15 }, { wch: 20 }, { wch: 15 }, { wch: 12 },
        { wch: 20 }, { wch: 20 }, { wch: 20 }, { wch: 12 },
        { wch: 20 }, { wch: 30 }, { wch: 12 }, { wch: 20 },
        { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 30 }
      ];

      const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
      console.log('Excel生成成功，大小:', buffer.length);

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename=equipment-borrow-logs.xlsx');
      res.end(buffer);
      console.log('导出完成');
    } catch (error) {
      console.error('导出借还流水错误:', error);
      console.error('错误堆栈:', error.stack);
      sendResponse(res, null, '导出失败: ' + error.message, 500);
    }
  });

  app.get('/api/v1/equipment/overdue/export', authenticateToken, async (req, res) => {
    try {
      console.log('开始导出逾期清单...');

      const sql = `
        SELECT b.borrow_code, 
               e.name as equipment_name,
               e.asset_code,
               a.RealName as applicant_name,
               b.applicant_phone,
               b.expect_return_date,
               b.use_place,
               b.borrow_date,
               b.purpose
        FROM equ_borrow_record b
        LEFT JOIN equ_equipment e ON b.equipment_id = e.id
        LEFT JOIN sys_user a ON b.applicant_id = a.UserID
        WHERE b.status = 'borrowed' AND b.expect_return_date < datetime('now')
        ORDER BY b.expect_return_date ASC
      `;

      const [rows] = await pool.query(sql);
      console.log('查询逾期记录数量:', rows.length);

      const data = rows.map(row => {
        const now = new Date();
        const expectReturn = new Date(row.expect_return_date);
        const overdueDays = Math.floor((now - expectReturn) / (1000 * 60 * 60 * 24));
        
        return {
          '申请编号': row.borrow_code || '',
          '设备名称': row.equipment_name || '',
          '资产编号': row.asset_code || '',
          '借用人': row.applicant_name || '',
          '联系电话': row.applicant_phone || '',
          '借用日期': formatDate(row.borrow_date),
          '预计归还日期': formatDate(row.expect_return_date),
          '逾期天数': `${overdueDays}天`,
          '使用地点': row.use_place || '',
          '用途': row.purpose || ''
        };
      });

      console.log('处理后逾期数据:', JSON.stringify(data));

      const XLSX = require('xlsx');
      console.log('XLSX模块加载成功');
      const ws = XLSX.utils.json_to_sheet(data);
      console.log('工作表创建成功');
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, '逾期清单');

      ws['!cols'] = [
        { wch: 15 }, { wch: 20 }, { wch: 15 }, { wch: 12 },
        { wch: 15 }, { wch: 20 }, { wch: 20 }, { wch: 12 },
        { wch: 20 }, { wch: 30 }
      ];

      const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
      console.log('Excel生成成功，大小:', buffer.length);

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename=equipment-overdue-list.xlsx');
      res.end(buffer);
      console.log('逾期清单导出完成');
    } catch (error) {
      console.error('导出逾期清单错误:', error);
      console.error('错误堆栈:', error.stack);
      sendResponse(res, null, '导出失败: ' + error.message, 500);
    }
  });

  app.post('/api/v1/equipment/borrow', authenticateToken, async (req, res) => {
    const { equipment_id, borrow_date, expect_return_date, use_place, purpose, quantity, 
            applicant_name, applicant_phone, need_teacher_approval, teacher_name, status } = req.body;
    try {
      const [eqRows] = await pool.query('SELECT * FROM equ_equipment WHERE id = ?', [equipment_id]);
      if (eqRows.length === 0) {
        return sendResponse(res, null, '设备不存在', 404);
      }

      const equipment = eqRows[0];
      const borrowCode = `BRW${Date.now().toString().slice(-8)}`;
      const finalStatus = status || (need_teacher_approval ? 'pending_teacher' : 'pending_admin');

      const [result] = await pool.query(
        `INSERT INTO equ_borrow_record
        (borrow_code, equipment_id, equipment_name, asset_code, applicant_id, applicant_name,
         applicant_phone, borrow_date, expect_return_date, use_place, purpose, quantity, status,
         is_supervised, supervisor_name)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [borrowCode, equipment_id, equipment.name, equipment.asset_code,
         req.user.id, applicant_name || '用户', applicant_phone || '', borrow_date, expect_return_date, 
         use_place, purpose, quantity || 1, finalStatus,
         need_teacher_approval ? 1 : 0, teacher_name || '']
      );

      const applicantName = applicant_name || req.user.name || '用户';
      
      if (need_teacher_approval && teacher_name) {
        await sendNotificationToRole('teacher', 'borrow_apply', '借还申请待审批', 
          `【${equipment.name}】(${equipment.asset_code}) 借还申请已提交，请审批。借单号：${borrowCode}`, 'borrow', result.insertId);
      } else {
        await sendNotificationToRole('admin', 'borrow_apply', '借还申请待审批', 
          `【${equipment.name}】(${equipment.asset_code}) 借还申请已提交，请审批。借单号：${borrowCode}`, 'borrow', result.insertId);
      }
      
      await sendNotification(req.user.id, applicantName, 'borrow_apply', '借还申请已提交', 
        `您的【${equipment.name}】(${equipment.asset_code}) 借还申请已提交，等待审批。借单号：${borrowCode}`, 'borrow', result.insertId);

      sendResponse(res, { id: result.insertId, borrow_code: borrowCode });
    } catch (error) {
      console.error('申请借用错误:', error);
      sendResponse(res, null, '申请借用失败', 500);
    }
  });

  app.put('/api/v1/equipment/borrow/:id/approve', authenticateToken, async (req, res) => {
    const { id } = req.params;
    const { approval_status, approval_comment, is_supervised, supervisor_id, new_borrow_date, new_return_date } = req.body;
    try {
      const [rows] = await pool.query('SELECT * FROM equ_borrow_record WHERE id = ?', [id]);
      if (rows.length === 0) {
        return sendResponse(res, null, '记录不存在', 404);
      }

      const record = rows[0];
      let newStatus = approval_status;

      // 如果是导师审批通过，并且需要管理员审批，则状态改为待管理员审批
      if (is_supervised && approval_status === 'approved' && record.status === 'pending_teacher') {
        newStatus = 'pending_admin';
      }

      const now = new Date();
      const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;

      const updateFields = [];
      const updateValues = [];

      updateFields.push('status = ?');
      updateValues.push(newStatus);

      updateFields.push('approval_comment = ?');
      updateValues.push(approval_comment);

      updateFields.push('approval_time = ?');
      updateValues.push(dateStr);

      updateFields.push('approval_user_id = ?');
      updateValues.push(req.user.id);

      updateFields.push('approval_user_name = ?');
      updateValues.push(is_supervised ? '导师' : '管理员');

      // 如果提供了新的时间，则更新
      if (new_borrow_date) {
        updateFields.push('borrow_date = ?');
        updateValues.push(new_borrow_date);
      }
      if (new_return_date) {
        updateFields.push('expect_return_date = ?');
        updateValues.push(new_return_date);
      }

      updateValues.push(id);

      await pool.query(`UPDATE equ_borrow_record SET ${updateFields.join(', ')} WHERE id = ?`, updateValues);

      // 如果是最终审批通过，更新设备状态为已预约（待领取）
      if (newStatus === 'approved') {
        await pool.query('UPDATE equ_equipment SET status = ? WHERE id = ?', ['reserved', record.equipment_id]);
        
        await sendNotification(record.applicant_id, record.applicant_name, 'borrow_approved', '借还申请已通过', 
          `您的【${record.equipment_name}】(${record.asset_code}) 借还申请已通过审批，请前往领取。借单号：${record.borrow_code}`, 'borrow', id);
      } else if (approval_status === 'rejected') {
        await sendNotification(record.applicant_id, record.applicant_name, 'borrow_rejected', '借还申请已拒绝', 
          `您的【${record.equipment_name}】(${record.asset_code}) 借还申请未通过审批，原因：${approval_comment || '无'}。借单号：${record.borrow_code}`, 'borrow', id);
      } else if (newStatus === 'pending_admin') {
        await sendNotificationToRole('admin', 'borrow_apply', '借还申请待管理员审批', 
          `【${record.equipment_name}】(${record.asset_code}) 借还申请已通过导师审批，等待管理员审批。借单号：${record.borrow_code}`, 'borrow', id);
      }

      sendResponse(res);
    } catch (error) {
      console.error('审批错误:', error);
      sendResponse(res, null, '审批失败', 500);
    }
  });

  app.put('/api/v1/equipment/borrow/:id/receive', authenticateToken, async (req, res) => {
    const { id } = req.params;
    const { receive_user_name, check_status, receive_remark } = req.body;
    try {
      const [rows] = await pool.query('SELECT * FROM equ_borrow_record WHERE id = ?', [id]);
      if (rows.length === 0) {
        return sendResponse(res, null, '记录不存在', 404);
      }

      const now = new Date();
      const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;

      await pool.query(
        `UPDATE equ_borrow_record SET
        status = 'borrowed', receive_user_id = ?, receive_user_name = ?, receive_time = ?, remark = ?
        WHERE id = ?`,
        [req.user.id, receive_user_name || '管理员', dateStr, receive_remark || '', id]
      );

      await pool.query('UPDATE equ_equipment SET status = ? WHERE id = ?', ['borrowed', rows[0].equipment_id]);
      
      await sendNotification(rows[0].applicant_id, rows[0].applicant_name, 'borrow_receive', '设备已领取', 
        `您借用的【${rows[0].equipment_name}】(${rows[0].asset_code}) 已成功领取，请按时归还。借单号：${rows[0].borrow_code}`, 'borrow', id);

      sendResponse(res);
    } catch (error) {
      console.error('领取确认错误:', error);
      sendResponse(res, null, '领取确认失败', 500);
    }
  });

  app.put('/api/v1/equipment/borrow/:id/return', authenticateToken, async (req, res) => {
    const { id } = req.params;
    const { return_condition, return_status, return_user_name, accept_user_name } = req.body;
    try {
      const [rows] = await pool.query('SELECT * FROM equ_borrow_record WHERE id = ?', [id]);
      if (rows.length === 0) {
        return sendResponse(res, null, '记录不存在', 404);
      }

      // 确定最终状态
      let finalStatus = 'returned';
      if (return_status === 'damaged') {
        finalStatus = 'damaged';
      } else if (return_status === 'missing_parts') {
        finalStatus = 'missing_parts';
      }

      const now = new Date();
      const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;

      await pool.query(`UPDATE equ_borrow_record SET
        status = ?, actual_return_date = ?, return_user_id = ?, return_user_name = ?, 
        return_condition = ?, return_status = ?
        WHERE id = ?`,
        [finalStatus, dateStr, req.user.id, return_user_name || '管理员', 
         return_condition || '', return_status || 'returned', id]
      );

      // 根据归还状态更新设备状态
      let newStatus = 'available';
      if (return_status === 'damaged') {
        newStatus = 'maintenance';
      } else if (return_status === 'missing_parts') {
        newStatus = 'maintenance';
      }

      await pool.query('UPDATE equ_equipment SET status = ? WHERE id = ?', [newStatus, rows[0].equipment_id]);
      
      if (finalStatus === 'returned') {
        await sendNotification(rows[0].applicant_id, rows[0].applicant_name, 'borrow_return', '设备已归还', 
          `您借用的【${rows[0].equipment_name}】(${rows[0].asset_code}) 已成功归还。借单号：${rows[0].borrow_code}`, 'borrow', id);
      } else if (return_status === 'damaged' || return_status === 'missing_parts') {
        await sendNotification(rows[0].applicant_id, rows[0].applicant_name, 'borrow_damaged', '设备归还异常', 
          `您借用的【${rows[0].equipment_name}】(${rows[0].asset_code}) 归还时发现${return_status === 'damaged' ? '损坏' : '部件缺失'}，请配合处理。借单号：${rows[0].borrow_code}`, 'borrow', id);
        await sendNotificationToRole('admin', 'borrow_damaged', '设备归还异常', 
          `【${rows[0].equipment_name}】(${rows[0].asset_code}) 归还时发现${return_status === 'damaged' ? '损坏' : '部件缺失'}，请处理。借单号：${rows[0].borrow_code}`, 'borrow', id);
      }

      sendResponse(res);
    } catch (error) {
      console.error('归还验收错误:', error);
      sendResponse(res, null, '归还验收失败', 500);
    }
  });

  // 设备统计
  app.get('/api/v1/equipment/statistics', authenticateToken, async (req, res) => {
    try {
      const [statusCountRes] = await pool.query(`
        SELECT status, COUNT(*) as count
        FROM equ_equipment
        GROUP BY status
      `);

      const [categoryListRes] = await pool.query(`
        SELECT id, name FROM equ_category WHERE status = 1 ORDER BY sort_order
      `);

      const [categoryCountRes] = await pool.query(`
        SELECT c.name, COUNT(e.id) as count, COALESCE(SUM(e.price), 0) as total_value
        FROM equ_category c
        LEFT JOIN equ_equipment e ON c.id = e.category_id
        GROUP BY c.id
      `);

      const [valueRes] = await pool.query(`
        SELECT SUM(price) as total_value
        FROM equ_equipment
      `);

      const [borrowCountRes] = await pool.query(`
        SELECT COUNT(*) as borrowed_count
        FROM equ_borrow_record
        WHERE status = 'borrowed'
      `);

      const [overdueRes] = await pool.query(`
        SELECT COUNT(*) as overdue_count
        FROM equ_borrow_record
        WHERE status = 'borrowed' AND expect_return_date < datetime('now')
      `);

      let repairCount = 0;
      try {
        const [repairRes] = await pool.query(`
          SELECT COUNT(*) as repair_count
          FROM equ_repair_record
          WHERE status = 'pending'
        `);
        repairCount = repairRes[0]?.repair_count || 0;
      } catch (e) {
        console.warn('维修记录表不存在，跳过维修统计');
      }

      const [overdueListRes] = await pool.query(`
        SELECT b.*, e.name as equipment_name, e.asset_code
        FROM equ_borrow_record b
        LEFT JOIN equ_equipment e ON b.equipment_id = e.id
        WHERE b.status = 'borrowed' AND b.expect_return_date < datetime('now')
        ORDER BY b.expect_return_date ASC
        LIMIT 20
      `);

      const totalCount = statusCountRes.reduce((sum, item) => sum + item.count, 0);
      const statusStats = {};
      statusCountRes.forEach(item => {
        statusStats[item.status] = item.count;
      });

      // 定义所有状态的映射
      const statusInfoMap = {
        'available': { label: '在库-可用', description: '可借出', operations: '借出' },
        'maintenance': { label: '在库-待维修', description: '故障待修', operations: '送修、报废' },
        'pending_repair': { label: '在库-待维修', description: '故障待修', operations: '送修、报废' },
        'reserved': { label: '在库-已预约', description: '已审批未领取', operations: '-' },
        'borrowed': { label: '借出', description: '已借出', operations: '归还' },
        'repairing': { label: '送修', description: '外送维修', operations: '入库' },
        'scrapped': { label: '报废', description: '已下账', operations: '无' },
        'lost': { label: '丢失', description: '未找到', operations: '找回后更新' }
      };

      // 构建完整的状态分布，包含所有状态（即使数量为0）
      const allStatuses = ['available', 'maintenance', 'reserved', 'borrowed', 'repairing', 'scrapped', 'lost'];
      const statusDistribution = allStatuses.map(statusKey => {
        const statusInfo = statusInfoMap[statusKey] || { label: statusKey, description: '-', operations: '-' };
        
        // 处理状态映射：维护状态可能是 maintenance 或 pending_repair
        let count = statusStats[statusKey] || 0;
        if (statusKey === 'maintenance' && !statusStats['maintenance'] && statusStats['pending_repair']) {
          count = statusStats['pending_repair'];
        }
        
        return {
          status: statusKey,
          label: statusInfo.label,
          description: statusInfo.description,
          operations: statusInfo.operations,
          count: count,
          percentage: totalCount > 0 ? Math.round(count / totalCount * 100) : 0
        };
      });

      const totalValue = valueRes[0]?.total_value || 0;
      const utilizationRate = totalCount > 0 ? Math.round((statusStats['borrowed'] || 0) / totalCount * 100) : 0;

      const categoryCountMap = {};
      categoryCountRes.forEach(item => {
        categoryCountMap[item.name] = { count: item.count, total_value: item.total_value || 0 };
      });

      const categoryStatistics = categoryListRes.map(category => {
        const stats = categoryCountMap[category.name] || { count: 0, total_value: 0 };
        return {
          name: category.name,
          count: stats.count,
          total_value: stats.total_value,
          percentage: totalCount > 0 ? Math.round(stats.count / totalCount * 100) : 0
        };
      });

      sendResponse(res, {
        total_count: totalCount,
        available_count: statusStats['available'] || 0,
        borrowed_count: borrowCountRes[0]?.borrowed_count || 0,
        maintenance_count: statusStats['pending_repair'] || statusStats['maintenance'] || 0,
        total_value: totalValue,
        utilization_rate: utilizationRate,
        overdue_count: overdueRes[0]?.overdue_count || 0,
        repair_count: repairCount,
        status_distribution: statusDistribution,
        category_statistics: categoryStatistics,
        overdue_list: overdueListRes.map(item => ({
          ...item,
          overdue_days: Math.ceil((new Date() - new Date(item.expect_return_date)) / (1000 * 60 * 60 * 24))
        }))
      });
    } catch (error) {
      console.error('获取设备统计错误:', error);
      sendResponse(res, null, '获取设备统计失败', 500);
    }
  });

  app.get('/api/v1/equipment/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    try {
      const [rows] = await pool.query(`
        SELECT e.*, 
               c.name as category_name,
               u.RealName as responsible_name
        FROM equ_equipment e
        LEFT JOIN equ_category c ON e.category_id = c.id
        LEFT JOIN sys_user u ON e.responsible_user_id = u.UserID
        WHERE e.id = ?
      `, [id]);
      if (rows.length === 0) {
        return sendResponse(res, null, '设备不存在', 404);
      }
      sendResponse(res, rows[0]);
    } catch (error) {
      console.error('获取设备信息错误:', error);
      sendResponse(res, null, '获取设备信息失败', 500);
    }
  });

  app.put('/api/v1/equipment/:id/status', authenticateToken, async (req, res) => {
    const { id } = req.params;
    const { status, reason } = req.body;
    try {
      const [rows] = await pool.query('SELECT * FROM equ_equipment WHERE id = ?', [id]);
      if (rows.length === 0) {
        return sendResponse(res, null, '设备不存在', 404);
      }

      const oldStatus = rows[0].status;
      await pool.query('UPDATE equ_equipment SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [status, id]);

      await pool.query(
        'INSERT INTO equ_operation_log (equipment_id, equipment_name, operation_type, operation_content, operator_id, operator_name, operator_ip) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [id, rows[0].name, 'status_change', `状态变更: ${oldStatus} -> ${status}, 原因: ${reason || '无'}`, req.user.id, '管理员', req.ip || '127.0.0.1']
      );

      sendResponse(res, { id });
    } catch (error) {
      console.error('更新设备状态错误:', error);
      sendResponse(res, null, '更新设备状态失败', 500);
    }
  });

  app.put('/api/v1/equipment/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    const {
      asset_code, name, model, category_id, unit, purchase_date, brand, serial_number,
      specification, price, funding_source, use_years, supplier, warranty_period,
      location, responsible_user_id, status, department_id, is_important, tags, description
    } = req.body;
    try {
      await pool.query(
        `UPDATE equ_equipment SET
        asset_code = ?, name = ?, model = ?, category_id = ?, unit = ?, purchase_date = ?, brand = ?, serial_number = ?,
        specification = ?, price = ?, funding_source = ?, use_years = ?, supplier = ?, warranty_period = ?,
        location = ?, responsible_user_id = ?, status = ?, department_id = ?, is_important = ?, tags = ?, description = ?
        WHERE id = ?`,
        [asset_code, name, model, category_id, unit, purchase_date, brand, serial_number,
         specification, price, funding_source, use_years, supplier, warranty_period,
         location, responsible_user_id, status, department_id, is_important, tags, description, id]
      );

      await pool.query(
        'INSERT INTO equ_operation_log (equipment_id, equipment_name, operation_type, operation_content, operator_id, operator_name, operator_ip) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [id, name, 'update', '更新设备信息', req.user.id, '管理员', req.ip || '127.0.0.1']
      );

      sendResponse(res);
    } catch (error) {
      console.error('更新设备错误:', error);
      sendResponse(res, null, '更新设备失败', 500);
    }
  });

  app.delete('/api/v1/equipment/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    try {
      const [eqRows] = await pool.query('SELECT * FROM equ_equipment WHERE id = ?', [id]);
      if (eqRows.length > 0) {
        await pool.query(
          'INSERT INTO equ_operation_log (equipment_id, equipment_name, operation_type, operation_content, operator_id, operator_name, operator_ip) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [id, eqRows[0].name, 'delete', '删除设备', req.user.id, '管理员', req.ip || '127.0.0.1']
        );
      }
      await pool.query('DELETE FROM equ_equipment WHERE id = ?', [id]);
      sendResponse(res);
    } catch (error) {
      console.error('删除设备错误:', error);
      sendResponse(res, null, '删除设备失败', 500);
    }
  });

  // 设备维修管理
  app.get('/api/v1/equipment/repair', authenticateToken, async (req, res) => {
    try {
      const { status, equipment_id } = req.query;
      let sql = `
        SELECT r.*, 
               e.name as equipment_name,
               e.asset_code
        FROM equ_repair_record r
        LEFT JOIN equ_equipment e ON r.equipment_id = e.id
        WHERE 1=1
      `;
      const params = [];

      if (status) {
        sql += ' AND r.repair_status = ?';
        params.push(status);
      }
      if (equipment_id) {
        sql += ' AND r.equipment_id = ?';
        params.push(equipment_id);
      }

      sql += ' ORDER BY r.created_at DESC';

      const [rows] = await pool.query(sql, params);
      sendResponse(res, rows);
    } catch (error) {
      console.error('获取维修记录错误:', error);
      sendResponse(res, null, '获取维修记录失败', 500);
    }
  });

  app.post('/api/v1/equipment/repair', authenticateToken, async (req, res) => {
    const { equipment_id, fault_description, repair_type } = req.body;
    try {
      const [eqRows] = await pool.query('SELECT * FROM equ_equipment WHERE id = ?', [equipment_id]);
      if (eqRows.length === 0) {
        return sendResponse(res, null, '设备不存在', 404);
      }

      const [result] = await pool.query(
        `INSERT INTO equ_repair_record
        (equipment_id, equipment_name, asset_code, fault_description, report_user_id, report_user_name, report_time, repair_type, repair_status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [equipment_id, eqRows[0].name, eqRows[0].asset_code, fault_description, req.user.id, '管理员', new Date().toISOString(), repair_type, 'pending']
      );

      await pool.query('UPDATE equ_equipment SET status = ? WHERE id = ?', ['maintenance', equipment_id]);

      sendResponse(res, { id: result.insertId });
    } catch (error) {
      console.error('报修错误:', error);
      sendResponse(res, null, '报修失败', 500);
    }
  });

  app.put('/api/v1/equipment/repair/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    const { repair_content, repair_user_id, repair_user_name, repair_start_time, repair_end_time, repair_cost, repair_status } = req.body;
    try {
      await pool.query(
        `UPDATE equ_repair_record SET
        repair_content = ?, repair_user_id = ?, repair_user_name = ?, repair_start_time = ?, repair_end_time = ?, repair_cost = ?, repair_status = ?
        WHERE id = ?`,
        [repair_content, repair_user_id, repair_user_name, repair_start_time, repair_end_time, repair_cost, repair_status, id]
      );

      const [rows] = await pool.query('SELECT * FROM equ_repair_record WHERE id = ?', [id]);
      if (rows.length > 0 && repair_status === 'completed') {
        await pool.query('UPDATE equ_equipment SET status = ? WHERE id = ?', ['available', rows[0].equipment_id]);
      }

      sendResponse(res);
    } catch (error) {
      console.error('更新维修记录错误:', error);
      sendResponse(res, null, '更新维修记录失败', 500);
    }
  });

  app.get('/api/v1/equipment/statistics/overview', authenticateToken, async (req, res) => {
    try {
      const [statusCountRes] = await pool.query(`
        SELECT status, COUNT(*) as count
        FROM equ_equipment
        GROUP BY status
      `);

      const [categoryCountRes] = await pool.query(`
        SELECT c.name, COUNT(*) as count
        FROM equ_equipment e
        LEFT JOIN equ_category c ON e.category_id = c.id
        GROUP BY c.id
      `);

      const [valueRes] = await pool.query(`
        SELECT SUM(price) as total_value
        FROM equ_equipment
      `);

      const [borrowCountRes] = await pool.query(`
        SELECT COUNT(*) as borrowed_count
        FROM equ_borrow_record
        WHERE status = 'borrowed'
      `);

      const statusStats = {};
      statusCountRes.forEach(item => {
        statusStats[item.status] = item.count;
      });

      sendResponse(res, {
        total: statusCountRes.reduce((sum, item) => sum + item.count, 0),
        status_stats: statusStats,
        category_stats: categoryCountRes,
        total_value: valueRes[0].total_value || 0,
        borrowed_count: borrowCountRes[0].borrowed_count || 0
      });
    } catch (error) {
      console.error('获取设备统计错误:', error);
      sendResponse(res, null, '获取设备统计失败', 500);
    }
  });

  // 下载Excel导入模板
  app.get('/api/v1/equipment/import/template', authenticateToken, async (req, res) => {
    try {
      // 获取分类列表
      const categories = await getCategoryList();
      
      const templateData = [
        ['资产编号', '设备名称', '型号', '设备分类', '计量单位', '购入日期', '品牌', '序列号', '规格', '价格', '经费来源', '使用年限', '供应商', '保修期', '存放位置', '责任人', '所属部门', '是否重要设备', '标签', '备注'],
        ['', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', ''],
        ['必填', '必填', '选填', '必填', '必填', '必填', '选填', '选填', '选填', '选填', '选填', '选填', '选填', '选填', '选填', '选填', '选填', '选填', '选填', '选填'],
        ['EQU011', '示例设备1', 'Model-X', '电子设备', '台', '2024-01-15', '品牌A', 'SN001', '规格描述', '1000.00', '教学经费', '5', '供应商A', '3年', '实验楼A-A101', '管理员', '计算机学院', '否', '标签1,标签2', '备注信息'],
        ['EQU012', '示例设备2', 'Model-Y', '机械设备', '件', '2024-02-20', '品牌B', 'SN002', '规格描述', '2000.00', '科研经费', '8', '供应商B', '2年', '实验楼B-B201', '张老师', '物理系', '是', '重要设备', '备注信息'],
        ['', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', ''],
        ['设备分类可选值:', categories.map(c => c.name).join(', ')]
      ];

      // 创建工作簿
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.aoa_to_sheet(templateData);
      
      // 设置列宽
      ws['!cols'] = [
        { wch: 12 }, { wch: 18 }, { wch: 15 }, { wch: 12 }, { wch: 8 },
        { wch: 12 }, { wch: 12 }, { wch: 15 }, { wch: 20 }, { wch: 10 },
        { wch: 12 }, { wch: 10 }, { wch: 15 }, { wch: 10 }, { wch: 18 },
        { wch: 12 }, { wch: 15 }, { wch: 10 }, { wch: 15 }, { wch: 20 }
      ];

      XLSX.utils.book_append_sheet(wb, ws, '设备导入');

      // 生成Excel文件
      const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
      
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename=设备导入模板.xlsx');
      res.end(buffer);
    } catch (error) {
      console.error('下载模板失败:', error);
      sendResponse(res, null, '下载模板失败: ' + error.message, 500);
    }
  });

  // 批量导入设备
  app.post('/api/v1/equipment/import', authenticateToken, upload.single('file'), async (req, res) => {
    try {
      if (!req.file) {
        return sendResponse(res, null, '请上传文件', 400);
      }

      // 读取Excel文件
      const filePath = req.file.path;
      const workbook = XLSX.readFile(filePath);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

      // 删除临时文件
      fs.unlinkSync(filePath);

      console.log('Excel数据解析结果:', JSON.stringify(data));
      
      // 解析数据（跳过前3行：表头、空行、提示行）
      const rawData = data.slice(3).filter(row => {
        if (!row || row.length === 0) return false;
        // 过滤掉分类可选值提示行
        const firstCell = row[0]?.toString().trim() || '';
        if (firstCell.startsWith('设备分类可选值:')) return false;
        // 至少有资产编号或设备名称
        return row[0] || row[1];
      });
      
      console.log('过滤后的数据:', JSON.stringify(rawData));
      
      if (rawData.length === 0) {
        return sendResponse(res, null, 'Excel文件中没有有效的数据，请确保在第4行开始填写设备数据', 400);
      }

      // 获取分类、用户、部门列表
      const categories = await getCategoryList();
      const users = await getUserList();
      const departments = await getDepartmentList();

      let successCount = 0;
      let failedCount = 0;
      let errors = [];
      const assetCodes = [];

      for (let i = 0; i < rawData.length; i++) {
        const row = rawData[i];
        const rowIndex = i + 4;

        try {
          // 提取字段
          const asset_code = row[0]?.toString().trim() || '';
          const name = row[1]?.toString().trim() || '';
          const model = row[2]?.toString().trim() || '';
          const categoryName = row[3]?.toString().trim() || '';
          const unit = row[4]?.toString().trim() || '';
          const purchase_date = row[5]?.toString().trim() || '';
          const brand = row[6]?.toString().trim() || '';
          const serial_number = row[7]?.toString().trim() || '';
          const specification = row[8]?.toString().trim() || '';
          const price = parseFloat(row[9]) || 0;
          const funding_source = row[10]?.toString().trim() || '';
          const use_years = parseInt(row[11]) || 0;
          const supplier = row[12]?.toString().trim() || '';
          const warranty_period = row[13]?.toString().trim() || '';
          const location = row[14]?.toString().trim() || '';
          const responsible_name = row[15]?.toString().trim() || '';
          const department_name = row[16]?.toString().trim() || '';
          const is_important = (row[17]?.toString().trim() || '否') === '是' ? 1 : 0;
          const tags = row[18]?.toString().trim() || '';
          const description = row[19]?.toString().trim() || '';

          // 验证必填字段
          if (!asset_code || !name || !categoryName || !unit || !purchase_date) {
            failedCount++;
            errors.push(`第${rowIndex}行：必填字段缺失`);
            continue;
          }

          // 检查资产编号唯一性（在导入数据中）
          if (assetCodes.includes(asset_code)) {
            failedCount++;
            errors.push(`第${rowIndex}行：资产编号 ${asset_code} 在导入文件中重复`);
            continue;
          }
          assetCodes.push(asset_code);

          // 检查资产编号唯一性（在数据库中）
          const existingEquipment = await getEquipmentByAssetCode(asset_code);
          if (existingEquipment) {
            failedCount++;
            errors.push(`第${rowIndex}行：资产编号 ${asset_code} 已存在`);
            continue;
          }

          // 查找分类ID
          const category = categories.find(c => c.name === categoryName);
          if (!category) {
            failedCount++;
            errors.push(`第${rowIndex}行：分类 ${categoryName} 不存在`);
            continue;
          }

          // 查找责任人ID
          let responsible_user_id = null;
          if (responsible_name) {
            const user = users.find(u => u.RealName === responsible_name);
            responsible_user_id = user?.UserID || null;
          }

          // 查找部门ID
          let department_id = null;
          if (department_name) {
            const dept = departments.find(d => d.DeptName === department_name);
            department_id = dept?.DeptID || null;
          }

          // 创建设备
          await pool.query(`
            INSERT INTO equ_equipment (
              asset_code, name, model, category_id, unit, purchase_date,
              brand, serial_number, specification, price, funding_source,
              use_years, supplier, warranty_period, location,
              responsible_user_id, department_id, is_important,
              tags, description, status, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'available', datetime('now'), datetime('now'))
          `, [
            asset_code, name, model, category.id, unit, purchase_date,
            brand, serial_number, specification, price, funding_source,
            use_years, supplier, warranty_period, location,
            responsible_user_id, department_id, is_important,
            tags, description
          ]);

          successCount++;
        } catch (error) {
          console.error(`第${rowIndex}行导入失败:`, error);
          failedCount++;
          errors.push(`第${rowIndex}行：${error.message}`);
        }
      }

      sendResponse(res, {
        success: successCount,
        failed: failedCount,
        errors: errors
      }, '导入完成');
    } catch (error) {
      console.error('批量导入失败:', error);
      // 清理临时文件
      if (req.file && req.file.path) {
        try {
          fs.unlinkSync(req.file.path);
        } catch (e) {}
      }
      sendResponse(res, null, '导入失败: ' + error.message, 500);
    }
  });

  app.listen(port, () => {
    console.log(`服务器运行在 http://localhost:${port}`);
  });
});
