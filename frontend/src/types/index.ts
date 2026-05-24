declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<{}, {}, any>
  export default component
}

interface ApiResponse<T = any> {
  code: number
  message: string
  data: T
  timestamp: number
}

interface PageData<T = any> {
  list: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

interface UserInfo {
  id: number
  username: string
  realName: string
  avatar: string
  phone: string
  email: string
  roles: string[]
  permissions: string[]
  menus: MenuItem[]
}

interface MenuItem {
  id: number
  name: string
  path: string
  component: string
  icon: string
  parentId: number
  sort: number
  type: string
  visible: number
  status: number
  children?: MenuItem[]
}

interface RouteItem {
  path: string
  name?: string
  component?: any
  redirect?: string
  meta?: {
    title?: string
    icon?: string
    hidden?: boolean
  }
  children?: RouteItem[]
}
