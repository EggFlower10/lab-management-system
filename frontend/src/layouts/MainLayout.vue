<template>
  <el-container class="main-layout">
    <el-aside :width="sidebarWidth" class="sidebar-container">
      <Sidebar />
    </el-aside>
    <el-container class="main-container">
      <el-header class="header-container" :height="headerHeight">
        <Navbar />
      </el-header>
      <el-main class="main-content">
        <Breadcrumb />
        <div class="content-wrapper">
          <router-view v-slot="{ Component }">
            <transition name="fade-transform" mode="out-in">
              <component :is="Component" />
            </transition>
          </router-view>
        </div>
      </el-main>
      <el-footer class="footer-container" :height="footerHeight">
        <span>高校实验室信息管理系统 © 2024</span>
      </el-footer>
    </el-container>
  </el-container>
</template>

<script setup lang="ts">
import { computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useAppStore } from '@/stores'
import Sidebar from './components/Sidebar.vue'
import Navbar from './components/Navbar.vue'
import Breadcrumb from './components/Breadcrumb.vue'

const route = useRoute()
const appStore = useAppStore()


const sidebarWidth = computed(() => {
  return appStore.sidebar.collapsed ? '64px' : '210px'
})

const headerHeight = '50px'
const footerHeight = '30px'

watch(
  () => route.path,
  () => {
    appStore.generateBreadcrumbs(route)
  },
  { immediate: true }
)
</script>

<style lang="scss" scoped>
.main-layout {
  width: 100%;
  height: 100%;
}

.sidebar-container {
  background-color: #304156;
  transition: width 0.3s;
  overflow: hidden;
}

.main-container {
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.header-container {
  padding: 0;
  background-color: #fff;
  box-shadow: 0 1px 4px rgba(0, 21, 41, 0.08);
  z-index: 10;
}

.main-content {
  flex: 1;
  padding: 0;
  background-color: #f2f3f5;
  overflow: auto;
}

.content-wrapper {
  padding: 20px;
  min-height: calc(100vh - 120px);
}

.footer-container {
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #fff;
  border-top: 1px solid #e8e8e8;
  font-size: 12px;
  color: #909399;
}
</style>
