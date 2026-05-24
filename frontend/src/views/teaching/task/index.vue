<template>
  <div class="page-container">
    <el-card class="table-card">
      <template #header>
        <div class="card-header">
          <span>教学任务</span>
          <div class="header-right">
            <el-input v-model="searchParams.keyword" placeholder="任务编码" class="search-input" clearable />
            <el-button type="success" @click="handleSearch" class="search-button">
              <el-icon><Search /></el-icon>搜索
            </el-button>
            <el-button type="default" @click="handleReset" class="reset-button">
              <el-icon><Refresh /></el-icon>重置
            </el-button>
            <el-button type="primary" @click="handleAdd">
              <el-icon><Plus /></el-icon>新增任务
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
        <el-table-column prop="TaskID" label="ID" width="80" />
        <el-table-column prop="TaskCode" label="任务编码" width="120" />
        <el-table-column prop="WeeklyHours" label="周学时" width="80" />
        <el-table-column prop="StartWeek" label="开始周" width="80" />
        <el-table-column prop="EndWeek" label="结束周" width="80" />
        <el-table-column prop="ExamMode" label="考核方式" width="100" />
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
        <el-form-item label="任务编码" prop="TaskCode">
          <el-input v-model="form.TaskCode" placeholder="请输入任务编码" />
        </el-form-item>
        <el-form-item label="周学时" prop="WeeklyHours">
          <el-input v-model.number="form.WeeklyHours" type="number" placeholder="请输入周学时" />
        </el-form-item>
        <el-form-item label="开始周" prop="StartWeek">
          <el-input v-model.number="form.StartWeek" type="number" placeholder="请输入开始周" />
        </el-form-item>
        <el-form-item label="结束周" prop="EndWeek">
          <el-input v-model.number="form.EndWeek" type="number" placeholder="请输入结束周" />
        </el-form-item>
        <el-form-item label="考核方式" prop="ExamMode">
          <el-select v-model="form.ExamMode" placeholder="请选择考核方式">
            <el-option label="考试" value="Exam" />
            <el-option label="考查" value="Assessment" />
            <el-option label="论文" value="Paper" />
            <el-option label="实践" value="Practice" />
          </el-select>
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
const dialogTitle = ref('新增任务')
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
  TaskID: 0,
  TaskCode: '',
  SemesterID: 1,
  CourseID: 1,
  ClassID: 1,
  WeeklyHours: 0,
  StartWeek: 1,
  EndWeek: 16,
  ExamMode: 'Exam',
  Status: 1,
  SortOrder: 0
})

const rules = reactive<FormRules>({
  TaskCode: [
    { required: true, message: '请输入任务编码', trigger: 'blur' }
  ]
})

const fetchData = async () => {
  loading.value = true
  try {
    const result = await get('/teaching-tasks')
    let data = result || []
    
    if (searchParams.keyword) {
      data = data.filter((item: any) => 
        item.TaskCode.toLowerCase().includes(searchParams.keyword.toLowerCase())
      )
    }
    
    tableData.value = data
    pagination.total = tableData.value.length
  } catch (error) {
    console.error(error)
    ElMessage.error('获取教学任务列表失败')
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
  dialogTitle.value = '新增任务'
  Object.assign(form, {
    TaskID: 0,
    TaskCode: '',
    SemesterID: 1,
    CourseID: 1,
    ClassID: 1,
    WeeklyHours: 0,
    StartWeek: 1,
    EndWeek: 16,
    ExamMode: 'Exam',
    Status: 1,
    SortOrder: 0
  })
  dialogVisible.value = true
}

const handleEdit = (row: any) => {
  isEdit.value = true
  dialogTitle.value = '编辑任务'
  Object.assign(form, {
    TaskID: row.TaskID,
    TaskCode: row.TaskCode,
    SemesterID: row.SemesterID,
    CourseID: row.CourseID,
    ClassID: row.ClassID,
    WeeklyHours: row.WeeklyHours,
    StartWeek: row.StartWeek,
    EndWeek: row.EndWeek,
    ExamMode: row.ExamMode,
    Status: row.Status,
    SortOrder: row.SortOrder || 0
  })
  dialogVisible.value = true
}

const handleDelete = (row: any) => {
  ElMessageBox.confirm(`确定要删除教学任务 "${row.TaskCode}" 吗？`, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  }).then(async () => {
    try {
      await del(`/teaching-tasks/${row.TaskID}`)
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
          await put(`/teaching-tasks/${form.TaskID}`, form)
          ElMessage.success('编辑成功')
        } else {
          await post('/teaching-tasks', form)
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
