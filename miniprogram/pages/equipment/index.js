const { getEquipment, getEquipmentRequests, borrowEquipmentByScan, returnEquipmentByScan } = require('../../utils/service')
const { ensurePageAccess, getCurrentUser } = require('../../utils/auth')

const STATUS_TABS = [
  { key: 'all', label: '全部状态' },
  { key: 'idle', label: '可借用' },
  { key: 'reserved', label: '待借出' },
  { key: 'borrowed', label: '借用中' },
  { key: 'overdue', label: '已超期' },
  { key: 'maintenance', label: '维护中' },
  { key: 'scrapped', label: '已报废' }
]

const RECORD_TABS = [
  { key: 'all', label: '全部记录' },
  { key: 'pending', label: '待审批' },
  { key: 'approved', label: '待借出' },
  { key: 'borrowed', label: '借用中' },
  { key: 'overdue', label: '已超期' },
  { key: 'returned', label: '已归还' }
]

Page({
  data: {
    currentUser: null,
    keyword: '',
    categoryTabs: [{ key: 'all', label: '全部分类' }],
    activeCategory: 'all',
    statusTabs: STATUS_TABS,
    activeStatus: 'all',
    recordTabs: RECORD_TABS,
    activeRecordStatus: 'all',
    list: [],
    records: [],
    myCount: 0,
    activeBorrowCount: 0,
    availableCount: 0,
    isAdmin: false,
    canOpenApproval: false,
    subtitle: '支持按名称、分类和状态快速筛选设备，并在线发起借用申请。'
  },

  onShow() {
    const user = ensurePageAccess()
    if (!user) {
      return
    }
    this.setData({
      currentUser: user,
      isAdmin: user.role === 'admin',
      canOpenApproval: user.role === 'admin'
    })
    this.loadData()
  },

  async loadData() {
    try {
      const currentUser = getCurrentUser()
      const requestScope = currentUser && currentUser.role === 'admin' ? 'all' : undefined
      const [allEquipment, filteredEquipment, records] = await Promise.all([
        getEquipment({ status: 'all' }),
        getEquipment({
          keyword: this.data.keyword,
          category: this.data.activeCategory,
          status: this.data.activeStatus
        }),
        getEquipmentRequests({
          status: this.data.activeRecordStatus,
          scope: requestScope
        })
      ])

      const categoryTabs = [
        { key: 'all', label: '全部分类' },
        ...Array.from(new Set(allEquipment.map((item) => item.category))).map((category) => ({
          key: category,
          label: category
        }))
      ]

      const availableCount = allEquipment.filter((item) => item.status === 'idle').length
      const activeBorrowCount = records.filter((item) => ['approved', 'borrowed', 'overdue'].includes(item.status)).length
      const subtitle = currentUser.role === 'admin'
        ? `共 ${records.length} 条借用流程，待扫码借出 ${records.filter((item) => item.status === 'approved').length} 条。`
        : `当前已提交 ${records.length} 条借用记录，进行中 ${activeBorrowCount} 条。`

      this.setData({
        categoryTabs,
        list: filteredEquipment,
        records,
        myCount: records.length,
        activeBorrowCount,
        availableCount,
        subtitle
      })
    } catch (error) {
      wx.showToast({
        title: error.message || '设备数据加载失败',
        icon: 'none'
      })
    }
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

  changeCategory(event) {
    this.setData({
      activeCategory: event.currentTarget.dataset.category
    })
    this.loadData()
  },

  changeRecordStatus(event) {
    this.setData({
      activeRecordStatus: event.currentTarget.dataset.status
    })
    this.loadData()
  },

  applyBorrow(event) {
    const id = event.currentTarget.dataset.id
    wx.navigateTo({ url: `/pages/equipment/apply/index?id=${id}` })
  },

  openApproval() {
    wx.navigateTo({ url: '/pages/admin/approval/index?tab=equipment' })
  },

  scanBorrow(event) {
    this.scanAndHandle(event.currentTarget.dataset.id, 'borrow')
  },

  scanReturn(event) {
    this.scanAndHandle(event.currentTarget.dataset.id, 'return')
  },

  scanAndHandle(id, action) {
    wx.scanCode({
      onlyFromCamera: false,
      scanType: ['qrCode', 'barCode'],
      success: async (result) => {
        try {
          if (action === 'borrow') {
            await borrowEquipmentByScan(id, result.result)
          } else {
            await returnEquipmentByScan(id, result.result)
          }
          wx.showToast({
            title: action === 'borrow' ? '扫码借出成功' : '扫码归还成功',
            icon: 'success'
          })
          this.loadData()
        } catch (error) {
          wx.showToast({
            title: error.message || (action === 'borrow' ? '扫码借出失败' : '扫码归还失败'),
            icon: 'none'
          })
        }
      },
      fail: (error) => {
        if (error && error.errMsg && !error.errMsg.includes('cancel')) {
          wx.showToast({
            title: '扫码未完成',
            icon: 'none'
          })
        }
      }
    })
  }
})
