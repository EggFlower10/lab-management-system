<template>
  <div class="page-container">
    <el-card class="table-card">
      <template #header>
        <div class="card-header">
          <span>设备管理</span>
          <div class="header-right">
            <el-input v-model="searchForm.keyword" placeholder="设备名称/资产编号" class="search-input" clearable style="width: 200px" />
            <el-select v-model="searchForm.category_id" placeholder="设备分类" clearable class="search-select">
              <el-option label="全部" :value="null" />
              <el-option v-for="item in categoryList" :key="item.id" :label="item.name" :value="item.id" />
            </el-select>
            <el-select v-model="searchForm.status" placeholder="设备状态" clearable class="search-select">
              <el-option label="全部" :value="null" />
              <el-option label="在库-可用" value="available" />
              <el-option label="借出" value="borrowed" />
              <el-option label="在库-待维修" value="maintenance" />
              <el-option label="在库-已预约" value="reserved" />
            </el-select>
            <el-button type="success" @click="loadData">
              <el-icon><Search /></el-icon>搜索
            </el-button>
            <el-button type="default" @click="resetSearch">
              <el-icon><Refresh /></el-icon>重置
            </el-button>
            <el-button type="primary" @click="handleAdd">
              <el-icon><Plus /></el-icon>新增设备
            </el-button>
          </div>
        </div>
      </template>

      <el-table :data="tableData" v-loading="loading" border stripe>
        <el-table-column prop="asset_code" label="资产编号" width="140" />
        <el-table-column prop="name" label="设备名称" width="180" />
        <el-table-column prop="category_name" label="分类" width="120" />
        <el-table-column prop="model" label="型号" width="120" />
        <el-table-column prop="brand" label="品牌" width="100" />
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)">
              {{ getStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="location" label="存放位置" width="150" />
        <el-table-column prop="responsible_name" label="负责人" width="100" />
        <el-table-column prop="price" label="价格" width="100">
          <template #default="{ row }">
            ¥{{ row.price?.toFixed(2) || '0.00' }}
          </template>
        </el-table-column>
        <el-table-column label="操作" fixed="right" width="200">
          <template #default="{ row }">
            <div class="action-buttons">
              <el-button type="primary" size="small" @click="handleEdit(row)">编辑</el-button>
              <el-button type="info" size="small" @click="handleBorrow(row)">借用</el-button>
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

    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="800px" @close="handleDialogClose">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="120px">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="资产编号" prop="asset_code">
              <el-input v-model="form.asset_code" placeholder="请输入资产编号" />
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
            <el-form-item label="品牌" prop="brand">
              <el-input v-model="form.brand" placeholder="请输入品牌" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="序列号" prop="serial_number">
              <el-input v-model="form.serial_number" placeholder="请输入序列号" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="购买日期" prop="purchase_date">
              <el-date-picker v-model="form.purchase_date" type="date" placeholder="请选择日期" style="width: 100%" value-format="YYYY-MM-DD" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="价格" prop="price">
              <el-input-number v-model="form.price" :min="0" :precision="2" placeholder="请输入价格" style="width: 100%" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="存放位置" prop="location">
              <el-input v-model="form.location" placeholder="请输入存放位置" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="负责人" prop="responsible_user_id">
              <el-select v-model="form.responsible_user_id" placeholder="请选择负责人" style="width: 100%">
                <el-option v-for="user in userList" :key="user.UserID" :label="user.RealName" :value="user.UserID" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="经费来源" prop="funding_source">
              <el-input v-model="form.funding_source" placeholder="请输入经费来源" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="使用年限" prop="use_years">
              <el-input-number v-model="form.use_years" :min="0" placeholder="请输入使用年限" style="width: 100%" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="供应商" prop="supplier">
              <el-input v-model="form.supplier" placeholder="请输入供应商" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="保修期" prop="warranty_period">
              <el-input v-model="form.warranty_period" placeholder="请输入保修期" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="规格" prop="specification">
          <el-input v-model="form.specification" type="textarea" :rows="2" placeholder="请输入规格" />
        </el-form-item>
        <el-form-item label="标签" prop="tags">
          <el-input v-model="form.tags" placeholder="请输入标签（多个标签用逗号分隔）" />
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

    <el-dialog v-model="borrowDialogVisible" title="借用设备" width="600px">
      <el-form ref="borrowFormRef" :model="borrowForm" :rules="borrowRules" label-width="120px">
        <el-form-item label="设备名称">
          <el-input v-model="currentEquipment?.name" disabled />
        </el-form-item>
        <el-form-item label="借用日期" prop="borrow_date">
          <el-date-picker v-model="borrowForm.borrow_date" type="datetime" placeholder="请选择借用日期" style="width: 100%" value-format="YYYY-MM-DD HH:mm:ss" />
        </el-form-item>
        <el-form-item label="预计归还" prop="expect_return_date">
          <el-date-picker v-model="borrowForm.expect_return_date" type="datetime" placeholder="请选择预计归还日期" style="width: 100%" value-format="YYYY-MM-DD HH:mm:ss" />
        </el-form-item>
        <el-form-item label="使用地点" prop="use_place">
          <el-input v-model="borrowForm.use_place" placeholder="请输入使用地点" />
        </el-form-item>
        <el-form-item label="用途" prop="purpose">
          <el-input v-model="borrowForm.purpose" type="textarea" :rows="3" placeholder="请输入用途" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="borrowDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmitBorrow">提交申请</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, Refresh, Plus } from '@element-plus/icons-vue'
import { get, post, put, del } from '@/utils/request'

const loading = ref(false)
const dialogVisible = ref(false)
const borrowDialogVisible = ref(false)
const dialogTitle = ref('新增设备')
const currentEquipment = ref(null)

const tableData = ref([])
const categoryList = ref([])
const userList = ref([])

const searchForm = reactive({
  keyword: '',
  category_id: null,
  status: null,
  location: ''
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
  brand: '',
  serial_number: '',
  purchase_date: '',
  price: 0,
  funding_source: '',
  use_years: 0,
  supplier: '',
  warranty_period: '',
  location: '',
  responsible_user_id: null,
  department_id: null,
  is_important: false,
  tags: '',
  description: ''
})

const borrowForm = reactive({
  borrow_date: '',
  expect_return_date: '',
  use_place: '',
  purpose: ''
})

const rules = {
  asset_code: [{ required: true, message: '请输入资产编号', trigger: 'blur' }],
  name: [{ required: true, message: '请输入设备名称', trigger: 'blur' }],
  category_id: [{ required: true, message: '请选择设备分类', trigger: 'change' }]
}

const borrowRules = {
  borrow_date: [{ required: true, message: '请选择借用日期', trigger: 'change' }],
  expect_return_date: [{ required: true, message: '请选择预计归还日期', trigger: 'change' }],
  use_place: [{ required: true, message: '请输入使用地点', trigger: 'blur' }],
  purpose: [{ required: true, message: '请输入用途', trigger: 'blur' }]
}

const getStatusType = (status) => {
  const map = {
    available: 'success',
    maintenance: 'warning',
    reserved: 'info',
    borrowed: 'danger',
    repairing: 'warning',
    scrapped: 'danger',
    lost: 'danger'
  }
  return map[status] || 'info'
}

const getStatusText = (status) => {
  const map = {
    available: '在库-可用',
    maintenance: '在库-待维修',
    reserved: '在库-已预约',
    borrowed: '借出',
    repairing: '送修',
    scrapped: '报废',
    lost: '丢失'
  }
  return map[status] || status
}

const loadData = async () => {
  loading.value = true
  try {
    const params = {
      keyword: searchForm.keyword,
      category_id: searchForm.category_id,
      status: searchForm.status
    }
    const res = await get('/equipment', params)
    tableData.value = res || []
    pagination.total = res?.length || 0
  } catch (error) {
    console.error('加载设备列表失败:', error)
    ElMessage.error('加载设备列表失败')
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

const loadUsers = async () => {
  try {
    const res = await get('/users')
    userList.value = res || []
  } catch (error) {
    console.error('加载用户失败:', error)
  }
}

const resetSearch = () => {
  searchForm.keyword = ''
  searchForm.category_id = null
  searchForm.status = null
  loadData()
}

const handleAdd = () => {
  dialogTitle.value = '新增设备'
  Object.keys(form).forEach(key => {
    form[key] = key === 'price' || key === 'use_years' || key === 'is_important' ? (key === 'is_important' ? false : 0) : ''
  })
  dialogVisible.value = true
}

const handleEdit = (row) => {
  dialogTitle.value = '编辑设备'
  Object.assign(form, row)
  dialogVisible.value = true
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
    if (form.id) {
      await put(`/equipment/${form.id}`, form)
    } else {
      await post('/equipment', form)
    }
    ElMessage.success(form.id ? '更新成功' : '创建成功')
    dialogVisible.value = false
    loadData()
  } catch (error) {
    console.error('提交失败:', error)
    ElMessage.error('提交失败')
  }
}

const handleBorrow = (row) => {
  currentEquipment.value = row
  Object.keys(borrowForm).forEach(key => {
    borrowForm[key] = ''
  })
  borrowDialogVisible.value = true
}

const handleSubmitBorrow = async () => {
  try {
    await post('/equipment/borrow', {
      equipment_id: currentEquipment.value.id,
      ...borrowForm
    })
    ElMessage.success('申请提交成功')
    borrowDialogVisible.value = false
    loadData()
  } catch (error) {
    console.error('提交申请失败:', error)
    ElMessage.error('提交申请失败')
  }
}

const handleDialogClose = () => {
  formRef.value?.resetFields()
}

onMounted(() => {
  loadData()
  loadCategories()
  loadUsers()
})
</script>

<style scoped lang="scss">
.page-container {
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-right {
  display: flex;
  gap: 10px;
  align-items: center;
}

.search-input {
  width: 180px;
}

.search-select {
  width: 150px;
}

.action-buttons {
  display: flex;
  gap: 8px;
}
</style>
