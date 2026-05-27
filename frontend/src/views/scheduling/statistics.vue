<template>
  <div class="statistics-container">
    <!-- 页面头部 -->
    <el-card class="header-card">
      <div class="page-header">
        <h1>排课数据统计</h1>
        <div class="header-controls">
          <el-radio-group v-model="viewMode" size="default">
            <el-radio-button label="realtime">日常监控</el-radio-button>
            <el-radio-button label="statistics">阶段统计</el-radio-button>
          </el-radio-group>
          <el-date-picker
            v-if="viewMode === 'statistics'"
            v-model="dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            @change="handleDateChange"
            style="margin-left: 10px;"
          />
          <el-button type="success" @click="handleExport" style="margin-left: 10px;">导出报表</el-button>
        </div>
      </div>
    </el-card>

    <!-- 统计筛选 -->
    <el-card v-if="viewMode === 'statistics'" class="filter-card">
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
        <el-form-item label="周次">
          <el-input-number v-model="searchForm.weekNo" :min="1" :max="20" @change="handleSearch" style="width: 100px;" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">查询</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 实时概览卡片 -->
    <el-row :gutter="20" class="overview-row">
      <el-col :span="6">
        <el-card shadow="hover" class="overview-card">
          <div class="overview-item">
            <div class="overview-icon" style="background-color: #409eff">
              <el-icon :size="24"><Calendar /></el-icon>
            </div>
            <div class="overview-content">
              <div class="overview-value">{{ overviewStats.totalScheduling }}</div>
              <div class="overview-label">排课总数</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="overview-card">
          <div class="overview-item">
            <div class="overview-icon" style="background-color: #67c23a">
              <el-icon :size="24"><Clock /></el-icon>
            </div>
            <div class="overview-content">
              <div class="overview-value">{{ overviewStats.totalHours }}</div>
              <div class="overview-label">总课时数</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="overview-card">
          <div class="overview-item">
            <div class="overview-icon" style="background-color: #e6a23c">
              <el-icon :size="24"><OfficeBuilding /></el-icon>
            </div>
            <div class="overview-content">
              <div class="overview-value">{{ overviewStats.occupiedCount }}</div>
              <div class="overview-label">当前使用</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="overview-card">
          <div class="overview-item">
            <div class="overview-icon" style="background-color: #f56c6c">
              <el-icon :size="24"><CircleCheck /></el-icon>
            </div>
            <div class="overview-content">
              <div class="overview-value">{{ overviewStats.registrationRate }}%</div>
              <div class="overview-label">登记完成率</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 统计报表标签页 -->
    <el-card class="report-card">
      <template #header>
        <span>统计报表</span>
      </template>
      <el-tabs v-model="activeTab" type="card" class="statistics-tabs">
        <el-tab-pane label="每周课室使用汇总" name="weekly">
          <el-table :data="weeklyUsageList" border stripe>
            <el-table-column type="index" label="序号" width="60" />
            <el-table-column prop="building_name" label="楼宇" width="120" />
            <el-table-column prop="room_name" label="实验室" width="150" />
            <el-table-column prop="week_no" label="周次" width="80" />
            <el-table-column prop="scheduled_slots" label="排课节数" width="100" />
            <el-table-column prop="free_slots" label="空闲节数" width="100" />
            <el-table-column prop="usage_rate" label="使用率" width="150">
              <template #default="{ row }">
                <el-progress :percentage="row.usage_rate" :stroke-width="10" />
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>

        <el-tab-pane label="实验室使用人次统计" name="personnel">
          <el-form :inline="true" :model="personnelFilter" class="filter-form">
            <el-form-item label="统计维度">
              <el-select v-model="personnelFilter.dimension" @change="loadPersonnelStatistics" style="width: 150px;">
                <el-option label="按楼宇" value="building" />
                <el-option label="按房间" value="room" />
              </el-select>
            </el-form-item>
          </el-form>
          <el-table :data="personnelStatistics" border stripe>
            <el-table-column type="index" label="序号" width="60" />
            <el-table-column prop="name" label="名称" min-width="150" />
            <el-table-column prop="total_personnel" label="使用人次" width="120" />
            <el-table-column prop="avg_daily" label="日均人次" width="120" />
          </el-table>
        </el-tab-pane>

        <el-tab-pane label="分专业统计" name="major">
          <el-table :data="majorStatistics" border stripe>
            <el-table-column type="index" label="序号" width="60" />
            <el-table-column prop="major_name" label="专业" min-width="150" />
            <el-table-column prop="total_hours" label="使用课时" width="120" />
            <el-table-column prop="course_count" label="课程数" width="100" />
            <el-table-column prop="student_count" label="学生数" width="100" />
            <el-table-column label="占比" width="100">
              <template #default="{ row }">
                {{ calculatePercentage(row.total_hours, 'major') }}%
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>

        <el-tab-pane label="分班级统计" name="class">
          <el-table :data="classStatistics" border stripe>
            <el-table-column type="index" label="序号" width="60" />
            <el-table-column prop="class_name" label="班级" min-width="150" />
            <el-table-column prop="total_hours" label="使用课时" width="120" />
            <el-table-column prop="course_count" label="课程数" width="100" />
            <el-table-column prop="student_count" label="学生数" width="100" />
          </el-table>
        </el-tab-pane>

        <el-tab-pane label="分年级统计" name="grade">
          <el-table :data="gradeStatistics" border stripe>
            <el-table-column type="index" label="序号" width="60" />
            <el-table-column prop="grade_name" label="年级" width="100" />
            <el-table-column prop="total_hours" label="使用课时" width="120" />
            <el-table-column prop="class_count" label="班级数" width="100" />
            <el-table-column prop="student_count" label="学生数" width="100" />
          </el-table>
        </el-tab-pane>

        <el-tab-pane label="分课程统计" name="course">
          <el-table :data="courseStatistics" border stripe>
            <el-table-column type="index" label="序号" width="60" />
            <el-table-column prop="course_name" label="课程名称" min-width="200" />
            <el-table-column prop="total_hours" label="使用课时" width="120" />
            <el-table-column prop="class_count" label="授课班级数" width="120" />
            <el-table-column prop="teacher_name" label="授课教师" width="120" />
          </el-table>
        </el-tab-pane>

        <el-tab-pane label="预约使用统计" name="reservation">
          <el-table :data="reservationStatistics" border stripe>
            <el-table-column type="index" label="序号" width="60" />
            <el-table-column prop="category" label="项目类别" width="150" />
            <el-table-column prop="reservation_count" label="预约次数" width="120" />
            <el-table-column prop="total_duration" label="总时长(小时)" width="150" />
            <el-table-column prop="avg_duration" label="平均时长" width="120" />
          </el-table>
        </el-tab-pane>

        <el-tab-pane label="使用登记完成率" name="registration">
          <el-table :data="registrationStatistics" border stripe>
            <el-table-column type="index" label="序号" width="60" />
            <el-table-column prop="department_name" label="部门/教师" min-width="150" />
            <el-table-column prop="registered_count" label="已登记数" width="120" />
            <el-table-column prop="total_count" label="应登记数" width="120" />
            <el-table-column prop="completion_rate" label="完成率" width="150">
              <template #default="{ row }">
                <el-progress :percentage="row.completion_rate" :stroke-width="10" />
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>
      </el-tabs>
    </el-card>

    <!-- 可视化大屏 -->
    <el-card class="dashboard-card">
      <template #header>
        <span>可视化大屏</span>
        <el-button type="primary" size="small" @click="handleScreenshot">截图导出</el-button>
      </template>

      <!-- 实时占用状态 -->
      <el-card class="status-card">
        <template #header>
          <span>实验室实时占用状态</span>
        </template>
        <el-row :gutter="20">
          <el-col
            v-for="room in roomStatusList"
            :key="room.id"
            :span="6"
          >
            <div class="room-status-item" :class="{ occupied: room.status === 'occupied' }">
              <div class="room-header">
                <span class="room-name">{{ room.room_name }}</span>
                <el-tag :type="room.status === 'occupied' ? 'success' : 'info'" size="small">
                  {{ room.status === 'occupied' ? '使用中' : '空闲' }}
                </el-tag>
              </div>
              <div class="room-info">
                <div class="info-row">
                  <span class="label">位置：</span>
                  <span class="value">{{ room.building_name }}</span>
                </div>
                <div class="info-row">
                  <span class="label">容纳：</span>
                  <span class="value">{{ room.seat_count }}人</span>
                </div>
                <template v-if="room.status === 'occupied'">
                  <div class="info-row">
                    <span class="label">课程：</span>
                    <span class="value">{{ room.course_name || '未知' }}</span>
                  </div>
                  <div class="info-row">
                    <span class="label">教师：</span>
                    <span class="value">{{ room.teacher_name || '未知' }}</span>
                  </div>
                </template>
              </div>
            </div>
          </el-col>
        </el-row>
      </el-card>

      <!-- 图表区域 -->
      <el-row :gutter="20" class="chart-row">
        <el-col :span="12">
          <el-card>
            <template #header>
              <span>使用率趋势（按周）</span>
            </template>
            <div ref="trendChartRef" style="height: 300px"></div>
          </el-card>
        </el-col>
        <el-col :span="12">
          <el-card>
            <template #header>
              <span>排课来源占比</span>
            </template>
            <div ref="sourceChartRef" style="height: 300px"></div>
          </el-card>
        </el-col>
      </el-row>

      <el-row :gutter="20" class="chart-row">
        <el-col :span="12">
          <el-card>
            <template #header>
              <span>各部门登记完成率</span>
            </template>
            <div ref="registrationChartRef" style="height: 300px"></div>
          </el-card>
        </el-col>
        <el-col :span="12">
          <el-card>
            <template #header>
              <span>{{ viewMode === 'realtime' ? '当日' : '本周' }}排课热力图</span>
            </template>
            <div ref="heatmapChartRef" style="height: 300px"></div>
          </el-card>
        </el-col>
      </el-row>

      <!-- 异常提醒 -->
      <el-card class="alert-card">
        <template #header>
          <span>异常提醒</span>
          <el-badge :value="alertList.length" class="alert-badge" />
        </template>
        <el-table :data="alertList" border stripe>
          <el-table-column prop="type" label="类型" width="120">
            <template #default="{ row }">
              <el-tag :type="row.type === 'overdue' ? 'danger' : 'warning'">
                {{ row.type === 'overdue' ? '逾期未登记' : '设备异常' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="room_name" label="实验室" width="150" />
          <el-table-column prop="description" label="描述" min-width="200" />
          <el-table-column prop="created_at" label="时间" width="160" :formatter="formatDateTime" />
        </el-table>
        <div v-if="alertList.length === 0" class="empty-alert">
          <el-icon :size="48" style="color: #67c23a"><CheckCircle /></el-icon>
          <p>暂无异常提醒</p>
        </div>
      </el-card>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, nextTick, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { Calendar, Clock, OfficeBuilding, CircleCheck } from '@element-plus/icons-vue'
import { get, post } from '@/utils/request'
import * as echarts from 'echarts'
import * as XLSX from 'xlsx'

const viewMode = ref<'realtime' | 'statistics'>('realtime')
const dateRange = ref<[Date, Date] | null>(null)
const activeTab = ref('weekly')

const searchForm = reactive({
  semesterId: 1,
  weekNo: 1
})

const personnelFilter = reactive({
  dimension: 'building'
})

const semesterList = ref<any[]>([])
const overviewStats = reactive({
  totalScheduling: 0,
  totalHours: 0,
  occupiedCount: 0,
  registrationRate: 0
})

const weeklyUsageList = ref<any[]>([])
const personnelStatistics = ref<any[]>([])
const majorStatistics = ref<any[]>([])
const classStatistics = ref<any[]>([])
const gradeStatistics = ref<any[]>([])
const courseStatistics = ref<any[]>([])
const reservationStatistics = ref<any[]>([])
const registrationStatistics = ref<any[]>([])
const roomStatusList = ref<any[]>([])
const alertList = ref<any[]>([])

const trendChartRef = ref<HTMLElement>()
const sourceChartRef = ref<HTMLElement>()
const registrationChartRef = ref<HTMLElement>()
const heatmapChartRef = ref<HTMLElement>()

let trendChart: echarts.ECharts | null = null
let sourceChart: echarts.ECharts | null = null
let registrationChart: echarts.ECharts | null = null
let heatmapChart: echarts.ECharts | null = null

onMounted(async () => {
  await loadSemesters()
  await loadAllStatistics()
  await nextTick()
  initCharts()

  window.addEventListener('resize', handleResize)
})

watch(viewMode, () => {
  loadAllStatistics()
})

function handleResize() {
  trendChart?.resize()
  sourceChart?.resize()
  registrationChart?.resize()
  heatmapChart?.resize()
}

async function loadSemesters() {
  try {
    const res = await get<any[]>('/semesters')
    semesterList.value = res || []
    if (semesterList.value.length > 0) {
      searchForm.semesterId = semesterList.value[0].id
    }
  } catch (error) {
    console.error('加载学期列表失败:', error)
  }
}

async function loadAllStatistics() {
  console.log('Loading statistics, viewMode:', viewMode.value)
  await loadOverviewStats()
  await loadWeeklyUsage()
  await loadPersonnelStatistics()
  await loadMajorStatistics()
  await loadClassStatistics()
  await loadGradeStatistics()
  await loadCourseStatistics()
  await loadReservationStatistics()
  await loadRegistrationStatistics()
  await loadRoomStatus()
  await loadAlerts()
  await nextTick()
  updateCharts()
}

async function loadOverviewStats() {
  try {
    const params: any = { mode: viewMode.value }
    if (viewMode.value === 'statistics') {
      params.semesterId = searchForm.semesterId
      params.weekNo = searchForm.weekNo
      if (dateRange.value) {
        params.startDate = dateRange.value[0].toISOString().split('T')[0]
        params.endDate = dateRange.value[1].toISOString().split('T')[0]
      }
    }
    console.log('loadOverviewStats params:', params)
    const res = await get<any>('/statistics/overview', params)
    console.log('loadOverviewStats result:', res)
    overviewStats.totalScheduling = res.totalScheduling || 0
    overviewStats.totalHours = res.totalHours || 0
    overviewStats.occupiedCount = res.occupiedCount || 0
    overviewStats.registrationRate = res.registrationRate || 0
  } catch (error) {
    console.error('加载概览统计失败:', error)
  }
}

async function loadWeeklyUsage() {
  try {
    const params: any = { weekNo: searchForm.weekNo, mode: viewMode.value }
    if (viewMode.value === 'statistics') {
      params.semesterId = searchForm.semesterId
      if (dateRange.value) {
        params.startDate = dateRange.value[0].toISOString().split('T')[0]
        params.endDate = dateRange.value[1].toISOString().split('T')[0]
      }
    }
    const res = await get<any[]>('/statistics/weekly-usage', params)
    weeklyUsageList.value = res || []
  } catch (error) {
    console.error('加载每周课室使用统计失败:', error)
  }
}

async function loadPersonnelStatistics() {
  try {
    const params: any = { dimension: personnelFilter.dimension, mode: viewMode.value }
    if (viewMode.value === 'statistics') {
      params.semesterId = searchForm.semesterId
      params.weekNo = searchForm.weekNo
      if (dateRange.value) {
        params.startDate = dateRange.value[0].toISOString().split('T')[0]
        params.endDate = dateRange.value[1].toISOString().split('T')[0]
      }
    }
    const res = await get<any[]>('/statistics/personnel', params)
    personnelStatistics.value = res || []
  } catch (error) {
    console.error('加载使用人次统计失败:', error)
  }
}

async function loadMajorStatistics() {
  try {
    const params: any = { mode: viewMode.value }
    if (viewMode.value === 'statistics') {
      params.semesterId = searchForm.semesterId
      params.weekNo = searchForm.weekNo
      if (dateRange.value) {
        params.startDate = dateRange.value[0].toISOString().split('T')[0]
        params.endDate = dateRange.value[1].toISOString().split('T')[0]
      }
    }
    const res = await get<any[]>('/statistics/major', params)
    majorStatistics.value = res || []
  } catch (error) {
    console.error('加载专业统计失败:', error)
  }
}

async function loadClassStatistics() {
  try {
    const params: any = { mode: viewMode.value }
    if (viewMode.value === 'statistics') {
      params.semesterId = searchForm.semesterId
      params.weekNo = searchForm.weekNo
      if (dateRange.value) {
        params.startDate = dateRange.value[0].toISOString().split('T')[0]
        params.endDate = dateRange.value[1].toISOString().split('T')[0]
      }
    }
    const res = await get<any[]>('/statistics/class', params)
    classStatistics.value = res || []
  } catch (error) {
    console.error('加载班级统计失败:', error)
  }
}

async function loadGradeStatistics() {
  try {
    const params: any = { mode: viewMode.value }
    if (viewMode.value === 'statistics') {
      params.semesterId = searchForm.semesterId
      params.weekNo = searchForm.weekNo
      if (dateRange.value) {
        params.startDate = dateRange.value[0].toISOString().split('T')[0]
        params.endDate = dateRange.value[1].toISOString().split('T')[0]
      }
    }
    const res = await get<any[]>('/statistics/grade', params)
    gradeStatistics.value = res || []
  } catch (error) {
    console.error('加载年级统计失败:', error)
  }
}

async function loadCourseStatistics() {
  try {
    const params: any = { mode: viewMode.value }
    if (viewMode.value === 'statistics') {
      params.semesterId = searchForm.semesterId
      params.weekNo = searchForm.weekNo
      if (dateRange.value) {
        params.startDate = dateRange.value[0].toISOString().split('T')[0]
        params.endDate = dateRange.value[1].toISOString().split('T')[0]
      }
    }
    const res = await get<any[]>('/statistics/course', params)
    courseStatistics.value = res || []
  } catch (error) {
    console.error('加载课程统计失败:', error)
  }
}

async function loadReservationStatistics() {
  try {
    const params: any = { mode: viewMode.value }
    if (viewMode.value === 'statistics') {
      params.semesterId = searchForm.semesterId
      params.weekNo = searchForm.weekNo
      if (dateRange.value) {
        params.startDate = dateRange.value[0].toISOString().split('T')[0]
        params.endDate = dateRange.value[1].toISOString().split('T')[0]
      }
    }
    const res = await get<any[]>('/statistics/reservation', params)
    reservationStatistics.value = res || []
  } catch (error) {
    console.error('加载预约统计失败:', error)
  }
}

async function loadRegistrationStatistics() {
  try {
    const params: any = { mode: viewMode.value }
    if (viewMode.value === 'statistics') {
      params.semesterId = searchForm.semesterId
      params.weekNo = searchForm.weekNo
      if (dateRange.value) {
        params.startDate = dateRange.value[0].toISOString().split('T')[0]
        params.endDate = dateRange.value[1].toISOString().split('T')[0]
      }
    }
    const res = await get<any[]>('/statistics/registration', params)
    registrationStatistics.value = res || []
  } catch (error) {
    console.error('加载登记统计失败:', error)
  }
}

async function loadRoomStatus() {
  try {
    const res = await get<any[]>('/statistics/room-status')
    roomStatusList.value = res || []
  } catch (error) {
    console.error('加载房间状态失败:', error)
  }
}

async function loadAlerts() {
  try {
    const res = await get<any[]>('/statistics/alerts')
    alertList.value = res || []
  } catch (error) {
    console.error('加载异常提醒失败:', error)
  }
}

function initCharts() {
  if (trendChartRef.value) {
    trendChart = echarts.init(trendChartRef.value)
    updateTrendChart()
  }

  if (sourceChartRef.value) {
    sourceChart = echarts.init(sourceChartRef.value)
    updateSourceChart()
  }

  if (registrationChartRef.value) {
    registrationChart = echarts.init(registrationChartRef.value)
    updateRegistrationChart()
  }

  if (heatmapChartRef.value) {
    heatmapChart = echarts.init(heatmapChartRef.value)
    updateHeatmapChart()
  }
}

function updateCharts() {
  updateTrendChart()
  updateSourceChart()
  updateRegistrationChart()
  updateHeatmapChart()
}

function updateTrendChart() {
  if (!trendChart) return

  const weeks = ['第1周', '第2周', '第3周', '第4周', '第5周', '第6周', '第7周', '第8周', '第9周', '第10周']
  const rates = [65, 72, 68, 78, 75, 82, 79, 85, 81, 88]

  trendChart.setOption({
    title: { text: '', left: 'center' },
    tooltip: { 
      trigger: 'axis',
      formatter: '{b}: {c}%'
    },
    grid: { left: '3%', right: '4%', bottom: '3%', top: '10%', containLabel: true },
    xAxis: { 
      type: 'category', 
      data: weeks,
      axisLabel: { fontSize: 12 }
    },
    yAxis: { 
      type: 'value', 
      max: 100,
      axisLabel: { formatter: '{value}%' }
    },
    series: [{
      name: '使用率',
      type: 'line',
      smooth: true,
      data: rates,
      areaStyle: { opacity: 0.3, color: '#409eff' },
      itemStyle: { color: '#409eff' },
      lineStyle: { width: 3 },
      symbol: 'circle',
      symbolSize: 8
    }]
  })
}

function updateSourceChart() {
  if (!sourceChart) return

  sourceChart.setOption({
    title: { text: '', left: 'center' },
    tooltip: { 
      trigger: 'item',
      formatter: '{b}: {c}次 ({d}%)'
    },
    legend: { 
      bottom: 0,
      data: ['集中排课', '预约', '授课申请']
    },
    series: [{
      name: '排课来源',
      type: 'pie',
      radius: ['40%', '70%'],
      avoidLabelOverlap: false,
      itemStyle: { borderRadius: 10 },
      label: { show: true, formatter: '{b}: {d}%' },
      emphasis: {
        label: { show: true, fontSize: 16, fontWeight: 'bold' }
      },
      data: [
        { value: 45, name: '集中排课', itemStyle: { color: '#409eff' } },
        { value: 30, name: '预约', itemStyle: { color: '#67c23a' } },
        { value: 25, name: '授课申请', itemStyle: { color: '#e6a23c' } }
      ]
    }]
  })
}

function updateRegistrationChart() {
  if (!registrationChart) return

  const departments = ['计算机学院', '电子工程', '机械工程', '化学系', '物理系', '数学系']
  const rates = registrationStatistics.value.length > 0 
    ? registrationStatistics.value.slice(0, 6).map(r => r.completion_rate || 0)
    : [85, 78, 92, 75, 88, 80]

  registrationChart.setOption({
    title: { text: '', left: 'center' },
    tooltip: { 
      trigger: 'axis', 
      axisPointer: { type: 'shadow' },
      formatter: '{b}: {c}%'
    },
    grid: { left: '3%', right: '4%', bottom: '15%', top: '5%', containLabel: true },
    xAxis: { 
      type: 'category', 
      data: departments, 
      axisLabel: { rotate: 30, fontSize: 12 }
    },
    yAxis: { 
      type: 'value', 
      max: 100,
      axisLabel: { formatter: '{value}%' }
    },
    series: [{
      type: 'bar',
      barWidth: '50%',
      data: rates.map((rate, index) => ({
        value: rate,
        itemStyle: { 
          color: rate >= 85 ? '#67c23a' : rate >= 75 ? '#e6a23c' : '#f56c6c',
          borderRadius: [4, 4, 0, 0]
        }
      }))
    }]
  })
}

function updateHeatmapChart() {
  if (!heatmapChart) return

  const hours = ['第1-2节', '第3-4节', '第5-6节', '第7-8节']
  const days = ['周一', '周二', '周三', '周四', '周五']
  const data = [
    [0, 0, 80], [0, 1, 90], [0, 2, 60], [0, 3, 70], [0, 4, 85],
    [1, 0, 75], [1, 1, 85], [1, 2, 95], [1, 3, 70], [1, 4, 65],
    [2, 0, 60], [2, 1, 70], [2, 2, 80], [2, 3, 90], [2, 4, 75],
    [3, 0, 50], [3, 1, 60], [3, 2, 70], [3, 3, 80], [3, 4, 60]
  ]

  heatmapChart.setOption({
    title: { text: '', left: 'center' },
    tooltip: { 
      position: 'top',
      formatter: (params: any) => {
        return `${days[params.value[1]]} ${hours[params.value[0]]}: 排课密度 ${params.value[2]}%`
      }
    },
    grid: { left: '10%', right: '10%', bottom: '15%', top: '5%' },
    xAxis: { 
      type: 'category', 
      data: days, 
      splitArea: { show: true },
      axisLabel: { fontSize: 12 }
    },
    yAxis: { 
      type: 'category', 
      data: hours, 
      splitArea: { show: true },
      axisLabel: { fontSize: 12 }
    },
    visualMap: {
      min: 0,
      max: 100,
      calculable: true,
      orient: 'horizontal',
      left: 'center',
      bottom: '0%',
      inRange: {
        color: ['#e8f5e9', '#81c784', '#4caf50', '#2e7d32']
      },
      textStyle: { fontSize: 12 }
    },
    series: [{
      name: '排课密度',
      type: 'heatmap',
      data: data,
      label: { show: true, fontSize: 12 },
      emphasis: { itemStyle: { shadowBlur: 10, shadowColor: 'rgba(0, 0, 0, 0.5)' } },
      itemStyle: { borderRadius: 4 }
    }]
  })
}

function calculatePercentage(value: number, type: string): string {
  let total = 0
  switch (type) {
    case 'major':
      total = majorStatistics.value.reduce((sum, item) => sum + (item.total_hours || 0), 0)
      break
    case 'class':
      total = classStatistics.value.reduce((sum, item) => sum + (item.total_hours || 0), 0)
      break
    case 'course':
      total = courseStatistics.value.reduce((sum, item) => sum + (item.total_hours || 0), 0)
      break
  }
  return total > 0 ? ((value / total) * 100).toFixed(1) : '0'
}

function formatDateTime(row: any): string {
  return row.created_at ? row.created_at.split('T')[0] + ' ' + row.created_at.split('T')[1]?.slice(0, 8) : '-'
}

function handleSearch() {
  console.log('Search clicked, searchForm:', searchForm)
  loadAllStatistics()
}

function handleReset() {
  searchForm.semesterId = semesterList.value[0]?.id || 1
  searchForm.weekNo = 1
  loadAllStatistics()
}

function handleDateChange() {
  loadAllStatistics()
}

async function handleExport() {
  try {
    let exportData: any[] = []
    let sheetName = ''
    
    switch (activeTab.value) {
      case 'weekly':
        exportData = weeklyUsageList.value.map((item, index) => ({
          '序号': index + 1,
          '楼宇': item.building_name,
          '实验室': item.room_name,
          '周次': item.week_no,
          '排课节数': item.scheduled_slots,
          '空闲节数': item.free_slots,
          '使用率(%)': item.usage_rate
        }))
        sheetName = '每周课室使用汇总'
        break
        
      case 'personnel':
        exportData = personnelStatistics.value.map((item, index) => ({
          '序号': index + 1,
          '名称': item.name,
          '使用人次': item.total_personnel,
          '日均人次': item.avg_daily
        }))
        sheetName = '实验室使用人次统计'
        break
        
      case 'major':
        exportData = majorStatistics.value.map((item, index) => ({
          '序号': index + 1,
          '专业': item.major_name,
          '使用课时': item.total_hours,
          '课程数': item.course_count,
          '学生数': item.student_count,
          '占比(%)': calculatePercentage(item.total_hours, 'major')
        }))
        sheetName = '分专业统计'
        break
        
      case 'class':
        exportData = classStatistics.value.map((item, index) => ({
          '序号': index + 1,
          '班级': item.class_name,
          '使用课时': item.total_hours,
          '课程数': item.course_count,
          '学生数': item.student_count
        }))
        sheetName = '分班级统计'
        break
        
      case 'grade':
        exportData = gradeStatistics.value.map((item, index) => ({
          '序号': index + 1,
          '年级': item.grade_name,
          '使用课时': item.total_hours,
          '班级数': item.class_count,
          '学生数': item.student_count
        }))
        sheetName = '分年级统计'
        break
        
      case 'course':
        exportData = courseStatistics.value.map((item, index) => ({
          '序号': index + 1,
          '课程名称': item.course_name,
          '使用课时': item.total_hours,
          '授课班级数': item.class_count,
          '授课教师': item.teacher_name
        }))
        sheetName = '分课程统计'
        break
        
      case 'reservation':
        exportData = reservationStatistics.value.map((item, index) => ({
          '序号': index + 1,
          '项目类别': item.category,
          '预约次数': item.reservation_count,
          '总时长(小时)': item.total_duration,
          '平均时长': item.avg_duration
        }))
        sheetName = '预约使用统计'
        break
        
      case 'registration':
        exportData = registrationStatistics.value.map((item, index) => ({
          '序号': index + 1,
          '部门/教师': item.department_name,
          '已登记数': item.registered_count,
          '应登记数': item.total_count,
          '完成率(%)': item.completion_rate
        }))
        sheetName = '使用登记完成率'
        break
        
      default:
        ElMessage.warning('请先选择要导出的报表标签页')
        return
    }
    
    if (exportData.length === 0) {
      ElMessage.warning('当前标签页没有数据可导出')
      return
    }
    
    const worksheet = XLSX.utils.json_to_sheet(exportData)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName)
    
    const fileName = `${sheetName}_${new Date().toLocaleDateString().replace(/\//g, '-')}.xlsx`
    XLSX.writeFile(workbook, fileName)
    
    ElMessage.success(`${sheetName}导出成功`)
  } catch (error) {
    console.error('导出失败:', error)
    ElMessage.error('导出失败，请重试')
  }
}

async function handleScreenshot() {
  try {
    const dashboardCard = document.querySelector('.dashboard-card')
    if (!dashboardCard) {
      ElMessage.warning('未找到可视化大屏')
      return
    }
    
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    if (!ctx) {
      ElMessage.error('无法创建画布上下文')
      return
    }
    
    const rect = dashboardCard.getBoundingClientRect()
    canvas.width = rect.width * 2
    canvas.height = rect.height * 2
    
    const html2canvas = (await import('html2canvas')).default
    const canvasElement = await html2canvas(dashboardCard as HTMLElement, {
      scale: 2,
      useCORS: true,
      logging: false
    })
    
    const link = document.createElement('a')
    link.download = `可视化大屏_${new Date().toLocaleDateString().replace(/\//g, '-')}_${new Date().toLocaleTimeString().replace(/:/g, '-')}.png`
    link.href = canvasElement.toDataURL('image/png')
    link.click()
    
    ElMessage.success('截图导出成功')
  } catch (error) {
    console.error('截图导出失败:', error)
    ElMessage.error('截图导出失败，请重试')
  }
}
</script>

<style scoped>
.statistics-container {
  padding: 20px;
  background-color: #f5f7fa;
  min-height: 100vh;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.page-header h1 {
  margin: 0;
  font-size: 20px;
  font-weight: bold;
  color: #303133;
}

.header-controls {
  display: flex;
  align-items: center;
}

.filter-card {
  margin-bottom: 20px;
}

.search-form {
  padding: 10px 0;
}

.filter-form {
  padding: 10px 0 20px;
}

.overview-row {
  margin-bottom: 20px;
}

.overview-card {
  height: 100px;
  transition: all 0.3s;
}

.overview-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.1);
}

.overview-item {
  display: flex;
  align-items: center;
  height: 100%;
}

.overview-icon {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  margin-right: 15px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.overview-content {
  flex: 1;
}

.overview-value {
  font-size: 28px;
  font-weight: bold;
  color: #303133;
  margin-bottom: 4px;
}

.overview-label {
  font-size: 14px;
  color: #909399;
}

.report-card {
  margin-bottom: 20px;
}

.statistics-tabs {
  margin-bottom: 15px;
}

.statistics-tabs .el-tabs__header {
  margin-bottom: 0;
}

.dashboard-card {
  margin-top: 20px;
}

.status-card {
  margin-bottom: 20px;
}

.room-status-item {
  border: 2px solid #e8e8e8;
  border-radius: 8px;
  padding: 15px;
  margin-bottom: 15px;
  background-color: #ffffff;
  transition: all 0.3s;
}

.room-status-item:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.room-status-item.occupied {
  border-color: #67c23a;
  background-color: #f0f9eb;
}

.room-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.room-name {
  font-weight: bold;
  font-size: 16px;
  color: #303133;
}

.room-info {
  font-size: 13px;
}

.info-row {
  margin-bottom: 6px;
}

.info-row .label {
  color: #909399;
  margin-right: 4px;
}

.info-row .value {
  color: #303133;
}

.chart-row {
  margin-bottom: 20px;
}

.alert-card {
  margin-top: 20px;
}

.alert-card :deep(.el-card__header) {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.alert-badge {
  background-color: #f56c6c;
}

.empty-alert {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px;
  color: #67c23a;
}

.empty-alert p {
  margin-top: 10px;
  font-size: 14px;
}

.el-progress {
  width: 120px;
}
</style>