const { BACKEND_BASE_URL } = require('../config')

function request(options) {
  const app = getApp()
  const baseUrl = app && app.globalData && app.globalData.backendBaseUrl
    ? app.globalData.backendBaseUrl
    : BACKEND_BASE_URL
  const token = wx.getStorageSync('lms.session.token')

  return new Promise((resolve, reject) => {
    if (!baseUrl) {
      reject(new Error('未配置后端接口域名'))
      return
    }

    wx.request({
      url: `${baseUrl}${options.url}`,
      method: options.method || 'GET',
      data: options.data || {},
      timeout: options.timeout || 10000,
      header: {
        'content-type': 'application/json',
        Authorization: token ? `Bearer ${token}` : ''
      },
      success(res) {
        const { data } = res
        if (res.statusCode >= 200 && res.statusCode < 300 && (!data.code || data.code === 200)) {
          resolve(data.data)
          return
        }
        reject(new Error((data && data.message) || '接口请求失败'))
      },
      fail(error) {
        reject(error)
      }
    })
  })
}

module.exports = {
  request
}
