<template>
  <div class="page-container">
    <el-card class="table-card">
      <template #header>
        <div class="card-header">
          <span>实验项目开出</span>
          <div class="header-right">
            <el-input
              v-model="searchParams.keyword"
              placeholder="课程名称或实验项目"
              class="search-input"
              clearable
            />
            <el-button type="success" @click="handleSearch">
              <el-icon><Search /></el-icon>
              搜索
            </el-button>
            <el-button @click="handleReset">
              <el-icon><Refresh /></el-icon>
              重置
            </el-button>
            <el-button type="primary" @click="handleAdd">
              <el-icon><Plus /></el-icon>
              新增开出记录
            </el-button>
            <el-button type="warning" @click="handleBatchExportPlan">
              <el-icon><Download /></el-icon>
              导出选中课程授课计划
            </el-button>
            <el-button type="success" @click="handleExportStatistics">
              <el-icon><Download /></el-icon>
              导出项目统计
            </el-button>
          </div>
        </div>
      </template>

      <el-table
        :data="pagedData"
        v-loading="loading"
        border
        stripe
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="55" />
        <el-table-column prop="id" label="ID" width="80" sortable />
        <el-table-column prop="TaskCourseName" label="课程名称" min-width="160" show-overflow-tooltip />
        <el-table-column prop="ProjectName" label="实验项目" min-width="180" show-overflow-tooltip />
        <el-table-column prop="week_no" label="周次" width="110" />
        <el-table-column prop="week_day" label="星期" width="90">
          <template #default="{ row }">
            <el-tag>{{ weekDays[String(row.week_day)] || row.week_day || '-' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="time_slot" label="节次" width="110" />
        <el-table-column prop="group_count" label="组数" width="90" />
        <el-table-column prop="students_per_group" label="每组人数" width="100" />
        <el-table-column prop="cycle_count" label="循环次数" width="100" />
        <el-table-column prop="experiment_requirement" label="实验要求" width="100">
          <template #default="{ row }">
            <el-tag :type="row.experiment_requirement === '必做' ? 'danger' : 'warning'">
              {{ row.experiment_requirement || '-' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="building_name" label="楼栋" width="120" />
        <el-table-column prop="room_number" label="房间号" width="100" />
        <el-table-column prop="is_offered" label="是否开出" width="100">
          <template #default="{ row }">
            <el-tag :type="Number(row.is_offered) === 1 ? 'success' : 'danger'">
              {{ Number(row.is_offered) === 1 ? '已开出' : '未开出' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="not_offered_reason" label="未开出原因" min-width="150" show-overflow-tooltip />
        <el-table-column prop="status" label="状态" width="90">
          <template #default="{ row }">
            <el-tag :type="Number(row.status) === 1 ? 'success' : 'danger'">
              {{ Number(row.status) === 1 ? '正常' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" fixed="right" width="260">
          <template #default="{ row }">
            <div class="action-buttons">
              <el-button type="warning" size="small" @click="handleExportRowPlan(row)">
                导出授课计划
              </el-button>
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

    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="720px" @close="handleDialogClose">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="120px">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="教学任务" prop="taskId">
              <el-select v-model="form.taskId" placeholder="请选择教学任务" style="width: 100%">
                <el-option
                  v-for="task in tasks"
                  :key="task.TaskID"
                  :label="task.CourseName || task.course_name"
                  :value="task.TaskID || task.id"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="实验项目" prop="projectId">
              <el-select v-model="form.projectId" placeholder="请选择实验项目" style="width: 100%">
                <el-option
                  v-for="project in projects"
                  :key="project.id"
                  :label="project.project_name"
                  :value="project.id"
                />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="周次" prop="weekNo">
              <el-input v-model="form.weekNo" placeholder="如 1-8,10-16" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="星期" prop="weekDay">
              <el-select v-model="form.weekDay" placeholder="请选择星期" style="width: 100%">
                <el-option label="周一" value="1" />
                <el-option label="周二" value="2" />
                <el-option label="周三" value="3" />
                <el-option label="周四" value="4" />
                <el-option label="周五" value="5" />
                <el-option label="周六" value="6" />
                <el-option label="周日" value="7" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="节次" prop="timeSlot">
              <el-input v-model="form.timeSlot" placeholder="如 1-2节" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="组数" prop="groupCount">
              <el-input-number v-model="form.groupCount" :min="1" :max="99" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="每组人数" prop="studentsPerGroup">
              <el-input-number v-model="form.studentsPerGroup" :min="1" :max="99" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="循环次数" prop="cycleCount">
              <el-input-number v-model="form.cycleCount" :min="1" :max="99" style="width: 100%" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="实验要求" prop="experimentRequirement">
              <el-radio-group v-model="form.experimentRequirement">
                <el-radio label="必做">必做</el-radio>
                <el-radio label="选做">选做</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="是否开出" prop="isOffered">
              <el-radio-group v-model="form.isOffered">
                <el-radio :label="1">已开出</el-radio>
                <el-radio :label="0">未开出</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="楼栋" prop="buildingName">
              <el-input v-model="form.buildingName" placeholder="排课后填写" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="房间号" prop="roomNumber">
              <el-input v-model="form.roomNumber" placeholder="排课后填写" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="未开出原因" prop="notOfferedReason">
          <el-input v-model="form.notOfferedReason" type="textarea" :rows="3" placeholder="未开出时填写原因" />
        </el-form-item>

        <el-form-item label="状态" prop="status">
          <el-radio-group v-model="form.status">
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
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'
import { Download, Plus, Refresh, Search } from '@element-plus/icons-vue'
import { del, get, post, put } from '@/utils/request'
import { downloadDocx } from '@/utils/export'

interface OfferRow {
  id: number
  task_id?: number
  project_id?: number
  TaskCourseName?: string
  ProjectName?: string
  week_no?: string
  week_day?: string | number
  time_slot?: string
  group_count?: number
  students_per_group?: number
  cycle_count?: number
  experiment_requirement?: string
  building_name?: string
  room_number?: string
  is_offered?: number
  not_offered_reason?: string
  status?: number
}

const loading = ref(false)
const dialogVisible = ref(false)
const dialogTitle = ref('新增实验项目开出')
const isEdit = ref(false)
const formRef = ref<FormInstance>()

const tableData = ref<OfferRow[]>([])
const selectedRows = ref<OfferRow[]>([])
const tasks = ref<any[]>([])
const projects = ref<any[]>([])

const weekDays: Record<string, string> = {
  '1': '周一',
  '2': '周二',
  '3': '周三',
  '4': '周四',
  '5': '周五',
  '6': '周六',
  '7': '周日',
}

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
  taskId: 0,
  projectId: 0,
  weekNo: '',
  weekDay: '',
  timeSlot: '',
  groupCount: 1,
  studentsPerGroup: 1,
  cycleCount: 1,
  experimentRequirement: '必做',
  buildingName: '',
  roomNumber: '',
  isOffered: 1,
  notOfferedReason: '',
  status: 1,
})

const rules = reactive<FormRules>({
  taskId: [{ required: true, message: '请选择教学任务', trigger: 'change' }],
  projectId: [{ required: true, message: '请选择实验项目', trigger: 'change' }],
})

const filteredData = computed(() => {
  const keyword = searchParams.keyword.trim().toLowerCase()
  if (!keyword) {
    return tableData.value
  }

  return tableData.value.filter((item) =>
    String(item.TaskCourseName || '').toLowerCase().includes(keyword) ||
    String(item.ProjectName || '').toLowerCase().includes(keyword),
  )
})

const pagedData = computed(() => {
  const start = (pagination.page - 1) * pagination.pageSize
  const end = start + pagination.pageSize
  return filteredData.value.slice(start, end)
})

const resetForm = () => {
  Object.assign(form, {
    id: 0,
    taskId: 0,
    projectId: 0,
    weekNo: '',
    weekDay: '',
    timeSlot: '',
    groupCount: 1,
    studentsPerGroup: 1,
    cycleCount: 1,
    experimentRequirement: '必做',
    buildingName: '',
    roomNumber: '',
    isOffered: 1,
    notOfferedReason: '',
    status: 1,
  })
}

const updatePaginationTotal = () => {
  pagination.total = filteredData.value.length
  const maxPage = Math.max(1, Math.ceil(Math.max(pagination.total, 1) / pagination.pageSize))
  if (pagination.page > maxPage) {
    pagination.page = maxPage
  }
}

const fetchOptions = async () => {
  const [taskRes, projectRes] = await Promise.all([
    get('/experiment-tasks'),
    get('/experiment-projects'),
  ])
  tasks.value = taskRes || []
  projects.value = projectRes || []
}

const fetchData = async () => {
  loading.value = true
  try {
    const result = await get('/experiment-offers')
    tableData.value = result || []
    updatePaginationTotal()
  } catch (error) {
    console.error(error)
    tableData.value = []
    updatePaginationTotal()
    ElMessage.error('获取实验项目开出失败')
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  pagination.page = 1
  updatePaginationTotal()
}

const handleReset = () => {
  searchParams.keyword = ''
  pagination.page = 1
  updatePaginationTotal()
}

const handleSelectionChange = (rows: OfferRow[]) => {
  selectedRows.value = rows
}

const getUniqueTaskIds = (rows: OfferRow[]) => {
  return Array.from(
    new Set(
      rows
        .map((item) => Number(item.task_id))
        .filter((value) => Number.isInteger(value) && value > 0),
    ),
  )
}

const buildTeachingPlanFilename = (courseName?: string) => {
  return `${courseName || '实验教学授课计划表'}.docx`
}

const handleExportRowPlan = async (row: OfferRow) => {
  const taskId = Number(row.task_id)
  if (!Number.isInteger(taskId) || taskId <= 0) {
    ElMessage.error('当前记录缺少课程任务，无法导出')
    return
  }

  try {
    await downloadDocx('/export/teaching-plan', buildTeachingPlanFilename(row.TaskCourseName), { taskId })
    ElMessage.success('授课计划导出成功')
  } catch (error) {
    ElMessage.error('授课计划导出失败')
  }
}

const handleBatchExportPlan = async () => {
  const taskIds = getUniqueTaskIds(selectedRows.value)
  if (taskIds.length === 0) {
    ElMessage.warning('请先勾选要导出的课程')
    return
  }

  try {
    await downloadDocx('/export/teaching-plan', '实验教学授课计划表.docx', { taskIds })
    ElMessage.success('授课计划导出成功')
  } catch (error) {
    ElMessage.error('授课计划导出失败')
  }
}

const handleExportStatistics = async () => {
  try {
    await downloadDocx('/export/project-statistics', '实验项目统计表.docx')
    ElMessage.success('项目统计导出成功')
  } catch (error) {
    ElMessage.error('项目统计导出失败')
  }
}

const handleAdd = () => {
  isEdit.value = false
  dialogTitle.value = '新增实验项目开出'
  resetForm()
  dialogVisible.value = true
}

const handleEdit = (row: OfferRow) => {
  isEdit.value = true
  dialogTitle.value = '编辑实验项目开出'
  Object.assign(form, {
    id: row.id,
    taskId: row.task_id || 0,
    projectId: row.project_id || 0,
    weekNo: row.week_no || '',
    weekDay: row.week_day != null ? String(row.week_day) : '',
    timeSlot: row.time_slot || '',
    groupCount: row.group_count || 1,
    studentsPerGroup: row.students_per_group || 1,
    cycleCount: row.cycle_count || 1,
    experimentRequirement: row.experiment_requirement || '必做',
    buildingName: row.building_name || '',
    roomNumber: row.room_number || '',
    isOffered: Number(row.is_offered ?? 1),
    notOfferedReason: row.not_offered_reason || '',
    status: Number(row.status ?? 1),
  })
  dialogVisible.value = true
}

const handleDelete = (row: OfferRow) => {
  ElMessageBox.confirm('确定删除这条实验项目开出记录吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  }).then(async () => {
    try {
      await del(`/experiment-offers/${row.id}`)
      ElMessage.success('删除成功')
      await fetchData()
    } catch (error) {
      ElMessage.error('删除失败')
    }
  }).catch(() => {})
}

const handleSubmit = async () => {
  await formRef.value?.validate(async (valid) => {
    if (!valid) {
      return
    }

    const submitData = {
      taskId: form.taskId,
      projectId: form.projectId,
      weekNo: form.weekNo,
      weekDay: form.weekDay,
      timeSlot: form.timeSlot,
      groupCount: form.groupCount,
      studentsPerGroup: form.studentsPerGroup,
      cycleCount: form.cycleCount,
      experimentRequirement: form.experimentRequirement,
      buildingName: form.buildingName,
      roomNumber: form.roomNumber,
      isOffered: form.isOffered,
      notOfferedReason: form.notOfferedReason,
      status: form.status,
    }

    try {
      if (isEdit.value) {
        await put(`/experiment-offers/${form.id}`, submitData)
        ElMessage.success('编辑成功')
      } else {
        await post('/experiment-offers', submitData)
        ElMessage.success('新增成功')
      }
      dialogVisible.value = false
      await fetchData()
    } catch (error) {
      ElMessage.error(isEdit.value ? '编辑失败' : '新增失败')
    }
  })
}

const handleDialogClose = () => {
  formRef.value?.resetFields()
  resetForm()
}

const handleSizeChange = () => {
  pagination.page = 1
  updatePaginationTotal()
}

const handleCurrentChange = () => {
  updatePaginationTotal()
}

onMounted(async () => {
  await fetchOptions()
  await fetchData()
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
  width: 220px;
}

.action-buttons {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}
</style>
