const { BACKEND_BASE_URL } = require('./config')
const { ensureMockData, STORAGE_KEYS } = require('./utils/mock')

App({
  onLaunch() {
    ensureMockData()
    this.globalData.currentUser = wx.getStorageSync(STORAGE_KEYS.session) || null
  },

  globalData: {
    currentUser: null,
    useBackend: true,
    backendBaseUrl: BACKEND_BASE_URL,
    subscriptionTemplates: {
      equipmentBorrowLifecycle: []
    }
  },

  setCurrentUser(user) {
    this.globalData.currentUser = user
    wx.setStorageSync(STORAGE_KEYS.session, user)
  },

  clearCurrentUser() {
    this.globalData.currentUser = null
    wx.removeStorageSync(STORAGE_KEYS.session)
  }
})
