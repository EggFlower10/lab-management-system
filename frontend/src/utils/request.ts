import axios, { AxiosError, AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios'
import { ElMessage, ElMessageBox } from 'element-plus'
import NProgress from 'nprogress'
import { useUserStore } from '@/stores/user'
import router from '@/router'

NProgress.configure({ showSpinner: false })

const service: AxiosInstance = axios.create({
  baseURL: '/api/v1',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json;charset=UTF-8',
  },
})

service.interceptors.request.use(
  (config) => {
    NProgress.start()
    const userStore = useUserStore()

    if (userStore.token) {
      config.headers.Authorization = `Bearer ${userStore.token}`
    }

    if (config.method?.toUpperCase() === 'GET') {
      delete config.data
    }

    return config
  },
  (error: AxiosError) => {
    NProgress.done()
    return Promise.reject(error)
  }
)

service.interceptors.response.use(
  async (response: AxiosResponse<ApiResponse | Blob>) => {
    NProgress.done()

    if (response.config.responseType === 'blob') {
      const contentType = String(response.headers['content-type'] || '')

      if (contentType.includes('application/json')) {
        const blob = response.data as Blob
        const text = await blob.text()

        try {
          const result = JSON.parse(text) as ApiResponse
          ElMessage.error(result.message || '导出失败')
          return Promise.reject(new Error(result.message || '导出失败'))
        } catch {
          ElMessage.error('导出失败')
          return Promise.reject(new Error('导出失败'))
        }
      }

      return response.data
    }

    const { code, message, data } = response.data as ApiResponse

    if (code === 200) {
      return data
    }

    ElMessage.error(message || '请求失败')
    return Promise.reject(new Error(message || '请求失败'))
  },
  async (error: AxiosError<ApiResponse | Blob>) => {
    NProgress.done()
    const showErrorMsg = (error.config as RequestOptions | undefined)?.showErrorMsg !== false

    if (error.response) {
      const { status, data } = error.response
      let errorMessage = '请求失败'

      if (data instanceof Blob) {
        try {
          const text = await data.text()
          const result = JSON.parse(text) as ApiResponse
          errorMessage = result.message || errorMessage
        } catch {
          errorMessage = '请求失败'
        }
      } else if (data?.message) {
        errorMessage = data.message
      }

      switch (status) {
        case 401:
          if (showErrorMsg) {
            ElMessageBox.confirm('登录状态已过期，请重新登录', '系统提示', {
              confirmButtonText: '重新登录',
              cancelButtonText: '取消',
              type: 'warning',
            }).then(() => {
              const userStore = useUserStore()
              userStore.logout()
              router.push('/login')
            })
          }
          break
        case 403:
          if (showErrorMsg) {
            ElMessage.error('没有操作权限')
          }
          break
        case 404:
          if (showErrorMsg) {
            ElMessage.error('请求资源不存在')
          }
          break
        case 500:
          if (showErrorMsg) {
            ElMessage.error(errorMessage || '服务器内部错误')
          }
          break
        default:
          if (showErrorMsg) {
            ElMessage.error(errorMessage)
          }
      }
    } else {
      if (showErrorMsg) {
        ElMessage.error('网络连接异常')
      }
    }

    return Promise.reject(error)
  }
)

export interface RequestOptions extends AxiosRequestConfig {
  showSuccessMsg?: boolean
  showErrorMsg?: boolean
}

export function request<T = any>(config: RequestOptions): Promise<T> {
  return service.request<any, T>(config)
}

export function get<T = any>(url: string, params?: any, config?: RequestOptions): Promise<T> {
  return request<T>({ ...config, method: 'GET', url, params })
}

export function post<T = any>(url: string, data?: any, config?: RequestOptions): Promise<T> {
  return request<T>({ ...config, method: 'POST', url, data })
}

export function put<T = any>(url: string, data?: any, config?: RequestOptions): Promise<T> {
  return request<T>({ ...config, method: 'PUT', url, data })
}

export function del<T = any>(url: string, config?: RequestOptions): Promise<T> {
  return request<T>({ ...config, method: 'DELETE', url })
}

export default service
