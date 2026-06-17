<template>
  <div class="page-container">
    <el-card class="table-card">
      <template #header>
        <div class="card-header">
          <span>实验课程教学质量</span>
          <div class="header-right">
            <el-input v-model="searchParams.keyword" placeholder="课程名称" class="search-input" clearable />
            <el-button type="success" @click="handleSearch">
              <el-icon><Search /></el-icon>搜索
            </el-button>
            <el-button type="default" @click="handleReset">
              <el-icon><Refresh /></el-icon>重置
            </el-button>
            <el-button type="primary" @click="handleAdd">
              <el-icon><Plus /></el-icon>添加质量记录
            </el-button>
            <el-button type="warning" @click="handleExport">
              <el-icon><Download /></el-icon>导出质量分析
            </el-button>
          </div>
        </div>
      </template>
      <el-table :data="tableData" v-loading="loading" border stripe>
        <el-table-column prop="id" label="ID" width="80" sortable />
        <el-table-column prop="TaskCourseName" label="教学任务" min-width="150" />
        <el-table-column prop="organization" label="机构" width="120" />
        <el-table-column prop="course_name" label="课程名称" min-width="150" />
        <el-table-column prop="experiment_hours" label="实验学时" width="100" />
        <el-table-column prop="is_independent" label="独立设课" width="100">
          <template #default="{ row }">
            <el-tag :type="row.is_independent === 1 ? 'success' : 'info'">
              {{ row.is_independent === 1 ? '是' : '否' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="teacher_name" label="主讲教师" width="120" />
        <el-table-column prop="teacher_title" label="职称" width="100" />
        <el-table-column prop="technician_name" label="实验技术人员" width="120" />
        <el-table-column prop="technician_title" label="职称" width="100" />
        <el-table-column prop="class_name" label="授课班级" min-width="120" />
        <el-table-column prop="class_student_count" label="班级人数" width="100" />
        <el-table-column prop="planned_project_count" label="计划开设" width="100" />
        <el-table-column prop="actual_project_count" label="实际开出" width="100" />
        <el-table-column prop="not_offered_projects" label="未开出项目" min-width="150" show-overflow-tooltip />
        <el-table-column prop="assessment_method" label="考核方式" width="120" />
        <el-table-column prop="assessment_count" label="考核人数" width="100" />
        <el-table-column prop="assessment_time" label="考核时间" width="150" />
        <el-table-column prop="status" label="状态" width="80">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'danger'">
              {{ row.status === 1 ? '正常' : '停用' }}
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

    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="800px" @close="handleDialogClose">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="120px">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="教学任务" prop="taskId">
              <el-select v-model="form.taskId" placeholder="请选择教学任务">
                <el-option v-for="task in tasks" :key="task.TaskID" :label="task.CourseName" :value="task.TaskID" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="机构" prop="organization">
              <el-input v-model="form.organization" placeholder="开课学院" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="课程名称" prop="courseName">
              <el-input v-model="form.courseName" placeholder="课程名称" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="实验学时" prop="experimentHours">
              <el-input-number v-model="form.experimentHours" :min="0" :max="999" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="独立设课" prop="isIndependent">
              <el-radio-group v-model="form.isIndependent">
                <el-radio :label="1">是</el-radio>
                <el-radio :label="0">否</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="考核方式" prop="assessmentMethod">
              <el-select v-model="form.assessmentMethod" placeholder="请选择考核方式">
                <el-option label="考试" value="考试" />
                <el-option label="考查" value="考查" />
                <el-option label="报告" value="报告" />
                <el-option label="答辩" value="答辩" />
                <el-option label="综合" value="综合" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="主讲教师" prop="teacherName">
              <el-input v-model="form.teacherName" placeholder="教师姓名" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="教师职称" prop="teacherTitle">
              <el-input v-model="form.teacherTitle" placeholder="职称" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="考核人数" prop="assessmentCount">
              <el-input-number v-model="form.assessmentCount" :min="0" :max="999" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="技术人员" prop="technicianName">
              <el-input v-model="form.technicianName" placeholder="实验员" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="技术人员职称" prop="technicianTitle">
              <el-input v-model="form.technicianTitle" placeholder="职称" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="考核时间" prop="assessmentTime">
              <el-date-picker v-model="form.assessmentTime" type="datetime" placeholder="选择时间" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="授课班级" prop="className">
              <el-input v-model="form.className" placeholder="班级名称" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="班级人数" prop="classStudentCount">
              <el-input-number v-model="form.classStudentCount" :min="0" :max="999" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="状态" prop="status">
              <el-radio-group v-model="form.status">
                <el-radio :label="1">正常</el-radio>
                <el-radio :label="0">停用</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="计划开设项目数" prop="plannedProjectCount">
              <el-input-number v-model="form.plannedProjectCount" :min="0" :max="99" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="实际开出项目数" prop="actualProjectCount">
              <el-input-number v-model="form.actualProjectCount" :min="0" :max="99" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="未开出项目" prop="notOfferedProjects">
          <el-input v-model="form.notOfferedProjects" type="textarea" :rows="3" placeholder="列出未开出的实验项目名称，用逗号分隔" />
        </el-form-item>
        <el-form-item label="未开出原因" prop="notOfferedReasons">
          <el-input v-model="form.notOfferedReasons" type="textarea" :rows="3" placeholder="说明未开出项目的原因" />
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
import { Search, Refresh, Plus, Download } from '@element-plus/icons-vue'
import { get, post, put, del } from '@/utils/request'
import { downloadExcel } from '@/utils/export'

const loading = ref(false)
const dialogVisible = ref(false)
const dialogTitle = ref('添加实验课程教学质量')
const isEdit = ref(false)
const formRef = ref<FormInstance>()

const tableData = ref<any[]>([])
const tasks = ref<any[]>([])

const searchParams = reactive({
  keyword: ''
})

const pagination = reactive({
  page: 1,
  pageSize: 10,
  total: 0
})

const form = reactive({
  id: 0,
  taskId: 0,
  organization: '',
  courseName: '',
  experimentHours: 0,
  isIndependent: 0,
  teacherName: '',
  teacherTitle: '',
  technicianName: '',
  technicianTitle: '',
  className: '',
  classStudentCount: 0,
  plannedProjectCount: 0,
  actualProjectCount: 0,
  notOfferedProjects: '',
  notOfferedReasons: '',
  assessmentMethod: '',
  assessmentCount: 0,
  assessmentTime: '',
  status: 1
})

const rules = reactive<FormRules>({
  taskId: [
    { required: true, message: '请选择教学任务', trigger: 'change' }
  ],
  courseName: [
    { required: true, message: '请输入课程名称', trigger: 'blur' }
  ]
})

const fetchOptions = async () => {
  try {
    const result = await get('/experiment-tasks')
    tasks.value = result || []
  } catch (error) {
    console.error('获取任务数据失败:', error)
  }
}

const fetchData = async () => {
  loading.value = true
  try {
    const result = await get('/experiment-quality')
    let data = result || []

    if (searchParams.keyword) {
      data = data.filter((item: any) =>
        item.course_name?.toLowerCase().includes(searchParams.keyword.toLowerCase()) ||
        item.teacher_name?.toLowerCase().includes(searchParams.keyword.toLowerCase())
      )
    }

    tableData.value = data
    pagination.total = tableData.value.length
  } catch (error) {
    console.error(error)
    ElMessage.error('获取实验课程教学质量失败')
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
  dialogTitle.value = '添加实验课程教学质量'
  Object.assign(form, {
    id: 0,
    taskId: 0,
    organization: '',
    courseName: '',
    experimentHours: 0,
    isIndependent: 0,
    teacherName: '',
    teacherTitle: '',
    technicianName: '',
    technicianTitle: '',
    className: '',
    classStudentCount: 0,
    plannedProjectCount: 0,
    actualProjectCount: 0,
    notOfferedProjects: '',
    notOfferedReasons: '',
    assessmentMethod: '',
    assessmentCount: 0,
    assessmentTime: '',
    status: 1
  })
  dialogVisible.value = true
}

const handleEdit = (row: any) => {
  isEdit.value = true
  dialogTitle.value = '编辑实验课程教学质量'
  Object.assign(form, {
    id: row.id,
    taskId: row.task_id || 0,
    organization: row.organization || '',
    courseName: row.course_name || '',
    experimentHours: row.experiment_hours || 0,
    isIndependent: row.is_independent || 0,
    teacherName: row.teacher_name || '',
    teacherTitle: row.teacher_title || '',
    technicianName: row.technician_name || '',
    technicianTitle: row.technician_title || '',
    className: row.class_name || '',
    classStudentCount: row.class_student_count || 0,
    plannedProjectCount: row.planned_project_count || 0,
    actualProjectCount: row.actual_project_count || 0,
    notOfferedProjects: row.not_offered_projects || '',
    notOfferedReasons: row.not_offered_reasons || '',
    assessmentMethod: row.assessment_method || '',
    assessmentCount: row.assessment_count || 0,
    assessmentTime: row.assessment_time || '',
    status: row.status
  })
  dialogVisible.value = true
}

const handleDelete = (row: any) => {
  ElMessageBox.confirm(`确定要删除该实验课程教学质量记录吗？`, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  }).then(async () => {
    try {
      await del(`/experiment-quality/${row.id}`)
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
        const submitData = {
          taskId: form.taskId,
          organization: form.organization,
          courseName: form.courseName,
          experimentHours: form.experimentHours,
          isIndependent: form.isIndependent,
          teacherName: form.teacherName,
          teacherTitle: form.teacherTitle,
          technicianName: form.technicianName,
          technicianTitle: form.technicianTitle,
          className: form.className,
          classStudentCount: form.classStudentCount,
          plannedProjectCount: form.plannedProjectCount,
          actualProjectCount: form.actualProjectCount,
          notOfferedProjects: form.notOfferedProjects,
          notOfferedReasons: form.notOfferedReasons,
          assessmentMethod: form.assessmentMethod,
          assessmentCount: form.assessmentCount,
          assessmentTime: form.assessmentTime,
          status: form.status
        }

        if (isEdit.value) {
          await put(`/experiment-quality/${form.id}`, submitData)
          ElMessage.success('编辑成功')
        } else {
          await post('/experiment-quality', submitData)
          ElMessage.success('添加成功')
        }
        dialogVisible.value = false
        fetchData()
      } catch (error: any) {
        ElMessage.error(isEdit.value ? '编辑失败' : '添加失败')
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

const handleExport = async () => {
  try {
    await downloadExcel('/experiment-quality/export', 'experiment-quality.xlsx')
    ElMessage.success('导出成功')
  } catch (error) {
    ElMessage.error('导出失败')
  }
}

onMounted(() => {
  fetchOptions()
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
