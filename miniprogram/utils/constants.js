const ROLE_OPTIONS = [
  { key: 'student', label: '学生', intro: '实验室预约、设备借用、耗材申请与实验报告提交' },
  { key: 'teacher', label: '教师', intro: '课程查看、申请审批、签到管理与成绩录入' },
  { key: 'admin', label: '管理员', intro: '审批、统计、用户、资源与课程管理' }
]

const ROLE_LABEL_MAP = {
  student: '学生',
  teacher: '教师',
  admin: '管理员'
}

const PAGE_ROLE_RULES = {
  '/pages/admin/approval/index': ['teacher', 'admin'],
  '/pages/admin/dashboard/index': ['admin'],
  '/pages/admin/users/index': ['admin'],
  '/pages/admin/lab-manage/index': ['admin'],
  '/pages/admin/equipment-manage/index': ['admin'],
  '/pages/admin/consumable-manage/index': ['admin'],
  '/pages/course/publish/index': ['teacher', 'admin'],
  '/pages/course/attendance/index': ['teacher', 'admin'],
  '/pages/course/grades/index': ['teacher', 'admin']
}

const APPROVAL_TABS_BY_ROLE = {
  teacher: ['reservation'],
  admin: ['reservation', 'equipment', 'consumable']
}

const TIME_SLOTS = [
  '08:00-10:00',
  '10:00-12:00',
  '14:00-16:00',
  '16:00-18:00',
  '19:00-21:00'
]

const RESERVATION_STATUS = {
  pending: '待审核',
  approved: '已通过',
  rejected: '已驳回',
  cancelled: '已取消',
  completed: '已完成'
}

const EQUIPMENT_STATUS = {
  idle: '可借用',
  reserved: '待借出',
  borrowed: '借用中',
  maintenance: '维护中',
  scrapped: '已报废',
  overdue: '已超期'
}

const EQUIPMENT_REQUEST_STATUS = {
  pending: '待审批',
  approved: '待扫码借出',
  borrowed: '借用中',
  returned: '已归还',
  rejected: '已驳回',
  overdue: '已超期'
}

const CONSUMABLE_STATUS = {
  pending: '待审批',
  approved: '已通过',
  rejected: '已驳回'
}

const MESSAGE_CATEGORY = [
  { key: 'all', label: '全部' },
  { key: 'approval', label: '审批' },
  { key: 'course', label: '课程' },
  { key: 'system', label: '系统' },
  { key: 'alert', label: '提醒' }
]

module.exports = {
  ROLE_OPTIONS,
  ROLE_LABEL_MAP,
  PAGE_ROLE_RULES,
  APPROVAL_TABS_BY_ROLE,
  TIME_SLOTS,
  RESERVATION_STATUS,
  EQUIPMENT_STATUS,
  EQUIPMENT_REQUEST_STATUS,
  CONSUMABLE_STATUS,
  MESSAGE_CATEGORY
}
