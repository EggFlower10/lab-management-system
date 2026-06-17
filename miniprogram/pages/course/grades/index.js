const { getCourseGradebook, saveCourseScores } = require('../../../utils/service')
const { ensurePageAccess } = require('../../../utils/auth')

Page({
  data: {
    courseId: '',
    courseName: '',
    course: null,
    students: [],
    submitting: false
  },

  onLoad(options) {
    const currentUser = ensurePageAccess({ route: '/pages/course/grades/index' })
    if (!currentUser) {
      return
    }
    this.setData({
      courseId: options.courseId || '',
      courseName: options.courseName || ''
    })
  },

  onShow() {
    if (!this.data.courseId) {
      return
    }
    this.loadData()
  },

  async loadData() {
    try {
      const data = await getCourseGradebook(this.data.courseId)
      this.setData(data)
    } catch (error) {
      wx.showToast({ title: error.message || '加载成绩簿失败', icon: 'none' })
    }
  },

  handleScoreInput(event) {
    const index = event.currentTarget.dataset.index
    this.setData({
      [`students[${index}].score`]: event.detail.value
    })
  },

  handleCommentInput(event) {
    const index = event.currentTarget.dataset.index
    this.setData({
      [`students[${index}].comment`]: event.detail.value
    })
  },

  async submit() {
    if (this.data.submitting) {
      return
    }
    this.setData({ submitting: true })
    wx.showLoading({ title: '保存中' })
    try {
      await saveCourseScores(
        this.data.courseId,
        this.data.students.map((item) => ({
          studentId: item.id,
          studentName: item.name,
          score: item.score,
          comment: item.comment
        }))
      )
      wx.hideLoading()
      wx.showToast({ title: '成绩已保存', icon: 'success' })
      this.loadData()
    } catch (error) {
      wx.hideLoading()
      wx.showToast({ title: error.message || '保存失败', icon: 'none' })
    } finally {
      this.setData({ submitting: false })
    }
  }
})
