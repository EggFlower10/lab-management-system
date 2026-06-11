const { getHomeData } = require('../../utils/service')
const { ensurePageAccess } = require('../../utils/auth')

Page({
  data: {
    user: null,
    banners: [],
    todayCourses: [],
    todayReservations: [],
    quickLabs: [],
    unreadCount: 0,
    reservationCount: 0,
    quickActions: []
  },

  onShow() {
    const user = ensurePageAccess()
    if (!user) {
      return
    }
    this.loadData()
  },

  async loadData() {
    const currentUser = ensurePageAccess()
    if (!currentUser) {
      return
    }
    let quickActions = [
      { title: '预约实验室', desc: '快速发起预约申请', path: '/pages/lab/index' },
      { title: '借设备', desc: '查看设备状态并提交申请', path: '/pages/equipment/index' },
      { title: '申请耗材', desc: '库存可视化，领用留痕', path: '/pages/consumable/index' },
      { title: '我的课程', desc: '查看课程、签到与报告', path: '/pages/course/index' }
    ]

    if (currentUser.role === 'teacher') {
      quickActions = [
        { title: '课程发布', desc: '快速新增实验课程安排', path: '/pages/course/publish/index' },
        { title: '审批中心', desc: '处理实验室预约申请', path: '/pages/admin/approval/index' },
        { title: '成绩录入', desc: '进入课程中心录入实验成绩', path: '/pages/course/index' },
        { title: '签到管理', desc: '查看学生签到签退状态', path: '/pages/course/index' }
      ]
    }

    if (currentUser.role === 'admin') {
      quickActions = [
        { title: '课程管理', desc: '创建课程、排课和教学进度管理', path: '/pages/course/index' },
        { title: '数据统计', desc: '查看预约、设备与库存总览', path: '/pages/admin/dashboard/index' },
        { title: '用户管理', desc: '查看角色分布与账号信息', path: '/pages/admin/users/index' },
        { title: '实验室管理', desc: '维护实验室状态与容量', path: '/pages/admin/lab-manage/index' },
        { title: '设备管理', desc: '维护设备资产与可借状态', path: '/pages/admin/equipment-manage/index' },
        { title: '耗材库存', desc: '维护库存与预警阈值', path: '/pages/admin/consumable-manage/index' }
      ]
    }

    const data = await getHomeData()
    this.setData({
      ...data,
      quickActions
    })
  },

  goTo(event) {
    const { path } = event.currentTarget.dataset
    if (['/pages/home/index', '/pages/lab/index', '/pages/course/index', '/pages/message/index', '/pages/mine/index'].includes(path)) {
      wx.switchTab({ url: path })
      return
    }
    wx.navigateTo({ url: path })
  },

  openLab(event) {
    const { id } = event.currentTarget.dataset
    wx.navigateTo({ url: `/pages/lab/detail/index?id=${id}` })
  }
})
