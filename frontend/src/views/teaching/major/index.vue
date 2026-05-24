<template>
  <div class="page-container">
    <el-card class="table-card">
      <template #header>
        <div class="card-header">
          <span>专业管理</span>
          <div class="header-right">
            <el-input v-model="searchParams.keyword" placeholder="专业编码/名称" class="search-input" clearable />
            <el-button type="success" @click="handleSearch">
              <el-icon><Search /></el-icon>搜索
            </el-button>
            <el-button @click="handleReset">
              <el-icon><Refresh /></el-icon>重置
            </el-button>
            <el-button type="primary" @click="handleAdd">
              <el-icon><Plus /></el-icon>新增专业
            </el-button>
          </div>
        </div>
      </template>
      <el-table
        :data="tableData"
        v-loading="loading"
        border
        stripe
      >
        <el-table-column prop="MajorID" label="ID" width="80" />
        <el-table-column prop="MajorCode" label="专业编码" width="120" />
        <el-table-column prop="MajorName" label="专业名称" width="150" />
        <el-table-column prop="MajorNameEn" label="英文名称" width="180" />
        <el-table-column prop="DegreeLevel" label="层次" width="100">
          <template #default="{ row }">
            {{ row.DegreeLevel === 'Bachelor' ? '本科' : row.DegreeLevel === 'Master' ? '硕士' : row.DegreeLevel === 'Doctor' ? '博士' : row.DegreeLevel }}
          </template>
        </el-table-column>
        <el-table-column prop="Duration" label="学制" width="80" />
        <el-table-column prop="DegreeName" label="学位" width="120" />
        <el-table-column prop="Status" label="状态" width="80">
          <template #default="{ row }">
            <el-tag :type="row.Status === 1 ? 'success' : 'danger'">
              {{ row.Status === 1 ? '正常' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" fixed="right" width="150">
          <template #default="{ row }">
            <div class="action-buttons">
              <el-button type="primary" size="small" @click="handleEdit(row)">编辑</el-button>
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
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </el-card>

    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="500px" @close="handleDialogClose">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
        <el-form-item label="专业编码" prop="MajorCode">
          <el-input v-model="form.MajorCode" placeholder="请输入专业编码" />
        </el-form-item>
        <el-form-item label="专业名称" prop="MajorName">
          <el-input v-model="form.MajorName" placeholder="请输入专业名称" />
        </el-form-item>
        <el-form-item label="英文名称" prop="MajorNameEn">
          <el-input v-model="form.MajorNameEn" placeholder="请输入英文名称" />
        </el-form-item>
        <el-form-item label="层次" prop="DegreeLevel">
          <el-select v-model="form.DegreeLevel" placeholder="请选择层次">
            <el-option label="本科" value="Bachelor" />
            <el-option label="硕士" value="Master" />
            <el-option label="博士" value="Doctor" />
          </el-select>
        </el-form-item>
        <el-form-item label="学制" prop="Duration">
          <el-input v-model.number="form.Duration" type="number" placeholder="请输入学制" />
        </el-form-item>
        <el-form-item label="学位名称" prop="DegreeName">
          <el-input v-model="form.DegreeName" placeholder="请输入学位名称" />
        </el-form-item>
        <el-form-item label="状态" prop="Status">
          <el-radio-group v-model="form.Status">
            <el-radio :label="1">正常</el-radio>
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
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox, FormInstance, FormRules } from 'element-plus'
import { Search, Refresh, Plus } from '@element-plus/icons-vue'
import { get, post, put, del } from '@/utils/request'

const loading = ref(false)
const dialogVisible = ref(false)
const dialogTitle = ref('新增专业')
const isEdit = ref(false)
const formRef = ref<FormInstance>()

const tableData = ref<any[]>([])

const searchParams = reactive({
  keyword: ''
})

const pagination = reactive({ 
  page: 1, 
  pageSize: 10, 
  total: 0 
})

const form = reactive({
  MajorID: 0,
  MajorCode: '',
  MajorName: '',
  MajorNameEn: '',
  DepartmentID: 1,
  DegreeLevel: 'Bachelor',
  Duration: 4,
  DegreeName: '',
  Status: 1,
  SortOrder: 0
})

const rules = reactive<FormRules>({
  MajorCode: [
    { required: true, message: '请输入专业编码', trigger: 'blur' }
  ],
  MajorName: [
    { required: true, message: '请输入专业名称', trigger: 'blur' }
  ]
})

const fetchData = async () => {
  loading.value = true
  try {
    const result = await get('/majors')
    let data = result || []
    
    if (searchParams.keyword) {
      data = data.filter((item: any) => 
        item.MajorCode.toLowerCase().includes(searchParams.keyword.toLowerCase()) ||
        item.MajorName.toLowerCase().includes(searchParams.keyword.toLowerCase())
      )
    }
    
    tableData.value = data
    pagination.total = tableData.value.length
  } catch (error) {
    console.error(error)
    ElMessage.error('获取专业列表失败')
    tableData.value = []
    pagination.total = 0
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  pagination.page = 1
  fetchData()
}

const handleReset = () => {
  searchParams.keyword = ''
  pagination.page = 1
  fetchData()
}

const handleAdd = () => {
  isEdit.value = false
  dialogTitle.value = '新增专业'
  Object.assign(form, {
    MajorID: 0,
    MajorCode: '',
    MajorName: '',
    MajorNameEn: '',
    DepartmentID: 1,
    DegreeLevel: 'Bachelor',
    Duration: 4,
    DegreeName: '',
    Status: 1,
    SortOrder: 0
  })
  dialogVisible.value = true
}

const handleEdit = (row: any) => {
  isEdit.value = true
  dialogTitle.value = '编辑专业'
  Object.assign(form, {
    MajorID: row.MajorID,
    MajorCode: row.MajorCode,
    MajorName: row.MajorName,
    MajorNameEn: row.MajorNameEn || '',
    DepartmentID: row.DepartmentID,
    DegreeLevel: row.DegreeLevel,
    Duration: row.Duration,
    DegreeName: row.DegreeName || '',
    Status: row.Status,
    SortOrder: row.SortOrder || 0
  })
  dialogVisible.value = true
}

const handleDelete = (row: any) => {
  ElMessageBox.confirm(`确定要删除专业 "${row.MajorName}" 吗？`, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  }).then(async () => {
    try {
      await del(`/majors/${row.MajorID}`)
      ElMessage.success('删除成功')
      fetchData()
    } catch (error) {
      ElMessage.error('删除失败')
    }
  }).catch(() => {})
}

const handleSubmit = async () => {
  formRef.value?.validate(async (valid) => {
    if (valid) {
      try {
        if (isEdit.value) {
          await put(`/majors/${form.MajorID}`, form)
          ElMessage.success('编辑成功')
        } else {
          await post('/majors', form)
          ElMessage.success('新增成功')
        }
        dialogVisible.value = false
        fetchData()
      } catch (error) {
        ElMessage.error(isEdit.value ? '编辑失败' : '新增失败')
      }
    }
  })
}

const handleDialogClose = () => {
  formRef.value?.resetFields()
}

const handleSizeChange = () => {
  pagination.page = 1
  fetchData()
}

const handleCurrentChange = () => {
  fetchData()
}

onMounted(() => {
  fetchData()
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
  flex-wrap: wrap;
  gap: 10px;
}
.header-right {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}
.search-input {
  width: 200px;
}
.action-buttons {
  display: flex;
  gap: 5px;
}
</style>
