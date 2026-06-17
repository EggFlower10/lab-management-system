const { TIME_SLOTS, RESERVATION_STATUS, EQUIPMENT_STATUS, EQUIPMENT_REQUEST_STATUS, CONSUMABLE_STATUS, APPROVAL_TABS_BY_ROLE, ROLE_LABEL_MAP } = require('./constants')
const { createStatusClass, formatDate, formatDateTime, formatTodayLabel, getWeekdayLabel, getWeekIndex, clone } = require('./format')
const { request } = require('./request')
const { STORAGE_KEYS, ensureMockData, readStore, writeStore, createId } = require('./mock')

function getAppConfig() {
  const app = getApp()
  return app && app.globalData ? app.globalData : { useBackend: false }
}

function getSession() {
  return wx.getStorageSync(STORAGE_KEYS.session) || null
}

function saveSession(session) {
  const app = getApp()
  if (app && app.setCurrentUser) {
    app.setCurrentUser(session)
    return
  }
  wx.setStorageSync(STORAGE_KEYS.session, session)
}

function clearSession() {
  const app = getApp()
  if (app && app.clearCurrentUser) {
    app.clearCurrentUser()
    return
  }
  wx.removeStorageSync(STORAGE_KEYS.session)
}

function shouldUseBackend() {
  return !!getAppConfig().useBackend
}

function assertUserRole(allowedRoles, message = '当前身份暂无权限执行此操作') {
  const user = getCurrentUser()
  if (!user || !allowedRoles.includes(user.role)) {
    throw new Error(message)
  }
  return user
}

function getApprovalScopesByRole(role) {
  return APPROVAL_TABS_BY_ROLE[role] || []
}

function getStudentUsers() {
  return readStore(STORAGE_KEYS.users, []).filter((item) => (
    item.role === 'student' &&
    (item.auditStatus || 'approved') === 'approved' &&
    !item.blacklisted
  ))
}

function getAvailableTeachers() {
  ensureMockData()
  return readStore(STORAGE_KEYS.users, []).filter((item) => (
    item.role === 'teacher' &&
    (item.auditStatus || 'approved') === 'approved' &&
    !item.blacklisted
  ))
}

function buildSessionFromUser(user) {
  return {
    id: user.id,
    username: user.username,
    name: user.name,
    role: user.role,
    studentNo: user.studentNo,
    department: user.department,
    phone: user.phone,
    avatarUrl: user.wechatAvatar || '',
    wechatBound: !!user.wechatOpenId
  }
}

function getWechatDeviceProfile() {
  ensureMockData()
  return wx.getStorageSync(STORAGE_KEYS.wechatDeviceProfile) || null
}

function saveWechatDeviceProfile(profile) {
  wx.setStorageSync(STORAGE_KEYS.wechatDeviceProfile, profile)
}

function getWechatLoginDraft() {
  ensureMockData()
  return wx.getStorageSync(STORAGE_KEYS.wechatLoginDraft) || null
}

function saveWechatLoginDraft(draft) {
  wx.setStorageSync(STORAGE_KEYS.wechatLoginDraft, draft)
}

function clearWechatLoginDraft() {
  wx.removeStorageSync(STORAGE_KEYS.wechatLoginDraft)
}

function validatePhone(phone) {
  return /^1\d{10}$/.test(`${phone || ''}`.trim())
}

function canManageCourse(user, course) {
  if (!user || !course) {
    return false
  }
  if (user.role === 'admin') {
    return true
  }
  return (
    `${course.teacherId || ''}` === `${user.id}` ||
    course.teacherName === user.name
  )
}

const USER_AUDIT_STATUS_MAP = {
  pending: { text: '待审核', className: 'status-pending' },
  approved: { text: '已通过', className: 'status-approved' },
  rejected: { text: '已驳回', className: 'status-rejected' }
}

const USER_PERMISSION_TEXT = {
  student: '实验室预约、课程查看、设备借用、耗材申请、签到签退与实验报告提交',
  teacher: '课程发布、预约审批、签到管理与实验成绩录入',
  admin: '用户管理、实验室管理、设备管理、耗材管理、数据统计与系统配置'
}

const LAB_COVER_MAP = {
  L101: '/assets/labs/l101.svg',
  L102: '/assets/labs/l102.svg',
  L103: '/assets/labs/l103.svg',
  L104: '/assets/labs/l104.svg'
}

function countAvailableAdmins(users, excludeUserId = '') {
  return users.filter((item) => (
    item.role === 'admin' &&
    (item.auditStatus || 'approved') === 'approved' &&
    !item.blacklisted &&
    `${item.id}` !== `${excludeUserId}`
  )).length
}

function buildUserRecord(item, users = [], currentUserId = '') {
  const auditStatus = item.auditStatus || 'approved'
  const statusConfig = USER_AUDIT_STATUS_MAP[auditStatus] || USER_AUDIT_STATUS_MAP.pending
  const blacklisted = !!item.blacklisted
  const isSelf = `${currentUserId}` === `${item.id}`
  const isProtectedAdmin = (
    item.role === 'admin' &&
    auditStatus === 'approved' &&
    !blacklisted &&
    countAvailableAdmins(users, item.id) === 0
  )

  return {
    ...item,
    auditStatus,
    blacklisted,
    roleLabel: ROLE_LABEL_MAP[item.role] || item.role || '未定义角色',
    auditStatusText: statusConfig.text,
    auditStatusClass: statusConfig.className,
    blacklistText: blacklisted ? '黑名单' : '正常',
    blacklistClass: blacklisted ? 'status-maintenance' : 'status-approved',
    permissionsText: USER_PERMISSION_TEXT[item.role] || '基础访问权限',
    auditRemark: item.auditRemark || '',
    reviewedAt: item.reviewedAt || '',
    reviewedByName: item.reviewedByName || '',
    roleUpdatedAt: item.roleUpdatedAt || '',
    roleUpdatedByName: item.roleUpdatedByName || '',
    blacklistReason: item.blacklistReason || '',
    blacklistAt: item.blacklistAt || '',
    blacklistByName: item.blacklistByName || '',
    isSelf,
    isProtectedAdmin,
    canReview: !isSelf && auditStatus !== 'approved',
    canAssignRole: !isSelf && auditStatus === 'approved',
    canToggleBlacklist: !isSelf && !isProtectedAdmin
  }
}

function syncSessionUser(user) {
  const currentUser = getCurrentUser()
  if (!currentUser || `${currentUser.id}` !== `${user.id}`) {
    return
  }
  if ((user.auditStatus || 'approved') !== 'approved' || user.blacklisted) {
    logout()
    return
  }
  saveSession(buildSessionFromUser(user))
}

function getLabCoverImage(lab = {}) {
  return lab.coverImage || LAB_COVER_MAP[lab.id] || '/assets/labs/default.svg'
}

function getTimeSlotWeight(timeSlot = '') {
  const [start = '00:00'] = `${timeSlot}`.split('-')
  return Number(start.replace(':', '')) || 0
}

function compareReservationSchedule(left, right) {
  if (left.date !== right.date) {
    return `${left.date}`.localeCompare(`${right.date}`)
  }
  return getTimeSlotWeight(left.timeSlot) - getTimeSlotWeight(right.timeSlot)
}

function buildLabReservationMeta(lab, reservations = []) {
  const today = formatDate(new Date())
  const now = formatDateTime(new Date()).slice(11, 16)
  const currentSlotWeight = Number(now.replace(':', '')) || 0
  const relatedReservations = reservations
    .filter((item) => (
      `${item.labId}` === `${lab.id}` &&
      !['cancelled', 'rejected'].includes(item.status)
    ))
    .sort(compareReservationSchedule)
  const todayReservations = relatedReservations.filter((item) => item.date === today)
  const pendingReservations = relatedReservations.filter((item) => item.status === 'pending')
  const approvedReservations = relatedReservations.filter((item) => item.status === 'approved')
  const nextReservation = relatedReservations.find((item) => (
    item.date > today ||
    (item.date === today && getTimeSlotWeight(item.timeSlot) >= currentSlotWeight)
  )) || relatedReservations[0] || null

  return {
    coverImage: getLabCoverImage(lab),
    todayReservationCount: todayReservations.length,
    pendingReservationCount: pendingReservations.length,
    approvedReservationCount: approvedReservations.length,
    activeCount: todayReservations.length,
    currentReservationText: todayReservations.length ? `今日已排 ${todayReservations.length} 场` : '今日暂无预约',
    reservationSummaryText: pendingReservations.length ? `待审核 ${pendingReservations.length} 条` : approvedReservations.length ? `已生效 ${approvedReservations.length} 条` : '暂无生效预约',
    nextReservationText: nextReservation ? `${nextReservation.date} ${nextReservation.timeSlot}` : '暂无预约安排'
  }
}

function buildReservationCheckInMeta(item) {
  const today = formatDate(new Date())
  const approved = ['approved', 'completed'].includes(item.status)
  const checkedIn = !!item.checkedInAt

  let checkInTip = '审批通过后生成签到码'
  if (checkedIn) {
    checkInTip = `已于 ${item.checkedInAt} 完成签到`
  } else if (approved && item.date === today) {
    checkInTip = '请在到场后出示二维码完成签到'
  } else if (approved) {
    checkInTip = `${item.date} 当天可使用签到码核验入场`
  }

  return {
    checkedIn,
    checkInStatusText: checkedIn ? '已签到' : approved ? '待签到' : '待审批',
    checkInStatusClass: checkedIn ? 'status-approved' : approved ? 'status-pending' : createStatusClass(item.status),
    checkInTip,
    checkInAvailable: approved,
    canCheckIn: approved && item.date === today && !checkedIn,
    checkInExpiresText: approved ? `${item.date} 当天有效` : '审批通过后生效'
  }
}

function buildLabCard(lab, reservations = []) {
  return {
    ...lab,
    ...buildLabReservationMeta(lab, reservations),
    statusText: {
      available: '空闲可约',
      occupied: '当前使用中',
      maintenance: '维护中'
    }[lab.status] || '待确认',
    statusClass: createStatusClass(lab.status)
  }
}

function buildReservationCard(item) {
  return {
    ...item,
    ...buildReservationCheckInMeta(item),
    statusText: RESERVATION_STATUS[item.status] || '处理中',
    statusClass: createStatusClass(item.status)
  }
}

function buildEquipmentCard(item) {
  return {
    ...item,
    statusText: EQUIPMENT_STATUS[item.status] || '待处理',
    statusClass: createStatusClass(item.status)
  }
}

function buildEquipmentRequest(item, equipmentMap = new Map()) {
  const equipment = equipmentMap.get(item.equipmentId) || {}
  const scanCode = item.scanCode || equipment.no || `EQ-${item.equipmentId}`
  const borrowTime = normalizeTime(item.borrowTime, '09:00')
  const returnTime = normalizeTime(item.returnTime, '18:00')
  return {
    ...item,
    equipmentNo: item.equipmentNo || equipment.no || '',
    model: item.model || equipment.model || '',
    category: item.category || equipment.category || '',
    location: item.location || equipment.location || '',
    borrowTime,
    returnTime,
    scanCode,
    statusText: EQUIPMENT_REQUEST_STATUS[item.status] || '处理中',
    statusClass: createStatusClass(item.status),
    canBorrowByScan: item.status === 'approved',
    canReturnByScan: ['borrowed', 'overdue'].includes(item.status),
    borrowWindow: `${formatScheduleLabel(item.borrowDate, borrowTime, '09:00')} 至 ${formatScheduleLabel(item.returnDate, returnTime, '18:00')}`
  }
}

function buildConsumableRequest(item) {
  return {
    ...item,
    statusText: CONSUMABLE_STATUS[item.status] || '待处理',
    statusClass: createStatusClass(item.status)
  }
}

function notifyConsumableLowStock(consumable) {
  if (!consumable || Number(consumable.stock) > Number(consumable.warningValue)) {
    return
  }

  const content = `${consumable.name} 当前库存 ${consumable.stock}${consumable.unit}，已低于预警值 ${consumable.warningValue}${consumable.unit}，请及时补货。`
  const messages = readStore(STORAGE_KEYS.messages, [])
  const duplicated = messages.find((item) => (
    item.category === 'alert' &&
    item.recipientRole === 'admin' &&
    item.title === '耗材库存预警' &&
    item.content === content
  ))

  if (duplicated) {
    return
  }
  pushMessage({
    category: 'alert',
    title: '耗材库存预警',
    content,
    recipientRole: 'admin'
  })
}

function pushMessage(message) {
  const messages = readStore(STORAGE_KEYS.messages, [])
  messages.unshift({
    id: createId('M'),
    read: false,
    createdAt: formatDateTime(new Date()),
    ...message
  })
  writeStore(STORAGE_KEYS.messages, messages)
}

function pushRoleMessages(roles, message) {
  roles.forEach((role) => {
    pushMessage({
      ...message,
      recipientRole: role
    })
  })
}

function compareDateOnly(left, right) {
  return formatDate(left).localeCompare(formatDate(right))
}

function normalizeTime(value, fallback = '00:00') {
  if (!value || typeof value !== 'string') {
    return fallback
  }
  return /^\d{2}:\d{2}$/.test(value) ? value : fallback
}

function buildScheduleDateTime(dateValue, timeValue, fallbackTime = '00:00') {
  if (!dateValue) {
    return null
  }
  const normalizedDate = formatDate(dateValue)
  const normalizedTime = normalizeTime(timeValue, fallbackTime)
  return new Date(`${normalizedDate}T${normalizedTime}:00`)
}

function formatScheduleLabel(dateValue, timeValue, fallbackTime = '00:00') {
  if (!dateValue) {
    return ''
  }
  return `${formatDate(dateValue)} ${normalizeTime(timeValue, fallbackTime)}`
}

function notifyEquipmentReminder(request, title, content) {
  if (request.notifyMiniProgram !== false) {
    pushMessage({
      category: 'alert',
      title,
      content,
      recipientId: request.applicantId
    })
  }
  if (request.notifySubscribe !== false) {
    pushMessage({
      category: 'system',
      title: `订阅提醒：${title}`,
      content,
      recipientId: request.applicantId
    })
  }
}

function syncEquipmentBorrowingState() {
  ensureMockData()
  const equipment = readStore(STORAGE_KEYS.equipment, [])
  const requests = readStore(STORAGE_KEYS.equipmentRequests, [])
  const now = new Date()

  let requestsChanged = false
  const nextRequests = requests.map((item) => {
    const nextItem = { ...item }
    const returnAt = buildScheduleDateTime(nextItem.returnDate, nextItem.returnTime, '18:00')
    if (['approved', 'borrowed', 'overdue'].includes(nextItem.status) && returnAt && returnAt.getTime() < now.getTime()) {
      if (nextItem.status !== 'overdue') {
        nextItem.status = 'overdue'
        requestsChanged = true
      }
      if (!nextItem.overdueNotifiedAt) {
        nextItem.overdueNotifiedAt = formatDateTime(new Date())
        const overdueReturnLabel = formatScheduleLabel(nextItem.returnDate, nextItem.returnTime, '18:00')
        notifyEquipmentReminder(
          nextItem,
          '设备借用已超期',
          `${nextItem.equipmentName} 已超过归还时间 ${overdueReturnLabel}，请尽快扫码归还。`
        )
        requestsChanged = true
      }
    }
    return nextItem
  })

  const activeRequestMap = new Map()
  nextRequests.forEach((item) => {
    if (!activeRequestMap.has(item.equipmentId) && ['approved', 'borrowed', 'overdue'].includes(item.status)) {
      activeRequestMap.set(item.equipmentId, item)
    }
  })

  let equipmentChanged = false
  const nextEquipment = equipment.map((item) => {
    if (['maintenance', 'scrapped'].includes(item.status)) {
      return item
    }
    const active = activeRequestMap.get(item.id)
    let nextStatus = item.status
    if (active) {
      nextStatus = active.status === 'approved' ? 'reserved' : active.status === 'overdue' ? 'overdue' : 'borrowed'
    } else if (['reserved', 'borrowed', 'overdue'].includes(item.status)) {
      nextStatus = 'idle'
    }
    if (nextStatus !== item.status) {
      equipmentChanged = true
      return {
        ...item,
        status: nextStatus
      }
    }
    return item
  })

  if (requestsChanged) {
    writeStore(STORAGE_KEYS.equipmentRequests, nextRequests)
  }
  if (equipmentChanged) {
    writeStore(STORAGE_KEYS.equipment, nextEquipment)
  }

  return {
    equipment: equipmentChanged ? nextEquipment : equipment,
    requests: requestsChanged ? nextRequests : requests
  }
}

function updateEquipmentStatus(equipmentId, status) {
  const equipment = readStore(STORAGE_KEYS.equipment, [])
  const index = equipment.findIndex((item) => `${item.id}` === `${equipmentId}`)
  if (index > -1) {
    equipment[index].status = status
    writeStore(STORAGE_KEYS.equipment, equipment)
  }
}

function matchesEquipmentScan(scanResult, request) {
  const normalized = `${scanResult || ''}`.trim()
  if (!normalized) {
    return false
  }
  const values = [
    request.scanCode,
    request.equipmentNo,
    request.equipmentId,
    `EQ-${request.equipmentId}`,
    `NO-${request.equipmentNo}`
  ].filter(Boolean).map((item) => `${item}`.trim())
  return values.includes(normalized)
}

async function tryBackendRooms() {
  const rooms = await request({ url: '/api/v1/rooms' })
  return rooms.map((room) => buildLabCard({
    id: room.RoomID || room.id,
    name: room.RoomName || room.room_name,
    building: room.BuildingName || room.building_name || '实验楼',
    roomNumber: room.RoomNumber || room.room_number || '',
    capacity: room.SeatCount || room.seat_count || 0,
    status: room.IsAvailable === 1 ? 'available' : 'occupied',
    openTime: '请以管理员设置为准',
    description: room.Description || '实验室信息由后台同步',
    equipment: ['待同步'],
    guide: '详情将按后台房间信息展示。',
    activeCount: 0
  }))
}

async function tryBackendCourses() {
  const courses = await request({ url: '/api/v1/courses' })
  return courses.map((course, index) => ({
    id: course.CourseID || `${index + 1}`,
    name: course.CourseName || course.course_name,
    teacherName: '待分配教师',
    date: formatTodayLabel(),
    timeSlot: TIME_SLOTS[index % TIME_SLOTS.length],
    labId: '',
    labName: '待安排实验室',
    status: index === 0 ? 'ongoing' : 'upcoming',
    className: '待排班级',
    scoreStatus: '待开始'
  }))
}

async function login(payload) {
  ensureMockData()

  if (shouldUseBackend() && payload.role === 'admin') {
    try {
      const auth = await request({
        url: '/api/v1/auth/login',
        method: 'POST',
        data: {
          username: payload.username,
          password: payload.password
        }
      })
      const session = {
        id: auth.user.id,
        username: auth.user.username,
        name: auth.user.name,
        role: 'admin',
        department: '实验中心',
        token: auth.token
      }
      saveSession(session)
      wx.setStorageSync('lms.session.token', auth.token)
      return session
    } catch (error) {
      console.warn('后台登录失败，已切换本地 mock 登录。', error)
    }
  }

  const users = readStore(STORAGE_KEYS.users, [])
  const matched = users.find((item) => item.username === payload.username && item.password === payload.password && item.role === payload.role)
  if (!matched) {
    throw new Error('账号、密码或身份不匹配')
  }
  if ((matched.auditStatus || 'approved') === 'pending') {
    throw new Error('账号待管理员审核，请稍后再试')
  }
  if ((matched.auditStatus || 'approved') === 'rejected') {
    throw new Error('账号审核未通过，请联系管理员')
  }
  if (matched.blacklisted) {
    throw new Error(`账号已被加入黑名单${matched.blacklistReason ? `：${matched.blacklistReason}` : ''}`)
  }

  const session = buildSessionFromUser(matched)
  saveSession(session)
  return session
}

async function loginByWechat(payload = {}) {
  ensureMockData()
  const role = payload.role || 'student'
  const now = formatDateTime(new Date())
  const currentProfile = getWechatDeviceProfile()
  const nextProfile = currentProfile || {
    openId: `WX-${createId('OPEN')}`,
    unionId: `WU-${createId('UNION')}`,
    nickName: payload.nickName || '微信用户',
    avatarUrl: payload.avatarUrl || '',
    createdAt: now
  }

  nextProfile.nickName = payload.nickName || nextProfile.nickName || '微信用户'
  nextProfile.avatarUrl = payload.avatarUrl || nextProfile.avatarUrl || ''
  nextProfile.lastCode = payload.code || nextProfile.lastCode || ''
  nextProfile.updatedAt = now
  saveWechatDeviceProfile(nextProfile)

  const users = readStore(STORAGE_KEYS.users, [])
  const boundUser = users.find((item) => item.wechatOpenId === nextProfile.openId)

  if (boundUser) {
    if (boundUser.role !== role) {
      throw new Error(`该微信已绑定${ROLE_LABEL_MAP[boundUser.role]}身份，请切换身份后再登录`)
    }
    if ((boundUser.auditStatus || 'approved') === 'pending') {
      throw new Error('身份认证待管理员审核，请稍后再试')
    }
    if ((boundUser.auditStatus || 'approved') === 'rejected') {
      throw new Error('身份认证未通过，请重新提交认证信息')
    }
    if (boundUser.blacklisted) {
      throw new Error(`账号已被加入黑名单${boundUser.blacklistReason ? `：${boundUser.blacklistReason}` : ''}`)
    }

    const index = users.findIndex((item) => `${item.id}` === `${boundUser.id}`)
    if (index > -1) {
      users[index] = {
        ...users[index],
        authChannel: 'wechat',
        wechatNickName: nextProfile.nickName,
        wechatAvatar: nextProfile.avatarUrl,
        lastWechatLoginAt: now
      }
      writeStore(STORAGE_KEYS.users, users)
    }

    clearWechatLoginDraft()
    const session = buildSessionFromUser(index > -1 ? users[index] : boundUser)
    saveSession(session)
    return {
      status: 'logged_in',
      session
    }
  }

  const draft = {
    role,
    openId: nextProfile.openId,
    nickName: nextProfile.nickName,
    avatarUrl: nextProfile.avatarUrl,
    createdAt: now
  }
  saveWechatLoginDraft(draft)
  return {
    status: 'needs_binding',
    draft
  }
}

async function submitIdentityAuth(payload) {
  ensureMockData()
  const draft = getWechatLoginDraft()
  if (!draft || !draft.openId) {
    throw new Error('微信登录状态已失效，请重新发起微信登录')
  }

  const role = payload.role || draft.role || 'student'
  const name = `${payload.name || ''}`.trim()
  const department = `${payload.department || ''}`.trim()
  const identityNo = `${payload.identityNo || ''}`.trim()
  const phone = `${payload.phone || ''}`.trim()
  const now = formatDateTime(new Date())

  if (!ROLE_LABEL_MAP[role]) {
    throw new Error('请选择有效身份')
  }
  if (!name || !department || !identityNo) {
    throw new Error('请完整填写身份认证信息')
  }
  if (!validatePhone(phone)) {
    throw new Error('请输入有效的手机号')
  }

  const users = readStore(STORAGE_KEYS.users, [])
  const existingOpenIdUser = users.find((item) => item.wechatOpenId === draft.openId)
  const existingIdentityUser = users.find((item) => (
    `${item.studentNo || ''}` === identityNo &&
    item.role === role
  ))

  if (existingOpenIdUser && (!existingIdentityUser || `${existingIdentityUser.id}` !== `${existingOpenIdUser.id}`)) {
    throw new Error('该微信已绑定其他账号，请联系管理员处理')
  }

  let target = existingIdentityUser
  let targetIndex = target ? users.findIndex((item) => `${item.id}` === `${target.id}`) : -1

  if (target && target.name && target.name !== name) {
    throw new Error('姓名与当前学号/工号档案不匹配，请核对后重试')
  }
  if (target && target.blacklisted) {
    throw new Error(`账号已被加入黑名单${target.blacklistReason ? `：${target.blacklistReason}` : ''}`)
  }

  const nextAuditStatus = target
    ? ((target.auditStatus || 'approved') === 'approved' ? 'approved' : 'pending')
    : 'pending'

  const nextUser = {
    ...(target || {}),
    id: target ? target.id : createId('U'),
    username: target ? target.username : `${role}${identityNo}`.toLowerCase(),
    password: target ? target.password : '123456',
    role,
    name,
    studentNo: identityNo,
    department,
    phone,
    auditStatus: nextAuditStatus,
    auditRemark: nextAuditStatus === 'approved' ? (target?.auditRemark || '') : '待管理员审核身份信息',
    blacklisted: target ? !!target.blacklisted : false,
    wechatOpenId: draft.openId,
    wechatNickName: draft.nickName || '',
    wechatAvatar: draft.avatarUrl || '',
    authChannel: 'wechat',
    authType: role,
    phoneBoundAt: now,
    identityBoundAt: now,
    identitySubmittedAt: now,
    reviewedAt: nextAuditStatus === 'approved' ? (target?.reviewedAt || '') : '',
    reviewedById: nextAuditStatus === 'approved' ? (target?.reviewedById || '') : '',
    reviewedByName: nextAuditStatus === 'approved' ? (target?.reviewedByName || '') : ''
  }

  if (targetIndex > -1) {
    users.splice(targetIndex, 1, nextUser)
  } else {
    users.unshift(nextUser)
    targetIndex = 0
  }

  writeStore(STORAGE_KEYS.users, users)
  clearWechatLoginDraft()

  if (nextAuditStatus === 'approved' && !nextUser.blacklisted) {
    const session = buildSessionFromUser(nextUser)
    saveSession(session)
    pushMessage({
      category: 'system',
      title: '微信登录绑定成功',
      content: '当前微信已完成账号绑定，可直接进入系统。',
      recipientId: nextUser.id
    })
    return {
      status: 'approved',
      session
    }
  }

  pushRoleMessages(['admin'], {
    category: 'system',
    title: '新的身份认证申请',
    content: `${name} 提交了${ROLE_LABEL_MAP[role]}身份认证申请，请及时审核。`
  })
  pushMessage({
    category: 'system',
    title: '身份认证申请已提交',
    content: '已提交微信身份认证，请等待管理员审核后再登录。',
    recipientId: nextUser.id
  })
  return {
    status: 'pending',
    userId: nextUser.id
  }
}

function logout() {
  clearSession()
  wx.removeStorageSync('lms.session.token')
}

function getCurrentUser() {
  return getSession()
}

async function getHomeData() {
  ensureMockData()
  syncEquipmentBorrowingState()
  const user = getCurrentUser()
  const today = formatTodayLabel()
  const banners = readStore(STORAGE_KEYS.banners, [])
  const labs = await getLabs()
  const messages = await getMessages({ category: 'all' })
  const courses = await getCourses()
  const reservations = await getReservations({ status: 'all' })

  return {
    user,
    banners,
    todayCourses: courses.filter((item) => item.date === today).slice(0, 3),
    todayReservations: reservations.filter((item) => item.date === today).slice(0, 3),
    unreadCount: messages.filter((item) => !item.read).length,
    quickLabs: labs.slice(0, 3),
    reservationCount: reservations.filter((item) => item.status === 'approved').length
  }
}

async function getLabs(filters = {}) {
  ensureMockData()
  const useBackend = shouldUseBackend()
  let labs = []

  if (useBackend) {
    try {
      labs = await tryBackendRooms()
    } catch (error) {
      labs = readStore(STORAGE_KEYS.labs, [])
    }
  } else {
    labs = readStore(STORAGE_KEYS.labs, [])
  }

  const reservations = readStore(STORAGE_KEYS.reservations, [])
  const keyword = (filters.keyword || '').trim()
  const status = filters.status || 'all'
  return labs
    .map((item) => buildLabCard(item, reservations))
    .filter((item) => {
      const matchKeyword = !keyword || item.name.includes(keyword) || item.building.includes(keyword) || item.roomNumber.includes(keyword)
      const matchStatus = status === 'all' || item.status === status
      return matchKeyword && matchStatus
    })
}

async function getLabDetail(id) {
  const labs = await getLabs()
  const reservations = readStore(STORAGE_KEYS.reservations, [])
  const lab = labs.find((item) => `${item.id}` === `${id}`)
  if (!lab) {
    throw new Error('未找到实验室信息')
  }
  const schedules = reservations
    .filter((item) => `${item.labId}` === `${lab.id}` && !['cancelled', 'rejected'].includes(item.status))
    .sort(compareReservationSchedule)
    .slice(0, 4)
    .map(buildReservationCard)
  return {
    ...lab,
    schedules
  }
}

async function getReservations(options = {}) {
  ensureMockData()
  const currentUser = getCurrentUser()
  let reservations = readStore(STORAGE_KEYS.reservations, [])

  if (shouldUseBackend()) {
    try {
      const remote = await request({ url: '/api/v1/reservation' })
      reservations = remote.map((item) => ({
        id: item.id,
        code: item.reservation_code,
        labId: item.room_id,
        labName: item.room_name,
        roomNumber: item.room_number,
        date: item.use_date,
        timeSlot: item.time_slot,
        headCount: item.member_count,
        purpose: item.remarks || item.project_category,
        projectName: item.project_name,
        applicantId: item.applicant_id,
        applicantName: item.applicant_name,
        phone: item.applicant_phone,
        status: item.approval_status === 'approved' ? 'approved' : item.approval_status,
        remark: item.approval_comment || '',
        checkInCode: item.approval_status === 'approved' ? `LAB-${item.id}` : '',
        checkedInAt: item.checked_in_at || '',
        createdAt: item.created_at
      }))
    } catch (error) {
      console.warn('获取后台预约失败，已切换本地数据。', error)
    }
  }

  const allowAll = options.scope === 'all' && currentUser && ['admin', 'teacher'].includes(currentUser.role)
  if (currentUser && !allowAll && currentUser.role !== 'admin') {
    reservations = reservations.filter((item) => item.applicantId === currentUser.id)
  }
  if (options.status && options.status !== 'all') {
    reservations = reservations.filter((item) => item.status === options.status)
  }
  if (options.limit) {
    reservations = reservations.slice(0, options.limit)
  }
  return reservations.map(buildReservationCard)
}

async function createReservation(payload) {
  ensureMockData()
  const user = getCurrentUser()
  const reservations = readStore(STORAGE_KEYS.reservations, [])
  const labs = readStore(STORAGE_KEYS.labs, [])
  const targetLab = labs.find((item) => item.id === payload.labId)

  if (!targetLab) {
    throw new Error('实验室不存在')
  }

  if (payload.headCount > targetLab.capacity) {
    throw new Error('预约人数超过实验室容量')
  }

  const duplicate = reservations.find((item) => (
    `${item.applicantId}` === `${user.id}` &&
    item.date === payload.date &&
    item.timeSlot === payload.timeSlot &&
    ['pending', 'approved'].includes(item.status)
  ))
  if (duplicate) {
    throw new Error(duplicate.labId === payload.labId ? '你已提交过该时段预约，请勿重复申请' : `你在 ${duplicate.labName} 已有同一时段预约，请勿重复预约`)
  }

  const conflict = reservations.find((item) => item.labId === payload.labId && item.date === payload.date && item.timeSlot === payload.timeSlot && ['pending', 'approved'].includes(item.status))
  if (conflict) {
    throw new Error('所选时间段已被预约，请更换时段')
  }

  if (shouldUseBackend()) {
    try {
      const created = await request({
        url: '/api/v1/reservation',
        method: 'POST',
        data: {
          semesterId: 1,
          buildingId: 1,
          buildingName: targetLab.building,
          roomId: targetLab.id,
          roomName: targetLab.name,
          roomNumber: targetLab.roomNumber,
          useDate: payload.date,
          weekNo: getWeekIndex(payload.date),
          weekDay: getWeekdayLabel(payload.date),
          timeSlot: payload.timeSlot,
          projectName: payload.projectName,
          projectCategory: payload.purpose,
          applicantId: user.id,
          applicantName: user.name,
          applicantPhone: user.phone,
          projectLeader: payload.projectLeader,
          projectLeaderPhone: payload.phone,
          memberGrade: payload.memberGrade,
          memberClass: payload.memberClass,
          memberCount: payload.headCount,
          expectedDuration: payload.timeSlot,
          remarks: payload.remark
        }
      })
      return buildReservationCard({
        id: created.id,
        code: created.reservation_code || createId('RV-'),
        labId: targetLab.id,
        labName: targetLab.name,
        roomNumber: targetLab.roomNumber,
        date: payload.date,
        timeSlot: payload.timeSlot,
        headCount: payload.headCount,
        purpose: payload.purpose,
        projectName: payload.projectName,
        applicantId: user.id,
        applicantName: user.name,
        phone: user.phone,
        status: 'pending',
        remark: payload.remark || '',
        checkedInAt: '',
        createdAt: formatDateTime(new Date())
      })
    } catch (error) {
      console.warn('提交后台预约失败，已切换本地保存。', error)
    }
  }

  const status = user.role === 'admin' ? 'approved' : 'pending'
  const record = {
    id: createId('R'),
    code: `RV-${Date.now()}`,
    labId: targetLab.id,
    labName: targetLab.name,
    roomNumber: targetLab.roomNumber,
    date: payload.date,
    timeSlot: payload.timeSlot,
    headCount: payload.headCount,
    purpose: payload.purpose,
    projectName: payload.projectName,
    applicantId: user.id,
    applicantName: user.name,
    phone: payload.phone || user.phone,
    projectLeader: payload.projectLeader,
    memberGrade: payload.memberGrade,
    memberClass: payload.memberClass,
    status,
    remark: payload.remark,
    checkInCode: status === 'approved' ? `LAB-CHECK-${Date.now()}` : '',
    checkedInAt: '',
    createdAt: formatDateTime(new Date())
  }
  reservations.unshift(record)
  writeStore(STORAGE_KEYS.reservations, reservations)

  pushRoleMessages(['teacher', 'admin'], {
    category: 'approval',
    title: '新的实验室预约申请',
    content: `${user.name} 提交了 ${targetLab.name} 的预约申请，请及时处理。`
  })
  pushMessage({
    category: 'system',
    title: status === 'approved' ? '预约已自动通过' : '预约提交成功',
    content: status === 'approved' ? '管理员身份提交的预约已直接生效。' : '申请已进入审批队列，请留意消息通知。',
    recipientId: user.id
  })

  return buildReservationCard(record)
}

async function cancelReservation(id) {
  const reservations = readStore(STORAGE_KEYS.reservations, [])
  const index = reservations.findIndex((item) => `${item.id}` === `${id}`)
  if (index < 0) {
    throw new Error('未找到预约记录')
  }
  reservations[index].status = 'cancelled'
  writeStore(STORAGE_KEYS.reservations, reservations)
  pushMessage({
    category: 'alert',
    title: '预约已取消',
    content: `${reservations[index].labName} ${reservations[index].date} ${reservations[index].timeSlot} 已取消。`,
    recipientId: reservations[index].applicantId
  })
  return buildReservationCard(reservations[index])
}

async function getReservationDetail(id) {
  ensureMockData()
  const user = getCurrentUser()
  const reservations = readStore(STORAGE_KEYS.reservations, [])
  const detail = reservations.find((item) => `${item.id}` === `${id}`)
  if (!detail) {
    throw new Error('预约详情不存在')
  }
  const canViewAll = user && ['teacher', 'admin'].includes(user.role)
  if (!canViewAll && user && `${detail.applicantId}` !== `${user.id}`) {
    throw new Error('你无权查看这条预约记录')
  }
  const labs = readStore(STORAGE_KEYS.labs, [])
  const lab = labs.find((item) => `${item.id}` === `${detail.labId}`) || {}
  return buildReservationCard({
    ...detail,
    labBuilding: lab.building || '',
    labRoomNumber: lab.roomNumber || detail.roomNumber || '',
    labOpenTime: lab.openTime || '',
    coverImage: getLabCoverImage(lab)
  })
}

async function checkInReservation(id) {
  ensureMockData()
  const user = getCurrentUser()
  const reservations = readStore(STORAGE_KEYS.reservations, [])
  const index = reservations.findIndex((item) => `${item.id}` === `${id}`)
  if (index < 0) {
    throw new Error('未找到预约记录')
  }

  const current = reservations[index]
  const canManage = user && ['teacher', 'admin'].includes(user.role)
  if (!canManage && `${current.applicantId}` !== `${user.id}`) {
    throw new Error('你无权操作这条预约记录')
  }
  if (!['approved', 'completed'].includes(current.status)) {
    throw new Error('预约通过后才能签到')
  }
  if (current.date !== formatDate(new Date())) {
    throw new Error('仅可在预约当天完成签到')
  }
  if (current.checkedInAt) {
    throw new Error('当前预约已完成签到，无需重复提交')
  }
  if (!current.checkInCode) {
    throw new Error('当前预约尚未生成签到码')
  }

  reservations[index] = {
    ...current,
    checkedInAt: formatDateTime(new Date()),
    checkedInById: user.id,
    checkedInByName: user.name
  }
  writeStore(STORAGE_KEYS.reservations, reservations)
  pushMessage({
    category: 'course',
    title: '实验室签到成功',
    content: `${current.labName} ${current.date} ${current.timeSlot} 已完成签到。`,
    recipientId: current.applicantId
  })
  return getReservationDetail(id)
}

async function getEquipment(filters = {}) {
  ensureMockData()
  const synced = syncEquipmentBorrowingState()
  const equipment = synced.equipment
  const keyword = (filters.keyword || '').trim()
  const category = filters.category || 'all'
  const status = filters.status || 'all'
  return equipment
    .map(buildEquipmentCard)
    .filter((item) => {
      const matchKeyword = !keyword || item.name.includes(keyword) || item.no.includes(keyword) || item.model.includes(keyword) || item.category.includes(keyword)
      const matchCategory = category === 'all' || item.category === category
      const matchStatus = status === 'all' || item.status === status
      return matchKeyword && matchCategory && matchStatus
    })
}

async function createEquipmentRequest(payload) {
  const user = assertUserRole(['student', 'teacher', 'admin'], '请先登录后再申请借用设备')
  const { equipment } = syncEquipmentBorrowingState()
  const requests = readStore(STORAGE_KEYS.equipmentRequests, [])
  const target = equipment.find((item) => item.id === payload.equipmentId)
  if (!target) {
    throw new Error('设备不存在')
  }
  if (target.status === 'scrapped') {
    throw new Error('报废设备不可借用')
  }
  if (target.status !== 'idle') {
    throw new Error('当前设备不可借用')
  }
  if (!payload.borrowDate || !payload.borrowTime || !payload.returnDate || !payload.returnTime || !payload.purpose) {
    throw new Error('请填写完整借用申请信息')
  }
  const borrowAt = buildScheduleDateTime(payload.borrowDate, payload.borrowTime, '09:00')
  const returnAt = buildScheduleDateTime(payload.returnDate, payload.returnTime, '18:00')
  if (!borrowAt || !returnAt) {
    throw new Error('借用时间格式不正确')
  }
  if (returnAt.getTime() < borrowAt.getTime()) {
    throw new Error('归还时间不能早于借用时间')
  }
  const now = new Date()
  now.setSeconds(0, 0)
  if (borrowAt.getTime() < now.getTime()) {
    throw new Error('借用时间不能早于当前时间')
  }
  const activeRequest = requests.find((item) => `${item.equipmentId}` === `${target.id}` && ['pending', 'approved', 'borrowed', 'overdue'].includes(item.status))
  if (activeRequest) {
    throw new Error('该设备已有进行中的借用流程，请选择其他设备')
  }
  const record = {
    id: createId('ER'),
    equipmentId: target.id,
    equipmentName: target.name,
    equipmentNo: target.no,
    model: target.model,
    category: target.category,
    location: target.location,
    applicantId: user.id,
    applicantName: user.name,
    borrowDate: payload.borrowDate,
    borrowTime: normalizeTime(payload.borrowTime, '09:00'),
    returnDate: payload.returnDate,
    returnTime: normalizeTime(payload.returnTime, '18:00'),
    purpose: payload.purpose,
    scanCode: target.no || `EQ-${target.id}`,
    notifySubscribe: payload.notifySubscribe !== false,
    notifyMiniProgram: payload.notifyMiniProgram !== false,
    status: user.role === 'admin' ? 'approved' : 'pending',
    borrowedAt: '',
    returnedAt: '',
    createdAt: formatDateTime(new Date())
  }
  requests.unshift(record)
  writeStore(STORAGE_KEYS.equipmentRequests, requests)

  if (record.status === 'approved') {
    updateEquipmentStatus(target.id, 'reserved')
  }

  pushRoleMessages(['teacher', 'admin'], {
    category: 'approval',
    title: '新的设备借用申请',
    content: `${user.name} 申请借用 ${target.name}。`
  })
  pushMessage({
    category: 'system',
    title: record.status === 'approved' ? '设备申请已通过，请扫码借出' : '设备借用申请已提交',
    content: record.status === 'approved' ? `请在设备页使用“扫码借出”完成 ${target.name} 的领用。` : '请等待管理员审批设备借用申请。',
    recipientId: user.id
  })
  return buildEquipmentRequest(record, new Map(equipment.map((item) => [item.id, item])))
}

async function getEquipmentRequests(options = {}) {
  const currentUser = getCurrentUser()
  const synced = syncEquipmentBorrowingState()
  const equipmentMap = new Map(synced.equipment.map((item) => [item.id, item]))
  let list = synced.requests
  const allowAll = options.scope === 'all' && currentUser && ['admin', 'teacher'].includes(currentUser.role)
  if (currentUser && !allowAll && currentUser.role !== 'admin') {
    list = list.filter((item) => item.applicantId === currentUser.id)
  }
  if (options.status && options.status !== 'all') {
    list = list.filter((item) => item.status === options.status)
  }
  if (options.keyword) {
    const keyword = `${options.keyword}`.trim()
    list = list.filter((item) =>
      !keyword ||
      item.equipmentName.includes(keyword) ||
      (item.equipmentNo || '').includes(keyword) ||
      (item.category || '').includes(keyword)
    )
  }
  return list.map((item) => {
    const result = buildEquipmentRequest(item, equipmentMap)
    const borrowTime = normalizeTime(item.borrowTime, '09:00')
    const returnTime = normalizeTime(item.returnTime, '18:00')
    return {
      ...result,
      borrowTime,
      returnTime,
      borrowWindow: `${formatScheduleLabel(item.borrowDate, borrowTime, '09:00')} 至 ${formatScheduleLabel(item.returnDate, returnTime, '18:00')}`
    }
  })
}

async function borrowEquipmentByScan(requestId, scanResult) {
  const user = assertUserRole(['student', 'teacher', 'admin'], '请先登录后再扫码借出')
  const synced = syncEquipmentBorrowingState()
  const requests = synced.requests
  const index = requests.findIndex((item) => `${item.id}` === `${requestId}`)
  if (index < 0) {
    throw new Error('借用申请不存在')
  }
  const target = requests[index]
  if (user.role !== 'admin' && `${target.applicantId}` !== `${user.id}`) {
    throw new Error('只能扫码处理自己的借用申请')
  }
  if (target.status !== 'approved') {
    throw new Error('当前申请尚未通过审批或已完成借出')
  }
  if (!matchesEquipmentScan(scanResult, target)) {
    throw new Error('扫码结果与申请设备不匹配')
  }

  requests[index] = {
    ...target,
    status: 'borrowed',
    borrowedAt: formatDateTime(new Date())
  }
  writeStore(STORAGE_KEYS.equipmentRequests, requests)
  updateEquipmentStatus(target.equipmentId, 'borrowed')
  const dueAtLabel = formatScheduleLabel(target.returnDate, target.returnTime, '18:00')
  pushMessage({
    category: 'system',
    title: '设备已扫码借出',
    content: `${target.equipmentName} 已完成借出，请在 ${dueAtLabel} 前归还。`,
    recipientId: target.applicantId
  })
  return buildEquipmentRequest(requests[index], new Map(synced.equipment.map((item) => [item.id, item])))
}

async function returnEquipmentByScan(requestId, scanResult) {
  const user = assertUserRole(['student', 'teacher', 'admin'], '请先登录后再扫码归还')
  const synced = syncEquipmentBorrowingState()
  const requests = synced.requests
  const index = requests.findIndex((item) => `${item.id}` === `${requestId}`)
  if (index < 0) {
    throw new Error('借用申请不存在')
  }
  const target = requests[index]
  if (user.role !== 'admin' && `${target.applicantId}` !== `${user.id}`) {
    throw new Error('只能扫码处理自己的归还申请')
  }
  if (!['borrowed', 'overdue'].includes(target.status)) {
    throw new Error('当前申请尚未借出或已经归还')
  }
  if (!matchesEquipmentScan(scanResult, target)) {
    throw new Error('扫码结果与申请设备不匹配')
  }

  requests[index] = {
    ...target,
    status: 'returned',
    returnedAt: formatDateTime(new Date())
  }
  writeStore(STORAGE_KEYS.equipmentRequests, requests)
  updateEquipmentStatus(target.equipmentId, 'idle')
  pushMessage({
    category: 'system',
    title: '设备已归还',
    content: `${target.equipmentName} 已完成归还，感谢按时归还设备。`,
    recipientId: target.applicantId
  })
  return buildEquipmentRequest(requests[index], new Map(synced.equipment.map((item) => [item.id, item])))
}

async function getConsumables() {
  ensureMockData()
  return readStore(STORAGE_KEYS.consumables, [])
}

async function createConsumableRequest(payload) {
  ensureMockData()
  const list = readStore(STORAGE_KEYS.consumables, [])
  const requests = readStore(STORAGE_KEYS.consumableRequests, [])
  const user = assertUserRole(['student', 'teacher', 'admin'], '请先登录后再提交耗材申请')
  const quantity = Number(payload.quantity)
  const purpose = `${payload.purpose || ''}`.trim()
  const target = list.find((item) => item.id === payload.consumableId)
  if (!target) {
    throw new Error('耗材不存在')
  }
  if (!Number.isInteger(quantity) || quantity <= 0) {
    throw new Error('申请数量需为大于 0 的整数')
  }
  if (!purpose) {
    throw new Error('请填写使用用途')
  }
  if (quantity > Number(target.stock)) {
    throw new Error('申请数量超过当前库存')
  }
  const record = {
    id: createId('CR'),
    consumableId: target.id,
    consumableName: target.name,
    quantity,
    unit: target.unit,
    purpose,
    applicantId: user.id,
    applicantName: user.name,
    status: user.role === 'admin' ? 'approved' : 'pending',
    createdAt: formatDateTime(new Date())
  }
  requests.unshift(record)
  writeStore(STORAGE_KEYS.consumableRequests, requests)

  if (record.status === 'approved') {
    const index = list.findIndex((item) => item.id === target.id)
    list[index].stock = Math.max(0, list[index].stock - record.quantity)
    writeStore(STORAGE_KEYS.consumables, list)
    notifyConsumableLowStock(list[index])
  }

  pushMessage({
    category: 'approval',
    title: '新的耗材申请',
    content: `${user.name} 申请 ${target.name} ${record.quantity}${target.unit}。`,
    recipientRole: 'admin'
  })
  pushMessage({
    category: 'system',
    title: record.status === 'approved' ? '耗材申请已通过' : '耗材申请已提交',
    content: record.status === 'approved' ? '库存已自动扣减，请及时领取。' : '请留意审批结果通知。',
    recipientId: user.id
  })
  return buildConsumableRequest(record)
}

async function getConsumableRequests(options = {}) {
  const currentUser = getCurrentUser()
  let requests = readStore(STORAGE_KEYS.consumableRequests, [])
  const allowAll = options.scope === 'all' && currentUser && currentUser.role === 'admin'
  if (currentUser && !allowAll && currentUser.role !== 'admin') {
    requests = requests.filter((item) => item.applicantId === currentUser.id)
  }
  if (options.status && options.status !== 'all') {
    requests = requests.filter((item) => item.status === options.status)
  }
  return requests.map(buildConsumableRequest)
}

async function getCourses() {
  ensureMockData()
  const currentUser = getCurrentUser()
  let courses = readStore(STORAGE_KEYS.courses, [])

  if (shouldUseBackend()) {
    try {
      courses = await tryBackendCourses()
    } catch (error) {
      console.warn('获取后台课程失败，已切换本地数据。', error)
    }
  }

  if (currentUser && currentUser.role === 'teacher') {
    courses = courses.filter((item) => canManageCourse(currentUser, item))
  }
  return courses
}

function getCourseCheckins(courseId) {
  const checkins = readStore(STORAGE_KEYS.checkins, [])
  if (!courseId) {
    return checkins
  }
  return checkins.filter((item) => `${item.courseId}` === `${courseId}`)
}

function getReports() {
  return readStore(STORAGE_KEYS.reports, [])
}

function getCourseScores(courseId) {
  const scores = readStore(STORAGE_KEYS.courseScores, [])
  if (!courseId) {
    return scores
  }
  return scores.filter((item) => `${item.courseId}` === `${courseId}`)
}

function upsertCourseCheckin(courseId, userId, updater) {
  const checkins = readStore(STORAGE_KEYS.checkins, [])
  const index = checkins.findIndex((item) => `${item.courseId}` === `${courseId}` && `${item.userId}` === `${userId}`)
  const current = index > -1 ? checkins[index] : null
  const next = updater(current)

  if (index > -1) {
    checkins.splice(index, 1, next)
  } else {
    checkins.push(next)
  }

  writeStore(STORAGE_KEYS.checkins, checkins)
  return next
}

async function submitCourseCheckIn(courseId) {
  const user = assertUserRole(['student'], '仅学生可进行课程签到')
  const signInAt = formatDateTime(new Date())
  const record = upsertCourseCheckin(courseId, user.id, (current) => {
    if (current && current.signInAt) {
      throw new Error('当前课程已签到，无需重复提交')
    }
    return {
      id: current ? current.id : createId('CK'),
      courseId,
      userId: user.id,
      signInAt,
      signOutAt: current?.signOutAt || '',
      updatedAt: signInAt
    }
  })
  pushMessage({
    category: 'course',
    title: '课程签到成功',
    content: '已记录本次课程签到，可继续提交实验报告。',
    recipientId: user.id
  })
  return record
}

async function submitCourseCheckOut(courseId) {
  const user = assertUserRole(['student'], '仅学生可进行课程签退')
  const signOutAt = formatDateTime(new Date())
  const record = upsertCourseCheckin(courseId, user.id, (current) => {
    if (!current || !current.signInAt) {
      throw new Error('请先完成签到后再签退')
    }
    if (current.signOutAt) {
      throw new Error('当前课程已签退，无需重复提交')
    }
    return {
      ...current,
      signOutAt,
      updatedAt: signOutAt
    }
  })
  pushMessage({
    category: 'course',
    title: '课程签退成功',
    content: '本次课程签退已记录，实验过程数据已归档。',
    recipientId: user.id
  })
  return record
}

async function getReportByCourse(courseId) {
  const reports = getReports()
  const currentUser = getCurrentUser()
  return reports.find((item) => item.courseId === courseId && item.userId === currentUser.id) || null
}

async function submitReport(payload) {
  const reports = readStore(STORAGE_KEYS.reports, [])
  const user = getCurrentUser()
  const existingIndex = reports.findIndex((item) => item.courseId === payload.courseId && item.userId === user.id)
  const report = {
    id: existingIndex > -1 ? reports[existingIndex].id : createId('RP'),
    courseId: payload.courseId,
    courseName: payload.courseName,
    userId: user.id,
    userName: user.name,
    content: payload.content,
    updatedAt: formatDateTime(new Date())
  }
  if (existingIndex > -1) {
    reports.splice(existingIndex, 1, report)
  } else {
    reports.unshift(report)
  }
  writeStore(STORAGE_KEYS.reports, reports)
  pushMessage({
    category: 'course',
    title: '实验报告已提交',
    content: `${payload.courseName} 的实验报告已保存，教师可在后台查看。`,
    recipientId: user.id
  })
  return report
}

async function createCourse(payload) {
  const user = assertUserRole(['teacher', 'admin'], '仅教师或管理员可创建课程')
  const { name, date, timeSlot, labId, className } = payload

  if (!name || !date || !timeSlot || !className) {
    throw new Error('请完整填写课程信息')
  }

  const labs = readStore(STORAGE_KEYS.labs, [])
  const courses = readStore(STORAGE_KEYS.courses, [])
  let teacherName = user.name
  let teacherId = user.id

  if (user.role === 'admin') {
    const teachers = getAvailableTeachers()
    const selectedTeacher = teachers.find((item) => (
      (payload.teacherId && `${item.id}` === `${payload.teacherId}`) ||
      (payload.teacherName && item.name === payload.teacherName)
    ))

    if (!selectedTeacher) {
      throw new Error('请为课程选择有效的授课教师')
    }

    teacherName = selectedTeacher.name
    teacherId = selectedTeacher.id
  }

  const selectedLab = labs.find((item) => `${item.id}` === `${labId}`)
  const conflict = courses.find((item) => item.date === date && item.timeSlot === timeSlot && `${item.labId}` === `${labId}`)
  if (conflict) {
    throw new Error('该实验室在同一日期时段已存在课程安排')
  }
  const record = {
    id: createId('C'),
    name: name.trim(),
    teacherName,
    teacherId,
    date,
    timeSlot,
    labId: selectedLab ? selectedLab.id : labId || '',
    labName: selectedLab ? selectedLab.name : payload.labName || '待安排实验室',
    status: 'upcoming',
    className: className.trim(),
    scoreStatus: '待录入',
    publishedAt: formatDateTime(new Date()),
    publishedByName: user.name
  }

  courses.unshift(record)
  writeStore(STORAGE_KEYS.courses, courses)
  pushRoleMessages(['teacher', 'admin'], {
    category: 'course',
    title: '新课程已发布',
    content: `${record.teacherName} 负责《${record.name}》，时间为 ${record.date} ${record.timeSlot}。`
  })
  return record
}

async function getCourseAttendance(courseId) {
  const user = assertUserRole(['teacher', 'admin'], '仅教师或管理员可管理课程签到')
  const courses = readStore(STORAGE_KEYS.courses, [])
  const course = courses.find((item) => `${item.id}` === `${courseId}`)
  if (!course) {
    throw new Error('课程不存在')
  }
  if (!canManageCourse(user, course)) {
    throw new Error('只能管理本人发布或负责的课程')
  }

  const students = getStudentUsers()
  const reports = getReports().filter((item) => `${item.courseId}` === `${courseId}`)
  const checkins = getCourseCheckins(courseId)
  const studentList = students.map((student) => {
    const checkin = checkins.find((item) => `${item.userId}` === `${student.id}`)
    const report = reports.find((item) => `${item.userId}` === `${student.id}`)
    return {
      id: student.id,
      name: student.name,
      studentNo: student.studentNo,
      department: student.department,
      signInAt: checkin?.signInAt || '',
      signOutAt: checkin?.signOutAt || '',
      attendanceStatus: checkin?.signOutAt ? '已签退' : checkin?.signInAt ? '已签到' : '未签到',
      reportSubmitted: !!report
    }
  })
  const signedInCount = studentList.filter((item) => item.signInAt).length
  const signedOutCount = studentList.filter((item) => item.signOutAt).length
  const reportCount = studentList.filter((item) => item.reportSubmitted).length

  return {
    course,
    summary: [
      { label: '应到学生', value: studentList.length, intro: '纳入本课程的统计人数' },
      { label: '已签到', value: signedInCount, intro: '已完成签到登记' },
      { label: '已签退', value: signedOutCount, intro: '已完成签退归档' },
      { label: '报告提交', value: reportCount, intro: '实验报告提交情况' }
    ],
    students: studentList
  }
}

async function manageCourseAttendance(courseId, studentId, action) {
  const user = assertUserRole(['teacher', 'admin'], '仅教师或管理员可管理课程签到')
  const courses = readStore(STORAGE_KEYS.courses, [])
  const course = courses.find((item) => `${item.id}` === `${courseId}`)
  if (!course) {
    throw new Error('课程不存在')
  }
  if (!canManageCourse(user, course)) {
    throw new Error('只能管理本人负责的课程')
  }

  const student = getStudentUsers().find((item) => `${item.id}` === `${studentId}`)
  if (!student) {
    throw new Error('学生信息不存在')
  }

  const timestamp = formatDateTime(new Date())
  if (action === 'reset') {
    const list = getCourseCheckins()
    const nextList = list.filter((item) => !(`${item.courseId}` === `${courseId}` && `${item.userId}` === `${studentId}`))
    writeStore(STORAGE_KEYS.checkins, nextList)
    return { action, studentId }
  }

  return upsertCourseCheckin(courseId, studentId, (current) => {
    if (action === 'signIn') {
      return {
        id: current ? current.id : createId('CK'),
        courseId,
        userId: studentId,
        signInAt: current?.signInAt || timestamp,
        signOutAt: current?.signOutAt || '',
        updatedAt: timestamp
      }
    }

    if (action === 'signOut') {
      if (!current || !current.signInAt) {
        throw new Error('学生尚未签到，无法签退')
      }
      return {
        ...current,
        signOutAt: timestamp,
        updatedAt: timestamp
      }
    }

    throw new Error('未知的签到操作')
  })
}

async function getCourseGradebook(courseId) {
  const user = assertUserRole(['teacher', 'admin'], '仅教师或管理员可录入实验成绩')
  const courses = readStore(STORAGE_KEYS.courses, [])
  const course = courses.find((item) => `${item.id}` === `${courseId}`)
  if (!course) {
    throw new Error('课程不存在')
  }
  if (!canManageCourse(user, course)) {
    throw new Error('只能录入本人负责课程的成绩')
  }

  const students = getStudentUsers()
  const reports = getReports().filter((item) => `${item.courseId}` === `${courseId}`)
  const checkins = getCourseCheckins(courseId)
  const scores = getCourseScores(courseId)
  const studentList = students.map((student) => {
    const score = scores.find((item) => `${item.studentId}` === `${student.id}`)
    const checkin = checkins.find((item) => `${item.userId}` === `${student.id}`)
    const report = reports.find((item) => `${item.userId}` === `${student.id}`)
    return {
      id: student.id,
      name: student.name,
      studentNo: student.studentNo,
      attendanceStatus: checkin?.signOutAt ? '已签退' : checkin?.signInAt ? '已签到' : '未签到',
      reportSubmitted: !!report,
      score: score?.score ?? '',
      comment: score?.comment || '',
      updatedAt: score?.updatedAt || ''
    }
  })
  const scoredList = studentList.filter((item) => item.score !== '' && item.score !== null && item.score !== undefined)
  const averageScore = scoredList.length
    ? (scoredList.reduce((sum, item) => sum + Number(item.score || 0), 0) / scoredList.length).toFixed(1)
    : '--'

  return {
    course,
    summary: [
      { label: '学生人数', value: studentList.length, intro: '本课程成绩簿范围' },
      { label: '已录成绩', value: scoredList.length, intro: '已完成成绩录入' },
      { label: '待录成绩', value: studentList.length - scoredList.length, intro: '仍需补录或修改' },
      { label: '平均分', value: averageScore, intro: '已录入成绩平均值' }
    ],
    students: studentList
  }
}

async function saveCourseScores(courseId, items) {
  const user = assertUserRole(['teacher', 'admin'], '仅教师或管理员可录入实验成绩')
  const courses = readStore(STORAGE_KEYS.courses, [])
  const courseIndex = courses.findIndex((item) => `${item.id}` === `${courseId}`)
  if (courseIndex < 0) {
    throw new Error('课程不存在')
  }
  if (!canManageCourse(user, courses[courseIndex])) {
    throw new Error('只能录入本人负责课程的成绩')
  }

  const scoreStore = readStore(STORAGE_KEYS.courseScores, [])
  const now = formatDateTime(new Date())
  items.forEach((item) => {
    if (item.score !== '' && item.score !== null && item.score !== undefined) {
      const numericScore = Number(item.score)
      if (Number.isNaN(numericScore) || numericScore < 0 || numericScore > 100) {
        throw new Error(`学生 ${item.studentName} 的成绩需在 0-100 之间`)
      }
    }
    const record = {
      id: item.id || createId('SC'),
      courseId,
      studentId: item.studentId,
      studentName: item.studentName,
      score: item.score === '' ? '' : Number(item.score),
      comment: item.comment || '',
      updatedAt: now
    }
    const index = scoreStore.findIndex((score) => `${score.courseId}` === `${courseId}` && `${score.studentId}` === `${item.studentId}`)
    if (index > -1) {
      scoreStore.splice(index, 1, {
        ...scoreStore[index],
        ...record,
        id: scoreStore[index].id
      })
    } else {
      scoreStore.unshift(record)
    }

    if (record.score !== '') {
      pushMessage({
        category: 'course',
        title: '实验成绩已更新',
        content: `《${courses[courseIndex].name}》的实验成绩已录入，请及时查看。`,
        recipientId: item.studentId
      })
    }
  })
  writeStore(STORAGE_KEYS.courseScores, scoreStore)

  const courseScores = scoreStore.filter((item) => `${item.courseId}` === `${courseId}` && item.score !== '')
  courses[courseIndex].scoreStatus = courseScores.length ? '已录入' : '待录入'
  writeStore(STORAGE_KEYS.courses, courses)
  return {
    updatedCount: items.length,
    updatedAt: now
  }
}

async function getMessages(options = {}) {
  ensureMockData()
  syncEquipmentBorrowingState()
  const user = getCurrentUser()
  let messages = readStore(STORAGE_KEYS.messages, [])
  messages = messages.filter((item) => {
    const roleMatched = !item.recipientRole || item.recipientRole === 'all' || item.recipientRole === user.role
    const userMatched = !item.recipientId || item.recipientId === user.id
    return roleMatched && userMatched
  })
  if (options.category && options.category !== 'all') {
    messages = messages.filter((item) => item.category === options.category)
  }
  if (options.limit) {
    messages = messages.slice(0, options.limit)
  }
  return messages
}

function markMessageRead(id) {
  const messages = readStore(STORAGE_KEYS.messages, [])
  const index = messages.findIndex((item) => `${item.id}` === `${id}`)
  if (index > -1) {
    messages[index].read = true
    writeStore(STORAGE_KEYS.messages, messages)
  }
}

async function getApprovalData(type) {
  const user = assertUserRole(['teacher', 'admin'], '仅教师或管理员可进入审批中心')
  if (type === 'equipment' && user.role !== 'admin') {
    throw new Error('仅管理员可查看设备借用审批')
  }
  const allowedTabs = getApprovalScopesByRole(user.role)
  if (!allowedTabs.includes(type)) {
    throw new Error('当前身份暂无此审批权限')
  }
  if (type === 'equipment') {
    return getEquipmentRequests({ status: 'pending', scope: 'all' })
  }
  if (type === 'consumable') {
    return getConsumableRequests({ status: 'pending', scope: 'all' })
  }
  return getReservations({ status: 'pending', scope: 'all' })
}

async function handleApproval(type, id, approved) {
  const user = assertUserRole(['teacher', 'admin'], '仅教师或管理员可处理审批')
  if (type === 'equipment' && user.role !== 'admin') {
    throw new Error('仅管理员可处理设备借用审批')
  }
  const allowedTabs = getApprovalScopesByRole(user.role)
  if (!allowedTabs.includes(type)) {
    throw new Error('当前身份暂无此审批权限')
  }
  const status = approved ? 'approved' : 'rejected'
  if (type === 'reservation') {
    const reservations = readStore(STORAGE_KEYS.reservations, [])
    const index = reservations.findIndex((item) => `${item.id}` === `${id}`)
    if (index < 0) {
      throw new Error('预约记录不存在')
    }
    reservations[index].status = status
    reservations[index].checkInCode = approved ? `LAB-CHECK-${Date.now()}` : ''
    reservations[index].checkedInAt = approved ? reservations[index].checkedInAt || '' : ''
    writeStore(STORAGE_KEYS.reservations, reservations)
    pushMessage({
      category: 'approval',
      title: approved ? '实验室预约已通过' : '实验室预约未通过',
      content: `${reservations[index].labName} ${reservations[index].date} ${reservations[index].timeSlot} 的申请结果已更新。`,
      recipientId: reservations[index].applicantId
    })
    return buildReservationCard(reservations[index])
  }

  if (type === 'equipment') {
    const synced = syncEquipmentBorrowingState()
    const requests = synced.requests
    const index = requests.findIndex((item) => `${item.id}` === `${id}`)
    if (index < 0) {
      throw new Error('设备申请不存在')
    }
    requests[index].status = status
    writeStore(STORAGE_KEYS.equipmentRequests, requests)
    if (approved) {
      updateEquipmentStatus(requests[index].equipmentId, 'reserved')
      pushMessage({
        category: 'system',
        title: '设备申请已通过，请扫码借出',
        content: `${requests[index].equipmentName} 已通过审批，请在设备中心扫码借出。`,
        recipientId: requests[index].applicantId
      })
    } else {
      updateEquipmentStatus(requests[index].equipmentId, 'idle')
    }
    pushMessage({
      category: 'approval',
      title: approved ? '设备申请已通过' : '设备申请未通过',
      content: `${requests[index].equipmentName} 的借用申请结果已更新。`,
      recipientId: requests[index].applicantId
    })
    return buildEquipmentRequest(requests[index], new Map(synced.equipment.map((item) => [item.id, item])))
  }

  const requests = readStore(STORAGE_KEYS.consumableRequests, [])
  const consumables = readStore(STORAGE_KEYS.consumables, [])
  const index = requests.findIndex((item) => `${item.id}` === `${id}`)
  if (index < 0) {
    throw new Error('耗材申请不存在')
  }
  if (requests[index].status !== 'pending') {
    throw new Error('该耗材申请已处理，请刷新后重试')
  }
  let targetIndex = -1
  if (approved) {
    targetIndex = consumables.findIndex((item) => item.id === requests[index].consumableId)
    if (targetIndex < 0) {
      throw new Error('耗材不存在，无法完成审批')
    }
    if (Number(consumables[targetIndex].stock) < Number(requests[index].quantity)) {
      throw new Error('当前库存不足，无法通过该耗材申请')
    }
  }
  requests[index].status = status
  writeStore(STORAGE_KEYS.consumableRequests, requests)
  if (approved) {
    consumables[targetIndex].stock = Math.max(0, consumables[targetIndex].stock - requests[index].quantity)
    writeStore(STORAGE_KEYS.consumables, consumables)
    notifyConsumableLowStock(consumables[targetIndex])
  }
  pushMessage({
    category: 'approval',
    title: approved ? '耗材申请已通过' : '耗材申请未通过',
    content: `${requests[index].consumableName} 的领用申请结果已更新。`,
    recipientId: requests[index].applicantId
  })
  return buildConsumableRequest(requests[index])
}

async function getDashboardData() {
  assertUserRole(['admin'], '仅管理员可查看数据统计')
  const synced = syncEquipmentBorrowingState()
  const labs = await getLabs()
  const reservations = readStore(STORAGE_KEYS.reservations, [])
  const equipment = synced.equipment
  const consumables = readStore(STORAGE_KEYS.consumables, [])
  const pendingReservationCount = reservations.filter((item) => item.status === 'pending').length
  const approvedReservationCount = reservations.filter((item) => item.status === 'approved').length
  const borrowedEquipmentCount = equipment.filter((item) => item.status === 'borrowed').length
  const lowStockCount = consumables.filter((item) => item.stock <= item.warningValue).length

  const usageList = labs.map((lab) => {
    const usage = reservations.filter((item) => item.labId === lab.id && item.status === 'approved').length
    return {
      id: lab.id,
      name: lab.name,
      value: usage,
      statusText: lab.statusText
    }
  })

  return {
    cards: [
      { label: '待审预约', value: pendingReservationCount, intro: '预约审批中心' },
      { label: '已生效预约', value: approvedReservationCount, intro: '本期有效安排' },
      { label: '借用中设备', value: borrowedEquipmentCount, intro: '设备流转状态' },
      { label: '低库存耗材', value: lowStockCount, intro: '需要补货提醒' }
    ],
    usageList,
    lowStockList: consumables.filter((item) => item.stock <= item.warningValue)
  }
}

async function getUsers() {
  const currentUser = assertUserRole(['admin'], '仅管理员可查看用户信息')
  const users = readStore(STORAGE_KEYS.users, [])
  return users
    .map((item) => buildUserRecord(item, users, currentUser.id))
    .sort((left, right) => {
      const getWeight = (item) => {
        if (item.auditStatus === 'pending') {
          return 0
        }
        if (item.blacklisted) {
          return 1
        }
        if (item.auditStatus === 'rejected') {
          return 2
        }
        return 3
      }
      return getWeight(left) - getWeight(right)
    })
}

async function reviewUser(userId, approved) {
  const currentUser = assertUserRole(['admin'], '仅管理员可审核用户')
  const users = readStore(STORAGE_KEYS.users, [])
  const index = users.findIndex((item) => `${item.id}` === `${userId}`)
  if (index < 0) {
    throw new Error('用户不存在')
  }

  const target = users[index]
  if (`${target.id}` === `${currentUser.id}`) {
    throw new Error('不能审核当前登录账号')
  }

  const nextStatus = approved ? 'approved' : 'rejected'
  if (target.role === 'admin' && nextStatus !== 'approved' && countAvailableAdmins(users, target.id) === 0) {
    throw new Error('请至少保留一个可用管理员账号')
  }

  users[index] = {
    ...target,
    auditStatus: nextStatus,
    auditRemark: approved ? '管理员审核通过' : '管理员审核驳回',
    reviewedAt: formatDateTime(new Date()),
    reviewedById: currentUser.id,
    reviewedByName: currentUser.name,
    blacklisted: nextStatus === 'approved' ? !!target.blacklisted : false,
    blacklistReason: nextStatus === 'approved' ? (target.blacklistReason || '') : '',
    blacklistAt: nextStatus === 'approved' ? (target.blacklistAt || '') : '',
    blacklistByName: nextStatus === 'approved' ? (target.blacklistByName || '') : ''
  }

  writeStore(STORAGE_KEYS.users, users)
  syncSessionUser(users[index])
  pushMessage({
    category: 'system',
    title: approved ? '账号审核已通过' : '账号审核未通过',
    content: approved
      ? '你的账号已通过管理员审核，可以正常使用小程序功能。'
      : '你的账号审核未通过，如有疑问请联系管理员。',
    recipientId: users[index].id
  })
  return buildUserRecord(users[index], users, currentUser.id)
}

async function assignUserRole(userId, role) {
  const currentUser = assertUserRole(['admin'], '仅管理员可分配用户权限')
  if (!ROLE_LABEL_MAP[role]) {
    throw new Error('目标角色不合法')
  }

  const users = readStore(STORAGE_KEYS.users, [])
  const index = users.findIndex((item) => `${item.id}` === `${userId}`)
  if (index < 0) {
    throw new Error('用户不存在')
  }

  const target = users[index]
  if (`${target.id}` === `${currentUser.id}`) {
    throw new Error('不能修改当前登录账号的权限')
  }
  if ((target.auditStatus || 'approved') !== 'approved') {
    throw new Error('请先完成用户审核再分配权限')
  }
  if (target.role === role) {
    throw new Error('该用户当前已是此角色')
  }
  if (target.role === 'admin' && role !== 'admin' && countAvailableAdmins(users, target.id) === 0) {
    throw new Error('请至少保留一个可用管理员账号')
  }

  users[index] = {
    ...target,
    role,
    roleUpdatedAt: formatDateTime(new Date()),
    roleUpdatedById: currentUser.id,
    roleUpdatedByName: currentUser.name
  }

  writeStore(STORAGE_KEYS.users, users)
  syncSessionUser(users[index])
  pushMessage({
    category: 'system',
    title: '账号权限已更新',
    content: `你的角色已调整为${ROLE_LABEL_MAP[role]}，请重新确认可访问功能。`,
    recipientId: users[index].id
  })
  return buildUserRecord(users[index], users, currentUser.id)
}

async function toggleUserBlacklist(userId, blacklisted, reason = '') {
  const currentUser = assertUserRole(['admin'], '仅管理员可管理黑名单')
  const users = readStore(STORAGE_KEYS.users, [])
  const index = users.findIndex((item) => `${item.id}` === `${userId}`)
  if (index < 0) {
    throw new Error('用户不存在')
  }

  const target = users[index]
  if (`${target.id}` === `${currentUser.id}`) {
    throw new Error('不能操作当前登录账号的黑名单状态')
  }
  if (blacklisted && target.role === 'admin' && countAvailableAdmins(users, target.id) === 0) {
    throw new Error('请至少保留一个可用管理员账号')
  }

  users[index] = {
    ...target,
    blacklisted: !!blacklisted,
    blacklistReason: blacklisted ? (reason || '管理员设置') : '',
    blacklistAt: blacklisted ? formatDateTime(new Date()) : '',
    blacklistByName: blacklisted ? currentUser.name : ''
  }

  writeStore(STORAGE_KEYS.users, users)
  syncSessionUser(users[index])
  pushMessage({
    category: 'system',
    title: blacklisted ? '账号已加入黑名单' : '账号已解除黑名单',
    content: blacklisted
      ? `由于${reason || '管理要求'}，你的账号已被限制使用，请联系管理员。`
      : '你的账号黑名单限制已解除，可恢复正常使用。',
    recipientId: users[index].id
  })
  return buildUserRecord(users[index], users, currentUser.id)
}

async function saveLab(payload) {
  assertUserRole(['admin'], '仅管理员可管理实验室')
  if (!payload.name || !payload.building || !payload.roomNumber) {
    throw new Error('请完整填写实验室信息')
  }

  const labs = readStore(STORAGE_KEYS.labs, [])
  const index = labs.findIndex((item) => `${item.id}` === `${payload.id}`)
  const base = index > -1 ? labs[index] : null
  const record = {
    id: base?.id || createId('L'),
    name: payload.name.trim(),
    building: payload.building.trim(),
    roomNumber: payload.roomNumber.trim(),
    capacity: Number(payload.capacity) || 0,
    status: payload.status || base?.status || 'available',
    openTime: payload.openTime || base?.openTime || '周一至周日 08:00-21:00',
    description: payload.description || base?.description || '由管理员维护的实验室基础信息。',
    equipment: base?.equipment || [],
    guide: payload.guide || base?.guide || '使用前请完成安全检查与预约登记。',
    activeCount: base?.activeCount || 0
  }

  if (index > -1) {
    labs.splice(index, 1, record)
  } else {
    labs.unshift(record)
  }

  writeStore(STORAGE_KEYS.labs, labs)
  return buildLabCard(record)
}

async function saveEquipment(payload) {
  assertUserRole(['admin'], '仅管理员可管理设备')
  if (!payload.name || !payload.no || !payload.category || !payload.location) {
    throw new Error('请完整填写设备信息')
  }

  const synced = syncEquipmentBorrowingState()
  const equipment = synced.equipment
  const requests = synced.requests
  const index = equipment.findIndex((item) => `${item.id}` === `${payload.id}`)
  const base = index > -1 ? equipment[index] : null
  const nextStatus = payload.status || base?.status || 'idle'
  const activeRequest = requests.find((item) => (
    `${item.equipmentId}` === `${base?.id || payload.id}` &&
    ['pending', 'approved', 'borrowed', 'overdue'].includes(item.status)
  ))

  if (nextStatus === 'scrapped' && activeRequest) {
    throw new Error('该设备存在进行中的借用流程，暂不能报废')
  }

  const record = {
    id: base?.id || createId('E'),
    name: payload.name.trim(),
    no: payload.no.trim(),
    model: payload.model || base?.model || '待补充型号',
    category: payload.category.trim(),
    status: nextStatus,
    location: payload.location.trim()
  }

  if (index > -1) {
    equipment.splice(index, 1, record)
  } else {
    equipment.unshift(record)
  }

  writeStore(STORAGE_KEYS.equipment, equipment)
  return buildEquipmentCard(record)
}

async function saveConsumable(payload) {
  assertUserRole(['admin'], '仅管理员可管理耗材库存')
  if (!payload.name || !payload.category || !payload.unit) {
    throw new Error('请完整填写耗材信息')
  }

  const consumables = readStore(STORAGE_KEYS.consumables, [])
  const index = consumables.findIndex((item) => `${item.id}` === `${payload.id}`)
  const base = index > -1 ? consumables[index] : null
  const record = {
    id: base?.id || createId('CNS'),
    name: payload.name.trim(),
    stock: Number(payload.stock) || 0,
    unit: payload.unit.trim(),
    category: payload.category.trim(),
    warningValue: Number(payload.warningValue) || 0
  }

  if (index > -1) {
    consumables.splice(index, 1, record)
  } else {
    consumables.unshift(record)
  }

  writeStore(STORAGE_KEYS.consumables, consumables)
  notifyConsumableLowStock(record)
  return record
}

async function getMineData() {
  const user = getCurrentUser()
  const reservations = await getReservations({ status: 'all' })
  const equipmentRequests = await getEquipmentRequests({ status: 'all' })
  const consumableRequests = await getConsumableRequests({ status: 'all' })
  const courses = await getCourses()
  const users = readStore(STORAGE_KEYS.users, [])
  const labs = readStore(STORAGE_KEYS.labs, [])
  const equipment = readStore(STORAGE_KEYS.equipment, [])
  const consumables = readStore(STORAGE_KEYS.consumables, [])

  if (user.role === 'teacher') {
    const teacherCourseIds = courses.map((item) => `${item.id}`)
    return {
      user,
      stats: [
        { label: '负责课程', value: courses.length },
        { label: '待审预约', value: (await getReservations({ status: 'pending', scope: 'all' })).length },
        { label: '设备待审', value: (await getEquipmentRequests({ status: 'pending', scope: 'all' })).length },
        { label: '已交报告', value: getReports().filter((item) => teacherCourseIds.includes(`${item.courseId}`)).length }
      ]
    }
  }

  if (user.role === 'admin') {
    return {
      user,
      stats: [
        { label: '用户总数', value: users.length },
        { label: '实验室', value: labs.length },
        { label: '设备资产', value: equipment.length },
        { label: '耗材种类', value: consumables.length }
      ]
    }
  }

  return {
    user,
    stats: [
      { label: '我的预约', value: reservations.length },
      { label: '设备借用', value: equipmentRequests.length },
      { label: '耗材申请', value: consumableRequests.length },
      { label: '相关课程', value: courses.length }
    ]
  }
}

module.exports = {
  TIME_SLOTS,
  login,
  loginByWechat,
  logout,
  getCurrentUser,
  getWechatLoginDraft,
  clearWechatLoginDraft,
  submitIdentityAuth,
  getHomeData,
  getLabs,
  getLabDetail,
  getReservations,
  createReservation,
  cancelReservation,
  getReservationDetail,
  checkInReservation,
  getEquipment,
  createEquipmentRequest,
  getEquipmentRequests,
  borrowEquipmentByScan,
  returnEquipmentByScan,
  getConsumables,
  createConsumableRequest,
  getConsumableRequests,
  getCourses,
  getCourseCheckins,
  getCourseAttendance,
  manageCourseAttendance,
  getCourseGradebook,
  getReports,
  getReportByCourse,
  submitCourseCheckIn,
  submitCourseCheckOut,
  submitReport,
  createCourse,
  getAvailableTeachers,
  saveCourseScores,
  getMessages,
  markMessageRead,
  getApprovalData,
  handleApproval,
  getDashboardData,
  getUsers,
  reviewUser,
  assignUserRole,
  toggleUserBlacklist,
  saveLab,
  saveEquipment,
  saveConsumable,
  getMineData,
  getWeekdayLabel,
  getWeekIndex,
  formatDate,
  createStatusClass
}

const legacyService = {
  login,
  loginByWechat,
  submitIdentityAuth,
  getHomeData,
  getLabs,
  getLabDetail,
  getReservations,
  createReservation,
  cancelReservation,
  getReservationDetail,
  checkInReservation,
  getEquipment,
  createEquipmentRequest,
  getEquipmentRequests,
  borrowEquipmentByScan,
  returnEquipmentByScan,
  getConsumables,
  createConsumableRequest,
  getConsumableRequests,
  getCourses,
  getCourseCheckins,
  getCourseAttendance,
  manageCourseAttendance,
  getCourseGradebook,
  getReports,
  getReportByCourse,
  submitCourseCheckIn,
  submitCourseCheckOut,
  submitReport,
  createCourse,
  getAvailableTeachers,
  saveCourseScores,
  getMessages,
  markMessageRead,
  getApprovalData,
  handleApproval,
  getDashboardData,
  getUsers,
  reviewUser,
  assignUserRole,
  toggleUserBlacklist,
  saveLab,
  saveEquipment,
  saveConsumable,
  getMineData
}

function getMiniAppInstance() {
  try {
    return getApp()
  } catch (error) {
    return null
  }
}

async function runLegacyMock(fn, args = []) {
  const app = getMiniAppInstance()
  const hasGlobalData = !!(app && app.globalData)
  const previousUseBackend = hasGlobalData ? app.globalData.useBackend : undefined

  if (hasGlobalData) {
    app.globalData.useBackend = false
  }

  try {
    return await Promise.resolve(fn(...args))
  } finally {
    if (hasGlobalData) {
      app.globalData.useBackend = previousUseBackend
    }
  }
}

function isBackendTransportError(error) {
  const message = String(error && error.message ? error.message : error || '')
  return /request:fail|timeout|network|econnrefused|failed to fetch|enotfound/i.test(message)
}

async function withMiniBackend(executor, fallback) {
  if (!shouldUseBackend()) {
    return fallback()
  }

  try {
    return await executor()
  } catch (error) {
    if (fallback && isBackendTransportError(error)) {
      return fallback()
    }
    throw error
  }
}

function buildMiniRequest(url, data = {}, method = 'GET') {
  return request({
    url,
    method,
    data
  })
}

function saveBackendSession(payload = {}) {
  const session = buildSessionFromUser(payload.user || payload)
  saveSession(session)
  if (payload.token) {
    wx.setStorageSync('lms.session.token', payload.token)
  }
  return session
}

function refreshSessionUser(user) {
  if (!user) {
    return null
  }
  const currentUser = getCurrentUser()
  if (currentUser && `${currentUser.id}` === `${user.id}`) {
    saveSession(buildSessionFromUser(user))
  }
  return user
}

function getLabStatusText(status) {
  return {
    available: '空闲可约',
    occupied: '当前使用中',
    maintenance: '维护中'
  }[status] || '待确认'
}

function decorateLabFromBackend(lab = {}, schedules = []) {
  const normalizedSchedules = Array.isArray(schedules)
    ? schedules.map((item) => buildReservationCard(item))
    : []
  const todayReservationCount = Number(lab.todayReservationCount || lab.activeCount || 0)
  const pendingReservationCount = Number(lab.pendingReservationCount || 0)
  const approvedReservationCount = Number(lab.approvedReservationCount || 0)
  const nextReservation = normalizedSchedules[0] || null

  return {
    ...lab,
    schedules: normalizedSchedules,
    coverImage: getLabCoverImage(lab),
    activeCount: Number(lab.activeCount || todayReservationCount || 0),
    todayReservationCount,
    pendingReservationCount,
    approvedReservationCount,
    statusText: getLabStatusText(lab.status),
    statusClass: createStatusClass(lab.status),
    currentReservationText: todayReservationCount ? `今日已排 ${todayReservationCount} 场` : '今日暂无预约',
    reservationSummaryText: pendingReservationCount
      ? `待审核 ${pendingReservationCount} 场`
      : (approvedReservationCount ? `已生效 ${approvedReservationCount} 场` : '暂无生效预约'),
    nextReservationText: nextReservation ? `${nextReservation.date} ${nextReservation.timeSlot}` : '暂无预约安排'
  }
}

function decorateEquipmentRequestFromBackend(item) {
  return item ? buildEquipmentRequest(item, new Map()) : null
}

function decorateDashboardData(payload = {}) {
  return {
    ...payload,
    usageList: Array.isArray(payload.usageList)
      ? payload.usageList.map((item) => ({
        ...item,
        statusText: getLabStatusText(item.status)
      }))
      : []
  }
}

login = async function (payload) {
  return withMiniBackend(
    async () => {
      const auth = await buildMiniRequest('/api/miniprogram/auth/login', payload, 'POST')
      return saveBackendSession(auth)
    },
    () => runLegacyMock(legacyService.login, [payload])
  )
}

loginByWechat = async function (payload = {}) {
  return withMiniBackend(
    async () => {
      const result = await buildMiniRequest('/api/miniprogram/auth/wechat-login', payload, 'POST')
      if (result.status === 'logged_in') {
        clearWechatLoginDraft()
        return {
          status: 'logged_in',
          session: saveBackendSession(result)
        }
      }

      const draft = {
        ...(result.draft || {}),
        role: (result.draft && result.draft.role) || payload.role || 'student'
      }
      saveWechatLoginDraft(draft)
      wx.removeStorageSync('lms.session.token')
      return {
        status: 'needs_binding',
        draft
      }
    },
    () => runLegacyMock(legacyService.loginByWechat, [payload])
  )
}

submitIdentityAuth = async function (payload) {
  return withMiniBackend(
    async () => {
      const draft = getWechatLoginDraft()
      if (!draft || !draft.openId) {
        throw new Error('微信登录状态已失效，请重新发起微信登录')
      }

      const result = await buildMiniRequest('/api/miniprogram/auth/bind', {
        ...payload,
        role: payload.role || draft.role || 'student',
        openId: draft.openId,
        nickName: draft.nickName || '',
        avatarUrl: draft.avatarUrl || ''
      }, 'POST')

      clearWechatLoginDraft()

      if (result.status === 'approved') {
        return {
          status: 'approved',
          session: saveBackendSession(result)
        }
      }

      return result
    },
    () => runLegacyMock(legacyService.submitIdentityAuth, [payload])
  )
}

getHomeData = async function () {
  return withMiniBackend(
    async () => {
      const data = await buildMiniRequest('/api/miniprogram/home')
      refreshSessionUser(data.user)
      return {
        ...data,
        quickLabs: Array.isArray(data.quickLabs) ? data.quickLabs.map((item) => decorateLabFromBackend(item)) : [],
        todayReservations: Array.isArray(data.todayReservations) ? data.todayReservations.map((item) => buildReservationCard(item)) : []
      }
    },
    () => runLegacyMock(legacyService.getHomeData, [])
  )
}

getLabs = async function (filters = {}) {
  return withMiniBackend(
    async () => {
      const list = await buildMiniRequest('/api/miniprogram/labs')
      const detailed = await Promise.all((list || []).map(async (lab) => {
        try {
          const detail = await buildMiniRequest(`/api/miniprogram/labs/${lab.id}`)
          return decorateLabFromBackend(detail, detail.schedules || [])
        } catch (error) {
          return decorateLabFromBackend(lab)
        }
      }))

      const keyword = `${filters.keyword || ''}`.trim()
      const status = filters.status || 'all'
      return detailed.filter((item) => {
        const matchKeyword = !keyword || item.name.includes(keyword) || item.building.includes(keyword) || item.roomNumber.includes(keyword)
        const matchStatus = status === 'all' || item.status === status
        return matchKeyword && matchStatus
      })
    },
    () => runLegacyMock(legacyService.getLabs, [filters])
  )
}

getLabDetail = async function (id) {
  return withMiniBackend(
    async () => {
      const detail = await buildMiniRequest(`/api/miniprogram/labs/${id}`)
      return decorateLabFromBackend(detail, detail.schedules || [])
    },
    () => runLegacyMock(legacyService.getLabDetail, [id])
  )
}

getReservations = async function (options = {}) {
  return withMiniBackend(
    async () => {
      const list = await buildMiniRequest('/api/miniprogram/reservations', {
        status: options.status || 'all',
        scope: options.scope || ''
      })
      const result = Array.isArray(list) ? list.map((item) => buildReservationCard(item)) : []
      return options.limit ? result.slice(0, options.limit) : result
    },
    () => runLegacyMock(legacyService.getReservations, [options])
  )
}

createReservation = async function (payload) {
  return withMiniBackend(
    async () => buildReservationCard(await buildMiniRequest('/api/miniprogram/reservations', payload, 'POST')),
    () => runLegacyMock(legacyService.createReservation, [payload])
  )
}

cancelReservation = async function (id) {
  return withMiniBackend(
    async () => {
      await buildMiniRequest(`/api/miniprogram/reservations/${id}/cancel`, { cancelReason: '用户取消' }, 'PUT')
      return null
    },
    () => runLegacyMock(legacyService.cancelReservation, [id])
  )
}

getReservationDetail = async function (id) {
  return withMiniBackend(
    async () => buildReservationCard(await buildMiniRequest(`/api/miniprogram/reservations/${id}`)),
    () => runLegacyMock(legacyService.getReservationDetail, [id])
  )
}

checkInReservation = async function (id) {
  return withMiniBackend(
    async () => buildReservationCard(await buildMiniRequest(`/api/miniprogram/reservations/${id}/check-in`, {}, 'PUT')),
    () => runLegacyMock(legacyService.checkInReservation, [id])
  )
}

getEquipment = async function (filters = {}) {
  return withMiniBackend(
    async () => {
      const list = await buildMiniRequest('/api/miniprogram/equipment', {
        keyword: filters.keyword || '',
        category: filters.category || 'all',
        status: filters.status || 'all'
      })
      return Array.isArray(list) ? list.map((item) => buildEquipmentCard(item)) : []
    },
    () => runLegacyMock(legacyService.getEquipment, [filters])
  )
}

createEquipmentRequest = async function (payload) {
  return withMiniBackend(
    async () => decorateEquipmentRequestFromBackend(await buildMiniRequest('/api/miniprogram/equipment/requests', payload, 'POST')),
    () => runLegacyMock(legacyService.createEquipmentRequest, [payload])
  )
}

getEquipmentRequests = async function (options = {}) {
  return withMiniBackend(
    async () => {
      const list = await buildMiniRequest('/api/miniprogram/equipment/requests', {
        status: options.status || 'all',
        scope: options.scope || ''
      })
      let result = Array.isArray(list) ? list.map((item) => decorateEquipmentRequestFromBackend(item)) : []
      if (options.keyword) {
        const keyword = `${options.keyword}`.trim()
        result = result.filter((item) => (
          !keyword ||
          item.equipmentName.includes(keyword) ||
          (item.equipmentNo || '').includes(keyword) ||
          (item.category || '').includes(keyword)
        ))
      }
      return result
    },
    () => runLegacyMock(legacyService.getEquipmentRequests, [options])
  )
}

borrowEquipmentByScan = async function (requestId, scanResult) {
  return withMiniBackend(
    async () => decorateEquipmentRequestFromBackend(await buildMiniRequest(`/api/miniprogram/equipment/requests/${requestId}/borrow`, { scanResult }, 'PUT')),
    () => runLegacyMock(legacyService.borrowEquipmentByScan, [requestId, scanResult])
  )
}

returnEquipmentByScan = async function (requestId, scanResult) {
  return withMiniBackend(
    async () => decorateEquipmentRequestFromBackend(await buildMiniRequest(`/api/miniprogram/equipment/requests/${requestId}/return`, { scanResult }, 'PUT')),
    () => runLegacyMock(legacyService.returnEquipmentByScan, [requestId, scanResult])
  )
}

getConsumables = async function () {
  return withMiniBackend(
    async () => {
      const list = await buildMiniRequest('/api/miniprogram/consumables')
      return Array.isArray(list) ? list : []
    },
    () => runLegacyMock(legacyService.getConsumables, [])
  )
}

createConsumableRequest = async function (payload) {
  return withMiniBackend(
    async () => buildConsumableRequest(await buildMiniRequest('/api/miniprogram/consumables/requests', payload, 'POST')),
    () => runLegacyMock(legacyService.createConsumableRequest, [payload])
  )
}

getConsumableRequests = async function (options = {}) {
  return withMiniBackend(
    async () => {
      const list = await buildMiniRequest('/api/miniprogram/consumables/requests', {
        status: options.status || 'all',
        scope: options.scope || ''
      })
      return Array.isArray(list) ? list.map((item) => buildConsumableRequest(item)) : []
    },
    () => runLegacyMock(legacyService.getConsumableRequests, [options])
  )
}

getCourses = async function () {
  return withMiniBackend(
    async () => {
      const list = await buildMiniRequest('/api/miniprogram/courses')
      return Array.isArray(list) ? list : []
    },
    () => runLegacyMock(legacyService.getCourses, [])
  )
}

getCourseCheckins = async function (courseId = '') {
  return withMiniBackend(
    async () => {
      const list = await buildMiniRequest('/api/miniprogram/courses/checkins', courseId ? { courseId } : {})
      return Array.isArray(list) ? list : []
    },
    () => runLegacyMock(legacyService.getCourseCheckins, [courseId])
  )
}

submitCourseCheckIn = async function (courseId) {
  return withMiniBackend(
    async () => buildMiniRequest(`/api/miniprogram/courses/${courseId}/check-in`, {}, 'POST'),
    () => runLegacyMock(legacyService.submitCourseCheckIn, [courseId])
  )
}

submitCourseCheckOut = async function (courseId) {
  return withMiniBackend(
    async () => buildMiniRequest(`/api/miniprogram/courses/${courseId}/check-out`, {}, 'POST'),
    () => runLegacyMock(legacyService.submitCourseCheckOut, [courseId])
  )
}

getReports = async function (options = {}) {
  return withMiniBackend(
    async () => {
      const courseId = typeof options === 'object' && options ? options.courseId : ''
      const list = await buildMiniRequest('/api/miniprogram/reports', courseId ? { courseId } : {})
      return Array.isArray(list) ? list : []
    },
    () => runLegacyMock(legacyService.getReports, [options])
  )
}

getReportByCourse = async function (courseId) {
  return withMiniBackend(
    async () => buildMiniRequest(`/api/miniprogram/reports/course/${courseId}`),
    () => runLegacyMock(legacyService.getReportByCourse, [courseId])
  )
}

submitReport = async function (payload) {
  return withMiniBackend(
    async () => buildMiniRequest('/api/miniprogram/reports', payload, 'POST'),
    () => runLegacyMock(legacyService.submitReport, [payload])
  )
}

createCourse = async function (payload) {
  return withMiniBackend(
    async () => buildMiniRequest('/api/miniprogram/courses', payload, 'POST'),
    () => runLegacyMock(legacyService.createCourse, [payload])
  )
}

getAvailableTeachers = async function () {
  return withMiniBackend(
    async () => {
      const list = await buildMiniRequest('/api/miniprogram/teachers')
      return Array.isArray(list) ? list : []
    },
    () => runLegacyMock(legacyService.getAvailableTeachers, [])
  )
}

getCourseAttendance = async function (courseId) {
  return withMiniBackend(
    async () => buildMiniRequest(`/api/miniprogram/courses/${courseId}/attendance`),
    () => runLegacyMock(legacyService.getCourseAttendance, [courseId])
  )
}

manageCourseAttendance = async function (courseId, studentId, action) {
  return withMiniBackend(
    async () => buildMiniRequest(`/api/miniprogram/courses/${courseId}/attendance/${studentId}`, { action }, 'PUT'),
    () => runLegacyMock(legacyService.manageCourseAttendance, [courseId, studentId, action])
  )
}

getCourseGradebook = async function (courseId) {
  return withMiniBackend(
    async () => buildMiniRequest(`/api/miniprogram/courses/${courseId}/gradebook`),
    () => runLegacyMock(legacyService.getCourseGradebook, [courseId])
  )
}

saveCourseScores = async function (courseId, items) {
  return withMiniBackend(
    async () => buildMiniRequest(`/api/miniprogram/courses/${courseId}/scores`, { items }, 'PUT'),
    () => runLegacyMock(legacyService.saveCourseScores, [courseId, items])
  )
}

getMessages = async function (options = {}) {
  return withMiniBackend(
    async () => {
      const list = await buildMiniRequest('/api/miniprogram/messages', {
        category: options.category || 'all'
      })
      const result = Array.isArray(list) ? list : []
      return options.limit ? result.slice(0, options.limit) : result
    },
    () => runLegacyMock(legacyService.getMessages, [options])
  )
}

markMessageRead = function (id) {
  if (!shouldUseBackend()) {
    return legacyService.markMessageRead(id)
  }

  buildMiniRequest(`/api/miniprogram/messages/${id}/read`, {}, 'PUT').catch((error) => {
    if (isBackendTransportError(error)) {
      try {
        legacyService.markMessageRead(id)
      } catch (fallbackError) {
      }
    }
  })
}

getApprovalData = async function (type) {
  return withMiniBackend(
    async () => {
      const list = await buildMiniRequest(`/api/miniprogram/approvals/${type}`)
      if (!Array.isArray(list)) {
        return []
      }
      if (type === 'reservation') {
        return list.map((item) => buildReservationCard(item))
      }
      if (type === 'equipment') {
        return list.map((item) => decorateEquipmentRequestFromBackend(item))
      }
      return list.map((item) => buildConsumableRequest(item))
    },
    () => runLegacyMock(legacyService.getApprovalData, [type])
  )
}

handleApproval = async function (type, id, approved) {
  return withMiniBackend(
    async () => {
      const result = await buildMiniRequest(`/api/miniprogram/approvals/${type}/${id}`, { approved }, 'PUT')
      if (!result) {
        return result
      }
      if (type === 'reservation') {
        return buildReservationCard(result)
      }
      if (type === 'equipment') {
        return decorateEquipmentRequestFromBackend(result)
      }
      return buildConsumableRequest(result)
    },
    () => runLegacyMock(legacyService.handleApproval, [type, id, approved])
  )
}

getDashboardData = async function () {
  return withMiniBackend(
    async () => decorateDashboardData(await buildMiniRequest('/api/miniprogram/admin/dashboard')),
    () => runLegacyMock(legacyService.getDashboardData, [])
  )
}

getUsers = async function () {
  return withMiniBackend(
    async () => {
      const list = await buildMiniRequest('/api/miniprogram/admin/users')
      return Array.isArray(list) ? list : []
    },
    () => runLegacyMock(legacyService.getUsers, [])
  )
}

reviewUser = async function (userId, approved) {
  return withMiniBackend(
    async () => buildMiniRequest(`/api/miniprogram/admin/users/${userId}/review`, { approved }, 'PUT'),
    () => runLegacyMock(legacyService.reviewUser, [userId, approved])
  )
}

assignUserRole = async function (userId, role) {
  return withMiniBackend(
    async () => buildMiniRequest(`/api/miniprogram/admin/users/${userId}/role`, { role }, 'PUT'),
    () => runLegacyMock(legacyService.assignUserRole, [userId, role])
  )
}

toggleUserBlacklist = async function (userId, blacklisted, reason = '') {
  return withMiniBackend(
    async () => buildMiniRequest(`/api/miniprogram/admin/users/${userId}/blacklist`, { blacklisted, reason }, 'PUT'),
    () => runLegacyMock(legacyService.toggleUserBlacklist, [userId, blacklisted, reason])
  )
}

saveLab = async function (payload) {
  return withMiniBackend(
    async () => buildMiniRequest('/api/miniprogram/admin/labs', payload, 'POST'),
    () => runLegacyMock(legacyService.saveLab, [payload])
  )
}

saveEquipment = async function (payload) {
  return withMiniBackend(
    async () => buildMiniRequest('/api/miniprogram/admin/equipment', payload, 'POST'),
    () => runLegacyMock(legacyService.saveEquipment, [payload])
  )
}

saveConsumable = async function (payload) {
  return withMiniBackend(
    async () => buildMiniRequest('/api/miniprogram/admin/consumables', payload, 'POST'),
    () => runLegacyMock(legacyService.saveConsumable, [payload])
  )
}

getMineData = async function () {
  return withMiniBackend(
    async () => {
      const data = await buildMiniRequest('/api/miniprogram/mine')
      refreshSessionUser(data.user)
      return data
    },
    () => runLegacyMock(legacyService.getMineData, [])
  )
}

Object.assign(module.exports, {
  login,
  loginByWechat,
  submitIdentityAuth,
  getHomeData,
  getLabs,
  getLabDetail,
  getReservations,
  createReservation,
  cancelReservation,
  getReservationDetail,
  checkInReservation,
  getEquipment,
  createEquipmentRequest,
  getEquipmentRequests,
  borrowEquipmentByScan,
  returnEquipmentByScan,
  getConsumables,
  createConsumableRequest,
  getConsumableRequests,
  getCourses,
  getCourseCheckins,
  getCourseAttendance,
  manageCourseAttendance,
  getCourseGradebook,
  getReports,
  getReportByCourse,
  submitCourseCheckIn,
  submitCourseCheckOut,
  submitReport,
  createCourse,
  getAvailableTeachers,
  saveCourseScores,
  getMessages,
  markMessageRead,
  getApprovalData,
  handleApproval,
  getDashboardData,
  getUsers,
  reviewUser,
  assignUserRole,
  toggleUserBlacklist,
  saveLab,
  saveEquipment,
  saveConsumable,
  getMineData
})
