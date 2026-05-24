import { defineStore } from 'pinia'
import { useUserStore } from './user'

interface AppState {
  sidebar: {
    collapsed: boolean
  }
  device: 'desktop' | 'mobile'
  breadcrumbs: BreadcrumbItem[]
}

interface BreadcrumbItem {
  title: string
  path?: string
}

export const useAppStore = defineStore('app', {
  state: (): AppState => ({
    sidebar: {
      collapsed: localStorage.getItem('sidebarCollapsed') === 'true',
    },
    device: 'desktop',
    breadcrumbs: [],
  }),

  actions: {
    toggleSidebar() {
      this.sidebar.collapsed = !this.sidebar.collapsed
      localStorage.setItem('sidebarCollapsed', String(this.sidebar.collapsed))
    },

    setDevice(device: 'desktop' | 'mobile') {
      this.device = device
    },

    setBreadcrumbs(breadcrumbs: BreadcrumbItem[]) {
      this.breadcrumbs = breadcrumbs
    },

    generateBreadcrumbs(route: any) {
      const userStore = useUserStore()
      const breadcrumbs: BreadcrumbItem[] = []
      
      const path = route.path.replace(/\/$/, '')
      if (path === '/dashboard' || path === '/') {
        this.setBreadcrumbs([])
        return
      }
      
      const findMenu = (menus: MenuItem[], path: string): MenuItem | null => {
        for (const menu of menus) {
          if (menu.path === path) return menu
          if (menu.children) {
            const found = findMenu(menu.children, path)
            if (found) {
              breadcrumbs.unshift({ title: menu.name })
              return found
            }
          }
        }
        return null
      }

      const currentMenu = findMenu(userStore.menus, path)
      if (currentMenu) {
        breadcrumbs.push({ title: currentMenu.name, path: currentMenu.path })
      }

      this.setBreadcrumbs(breadcrumbs)
    },
  },
})
