<template>
  <div class="page-container">
    <el-card class="main-card">
      <div class="page-title">数据统计</div>
      
      <div class="search-row">
        <el-date-picker v-model="searchForm.start_time" type="date" placeholder="开始日期" class="search-date" />
        <el-date-picker v-model="searchForm.end_time" type="date" placeholder="结束日期" class="search-date" />
        <el-button type="success" @click="handleSearch">
          <el-icon><Search /></el-icon>查询
        </el-button>
        <el-button @click="handleReset">
          <el-icon><Refresh /></el-icon>重置
        </el-button>
      </div>

      <div class="stats-row">
        <el-statistic title="耗材种类" :value="stockStats.total_count" class="stat-item">
          <template #suffix><el-icon><Box /></el-icon></template>
        </el-statistic>
        <el-statistic title="库存总量" :value="stockStats.total_stock" class="stat-item">
          <template #suffix><el-icon><OfficeBuilding /></el-icon></template>
        </el-statistic>
        <el-statistic title="库存总价值" :value="stockStats.total_value" :precision="2" class="stat-item">
          <template #prefix>¥</template>
          <template #suffix><el-icon><Wallet /></el-icon></template>
        </el-statistic>
        <el-statistic title="低库存预警" :value="stockStats.low_stock_count" class="stat-item warning">
          <template #suffix><el-icon><Warning /></el-icon></template>
        </el-statistic>
      </div>

      <div class="charts-row">
        <el-card title="分类库存统计" class="chart-card">
          <div class="chart-container">
            <el-table :data="stockStats.category_statistics || []" border>
              <el-table-column prop="name" label="分类名称" />
              <el-table-column prop="count" label="耗材种类" />
              <el-table-column prop="total_stock" label="库存数量" />
              <el-table-column label="占比">
                <template #default="{ row }">
                  <el-progress 
                    :percentage="getCategoryPercentage(row)" 
                    :show-text="true"
                    :stroke-width="12"
                  />
                </template>
              </el-table-column>
            </el-table>
          </div>
        </el-card>

        <el-card title="供应商入库统计" class="chart-card">
          <div class="chart-container">
            <el-table :data="incomeStats.supplier_statistics || []" border>
              <el-table-column prop="supplier_name" label="供应商" />
              <el-table-column prop="total_quantity" label="入库数量" />
              <el-table-column prop="total_amount" label="入库金额">
                <template #default="{ row }">¥{{ (row.total_amount || 0).toFixed(2) }}</template>
              </el-table-column>
            </el-table>
          </div>
        </el-card>
      </div>

      <div class="charts-row">
        <el-card title="高频领用耗材" class="chart-card">
          <div class="chart-container">
            <el-table :data="outcomeStats.consumable_statistics || []" border>
              <el-table-column prop="consumable_name" label="耗材名称" />
              <el-table-column prop="total_quantity" label="领用数量" />
              <el-table-column label="排名">
                <template #default="{ $index }">
                  <el-tag :type="getRankTag($index)">第{{ $index + 1 }}名</el-tag>
                </template>
              </el-table-column>
            </el-table>
          </div>
        </el-card>

        <el-card title="部门领用排行" class="chart-card">
          <div class="chart-container">
            <el-table :data="outcomeStats.lab_statistics || []" border>
              <el-table-column prop="lab_name" label="实验室" />
              <el-table-column prop="total_quantity" label="领用数量" />
              <el-table-column label="占比">
                <template #default="{ row }">
                  <el-progress 
                    :percentage="getLabPercentage(row)" 
                    :show-text="true"
                    :stroke-width="12"
                  />
                </template>
              </el-table-column>
            </el-table>
          </div>
        </el-card>
      </div>

      <div class="charts-row">
        <el-card title="入库趋势" class="chart-card">
          <div class="chart-container">
            <el-table :data="incomeStats.date_statistics || []" border>
              <el-table-column prop="date" label="日期" />
              <el-table-column prop="total_quantity" label="入库数量" />
              <el-table-column prop="total_amount" label="入库金额">
                <template #default="{ row }">¥{{ (row.total_amount || 0).toFixed(2) }}</template>
              </el-table-column>
            </el-table>
          </div>
        </el-card>

        <el-card title="出库趋势" class="chart-card">
          <div class="chart-container">
            <el-table :data="outcomeStats.date_statistics || []" border>
              <el-table-column prop="date" label="日期" />
              <el-table-column prop="total_quantity" label="领用数量" />
            </el-table>
          </div>
        </el-card>
      </div>

      <div class="charts-row">
        <el-card title="申请人领用统计" class="chart-card">
          <div class="chart-container">
            <el-table :data="outcomeStats.applicant_statistics || []" border>
              <el-table-column prop="applicant_name" label="申请人" />
              <el-table-column prop="total_quantity" label="领用数量" />
            </el-table>
          </div>
        </el-card>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { reactive, onMounted } from 'vue'
import { Search, Refresh, Box, OfficeBuilding, Wallet, Warning } from '@element-plus/icons-vue'
import { get } from '@/utils/request'

const searchForm = reactive({
  start_time: '',
  end_time: ''
})

const stockStats = reactive({
  total_count: 0,
  total_stock: 0,
  total_value: 0,
  low_stock_count: 0,
  category_statistics: [] as any[]
})

const incomeStats = reactive({
  supplier_statistics: [] as any[],
  date_statistics: [] as any[]
})

const outcomeStats = reactive({
  applicant_statistics: [] as any[],
  lab_statistics: [] as any[],
  consumable_statistics: [] as any[],
  date_statistics: [] as any[]
})

const getCategoryPercentage = (row: any) => {
  if (stockStats.total_stock > 0) {
    return Math.round((row.total_stock / stockStats.total_stock) * 100)
  }
  return 0
}

const getLabPercentage = (row: any) => {
  const total = (outcomeStats.lab_statistics as any[]).reduce((sum, item) => sum + (item.total_quantity || 0), 0)
  if (total > 0) {
    return Math.round((row.total_quantity / total) * 100)
  }
  return 0
}

const getRankTag = (index: number) => {
  switch (index) {
    case 0: return 'danger'
    case 1: return 'warning'
    case 2: return 'success'
    default: return 'info'
  }
}

const loadStockStats = async () => {
  try {
    const res = await get('/consumable/statistics/stock')
    Object.assign(stockStats, res)
  } catch (error) {
    console.error('获取库存统计失败:', error)
  }
}

const loadIncomeStats = async () => {
  try {
    const params: any = {}
    if (searchForm.start_time) params.start_time = searchForm.start_time
    if (searchForm.end_time) params.end_time = searchForm.end_time
    
    const res = await get('/consumable/statistics/income', params)
    Object.assign(incomeStats, res)
  } catch (error) {
    console.error('获取入库统计失败:', error)
  }
}

const loadOutcomeStats = async () => {
  try {
    const params: any = {}
    if (searchForm.start_time) params.start_time = searchForm.start_time
    if (searchForm.end_time) params.end_time = searchForm.end_time
    
    const res = await get('/consumable/statistics/outcome', params)
    Object.assign(outcomeStats, res)
  } catch (error) {
    console.error('获取出库统计失败:', error)
  }
}

const handleSearch = () => {
  loadStockStats()
  loadIncomeStats()
  loadOutcomeStats()
}

const handleReset = () => {
  searchForm.start_time = ''
  searchForm.end_time = ''
  handleSearch()
}

onMounted(() => {
  handleSearch()
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
  font-size: 18px;
  font-weight: bold;
  color: #303133;
  margin-bottom: 20px;
}

.search-row {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}

.search-date {
  width: 200px;
}

.stats-row {
  display: flex;
  gap: 20px;
  margin-bottom: 20px;
}

.stat-item {
  flex: 1;
  text-align: center;
  padding: 16px;
  background: #f5f7fa;
  border-radius: 8px;
}

.stat-item.warning .el-statistic__value {
  color: #e6a23c;
}

.charts-row {
  display: flex;
  gap: 20px;
  margin-bottom: 20px;
}

.chart-card {
  flex: 1;
}

.chart-container {
  height: 300px;
  overflow-y: auto;
}
</style>
