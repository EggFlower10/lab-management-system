const { getLabDetail, getCurrentUser } = require('../../../utils/service')

Page({
  data: {
    detail: null
  },

  onLoad(options) {
    const user = getCurrentUser()
    if (!user) {
      wx.reLaunch({ url: '/pages/login/index' })
      return
    }
    if (options.id) {
      this.loadData(options.id)
    }
  },

  async loadData(id) {
    try {
      const detail = await getLabDetail(id)
      this.setData({ detail })
    } catch (error) {
      wx.showToast({ title: error.message || '加载失败', icon: 'none' })
    }
  },

  createReservation() {
    const { detail } = this.data
    wx.navigateTo({ url: `/pages/reservation/create/index?labId=${detail.id}` })
  }
})
