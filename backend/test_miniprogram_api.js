const { spawn } = require('child_process');
const fs = require('fs');
const http = require('http');
const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '..');
const APP_ENTRY = path.join(__dirname, 'app.js');
const PORT = Number(process.env.TEST_PORT || 7003);
const TODAY = '2026-06-11';
const TIME_SLOTS = ['08:00-10:00', '10:00-12:00', '14:00-16:00', '16:00-18:00', '19:00-21:00'];
const CANDIDATE_DATES = ['2026-06-11', '2026-06-12', '2026-06-20', '2026-06-21'];

const RUNTIME_DIR = path.join(ROOT_DIR, '.runtime');
const OUT_LOG = path.join(RUNTIME_DIR, 'test-miniprogram-api.out.log');
const ERR_LOG = path.join(RUNTIME_DIR, 'test-miniprogram-api.err.log');

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function request(method, pathname, body, headers) {
  return new Promise((resolve, reject) => {
    const payload = body == null ? null : JSON.stringify(body);
    const req = http.request({
      hostname: '127.0.0.1',
      port: PORT,
      path: pathname,
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(payload ? { 'Content-Length': Buffer.byteLength(payload) } : {}),
        ...(headers || {})
      }
    }, (res) => {
      let chunks = '';
      res.setEncoding('utf8');
      res.on('data', (chunk) => {
        chunks += chunk;
      });
      res.on('end', () => {
        let data = null;
        try {
          data = chunks ? JSON.parse(chunks) : null;
        } catch (error) {
          reject(new Error(`invalid_json ${pathname} ${res.statusCode} ${chunks.slice(0, 300)}`));
          return;
        }
        resolve({ statusCode: res.statusCode, data });
      });
    });

    req.on('error', reject);
    if (payload) {
      req.write(payload);
    }
    req.end();
  });
}

async function api(pathname, options = {}) {
  const response = await request(options.method || 'GET', pathname, options.body, options.headers);
  const payload = response.data;
  if (response.statusCode < 200 || response.statusCode >= 300 || (payload && payload.code && payload.code !== 200)) {
    throw new Error(`api_error ${pathname} ${response.statusCode} ${JSON.stringify(payload)}`);
  }
  if (payload && Object.prototype.hasOwnProperty.call(payload, 'data')) {
    return payload.data;
  }
  return payload;
}

async function waitForServer() {
  for (let i = 0; i < 60; i += 1) {
    try {
      const response = await request('POST', '/api/miniprogram/auth/login', {
        username: '__probe__',
        password: '__probe__'
      });
      if ([200, 400, 401].includes(response.statusCode)) {
        return;
      }
    } catch (error) {
      // Ignore startup jitter until retries are exhausted.
    }
    await wait(500);
  }
  throw new Error(`server_start_timeout ${PORT}`);
}

async function login(username, password = '123456') {
  const payload = await api('/api/miniprogram/auth/login', {
    method: 'POST',
    body: { username, password }
  });
  return {
    token: payload.token,
    user: payload.user,
    headers: {
      Authorization: `Bearer ${payload.token}`
    }
  };
}

async function findFreeSlot(labId, headers) {
  const courses = await api('/api/miniprogram/courses', { headers });
  const reservations = await api('/api/miniprogram/reservations?scope=all', { headers });

  for (const date of CANDIDATE_DATES) {
    for (const timeSlot of TIME_SLOTS) {
      const courseConflict = courses.find((item) => (
        Number(item.labId) === Number(labId) &&
        item.date === date &&
        item.timeSlot === timeSlot
      ));
      const reservationConflict = reservations.find((item) => (
        Number(item.labId) === Number(labId) &&
        item.date === date &&
        item.timeSlot === timeSlot &&
        ['pending', 'approved', 'completed'].includes(item.status)
      ));
      if (!courseConflict && !reservationConflict) {
        return { date, timeSlot };
      }
    }
  }

  throw new Error(`no_free_slot_found_for_lab_${labId}`);
}

async function main() {
  fs.mkdirSync(RUNTIME_DIR, { recursive: true });
  const out = fs.openSync(OUT_LOG, 'w');
  const err = fs.openSync(ERR_LOG, 'w');

  const server = spawn(process.execPath, [APP_ENTRY], {
    cwd: ROOT_DIR,
    env: { ...process.env, PORT: String(PORT) },
    stdio: ['ignore', out, err]
  });

  try {
    await waitForServer();

    const admin = await login('admin');
    const teacher = await login('tea2026001');
    const student = await login('stu2026001');

    const results = {};
    const uniqueSuffix = Date.now();

    const labs = await api('/api/miniprogram/labs', { headers: student.headers });
    const lab = labs[0];
    if (!lab) {
      throw new Error('no_lab_found');
    }
    results.labsCount = labs.length;

    const labDetail = await api(`/api/miniprogram/labs/${lab.id}`, { headers: student.headers });
    results.labDetailName = labDetail.name;

    const futureReservationSlot = await findFreeSlot(lab.id, admin.headers);
    const reservation = await api('/api/miniprogram/reservations', {
      method: 'POST',
      headers: student.headers,
      body: {
        labId: lab.id,
        projectName: `联调预约${uniqueSuffix}`,
        purpose: '接口联调验证',
        date: futureReservationSlot.date,
        timeSlot: futureReservationSlot.timeSlot,
        phone: '13800138004',
        projectLeader: '学生用户',
        memberGrade: '2023级',
        memberClass: '软件工程1班',
        headCount: 3,
        remark: '自动化验证'
      }
    });
    results.reservationStatusCreated = reservation.status;

    const reservationPendingList = await api('/api/miniprogram/approvals/reservation', { headers: teacher.headers });
    const reservationPending = reservationPendingList.find((item) => Number(item.id) === Number(reservation.id));
    if (!reservationPending) {
      throw new Error('reservation_not_pending_for_teacher');
    }

    const reservationApproval = await api(`/api/miniprogram/approvals/reservation/${reservation.id}`, {
      method: 'PUT',
      headers: teacher.headers,
      body: { approved: true }
    });
    results.reservationApprovalStatus = reservationApproval.status;

    const reservationApproved = await api(`/api/miniprogram/reservations/${reservation.id}`, { headers: student.headers });
    results.reservationStatusApproved = reservationApproved.status;

    const todayCheckinReservation = await api('/api/miniprogram/reservations', {
      method: 'POST',
      headers: student.headers,
      body: {
        labId: lab.id,
        projectName: `签到预约${uniqueSuffix}`,
        purpose: '签到验证',
        date: TODAY,
        timeSlot: '19:00-21:00',
        phone: '13800138004',
        projectLeader: '学生用户',
        memberGrade: '2023级',
        memberClass: '软件工程1班',
        headCount: 2,
        remark: '自动化验证'
      }
    });
    await api(`/api/miniprogram/approvals/reservation/${todayCheckinReservation.id}`, {
      method: 'PUT',
      headers: teacher.headers,
      body: { approved: true }
    });
    const checkedInReservation = await api(`/api/miniprogram/reservations/${todayCheckinReservation.id}/check-in`, {
      method: 'PUT',
      headers: student.headers,
      body: {}
    });
    results.reservationStatusCheckedIn = checkedInReservation.status;

    const reservationToCancel = await api('/api/miniprogram/reservations', {
      method: 'POST',
      headers: student.headers,
      body: {
        labId: lab.id,
        projectName: `取消预约${uniqueSuffix}`,
        purpose: '取消验证',
        date: '2026-06-21',
        timeSlot: '08:00-10:00',
        phone: '13800138004',
        projectLeader: '学生用户',
        memberGrade: '2023级',
        memberClass: '软件工程1班',
        headCount: 2,
        remark: '自动化验证'
      }
    });
    await api(`/api/miniprogram/reservations/${reservationToCancel.id}/cancel`, {
      method: 'PUT',
      headers: student.headers,
      body: { cancelReason: '自动化取消' }
    });
    const canceledReservation = await api(`/api/miniprogram/reservations/${reservationToCancel.id}`, { headers: student.headers });
    results.reservationStatusCanceled = canceledReservation.status;

    const equipmentList = await api('/api/miniprogram/equipment?status=all', { headers: student.headers });
    const equipment = equipmentList.find((item) => item.status === 'idle') || equipmentList[0];
    if (!equipment) {
      throw new Error('no_equipment_found');
    }
    results.equipmentCount = equipmentList.length;

    const equipmentRequest = await api('/api/miniprogram/equipment/requests', {
      method: 'POST',
      headers: student.headers,
      body: {
        equipmentId: equipment.id,
        borrowDate: '2026-06-20',
        borrowTime: '09:00',
        returnDate: '2026-06-20',
        returnTime: '11:00',
        purpose: '设备联调验证',
        notifySubscribe: true,
        notifyMiniProgram: true
      }
    });
    results.equipmentRequestCreated = equipmentRequest.status;

    const equipmentPendingList = await api('/api/miniprogram/approvals/equipment', { headers: admin.headers });
    const equipmentPending = equipmentPendingList.find((item) => Number(item.id) === Number(equipmentRequest.id));
    if (!equipmentPending) {
      throw new Error('equipment_not_pending_for_admin');
    }

    const equipmentApproved = await api(`/api/miniprogram/approvals/equipment/${equipmentRequest.id}`, {
      method: 'PUT',
      headers: admin.headers,
      body: { approved: true }
    });
    results.equipmentRequestApproved = equipmentApproved.status;

    const equipmentScanCode = equipment.no || equipment.code || equipment.assetCode || `${equipment.id}`;
    const borrowedRecord = await api(`/api/miniprogram/equipment/requests/${equipmentRequest.id}/borrow`, {
      method: 'PUT',
      headers: admin.headers,
      body: { scanResult: equipmentScanCode }
    });
    results.equipmentRequestBorrowed = borrowedRecord.status;

    const returnedRecord = await api(`/api/miniprogram/equipment/requests/${equipmentRequest.id}/return`, {
      method: 'PUT',
      headers: admin.headers,
      body: { scanResult: equipmentScanCode }
    });
    results.equipmentRequestReturned = returnedRecord.status;

    const consumables = await api('/api/miniprogram/consumables', { headers: student.headers });
    const consumable = consumables.find((item) => Number(item.stock) > 1) || consumables[0];
    if (!consumable) {
      throw new Error('no_consumable_found');
    }
    results.consumablesCount = consumables.length;

    const consumableRequest = await api('/api/miniprogram/consumables/requests', {
      method: 'POST',
      headers: student.headers,
      body: {
        consumableId: consumable.id,
        quantity: 1,
        purpose: '耗材联调验证'
      }
    });
    results.consumableRequestCreated = consumableRequest.status;

    const consumablePendingList = await api('/api/miniprogram/approvals/consumable', { headers: admin.headers });
    const consumablePending = consumablePendingList.find((item) => Number(item.id) === Number(consumableRequest.id));
    if (!consumablePending) {
      throw new Error('consumable_not_pending_for_admin');
    }

    const consumableApproved = await api(`/api/miniprogram/approvals/consumable/${consumableRequest.id}`, {
      method: 'PUT',
      headers: admin.headers,
      body: { approved: true }
    });
    results.consumableRequestApproved = consumableApproved.status;

    const teachers = await api('/api/miniprogram/teachers', { headers: admin.headers });
    const chosenTeacher = teachers[0];
    if (!chosenTeacher) {
      throw new Error('no_teacher_found');
    }
    results.teachersCount = teachers.length;

    const freeCourseSlot = await findFreeSlot(lab.id, admin.headers);
    const course = await api('/api/miniprogram/courses', {
      method: 'POST',
      headers: admin.headers,
      body: {
        name: `自动化课程${uniqueSuffix}`,
        date: freeCourseSlot.date,
        timeSlot: freeCourseSlot.timeSlot,
        labId: lab.id,
        className: '软件工程2023-1班',
        teacherId: chosenTeacher.id,
        teacherName: chosenTeacher.name
      }
    });
    results.courseCreatedId = course.id;
    results.courseTimeSlot = `${freeCourseSlot.date} ${freeCourseSlot.timeSlot}`;

    const studentCourses = await api('/api/miniprogram/courses', { headers: student.headers });
    const createdCourse = studentCourses.find((item) => Number(item.id) === Number(course.id));
    if (!createdCourse) {
      throw new Error('course_not_visible_to_student');
    }

    await api(`/api/miniprogram/courses/${course.id}/check-in`, {
      method: 'POST',
      headers: student.headers,
      body: {}
    });
    await api(`/api/miniprogram/courses/${course.id}/check-out`, {
      method: 'POST',
      headers: student.headers,
      body: {}
    });
    results.courseSignFlow = 'ok';

    const existingReport = await api(`/api/miniprogram/reports/course/${course.id}`, { headers: student.headers });
    results.reportBeforeSubmit = existingReport ? 'exists' : 'empty';

    const submittedReport = await api('/api/miniprogram/reports', {
      method: 'POST',
      headers: student.headers,
      body: {
        courseId: course.id,
        courseName: course.name,
        content: `课程${course.id}报告联调验证`
      }
    });
    results.reportSubmittedId = submittedReport.id;

    const attendance = await api(`/api/miniprogram/courses/${course.id}/attendance`, { headers: teacher.headers });
    const attendanceStudent = attendance.students.find((item) => Number(item.id) === Number(student.user.id));
    if (!attendanceStudent) {
      throw new Error('attendance_student_missing');
    }
    results.attendanceStudents = attendance.students.length;

    await api(`/api/miniprogram/courses/${course.id}/attendance/${student.user.id}`, {
      method: 'PUT',
      headers: teacher.headers,
      body: { action: 'reset' }
    });
    await api(`/api/miniprogram/courses/${course.id}/attendance/${student.user.id}`, {
      method: 'PUT',
      headers: teacher.headers,
      body: { action: 'signIn' }
    });
    await api(`/api/miniprogram/courses/${course.id}/attendance/${student.user.id}`, {
      method: 'PUT',
      headers: teacher.headers,
      body: { action: 'signOut' }
    });
    results.attendanceManage = 'ok';

    const gradebookBefore = await api(`/api/miniprogram/courses/${course.id}/gradebook`, { headers: teacher.headers });
    const gradeStudent = gradebookBefore.students.find((item) => Number(item.id) === Number(student.user.id));
    if (!gradeStudent) {
      throw new Error('gradebook_student_missing');
    }
    results.gradebookStudents = gradebookBefore.students.length;

    await api(`/api/miniprogram/courses/${course.id}/scores`, {
      method: 'PUT',
      headers: teacher.headers,
      body: {
        items: [{
          studentId: student.user.id,
          studentName: student.user.name,
          score: 95,
          comment: '联调通过'
        }]
      }
    });

    const gradebookAfter = await api(`/api/miniprogram/courses/${course.id}/gradebook`, { headers: teacher.headers });
    const savedGrade = gradebookAfter.students.find((item) => Number(item.id) === Number(student.user.id));
    results.savedScore = savedGrade && savedGrade.score;

    const messages = await api('/api/miniprogram/messages', { headers: student.headers });
    results.studentMessages = messages.length;
    if (messages[0]) {
      await api(`/api/miniprogram/messages/${messages[0].id}/read`, {
        method: 'PUT',
        headers: student.headers,
        body: {}
      });
      results.messageRead = true;
    }

    console.log(JSON.stringify(results, null, 2));
  } finally {
    await wait(500);
    if (!server.killed) {
      server.kill('SIGTERM');
    }
    await wait(500);
    if (!server.killed) {
      server.kill('SIGKILL');
    }
    fs.closeSync(out);
    fs.closeSync(err);
  }
}

main().catch((error) => {
  console.error(String((error && error.stack) || error));
  process.exitCode = 1;
});
