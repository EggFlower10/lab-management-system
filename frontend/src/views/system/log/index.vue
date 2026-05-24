<template>
  <div class="page-container">
    <el-card class="table-card">
      <template #header>
        <div class="card-header">
          <span>操作日志</span>
          <div class="header-right">
            <el-input v-model="searchParams.keyword" placeholder="用户名/IP/URL" class="search-input" clearable />
            <el-select v-model="searchParams.module" placeholder="全部模块" class="search-select">
              <el-option label="全部模块" value="" />
              <el-option label="用户管理" value="user" />
              <el-option label="角色管理" value="role" />
              <el-option label="菜单管理" value="menu" />
              <el-option label="权限管理" value="permission" />
              <el-option label="机构管理" value="organization" />
              <el-option label="部门管理" value="department" />
              <el-option label="系统配置" value="config" />
            </el-select>
            <el-date-picker
              v-model="searchParams.timeRange"
              type="daterange"
              range-separator="至"
              start-placeholder="开始日期"
              end-placeholder="结束日期"
              format="YYYY-MM-DD HH:mm:ss"
              value-format="YYYY-MM-DD HH:mm:ss"
              class="search-date"
            />
            <el-button type="success" @click="handleSearch">
              <el-icon><Search /></el-icon>搜索
            </el-button>
            <el-button @click="handleReset">
              <el-icon><Refresh /></el-icon>重置
            </el-button>
            <el-button type="danger" @click="handleClearLog">
              <el-icon><Delete /></el-icon>清空日志
            </el-button>
          </div>
        </div>
      </template>
      <el-table
        :data="tableData"
        v-loading="loading"
        border
        stripe
      >
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="username" label="用户名" width="120" />
        <el-table-column prop="ip" label="IP" width="150" />
        <el-table-column prop="url" label="URL" width="250" show-overflow-tooltip />
        <el-table-column prop="module" label="模块" width="120" />
        <el-table-column prop="method" label="请求方式" width="100">
          <template #default="{ row }">
            <el-tag :type="methodTagType(row.method)">{{ row.method }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="操作时间" width="200" />
        <el-table-column prop="content" label="操作内容" />
      </el-table>
      <el-pagination
        v-model:current-page="pagination.page"
        v-model:page-size="pagination.pageSize"
        :total="pagination.total"
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Search, Refresh, Delete } from '@element-plus/icons-vue'
import { ElMessageBox } from 'element-plus'

const loading = ref(false)
const originalTableData = ref<any[]>([
  {
    id: 65,
    username: 'admin',
    ip: '192.168.1.100',
    url: '/system/user/update',
    module: '用户管理',
    method: 'POST',
    created_at: '2025-04-17 11:47:48',
    content: '更新用户信息'
  },
  {
    id: 64,
    username: 'admin',
    ip: '192.168.1.100',
    url: '/system/role/update',
    module: '角色管理',
    method: 'POST',
    created_at: '2025-04-17 11:47:46',
    content: '更新角色信息'
  },
  {
    id: 63,
    username: 'admin',
    ip: '192.168.1.100',
    url: '/system/menu/add',
    module: '菜单管理',
    method: 'POST',
    created_at: '2025-04-17 11:47:44',
    content: '新增菜单'
  },
  {
    id: 62,
    username: 'admin',
    ip: '192.168.1.100',
    url: '/system/permission/delete',
    module: '权限管理',
    method: 'POST',
    created_at: '2025-04-17 11:47:42',
    content: '删除权限'
  },
  {
    id: 61,
    username: 'admin',
    ip: '192.168.1.100',
    url: '/system/organization/add',
    module: '机构管理',
    method: 'POST',
    created_at: '2025-04-17 11:47:40',
    content: '新增机构'
  },
  {
    id: 60,
    username: 'admin',
    ip: '192.168.1.100',
    url: '/system/department/edit',
    module: '部门管理',
    method: 'POST',
    created_at: '2025-04-17 11:47:38',
    content: '编辑部门'
  },
  {
    id: 59,
    username: 'admin',
    ip: '192.168.1.100',
    url: '/system/config/update',
    module: '系统配置',
    method: 'POST',
    created_at: '2025-04-17 11:47:36',
    content: '更新系统配置'
  }
])

const tableData = ref<any[]>([...originalTableData.value])

const searchParams = reactive({
  keyword: '',
  module: '',
  timeRange: [] as string[]
})

const pagination = reactive({ 
  page: 1, 
  pageSize: 10, 
  total: 100 
})

const methodTagType = (method: string): 'primary' | 'success' | 'warning' | 'info' | 'danger' => {
  const types: Record<string, 'primary' | 'success' | 'warning' | 'info' | 'danger'> = { 
    GET: 'success', 
    POST: 'primary', 
    PUT: 'warning', 
    DELETE: 'danger' 
  }
  return types[method] || 'info'
}

const handleSearch = () => {
  // 搜索逻辑
  console.log('搜索参数:', searchParams)
  // 模拟筛选功能
  const filteredData = originalTableData.value.filter(item => {
    // 关键词匹配
    const keywordMatch = !searchParams.keyword || 
      item.username.toLowerCase().includes(searchParams.keyword.toLowerCase()) ||
      item.ip.toLowerCase().includes(searchParams.keyword.toLowerCase()) ||
      item.url.toLowerCase().includes(searchParams.keyword.toLowerCase())
    
    // 模块匹配 - 修复模块值不匹配的问题
    const moduleMatch = !searchParams.module || {
      'user': '用户管理',
      'role': '角色管理',
      'menu': '菜单管理',
      'permission': '权限管理',
      'organization': '机构管理',
      'department': '部门管理',
      'config': '系统配置'
    }[searchParams.module] === item.module
    
    // 时间范围匹配
    const timeMatch = !searchParams.timeRange.length || 
      (searchParams.timeRange[0] && searchParams.timeRange[1] &&
       item.created_at >= searchParams.timeRange[0] && 
       item.created_at <= searchParams.timeRange[1])
    
    return keywordMatch && moduleMatch && timeMatch
  })
  
  tableData.value = filteredData
  pagination.total = filteredData.length
  
  if (filteredData.length === 0) {
    ElMessage.info('未找到匹配的操作日志')
  } else {
    ElMessage.success(`搜索成功，找到 ${filteredData.length} 条记录`)
  }
}

const handleReset = () => {
  searchParams.keyword = ''
  searchParams.module = ''
  searchParams.timeRange = []
  // 重置为原始数据
  tableData.value = [...originalTableData.value]
}

const handleClearLog = () => {
  ElMessageBox.confirm(
    '确定要清空所有操作日志吗？此操作不可恢复。',
    '清空确认',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(() => {
    tableData.value = []
    ElMessage.success('日志已清空')
  }).catch(() => {})
}

const handleSizeChange = (size: number) => {
  pagination.pageSize = size
  pagination.page = 1
  // 重新加载数据
}

const handleCurrentChange = (page: number) => {
  pagination.page = page
  // 重新加载数据
}

onMounted(() => {
  // 初始化数据
})
</script>

<style scoped>
.page-container {
  padding: 20px;
}

.table-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.search-input {
  width: 250px;
}

.search-select {
  width: 150px;
}

.search-date {
  width: 300px;
}

@media (max-width: 768px) {
  .header-right {
    width: 100%;
    justify-content: flex-end;
  }
  
  .search-input,
  .search-select,
  .search-date {
    width: 100%;
  }
}
</style>