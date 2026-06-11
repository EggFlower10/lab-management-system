const { getCourses, getCourseCheckins, getReports, submitCourseCheckIn, submitCourseCheckOut } = require('../../utils/service')
const { ensurePageAccess, getCurrentUser } = require('../../utils/auth')

Page({
  data: {
    currentUser: null,
    courses: [],
    heroTitle: '课程实验中心',
    heroSubtitle: '查看实验课程、签到状态与报告提交进度。',
    canManageCourses: false,
    primaryActionLabel: '发布课程'
  },

  onShow() {
    const currentUser = ensurePageAccess()
    if (!currentUser) {
      return
    }
    this.setData({
      currentUser,
      canManageCourses: ['teacher', 'admin'].includes(currentUser.role),
      primaryActionLabel: currentUser.role === 'admin' ? '创建课程' : '发布课程'
    })
    this.loadData()
  },

  async loadData() {
    const currentUser = getCurrentUser()
    const [courses, checkins, reports] = await Promise.all([
      getCourses(),
      getCourseCheckins(),
      getReports()
    ])
    const mapped = courses.map((course) => ({
      ...course,
      signedIn: checkins.some((item) => item.courseId === course.id && item.userId === currentUser.id && item.signInAt),
      signedOut: checkins.some((item) => item.courseId === course.id && item.userId === currentUser.id && item.signOutAt),
      reportSubmitted: reports.some((item) => item.courseId === course.id && item.userId === currentUser.id),
      signedCount: checkins.filter((item) => item.courseId === course.id && item.signInAt).length,
      signedOutCount: checkins.filter((item) => item.courseId === course.id && item.signOutAt).length,
      reportCount: reports.filter((item) => item.courseId === course.id).length
    }))
    const heroSubtitleMap = {
      student: '查看实验课程、完成签到签退并提交实验报告。',
      teacher: '发布课程、管理签到并录入实验成绩。',
      admin: '创建课程、排课并查看签到统计与成绩管理。'
    }
    this.setData({
      courses: mapped,
      heroSubtitle: heroSubtitleMap[currentUser.role] || '查看实验课程安排。'
    })
  },

  async signIn(event) {
    const id = event.currentTarget.dataset.id
    try {
      await submitCourseCheckIn(id)
      wx.showToast({ title: '签到成功', icon: 'success' })
      this.loadData()
    } catch (error) {
      wx.showToast({ title: error.message || '签到失败', icon: 'none' })
    }
  },

  async signOut(event) {
    const id = event.currentTarget.dataset.id
    try {
      await submitCourseCheckOut(id)
      wx.showToast({ title: '签退成功', icon: 'success' })
      this.loadData()
    } catch (error) {
      wx.showToast({ title: error.message || '签退失败', icon: 'none' })
    }
  },

  submitReport(event) {
    const { id, name } = event.currentTarget.dataset
    wx.navigateTo({ url: `/pages/report/submit/index?courseId=${id}&courseName=${name}` })
  },

  openPublish() {
    wx.navigateTo({ url: '/pages/course/publish/index' })
  },

  openAttendance(event) {
    const { id, name } = event.currentTarget.dataset
    wx.navigateTo({ url: `/pages/course/attendance/index?courseId=${id}&courseName=${name}` })
  },

  openGrades(event) {
    const { id, name } = event.currentTarget.dataset
    wx.navigateTo({ url: `/pages/course/grades/index?courseId=${id}&courseName=${name}` })
  },

  openApproval() {
    wx.navigateTo({ url: '/pages/admin/approval/index' })
  }
})
