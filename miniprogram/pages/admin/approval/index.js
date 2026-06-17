const { getApprovalData, handleApproval } = require('../../../utils/service')
const { APPROVAL_TABS_BY_ROLE } = require('../../../utils/constants')
const { ensurePageAccess, getCurrentUser } = require('../../../utils/auth')

Page({
  data: {
    tabs: [
      { key: 'reservation', label: '预约审批' },
      { key: 'equipment', label: '设备审批' },
      { key: 'consumable', label: '耗材审批' }
    ],
    activeTab: 'reservation',
    list: [],
    subtitle: '统一处理预约、设备和耗材申请'
  },

  onLoad(options) {
    this.preferredTab = options.tab || ''
  },

  onShow() {
    const currentUser = ensurePageAccess({ route: '/pages/admin/approval/index' })
    if (!currentUser) {
      return
    }
    const allowedKeys = APPROVAL_TABS_BY_ROLE[currentUser.role] || []
    const tabs = this.data.tabs.filter((item) => allowedKeys.includes(item.key))
    const preferredTab = this.preferredTab || this.data.activeTab
    const activeTab = allowedKeys.includes(preferredTab) ? preferredTab : (tabs[0] && tabs[0].key) || 'reservation'
    this.preferredTab = ''
    this.setData({
      tabs,
      activeTab,
      subtitle: currentUser.role === 'teacher' ? '处理实验室预约与设备借用申请' : '统一处理预约、设备和耗材申请'
    })
    this.loadData()
  },

  async loadData() {
    try {
      const list = await getApprovalData(this.data.activeTab)
      this.setData({ list })
    } catch (error) {
      wx.showToast({ title: error.message || '加载审批数据失败', icon: 'none' })
    }
  },

  changeTab(event) {
    this.setData({
      activeTab: event.currentTarget.dataset.tab
    })
    this.loadData()
  },

  async approve(event) {
    await this.updateStatus(event.currentTarget.dataset.id, true)
  },

  async reject(event) {
    await this.updateStatus(event.currentTarget.dataset.id, false)
  },

  async updateStatus(id, approved) {
    try {
      await handleApproval(this.data.activeTab, id, approved)
      wx.showToast({ title: approved ? '已通过' : '已驳回', icon: 'success' })
      this.loadData()
    } catch (error) {
      wx.showToast({ title: error.message || '处理失败', icon: 'none' })
    }
  }
})
