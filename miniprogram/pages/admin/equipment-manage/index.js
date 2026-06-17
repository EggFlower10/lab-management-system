const { getEquipment, saveEquipment } = require('../../../utils/service')
const { ensurePageAccess } = require('../../../utils/auth')

const STATUS_OPTIONS = [
  { key: 'idle', label: '可借用' },
  { key: 'borrowed', label: '借用中' },
  { key: 'maintenance', label: '维护中' },
  { key: 'scrapped', label: '已报废' }
]

function createEmptyForm() {
  return {
    id: '',
    name: '',
    no: '',
    model: '',
    category: '',
    status: 'idle',
    location: ''
  }
}

Page({
  data: {
    list: [],
    statusOptions: STATUS_OPTIONS,
    form: createEmptyForm()
  },

  onShow() {
    const currentUser = ensurePageAccess({ route: '/pages/admin/equipment-manage/index' })
    if (!currentUser) {
      return
    }
    this.loadData()
  },

  async loadData() {
    const list = await getEquipment({ status: 'all' })
    this.setData({ list })
  },

  handleInput(event) {
    const field = event.currentTarget.dataset.field
    this.setData({
      [`form.${field}`]: event.detail.value
    })
  },

  selectStatus(event) {
    this.setData({
      'form.status': event.currentTarget.dataset.status
    })
  },

  editItem(event) {
    const id = event.currentTarget.dataset.id
    const target = this.data.list.find((item) => item.id === id)
    if (!target) {
      return
    }
    this.setData({
      form: {
        id: target.id,
        name: target.name,
        no: target.no,
        model: target.model,
        category: target.category,
        status: target.status,
        location: target.location
      }
    })
  },

  scrapItem(event) {
    const id = event.currentTarget.dataset.id
    const target = this.data.list.find((item) => item.id === id)
    if (!target) {
      return
    }
    if (target.status === 'scrapped') {
      wx.showToast({ title: '该设备已报废', icon: 'none' })
      return
    }

    wx.showModal({
      title: '确认报废',
      content: `设备“${target.name}”报废后会保留在台账中，但不可再借用，是否继续？`,
      confirmText: '确认报废',
      confirmColor: '#c53b3b',
      success: async (result) => {
        if (!result.confirm) {
          return
        }
        try {
          await saveEquipment({
            id: target.id,
            name: target.name,
            no: target.no,
            model: target.model,
            category: target.category,
            status: 'scrapped',
            location: target.location
          })
          wx.showToast({ title: '设备已报废', icon: 'success' })
          if (this.data.form.id === target.id) {
            this.resetForm()
          }
          this.loadData()
        } catch (error) {
          wx.showToast({ title: error.message || '报废失败', icon: 'none' })
        }
      }
    })
  },

  resetForm() {
    this.setData({
      form: createEmptyForm()
    })
  },

  async submit() {
    try {
      await saveEquipment(this.data.form)
      wx.showToast({ title: this.data.form.id ? '设备已更新' : '设备已新增', icon: 'success' })
      this.resetForm()
      this.loadData()
    } catch (error) {
      wx.showToast({ title: error.message || '保存失败', icon: 'none' })
    }
  }
})
