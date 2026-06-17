<template>
  <div class="page-container">
    <el-card class="main-card">
      <div class="page-title">入库管理</div>

      <div class="toolbar">
        <el-select v-model="searchForm.status" placeholder="状态" clearable class="toolbar-item">
          <el-option label="全部" value="" />
          <el-option label="待审批" value="pending" />
          <el-option label="已通过" value="approved" />
          <el-option label="已驳回" value="rejected" />
        </el-select>
        <el-input v-model="searchForm.consumable_name" placeholder="耗材名称" clearable class="toolbar-item" />
        <el-select v-model="searchForm.supplier_id" placeholder="供应商" clearable class="toolbar-item">
          <el-option label="全部供应商" value="" />
          <el-option v-for="item in supplierList" :key="item.id" :label="item.name" :value="item.id" />
        </el-select>
        <el-input v-model="searchForm.operator_name" placeholder="经办人" clearable class="toolbar-item" />
        <el-date-picker v-model="searchForm.start_time" type="date" value-format="YYYY-MM-DD" placeholder="开始日期" />
        <el-date-picker v-model="searchForm.end_time" type="date" value-format="YYYY-MM-DD" placeholder="结束日期" />
        <el-button type="primary" @click="handleSearch">查询</el-button>
        <el-button @click="handleReset">重置</el-button>
      </div>

      <div class="actions">
        <el-button type="primary" @click="openFormDialog">新增入库</el-button>
        <el-button @click="downloadImportTemplate">下载模板</el-button>
        <el-button type="success" @click="triggerImport">批量导入</el-button>
        <input ref="fileInputRef" type="file" accept=".xlsx,.xls" class="hidden-input" @change="handleFileChange" />
      </div>

      <el-table :data="tableData" v-loading="loading" border stripe>
        <el-table-column prop="in_no" label="入库单号" width="160" />
        <el-table-column prop="consumable_name" label="耗材名称" min-width="180" />
        <el-table-column prop="quantity" label="数量" width="90" />
        <el-table-column prop="price" label="单价" width="100" />
        <el-table-column prop="supplier_name" label="供应商" width="140" />
        <el-table-column prop="operator_name" label="经办人" width="120" />
        <el-table-column prop="batch_no" label="批次号" width="140" />
        <el-table-column prop="request_mode" label="来源" width="110">
          <template #default="{ row }">
            {{ row.request_mode === 'batch_import' ? '批量导入' : '手工录入' }}
          </template>
        </el-table-column>
        <el-table-column prop="in_time" label="入库时间" width="180" />
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)">{{ getStatusText(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="remark" label="备注" min-width="160" show-overflow-tooltip />
        <el-table-column label="操作" width="220" fixed="right">
          <template #default="{ row }">
            <el-button v-if="row.status === 'pending'" size="small" type="success" @click="openApproveDialog(row)">审批</el-button>
            <el-button v-if="row.status !== 'approved'" size="small" type="danger" @click="handleDelete(row)">删除</el-button>
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

    <el-dialog v-model="formDialogVisible" title="新增入库" width="620px">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="110px">
        <el-form-item label="耗材" prop="consumable_id">
          <el-select v-model="form.consumable_id" placeholder="请选择耗材" style="width: 100%" @change="handleConsumableChange">
            <el-option v-for="item in consumableList" :key="item.id" :label="item.consumable_name" :value="item.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="数量" prop="quantity">
          <el-input-number v-model="form.quantity" :min="1" style="width: 100%" />
        </el-form-item>
        <el-form-item label="单价" prop="price">
          <el-input-number v-model="form.price" :min="0" :precision="2" style="width: 100%" />
        </el-form-item>
        <el-form-item label="供应商">
          <el-select v-model="form.supplier_id" placeholder="请选择供应商" style="width: 100%">
            <el-option v-for="item in supplierList" :key="item.id" :label="item.name" :value="item.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="经办人" prop="operator_name">
          <el-input v-model="form.operator_name" />
        </el-form-item>
        <el-form-item label="入库时间">
          <el-date-picker
            v-model="form.in_time"
            type="datetime"
            value-format="YYYY-MM-DD HH:mm:ss"
            placeholder="请选择入库时间"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="批次号">
          <el-input v-model="form.batch_no" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="form.remark" type="textarea" :rows="3" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="formDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitForm">提交</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="approveDialogVisible" title="入库审批" width="460px">
      <el-form :model="approveForm" label-width="100px">
        <el-form-item label="审批结果">
          <el-radio-group v-model="approveForm.approval_status">
            <el-radio label="approved">通过</el-radio>
            <el-radio label="rejected">驳回</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="审批意见">
          <el-input v-model="approveForm.remark" type="textarea" :rows="3" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="approveDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitApprove">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import * as XLSX from 'xlsx'
import { del, get, post, put, request } from '@/utils/request'
import { useUserStore } from '@/stores/user'

interface StockInItem {
  id: number
  in_no: string
  consumable_id: number
  consumable_name: string
  quantity: number
  price: number
  supplier_id?: number | null
  supplier_name?: string
  operator_name?: string
  in_time?: string
  status: string
  remark?: string
  request_mode?: string
  batch_no?: string
}

interface ConsumableOption {
  id: number
  consumable_name: string
  consumable_no?: string
  price?: number
  supplier_id?: number | null
}

interface SupplierOption {
  id: number
  name: string
}

const userStore = useUserStore()
const loading = ref(false)
const tableData = ref<StockInItem[]>([])
const consumableList = ref<ConsumableOption[]>([])
const importConsumableList = ref<ConsumableOption[]>([])
const supplierList = ref<SupplierOption[]>([])
const fileInputRef = ref<HTMLInputElement | null>(null)

const pagination = reactive({
  page: 1,
  pageSize: 20,
  total: 0
})

const searchForm = reactive({
  status: '',
  consumable_name: '',
  supplier_id: null as number | null,
  operator_name: '',
  start_time: '',
  end_time: ''
})

const formDialogVisible = ref(false)
const formRef = ref<FormInstance>()
const form = reactive({
  consumable_id: null as number | null,
  quantity: 1,
  price: 0,
  supplier_id: null as number | null,
  operator_name: '',
  in_time: '',
  batch_no: '',
  remark: ''
})

const rules: FormRules = {
  consumable_id: [{ required: true, message: '请选择耗材', trigger: 'change' }],
  quantity: [{ required: true, message: '请输入数量', trigger: 'change' }],
  operator_name: [{ required: true, message: '请输入经办人', trigger: 'blur' }]
}

const approveDialogVisible = ref(false)
const approveForm = reactive({
  id: 0,
  approval_status: 'approved',
  remark: ''
})

const loadData = async () => {
  loading.value = true
  try {
    const params: Record<string, any> = {
      page: pagination.page,
      pageSize: pagination.pageSize
    }
    if (searchForm.status) params.status = searchForm.status
    if (searchForm.consumable_name) params.consumable_name = searchForm.consumable_name
    if (searchForm.supplier_id) params.supplier_id = searchForm.supplier_id
    if (searchForm.operator_name) params.operator_name = searchForm.operator_name
    if (searchForm.start_time) params.start_time = searchForm.start_time
    if (searchForm.end_time) params.end_time = searchForm.end_time

    const res = await get<{ data: StockInItem[]; total: number }>('/consumable/stock-in', params)
    tableData.value = res.data || []
    pagination.total = res.total || 0
  } finally {
    loading.value = false
  }
}

const loadOptions = async () => {
  const [consumables, importConsumables, suppliers] = await Promise.all([
    get<{ data: ConsumableOption[] }>('/consumable', { status: 1, pageSize: 500 }),
    get<{ data: ConsumableOption[] }>('/consumable', { pageSize: 500 }),
    get<SupplierOption[]>('/consumable/suppliers')
  ])
  consumableList.value = consumables.data || []
  importConsumableList.value = importConsumables.data || consumables.data || []
  supplierList.value = suppliers || []
}

const handleSearch = () => {
  pagination.page = 1
  loadData()
}

const handleReset = () => {
  searchForm.status = ''
  searchForm.consumable_name = ''
  searchForm.supplier_id = null
  searchForm.operator_name = ''
  searchForm.start_time = ''
  searchForm.end_time = ''
  pagination.page = 1
  loadData()
}

const openFormDialog = () => {
  form.consumable_id = null
  form.quantity = 1
  form.price = 0
  form.supplier_id = null
  form.operator_name = userStore.realName || userStore.username || ''
  form.in_time = ''
  form.batch_no = ''
  form.remark = ''
  formDialogVisible.value = true
}

const handleConsumableChange = (value: number) => {
  const selected = consumableList.value.find((item) => item.id === value)
  if (!selected) return
  form.price = Number(selected.price || 0)
  form.supplier_id = selected.supplier_id || null
}

const submitForm = async () => {
  await formRef.value?.validate()
  await post('/consumable/stock-in', {
    consumable_id: form.consumable_id,
    quantity: form.quantity,
    price: form.price,
    supplier_id: form.supplier_id,
    operator_id: userStore.userInfo?.id || 0,
    operator_name: form.operator_name,
    in_time: form.in_time,
    batch_no: form.batch_no,
    remark: form.remark,
    request_mode: 'single'
  })
  ElMessage.success('提交成功')
  formDialogVisible.value = false
  pagination.page = 1
  await loadData()
}

const openApproveDialog = (row: StockInItem) => {
  approveForm.id = row.id
  approveForm.approval_status = 'approved'
  approveForm.remark = ''
  approveDialogVisible.value = true
}

const submitApprove = async () => {
  await put(`/consumable/stock-in/${approveForm.id}/approve`, approveForm)
  ElMessage.success('审批完成')
  approveDialogVisible.value = false
  await loadData()
}

const handleDelete = async (row: StockInItem) => {
  await ElMessageBox.confirm(`确定删除入库单 ${row.in_no} 吗？`, '提示', {
    type: 'warning'
  })
  await del(`/consumable/stock-in/${row.id}`)
  ElMessage.success('删除成功')
  await loadData()
}

const getStatusType = (status: string) => {
  if (status === 'approved') return 'success'
  if (status === 'rejected') return 'danger'
  return 'warning'
}

const getStatusText = (status: string) => {
  if (status === 'approved') return '已通过'
  if (status === 'rejected') return '已驳回'
  return '待审批'
}

const normalizeImportText = (value: unknown) => String(value ?? '').trim()

const findConsumableOption = (consumableNo: string, consumableName: string) => {
  const normalizedNo = normalizeImportText(consumableNo).toLowerCase()
  const normalizedName = normalizeImportText(consumableName).toLowerCase()

  return (importConsumableList.value.length > 0 ? importConsumableList.value : consumableList.value).find((item) => {
    const itemNo = normalizeImportText(item.consumable_no).toLowerCase()
    const itemName = normalizeImportText(item.consumable_name).toLowerCase()
    return (normalizedNo && itemNo === normalizedNo) || (normalizedName && itemName === normalizedName)
  })
}

const resolveConsumableForImport = async (consumableNo: string, consumableName: string) => {
  const localMatched = findConsumableOption(consumableNo, consumableName)
  if (localMatched) {
    return localMatched
  }

  const remoteConsumables = await get<{ data: ConsumableOption[] }>('/consumable', {
    pageSize: 500,
    name: consumableName || consumableNo
  })
  const remoteList = remoteConsumables.data || []
  if (remoteList.length > 0) {
    importConsumableList.value = [...importConsumableList.value, ...remoteList]
  }

  return findConsumableOption(consumableNo, consumableName)
}

const findSupplierIdByName = (supplierName: string) => {
  const normalizedName = normalizeImportText(supplierName).toLowerCase()
  if (!normalizedName) {
    return null
  }

  const matchedSupplier = supplierList.value.find((item) => normalizeImportText(item.name).toLowerCase() === normalizedName)
  return matchedSupplier?.id ?? null
}

const normalizeImportDateTime = (value: unknown) => {
  const text = normalizeImportText(value)
  if (!text) {
    return ''
  }

  const maybeNumber = Number(text)
  if (!Number.isNaN(maybeNumber)) {
    const parsed = XLSX.SSF.parse_date_code(maybeNumber)
    if (parsed) {
      const year = parsed.y
      const month = String(parsed.m).padStart(2, '0')
      const day = String(parsed.d).padStart(2, '0')
      const hour = String(parsed.H).padStart(2, '0')
      const minute = String(parsed.M).padStart(2, '0')
      const second = String(Math.floor(parsed.S || 0)).padStart(2, '0')
      return `${year}-${month}-${day} ${hour}:${minute}:${second}`
    }
  }

  return text
}

const importRowsFromWorkbook = async (file: File) => {
  const buffer = await file.arrayBuffer()
  const workbook = XLSX.read(buffer, { type: 'array' })
  const firstSheetName = workbook.SheetNames[0]
  const worksheet = workbook.Sheets[firstSheetName]
  const rows = XLSX.utils.sheet_to_json<(string | number | null)[]>(worksheet, {
    header: 1,
    raw: false,
    defval: ''
  })

  const dataRows = rows.slice(1).filter((row) => row.some((cell) => normalizeImportText(cell) !== ''))
  if (dataRows.length === 0) {
    throw new Error('导入文件中没有可用数据')
  }

  let successCount = 0
  const errors: string[] = []

  for (let index = 0; index < dataRows.length; index += 1) {
    const row = dataRows[index] || []
    const rowNo = index + 2
    const consumableNo = normalizeImportText(row[0])
    const consumableName = normalizeImportText(row[1])
    const quantity = Number(row[2] || 0)
    const price = Number(row[3] || 0)
    const supplierName = normalizeImportText(row[4])
    const operatorName = normalizeImportText(row[5]) || userStore.realName || userStore.username || '管理员'
    const inTime = normalizeImportDateTime(row[6])
    const batchNo = normalizeImportText(row[7])
    const remark = normalizeImportText(row[8])

    if (!consumableNo && !consumableName) {
      errors.push(`第 ${rowNo} 行缺少耗材编号或耗材名称`)
      continue
    }

    if (!Number.isFinite(quantity) || quantity <= 0) {
      errors.push(`第 ${rowNo} 行入库数量必须大于 0`)
      continue
    }

    const consumable = await resolveConsumableForImport(consumableNo, consumableName)
    if (!consumable) {
      errors.push(`第 ${rowNo} 行未匹配到耗材`)
      continue
    }

    try {
      await post('/consumable/stock-in', {
        consumable_id: consumable.id,
        quantity,
        price: Number.isFinite(price) ? price : Number(consumable.price || 0),
        supplier_id: findSupplierIdByName(supplierName) ?? consumable.supplier_id ?? null,
        operator_id: userStore.userInfo?.id || 0,
        operator_name: operatorName,
        in_time: inTime,
        batch_no: batchNo,
        remark,
        request_mode: 'batch_import'
      })
      successCount += 1
    } catch (error) {
      console.error(`import consumable stock-in row ${rowNo} failed:`, error)
      errors.push(`第 ${rowNo} 行导入失败`)
    }
  }

  if (successCount === 0) {
    throw new Error(errors[0] || '批量导入失败')
  }

  if (errors.length > 0) {
    ElMessage.warning(`成功导入 ${successCount} 条，失败 ${errors.length} 条`)
    return
  }

  ElMessage.success(`成功导入 ${successCount} 条`)
}

const downloadImportTemplate = () => {
  try {
    const templateRows = [
      ['耗材编号', '耗材名称', '入库数量', '单价', '供应商', '经办人', '入库时间', '批次号', '备注'],
      ['CONS001', '无水乙醇', 10, 25, '国药集团', userStore.realName || userStore.username || '管理员', '2026-06-10 09:00:00', 'BATCH-202606', '示例数据']
    ]

    const tipRows = [
      ['填写说明'],
      ['1. 耗材编号和耗材名称至少填写一个，系统会按编号或名称匹配。'],
      ['2. 入库数量必须大于 0。'],
      ['3. 单价可留空，默认按 0 处理。'],
      ['4. 供应商需与系统中的供应商名称一致；不填也可导入。'],
      ['5. 入库时间格式建议使用 YYYY-MM-DD HH:mm:ss。'],
      ['6. 首行是表头，导入时从第 2 行开始读取。']
    ]

    const workbook = XLSX.utils.book_new()
    const templateSheet = XLSX.utils.aoa_to_sheet(templateRows)
    const tipSheet = XLSX.utils.aoa_to_sheet(tipRows)

    templateSheet['!cols'] = [
      { wch: 14 },
      { wch: 18 },
      { wch: 12 },
      { wch: 10 },
      { wch: 16 },
      { wch: 12 },
      { wch: 22 },
      { wch: 16 },
      { wch: 20 }
    ]
    tipSheet['!cols'] = [{ wch: 72 }]

    XLSX.utils.book_append_sheet(workbook, templateSheet, '耗材入库模板')
    XLSX.utils.book_append_sheet(workbook, tipSheet, '填写说明')
    XLSX.writeFile(workbook, '耗材入库模板.xlsx')
  } catch (error) {
    console.error('download consumable stock-in template failed:', error)
    ElMessage.error('下载模板失败，请稍后重试')
  }
}

const downloadTemplate = async () => {
  const blob = await request<Blob>({
    url: '/consumable/stock-in/template',
    method: 'GET',
    responseType: 'blob'
  })
  const url = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = '耗材入库模板.xlsx'
  link.click()
  window.URL.revokeObjectURL(url)
}
void downloadTemplate

const triggerImport = () => {
  fileInputRef.value?.click()
}

const handleFileChange = async (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return

  try {
    await importRowsFromWorkbook(file)
    pagination.page = 1
    await loadData()
  } catch (error: any) {
    console.error('import consumable stock-in file failed:', error)
    ElMessage.error(error?.message || '批量导入失败')
  } finally {
    target.value = ''
  }
  return

  const formData = new FormData()
  formData.append('file', file!)

  await request({
    url: '/consumable/stock-in/import',
    method: 'POST',
    data: formData,
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
  ElMessage.success('导入完成')
  target.value = ''
  pagination.page = 1
  await loadData()
}

onMounted(async () => {
  await Promise.all([loadData(), loadOptions()])
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

.hidden-input {
  display: none;
}
</style>
