const { getMineData, logout } = require('../../utils/service')
const { ensurePageAccess, getRoleLabel } = require('../../utils/auth')

Page({
  data: {
    user: null,
    stats: [],
    shortcuts: []
  },

  onShow() {
    const user = ensurePageAccess()
    if (!user) {
      return
    }
    this.loadData()
  },

  async loadData() {
    const data = await getMineData()
    let shortcuts = [
      { title: '我的预约', path: '/pages/reservation/list/index' },
      { title: '设备借用', path: '/pages/equipment/index' },
      { title: '耗材申请', path: '/pages/consumable/index' },
      { title: '课程中心', path: '/pages/course/index' }
    ]

    if (data.user.role === 'teacher') {
      shortcuts = [
        { title: '课程发布', path: '/pages/course/publish/index' },
        { title: '审批中心', path: '/pages/admin/approval/index' },
        { title: '签到管理', path: '/pages/course/index' },
        { title: '成绩录入', path: '/pages/course/index' }
      ]
    }

    if (data.user.role === 'admin') {
      shortcuts = [
        { title: '课程管理', path: '/pages/course/index' },
        { title: '数据统计', path: '/pages/admin/dashboard/index' },
        { title: '用户管理', path: '/pages/admin/users/index' },
        { title: '实验室管理', path: '/pages/admin/lab-manage/index' },
        { title: '设备管理', path: '/pages/admin/equipment-manage/index' },
        { title: '耗材库存', path: '/pages/admin/consumable-manage/index' }
      ]
    }
    this.setData({
      ...data,
      roleLabel: getRoleLabel(data.user.role),
      shortcuts
    })
  },

  openPage(event) {
    const path = event.currentTarget.dataset.path
    if (['/pages/home/index', '/pages/lab/index', '/pages/course/index', '/pages/message/index', '/pages/mine/index'].includes(path)) {
      wx.switchTab({ url: path })
      return
    }
    wx.navigateTo({ url: path })
  },

  handleLogout() {
    logout()
    wx.reLaunch({ url: '/pages/login/index' })
  }
})
