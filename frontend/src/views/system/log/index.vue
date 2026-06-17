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
import { get, del } from '@/utils/request'

const loading = ref(false)
const tableData = ref<any[]>([])

const searchParams = reactive({
  keyword: '',
  module: '',
  timeRange: [] as string[]
})

const pagination = reactive({ 
  page: 1, 
  pageSize: 10, 
  total: 0 
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

const loadData = async () => {
  try {
    loading.value = true
    const params: any = {
      page: pagination.page,
      pageSize: pagination.pageSize
    }
    if (searchParams.keyword) {
      params.keyword = searchParams.keyword
    }
    if (searchParams.timeRange.length === 2) {
      params.start_time = searchParams.timeRange[0]
      params.end_time = searchParams.timeRange[1]
    }
    const res = await get('/logs', params)
    tableData.value = res?.data || []
    pagination.total = res?.total || 0
  } catch (error) {
    console.error('加载操作日志失败:', error)
    ElMessage.error('加载操作日志失败')
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  pagination.page = 1
  loadData()
}

const handleReset = () => {
  searchParams.keyword = ''
  searchParams.module = ''
  searchParams.timeRange = []
  pagination.page = 1
  loadData()
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
  ).then(async () => {
    try {
      await del('/logs')
      tableData.value = []
      pagination.total = 0
      ElMessage.success('日志已清空')
    } catch (error) {
      ElMessage.error('清空日志失败')
    }
  }).catch(() => {})
}

const handleSizeChange = (size: number) => {
  pagination.pageSize = size
  pagination.page = 1
  loadData()
}

const handleCurrentChange = (page: number) => {
  pagination.page = page
  loadData()
}

onMounted(() => {
  loadData()
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