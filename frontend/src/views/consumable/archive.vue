<template>
  <div class="page-container">
    <el-card class="main-card">
      <div class="page-title">耗材档案管理</div>
      
      <div class="search-row">
        <el-input v-model="searchForm.name" placeholder="耗材名称/编号" clearable class="search-input" />
        <el-select v-model="searchForm.category_id" placeholder="耗材分类" clearable class="search-select">
          <el-option label="全部" value="" />
          <el-option v-for="item in categoryList" :key="item.id" :label="item.name" :value="item.id" />
        </el-select>
        <el-select v-model="searchForm.supplier_id" placeholder="供应商" clearable class="search-select">
          <el-option label="全部" value="" />
          <el-option v-for="item in supplierList" :key="item.id" :label="item.name" :value="item.id" />
        </el-select>
        <el-select v-model="searchForm.status" placeholder="状态" clearable class="search-select">
          <el-option label="全部" value="" />
          <el-option label="正常" :value="1" />
          <el-option label="禁用" :value="0" />
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
          <el-icon><Plus /></el-icon>添加耗材
        </el-button>
        <el-button type="warning" @click="categoryDialogVisible = true">
          <el-icon><Folder /></el-icon>分类管理
        </el-button>
        <el-button type="info" @click="supplierDialogVisible = true">
          <el-icon><OfficeBuilding /></el-icon>供应商管理
        </el-button>
      </div>

      <el-table :data="tableData" v-loading="loading" border stripe>
        <el-table-column prop="consumable_no" label="耗材编号" width="120" />
        <el-table-column prop="consumable_name" label="耗材名称" width="180" />
        <el-table-column prop="category_name" label="分类" width="120" />
        <el-table-column prop="specification" label="规格型号" width="150" />
        <el-table-column prop="unit" label="单位" width="80" />
        <el-table-column prop="stock" label="当前库存" width="100" />
        <el-table-column prop="min_stock" label="最低库存" width="100" />
        <el-table-column prop="location" label="存放位置" width="150" />
        <el-table-column prop="supplier_name" label="供应商" width="150" />
        <el-table-column prop="price" label="单价" width="100">
          <template #default="{ row }">
            ¥{{ row.price.toFixed(2) }}
          </template>
        </el-table-column>
        <el-table-column label="状态" width="80">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'danger'">
              {{ row.status === 1 ? '正常' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="库存预警" width="100">
          <template #default="{ row }">
            <el-tag v-if="row.stock <= row.min_stock" type="warning">
              <el-icon><Warning /></el-icon>库存不足
            </el-tag>
            <span v-else class="text-success">正常</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" fixed="right" width="200">
          <template #default="{ row }">
            <div class="action-buttons">
              <el-button type="primary" size="small" @click="handleView(row)">查看</el-button>
              <el-button type="success" size="small" @click="handleEdit(row)">编辑</el-button>
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
            <el-form-item label="耗材编号" prop="consumable_no">
              <el-input v-model="form.consumable_no" :disabled="!!form.id" placeholder="请输入耗材编号" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="耗材名称" prop="consumable_name">
              <el-input v-model="form.consumable_name" placeholder="请输入耗材名称" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="耗材分类" prop="category_id">
              <el-select v-model="form.category_id" placeholder="请选择分类" style="width: 100%">
                <el-option v-for="item in categoryList" :key="item.id" :label="item.name" :value="item.id" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="规格型号" prop="specification">
              <el-input v-model="form.specification" placeholder="请输入规格型号" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="计量单位" prop="unit">
              <el-select v-model="form.unit" placeholder="请选择计量单位" style="width: 100%">
                <el-option label="瓶" value="瓶" />
                <el-option label="个" value="个" />
                <el-option label="包" value="包" />
                <el-option label="盒" value="盒" />
                <el-option label="套" value="套" />
                <el-option label="米" value="米" />
                <el-option label="升" value="升" />
                <el-option label="公斤" value="公斤" />
                <el-option label="其他" value="其他" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="当前库存" prop="stock">
              <el-input-number v-model="form.stock" :min="0" placeholder="请输入当前库存" style="width: 100%" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="最低库存" prop="min_stock">
              <el-input-number v-model="form.min_stock" :min="0" placeholder="请输入最低库存" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="最高库存" prop="max_stock">
              <el-input-number v-model="form.max_stock" :min="0" placeholder="请输入最高库存" style="width: 100%" />
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
            <el-form-item label="供应商" prop="supplier_id">
              <el-select v-model="form.supplier_id" placeholder="请选择供应商" style="width: 100%">
                <el-option v-for="item in supplierList" :key="item.id" :label="item.name" :value="item.id" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="单价" prop="price">
              <el-input-number v-model="form.price" :min="0" :precision="2" placeholder="请输入单价" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="状态" prop="status">
              <el-select v-model="form.status" placeholder="请选择状态" style="width: 100%">
                <el-option label="正常" :value="1" />
                <el-option label="禁用" :value="0" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="categoryDialogVisible" title="耗材分类管理" width="600px">
      <div class="dialog-content">
        <el-input v-model="categorySearch" placeholder="搜索分类" clearable class="mb-3" />
        <el-table :data="categoryList.filter(c => !categorySearch || c.name.includes(categorySearch))" border>
          <el-table-column prop="name" label="分类名称" />
          <el-table-column prop="description" label="描述" />
          <el-table-column label="状态" width="80">
            <template #default="{ row }">
              <el-tag :type="row.status === 1 ? 'success' : 'danger'">
                {{ row.status === 1 ? '启用' : '禁用' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="150">
            <template #default="{ row }">
              <el-button size="small" @click="editCategory(row)">编辑</el-button>
              <el-button size="small" type="danger" @click="deleteCategory(row)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
        <el-button type="primary" @click="addCategory" class="mt-3">
          <el-icon><Plus /></el-icon>添加分类
        </el-button>
      </div>
    </el-dialog>

    <el-dialog v-model="supplierDialogVisible" title="供应商管理" width="600px">
      <div class="dialog-content">
        <el-input v-model="supplierSearch" placeholder="搜索供应商" clearable class="mb-3" />
        <el-table :data="supplierList.filter(s => !supplierSearch || s.name.includes(supplierSearch))" border>
          <el-table-column prop="name" label="供应商名称" />
          <el-table-column prop="contact" label="联系人" />
          <el-table-column prop="phone" label="联系电话" />
          <el-table-column label="状态" width="80">
            <template #default="{ row }">
              <el-tag :type="row.status === 1 ? 'success' : 'danger'">
                {{ row.status === 1 ? '启用' : '禁用' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="150">
            <template #default="{ row }">
              <el-button size="small" @click="editSupplier(row)">编辑</el-button>
              <el-button size="small" type="danger" @click="deleteSupplier(row)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
        <el-button type="primary" @click="addSupplier" class="mt-3">
          <el-icon><Plus /></el-icon>添加供应商
        </el-button>
      </div>
    </el-dialog>

    <el-dialog v-model="categoryFormVisible" :title="categoryFormTitle" width="400px">
      <el-form ref="categoryFormRef" :model="categoryForm" label-width="100px">
        <el-form-item label="分类名称" prop="name">
          <el-input v-model="categoryForm.name" placeholder="请输入分类名称" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="categoryForm.description" placeholder="请输入描述" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="categoryFormVisible = false">取消</el-button>
        <el-button type="primary" @click="saveCategory">确定</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="supplierFormVisible" :title="supplierFormTitle" width="400px">
      <el-form ref="supplierFormRef" :model="supplierForm" label-width="100px">
        <el-form-item label="供应商名称" prop="name">
          <el-input v-model="supplierForm.name" placeholder="请输入供应商名称" />
        </el-form-item>
        <el-form-item label="联系人">
          <el-input v-model="supplierForm.contact" placeholder="请输入联系人" />
        </el-form-item>
        <el-form-item label="联系电话">
          <el-input v-model="supplierForm.phone" placeholder="请输入联系电话" />
        </el-form-item>
        <el-form-item label="邮箱">
          <el-input v-model="supplierForm.email" placeholder="请输入邮箱" />
        </el-form-item>
        <el-form-item label="地址">
          <el-input v-model="supplierForm.address" placeholder="请输入地址" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="supplierFormVisible = false">取消</el-button>
        <el-button type="primary" @click="saveSupplier">确定</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="viewDialogVisible" title="耗材详情" width="600px">
      <el-descriptions :column="2" border>
        <el-descriptions-item label="耗材编号">{{ viewData.consumable_no }}</el-descriptions-item>
        <el-descriptions-item label="耗材名称">{{ viewData.consumable_name }}</el-descriptions-item>
        <el-descriptions-item label="分类">{{ viewData.category_name }}</el-descriptions-item>
        <el-descriptions-item label="规格型号">{{ viewData.specification }}</el-descriptions-item>
        <el-descriptions-item label="单位">{{ viewData.unit }}</el-descriptions-item>
        <el-descriptions-item label="当前库存">{{ viewData.stock }}</el-descriptions-item>
        <el-descriptions-item label="最低库存">{{ viewData.min_stock }}</el-descriptions-item>
        <el-descriptions-item label="最高库存">{{ viewData.max_stock }}</el-descriptions-item>
        <el-descriptions-item label="存放位置">{{ viewData.location }}</el-descriptions-item>
        <el-descriptions-item label="供应商">{{ viewData.supplier_name }}</el-descriptions-item>
        <el-descriptions-item label="单价">¥{{ viewData.price?.toFixed(2) }}</el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="viewData.status === 1 ? 'success' : 'danger'">
            {{ viewData.status === 1 ? '正常' : '禁用' }}
          </el-tag>
        </el-descriptions-item>
      </el-descriptions>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { Search, Refresh, Plus, Folder, OfficeBuilding, Warning } from '@element-plus/icons-vue'
import { get, post, put, del } from '@/utils/request'
import type { ElForm, ElTable } from 'element-plus'

const loading = ref(false)
const tableData = ref<any[]>([])
const pagination = reactive({
  page: 1,
  pageSize: 20,
  total: 0
})

const searchForm = reactive({
  name: '',
  category_id: null as number | null,
  supplier_id: null as number | null,
  status: 1 as number | null
})

const categoryList = ref<any[]>([])
const supplierList = ref<any[]>([])

const dialogVisible = ref(false)
const dialogTitle = ref('添加耗材')
const formRef = ref<InstanceType<typeof ElForm>>()
const form = reactive({
  id: null as number | null,
  consumable_no: '',
  consumable_name: '',
  category_id: null as number | null,
  specification: '',
  unit: '',
  stock: 0,
  min_stock: 0,
  max_stock: 0,
  location: '',
  supplier_id: null as number | null,
  price: 0,
  status: 1
})

const rules = {
  consumable_no: [{ required: true, message: '请输入耗材编号', trigger: 'blur' }],
  consumable_name: [{ required: true, message: '请输入耗材名称', trigger: 'blur' }],
  unit: [{ required: true, message: '请选择计量单位', trigger: 'blur' }]
}

const categoryDialogVisible = ref(false)
const categorySearch = ref('')
const categoryFormVisible = ref(false)
const categoryFormTitle = ref('添加分类')
const categoryFormRef = ref<InstanceType<typeof ElForm>>()
const categoryForm = reactive({
  id: null as number | null,
  name: '',
  description: ''
})

const supplierDialogVisible = ref(false)
const supplierSearch = ref('')
const supplierFormVisible = ref(false)
const supplierFormTitle = ref('添加供应商')
const supplierFormRef = ref<InstanceType<typeof ElForm>>()
const supplierForm = reactive({
  id: null as number | null,
  name: '',
  contact: '',
  phone: '',
  email: '',
  address: ''
})

const viewDialogVisible = ref(false)
const viewData = reactive<any>({})

const loadData = async () => {
  loading.value = true
  try {
    const params: any = {
      page: pagination.page,
      pageSize: pagination.pageSize
    }
    if (searchForm.name) params.name = searchForm.name
    if (searchForm.category_id) params.category_id = searchForm.category_id
    if (searchForm.supplier_id) params.supplier_id = searchForm.supplier_id
    if (searchForm.status !== null) params.status = searchForm.status

    const res = await get('/consumable', params)
    tableData.value = res.data
    pagination.total = res.total
  } catch (error) {
    console.error('获取耗材列表失败:', error)
  } finally {
    loading.value = false
  }
}

const loadCategories = async () => {
  try {
    const res = await get('/consumable/categories')
    categoryList.value = res
  } catch (error) {
    console.error('获取分类列表失败:', error)
  }
}

const loadSuppliers = async () => {
  try {
    const res = await get('/consumable/suppliers')
    supplierList.value = res
  } catch (error) {
    console.error('获取供应商列表失败:', error)
  }
}

const handleSearch = () => {
  pagination.page = 1
  loadData()
}

const handleReset = () => {
  searchForm.name = ''
  searchForm.category_id = null
  searchForm.supplier_id = null
  searchForm.status = 1
  pagination.page = 1
  loadData()
}

const handleAdd = () => {
  dialogTitle.value = '添加耗材'
  Object.assign(form, {
    id: null,
    consumable_no: '',
    consumable_name: '',
    category_id: null,
    specification: '',
    unit: '',
    stock: 0,
    min_stock: 0,
    max_stock: 0,
    location: '',
    supplier_id: null,
    price: 0,
    status: 1
  })
  dialogVisible.value = true
}

const handleEdit = (row: any) => {
  dialogTitle.value = '编辑耗材'
  Object.assign(form, {
    id: row.id,
    consumable_no: row.consumable_no,
    consumable_name: row.consumable_name,
    category_id: row.category_id,
    specification: row.specification,
    unit: row.unit,
    stock: row.stock,
    min_stock: row.min_stock,
    max_stock: row.max_stock,
    location: row.location,
    supplier_id: row.supplier_id,
    price: row.price,
    status: row.status
  })
  dialogVisible.value = true
}

const handleView = (row: any) => {
  Object.assign(viewData, row)
  viewDialogVisible.value = true
}

const handleDelete = async (row: any) => {
  if (confirm(`确定要删除耗材 "${row.consumable_name}" 吗？`)) {
    try {
      await del(`/consumable/${row.id}`)
      ElMessage.success('删除成功')
      loadData()
    } catch (error) {
      console.error('删除失败:', error)
      ElMessage.error('删除失败')
    }
  }
}

const handleDialogClose = () => {
  formRef.value?.resetFields()
}

const handleSubmit = async () => {
  if (!formRef.value) return
  try {
    await formRef.value.validate()
    if (form.id) {
      await put(`/consumable/${form.id}`, form)
      ElMessage.success('更新成功')
    } else {
      await post('/consumable', form)
      ElMessage.success('添加成功')
    }
    dialogVisible.value = false
    loadData()
  } catch (error) {
    console.error('提交失败:', error)
  }
}

const addCategory = () => {
  categoryFormTitle.value = '添加分类'
  Object.assign(categoryForm, { id: null, name: '', description: '' })
  categoryFormVisible.value = true
}

const editCategory = (row: any) => {
  categoryFormTitle.value = '编辑分类'
  Object.assign(categoryForm, { id: row.id, name: row.name, description: row.description })
  categoryFormVisible.value = true
}

const deleteCategory = async (row: any) => {
  if (confirm(`确定要删除分类 "${row.name}" 吗？`)) {
    try {
      await del(`/consumable/categories/${row.id}`)
      ElMessage.success('删除成功')
      loadCategories()
    } catch (error) {
      console.error('删除失败:', error)
      ElMessage.error('删除失败')
    }
  }
}

const saveCategory = async () => {
  if (!categoryForm.name.trim()) {
    ElMessage.error('请输入分类名称')
    return
  }
  try {
    if (categoryForm.id) {
      await put(`/consumable/categories/${categoryForm.id}`, categoryForm)
      ElMessage.success('更新成功')
    } else {
      await post('/consumable/categories', categoryForm)
      ElMessage.success('添加成功')
    }
    categoryFormVisible.value = false
    loadCategories()
  } catch (error) {
    console.error('保存失败:', error)
    ElMessage.error('保存失败')
  }
}

const addSupplier = () => {
  supplierFormTitle.value = '添加供应商'
  Object.assign(supplierForm, { id: null, name: '', contact: '', phone: '', email: '', address: '' })
  supplierFormVisible.value = true
}

const editSupplier = (row: any) => {
  supplierFormTitle.value = '编辑供应商'
  Object.assign(supplierForm, { id: row.id, name: row.name, contact: row.contact, phone: row.phone, email: row.email, address: row.address })
  supplierFormVisible.value = true
}

const deleteSupplier = async (row: any) => {
  if (confirm(`确定要删除供应商 "${row.name}" 吗？`)) {
    try {
      await del(`/consumable/suppliers/${row.id}`)
      ElMessage.success('删除成功')
      loadSuppliers()
    } catch (error) {
      console.error('删除失败:', error)
      ElMessage.error('删除失败')
    }
  }
}

const saveSupplier = async () => {
  if (!supplierForm.name.trim()) {
    ElMessage.error('请输入供应商名称')
    return
  }
  try {
    if (supplierForm.id) {
      await put(`/consumable/suppliers/${supplierForm.id}`, supplierForm)
      ElMessage.success('更新成功')
    } else {
      await post('/consumable/suppliers', supplierForm)
      ElMessage.success('添加成功')
    }
    supplierFormVisible.value = false
    loadSuppliers()
  } catch (error) {
    console.error('保存失败:', error)
    ElMessage.error('保存失败')
  }
}

import { ElMessage } from 'element-plus'

onMounted(() => {
  loadData()
  loadCategories()
  loadSuppliers()
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

.search-input {
  width: 200px;
}

.search-select {
  width: 150px;
}

.button-row {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
}

.action-buttons {
  display: flex;
  gap: 8px;
}

.text-success {
  color: #67c23a;
}

.dialog-content {
  padding: 10px;
}

.mb-3 {
  margin-bottom: 16px;
}

.mt-3 {
  margin-top: 16px;
}
</style>
