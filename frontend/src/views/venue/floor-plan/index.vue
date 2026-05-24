<template>
  <div class="page-container">
    <el-card class="table-card">
      <template #header>
        <div class="card-header">
          <span>楼层平面图</span>
          <div class="header-right">
            <el-select v-model="selectedBuilding" placeholder="选择楼宇" class="search-select">
              <el-option
                v-for="building in buildingList"
                :key="building.id"
                :label="building.name"
                :value="building.id"
              />
            </el-select>
            <el-select v-model="selectedFloor" placeholder="选择楼层" class="search-select">
              <el-option
                v-for="floor in floorList"
                :key="floor"
                :label="`${floor}楼`"
                :value="floor"
              />
            </el-select>
            <el-checkbox-group v-model="statusFilters" class="status-filter">
              <el-checkbox label="free">空闲</el-checkbox>
              <el-checkbox label="using">使用中</el-checkbox>
              <el-checkbox label="full">已满</el-checkbox>
            </el-checkbox-group>
            <el-button type="primary" @click="handleSearch">
              <el-icon><Search /></el-icon>查看
            </el-button>
          </div>
        </div>
      </template>

      <div v-if="floorPlanData.length > 0" class="floor-plan-container">
        <h3 class="floor-title">{{ currentBuildingName }} - {{ selectedFloor }}楼</h3>
        <div class="room-grid">
          <div
            v-for="room in floorPlanData"
            :key="room.id"
            class="room-card"
            :class="{
              'room-free': room.status === 'free',
              'room-using': room.status === 'using',
              'room-full': room.status === 'full'
            }"
          >
            <div class="room-title">{{ room.roomNumber }}{{ room.name.replace(room.roomNumber, '') }}</div>
            <div class="room-info">{{ room.type }} | {{ room.seats }}座</div>
            <div class="room-status">{{ statusLabels[room.status] }}</div>
          </div>
        </div>
      </div>

      <div v-else class="empty-state">
        <el-empty description="请选择楼宇和楼层查看平面图" />
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { Search } from '@element-plus/icons-vue'

type RoomStatus = 'free' | 'using' | 'full'

interface BuildingItem {
  id: number
  name: string
}

interface RoomItem {
  id: number
  name: string
  roomNumber: string
  type: string
  seats: number
  status: RoomStatus
}

type FloorPlanMap = Record<number, Record<number, RoomItem[]>>

const statusLabels: Record<RoomStatus, string> = {
  free: '空闲',
  using: '使用中',
  full: '已满',
}

const selectedBuilding = ref(1)
const selectedFloor = ref(1)
const statusFilters = ref<RoomStatus[]>(['free', 'using', 'full'])

const buildingList = ref<BuildingItem[]>([
  { id: 1, name: 'A教学楼' },
  { id: 2, name: 'B实验楼' },
  { id: 3, name: 'C科研楼' },
  { id: 4, name: 'D体育馆' },
])

const floorList = ref([1, 2, 3, 4, 5, 6])

const currentBuildingName = computed(() => {
  return buildingList.value.find((item) => item.id === selectedBuilding.value)?.name || ''
})

const floorPlanData = ref<RoomItem[]>([])

const mockFloorPlanData: FloorPlanMap = {
  1: {
    1: [
      { id: 1, name: 'A101多媒体教室', roomNumber: 'A101', type: '教室', seats: 120, status: 'free' },
      { id: 2, name: 'A102多媒体教室', roomNumber: 'A102', type: '教室', seats: 120, status: 'free' },
      { id: 3, name: 'A103阶梯教室', roomNumber: 'A103', type: '教室', seats: 200, status: 'free' },
      { id: 4, name: 'A104机房', roomNumber: 'A104', type: '机房', seats: 60, status: 'free' },
      { id: 5, name: 'A105会议室', roomNumber: 'A105', type: '会议室', seats: 30, status: 'free' },
      { id: 6, name: 'A106办公室', roomNumber: 'A106', type: '办公室', seats: 8, status: 'using' },
    ],
    2: [
      { id: 7, name: 'A201实验室', roomNumber: 'A201', type: '实验室', seats: 30, status: 'using' },
      { id: 8, name: 'A202实验室', roomNumber: 'A202', type: '实验室', seats: 50, status: 'free' },
      { id: 9, name: 'A203讨论室', roomNumber: 'A203', type: '讨论室', seats: 10, status: 'free' },
      { id: 10, name: 'A204教师办公室', roomNumber: 'A204', type: '办公室', seats: 6, status: 'using' },
      { id: 11, name: 'A205会议室', roomNumber: 'A205', type: '会议室', seats: 20, status: 'free' },
      { id: 12, name: 'A206资料室', roomNumber: 'A206', type: '资料室', seats: 0, status: 'free' },
    ],
  },
  2: {
    1: [
      { id: 13, name: 'B101物理实验室', roomNumber: 'B101', type: '物理实验室', seats: 24, status: 'free' },
      { id: 14, name: 'B102化学实验室', roomNumber: 'B102', type: '化学实验室', seats: 24, status: 'using' },
      { id: 15, name: 'B103准备室', roomNumber: 'B103', type: '准备室', seats: 0, status: 'free' },
      { id: 16, name: 'B104器材室', roomNumber: 'B104', type: '器材室', seats: 0, status: 'free' },
    ],
    2: [
      { id: 17, name: 'B201生物实验室', roomNumber: 'B201', type: '生物实验室', seats: 24, status: 'free' },
      { id: 18, name: 'B202实验器材室', roomNumber: 'B202', type: '器材室', seats: 0, status: 'free' },
      { id: 19, name: 'B203化学准备室', roomNumber: 'B203', type: '准备室', seats: 0, status: 'free' },
      { id: 20, name: 'B204样品室', roomNumber: 'B204', type: '样品室', seats: 0, status: 'free' },
    ],
  },
  3: {
    1: [
      { id: 21, name: 'C101物理实验室', roomNumber: 'C101', type: '物理实验室', seats: 40, status: 'free' },
      { id: 22, name: 'C102化学实验室', roomNumber: 'C102', type: '化学实验室', seats: 40, status: 'free' },
      { id: 23, name: 'C103材料实验室', roomNumber: 'C103', type: '材料实验室', seats: 30, status: 'using' },
      { id: 24, name: 'C104分析实验室', roomNumber: 'C104', type: '分析实验室', seats: 20, status: 'free' },
      { id: 25, name: 'C105仪器室', roomNumber: 'C105', type: '仪器室', seats: 0, status: 'free' },
      { id: 26, name: 'C106准备室', roomNumber: 'C106', type: '准备室', seats: 0, status: 'free' },
    ],
    2: [
      { id: 27, name: 'C201研究室', roomNumber: 'C201', type: '研究室', seats: 6, status: 'free' },
      { id: 28, name: 'C202研究室', roomNumber: 'C202', type: '研究室', seats: 6, status: 'free' },
    ],
    3: [
      { id: 29, name: 'C301资料室', roomNumber: 'C301', type: '资料室', seats: 10, status: 'free' },
      { id: 30, name: 'C302会议室', roomNumber: 'C302', type: '会议室', seats: 20, status: 'using' },
    ],
  },
  4: {
    1: [
      { id: 31, name: 'D101篮球场', roomNumber: 'D101', type: '篮球场', seats: 500, status: 'free' },
      { id: 32, name: 'D102羽毛球场', roomNumber: 'D102', type: '羽毛球场', seats: 200, status: 'using' },
      { id: 33, name: 'D103乒乓球室', roomNumber: 'D103', type: '乒乓球室', seats: 50, status: 'free' },
      { id: 34, name: 'D104健身房', roomNumber: 'D104', type: '健身房', seats: 0, status: 'free' },
    ],
    2: [
      { id: 35, name: 'D201更衣室', roomNumber: 'D201', type: '更衣室', seats: 0, status: 'free' },
      { id: 36, name: 'D202休息室', roomNumber: 'D202', type: '休息室', seats: 20, status: 'free' },
    ],
  },
}

const handleSearch = () => {
  const buildingData = mockFloorPlanData[selectedBuilding.value]
  const floorRooms = buildingData?.[selectedFloor.value] ?? []
  const filteredRooms = floorRooms.filter((room) => statusFilters.value.includes(room.status))

  floorPlanData.value = filteredRooms

  if (!buildingData) {
    ElMessage.info('当前楼宇暂无数据')
    return
  }

  if (filteredRooms.length === 0) {
    ElMessage.info('当前楼层暂无符合条件的房间')
    return
  }

  ElMessage.success(`已加载 ${currentBuildingName.value} ${selectedFloor.value} 楼，共 ${filteredRooms.length} 个房间`)
}

onMounted(() => {
  handleSearch()
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

.search-select {
  width: 200px;
}

.status-filter {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-right: 10px;
}

.floor-plan-container {
  margin-top: 30px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.floor-title {
  margin-bottom: 30px;
  font-size: 18px;
  font-weight: bold;
  color: #303133;
}

.room-grid {
  display: grid;
  grid-template-columns: repeat(4, 220px);
  grid-template-rows: repeat(2, 180px);
  gap: 20px;
  max-width: 940px;
  width: 100%;
}

.room-card {
  border-radius: 8px;
  padding: 25px 15px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

.room-card:hover {
  transform: scale(1.02);
}

.room-free {
  background-color: #f0fdf4;
  border: 2px solid #86efac;
}

.room-free .room-title,
.room-free .room-info,
.room-free .room-status {
  color: #166534;
}

.room-using {
  background-color: #fef2f2;
  border: 2px solid #fca5a5;
}

.room-using .room-title,
.room-using .room-info,
.room-using .room-status {
  color: #991b1b;
}

.room-full {
  background-color: #f5f5f5;
  border: 2px solid #d4d4d4;
}

.room-full .room-title,
.room-full .room-info,
.room-full .room-status {
  color: #525252;
}

.room-title {
  font-weight: bold;
  font-size: 16px;
  margin-bottom: 12px;
}

.room-info {
  font-size: 12px;
  margin-bottom: 12px;
}

.room-status {
  font-size: 14px;
  font-weight: bold;
}

.empty-state {
  padding: 60px 0;
  text-align: center;
}

@media (max-width: 960px) {
  .room-grid {
    grid-template-columns: repeat(4, 1fr);
    grid-template-rows: repeat(2, 160px);
  }
}

@media (max-width: 768px) {
  .header-right {
    width: 100%;
    justify-content: flex-end;
  }

  .search-select {
    width: 100%;
  }

  .room-grid {
    grid-template-columns: repeat(2, 1fr);
    grid-template-rows: auto;
  }
}

@media (max-width: 480px) {
  .room-grid {
    grid-template-columns: 1fr;
    grid-template-rows: auto;
  }
}
</style>
