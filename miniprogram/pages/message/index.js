const { MESSAGE_CATEGORY } = require('../../utils/constants')
const { getMessages, markMessageRead, getCurrentUser } = require('../../utils/service')

const MESSAGE_CATEGORY_LABEL_MAP = MESSAGE_CATEGORY.reduce((result, item) => {
  if (item.key !== 'all') {
    result[item.key] = item.label
  }
  return result
}, {})

Page({
  data: {
    categories: MESSAGE_CATEGORY,
    activeCategory: 'all',
    list: []
  },

  onShow() {
    const user = getCurrentUser()
    if (!user) {
      wx.reLaunch({ url: '/pages/login/index' })
      return
    }
    this.loadData()
  },

  async loadData() {
    const list = await getMessages({
      category: this.data.activeCategory
    })
    this.setData({
      list: list.map((item) => ({
        ...item,
        categoryLabel: MESSAGE_CATEGORY_LABEL_MAP[item.category] || item.category
      }))
    })
  },

  changeCategory(event) {
    this.setData({
      activeCategory: event.currentTarget.dataset.category
    })
    this.loadData()
  },

  openMessage(event) {
    const id = event.currentTarget.dataset.id
    markMessageRead(id)
    this.loadData()
  }
})
