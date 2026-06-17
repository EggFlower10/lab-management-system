<template>
  <div class="page-container">
    <el-card class="table-card">
      <template #header>
        <div class="card-header">
          <span>楼层平面图</span>
          <div class="header-right">
            <el-select v-model="selectedBuilding" placeholder="选择楼宇" class="search-select" :loading="buildingsLoading">
              <el-option
                v-for="building in buildingList"
                :key="building.id"
                :label="building.name"
                :value="building.id"
              />
            </el-select>
            <el-select v-model="selectedFloor" placeholder="选择楼层" class="search-select">
              <el-option
                v-for="floor in availableFloors"
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
            <div class="room-title">{{ room.name }}</div>
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
import { computed, onMounted, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { Search } from '@element-plus/icons-vue'
import request from '@/utils/request'

type RoomStatus = 'free' | 'using' | 'full'

interface BuildingItem {
  id: number
  name: string
  totalFloors?: number
}

interface RoomItem {
  id: number
  name: string
  roomNumber: string
  type: string
  seats: number
  status: RoomStatus
}

const statusLabels: Record<RoomStatus, string> = {
  free: '空闲',
  using: '使用中',
  full: '已满',
}

const selectedBuilding = ref<number | null>(null)
const selectedFloor = ref<number>(1)
const statusFilters = ref<RoomStatus[]>(['free', 'using', 'full'])

const buildingsLoading = ref(false)
const roomsLoading = ref(false)

const buildingList = ref<BuildingItem[]>([])
const roomList = ref<RoomItem[]>([])
const availableFloors = ref<number[]>([])

const currentBuildingName = computed(() => {
  return buildingList.value.find((item) => item.id === selectedBuilding.value)?.name || ''
})

const floorPlanData = ref<RoomItem[]>([])

// 根据实际房间数据动态计算可用的楼层
const updateAvailableFloors = () => {
  const floorSet = new Set<number>()
  roomList.value.forEach(room => {
    const floor = (room as any).floor
    if (floor !== undefined && floor !== null && floor !== '') {
      floorSet.add(Number(floor))
    } else {
      floorSet.add(1)
    }
  })
  const sortedFloors = Array.from(floorSet).sort((a, b) => a - b)
  availableFloors.value = sortedFloors.length > 0 ? sortedFloors : [1]
  if (!availableFloors.value.includes(selectedFloor.value)) {
    selectedFloor.value = availableFloors.value[0] || 1
  }
}

// 监听楼宇变化，重新加载该楼宇下的房间
watch(selectedBuilding, (newVal) => {
  if (newVal) {
    loadRooms(newVal)
  }
})

// 监听楼层变化，自动更新平面图
watch(selectedFloor, () => {
  if (roomList.value.length > 0) {
    handleSearch()
  }
})

const loadBuildings = async () => {
  buildingsLoading.value = true
  try {
    const res: any = await request({
      url: '/buildings',
      method: 'get'
    })
    buildingList.value = (res || []).map((b: any) => ({
      id: b.BuildingID || b.id,
      name: b.BuildingName || b.name,
      totalFloors: b.TotalFloors || b.totalFloors
    }))
    if (buildingList.value.length > 0) {
      selectedBuilding.value = buildingList.value[0].id
    } else {
      ElMessage.info('暂无楼宇数据')
    }
  } catch (error: any) {
    console.error('获取楼宇列表失败:', error)
    ElMessage.error(error?.response?.data?.message || '获取楼宇列表失败')
  } finally {
    buildingsLoading.value = false
  }
}

const loadRooms = async (buildingId: number) => {
  roomsLoading.value = true
  try {
    const res: any = await request({
      url: '/rooms',
      method: 'get',
      params: { buildingId }
    })
    // 将数据库字段映射为前端需要的格式
    roomList.value = (res || []).map((r: any) => {
      // 状态映射：available -> free, occupied/maintenance -> using, full -> full
      let status: RoomStatus = 'free'
      const rawStatus = String(r.status || 'available').toLowerCase()
      if (rawStatus === 'available' || rawStatus === 'free' || rawStatus === '1') {
        status = 'free'
      } else if (rawStatus === 'occupied' || rawStatus === 'maintenance' || rawStatus === 'using' || rawStatus === '2') {
        status = 'using'
      } else if (rawStatus === 'full' || rawStatus === '3') {
        status = 'full'
      }
      return {
        id: r.RoomID || r.id,
        name: r.RoomName || r.name,
        roomNumber: r.RoomCode || r.roomNumber || '',
        type: r.RoomType || r.type || '',
        seats: r.Capacity || r.seats || 0,
        floor: r.Floor || r.floor,
        status
      }
    })
    updateAvailableFloors()
    // 自动显示平面图
    if (roomList.value.length > 0) {
      handleSearch()
    }
  } catch (error: any) {
    console.error('获取房间列表失败:', error)
    ElMessage.error(error?.response?.data?.message || '获取房间列表失败')
  } finally {
    roomsLoading.value = false
  }
}

const handleSearch = () => {
  const filteredRooms = roomList.value
    .filter((room) => {
      const roomFloor = (room as any).floor
      const floorNum = roomFloor !== undefined && roomFloor !== null && roomFloor !== '' ? Number(roomFloor) : 1
      return floorNum === selectedFloor.value
    })
    .filter((room) => statusFilters.value.includes(room.status))

  floorPlanData.value = filteredRooms

  if (roomList.value.length === 0) {
    ElMessage.info('当前楼宇暂无房间数据')
    return
  }

  if (filteredRooms.length === 0) {
    ElMessage.info('当前楼层暂无符合条件的房间')
    return
  }

  ElMessage.success(`已加载 ${currentBuildingName.value} ${selectedFloor.value} 楼，共 ${filteredRooms.length} 个房间`)
}

onMounted(async () => {
  await loadBuildings()
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
