const { ROLE_OPTIONS } = require('../../../utils/constants')
const { getCurrentUser } = require('../../../utils/auth')
const { getWechatLoginDraft, submitIdentityAuth } = require('../../../utils/service')

function getRoleMeta(role) {
  const roleInfo = ROLE_OPTIONS.find((item) => item.key === role) || ROLE_OPTIONS[0]
  const isStudent = roleInfo.key === 'student'
  return {
    role: roleInfo.key,
    roleLabel: roleInfo.label,
    identityLabel: isStudent ? '学号' : '工号',
    departmentLabel: isStudent ? '学院信息' : '部门信息',
    heroSubtitle: `完成${roleInfo.label}身份的手机号与${isStudent ? '学号' : '工号'}绑定后，即可提交微信身份认证。`
  }
}

Page({
  data: {
    role: 'student',
    roleLabel: '学生',
    identityLabel: '学号',
    departmentLabel: '学院信息',
    heroSubtitle: '',
    draft: null,
    phoneAuthorized: false,
    submitting: false,
    form: {
      name: '',
      phone: '',
      identityNo: '',
      department: ''
    }
  },

  onLoad(options) {
    const currentUser = getCurrentUser()
    if (currentUser) {
      wx.switchTab({ url: '/pages/home/index' })
      return
    }

    const draft = getWechatLoginDraft()
    if (!draft) {
      wx.showToast({ title: '请先发起微信登录', icon: 'none' })
      setTimeout(() => {
        wx.reLaunch({ url: '/pages/login/index' })
      }, 400)
      return
    }

    const meta = getRoleMeta(options.role || draft.role || 'student')
    this.setData({
      draft,
      ...meta,
      form: {
        ...this.data.form,
        name: draft.nickName && draft.nickName !== '微信用户' ? draft.nickName : ''
      }
    })
  },

  handleInput(event) {
    const field = event.currentTarget.dataset.field
    this.setData({
      [`form.${field}`]: event.detail.value
    })
  },

  handleGetPhoneNumber(event) {
    const success = event.detail && event.detail.errMsg && event.detail.errMsg.includes(':ok')
    this.setData({ phoneAuthorized: !!success })
    wx.showToast({
      title: success ? '已完成微信手机号授权，请确认或补充号码' : '未完成授权，可手动输入手机号',
      icon: 'none'
    })
  },

  async submit() {
    const { form, role, submitting } = this.data
    if (submitting) {
      return
    }
    if (!form.name.trim() || !form.phone.trim() || !form.identityNo.trim() || !form.department.trim()) {
      wx.showToast({ title: '请完整填写认证信息', icon: 'none' })
      return
    }

    this.setData({ submitting: true })
    wx.showLoading({ title: '提交中' })
    try {
      const result = await submitIdentityAuth({
        role,
        name: form.name.trim(),
        phone: form.phone.trim(),
        identityNo: form.identityNo.trim(),
        department: form.department.trim()
      })
      wx.hideLoading()
      if (result.status === 'approved') {
        wx.showToast({ title: '认证通过并已登录', icon: 'success' })
        wx.switchTab({ url: '/pages/home/index' })
        return
      }

      wx.showModal({
        title: '认证申请已提交',
        content: '当前微信已完成信息绑定，等待管理员审核通过后即可直接微信登录。',
        showCancel: false,
        confirmText: '返回登录',
        success: () => {
          wx.reLaunch({ url: '/pages/login/index' })
        }
      })
    } catch (error) {
      wx.hideLoading()
      wx.showToast({ title: error.message || '提交失败', icon: 'none' })
    } finally {
      this.setData({ submitting: false })
    }
  }
})
