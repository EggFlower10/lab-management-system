const { getConsumables, getConsumableRequests } = require('../../utils/service')
const { getCurrentUser } = require('../../utils/auth')

Page({
  data: {
    currentUser: null,
    list: [],
    filteredList: [],
    categories: [],
    activeCategory: 'all',
    requestList: [],
    requestCount: 0,
    totalTypes: 0,
    lowStockCount: 0,
    pendingCount: 0,
    lowStockPreview: '',
    isAdmin: false,
    heroSubtitle: '',
    requestSectionTitle: '我的申请'
  },

  onShow() {
    const user = getCurrentUser()
    if (!user) {
      wx.reLaunch({ url: '/pages/login/index' })
      return
    }

    this.setData({
      currentUser: user,
      isAdmin: user.role === 'admin',
      heroSubtitle: user.role === 'admin'
        ? '统一查看耗材库存、低库存预警与全部申请记录，管理员可直接进入审批和库存维护。'
        : '查看耗材库存并在线提交申领申请，库存低于预警值时系统会自动提醒管理员。',
      requestSectionTitle: user.role === 'admin' ? '申请记录' : '我的申请'
    })
    this.loadData()
  },

  onPullDownRefresh() {
    this.loadData()
  },

  async loadData() {
    try {
      const [list, requests] = await Promise.all([
        getConsumables(),
        getConsumableRequests({ status: 'all' })
      ])
      const normalizedList = list.map((item) => ({
        ...item,
        isLowStock: Number(item.stock) <= Number(item.warningValue),
        outOfStock: Number(item.stock) <= 0
      }))
      const categories = [
        { key: 'all', label: '全部' },
        ...Array.from(new Set(normalizedList.map((item) => item.category).filter(Boolean))).map((category) => ({
          key: category,
          label: category
        }))
      ]
      const lowStockList = normalizedList.filter((item) => item.isLowStock)
      const lowStockPreview = lowStockList.length
        ? `当前有 ${lowStockList.length} 项耗材低于预警线：${lowStockList.slice(0, 3).map((item) => `${item.name} ${item.stock}${item.unit}`).join('、')}${lowStockList.length > 3 ? ' 等' : ''}。`
        : ''

      this.setData({
        list: normalizedList,
        categories,
        requestList: requests.slice(0, 6),
        requestCount: requests.length,
        totalTypes: normalizedList.length,
        lowStockCount: lowStockList.length,
        pendingCount: requests.filter((item) => item.status === 'pending').length,
        lowStockPreview
      })
      this.applyFilter()
    } catch (error) {
      wx.showToast({ title: error.message || '加载耗材数据失败', icon: 'none' })
    } finally {
      wx.stopPullDownRefresh()
    }
  },

  applyFilter() {
    const { list, activeCategory } = this.data
    const filteredList = activeCategory === 'all'
      ? list
      : list.filter((item) => item.category === activeCategory)
    this.setData({ filteredList })
  },

  changeCategory(event) {
    const activeCategory = event.currentTarget.dataset.category
    this.setData({ activeCategory }, () => {
      this.applyFilter()
    })
  },

  applyItem(event) {
    const id = event.currentTarget.dataset.id
    const target = this.data.list.find((item) => item.id === id)
    if (!target || target.outOfStock) {
      wx.showToast({ title: '当前库存不足，请联系管理员补货', icon: 'none' })
      return
    }
    wx.navigateTo({ url: `/pages/consumable/apply/index?id=${id}` })
  },

  openApproval() {
    wx.navigateTo({ url: '/pages/admin/approval/index?tab=consumable' })
  },

  openManage() {
    wx.navigateTo({ url: '/pages/admin/consumable-manage/index' })
  }
})
