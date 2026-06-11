const { getDashboardData } = require('../../../utils/service')
const { ensurePageAccess } = require('../../../utils/auth')

Page({
  data: {
    cards: [],
    usageList: [],
    lowStockList: []
  },

  onShow() {
    const currentUser = ensurePageAccess({ route: '/pages/admin/dashboard/index' })
    if (!currentUser) {
      return
    }
    this.loadData()
  },

  async loadData() {
    const data = await getDashboardData()
    this.setData(data)
  }
})
