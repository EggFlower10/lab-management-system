<template>
  <div class="page-container">
    <el-card class="table-card">
      <template #header>
        <div class="card-header">
          <span>课程管理</span>
          <div class="header-right">
            <el-input v-model="searchParams.keyword" placeholder="课程编码/名称" class="search-input" clearable />
            <el-select v-model="searchParams.nature" placeholder="课程性质" class="search-select">
              <el-option label="全部性质" value="" />
              <el-option label="必修" value="Compulsory" />
              <el-option label="选修" value="Elective" />
              <el-option label="公选" value="Public" />
            </el-select>
            <el-select v-model="searchParams.status" placeholder="全部状态" class="search-select">
              <el-option label="全部状态" value="" />
              <el-option label="正常" value="1" />
              <el-option label="禁用" value="0" />
            </el-select>
            <el-button type="success" @click="handleSearch">
              <el-icon><Search /></el-icon>搜索
            </el-button>
            <el-button @click="handleReset">
              <el-icon><Refresh /></el-icon>重置
            </el-button>
            <el-button type="primary" @click="handleAdd">
              <el-icon><Plus /></el-icon>新增课程
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
        <el-table-column prop="CourseID" label="ID" width="80" />
        <el-table-column prop="CourseCode" label="课程编码" width="120" />
        <el-table-column prop="CourseName" label="课程名称" width="150" />
        <el-table-column prop="CourseNameEn" label="英文名称" width="180" />
        <el-table-column prop="CourseNature" label="课程性质" width="100">
          <template #default="{ row }">
            {{ row.CourseNature === 'Compulsory' ? '必修' : row.CourseNature === 'Elective' ? '选修' : row.CourseNature === 'Public' ? '公选' : row.CourseNature }}
          </template>
        </el-table-column>
        <el-table-column prop="Credits" label="学分" width="80" />
        <el-table-column prop="TotalHours" label="总学时" width="80" />
        <el-table-column prop="LectureHours" label="讲授" width="80" />
        <el-table-column prop="PracticeHours" label="实践" width="80" />
        <el-table-column prop="LabHours" label="实验" width="80" />
        <el-table-column prop="OnlineHours" label="网络" width="80" />
        <el-table-column prop="OpenSemesters" label="开课学期" width="120" />
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

    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="600px" @close="handleDialogClose">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
        <el-form-item label="课程编码" prop="CourseCode">
          <el-input v-model="form.CourseCode" placeholder="请输入课程编码" />
        </el-form-item>
        <el-form-item label="课程名称" prop="CourseName">
          <el-input v-model="form.CourseName" placeholder="请输入课程名称" />
        </el-form-item>
        <el-form-item label="英文名称" prop="CourseNameEn">
          <el-input v-model="form.CourseNameEn" placeholder="请输入英文名称" />
        </el-form-item>
        <el-form-item label="课程性质" prop="CourseNature">
          <el-select v-model="form.CourseNature" placeholder="请选择课程性质">
            <el-option label="必修" value="Compulsory" />
            <el-option label="选修" value="Elective" />
            <el-option label="公选" value="Public" />
          </el-select>
        </el-form-item>
        <el-form-item label="学分" prop="Credits">
          <el-input v-model.number="form.Credits" type="number" placeholder="请输入学分" />
        </el-form-item>
        <el-form-item label="总学时" prop="TotalHours">
          <el-input v-model.number="form.TotalHours" type="number" placeholder="请输入总学时" />
        </el-form-item>
        <el-form-item label="讲授学时" prop="LectureHours">
          <el-input v-model.number="form.LectureHours" type="number" placeholder="请输入讲授学时" />
        </el-form-item>
        <el-form-item label="实践学时" prop="PracticeHours">
          <el-input v-model.number="form.PracticeHours" type="number" placeholder="请输入实践学时" />
        </el-form-item>
        <el-form-item label="实验学时" prop="LabHours">
          <el-input v-model.number="form.LabHours" type="number" placeholder="请输入实验学时" />
        </el-form-item>
        <el-form-item label="网络学时" prop="OnlineHours">
          <el-input v-model.number="form.OnlineHours" type="number" placeholder="请输入网络学时" />
        </el-form-item>
        <el-form-item label="开课学期" prop="OpenSemesters">
          <el-input v-model="form.OpenSemesters" placeholder="请输入开课学期，如：1,2" />
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
const dialogTitle = ref('新增课程')
const isEdit = ref(false)
const formRef = ref<FormInstance>()

const tableData = ref<any[]>([])

const searchParams = reactive({
  keyword: '',
  nature: '',
  status: ''
})

const pagination = reactive({ 
  page: 1, 
  pageSize: 10, 
  total: 0 
})

const form = reactive({
  CourseID: 0,
  CourseCode: '',
  CourseName: '',
  CourseNameEn: '',
  CourseNature: 'Compulsory',
  Credits: 0,
  TotalHours: 0,
  LectureHours: 0,
  PracticeHours: 0,
  LabHours: 0,
  OnlineHours: 0,
  OpenSemesters: '',
  Status: 1,
  SortOrder: 0
})

const rules = reactive<FormRules>({
  CourseCode: [
    { required: true, message: '请输入课程编码', trigger: 'blur' }
  ],
  CourseName: [
    { required: true, message: '请输入课程名称', trigger: 'blur' }
  ],
  Credits: [
    { required: true, message: '请输入学分', trigger: 'blur' }
  ],
  TotalHours: [
    { required: true, message: '请输入总学时', trigger: 'blur' }
  ]
})

const fetchData = async () => {
  loading.value = true
  try {
    const result = await get('/courses')
    let data = result || []
    
    if (searchParams.keyword) {
      data = data.filter((item: any) => 
        item.CourseCode.toLowerCase().includes(searchParams.keyword.toLowerCase()) ||
        item.CourseName.toLowerCase().includes(searchParams.keyword.toLowerCase())
      )
    }
    if (searchParams.nature) {
      data = data.filter((item: any) => item.CourseNature === searchParams.nature)
    }
    if (searchParams.status) {
      data = data.filter((item: any) => String(item.Status) === searchParams.status)
    }
    
    tableData.value = data
    pagination.total = tableData.value.length
  } catch (error) {
    console.error(error)
    ElMessage.error('获取课程列表失败')
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
  searchParams.nature = ''
  searchParams.status = ''
  pagination.page = 1
  fetchData()
}

const handleAdd = () => {
  isEdit.value = false
  dialogTitle.value = '新增课程'
  Object.assign(form, {
    CourseID: 0,
    CourseCode: '',
    CourseName: '',
    CourseNameEn: '',
    CourseNature: 'Compulsory',
    Credits: 0,
    TotalHours: 0,
    LectureHours: 0,
    PracticeHours: 0,
    LabHours: 0,
    OnlineHours: 0,
    OpenSemesters: '',
    Status: 1,
    SortOrder: 0
  })
  dialogVisible.value = true
}

const handleEdit = (row: any) => {
  isEdit.value = true
  dialogTitle.value = '编辑课程'
  Object.assign(form, {
    CourseID: row.CourseID,
    CourseCode: row.CourseCode,
    CourseName: row.CourseName,
    CourseNameEn: row.CourseNameEn || '',
    CourseNature: row.CourseNature,
    Credits: row.Credits,
    TotalHours: row.TotalHours,
    LectureHours: row.LectureHours,
    PracticeHours: row.PracticeHours,
    LabHours: row.LabHours,
    OnlineHours: row.OnlineHours,
    OpenSemesters: row.OpenSemesters || '',
    Status: row.Status,
    SortOrder: row.SortOrder || 0
  })
  dialogVisible.value = true
}

const handleDelete = (row: any) => {
  ElMessageBox.confirm(`确定要删除课程 "${row.CourseName}" 吗？`, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  }).then(async () => {
    try {
      await del(`/courses/${row.CourseID}`)
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
          await put(`/courses/${form.CourseID}`, form)
          ElMessage.success('编辑成功')
        } else {
          await post('/courses', form)
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
.search-select {
  width: 140px;
}
.action-buttons {
  display: flex;
  gap: 5px;
}
</style>
