const { getReservationDetail, getCurrentUser, checkInReservation } = require('../../../utils/service')

function buildCheckInQr(code) {
  const rows = []
  const seed = (code || '').split('').reduce((sum, char) => sum + char.charCodeAt(0), 0)
  const size = 15

  for (let y = 0; y < size; y += 1) {
    const cells = []
    for (let x = 0; x < size; x += 1) {
      const inLeftTop = x <= 4 && y <= 4
      const inRightTop = x >= size - 5 && y <= 4
      const inLeftBottom = x <= 4 && y >= size - 5
      const finder = inLeftTop || inRightTop || inLeftBottom
      const timing = (x === 6 || y === 6) && ((x > 4 && x < size - 5) || (y > 4 && y < size - 5))
      const active = finder || timing || ((x * 17 + y * 11 + seed + x * y) % 7 < 3)
      cells.push({ id: `${x}-${y}`, active })
    }
    rows.push({ id: y, cells })
  }

  return rows
}

Page({
  data: {
    detail: null,
    qrRows: [],
    checkingIn: false,
    reservationId: ''
  },

  onLoad(options) {
    const currentUser = getCurrentUser()
    if (!currentUser) {
      wx.reLaunch({ url: '/pages/login/index' })
      return
    }
    if (options.id) {
      this.setData({ reservationId: options.id })
      this.loadData(options.id)
    }
  },

  async loadData(id) {
    try {
      const detail = await getReservationDetail(id)
      this.setData({
        detail,
        qrRows: buildCheckInQr(detail.checkInCode || detail.code)
      })
    } catch (error) {
      wx.showToast({ title: error.message || '加载失败', icon: 'none' })
    }
  },

  handleCopyCode() {
    const { detail } = this.data
    if (!detail || !detail.checkInCode) {
      wx.showToast({ title: '当前还没有签到码', icon: 'none' })
      return
    }
    wx.setClipboardData({ data: detail.checkInCode })
  },

  async handleCheckIn() {
    const { detail, checkingIn } = this.data
    if (!detail || !detail.canCheckIn || checkingIn) {
      return
    }

    this.setData({ checkingIn: true })
    try {
      await checkInReservation(detail.id)
      await this.loadData(detail.id)
      wx.showToast({ title: '签到成功', icon: 'success' })
    } catch (error) {
      wx.showToast({ title: error.message || '签到失败', icon: 'none' })
    } finally {
      this.setData({ checkingIn: false })
    }
  }
})
