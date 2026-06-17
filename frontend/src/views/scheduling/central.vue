<template>
  <div class="central-scheduling-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>集中排课</span>
          <el-button type="primary" @click="handleCreate">新建排课</el-button>
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
        <el-form-item label="教师">
          <el-select v-model="searchForm.teacherName" placeholder="请选择教师" clearable @change="handleSearch" style="width: 150px;">
            <el-option
              v-for="teacher in teacherList"
              :key="teacher.id"
              :label="teacher.name"
              :value="teacher.name"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="课程">
          <el-input v-model="searchForm.courseName" placeholder="请输入课程名称" clearable @change="handleSearch" style="width: 150px;" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">查询</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>

      <el-table :data="groupedScheduleList" border stripe>
        <el-table-column type="index" label="序号" width="60" />
        <el-table-column prop="scheduling_code" label="排课编号" width="130" />
        <el-table-column prop="course_name" label="课程名称" min-width="150" />
        <el-table-column prop="class_name" label="班级" width="150" />
        <el-table-column prop="teacher_name" label="授课教师" width="100" />
        <el-table-column prop="building_name" label="楼宇" width="100" />
        <el-table-column prop="room_name" label="实验室" width="120" />
        <el-table-column prop="week_range" label="周次范围" width="120" />
        <el-table-column prop="week_day" label="星期" width="80" :formatter="formatWeekDay" />
        <el-table-column prop="time_slot_start" label="节次" width="100" />
        <el-table-column prop="week_count" label="周数" width="80" />
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="handleView(row)">查看</el-button>
            <el-button link type="primary" @click="handleEdit(row)">编辑</el-button>
            <el-button link type="danger" @click="handleDeleteAll(row)">删除全部</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 新建/编辑排课弹窗 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogType === 'create' ? '新建排课' : '编辑排课'"
      width="1000px"
      @close="handleDialogClose"
    >
      <el-form :model="form" :rules="rules" ref="formRef" label-width="130px">
        <el-form-item label="学期" prop="semesterId">
          <el-select v-model="form.semesterId" placeholder="请选择学期" style="width: 250px;">
            <el-option
              v-for="semester in semesterList"
              :key="semester.id"
              :label="semester.name"
              :value="semester.id"
            />
          </el-select>
        </el-form-item>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="课程名称" prop="courseName">
              <el-input v-model="form.courseName" placeholder="请输入课程名称" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="班级" prop="className">
              <el-input v-model="form.className" placeholder="请输入班级" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="授课教师" prop="teacherName">
              <el-input v-model="form.teacherName" placeholder="请输入授课教师" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="学生人数">
              <el-input-number v-model="form.studentCount" :min="0" :max="200" placeholder="请输入学生人数" style="width: 100%;" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="星期" prop="weekDay">
              <el-select v-model="form.weekDay" placeholder="请选择星期">
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
            <el-form-item label="节次" prop="timeSlots">
              <el-select v-model="form.timeSlots" multiple placeholder="请选择节次" style="width: 250px;">
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
            <el-form-item label="周类型" prop="weekType">
              <el-select v-model="form.weekType" placeholder="请选择周类型">
                <el-option label="全部周" value="all" />
                <el-option label="单周" value="odd" />
                <el-option label="双周" value="even" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="教学周" prop="weekRange">
          <el-space wrap>
            <el-input-number v-model="form.weekStart" :min="1" :max="20" placeholder="起始周" @change="handleWeekRangeChange" />
            <span>至</span>
            <el-input-number v-model="form.weekEnd" :min="form.weekStart || 1" :max="20" placeholder="结束周" @change="handleWeekRangeChange" />
            <el-checkbox v-model="form.selectAllWeeks">全选</el-checkbox>
          </el-space>
        </el-form-item>

        <el-form-item label="空闲实验室">
          <el-button @click="checkAvailableRooms" :loading="checkingRooms" type="primary" size="small">
            检测空闲实验室
          </el-button>
        </el-form-item>

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
              <el-select v-model="form.roomId" placeholder="请选择实验室" style="width: 100%;">
                <el-option-group
                  v-for="group in roomGroupedList"
                  :key="group.label"
                  :label="group.label"
                >
                  <el-option
                    v-for="room in group.options"
                    :key="room.id"
                    :label="`${room.name} (${room.room_number}) - 可容纳${room.seat_count}人`"
                    :value="room.id"
                    :disabled="room.isOccupied"
                  >
                    <span style="float: left">{{ room.name }} ({{ room.room_number }}) - 可容纳{{ room.seat_count }}人</span>
                    <el-tag v-if="room.isOccupied" size="small" type="danger" style="float: right;">已被占用</el-tag>
                  </el-option>
                </el-option-group>
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <!-- 冲突提示 -->
        <el-alert
          v-if="conflictInfo.show"
          :title="conflictInfo.message"
          :type="conflictInfo.type"
          :description="conflictInfo.description"
          show-icon
          :closable="false"
          style="margin-top: 10px;"
        >
          <template #default>
            <div v-if="conflictInfo.conflicts.length > 0">
              <div v-for="(conflict, index) in conflictInfo.conflicts" :key="index" style="margin: 5px 0;">
                <strong>{{ conflict.type === 'room' ? '实验室冲突' : conflict.type === 'teacher' ? '教师冲突' : '班级冲突' }}：</strong>
                {{ conflict.message }}
                <el-tag v-if="conflict.type === 'room'" type="danger" size="small">硬冲突(禁止)</el-tag>
                <el-tag v-else type="warning" size="small">软冲突(可强制)</el-tag>
              </div>
            </div>
          </template>
        </el-alert>
      </el-form>

      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button @click="handleSubmitAndCheck" :loading="submitting">检查冲突</el-button>
        <el-button type="primary" @click="handleSubmit" :loading="submitting">确认排课</el-button>
      </template>
    </el-dialog>

    <!-- 查看详情弹窗 -->
    <el-dialog v-model="detailVisible" title="排课详情" width="800px">
      <el-descriptions :column="2" border>
        <el-descriptions-item label="排课编号">{{ currentItem.scheduling_code }}</el-descriptions-item>
        <el-descriptions-item label="课程名称">{{ currentItem.course_name }}</el-descriptions-item>
        <el-descriptions-item label="班级">{{ currentItem.class_name }}</el-descriptions-item>
        <el-descriptions-item label="授课教师">{{ currentItem.teacher_name }}</el-descriptions-item>
        <el-descriptions-item label="实验室">{{ currentItem.building_name }} {{ currentItem.room_name }}</el-descriptions-item>
        <el-descriptions-item label="教学周">{{ formatWeekNo(null, null, currentItem.week_no) }}</el-descriptions-item>
        <el-descriptions-item label="星期">{{ formatWeekDay(null, null, currentItem.week_day) }}</el-descriptions-item>
        <el-descriptions-item label="节次">{{ currentItem.time_slot_start }}</el-descriptions-item>
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
import { get, post, put, del } from '@/utils/request'

const searchForm = reactive({
  semesterId: 1,
  teacherName: '',
  courseName: ''
})

const semesterList = ref<any[]>([])
const teacherList = ref<any[]>([])
const buildingList = ref<any[]>([])
const roomList = ref<any[]>([])
const scheduleList = ref<any[]>([])

const dialogVisible = ref(false)
const dialogType = ref<'create' | 'edit'>('create')
const detailVisible = ref(false)
const currentItem = ref<any>({})
const formRef = ref<FormInstance>()
const checkingRooms = ref(false)
const submitting = ref(false)

const conflictInfo = reactive({
  show: false,
  message: '',
  type: 'success' as 'success' | 'warning' | 'error',
  description: '',
  conflicts: [] as any[]
})

const form = reactive({
  id: null as number | null,
  semesterId: 1,
  courseName: '',
  courseCategory: '',
  majorId: null as number | null,
  majorName: '',
  classId: null as number | null,
  className: '',
  studentCount: 0,
  buildingId: null as number | null,
  buildingName: '',
  roomId: null as number | null,
  roomName: '',
  roomNumber: '',
  teacherId: null as number | null,
  teacherName: '',
  teacherTitle: '',
  weekDay: 1,
  weekType: 'all' as 'all' | 'odd' | 'even',
  weekStart: 1,
  weekEnd: 16,
  selectAllWeeks: false,
  timeSlots: [] as string[]
})

const rules: FormRules = {
  semesterId: [{ required: true, message: '请选择学期', trigger: 'change' }],
  courseName: [{ required: true, message: '请输入课程名称', trigger: 'blur' }],
  className: [{ required: true, message: '请输入班级', trigger: 'blur' }],
  teacherName: [{ required: true, message: '请输入授课教师', trigger: 'blur' }],
  weekDay: [{ required: true, message: '请选择星期', trigger: 'change' }],
  buildingId: [{ required: true, message: '请选择楼宇', trigger: 'change' }],
  roomId: [{ required: true, message: '请选择实验室', trigger: 'change' }],
  timeSlots: [{ required: true, message: '请选择节次', trigger: 'change', type: 'array' }]
}

const roomGroupedList = computed(() => {
  const grouped: any = {}
  
  roomList.value.forEach(room => {
    const building = room.building_name || '未分组'
    if (!grouped[building]) {
      grouped[building] = []
    }
    grouped[building].push(room)
  })
  
  return Object.keys(grouped).map(key => ({
    label: key,
    options: grouped[key]
  }))
})

const groupedScheduleList = computed(() => {
  const groups: any = {}
  
  scheduleList.value.forEach(schedule => {
    const code = schedule.scheduling_code
    if (!groups[code]) {
      groups[code] = {
        ...schedule,
        week_nos: [],
        ids: []
      }
    }
    groups[code].week_nos.push(schedule.week_no)
    groups[code].ids.push(schedule.id)
  })
  
  return Object.values(groups).map((item: any) => ({
    ...item,
    week_nos: Array.from(new Set<number>(item.week_nos as number[])).sort((a, b) => a - b),
    week_count: item.week_nos.length,
    week_range: item.week_nos.length > 1 
      ? `${item.week_nos[0]}-${item.week_nos[item.week_nos.length - 1]}周`
      : `${item.week_nos[0]}周`
  }))
})

onMounted(async () => {
  await loadSemesters()
  await loadTeachers()
  await loadBuildings()
  await loadRooms()
  await loadSchedules()
})

async function loadSemesters() {
  try {
    const res = await get<any[]>('/semesters')
    semesterList.value = res || []
    if (semesterList.value.length > 0) {
      const currentSemester = semesterList.value.find((s: any) => s.isActive === 1 || s.isActive === true)
      if (currentSemester) {
        searchForm.semesterId = currentSemester.id
        form.semesterId = currentSemester.id
      } else {
        searchForm.semesterId = semesterList.value[0].id
        form.semesterId = semesterList.value[0].id
      }
    }
  } catch (error) {
    console.error('加载学期列表失败:', error)
  }
}

async function loadTeachers() {
  try {
    const res = await get<any[]>('/teachers')
    teacherList.value = (res || []).map((item: any) => ({
      id: item.id,
      name: item.RealName || item.name || item.UserName
    }))
  } catch (error) {
    console.error('加载教师列表失败:', error)
  }
}

async function loadBuildings() {
  try {
    const res = await get<any[]>('/buildings')
    buildingList.value = (res || []).map((item: any) => ({
      id: item.BuildingID || item.id,
      name: item.BuildingName || item.name || `楼宇${item.BuildingID || item.id}`
    }))
  } catch (error) {
    console.error('加载楼宇列表失败:', error)
  }
}

async function loadRooms() {
  try {
    const res = await get<any[]>('/rooms')
    roomList.value = (res || []).map((item: any) => ({
      id: item.RoomID || item.id,
      name: item.RoomName || item.name,
      room_number: item.RoomNumber || item.room_number,
      seat_count: item.SeatCount || item.seat_count || 0,
      building_id: item.BuildingID || item.building_id,
      building_name: item.BuildingName || item.building_name || '',
      room_type: item.RoomType || item.room_type,
      isOccupied: false
    }))
  } catch (error) {
    console.error('加载实验室列表失败:', error)
  }
}

async function loadSchedules() {
  try {
    const params: any = {
      semesterId: searchForm.semesterId,
      sourceType: 'CentralScheduling'
    }
    
    if (searchForm.teacherName) {
      params.teacherName = searchForm.teacherName
    }
    
    if (searchForm.courseName) {
      params.courseName = searchForm.courseName
    }
    
    const res = await get<any[]>('/scheduling', params)
    scheduleList.value = res || []
  } catch (error) {
    console.error('加载排课列表失败:', error)
    ElMessage.error('加载排课列表失败')
  }
}

function handleSearch() {
  loadSchedules()
}

function handleReset() {
  searchForm.teacherName = ''
  searchForm.courseName = ''
  handleSearch()
}

function handleWeekRangeChange() {
  if (form.selectAllWeeks) {
    form.weekStart = 1
    form.weekEnd = 20
  }
}

function handleBuildingChange() {
  form.roomId = null
  checkConflict()
}

async function checkAvailableRooms() {
  if (!form.weekDay || form.timeSlots.length === 0 || !form.weekStart || !form.weekEnd) {
    ElMessage.warning('请先选择星期、节次和教学周')
    return
  }
  
  checkingRooms.value = true
  try {
    const params: any = {
      semesterId: form.semesterId,
      weekDay: form.weekDay,
      timeSlots: form.timeSlots.join(','),
      weekStart: form.weekStart,
      weekEnd: form.weekEnd,
      weekType: form.weekType,
      buildingId: form.buildingId
    }
    
    const res: any = await get('/scheduling/available-rooms', params)
    
    roomList.value = roomList.value.map((room: any) => {
      const occupied = res.occupiedRooms?.includes(room.id) || res.some((r: any) => r.id === room.id)
      return {
        ...room,
        isOccupied: occupied,
        occupyInfo: occupied ? res.find((r: any) => r.id === room.id) : null
      }
    })
    
    ElMessage.success('已更新实验室状态')
    checkConflict()
  } catch (error) {
    console.error('检测空闲实验室失败:', error)
    ElMessage.error('检测空闲实验室失败')
  } finally {
    checkingRooms.value = false
  }
}

async function checkConflict() {
  if (!form.roomId || !form.weekDay || form.timeSlots.length === 0 || !form.weekStart || !form.weekEnd) {
    conflictInfo.show = false
    return
  }
  
  try {
    const params: any = {
      roomId: form.roomId,
      weekDay: form.weekDay,
      timeSlots: form.timeSlots.join(','),
      weekStart: form.weekStart,
      weekEnd: form.weekEnd,
      weekType: form.weekType,
      teacherId: form.teacherId,
      classId: form.classId
    }
    
    if (dialogType.value === 'edit') {
      params.excludeId = form.id
    }
    
    const res: any = await get('/scheduling/check-conflict', params)
    
    if (res.hasConflict) {
      conflictInfo.show = true
      conflictInfo.type = res.hasHardConflict ? 'error' : 'warning'
      conflictInfo.message = res.hasHardConflict ? '存在硬冲突，无法排课' : '存在软冲突，可强制排课'
      conflictInfo.description = res.message || ''
      conflictInfo.conflicts = res.conflicts || []
    } else {
      conflictInfo.show = false
    }
  } catch (error) {
    console.error('检查冲突失败:', error)
  }
}

function handleCreate() {
  dialogType.value = 'create'
  resetForm()
  conflictInfo.show = false
  dialogVisible.value = true
}

function handleEdit(row: any) {
  dialogType.value = 'edit'
  Object.assign(form, {
    id: row.id,
    semesterId: row.semester_id || row.semesterId,
    courseName: row.course_name || row.courseName,
    courseCategory: row.course_category || row.courseCategory,
    majorId: row.major_id || row.majorId,
    majorName: row.major_name || row.majorName,
    classId: row.class_id || row.classId,
    className: row.class_name || row.className,
    studentCount: row.student_count || row.studentCount,
    buildingId: row.building_id || row.buildingId,
    buildingName: row.building_name || row.buildingName,
    roomId: row.room_id || row.roomId,
    roomName: row.room_name || row.roomName,
    roomNumber: row.room_number || row.roomNumber,
    teacherId: row.teacher_id || row.teacherId,
    teacherName: row.teacher_name || row.teacherName,
    teacherTitle: row.teacher_title || row.teacherTitle,
    weekDay: row.week_day || row.weekDay,
    weekType: row.week_type || 'all',
    weekStart: row.week_start || 1,
    weekEnd: row.week_end || 16,
    timeSlots: row.time_slot_start ? row.time_slot_start.split(',') : []
  })
  dialogVisible.value = true
  checkConflict()
}

function handleView(row: any) {
  currentItem.value = row
  detailVisible.value = true
}

async function handleDelete(row: any) {
  try {
    await ElMessageBox.confirm('确定要删除该排课记录吗？删除后将释放该时段实验室资源。', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })

    await del(`/scheduling/${row.id}`)
    ElMessage.success('删除成功')
    loadSchedules()
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败')
    }
  }
}

void handleDelete

async function handleDeleteAll(row: any) {
  try {
    await ElMessageBox.confirm(`确定要删除该排课的所有${row.week_count}条记录吗？删除后将释放所有时段的实验室资源。`, '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })

    for (const id of row.ids) {
      await del(`/scheduling/${id}`)
    }
    ElMessage.success('删除成功')
    loadSchedules()
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败')
    }
  }
}

async function handleSubmitAndCheck() {
  if (!formRef.value) return
  
  try {
    await formRef.value.validate()
    await checkConflict()
    
    if (conflictInfo.show && conflictInfo.type === 'error') {
      ElMessage.error('存在硬冲突，无法排课')
      return
    }
    
    if (conflictInfo.show && conflictInfo.type === 'warning') {
      const confirmed = await ElMessageBox.confirm(
        `存在以下软冲突：\n${conflictInfo.conflicts.map((c: any) => c.message).join('\n')}\n\n确定要强制排课吗？`,
        '软冲突警告',
        {
          confirmButtonText: '强制排课',
          cancelButtonText: '取消',
          type: 'warning'
        }
      ).catch(() => false)
      
      if (!confirmed) return
    }
    
    ElMessage.success('冲突检查通过')
  } catch (error) {
    console.error('验证失败:', error)
  }
}

async function handleSubmit() {
  if (!formRef.value) return
  
  try {
    await formRef.value.validate()
    
    if (conflictInfo.show && conflictInfo.type === 'error') {
      ElMessage.error('存在硬冲突，无法排课')
      return
    }
    
    if (conflictInfo.show && conflictInfo.type === 'warning') {
      const confirmed = await ElMessageBox.confirm(
        `存在以下软冲突：\n${conflictInfo.conflicts.map((c: any) => c.message).join('\n')}\n\n确定要强制排课吗？`,
        '软冲突警告',
        {
          confirmButtonText: '强制排课',
          cancelButtonText: '取消',
          type: 'warning'
        }
      ).catch(() => false)
      
      if (!confirmed) return
    }
    
    submitting.value = true
    
    const building = buildingList.value.find(b => b.id === form.buildingId)
    const room = roomList.value.find(r => r.id === form.roomId)
    
    if (building) form.buildingName = building.name || building.BuildingName || building.building_name
    if (room) {
      form.roomName = room.name || room.RoomName || room.room_name
      form.roomNumber = room.room_number || room.RoomNumber || ''
    }
    
    const submitData = {
      ...form,
      timeSlotStart: form.timeSlots.join(',')
    }
    
    if (dialogType.value === 'create') {
      await post('/scheduling/central', submitData)
      ElMessage.success('创建成功')
    } else {
      await put(`/scheduling/${form.id}`, submitData)
      ElMessage.success('更新成功')
    }
    
    dialogVisible.value = false
    loadSchedules()
  } catch (error: any) {
    if (error !== false && error !== 'cancel') {
      ElMessage.error(dialogType.value === 'create' ? '创建失败' : '更新失败')
    }
  } finally {
    submitting.value = false
  }
}

function handleDialogClose() {
  formRef.value?.resetFields()
  resetForm()
  conflictInfo.show = false
}

function resetForm() {
  form.id = null
  form.courseName = ''
  form.courseCategory = ''
  form.majorId = null
  form.majorName = ''
  form.classId = null
  form.className = ''
  form.studentCount = 0
  form.buildingId = null
  form.buildingName = ''
  form.roomId = null
  form.roomName = ''
  form.roomNumber = ''
  form.teacherId = null
  form.teacherName = ''
  form.teacherTitle = ''
  form.weekDay = 1
  form.weekType = 'all'
  form.weekStart = 1
  form.weekEnd = 16
  form.selectAllWeeks = false
  form.timeSlots = []
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

function formatWeekNo(_row: any, _column: any, cellValue: any) {
  if (!cellValue) return ''
  if (typeof cellValue === 'string' && cellValue.includes(',')) {
    return cellValue
  }
  return `第${cellValue}周`
}

function formatStatus(_row: any, _column: any, cellValue: number) {
  return cellValue === 1 ? '正常' : '已取消'
}
void formatStatus
</script>

<style scoped>
.central-scheduling-container {
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

:deep(.el-select-dropdown__item) {
  height: auto !important;
  padding: 8px !important;
}

:deep(.el-select-dropdown__item.is-disabled) {
  opacity: 0.5;
  background-color: #f5f5f5;
}
</style>
