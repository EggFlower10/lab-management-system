import dayjs from 'dayjs'
import 'dayjs/locale/zh-cn'
import relativeTime from 'dayjs/plugin/relativeTime'

dayjs.locale('zh-cn')
dayjs.extend(relativeTime)

export function formatDate(date: string | Date, format: string = 'YYYY-MM-DD'): string {
  if (!date) return ''
  return dayjs(date).format(format)
}

export function formatDateTime(date: string | Date, format: string = 'YYYY-MM-DD HH:mm:ss'): string {
  if (!date) return ''
  return dayjs(date).format(format)
}

export function formatTime(date: string | Date, format: string = 'HH:mm:ss'): string {
  if (!date) return ''
  return dayjs(date).format(format)
}

export function fromNow(date: string | Date): string {
  if (!date) return ''
  return dayjs(date).fromNow()
}

export function getWeekDay(date: string | Date): string {
  const weekDays = ['日', '一', '二', '三', '四', '五', '六']
  return '星期' + weekDays[dayjs(date).day()]
}

export function getWeekNumber(date: string | Date): number {
  const start = new Date(dayjs(date).startOf('year').toDate())
  const current = new Date(dayjs(date).toDate())
  start.setHours(0, 0, 0, 0)
  const diff = current.getTime() - start.getTime()
  const oneWeek = 604800000
  return Math.ceil((diff + start.getDay() * 86400000) / oneWeek)
}
