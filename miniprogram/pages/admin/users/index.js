const { ROLE_OPTIONS } = require('../../../utils/constants')
const { getUsers, reviewUser, assignUserRole, toggleUserBlacklist } = require('../../../utils/service')
const { ensurePageAccess } = require('../../../utils/auth')

const BLACKLIST_REASONS = [
  '多次预约爽约',
  '违规使用设备',
  '安全规范违规',
  '其他管理原因'
]

Page({
  data: {
    currentUserId: '',
    users: [],
    filteredUsers: [],
    activeFilter: 'all',
    filters: [],
    stats: []
  },

  onShow() {
    const currentUser = ensurePageAccess({ route: '/pages/admin/users/index' })
    if (!currentUser) {
      return
    }
    this.setData({
      currentUserId: currentUser.id
    })
    this.loadData()
  },

  async loadData() {
    try {
      const users = await getUsers()
      const stats = [
        { label: '待审核', value: users.filter((item) => item.auditStatus === 'pending').length, intro: '待管理员处理' },
        { label: '已通过', value: users.filter((item) => item.auditStatus === 'approved').length, intro: '已开通账号' },
        { label: '黑名单', value: users.filter((item) => item.blacklisted).length, intro: '限制登录使用' },
        { label: '管理员', value: users.filter((item) => item.role === 'admin').length, intro: '系统管理权限' }
      ]
      const filters = [
        { key: 'all', label: '全部', count: users.length },
        { key: 'pending', label: '待审核', count: users.filter((item) => item.auditStatus === 'pending').length },
        { key: 'approved', label: '已通过', count: users.filter((item) => item.auditStatus === 'approved').length },
        { key: 'rejected', label: '已驳回', count: users.filter((item) => item.auditStatus === 'rejected').length },
        { key: 'blacklisted', label: '黑名单', count: users.filter((item) => item.blacklisted).length }
      ]

      this.setData({
        users,
        stats,
        filters
      }, () => {
        this.applyFilters()
      })
    } catch (error) {
      wx.showToast({ title: error.message || '加载用户失败', icon: 'none' })
    }
  },

  applyFilters() {
    const { users, activeFilter } = this.data
    const filteredUsers = users.filter((item) => {
      if (activeFilter === 'all') {
        return true
      }
      if (activeFilter === 'blacklisted') {
        return item.blacklisted
      }
      return item.auditStatus === activeFilter
    })
    this.setData({ filteredUsers })
  },

  changeFilter(event) {
    this.setData({
      activeFilter: event.currentTarget.dataset.filter
    }, () => {
      this.applyFilters()
    })
  },

  async handleReview(userId, approved) {
    wx.showLoading({ title: approved ? '审核通过中' : '驳回中' })
    try {
      await reviewUser(userId, approved)
      wx.hideLoading()
      wx.showToast({ title: approved ? '已通过审核' : '已驳回申请', icon: 'success' })
      this.loadData()
    } catch (error) {
      wx.hideLoading()
      wx.showToast({ title: error.message || '操作失败', icon: 'none' })
    }
  },

  approveUser(event) {
    const { id, name } = event.currentTarget.dataset
    wx.showModal({
      title: '通过审核',
      content: `确认通过 ${name} 的用户审核吗？`,
      success: (result) => {
        if (result.confirm) {
          this.handleReview(id, true)
        }
      }
    })
  },

  rejectUser(event) {
    const { id, name } = event.currentTarget.dataset
    wx.showModal({
      title: '驳回审核',
      content: `确认驳回 ${name} 的账号申请吗？`,
      success: (result) => {
        if (result.confirm) {
          this.handleReview(id, false)
        }
      }
    })
  },

  assignRole(event) {
    const { id, role, name } = event.currentTarget.dataset
    const roleLabels = ROLE_OPTIONS.map((item) => item.label)
    wx.showActionSheet({
      itemList: roleLabels,
      success: async (result) => {
        const selected = ROLE_OPTIONS[result.tapIndex]
        if (!selected) {
          return
        }
        if (selected.key === role) {
          wx.showToast({ title: `${name} 当前已是${selected.label}`, icon: 'none' })
          return
        }
        wx.showLoading({ title: '更新权限中' })
        try {
          await assignUserRole(id, selected.key)
          wx.hideLoading()
          wx.showToast({ title: '权限已更新', icon: 'success' })
          this.loadData()
        } catch (error) {
          wx.hideLoading()
          wx.showToast({ title: error.message || '权限更新失败', icon: 'none' })
        }
      }
    })
  },

  toggleBlacklist(event) {
    const { id, name } = event.currentTarget.dataset
    const blacklisted = event.currentTarget.dataset.blacklisted === true || event.currentTarget.dataset.blacklisted === 'true'

    if (blacklisted) {
      wx.showModal({
        title: '解除黑名单',
        content: `确认解除 ${name} 的黑名单限制吗？`,
        success: async (result) => {
          if (!result.confirm) {
            return
          }
          wx.showLoading({ title: '处理中' })
          try {
            await toggleUserBlacklist(id, false)
            wx.hideLoading()
            wx.showToast({ title: '已解除黑名单', icon: 'success' })
            this.loadData()
          } catch (error) {
            wx.hideLoading()
            wx.showToast({ title: error.message || '操作失败', icon: 'none' })
          }
        }
      })
      return
    }

    wx.showActionSheet({
      itemList: BLACKLIST_REASONS,
      success: async (result) => {
        const reason = BLACKLIST_REASONS[result.tapIndex]
        if (!reason) {
          return
        }
        wx.showLoading({ title: '加入黑名单中' })
        try {
          await toggleUserBlacklist(id, true, reason)
          wx.hideLoading()
          wx.showToast({ title: '已加入黑名单', icon: 'success' })
          this.loadData()
        } catch (error) {
          wx.hideLoading()
          wx.showToast({ title: error.message || '操作失败', icon: 'none' })
        }
      }
    })
  }
})
