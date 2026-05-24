<template>
  <div class="page-container">
    <el-card class="table-card">
      <template #header>
        <div class="card-header">
          <span>实验项目库</span>
          <div class="header-right">
            <el-input v-model="searchParams.keyword" placeholder="项目名称" class="search-input" clearable />
            <el-button type="success" @click="handleSearch">
              <el-icon><Search /></el-icon>搜索
            </el-button>
            <el-button @click="handleReset">
              <el-icon><Refresh /></el-icon>重置
            </el-button>
            <el-button type="primary" @click="handleAdd">
              <el-icon><Plus /></el-icon>新增项目
            </el-button>
            <el-button type="warning" @click="handleExport">
              <el-icon><Download /></el-icon>导出项目库
            </el-button>
          </div>
        </div>
      </template>

      <el-table :data="tableData" v-loading="loading" border stripe>
        <el-table-column prop="id" label="ID" width="80" sortable />
        <el-table-column prop="course_code" label="课程编号" width="120" />
        <el-table-column prop="project_name" label="实验项目名称" min-width="200" />
        <el-table-column prop="experiment_hours" label="实验学时" width="100" />
        <el-table-column prop="experiment_type" label="实验类别" width="120">
          <template #default="{ row }">
            <el-tag :type="getTypeColor(row.experiment_type)">{{ row.experiment_type || '-' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="experiment_requirement" label="实验要求" width="100">
          <template #default="{ row }">
            <el-tag :type="row.experiment_requirement === '必做' ? 'danger' : 'warning'">
              {{ row.experiment_requirement || '-' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="description" label="描述" min-width="150" show-overflow-tooltip />
        <el-table-column prop="status" label="状态" width="80">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'danger'">
              {{ row.status === 1 ? '正常' : '禁用' }}
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

    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="600px" @close="handleDialogClose">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="120px">
        <el-form-item label="课程编号" prop="courseCode">
          <el-input v-model="form.courseCode" placeholder="请输入课程编号" />
        </el-form-item>
        <el-form-item label="项目名称" prop="projectName">
          <el-input v-model="form.projectName" placeholder="请输入实验项目名称" />
        </el-form-item>
        <el-form-item label="实验学时" prop="experimentHours">
          <el-input-number v-model="form.experimentHours" :min="0" :max="999" />
        </el-form-item>
        <el-form-item label="实验类别" prop="experimentType">
          <el-select v-model="form.experimentType" placeholder="请选择实验类别">
            <el-option label="基础" value="基础" />
            <el-option label="综合" value="综合" />
            <el-option label="设计" value="设计" />
          </el-select>
        </el-form-item>
        <el-form-item label="实验要求" prop="experimentRequirement">
          <el-radio-group v-model="form.experimentRequirement">
            <el-radio label="必做">必做</el-radio>
            <el-radio label="选做">选做</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-radio-group v-model="form.status">
            <el-radio :label="1">正常</el-radio>
            <el-radio :label="0">禁用</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="描述" prop="description">
          <el-input v-model="form.description" type="textarea" :rows="3" placeholder="请输入描述" />
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
import { onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox, FormInstance, FormRules } from 'element-plus'
import { Download, Plus, Refresh, Search } from '@element-plus/icons-vue'
import { del, get, post, put } from '@/utils/request'
import { downloadDocx } from '@/utils/export'

interface ProjectItem {
  id: number
  course_code: string
  project_name: string
  experiment_hours: number
  experiment_type: string
  experiment_requirement: string
  description: string
  status: number
}

const loading = ref(false)
const dialogVisible = ref(false)
const dialogTitle = ref('新增实验项目')
const isEdit = ref(false)
const formRef = ref<FormInstance>()

const tableData = ref<ProjectItem[]>([])

const searchParams = reactive({
  keyword: '',
})

const pagination = reactive({
  page: 1,
  pageSize: 10,
  total: 0,
})

const form = reactive({
  id: 0,
  courseCode: '',
  projectName: '',
  experimentHours: 0,
  experimentType: '',
  experimentRequirement: '必做',
  status: 1,
  description: '',
})

const rules = reactive<FormRules>({
  projectName: [{ required: true, message: '请输入实验项目名称', trigger: 'blur' }],
})

const getTypeColor = (type: string): 'primary' | 'success' | 'warning' | 'info' => {
  const colorMap: Record<string, 'primary' | 'success' | 'warning' | 'info'> = {
    基础: 'primary',
    综合: 'success',
    设计: 'warning',
  }

  return colorMap[type] || 'info'
}

const fetchData = async () => {
  loading.value = true
  try {
    const result = await get<ProjectItem[]>('/experiment-projects')
    let data = result || []

    if (searchParams.keyword) {
      const keyword = searchParams.keyword.toLowerCase()
      data = data.filter((item) =>
        item.project_name?.toLowerCase().includes(keyword) || item.course_code?.toLowerCase().includes(keyword)
      )
    }

    tableData.value = data
    pagination.total = tableData.value.length
  } catch (error) {
    console.error(error)
    ElMessage.error('获取实验项目库失败')
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
  dialogTitle.value = '新增实验项目'
  Object.assign(form, {
    id: 0,
    courseCode: '',
    projectName: '',
    experimentHours: 0,
    experimentType: '',
    experimentRequirement: '必做',
    status: 1,
    description: '',
  })
  dialogVisible.value = true
}

const handleEdit = (row: ProjectItem) => {
  isEdit.value = true
  dialogTitle.value = '编辑实验项目'
  Object.assign(form, {
    id: row.id,
    courseCode: row.course_code || '',
    projectName: row.project_name || '',
    experimentHours: row.experiment_hours || 0,
    experimentType: row.experiment_type || '',
    experimentRequirement: row.experiment_requirement || '必做',
    status: row.status,
    description: row.description || '',
  })
  dialogVisible.value = true
}

const handleDelete = (row: ProjectItem) => {
  ElMessageBox.confirm(`确定要删除实验项目“${row.project_name}”吗？`, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  }).then(async () => {
    try {
      await del(`/experiment-projects/${row.id}`)
      ElMessage.success('删除成功')
      fetchData()
    } catch (error) {
      ElMessage.error('删除失败')
    }
  }).catch(() => {})
}

const handleSubmit = async () => {
  formRef.value?.validate(async (valid) => {
    if (!valid) return

    try {
      const submitData = {
        courseCode: form.courseCode,
        projectName: form.projectName,
        experimentHours: form.experimentHours,
        experimentType: form.experimentType,
        experimentRequirement: form.experimentRequirement,
        status: form.status,
        description: form.description,
      }

      if (isEdit.value) {
        await put(`/experiment-projects/${form.id}`, submitData)
        ElMessage.success('编辑成功')
      } else {
        await post('/experiment-projects', submitData)
        ElMessage.success('新增成功')
      }

      dialogVisible.value = false
      fetchData()
    } catch (error) {
      ElMessage.error(isEdit.value ? '编辑失败' : '新增失败')
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

const handleExport = async () => {
  try {
    await downloadDocx('/export/project-library', 'experiment-project-library.docx')
    ElMessage.success('导出成功')
  } catch (error) {
    ElMessage.error('导出失败')
  }
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
