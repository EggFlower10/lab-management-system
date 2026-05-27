import { defineStore } from 'pinia'
import router from '@/router'
import { get, post, put } from '@/utils/request'

interface UserState {
  token: string
  userInfo: UserInfo | null
  roles: string[]
  permissions: string[]
  menus: MenuItem[]
}

function createMenuItem(
  id: number,
  name: string,
  path: string,
  icon: string,
  parentId = 0,
  sort = 0,
  children?: MenuItem[]
): MenuItem {
  return {
    id,
    name,
    path,
    component: '',
    icon,
    parentId,
    sort,
    type: 'menu',
    visible: 1,
    status: 1,
    children,
  }
}

const fixedMenus: MenuItem[] = [
  createMenuItem(1, '系统管理', '/system', 'Setting', 0, 1, [
    createMenuItem(11, '用户管理', '/system/user', 'User', 1, 1),
    createMenuItem(12, '角色管理', '/system/role', 'UserFilled', 1, 2),
    createMenuItem(13, '菜单管理', '/system/menu', 'Menu', 1, 3),
    createMenuItem(14, '权限管理', '/system/permission', 'Lock', 1, 4),
    createMenuItem(15, '机构管理', '/system/organization', 'OfficeBuilding', 1, 5),
    createMenuItem(16, '部门管理', '/system/department', 'Grid', 1, 6),
    createMenuItem(17, '操作日志', '/system/log', 'Document', 1, 7),
    createMenuItem(18, '系统配置', '/system/config', 'Tools', 1, 8),
  ]),
  createMenuItem(2, '教学信息管理', '/teaching', 'Reading', 0, 2, [
    createMenuItem(21, '课程管理', '/teaching/course', 'Notebook', 2, 1),
    createMenuItem(22, '学期管理', '/teaching/semester', 'Calendar', 2, 2),
    createMenuItem(23, '校历查看', '/teaching/calendar', 'Calendar', 2, 3),
    createMenuItem(24, '专业管理', '/teaching/major', 'CollectionTag', 2, 4),
    createMenuItem(25, '班级管理', '/teaching/class', 'UserFilled', 2, 5),
    createMenuItem(26, '教学任务', '/teaching/task', 'DocumentCopy', 2, 6),
    createMenuItem(27, '节次管理', '/teaching/time-slot', 'Clock', 2, 7),
  ]),
  createMenuItem(3, '实验教学模块', '/experiment', 'School', 0, 3, [
    createMenuItem(31, '实验项目库', '/experiment/project-library', 'Collection', 3, 1),
    createMenuItem(32, '实验项目开出', '/experiment/project-offer', 'Calendar', 3, 2),
    createMenuItem(33, '实验教学任务', '/experiment/experiment-task', 'Notebook', 3, 3),
    createMenuItem(34, '实验课程教学质量', '/experiment/quality', 'Trophy', 3, 4),
    createMenuItem(35, '实训教学计划', '/experiment/training-plan', 'Document', 3, 5),
  ]),
  createMenuItem(4, '实验室排课预约', '/scheduling', 'Calendar', 0, 4, [
    createMenuItem(41, '排课检索', '/scheduling', 'Search', 4, 1),
    createMenuItem(42, '集中排课', '/scheduling/central', 'Plus', 4, 2),
    createMenuItem(43, '预约申请', '/scheduling/reservation', 'Clock', 4, 3),
    createMenuItem(44, '授课申请', '/scheduling/teaching-request', 'Edit', 4, 4),
    createMenuItem(45, '使用登记', '/scheduling/usage-registration', 'Document', 4, 5),
    createMenuItem(46, '数据统计', '/scheduling/statistics', 'DataAnalysis', 4, 6),
  ]),
  createMenuItem(5, '场馆信息管理', '/venue', 'OfficeBuilding', 0, 5, [
    createMenuItem(51, '校区管理', '/venue/campus', 'MapLocation', 5, 1),
    createMenuItem(52, '楼宇管理', '/venue/building', 'OfficeBuilding', 5, 2),
    createMenuItem(53, '房间管理', '/venue/room', 'House', 5, 3),
    createMenuItem(54, '楼层平面图', '/venue/floor-plan', 'Picture', 5, 4),
  ]),
  createMenuItem(6, '设备管理', '/equipment', 'Box', 0, 6, [
    createMenuItem(61, '设备档案', '/equipment/archive', 'FileText', 6, 1),
    createMenuItem(62, '设备借还', '/equipment/borrow', 'Refresh', 6, 2),
    createMenuItem(63, '库存与统计', '/equipment/inventory', 'PieChart', 6, 3),
  ]),
]

export const useUserStore = defineStore('user', {
  state: (): UserState => ({
    token: localStorage.getItem('token') || '',
    userInfo: null,
    roles: [],
    permissions: [],
    menus: [],
  }),

  getters: {
    isLoggedIn: state => !!state.token,
    username: state => state.userInfo?.username || '',
    realName: state => state.userInfo?.realName || '',
    avatar: state => state.userInfo?.avatar || '',
  },

  actions: {
    async login(loginForm: { username: string; password: string }) {
      const result = await post<{ token: string; user?: any }>('/auth/login', loginForm)

      if (result?.token) {
        this.token = result.token
        localStorage.setItem('token', result.token)
        await this.getUserInfo()
      }

      return result
    },

    async getUserInfo() {
      const result = await get<any>('/auth/info')

      this.userInfo = {
        id: result?.id || 0,
        username: result?.username || '',
        realName: result?.realName || result?.name || '',
        avatar: result?.avatar || '',
        phone: result?.phone || '',
        email: result?.email || '',
        roles: result?.roles || [result?.role || 'admin'],
        permissions: result?.permissions || [],
        menus: result?.menus || fixedMenus,
      }

      this.roles = result?.roles || [result?.role || 'admin']
      this.permissions = result?.permissions || []
      this.menus = result?.menus || fixedMenus

      return result
    },

    async getMenus() {
      return fixedMenus
    },

    async logout() {
      try {
        await post('/auth/logout')
      } catch {
        // Ignore logout API failures and clear local state anyway.
      } finally {
        this.resetState()
        router.push('/login')
      }
    },

    async updatePassword(data: { oldPassword: string; newPassword: string; confirmPassword: string }) {
      return put('/auth/password', data)
    },

    resetState() {
      this.token = ''
      this.userInfo = null
      this.roles = []
      this.permissions = []
      this.menus = []
      localStorage.removeItem('token')
    },
  },
})
