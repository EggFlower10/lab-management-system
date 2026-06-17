<template>
  <div class="reservation-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>预约申请</span>
          <el-button type="primary" @click="handleCreate">新建预约</el-button>
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
            <el-option label="已取消" value="cancelled" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">查询</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>

      <el-table :data="reservationList" border stripe>
        <el-table-column type="index" label="序号" width="60" />
        <el-table-column prop="reservation_code" label="预约编号" width="120" />
        <el-table-column prop="building_name" label="楼宇" width="100" />
        <el-table-column prop="room_name" label="实验室" width="150" />
        <el-table-column prop="project_name" label="项目名称" min-width="150" />
        <el-table-column prop="project_category" label="项目类别" width="120" />
        <el-table-column prop="applicant_name" label="申请人" width="100" />
        <el-table-column prop="use_date" label="使用日期" width="120" :formatter="formatDate" />
        <el-table-column prop="week_no" label="周次" width="80" />
        <el-table-column prop="week_day" label="星期" width="80" :formatter="formatWeekDay" />
        <el-table-column prop="time_slot" label="节次" width="100" />
        <el-table-column prop="approval_status" label="审批状态" width="100" :formatter="formatApprovalStatus" />
        <el-table-column label="操作" width="250" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="handleView(row)">查看</el-button>
            <el-button v-if="row.approval_status === 'pending'" link type="success" @click="handleApprove(row)">审批</el-button>
            <el-button v-if="row.approval_status === 'pending'" link type="warning" @click="handleCancel(row)">取消</el-button>
            <el-button v-if="row.approval_status === 'approved'" link type="danger" @click="handleAdminCancel(row)">管理员取消</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 新建预约弹窗 -->
    <el-dialog v-model="dialogVisible" title="新建预约申请" width="1000px" @close="handleDialogClose">
      <el-form :model="form" :rules="rules" ref="formRef" label-width="140px">
        <el-divider content-position="left">选择实验室</el-divider>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="楼宇" prop="buildingId">
              <el-select v-model="form.buildingId" placeholder="请选择楼宇" @change="handleBuildingChange">
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
            <el-form-item label="实验室" prop="roomId">
              <el-select v-model="form.roomId" placeholder="请选择实验室" @change="handleRoomChange">
                <el-option
                  v-for="room in filteredRoomList"
                  :key="room.id"
                  :label="`${room.name} (${room.room_number}) - 可容纳${room.seat_count}人`"
                  :value="room.id"
                />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-divider content-position="left">查看排课情况</el-divider>
        <div v-if="selectedRoomSchedule.length > 0">
          <el-table :data="selectedRoomSchedule" border>
            <el-table-column prop="week_day" label="星期" width="80" :formatter="formatWeekDay" />
            <el-table-column prop="time_slot" label="节次" width="100" />
            <el-table-column prop="course_name" label="课程名称" width="150" />
            <el-table-column prop="class_name" label="班级" width="120" />
            <el-table-column prop="teacher_name" label="教师" width="100" />
            <el-table-column prop="week_no" label="周次" width="80" />
          </el-table>
        </div>
        <div v-else class="empty-hint">
          <span v-if="form.roomId">该实验室暂无排课记录</span>
          <span v-else>请先选择实验室查看排课情况</span>
        </div>

        <el-divider content-position="left">选择使用时段</el-divider>
        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="使用日期" prop="useDate">
              <el-date-picker 
                v-model="form.useDate" 
                type="date" 
                placeholder="请选择日期" 
                value-format="YYYY-MM-DD"
                @change="handleDateChange"
              />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="教学周" prop="weekNo">
              <el-select v-model="form.weekNo" placeholder="请选择周次">
                <el-option v-for="w in 20" :key="w" :label="`第${w}周`" :value="w" />
              </el-select>
            </el-form-item>
          </el-col>
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
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="选择节次" prop="timeSlots">
              <el-select 
                v-model="form.timeSlots" 
                multiple 
                placeholder="请选择节次（可多选）"
                style="width: 100%;"
              >
                <el-option label="第1-2节" value="1-2" />
                <el-option label="第3-4节" value="3-4" />
                <el-option label="第5-6节" value="5-6" />
                <el-option label="第7-8节" value="7-8" />
                <el-option label="第9-10节" value="9-10" />
                <el-option label="第11-12节" value="11-12" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="重复规则">
              <el-select v-model="form.repeatRule" placeholder="请选择重复规则">
                <el-option label="不重复（单次）" value="single" />
                <el-option label="每周重复" value="weekly" />
                <el-option label="单周重复" value="odd" />
                <el-option label="双周重复" value="even" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row v-if="form.repeatRule !== 'single'" :gutter="20">
          <el-col :span="8">
            <el-form-item label="起始周">
              <el-select v-model="form.repeatStartWeek" placeholder="请选择起始周">
                <el-option v-for="w in 20" :key="w" :label="`第${w}周`" :value="w" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="结束周">
              <el-select v-model="form.repeatEndWeek" placeholder="请选择结束周">
                <el-option v-for="w in 20" :key="w" :label="`第${w}周`" :value="w" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-divider content-position="left">预约信息</el-divider>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="实验室名称">
              <el-input v-model="form.roomName" disabled />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="楼名">
              <el-input v-model="form.buildingName" disabled />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="房间号">
              <el-input v-model="form.roomNumber" disabled />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="申请时间">
              <el-input v-model="form.applyDate" disabled />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="开展项目名称" prop="projectName">
              <el-input v-model="form.projectName" placeholder="请输入项目名称" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="项目类别" prop="projectCategory">
              <el-select v-model="form.projectCategory" placeholder="请选择项目类别">
                <el-option label="课程教学项目" value="课程教学项目" />
                <el-option label="教师教科研项目" value="教师教科研项目" />
                <el-option label="学生科研项目" value="学生科研项目" />
                <el-option label="创新创业项目" value="创新创业项目" />
                <el-option label="毕业设计论文" value="毕业设计论文" />
                <el-option label="学生活动项目" value="学生活动项目" />
                <el-option label="单位活动" value="单位活动" />
                <el-option label="其他" value="其他" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-divider content-position="left">申请人信息</el-divider>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="申请人">
              <el-input v-model="form.applicantName" disabled />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="申请人联系电话" prop="applicantPhone">
              <el-input v-model="form.applicantPhone" placeholder="请输入联系电话" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="项目负责人" prop="projectLeader">
              <el-input v-model="form.projectLeader" placeholder="请输入项目负责人" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="项目负责人电话" prop="projectLeaderPhone">
              <el-input v-model="form.projectLeaderPhone" placeholder="请输入项目负责人电话" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-divider content-position="left">参与成员信息</el-divider>
        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="年级" prop="memberGrade">
              <el-input v-model="form.memberGrade" placeholder="如：2021" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="班级" prop="memberClass">
              <el-input v-model="form.memberClass" placeholder="请输入班级" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="人数" prop="memberCount">
              <el-input-number v-model="form.memberCount" :min="1" :max="200" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-divider content-position="left">使用信息</el-divider>
        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="预计使用时长" prop="expectedDuration">
              <el-input-number v-model="form.expectedDuration" :min="0.5" :max="12" :step="0.5" />
              <span style="margin-left: 10px">小时</span>
            </el-form-item>
          </el-col>
          <el-col :span="16">
            <el-form-item label="备注">
              <el-input v-model="form.remarks" type="textarea" :rows="3" placeholder="请输入备注信息" />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>

      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit">提交申请</el-button>
      </template>
    </el-dialog>

    <!-- 审批弹窗 -->
    <el-dialog v-model="approveDialogVisible" title="审批预约申请" width="600px">
      <el-form :model="approveForm" ref="approveFormRef" label-width="100px">
        <el-form-item label="审批结果">
          <el-radio-group v-model="approveForm.approvalStatus">
            <el-radio label="approved">通过</el-radio>
            <el-radio label="rejected">驳回</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="审批意见">
          <el-input v-model="approveForm.approvalComment" type="textarea" :rows="4" placeholder="请输入审批意见（选填）" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="approveDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleApproveSubmit">确定</el-button>
      </template>
    </el-dialog>

    <!-- 管理员取消弹窗 -->
    <el-dialog v-model="adminCancelDialogVisible" title="管理员取消预约" width="600px">
      <el-form :model="adminCancelForm" ref="adminCancelFormRef" label-width="100px">
        <el-form-item label="取消原因" prop="cancelReason">
          <el-input v-model="adminCancelForm.cancelReason" type="textarea" :rows="4" placeholder="请输入取消原因" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="adminCancelDialogVisible = false">取消</el-button>
        <el-button type="danger" @click="handleAdminCancelSubmit">确定取消</el-button>
      </template>
    </el-dialog>

    <!-- 查看详情弹窗 -->
    <el-dialog v-model="detailVisible" title="预约详情" width="800px">
      <el-descriptions :column="2" border>
        <el-descriptions-item label="预约编号">{{ currentItem.reservation_code }}</el-descriptions-item>
        <el-descriptions-item label="审批状态">{{ formatApprovalStatus(null, null, currentItem.approval_status) }}</el-descriptions-item>
        <el-descriptions-item label="楼宇">{{ currentItem.building_name }}</el-descriptions-item>
        <el-descriptions-item label="实验室">{{ currentItem.room_name }} ({{ currentItem.room_number }})</el-descriptions-item>
        <el-descriptions-item label="项目名称">{{ currentItem.project_name }}</el-descriptions-item>
        <el-descriptions-item label="项目类别">{{ currentItem.project_category }}</el-descriptions-item>
        <el-descriptions-item label="申请人">{{ currentItem.applicant_name }}</el-descriptions-item>
        <el-descriptions-item label="联系电话">{{ currentItem.applicant_phone }}</el-descriptions-item>
        <el-descriptions-item label="项目负责人">{{ currentItem.project_leader }}</el-descriptions-item>
        <el-descriptions-item label="负责人电话">{{ currentItem.project_leader_phone }}</el-descriptions-item>
        <el-descriptions-item label="参与年级">{{ currentItem.member_grade }}</el-descriptions-item>
        <el-descriptions-item label="参与班级">{{ currentItem.member_class }}</el-descriptions-item>
        <el-descriptions-item label="参与人数">{{ currentItem.member_count }}人</el-descriptions-item>
        <el-descriptions-item label="使用日期">{{ formatDate(null, null, currentItem.use_date) }}</el-descriptions-item>
        <el-descriptions-item label="周次">{{ currentItem.week_no }}</el-descriptions-item>
        <el-descriptions-item label="星期">{{ formatWeekDay(null, null, currentItem.week_day) }}</el-descriptions-item>
        <el-descriptions-item label="节次">{{ currentItem.time_slot }}</el-descriptions-item>
        <el-descriptions-item label="预计时长">{{ currentItem.expected_duration }}小时</el-descriptions-item>
        <el-descriptions-item label="审批意见" :span="2">{{ currentItem.approval_comment || '无' }}</el-descriptions-item>
        <el-descriptions-item label="取消原因" :span="2">{{ currentItem.cancel_reason || '无' }}</el-descriptions-item>
      </el-descriptions>
      <template #footer>
        <el-button @click="detailVisible = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'
import { get, post, put } from '@/utils/request'

const searchForm = reactive({
  semesterId: 1,
  status: 'all'
})

const semesterList = ref<any[]>([])
const buildingList = ref<any[]>([])
const roomList = ref<any[]>([])
const reservationList = ref<any[]>([])
const selectedRoomSchedule = ref<any[]>([])

const dialogVisible = ref(false)
const approveDialogVisible = ref(false)
const adminCancelDialogVisible = ref(false)
const detailVisible = ref(false)
const currentItem = ref<any>({})
const formRef = ref<FormInstance>()
const approveFormRef = ref<FormInstance>()
const adminCancelFormRef = ref<FormInstance>()

const form = reactive({
  semesterId: 1,
  buildingId: null as number | null,
  buildingName: '',
  roomId: null as number | null,
  roomName: '',
  roomNumber: '',
  useDate: '',
  weekNo: 1,
  weekDay: 1,
  timeSlots: [] as string[],
  repeatRule: 'single',
  repeatStartWeek: 1,
  repeatEndWeek: 1,
  projectName: '',
  projectCategory: '',
  applicantId: 1,
  applicantName: 'System Admin',
  applicantPhone: '',
  projectLeader: '',
  projectLeaderPhone: '',
  memberGrade: '',
  memberClass: '',
  memberCount: 0,
  expectedDuration: 2,
  applyDate: new Date().toISOString().split('T')[0],
  remarks: ''
})

const approveForm = reactive({
  approvalStatus: 'approved',
  approvalComment: ''
})

const adminCancelForm = reactive({
  cancelReason: ''
})

const rules: FormRules = {
  buildingId: [{ required: true, message: '请选择楼宇', trigger: 'change' }],
  roomId: [{ required: true, message: '请选择实验室', trigger: 'change' }],
  useDate: [{ required: true, message: '请选择使用日期', trigger: 'change' }],
  weekNo: [{ required: true, message: '请选择教学周', trigger: 'change' }],
  weekDay: [{ required: true, message: '请选择星期', trigger: 'change' }],
  timeSlots: [{ required: true, message: '请选择节次', trigger: 'change' }],
  projectName: [{ required: true, message: '请输入项目名称', trigger: 'blur' }],
  projectCategory: [{ required: true, message: '请选择项目类别', trigger: 'change' }],
  applicantPhone: [{ required: true, message: '请输入联系电话', trigger: 'blur' }],
  projectLeader: [{ required: true, message: '请输入项目负责人', trigger: 'blur' }],
  projectLeaderPhone: [{ required: true, message: '请输入项目负责人电话', trigger: 'blur' }],
  memberGrade: [{ required: true, message: '请输入年级', trigger: 'blur' }],
  memberClass: [{ required: true, message: '请输入班级', trigger: 'blur' }],
  memberCount: [{ required: true, message: '请输入人数', trigger: 'blur' }],
  expectedDuration: [{ required: true, message: '请输入预计使用时长', trigger: 'blur' }]
}

const filteredRoomList = computed(() => {
  if (!form.buildingId) return roomList.value
  return roomList.value.filter(room => Number(room.building_id) === Number(form.buildingId))
})

onMounted(async () => {
  await loadSemesters()
  await loadBuildings()
  await loadRooms()
  await loadReservations()
})

async function loadSemesters() {
  try {
    const res = await get<any[]>('/semesters')
    semesterList.value = (res || []).map((item: any) => ({
      id: item.id,
      name: item.name || item.SemesterName
    }))
    if (semesterList.value.length > 0) {
      searchForm.semesterId = semesterList.value[0].id
      form.semesterId = semesterList.value[0].id
    }
  } catch (error) {
    console.error('加载学期列表失败:', error)
  }
}

async function loadBuildings() {
  try {
    const res = await get<any[]>('/buildings')
    console.log('Buildings API response:', res)
    buildingList.value = (res || []).map((item: any) => ({
      id: item.BuildingID || item.id,
      name: item.BuildingName || item.name
    }))
    console.log('Buildings:', buildingList.value)
  } catch (error) {
    console.error('加载楼宇列表失败:', error)
  }
}

async function loadRooms() {
  try {
    const res = await get<any[]>('/rooms')
    console.log('Rooms API response:', res)
    roomList.value = (res || []).map((item: any) => ({
      id: item.RoomID || item.id,
      name: item.RoomName || item.name,
      room_number: item.RoomNumber || item.room_number,
      seat_count: item.SeatCount || item.seat_count || 0,
      building_id: item.BuildingID || item.building_id,
      building_name: item.BuildingName || item.building_name || '',
      room_type: item.RoomType || item.room_type
    }))
    console.log('Filtered rooms:', roomList.value)
  } catch (error) {
    console.error('加载实验室列表失败:', error)
  }
}

async function loadReservations() {
  try {
    const params: any = {
      semesterId: searchForm.semesterId
    }
    if (searchForm.status !== 'all') params.status = searchForm.status

    const res = await get<any[]>('/reservation', params)
    reservationList.value = res || []
  } catch (error) {
    console.error('加载预约列表失败:', error)
    ElMessage.error('加载预约列表失败')
  }
}

async function loadRoomSchedule(roomId: number) {
  try {
    const res = await get<any[]>('/scheduling', {
      roomId,
      semesterId: form.semesterId
    })
    selectedRoomSchedule.value = res || []
  } catch (error) {
    console.error('加载实验室排课失败:', error)
  }
}

function handleSearch() {
  loadReservations()
}

function handleReset() {
  searchForm.status = 'all'
  loadReservations()
}

function handleBuildingChange() {
  const building = buildingList.value.find(b => b.id === form.buildingId)
  if (building) {
    form.buildingName = building.name
  }
  form.roomId = null
  form.roomName = ''
  form.roomNumber = ''
  selectedRoomSchedule.value = []
}

function handleRoomChange() {
  const room = roomList.value.find(r => r.id === form.roomId)
  if (room) {
    form.roomName = room.name
    form.roomNumber = room.room_number || ''
    loadRoomSchedule(form.roomId!)
  }
}

function handleDateChange() {
  if (form.useDate) {
    const date = new Date(form.useDate)
    form.weekDay = date.getDay() || 7
    form.weekNo = calculateWeekNo(date)
  }
}

function calculateWeekNo(date: Date): number {
  const semesterStart = new Date('2025-09-01')
  const diffDays = Math.floor((date.getTime() - semesterStart.getTime()) / (1000 * 60 * 60 * 24))
  const weekNo = Math.max(1, Math.ceil((diffDays + 1) / 7))
  return Math.min(weekNo, 20)
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
  approveDialogVisible.value = true
}

function handleCancel(row: any) {
  ElMessageBox.confirm('确定要取消该预约吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    try {
      await put(`/reservation/${row.id}/cancel`, { cancelReason: '申请人取消' })
      ElMessage.success('取消成功')
      loadReservations()
    } catch (error) {
      ElMessage.error('取消失败')
    }
  }).catch(() => {})
}

function handleAdminCancel(row: any) {
  currentItem.value = row
  adminCancelForm.cancelReason = ''
  adminCancelDialogVisible.value = true
}

async function handleAdminCancelSubmit() {
  try {
    await put(`/reservation/${currentItem.value.id}/cancel`, { 
      cancelReason: adminCancelForm.cancelReason,
      isAdmin: true 
    })
    ElMessage.success('取消成功，已释放实验室时段')
    adminCancelDialogVisible.value = false
    loadReservations()
  } catch (error) {
    ElMessage.error('取消失败')
  }
}

async function handleApproveSubmit() {
  try {
    await put(`/reservation/${currentItem.value.id}/approve`, approveForm)
    ElMessage.success(approveForm.approvalStatus === 'approved' ? '审批通过，已写入排课表' : '审批驳回')
    approveDialogVisible.value = false
    loadReservations()
  } catch (error) {
    ElMessage.error('审批失败')
  }
}

async function handleSubmit() {
  if (!formRef.value) return

  try {
    await formRef.value.validate()

    const conflicts = await checkConflicts()
    if (conflicts.length > 0) {
      ElMessage.warning('以下时段已被占用: ' + conflicts.join(', '))
      return
    }

    const weekNos = generateWeekNos()
    
    for (const weekNo of weekNos) {
      for (const timeSlot of form.timeSlots) {
        const submitData = {
          semesterId: form.semesterId,
          buildingId: form.buildingId,
          buildingName: form.buildingName,
          roomId: form.roomId,
          roomName: form.roomName,
          roomNumber: form.roomNumber,
          useDate: form.useDate,
          weekNo,
          weekDay: form.weekDay,
          timeSlot,
          projectName: form.projectName,
          projectCategory: form.projectCategory,
          applicantId: form.applicantId,
          applicantName: form.applicantName,
          applicantPhone: form.applicantPhone,
          projectLeader: form.projectLeader,
          projectLeaderPhone: form.projectLeaderPhone,
          memberGrade: form.memberGrade,
          memberClass: form.memberClass,
          memberCount: form.memberCount,
          expectedDuration: form.expectedDuration,
          remarks: form.remarks
        }

        await post('/reservation', submitData)
      }
    }

    ElMessage.success('预约申请提交成功')
    dialogVisible.value = false
    loadReservations()
  } catch (error: any) {
    if (error !== false) {
      ElMessage.error('提交失败')
    }
  }
}

async function checkConflicts(): Promise<string[]> {
  const conflicts: string[] = []
  
  const weekNos = generateWeekNos()
  
  for (const weekNo of weekNos) {
    for (const timeSlot of form.timeSlots) {
      const res = await get<any>('/scheduling/check-conflict', {
        roomId: form.roomId,
        weekNo,
        weekDay: form.weekDay,
        timeSlot
      })
      
      if (res && res.hasConflict) {
        conflicts.push(`第${weekNo}周周${form.weekDay}${timeSlot}节`)
      }
    }
  }
  
  return conflicts
}

function generateWeekNos(): number[] {
  const weekNos: number[] = []
  
  if (form.repeatRule === 'single') {
    weekNos.push(form.weekNo)
  } else {
    const start = form.repeatStartWeek
    const end = form.repeatEndWeek
    
    for (let w = start; w <= end; w++) {
      if (form.repeatRule === 'weekly') {
        weekNos.push(w)
      } else if (form.repeatRule === 'odd' && w % 2 === 1) {
        weekNos.push(w)
      } else if (form.repeatRule === 'even' && w % 2 === 0) {
        weekNos.push(w)
      }
    }
  }
  
  return weekNos
}

function handleDialogClose() {
  formRef.value?.resetFields()
  resetForm()
}

function resetForm() {
  form.buildingId = null
  form.buildingName = ''
  form.roomId = null
  form.roomName = ''
  form.roomNumber = ''
  form.useDate = ''
  form.weekNo = 1
  form.weekDay = 1
  form.timeSlots = []
  form.repeatRule = 'single'
  form.repeatStartWeek = 1
  form.repeatEndWeek = 1
  form.projectName = ''
  form.projectCategory = ''
  form.applicantPhone = ''
  form.projectLeader = ''
  form.projectLeaderPhone = ''
  form.memberGrade = ''
  form.memberClass = ''
  form.memberCount = 0
  form.expectedDuration = 2
  form.applyDate = new Date().toISOString().split('T')[0]
  form.remarks = ''
  selectedRoomSchedule.value = []
}

function formatDate(_row: any, _column: any, cellValue: any) {
  return cellValue || '-'
}

function formatWeekDay(_row: any, _column: any, cellValue: any) {
  const days = ['', '周一', '周二', '周三', '周四', '周五', '周六', '周日']
  return days[cellValue] || '-'
}

function formatApprovalStatus(_row: any, _column: any, cellValue: any) {
  const statusMap: Record<string, string> = {
    pending: '待审批',
    approved: '已通过',
    rejected: '已驳回',
    cancelled: '已取消'
  }
  return statusMap[cellValue] || '-'
}
</script>

<style scoped>
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.search-form {
  margin-bottom: 20px;
}

.empty-hint {
  text-align: center;
  padding: 20px;
  color: #999;
}
</style>
