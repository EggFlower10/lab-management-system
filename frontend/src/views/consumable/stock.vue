<template>
  <div class="page-container">
    <el-card class="main-card">
      <div class="page-title">库存管理</div>

      <div class="toolbar">
        <el-input v-model="searchForm.name" placeholder="耗材名称/编号" clearable class="toolbar-item" />
        <el-select v-model="searchForm.category_id" placeholder="分类" clearable class="toolbar-item">
          <el-option label="全部分类" value="" />
          <el-option v-for="item in categoryList" :key="item.id" :label="item.name" :value="item.id" />
        </el-select>
        <el-switch
          v-model="searchForm.low_stock"
          active-text="只看低库存"
          inactive-text="全部库存"
        />
        <el-button type="primary" @click="handleSearch">查询</el-button>
        <el-button @click="handleReset">重置</el-button>
        <el-button type="danger" plain @click="openWarningsDialog()">预警记录</el-button>
        <el-button type="warning" @click="openAdjustDialog()">库存调整</el-button>
      </div>

      <div class="stats-grid">
        <el-statistic title="耗材种类" :value="stats.total_count" />
        <el-statistic title="库存总量" :value="stats.total_stock" />
        <el-statistic title="库存总价值" :value="stats.total_value" :precision="2" />
        <el-statistic title="低库存预警" :value="stats.low_stock_count" />
      </div>

      <el-table :data="tableData" v-loading="loading" border stripe>
        <el-table-column prop="consumable_no" label="耗材编号" width="130" />
        <el-table-column prop="consumable_name" label="耗材名称" min-width="180" />
        <el-table-column prop="category_name" label="分类" width="120" />
        <el-table-column prop="specification" label="规格型号" min-width="140" />
        <el-table-column prop="unit" label="单位" width="80" />
        <el-table-column label="当前库存" width="100">
          <template #default="{ row }">
            {{ formatStockNumber(row.stock) }}
          </template>
        </el-table-column>
        <el-table-column label="锁定库存" width="100">
          <template #default="{ row }">
            {{ formatStockNumber(row.locked_stock) }}
          </template>
        </el-table-column>
        <el-table-column label="可用库存" width="100">
          <template #default="{ row }">
            {{ formatStockNumber(row.available_stock) }}
          </template>
        </el-table-column>
        <el-table-column label="预警阈值" width="100">
          <template #default="{ row }">
            {{ formatStockNumber(row.min_stock) }}
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="Number(row.is_low_stock) ? 'danger' : 'success'">
              {{ Number(row.is_low_stock) ? '低库存' : '正常' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="location" label="存放位置" min-width="140" />
        <el-table-column label="操作" fixed="right" width="180">
          <template #default="{ row }">
            <el-button size="small" @click="openAdjustDialog(row)">调整</el-button>
            <el-button size="small" type="primary" @click="openLogsDialog(row)">日志</el-button>
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

    <el-dialog v-model="adjustDialogVisible" title="库存调整" width="520px">
      <el-form ref="adjustFormRef" :model="adjustForm" :rules="adjustRules" label-width="110px">
        <el-form-item label="耗材" prop="consumable_id">
          <el-select
            v-if="!adjustForm.locked"
            v-model="adjustForm.consumable_id"
            placeholder="请选择耗材"
            style="width: 100%"
            @change="handleAdjustConsumableChange"
          >
            <el-option
              v-for="item in consumableOptions"
              :key="item.id"
              :label="`${item.consumable_name}（可用 ${formatStockNumber(item.available_stock)}）`"
              :value="item.id"
            />
          </el-select>
          <el-input v-else v-model="adjustForm.consumable_name" disabled />
        </el-form-item>
        <el-form-item label="当前库存">
          <el-input :model-value="String(formatStockNumber(adjustForm.current_stock))" disabled />
        </el-form-item>
        <el-form-item label="锁定库存">
          <el-input :model-value="String(formatStockNumber(adjustForm.locked_stock))" disabled />
        </el-form-item>
        <el-form-item label="调整类型">
          <el-radio-group v-model="adjustForm.change_type">
            <el-radio label="adjust_add">增加</el-radio>
            <el-radio label="adjust_reduce">减少</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="调整数量" prop="quantity">
          <el-input-number v-model="adjustForm.quantity" :min="1" style="width: 100%" />
        </el-form-item>
        <el-form-item label="调整说明" prop="remark">
          <el-input v-model="adjustForm.remark" type="textarea" :rows="3" placeholder="请输入调整说明" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="adjustDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitAdjust">确定</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="logsDialogVisible" title="库存日志" width="960px">
      <div class="toolbar compact">
        <el-select v-model="logFilters.change_type" placeholder="变动类型" clearable class="toolbar-item">
          <el-option label="全部" value="" />
          <el-option label="入库" value="in" />
          <el-option label="出库" value="out" />
          <el-option label="调整增加" value="adjust_add" />
          <el-option label="调整减少" value="adjust_reduce" />
        </el-select>
        <el-button type="primary" @click="loadLogs">查询</el-button>
      </div>

      <el-table :data="logData" v-loading="logLoading" border stripe>
        <el-table-column prop="consumable_name" label="耗材名称" min-width="160" />
        <el-table-column prop="change_type" label="变动类型" width="120" />
        <el-table-column prop="before_stock" label="调整前" width="90" />
        <el-table-column prop="after_stock" label="调整后" width="90" />
        <el-table-column prop="quantity" label="数量" width="90" />
        <el-table-column prop="operator_name" label="操作人" width="120" />
        <el-table-column prop="related_no" label="关联单号" width="160" />
        <el-table-column prop="remark" label="备注" min-width="160" show-overflow-tooltip />
        <el-table-column prop="created_at" label="时间" width="180" />
      </el-table>
    </el-dialog>

    <el-dialog v-model="warningsDialogVisible" title="库存预警记录" width="1100px">
      <div class="toolbar compact">
        <el-input v-model="warningFilters.name" placeholder="耗材名称/编号" clearable class="toolbar-item" />
        <el-select v-model="warningFilters.status" placeholder="预警状态" clearable class="toolbar-item">
          <el-option label="全部" value="" />
          <el-option label="未处理" value="active" />
          <el-option label="已处理" value="resolved" />
        </el-select>
        <el-button type="primary" @click="handleWarningSearch">查询</el-button>
        <el-button @click="handleWarningReset">重置</el-button>
      </div>

      <el-table :data="warningData" v-loading="warningLoading" border stripe>
        <el-table-column prop="consumable_no" label="耗材编号" width="140" />
        <el-table-column prop="consumable_name" label="耗材名称" min-width="180" />
        <el-table-column prop="category_name" label="分类" width="120" />
        <el-table-column label="当前库存" width="100">
          <template #default="{ row }">
            {{ formatStockNumber(row.stock) }}
          </template>
        </el-table-column>
        <el-table-column label="锁定库存" width="100">
          <template #default="{ row }">
            {{ formatStockNumber(row.locked_stock) }}
          </template>
        </el-table-column>
        <el-table-column label="可用库存" width="100">
          <template #default="{ row }">
            {{ formatStockNumber(row.available_stock) }}
          </template>
        </el-table-column>
        <el-table-column label="预警阈值" width="100">
          <template #default="{ row }">
            {{ formatStockNumber(row.min_stock) }}
          </template>
        </el-table-column>
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
              @click="handleResolveWarning(row)"
            >
              标记处理
            </el-button>
            <span v-else class="muted-text">已处理</span>
          </template>
        </el-table-column>
      </el-table>

      <el-pagination
        v-model:current-page="warningPagination.page"
        v-model:page-size="warningPagination.pageSize"
        :total="warningPagination.total"
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="loadWarnings"
        @current-change="loadWarnings"
      />
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import { get, post, put } from '@/utils/request'

interface CategoryItem {
  id: number
  name: string
}

interface ConsumableItem {
  id: number
  consumable_no: string
  consumable_name: string
  category_name?: string
  specification?: string
  unit?: string
  stock: number
  locked_stock: number
  available_stock: number
  min_stock: number
  is_low_stock?: number
  location?: string
}

interface StockLogItem {
  consumable_name: string
  change_type: string
  before_stock: number
  after_stock: number
  quantity: number
  operator_name?: string
  related_no?: string
  remark?: string
  created_at?: string
}

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

const normalizeConsumableItem = (item: Partial<ConsumableItem>): ConsumableItem => {
  const stock = Number(item.stock ?? 0)
  const lockedStock = Number(item.locked_stock ?? 0)
  const availableStock = item.available_stock === undefined || item.available_stock === null
    ? stock - lockedStock
    : Number(item.available_stock)

  return {
    ...(item as ConsumableItem),
    stock,
    locked_stock: lockedStock,
    available_stock: availableStock,
    min_stock: Number(item.min_stock ?? 0)
  }
}

const formatStockNumber = (value?: number | null) => Number(value ?? 0)

const loading = ref(false)
const tableData = ref<ConsumableItem[]>([])
const categoryList = ref<CategoryItem[]>([])
const consumableOptions = ref<ConsumableItem[]>([])
const stats = reactive({
  total_count: 0,
  total_stock: 0,
  total_value: 0,
  low_stock_count: 0
})

const pagination = reactive({
  page: 1,
  pageSize: 20,
  total: 0
})

const searchForm = reactive({
  name: '',
  category_id: '' as number | '',
  low_stock: false
})

const adjustDialogVisible = ref(false)
const adjustFormRef = ref<FormInstance>()
const adjustForm = reactive({
  consumable_id: null as number | null,
  consumable_name: '',
  current_stock: 0,
  locked_stock: 0,
  quantity: 1,
  change_type: 'adjust_add',
  remark: '',
  locked: false
})

const adjustRules: FormRules = {
  consumable_id: [{ required: true, message: '请选择耗材', trigger: 'change' }],
  quantity: [{ required: true, message: '请输入调整数量', trigger: 'change' }],
  remark: [{ required: true, message: '请输入调整说明', trigger: 'blur' }]
}

const logsDialogVisible = ref(false)
const logLoading = ref(false)
const logData = ref<StockLogItem[]>([])
const logFilters = reactive({
  consumable_id: null as number | null,
  change_type: ''
})
const warningsDialogVisible = ref(false)
const warningLoading = ref(false)
const warningData = ref<WarningItem[]>([])
const warningFilters = reactive({
  name: '',
  status: 'active'
})
const warningPagination = reactive({
  page: 1,
  pageSize: 10,
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
    if (searchForm.category_id !== '') params.category_id = searchForm.category_id
    if (searchForm.low_stock) params.low_stock = true

    const res = await get<{ data: ConsumableItem[]; total: number }>('/consumable/stock', params)
    tableData.value = (res.data || []).map((item) => normalizeConsumableItem(item))
    pagination.total = res.total || 0
  } catch (error) {
    console.error(error)
  } finally {
    loading.value = false
  }
}

const loadStats = async () => {
  const res = await get('/consumable/statistics/stock')
  Object.assign(stats, res)
}

const loadCategories = async () => {
  categoryList.value = await get<CategoryItem[]>('/consumable/categories')
}

const loadConsumableOptions = async () => {
  const res = await get<{ data: ConsumableItem[] }>('/consumable', { status: 1 })
  consumableOptions.value = (res.data || []).map((item) => normalizeConsumableItem(item as ConsumableItem))
}

const handleSearch = () => {
  pagination.page = 1
  loadData()
}

const handleReset = () => {
  searchForm.name = ''
  searchForm.category_id = ''
  searchForm.low_stock = false
  pagination.page = 1
  loadData()
}

const openAdjustDialog = (row?: ConsumableItem) => {
  adjustForm.consumable_id = row?.id || null
  adjustForm.consumable_name = row?.consumable_name || ''
  adjustForm.current_stock = formatStockNumber(row?.stock)
  adjustForm.locked_stock = formatStockNumber(row?.locked_stock)
  adjustForm.quantity = 1
  adjustForm.change_type = 'adjust_add'
  adjustForm.remark = ''
  adjustForm.locked = !!row
  adjustDialogVisible.value = true
}

const handleAdjustConsumableChange = (value: number) => {
  const selected = consumableOptions.value.find((item) => item.id === value)
  if (!selected) return
  adjustForm.consumable_name = selected.consumable_name
  adjustForm.current_stock = formatStockNumber(selected.stock)
  adjustForm.locked_stock = formatStockNumber(selected.locked_stock)
}

const submitAdjust = async () => {
  await adjustFormRef.value?.validate()
  const signedQuantity = adjustForm.change_type === 'adjust_reduce'
    ? -Math.abs(Number(adjustForm.quantity || 0))
    : Math.abs(Number(adjustForm.quantity || 0))

  await post('/consumable/stock/adjust', {
    consumable_id: adjustForm.consumable_id,
    quantity: signedQuantity,
    change_type: adjustForm.change_type,
    remark: adjustForm.remark
  })
  ElMessage.success('调整成功')
  adjustDialogVisible.value = false
  await Promise.all([loadData(), loadStats(), loadConsumableOptions()])
}

const openLogsDialog = async (row: ConsumableItem) => {
  logFilters.consumable_id = row.id
  logFilters.change_type = ''
  logsDialogVisible.value = true
  await loadLogs()
}

const loadLogs = async () => {
  if (!logFilters.consumable_id) return
  logLoading.value = true
  try {
    const params: Record<string, any> = {
      consumable_id: logFilters.consumable_id
    }
    if (logFilters.change_type) params.change_type = logFilters.change_type
    const res = await get<{ data: StockLogItem[] }>('/consumable/stock/logs', params)
    logData.value = res.data || []
  } finally {
    logLoading.value = false
  }
}

const openWarningsDialog = async () => {
  warningsDialogVisible.value = true
  warningPagination.page = 1
  await loadWarnings()
}

const loadWarnings = async () => {
  warningLoading.value = true
  try {
    const params: Record<string, any> = {
      page: warningPagination.page,
      pageSize: warningPagination.pageSize
    }
    if (warningFilters.name) params.name = warningFilters.name
    if (warningFilters.status) params.status = warningFilters.status

    const res = await get<{ data: WarningItem[]; total: number }>('/consumable/warnings', params)
    warningData.value = (res.data || []).map((item) => ({
      ...item,
      stock: formatStockNumber(item.stock),
      locked_stock: formatStockNumber(item.locked_stock),
      available_stock: formatStockNumber(item.available_stock),
      min_stock: formatStockNumber(item.min_stock)
    }))
    warningPagination.total = res.total || 0
  } catch (error) {
    console.error(error)
    warningData.value = []
    warningPagination.total = 0
  } finally {
    warningLoading.value = false
  }
}

const handleWarningSearch = () => {
  warningPagination.page = 1
  loadWarnings()
}

const handleWarningReset = () => {
  warningFilters.name = ''
  warningFilters.status = 'active'
  warningPagination.page = 1
  loadWarnings()
}

const handleResolveWarning = async (row: WarningItem) => {
  try {
    const { value } = await ElMessageBox.prompt('可填写处理说明', '处理预警', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      inputPlaceholder: '例如：已补货，等待入库'
    })

    await put(`/consumable/warnings/${row.id}/resolve`, { remark: value || '' })
    ElMessage.success('处理成功')
    await Promise.all([loadWarnings(), loadData(), loadStats(), loadConsumableOptions()])
  } catch (error: any) {
    if (error !== 'cancel' && error !== 'close') {
      ElMessage.error('处理失败')
    }
  }
}

onMounted(async () => {
  await Promise.all([loadData(), loadStats(), loadCategories(), loadConsumableOptions()])
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

.toolbar.compact {
  margin-bottom: 12px;
}

.toolbar-item {
  width: 220px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 16px;
  margin-bottom: 16px;
}

.muted-text {
  color: #909399;
}

@media (max-width: 900px) {
  .stats-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
