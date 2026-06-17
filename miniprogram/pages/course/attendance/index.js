const { getCourseAttendance, manageCourseAttendance } = require('../../../utils/service')
const { ensurePageAccess } = require('../../../utils/auth')

Page({
  data: {
    courseId: '',
    courseName: '',
    course: null,
    students: []
  },

  onLoad(options) {
    const currentUser = ensurePageAccess({ route: '/pages/course/attendance/index' })
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
      const data = await getCourseAttendance(this.data.courseId)
      this.setData(data)
    } catch (error) {
      wx.showToast({ title: error.message || '加载签到数据失败', icon: 'none' })
    }
  },

  async updateAttendance(event) {
    const { action, studentId } = event.currentTarget.dataset
    try {
      await manageCourseAttendance(this.data.courseId, studentId, action)
      wx.showToast({ title: action === 'reset' ? '已重置' : action === 'signOut' ? '已签退' : '已签到', icon: 'success' })
      this.loadData()
    } catch (error) {
      wx.showToast({ title: error.message || '更新失败', icon: 'none' })
    }
  }
})
