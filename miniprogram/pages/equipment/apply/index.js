const { getEquipment, createEquipmentRequest, formatDate } = require('../../../utils/service')
const { ensurePageAccess } = require('../../../utils/auth')
const { requestEquipmentBorrowSubscription } = require('../../../utils/subscribe')
const { formatTime } = require('../../../utils/format')

function getDefaultReturnDate(baseDate) {
  return formatDate(new Date(baseDate.getTime() + 86400000))
}

Page({
  data: {
    equipment: null,
    today: formatDate(new Date()),
    form: {
      borrowDate: formatDate(new Date()),
      borrowTime: formatTime(new Date()),
      returnDate: getDefaultReturnDate(new Date()),
      returnTime: formatTime(new Date()),
      purpose: '',
      notifySubscribe: true,
      notifyMiniProgram: true
    },
    submitting: false
  },

  async onLoad(options) {
    const currentUser = ensurePageAccess()
    if (!currentUser) {
      return
    }
    try {
      const list = await getEquipment({ status: 'all' })
      const equipment = list.find((item) => `${item.id}` === `${options.id}`)
      this.setData({ equipment })
    } catch (error) {
      wx.showToast({
        title: error.message || '设备信息加载失败',
        icon: 'none'
      })
    }
  },

  handleInput(event) {
    const field = event.currentTarget.dataset.field
    this.setData({
      [`form.${field}`]: event.detail.value
    })
  },

  handleDate(event) {
    const field = event.currentTarget.dataset.field
    const value = event.detail.value
    this.setData({
      [`form.${field}`]: value
    })
    if (field === 'borrowDate' && this.data.form.returnDate < value) {
      this.setData({
        'form.returnDate': value
      })
    }
  },

  handleTime(event) {
    const field = event.currentTarget.dataset.field
    this.setData({
      [`form.${field}`]: event.detail.value
    })
  },

  handleSwitch(event) {
    const field = event.currentTarget.dataset.field
    this.setData({
      [`form.${field}`]: !!event.detail.value
    })
  },

  async submit() {
    const { form, equipment, submitting } = this.data
    if (submitting) {
      return
    }
    if (!equipment || !form.purpose.trim()) {
      wx.showToast({ title: '请填写完整申请信息', icon: 'none' })
      return
    }
    this.setData({ submitting: true })
    wx.showLoading({ title: '提交中' })
    try {
      if (form.notifySubscribe) {
        await requestEquipmentBorrowSubscription()
      }
      await createEquipmentRequest({
        equipmentId: equipment.id,
        borrowDate: form.borrowDate,
        borrowTime: form.borrowTime,
        returnDate: form.returnDate,
        returnTime: form.returnTime,
        purpose: form.purpose.trim(),
        notifySubscribe: form.notifySubscribe,
        notifyMiniProgram: form.notifyMiniProgram
      })
      wx.hideLoading()
      wx.showToast({ title: '申请已提交', icon: 'success' })
      setTimeout(() => {
        wx.navigateBack()
      }, 500)
    } catch (error) {
      wx.hideLoading()
      wx.showToast({ title: error.message || '提交失败', icon: 'none' })
    } finally {
      this.setData({ submitting: false })
    }
  }
})
