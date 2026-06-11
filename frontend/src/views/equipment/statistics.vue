<template>
  <div class="page-container">
    <el-row :gutter="20">
      <el-col :span="6">
        <el-card class="stat-card">
          <el-statistic title="设备总数" :value="overview.total || 0">
            <template #suffix>台</template>
          </el-statistic>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card">
          <el-statistic title="可借设备" :value="(overview.status_stats?.available || 0)">
            <template #suffix>台</template>
          </el-statistic>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card">
          <el-statistic title="借出设备" :value="(overview.borrowed_count || 0)">
            <template #suffix>台</template>
          </el-statistic>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card">
          <el-statistic title="总资产价值">
            <template #default>
              ¥{{ (overview.total_value || 0).toFixed(2) }}
            </template>
          </el-statistic>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" style="margin-top: 20px;">
      <el-col :span="12">
        <el-card>
          <template #header>
            <span>设备状态分布</span>
          </template>
          <div class="chart-container">
            <el-table :data="statusData" border stripe>
              <el-table-column prop="name" label="状态" width="120">
                <template #default="{ row }">
                  <el-tag :type="getStatusType(row.name)">{{ getStatusText(row.name) }}</el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="count" label="数量" width="100" />
              <el-table-column label="占比" width="120">
                <template #default="{ row }">
                  {{ ((row.count / overview.total) * 100).toFixed(1) }}%
                </template>
              </el-table-column>
            </el-table>
          </div>
        </el-card>
      </el-col>

      <el-col :span="12">
        <el-card>
          <template #header>
            <span>设备分类统计</span>
          </template>
          <div class="chart-container">
            <el-table :data="overview.category_stats || []" border stripe>
              <el-table-column prop="name" label="分类" width="150" />
              <el-table-column prop="count" label="数量" width="100" />
              <el-table-column label="占比" width="120">
                <template #default="{ row }">
                  {{ ((row.count / overview.total) * 100).toFixed(1) }}%
                </template>
              </el-table-column>
            </el-table>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row style="margin-top: 20px;">
      <el-col :span="24">
        <el-card>
          <template #header>
            <span>设备列表</span>
            <el-button type="primary" style="float: right;" @click="loadData">
              <el-icon><Refresh /></el-icon>刷新
            </el-button>
          </template>
          <el-table :data="equipmentList" v-loading="loading" border stripe>
            <el-table-column prop="asset_code" label="资产编号" width="140" />
            <el-table-column prop="name" label="设备名称" width="180" />
            <el-table-column prop="brand" label="品牌" width="120" />
            <el-table-column prop="model" label="型号" width="150" />
            <el-table-column label="状态" width="100">
              <template #default="{ row }">
                <el-tag :type="getStatusType(row.status)">
                  {{ getStatusText(row.status) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="location" label="存放位置" width="150" />
            <el-table-column prop="responsible_name" label="负责人" width="100" />
            <el-table-column prop="price" label="价格" width="120">
              <template #default="{ row }">
                ¥{{ row.price?.toFixed(2) || '0.00' }}
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Refresh } from '@element-plus/icons-vue'
import { get } from '@/utils/request'

const loading = ref(false)
const overview = ref({})
const equipmentList = ref([])

const statusData = computed(() => {
  if (!overview.value.status_stats) return []
  return Object.entries(overview.value.status_stats).map(([name, count]) => ({ name, count }))
})

const getStatusType = (status) => {
  const map = {
    available: 'success',
    borrowed: 'warning',
    maintenance: 'danger',
    reserved: 'info'
  }
  return map[status] || 'info'
}

const getStatusText = (status) => {
  const map = {
    available: '可用',
    borrowed: '已借',
    maintenance: '维修',
    reserved: '预约'
  }
  return map[status] || status
}

const loadOverview = async () => {
  try {
    const res = await get('/equipment/statistics/overview')
    overview.value = res || {}
  } catch (error) {
    console.error('加载统计数据失败:', error)
    ElMessage.error('加载统计数据失败')
  }
}

const loadData = async () => {
  loading.value = true
  try {
    const res = await get('/equipment')
    equipmentList.value = res || []
  } catch (error) {
    console.error('加载设备列表失败:', error)
    ElMessage.error('加载设备列表失败')
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadOverview()
  loadData()
})
</script>

<style scoped lang="scss">
.page-container {
  padding: 20px;
}

.stat-card {
  text-align: center;
}

.chart-container {
  height: 300px;
  overflow-y: auto;
}
</style>
