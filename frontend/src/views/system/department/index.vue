<template>
  <div class="page-container">
    <el-card class="table-card">
      <template #header>
        <div class="card-header">
          <span>部门管理</span>
          <div class="header-right">
            <el-select v-model="searchParams.organization" placeholder="全部机构" class="search-select">
              <el-option label="全部机构" value="" />
              <el-option
                v-for="org in organizationList"
                :key="org.InstitutionID"
                :label="org.InstitutionName"
                :value="org.InstitutionID"
              />
            </el-select>
            <el-input v-model="searchParams.department" placeholder="部门名称/编码" class="search-input" clearable />
            <el-select v-model="searchParams.status" placeholder="全部状态" class="search-select">
              <el-option label="全部状态" value="" />
              <el-option label="启用" value="1" />
              <el-option label="禁用" value="0" />
            </el-select>
            <el-button type="success" @click="handleSearch">
              <el-icon><Search /></el-icon>搜索
            </el-button>
            <el-button @click="handleReset">
              <el-icon><Refresh /></el-icon>重置
            </el-button>
            <el-button type="primary" @click="handleAdd">
              <el-icon><Plus /></el-icon>新增部门
            </el-button>
          </div>
        </div>
      </template>
      <el-table
        :data="filteredDepartmentData"
        v-loading="loading"
        row-key="DepartmentID"
        border
      >
        <el-table-column prop="DepartmentID" label="ID" width="80" />
        <el-table-column prop="DepartmentCode" label="部门编码" width="150" />
        <el-table-column prop="DepartmentName" label="部门名称" width="200" />
        <el-table-column label="所属机构" width="200">
          <template #default="{ row }">
            {{ getOrganizationName(row.InstitutionID) }}
          </template>
        </el-table-column>
        <el-table-column prop="SortOrder" label="排序" width="80" />
        <el-table-column prop="Status" label="状态" width="80">
          <template #default="{ row }">
            <el-tag :type="row.Status === 1 ? 'success' : 'danger'">
              {{ row.Status === 1 ? '启用' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" fixed="right" width="160">
          <template #default="{ row }">
            <div class="action-buttons">
              <el-button type="primary" size="small" @click="handleEdit(row)">编辑</el-button>
              <el-button type="danger" size="small" @click="handleDelete(row)">删除</el-button>
            </div>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="500px" @close="handleDialogClose">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
        <el-form-item label="所属机构" prop="InstitutionID">
          <el-select v-model="form.InstitutionID" placeholder="请选择所属机构">
            <el-option
              v-for="org in organizationList"
              :key="org.InstitutionID"
              :label="org.InstitutionName"
              :value="org.InstitutionID"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="部门名称" prop="DepartmentName">
          <el-input v-model="form.DepartmentName" placeholder="请输入部门名称" />
        </el-form-item>
        <el-form-item label="部门编码" prop="DepartmentCode">
          <el-input v-model="form.DepartmentCode" placeholder="请输入部门编码" />
        </el-form-item>
        <el-form-item label="排序" prop="SortOrder">
          <el-input-number v-model="form.SortOrder" :min="0" />
        </el-form-item>
        <el-form-item label="状态" prop="Status">
          <el-radio-group v-model="form.Status">
            <el-radio :label="1">启用</el-radio>
            <el-radio :label="0">禁用</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox, FormInstance, FormRules } from 'element-plus'
import { Plus, Search, Refresh } from '@element-plus/icons-vue'
import { get, post, put, del } from '@/utils/request'

const loading = ref(false)
const dialogVisible = ref(false)
const dialogTitle = ref('新增部门')
const isEdit = ref(false)
const formRef = ref<FormInstance>()

const organizationList = ref<any[]>([])
const departmentList = ref<any[]>([])

const searchParams = reactive({
  organization: '',
  department: '',
  status: ''
})

const filteredDepartmentData = computed(() => {
  return departmentList.value.filter(item => {
    const orgMatch = !searchParams.organization || item.InstitutionID === parseInt(searchParams.organization)
    const deptMatch = !searchParams.department ||
      item.DepartmentName.includes(searchParams.department) ||
      item.DepartmentCode.includes(searchParams.department)
    const statusMatch = !searchParams.status || item.Status === parseInt(searchParams.status)
    return orgMatch && deptMatch && statusMatch
  })
})

const form = reactive({
  DepartmentID: 0,
  InstitutionID: 0,
  DepartmentName: '',
  DepartmentCode: '',
  SortOrder: 0,
  Status: 1
})

const rules = reactive<FormRules>({
  InstitutionID: [
    { required: true, message: '请选择所属机构', trigger: 'change' }
  ],
  DepartmentName: [
    { required: true, message: '请输入部门名称', trigger: 'blur' }
  ],
  DepartmentCode: [
    { required: true, message: '请输入部门编码', trigger: 'blur' }
  ]
})

function getOrganizationName(InstitutionID: number): string {
  const org = organizationList.value.find(item => item.InstitutionID === InstitutionID)
  return org ? org.InstitutionName : ''
}

async function fetchOrganizations() {
  try {
    const result = await get('/organizations')
    organizationList.value = Array.isArray(result) ? result : []
  } catch (error) {
    console.error('获取机构列表失败:', error)
  }
}

async function fetchDepartments() {
  loading.value = true
  try {
    const result = await get('/departments')
    departmentList.value = Array.isArray(result) ? result : []
  } catch (error) {
    console.error('获取部门列表失败:', error)
    ElMessage.error('获取数据失败')
  } finally {
    loading.value = false
  }
}

function handleSearch() {
  // 搜索逻辑已在computed中处理
}

function handleReset() {
  searchParams.organization = ''
  searchParams.department = ''
  searchParams.status = ''
}

function handleAdd() {
  isEdit.value = false
  dialogTitle.value = '新增部门'
  Object.assign(form, {
    DepartmentID: 0,
    InstitutionID: 0,
    DepartmentName: '',
    DepartmentCode: '',
    SortOrder: 0,
    Status: 1
  })
  dialogVisible.value = true
}

function handleEdit(row: any) {
  isEdit.value = true
  dialogTitle.value = '编辑部门'
  Object.assign(form, {
    DepartmentID: row.DepartmentID,
    InstitutionID: row.InstitutionID,
    DepartmentName: row.DepartmentName,
    DepartmentCode: row.DepartmentCode,
    SortOrder: row.SortOrder,
    Status: row.Status
  })
  dialogVisible.value = true
}

function handleDelete(row: any) {
  ElMessageBox.confirm(
    `确定要删除部门 "${row.DepartmentName}" 吗？`,
    '删除确认',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(async () => {
    try {
      await del(`/departments/${row.DepartmentID}`)
      ElMessage.success('删除成功')
      fetchDepartments()
    } catch (error) {
      ElMessage.error('删除失败')
    }
  }).catch(() => {})
}

async function handleSubmit() {
  if (!formRef.value) return
  await formRef.value.validate(async (valid) => {
    if (valid) {
      try {
        if (isEdit.value) {
          await put(`/departments/${form.DepartmentID}`, form)
          ElMessage.success('编辑成功')
        } else {
          await post('/departments', form)
          ElMessage.success('新增成功')
        }
        dialogVisible.value = false
        fetchDepartments()
      } catch (error) {
        ElMessage.error(isEdit.value ? '编辑失败' : '新增失败')
      }
    }
  })
}

function handleDialogClose() {
  formRef.value?.resetFields()
}

onMounted(() => {
  fetchOrganizations()
  fetchDepartments()
})
</script>

<style scoped>
.page-container {
  padding: 20px;
}

.table-card {
  margin-bottom: 20px;
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

.search-select {
  width: 150px;
}

.search-input {
  width: 200px;
}

.action-buttons {
  display: flex;
  gap: 8px;
}
</style>
