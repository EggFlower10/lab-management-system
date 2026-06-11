function pad(number) {
  return number < 10 ? `0${number}` : `${number}`
}

function toDate(value) {
  if (!value) {
    return new Date()
  }
  if (value instanceof Date) {
    return value
  }
  return new Date(value)
}

function formatDate(value) {
  const date = toDate(value)
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

function formatDateTime(value) {
  const date = toDate(value)
  return `${formatDate(date)} ${pad(date.getHours())}:${pad(date.getMinutes())}`
}

function formatTime(value) {
  const date = toDate(value)
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`
}

function formatTodayLabel() {
  return formatDate(new Date())
}

function getWeekdayLabel(value) {
  const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
  return weekdays[toDate(value).getDay()]
}

function getWeekIndex(value) {
  const current = toDate(value)
  const start = new Date(current.getFullYear(), 0, 1)
  const diff = current.getTime() - start.getTime()
  return Math.ceil((diff / 86400000 + start.getDay() + 1) / 7)
}

function clone(data) {
  return JSON.parse(JSON.stringify(data))
}

function createStatusClass(status) {
  const map = {
    available: 'status-available',
    occupied: 'status-occupied',
    maintenance: 'status-maintenance',
    pending: 'status-pending',
    approved: 'status-approved',
    rejected: 'status-rejected',
    cancelled: 'status-cancelled',
    completed: 'status-completed',
    returned: 'status-completed',
    idle: 'status-available',
    reserved: 'status-pending',
    borrowed: 'status-borrowed',
    scrapped: 'status-maintenance',
    overdue: 'status-overdue',
    'in-use': 'status-in-use'
  }
  return map[status] || 'status-pending'
}

module.exports = {
  pad,
  toDate,
  formatDate,
  formatDateTime,
  formatTime,
  formatTodayLabel,
  getWeekdayLabel,
  getWeekIndex,
  clone,
  createStatusClass
}
