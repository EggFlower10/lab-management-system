const { STORAGE_KEYS } = require('./mock')
const { PAGE_ROLE_RULES, ROLE_LABEL_MAP } = require('./constants')

function getCurrentUser() {
  const app = getApp && getApp()
  if (app && app.globalData && app.globalData.currentUser) {
    return app.globalData.currentUser
  }
  return wx.getStorageSync(STORAGE_KEYS.session) || null
}

function hasRole(user, allowedRoles = []) {
  if (!allowedRoles || !allowedRoles.length) {
    return true
  }
  if (!user || !user.role) {
    return false
  }
  return allowedRoles.includes(user.role)
}

function getRoleLabel(role) {
  return ROLE_LABEL_MAP[role] || role || '未定义角色'
}

function redirectToHome() {
  wx.switchTab({ url: '/pages/home/index' })
}

function ensurePageAccess(options = {}) {
  const user = getCurrentUser()
  if (!user) {
    wx.reLaunch({ url: '/pages/login/index' })
    return null
  }

  const route = options.route || ''
  const allowedRoles = options.allowedRoles || PAGE_ROLE_RULES[route] || []
  if (allowedRoles.length && !hasRole(user, allowedRoles)) {
    const roleText = allowedRoles.map(getRoleLabel).join(' / ')
    wx.showToast({
      title: `${roleText}可访问`,
      icon: 'none'
    })
    setTimeout(() => {
      const pages = getCurrentPages()
      if (pages.length > 1) {
        wx.navigateBack()
      } else {
        redirectToHome()
      }
    }, 350)
    return null
  }

  return user
}

function ensureActionAccess(allowedRoles, message = '当前身份暂无权限执行此操作') {
  const user = getCurrentUser()
  if (!user) {
    wx.reLaunch({ url: '/pages/login/index' })
    return null
  }
  if (!hasRole(user, allowedRoles)) {
    wx.showToast({ title: message, icon: 'none' })
    return null
  }
  return user
}

module.exports = {
  getCurrentUser,
  hasRole,
  getRoleLabel,
  ensurePageAccess,
  ensureActionAccess
}
