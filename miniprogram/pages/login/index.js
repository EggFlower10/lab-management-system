const { ROLE_OPTIONS } = require('../../utils/constants')
const { login, loginByWechat, getCurrentUser } = require('../../utils/service')

Page({
  data: {
    roles: ROLE_OPTIONS,
    activeRole: 'student',
    form: {
      username: 'stu2026001',
      password: '123456'
    },
    loading: false,
    wechatLoading: false
  },

  onShow() {
    const currentUser = getCurrentUser()
    if (currentUser) {
      wx.switchTab({ url: '/pages/home/index' })
    }
  },

  handleRoleSelect(event) {
    const role = event.currentTarget.dataset.role
    const presets = {
      student: 'stu2026001',
      teacher: 'tea2026001',
      admin: 'admin'
    }
    this.setData({
      activeRole: role,
      'form.username': presets[role],
      'form.password': '123456'
    })
  },

  handleInput(event) {
    const field = event.currentTarget.dataset.field
    this.setData({
      [`form.${field}`]: event.detail.value
    })
  },

  async submitLogin() {
    const { form, activeRole, loading } = this.data
    if (loading) {
      return
    }
    if (!form.username || !form.password) {
      wx.showToast({ title: '请输入账号和密码', icon: 'none' })
      return
    }

    this.setData({ loading: true })
    wx.showLoading({ title: '登录中' })
    try {
      await login({
        username: form.username.trim(),
        password: form.password,
        role: activeRole
      })
      wx.hideLoading()
      wx.switchTab({ url: '/pages/home/index' })
    } catch (error) {
      wx.hideLoading()
      wx.showToast({
        title: error.message || '登录失败',
        icon: 'none'
      })
    } finally {
      this.setData({ loading: false })
    }
  },

  requestWechatCode() {
    return new Promise((resolve) => {
      wx.login({
        success: (result) => {
          resolve(result.code || `mock-code-${Date.now()}`)
        },
        fail: () => {
          resolve(`mock-code-${Date.now()}`)
        }
      })
    })
  },

  requestWechatProfile() {
    return new Promise((resolve) => {
      if (!wx.getUserProfile) {
        resolve({
          nickName: '微信用户',
          avatarUrl: ''
        })
        return
      }

      wx.getUserProfile({
        desc: '用于完善微信登录与身份认证信息',
        success: (result) => {
          resolve(result.userInfo || {
            nickName: '微信用户',
            avatarUrl: ''
          })
        },
        fail: () => {
          resolve({
            nickName: '微信用户',
            avatarUrl: ''
          })
        }
      })
    })
  },

  async handleWechatLogin() {
    const { activeRole, wechatLoading } = this.data
    if (wechatLoading) {
      return
    }

    this.setData({ wechatLoading: true })
    wx.showLoading({ title: '授权中' })
    try {
      const [code, profile] = await Promise.all([
        this.requestWechatCode(),
        this.requestWechatProfile()
      ])
      const result = await loginByWechat({
        role: activeRole,
        code,
        nickName: profile.nickName,
        avatarUrl: profile.avatarUrl
      })
      wx.hideLoading()
      if (result.status === 'logged_in') {
        wx.showToast({ title: '微信登录成功', icon: 'success' })
        wx.switchTab({ url: '/pages/home/index' })
        return
      }
      wx.navigateTo({
        url: `/pages/login/bind/index?role=${activeRole}`
      })
    } catch (error) {
      wx.hideLoading()
      wx.showToast({
        title: error.message || '微信登录失败',
        icon: 'none'
      })
    } finally {
      this.setData({ wechatLoading: false })
    }
  }
})
