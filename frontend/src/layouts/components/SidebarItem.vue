<template>
  <template v-if="!menu.children || menu.children.length === 0">
    <el-menu-item :index="menu.path" v-if="menu.visible !== 0">
      <el-icon v-if="menu.icon">
        <component :is="getIconComponent(menu.icon)" />
      </el-icon>
      <span>{{ menu.name }}</span>
    </el-menu-item>
  </template>

  <el-sub-menu v-else :index="menu.path" v-if="menu.visible !== 0">
    <template #title>
      <el-icon v-if="menu.icon">
        <component :is="getIconComponent(menu.icon)" />
      </el-icon>
      <span>{{ menu.name }}</span>
    </template>
    <SidebarItem
      v-for="child in menu.children"
      :key="child.id"
      :menu="child"
    />
  </el-sub-menu>
</template>

<script setup lang="ts">
import * as ElementPlusIconsVue from '@element-plus/icons-vue'

defineProps<{
  menu: MenuItem
}>()

const getIconComponent = (iconName: string) => {
  return ElementPlusIconsVue[iconName as keyof typeof ElementPlusIconsVue] || ElementPlusIconsVue.Menu
}
</script>