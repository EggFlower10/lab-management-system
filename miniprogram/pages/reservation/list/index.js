const { getReservations, cancelReservation, getCurrentUser } = require('../../../utils/service')

Page({
  data: {
    tabs: [
      { key: 'all', label: '全部' },
      { key: 'pending', label: '待审核' },
      { key: 'approved', label: '已通过' },
      { key: 'completed', label: '已完成' },
      { key: 'cancelled', label: '已取消' }
    ],
    activeTab: 'all',
    reservations: []
  },

  onShow() {
    const currentUser = getCurrentUser()
    if (!currentUser) {
      wx.reLaunch({ url: '/pages/login/index' })
      return
    }
    this.loadData()
  },

  async loadData() {
    const reservations = await getReservations({
      status: this.data.activeTab
    })
    this.setData({ reservations })
  },

  changeTab(event) {
    this.setData({
      activeTab: event.currentTarget.dataset.tab
    })
    this.loadData()
  },

  openDetail(event) {
    wx.navigateTo({
      url: `/pages/reservation/detail/index?id=${event.currentTarget.dataset.id}`
    })
  },

  async handleCancel(event) {
    const id = event.currentTarget.dataset.id
    try {
      await cancelReservation(id)
      wx.showToast({ title: '已取消', icon: 'success' })
      this.loadData()
    } catch (error) {
      wx.showToast({ title: error.message || '取消失败', icon: 'none' })
    }
  }
})
