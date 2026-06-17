<template>
  <div class="page-container">
    <el-card class="table-card">
      <template #header>
        <div class="card-header">
          <span>实验（实践、实训）教学任务</span>
          <div class="header-right">
            <el-input v-model="searchParams.keyword" placeholder="课程名称" class="search-input" clearable />
            <el-button type="success" @click="handleSearch" class="search-button">
              <el-icon><Search /></el-icon>搜索
            </el-button>
            <el-button type="default" @click="handleReset" class="reset-button">
              <el-icon><Refresh /></el-icon>重置
            </el-button>
            <el-button type="primary" @click="handleAdd">
              <el-icon><Plus /></el-icon>新增任务
            </el-button>
            <el-button type="warning" @click="handleExport">
              <el-icon><Download /></el-icon>导出Excel
            </el-button>
          </div>
        </div>
      </template>
      <el-table
        :data="tableData"
        v-loading="loading"
        border
        stripe
        :default-sort="{ prop: 'TaskID', order: 'descending' }"
      >
        <el-table-column prop="TaskID" label="ID" width="80" sortable />
        <el-table-column prop="SemesterName" label="学期" width="150" />
        <el-table-column prop="MajorName" label="专业" width="120" />
        <el-table-column prop="ClassName" label="班级" width="120" />
        <el-table-column prop="StudentCount" label="学生人数" width="80" />
        <el-table-column prop="StudentLevel" label="学生层次" width="80">
          <template #default="{ row }">
            <el-tag>{{ row.StudentLevel || '-' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="CourseName" label="课程名称" width="150" />
        <el-table-column prop="CourseCategory" label="课程类别" width="120">
          <template #default="{ row }">
            <el-tag type="info">{{ row.CourseCategory || '-' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="IsIndependent" label="独立设课" width="80">
          <template #default="{ row }">
            <el-tag :type="row.IsIndependent ? 'success' : 'warning'">
              {{ row.IsIndependent ? '是' : '否' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="ExperimentCurrentHours" label="实验学时" width="80" />
        <el-table-column prop="PracticeCurrentHours" label="实践学时" width="80" />
        <el-table-column prop="TrainingCurrentHours" label="实训学时" width="80" />
        <el-table-column prop="TeacherName" label="授课教师" width="100" />
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

    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="700px" @close="handleDialogClose">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="120px">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="学期" prop="SemesterID">
              <el-select v-model="form.SemesterID" placeholder="请选择学期">
                <el-option v-for="semester in semesters" :key="semester.id" :label="semester.name" :value="semester.id" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="专业" prop="MajorID">
              <el-select v-model="form.MajorID" placeholder="请选择专业">
                <el-option v-for="major in majors" :key="major.id" :label="major.name" :value="major.id" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="班级" prop="ClassID">
              <el-select v-model="form.ClassID" placeholder="请选择班级">
                <el-option v-for="cls in classes" :key="cls.id" :label="cls.name" :value="cls.id" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="学生人数" prop="StudentCount">
              <el-input v-model.number="form.StudentCount" type="number" placeholder="请输入学生人数" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="学生层次" prop="StudentLevel">
              <el-select v-model="form.StudentLevel" placeholder="请选择学生层次">
                <el-option label="专科" value="专科" />
                <el-option label="本科" value="本科" />
                <el-option label="研究生" value="研究生" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="课程名称" prop="CourseName">
              <el-input v-model="form.CourseName" placeholder="请输入课程名称" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="课程类别" prop="CourseCategory">
              <el-select v-model="form.CourseCategory" placeholder="请选择课程类别">
                <el-option label="公共必修课" value="公共必修课" />
                <el-option label="专业基础必修课" value="专业基础必修课" />
                <el-option label="专业必修课" value="专业必修课" />
                <el-option label="专业选修课" value="专业选修课" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="是否独立设课" prop="IsIndependent">
              <el-radio-group v-model="form.IsIndependent">
                <el-radio :label="1">是</el-radio>
                <el-radio :label="0">否</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="实验总学时" prop="ExperimentTotalHours">
              <el-input v-model.number="form.ExperimentTotalHours" type="number" placeholder="请输入实验总学时" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="本学期实验学时" prop="ExperimentCurrentHours">
              <el-input v-model.number="form.ExperimentCurrentHours" type="number" placeholder="本学期实验学时" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="实践总学时" prop="PracticeTotalHours">
              <el-input v-model.number="form.PracticeTotalHours" type="number" placeholder="请输入实践总学时" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="本学期实践学时" prop="PracticeCurrentHours">
              <el-input v-model.number="form.PracticeCurrentHours" type="number" placeholder="本学期实践学时" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="实训总学时" prop="TrainingTotalHours">
              <el-input v-model.number="form.TrainingTotalHours" type="number" placeholder="请输入实训总学时" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="本学期实训学时" prop="TrainingCurrentHours">
              <el-input v-model.number="form.TrainingCurrentHours" type="number" placeholder="本学期实训学时" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="开课机构" prop="OrgID">
              <el-select v-model="form.OrgID" placeholder="请选择开课机构">
                <el-option v-for="org in organizations" :key="org.id" :label="org.name" :value="org.id" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="开课部门" prop="DeptID">
              <el-select v-model="form.DeptID" placeholder="请选择开课部门">
                <el-option v-for="dept in departments" :key="dept.id" :label="dept.name" :value="dept.id" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="授课教师" prop="TeacherName">
              <el-input v-model="form.TeacherName" placeholder="请输入授课教师" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="教师职称" prop="TeacherTitle">
              <el-input v-model="form.TeacherTitle" placeholder="请输入教师职称" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="技术人员" prop="TechnicianName">
              <el-input v-model="form.TechnicianName" placeholder="请输入技术人员（指导老师）" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="技术人员职称" prop="TechnicianTitle">
              <el-input v-model="form.TechnicianTitle" placeholder="请输入技术人员职称" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="教材名称" prop="TextbookName">
              <el-input v-model="form.TextbookName" placeholder="请输入教材名称" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="实验指导书" prop="GuidebookName">
              <el-input v-model="form.GuidebookName" placeholder="请输入实验指导书名称" />
            </el-form-item>
          </el-col>
        </el-row>
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
import { Search, Refresh, Plus, Download } from '@element-plus/icons-vue'
import { get, post, put, del } from '@/utils/request'
import { downloadExcel } from '@/utils/export'

const loading = ref(false)
const dialogVisible = ref(false)
const dialogTitle = ref('新增实验教学任务')
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

const semesters = ref<any[]>([])
const majors = ref<any[]>([])
const classes = ref<any[]>([])
const organizations = ref<any[]>([])
const departments = ref<any[]>([])

const form = reactive({
  TaskID: 0,
  SemesterID: 0,
  MajorID: 0,
  ClassID: 0,
  StudentCount: 0,
  StudentLevel: '',
  CourseName: '',
  CourseCategory: '',
  IsIndependent: 0,
  ExperimentTotalHours: 0,
  ExperimentCurrentHours: 0,
  PracticeTotalHours: 0,
  PracticeCurrentHours: 0,
  TrainingTotalHours: 0,
  TrainingCurrentHours: 0,
  OrgID: 0,
  DeptID: 0,
  TeacherName: '',
  TeacherTitle: '',
  TechnicianName: '',
  TechnicianTitle: '',
  TextbookName: '',
  GuidebookName: '',
  Status: 1
})

const rules = reactive<FormRules>({
  SemesterID: [
    { required: true, message: '请选择学期', trigger: 'change' }
  ],
  CourseName: [
    { required: true, message: '请输入课程名称', trigger: 'blur' }
  ]
})

const fetchOptions = async () => {
  try {
    console.log('=== Fetching options ===')
    const [semesterRes, majorRes, classRes, orgRes, deptRes] = await Promise.all([
      get('/semesters'),
      get('/majors'),
      get('/classes'),
      get('/organizations'),
      get('/departments')
    ])
    console.log('Semesters:', semesterRes)
    console.log('Majors:', majorRes)
    console.log('Classes:', classRes)
    console.log('Organizations:', orgRes)
    console.log('Departments:', deptRes)
    semesters.value = semesterRes || []
    majors.value = majorRes || []
    classes.value = classRes || []
    organizations.value = orgRes || []
    departments.value = deptRes || []
  } catch (error: any) {
    console.error('获取选项数据失败:', error.response?.data || error.message)
  }
}

const fetchData = async () => {
  loading.value = true
  try {
    const result = await get('/experiment-tasks')
    let data = result || []
    
    if (searchParams.keyword) {
      data = data.filter((item: any) => 
        item.CourseName.toLowerCase().includes(searchParams.keyword.toLowerCase()) ||
        item.TeacherName.toLowerCase().includes(searchParams.keyword.toLowerCase())
      )
    }
    
    tableData.value = data
    pagination.total = tableData.value.length
  } catch (error) {
    console.error(error)
    ElMessage.error('获取实验教学任务列表失败')
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

const handleAdd = async () => {
  await fetchOptions()
  isEdit.value = false
  dialogTitle.value = '新增实验教学任务'
  Object.assign(form, {
    TaskID: 0,
    SemesterID: 0,
    MajorID: 0,
    ClassID: 0,
    StudentCount: 0,
    StudentLevel: '',
    CourseName: '',
    CourseCategory: '',
    IsIndependent: 0,
    ExperimentTotalHours: 0,
    ExperimentCurrentHours: 0,
    PracticeTotalHours: 0,
    PracticeCurrentHours: 0,
    TrainingTotalHours: 0,
    TrainingCurrentHours: 0,
    OrgID: 0,
    DeptID: 0,
    TeacherName: '',
    TeacherTitle: '',
    TechnicianName: '',
    TechnicianTitle: '',
    TextbookName: '',
    GuidebookName: '',
    Status: 1
  })
  dialogVisible.value = true
}

const handleEdit = (row: any) => {
  isEdit.value = true
  dialogTitle.value = '编辑实验教学任务'
  Object.assign(form, {
    TaskID: row.TaskID,
    SemesterID: row.SemesterID || 0,
    MajorID: row.MajorID || 0,
    ClassID: row.ClassID || 0,
    StudentCount: row.StudentCount || 0,
    StudentLevel: row.StudentLevel || '',
    CourseName: row.CourseName || '',
    CourseCategory: row.CourseCategory || '',
    IsIndependent: row.IsIndependent || 0,
    ExperimentTotalHours: row.ExperimentTotalHours || 0,
    ExperimentCurrentHours: row.ExperimentCurrentHours || 0,
    PracticeTotalHours: row.PracticeTotalHours || 0,
    PracticeCurrentHours: row.PracticeCurrentHours || 0,
    TrainingTotalHours: row.TrainingTotalHours || 0,
    TrainingCurrentHours: row.TrainingCurrentHours || 0,
    OrgID: row.OrgID || 0,
    DeptID: row.DeptID || 0,
    TeacherName: row.TeacherName || '',
    TeacherTitle: row.TeacherTitle || '',
    TechnicianName: row.TechnicianName || '',
    TechnicianTitle: row.TechnicianTitle || '',
    TextbookName: row.TextbookName || '',
    GuidebookName: row.GuidebookName || '',
    Status: row.Status
  })
  dialogVisible.value = true
}

const handleDelete = (row: any) => {
  ElMessageBox.confirm(`确定要删除实验教学任务 "${row.CourseName}" 吗？`, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  }).then(async () => {
    try {
      await del(`/experiment-tasks/${row.TaskID}`)
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
        const submitData: Record<string, any> = { ...form }
        if (submitData.SemesterID === 0) submitData.SemesterID = null
        if (submitData.MajorID === 0) submitData.MajorID = null
        if (submitData.ClassID === 0) submitData.ClassID = null
        if (submitData.OrgID === 0) submitData.OrgID = null
        if (submitData.DeptID === 0) submitData.DeptID = null
        
        if (isEdit.value) {
          await put(`/experiment-tasks/${form.TaskID}`, submitData)
          ElMessage.success('编辑成功')
        } else {
          await post('/experiment-tasks', submitData)
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

const handleExport = async () => {
  try {
    await downloadExcel('/experiment-tasks/export', 'experiment-tasks.xlsx')
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
