const { getConsumables, createConsumableRequest } = require('../../../utils/service')
const { getCurrentUser } = require('../../../utils/auth')

const PURPOSE_PRESETS = ['实验教学', '课程作业', '项目制作', '设备维护']

Page({
  data: {
    currentUser: null,
    item: null,
    purposePresets: PURPOSE_PRESETS,
    form: {
      quantity: '1',
      purpose: ''
    },
    submitting: false,
    flowText: '',
    submitLabel: '提交耗材申请',
    approvalModeLabel: '待管理员审批'
  },

  async onLoad(options) {
    const currentUser = getCurrentUser()
    if (!currentUser) {
      wx.reLaunch({ url: '/pages/login/index' })
      return
    }

    try {
      const list = await getConsumables()
      const item = list.find((entry) => `${entry.id}` === `${options.id}`)
      if (!item) {
        wx.showToast({ title: '未找到耗材信息', icon: 'none' })
        setTimeout(() => {
          wx.navigateBack()
        }, 500)
        return
      }

      this.setData({
        currentUser,
        item: {
          ...item,
          isLowStock: Number(item.stock) <= Number(item.warningValue),
          outOfStock: Number(item.stock) <= 0
        },
        flowText: currentUser.role === 'admin'
          ? '管理员提交后将直接通过并扣减库存，系统会同步保留本次领用记录。'
          : '提交后由管理员审批，通过后自动扣减库存并更新申请状态。',
        submitLabel: currentUser.role === 'admin' ? '立即领用' : '提交耗材申请',
        approvalModeLabel: currentUser.role === 'admin' ? '直接通过' : '待管理员审批'
      })
    } catch (error) {
      wx.showToast({ title: error.message || '加载耗材信息失败', icon: 'none' })
    }
  },

  handleInput(event) {
    const field = event.currentTarget.dataset.field
    this.setData({
      [`form.${field}`]: event.detail.value
    })
  },

  usePreset(event) {
    const value = event.currentTarget.dataset.value
    this.setData({
      'form.purpose': value
    })
  },

  async submit() {
    const { item, form, submitting, currentUser } = this.data
    if (submitting) {
      return
    }
    if (!item) {
      wx.showToast({ title: '耗材信息加载失败', icon: 'none' })
      return
    }

    const quantity = Number(form.quantity)
    const purpose = `${form.purpose || ''}`.trim()
    if (!Number.isInteger(quantity) || quantity <= 0) {
      wx.showToast({ title: '申请数量需为大于 0 的整数', icon: 'none' })
      return
    }
    if (quantity > Number(item.stock)) {
      wx.showToast({ title: '申请数量不能超过当前库存', icon: 'none' })
      return
    }
    if (!purpose) {
      wx.showToast({ title: '请填写使用用途', icon: 'none' })
      return
    }

    this.setData({ submitting: true })
    wx.showLoading({ title: currentUser.role === 'admin' ? '领用中' : '提交中' })
    try {
      await createConsumableRequest({
        consumableId: item.id,
        quantity,
        purpose
      })
      wx.hideLoading()
      wx.showToast({
        title: currentUser.role === 'admin' ? '领用成功' : '申请已提交',
        icon: 'success'
      })
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
