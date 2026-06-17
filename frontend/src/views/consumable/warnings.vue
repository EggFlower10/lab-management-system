<template>
  <div class="page-container">
    <el-card class="main-card">
      <div class="page-title">库存预警</div>

      <div class="toolbar">
        <el-input v-model="searchForm.name" placeholder="耗材名称/编号" clearable class="toolbar-item" />
        <el-select v-model="searchForm.status" placeholder="预警状态" clearable class="toolbar-item">
          <el-option label="全部" value="" />
          <el-option label="未处理" value="active" />
          <el-option label="已处理" value="resolved" />
        </el-select>
        <el-button type="primary" @click="handleSearch">查询</el-button>
        <el-button @click="handleReset">重置</el-button>
      </div>

      <el-table :data="tableData" v-loading="loading" border stripe>
        <el-table-column prop="consumable_no" label="耗材编号" width="140" />
        <el-table-column prop="consumable_name" label="耗材名称" min-width="180" />
        <el-table-column prop="category_name" label="分类" width="120" />
        <el-table-column prop="stock" label="当前库存" width="100" />
        <el-table-column prop="locked_stock" label="锁定库存" width="100" />
        <el-table-column prop="available_stock" label="可用库存" width="100" />
        <el-table-column prop="min_stock" label="预警阈值" width="100" />
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.warning_status === 'active' ? 'danger' : 'success'">
              {{ row.warning_status === 'active' ? '未处理' : '已处理' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="last_triggered_at" label="最近触发时间" width="180" />
        <el-table-column prop="resolved_at" label="处理时间" width="180" />
        <el-table-column prop="remark" label="备注" min-width="160" show-overflow-tooltip />
        <el-table-column label="操作" width="120" fixed="right">
          <template #default="{ row }">
            <el-button
              v-if="row.warning_status === 'active'"
              type="primary"
              size="small"
              @click="handleResolve(row)"
            >
              标记处理
            </el-button>
            <span v-else class="muted-text">已处理</span>
          </template>
        </el-table-column>
      </el-table>

      <el-pagination
        v-model:current-page="pagination.page"
        v-model:page-size="pagination.pageSize"
        :total="pagination.total"
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="loadData"
        @current-change="loadData"
      />
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { get, put } from '@/utils/request'

interface WarningItem {
  id: number
  consumable_no: string
  consumable_name: string
  category_name?: string
  stock: number
  locked_stock: number
  available_stock: number
  min_stock: number
  warning_status: 'active' | 'resolved'
  last_triggered_at?: string
  resolved_at?: string
  remark?: string
}

const loading = ref(false)
const tableData = ref<WarningItem[]>([])

const searchForm = reactive({
  name: '',
  status: ''
})

const pagination = reactive({
  page: 1,
  pageSize: 20,
  total: 0
})

const loadData = async () => {
  loading.value = true
  try {
    const params: Record<string, any> = {
      page: pagination.page,
      pageSize: pagination.pageSize
    }
    if (searchForm.name) params.name = searchForm.name
    if (searchForm.status) params.status = searchForm.status

    const res = await get<{ data: WarningItem[]; total: number }>('/consumable/warnings', params)
    tableData.value = res.data || []
    pagination.total = res.total || 0
  } catch (error) {
    console.error(error)
    tableData.value = []
    pagination.total = 0
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  pagination.page = 1
  loadData()
}

const handleReset = () => {
  searchForm.name = ''
  searchForm.status = ''
  pagination.page = 1
  loadData()
}

const handleResolve = async (row: WarningItem) => {
  try {
    const { value } = await ElMessageBox.prompt('可填写处理说明', '处理预警', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      inputPlaceholder: '例如：已补货，等待审核入库'
    })
    await put(`/consumable/warnings/${row.id}/resolve`, { remark: value || '' })
    ElMessage.success('处理成功')
    loadData()
  } catch (error: any) {
    if (error !== 'cancel' && error !== 'close') {
      ElMessage.error('处理失败')
    }
  }
}

onMounted(() => {
  loadData()
})
</script>

<style scoped>
.page-container {
  padding: 20px;
}

.main-card {
  min-height: calc(100vh - 120px);
}

.page-title {
  margin-bottom: 20px;
  font-size: 18px;
  font-weight: 600;
}

.toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 16px;
}

.toolbar-item {
  width: 220px;
}

.muted-text {
  color: #909399;
}
</style>
