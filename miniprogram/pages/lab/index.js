const { getLabs, getCurrentUser } = require('../../utils/service')

Page({
  data: {
    keyword: '',
    statusTabs: [
      { key: 'all', label: '全部' },
      { key: 'available', label: '空闲' },
      { key: 'occupied', label: '使用中' },
      { key: 'maintenance', label: '维护中' }
    ],
    activeStatus: 'all',
    labs: []
  },

  onShow() {
    const user = getCurrentUser()
    if (!user) {
      wx.reLaunch({ url: '/pages/login/index' })
      return
    }
    this.loadData()
  },

  async loadData() {
    const labs = await getLabs({
      keyword: this.data.keyword,
      status: this.data.activeStatus
    })
    this.setData({ labs })
  },

  handleInput(event) {
    this.setData({ keyword: event.detail.value })
  },

  handleSearch() {
    this.loadData()
  },

  changeStatus(event) {
    this.setData({
      activeStatus: event.currentTarget.dataset.status
    })
    this.loadData()
  },

  openDetail(event) {
    const { id } = event.currentTarget.dataset
    wx.navigateTo({ url: `/pages/lab/detail/index?id=${id}` })
  },

  createReservation(event) {
    const { id } = event.currentTarget.dataset
    wx.navigateTo({ url: `/pages/reservation/create/index?labId=${id}` })
  }
})
