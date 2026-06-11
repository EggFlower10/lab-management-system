<template>
  <div class="scheduling-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>排课检索</span>
          <div class="header-actions">
            <el-radio-group v-model="viewMode" size="default">
              <el-radio-button label="table">课程表视图</el-radio-button>
              <el-radio-button label="list">列表视图</el-radio-button>
            </el-radio-group>
          </div>
        </div>
      </template>

      <!-- 检索条件 -->
      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item label="学期">
          <el-select v-model="searchForm.semesterId" placeholder="请选择学期" @change="handleSearch" style="width: 180px;">
            <el-option
              v-for="semester in semesterList"
              :key="semester.id"
              :label="semester.name"
              :value="semester.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="教学周">
          <el-select v-model="searchForm.weekNo" placeholder="请选择教学周" clearable @change="handleSearch" style="width: 120px;">
            <el-option
              v-for="week in weekOptions"
              :key="week.value"
              :label="week.label"
              :value="week.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="楼宇">
          <el-select v-model="searchForm.buildingId" placeholder="请选择楼宇" clearable @change="handleBuildingChange" style="width: 150px;">
            <el-option
              v-for="building in buildingList"
              :key="building.id"
              :label="building.name"
              :value="building.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="实验室">
          <el-select v-model="searchForm.roomId" placeholder="请选择实验室" clearable @change="handleSearch" style="width: 180px;">
            <el-option
              v-for="room in filteredRoomList"
              :key="room.id"
              :label="room.label"
              :value="room.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="专业">
          <el-select v-model="searchForm.majorId" placeholder="请选择专业" clearable @change="handleMajorChange" style="width: 180px;">
            <el-option
              v-for="major in majorList"
              :key="major.id"
              :label="major.name"
              :value="major.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="班级">
          <el-select v-model="searchForm.classId" placeholder="请选择班级" clearable @change="handleSearch" style="width: 180px;">
            <el-option
              v-for="cls in filteredClassList"
              :key="cls.id"
              :label="cls.name"
              :value="cls.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="教师">
          <el-select v-model="searchForm.teacherId" placeholder="请选择教师" clearable @change="handleSearch" style="width: 180px;">
            <el-option
              v-for="teacher in teacherList"
              :key="teacher.id"
              :label="teacher.name"
              :value="teacher.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="课程">
          <el-input v-model="searchForm.courseName" placeholder="请输入课程名称" clearable @change="handleSearch" style="width: 180px;" />
        </el-form-item>
        <el-form-item label="排课类型">
          <el-select v-model="searchForm.sourceType" placeholder="请选择" clearable @change="handleSearch" style="width: 180px;">
            <el-option label="全部" value="all" />
            <el-option label="集中排课" value="CentralScheduling" />
            <el-option label="预约申请" value="Reservation" />
            <el-option label="授课申请" value="TeachingRequest" />
            <el-option label="待审批预约" value="PendingReservation" />
            <el-option label="待审批授课" value="PendingTeachingRequest" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">查询</el-button>
          <el-button @click="handleReset">重置</el-button>
          <el-button type="success" @click="handleExport">导出</el-button>
        </el-form-item>
      </el-form>

      <!-- 课程表视图 -->
      <div v-if="viewMode === 'table'" class="timetable-view">
        <div class="timetable-wrapper">
          <table class="timetable-table">
            <thead>
              <tr>
                <th class="th-time">节次</th>
                <th v-for="day in weekDays" :key="day.value" class="th-day">{{ day.label }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="slot in timeSlots" :key="slot.value">
                <td class="td-time">{{ slot.label }}</td>
                <td
                  v-for="day in weekDays"
                  :key="day.value"
                  class="td-cell"
                  :class="getCellClass(slot.value, day.value)"
                >
                  <div
                    v-for="item in getScheduleItems(slot.value, day.value)"
                    :key="item.id"
                    class="schedule-item"
                    :class="{ 'is-cancelled': item.status === 0 || item.source_type === 'Cancelled' }"
                    :style="{ backgroundColor: getSourceColor(item) }"
                    @click="handleItemClick(item)"
                  >
                    <div class="item-course">{{ item.course_name || item.project_name }}</div>
                    <div class="item-class">{{ item.class_name || item.applicant_name }}</div>
                    <div class="item-teacher">{{ item.teacher_name || '未分配教师' }}</div>
                    <div class="item-room">{{ item.building_name }} {{ item.room_number || item.room_name }}</div>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- 列表视图 -->
      <div v-else>
        <el-table :data="paginatedScheduleList" border stripe @sort-change="handleSortChange">
          <el-table-column type="index" label="序号" width="60" fixed />
          <el-table-column prop="scheduling_code" label="排课编号" width="130" sortable="custom" />
          <el-table-column prop="course_name" label="课程名称" min-width="150" sortable="custom" />
          <el-table-column prop="class_name" label="班级" width="140" sortable="custom" />
          <el-table-column prop="student_count" label="学生数" width="80" sortable="custom" />
          <el-table-column prop="teacher_name" label="授课教师" width="100" sortable="custom" />
          <el-table-column prop="teacher_title" label="教师职称" width="100" />
          <el-table-column prop="building_name" label="楼宇" width="100" sortable="custom" />
          <el-table-column prop="room_name" label="实验室" width="120" sortable="custom" />
          <el-table-column prop="week_no" label="周次" width="70" sortable="custom" />
          <el-table-column prop="week_type" label="周类型" width="80" :formatter="formatWeekType" />
          <el-table-column prop="week_day" label="星期" width="80" :formatter="formatWeekDay" sortable="custom" />
          <el-table-column prop="time_slot_start" label="节次" width="100" sortable="custom" />
          <el-table-column prop="source_type" label="来源" width="110" :formatter="formatSourceType" />
          <el-table-column prop="status" label="状态" width="80" :formatter="formatStatus" />
          <el-table-column label="操作" width="150" fixed="right">
            <template #default="{ row }">
              <el-button link type="primary" @click="handleView(row)">查看</el-button>
              <el-button link type="primary" @click="handleEdit(row)">编辑</el-button>
              <el-button link type="danger" @click="handleDelete(row)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
        <el-pagination
          v-model:current-page="pagination.currentPage"
          v-model:page-size="pagination.pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="scheduleList.length"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
          style="margin-top: 20px; justify-content: flex-end;"
        />
      </div>
    </el-card>

    <!-- 查看详情弹窗 -->
    <el-dialog v-model="detailVisible" title="排课详情" width="800px">
      <el-descriptions :column="2" border>
        <el-descriptions-item label="排课编号">{{ currentItem.scheduling_code }}</el-descriptions-item>
        <el-descriptions-item label="排课来源">{{ formatSourceType(null, null, currentItem.source_type) }}</el-descriptions-item>
        <el-descriptions-item label="课程名称">{{ currentItem.course_name }}</el-descriptions-item>
        <el-descriptions-item label="课程类别">{{ currentItem.course_category }}</el-descriptions-item>
        <el-descriptions-item label="专业">{{ currentItem.major_name }}</el-descriptions-item>
        <el-descriptions-item label="班级">{{ currentItem.class_name }}</el-descriptions-item>
        <el-descriptions-item label="学生人数">{{ currentItem.student_count }}</el-descriptions-item>
        <el-descriptions-item label="授课教师">{{ currentItem.teacher_name }}</el-descriptions-item>
        <el-descriptions-item label="教师职称">{{ currentItem.teacher_title }}</el-descriptions-item>
        <el-descriptions-item label="实验室">{{ currentItem.building_name }} {{ currentItem.room_name }}</el-descriptions-item>
        <el-descriptions-item label="教学周">{{ currentItem.week_no }}</el-descriptions-item>
        <el-descriptions-item label="星期">{{ formatWeekDay(null, null, currentItem.week_day) }}</el-descriptions-item>
        <el-descriptions-item label="节次">{{ currentItem.time_slot_start }}</el-descriptions-item>
        <el-descriptions-item label="周类型">{{ formatWeekType(currentItem.week_type) }}</el-descriptions-item>
      </el-descriptions>
      <template #footer>
        <el-button @click="detailVisible = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { get } from '@/utils/request'
import * as XLSX from 'xlsx'

const viewMode = ref<'table' | 'list'>('table')
const searchForm = reactive({
  semesterId: 1,
  weekNo: 1 as number | null,
  buildingId: null as number | null,
  roomId: null as number | null,
  majorId: null as number | null,
  classId: null as number | null,
  teacherId: null as number | null,
  courseName: '',
  sourceType: 'all'
})

const weekOptions = computed(() => {
  const options = []
  for (let i = 1; i <= 20; i++) {
    options.push({ value: i, label: `第${i}周` })
  }
  return options
})

const semesterList = ref<any[]>([])
const buildingList = ref<any[]>([])
const roomList = ref<any[]>([])
const majorList = ref<any[]>([])
const classList = ref<any[]>([])
const teacherList = ref<any[]>([])
const scheduleList = ref<any[]>([])
const detailVisible = ref(false)
const currentItem = ref<any>({})

const pagination = reactive({
  currentPage: 1,
  pageSize: 10
})

const weekDays = [
  { value: 1, label: '周一' },
  { value: 2, label: '周二' },
  { value: 3, label: '周三' },
  { value: 4, label: '周四' },
  { value: 5, label: '周五' },
  { value: 6, label: '周六' },
  { value: 7, label: '周日' }
]

const timeSlots = [
  { value: '1-2', label: '第1-2节' },
  { value: '3-4', label: '第3-4节' },
  { value: '5-6', label: '第5-6节' },
  { value: '7-8', label: '第7-8节' },
  { value: '9-10', label: '第9-10节' },
  { value: '11-12', label: '第11-12节' }
]

const filteredRoomList = computed(() => {
  if (!searchForm.buildingId) return roomList.value
  return roomList.value.filter(room => room.buildingId === searchForm.buildingId)
})

const filteredClassList = computed(() => {
  if (!searchForm.majorId) return classList.value
  return classList.value.filter(cls => cls.majorId === searchForm.majorId)
})

const paginatedScheduleList = computed(() => {
  const start = (pagination.currentPage - 1) * pagination.pageSize
  const end = start + pagination.pageSize
  return scheduleList.value.slice(start, end)
})

onMounted(async () => {
  await loadSemesters()
  await loadBuildings()
  await loadRooms()
  await loadMajors()
  await loadClasses()
  await loadTeachers()
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
      } else {
        searchForm.semesterId = semesterList.value[0].id
      }
    }
  } catch (error) {
    console.error('加载学期列表失败:', error)
  }
}

async function loadBuildings() {
  try {
    const res = await get<any[]>('/buildings')
    buildingList.value = (res || []).map((item: any) => ({
      id: item.BuildingID || item.id,
      name: item.BuildingName || item.name
    }))
  } catch (error) {
    console.error('加载楼宇列表失败:', error)
  }
}

async function loadRooms() {
  try {
    const res = await get<any[]>('/rooms')
    roomList.value = (res || []).filter((r: any) => {
      const roomType = r.RoomType || r.room_type || ''
      return roomType === 'lab' || roomType.includes('实验室')
    }).map((item: any) => ({
      id: item.RoomID || item.id,
      name: item.RoomName || item.name,
      roomNumber: item.RoomNumber || item.room_number,
      buildingId: item.BuildingID || item.building_id,
      label: `${item.RoomName || item.name} (${item.RoomNumber || item.room_number})`
    }))
  } catch (error) {
    console.error('加载实验室列表失败:', error)
  }
}

async function loadMajors() {
  try {
    const res = await get<any[]>('/majors')
    majorList.value = (res || []).map((item: any) => ({
      id: item.MajorID || item.id,
      name: item.MajorName || item.name
    }))
  } catch (error) {
    console.error('加载专业列表失败:', error)
  }
}

async function loadClasses() {
  try {
    const res = await get<any[]>('/classes')
    classList.value = (res || []).map((item: any) => ({
      id: item.ClassID || item.id,
      name: item.ClassName || item.name,
      majorId: item.MajorID || item.major_id
    }))
  } catch (error) {
    console.error('加载班级列表失败:', error)
  }
}

async function loadTeachers() {
  try {
    const res = await get<any[]>('/teachers')
    teacherList.value = (res || []).map((item: any) => ({
      id: item.UserID || item.id,
      name: item.RealName || item.name || item.realName || item.UserName
    }))
  } catch (error) {
    console.error('加载教师列表失败:', error)
  }
}

async function loadSchedules() {
  try {
    const params: any = {
      semesterId: searchForm.semesterId
    }
    if (searchForm.weekNo) params.weekNo = searchForm.weekNo
    if (searchForm.buildingId) params.buildingId = searchForm.buildingId
    if (searchForm.roomId) params.roomId = searchForm.roomId
    if (searchForm.majorId) params.majorId = searchForm.majorId
    if (searchForm.classId) params.classId = searchForm.classId
    if (searchForm.teacherId) params.teacherId = searchForm.teacherId
    if (searchForm.courseName) params.courseName = searchForm.courseName
    if (searchForm.sourceType && searchForm.sourceType !== 'all') params.sourceType = searchForm.sourceType

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
  searchForm.weekNo = null
  searchForm.buildingId = null
  searchForm.roomId = null
  searchForm.majorId = null
  searchForm.classId = null
  searchForm.teacherId = null
  searchForm.courseName = ''
  searchForm.sourceType = 'all'
  loadSchedules()
}

function handleBuildingChange() {
  searchForm.roomId = null
  loadSchedules()
}

function handleMajorChange() {
  searchForm.classId = null
  loadSchedules()
}

function handleSizeChange(size: number) {
  pagination.pageSize = size
  pagination.currentPage = 1
}

function handleCurrentChange(page: number) {
  pagination.currentPage = page
}

function handleSortChange({ prop, order }: { prop: string; order: string }) {
  if (!prop || !order) {
    loadSchedules()
    return
  }
  
  const sorted = [...scheduleList.value].sort((a, b) => {
    const aVal = a[prop]
    const bVal = b[prop]
    
    if (order === 'ascending') {
      return aVal > bVal ? 1 : -1
    } else {
      return aVal < bVal ? 1 : -1
    }
  })
  
  scheduleList.value = sorted
}

function getScheduleItems(timeSlot: string, weekDay: number) {
  return scheduleList.value.filter(item => {
    if (item.time_slot_start !== timeSlot) return false
    if (parseInt(item.week_day) !== weekDay) return false
    if (searchForm.weekNo && parseInt(item.week_no) !== searchForm.weekNo) return false
    return true
  })
}

function getCellClass(timeSlot: string, weekDay: number) {
  const items = getScheduleItems(timeSlot, weekDay)
  return {
    'has-item': items.length > 0,
    'cancelled': items.some(item => item.status === 0)
  }
}

function getSourceColor(item: any) {
  if (item.status === 0 || item.source_type === 'Cancelled') {
    return '#f5f5f5'
  }
  
  const sourceType = item.source_type
  if (sourceType === 'CentralScheduling' || sourceType === '集中排课') {
    return '#ffffff'
  }
  if (sourceType === 'Reservation') {
    return '#e6f7ff'
  }
  if (sourceType === 'TeachingRequest') {
    return '#f6ffed'
  }
  if (sourceType === 'PendingReservation') {
    return '#fffbe6'
  }
  if (sourceType === 'PendingTeachingRequest') {
    return '#fff7e6'
  }
  return '#ffffff'
}

function handleItemClick(item: any) {
  currentItem.value = item
  detailVisible.value = true
}

function handleView(row: any) {
  currentItem.value = row
  detailVisible.value = true
}

function handleEdit(_row: any) {
  ElMessage.info('编辑功能开发中')
}

function handleDelete(_row: any) {
  ElMessage.info('删除功能开发中')
}

function handleExport() {
  try {
    if (viewMode.value === 'table') {
      const exportData = scheduleList.value.map((item, index) => ({
        '序号': index + 1,
        '排课编号': item.scheduling_code,
        '来源': formatSourceType(null, null, item.source_type),
        '课程名称': item.course_name || '',
        '课程类别': item.course_category || '',
        '专业': item.major_name || '',
        '班级': item.class_name || '',
        '学生人数': item.student_count || '',
        '授课教师': item.teacher_name || '',
        '实验室': `${item.building_name || ''} ${item.room_name || ''}`,
        '教学周': item.week_no,
        '星期': formatWeekDay(null, null, item.week_day),
        '节次': item.time_slot_start,
        '周类型': formatWeekType(null, null, item.week_type)
      }))
      
      if (exportData.length === 0) {
        ElMessage.warning('没有数据可导出')
        return
      }
      
      const worksheet = XLSX.utils.json_to_sheet(exportData)
      const workbook = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(workbook, worksheet, '排课列表')
      XLSX.writeFile(workbook, `排课列表_${new Date().toLocaleDateString().replace(/\//g, '-')}.xlsx`)
      ElMessage.success('导出成功')
    } else {
      const exportData = paginatedScheduleList.value.map((item, index) => ({
        '序号': index + 1,
        '排课编号': item.scheduling_code,
        '课程名称': item.course_name || '',
        '班级': item.class_name || '',
        '学生数': item.student_count || '',
        '授课教师': item.teacher_name || '',
        '实验室': `${item.building_name || ''} ${item.room_name || ''}`,
        '教学周': item.week_no,
        '星期': formatWeekDay(null, null, item.week_day),
        '节次': item.time_slot_start,
        '来源': formatSourceType(null, null, item.source_type)
      }))
      
      if (exportData.length === 0) {
        ElMessage.warning('没有数据可导出')
        return
      }
      
      const worksheet = XLSX.utils.json_to_sheet(exportData)
      const workbook = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(workbook, worksheet, '排课列表')
      XLSX.writeFile(workbook, `排课列表_${new Date().toLocaleDateString().replace(/\//g, '-')}.xlsx`)
      ElMessage.success('导出成功')
    }
  } catch (error) {
    console.error('导出失败:', error)
    ElMessage.error('导出失败，请重试')
  }
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

function formatSourceType(_row: any, _column: any, cellValue: string) {
  const typeMap: Record<string, string> = {
    CentralScheduling: '集中排课',
    Reservation: '预约申请',
    TeachingRequest: '授课申请',
    PendingReservation: '待审批预约',
    PendingTeachingRequest: '待审批授课',
    Cancelled: '已取消'
  }
  return typeMap[cellValue] || cellValue
}

function formatStatus(_row: any, _column: any, cellValue: number) {
  return cellValue === 1 ? '正常' : '已取消'
}

function formatWeekType(_row: any, _column?: any, cellValue?: any) {
  const weekType = cellValue === undefined ? _row : cellValue
  if (!weekType) return '全部周'
  const typeMap: Record<string, string> = {
    all: '全部周',
    odd: '单周',
    even: '双周',
    All: '全部周',
    Odd: '单周',
    Even: '双周',
    '1': '全部周',
    '0': '全部周'
  }
  return typeMap[String(weekType)] || String(weekType)
}
</script>

<style scoped>
.scheduling-container {
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-actions {
  display: flex;
  gap: 10px;
}

.search-form {
  margin-bottom: 20px;
}

.timetable-view {
  overflow-x: auto;
}

.timetable-wrapper {
  min-width: 100%;
}

.timetable-table {
  width: 100%;
  border-collapse: collapse;
  table-layout: fixed;
}

.timetable-table th,
.timetable-table td {
  border: 1px solid #dcdfe6;
  padding: 8px;
  text-align: center;
}

.th-time {
  width: 100px;
  background-color: #f5f7fa;
}

.th-day {
  background-color: #f5f7fa;
}

.td-time {
  background-color: #f5f7fa;
  font-weight: bold;
}

.td-cell {
  height: 80px;
  vertical-align: top;
}

.td-cell.has-item {
  background-color: #fafafa;
}

.td-cell.cancelled {
  background-color: #f5f5f5;
}

.schedule-item {
  padding: 4px;
  margin-bottom: 4px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  text-align: left;
  border: 1px solid #d9d9d9;
  transition: all 0.3s ease;
}

.schedule-item:hover {
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  transform: translateY(-1px);
}

.schedule-item.is-cancelled {
  opacity: 0.6;
  background-color: #f5f5f5 !important;
}

.schedule-item.is-cancelled .item-course,
.schedule-item.is-cancelled .item-class,
.schedule-item.is-cancelled .item-teacher,
.schedule-item.is-cancelled .item-room {
  text-decoration: line-through;
  color: #999;
}

.item-course {
  font-weight: bold;
  margin-bottom: 2px;
  color: #303133;
}

.item-class {
  color: #666;
  font-size: 11px;
  margin-bottom: 1px;
}

.item-teacher {
  color: #409eff;
  font-size: 11px;
  margin-bottom: 1px;
}

.item-room {
  color: #909399;
  font-size: 10px;
}
</style>
