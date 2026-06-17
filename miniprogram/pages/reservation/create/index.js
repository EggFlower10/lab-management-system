const { TIME_SLOTS } = require('../../../utils/constants')
const { getLabDetail, createReservation, getCurrentUser, formatDate } = require('../../../utils/service')

Page({
  data: {
    labId: '',
    lab: null,
    timeSlots: TIME_SLOTS,
    timeSlotIndex: 0,
    today: formatDate(new Date()),
    form: {
      projectName: '',
      purpose: '',
      date: formatDate(new Date()),
      phone: '',
      projectLeader: '',
      memberGrade: '2023级',
      memberClass: '',
      headCount: 1,
      remark: ''
    },
    submitting: false
  },

  async onLoad(options) {
    const currentUser = getCurrentUser()
    if (!currentUser) {
      wx.reLaunch({ url: '/pages/login/index' })
      return
    }

    this.setData({
      'form.phone': currentUser.phone || '',
      'form.projectLeader': currentUser.name || ''
    })

    if (options.labId) {
      const lab = await getLabDetail(options.labId)
      this.setData({
        labId: options.labId,
        lab
      })
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

  handleSlotChange(event) {
    this.setData({
      timeSlotIndex: Number(event.detail.value)
    })
  },

  async submitForm() {
    const { form, lab, timeSlotIndex, timeSlots, submitting } = this.data
    if (submitting) {
      return
    }
    if (!lab) {
      wx.showToast({ title: '请先选择实验室', icon: 'none' })
      return
    }
    if (!form.projectName || !form.purpose || !form.memberClass) {
      wx.showToast({ title: '请填写完整信息', icon: 'none' })
      return
    }

    this.setData({ submitting: true })
    wx.showLoading({ title: '提交中' })
    try {
      const record = await createReservation({
        labId: lab.id,
        projectName: form.projectName,
        purpose: form.purpose,
        date: form.date,
        timeSlot: timeSlots[timeSlotIndex],
        phone: form.phone,
        projectLeader: form.projectLeader,
        memberGrade: form.memberGrade,
        memberClass: form.memberClass,
        headCount: Number(form.headCount),
        remark: form.remark
      })
      wx.hideLoading()
      wx.showToast({ title: '预约提交成功', icon: 'success' })
      setTimeout(() => {
        wx.redirectTo({ url: `/pages/reservation/detail/index?id=${record.id}` })
      }, 500)
    } catch (error) {
      wx.hideLoading()
      wx.showToast({ title: error.message || '提交失败', icon: 'none' })
    } finally {
      this.setData({ submitting: false })
    }
  }
})
