<template>
  <div class="usage-registration-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>使用登记</span>
          <el-button type="primary" @click="handleCreate">新建登记</el-button>
        </div>
      </template>

      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item label="学期">
          <el-select v-model="searchForm.semesterId" placeholder="请选择学期" @change="handleSearch" style="width: 200px;">
            <el-option
              v-for="semester in semesterList"
              :key="semester.id"
              :label="semester.name"
              :value="semester.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="登记状态">
          <el-select v-model="searchForm.status" placeholder="请选择" @change="handleSearch" style="width: 150px;">
            <el-option label="全部" value="all" />
            <el-option label="待登记" value="pending" />
            <el-option label="已登记" value="registered" />
            <el-option label="逾期未登记" value="overdue" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">查询</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>

      <el-table :data="registrationList" border stripe>
        <el-table-column type="index" label="序号" width="60" />
        <el-table-column prop="registration_code" label="登记编号" width="120" />
        <el-table-column prop="building_name" label="楼宇" width="100" />
        <el-table-column prop="room_name" label="实验室" width="150" />
        <el-table-column prop="course_name" label="课程/项目" min-width="150" />
        <el-table-column prop="class_name" label="班级" width="150" />
        <el-table-column prop="teacher_name" label="授课教师" width="100" />
        <el-table-column prop="use_date" label="使用日期" width="120" :formatter="formatDate" />
        <el-table-column prop="week_no" label="周次" width="80" />
        <el-table-column prop="actual_duration" label="实际时长" width="100" :formatter="formatDuration" />
        <el-table-column prop="registration_status" label="登记状态" width="100" :formatter="formatRegistrationStatus" />
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="handleView(row)">查看</el-button>
            <el-button link type="success" @click="handleEdit(row)">编辑</el-button>
            <el-button link type="danger" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 新建/编辑登记弹窗 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogType === 'create' ? '新建使用登记' : '编辑使用登记'"
      width="900px"
      @close="handleDialogClose"
    >
      <el-form :model="form" :rules="rules" ref="formRef" label-width="140px">
        <el-divider content-position="left">基本信息</el-divider>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="所在部门">
              <el-input v-model="form.reportDepartment" readonly />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="填写时间">
              <el-input v-model="form.reportTime" readonly />
            </el-form-item>
          </el-col>
        </el-row>

        <el-divider content-position="left">场地信息</el-divider>
        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="楼名" prop="buildingId">
              <el-select v-model="form.buildingId" placeholder="请选择楼宇" @change="handleBuildingChange">
                <el-option
                  v-for="building in buildingList"
                  :key="building.BuildingID"
                  :label="building.BuildingName"
                  :value="building.BuildingID"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="实验室" prop="roomId">
              <el-select v-model="form.roomId" placeholder="请选择实验室" @change="handleRoomChange">
                <el-option
                  v-for="room in roomList"
                  :key="room.RoomID"
                  :label="room.RoomName"
                  :value="room.RoomID"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="房间号">
              <el-input v-model="form.roomNumber" readonly />
            </el-form-item>
          </el-col>
        </el-row>

        <el-divider content-position="left">使用信息</el-divider>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="使用日期" prop="useDate">
              <el-date-picker v-model="form.useDate" type="date" placeholder="请选择日期" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="教学周">
              <el-input v-model="form.weekNo" readonly />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="课程名称/项目名称" prop="courseName">
              <el-input v-model="form.courseName" placeholder="集中排课取课程名；预约取项目名" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="班级" prop="className">
              <el-input v-model="form.className" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-divider content-position="left">实验项目信息</el-divider>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="实验（实践、实训）项目名称" prop="experimentProjectName">
              <el-select v-model="form.experimentProjectId" placeholder="请选择实验项目（理论授课直接填课程名）" clearable @change="handleExperimentProjectChange">
                <el-option
                  v-for="project in experimentProjectList"
                  :key="project.id"
                  :label="project.project_name"
                  :value="project.id"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="实验（实践、实训）项目类型" prop="experimentType">
              <el-select v-model="form.experimentType" placeholder="请选择">
                <el-option label="基础" value="基础" />
                <el-option label="综合" value="综合" />
                <el-option label="设计" value="设计" />
                <el-option label="其他" value="其他" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-divider content-position="left">使用情况</el-divider>
        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="计划学时" prop="plannedHours">
              <el-input-number v-model="form.plannedHours" :min="0" :max="20" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="实际使用时长" prop="actualDuration">
              <el-input-number v-model="form.actualDuration" :min="0" :max="20" :step="0.5" />
              <span style="margin-left: 10px">小时</span>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="应到人数" prop="expectedStudents">
              <el-input-number v-model="form.expectedStudents" :min="0" :max="200" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="实到人数" prop="actualStudents">
              <el-input-number v-model="form.actualStudents" :min="0" :max="200" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-divider content-position="left">情况记录</el-divider>
        <el-form-item label="学生考勤记录">
          <el-input v-model="form.attendanceRecord" type="textarea" :rows="2" placeholder="迟到或旷课情况文字记录，默认无" />
        </el-form-item>
        <el-form-item label="教学情况记录" prop="teachingRecord">
          <el-input v-model="form.teachingRecord" type="textarea" :rows="2" placeholder="默认正常" />
        </el-form-item>
        <el-form-item label="仪器设备情况记录" prop="equipmentRecord">
          <el-input v-model="form.equipmentRecord" type="textarea" :rows="2" placeholder="默认正常" />
        </el-form-item>
        <el-form-item label="填报人">
          <el-input v-model="form.reporterName" readonly />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit">提交</el-button>
      </template>
    </el-dialog>

    <!-- 查看详情弹窗 -->
    <el-dialog v-model="detailVisible" title="使用登记详情" width="800px">
      <el-descriptions :column="2" border>
        <el-descriptions-item label="登记编号">{{ currentItem.registration_code }}</el-descriptions-item>
        <el-descriptions-item label="登记状态">{{ formatRegistrationStatus(null, null, currentItem.registration_status) }}</el-descriptions-item>
        <el-descriptions-item label="实验室">{{ currentItem.building_name }} {{ currentItem.room_name }}</el-descriptions-item>
        <el-descriptions-item label="使用日期">{{ formatDate(null, null, currentItem.use_date) }}</el-descriptions-item>
        <el-descriptions-item label="课程/项目">{{ currentItem.course_name }}</el-descriptions-item>
        <el-descriptions-item label="实验项目">{{ currentItem.experiment_project_name }}</el-descriptions-item>
        <el-descriptions-item label="班级">{{ currentItem.class_name }}</el-descriptions-item>
        <el-descriptions-item label="授课教师">{{ currentItem.teacher_name }}</el-descriptions-item>
        <el-descriptions-item label="计划学时">{{ currentItem.planned_hours }}</el-descriptions-item>
        <el-descriptions-item label="实际时长">{{ formatDuration(null, null, currentItem.actual_duration) }}</el-descriptions-item>
        <el-descriptions-item label="应到人数">{{ currentItem.expected_students }}</el-descriptions-item>
        <el-descriptions-item label="实到人数">{{ currentItem.actual_students }}</el-descriptions-item>
        <el-descriptions-item label="考勤记录" :span="2">{{ currentItem.attendance_record || '无' }}</el-descriptions-item>
        <el-descriptions-item label="教学情况" :span="2">{{ currentItem.teaching_record || '无' }}</el-descriptions-item>
        <el-descriptions-item label="设备情况" :span="2">{{ currentItem.equipment_record || '无' }}</el-descriptions-item>
      </el-descriptions>
      <template #footer>
        <el-button @click="detailVisible = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'
import { get, post, put, del } from '@/utils/request'

const searchForm = reactive({
  semesterId: null as number | null,
  status: 'all'
})

const semesterList = ref<any[]>([])
const experimentProjectList = ref<any[]>([])
const registrationList = ref<any[]>([])
const buildingList = ref<any[]>([])
const roomList = ref<any[]>([])

const dialogVisible = ref(false)
const dialogType = ref<'create' | 'edit'>('create')
const detailVisible = ref(false)
const currentItem = ref<any>({})
const formRef = ref<FormInstance>()

const form = reactive({
  id: null as number | null,
  semesterId: 1,
  schedulingId: null as number | null,
  reservationId: null as number | null,
  sourceType: '',
  buildingId: null as number | null,
  buildingName: '',
  roomId: null as number | null,
  roomName: '',
  roomNumber: '',
  useDate: '',
  weekNo: 1,
  courseName: '',
  experimentProjectId: null as number | null,
  experimentProjectName: '',
  experimentType: '其他',
  classId: null as number | null,
  className: '',
  teacherId: null as number | null,
  teacherName: '',
  plannedHours: 0,
  actualDuration: 2,
  expectedStudents: 0,
  actualStudents: 0,
  attendanceRecord: '无',
  teachingRecord: '正常',
  equipmentRecord: '正常',
  reportDepartment: '计算机学院',
  reportTime: '',
  reporterName: 'System Admin'
})

const rules: FormRules = {
  buildingName: [{ required: true, message: '请输入楼名', trigger: 'blur' }],
  roomNumber: [{ required: true, message: '请输入房间号', trigger: 'blur' }],
  roomName: [{ required: true, message: '请输入实验室名称', trigger: 'blur' }],
  useDate: [{ required: true, message: '请选择使用日期', trigger: 'blur' }],
  courseName: [{ required: true, message: '请输入课程名称/项目名称', trigger: 'blur' }],
  className: [{ required: true, message: '请输入班级', trigger: 'blur' }],
  plannedHours: [{ required: true, message: '请输入计划学时', trigger: 'blur' }],
  actualDuration: [{ required: true, message: '请输入实际使用时长', trigger: 'blur' }],
  expectedStudents: [{ required: true, message: '请输入应到人数', trigger: 'blur' }],
  actualStudents: [{ required: true, message: '请输入实到人数', trigger: 'blur' }],
  experimentType: [{ required: true, message: '请选择实验项目类型', trigger: 'blur' }],
  teachingRecord: [{ required: true, message: '请输入教学情况记录', trigger: 'blur' }],
  equipmentRecord: [{ required: true, message: '请输入仪器设备情况', trigger: 'blur' }]
}

async function loadSemesters() {
  try {
    const res = await get<any[]>('/semesters')
    semesterList.value = res || []
    if (semesterList.value.length > 0) {
      searchForm.semesterId = semesterList.value[0].id
      form.semesterId = semesterList.value[0].id
    }
  } catch (error) {
    console.error('加载学期列表失败:', error)
  }
}

async function loadExperimentProjects() {
  try {
    const res = await get<any[]>('/experiment-projects')
    experimentProjectList.value = res || []
  } catch (error) {
    console.error('加载实验项目列表失败:', error)
  }
}

async function loadBuildings() {
  try {
    const res = await get<any[]>('/buildings')
    buildingList.value = res || []
  } catch (error) {
    console.error('加载楼宇列表失败:', error)
  }
}

async function loadRooms(buildingId?: number) {
  try {
    const params: any = {}
    if (buildingId && buildingId > 0) params.buildingId = buildingId
    const res = await get<any[]>('/rooms', params)
    roomList.value = res || []
    console.log('加载实验室列表:', roomList.value)
  } catch (error) {
    console.error('加载实验室列表失败:', error)
  }
}

onMounted(async () => {
  await loadSemesters()
  await loadExperimentProjects()
  await loadBuildings()
  await loadRooms()
  await loadRegistrations()
})

async function loadRegistrations() {
  try {
    const params: any = {
      semesterId: searchForm.semesterId
    }
    if (searchForm.status !== 'all') params.status = searchForm.status

    const res = await get<any[]>('/usage-registration', params)
    registrationList.value = res || []
  } catch (error) {
    console.error('加载使用登记列表失败:', error)
    ElMessage.error('加载使用登记列表失败')
  }
}

function handleSearch() {
  loadRegistrations()
}

function handleReset() {
  searchForm.status = 'all'
  loadRegistrations()
}

function handleCreate() {
  dialogType.value = 'create'
  resetForm()
  form.reportTime = new Date().toLocaleString('zh-CN')
  form.attendanceRecord = '无'
  form.teachingRecord = '正常'
  form.equipmentRecord = '正常'
  form.experimentType = '其他'
  dialogVisible.value = true
}

function handleExperimentProjectChange() {
  const project = experimentProjectList.value.find(p => p.id === form.experimentProjectId)
  if (project) {
    form.experimentProjectName = project.project_name
    form.experimentType = project.experiment_type || '其他'
  } else {
    form.experimentProjectName = ''
    form.experimentType = '其他'
  }
}

function handleBuildingChange() {
  const building = buildingList.value.find(b => b.BuildingID === form.buildingId)
  if (building) {
    form.buildingName = building.BuildingName
  } else {
    form.buildingName = ''
  }
  form.roomId = null
  form.roomName = ''
  form.roomNumber = ''
  if (form.buildingId) {
    loadRooms(form.buildingId)
  } else {
    roomList.value = []
  }
}

function handleRoomChange() {
  const room = roomList.value.find(r => r.RoomID === form.roomId)
  if (room) {
    form.roomName = room.RoomName
    form.roomNumber = room.RoomNumber
  } else {
    form.roomName = ''
    form.roomNumber = ''
  }
}

function handleEdit(row: any) {
  dialogType.value = 'edit'
  Object.assign(form, {
    id: row.id,
    schedulingId: row.scheduling_id,
    reservationId: row.reservation_id,
    sourceType: row.source_type,
    buildingId: row.building_id,
    buildingName: row.building_name,
    roomId: row.room_id,
    roomName: row.room_name,
    roomNumber: row.room_number,
    useDate: row.use_date,
    weekNo: row.week_no,
    courseName: row.course_name,
    experimentProjectId: row.experiment_project_id,
    experimentProjectName: row.experiment_project_name,
    experimentType: row.experiment_type || '其他',
    classId: row.class_id,
    className: row.class_name,
    teacherId: row.teacher_id,
    teacherName: row.teacher_name,
    plannedHours: row.planned_hours || 0,
    actualDuration: row.actual_duration || 2,
    expectedStudents: row.expected_students || 0,
    actualStudents: row.actual_students || 0,
    attendanceRecord: row.attendance_record || '无',
    teachingRecord: row.teaching_record || '正常',
    equipmentRecord: row.equipment_record || '正常',
    reportDepartment: row.report_department || '计算机学院',
    reportTime: row.report_time ? new Date(row.report_time).toLocaleString('zh-CN') : new Date().toLocaleString('zh-CN'),
    reporterName: row.reporter_name || 'System Admin'
  })
  dialogVisible.value = true
}

function handleView(row: any) {
  currentItem.value = row
  detailVisible.value = true
}

async function handleDelete(row: any) {
  try {
    await ElMessageBox.confirm(
      '确定要删除这条使用登记记录吗？',
      '删除确认',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    await del(`/usage-registration/${row.id}`)
    ElMessage.success('删除成功')
    await handleSearch()
  } catch (error: any) {
    if (error !== 'cancel') {
      console.error('删除失败:', error)
      ElMessage.error('删除失败: ' + (error.message || error))
    }
  }
}

async function handleSubmit() {
  if (!formRef.value) return

  try {
    await formRef.value.validate()

    if (!form.buildingId) {
      ElMessage.error('请选择楼宇')
      return
    }

    if (!form.roomId) {
      ElMessage.error('请选择实验室')
      return
    }

    if (!form.useDate) {
      ElMessage.error('请选择使用日期')
      return
    }

    if (!form.courseName) {
      ElMessage.error('请输入课程名称/项目名称')
      return
    }

    if (!form.className) {
      ElMessage.error('请输入班级')
      return
    }

    const building = buildingList.value.find(b => b.BuildingID === form.buildingId)
    if (building) {
      form.buildingName = building.BuildingName
    }

    const room = roomList.value.find(r => r.RoomID === form.roomId)
    if (room) {
      form.roomName = room.RoomName
      form.roomNumber = room.RoomNumber
    }

    const project = experimentProjectList.value.find(p => p.id === form.experimentProjectId)
    if (project) {
      form.experimentProjectName = project.project_name
      form.experimentType = project.experiment_type || '其他'
    }

    if (form.useDate && typeof form.useDate === 'string') {
      form.useDate = form.useDate.includes('T') ? form.useDate.split('T')[0] : form.useDate
    }

    console.log('提交的数据:', JSON.stringify(form, null, 2))

    if (dialogType.value === 'create') {
      const response = await post('/usage-registration', form)
      console.log('创建成功响应:', response)
      ElMessage.success('创建成功')
    } else {
      const response = await put(`/usage-registration/${form.id}`, form)
      console.log('更新成功响应:', response)
      ElMessage.success('更新成功')
    }

    dialogVisible.value = false
    loadRegistrations()
  } catch (error: any) {
    console.error('提交失败:', error)
    if (error.response) {
      console.error('响应数据:', error.response.data)
      ElMessage.error('创建失败: ' + (error.response.data.message || error.response.data))
    } else if (error.message) {
      ElMessage.error('创建失败: ' + error.message)
    } else {
      ElMessage.error(dialogType.value === 'create' ? '创建失败' : '更新失败')
    }
  }
}

function handleDialogClose() {
  formRef.value?.resetFields()
  resetForm()
}

function resetForm() {
  form.id = null
  form.schedulingId = null
  form.reservationId = null
  form.sourceType = ''
  form.buildingId = null
  form.buildingName = ''
  form.roomId = null
  form.roomName = ''
  form.roomNumber = ''
  form.useDate = ''
  form.weekNo = 1
  form.courseName = ''
  form.experimentProjectId = null
  form.experimentProjectName = ''
  form.experimentType = ''
  form.classId = null
  form.className = ''
  form.teacherId = null
  form.teacherName = ''
  form.plannedHours = 0
  form.actualDuration = 2
  form.expectedStudents = 0
  form.actualStudents = 0
  form.attendanceRecord = '无'
  form.teachingRecord = '正常'
  form.equipmentRecord = '正常'
}

function formatDate(_row: any, _column: any, cellValue: string) {
  return cellValue ? cellValue.split('T')[0] : ''
}

function formatDuration(_row: any, _column: any, cellValue: number) {
  return cellValue ? `${cellValue} 小时` : '0 小时'
}

function formatRegistrationStatus(_row: any, _column: any, cellValue: string) {
  const statusMap: Record<string, string> = {
    pending: '待登记',
    registered: '已登记',
    overdue: '逾期未登记'
  }
  return statusMap[cellValue] || cellValue
}
</script>

<style scoped>
.usage-registration-container {
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.search-form {
  margin-bottom: 20px;
}
</style>
