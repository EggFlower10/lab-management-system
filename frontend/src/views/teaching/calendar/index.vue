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
          <h2>{{ currentSemester.semesterName || '请选择学期' }}</h2>
          <div class="calendar-info">
            <span>开始日期：{{ currentSemester.startDate || '--' }}</span>
            <span>结束日期：{{ currentSemester.endDate || '--' }}</span>
            <span>总周数：{{ currentSemester.weeks || 0 }}周</span>
          </div>
        </div>
        <div class="calendar-grid" v-if="currentSemester.semesterName">
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
      
      <!-- 节假日安排表格 -->
      <div class="holiday-schedule" v-if="currentSemester.semesterName">
        <div class="schedule-header">
          <h3>节假日安排</h3>
          <el-button type="primary" @click="handleAddHoliday">
            <el-icon><Plus /></el-icon>新增节假日
          </el-button>
        </div>
        <el-table
          :data="filteredHolidays"
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

      <!-- 节假日编辑对话框 -->
      <el-dialog v-model="holidayDialogVisible" :title="holidayDialogTitle" width="500px" @close="handleHolidayDialogClose">
        <el-form ref="holidayFormRef" :model="holidayForm" :rules="holidayRules" label-width="100px">
          <el-form-item label="名称" prop="name">
            <el-input v-model="holidayForm.name" placeholder="请输入节假日名称" />
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
import { ref, reactive, computed } from 'vue'
import { Refresh, Plus } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox, FormInstance, FormRules } from 'element-plus'

const semesterList = ref<any[]>([
  {
    id: 1,
    semesterName: '2026-2027学年第一学期',
    startDate: '2026-09-01',
    endDate: '2027-01-15',
    weeks: 20
  },
  {
    id: 2,
    semesterName: '2026-2027学年第二学期',
    startDate: '2027-02-20',
    endDate: '2027-06-30',
    weeks: 20
  },
  {
    id: 3,
    semesterName: '2025-2026学年第一学期',
    startDate: '2025-09-01',
    endDate: '2026-01-15',
    weeks: 20
  },
  {
    id: 4,
    semesterName: '2025-2026学年第二学期',
    startDate: '2026-02-20',
    endDate: '2026-06-30',
    weeks: 20
  },
  {
    id: 5,
    semesterName: '2024-2025学年第一学期',
    startDate: '2024-09-01',
    endDate: '2025-01-15',
    weeks: 20
  },
  {
    id: 6,
    semesterName: '2024-2025学年第二学期',
    startDate: '2025-02-20',
    endDate: '2025-06-30',
    weeks: 20
  }
])

const selectedSemesterId = ref(1)

const currentSemester = computed(() => {
  return semesterList.value.find(semester => semester.id === selectedSemesterId.value) || semesterList.value[0]
})

// 节假日安排数据
const holidaySchedule = ref([
  // 2026-2027学年第一学期（2026-09-01 至 2027-01-15）
  { id: 1, name: '中秋节', startDate: '2026-09-15', endDate: '2026-09-17', type: '节假日', isWorkday: false, remark: '法定节假日' },
  { id: 2, name: '国庆节', startDate: '2026-10-01', endDate: '2026-10-07', type: '节假日', isWorkday: false, remark: '法定节假日' },
  { id: 3, name: '元旦', startDate: '2026-12-31', endDate: '2027-01-02', type: '节假日', isWorkday: false, remark: '法定节假日' },
  { id: 4, name: '期末考试', startDate: '2026-12-26', endDate: '2027-01-06', type: '考试', isWorkday: true, remark: '期末考试周' },
  { id: 5, name: '寒假', startDate: '2027-01-16', endDate: '2027-02-19', type: '假期', isWorkday: false, remark: '寒假假期' },
  
  // 2026-2027学年第二学期（2027-02-20 至 2027-06-30）
  { id: 6, name: '春节', startDate: '2027-02-20', endDate: '2027-02-22', type: '节假日', isWorkday: false, remark: '法定节假日' },
  { id: 7, name: '清明节', startDate: '2027-04-05', endDate: '2027-04-07', type: '节假日', isWorkday: false, remark: '法定节假日' },
  { id: 8, name: '劳动节', startDate: '2027-05-01', endDate: '2027-05-05', type: '节假日', isWorkday: false, remark: '法定节假日' },
  { id: 9, name: '端午节', startDate: '2027-06-20', endDate: '2027-06-22', type: '节假日', isWorkday: false, remark: '法定节假日' },
  { id: 10, name: '暑假', startDate: '2027-07-01', endDate: '2027-08-31', type: '假期', isWorkday: false, remark: '暑期假期' },
  
  // 2025-2026学年第二学期（2026-02-20 至 2026-06-30）
  { id: 11, name: '清明节', startDate: '2026-04-05', endDate: '2026-04-07', type: '节假日', isWorkday: false, remark: '法定节假日' },
  { id: 12, name: '劳动节', startDate: '2026-05-01', endDate: '2026-05-05', type: '节假日', isWorkday: false, remark: '法定节假日' },
  { id: 13, name: '端午节', startDate: '2026-06-20', endDate: '2026-06-22', type: '节假日', isWorkday: false, remark: '法定节假日' },
  { id: 14, name: '暑假', startDate: '2026-07-01', endDate: '2026-08-31', type: '假期', isWorkday: false, remark: '暑期假期' },
  { id: 15, name: '期末考试', startDate: '2026-07-01', endDate: '2026-07-10', type: '考试', isWorkday: true, remark: '期末考试周' }
])

// 过滤后的节假日数据（根据当前学期）
const filteredHolidays = computed(() => {
  if (!currentSemester.value) return []
  
  const startDate = currentSemester.value.startDate
  const endDate = currentSemester.value.endDate
  
  return holidaySchedule.value.filter(holiday => {
    return holiday.startDate >= startDate && holiday.startDate <= endDate
  })
})

// 分页数据
const pagination = reactive({
  current: 1,
  pageSize: 10
})

// 节假日编辑对话框相关数据
const holidayDialogVisible = ref(false)
const holidayDialogTitle = ref('新增节假日')
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
  name: [{ required: true, message: '请输入节假日名称', trigger: 'blur' }],
  startDate: [{ required: true, message: '请选择开始日期', trigger: 'change' }],
  endDate: [{ required: true, message: '请选择结束日期', trigger: 'change' }],
  type: [{ required: true, message: '请选择类型', trigger: 'change' }]
})

// 新增节假日
const handleAddHoliday = () => {
  isHolidayEdit.value = false
  holidayDialogTitle.value = '新增节假日'
  resetHolidayForm()
  holidayDialogVisible.value = true
}

// 编辑节假日
const handleEditHoliday = (row: any) => {
  isHolidayEdit.value = true
  holidayDialogTitle.value = '编辑节假日'
  holidayForm.id = row.id
  holidayForm.name = row.name
  holidayForm.startDate = row.startDate
  holidayForm.endDate = row.endDate
  holidayForm.type = row.type
  holidayForm.isWorkday = row.isWorkday
  holidayForm.remark = row.remark
  holidayDialogVisible.value = true
}

// 删除节假日
const handleDeleteHoliday = (id: number) => {
  ElMessageBox.confirm('确定要删除该节假日吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  }).then(() => {
    const index = holidaySchedule.value.findIndex(item => item.id === id)
    if (index !== -1) {
      holidaySchedule.value.splice(index, 1)
      ElMessage.success('删除成功')
    }
  })
}

// 重置节假日表单
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

// 处理节假日表单提交
const handleHolidaySubmit = async () => {
  if (!holidayFormRef.value) return
  await holidayFormRef.value.validate(async (valid) => {
    if (valid) {
      try {
        if (isHolidayEdit.value) {
          // 更新现有节假日
          const index = holidaySchedule.value.findIndex(item => item.id === holidayForm.id)
          if (index !== -1) {
            holidaySchedule.value[index] = { ...holidayForm }
          }
          ElMessage.success('更新成功')
        } else {
          // 新增节假日
          const maxId = Math.max(...holidaySchedule.value.map(item => item.id))
          const newHoliday = {
            ...holidayForm,
            id: maxId + 1
          }
          holidaySchedule.value.push(newHoliday)
          ElMessage.success('创建成功')
        }
        holidayDialogVisible.value = false
      } catch (error) {
        console.error(error)
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

// 节假日数据（按学期分类）
const holidays = ref([
  // 2025-2026学年第二学期（2026-02-20 至 2026-06-30）
  { date: '2026-02-20', name: '春节' },
  { date: '2026-02-21', name: '春节' },
  { date: '2026-02-22', name: '春节' },
  { date: '2026-04-05', name: '清明节' },
  { date: '2026-05-01', name: '劳动节' },
  { date: '2026-06-20', name: '端午节' },
  { date: '2026-07-01', name: '暑假' },
  { date: '2026-07-02', name: '暑假' },
  { date: '2026-07-03', name: '暑假' },
  { date: '2026-07-04', name: '暑假' },
  { date: '2026-07-05', name: '暑假' },
  { date: '2026-07-06', name: '暑假' },
  { date: '2026-07-07', name: '暑假' },
  { date: '2026-07-08', name: '暑假' },
  { date: '2026-07-09', name: '暑假' },
  { date: '2026-07-10', name: '暑假' },
  { date: '2026-07-11', name: '暑假' },
  { date: '2026-07-12', name: '暑假' },
  { date: '2026-07-13', name: '暑假' },
  { date: '2026-07-14', name: '暑假' },
  { date: '2026-07-15', name: '暑假' },
  { date: '2026-07-16', name: '暑假' },
  { date: '2026-07-17', name: '暑假' },
  { date: '2026-07-18', name: '暑假' },
  { date: '2026-07-19', name: '暑假' },
  { date: '2026-07-20', name: '暑假' },
  { date: '2026-07-21', name: '暑假' },
  { date: '2026-07-22', name: '暑假' },
  { date: '2026-07-23', name: '暑假' },
  { date: '2026-07-24', name: '暑假' },
  { date: '2026-07-25', name: '暑假' },
  { date: '2026-07-26', name: '暑假' },
  { date: '2026-07-27', name: '暑假' },
  { date: '2026-07-28', name: '暑假' },
  { date: '2026-07-29', name: '暑假' },
  { date: '2026-07-30', name: '暑假' },
  { date: '2026-07-31', name: '暑假' },
  { date: '2026-08-01', name: '暑假' },
  { date: '2026-08-02', name: '暑假' },
  { date: '2026-08-03', name: '暑假' },
  { date: '2026-08-04', name: '暑假' },
  { date: '2026-08-05', name: '暑假' },
  { date: '2026-08-06', name: '暑假' },
  { date: '2026-08-07', name: '暑假' },
  { date: '2026-08-08', name: '暑假' },
  { date: '2026-08-09', name: '暑假' },
  { date: '2026-08-10', name: '暑假' },
  { date: '2026-08-11', name: '暑假' },
  { date: '2026-08-12', name: '暑假' },
  { date: '2026-08-13', name: '暑假' },
  { date: '2026-08-14', name: '暑假' },
  { date: '2026-08-15', name: '暑假' },
  { date: '2026-08-16', name: '暑假' },
  { date: '2026-08-17', name: '暑假' },
  { date: '2026-08-18', name: '暑假' },
  { date: '2026-08-19', name: '暑假' },
  { date: '2026-08-20', name: '暑假' },
  { date: '2026-08-21', name: '暑假' },
  { date: '2026-08-22', name: '暑假' },
  { date: '2026-08-23', name: '暑假' },
  { date: '2026-08-24', name: '暑假' },
  { date: '2026-08-25', name: '暑假' },
  { date: '2026-08-26', name: '暑假' },
  { date: '2026-08-27', name: '暑假' },
  { date: '2026-08-28', name: '暑假' },
  { date: '2026-08-29', name: '暑假' },
  { date: '2026-08-30', name: '暑假' },
  { date: '2026-08-31', name: '暑假' },
  
  // 2025-2026学年第一学期（2025-09-01 至 2026-01-15）
  { date: '2025-09-15', name: '中秋节' },
  { date: '2025-10-01', name: '国庆节' },
  { date: '2025-10-02', name: '国庆节' },
  { date: '2025-10-03', name: '国庆节' },
  { date: '2025-10-04', name: '国庆节' },
  { date: '2025-10-05', name: '国庆节' },
  { date: '2025-10-06', name: '国庆节' },
  { date: '2025-10-07', name: '国庆节' },
  { date: '2025-12-31', name: '元旦' },
  { date: '2026-01-01', name: '元旦' },
  { date: '2026-01-02', name: '元旦' },
  { date: '2026-01-16', name: '寒假' },
  { date: '2026-01-17', name: '寒假' },
  { date: '2026-01-18', name: '寒假' },
  { date: '2026-01-19', name: '寒假' },
  { date: '2026-01-20', name: '寒假' },
  { date: '2026-01-21', name: '寒假' },
  { date: '2026-01-22', name: '寒假' },
  { date: '2026-01-23', name: '寒假' },
  { date: '2026-01-24', name: '寒假' },
  { date: '2026-01-25', name: '寒假' },
  { date: '2026-01-26', name: '寒假' },
  { date: '2026-01-27', name: '寒假' },
  { date: '2026-01-28', name: '寒假' },
  { date: '2026-01-29', name: '寒假' },
  { date: '2026-01-30', name: '寒假' },
  { date: '2026-01-31', name: '寒假' },
  { date: '2026-02-01', name: '寒假' },
  { date: '2026-02-02', name: '寒假' },
  { date: '2026-02-03', name: '寒假' },
  { date: '2026-02-04', name: '寒假' },
  { date: '2026-02-05', name: '寒假' },
  { date: '2026-02-06', name: '寒假' },
  { date: '2026-02-07', name: '寒假' },
  { date: '2026-02-08', name: '寒假' },
  { date: '2026-02-09', name: '寒假' },
  { date: '2026-02-10', name: '寒假' },
  { date: '2026-02-11', name: '寒假' },
  { date: '2026-02-12', name: '寒假' },
  { date: '2026-02-13', name: '寒假' },
  { date: '2026-02-14', name: '寒假' },
  { date: '2026-02-15', name: '寒假' },
  { date: '2026-02-16', name: '寒假' },
  { date: '2026-02-17', name: '寒假' },
  
  // 2026-2027学年第一学期（2026-09-01 至 2027-01-15）
  { date: '2026-09-15', name: '中秋节' },
  { date: '2026-10-01', name: '国庆节' },
  { date: '2026-10-02', name: '国庆节' },
  { date: '2026-10-03', name: '国庆节' },
  { date: '2026-10-04', name: '国庆节' },
  { date: '2026-10-05', name: '国庆节' },
  { date: '2026-10-06', name: '国庆节' },
  { date: '2026-10-07', name: '国庆节' },
  { date: '2026-12-31', name: '元旦' },
  { date: '2027-01-01', name: '元旦' },
  { date: '2027-01-02', name: '元旦' },
  { date: '2027-01-16', name: '寒假' },
  { date: '2027-01-17', name: '寒假' },
  { date: '2027-01-18', name: '寒假' },
  { date: '2027-01-19', name: '寒假' },
  { date: '2027-01-20', name: '寒假' },
  { date: '2027-01-21', name: '寒假' },
  { date: '2027-01-22', name: '寒假' },
  { date: '2027-01-23', name: '寒假' },
  { date: '2027-01-24', name: '寒假' },
  { date: '2027-01-25', name: '寒假' },
  { date: '2027-01-26', name: '寒假' },
  { date: '2027-01-27', name: '寒假' },
  { date: '2027-01-28', name: '寒假' },
  { date: '2027-01-29', name: '寒假' },
  { date: '2027-01-30', name: '寒假' },
  { date: '2027-01-31', name: '寒假' },
  { date: '2027-02-01', name: '寒假' },
  { date: '2027-02-02', name: '寒假' },
  { date: '2027-02-03', name: '寒假' },
  { date: '2027-02-04', name: '寒假' },
  { date: '2027-02-05', name: '寒假' },
  { date: '2027-02-06', name: '寒假' },
  { date: '2027-02-07', name: '寒假' },
  { date: '2027-02-08', name: '寒假' },
  { date: '2027-02-09', name: '寒假' },
  { date: '2027-02-10', name: '寒假' },
  { date: '2027-02-11', name: '寒假' },
  { date: '2027-02-12', name: '寒假' },
  { date: '2027-02-13', name: '寒假' },
  { date: '2027-02-14', name: '寒假' },
  { date: '2027-02-15', name: '寒假' },
  { date: '2027-02-16', name: '寒假' },
  { date: '2027-02-17', name: '寒假' },
  
  // 2026-2027学年第二学期（2027-02-20 至 2027-06-30）
  { date: '2027-02-20', name: '春节' },
  { date: '2027-02-21', name: '春节' },
  { date: '2027-02-22', name: '春节' },
  { date: '2027-04-05', name: '清明节' },
  { date: '2027-05-01', name: '劳动节' },
  { date: '2027-06-20', name: '端午节' },
  { date: '2027-07-01', name: '暑假' },
  { date: '2027-07-02', name: '暑假' },
  { date: '2027-07-03', name: '暑假' },
  { date: '2027-07-04', name: '暑假' },
  { date: '2027-07-05', name: '暑假' },
  { date: '2027-07-06', name: '暑假' },
  { date: '2027-07-07', name: '暑假' },
  { date: '2027-07-08', name: '暑假' },
  { date: '2027-07-09', name: '暑假' },
  { date: '2027-07-10', name: '暑假' },
  { date: '2027-07-11', name: '暑假' },
  { date: '2027-07-12', name: '暑假' },
  { date: '2027-07-13', name: '暑假' },
  { date: '2027-07-14', name: '暑假' },
  { date: '2027-07-15', name: '暑假' },
  { date: '2027-07-16', name: '暑假' },
  { date: '2027-07-17', name: '暑假' },
  { date: '2027-07-18', name: '暑假' },
  { date: '2027-07-19', name: '暑假' },
  { date: '2027-07-20', name: '暑假' },
  { date: '2027-07-21', name: '暑假' },
  { date: '2027-07-22', name: '暑假' },
  { date: '2027-07-23', name: '暑假' },
  { date: '2027-07-24', name: '暑假' },
  { date: '2027-07-25', name: '暑假' },
  { date: '2027-07-26', name: '暑假' },
  { date: '2027-07-27', name: '暑假' },
  { date: '2027-07-28', name: '暑假' },
  { date: '2027-07-29', name: '暑假' },
  { date: '2027-07-30', name: '暑假' },
  { date: '2027-07-31', name: '暑假' },
  { date: '2027-08-01', name: '暑假' },
  { date: '2027-08-02', name: '暑假' },
  { date: '2027-08-03', name: '暑假' },
  { date: '2027-08-04', name: '暑假' },
  { date: '2027-08-05', name: '暑假' },
  { date: '2027-08-06', name: '暑假' },
  { date: '2027-08-07', name: '暑假' },
  { date: '2027-08-08', name: '暑假' },
  { date: '2027-08-09', name: '暑假' },
  { date: '2027-08-10', name: '暑假' },
  { date: '2027-08-11', name: '暑假' },
  { date: '2027-08-12', name: '暑假' },
  { date: '2027-08-13', name: '暑假' },
  { date: '2027-08-14', name: '暑假' },
  { date: '2027-08-15', name: '暑假' },
  { date: '2027-08-16', name: '暑假' },
  { date: '2027-08-17', name: '暑假' },
  { date: '2027-08-18', name: '暑假' },
  { date: '2027-08-19', name: '暑假' },
  { date: '2027-08-20', name: '暑假' },
  { date: '2027-08-21', name: '暑假' },
  { date: '2027-08-22', name: '暑假' },
  { date: '2027-08-23', name: '暑假' },
  { date: '2027-08-24', name: '暑假' },
  { date: '2027-08-25', name: '暑假' },
  { date: '2027-08-26', name: '暑假' },
  { date: '2027-08-27', name: '暑假' },
  { date: '2027-08-28', name: '暑假' },
  { date: '2027-08-29', name: '暑假' },
  { date: '2027-08-30', name: '暑假' },
  { date: '2027-08-31', name: '暑假' },
  
  // 2024-2025学年第一学期（2024-09-01 至 2025-01-15）
  { date: '2024-09-15', name: '中秋节' },
  { date: '2024-10-01', name: '国庆节' },
  { date: '2024-10-02', name: '国庆节' },
  { date: '2024-10-03', name: '国庆节' },
  { date: '2024-10-04', name: '国庆节' },
  { date: '2024-10-05', name: '国庆节' },
  { date: '2024-10-06', name: '国庆节' },
  { date: '2024-10-07', name: '国庆节' },
  { date: '2024-12-31', name: '元旦' },
  { date: '2025-01-01', name: '元旦' },
  { date: '2025-01-02', name: '元旦' },
  { date: '2025-01-16', name: '寒假' },
  { date: '2025-01-17', name: '寒假' },
  { date: '2025-01-18', name: '寒假' },
  { date: '2025-01-19', name: '寒假' },
  { date: '2025-01-20', name: '寒假' },
  { date: '2025-01-21', name: '寒假' },
  { date: '2025-01-22', name: '寒假' },
  { date: '2025-01-23', name: '寒假' },
  { date: '2025-01-24', name: '寒假' },
  { date: '2025-01-25', name: '寒假' },
  { date: '2025-01-26', name: '寒假' },
  { date: '2025-01-27', name: '寒假' },
  { date: '2025-01-28', name: '寒假' },
  { date: '2025-01-29', name: '寒假' },
  { date: '2025-01-30', name: '寒假' },
  { date: '2025-01-31', name: '寒假' },
  { date: '2025-02-01', name: '寒假' },
  { date: '2025-02-02', name: '寒假' },
  { date: '2025-02-03', name: '寒假' },
  { date: '2025-02-04', name: '寒假' },
  { date: '2025-02-05', name: '寒假' },
  { date: '2025-02-06', name: '寒假' },
  { date: '2025-02-07', name: '寒假' },
  { date: '2025-02-08', name: '寒假' },
  { date: '2025-02-09', name: '寒假' },
  { date: '2025-02-10', name: '寒假' },
  { date: '2025-02-11', name: '寒假' },
  { date: '2025-02-12', name: '寒假' },
  { date: '2025-02-13', name: '寒假' },
  { date: '2025-02-14', name: '寒假' },
  { date: '2025-02-15', name: '寒假' },
  { date: '2025-02-16', name: '寒假' },
  { date: '2025-02-17', name: '寒假' },
  
  // 2024-2025学年第二学期（2025-02-20 至 2025-06-30）
  { date: '2025-02-20', name: '春节' },
  { date: '2025-02-21', name: '春节' },
  { date: '2025-02-22', name: '春节' },
  { date: '2025-04-05', name: '清明节' },
  { date: '2025-05-01', name: '劳动节' },
  { date: '2025-06-20', name: '端午节' },
  { date: '2025-07-01', name: '暑假' },
  { date: '2025-07-02', name: '暑假' },
  { date: '2025-07-03', name: '暑假' },
  { date: '2025-07-04', name: '暑假' },
  { date: '2025-07-05', name: '暑假' },
  { date: '2025-07-06', name: '暑假' },
  { date: '2025-07-07', name: '暑假' },
  { date: '2025-07-08', name: '暑假' },
  { date: '2025-07-09', name: '暑假' },
  { date: '2025-07-10', name: '暑假' },
  { date: '2025-07-11', name: '暑假' },
  { date: '2025-07-12', name: '暑假' },
  { date: '2025-07-13', name: '暑假' },
  { date: '2025-07-14', name: '暑假' },
  { date: '2025-07-15', name: '暑假' },
  { date: '2025-07-16', name: '暑假' },
  { date: '2025-07-17', name: '暑假' },
  { date: '2025-07-18', name: '暑假' },
  { date: '2025-07-19', name: '暑假' },
  { date: '2025-07-20', name: '暑假' },
  { date: '2025-07-21', name: '暑假' },
  { date: '2025-07-22', name: '暑假' },
  { date: '2025-07-23', name: '暑假' },
  { date: '2025-07-24', name: '暑假' },
  { date: '2025-07-25', name: '暑假' },
  { date: '2025-07-26', name: '暑假' },
  { date: '2025-07-27', name: '暑假' },
  { date: '2025-07-28', name: '暑假' },
  { date: '2025-07-29', name: '暑假' },
  { date: '2025-07-30', name: '暑假' },
  { date: '2025-07-31', name: '暑假' },
  { date: '2025-08-01', name: '暑假' },
  { date: '2025-08-02', name: '暑假' },
  { date: '2025-08-03', name: '暑假' },
  { date: '2025-08-04', name: '暑假' },
  { date: '2025-08-05', name: '暑假' },
  { date: '2025-08-06', name: '暑假' },
  { date: '2025-08-07', name: '暑假' },
  { date: '2025-08-08', name: '暑假' },
  { date: '2025-08-09', name: '暑假' },
  { date: '2025-08-10', name: '暑假' },
  { date: '2025-08-11', name: '暑假' },
  { date: '2025-08-12', name: '暑假' },
  { date: '2025-08-13', name: '暑假' },
  { date: '2025-08-14', name: '暑假' },
  { date: '2025-08-15', name: '暑假' },
  { date: '2025-08-16', name: '暑假' },
  { date: '2025-08-17', name: '暑假' },
  { date: '2025-08-18', name: '暑假' },
  { date: '2025-08-19', name: '暑假' },
  { date: '2025-08-20', name: '暑假' },
  { date: '2025-08-21', name: '暑假' },
  { date: '2025-08-22', name: '暑假' },
  { date: '2025-08-23', name: '暑假' },
  { date: '2025-08-24', name: '暑假' },
  { date: '2025-08-25', name: '暑假' },
  { date: '2025-08-26', name: '暑假' },
  { date: '2025-08-27', name: '暑假' },
  { date: '2025-08-28', name: '暑假' },
  { date: '2025-08-29', name: '暑假' },
  { date: '2025-08-30', name: '暑假' },
  { date: '2025-08-31', name: '暑假' }
])

// 调休数据（按学期分类）
const workdays = ref([
  // 2026-2027学年第一学期
  { date: '2026-09-14', name: '调休' },
  { date: '2026-09-27', name: '调休' },
  { date: '2026-10-08', name: '调休' },
  { date: '2026-10-11', name: '调休' },
  { date: '2026-12-28', name: '调休' },
  { date: '2026-12-30', name: '调休' },
  
  // 2026-2027学年第二学期
  { date: '2027-02-18', name: '调休' },
  { date: '2027-02-19', name: '调休' },
  { date: '2027-04-06', name: '调休' },
  { date: '2027-04-30', name: '调休' },
  { date: '2027-05-02', name: '调休' },
  { date: '2027-06-19', name: '调休' },
  
  // 2025-2026学年第一学期
  { date: '2025-09-14', name: '调休' },
  { date: '2025-09-27', name: '调休' },
  { date: '2025-10-08', name: '调休' },
  { date: '2025-10-11', name: '调休' },
  { date: '2025-12-28', name: '调休' },
  { date: '2025-12-30', name: '调休' },
  
  // 2025-2026学年第二学期
  { date: '2026-02-18', name: '调休' },
  { date: '2026-02-19', name: '调休' },
  { date: '2026-04-06', name: '调休' },
  { date: '2026-04-30', name: '调休' },
  { date: '2026-05-02', name: '调休' },
  { date: '2026-06-19', name: '调休' },
  
  // 2024-2025学年第一学期
  { date: '2024-09-14', name: '调休' },
  { date: '2024-09-27', name: '调休' },
  { date: '2024-10-08', name: '调休' },
  { date: '2024-10-11', name: '调休' },
  { date: '2024-12-28', name: '调休' },
  { date: '2024-12-30', name: '调休' },
  
  // 2024-2025学年第二学期
  { date: '2025-02-18', name: '调休' },
  { date: '2025-02-19', name: '调休' },
  { date: '2025-04-06', name: '调休' },
  { date: '2025-04-30', name: '调休' },
  { date: '2025-05-02', name: '调休' },
  { date: '2025-06-19', name: '调休' }
])

// 考试安排数据
const examSchedule = ref([
  { id: 1, week: 18, day: 1, name: '期末考试', type: 'exam' },
  { id: 2, week: 18, day: 2, name: '期末考试', type: 'exam' },
  { id: 3, week: 18, day: 3, name: '期末考试', type: 'exam' },
  { id: 4, week: 18, day: 4, name: '期末考试', type: 'exam' },
  { id: 5, week: 18, day: 5, name: '期末考试', type: 'exam' },
  { id: 6, week: 19, day: 1, name: '期末考试', type: 'exam' },
  { id: 7, week: 19, day: 2, name: '期末考试', type: 'exam' },
  { id: 8, week: 19, day: 3, name: '期末考试', type: 'exam' }
])

// 计算某周的日期
const getWeekDays = (week: number) => {
  if (!currentSemester.value) return []
  
  const startDate = new Date(currentSemester.value.startDate)
  // 计算第week周的开始日期（周一）
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
  return workdays.value.some(workday => workday.date === date)
}

// 获取节假日名称
const getHolidayName = (date: string) => {
  const holiday = holidays.value.find(holiday => holiday.date === date)
  return holiday ? holiday.name : ''
}

// 获取调休日名称
const getWorkdayName = (date: string) => {
  const workday = workdays.value.find(workday => workday.date === date)
  return workday ? workday.name : ''
}

// 获取某天的事件
const getEvents = (week: number, day: number) => {
  return examSchedule.value.filter(item => item.week === week && item.day === day + 1)
}

const handleRefresh = () => {
  // 刷新校历数据
  console.log('刷新校历')
}
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