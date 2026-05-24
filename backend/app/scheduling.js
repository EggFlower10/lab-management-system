module.exports = function (app, pool, authenticateToken, sendResponse) {
  console.log('scheduling module loaded');

  // 获取排课列表
  app.get('/api/v1/scheduling', authenticateToken, async (req, res) => {
    try {
      const { semesterId, weekNo, weekNoStart, weekNoEnd, buildingId, roomId, majorId, classId, teacherId, courseName, sourceType } = req.query;

      let sql = `
        SELECT 
          s.id,
          s.scheduling_code,
          s.semester_id,
          s.source_type,
          s.source_id,
          s.course_id,
          s.course_name,
          s.course_category,
          s.major_id,
          s.major_name,
          s.class_id,
          s.class_name,
          s.student_count,
          s.building_id,
          IFNULL(b.BuildingName, s.building_name) as building_name,
          s.room_id,
          IFNULL(r.RoomName, s.room_name) as room_name,
          IFNULL(r.RoomCode, s.room_number) as room_number,
          s.teacher_id,
          IFNULL(u.RealName, s.teacher_name) as teacher_name,
          s.teacher_title,
          s.week_no,
          s.week_day,
          s.week_type,
          s.time_slot_start,
          s.time_slot_end,
          s.status,
          s.approval_status,
          s.created_at,
          s.updated_at
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
      } else {
        if (weekNoStart) {
          sql += ' AND s.week_no >= ?';
          params.push(weekNoStart);
        }

        if (weekNoEnd) {
          sql += ' AND s.week_no <= ?';
          params.push(weekNoEnd);
        }
      }

      if (buildingId) {
        sql += ' AND s.building_id = ?';
        params.push(buildingId);
      }

      if (roomId) {
        sql += ' AND s.room_id = ?';
        params.push(roomId);
      }

      if (classId) {
        sql += ' AND s.class_id = ?';
        params.push(classId);
      }

      if (teacherId) {
        sql += ' AND s.teacher_id = ?';
        params.push(teacherId);
      }

      if (courseName) {
        sql += ' AND (co.CourseName LIKE ? OR s.course_name LIKE ?)';
        params.push(`%${courseName}%`, `%${courseName}%`);
      }

      if (sourceType && sourceType !== 'all') {
        sql += ' AND s.source_type = ?';
        params.push(sourceType);
      }

      sql += ' ORDER BY s.week_no, s.week_day, s.time_slot_start';

      const [schedulingRows] = await pool.query(sql, params);

      let pendingReservationSql = `
        SELECT 
          r.id,
          CONCAT('PR-', r.id) as scheduling_code,
          r.semester_id,
          'PendingReservation' as source_type,
          r.id as source_id,
          NULL as course_id,
          r.project_name as course_name,
          r.project_category as course_category,
          NULL as major_id,
          NULL as major_name,
          NULL as class_id,
          r.member_class as class_name,
          r.member_count as student_count,
          r.building_id,
          IFNULL(b.BuildingName, r.building_name) as building_name,
          r.room_id,
          IFNULL(room.RoomName, r.room_name) as room_name,
          IFNULL(room.RoomCode, r.room_number) as room_number,
          NULL as teacher_id,
          r.project_leader as teacher_name,
          NULL as teacher_title,
          r.week_no,
          r.week_day,
          'all' as week_type,
          r.time_slot as time_slot_start,
          r.time_slot as time_slot_end,
          1 as status,
          r.approval_status,
          r.created_at,
          r.updated_at
        FROM lab_reservation r
        LEFT JOIN ven_building b ON r.building_id = b.BuildingID
        LEFT JOIN ven_room room ON r.room_id = room.RoomID
        WHERE r.approval_status = 'pending'
      `;

      const pendingReservationParams = [];
      if (semesterId) {
        pendingReservationSql += ' AND r.semester_id = ?';
        pendingReservationParams.push(semesterId);
      }
      if (weekNo) {
        pendingReservationSql += ' AND r.week_no = ?';
        pendingReservationParams.push(weekNo);
      }
      if (buildingId) {
        pendingReservationSql += ' AND r.building_id = ?';
        pendingReservationParams.push(buildingId);
      }
      if (roomId) {
        pendingReservationSql += ' AND r.room_id = ?';
        pendingReservationParams.push(roomId);
      }

      const [pendingReservationRows] = await pool.query(pendingReservationSql, pendingReservationParams);

      let pendingTeachingRequestSql = `
        SELECT 
          t.id,
          CONCAT('PTR-', t.id) as scheduling_code,
          t.semester_id,
          'PendingTeachingRequest' as source_type,
          t.id as source_id,
          t.course_id,
          t.course_name,
          NULL as course_category,
          t.major_id,
          t.major_name,
          t.class_id,
          t.class_name,
          NULL as student_count,
          t.expected_building_id as building_id,
          t.expected_building_name as building_name,
          t.expected_room_id as room_id,
          t.expected_room_name as room_name,
          NULL as room_number,
          NULL as teacher_id,
          t.applicant_name as teacher_name,
          NULL as teacher_title,
          t.week_no,
          t.week_day,
          'all' as week_type,
          t.time_slot as time_slot_start,
          t.time_slot as time_slot_end,
          1 as status,
          t.approval_status,
          t.created_at,
          t.updated_at
        FROM lab_teaching_request t
        WHERE t.approval_status = 'pending'
      `;

      const pendingTeachingRequestParams = [];
      if (semesterId) {
        pendingTeachingRequestSql += ' AND t.semester_id = ?';
        pendingTeachingRequestParams.push(semesterId);
      }
      if (weekNo) {
        pendingTeachingRequestSql += ' AND t.week_no = ?';
        pendingTeachingRequestParams.push(weekNo);
      }
      if (buildingId) {
        pendingTeachingRequestSql += ' AND t.expected_building_id = ?';
        pendingTeachingRequestParams.push(buildingId);
      }

      const [pendingTeachingRequestRows] = await pool.query(pendingTeachingRequestSql, pendingTeachingRequestParams);

      const allRows = [...schedulingRows, ...pendingReservationRows, ...pendingTeachingRequestRows];
      allRows.sort((a, b) => {
        if (a.week_no !== b.week_no) return a.week_no - b.week_no;
        if (a.week_day !== b.week_day) return a.week_day - b.week_day;
        return a.time_slot_start.localeCompare(b.time_slot_start);
      });

      sendResponse(res, allRows);
    } catch (error) {
      console.error('获取排课列表错误:', error);
      sendResponse(res, null, '获取排课列表失败', 500);
    }
  });

  // 创建集中排课
  app.post('/api/v1/scheduling/central', authenticateToken, async (req, res) => {
    const {
      semesterId, courseId, courseName, courseCategory,
      majorId, majorName, classId, className, studentCount,
      buildingId, buildingName, roomId, roomName, roomNumber,
      teacherId, teacherName, teacherTitle,
      weekDay, weekType, weekStart, weekEnd,
      timeSlotStart, timeSlots
    } = req.body;

    try {
      // 解析周次范围
      let weeks = [];
      for (let i = parseInt(weekStart); i <= parseInt(weekEnd); i++) {
        if (weekType === 'odd' && i % 2 === 0) continue;
        if (weekType === 'even' && i % 2 === 1) continue;
        weeks.push(i);
      }

      // 解析节次
      const slots = timeSlots ? timeSlots : (timeSlotStart ? timeSlotStart.split(',') : []);

      // 生成排课编号
      const schedulingCode = `CS-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

      const insertPromises = weeks.map(async (weekNo) => {
        return Promise.all(slots.map(async (slot) => {
          const [result] = await pool.query(
            `INSERT INTO lab_scheduling (
              scheduling_code, semester_id, course_id, course_name, course_category,
              major_id, major_name, class_id, class_name, student_count,
              building_id, building_name, room_id, room_name, room_number,
              teacher_id, teacher_name, teacher_title,
              week_day, week_no, week_type, time_slot_start,
              source_type, status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              schedulingCode, semesterId, courseId, courseName, courseCategory,
              majorId, majorName, classId, className, studentCount || 0,
              buildingId, buildingName, roomId, roomName, roomNumber,
              teacherId, teacherName, teacherTitle,
              weekDay, weekNo, weekType || 'all', slot,
              'CentralScheduling', 1
            ]
          );
          return result.insertId;
        }));
      });

      await Promise.all(insertPromises);

      sendResponse(res, { schedulingCode }, '排课成功');
    } catch (error) {
      console.error('创建排课错误:', error);
      sendResponse(res, null, '创建排课失败', 500);
    }
  });

  // 更新排课
  app.put('/api/v1/scheduling/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    const {
      courseName, courseCategory,
      majorName, className, studentCount,
      buildingId, buildingName, roomId, roomName, roomNumber,
      teacherName, teacherTitle,
      weekDay, weekNo, weekType, weekStart, weekEnd, timeSlotStart, status, force = false
    } = req.body;

    try {
      // 获取原排课记录信息（用于获取排课编号）
      const [originalRows] = await pool.query('SELECT scheduling_code, week_no FROM lab_scheduling WHERE id = ?', [id]);
      if (originalRows.length === 0) {
        return sendResponse(res, null, '排课记录不存在', 404);
      }

      const schedulingCode = originalRows[0].scheduling_code;

      // 解析周次范围
      let weeks = [];
      const originalWeekNo = originalRows[0].week_no;

      if (weekStart && weekEnd) {
        // 如果提供了周次范围，使用范围
        for (let i = parseInt(weekStart); i <= parseInt(weekEnd); i++) {
          if (weekType === 'odd' && i % 2 === 0) continue;
          if (weekType === 'even' && i % 2 === 1) continue;
          weeks.push(i);
        }
      } else if (weekNo) {
        // 否则使用单个周次
        weeks = [parseInt(weekNo)];
      } else {
        // 默认使用原周次
        weeks = [originalWeekNo];
      }

      // 解析节次
      const slots = timeSlotStart ? timeSlotStart.split(',') : [];

      // 更新所有同排课编号的记录
      await pool.query(
        `UPDATE lab_scheduling SET 
          course_name = ?, course_category = ?,
          major_name = ?, class_name = ?, student_count = ?,
          building_id = ?, building_name = ?, room_id = ?, room_name = ?, room_number = ?,
          teacher_name = ?, teacher_title = ?,
          week_day = ?, week_type = ?, time_slot_start = ?, status = ?
        WHERE scheduling_code = ?`,
        [
          courseName, courseCategory,
          majorName, className, studentCount || 0,
          buildingId, buildingName, roomId, roomName, roomNumber,
          teacherName, teacherTitle,
          weekDay, weekType || 'all', timeSlotStart, status || 1, schedulingCode
        ]
      );

      sendResponse(res, null, '更新成功');
    } catch (error) {
      console.error('更新排课错误:', error);
      sendResponse(res, null, '更新排课失败', 500);
    }
  });

  // 删除排课（逻辑删除）
  app.delete('/api/v1/scheduling/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;

    try {
      // 获取排课信息
      const [rows] = await pool.query('SELECT * FROM lab_scheduling WHERE id = ?', [id]);

      if (rows.length === 0) {
        return sendResponse(res, null, '排课记录不存在', 404);
      }

      // 逻辑删除
      await pool.query('UPDATE lab_scheduling SET status = 0 WHERE id = ?', [id]);

      sendResponse(res, null, '删除成功');
    } catch (error) {
      console.error('删除排课错误:', error);
      sendResponse(res, null, '删除排课失败', 500);
    }
  });

  // 检测空闲实验室
  app.get('/api/v1/scheduling/available-rooms', authenticateToken, async (req, res) => {
    try {
      const { semesterId, weekDay, timeSlots, weekStart, weekEnd, weekType, buildingId } = req.query;

      // 解析周次范围
      let weeks = [];
      for (let i = parseInt(weekStart); i <= parseInt(weekEnd); i++) {
        if (weekType === 'odd' && i % 2 === 0) continue;
        if (weekType === 'even' && i % 2 === 1) continue;
        weeks.push(i);
      }

      // 查询已占用的实验室
      let sql = `
        SELECT room_id, MAX(room_name) as room_name, MAX(building_name) as building_name, 
               GROUP_CONCAT(DISTINCT CONCAT(week_no, '-', week_day, '-', time_slot_start)) as conflict_times
        FROM lab_scheduling 
        WHERE status = 1
          AND week_day = ?
          AND time_slot_start IN (?)
          AND week_no IN (?)
      `;

      const params = [weekDay, timeSlots.split(','), weeks];

      if (semesterId) {
        sql += ' AND semester_id = ?';
        params.push(semesterId);
      }

      if (buildingId) {
        sql += ' AND building_id = ?';
        params.push(buildingId);
      }

      sql += ' GROUP BY room_id';

      const [occupiedRooms] = await pool.query(sql, params);

      sendResponse(res, {
        occupiedRooms: occupiedRooms.map(r => ({
          id: r.room_id,
          name: r.room_name,
          building: r.building_name,
          conflictTimes: r.conflict_times
        }))
      });
    } catch (error) {
      console.error('检测空闲实验室错误:', error);
      sendResponse(res, null, '检测空闲实验室失败', 500);
    }
  });

  // 检测冲突
  app.get('/api/v1/scheduling/check-conflict', authenticateToken, async (req, res) => {
    try {
      const { roomId, weekDay, timeSlots, timeSlot, weekNo, weekStart, weekEnd, weekType, teacherId, classId, excludeId } = req.query;

      // 解析周次范围 - 支持单个周次和周次范围两种方式
      let weeks = [];
      if (weekNo) {
        weeks = [parseInt(weekNo)];
      } else if (weekStart && weekEnd) {
        for (let i = parseInt(weekStart); i <= parseInt(weekEnd); i++) {
          if (weekType === 'odd' && i % 2 === 0) continue;
          if (weekType === 'even' && i % 2 === 1) continue;
          weeks.push(i);
        }
      }

      // 处理节次参数 - 支持单个节次和多个节次两种方式
      const slotList = timeSlots ? timeSlots.split(',') : (timeSlot ? [timeSlot] : []);

      const conflicts = {
        hasConflict: false,
        hasHardConflict: false,
        message: '',
        conflicts: []
      };

      // 检查实验室冲突（硬冲突）- 检查排课表
      let roomSql = `
        SELECT * FROM lab_scheduling 
        WHERE status = 1 
          AND room_id = ?
          AND week_day = ?
          AND time_slot_start IN (?)
          AND week_no IN (?)
      `;
      const roomParams = [roomId, weekDay, slotList, weeks];

      if (excludeId) {
        roomSql += ' AND id != ?';
        roomParams.push(excludeId);
      }

      const [roomConflicts] = await pool.query(roomSql, roomParams);

      if (roomConflicts.length > 0) {
        conflicts.hasConflict = true;
        conflicts.hasHardConflict = true;
        conflicts.message = '存在实验室时间冲突';
        conflicts.conflicts.push({
          type: 'room',
          message: `实验室已被 ${roomConflicts[0].course_name} 占用（${roomConflicts[0].week_no}周）`,
          hardConflict: true
        });
      }

      // 检查实验室冲突（硬冲突）- 检查预约表（包括待审批和已通过的预约）
      if (!conflicts.hasHardConflict) {
        let reservationSql = `
          SELECT * FROM lab_reservation 
          WHERE is_cancelled = 0 
            AND room_id = ?
            AND week_day = ?
            AND time_slot IN (?)
            AND week_no IN (?)
        `;
        const reservationParams = [roomId, weekDay, slotList, weeks];

        const [reservationConflicts] = await pool.query(reservationSql, reservationParams);

        if (reservationConflicts.length > 0) {
          conflicts.hasConflict = true;
          conflicts.hasHardConflict = true;
          conflicts.message = '存在实验室时间冲突';
          conflicts.conflicts.push({
            type: 'room',
            message: `实验室已被预约（${reservationConflicts[0].project_name}，${reservationConflicts[0].week_no}周）`,
            hardConflict: true
          });
        }
      }

      // 检查教师冲突（软冲突）
      if (teacherId) {
        let teacherSql = `
          SELECT * FROM lab_scheduling 
          WHERE status = 1 
            AND teacher_id = ?
            AND week_day = ?
            AND time_slot_start IN (?)
            AND week_no IN (?)
        `;
        const teacherParams = [teacherId, weekDay, slotList, weeks];

        if (excludeId) {
          teacherSql += ' AND id != ?';
          teacherParams.push(excludeId);
        }

        const [teacherConflicts] = await pool.query(teacherSql, teacherParams);

        if (teacherConflicts.length > 0) {
          conflicts.hasConflict = true;
          conflicts.message = conflicts.message || '存在教师时间冲突';
          conflicts.conflicts.push({
            type: 'teacher',
            message: `教师 ${teacherConflicts[0].teacher_name} 在 ${teacherConflicts[0].week_no}周 已有排课（${teacherConflicts[0].course_name}）`,
            hardConflict: false
          });
        }
      }

      // 检查班级冲突（软冲突）
      if (classId) {
        let classSql = `
          SELECT * FROM lab_scheduling 
          WHERE status = 1 
            AND class_id = ?
            AND week_day = ?
            AND time_slot_start IN (?)
            AND week_no IN (?)
        `;
        const classParams = [classId, weekDay, slotList, weeks];

        if (excludeId) {
          classSql += ' AND id != ?';
          classParams.push(excludeId);
        }

        const [classConflicts] = await pool.query(classSql, classParams);

        if (classConflicts.length > 0) {
          conflicts.hasConflict = true;
          conflicts.message = conflicts.message || '存在班级时间冲突';
          conflicts.conflicts.push({
            type: 'class',
            message: `班级 ${classConflicts[0].class_name} 在 ${classConflicts[0].week_no}周 已有排课（${classConflicts[0].course_name}）`,
            hardConflict: false
          });
        }
      }

      sendResponse(res, conflicts);
    } catch (error) {
      console.error('检测冲突错误:', error);
      sendResponse(res, null, '检测冲突失败', 500);
    }
  });

  // 获取单个排课详情（参数化路由，必须放在最后）
  app.get('/api/v1/scheduling/:id', authenticateToken, async (req, res) => {
    try {
      const { id } = req.params;
      const [rows] = await pool.query(`
        SELECT s.*, 
               b.BuildingName as building_name,
               r.RoomName as room_name,
               r.RoomCode as room_number,
               c.ClassName as class_name,
               m.MajorName as major_name,
               co.CourseName as course_name,
               u.RealName as teacher_name
        FROM lab_scheduling s
        LEFT JOIN ven_building b ON s.building_id = b.BuildingID
        LEFT JOIN ven_room r ON s.room_id = r.RoomID
        LEFT JOIN edu_class c ON s.class_id = c.ClassID
        LEFT JOIN edu_major m ON s.major_id = m.MajorID
        LEFT JOIN edu_course co ON s.course_id = co.CourseID
        LEFT JOIN sys_user u ON s.teacher_id = u.UserID
        WHERE s.id = ?
      `, [id]);

      if (rows.length === 0) {
        return sendResponse(res, null, '排课记录不存在', 404);
      }

      sendResponse(res, rows[0]);
    } catch (error) {
      console.error('获取排课详情错误:', error);
      sendResponse(res, null, '获取排课详情失败', 500);
    }
  });
};

// 检查冲突的辅助函数
async function checkConflicts(pool, roomId, weekDay, timeSlotStart, weekNo, teacherId, classId, force = false, excludeId = null) {
  const conflicts = {
    hardConflict: false,
    softConflict: false,
    message: ''
  };

  const timeSlots = timeSlotStart.split(',');

  // 检查实验室冲突（硬冲突）
  let roomSql = `
    SELECT * FROM lab_scheduling 
    WHERE status = 1 
      AND room_id = ?
      AND week_day = ?
      AND time_slot_start IN (?)
      AND week_no = ?
  `;
  const roomParams = [roomId, weekDay, timeSlots, weekNo];

  if (excludeId) {
    roomSql += ' AND id != ?';
    roomParams.push(excludeId);
  }

  const [roomConflicts] = await pool.query(roomSql, roomParams);

  if (roomConflicts.length > 0) {
    conflicts.hardConflict = true;
    conflicts.message = `实验室冲突：该实验室在第${weekNo}周 ${getWeekDayName(weekDay)} ${timeSlotStart} 已被 ${roomConflicts[0].course_name} 占用`;
  }

  return conflicts;
}

// 星期名称辅助函数
function getWeekDayName(day) {
  const days = ['', '周一', '周二', '周三', '周四', '周五', '周六', '周日'];
  return days[day] || '';
}
