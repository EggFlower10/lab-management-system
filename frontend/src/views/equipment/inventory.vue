<template>
  <div class="page-container">
    <el-card class="main-card">
      <div class="page-title">库存与统计</div>
      
      <el-row :gutter="20" class="stats-row">
        <el-col :span="6">
          <el-card class="stat-card">
            <div class="stat-icon blue">
              <el-icon><Monitor /></el-icon>
            </div>
            <div class="stat-info">
              <p class="stat-value">{{ statistics.total_count }}</p>
              <p class="stat-label">设备总数</p>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stat-card">
            <div class="stat-icon green">
              <el-icon><CircleCheck /></el-icon>
            </div>
            <div class="stat-info">
              <p class="stat-value">{{ statistics.available_count }}</p>
              <p class="stat-label">可用设备</p>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stat-card">
            <div class="stat-icon orange">
              <el-icon><Clock /></el-icon>
            </div>
            <div class="stat-info">
              <p class="stat-value">{{ statistics.borrowed_count }}</p>
              <p class="stat-label">借出设备</p>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stat-card">
            <div class="stat-icon red">
              <el-icon><Warning /></el-icon>
            </div>
            <div class="stat-info">
              <p class="stat-value">{{ statistics.maintenance_count }}</p>
              <p class="stat-label">待修设备</p>
            </div>
          </el-card>
        </el-col>
      </el-row>

      <el-row :gutter="20" class="stats-row">
        <el-col :span="6">
          <el-card class="stat-card total-value-card">
            <div class="stat-icon purple total-icon">
              <el-icon><Wallet /></el-icon>
            </div>
            <div class="stat-info total-info">
              <p class="stat-value total-value">¥{{ formatPrice(statistics.total_value) }}</p>
              <p class="stat-label">资产总值</p>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stat-card">
            <div class="stat-icon cyan">
              <el-icon><TrendCharts /></el-icon>
            </div>
            <div class="stat-info">
              <p class="stat-value">{{ statistics.utilization_rate }}%</p>
              <p class="stat-label">设备使用率</p>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stat-card">
            <div class="stat-icon yellow">
              <el-icon><Warning /></el-icon>
            </div>
            <div class="stat-info">
              <p class="stat-value">{{ statistics.overdue_count }}</p>
              <p class="stat-label">逾期设备</p>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stat-card">
            <div class="stat-icon gray">
              <el-icon><List /></el-icon>
            </div>
            <div class="stat-info">
              <p class="stat-value">{{ statistics.repair_count }}</p>
              <p class="stat-label">维修次数</p>
            </div>
          </el-card>
        </el-col>
      </el-row>

      <el-row :gutter="20" class="tabs-row">
        <el-col :span="24">
          <el-card class="table-card">
            <div class="section-title">状态分布</div>
            <el-table :data="statusDistribution" border>
              <el-table-column prop="label" label="状态" width="120">
                <template #default="{ row }">
                  <el-tag :type="getStatusType(row.status)">
                    {{ row.label }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="description" label="说明" width="150" />
              <el-table-column prop="operations" label="可操作" width="120" />
              <el-table-column prop="count" label="数量" width="80" />
              <el-table-column label="占比" width="200">
                <template #default="{ row }">
                  <el-progress :percentage="row.percentage" :color="getStatusColor(row.status)" :stroke-width="12" :show-text="true" />
                </template>
              </el-table-column>
            </el-table>
          </el-card>
        </el-col>
      </el-row>
      <el-row :gutter="20" class="tabs-row">
        <el-col :span="24">
          <el-card class="table-card">
            <div class="section-title">分类统计</div>
            <el-table :data="categoryStatistics" border>
              <el-table-column prop="name" label="分类" width="150" />
              <el-table-column prop="count" label="数量" width="100" />
              <el-table-column prop="total_value" label="资产值" width="120">
                <template #default="{ row }">
                  ¥{{ formatPrice(row.total_value) }}
                </template>
              </el-table-column>
              <el-table-column label="占比" width="200">
                <template #default="{ row }">
                  <el-progress :percentage="row.percentage" :stroke-width="12" :show-text="true" />
                </template>
              </el-table-column>
            </el-table>
          </el-card>
        </el-col>
      </el-row>

      <div class="section-title">库存查询</div>
      
      <div class="search-row">
        <el-select v-model="viewMode" placeholder="视图模式" class="search-select">
          <el-option label="列表视图" value="list" />
          <el-option label="卡片视图" value="card" />
        </el-select>
        <el-select v-model="searchForm.category_id" placeholder="设备分类" clearable class="search-select">
          <el-option label="全部" :value="null" />
          <el-option v-for="item in categoryList" :key="item.id" :label="item.name" :value="item.id" />
        </el-select>
        <el-select v-model="searchForm.status" placeholder="设备状态" clearable class="search-select">
          <el-option label="全部" :value="null" />
          <el-option label="在库-可用" value="available" />
          <el-option label="在库-待维修" value="maintenance" />
          <el-option label="在库-已预约" value="reserved" />
          <el-option label="借出" value="borrowed" />
          <el-option label="送修" value="repairing" />
          <el-option label="报废" value="scrapped" />
          <el-option label="丢失" value="lost" />
        </el-select>
        <el-input v-model="searchForm.keyword" placeholder="设备名称/资产编号" class="search-input" clearable style="width: 200px" />
      </div>
      
      <div class="button-row">
        <el-button type="success" @click="loadInventory">
          <el-icon><Search /></el-icon>搜索
        </el-button>
        <el-button type="default" @click="resetInventorySearch">
          <el-icon><Refresh /></el-icon>重置
        </el-button>
      </div>

      <div v-if="viewMode === 'card'" class="card-view">
        <el-card v-for="item in inventoryData" :key="item.id" class="equipment-card">
          <div class="card-header-flex">
            <div class="card-title">
              <span class="asset-code">{{ item.asset_code }}</span>
              <span class="equipment-name">{{ item.name }}</span>
            </div>
            <el-tag :type="getStatusType(item.status)">{{ getStatusText(item.status) }}</el-tag>
          </div>
          <div class="card-body">
            <div class="info-row">
              <span class="label">型号:</span>
              <span class="value">{{ item.model }}</span>
              <span class="label">品牌:</span>
              <span class="value">{{ item.brand }}</span>
            </div>
            <div class="info-row">
              <span class="label">位置:</span>
              <span class="value">{{ item.location }}</span>
              <span class="label">负责人:</span>
              <span class="value">{{ item.responsible_name }}</span>
            </div>
            <div class="info-row">
              <span class="label">购入日期:</span>
              <span class="value">{{ item.purchase_date }}</span>
              <span class="label">价格:</span>
              <span class="value">¥{{ formatPrice(item.price) }}</span>
            </div>
          </div>
        </el-card>
      </div>

      <el-table v-else :data="inventoryData" v-loading="loading" border stripe>
        <el-table-column prop="asset_code" label="资产编号" width="140" />
        <el-table-column prop="name" label="设备名称" width="180" />
        <el-table-column prop="category_name" label="分类" width="120" />
        <el-table-column prop="model" label="型号" width="120" />
        <el-table-column prop="brand" label="品牌" width="100" />
        <el-table-column prop="location" label="存放位置" width="150" />
        <el-table-column label="状态" width="120">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)">
              {{ getStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="responsible_name" label="负责人" width="100" />
        <el-table-column prop="purchase_date" label="购入日期" width="120" />
        <el-table-column prop="price" label="价格" width="100">
          <template #default="{ row }">
            ¥{{ formatPrice(row.price) }}
          </template>
        </el-table-column>
      </el-table>

      <el-pagination
        v-model:current-page="pagination.page"
        v-model:page-size="pagination.pageSize"
        :total="pagination.total"
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="loadInventory"
        @current-change="loadInventory"
      />
    </el-card>

    <el-card class="table-card">
      <template #header>
        <div class="card-header-split">
          <div class="card-title-row">
            <span>借还流水账</span>
          </div>
          <div class="card-search-row">
            <el-date-picker v-model="searchForm.start_date" type="date" placeholder="开始日期" value-format="YYYY-MM-DD" />
            <el-date-picker v-model="searchForm.end_date" type="date" placeholder="结束日期" value-format="YYYY-MM-DD" />
            <el-button type="success" @click="loadBorrowLogs">
              <el-icon><Search /></el-icon>查询
            </el-button>
            <el-button type="warning" @click="exportLogs">
              <el-icon><Download /></el-icon>导出Excel
            </el-button>
          </div>
        </div>
      </template>

      <el-table :data="borrowLogs" v-loading="loading" border stripe>
        <el-table-column prop="borrow_code" label="申请编号" width="140" />
        <el-table-column prop="equipment_name" label="设备名称" width="180" />
        <el-table-column prop="asset_code" label="资产编号" width="120" />
        <el-table-column prop="applicant_name" label="借用人" width="100" />
        <el-table-column label="借用日期" width="160">
          <template #default="{ row }">
            {{ formatDateTime(row.borrow_date) }}
          </template>
        </el-table-column>
        <el-table-column label="实际归还" width="160">
          <template #default="{ row }">
            {{ formatDateTime(row.actual_return_date) || '-' }}
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)">
              {{ getStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="use_place" label="使用地点" width="150" />
      </el-table>

      <el-pagination
        v-model:current-page="logPagination.page"
        v-model:page-size="logPagination.pageSize"
        :total="logPagination.total"
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="loadBorrowLogs"
        @current-change="loadBorrowLogs"
      />
    </el-card>

    <el-card class="table-card">
      <template #header>
        <div class="card-header-no-border">
          <span>逾期清单</span>
          <div class="header-right">
            <el-button type="warning" @click="exportOverdue">
              <el-icon><Download /></el-icon>导出逾期清单
            </el-button>
          </div>
        </div>
      </template>

      <el-table :data="overdueList" v-loading="loading" border stripe>
        <el-table-column prop="borrow_code" label="申请编号" width="140" />
        <el-table-column prop="equipment_name" label="设备名称" width="180" />
        <el-table-column prop="asset_code" label="资产编号" width="120" />
        <el-table-column prop="applicant_name" label="借用人" width="100" />
        <el-table-column prop="applicant_phone" label="联系电话" width="120" />
        <el-table-column label="预计归还" width="160">
          <template #default="{ row }">
            {{ formatDateTime(row.expect_return_date) }}
          </template>
        </el-table-column>
        <el-table-column label="逾期天数" width="100">
          <template #default="{ row }">
            <el-tag type="danger">{{ row.overdue_days }}天</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="use_place" label="使用地点" width="150" />
      </el-table>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Search, Refresh, Monitor, CircleCheck, Clock, Warning, Wallet, TrendCharts, List, Download } from '@element-plus/icons-vue'
import { get } from '@/utils/request'

const loading = ref(false)
const viewMode = ref('list')

const statistics = reactive({
  total_count: 0,
  available_count: 0,
  borrowed_count: 0,
  maintenance_count: 0,
  total_value: 0,
  utilization_rate: 0,
  overdue_count: 0,
  repair_count: 0
})

const statusDistribution = ref([])
const categoryStatistics = ref([])
const inventoryData = ref([])
const borrowLogs = ref([])
const overdueList = ref([])
const categoryList = ref([])

const searchForm = reactive({
  keyword: '',
  category_id: null,
  status: null,
  start_date: null,
  end_date: null
})

const pagination = reactive({
  page: 1,
  pageSize: 20,
  total: 0
})

const logPagination = reactive({
  page: 1,
  pageSize: 20,
  total: 0
})

const statusMap = {
  available: { label: '在库-可用', type: 'success' },
  pending_repair: { label: '在库-待维修', type: 'warning' },
  maintenance: { label: '在库-待维修', type: 'warning' },
  reserved: { label: '在库-已预约', type: 'info' },
  borrowed: { label: '借出', type: 'primary' },
  repairing: { label: '送修', type: 'danger' },
  scrapped: { label: '报废', type: 'danger' },
  lost: { label: '丢失', type: 'danger' },
  pending_teacher: { label: '待导师审批', type: 'warning' },
  pending_admin: { label: '待管理员审批', type: 'warning' },
  approved: { label: '已审批', type: 'info' },
  rejected: { label: '已拒绝', type: 'danger' },
  returned: { label: '已归还', type: 'success' },
  overdue: { label: '逾期', type: 'danger' }
}

const getStatusType = (status) => {
  return statusMap[status]?.type || 'info'
}

const getStatusText = (status) => {
  return statusMap[status]?.label || status
}

const getStatusColor = (status) => {
  const colorMap = {
    available: '#67c23a',
    pending_repair: '#e6a23c',
    maintenance: '#e6a23c',
    reserved: '#909399',
    borrowed: '#409eff',
    repairing: '#f56c6c',
    scrapped: '#909399',
    lost: '#f56c6c'
  }
  return colorMap[status] || '#909399'
}

const formatPrice = (price) => {
  if (!price) return '0.00'
  return parseFloat(price).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

const formatDateTime = (date) => {
  if (!date) return '-'
  return new Date(date).toLocaleString('zh-CN')
}

const loadStatistics = async () => {
  loading.value = true
  try {
    const res = await get('/equipment/statistics')
    statistics.total_count = res?.total_count || 0
    statistics.available_count = res?.available_count || 0
    statistics.borrowed_count = res?.borrowed_count || 0
    statistics.maintenance_count = res?.maintenance_count || 0
    statistics.total_value = res?.total_value || 0
    statistics.utilization_rate = res?.utilization_rate || 0
    statistics.overdue_count = res?.overdue_count || 0
    statistics.repair_count = res?.repair_count || 0
    statusDistribution.value = res?.status_distribution || []
    categoryStatistics.value = res?.category_statistics || []
    overdueList.value = res?.overdue_list || []
  } catch (error) {
    console.error('加载统计数据失败:', error)
    ElMessage.error('加载统计数据失败')
  } finally {
    loading.value = false
  }
}

const loadInventory = async () => {
  loading.value = true
  try {
    const params = {
      keyword: searchForm.keyword,
      category_id: searchForm.category_id,
      status: searchForm.status,
      page: pagination.page,
      pageSize: pagination.pageSize
    }
    const res = await get('/equipment', params)
    inventoryData.value = res?.data || []
    pagination.total = res?.total || 0
  } catch (error) {
    console.error('加载库存数据失败:', error)
    ElMessage.error('加载库存数据失败')
  } finally {
    loading.value = false
  }
}

const loadBorrowLogs = async () => {
  loading.value = true
  try {
    const params = {
      page: logPagination.page,
      pageSize: logPagination.pageSize
    }
    if (searchForm.start_date) {
      params.start_date = searchForm.start_date
    }
    if (searchForm.end_date) {
      params.end_date = searchForm.end_date
    }
    const res = await get('/equipment/borrow/logs', params)
    borrowLogs.value = res?.data || []
    logPagination.total = res?.total || 0
  } catch (error) {
    console.error('加载借还流水失败:', error)
    ElMessage.error('加载借还流水失败')
  } finally {
    loading.value = false
  }
}

const loadCategories = async () => {
  try {
    const res = await get('/equipment/categories')
    categoryList.value = res || []
  } catch (error) {
    console.error('加载分类失败:', error)
  }
}

const resetInventorySearch = () => {
  searchForm.keyword = ''
  searchForm.category_id = null
  searchForm.status = null
  pagination.page = 1
  loadInventory()
}

const exportLogs = async () => {
  try {
    let url = '/api/v1/equipment/borrow/logs/export'
    const params = []
    if (searchForm.start_date) params.push(`start_date=${searchForm.start_date}`)
    if (searchForm.end_date) params.push(`end_date=${searchForm.end_date}`)
    if (params.length > 0) url += `?${params.join('&')}`

    const token = localStorage.getItem('token')
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })

    if (!response.ok) {
      throw new Error('导出失败')
    }

    const blob = await response.blob()

    // 创建下载链接
    const downloadUrl = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = downloadUrl
    link.download = 'equipment-borrow-logs.xlsx'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(downloadUrl)

    ElMessage.success('导出成功')
  } catch (error) {
    console.error('导出失败:', error)
    ElMessage.error('导出失败')
  }
}

const exportOverdue = async () => {
  try {
    const token = localStorage.getItem('token')
    const response = await fetch('/api/v1/equipment/overdue/export', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })

    if (!response.ok) {
      throw new Error('导出失败')
    }

    const blob = await response.blob()

    const downloadUrl = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = downloadUrl
    link.download = 'equipment-overdue-list.xlsx'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(downloadUrl)

    ElMessage.success('导出成功')
  } catch (error) {
    console.error('导出逾期清单失败:', error)
    ElMessage.error('导出逾期清单失败')
  }
}

onMounted(() => {
  loadStatistics()
  loadInventory()
  loadBorrowLogs()
  loadCategories()
})
</script>

<style scoped lang="scss">
.page-container {
  padding: 20px;
}

.main-card {
  padding: 20px;
}

.page-title {
  font-size: 20px;
  font-weight: bold;
  margin-bottom: 20px;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  margin: 20px 0 15px 0;
  color: #303133;
}

.search-row {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 15px;
  flex-wrap: wrap;
}

.button-row {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 20px;
}

.stats-row {
  margin-bottom: 24px;
}

.stat-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 28px 20px;
  min-height: 160px;
}

.stat-icon {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
  margin-bottom: 16px;
  line-height: 1;
}

.stat-icon .el-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
  margin: 0;
  padding: 0;
}

.stat-icon {
  &.blue {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
  }
  
  &.green {
    background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
    color: white;
  }
  
  &.orange {
    background: linear-gradient(135deg, #fc4a1a 0%, #f7b733 100%);
    color: white;
  }
  
  &.red {
    background: linear-gradient(135deg, #eb3349 0%, #f45c43 100%);
    color: white;
  }
  
  &.purple {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
  }
  
  &.cyan {
    background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
    color: white;
  }
  
  &.yellow {
    background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
    color: white;
  }
  
  &.gray {
    background: linear-gradient(135deg, #434343 0%, #000000 100%);
    color: white;
  }
}

.stat-info {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.stat-value {
  font-size: 28px;
  font-weight: bold;
  color: #303133;
  margin: 0 0 8px 0;
}

.stat-label {
  font-size: 14px;
  color: #909399;
  margin: 0;
}

.total-value {
  white-space: nowrap;
}

.total-value-card {
  min-height: 140px !important;
  height: 100% !important;
  display: flex !important;
  flex-direction: column !important;
  align-items: center !important;
  justify-content: center !important;
}

.total-value-card ::v-deep .el-card__body {
  display: flex !important;
  flex-direction: column !important;
  align-items: center !important;
  justify-content: center !important;
  text-align: center !important;
  padding: 20px 16px !important;
  min-height: 140px !important;
  height: auto !important;
}

.total-icon {
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  width: 64px !important;
  height: 64px !important;
  border-radius: 50% !important;
  font-size: 28px !important;
  margin-bottom: 16px !important;
  line-height: 1 !important;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
  color: white !important;
}

.total-icon .el-icon {
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  line-height: 1 !important;
  font-size: 28px !important;
  margin: 0 !important;
  padding: 0 !important;
}

.total-info {
  display: flex !important;
  flex-direction: column !important;
  align-items: center !important;
  text-align: center !important;
}

.total-info .stat-value {
  font-size: clamp(14px, 4vw, 22px) !important;
  font-weight: bold !important;
  color: #303133 !important;
  margin: 0 12px 8px 12px !important;
  white-space: nowrap !important;
  max-width: calc(100% - 24px) !important;
  overflow: hidden !important;
  text-overflow: ellipsis !important;
}

.total-info .stat-label {
  font-size: 14px !important;
  color: #909399 !important;
  margin: 0 !important;
}

.tabs-row {
  margin-bottom: 20px;
}

.card-header-flex {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.header-right {
  display: flex;
  gap: 10px;
  align-items: center;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 18px;
  font-weight: bold;
  color: #303133;
  padding-bottom: 16px;
  margin-bottom: 16px;
  border-bottom: 1px solid #ebeef5;
}

.card-header .header-right {
  font-size: 14px;
  font-weight: normal;
}

.card-header-no-border {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 18px;
  font-weight: bold;
  color: #303133;
}

.card-header-no-border .header-right {
  font-size: 14px;
  font-weight: normal;
}

.card-header-split {
  display: flex;
  flex-direction: column;
  width: 100%;
}

.card-title-row {
  font-size: 18px;
  font-weight: bold;
  color: #303133;
  padding-bottom: 12px;
  margin-bottom: 12px;
  border-bottom: 1px solid #ebeef5;
}

.card-search-row {
  display: flex;
  gap: 10px;
  align-items: center;
  justify-content: flex-start;
}

.search-input {
  width: 180px;
}

.search-select {
  width: 150px;
}

.card-view {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 20px;
}

.equipment-card {
  border: 1px solid #ebeef5;
  border-radius: 8px;
}

.card-title {
  display: flex;
  align-items: baseline;
  gap: 10px;
}

.asset-code {
  font-size: 12px;
  color: #909399;
  background: #f5f7fa;
  padding: 2px 8px;
  border-radius: 4px;
}

.equipment-name {
  font-size: 16px;
  font-weight: bold;
  color: #303133;
}

.card-body {
  padding-top: 10px;
  border-top: 1px solid #ebeef5;
}

.info-row {
  display: flex;
  gap: 15px;
  margin-bottom: 8px;
}

.label {
  font-size: 13px;
  color: #909399;
}

.value {
  font-size: 13px;
  color: #606266;
}
</style>