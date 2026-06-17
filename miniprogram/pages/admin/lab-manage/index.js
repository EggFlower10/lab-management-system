const { getLabs, saveLab } = require('../../../utils/service')
const { ensurePageAccess } = require('../../../utils/auth')

const STATUS_OPTIONS = [
  { key: 'available', label: '空闲可约' },
  { key: 'occupied', label: '当前使用中' },
  { key: 'maintenance', label: '维护中' }
]

function createEmptyForm() {
  return {
    id: '',
    name: '',
    building: '',
    roomNumber: '',
    capacity: '',
    status: 'available',
    openTime: '',
    description: '',
    guide: ''
  }
}

Page({
  data: {
    list: [],
    statusOptions: STATUS_OPTIONS,
    form: createEmptyForm()
  },

  onShow() {
    const currentUser = ensurePageAccess({ route: '/pages/admin/lab-manage/index' })
    if (!currentUser) {
      return
    }
    this.loadData()
  },

  async loadData() {
    const list = await getLabs({ status: 'all' })
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
        building: target.building,
        roomNumber: target.roomNumber,
        capacity: `${target.capacity}`,
        status: target.status,
        openTime: target.openTime,
        description: target.description,
        guide: target.guide
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
      await saveLab(this.data.form)
      wx.showToast({ title: this.data.form.id ? '实验室已更新' : '实验室已新增', icon: 'success' })
      this.resetForm()
      this.loadData()
    } catch (error) {
      wx.showToast({ title: error.message || '保存失败', icon: 'none' })
    }
  }
})
