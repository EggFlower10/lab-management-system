function getTemplateIds() {
  const app = getApp && getApp()
  const templates = app && app.globalData && app.globalData.subscriptionTemplates
  const ids = templates && templates.equipmentBorrowLifecycle
  return Array.isArray(ids) ? ids.filter(Boolean) : []
}

function requestEquipmentBorrowSubscription() {
  const tmplIds = getTemplateIds()
  if (!tmplIds.length || typeof wx.requestSubscribeMessage !== 'function') {
    return Promise.resolve({
      requested: false,
      reason: 'template-not-configured'
    })
  }

  return new Promise((resolve) => {
    wx.requestSubscribeMessage({
      tmplIds,
      success: (result) => {
        resolve({
          requested: true,
          result
        })
      },
      fail: (error) => {
        resolve({
          requested: true,
          error
        })
      }
    })
  })
}

module.exports = {
  requestEquipmentBorrowSubscription
}
