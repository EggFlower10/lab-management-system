<template>
  <div class="page-container">
    <el-card class="main-card">
      <div class="page-title">出库管理</div>

      <div class="toolbar">
        <el-select v-model="searchForm.status" placeholder="状态" clearable class="toolbar-item">
          <el-option label="全部" value="" />
          <el-option label="待审批" value="pending" />
          <el-option label="二级审批中" value="pending_level_2" />
          <el-option label="已通过" value="approved" />
          <el-option label="已驳回" value="rejected" />
        </el-select>
        <el-input v-model="searchForm.applicant_name" placeholder="申请人" clearable class="toolbar-item" />
        <el-input v-model="searchForm.consumable_name" placeholder="耗材名称" clearable class="toolbar-item" />
        <el-input v-model="searchForm.lab_name" placeholder="实验室/使用地点" clearable class="toolbar-item" />
        <el-date-picker v-model="searchForm.start_time" type="date" value-format="YYYY-MM-DD" placeholder="开始日期" />
        <el-date-picker v-model="searchForm.end_time" type="date" value-format="YYYY-MM-DD" placeholder="结束日期" />
        <el-button type="primary" @click="handleSearch">查询</el-button>
        <el-button @click="handleReset">重置</el-button>
        <el-button type="success" @click="openCreateDialog">新增出库申请</el-button>
      </div>

      <el-table :data="tableData" v-loading="loading" border stripe>
        <el-table-column prop="out_no" label="出库单号" width="170" />
        <el-table-column prop="consumable_name" label="耗材摘要" min-width="200" />
        <el-table-column prop="item_count" label="耗材种类" width="100" />
        <el-table-column prop="total_quantity" label="总数量" width="100" />
        <el-table-column prop="applicant_name" label="申请人" width="120" />
        <el-table-column prop="purpose" label="用途" min-width="160" show-overflow-tooltip />
        <el-table-column prop="lab_name" label="实验室/地点" width="150" />
        <el-table-column label="状态" width="120">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)">{{ getStatusText(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="approval_comment" label="审批意见" min-width="160" show-overflow-tooltip />
        <el-table-column prop="out_time" label="出库时间" width="180" />
        <el-table-column label="操作" width="260" fixed="right">
          <template #default="{ row }">
            <el-button size="small" @click="openViewDialog(row)">详情</el-button>
            <el-button
              v-if="row.status === 'pending' || row.status === 'pending_level_2'"
              size="small"
              type="primary"
              @click="openApproveDialog(row)"
            >
              审批
            </el-button>
            <el-button
              v-if="row.status !== 'approved'"
              size="small"
              type="danger"
              @click="handleDelete(row)"
            >
              删除
            </el-button>
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

    <el-dialog v-model="createDialogVisible" title="新增出库申请" width="900px">
      <el-form :model="form" label-width="110px">
        <el-form-item label="申请人">
          <el-input v-model="form.applicant_name" disabled />
        </el-form-item>
        <el-form-item label="使用地点" required>
          <el-input v-model="form.lab_name" />
        </el-form-item>
        <el-form-item label="用途" required>
          <el-input v-model="form.purpose" type="textarea" :rows="2" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="form.remark" type="textarea" :rows="2" />
        </el-form-item>
      </el-form>

      <div class="sub-toolbar">
        <div class="sub-title">领用明细</div>
        <el-button type="primary" link @click="addItemRow">新增一行</el-button>
      </div>

      <el-table :data="form.items" border>
        <el-table-column label="耗材" min-width="280">
          <template #default="{ row }">
            <el-select v-model="row.consumable_id" placeholder="请选择耗材" style="width: 100%" @change="handleItemChange(row)">
              <el-option
                v-for="item in consumableList"
                :key="item.id"
                :label="`${item.consumable_name}（可用 ${item.available_stock}）`"
                :value="item.id"
              />
            </el-select>
          </template>
        </el-table-column>
        <el-table-column label="可用库存" width="110">
          <template #default="{ row }">{{ row.available_stock || 0 }}</template>
        </el-table-column>
        <el-table-column label="数量" width="130">
          <template #default="{ row }">
            <el-input-number v-model="row.quantity" :min="1" :max="row.available_stock || 1" style="width: 100%" />
          </template>
        </el-table-column>
        <el-table-column label="备注" min-width="180">
          <template #default="{ row }">
            <el-input v-model="row.remark" />
          </template>
        </el-table-column>
        <el-table-column label="操作" width="90">
          <template #default="{ $index }">
            <el-button type="danger" link @click="removeItemRow($index)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <template #footer>
        <el-button @click="createDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitCreate">提交申请</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="approveDialogVisible" title="出库审批" width="720px">
      <el-descriptions :column="2" border class="mb-16">
        <el-descriptions-item label="出库单号">{{ currentRow.out_no }}</el-descriptions-item>
        <el-descriptions-item label="申请人">{{ currentRow.applicant_name }}</el-descriptions-item>
        <el-descriptions-item label="用途">{{ currentRow.purpose }}</el-descriptions-item>
        <el-descriptions-item label="地点">{{ currentRow.lab_name }}</el-descriptions-item>
        <el-descriptions-item label="当前阶段">{{ getStatusText(currentRow.status) }}</el-descriptions-item>
        <el-descriptions-item label="总数量">{{ currentRow.total_quantity || 0 }}</el-descriptions-item>
      </el-descriptions>

      <el-table :data="currentItems" border stripe>
        <el-table-column prop="consumable_name" label="耗材名称" min-width="180" />
        <el-table-column prop="quantity" label="数量" width="100" />
        <el-table-column prop="remark" label="备注" min-width="160" />
      </el-table>

      <el-form :model="approveForm" label-width="100px" class="mt-16">
        <el-form-item label="审批结果">
          <el-radio-group v-model="approveForm.approval_status">
            <el-radio value="approved">通过</el-radio>
            <el-radio value="rejected">驳回</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="审批意见">
          <el-input v-model="approveForm.approval_comment" type="textarea" :rows="3" />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="approveDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitApprove">提交审批</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="viewDialogVisible" title="出库详情" width="760px">
      <el-descriptions :column="2" border class="mb-16">
        <el-descriptions-item label="出库单号">{{ currentRow.out_no }}</el-descriptions-item>
        <el-descriptions-item label="申请人">{{ currentRow.applicant_name }}</el-descriptions-item>
        <el-descriptions-item label="用途">{{ currentRow.purpose }}</el-descriptions-item>
        <el-descriptions-item label="地点">{{ currentRow.lab_name }}</el-descriptions-item>
        <el-descriptions-item label="状态">{{ getStatusText(currentRow.status) }}</el-descriptions-item>
        <el-descriptions-item label="审批意见">{{ currentRow.approval_comment || '-' }}</el-descriptions-item>
      </el-descriptions>

      <el-table :data="currentItems" border stripe>
        <el-table-column prop="consumable_name" label="耗材名称" min-width="180" />
        <el-table-column prop="quantity" label="数量" width="100" />
        <el-table-column prop="remark" label="备注" min-width="160" />
      </el-table>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { del, get, post, put } from '@/utils/request'
import { useUserStore } from '@/stores/user'

interface ConsumableOption {
  id: number
  consumable_name: string
  available_stock: number
  stock?: number
  locked_stock?: number
}

interface StockOutRow {
  id: number
  out_no: string
  consumable_id?: number
  consumable_name: string
  item_count: number
  total_quantity: number
  quantity?: number
  applicant_id: number
  applicant_name: string
  purpose: string
  lab_name: string
  status: string
  approval_comment?: string
  out_time?: string
}

interface StockOutItem {
  consumable_id: number | null
  consumable_name?: string
  quantity: number
  available_stock?: number
  remark?: string
}

const userStore = useUserStore()
const loading = ref(false)
const tableData = ref<StockOutRow[]>([])
const consumableList = ref<ConsumableOption[]>([])
const currentItems = ref<StockOutItem[]>([])

const pagination = reactive({
  page: 1,
  pageSize: 20,
  total: 0
})

const searchForm = reactive({
  status: '',
  applicant_name: '',
  consumable_name: '',
  lab_name: '',
  start_time: '',
  end_time: ''
})

const createDialogVisible = ref(false)
const form = reactive({
  applicant_id: 0,
  applicant_name: '',
  purpose: '',
  lab_name: '',
  remark: '',
  items: [] as StockOutItem[]
})

const approveDialogVisible = ref(false)
const viewDialogVisible = ref(false)
const currentRow = reactive<Partial<StockOutRow>>({})
const approveForm = reactive({
  approval_status: 'approved',
  approval_comment: ''
})

const normalizeConsumableOption = (item: Partial<ConsumableOption> & Record<string, any>): ConsumableOption => {
  const stock = Number(item.stock ?? 0)
  const lockedStock = Number(item.locked_stock ?? 0)
  const availableStock = item.available_stock === undefined || item.available_stock === null
    ? (stock - lockedStock) || stock
    : Number(item.available_stock)

  return {
    id: Number(item.id || 0),
    consumable_name: String(item.consumable_name || ''),
    stock,
    locked_stock: lockedStock,
    available_stock: Math.max(0, availableStock)
  }
}

const normalizeDisplayText = (value?: string | null) => {
  const text = String(value ?? '').trim()
  if (!text) return '-'
  if (/^\?+$/.test(text)) return '-'
  return text
}

const normalizeStockOutRow = (item: Partial<StockOutRow> & Record<string, any>): StockOutRow => {
  const quantity = Number(item.total_quantity ?? item.quantity ?? 0)
  const itemCount = Number(item.item_count ?? 0) || (quantity > 0 ? 1 : 0)

  return {
    id: Number(item.id || 0),
    out_no: String(item.out_no || ''),
    consumable_name: normalizeDisplayText(item.consumable_name),
    item_count: itemCount,
    total_quantity: quantity,
    quantity,
    applicant_id: Number(item.applicant_id || 0),
    applicant_name: normalizeDisplayText(item.applicant_name),
    purpose: normalizeDisplayText(item.purpose),
    lab_name: normalizeDisplayText(item.lab_name),
    status: String(item.status || 'pending'),
    approval_comment: normalizeDisplayText(item.approval_comment),
    out_time: item.out_time || ''
  }
}

const loadData = async () => {
  loading.value = true
  try {
    const params: Record<string, any> = {
      page: pagination.page,
      pageSize: pagination.pageSize
    }
    if (searchForm.status) params.status = searchForm.status
    if (searchForm.applicant_name) params.applicant_name = searchForm.applicant_name
    if (searchForm.consumable_name) params.consumable_name = searchForm.consumable_name
    if (searchForm.lab_name) params.lab_name = searchForm.lab_name
    if (searchForm.start_time) params.start_time = searchForm.start_time
    if (searchForm.end_time) params.end_time = searchForm.end_time

    const res = await get<{ data: StockOutRow[]; total: number }>('/consumable/stock-out', params)
    tableData.value = (res.data || []).map((item) => normalizeStockOutRow(item))
    pagination.total = res.total || 0
  } finally {
    loading.value = false
  }
}

const loadConsumables = async () => {
  try {
    const res = await get<{ data: ConsumableOption[]; total: number }>('/consumable/stock', {
      page: 1,
      pageSize: 500
    })
    const rows = Array.isArray(res?.data) ? res.data : []
    consumableList.value = rows
      .map((item) => normalizeConsumableOption(item))
      .filter((item) => item.id > 0 && item.available_stock > 0)

    if (consumableList.value.length > 0) {
      return
    }
  } catch (error) {
    console.error(error)
  }

  const fallbackRes = await get<{ data: ConsumableOption[]; total: number }>('/consumable', { status: 1 })
  const fallbackRows = Array.isArray(fallbackRes?.data) ? fallbackRes.data : []
  consumableList.value = fallbackRows
    .map((item) => normalizeConsumableOption(item))
    .filter((item) => item.id > 0 && item.available_stock > 0)
}

const handleSearch = () => {
  pagination.page = 1
  loadData()
}

const handleReset = () => {
  searchForm.status = ''
  searchForm.applicant_name = ''
  searchForm.consumable_name = ''
  searchForm.lab_name = ''
  searchForm.start_time = ''
  searchForm.end_time = ''
  pagination.page = 1
  loadData()
}

const getStatusText = (status?: string) => {
  if (status === 'approved') return '已通过'
  if (status === 'rejected') return '已驳回'
  if (status === 'pending_level_2') return '二级审批中'
  return '待审批'
}

const getStatusType = (status?: string) => {
  if (status === 'approved') return 'success'
  if (status === 'rejected') return 'danger'
  if (status === 'pending_level_2') return 'primary'
  return 'warning'
}

const openCreateDialog = () => {
  form.applicant_id = userStore.userInfo?.id || 0
  form.applicant_name = userStore.realName || userStore.username || ''
  form.purpose = ''
  form.lab_name = ''
  form.remark = ''
  form.items = [{ consumable_id: null, quantity: 1, available_stock: 0, remark: '' }]
  createDialogVisible.value = true
}

const addItemRow = () => {
  form.items.push({ consumable_id: null, quantity: 1, available_stock: 0, remark: '' })
}

const removeItemRow = (index: number) => {
  if (form.items.length === 1) {
    ElMessage.warning('至少保留一条明细')
    return
  }
  form.items.splice(index, 1)
}

const handleItemChange = (row: StockOutItem) => {
  const selected = consumableList.value.find((item) => item.id === row.consumable_id)
  row.consumable_name = selected?.consumable_name || ''
  row.available_stock = Number(selected?.available_stock || 0)
  row.quantity = 1
}

const submitCreate = async () => {
  if (!form.lab_name || !form.purpose) {
    ElMessage.warning('请先填写用途和地点')
    return
  }
  const validItems = form.items.filter((item) => item.consumable_id && item.quantity > 0)
  if (!validItems.length) {
    ElMessage.warning('请至少填写一条明细')
    return
  }

  const firstItem = validItems[0]

  try {
    await post('/consumable/stock-out', {
      applicant_id: form.applicant_id,
      applicant_name: form.applicant_name,
      purpose: form.purpose,
      lab_name: form.lab_name,
      remark: form.remark,
      request_mode: validItems.length > 1 ? 'multi' : 'single',
      consumable_id: firstItem.consumable_id,
      consumable_name: firstItem.consumable_name,
      quantity: firstItem.quantity,
      items: validItems.map((item) => ({
        consumable_id: item.consumable_id,
        quantity: item.quantity,
        remark: item.remark
      }))
    })
    ElMessage.success('申请已提交')
    createDialogVisible.value = false
    pagination.page = 1
    await Promise.all([loadData(), loadConsumables()])
  } catch (error) {
    console.error(error)
  }
}

const loadItemsForRow = async (row: StockOutRow) => {
  try {
    currentItems.value = await get<StockOutItem[]>(
      `/consumable/stock-out/${row.id}/items`,
      undefined,
      { showErrorMsg: false }
    )
  } catch (error) {
    currentItems.value = [{
      consumable_id: row.consumable_id || null,
      consumable_name: row.consumable_name,
      quantity: row.total_quantity || row.quantity || 0,
      remark: ''
    }]
  }
}

const openApproveDialog = async (row: StockOutRow) => {
  Object.assign(currentRow, normalizeStockOutRow(row))
  approveForm.approval_status = 'approved'
  approveForm.approval_comment = ''
  await loadItemsForRow(row)
  approveDialogVisible.value = true
}

const submitApprove = async () => {
  await put(`/consumable/stock-out/${currentRow.id}/approve`, approveForm)
  ElMessage.success('审批成功')
  approveDialogVisible.value = false
  await Promise.all([loadData(), loadConsumables()])
}

const openViewDialog = async (row: StockOutRow) => {
  Object.assign(currentRow, normalizeStockOutRow(row))
  await loadItemsForRow(row)
  viewDialogVisible.value = true
}

const handleDelete = async (row: StockOutRow) => {
  await ElMessageBox.confirm(`确定删除出库单 ${row.out_no} 吗？`, '提示', {
    type: 'warning'
  })
  await del(`/consumable/stock-out/${row.id}`)
  ElMessage.success('删除成功')
  await Promise.all([loadData(), loadConsumables()])
}

onMounted(async () => {
  await Promise.all([loadData(), loadConsumables()])
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

.toolbar,
.actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 16px;
}

.toolbar-item {
  width: 220px;
}

.sub-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin: 12px 0;
}

.sub-title {
  font-size: 15px;
  font-weight: 600;
}

.mb-16 {
  margin-bottom: 16px;
}

.mt-16 {
  margin-top: 16px;
}
</style>
