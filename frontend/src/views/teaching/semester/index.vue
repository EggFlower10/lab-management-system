<template>
  <div class="page-container">
    <el-card class="table-card">
      <template #header>
        <div class="card-header">
          <span>学期管理</span>
          <div class="header-right">
            <el-select v-model="searchParams.academicYear" placeholder="学年" class="search-select" clearable>
              <el-option label="2026-2027" value="2026-2027" />
              <el-option label="2025-2026" value="2025-2026" />
              <el-option label="2024-2025" value="2024-2025" />
            </el-select>
            <el-select v-model="searchParams.semesterNo" placeholder="学期" class="search-select" clearable>
              <el-option label="第一学期" value="1" />
              <el-option label="第二学期" value="2" />
            </el-select>
            <el-button type="success" @click="handleSearch">
              <el-icon><Search /></el-icon>搜索
            </el-button>
            <el-button @click="handleReset">
              <el-icon><Refresh /></el-icon>重置
            </el-button>
            <el-button type="primary" @click="handleAdd">
              <el-icon><Plus /></el-icon>新增学期
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
        <el-table-column prop="SemesterID" label="ID" width="80" />
        <el-table-column prop="SchoolYear" label="学年" width="150" />
        <el-table-column prop="SemesterNo" label="学期号" width="100">
          <template #default="{ row }">
            {{ row.SemesterNo === 1 ? '第一学期' : row.SemesterNo === 2 ? '第二学期' : row.SemesterNo }}
          </template>
        </el-table-column>
        <el-table-column prop="SemesterName" label="学期名称" width="150" />
        <el-table-column prop="StartDate" label="开始日期" width="120" />
        <el-table-column prop="EndDate" label="结束日期" width="120" />
        <el-table-column prop="TotalWeeks" label="周数" width="80" />
        <el-table-column prop="IsActive" label="当前" width="100">
          <template #default="{ row }">
            <el-tag :type="row.IsActive ? 'success' : undefined">
              {{ row.IsActive ? '当前学期' : '' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" fixed="right" width="280">
          <template #default="{ row }">
            <div class="action-buttons">
              <el-button type="primary" size="small" @click="handleEdit(row)">编辑</el-button>
              <el-button type="warning" size="small" @click="handleSetCurrent(row)" v-if="!row.IsActive">
                设为当前
              </el-button>
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
        <el-form-item label="学年" prop="SchoolYear">
          <el-select v-model="form.SchoolYear" placeholder="请选择学年">
            <el-option label="2026-2027" value="2026-2027" />
            <el-option label="2025-2026" value="2025-2026" />
            <el-option label="2024-2025" value="2024-2025" />
          </el-select>
        </el-form-item>
        <el-form-item label="学期" prop="SemesterNo">
          <el-select v-model="form.SemesterNo" placeholder="请选择学期">
            <el-option label="第一学期" :value="1" />
            <el-option label="第二学期" :value="2" />
          </el-select>
        </el-form-item>
        <el-form-item label="开始日期" prop="StartDate">
          <el-date-picker v-model="form.StartDate" type="date" placeholder="请选择开始日期" />
        </el-form-item>
        <el-form-item label="结束日期" prop="EndDate">
          <el-date-picker v-model="form.EndDate" type="date" placeholder="请选择结束日期" />
        </el-form-item>
        <el-form-item label="周数" prop="TotalWeeks">
          <el-input v-model.number="form.TotalWeeks" type="number" placeholder="请输入周数" />
        </el-form-item>
        <el-form-item label="设为当前" prop="IsActive">
          <el-switch v-model="form.IsActive" :active-value="1" :inactive-value="0" />
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
const dialogTitle = ref('新增学期')
const isEdit = ref(false)
const formRef = ref<FormInstance>()

const tableData = ref<any[]>([])

const searchParams = reactive({
  academicYear: '',
  semesterNo: ''
})

const pagination = reactive({ 
  page: 1, 
  pageSize: 10, 
  total: 0 
})

const form = reactive({
  SemesterID: 0,
  SchoolYear: '',
  SemesterNo: 1,
  StartDate: '',
  EndDate: '',
  TotalWeeks: 0,
  IsActive: 0,
  Status: 1,
  SortOrder: 0,
  Description: ''
})

const rules = reactive<FormRules>({
  SchoolYear: [
    { required: true, message: '请输入学年', trigger: 'blur' }
  ],
  SemesterNo: [
    { required: true, message: '请选择学期', trigger: 'change' }
  ],
  TotalWeeks: [
    { required: true, message: '请输入周数', trigger: 'blur' }
  ]
})

const fetchData = async () => {
  loading.value = true
  try {
    const result = await get('/semesters')
    let data = result || []
    
    if (searchParams.academicYear) {
      data = data.filter((item: any) => item.SchoolYear === searchParams.academicYear)
    }
    if (searchParams.semesterNo) {
      data = data.filter((item: any) => String(item.SemesterNo) === searchParams.semesterNo)
    }
    
    tableData.value = data
    pagination.total = tableData.value.length
  } catch (error) {
    console.error(error)
    ElMessage.error('获取学期列表失败')
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
  searchParams.academicYear = ''
  searchParams.semesterNo = ''
  pagination.page = 1
  fetchData()
}

const handleAdd = () => {
  isEdit.value = false
  dialogTitle.value = '新增学期'
  Object.assign(form, {
    SemesterID: 0,
    SchoolYear: '',
    SemesterNo: 1,
    StartDate: '',
    EndDate: '',
    TotalWeeks: 0,
    IsActive: 0,
    Status: 1
  })
  dialogVisible.value = true
}

const handleEdit = (row: any) => {
  isEdit.value = true
  dialogTitle.value = '编辑学期'
  Object.assign(form, {
    SemesterID: row.SemesterID,
    SchoolYear: row.SchoolYear,
    SemesterNo: row.SemesterNo,
    StartDate: row.StartDate,
    EndDate: row.EndDate,
    TotalWeeks: row.TotalWeeks,
    IsActive: row.IsActive,
    Status: row.Status,
    SortOrder: row.SortOrder || 0,
    Description: row.Description || ''
  })
  dialogVisible.value = true
}

const handleDelete = (row: any) => {
  ElMessageBox.confirm(`确定要删除学期 "${row.SemesterName}" 吗？`, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  }).then(async () => {
    try {
      await del(`/semesters/${row.SemesterID}`)
      ElMessage.success('删除成功')
      fetchData()
    } catch (error) {
      ElMessage.error('删除失败')
    }
  }).catch(() => {})
}

const handleSetCurrent = async (row: any) => {
  try {
    await put(`/semesters/${row.SemesterID}/set-current`)
    ElMessage.success('已设为当前学期')
    fetchData()
  } catch (error) {
    console.error('设置当前学期失败:', error)
    ElMessage.error('设置失败')
  }
}

const handleSubmit = async () => {
  formRef.value?.validate(async (valid) => {
    if (valid) {
      try {
        const submitData = {
          ...form,
          SemesterCode: `${form.SchoolYear}-${form.SemesterNo}`,
          SemesterName: `${form.SchoolYear} ${form.SemesterNo === 1 ? '第一学期' : '第二学期'}`,
          StartDate: form.StartDate ? new Date(form.StartDate).toISOString().split('T')[0] : '',
          EndDate: form.EndDate ? new Date(form.EndDate).toISOString().split('T')[0] : '',
          IsActive: Number(form.IsActive),
          Status: Number(form.Status),
          SortOrder: Number(form.SortOrder) || 0,
          TotalWeeks: Number(form.TotalWeeks),
          SemesterNo: Number(form.SemesterNo),
          Description: form.Description || ''
        }
        if (isEdit.value) {
          await put(`/semesters/${form.SemesterID}`, submitData)
          ElMessage.success('编辑成功')
        } else {
          await post('/semesters', submitData)
          ElMessage.success('新增成功')
        }
        dialogVisible.value = false
        fetchData()
      } catch (error) {
        console.error('提交失败:', error)
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
.search-select {
  width: 140px;
}
.action-buttons {
  display: flex;
  gap: 5px;
}
</style>
