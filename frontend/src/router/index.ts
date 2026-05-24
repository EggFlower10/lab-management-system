import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router'
import NProgress from 'nprogress'
import { useUserStore } from '@/stores/user'

const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/login/index.vue'),
    meta: { title: '登录', hidden: true },
  },
  {
    path: '/',
    name: 'Layout',
    component: () => import('@/layouts/MainLayout.vue'),
    redirect: '/dashboard',
    children: [
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('@/views/dashboard/index.vue'),
        meta: { title: '', icon: 'HomeFilled' },
      },
      // 系统管理
      {
        path: 'system/user',
        name: 'UserManagement',
        component: () => import('@/views/system/user/index.vue'),
        meta: { title: '用户管理' },
      },
      {
        path: 'system/role',
        name: 'RoleManagement',
        component: () => import('@/views/system/role/index.vue'),
        meta: { title: '角色管理' },
      },
      {
        path: 'system/menu',
        name: 'MenuManagement',
        component: () => import('@/views/system/menu/index.vue'),
        meta: { title: '菜单管理' },
      },
      {
        path: 'system/permission',
        name: 'PermissionManagement',
        component: () => import('@/views/system/permission/index.vue'),
        meta: { title: '权限管理' },
      },
      {
        path: 'system/organization',
        name: 'OrganizationManagement',
        component: () => import('@/views/system/organization/index.vue'),
        meta: { title: '机构管理' },
      },
      {
        path: 'system/department',
        name: 'DepartmentManagement',
        component: () => import('@/views/system/department/index.vue'),
        meta: { title: '部门管理' },
      },
      {
        path: 'system/log',
        name: 'LogManagement',
        component: () => import('@/views/system/log/index.vue'),
        meta: { title: '操作日志' },
      },
      {
        path: 'system/config',
        name: 'ConfigManagement',
        component: () => import('@/views/system/config/index.vue'),
        meta: { title: '系统配置' },
      },
      // 教学信息管理
      {
        path: 'teaching/course',
        name: 'CourseManagement',
        component: () => import('@/views/teaching/course/index.vue'),
        meta: { title: '课程管理' },
      },
      {
        path: 'teaching/semester',
        name: 'SemesterManagement',
        component: () => import('@/views/teaching/semester/index.vue'),
        meta: { title: '学期管理' },
      },
      {
        path: 'teaching/calendar',
        name: 'CalendarView',
        component: () => import('@/views/teaching/calendar/index.vue'),
        meta: { title: '校历查看' },
      },
      {
        path: 'teaching/major',
        name: 'MajorManagement',
        component: () => import('@/views/teaching/major/index.vue'),
        meta: { title: '专业管理' },
      },
      {
        path: 'teaching/class',
        name: 'ClassManagement',
        component: () => import('@/views/teaching/class/index.vue'),
        meta: { title: '班级管理' },
      },
      {
        path: 'teaching/task',
        name: 'TaskManagement',
        component: () => import('@/views/teaching/task/index.vue'),
        meta: { title: '教学任务' },
      },
      {
        path: 'teaching/time-slot',
        name: 'TimeSlotManagement',
        component: () => import('@/views/teaching/time-slot/index.vue'),
        meta: { title: '节次管理' },
      },
      // 实验教学模块
      {
        path: 'experiment/project-library',
        name: 'ProjectLibrary',
        component: () => import('@/views/experiment/project-library/index.vue'),
        meta: { title: '实验项目库' },
      },
      {
        path: 'experiment/project-offer',
        name: 'ProjectOffer',
        component: () => import('@/views/experiment/project-offer/index.vue'),
        meta: { title: '实验项目开出' },
      },
      {
        path: 'experiment/experiment-task',
        name: 'ExperimentTaskManagement',
        component: () => import('@/views/teaching/experiment-task/index.vue'),
        meta: { title: '实验教学任务' },
      },
      {
        path: 'experiment/quality',
        name: 'ExperimentQuality',
        component: () => import('@/views/experiment/quality/index.vue'),
        meta: { title: '实验课程教学质量' },
      },
      {
        path: 'experiment/training-plan',
        name: 'TrainingPlan',
        component: () => import('@/views/experiment/training-plan/index.vue'),
        meta: { title: '实训教学计划' },
      },
      // 实验室排课预约
      {
        path: 'scheduling',
        name: 'SchedulingManagement',
        component: () => import('@/views/scheduling/index.vue'),
        meta: { title: '排课检索' },
      },
      {
        path: 'scheduling/central',
        name: 'CentralScheduling',
        component: () => import('@/views/scheduling/central.vue'),
        meta: { title: '集中排课' },
      },
      {
        path: 'scheduling/reservation',
        name: 'ReservationManagement',
        component: () => import('@/views/scheduling/reservation.vue'),
        meta: { title: '预约申请' },
      },
      {
        path: 'scheduling/teaching-request',
        name: 'TeachingRequestManagement',
        component: () => import('@/views/scheduling/teaching-request.vue'),
        meta: { title: '授课申请' },
      },
      {
        path: 'scheduling/usage-registration',
        name: 'UsageRegistrationManagement',
        component: () => import('@/views/scheduling/usage-registration.vue'),
        meta: { title: '使用登记' },
      },
      {
        path: 'scheduling/statistics',
        name: 'SchedulingStatistics',
        component: () => import('@/views/scheduling/statistics.vue'),
        meta: { title: '数据统计' },
      },
      // 场馆信息管理
      {
        path: 'venue/campus',
        name: 'CampusManagement',
        component: () => import('@/views/venue/campus/index.vue'),
        meta: { title: '校区管理' },
      },
      {
        path: 'venue/building',
        name: 'BuildingManagement',
        component: () => import('@/views/venue/building/index.vue'),
        meta: { title: '楼宇管理' },
      },
      {
        path: 'venue/room',
        name: 'RoomManagement',
        component: () => import('@/views/venue/room/index.vue'),
        meta: { title: '房间管理' },
      },
      {
        path: 'venue/floor-plan',
        name: 'FloorPlan',
        component: () => import('@/views/venue/floor-plan/index.vue'),
        meta: { title: '楼层平面图' },
      },
    ],
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('@/views/error/404.vue'),
    meta: { title: '404', hidden: true },
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

const whiteList = ['/login', '/404']

router.beforeEach(async (to, _from, next) => {
  NProgress.start()
  document.title = `${to.meta.title || '首页'} - 高校实验室信息管理系统`

  const userStore = useUserStore()
  const hasToken = userStore.token

  if (hasToken) {
    if (to.path === '/login') {
      next({ path: '/' })
      NProgress.done()
    } else {
      const hasRoles = userStore.roles && userStore.roles.length > 0
      if (hasRoles) {
        next()
      } else {
        try {
          await userStore.getUserInfo()
          next({ ...to, replace: true })
        } catch (error) {
          await userStore.logout()
          next(`/login?redirect=${to.path}`)
          NProgress.done()
        }
      }
    }
  } else {
    if (whiteList.includes(to.path)) {
      next()
    } else {
      next(`/login?redirect=${to.path}`)
      NProgress.done()
    }
  }
})

router.afterEach(() => {
  NProgress.done()
})

export default router
