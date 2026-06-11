const { getReportByCourse, submitReport, getCurrentUser } = require('../../../utils/service')

Page({
  data: {
    courseId: '',
    courseName: '',
    content: '',
    submitting: false
  },

  async onLoad(options) {
    const currentUser = getCurrentUser()
    if (!currentUser) {
      wx.reLaunch({ url: '/pages/login/index' })
      return
    }
    const courseId = options.courseId || ''
    const courseName = options.courseName || ''
    const report = courseId ? await getReportByCourse(courseId) : null
    this.setData({
      courseId,
      courseName,
      content: report ? report.content : ''
    })
  },

  handleInput(event) {
    this.setData({ content: event.detail.value })
  },

  async submit() {
    const { courseId, courseName, content, submitting } = this.data
    if (submitting) {
      return
    }
    if (!content.trim()) {
      wx.showToast({ title: '请填写报告内容', icon: 'none' })
      return
    }
    this.setData({ submitting: true })
    wx.showLoading({ title: '保存中' })
    try {
      await submitReport({
        courseId,
        courseName,
        content: content.trim()
      })
      wx.hideLoading()
      wx.showToast({ title: '已提交', icon: 'success' })
      setTimeout(() => {
        wx.navigateBack()
      }, 500)
    } catch (error) {
      wx.hideLoading()
      wx.showToast({ title: error.message || '保存失败', icon: 'none' })
    } finally {
      this.setData({ submitting: false })
    }
  }
})
