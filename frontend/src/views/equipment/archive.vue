<template>
  <div class="page-container">
    <el-card class="main-card">
      <div class="page-title">设备档案管理</div>
      
      <div class="search-row">
        <el-input v-model="searchForm.keyword" placeholder="设备名称/资产编号" clearable class="search-input" />
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
        <el-select v-model="searchForm.location" placeholder="存放位置" clearable class="search-select">
          <el-option label="全部" :value="null" />
          <el-option v-for="loc in locationList" :key="loc" :label="loc" :value="loc" />
        </el-select>
      </div>
      
      <div class="button-row">
        <el-button type="success" @click="handleSearch">
          <el-icon><Search /></el-icon>搜索
        </el-button>
        <el-button @click="handleReset">
          <el-icon><Refresh /></el-icon>重置
        </el-button>
        <el-button type="primary" @click="handleAdd">
          <el-icon><Plus /></el-icon>添加设备
        </el-button>
        <el-button type="warning" @click="handleImport">
          <el-icon><Upload /></el-icon>批量导入
        </el-button>
      </div>

      <el-table :data="tableData" v-loading="loading" border stripe>
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
        <el-table-column prop="department_name" label="所属部门" width="120" />
        <el-table-column label="操作" fixed="right" width="280">
          <template #default="{ row }">
            <div class="action-buttons">
              <el-button type="primary" size="small" @click="handleView(row)">查看</el-button>
              <el-button type="success" size="small" @click="handleEdit(row)">编辑</el-button>
              <el-button type="warning" size="small" @click="handleStatusChange(row)">状态变更</el-button>
              <el-button type="danger" size="small" @click="handleDelete(row)">删除</el-button>
            </div>
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

    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="900px" @close="handleDialogClose">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="120px">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="资产编号" prop="asset_code">
              <el-input v-model="form.asset_code" :disabled="!!form.id" placeholder="请输入资产编号" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="设备名称" prop="name">
              <el-input v-model="form.name" placeholder="请输入设备名称" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="设备分类" prop="category_id">
              <el-select v-model="form.category_id" placeholder="请选择分类" style="width: 100%">
                <el-option v-for="item in categoryList" :key="item.id" :label="item.name" :value="item.id" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="型号" prop="model">
              <el-input v-model="form.model" placeholder="请输入型号" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="计量单位" prop="unit">
              <el-select v-model="form.unit" placeholder="请选择计量单位" style="width: 100%">
                <el-option label="台" value="台" />
                <el-option label="套" value="套" />
                <el-option label="件" value="件" />
                <el-option label="个" value="个" />
                <el-option label="组" value="组" />
                <el-option label="台/套" value="台/套" />
                <el-option label="其他" value="其他" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="品牌" prop="brand">
              <el-input v-model="form.brand" placeholder="请输入品牌" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="序列号" prop="serial_number">
              <el-input v-model="form.serial_number" placeholder="请输入序列号" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="购入日期" prop="purchase_date">
              <el-date-picker v-model="form.purchase_date" type="date" placeholder="请选择日期" style="width: 100%" value-format="YYYY-MM-DD" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="价格" prop="price">
              <el-input-number v-model="form.price" :min="0" :precision="2" placeholder="请输入价格" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="经费来源" prop="funding_source">
              <el-input v-model="form.funding_source" placeholder="请输入经费来源" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="使用年限(年)" prop="use_years">
              <el-input-number v-model="form.use_years" :min="0" placeholder="请输入使用年限" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="供应商" prop="supplier">
              <el-input v-model="form.supplier" placeholder="请输入供应商" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="保修期" prop="warranty_period">
              <el-input v-model="form.warranty_period" placeholder="请输入保修期（如：2年）" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="存放位置" prop="location">
              <el-input v-model="form.location" placeholder="请输入存放位置" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="所属部门" prop="department_id">
              <el-select v-model="form.department_id" placeholder="请选择部门" style="width: 100%">
                <el-option v-for="dept in departmentList" :key="dept.id" :label="dept.name" :value="dept.id" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="责任人" prop="responsible_user_id">
              <el-select v-model="form.responsible_user_id" placeholder="请选择责任人" style="width: 100%">
                <el-option v-for="user in userList" :key="user.UserID" :label="user.RealName" :value="user.UserID" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="是否重要设备">
              <el-switch v-model="form.is_important" active-text="是" inactive-text="否" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="检定日期" prop="calibration_date">
              <el-date-picker v-model="form.calibration_date" type="date" placeholder="请选择检定日期" style="width: 100%" value-format="YYYY-MM-DD" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="下次检定提醒" prop="next_calibration_reminder">
              <el-date-picker v-model="form.next_calibration_reminder" type="date" placeholder="请选择提醒日期" style="width: 100%" value-format="YYYY-MM-DD" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="规格" prop="specification">
          <el-input v-model="form.specification" type="textarea" :rows="2" placeholder="请输入规格" />
        </el-form-item>
        <el-form-item label="标签" prop="tags">
          <el-input v-model="form.tags" placeholder="请输入标签（多个标签用逗号分隔）" />
        </el-form-item>
        <el-form-item label="附件">
          <el-upload
            class="upload-demo"
            action="/api/equipment/upload"
            :file-list="fileList"
            :on-success="handleUploadSuccess"
            :on-remove="handleFileRemove"
            :before-upload="beforeUpload"
            multiple
          >
            <el-button type="primary">
              <el-icon><Upload /></el-icon>点击上传
            </el-button>
            <template #tip>
              <div class="el-upload__tip">支持上传照片、合同、说明书、证书等文件</div>
            </template>
          </el-upload>
        </el-form-item>
        <el-form-item label="备注" prop="description">
          <el-input v-model="form.description" type="textarea" :rows="3" placeholder="请输入备注" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="viewDialogVisible" title="设备详情" width="800px">
      <el-descriptions :column="2" border>
        <el-descriptions-item label="资产编号">{{ viewData.asset_code }}</el-descriptions-item>
        <el-descriptions-item label="设备名称">{{ viewData.name }}</el-descriptions-item>
        <el-descriptions-item label="设备分类">{{ viewData.category_name }}</el-descriptions-item>
        <el-descriptions-item label="型号">{{ viewData.model }}</el-descriptions-item>
        <el-descriptions-item label="品牌">{{ viewData.brand }}</el-descriptions-item>
        <el-descriptions-item label="序列号">{{ viewData.serial_number }}</el-descriptions-item>
        <el-descriptions-item label="购入日期">{{ viewData.purchase_date }}</el-descriptions-item>
        <el-descriptions-item label="价格">¥{{ viewData.price?.toFixed(2) || '0.00' }}</el-descriptions-item>
        <el-descriptions-item label="经费来源">{{ viewData.funding_source }}</el-descriptions-item>
        <el-descriptions-item label="使用年限">{{ viewData.use_years }}年</el-descriptions-item>
        <el-descriptions-item label="供应商">{{ viewData.supplier }}</el-descriptions-item>
        <el-descriptions-item label="保修期">{{ viewData.warranty_period }}</el-descriptions-item>
        <el-descriptions-item label="存放位置">{{ viewData.location }}</el-descriptions-item>
        <el-descriptions-item label="所属部门">{{ viewData.department_name }}</el-descriptions-item>
        <el-descriptions-item label="责任人">{{ viewData.responsible_name }}</el-descriptions-item>
        <el-descriptions-item label="是否重要">
          <el-tag :type="viewData.is_important ? 'warning' : 'info'">
            {{ viewData.is_important ? '是' : '否' }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="getStatusType(viewData.status)">
            {{ getStatusText(viewData.status) }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="规格">{{ viewData.specification }}</el-descriptions-item>
        <el-descriptions-item label="标签">{{ viewData.tags }}</el-descriptions-item>
        <el-descriptions-item label="备注" :span="2">{{ viewData.description }}</el-descriptions-item>
      </el-descriptions>
      <template #footer>
        <el-button @click="viewDialogVisible = false">关闭</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="statusDialogVisible" title="状态变更" width="400px">
      <el-form ref="statusFormRef" :model="statusForm" :rules="statusRules" label-width="100px">
        <el-form-item label="当前状态">
          <el-tag :type="getStatusType(currentRow?.status)">
            {{ getStatusText(currentRow?.status) }}
          </el-tag>
        </el-form-item>
        <el-form-item label="变更状态" prop="status">
          <el-select v-model="statusForm.status" placeholder="请选择状态" style="width: 100%">
            <el-option v-for="item in availableStatusList" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="变更原因" prop="reason">
          <el-input v-model="statusForm.reason" type="textarea" :rows="3" placeholder="请输入变更原因" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="statusDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleStatusSubmit">确定变更</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="importDialogVisible" title="批量导入" width="500px">
      <div class="import-content">
        <el-upload
          class="upload-excel"
          :action="uploadAction"
          :headers="uploadHeaders"
          :file-list="importFileList"
          :on-success="handleImportSuccess"
          :on-remove="handleImportFileRemove"
          :before-upload="beforeImportUpload"
          :on-error="handleImportError"
          :on-change="handleImportFileChange"
          :auto-upload="false"
          accept=".xlsx,.xls"
          ref="uploadRef"
        >
          <el-button type="primary" size="large">
            <el-icon><Upload /></el-icon>选择Excel文件
          </el-button>
        </el-upload>
        <p class="import-tip">请下载模板并按格式填写数据后上传</p>
        <p class="import-tip">提示：设备数据请从第4行开始填写，第1行为表头，第2-3行为说明信息</p>
        <el-button type="text" @click="downloadTemplate">下载导入模板</el-button>
      </div>
      <template #footer>
        <el-button @click="importDialogVisible = false">关闭</el-button>
        <el-button type="primary" @click="handleSubmitImport" :disabled="importFileList.length === 0">开始导入</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, Refresh, Plus, Upload } from '@element-plus/icons-vue'
import { get, post, put, del } from '@/utils/request'
import { useUserStore } from '@/stores/user'

const userStore = useUserStore()

const loading = ref(false)
const dialogVisible = ref(false)
const viewDialogVisible = ref(false)
const statusDialogVisible = ref(false)
const importDialogVisible = ref(false)
const dialogTitle = ref('新增设备')
const currentRow = ref(null)
const formRef = ref(null)
const statusFormRef = ref(null)
const uploadRef = ref(null)

const tableData = ref([])
const categoryList = ref([])
const userList = ref([])
const departmentList = ref([])
const locationList = ref([])
const fileList = ref([])
const importFileList = ref([])

// 上传配置
const uploadAction = computed(() => {
  return '/api/v1/equipment/import'
})

const uploadHeaders = computed(() => {
  return {
    Authorization: userStore.token ? `Bearer ${userStore.token}` : ''
  }
})

const viewData = reactive({})

const searchForm = reactive({
  keyword: '',
  category_id: null,
  status: null,
  location: null
})

const pagination = reactive({
  page: 1,
  pageSize: 20,
  total: 0
})

const form = reactive({
  asset_code: '',
  name: '',
  category_id: null,
  model: '',
  unit: '',
  brand: '',
  serial_number: '',
  purchase_date: '',
  price: 0,
  funding_source: '',
  use_years: 0,
  supplier: '',
  warranty_period: '',
  location: '',
  department_id: null,
  responsible_user_id: null,
  is_important: false,
  calibration_date: '',
  next_calibration_reminder: '',
  specification: '',
  tags: '',
  description: '',
  attachments: []
})

const statusForm = reactive({
  status: '',
  reason: ''
})

const rules = {
  asset_code: [{ required: true, message: '请输入资产编号', trigger: 'blur' }],
  name: [{ required: true, message: '请输入设备名称', trigger: 'blur' }],
  category_id: [{ required: true, message: '请选择设备分类', trigger: 'change' }],
  unit: [{ required: true, message: '请选择计量单位', trigger: 'change' }],
  purchase_date: [{ required: true, message: '请选择购入日期', trigger: 'change' }]
}

const statusRules = {
  status: [{ required: true, message: '请选择变更状态', trigger: 'change' }],
  reason: [{ required: true, message: '请输入变更原因', trigger: 'blur' }]
}

const statusMap = {
  available: { label: '在库-可用', type: 'success' },
  maintenance: { label: '在库-待维修', type: 'warning' },
  reserved: { label: '在库-已预约', type: 'info' },
  borrowed: { label: '借出', type: 'warning' },
  repairing: { label: '送修', type: 'danger' },
  scrapped: { label: '报废', type: 'danger' },
  lost: { label: '丢失', type: 'danger' }
}

const getStatusType = (status) => {
  return statusMap[status]?.type || 'info'
}

const getStatusText = (status) => {
  return statusMap[status]?.label || status
}

const availableStatusList = computed(() => {
  const allStatus = Object.keys(statusMap).map(key => ({
    value: key,
    label: statusMap[key].label
  }))
  return allStatus
})

const loadData = async () => {
  loading.value = true
  try {
    const params = {
      keyword: searchForm.keyword,
      category_id: searchForm.category_id,
      status: searchForm.status,
      location: searchForm.location,
      page: pagination.page,
      pageSize: pagination.pageSize
    }
    console.log('请求参数:', params)
    const res = await get('/equipment', params)
    console.log('响应结果类型:', typeof res)
    console.log('响应结果:', res)
    console.log('响应结果.data:', res?.data)
    console.log('响应结果.total:', res?.total)
    tableData.value = res?.data || []
    pagination.total = res?.total || 0
    console.log('表格数据:', tableData.value)
    console.log('总数:', pagination.total)
    extractLocations()
  } catch (error) {
    console.error('加载设备列表失败:', error)
    ElMessage.error('加载设备列表失败')
  } finally {
    loading.value = false
  }
}

const extractLocations = () => {
  const locations = [...new Set(tableData.value.map(item => item.location).filter(Boolean))]
  locationList.value = locations
}

const loadCategories = async () => {
  try {
    const res = await get('/equipment/categories')
    categoryList.value = res || []
  } catch (error) {
    console.error('加载分类失败:', error)
  }
}

const loadUsers = async () => {
  try {
    const res = await get('/users')
    userList.value = res || []
  } catch (error) {
    console.error('加载用户失败:', error)
  }
}

const loadDepartments = async () => {
  try {
    const res = await get('/departments')
    departmentList.value = res?.map(d => ({ id: d.DepartmentID, name: d.DepartmentName })) || []
  } catch (error) {
    console.error('加载部门失败:', error)
  }
}

const handleSearch = () => {
  pagination.page = 1
  loadData()
}

const handleReset = () => {
  searchForm.keyword = ''
  searchForm.category_id = null
  searchForm.status = null
  searchForm.location = null
  pagination.page = 1
  loadData()
}

const handleAdd = () => {
  dialogTitle.value = '新增设备'
  resetForm()
  fileList.value = []
  dialogVisible.value = true
}

const resetForm = () => {
  Object.keys(form).forEach(key => {
    if (key === 'price') {
      form[key] = 0
    } else if (key === 'use_years') {
      form[key] = 0
    } else if (key === 'is_important') {
      form[key] = false
    } else if (key === 'attachments') {
      form[key] = []
    } else {
      form[key] = ''
    }
  })
}

const handleView = (row) => {
  Object.assign(viewData, row)
  viewDialogVisible.value = true
}

const handleEdit = (row) => {
  dialogTitle.value = '编辑设备'
  Object.assign(form, row)
  fileList.value = row.attachments ? JSON.parse(row.attachments).map(f => ({
    name: f,
    url: `/api/equipment/download/${f}`,
    status: 'success'
  })) : []
  dialogVisible.value = true
}

const handleStatusChange = (row) => {
  currentRow.value = row
  statusForm.status = ''
  statusForm.reason = ''
  statusDialogVisible.value = true
}

const handleDelete = async (row) => {
  try {
    await ElMessageBox.confirm('确定要删除该设备吗？', '提示', {
      type: 'warning'
    })
    await del(`/equipment/${row.id}`)
    ElMessage.success('删除成功')
    loadData()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除失败:', error)
      ElMessage.error('删除失败')
    }
  }
}

const handleSubmit = async () => {
  try {
    const submitData = { ...form, attachments: fileList.value.map(f => f.name) }
    console.log('提交数据:', submitData)
    let result
    if (form.id) {
      result = await put(`/equipment/${form.id}`, submitData)
    } else {
      result = await post('/equipment', submitData)
    }
    console.log('提交结果:', result)
    ElMessage.success(form.id ? '更新成功' : '创建成功')
    dialogVisible.value = false
    loadData()
  } catch (error) {
    console.error('提交失败:', error)
    ElMessage.error('提交失败: ' + (error.message || '未知错误'))
  }
}

const handleStatusSubmit = async () => {
  try {
    await put(`/equipment/${currentRow.value.id}/status`, {
      status: statusForm.status,
      reason: statusForm.reason
    })
    ElMessage.success('状态变更成功')
    statusDialogVisible.value = false
    loadData()
  } catch (error) {
    console.error('状态变更失败:', error)
    ElMessage.error('状态变更失败')
  }
}

const handleImport = () => {
  importFileList.value = []
  importDialogVisible.value = true
}

const handleImportFileChange = (file, fileList) => {
  console.log('文件变化', file, fileList)
  importFileList.value = fileList.slice(-1)
}

const handleSubmitImport = () => {
  console.log('开始导入', uploadRef.value)
  if (uploadRef.value) {
    const inputEl = uploadRef.value.$el.querySelector('input[type="file"]')
    if (inputEl && inputEl.files && inputEl.files.length > 0) {
      const formData = new FormData()
      formData.append('file', inputEl.files[0])
      
      const xhr = new XMLHttpRequest()
      xhr.open('POST', uploadAction.value, true)
      
      // 添加认证头
      if (uploadHeaders.value.Authorization) {
        xhr.setRequestHeader('Authorization', uploadHeaders.value.Authorization)
      }
      
      xhr.onload = function() {
        if (xhr.status === 200) {
          try {
            const response = JSON.parse(xhr.responseText)
            handleImportSuccess(response)
          } catch (e) {
            ElMessage.error('导入失败：解析响应失败')
          }
        } else {
          try {
            const response = JSON.parse(xhr.responseText)
            ElMessage.error(response.message || '导入失败')
          } catch (e) {
            ElMessage.error('导入失败：服务器错误')
          }
        }
      }
      
      xhr.onerror = function() {
        ElMessage.error('导入失败：网络错误')
      }
      
      xhr.send(formData)
    } else {
      ElMessage.error('请先选择要导入的Excel文件')
    }
  } else {
    ElMessage.error('上传组件初始化失败，请刷新页面重试')
  }
}

const handleUploadSuccess = (response, file) => {
  ElMessage.success('文件上传成功')
}

const handleFileRemove = (file) => {
  form.attachments = form.attachments.filter(f => f !== file.name)
}

const beforeUpload = (file) => {
  const isLt2M = file.size / 1024 / 1024 < 10
  if (!isLt2M) {
    ElMessage.error('单个文件大小不能超过10MB')
  }
  return isLt2M
}

const handleImportSuccess = (response) => {
  const resultData = response.data || response
  if (resultData.code === 200 || resultData.success !== undefined) {
    const result = resultData.data || resultData
    let message = ''
    if (result.failed > 0) {
      message = `导入完成，成功 ${result.success} 条，失败 ${result.failed} 条`
      if (result.errors && result.errors.length > 0) {
        message += `\n失败原因：\n${result.errors.slice(0, 5).join('\n')}`
        if (result.errors.length > 5) {
          message += `\n...还有 ${result.errors.length - 5} 条错误`
        }
      }
      ElMessage.warning(message)
    } else {
      message = `导入成功，成功导入 ${result.success} 条`
      ElMessage.success(message)
    }
    importDialogVisible.value = false
    importFileList.value = []
    loadData()
  } else {
    ElMessage.error(resultData.message || '导入失败')
  }
}

const handleImportError = (error) => {
  console.error('导入失败:', error)
  ElMessage.error('导入失败，请稍后重试')
}

const handleImportFileRemove = () => {
  importFileList.value = []
}

const beforeImportUpload = (file) => {
  const isExcel = file.type === 'application/vnd.ms-excel' || 
                  file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  if (!isExcel) {
    ElMessage.error('请上传Excel文件')
  }
  return isExcel
}

const downloadTemplate = async () => {
  try {
    const response = await get('/equipment/import/template', null, {
      responseType: 'blob'
    })
    const url = window.URL.createObjectURL(new Blob([response], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    }))
    const link = document.createElement('a')
    link.href = url
    link.download = '设备导入模板.xlsx'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
  } catch (error) {
    console.error('下载模板失败:', error)
  }
}

const handleDialogClose = () => {
  formRef.value?.resetFields()
  fileList.value = []
}

onMounted(() => {
  loadData()
  loadCategories()
  loadUsers()
  loadDepartments()
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

.search-input {
  width: 200px;
}

.search-select {
  width: 140px;
}

.action-buttons {
  display: flex;
  gap: 8px;
}

.import-content {
  padding: 20px;
  text-align: center;
}

.upload-excel {
  margin-bottom: 15px;
}

.import-tip {
  color: #999;
  margin-bottom: 10px;
}
</style>