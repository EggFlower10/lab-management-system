<template>
  <div class="page-container">
    <el-card class="table-card">
      <template #header>
        <div class="card-header">
          <span>校历查看</span>
          <div class="header-right">
            <el-select v-model="selectedSemesterId" placeholder="选择学期" class="semester-select">
              <el-option
                v-for="semester in semesterList"
                :key="semester.id"
                :label="semester.semesterName"
                :value="semester.id"
              />
            </el-select>
            <el-button @click="handleRefresh">
            <el-icon><Refresh /></el-icon>重置
          </el-button>
          </div>
        </div>
      </template>
      <div class="calendar-container">
        <div class="calendar-header">
          <h2>{{ currentSemester?.semesterName || '请选择学期' }}</h2>
          <div class="calendar-info">
            <span>开始日期：{{ currentSemester?.startDate || '--' }}</span>
            <span>结束日期：{{ currentSemester?.endDate || '--' }}</span>
            <span>总周数：{{ currentSemester?.weeks || 0 }}周</span>
          </div>
        </div>
        <div class="calendar-grid" v-if="currentSemester && currentSemester.semesterName">
          <div class="week-header">
            <div class="week-cell">周次</div>
            <div class="week-cell">周一</div>
            <div class="week-cell">周二</div>
            <div class="week-cell">周三</div>
            <div class="week-cell">周四</div>
            <div class="week-cell">周五</div>
            <div class="week-cell">周六</div>
            <div class="week-cell">周日</div>
          </div>
          <div class="week-row" v-for="week in currentSemester.weeks" :key="week">
            <div class="week-cell week-number">{{ week }}</div>
            <div 
              v-for="(day, index) in getWeekDays(week)" 
              :key="index"
              class="week-cell"
              :class="{
                holiday: isHoliday(day),
                workday: isWorkday(day)
              }"
            >
              <div class="date">{{ day }}</div>
              <div class="holiday-name" v-if="isHoliday(day)">{{ getHolidayName(day) }}</div>
              <div class="workday-name" v-if="isWorkday(day)">{{ getWorkdayName(day) }}</div>
              <div class="events" v-if="getEvents(week, index).length > 0">
                <div 
                  v-for="event in getEvents(week, index)" 
                  :key="event.id"
                  class="event-item"
                  :class="event.type"
                >
                  {{ event.name }}
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="empty-state" v-else>
          <el-empty description="请选择学期查看校历" />
        </div>
      </div>
      
      <!-- 假期和考试安排表格 -->
      <div class="holiday-schedule" v-if="currentSemester && currentSemester.semesterName">
        <div class="schedule-header">
          <h3>假期和考试安排</h3>
          <el-button type="primary" @click="handleAddHoliday">
            <el-icon><Plus /></el-icon>新增安排
          </el-button>
        </div>
        <el-table
          :data="pagedHolidays"
          border
          stripe
          style="width: 100%"
        >
          <el-table-column prop="id" label="ID" width="80" />
          <el-table-column prop="name" label="名称" />
          <el-table-column prop="startDate" label="开始日期" />
          <el-table-column prop="endDate" label="结束日期" />
          <el-table-column prop="type" label="类型" />
          <el-table-column prop="isWorkday" label="调休" width="80">
            <template #default="scope">
              <el-tag :type="scope.row.isWorkday ? 'warning' : 'success'">
                {{ scope.row.isWorkday ? '是' : '否' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="remark" label="备注" />
          <el-table-column label="操作" width="150">
            <template #default="scope">
              <el-button type="primary" size="small" @click="handleEditHoliday(scope.row)">编辑</el-button>
              <el-button type="danger" size="small" @click="handleDeleteHoliday(scope.row.id)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
        <div class="pagination" v-if="filteredHolidays.length > 0">
          <el-pagination
            v-model:current-page="pagination.current"
            v-model:page-size="pagination.pageSize"
            :page-sizes="[10, 20, 50, 100]"
            layout="total, sizes, prev, pager, next, jumper"
            :total="filteredHolidays.length"
            @size-change="handleSizeChange"
            @current-change="handleCurrentChange"
          />
        </div>
      </div>

      <!-- 假期和考试编辑对话框 -->
      <el-dialog v-model="holidayDialogVisible" :title="holidayDialogTitle" width="500px" @close="handleHolidayDialogClose">
        <el-form ref="holidayFormRef" :model="holidayForm" :rules="holidayRules" label-width="100px">
          <el-form-item label="名称" prop="name">
            <el-input v-model="holidayForm.name" placeholder="请输入名称" />
          </el-form-item>
          <el-form-item label="开始日期" prop="startDate">
            <el-date-picker v-model="holidayForm.startDate" type="date" placeholder="选择开始日期" style="width: 100%" />
          </el-form-item>
          <el-form-item label="结束日期" prop="endDate">
            <el-date-picker v-model="holidayForm.endDate" type="date" placeholder="选择结束日期" style="width: 100%" />
          </el-form-item>
          <el-form-item label="类型" prop="type">
            <el-select v-model="holidayForm.type" placeholder="请选择类型">
              <el-option label="节假日" value="节假日" />
              <el-option label="假期" value="假期" />
              <el-option label="考试" value="考试" />
            </el-select>
          </el-form-item>
          <el-form-item label="调休" prop="isWorkday">
            <el-switch v-model="holidayForm.isWorkday" />
          </el-form-item>
          <el-form-item label="备注" prop="remark">
            <el-input v-model="holidayForm.remark" type="textarea" placeholder="请输入备注" />
          </el-form-item>
        </el-form>
        <template #footer>
          <el-button @click="holidayDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleHolidaySubmit">确定</el-button>
        </template>
      </el-dialog>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { Refresh, Plus } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox, FormInstance, FormRules } from 'element-plus'
import { get, post, put, del } from '@/utils/request'

const semesterList = ref<any[]>([])
const loading = ref(false)
const holidayLoading = ref(false)

const selectedSemesterId = ref<number | null>(null)

const defaultSemester = {
  id: 0,
  semesterName: '',
  startDate: '',
  endDate: '',
  weeks: 0
}

const currentSemester = computed(() => {
  if (!semesterList.value || semesterList.value.length === 0) {
    return defaultSemester
  }
  return semesterList.value.find(semester => semester.id === selectedSemesterId.value) || semesterList.value[0] || defaultSemester
})

// 节假日安排数据（从后端加载）
const holidaySchedule = ref<any[]>([])

// 过滤后的节假日数据（根据当前学期）
const filteredHolidays = computed(() => {
  if (!currentSemester.value) return []
  return holidaySchedule.value
})

// 分页后的节假日数据
const pagedHolidays = computed(() => {
  const start = (pagination.current - 1) * pagination.pageSize
  const end = start + pagination.pageSize
  return filteredHolidays.value.slice(start, end)
})

// 分页数据
const pagination = reactive({
  current: 1,
  pageSize: 10
})

// 监听分页数据，确保当前页不超出范围
watch(
  () => filteredHolidays.value.length,
  () => {
    const totalPages = Math.max(1, Math.ceil(filteredHolidays.value.length / pagination.pageSize))
    if (pagination.current > totalPages) {
      pagination.current = totalPages
    }
  }
)

// 监听学期变化，重置分页
watch(selectedSemesterId, () => {
  pagination.current = 1
})

// 节假日编辑对话框相关数据
const holidayDialogVisible = ref(false)
const holidayDialogTitle = ref('新增安排')
const isHolidayEdit = ref(false)
const holidayFormRef = ref<FormInstance>()

const holidayForm = reactive({
  id: 0,
  name: '',
  startDate: '',
  endDate: '',
  type: '',
  isWorkday: false,
  remark: ''
})

const holidayRules = reactive<FormRules>({
  name: [{ required: true, message: '请输入名称', trigger: 'blur' }],
  startDate: [{ required: true, message: '请选择开始日期', trigger: 'change' }],
  endDate: [{ required: true, message: '请选择结束日期', trigger: 'change' }],
  type: [{ required: true, message: '请选择类型', trigger: 'change' }]
})

// 加载学期列表
const fetchSemesters = async () => {
  try {
    const result = await get('/semesters')
    semesterList.value = (result || []).map((s: any) => ({
      id: s.SemesterID || s.id,
      semesterName: s.SemesterName || s.name,
      startDate: s.StartDate ? String(s.StartDate).split(' ')[0] : '',
      endDate: s.EndDate ? String(s.EndDate).split(' ')[0] : '',
      weeks: s.TotalWeeks || 20
    }))
    if (semesterList.value.length > 0 && !selectedSemesterId.value) {
      const active = semesterList.value.find(s => s.id) || semesterList.value[0]
      selectedSemesterId.value = active.id
    }
  } catch (error) {
    console.error('加载学期列表失败:', error)
    ElMessage.error('加载学期列表失败')
  }
}

// 加载节假日列表
const fetchHolidays = async () => {
  holidayLoading.value = true
  try {
    const result = await get('/holidays')
    holidaySchedule.value = result || []
    pagination.current = 1
  } catch (error) {
    console.error('加载节假日列表失败:', error)
    ElMessage.error('加载节假日列表失败')
    holidaySchedule.value = []
  } finally {
    holidayLoading.value = false
  }
}

// 根据节假日生成日历用的日期-名称映射
const holidays = computed(() => {
  const result: { date: string, name: string }[] = []
  holidaySchedule.value.forEach(h => {
    if (!h.startDate || !h.endDate) return
    const start = new Date(h.startDate)
    const end = new Date(h.endDate)
    const cur = new Date(start)
    while (cur <= end) {
      result.push({
        date: cur.toISOString().split('T')[0],
        name: h.name
      })
      cur.setDate(cur.getDate() + 1)
    }
  })
  return result
})

// 新增安排
const handleAddHoliday = () => {
  isHolidayEdit.value = false
  holidayDialogTitle.value = '新增安排'
  resetHolidayForm()
  holidayDialogVisible.value = true
}

// 编辑安排
const handleEditHoliday = (row: any) => {
  isHolidayEdit.value = true
  holidayDialogTitle.value = '编辑安排'
  holidayForm.id = row.id
  holidayForm.name = row.name
  holidayForm.startDate = row.startDate
  holidayForm.endDate = row.endDate
  holidayForm.type = row.type
  holidayForm.isWorkday = row.isWorkday
  holidayForm.remark = row.remark
  holidayDialogVisible.value = true
}

// 删除安排
const handleDeleteHoliday = (id: number) => {
  ElMessageBox.confirm('确定要删除该安排吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  }).then(async () => {
    try {
      await del(`/holidays/${id}`)
      ElMessage.success('删除成功')
      await fetchHolidays()
    } catch (error) {
      ElMessage.error('删除失败')
    }
  }).catch(() => {})
}

// 重置表单
const resetHolidayForm = () => {
  holidayForm.id = 0
  holidayForm.name = ''
  holidayForm.startDate = ''
  holidayForm.endDate = ''
  holidayForm.type = ''
  holidayForm.isWorkday = false
  holidayForm.remark = ''
}

// 处理节假日对话框关闭
const handleHolidayDialogClose = () => {
  holidayFormRef.value?.resetFields()
}

// 格式化日期为 YYYY-MM-DD
const formatDate = (date: any): string => {
  if (!date) return ''
  if (typeof date === 'string') {
    return date.split('T')[0]
  }
  const d = new Date(date)
  if (isNaN(d.getTime())) return ''
  return d.toISOString().split('T')[0]
}

// 处理节假日表单提交
const handleHolidaySubmit = async () => {
  if (!holidayFormRef.value) return
  await holidayFormRef.value.validate(async (valid) => {
    if (valid) {
      try {
        const payload = {
          Name: holidayForm.name,
          StartDate: formatDate(holidayForm.startDate),
          EndDate: formatDate(holidayForm.endDate),
          Type: holidayForm.type,
          IsWorkday: holidayForm.isWorkday,
          Remark: holidayForm.remark,
          Status: 1
        }
        if (isHolidayEdit.value) {
          await put(`/holidays/${holidayForm.id}`, payload)
          ElMessage.success('更新成功')
        } else {
          await post('/holidays', payload)
          ElMessage.success('创建成功')
        }
        holidayDialogVisible.value = false
        await fetchHolidays()
      } catch (error) {
        console.error(error)
        ElMessage.error(isHolidayEdit.value ? '更新失败' : '创建失败')
      }
    }
  })
}

// 分页方法
const handleSizeChange = (size: number) => {
  pagination.pageSize = size
  pagination.current = 1
}

const handleCurrentChange = (page: number) => {
  pagination.current = page
}

// 计算某周的日期
const getWeekDays = (week: number) => {
  if (!currentSemester.value || !currentSemester.value.startDate) return []

  const startDate = new Date(currentSemester.value.startDate)
  if (isNaN(startDate.getTime())) return []
  const weekStart = new Date(startDate)
  weekStart.setDate(startDate.getDate() + (week - 1) * 7)

  const days = []
  for (let i = 0; i < 7; i++) {
    const date = new Date(weekStart)
    date.setDate(weekStart.getDate() + i)
    days.push(date.toISOString().split('T')[0])
  }
  return days
}

// 判断是否是节假日
const isHoliday = (date: string) => {
  return holidays.value.some(holiday => holiday.date === date)
}

// 判断是否是调休日
const isWorkday = (date: string) => {
  return holidaySchedule.value.some(h => h.isWorkday && h.startDate && h.endDate && date >= h.startDate && date <= h.endDate)
}

// 获取节假日名称
const getHolidayName = (date: string) => {
  const holiday = holidays.value.find(holiday => holiday.date === date)
  return holiday ? holiday.name : ''
}

// 获取调休日名称
const getWorkdayName = (date: string) => {
  if (isWorkday(date)) return '调休'
  return ''
}

// 获取某天的事件（考试安排）
const getEvents = (week: number, day: number) => {
  const weekDays = getWeekDays(week)
  if (!weekDays[day]) return []
  
  const date = weekDays[day]
  const events = holidaySchedule.value
    .filter(h => h.type === '考试' && h.startDate && h.endDate && date >= h.startDate && date <= h.endDate)
    .map(h => ({ id: h.id, week, day: day + 1, name: h.name, type: 'exam' }))
  
  return events
}

const handleRefresh = async () => {
  loading.value = true
  try {
    await fetchSemesters()
    await fetchHolidays()
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  await fetchSemesters()
  await fetchHolidays()
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
}

.semester-select {
  width: 200px;
}

.calendar-container {
  padding: 20px;
}

.calendar-header {
  margin-bottom: 20px;
}

.calendar-header h2 {
  margin: 0 0 10px 0;
  font-size: 20px;
  font-weight: bold;
}

.calendar-info {
  display: flex;
  gap: 20px;
  font-size: 14px;
  color: #606266;
}

.calendar-grid {
  width: 100%;
  border-collapse: collapse;
}

.week-header {
  display: flex;
  background-color: #f5f7fa;
  border-bottom: 2px solid #e4e7ed;
}

.week-row {
  display: flex;
  border-bottom: 1px solid #ebeef5;
}

.week-row:hover {
  background-color: #f5f7fa;
}

.week-cell {
  flex: 1;
  padding: 10px;
  text-align: center;
  border-right: 1px solid #ebeef5;
  min-height: 80px;
  display: flex;
  flex-direction: column;
}

.week-cell:last-child {
  border-right: none;
}

.week-number {
  font-weight: bold;
  background-color: #f0f9ff;
}

.week-cell.holiday {
  background-color: #fef0f0;
}

.week-cell.workday {
  background-color: #f0f9ff;
}

.holiday-name {
  font-size: 12px;
  color: #f56c6c;
  margin: 2px 0;
}

.workday-name {
  font-size: 12px;
  color: #409eff;
  margin: 2px 0;
}

.date {
  font-size: 14px;
  margin-bottom: 5px;
}

.events {
  margin-top: 5px;
}

.event-item {
  font-size: 12px;
  padding: 2px 4px;
  margin-bottom: 2px;
  border-radius: 2px;
}

.event-item.exam {
  background-color: #e6a23c;
  color: white;
}

.empty-state {
  padding: 40px 0;
  text-align: center;
}

@media (max-width: 768px) {
  .calendar-info {
    flex-direction: column;
    gap: 5px;
  }
  
  .week-cell {
    min-height: 60px;
    padding: 5px;
  }
  
  .event-item {
    font-size: 10px;
  }
}

.holiday-schedule {
  margin-top: 30px;
  padding: 20px;
  background-color: #f9f9f9;
  border-radius: 4px;
}

.schedule-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.schedule-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: bold;
  color: #303133;
}

.pagination {
  margin-top: 20px;
  text-align: right;
}
</style>