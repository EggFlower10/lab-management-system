import { post } from '@/utils/request'

export async function downloadDocx(
  url: string,
  filename: string,
  payload: Record<string, any> = {},
  _config?: Record<string, any>
) {
  const response = await post(url, payload, {
    responseType: 'blob',
  })

  const blob = new Blob([response], {
    type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  })

  const objectUrl = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = objectUrl
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  window.URL.revokeObjectURL(objectUrl)
}
