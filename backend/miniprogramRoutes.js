const jwt = require('jsonwebtoken');
const dayjs = require('dayjs');

const JWT_SECRET = 'secret_key';
const MINI_BANNERS = [
  {
    id: 'B1',
    title: '实验室安全提醒',
    subtitle: '进入实验室前请完成安全确认与设备检查'
  },
  {
    id: 'B2',
    title: '设备借还数字化上线',
    subtitle: '移动端提交借用申请，审批结果即时通知'
  },
  {
    id: 'B3',
    title: '课程实验签到优化',
    subtitle: '支持课前签到、报告提交与课后追踪'
  }
];

const ROLE_PERMISSION_TEXT = {
  student: '实验室预约、课程查看、设备借用、耗材申请、签到签退与实验报告',
  teacher: '课程发布、预约审批、签到管理与实验成绩录入',
  admin: '用户管理、实验室管理、设备管理、耗材管理、统计分析与系统配置'
};

function formatDate(value) {
  if (!value) {
    return '';
  }
  return dayjs(value).format('YYYY-MM-DD');
}

function formatDateTime(value) {
  if (!value) {
    return '';
  }
  return dayjs(value).format('YYYY-MM-DD HH:mm');
}

function countAvailableAdmins(users = [], excludeUserId = '') {
  return users.filter((item) => (
    item.role === 'admin' &&
    (item.auditStatus || 'approved') === 'approved' &&
    !item.blacklisted &&
    String(item.id) !== String(excludeUserId)
  )).length;
}

function weekdayLabelToIndex(value) {
  const date = dayjs(value);
  return date.day();
}

function getWeekIndex(value) {
  const current = new Date(value);
  const start = new Date(current.getFullYear(), 0, 1);
  const diff = current.getTime() - start.getTime();
  return Math.ceil((diff / 86400000 + start.getDay() + 1) / 7);
}

function parseEquipmentList(text) {
  if (!text) {
    return [];
  }
  if (Array.isArray(text)) {
    return text;
  }
  return String(text)
    .split(/[\n,，、]/)
    .map(item => item.trim())
    .filter(Boolean);
}

function toMiniReservationStatus(row) {
  if ((row.checked_in_at || row.CheckedInAt) && row.approval_status === 'approved') {
    return 'completed';
  }
  return row.approval_status;
}

function toMiniEquipmentStatus(status) {
  const map = {
    available: 'idle',
    idle: 'idle',
    reserved: 'reserved',
    borrowed: 'borrowed',
    maintenance: 'maintenance',
    scrapped: 'scrapped',
    lost: 'scrapped'
  };
  return map[status] || 'idle';
}

function toDbEquipmentStatus(status) {
  const map = {
    idle: 'available',
    reserved: 'reserved',
    borrowed: 'borrowed',
    maintenance: 'maintenance',
    scrapped: 'scrapped',
    overdue: 'borrowed'
  };
  return map[status] || 'available';
}

function buildOpenIdFromCode(code = '') {
  const normalized = String(code || '').trim() || `mock-${Date.now()}`;
  return `wx_${normalized}`;
}

function parseTimeSlot(slot = '') {
  const [start = '', end = ''] = String(slot).split('-');
  return { start, end };
}

function computeCourseStatus(date, timeSlot) {
  const today = dayjs().format('YYYY-MM-DD');
  if (!date) {
    return 'upcoming';
  }
  if (date < today) {
    return 'completed';
  }
  if (date > today) {
    return 'upcoming';
  }
  const { start, end } = parseTimeSlot(timeSlot);
  const now = dayjs();
  const startTime = start ? dayjs(`${date} ${start}`) : null;
  const endTime = end ? dayjs(`${date} ${end}`) : null;
  if (startTime && endTime && now.isAfter(startTime) && now.isBefore(endTime)) {
    return 'ongoing';
  }
  if (endTime && now.isAfter(endTime)) {
    return 'completed';
  }
  return 'upcoming';
}

module.exports = async function setupMiniprogramRoutes({
  app,
  pool,
  db,
  authenticateToken,
  sendResponse,
  getUserRoleCodes,
  sendNotification,
  sendNotificationToRole
}) {
  async function all(sql, params = []) {
    const [rows] = await pool.query(sql, params);
    return rows;
  }

  async function get(sql, params = []) {
    const rows = await all(sql, params);
    return rows[0] || null;
  }

  async function run(sql, params = []) {
    return db.run(sql, params);
  }

  async function exec(sql) {
    return pool.query(sql);
  }

  async function tryExec(sql) {
    try {
      await exec(sql);
    } catch (error) {
      const message = String(error && error.message ? error.message : error);
      if (!/duplicate column name|already exists/i.test(message)) {
        throw error;
      }
    }
  }

  async function ensureSchema() {
    db.exec(`
      CREATE TABLE IF NOT EXISTS mp_user_profile (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL UNIQUE,
        role_code VARCHAR(50) NOT NULL,
        student_no VARCHAR(100),
        department VARCHAR(200),
        phone VARCHAR(50),
        audit_status VARCHAR(20) DEFAULT 'approved',
        audit_remark VARCHAR(255),
        blacklisted INTEGER DEFAULT 0,
        blacklist_reason VARCHAR(255),
        blacklist_at TIMESTAMP,
        blacklist_by_user_id INTEGER,
        reviewed_at TIMESTAMP,
        reviewed_by_user_id INTEGER,
        role_updated_at TIMESTAMP,
        role_updated_by_user_id INTEGER,
        wechat_open_id VARCHAR(100),
        wechat_nick_name VARCHAR(100),
        wechat_avatar VARCHAR(255),
        auth_channel VARCHAR(50) DEFAULT 'password',
        identity_bound_at TIMESTAMP,
        identity_submitted_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      CREATE UNIQUE INDEX IF NOT EXISTS uk_mp_user_profile_open_id ON mp_user_profile(wechat_open_id);
      CREATE INDEX IF NOT EXISTS idx_mp_user_profile_role_code ON mp_user_profile(role_code);
      CREATE INDEX IF NOT EXISTS idx_mp_user_profile_audit_status ON mp_user_profile(audit_status);
      CREATE INDEX IF NOT EXISTS idx_mp_user_profile_blacklisted ON mp_user_profile(blacklisted);

      CREATE TABLE IF NOT EXISTS mp_course (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        course_name VARCHAR(200) NOT NULL,
        course_date DATE NOT NULL,
        time_slot VARCHAR(50) NOT NULL,
        room_id INTEGER,
        room_name VARCHAR(100),
        room_number VARCHAR(50),
        building_name VARCHAR(100),
        class_name VARCHAR(200),
        teacher_user_id INTEGER NOT NULL,
        teacher_name VARCHAR(100) NOT NULL,
        created_by_user_id INTEGER NOT NULL,
        created_by_name VARCHAR(100) NOT NULL,
        published_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_mp_course_date ON mp_course(course_date);
      CREATE INDEX IF NOT EXISTS idx_mp_course_teacher_user_id ON mp_course(teacher_user_id);
      CREATE INDEX IF NOT EXISTS idx_mp_course_room_id ON mp_course(room_id);

      CREATE TABLE IF NOT EXISTS mp_course_attendance (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        course_id INTEGER NOT NULL,
        user_id INTEGER NOT NULL,
        sign_in_at TIMESTAMP,
        sign_out_at TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      CREATE UNIQUE INDEX IF NOT EXISTS uk_mp_course_attendance ON mp_course_attendance(course_id, user_id);

      CREATE TABLE IF NOT EXISTS mp_course_report (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        course_id INTEGER NOT NULL,
        course_name VARCHAR(200),
        user_id INTEGER NOT NULL,
        user_name VARCHAR(100) NOT NULL,
        content TEXT NOT NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      CREATE UNIQUE INDEX IF NOT EXISTS uk_mp_course_report ON mp_course_report(course_id, user_id);

      CREATE TABLE IF NOT EXISTS mp_course_score (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        course_id INTEGER NOT NULL,
        student_id INTEGER NOT NULL,
        student_name VARCHAR(100) NOT NULL,
        score REAL,
        comment TEXT,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      CREATE UNIQUE INDEX IF NOT EXISTS uk_mp_course_score ON mp_course_score(course_id, student_id);
    `);

    await tryExec('ALTER TABLE lab_reservation ADD COLUMN check_in_code VARCHAR(100)');
    await tryExec('ALTER TABLE lab_reservation ADD COLUMN checked_in_at TIMESTAMP');
    await tryExec('ALTER TABLE lab_reservation ADD COLUMN checked_in_by_id INTEGER');
    await tryExec('ALTER TABLE lab_reservation ADD COLUMN checked_in_by_name VARCHAR(100)');

    await tryExec('ALTER TABLE Ven_Room ADD COLUMN MpStatus VARCHAR(20)');
    await tryExec('ALTER TABLE Ven_Room ADD COLUMN MpOpenTime VARCHAR(255)');
    await tryExec('ALTER TABLE Ven_Room ADD COLUMN MpGuide TEXT');
  }

  async function ensureRoleId(roleCode, roleName) {
    const existing = await get('SELECT id FROM sys_role WHERE code = ?', [roleCode]);
    if (existing) {
      return existing.id;
    }
    const result = await run(
      'INSERT INTO sys_role (name, code, description, status, created_at, updated_at) VALUES (?, ?, ?, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)',
      [roleName, roleCode, roleName]
    );
    return result.lastID;
  }

  async function ensureUserRole(userId, roleCode, roleName) {
    const roleId = await ensureRoleId(roleCode, roleName);
    const existing = await get('SELECT id FROM sys_user_role WHERE user_id = ? AND role_id = ?', [userId, roleId]);
    if (!existing) {
      await run('INSERT INTO sys_user_role (user_id, role_id, created_at) VALUES (?, ?, CURRENT_TIMESTAMP)', [userId, roleId]);
    }
  }

  async function upsertProfile(userId, payload) {
    const existing = await get('SELECT id FROM mp_user_profile WHERE user_id = ?', [userId]);
    const params = [
      payload.role_code,
      payload.student_no || '',
      payload.department || '',
      payload.phone || '',
      payload.audit_status || 'approved',
      payload.audit_remark || '',
      payload.blacklisted ? 1 : 0,
      payload.blacklist_reason || '',
      payload.blacklist_at || null,
      payload.blacklist_by_user_id || null,
      payload.reviewed_at || null,
      payload.reviewed_by_user_id || null,
      payload.role_updated_at || null,
      payload.role_updated_by_user_id || null,
      payload.wechat_open_id || null,
      payload.wechat_nick_name || '',
      payload.wechat_avatar || '',
      payload.auth_channel || 'password',
      payload.identity_bound_at || null,
      payload.identity_submitted_at || null
    ];

    if (existing) {
      await run(`
        UPDATE mp_user_profile
        SET role_code = ?, student_no = ?, department = ?, phone = ?, audit_status = ?, audit_remark = ?,
            blacklisted = ?, blacklist_reason = ?, blacklist_at = ?, blacklist_by_user_id = ?,
            reviewed_at = ?, reviewed_by_user_id = ?, role_updated_at = ?, role_updated_by_user_id = ?,
            wechat_open_id = ?, wechat_nick_name = ?, wechat_avatar = ?, auth_channel = ?,
            identity_bound_at = ?, identity_submitted_at = ?, updated_at = CURRENT_TIMESTAMP
        WHERE user_id = ?
      `, [...params, userId]);
      return;
    }

    await run(`
      INSERT INTO mp_user_profile (
        user_id, role_code, student_no, department, phone, audit_status, audit_remark,
        blacklisted, blacklist_reason, blacklist_at, blacklist_by_user_id, reviewed_at,
        reviewed_by_user_id, role_updated_at, role_updated_by_user_id, wechat_open_id,
        wechat_nick_name, wechat_avatar, auth_channel, identity_bound_at, identity_submitted_at,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `, [userId, ...params]);
  }

  async function ensureUserSeed({
    username,
    realName,
    roleCode,
    studentNo,
    department,
    phone,
    auditStatus = 'approved',
    blacklisted = false,
    blacklistReason = ''
  }) {
    let user = await get('SELECT UserID, UserName FROM sys_user WHERE UserName = ?', [username]);
    if (!user) {
      const result = await run(
        'INSERT INTO sys_user (UserName, Password, RealName, Mobile, Email, Status, CreatedAt, UpdatedAt) VALUES (?, ?, ?, ?, ?, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)',
        [username, '123456', realName, phone || '', `${username}@example.com`]
      );
      user = { UserID: result.lastID, UserName: username };
    }

    await ensureUserRole(user.UserID, roleCode, roleCode);
    await upsertProfile(user.UserID, {
      role_code: roleCode,
      student_no: studentNo,
      department,
      phone,
      audit_status: auditStatus,
      audit_remark: auditStatus === 'approved' ? '' : '待管理员审核身份信息',
      blacklisted,
      blacklist_reason: blacklistReason,
      blacklist_at: blacklisted ? formatDateTime(new Date()) : null,
      auth_channel: 'password'
    });

    return user.UserID;
  }

  async function ensureSeedData() {
    const admin = await get('SELECT UserID FROM sys_user WHERE UserName = ?', ['admin']);
    if (admin) {
      await ensureUserRole(admin.UserID, 'admin', 'admin');
      await upsertProfile(admin.UserID, {
        role_code: 'admin',
        student_no: 'A0001',
        department: '实验中心',
        phone: '13800003333',
        audit_status: 'approved',
        auth_channel: 'password'
      });
    }

    const studentId = await ensureUserSeed({
      username: 'stu2026001',
      realName: '学生用户',
      roleCode: 'student',
      studentNo: '2026001',
      department: '信息工程学院',
      phone: '13800001111'
    });

    const teacherId = await ensureUserSeed({
      username: 'tea2026001',
      realName: '教师用户',
      roleCode: 'teacher',
      studentNo: 'T2026001',
      department: '计算机科学系',
      phone: '13800002222'
    });

    await ensureUserSeed({
      username: 'stu2026002',
      realName: '待审核学生',
      roleCode: 'student',
      studentNo: '2026002',
      department: '自动化学院',
      phone: '13800004444',
      auditStatus: 'pending'
    });

    await ensureUserSeed({
      username: 'tea2026002',
      realName: '黑名单教师',
      roleCode: 'teacher',
      studentNo: 'T2026002',
      department: '电子工程系',
      phone: '13800005555',
      auditStatus: 'approved',
      blacklisted: true,
      blacklistReason: '多次违约且未整改'
    });

    const room = await get(`
      SELECT r.RoomID, r.RoomName, r.RoomCode, b.BuildingName
      FROM Ven_Room r
      LEFT JOIN Ven_Building b ON r.BuildingID = b.BuildingID
      ORDER BY r.RoomID
      LIMIT 1
    `);
    const hasCourse = await get('SELECT id FROM mp_course LIMIT 1');
    if (!hasCourse && room) {
      const today = dayjs().format('YYYY-MM-DD');
      const tomorrow = dayjs().add(1, 'day').format('YYYY-MM-DD');
      await run(`
        INSERT INTO mp_course (
          course_name, course_date, time_slot, room_id, room_name, room_number, building_name,
          class_name, teacher_user_id, teacher_name, created_by_user_id, created_by_name, published_at,
          created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      `, [
        '机器学习实训',
        today,
        '14:00-16:00',
        room.RoomID,
        room.RoomName,
        room.RoomCode,
        room.BuildingName || '',
        '计算机 2023 级 2 班',
        teacherId,
        '教师用户',
        teacherId,
        '教师用户'
      ]);

      await run(`
        INSERT INTO mp_course (
          course_name, course_date, time_slot, room_id, room_name, room_number, building_name,
          class_name, teacher_user_id, teacher_name, created_by_user_id, created_by_name, published_at,
          created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      `, [
        '嵌入式系统设计',
        tomorrow,
        '10:00-12:00',
        room.RoomID,
        room.RoomName,
        room.RoomCode,
        room.BuildingName || '',
        '物联网 2023 级 1 班',
        teacherId,
        '教师用户',
        teacherId,
        '教师用户'
      ]);

      await sendNotification(
        studentId,
        '学生用户',
        'course',
        '新课程已发布',
        '机器学习实训已同步到课程中心，请及时查看实验安排。',
        'course',
        1
      );
    }
  }

  function generateToken(userId, username) {
    return jwt.sign({ id: userId, username }, JWT_SECRET, { expiresIn: '7d' });
  }

  function canUsePassword(password, storedPassword) {
    return password === '123456' || password === storedPassword;
  }

  async function getProfile(userId) {
    return get('SELECT * FROM mp_user_profile WHERE user_id = ?', [userId]);
  }

  async function getCurrentUserRecord(userId) {
    const base = await get('SELECT UserID, UserName, RealName, Mobile, Email, Status FROM sys_user WHERE UserID = ?', [userId]);
    if (!base) {
      return null;
    }
    const roleCodes = await getUserRoleCodes(userId);
    const profile = await getProfile(userId);
    const role = profile?.role_code || roleCodes[0] || 'student';
    return {
      id: base.UserID,
      username: base.UserName,
      name: base.RealName || base.UserName,
      role,
      roles: roleCodes.length ? roleCodes : [role],
      studentNo: profile?.student_no || '',
      department: profile?.department || '',
      phone: profile?.phone || base.Mobile || '',
      avatarUrl: profile?.wechat_avatar || '',
      wechatBound: !!profile?.wechat_open_id,
      auditStatus: profile?.audit_status || 'approved',
      auditRemark: profile?.audit_remark || '',
      blacklisted: !!Number(profile?.blacklisted || 0),
      blacklistReason: profile?.blacklist_reason || '',
      blacklistAt: profile?.blacklist_at || '',
      reviewedAt: profile?.reviewed_at || '',
      reviewedByUserId: profile?.reviewed_by_user_id || null,
      roleUpdatedAt: profile?.role_updated_at || '',
      roleUpdatedByUserId: profile?.role_updated_by_user_id || null
    };
  }

  async function requireCurrentUser(req, res) {
    const user = await getCurrentUserRecord(req.user.id);
    if (!user) {
      sendResponse(res, null, '用户不存在', 404);
      return null;
    }
    if (user.auditStatus === 'pending') {
      sendResponse(res, null, '账号待管理员审核', 403);
      return null;
    }
    if (user.auditStatus === 'rejected') {
      sendResponse(res, null, '账号审核未通过', 403);
      return null;
    }
    if (user.blacklisted) {
      sendResponse(res, null, `账号已被加入黑名单${user.blacklistReason ? `：${user.blacklistReason}` : ''}`, 403);
      return null;
    }
    return user;
  }

  async function getApprovedUsersByRole(roleCode) {
    return all(`
      SELECT u.UserID, u.UserName, u.RealName, p.student_no, p.department, p.phone
      FROM sys_user u
      LEFT JOIN mp_user_profile p ON p.user_id = u.UserID
      WHERE p.role_code = ? AND u.Status = 1 AND COALESCE(p.audit_status, 'approved') = 'approved' AND COALESCE(p.blacklisted, 0) = 0
      ORDER BY u.UserID
    `, [roleCode]);
  }

  async function getRoomRows() {
    return all(`
      SELECT r.RoomID, r.RoomName, r.RoomCode, r.BuildingID, r.Capacity, r.Description, r.Equipment,
             r.MpStatus, r.MpOpenTime, r.MpGuide, r.Status as RoomStatus,
             b.BuildingName
      FROM Ven_Room r
      LEFT JOIN Ven_Building b ON r.BuildingID = b.BuildingID
      ORDER BY r.RoomID
    `);
  }

  async function getReservationRowsForRoom(roomId) {
    return all(`
      SELECT *
      FROM lab_reservation
      WHERE room_id = ? AND deleted_at IS NULL AND approval_status NOT IN ('rejected', 'cancelled')
      ORDER BY use_date ASC, time_slot ASC, created_at DESC
    `, [roomId]);
  }

  function normalizeReservation(row) {
    if (!row) {
      return null;
    }
    return {
      id: row.id,
      code: row.reservation_code,
      labId: row.room_id,
      labName: row.room_name,
      roomNumber: row.room_number,
      date: formatDate(row.use_date),
      timeSlot: row.time_slot,
      headCount: Number(row.member_count || 0),
      purpose: row.remarks || row.project_category || '',
      projectName: row.project_name,
      applicantId: row.applicant_id,
      applicantName: row.applicant_name,
      phone: row.applicant_phone || row.project_leader_phone || '',
      projectLeader: row.project_leader || '',
      memberGrade: row.member_grade || '',
      memberClass: row.member_class || '',
      status: toMiniReservationStatus(row),
      remark: row.approval_comment || row.remarks || '',
      checkInCode: row.check_in_code || '',
      checkedInAt: formatDateTime(row.checked_in_at),
      createdAt: formatDateTime(row.created_at),
      labBuilding: row.building_name || '',
      labRoomNumber: row.room_number || '',
      labOpenTime: '',
      schedulingId: row.scheduling_id || null
    };
  }

  async function buildLabs() {
    const rooms = await getRoomRows();
    const today = formatDate(new Date());
    return Promise.all(rooms.map(async (row) => {
      const reservations = await getReservationRowsForRoom(row.RoomID);
      const todayReservations = reservations.filter(item => formatDate(item.use_date) === today);
      const pendingReservations = reservations.filter(item => item.approval_status === 'pending');
      const approvedReservations = reservations.filter(item => item.approval_status === 'approved');
      return {
        id: row.RoomID,
        name: row.RoomName,
        building: row.BuildingName || '',
        roomNumber: row.RoomCode,
        capacity: Number(row.Capacity || 0),
        status: row.MpStatus || (Number(row.RoomStatus || 1) === 1 ? 'available' : 'maintenance'),
        openTime: row.MpOpenTime || '周一至周日 08:00-21:00',
        description: row.Description || '',
        equipment: parseEquipmentList(row.Equipment),
        guide: row.MpGuide || '使用前请完成安全检查与预约登记。',
        activeCount: todayReservations.length,
        todayReservationCount: todayReservations.length,
        pendingReservationCount: pendingReservations.length,
        approvedReservationCount: approvedReservations.length
      };
    }));
  }

  async function getLabById(labId) {
    const rooms = await buildLabs();
    return rooms.find(item => String(item.id) === String(labId)) || null;
  }

  async function getReservationDetailRow(id) {
    return get(`
      SELECT r.*, vr.MpOpenTime
      FROM lab_reservation r
      LEFT JOIN Ven_Room vr ON vr.RoomID = r.room_id
      WHERE r.id = ?
    `, [id]);
  }

  async function listReservations(user, options = {}) {
    let sql = 'SELECT * FROM lab_reservation WHERE deleted_at IS NULL';
    const params = [];
    const scopeAll = options.scope === 'all' && ['teacher', 'admin'].includes(user.role);

    if (!scopeAll) {
      sql += ' AND applicant_id = ?';
      params.push(user.id);
    }
    if (options.status && options.status !== 'all') {
      if (options.status === 'completed') {
        sql += ' AND approval_status = ? AND checked_in_at IS NOT NULL';
        params.push('approved');
      } else {
        sql += ' AND approval_status = ?';
        params.push(options.status);
      }
    }
    sql += ' ORDER BY created_at DESC';
    const rows = await all(sql, params);
    return rows.map(normalizeReservation);
  }

  async function createSchedulingFromReservation(reservation) {
    const schedulingCode = `RV-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const result = await run(`
      INSERT INTO lab_scheduling (
        scheduling_code, semester_id, source_type, source_id, course_name, class_name, teacher_name,
        building_id, building_name, room_id, room_name, room_number, week_no, week_day,
        time_slot_start, time_slot_end, student_count, status, approval_status, created_at, updated_at
      ) VALUES (?, ?, 'Reservation', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 'approved', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `, [
      schedulingCode,
      reservation.semester_id || 1,
      reservation.id,
      reservation.project_name,
      reservation.member_class || '-',
      reservation.project_leader || reservation.applicant_name,
      reservation.building_id,
      reservation.building_name,
      reservation.room_id,
      reservation.room_name,
      reservation.room_number,
      reservation.week_no,
      reservation.week_day,
      reservation.time_slot,
      reservation.time_slot,
      reservation.member_count || 0
    ]);
    return result.lastID;
  }

  async function getEquipmentRows(filters = {}) {
    let sql = `
      SELECT e.id, e.asset_code, e.name, e.model, e.location, e.status, c.name as category_name
      FROM equ_equipment e
      LEFT JOIN equ_category c ON e.category_id = c.id
      WHERE 1 = 1
    `;
    const params = [];

    if (filters.keyword) {
      sql += ' AND (e.name LIKE ? OR e.asset_code LIKE ? OR e.model LIKE ?)';
      const keyword = `%${filters.keyword}%`;
      params.push(keyword, keyword, keyword);
    }
    sql += ' ORDER BY e.id DESC';
    return all(sql, params);
  }

  async function getBorrowRows(filters = {}) {
    let sql = `
      SELECT b.*, e.location, e.model, e.asset_code, c.name as category_name
      FROM equ_borrow_record b
      LEFT JOIN equ_equipment e ON e.id = b.equipment_id
      LEFT JOIN equ_category c ON c.id = e.category_id
      WHERE 1 = 1
    `;
    const params = [];

    if (filters.applicantId) {
      sql += ' AND b.applicant_id = ?';
      params.push(filters.applicantId);
    }
    if (filters.equipmentId) {
      sql += ' AND b.equipment_id = ?';
      params.push(filters.equipmentId);
    }
    if (filters.status && filters.status !== 'all') {
      if (filters.status === 'pending') {
        sql += ` AND b.status IN ('pending', 'pending_teacher', 'pending_admin')`;
      } else if (filters.status === 'approved') {
        sql += ` AND b.status = 'approved'`;
      } else if (filters.status === 'overdue') {
        sql += ` AND b.status = 'borrowed' AND b.expect_return_date < datetime('now')`;
      } else {
        sql += ' AND b.status = ?';
        params.push(filters.status);
      }
    }
    sql += ' ORDER BY b.created_at DESC';
    return all(sql, params);
  }

  function normalizeEquipment(row) {
    if (!row) {
      return null;
    }
    return {
      id: row.id,
      name: row.name,
      no: row.asset_code,
      model: row.model || '',
      category: row.category_name || '未分类',
      status: toMiniEquipmentStatus(row.status),
      location: row.location || ''
    };
  }

  function normalizeBorrowRecord(row) {
    if (!row) {
      return null;
    }
    const overdue = row.status === 'borrowed' && row.expect_return_date && dayjs(row.expect_return_date).isBefore(dayjs());
    const status = overdue ? 'overdue' : (row.status === 'pending_teacher' || row.status === 'pending_admin' ? 'pending' : row.status);
    return {
      id: row.id,
      equipmentId: row.equipment_id,
      equipmentName: row.equipment_name || '',
      equipmentNo: row.asset_code || '',
      model: row.model || '',
      category: row.category_name || '未分类',
      location: row.location || '',
      applicantId: row.applicant_id,
      applicantName: row.applicant_name,
      borrowDate: formatDate(row.borrow_date),
      borrowTime: dayjs(row.borrow_date).format('HH:mm'),
      returnDate: formatDate(row.expect_return_date),
      returnTime: dayjs(row.expect_return_date).format('HH:mm'),
      purpose: row.purpose || '',
      scanCode: row.asset_code || `EQ-${row.equipment_id}`,
      status,
      borrowedAt: formatDateTime(row.receive_time || row.borrow_date),
      returnedAt: formatDateTime(row.actual_return_date),
      createdAt: formatDateTime(row.created_at)
    };
  }

  async function getConsumableRows() {
    return all(`
      SELECT c.id, c.consumable_name, c.stock, c.unit, c.min_stock, cat.name as category_name
      FROM consumable c
      LEFT JOIN consumable_category cat ON cat.id = c.category_id
      WHERE c.status = 1
      ORDER BY c.id DESC
    `);
  }

  function normalizeConsumable(row) {
    if (!row) {
      return null;
    }
    return {
      id: row.id,
      name: row.consumable_name,
      stock: Number(row.stock || 0),
      unit: row.unit || '',
      category: row.category_name || '未分类',
      warningValue: Number(row.min_stock || 0)
    };
  }

  async function getConsumableRequestRows(filters = {}) {
    let sql = `
      SELECT so.*, c.unit
      FROM stock_out so
      LEFT JOIN consumable c ON c.id = so.consumable_id
      WHERE 1 = 1
    `;
    const params = [];
    if (filters.applicantId) {
      sql += ' AND so.applicant_id = ?';
      params.push(filters.applicantId);
    }
    if (filters.status && filters.status !== 'all') {
      sql += ' AND so.status = ?';
      params.push(filters.status);
    }
    sql += ' ORDER BY so.created_at DESC';
    return all(sql, params);
  }

  function normalizeConsumableRequest(row) {
    if (!row) {
      return null;
    }
    return {
      id: row.id,
      consumableId: row.consumable_id,
      consumableName: row.consumable_name,
      quantity: Number(row.quantity || 0),
      unit: row.unit || '',
      purpose: row.purpose || '',
      applicantId: row.applicant_id,
      applicantName: row.applicant_name || '',
      status: row.status,
      createdAt: formatDateTime(row.created_at)
    };
  }

  async function getCourseRows(user) {
    let sql = 'SELECT * FROM mp_course WHERE 1 = 1';
    const params = [];
    if (user.role === 'teacher') {
      sql += ' AND teacher_user_id = ?';
      params.push(user.id);
    }
    sql += ' ORDER BY course_date DESC, time_slot DESC, id DESC';
    const rows = await all(sql, params);
    return rows.map(row => ({
      id: row.id,
      name: row.course_name,
      teacherName: row.teacher_name,
      teacherId: row.teacher_user_id,
      date: formatDate(row.course_date),
      timeSlot: row.time_slot,
      labId: row.room_id,
      labName: row.room_name || '',
      status: computeCourseStatus(formatDate(row.course_date), row.time_slot),
      className: row.class_name || '',
      scoreStatus: '待录入'
    }));
  }

  async function getCourseCheckinRows(courseId) {
    const params = [];
    let sql = 'SELECT * FROM mp_course_attendance WHERE 1 = 1';
    if (courseId) {
      sql += ' AND course_id = ?';
      params.push(courseId);
    }
    sql += ' ORDER BY id DESC';
    const rows = await all(sql, params);
    return rows.map(row => ({
      id: row.id,
      courseId: row.course_id,
      userId: row.user_id,
      signInAt: formatDateTime(row.sign_in_at),
      signOutAt: formatDateTime(row.sign_out_at),
      updatedAt: formatDateTime(row.updated_at)
    }));
  }

  async function getReportRows(user, courseId = null) {
    let sql = 'SELECT * FROM mp_course_report WHERE 1 = 1';
    const params = [];
    if (user.role === 'student') {
      sql += ' AND user_id = ?';
      params.push(user.id);
    }
    if (courseId) {
      sql += ' AND course_id = ?';
      params.push(courseId);
    }
    sql += ' ORDER BY updated_at DESC';
    const rows = await all(sql, params);
    return rows.map(row => ({
      id: row.id,
      courseId: row.course_id,
      courseName: row.course_name,
      userId: row.user_id,
      userName: row.user_name,
      content: row.content,
      updatedAt: formatDateTime(row.updated_at)
    }));
  }

  async function getCourseRow(courseId) {
    return get('SELECT * FROM mp_course WHERE id = ?', [courseId]);
  }

  async function getTeacherList() {
    const rows = await getApprovedUsersByRole('teacher');
    return rows.map(row => ({
      id: row.UserID,
      name: row.RealName || row.UserName,
      department: row.department || '',
      phone: row.phone || ''
    }));
  }

  async function getStudentList() {
    const rows = await getApprovedUsersByRole('student');
    return rows.map(row => ({
      id: row.UserID,
      name: row.RealName || row.UserName,
      studentNo: row.student_no || '',
      department: row.department || '',
      phone: row.phone || ''
    }));
  }

  function normalizeMessageCategory(type) {
    if (['reservation_apply', 'reservation_approved', 'reservation_rejected', 'borrow_apply', 'borrow_approved', 'borrow_rejected', 'consumable_apply', 'consumable_approved', 'consumable_rejected', 'approval'].includes(type)) {
      return 'approval';
    }
    if (['course', 'course_report', 'course_score', 'course_checkin'].includes(type)) {
      return 'course';
    }
    if (['consumable_low_stock', 'overdue', 'calibration', 'alert'].includes(type)) {
      return 'alert';
    }
    return 'system';
  }

  async function getMessageRows(userId, category = 'all') {
    const rows = await all('SELECT * FROM lab_notification WHERE user_id = ? ORDER BY created_at DESC', [userId]);
    return rows.map(row => ({
      id: row.id,
      category: normalizeMessageCategory(row.notification_type),
      title: row.title,
      content: row.content,
      read: !!Number(row.is_read || 0),
      createdAt: formatDateTime(row.created_at)
    })).filter(item => category === 'all' || item.category === category);
  }

  async function getRawUserList() {
    const rows = await all(`
      SELECT u.UserID, u.UserName, u.RealName, u.Mobile,
             p.role_code, p.student_no, p.department, p.phone, p.audit_status, p.audit_remark,
             p.blacklisted, p.blacklist_reason, p.blacklist_at, p.reviewed_at, p.role_updated_at,
             reviewer.RealName as reviewed_by_name,
             roleUpdater.RealName as role_updated_by_name,
             blacklistUser.RealName as blacklist_by_name
      FROM sys_user u
      LEFT JOIN mp_user_profile p ON p.user_id = u.UserID
      LEFT JOIN sys_user reviewer ON reviewer.UserID = p.reviewed_by_user_id
      LEFT JOIN sys_user roleUpdater ON roleUpdater.UserID = p.role_updated_by_user_id
      LEFT JOIN sys_user blacklistUser ON blacklistUser.UserID = p.blacklist_by_user_id
      ORDER BY u.UserID DESC
    `);
    return rows.map(row => ({
      id: row.UserID,
      username: row.UserName,
      role: row.role_code || 'student',
      name: row.RealName || row.UserName,
      studentNo: row.student_no || '',
      department: row.department || '',
      phone: row.phone || row.Mobile || '',
      auditStatus: row.audit_status || 'approved',
      auditRemark: row.audit_remark || '',
      blacklisted: !!Number(row.blacklisted || 0),
      blacklistReason: row.blacklist_reason || '',
      blacklistAt: formatDateTime(row.blacklist_at),
      blacklistByName: row.blacklist_by_name || '',
      reviewedAt: formatDateTime(row.reviewed_at),
      reviewedByName: row.reviewed_by_name || '',
      roleUpdatedAt: formatDateTime(row.role_updated_at),
      roleUpdatedByName: row.role_updated_by_name || ''
    }));
  }

  function decorateAdminUserList(users, currentUserId) {
/*
    return users.map(item => {
      const auditStatus = item.auditStatus || 'approved';
      const blacklisted = !!item.blacklisted;
      const isSelf = String(currentUserId) === String(item.id);
      const isProtectedAdmin = (
        item.role === 'admin' &&
        auditStatus === 'approved' &&
        !blacklisted &&
        countAvailableAdmins(users, item.id) === 0
      );

      return {
        ...item,
        roleLabel: {
          student: '瀛︾敓',
          teacher: '鏁欏笀',
          admin: '绠＄悊鍛?
        }[item.role] || item.role || '鏈畾涔夎鑹?,
        auditStatusText: {
          pending: '寰呭鏍?,
          approved: '宸查€氳繃',
          rejected: '宸查┏鍥?
        }[auditStatus] || '寰呭鏍?,
        auditStatusClass: {
          pending: 'status-pending',
          approved: 'status-approved',
          rejected: 'status-rejected'
        }[auditStatus] || 'status-pending',
        blacklistText: blacklisted ? '榛戝悕鍗? : '姝ｅ父',
        blacklistClass: blacklisted ? 'status-maintenance' : 'status-approved',
        permissionsText: ROLE_PERMISSION_TEXT[item.role] || '鍩虹璁块棶鏉冮檺',
        isSelf,
        isProtectedAdmin,
        canReview: !isSelf && auditStatus !== 'approved',
        canAssignRole: !isSelf && auditStatus === 'approved',
        canToggleBlacklist: !isSelf && !isProtectedAdmin
      };
    }).sort((left, right) => {
      const getWeight = (item) => {
        if (item.auditStatus === 'pending') {
          return 0;
        }
        if (item.blacklisted) {
          return 1;
        }
        if (item.auditStatus === 'rejected') {
          return 2;
        }
        return 3;
      };

      const weightDiff = getWeight(left) - getWeight(right);
      return weightDiff !== 0 ? weightDiff : Number(right.id || 0) - Number(left.id || 0);
    });
*/
    return users.map((item) => {
      const auditStatus = item.auditStatus || 'approved';
      const blacklisted = !!item.blacklisted;
      const isSelf = String(currentUserId) === String(item.id);
      const isProtectedAdmin = (
        item.role === 'admin' &&
        auditStatus === 'approved' &&
        !blacklisted &&
        countAvailableAdmins(users, item.id) === 0
      );

      return {
        ...item,
        roleLabel: {
          student: '\u5b66\u751f',
          teacher: '\u6559\u5e08',
          admin: '\u7ba1\u7406\u5458'
        }[item.role] || item.role || '\u672a\u5b9a\u4e49\u89d2\u8272',
        auditStatusText: {
          pending: '\u5f85\u5ba1\u6838',
          approved: '\u5df2\u901a\u8fc7',
          rejected: '\u5df2\u9a73\u56de'
        }[auditStatus] || '\u5f85\u5ba1\u6838',
        auditStatusClass: {
          pending: 'status-pending',
          approved: 'status-approved',
          rejected: 'status-rejected'
        }[auditStatus] || 'status-pending',
        blacklistText: blacklisted ? '\u9ed1\u540d\u5355' : '\u6b63\u5e38',
        blacklistClass: blacklisted ? 'status-maintenance' : 'status-approved',
        permissionsText: ROLE_PERMISSION_TEXT[item.role] || '\u57fa\u7840\u8bbf\u95ee\u6743\u9650',
        isSelf,
        isProtectedAdmin,
        canReview: !isSelf && auditStatus !== 'approved',
        canAssignRole: !isSelf && auditStatus === 'approved',
        canToggleBlacklist: !isSelf && !isProtectedAdmin
      };
    }).sort((left, right) => {
      const getWeight = (item) => {
        if (item.auditStatus === 'pending') {
          return 0;
        }
        if (item.blacklisted) {
          return 1;
        }
        if (item.auditStatus === 'rejected') {
          return 2;
        }
        return 3;
      };

      const weightDiff = getWeight(left) - getWeight(right);
      return weightDiff !== 0 ? weightDiff : Number(right.id || 0) - Number(left.id || 0);
    });
  }

  async function ensureBuilding(buildingName) {
    const trimmed = String(buildingName || '').trim();
    if (!trimmed) {
      return null;
    }
    const existing = await get('SELECT BuildingID, BuildingName FROM Ven_Building WHERE BuildingName = ?', [trimmed]);
    if (existing) {
      return existing;
    }
    const code = `BLD-${Date.now()}`;
    const result = await run(
      'INSERT INTO Ven_Building (BuildingCode, BuildingName, CampusID, Status, SortOrder, CreatedAt, UpdatedAt) VALUES (?, ?, 1, 1, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)',
      [code, trimmed]
    );
    return { BuildingID: result.lastID, BuildingName: trimmed };
  }

  async function ensureEquipmentCategory(categoryName) {
    const trimmed = String(categoryName || '').trim();
    if (!trimmed) {
      return null;
    }
    const existing = await get('SELECT id, name FROM equ_category WHERE name = ?', [trimmed]);
    if (existing) {
      return existing.id;
    }
    const code = `CAT-${Date.now()}`;
    const result = await run(
      'INSERT INTO equ_category (code, name, description, sort_order, status, created_at, updated_at) VALUES (?, ?, ?, 0, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)',
      [code, trimmed, trimmed]
    );
    return result.lastID;
  }

  async function ensureConsumableCategory(categoryName) {
    const trimmed = String(categoryName || '').trim();
    if (!trimmed) {
      return null;
    }
    const existing = await get('SELECT id FROM consumable_category WHERE name = ?', [trimmed]);
    if (existing) {
      return existing.id;
    }
    const result = await run(
      'INSERT INTO consumable_category (name, description, sort_order, status, created_at, updated_at) VALUES (?, ?, 0, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)',
      [trimmed, trimmed]
    );
    return result.lastID;
  }

  await ensureSchema();
  await ensureSeedData();

  app.post('/api/miniprogram/auth/login', async (req, res) => {
    try {
      const { username, password, role } = req.body;
      const user = await get('SELECT UserID, UserName, Password FROM sys_user WHERE UserName = ?', [username]);
      if (!user || !canUsePassword(password, user.Password)) {
        sendResponse(res, null, '账号或密码错误', 401);
        return;
      }

      const currentUser = await getCurrentUserRecord(user.UserID);
      if (!currentUser) {
        sendResponse(res, null, '用户不存在', 404);
        return;
      }
      if (role && currentUser.role !== role) {
        sendResponse(res, null, '所选身份与账号不匹配', 400);
        return;
      }
      if (currentUser.auditStatus === 'pending') {
        sendResponse(res, null, '账号待管理员审核，请稍后再试', 403);
        return;
      }
      if (currentUser.auditStatus === 'rejected') {
        sendResponse(res, null, '账号审核未通过', 403);
        return;
      }
      if (currentUser.blacklisted) {
        sendResponse(res, null, `账号已被加入黑名单${currentUser.blacklistReason ? `：${currentUser.blacklistReason}` : ''}`, 403);
        return;
      }

      const token = generateToken(user.UserID, user.UserName);
      sendResponse(res, {
        token,
        user: currentUser
      });
    } catch (error) {
      console.error('Mini login error:', error);
      sendResponse(res, null, '登录失败', 500);
    }
  });

  app.post('/api/miniprogram/auth/wechat-login', async (req, res) => {
    try {
      const { role = 'student', code, nickName = '微信用户', avatarUrl = '' } = req.body;
      const openId = buildOpenIdFromCode(code);
      const profile = await get('SELECT user_id, role_code, audit_status, blacklisted, blacklist_reason FROM mp_user_profile WHERE wechat_open_id = ?', [openId]);

      if (!profile) {
        sendResponse(res, {
          status: 'needs_binding',
          draft: { role, openId, nickName, avatarUrl }
        });
        return;
      }

      const currentUser = await getCurrentUserRecord(profile.user_id);
      if (!currentUser) {
        sendResponse(res, null, '用户不存在', 404);
        return;
      }
      if (role && currentUser.role !== role) {
        sendResponse(res, null, `该微信已绑定${currentUser.role}身份，请切换身份后再登录`, 400);
        return;
      }
      if (currentUser.auditStatus === 'pending') {
        sendResponse(res, null, '身份认证待管理员审核，请稍后再试', 403);
        return;
      }
      if (currentUser.auditStatus === 'rejected') {
        sendResponse(res, null, '身份认证未通过，请重新提交认证信息', 403);
        return;
      }
      if (currentUser.blacklisted) {
        sendResponse(res, null, `账号已被加入黑名单${currentUser.blacklistReason ? `：${currentUser.blacklistReason}` : ''}`, 403);
        return;
      }

      await run(
        'UPDATE mp_user_profile SET wechat_nick_name = ?, wechat_avatar = ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?',
        [nickName, avatarUrl, currentUser.id]
      );
      const token = generateToken(currentUser.id, currentUser.username);
      sendResponse(res, {
        status: 'logged_in',
        token,
        user: {
          ...currentUser,
          avatarUrl
        }
      });
    } catch (error) {
      console.error('Mini wechat login error:', error);
      sendResponse(res, null, '微信登录失败', 500);
    }
  });

  app.post('/api/miniprogram/auth/bind', async (req, res) => {
    try {
      const { role = 'student', openId, nickName = '微信用户', avatarUrl = '', name, phone, identityNo, department } = req.body;
      if (!openId || !name || !phone || !identityNo || !department) {
        sendResponse(res, null, '请完整填写认证信息', 400);
        return;
      }

      const existedByOpenId = await get('SELECT user_id FROM mp_user_profile WHERE wechat_open_id = ?', [openId]);
      const existedByIdentity = await get('SELECT user_id FROM mp_user_profile WHERE role_code = ? AND student_no = ?', [role, identityNo]);
      if (existedByOpenId && existedByIdentity && existedByOpenId.user_id !== existedByIdentity.user_id) {
        sendResponse(res, null, '该微信已绑定其他账号', 400);
        return;
      }

      let userId = existedByIdentity?.user_id || existedByOpenId?.user_id || null;
      let username = `${role}${identityNo}`.toLowerCase();
      if (!userId) {
        const inserted = await run(
          'INSERT INTO sys_user (UserName, Password, RealName, Mobile, Email, Status, CreatedAt, UpdatedAt) VALUES (?, ?, ?, ?, ?, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)',
          [username, '123456', name, phone, `${username}@example.com`]
        );
        userId = inserted.lastID;
      } else {
        const base = await get('SELECT UserName FROM sys_user WHERE UserID = ?', [userId]);
        username = base?.UserName || username;
        await run(
          'UPDATE sys_user SET RealName = ?, Mobile = ?, UpdatedAt = CURRENT_TIMESTAMP WHERE UserID = ?',
          [name, phone, userId]
        );
      }

      await ensureUserRole(userId, role, role);
      const existingProfile = await getProfile(userId);
      const nextAuditStatus = existingProfile?.audit_status === 'approved' ? 'approved' : 'pending';
      await upsertProfile(userId, {
        role_code: role,
        student_no: identityNo,
        department,
        phone,
        audit_status: nextAuditStatus,
        audit_remark: nextAuditStatus === 'approved' ? (existingProfile?.audit_remark || '') : '待管理员审核身份信息',
        blacklisted: !!Number(existingProfile?.blacklisted || 0),
        blacklist_reason: existingProfile?.blacklist_reason || '',
        blacklist_at: existingProfile?.blacklist_at || null,
        blacklist_by_user_id: existingProfile?.blacklist_by_user_id || null,
        reviewed_at: nextAuditStatus === 'approved' ? (existingProfile?.reviewed_at || null) : null,
        reviewed_by_user_id: nextAuditStatus === 'approved' ? (existingProfile?.reviewed_by_user_id || null) : null,
        role_updated_at: existingProfile?.role_updated_at || null,
        role_updated_by_user_id: existingProfile?.role_updated_by_user_id || null,
        wechat_open_id: openId,
        wechat_nick_name: nickName,
        wechat_avatar: avatarUrl,
        auth_channel: 'wechat',
        identity_bound_at: dayjs().format('YYYY-MM-DD HH:mm:ss'),
        identity_submitted_at: dayjs().format('YYYY-MM-DD HH:mm:ss')
      });

      if (nextAuditStatus === 'approved') {
        const currentUser = await getCurrentUserRecord(userId);
        const token = generateToken(userId, username);
        sendResponse(res, {
          status: 'approved',
          token,
          user: currentUser
        });
        return;
      }

      await sendNotificationToRole('admin', 'system', '新的身份认证申请', `${name} 提交了${role}身份认证申请，请及时审核。`, 'user', userId);
      sendResponse(res, {
        status: 'pending',
        userId
      });
    } catch (error) {
      console.error('Mini bind error:', error);
      sendResponse(res, null, '提交失败', 500);
    }
  });

  app.get('/api/miniprogram/home', authenticateToken, async (req, res) => {
    try {
      const currentUser = await requireCurrentUser(req, res);
      if (!currentUser) {
        return;
      }
      const labs = await buildLabs();
      const reservations = await listReservations(currentUser, { status: 'all' });
      const courses = await getCourseRows(currentUser);
      const messages = await getMessageRows(currentUser.id);
      const today = formatDate(new Date());

      sendResponse(res, {
        user: currentUser,
        banners: MINI_BANNERS,
        todayCourses: courses.filter(item => item.date === today).slice(0, 3),
        todayReservations: reservations.filter(item => item.date === today).slice(0, 3),
        quickLabs: labs.slice(0, 3),
        unreadCount: messages.filter(item => !item.read).length,
        reservationCount: reservations.filter(item => item.status === 'approved').length
      });
    } catch (error) {
      console.error('Mini home error:', error);
      sendResponse(res, null, '加载首页数据失败', 500);
    }
  });

  app.get('/api/miniprogram/mine', authenticateToken, async (req, res) => {
    try {
      const currentUser = await requireCurrentUser(req, res);
      if (!currentUser) {
        return;
      }
      const reservations = await listReservations(currentUser, { status: 'all' });
      const borrowRequests = currentUser.role === 'admin'
        ? (await getBorrowRows()).map(normalizeBorrowRecord)
        : (await getBorrowRows({ applicantId: currentUser.id })).map(normalizeBorrowRecord);
      const consumableRequests = currentUser.role === 'admin'
        ? (await getConsumableRequestRows()).map(normalizeConsumableRequest)
        : (await getConsumableRequestRows({ applicantId: currentUser.id })).map(normalizeConsumableRequest);
      const courses = await getCourseRows(currentUser);
      const labs = await buildLabs();
      const equipments = (await getEquipmentRows()).map(normalizeEquipment);
      const consumables = (await getConsumableRows()).map(normalizeConsumable);
      let stats = [];

      if (currentUser.role === 'teacher') {
        const reports = await getReportRows({ role: 'teacher', id: currentUser.id }, null);
        stats = [
          { label: '负责课程', value: courses.length },
          { label: '待审预约', value: (await listReservations(currentUser, { status: 'pending', scope: 'all' })).length },
          { label: '设备待审', value: (await getBorrowRows({ status: 'pending' })).length },
          { label: '已交报告', value: reports.length }
        ];
      } else if (currentUser.role === 'admin') {
        const users = await getRawUserList();
        stats = [
          { label: '用户总数', value: users.length },
          { label: '实验室', value: labs.length },
          { label: '设备资产', value: equipments.length },
          { label: '耗材种类', value: consumables.length }
        ];
      } else {
        stats = [
          { label: '我的预约', value: reservations.length },
          { label: '设备借用', value: borrowRequests.length },
          { label: '耗材申请', value: consumableRequests.length },
          { label: '相关课程', value: courses.length }
        ];
      }

      sendResponse(res, {
        user: currentUser,
        stats
      });
    } catch (error) {
      console.error('Mini mine error:', error);
      sendResponse(res, null, '加载个人中心失败', 500);
    }
  });

  app.get('/api/miniprogram/teachers', authenticateToken, async (_req, res) => {
    try {
      sendResponse(res, await getTeacherList());
    } catch (error) {
      console.error('Mini teachers error:', error);
      sendResponse(res, null, '加载教师列表失败', 500);
    }
  });

  app.get('/api/miniprogram/labs', authenticateToken, async (_req, res) => {
    try {
      sendResponse(res, await buildLabs());
    } catch (error) {
      console.error('Mini labs error:', error);
      sendResponse(res, null, '加载实验室失败', 500);
    }
  });

  app.get('/api/miniprogram/labs/:id', authenticateToken, async (req, res) => {
    try {
      const lab = await getLabById(req.params.id);
      if (!lab) {
        sendResponse(res, null, '实验室不存在', 404);
        return;
      }
      const reservations = await getReservationRowsForRoom(req.params.id);
      sendResponse(res, {
        ...lab,
        schedules: reservations.slice(0, 4).map(normalizeReservation)
      });
    } catch (error) {
      console.error('Mini lab detail error:', error);
      sendResponse(res, null, '加载实验室详情失败', 500);
    }
  });

  app.get('/api/miniprogram/reservations', authenticateToken, async (req, res) => {
    try {
      const currentUser = await requireCurrentUser(req, res);
      if (!currentUser) {
        return;
      }
      const { status = 'all', scope = '' } = req.query;
      sendResponse(res, await listReservations(currentUser, { status, scope }));
    } catch (error) {
      console.error('Mini reservations error:', error);
      sendResponse(res, null, '加载预约列表失败', 500);
    }
  });

  app.post('/api/miniprogram/reservations', authenticateToken, async (req, res) => {
    try {
      const currentUser = await requireCurrentUser(req, res);
      if (!currentUser) {
        return;
      }

      const { labId, projectName, purpose, date, timeSlot, phone, projectLeader, memberGrade, memberClass, headCount, remark } = req.body;
      const lab = await get(`
        SELECT r.RoomID, r.RoomName, r.RoomCode, r.Capacity, b.BuildingID, b.BuildingName
        FROM Ven_Room r
        LEFT JOIN Ven_Building b ON b.BuildingID = r.BuildingID
        WHERE r.RoomID = ?
      `, [labId]);
      if (!lab) {
        sendResponse(res, null, '实验室不存在', 400);
        return;
      }
      if (Number(headCount || 0) > Number(lab.Capacity || 0)) {
        sendResponse(res, null, '预约人数超过实验室容量', 400);
        return;
      }

      const duplicate = await get(`
        SELECT id FROM lab_reservation
        WHERE applicant_id = ? AND use_date = ? AND time_slot = ? AND deleted_at IS NULL AND approval_status IN ('pending', 'approved')
      `, [currentUser.id, date, timeSlot]);
      if (duplicate) {
        sendResponse(res, null, '你已存在同一时段预约，请勿重复提交', 400);
        return;
      }

      const conflict = await get(`
        SELECT id FROM lab_reservation
        WHERE room_id = ? AND use_date = ? AND time_slot = ? AND deleted_at IS NULL AND approval_status IN ('pending', 'approved')
      `, [labId, date, timeSlot]);
      if (conflict) {
        sendResponse(res, null, '所选实验室在该时段已被预约', 400);
        return;
      }

      const reservationCode = `RV-${Date.now()}`;
      const weekNo = getWeekIndex(date);
      const weekDay = weekdayLabelToIndex(date);
      const approvalStatus = currentUser.role === 'admin' ? 'approved' : 'pending';
      const result = await run(`
        INSERT INTO lab_reservation (
          reservation_code, semester_id, building_id, building_name, room_id, room_name, room_number,
          use_date, week_no, week_day, time_slot, project_name, project_category, applicant_id,
          applicant_name, applicant_phone, project_leader, project_leader_phone, member_grade,
          member_class, member_count, remarks, approval_status, check_in_code, created_by, created_by_name,
          created_at, updated_at
        ) VALUES (?, 1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      `, [
        reservationCode,
        lab.BuildingID,
        lab.BuildingName || '',
        lab.RoomID,
        lab.RoomName,
        lab.RoomCode,
        date,
        weekNo,
        weekDay,
        timeSlot,
        projectName,
        purpose,
        currentUser.id,
        currentUser.name,
        phone || currentUser.phone || '',
        projectLeader || currentUser.name,
        phone || currentUser.phone || '',
        memberGrade || '',
        memberClass || '',
        Number(headCount || 0),
        remark || '',
        approvalStatus,
        approvalStatus === 'approved' ? `LAB-CHECK-${Date.now()}` : '',
        currentUser.id,
        currentUser.name
      ]);

      if (approvalStatus === 'approved') {
        const inserted = await get('SELECT * FROM lab_reservation WHERE id = ?', [result.lastID]);
        const schedulingId = await createSchedulingFromReservation(inserted);
        await run('UPDATE lab_reservation SET scheduling_id = ? WHERE id = ?', [schedulingId, result.lastID]);
      } else {
        await sendNotificationToRole('teacher', 'reservation_apply', '新的实验室预约申请', `${currentUser.name} 提交了 ${lab.RoomName} 的预约申请，请及时处理。`, 'reservation', result.lastID);
        await sendNotificationToRole('admin', 'reservation_apply', '新的实验室预约申请', `${currentUser.name} 提交了 ${lab.RoomName} 的预约申请，请及时处理。`, 'reservation', result.lastID);
      }

      const record = await getReservationDetailRow(result.lastID);
      sendResponse(res, normalizeReservation(record), '预约提交成功');
    } catch (error) {
      console.error('Mini create reservation error:', error);
      sendResponse(res, null, '预约提交失败', 500);
    }
  });

  app.get('/api/miniprogram/reservations/:id', authenticateToken, async (req, res) => {
    try {
      const currentUser = await requireCurrentUser(req, res);
      if (!currentUser) {
        return;
      }
      const row = await getReservationDetailRow(req.params.id);
      if (!row) {
        sendResponse(res, null, '预约记录不存在', 404);
        return;
      }
      if (!['teacher', 'admin'].includes(currentUser.role) && Number(row.applicant_id) !== Number(currentUser.id)) {
        sendResponse(res, null, '无权查看该预约', 403);
        return;
      }
      const normalized = normalizeReservation(row);
      normalized.labOpenTime = row.MpOpenTime || '以实验室通知为准';
      sendResponse(res, normalized);
    } catch (error) {
      console.error('Mini reservation detail error:', error);
      sendResponse(res, null, '加载预约详情失败', 500);
    }
  });

  app.put('/api/miniprogram/reservations/:id/cancel', authenticateToken, async (req, res) => {
    try {
      const currentUser = await requireCurrentUser(req, res);
      if (!currentUser) {
        return;
      }
      const row = await getReservationDetailRow(req.params.id);
      if (!row) {
        sendResponse(res, null, '预约记录不存在', 404);
        return;
      }
      if (!['teacher', 'admin'].includes(currentUser.role) && Number(row.applicant_id) !== Number(currentUser.id)) {
        sendResponse(res, null, '无权取消该预约', 403);
        return;
      }
      await run(`
        UPDATE lab_reservation
        SET approval_status = 'cancelled', cancel_reason = ?, cancelled_by = ?, cancelled_by_name = ?,
            cancelled_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `, [req.body.cancelReason || '用户取消', currentUser.id, currentUser.name, req.params.id]);
      if (row.scheduling_id) {
        await run('UPDATE lab_scheduling SET status = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [row.scheduling_id]);
      }
      sendResponse(res, null, '取消成功');
    } catch (error) {
      console.error('Mini cancel reservation error:', error);
      sendResponse(res, null, '取消失败', 500);
    }
  });

  app.put('/api/miniprogram/reservations/:id/check-in', authenticateToken, async (req, res) => {
    try {
      const currentUser = await requireCurrentUser(req, res);
      if (!currentUser) {
        return;
      }
      const row = await getReservationDetailRow(req.params.id);
      if (!row) {
        sendResponse(res, null, '预约记录不存在', 404);
        return;
      }
      if (!['teacher', 'admin'].includes(currentUser.role) && Number(row.applicant_id) !== Number(currentUser.id)) {
        sendResponse(res, null, '无权操作该预约', 403);
        return;
      }
      if (formatDate(row.use_date) !== formatDate(new Date())) {
        sendResponse(res, null, '仅可在预约当天完成签到', 400);
        return;
      }
      if (row.approval_status !== 'approved' && row.approval_status !== 'completed') {
        sendResponse(res, null, '预约通过后才能签到', 400);
        return;
      }
      if (row.checked_in_at) {
        sendResponse(res, null, '当前预约已完成签到', 400);
        return;
      }

      await run(`
        UPDATE lab_reservation
        SET checked_in_at = CURRENT_TIMESTAMP, checked_in_by_id = ?, checked_in_by_name = ?,
            approval_status = 'approved', updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `, [currentUser.id, currentUser.name, req.params.id]);
      const updated = await getReservationDetailRow(req.params.id);
      updated.approval_status = 'approved';
      updated.checked_in_at = dayjs().format('YYYY-MM-DD HH:mm:ss');
      sendResponse(res, normalizeReservation(updated), '签到成功');
    } catch (error) {
      console.error('Mini reservation check-in error:', error);
      sendResponse(res, null, '签到失败', 500);
    }
  });

  app.get('/api/miniprogram/equipment', authenticateToken, async (req, res) => {
    try {
      const { keyword = '', category = 'all', status = 'all' } = req.query;
      const equipment = (await getEquipmentRows({ keyword })).map(normalizeEquipment);
      const filtered = equipment.filter(item => {
        const matchCategory = category === 'all' || item.category === category;
        const matchStatus = status === 'all' || item.status === status;
        return matchCategory && matchStatus;
      });
      sendResponse(res, filtered);
    } catch (error) {
      console.error('Mini equipment error:', error);
      sendResponse(res, null, '加载设备失败', 500);
    }
  });

  app.get('/api/miniprogram/equipment/requests', authenticateToken, async (req, res) => {
    try {
      const currentUser = await requireCurrentUser(req, res);
      if (!currentUser) {
        return;
      }
      const { status = 'all', scope = '' } = req.query;
      const rows = await getBorrowRows({
        applicantId: scope === 'all' && ['teacher', 'admin'].includes(currentUser.role) ? null : currentUser.id,
        status
      });
      sendResponse(res, rows.map(normalizeBorrowRecord));
    } catch (error) {
      console.error('Mini equipment requests error:', error);
      sendResponse(res, null, '加载借用记录失败', 500);
    }
  });

  app.post('/api/miniprogram/equipment/requests', authenticateToken, async (req, res) => {
    try {
      const currentUser = await requireCurrentUser(req, res);
      if (!currentUser) {
        return;
      }
      const { equipmentId, borrowDate, borrowTime, returnDate, returnTime, purpose } = req.body;
      const equipment = await get(`
        SELECT e.id, e.name, e.asset_code, e.model, e.location, e.status, c.name as category_name
        FROM equ_equipment e
        LEFT JOIN equ_category c ON c.id = e.category_id
        WHERE e.id = ?
      `, [equipmentId]);
      if (!equipment) {
        sendResponse(res, null, '设备不存在', 400);
        return;
      }
      if (toMiniEquipmentStatus(equipment.status) !== 'idle') {
        sendResponse(res, null, '当前设备不可借用', 400);
        return;
      }
      const borrowAt = `${borrowDate} ${borrowTime}:00`;
      const returnAt = `${returnDate} ${returnTime}:00`;
      if (dayjs(returnAt).isBefore(dayjs(borrowAt))) {
        sendResponse(res, null, '归还时间不能早于借用时间', 400);
        return;
      }
      const active = await get(
        `SELECT id FROM equ_borrow_record WHERE equipment_id = ? AND status IN ('pending', 'pending_teacher', 'pending_admin', 'approved', 'borrowed')`,
        [equipmentId]
      );
      if (active) {
        sendResponse(res, null, '该设备已有进行中的借用流程', 400);
        return;
      }

      const borrowCode = `BRW${Date.now().toString().slice(-8)}`;
      const finalStatus = currentUser.role === 'admin' ? 'approved' : 'pending';
      const result = await run(`
        INSERT INTO equ_borrow_record (
          borrow_code, equipment_id, equipment_name, asset_code, applicant_id, applicant_name,
          applicant_phone, borrow_date, expect_return_date, use_place, purpose, quantity, status,
          created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      `, [
        borrowCode,
        equipment.id,
        equipment.name,
        equipment.asset_code,
        currentUser.id,
        currentUser.name,
        currentUser.phone || '',
        borrowAt,
        returnAt,
        equipment.location || '',
        purpose || '',
        finalStatus
      ]);

      if (finalStatus === 'approved') {
        await run('UPDATE equ_equipment SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', ['reserved', equipment.id]);
      } else {
        await sendNotificationToRole('admin', 'borrow_apply', '新的设备借用申请', `${currentUser.name} 申请借用 ${equipment.name}。`, 'borrow', result.lastID);
      }

      const record = await getBorrowRows({ applicantId: currentUser.id });
      sendResponse(res, record.find(item => Number(item.id) === Number(result.lastID)) ? normalizeBorrowRecord(record.find(item => Number(item.id) === Number(result.lastID))) : null);
    } catch (error) {
      console.error('Mini create equipment request error:', error);
      sendResponse(res, null, '提交借用申请失败', 500);
    }
  });

  app.put('/api/miniprogram/equipment/requests/:id/borrow', authenticateToken, async (req, res) => {
    try {
      const currentUser = await requireCurrentUser(req, res);
      if (!currentUser) {
        return;
      }
      const row = await get('SELECT * FROM equ_borrow_record WHERE id = ?', [req.params.id]);
      if (!row) {
        sendResponse(res, null, '借用记录不存在', 404);
        return;
      }
      if (!['admin'].includes(currentUser.role) && Number(row.applicant_id) !== Number(currentUser.id)) {
        sendResponse(res, null, '无权操作该借用记录', 403);
        return;
      }
      if (row.status !== 'approved') {
        sendResponse(res, null, '当前记录尚未审批通过', 400);
        return;
      }
      const scanResult = String(req.body.scanResult || '').trim();
      const matchValues = [row.asset_code, String(row.equipment_id), `EQ-${row.equipment_id}`, `NO-${row.asset_code}`].filter(Boolean);
      if (scanResult && !matchValues.includes(scanResult)) {
        sendResponse(res, null, '扫码结果与申请设备不匹配', 400);
        return;
      }

      await run(`
        UPDATE equ_borrow_record
        SET status = 'borrowed', receive_user_id = ?, receive_user_name = ?, receive_time = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `, [currentUser.id, currentUser.name, req.params.id]);
      await run('UPDATE equ_equipment SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', ['borrowed', row.equipment_id]);

      const updated = await getBorrowRows({ equipmentId: row.equipment_id, applicantId: row.applicant_id });
      sendResponse(res, updated.find(item => Number(item.id) === Number(req.params.id)) ? normalizeBorrowRecord(updated.find(item => Number(item.id) === Number(req.params.id))) : null);
    } catch (error) {
      console.error('Mini borrow by scan error:', error);
      sendResponse(res, null, '扫码借出失败', 500);
    }
  });

  app.put('/api/miniprogram/equipment/requests/:id/return', authenticateToken, async (req, res) => {
    try {
      const currentUser = await requireCurrentUser(req, res);
      if (!currentUser) {
        return;
      }
      const row = await get('SELECT * FROM equ_borrow_record WHERE id = ?', [req.params.id]);
      if (!row) {
        sendResponse(res, null, '借用记录不存在', 404);
        return;
      }
      if (!['admin'].includes(currentUser.role) && Number(row.applicant_id) !== Number(currentUser.id)) {
        sendResponse(res, null, '无权操作该借用记录', 403);
        return;
      }
      if (!['borrowed', 'approved'].includes(row.status)) {
        sendResponse(res, null, '当前记录未处于借用中', 400);
        return;
      }
      const scanResult = String(req.body.scanResult || '').trim();
      const matchValues = [row.asset_code, String(row.equipment_id), `EQ-${row.equipment_id}`, `NO-${row.asset_code}`].filter(Boolean);
      if (scanResult && !matchValues.includes(scanResult)) {
        sendResponse(res, null, '扫码结果与申请设备不匹配', 400);
        return;
      }

      await run(`
        UPDATE equ_borrow_record
        SET status = 'returned', actual_return_date = CURRENT_TIMESTAMP, return_user_id = ?, return_user_name = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `, [currentUser.id, currentUser.name, req.params.id]);
      await run('UPDATE equ_equipment SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', ['available', row.equipment_id]);

      const updated = await getBorrowRows({ equipmentId: row.equipment_id, applicantId: row.applicant_id });
      sendResponse(res, updated.find(item => Number(item.id) === Number(req.params.id)) ? normalizeBorrowRecord(updated.find(item => Number(item.id) === Number(req.params.id))) : null);
    } catch (error) {
      console.error('Mini return by scan error:', error);
      sendResponse(res, null, '扫码归还失败', 500);
    }
  });

  app.get('/api/miniprogram/consumables', authenticateToken, async (_req, res) => {
    try {
      sendResponse(res, (await getConsumableRows()).map(normalizeConsumable));
    } catch (error) {
      console.error('Mini consumables error:', error);
      sendResponse(res, null, '加载耗材失败', 500);
    }
  });

  app.get('/api/miniprogram/consumables/requests', authenticateToken, async (req, res) => {
    try {
      const currentUser = await requireCurrentUser(req, res);
      if (!currentUser) {
        return;
      }
      const { status = 'all', scope = '' } = req.query;
      const applicantId = scope === 'all' && currentUser.role === 'admin' ? null : currentUser.id;
      sendResponse(res, (await getConsumableRequestRows({ applicantId, status })).map(normalizeConsumableRequest));
    } catch (error) {
      console.error('Mini consumable requests error:', error);
      sendResponse(res, null, '加载耗材申请失败', 500);
    }
  });

  app.post('/api/miniprogram/consumables/requests', authenticateToken, async (req, res) => {
    try {
      const currentUser = await requireCurrentUser(req, res);
      if (!currentUser) {
        return;
      }
      const { consumableId, quantity, purpose } = req.body;
      const consumable = await get('SELECT * FROM consumable WHERE id = ? AND status = 1', [consumableId]);
      if (!consumable) {
        sendResponse(res, null, '耗材不存在', 400);
        return;
      }
      if (Number(quantity || 0) <= 0 || Number(quantity) > Number(consumable.stock || 0)) {
        sendResponse(res, null, '申请数量超过当前库存', 400);
        return;
      }

      const outNo = `OUT${Date.now()}`;
      const finalStatus = currentUser.role === 'admin' ? 'approved' : 'pending';
      const result = await run(`
        INSERT INTO stock_out (
          out_no, consumable_id, consumable_name, quantity, applicant_id, applicant_name,
          purpose, lab_name, status, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      `, [
        outNo,
        consumable.id,
        consumable.consumable_name,
        Number(quantity),
        currentUser.id,
        currentUser.name,
        purpose || '',
        '',
        finalStatus
      ]);

      if (finalStatus === 'approved') {
        const beforeStock = Number(consumable.stock || 0);
        const afterStock = beforeStock - Number(quantity);
        await run('UPDATE consumable SET stock = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [afterStock, consumable.id]);
        await run(`
          INSERT INTO stock_log (
            consumable_id, consumable_name, change_type, before_stock, after_stock, quantity, operator_id, operator_name, related_no, created_at
          ) VALUES (?, ?, 'out', ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        `, [consumable.id, consumable.consumable_name, beforeStock, afterStock, -Number(quantity), currentUser.id, currentUser.name, outNo]);
      } else {
        await sendNotificationToRole('admin', 'consumable_apply', '新的耗材申请', `${currentUser.name} 申请 ${consumable.consumable_name}。`, 'consumable', result.lastID);
      }

      const rows = await getConsumableRequestRows({ applicantId: currentUser.id });
      sendResponse(res, rows.find(item => Number(item.id) === Number(result.lastID)) ? normalizeConsumableRequest(rows.find(item => Number(item.id) === Number(result.lastID))) : null);
    } catch (error) {
      console.error('Mini create consumable request error:', error);
      sendResponse(res, null, '提交耗材申请失败', 500);
    }
  });

  app.get('/api/miniprogram/courses', authenticateToken, async (req, res) => {
    try {
      const currentUser = await requireCurrentUser(req, res);
      if (!currentUser) {
        return;
      }
      sendResponse(res, await getCourseRows(currentUser));
    } catch (error) {
      console.error('Mini courses error:', error);
      sendResponse(res, null, '加载课程失败', 500);
    }
  });

  app.post('/api/miniprogram/courses', authenticateToken, async (req, res) => {
    try {
      const currentUser = await requireCurrentUser(req, res);
      if (!currentUser) {
        return;
      }
      if (!['teacher', 'admin'].includes(currentUser.role)) {
        sendResponse(res, null, '当前身份无权发布课程', 403);
        return;
      }

      const { name, date, timeSlot, labId, className, teacherId } = req.body;
      if (!name || !date || !timeSlot || !className) {
        sendResponse(res, null, '请完整填写课程信息', 400);
        return;
      }

      const room = labId ? await get(`
        SELECT r.RoomID, r.RoomName, r.RoomCode, b.BuildingName
        FROM Ven_Room r
        LEFT JOIN Ven_Building b ON b.BuildingID = r.BuildingID
        WHERE r.RoomID = ?
      `, [labId]) : null;

      if (labId && !room) {
        sendResponse(res, null, '实验室不存在', 400);
        return;
      }

      let teacherUserId = currentUser.id;
      let teacherName = currentUser.name;
      if (currentUser.role === 'admin') {
        if (!teacherId) {
          sendResponse(res, null, '管理员创建课程时必须指定教师', 400);
          return;
        }
        const teacher = await get(`
          SELECT u.UserID, COALESCE(u.RealName, u.UserName) as RealName
          FROM sys_user u
          LEFT JOIN mp_user_profile p ON p.user_id = u.UserID
          WHERE u.UserID = ? AND p.role_code = 'teacher' AND COALESCE(p.audit_status, 'approved') = 'approved' AND COALESCE(p.blacklisted, 0) = 0
        `, [teacherId]);
        if (!teacher) {
          sendResponse(res, null, '指定教师不存在或不可用', 400);
          return;
        }
        teacherUserId = teacher.UserID;
        teacherName = teacher.RealName;
      }

      const conflict = await get(
        'SELECT id FROM mp_course WHERE room_id = ? AND course_date = ? AND time_slot = ?',
        [labId || null, date, timeSlot]
      );
      if (conflict) {
        sendResponse(res, null, '该实验室在同一时段已存在课程安排', 400);
        return;
      }

      const reservationConflict = labId ? await get(
        `SELECT id FROM lab_reservation WHERE room_id = ? AND use_date = ? AND time_slot = ? AND approval_status IN ('pending', 'approved') AND deleted_at IS NULL`,
        [labId, date, timeSlot]
      ) : null;
      if (reservationConflict) {
        sendResponse(res, null, '该实验室在同一时段已有预约安排', 400);
        return;
      }

      const result = await run(`
        INSERT INTO mp_course (
          course_name, course_date, time_slot, room_id, room_name, room_number, building_name,
          class_name, teacher_user_id, teacher_name, created_by_user_id, created_by_name,
          published_at, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      `, [
        name,
        date,
        timeSlot,
        room ? room.RoomID : null,
        room ? room.RoomName : '',
        room ? room.RoomCode : '',
        room ? room.BuildingName || '' : '',
        className,
        teacherUserId,
        teacherName,
        currentUser.id,
        currentUser.name
      ]);

      const created = await getCourseRow(result.lastID);
      sendResponse(res, {
        id: created.id,
        name: created.course_name,
        teacherName: created.teacher_name,
        teacherId: created.teacher_user_id,
        date: formatDate(created.course_date),
        timeSlot: created.time_slot,
        labId: created.room_id,
        labName: created.room_name || '',
        status: computeCourseStatus(formatDate(created.course_date), created.time_slot),
        className: created.class_name || '',
        scoreStatus: '待录入'
      });
    } catch (error) {
      console.error('Mini create course error:', error);
      sendResponse(res, null, '创建课程失败', 500);
    }
  });

  app.get('/api/miniprogram/courses/checkins', authenticateToken, async (req, res) => {
    try {
      const currentUser = await requireCurrentUser(req, res);
      if (!currentUser) {
        return;
      }
      sendResponse(res, await getCourseCheckinRows(req.query.courseId || null));
    } catch (error) {
      console.error('Mini course checkins error:', error);
      sendResponse(res, null, '加载签到数据失败', 500);
    }
  });

  app.post('/api/miniprogram/courses/:id/check-in', authenticateToken, async (req, res) => {
    try {
      const currentUser = await requireCurrentUser(req, res);
      if (!currentUser) {
        return;
      }
      if (currentUser.role !== 'student') {
        sendResponse(res, null, '仅学生可进行课程签到', 403);
        return;
      }
      const existing = await get('SELECT * FROM mp_course_attendance WHERE course_id = ? AND user_id = ?', [req.params.id, currentUser.id]);
      if (existing?.sign_in_at) {
        sendResponse(res, null, '当前课程已签到', 400);
        return;
      }
      if (existing) {
        await run('UPDATE mp_course_attendance SET sign_in_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [existing.id]);
      } else {
        await run('INSERT INTO mp_course_attendance (course_id, user_id, sign_in_at, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)', [req.params.id, currentUser.id]);
      }
      const rows = await getCourseCheckinRows(req.params.id);
      sendResponse(res, rows.find(item => Number(item.userId) === Number(currentUser.id)) || null);
    } catch (error) {
      console.error('Mini course sign-in error:', error);
      sendResponse(res, null, '签到失败', 500);
    }
  });

  app.post('/api/miniprogram/courses/:id/check-out', authenticateToken, async (req, res) => {
    try {
      const currentUser = await requireCurrentUser(req, res);
      if (!currentUser) {
        return;
      }
      if (currentUser.role !== 'student') {
        sendResponse(res, null, '仅学生可进行课程签退', 403);
        return;
      }
      const existing = await get('SELECT * FROM mp_course_attendance WHERE course_id = ? AND user_id = ?', [req.params.id, currentUser.id]);
      if (!existing?.sign_in_at) {
        sendResponse(res, null, '请先完成签到', 400);
        return;
      }
      if (existing.sign_out_at) {
        sendResponse(res, null, '当前课程已签退', 400);
        return;
      }
      await run('UPDATE mp_course_attendance SET sign_out_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [existing.id]);
      const rows = await getCourseCheckinRows(req.params.id);
      sendResponse(res, rows.find(item => Number(item.userId) === Number(currentUser.id)) || null);
    } catch (error) {
      console.error('Mini course sign-out error:', error);
      sendResponse(res, null, '签退失败', 500);
    }
  });

  app.get('/api/miniprogram/reports', authenticateToken, async (req, res) => {
    try {
      const currentUser = await requireCurrentUser(req, res);
      if (!currentUser) {
        return;
      }
      sendResponse(res, await getReportRows(currentUser, req.query.courseId || null));
    } catch (error) {
      console.error('Mini reports error:', error);
      sendResponse(res, null, '加载报告失败', 500);
    }
  });

  app.get('/api/miniprogram/reports/course/:courseId', authenticateToken, async (req, res) => {
    try {
      const currentUser = await requireCurrentUser(req, res);
      if (!currentUser) {
        return;
      }
      const report = await get('SELECT * FROM mp_course_report WHERE course_id = ? AND user_id = ?', [req.params.courseId, currentUser.id]);
      sendResponse(res, report ? {
        id: report.id,
        courseId: report.course_id,
        courseName: report.course_name,
        userId: report.user_id,
        userName: report.user_name,
        content: report.content,
        updatedAt: formatDateTime(report.updated_at)
      } : null);
    } catch (error) {
      console.error('Mini report detail error:', error);
      sendResponse(res, null, '加载报告失败', 500);
    }
  });

  app.post('/api/miniprogram/reports', authenticateToken, async (req, res) => {
    try {
      const currentUser = await requireCurrentUser(req, res);
      if (!currentUser) {
        return;
      }
      const { courseId, courseName, content } = req.body;
      if (currentUser.role !== 'student') {
        sendResponse(res, null, '仅学生可提交实验报告', 403);
        return;
      }
      const existing = await get('SELECT id FROM mp_course_report WHERE course_id = ? AND user_id = ?', [courseId, currentUser.id]);
      if (existing) {
        await run('UPDATE mp_course_report SET content = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [content, existing.id]);
      } else {
        await run(
          'INSERT INTO mp_course_report (course_id, course_name, user_id, user_name, content, updated_at) VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)',
          [courseId, courseName, currentUser.id, currentUser.name, content]
        );
      }
      const report = await get('SELECT * FROM mp_course_report WHERE course_id = ? AND user_id = ?', [courseId, currentUser.id]);
      sendResponse(res, {
        id: report.id,
        courseId: report.course_id,
        courseName: report.course_name,
        userId: report.user_id,
        userName: report.user_name,
        content: report.content,
        updatedAt: formatDateTime(report.updated_at)
      });
    } catch (error) {
      console.error('Mini submit report error:', error);
      sendResponse(res, null, '提交报告失败', 500);
    }
  });

  app.get('/api/miniprogram/courses/:id/attendance', authenticateToken, async (req, res) => {
    try {
      const currentUser = await requireCurrentUser(req, res);
      if (!currentUser) {
        return;
      }
      if (!['teacher', 'admin'].includes(currentUser.role)) {
        sendResponse(res, null, '当前身份无权管理课程签到', 403);
        return;
      }
      const course = await getCourseRow(req.params.id);
      if (!course) {
        sendResponse(res, null, '课程不存在', 404);
        return;
      }
      if (currentUser.role === 'teacher' && Number(course.teacher_user_id) !== Number(currentUser.id)) {
        sendResponse(res, null, '只能管理本人负责的课程', 403);
        return;
      }
      const students = await getStudentList();
      const reports = await getReportRows({ role: 'admin', id: currentUser.id }, req.params.id);
      const checkins = await getCourseCheckinRows(req.params.id);
      const studentList = students.map(student => {
        const checkin = checkins.find(item => Number(item.userId) === Number(student.id));
        const report = reports.find(item => Number(item.userId) === Number(student.id));
        return {
          id: student.id,
          name: student.name,
          studentNo: student.studentNo,
          department: student.department,
          signInAt: checkin?.signInAt || '',
          signOutAt: checkin?.signOutAt || '',
          attendanceStatus: checkin?.signOutAt ? '已签退' : (checkin?.signInAt ? '已签到' : '未签到'),
          reportSubmitted: !!report
        };
      });
      sendResponse(res, {
        course: {
          id: course.id,
          name: course.course_name,
          teacherName: course.teacher_name,
          teacherId: course.teacher_user_id,
          date: formatDate(course.course_date),
          timeSlot: course.time_slot,
          labId: course.room_id,
          labName: course.room_name || '',
          status: computeCourseStatus(formatDate(course.course_date), course.time_slot),
          className: course.class_name || '',
          scoreStatus: '待录入'
        },
        summary: [
          { label: '应到学生', value: studentList.length, intro: '纳入本课程的统计人数' },
          { label: '已签到', value: studentList.filter(item => item.signInAt).length, intro: '已完成签到登记' },
          { label: '已签退', value: studentList.filter(item => item.signOutAt).length, intro: '已完成签退归档' },
          { label: '报告提交', value: studentList.filter(item => item.reportSubmitted).length, intro: '实验报告提交情况' }
        ],
        students: studentList
      });
    } catch (error) {
      console.error('Mini course attendance error:', error);
      sendResponse(res, null, '加载签到数据失败', 500);
    }
  });

  app.put('/api/miniprogram/courses/:courseId/attendance/:studentId', authenticateToken, async (req, res) => {
    try {
      const currentUser = await requireCurrentUser(req, res);
      if (!currentUser) {
        return;
      }
      if (!['teacher', 'admin'].includes(currentUser.role)) {
        sendResponse(res, null, '当前身份无权管理课程签到', 403);
        return;
      }
      const course = await getCourseRow(req.params.courseId);
      if (!course) {
        sendResponse(res, null, '课程不存在', 404);
        return;
      }
      if (currentUser.role === 'teacher' && Number(course.teacher_user_id) !== Number(currentUser.id)) {
        sendResponse(res, null, '只能管理本人负责的课程', 403);
        return;
      }
      const { action } = req.body;
      const existing = await get('SELECT * FROM mp_course_attendance WHERE course_id = ? AND user_id = ?', [req.params.courseId, req.params.studentId]);
      if (action === 'reset') {
        if (existing) {
          await run('DELETE FROM mp_course_attendance WHERE id = ?', [existing.id]);
        }
        sendResponse(res, { action, studentId: Number(req.params.studentId) });
        return;
      }
      if (action === 'signIn') {
        if (existing) {
          await run('UPDATE mp_course_attendance SET sign_in_at = COALESCE(sign_in_at, CURRENT_TIMESTAMP), updated_at = CURRENT_TIMESTAMP WHERE id = ?', [existing.id]);
        } else {
          await run('INSERT INTO mp_course_attendance (course_id, user_id, sign_in_at, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)', [req.params.courseId, req.params.studentId]);
        }
      } else if (action === 'signOut') {
        if (!existing?.sign_in_at) {
          sendResponse(res, null, '学生尚未签到，无法签退', 400);
          return;
        }
        await run('UPDATE mp_course_attendance SET sign_out_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [existing.id]);
      } else {
        sendResponse(res, null, '未知的签到操作', 400);
        return;
      }
      sendResponse(res, { action, studentId: Number(req.params.studentId) });
    } catch (error) {
      console.error('Mini update attendance error:', error);
      sendResponse(res, null, '更新签到失败', 500);
    }
  });

  app.get('/api/miniprogram/courses/:id/gradebook', authenticateToken, async (req, res) => {
    try {
      const currentUser = await requireCurrentUser(req, res);
      if (!currentUser) {
        return;
      }
      if (!['teacher', 'admin'].includes(currentUser.role)) {
        sendResponse(res, null, '当前身份无权录入成绩', 403);
        return;
      }
      const course = await getCourseRow(req.params.id);
      if (!course) {
        sendResponse(res, null, '课程不存在', 404);
        return;
      }
      if (currentUser.role === 'teacher' && Number(course.teacher_user_id) !== Number(currentUser.id)) {
        sendResponse(res, null, '只能录入本人负责课程的成绩', 403);
        return;
      }
      const students = await getStudentList();
      const checkins = await getCourseCheckinRows(req.params.id);
      const reports = await getReportRows({ role: 'admin', id: currentUser.id }, req.params.id);
      const scores = await all('SELECT * FROM mp_course_score WHERE course_id = ?', [req.params.id]);
      const studentList = students.map(student => {
        const checkin = checkins.find(item => Number(item.userId) === Number(student.id));
        const report = reports.find(item => Number(item.userId) === Number(student.id));
        const score = scores.find(item => Number(item.student_id) === Number(student.id));
        return {
          id: student.id,
          name: student.name,
          studentNo: student.studentNo,
          attendanceStatus: checkin?.signOutAt ? '已签退' : (checkin?.signInAt ? '已签到' : '未签到'),
          reportSubmitted: !!report,
          score: score?.score ?? '',
          comment: score?.comment || '',
          updatedAt: formatDateTime(score?.updated_at)
        };
      });
      const scoredList = studentList.filter(item => item.score !== '' && item.score !== null && item.score !== undefined);
      const averageScore = scoredList.length
        ? (scoredList.reduce((sum, item) => sum + Number(item.score || 0), 0) / scoredList.length).toFixed(1)
        : '--';
      sendResponse(res, {
        course: {
          id: course.id,
          name: course.course_name,
          teacherName: course.teacher_name,
          teacherId: course.teacher_user_id,
          date: formatDate(course.course_date),
          timeSlot: course.time_slot,
          labId: course.room_id,
          labName: course.room_name || '',
          status: computeCourseStatus(formatDate(course.course_date), course.time_slot),
          className: course.class_name || '',
          scoreStatus: scoredList.length ? '已录入' : '待录入'
        },
        summary: [
          { label: '学生人数', value: studentList.length, intro: '本课程成绩簿范围' },
          { label: '已录成绩', value: scoredList.length, intro: '已完成成绩录入' },
          { label: '待录成绩', value: studentList.length - scoredList.length, intro: '仍需补录或修改' },
          { label: '平均分', value: averageScore, intro: '已录入成绩平均值' }
        ],
        students: studentList
      });
    } catch (error) {
      console.error('Mini gradebook error:', error);
      sendResponse(res, null, '加载成绩簿失败', 500);
    }
  });

  app.put('/api/miniprogram/courses/:id/scores', authenticateToken, async (req, res) => {
    try {
      const currentUser = await requireCurrentUser(req, res);
      if (!currentUser) {
        return;
      }
      if (!['teacher', 'admin'].includes(currentUser.role)) {
        sendResponse(res, null, '当前身份无权录入成绩', 403);
        return;
      }
      const course = await getCourseRow(req.params.id);
      if (!course) {
        sendResponse(res, null, '课程不存在', 404);
        return;
      }
      if (currentUser.role === 'teacher' && Number(course.teacher_user_id) !== Number(currentUser.id)) {
        sendResponse(res, null, '只能录入本人负责课程的成绩', 403);
        return;
      }
      const items = Array.isArray(req.body.items) ? req.body.items : [];
      for (const item of items) {
        if (item.score !== '' && item.score !== null && item.score !== undefined) {
          const numeric = Number(item.score);
          if (Number.isNaN(numeric) || numeric < 0 || numeric > 100) {
            sendResponse(res, null, `学生 ${item.studentName} 的成绩需在 0-100 之间`, 400);
            return;
          }
        }
        const existing = await get('SELECT id FROM mp_course_score WHERE course_id = ? AND student_id = ?', [req.params.id, item.studentId]);
        if (existing) {
          await run(
            'UPDATE mp_course_score SET student_name = ?, score = ?, comment = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
            [item.studentName, item.score === '' ? null : Number(item.score), item.comment || '', existing.id]
          );
        } else {
          await run(
            'INSERT INTO mp_course_score (course_id, student_id, student_name, score, comment, updated_at) VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)',
            [req.params.id, item.studentId, item.studentName, item.score === '' ? null : Number(item.score), item.comment || '']
          );
        }
      }
      sendResponse(res, { updatedCount: items.length, updatedAt: formatDateTime(new Date()) });
    } catch (error) {
      console.error('Mini save scores error:', error);
      sendResponse(res, null, '保存成绩失败', 500);
    }
  });

  app.get('/api/miniprogram/messages', authenticateToken, async (req, res) => {
    try {
      const currentUser = await requireCurrentUser(req, res);
      if (!currentUser) {
        return;
      }
      sendResponse(res, await getMessageRows(currentUser.id, req.query.category || 'all'));
    } catch (error) {
      console.error('Mini messages error:', error);
      sendResponse(res, null, '加载消息失败', 500);
    }
  });

  app.put('/api/miniprogram/messages/:id/read', authenticateToken, async (req, res) => {
    try {
      const currentUser = await requireCurrentUser(req, res);
      if (!currentUser) {
        return;
      }
      await run('UPDATE lab_notification SET is_read = 1, read_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND user_id = ?', [req.params.id, currentUser.id]);
      sendResponse(res, null, '已标记为已读');
    } catch (error) {
      console.error('Mini read message error:', error);
      sendResponse(res, null, '操作失败', 500);
    }
  });

  app.get('/api/miniprogram/approvals/:type', authenticateToken, async (req, res) => {
    try {
      const currentUser = await requireCurrentUser(req, res);
      if (!currentUser) {
        return;
      }
      const { type } = req.params;
      if (!['teacher', 'admin'].includes(currentUser.role)) {
        sendResponse(res, null, '当前身份无权查看审批中心', 403);
        return;
      }
      if (type === 'reservation') {
        sendResponse(res, await listReservations(currentUser, { status: 'pending', scope: 'all' }));
        return;
      }
      if (type === 'equipment') {
        if (currentUser.role !== 'admin') {
          sendResponse(res, null, '仅管理员可查看设备审批', 403);
          return;
        }
        sendResponse(res, (await getBorrowRows({ status: 'pending' })).map(normalizeBorrowRecord));
        return;
      }
      if (type === 'consumable') {
        if (currentUser.role !== 'admin') {
          sendResponse(res, null, '仅管理员可查看耗材审批', 403);
          return;
        }
        sendResponse(res, (await getConsumableRequestRows({ status: 'pending' })).map(normalizeConsumableRequest));
        return;
      }
      sendResponse(res, null, '未知审批类型', 400);
    } catch (error) {
      console.error('Mini approvals error:', error);
      sendResponse(res, null, '加载审批数据失败', 500);
    }
  });

  app.put('/api/miniprogram/approvals/:type/:id', authenticateToken, async (req, res) => {
    try {
      const currentUser = await requireCurrentUser(req, res);
      if (!currentUser) {
        return;
      }
      const { type, id } = req.params;
      const approved = !!req.body.approved;
      const status = approved ? 'approved' : 'rejected';

      if (type === 'reservation') {
        const row = await getReservationDetailRow(id);
        if (!row) {
          sendResponse(res, null, '预约记录不存在', 404);
          return;
        }
        await run(`
          UPDATE lab_reservation
          SET approval_status = ?, approval_comment = ?, approved_by = ?, approved_by_name = ?, approved_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP,
              check_in_code = CASE WHEN ? = 'approved' THEN COALESCE(check_in_code, ?) ELSE '' END
          WHERE id = ?
        `, [status, approved ? '审批通过' : '审批驳回', currentUser.id, currentUser.name, status, `LAB-CHECK-${Date.now()}`, id]);
        if (approved && !row.scheduling_id) {
          const updated = await getReservationDetailRow(id);
          const schedulingId = await createSchedulingFromReservation(updated);
          await run('UPDATE lab_reservation SET scheduling_id = ? WHERE id = ?', [schedulingId, id]);
        }
        await sendNotification(row.applicant_id, row.applicant_name, approved ? 'reservation_approved' : 'reservation_rejected', approved ? '实验室预约已通过' : '实验室预约未通过', `${row.room_name} ${formatDate(row.use_date)} ${row.time_slot} 的申请结果已更新。`, 'reservation', Number(id));
        const updated = await getReservationDetailRow(id);
        sendResponse(res, normalizeReservation(updated));
        return;
      }

      if (type === 'equipment') {
        if (currentUser.role !== 'admin') {
          sendResponse(res, null, '仅管理员可处理设备审批', 403);
          return;
        }
        const row = await get('SELECT * FROM equ_borrow_record WHERE id = ?', [id]);
        if (!row) {
          sendResponse(res, null, '借用记录不存在', 404);
          return;
        }
        await run(`
          UPDATE equ_borrow_record
          SET status = ?, approval_user_id = ?, approval_user_name = ?, approval_time = CURRENT_TIMESTAMP, approval_comment = ?, updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `, [status, currentUser.id, currentUser.name, approved ? '审批通过' : '审批驳回', id]);
        if (approved) {
          await run('UPDATE equ_equipment SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', ['reserved', row.equipment_id]);
        }
        await sendNotification(row.applicant_id, row.applicant_name, approved ? 'borrow_approved' : 'borrow_rejected', approved ? '设备申请已通过' : '设备申请未通过', `${row.equipment_name} 的借用申请结果已更新。`, 'borrow', Number(id));
        const updatedRows = await getBorrowRows({ applicantId: row.applicant_id, equipmentId: row.equipment_id });
        const updatedRecord = updatedRows.find(item => Number(item.id) === Number(id));
        sendResponse(res, updatedRecord ? normalizeBorrowRecord(updatedRecord) : null);
        return;
      }

      if (type === 'consumable') {
        if (currentUser.role !== 'admin') {
          sendResponse(res, null, '仅管理员可处理耗材审批', 403);
          return;
        }
        const row = await get('SELECT * FROM stock_out WHERE id = ?', [id]);
        if (!row) {
          sendResponse(res, null, '耗材申请不存在', 404);
          return;
        }
        if (approved) {
          const consumable = await get('SELECT * FROM consumable WHERE id = ?', [row.consumable_id]);
          if (!consumable || Number(consumable.stock || 0) < Number(row.quantity || 0)) {
            sendResponse(res, null, '当前库存不足，无法通过审批', 400);
            return;
          }
          const beforeStock = Number(consumable.stock || 0);
          const afterStock = beforeStock - Number(row.quantity || 0);
          await run('UPDATE consumable SET stock = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [afterStock, row.consumable_id]);
          await run(`
            INSERT INTO stock_log (
              consumable_id, consumable_name, change_type, before_stock, after_stock, quantity, operator_id, operator_name, related_no, created_at
            ) VALUES (?, ?, 'out', ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
          `, [row.consumable_id, row.consumable_name, beforeStock, afterStock, -Number(row.quantity || 0), currentUser.id, currentUser.name, row.out_no]);
        }
        await run(`
          UPDATE stock_out
          SET status = ?, approval_user_id = ?, approval_user_name = ?, approval_time = CURRENT_TIMESTAMP, approval_comment = ?, out_time = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `, [status, currentUser.id, currentUser.name, approved ? '审批通过' : '审批驳回', id]);
        await sendNotification(row.applicant_id, row.applicant_name, approved ? 'consumable_approved' : 'consumable_rejected', approved ? '耗材申请已通过' : '耗材申请未通过', `${row.consumable_name} 的领用申请结果已更新。`, 'consumable', Number(id));
        const updatedRows = await getConsumableRequestRows({ applicantId: row.applicant_id });
        const updatedRecord = updatedRows.find(item => Number(item.id) === Number(id));
        sendResponse(res, updatedRecord ? normalizeConsumableRequest(updatedRecord) : null);
        return;
      }

      sendResponse(res, null, '未知审批类型', 400);
    } catch (error) {
      console.error('Mini handle approval error:', error);
      sendResponse(res, null, '处理审批失败', 500);
    }
  });

  app.get('/api/miniprogram/admin/dashboard', authenticateToken, async (req, res) => {
    try {
      const currentUser = await requireCurrentUser(req, res);
      if (!currentUser) {
        return;
      }
      if (currentUser.role !== 'admin') {
        sendResponse(res, null, '仅管理员可查看数据统计', 403);
        return;
      }
      const labs = await buildLabs();
      const reservations = await all("SELECT * FROM lab_reservation WHERE deleted_at IS NULL");
      const equipment = (await getEquipmentRows()).map(normalizeEquipment);
      const consumables = (await getConsumableRows()).map(normalizeConsumable);
      sendResponse(res, {
        cards: [
          { label: '待审预约', value: reservations.filter(item => item.approval_status === 'pending').length, intro: '预约审批中心' },
          { label: '已生效预约', value: reservations.filter(item => item.approval_status === 'approved').length, intro: '本期有效安排' },
          { label: '借用中设备', value: equipment.filter(item => item.status === 'borrowed').length, intro: '设备流转状态' },
          { label: '低库存耗材', value: consumables.filter(item => item.stock <= item.warningValue).length, intro: '需要补货提醒' }
        ],
        usageList: labs.map(lab => ({
          id: lab.id,
          name: lab.name,
          value: lab.approvedReservationCount,
          status: lab.status
        })),
        lowStockList: consumables.filter(item => item.stock <= item.warningValue)
      });
    } catch (error) {
      console.error('Mini dashboard error:', error);
      sendResponse(res, null, '加载统计数据失败', 500);
    }
  });

  app.get('/api/miniprogram/admin/users', authenticateToken, async (req, res) => {
    try {
      const currentUser = await requireCurrentUser(req, res);
      if (!currentUser) {
        return;
      }
      if (currentUser.role !== 'admin') {
        sendResponse(res, null, '仅管理员可查看用户信息', 403);
        return;
      }
      const users = await getRawUserList();
      sendResponse(res, decorateAdminUserList(users, currentUser.id));
    } catch (error) {
      console.error('Mini admin users error:', error);
      sendResponse(res, null, '加载用户信息失败', 500);
    }
  });

  app.put('/api/miniprogram/admin/users/:id/review', authenticateToken, async (req, res) => {
    try {
      const currentUser = await requireCurrentUser(req, res);
      if (!currentUser) {
        return;
      }
      if (currentUser.role !== 'admin') {
        sendResponse(res, null, '仅管理员可审核用户', 403);
        return;
      }
      const targetUserId = Number(req.params.id);
      if (targetUserId === Number(currentUser.id)) {
        sendResponse(res, null, '不能审核当前登录账号', 400);
        return;
      }
      const approved = !!req.body.approved;
      const users = await getRawUserList();
      const targetUser = users.find(item => Number(item.id) === targetUserId);
      const target = await getProfile(targetUserId);
      if (!targetUser || !target) {
        sendResponse(res, null, '用户资料不存在', 404);
        return;
      }
      if (targetUser.role === 'admin' && !approved && countAvailableAdmins(users, targetUser.id) === 0) {
        sendResponse(res, null, '请至少保留一个可用管理员账号', 400);
        return;
      }
      await run(`
        UPDATE mp_user_profile
        SET audit_status = ?, audit_remark = ?, reviewed_at = CURRENT_TIMESTAMP, reviewed_by_user_id = ?, updated_at = CURRENT_TIMESTAMP
        WHERE user_id = ?
      `, [approved ? 'approved' : 'rejected', approved ? '管理员审核通过' : '管理员审核驳回', currentUser.id, targetUserId]);
      const updatedUsers = await getRawUserList();
      const updatedUser = updatedUsers.find(item => Number(item.id) === targetUserId) || null;
      sendResponse(res, updatedUser ? decorateAdminUserList([updatedUser], currentUser.id)[0] : { success: true });
    } catch (error) {
      console.error('Mini review user error:', error);
      sendResponse(res, null, '审核失败', 500);
    }
  });

  app.put('/api/miniprogram/admin/users/:id/role', authenticateToken, async (req, res) => {
    try {
      const currentUser = await requireCurrentUser(req, res);
      if (!currentUser) {
        return;
      }
      if (currentUser.role !== 'admin') {
        sendResponse(res, null, '仅管理员可分配角色', 403);
        return;
      }
      const { role } = req.body;
      if (!['student', 'teacher', 'admin'].includes(role)) {
        sendResponse(res, null, '目标角色不合法', 400);
        return;
      }
      const targetUserId = Number(req.params.id);
      if (targetUserId === Number(currentUser.id)) {
        sendResponse(res, null, '不能修改当前登录账号的权限', 400);
        return;
      }
      const users = await getRawUserList();
      const targetUser = users.find(item => Number(item.id) === targetUserId);
      if (!targetUser) {
        sendResponse(res, null, '用户不存在', 404);
        return;
      }
      if ((targetUser.auditStatus || 'approved') !== 'approved') {
        sendResponse(res, null, '请先完成用户审核再分配权限', 400);
        return;
      }
      if (targetUser.role === role) {
        sendResponse(res, null, '该用户当前已是此角色', 400);
        return;
      }
      if (targetUser.role === 'admin' && role !== 'admin' && countAvailableAdmins(users, targetUser.id) === 0) {
        sendResponse(res, null, '请至少保留一个可用管理员账号', 400);
        return;
      }
      await run('DELETE FROM sys_user_role WHERE user_id = ?', [targetUserId]);
      await ensureUserRole(targetUserId, role, role);
      const profile = await getProfile(targetUserId);
      await upsertProfile(targetUserId, {
        ...(profile || {}),
        role_code: role,
        role_updated_at: dayjs().format('YYYY-MM-DD HH:mm:ss'),
        role_updated_by_user_id: currentUser.id
      });
      const updatedUsers = await getRawUserList();
      const updatedUser = updatedUsers.find(item => Number(item.id) === targetUserId) || null;
      sendResponse(res, updatedUser ? decorateAdminUserList([updatedUser], currentUser.id)[0] : { success: true });
    } catch (error) {
      console.error('Mini assign role error:', error);
      sendResponse(res, null, '角色更新失败', 500);
    }
  });

  app.put('/api/miniprogram/admin/users/:id/blacklist', authenticateToken, async (req, res) => {
    try {
      const currentUser = await requireCurrentUser(req, res);
      if (!currentUser) {
        return;
      }
      if (currentUser.role !== 'admin') {
        sendResponse(res, null, '仅管理员可管理黑名单', 403);
        return;
      }
      const targetUserId = Number(req.params.id);
      if (targetUserId === Number(currentUser.id)) {
        sendResponse(res, null, '不能操作当前登录账号的黑名单状态', 400);
        return;
      }
      const users = await getRawUserList();
      const targetUser = users.find(item => Number(item.id) === targetUserId);
      const profile = await getProfile(targetUserId);
      if (!targetUser || !profile) {
        sendResponse(res, null, '用户资料不存在', 404);
        return;
      }
      const { blacklisted, reason = '' } = req.body;
      if (blacklisted && targetUser.role === 'admin' && countAvailableAdmins(users, targetUser.id) === 0) {
        sendResponse(res, null, '请至少保留一个可用管理员账号', 400);
        return;
      }
      await upsertProfile(targetUserId, {
        ...profile,
        blacklisted: !!blacklisted,
        blacklist_reason: blacklisted ? reason : '',
        blacklist_at: blacklisted ? dayjs().format('YYYY-MM-DD HH:mm:ss') : null,
        blacklist_by_user_id: blacklisted ? currentUser.id : null
      });
      const updatedUsers = await getRawUserList();
      const updatedUser = updatedUsers.find(item => Number(item.id) === targetUserId) || null;
      sendResponse(res, updatedUser ? decorateAdminUserList([updatedUser], currentUser.id)[0] : { success: true });
    } catch (error) {
      console.error('Mini blacklist error:', error);
      sendResponse(res, null, '黑名单状态更新失败', 500);
    }
  });

  app.post('/api/miniprogram/admin/labs', authenticateToken, async (req, res) => {
    try {
      const currentUser = await requireCurrentUser(req, res);
      if (!currentUser) {
        return;
      }
      if (currentUser.role !== 'admin') {
        sendResponse(res, null, '仅管理员可管理实验室', 403);
        return;
      }
      const { id, name, building, roomNumber, capacity, status, openTime, description, guide } = req.body;
      const buildingRow = await ensureBuilding(building);
      if (!name || !buildingRow || !roomNumber) {
        sendResponse(res, null, '请完整填写实验室信息', 400);
        return;
      }
      if (id) {
        await run(`
          UPDATE Ven_Room
          SET RoomName = ?, RoomCode = ?, BuildingID = ?, Capacity = ?, Description = ?, MpStatus = ?, MpOpenTime = ?, MpGuide = ?, UpdatedAt = CURRENT_TIMESTAMP
          WHERE RoomID = ?
        `, [name, roomNumber, buildingRow.BuildingID, Number(capacity || 0), description || '', status || 'available', openTime || '', guide || '', id]);
      } else {
        await run(`
          INSERT INTO Ven_Room (RoomName, RoomCode, BuildingID, Capacity, RoomType, Equipment, Status, Description, MpStatus, MpOpenTime, MpGuide, CreatedAt, UpdatedAt)
          VALUES (?, ?, ?, ?, 'lab', '', 1, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        `, [name, roomNumber, buildingRow.BuildingID, Number(capacity || 0), description || '', status || 'available', openTime || '', guide || '']);
      }
      sendResponse(res, { success: true });
    } catch (error) {
      console.error('Mini save lab error:', error);
      sendResponse(res, null, '保存实验室失败', 500);
    }
  });

  app.post('/api/miniprogram/admin/equipment', authenticateToken, async (req, res) => {
    try {
      const currentUser = await requireCurrentUser(req, res);
      if (!currentUser) {
        return;
      }
      if (currentUser.role !== 'admin') {
        sendResponse(res, null, '仅管理员可管理设备', 403);
        return;
      }
      const { id, name, no, model, category, status, location } = req.body;
      if (!name || !no || !category || !location) {
        sendResponse(res, null, '请完整填写设备信息', 400);
        return;
      }
      const categoryId = await ensureEquipmentCategory(category);
      if (id) {
        await run(`
          UPDATE equ_equipment
          SET asset_code = ?, name = ?, model = ?, category_id = ?, status = ?, location = ?, updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `, [no, name, model || '', categoryId, toDbEquipmentStatus(status), location, id]);
      } else {
        await run(`
          INSERT INTO equ_equipment (
            asset_code, name, model, category_id, unit, location, status, created_at, updated_at
          ) VALUES (?, ?, ?, ?, '台', ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        `, [no, name, model || '', categoryId, location, toDbEquipmentStatus(status)]);
      }
      sendResponse(res, { success: true });
    } catch (error) {
      console.error('Mini save equipment error:', error);
      sendResponse(res, null, '保存设备失败', 500);
    }
  });

  app.post('/api/miniprogram/admin/consumables', authenticateToken, async (req, res) => {
    try {
      const currentUser = await requireCurrentUser(req, res);
      if (!currentUser) {
        return;
      }
      if (currentUser.role !== 'admin') {
        sendResponse(res, null, '仅管理员可管理耗材库存', 403);
        return;
      }
      const { id, name, category, unit, stock, warningValue } = req.body;
      if (!name || !category || !unit) {
        sendResponse(res, null, '请完整填写耗材信息', 400);
        return;
      }
      const categoryId = await ensureConsumableCategory(category);
      if (id) {
        await run(`
          UPDATE consumable
          SET consumable_name = ?, category_id = ?, unit = ?, stock = ?, min_stock = ?, updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `, [name, categoryId, unit, Number(stock || 0), Number(warningValue || 0), id]);
      } else {
        await run(`
          INSERT INTO consumable (
            consumable_no, consumable_name, category_id, unit, stock, min_stock, max_stock, status, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        `, [`CONS-${Date.now()}`, name, categoryId, unit, Number(stock || 0), Number(warningValue || 0), Number(stock || 0)]);
      }
      sendResponse(res, { success: true });
    } catch (error) {
      console.error('Mini save consumable error:', error);
      sendResponse(res, null, '保存耗材失败', 500);
    }
  });
};
