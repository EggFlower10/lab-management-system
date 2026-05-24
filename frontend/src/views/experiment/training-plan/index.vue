<template>
  <div class="page-container">
    <el-card class="table-card">
      <template #header>
        <div class="card-header">
          <span>实训教学计划</span>
          <div class="header-right">
            <el-input v-model="searchParams.keyword" placeholder="课程编号" class="search-input" clearable />
            <el-button type="success" @click="handleSearch">
              <el-icon><Search /></el-icon>搜索
            </el-button>
            <el-button @click="handleReset">
              <el-icon><Refresh /></el-icon>重置
            </el-button>
            <el-button type="primary" @click="handleAdd">
              <el-icon><Plus /></el-icon>新增计划
            </el-button>
            <el-button type="warning" @click="handleExport">
              <el-icon><Download /></el-icon>导出实训计划
            </el-button>
          </div>
        </div>
      </template>

      <el-table :data="tableData" v-loading="loading" border stripe>
        <el-table-column prop="id" label="ID" width="80" sortable />
        <el-table-column prop="courseCode" label="课程编号" width="120" />
        <el-table-column prop="organizationMode" label="组织方式" width="120">
          <template #default="{ row }">
            <el-tag>{{ row.organizationMode || '-' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="trainingLocation" label="实训地点" min-width="150" />
        <el-table-column prop="trainingPurpose" label="实训目的和要求" min-width="200" show-overflow-tooltip />
        <el-table-column prop="teachingContent" label="教学内容及进度" min-width="200" show-overflow-tooltip />
        <el-table-column prop="trainingMethod" label="实训方式" min-width="150" show-overflow-tooltip />
        <el-table-column prop="assessmentMethod" label="考核方式" width="120" />
        <el-table-column prop="qualityMeasures" label="质量保障措施" min-width="150" show-overflow-tooltip />
        <el-table-column prop="centerOpinion" label="实验中心意见" min-width="150" show-overflow-tooltip />
        <el-table-column prop="departmentOpinion" label="院系意见" min-width="150" show-overflow-tooltip />
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

    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="800px" @close="handleDialogClose">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="140px">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="课程编号" prop="courseCode">
              <el-input v-model="form.courseCode" placeholder="课程编号" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="组织方式" prop="organizationMode">
              <el-select v-model="form.organizationMode" placeholder="请选择组织方式">
                <el-option label="校内集中" value="校内集中" />
                <el-option label="校内分散" value="校内分散" />
                <el-option label="校外集中" value="校外集中" />
                <el-option label="校外分散" value="校外分散" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="实训教学地点" prop="trainingLocation">
          <el-input v-model="form.trainingLocation" placeholder="实训教学地点" />
        </el-form-item>
        <el-form-item label="实训目的和要求" prop="trainingPurpose">
          <el-input v-model="form.trainingPurpose" type="textarea" :rows="3" placeholder="说明实训教学目的和要求" />
        </el-form-item>
        <el-form-item label="教学内容及进度安排" prop="teachingContent">
          <el-input v-model="form.teachingContent" type="textarea" :rows="4" placeholder="说明教学内容及进度安排" />
        </el-form-item>
        <el-form-item label="实训方式" prop="trainingMethod">
          <el-input v-model="form.trainingMethod" type="textarea" :rows="3" placeholder="说明实训方式和分组安排" />
        </el-form-item>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="课程考核方式" prop="assessmentMethod">
              <el-select v-model="form.assessmentMethod" placeholder="请选择考核方式">
                <el-option label="笔试" value="笔试" />
                <el-option label="机试" value="机试" />
                <el-option label="报告" value="报告" />
                <el-option label="答辩" value="答辩" />
                <el-option label="实操" value="实操" />
                <el-option label="综合" value="综合" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="状态" prop="status">
              <el-radio-group v-model="form.status">
                <el-radio :label="1">正常</el-radio>
                <el-radio :label="0">禁用</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="质量保障措施" prop="qualityMeasures">
          <el-input v-model="form.qualityMeasures" type="textarea" :rows="3" placeholder="说明质量保障措施" />
        </el-form-item>
        <el-form-item label="实验中心意见" prop="centerOpinion">
          <el-input v-model="form.centerOpinion" type="textarea" :rows="2" placeholder="实验中心意见" />
        </el-form-item>
        <el-form-item label="院系意见" prop="departmentOpinion">
          <el-input v-model="form.departmentOpinion" type="textarea" :rows="2" placeholder="院系意见" />
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

interface TrainingPlanItem {
  id: number
  courseCode: string
  organizationMode: string
  trainingLocation: string
  trainingPurpose: string
  teachingContent: string
  trainingMethod: string
  assessmentMethod: string
  qualityMeasures: string
  centerOpinion: string
  departmentOpinion: string
  status: number
}

const loading = ref(false)
const dialogVisible = ref(false)
const dialogTitle = ref('新增实训教学计划')
const isEdit = ref(false)
const formRef = ref<FormInstance>()

const tableData = ref<TrainingPlanItem[]>([])

const searchParams = reactive({
  keyword: '',
})

const pagination = reactive({
  page: 1,
  pageSize: 10,
  total: 0,
})

const form = reactive<TrainingPlanItem>({
  id: 0,
  courseCode: '',
  organizationMode: '',
  trainingLocation: '',
  trainingPurpose: '',
  teachingContent: '',
  trainingMethod: '',
  assessmentMethod: '',
  qualityMeasures: '',
  centerOpinion: '',
  departmentOpinion: '',
  status: 1,
})

const rules = reactive<FormRules>({
  courseCode: [{ required: true, message: '请输入课程编号', trigger: 'blur' }],
  organizationMode: [{ required: true, message: '请选择组织方式', trigger: 'change' }],
})

const fetchData = async () => {
  loading.value = true
  try {
    const result = await get<TrainingPlanItem[]>('/training-plans')
    let data = result || []

    if (searchParams.keyword) {
      const keyword = searchParams.keyword.toLowerCase()
      data = data.filter((item) => item.courseCode?.toLowerCase().includes(keyword))
    }

    tableData.value = data
    pagination.total = tableData.value.length
  } catch (error) {
    console.error(error)
    ElMessage.error('获取实训教学计划失败')
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
  dialogTitle.value = '新增实训教学计划'
  Object.assign(form, {
    id: 0,
    courseCode: '',
    organizationMode: '',
    trainingLocation: '',
    trainingPurpose: '',
    teachingContent: '',
    trainingMethod: '',
    assessmentMethod: '',
    qualityMeasures: '',
    centerOpinion: '',
    departmentOpinion: '',
    status: 1,
  })
  dialogVisible.value = true
}

const handleEdit = (row: TrainingPlanItem) => {
  isEdit.value = true
  dialogTitle.value = '编辑实训教学计划'
  Object.assign(form, {
    id: row.id,
    courseCode: row.courseCode || '',
    organizationMode: row.organizationMode || '',
    trainingLocation: row.trainingLocation || '',
    trainingPurpose: row.trainingPurpose || '',
    teachingContent: row.teachingContent || '',
    trainingMethod: row.trainingMethod || '',
    assessmentMethod: row.assessmentMethod || '',
    qualityMeasures: row.qualityMeasures || '',
    centerOpinion: row.centerOpinion || '',
    departmentOpinion: row.departmentOpinion || '',
    status: row.status,
  })
  dialogVisible.value = true
}

const handleDelete = (row: TrainingPlanItem) => {
  ElMessageBox.confirm('确定要删除该实训教学计划吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  }).then(async () => {
    try {
      await del(`/training-plans/${row.id}`)
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
        organizationMode: form.organizationMode,
        trainingLocation: form.trainingLocation,
        trainingPurpose: form.trainingPurpose,
        teachingContent: form.teachingContent,
        trainingMethod: form.trainingMethod,
        assessmentMethod: form.assessmentMethod,
        qualityMeasures: form.qualityMeasures,
        centerOpinion: form.centerOpinion,
        departmentOpinion: form.departmentOpinion,
        status: form.status,
      }

      if (isEdit.value) {
        await put(`/training-plans/${form.id}`, submitData)
        ElMessage.success('编辑成功')
      } else {
        await post('/training-plans', submitData)
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
    await downloadDocx('/export/training-plan', 'training-plan.docx')
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
