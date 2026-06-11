const { TIME_SLOTS, getLabs, createCourse, formatDate, getAvailableTeachers } = require('../../../utils/service')
const { ensurePageAccess } = require('../../../utils/auth')

Page({
  data: {
    currentUser: null,
    labs: [],
    labIndex: 0,
    selectedLabText: '请选择实验室',
    teachers: [],
    teacherIndex: 0,
    selectedTeacherText: '请选择授课教师',
    timeSlots: TIME_SLOTS,
    timeSlotIndex: 0,
    heroTitle: '发布实验课程',
    heroSubtitle: '教师可在移动端快速新增实验课程，并同步到课程中心供学生查看。',
    submitLabel: '发布课程',
    form: {
      name: '',
      date: formatDate(new Date()),
      timeSlot: TIME_SLOTS[0],
      labId: '',
      className: '',
      teacherId: '',
      teacherName: ''
    },
    submitting: false
  },

  async onLoad() {
    const currentUser = ensurePageAccess({ route: '/pages/course/publish/index' })
    if (!currentUser) {
      return
    }
    this.setData({
      currentUser,
      heroTitle: currentUser.role === 'admin' ? '创建课程与排课' : '发布实验课程',
      heroSubtitle: currentUser.role === 'admin'
        ? '管理员可统一创建课程、安排实验室时段，并指定授课教师。'
        : '教师可在移动端快速新增实验课程，并同步到课程中心供学生查看。',
      submitLabel: currentUser.role === 'admin' ? '创建课程' : '发布课程'
    })
    await Promise.all([
      this.loadLabs(),
      currentUser.role === 'admin' ? this.loadTeachers() : Promise.resolve()
    ])
  },

  async loadLabs() {
    const labs = await getLabs({ status: 'all' })
    this.setData({
      labs,
      selectedLabText: labs[0] ? `${labs[0].name} · ${labs[0].roomNumber}` : '请选择实验室',
      'form.labId': labs[0] ? labs[0].id : ''
    })
  },

  async loadTeachers() {
    const teachers = await getAvailableTeachers()
    const target = teachers[0] || null
    this.setData({
      teachers,
      selectedTeacherText: target ? `${target.name} · ${target.department}` : '暂无可选教师',
      'form.teacherId': target ? target.id : '',
      'form.teacherName': target ? target.name : ''
    })
    if (!target) {
      wx.showToast({ title: '暂无可用教师，请先在用户管理中确认教师账号可用', icon: 'none' })
    }
  },

  handleInput(event) {
    const field = event.currentTarget.dataset.field
    this.setData({
      [`form.${field}`]: event.detail.value
    })
  },

  handleDateChange(event) {
    this.setData({
      'form.date': event.detail.value
    })
  },

  handleTimeSlotChange(event) {
    const index = Number(event.detail.value)
    this.setData({
      timeSlotIndex: index,
      'form.timeSlot': this.data.timeSlots[index]
    })
  },

  handleLabChange(event) {
    const index = Number(event.detail.value)
    const target = this.data.labs[index]
    this.setData({
      labIndex: index,
      selectedLabText: target ? `${target.name} · ${target.roomNumber}` : '请选择实验室',
      'form.labId': target ? target.id : ''
    })
  },

  handleTeacherChange(event) {
    const index = Number(event.detail.value)
    const target = this.data.teachers[index]
    this.setData({
      teacherIndex: index,
      selectedTeacherText: target ? `${target.name} · ${target.department}` : '请选择授课教师',
      'form.teacherId': target ? target.id : '',
      'form.teacherName': target ? target.name : ''
    })
  },

  async submit() {
    if (this.data.submitting) {
      return
    }

    this.setData({ submitting: true })
    wx.showLoading({ title: '发布中' })
    try {
      await createCourse(this.data.form)
      wx.hideLoading()
      wx.showToast({ title: '课程已发布', icon: 'success' })
      setTimeout(() => {
        wx.navigateBack()
      }, 500)
    } catch (error) {
      wx.hideLoading()
      wx.showToast({ title: error.message || '发布失败', icon: 'none' })
    } finally {
      this.setData({ submitting: false })
    }
  }
})
