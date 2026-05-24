<template>
  <div class="teaching-request-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>授课申请</span>
          <el-button type="primary" @click="handleCreate">申请实验室授课</el-button>
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
        <el-form-item label="审批状态">
          <el-select v-model="searchForm.status" placeholder="请选择" @change="handleSearch" style="width: 150px;">
            <el-option label="全部" value="all" />
            <el-option label="待审批" value="pending" />
            <el-option label="已通过" value="approved" />
            <el-option label="已驳回" value="rejected" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">查询</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>

      <el-table :data="requestList" border stripe>
        <el-table-column type="index" label="序号" width="60" />
        <el-table-column prop="request_code" label="申请编号" width="120" />
        <el-table-column prop="course_name" label="课程名称" min-width="150" />
        <el-table-column prop="major_name" label="专业" width="150" />
        <el-table-column prop="grade" label="年级" width="80" />
        <el-table-column prop="class_name" label="班级" width="150" />
        <el-table-column prop="applicant_name" label="申请人" width="100" />
        <el-table-column prop="week_no" label="周次" width="120" />
        <el-table-column prop="week_day" label="星期" width="80" :formatter="formatWeekDay" />
        <el-table-column prop="time_slot" label="节次" width="100" />
        <el-table-column prop="approval_status" label="审批状态" width="100" :formatter="formatApprovalStatus" />
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="handleView(row)">查看</el-button>
            <el-button v-if="row.approval_status === 'pending'" link type="success" @click="handleApprove(row)">审批</el-button>
            <el-button v-if="row.approval_status === 'approved' && !row.scheduling_created" link type="warning" @click="handleSchedule(row)">去排课</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 新建申请弹窗 -->
    <el-dialog v-model="dialogVisible" title="申请实验室授课" width="800px" @close="handleDialogClose">
      <el-form :model="form" :rules="rules" ref="formRef" label-width="120px">
        <el-form-item label="学期" prop="semesterId">
          <el-select v-model="form.semesterId" placeholder="请选择学期">
            <el-option
              v-for="semester in semesterList"
              :key="semester.id"
              :label="semester.name"
              :value="semester.id"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="教学任务" prop="teachingTaskId">
          <el-select v-model="form.teachingTaskId" placeholder="请选择教学任务" @change="handleTaskChange">
            <el-option
              v-for="task in taskList"
              :key="task.id"
              :label="`${task.course_name} - ${task.class_name}`"
              :value="task.id"
            />
          </el-select>
        </el-form-item>

        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="上课课程">
              <el-input v-model="form.courseName" readonly />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="专业">
              <el-input v-model="form.majorName" readonly />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="年级">
              <el-input v-model="form.grade" readonly />
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="班级">
          <el-input v-model="form.className" readonly />
        </el-form-item>

        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="星期" prop="weekDay">
              <el-select v-model="form.weekDay" placeholder="请选择">
                <el-option label="周一" :value="1" />
                <el-option label="周二" :value="2" />
                <el-option label="周三" :value="3" />
                <el-option label="周四" :value="4" />
                <el-option label="周五" :value="5" />
                <el-option label="周六" :value="6" />
                <el-option label="周日" :value="7" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="节次" prop="timeSlot">
              <el-select v-model="form.timeSlot" placeholder="请选择节次">
                <el-option label="第1-2节" value="1-2" />
                <el-option label="第3-4节" value="3-4" />
                <el-option label="第5-6节" value="5-6" />
                <el-option label="第7-8节" value="7-8" />
                <el-option label="第9-10节" value="9-10" />
                <el-option label="第11-12节" value="11-12" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="上课周次" prop="weekNo">
              <el-input-number v-model="form.weekNo" :min="1" :max="20" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="期望楼宇">
              <el-select v-model="form.expectedBuildingId" placeholder="请选择" clearable @change="handleBuildingChange">
                <el-option
                  v-for="building in buildingList"
                  :key="building.id"
                  :label="building.name"
                  :value="building.id"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="期望实验室">
              <el-select v-model="form.expectedRoomId" placeholder="请选择" clearable>
                <el-option
                  v-for="room in filteredRoomList"
                  :key="room.id"
                  :label="`${room.name} (${room.room_number})`"
                  :value="room.id"
                />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="备注">
          <el-input v-model="form.remarks" type="textarea" :rows="3" placeholder="其他特殊需求说明" />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit">提交申请</el-button>
      </template>
    </el-dialog>

    <!-- 审批弹窗 -->
    <el-dialog v-model="approveDialogVisible" title="审批授课申请" width="700px">
      <el-form :model="approveForm" ref="approveFormRef" label-width="120px">
        <el-form-item label="审批结果">
          <el-radio-group v-model="approveForm.approvalStatus">
            <el-radio label="approved">通过</el-radio>
            <el-radio label="rejected">驳回</el-radio>
          </el-radio-group>
        </el-form-item>

        <template v-if="approveForm.approvalStatus === 'approved'">
          <el-divider content-position="left">分配实验室</el-divider>
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="分配的楼宇">
                <el-select v-model="approveForm.assignedBuildingId" placeholder="请选择" @change="handleApproveBuildingChange">
                  <el-option
                    v-for="building in buildingList"
                    :key="building.id"
                    :label="building.name"
                    :value="building.id"
                  />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="分配的房间">
                <el-select v-model="approveForm.assignedRoomId" placeholder="请选择">
                  <el-option
                    v-for="room in filteredApproveRoomList"
                    :key="room.id"
                    :label="`${room.name} (${room.room_number})`"
                    :value="room.id"
                  />
                </el-select>
              </el-form-item>
            </el-col>
          </el-row>
        </template>

        <el-form-item label="审批意见">
          <el-input v-model="approveForm.approvalComment" type="textarea" :rows="4" placeholder="请输入审批意见" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="approveDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleApproveSubmit">确定</el-button>
      </template>
    </el-dialog>

    <!-- 查看详情弹窗 -->
    <el-dialog v-model="detailVisible" title="申请详情" width="800px">
      <el-descriptions :column="2" border>
        <el-descriptions-item label="申请编号">{{ currentItem.request_code }}</el-descriptions-item>
        <el-descriptions-item label="审批状态">{{ formatApprovalStatus(null, null, currentItem.approval_status) }}</el-descriptions-item>
        <el-descriptions-item label="课程名称">{{ currentItem.course_name }}</el-descriptions-item>
        <el-descriptions-item label="专业">{{ currentItem.major_name }}</el-descriptions-item>
        <el-descriptions-item label="年级">{{ currentItem.grade }}</el-descriptions-item>
        <el-descriptions-item label="班级">{{ currentItem.class_name }}</el-descriptions-item>
        <el-descriptions-item label="申请人">{{ currentItem.applicant_name }}</el-descriptions-item>
        <el-descriptions-item label="周次">{{ currentItem.week_no }}</el-descriptions-item>
        <el-descriptions-item label="星期">{{ formatWeekDay(null, null, currentItem.week_day) }}</el-descriptions-item>
        <el-descriptions-item label="节次">{{ currentItem.time_slot }}</el-descriptions-item>
        <el-descriptions-item label="期望实验室" :span="2">{{ currentItem.expected_building_name }} {{ currentItem.expected_room_name }}</el-descriptions-item>
        <el-descriptions-item label="分配实验室" :span="2">{{ currentItem.assigned_building_name }} {{ currentItem.assigned_room_name }}</el-descriptions-item>
        <el-descriptions-item label="审批意见" :span="2">{{ currentItem.approval_comment || '无' }}</el-descriptions-item>
      </el-descriptions>
      <template #footer>
        <el-button @click="detailVisible = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { get, post, put } from '@/utils/request'

const router = useRouter()

const searchForm = reactive({
  semesterId: 1,
  status: 'all'
})

const semesterList = ref<any[]>([])
const taskList = ref<any[]>([])
const buildingList = ref<any[]>([])
const roomList = ref<any[]>([])
const requestList = ref<any[]>([])

const dialogVisible = ref(false)
const approveDialogVisible = ref(false)
const detailVisible = ref(false)
const currentItem = ref<any>({})
const formRef = ref<FormInstance>()
const approveFormRef = ref<FormInstance>()

const form = reactive({
  semesterId: 1,
  teachingTaskId: null as number | null,
  courseId: null as number | null,
  courseName: '',
  majorId: null as number | null,
  majorName: '',
  grade: '',
  classId: null as number | null,
  className: '',
  weekNo: 1,
  weekDay: 1,
  timeSlot: '1-2',
  expectedBuildingId: null as number | null,
  expectedBuildingName: '',
  expectedRoomId: null as number | null,
  expectedRoomName: '',
  remarks: ''
})

const approveForm = reactive({
  approvalStatus: 'approved',
  approvalComment: '',
  assignedBuildingId: null as number | null,
  assignedBuildingName: '',
  assignedRoomId: null as number | null,
  assignedRoomName: '',
  assignedRoomNumber: ''
})

const rules: FormRules = {
  semesterId: [{ required: true, message: '请选择学期', trigger: 'change' }],
  teachingTaskId: [{ required: true, message: '请选择教学任务', trigger: 'change' }],
  weekDay: [{ required: true, message: '请选择星期', trigger: 'change' }],
  timeSlot: [{ required: true, message: '请选择节次', trigger: 'change' }],
  weekNo: [{ required: true, message: '请输入上课周次', trigger: 'blur' }]
}

const filteredRoomList = computed(() => {
  if (!form.expectedBuildingId) return roomList.value
  return roomList.value.filter(room => room.building_id === form.expectedBuildingId)
})

const filteredApproveRoomList = computed(() => {
  if (!approveForm.assignedBuildingId) return roomList.value
  return roomList.value.filter(room => room.building_id === approveForm.assignedBuildingId)
})

onMounted(async () => {
  await loadSemesters()
  await loadTasks()
  await loadBuildings()
  await loadRooms()
  await loadRequests()
})

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

async function loadTasks() {
  try {
    const res = await get<any[]>('/teaching-tasks')
    taskList.value = (res || []).map((item: any) => ({
      id: item.TaskID || item.id,
      course_id: item.CourseID || item.course_id,
      course_name: item.CourseName || item.course_name || '',
      class_id: item.ClassID || item.class_id,
      class_name: item.ClassName || item.class_name || '',
      major_id: item.MajorID || item.major_id,
      major_name: item.MajorName || item.major_name || '',
      grade: item.Grade || item.grade || item.grade_name || '',
      teacher_id: item.TeacherID || item.teacher_id,
      teacher_name: item.TeacherName || item.teacher_name || ''
    }))
  } catch (error) {
    console.error('加载教学任务列表失败:', error)
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

async function loadRooms() {
  try {
    const res = await get<any[]>('/rooms')
    roomList.value = (res || []).filter((r: any) => r.room_type?.includes('实验室') || r.RoomType?.includes('lab'))
  } catch (error) {
    console.error('加载实验室列表失败:', error)
  }
}

async function loadRequests() {
  try {
    const params: any = {
      semesterId: searchForm.semesterId
    }
    if (searchForm.status !== 'all') params.status = searchForm.status

    const res = await get<any[]>('/teaching-request', params)
    requestList.value = res || []
  } catch (error) {
    console.error('加载授课申请列表失败:', error)
    ElMessage.error('加载授课申请列表失败')
  }
}

function handleSearch() {
  loadRequests()
}

function handleReset() {
  searchForm.status = 'all'
  loadRequests()
}

function handleTaskChange(taskId: number) {
  const task = taskList.value.find(t => t.id === taskId)
  if (task) {
    form.courseId = task.course_id
    form.courseName = task.course_name
    form.majorId = task.major_id
    form.majorName = task.major_name
    form.grade = task.grade || task.grade_name || ''
    form.classId = task.class_id
    form.className = task.class_name
  }
}

function handleBuildingChange() {
  form.expectedRoomId = null
}

function handleApproveBuildingChange() {
  approveForm.assignedRoomId = null
}

function handleCreate() {
  resetForm()
  dialogVisible.value = true
}

function handleView(row: any) {
  currentItem.value = row
  detailVisible.value = true
}

function handleApprove(row: any) {
  currentItem.value = row
  approveForm.approvalStatus = 'approved'
  approveForm.approvalComment = ''
  approveForm.assignedBuildingId = null
  approveForm.assignedBuildingName = ''
  approveForm.assignedRoomId = null
  approveForm.assignedRoomName = ''
  approveForm.assignedRoomNumber = ''
  approveDialogVisible.value = true
}

function handleSchedule(row: any) {
  router.push({ path: '/scheduling/central', query: { teachingRequestId: row.id } })
}

async function handleApproveSubmit() {
  try {
    if (approveForm.approvalStatus === 'approved') {
      const building = buildingList.value.find(b => b.id === approveForm.assignedBuildingId)
      const room = roomList.value.find(r => r.id === approveForm.assignedRoomId)
      if (building) approveForm.assignedBuildingName = building.name
      if (room) {
        approveForm.assignedRoomName = room.name
        approveForm.assignedRoomNumber = room.room_number
      }
    }

    await put(`/teaching-request/${currentItem.value.id}/approve`, approveForm)
    ElMessage.success('审批成功')
    approveDialogVisible.value = false
    loadRequests()
  } catch (error) {
    ElMessage.error('审批失败')
  }
}

async function handleSubmit() {
  if (!formRef.value) return

  try {
    await formRef.value.validate()

    const expectedBuilding = buildingList.value.find(b => b.id === form.expectedBuildingId)
    const expectedRoom = roomList.value.find(r => r.id === form.expectedRoomId)
    if (expectedBuilding) form.expectedBuildingName = expectedBuilding.name
    if (expectedRoom) form.expectedRoomName = expectedRoom.name

    await post('/teaching-request', form)
    ElMessage.success('授课申请提交成功')
    dialogVisible.value = false
    loadRequests()
  } catch (error: any) {
    if (error !== false) {
      ElMessage.error('提交失败')
    }
  }
}

function handleDialogClose() {
  formRef.value?.resetFields()
  resetForm()
}

function resetForm() {
  form.teachingTaskId = null
  form.courseId = null
  form.courseName = ''
  form.majorId = null
  form.majorName = ''
  form.grade = ''
  form.classId = null
  form.className = ''
  form.weekNo = 1
  form.weekDay = 1
  form.timeSlot = '1-2'
  form.expectedBuildingId = null
  form.expectedBuildingName = ''
  form.expectedRoomId = null
  form.expectedRoomName = ''
  form.remarks = ''
}

function formatWeekDay(_row: any, _column: any, cellValue: number) {
  const dayMap: Record<number, string> = {
    1: '周一',
    2: '周二',
    3: '周三',
    4: '周四',
    5: '周五',
    6: '周六',
    7: '周日'
  }
  return dayMap[cellValue] || ''
}

function formatApprovalStatus(_row: any, _column: any, cellValue: string) {
  const statusMap: Record<string, string> = {
    pending: '待审批',
    approved: '已通过',
    rejected: '已驳回'
  }
  return statusMap[cellValue] || cellValue
}
</script>

<style scoped>
.teaching-request-container {
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