const { formatDate, clone } = require('./format')

const STORAGE_KEYS = {
  users: 'lms.users',
  session: 'lms.session',
  wechatDeviceProfile: 'lms.wechatDeviceProfile',
  wechatLoginDraft: 'lms.wechatLoginDraft',
  labs: 'lms.labs',
  banners: 'lms.banners',
  courses: 'lms.courses',
  messages: 'lms.messages',
  reservations: 'lms.reservations',
  equipment: 'lms.equipment',
  equipmentRequests: 'lms.equipmentRequests',
  consumables: 'lms.consumables',
  consumableRequests: 'lms.consumableRequests',
  reports: 'lms.reports',
  checkins: 'lms.checkins',
  courseScores: 'lms.courseScores',
  initialized: 'lms.initialized'
}

const TODAY = formatDate(new Date())

const DEFAULT_USERS = [
  {
    id: 'U1001',
    username: 'stu2026001',
    password: '123456',
    role: 'student',
    name: '李晓彤',
    studentNo: '2026001',
    department: '信息工程学院',
    phone: '13800001111',
    auditStatus: 'approved',
    blacklisted: false
  },
  {
    id: 'U1002',
    username: 'tea2026001',
    password: '123456',
    role: 'teacher',
    name: '王老师',
    studentNo: 'T2026001',
    department: '计算机科学系',
    phone: '13800002222',
    auditStatus: 'approved',
    blacklisted: false
  },
  {
    id: 'U1003',
    username: 'admin',
    password: '123456',
    role: 'admin',
    name: '实验中心管理员',
    studentNo: 'A0001',
    department: '实验中心',
    phone: '13800003333',
    auditStatus: 'approved',
    blacklisted: false
  },
  {
    id: 'U1004',
    username: 'stu2026002',
    password: '123456',
    role: 'student',
    name: '陈思羽',
    studentNo: '2026002',
    department: '自动化学院',
    phone: '13800004444',
    auditStatus: 'pending',
    auditRemark: '待管理员审核身份信息',
    blacklisted: false
  },
  {
    id: 'U1005',
    username: 'tea2026002',
    password: '123456',
    role: 'teacher',
    name: '刘老师',
    studentNo: 'T2026002',
    department: '电子工程系',
    phone: '13800005555',
    auditStatus: 'approved',
    blacklisted: true,
    blacklistReason: '多次爽约且未按要求整改',
    blacklistAt: `${TODAY} 14:20`,
    blacklistByName: '实验中心管理员'
  }
]

const DEFAULT_BANNERS = [
  {
    id: 'B1',
    title: '实验室安全提醒',
    subtitle: '进入实验室前请完成安全承诺与设备检查'
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
]

const DEFAULT_LABS = [
  {
    id: 'L101',
    name: '人工智能实验室',
    building: '信息楼A座',
    roomNumber: '401',
    capacity: 48,
    status: 'available',
    openTime: '周一至周日 08:00-21:00',
    description: '适合机器学习、视觉算法和课程实验，支持高性能计算主机。',
    equipment: ['RTX工作站', '深度学习服务器', '投影屏', '无线投屏'],
    guide: '预约前请确认GPU资源需求，大型训练任务需教师审批。',
    activeCount: 2
  },
  {
    id: 'L102',
    name: '嵌入式创新实验室',
    building: '信息楼A座',
    roomNumber: '305',
    capacity: 36,
    status: 'occupied',
    openTime: '周一至周六 08:00-18:00',
    description: '支持单片机、物联网和智能硬件课程实验。',
    equipment: ['示波器', '焊台', 'STM32套件', '逻辑分析仪'],
    guide: '使用焊接设备需佩戴护目镜，并在教师陪同下操作。',
    activeCount: 1
  },
  {
    id: 'L103',
    name: '网络攻防实验室',
    building: '实训楼B座',
    roomNumber: '207',
    capacity: 42,
    status: 'available',
    openTime: '周一至周日 09:00-21:00',
    description: '提供网络仿真、渗透靶场与安全演练环境。',
    equipment: ['交换机机柜', '靶场服务器', '虚拟化平台', '监控大屏'],
    guide: '外网隔离环境中开展实验，禁止私接移动存储设备。',
    activeCount: 0
  },
  {
    id: 'L104',
    name: '数字媒体制作实验室',
    building: '艺术楼C座',
    roomNumber: '112',
    capacity: 30,
    status: 'maintenance',
    openTime: '维护中，预计本周五恢复开放',
    description: '提供视频剪辑、三维建模与动效设计设备。',
    equipment: ['剪辑工作站', '摄影灯组', '录音麦克风', '数位屏'],
    guide: '当前进行空调与供电检修，暂停开放预约。',
    activeCount: 0
  }
]

const DEFAULT_COURSES = [
  {
    id: 'C1001',
    name: '机器学习实践',
    teacherName: '王老师',
    date: TODAY,
    timeSlot: '14:00-16:00',
    labId: 'L101',
    labName: '人工智能实验室',
    status: 'ongoing',
    className: '计科 2023 级 2 班',
    scoreStatus: '待录入'
  },
  {
    id: 'C1002',
    name: '嵌入式系统设计',
    teacherName: '王老师',
    date: TODAY,
    timeSlot: '08:00-10:00',
    labId: 'L102',
    labName: '嵌入式创新实验室',
    status: 'completed',
    className: '物联网 2023 级 1 班',
    scoreStatus: '已录入'
  },
  {
    id: 'C1003',
    name: '网络安全综合实验',
    teacherName: '赵老师',
    date: '2026-06-12',
    timeSlot: '10:00-12:00',
    labId: 'L103',
    labName: '网络攻防实验室',
    status: 'upcoming',
    className: '网安 2023 级 1 班',
    scoreStatus: '未开始'
  }
]

const DEFAULT_MESSAGES = [
  {
    id: 'M1001',
    category: 'system',
    title: '平台已启用移动端预约',
    content: '你可以直接在小程序中完成实验室预约、设备借用和耗材申请。',
    recipientRole: 'all',
    read: false,
    createdAt: `${TODAY} 09:00`
  },
  {
    id: 'M1002',
    category: 'alert',
    title: '安全巡检提醒',
    content: '本周实验室将进行用电安全抽查，请提前整理台面和设备。',
    recipientRole: 'all',
    read: false,
    createdAt: `${TODAY} 10:20`
  }
]

const DEFAULT_RESERVATIONS = [
  {
    id: 'R1001',
    code: 'RV-20260610-001',
    labId: 'L101',
    labName: '人工智能实验室',
    roomNumber: '401',
    date: TODAY,
    timeSlot: '19:00-21:00',
    headCount: 12,
    purpose: '课程项目调试',
    projectName: '智能垃圾分类模型验证',
    applicantId: 'U1001',
    applicantName: '李晓彤',
    phone: '13800001111',
    status: 'approved',
    remark: '已自动生成签到凭证',
    checkInCode: 'LAB-CHECK-1001',
    createdAt: `${TODAY} 08:30`
  }
]

const DEFAULT_EQUIPMENT = [
  {
    id: 'E1001',
    name: '示波器',
    no: 'EQ-OSC-01',
    model: 'RIGOL DS1054Z',
    category: '测试仪器',
    status: 'idle',
    location: '嵌入式创新实验室'
  },
  {
    id: 'E1002',
    name: '单反相机',
    no: 'EQ-CAM-03',
    model: 'Sony A7M4',
    category: '影像设备',
    status: 'borrowed',
    location: '数字媒体制作实验室'
  },
  {
    id: 'E1003',
    name: '开发板套件',
    no: 'EQ-STM-12',
    model: 'STM32 Discovery',
    category: '开发套件',
    status: 'idle',
    location: '嵌入式创新实验室'
  },
  {
    id: 'E1004',
    name: '便携投影仪',
    no: 'EQ-PRO-09',
    model: 'XGIMI Z8X',
    category: '展示设备',
    status: 'maintenance',
    location: '实验中心仓库'
  }
]

const DEFAULT_EQUIPMENT_REQUESTS = [
  {
    id: 'ER1002',
    equipmentId: 'E1002',
    equipmentName: '单反相机',
    applicantId: 'U1001',
    applicantName: '李晓彤',
    borrowDate: TODAY,
    returnDate: '2026-06-11',
    purpose: '实验过程影像采集',
    status: 'borrowed',
    scanCode: 'EQ-CAM-03',
    borrowedAt: `${TODAY} 09:30`,
    returnedAt: '',
    createdAt: `${TODAY} 08:50`
  },
  {
    id: 'ER1001',
    equipmentId: 'E1003',
    equipmentName: '开发板套件',
    applicantId: 'U1001',
    applicantName: '李晓彤',
    borrowDate: TODAY,
    returnDate: '2026-06-12',
    purpose: '课程实验连调',
    scanCode: 'EQ-STM-12',
    borrowedAt: '',
    returnedAt: '',
    status: 'pending',
    createdAt: `${TODAY} 11:10`
  }
]

const DEFAULT_CONSUMABLES = [
  {
    id: 'CNS1001',
    name: '杜邦线',
    stock: 240,
    unit: '根',
    category: '电子配件',
    warningValue: 80
  },
  {
    id: 'CNS1002',
    name: '焊锡丝',
    stock: 36,
    unit: '卷',
    category: '焊接耗材',
    warningValue: 20
  },
  {
    id: 'CNS1003',
    name: 'A4 相纸',
    stock: 12,
    unit: '包',
    category: '打印耗材',
    warningValue: 10
  }
]

const DEFAULT_CONSUMABLE_REQUESTS = [
  {
    id: 'CR1001',
    consumableId: 'CNS1001',
    consumableName: '杜邦线',
    quantity: 20,
    unit: '根',
    purpose: '硬件连接实验',
    applicantId: 'U1001',
    applicantName: '李晓彤',
    status: 'approved',
    createdAt: `${TODAY} 09:40`
  }
]

function hasStoredValue(key) {
  const data = wx.getStorageSync(key)
  return data !== '' && data !== undefined && data !== null
}

function seedValue(key, value) {
  if (!hasStoredValue(key)) {
    wx.setStorageSync(key, clone(value))
  }
}

function ensureMockData() {
  if (wx.getStorageSync(STORAGE_KEYS.initialized)) {
    return
  }

  seedValue(STORAGE_KEYS.users, DEFAULT_USERS)
  seedValue(STORAGE_KEYS.banners, DEFAULT_BANNERS)
  seedValue(STORAGE_KEYS.labs, DEFAULT_LABS)
  seedValue(STORAGE_KEYS.courses, DEFAULT_COURSES)
  seedValue(STORAGE_KEYS.messages, DEFAULT_MESSAGES)
  seedValue(STORAGE_KEYS.reservations, DEFAULT_RESERVATIONS)
  seedValue(STORAGE_KEYS.equipment, DEFAULT_EQUIPMENT)
  seedValue(STORAGE_KEYS.equipmentRequests, DEFAULT_EQUIPMENT_REQUESTS)
  seedValue(STORAGE_KEYS.consumables, DEFAULT_CONSUMABLES)
  seedValue(STORAGE_KEYS.consumableRequests, DEFAULT_CONSUMABLE_REQUESTS)
  seedValue(STORAGE_KEYS.reports, [])
  seedValue(STORAGE_KEYS.checkins, [])
  seedValue(STORAGE_KEYS.courseScores, [])
  wx.setStorageSync(STORAGE_KEYS.initialized, true)
}

function readStore(key, fallback) {
  ensureMockData()
  const value = wx.getStorageSync(key)
  if (value === '' || value === undefined || value === null) {
    return clone(fallback)
  }
  return clone(value)
}

function writeStore(key, value) {
  wx.setStorageSync(key, clone(value))
}

function createId(prefix) {
  return `${prefix}${Date.now()}${Math.floor(Math.random() * 90 + 10)}`
}

module.exports = {
  STORAGE_KEYS,
  ensureMockData,
  readStore,
  writeStore,
  createId
}
