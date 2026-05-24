<template>
  <el-breadcrumb class="breadcrumb" separator="/">
    <el-breadcrumb-item v-for="(item, index) in breadcrumbs" :key="index">
      <span v-if="index === breadcrumbs.length - 1" class="no-redirect">{{ item.title }}</span>
      <a v-else @click.prevent="handleLink(item)">{{ item.title }}</a>
    </el-breadcrumb-item>
  </el-breadcrumb>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAppStore } from '@/stores'

const router = useRouter()
const appStore = useAppStore()

const breadcrumbs = computed(() => appStore.breadcrumbs)

const handleLink = (item: any) => {
  if (item.path) {
    router.push(item.path)
  }
}
</script>

<style lang="scss" scoped>
.breadcrumb {
  display: inline-block;
  font-size: 14px;
  line-height: 40px;
  padding: 0 20px;
  background-color: #fff;
  border-bottom: 1px solid #e8e8e8;
}

.no-redirect {
  color: #97a8be;
  cursor: text;
}

a {
  color: #606266;
  cursor: pointer;

  &:hover {
    color: #409eff;
  }
}
</style>
