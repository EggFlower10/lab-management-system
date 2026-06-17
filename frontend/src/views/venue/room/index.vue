<template>
  <div class="page-container">
    <el-card class="table-card">
      <template #header>
        <div class="card-header">
          <span>房间管理</span>
          <div class="header-right">
            <el-input v-model="searchParams.code" placeholder="房间编码" class="search-input" clearable />
            <el-input v-model="searchParams.name" placeholder="房间名称" class="search-input" clearable />
            <el-select v-model="searchParams.building" placeholder="所属楼宇" class="search-select">
              <el-option label="全部" value="" />
              <el-option v-for="building in buildingList" :key="building.BuildingID" :label="building.BuildingName" :value="building.BuildingID" />
            </el-select>
            <el-button type="success" @click="handleSearch" class="search-button">
              <el-icon><Search /></el-icon>搜索
            </el-button>
            <el-button type="default" @click="handleReset" class="reset-button">
              <el-icon><Refresh /></el-icon>重置
            </el-button>
            <el-button type="primary" @click="handleAdd">
              <el-icon><Plus /></el-icon>新增房间
            </el-button>
          </div>
        </div>
      </template>
      <el-table
        :data="tableData"
        v-loading="loading"
        border
        stripe
      >
        <el-table-column prop="RoomID" label="ID" width="80" />
        <el-table-column prop="RoomCode" label="房间编码" width="120" />
        <el-table-column prop="RoomName" label="房间名称" width="150" />
        <el-table-column prop="RoomNumber" label="房间号" width="100" />
        <el-table-column prop="BuildingName" label="所属楼宇" width="150">
          <template #default="{ row }">
            {{ getBuildingName(row.BuildingID) }}
          </template>
        </el-table-column>
        <el-table-column prop="Floor" label="楼层" width="80" />
        <el-table-column prop="RoomType" label="房间类型" width="120" />
        <el-table-column label="座位数" width="100">
          <template #default="{ row }">
            {{ row.Capacity || row.SeatCount || 0 }}
          </template>
        </el-table-column>
        <el-table-column prop="Area" label="面积(㎡)" width="120" />
        <el-table-column prop="IsAvailable" label="是否可用" width="100">
          <template #default="{ row }">
            <el-tag :type="row.IsAvailable ? 'success' : 'danger'">
              {{ row.IsAvailable ? '是' : '否' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="Status" label="状态" width="80">
          <template #default="{ row }">
            <el-tag :type="row.Status === 1 ? 'success' : 'danger'">
              {{ row.Status === 1 ? '正常' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" fixed="right" width="150">
          <template #default="{ row }">
            <div class="action-buttons">
              <el-button type="primary" size="small" @click="handleEdit(row)">编辑</el-button>
              <el-button type="danger" size="small" @click="handleDelete(row)">删除</el-button>
            </div>
          </template>
        </el-table-column>
      </el-table>
      <el-pagination
        v-model:current-page="pagination.page"
        v-model:page-size="pagination.pageSize"
        :total="pagination.total"
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </el-card>

    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="500px" @close="handleDialogClose">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
        <el-form-item label="房间编码" prop="RoomCode">
          <el-input v-model="form.RoomCode" placeholder="请输入房间编码" />
        </el-form-item>
        <el-form-item label="房间名称" prop="RoomName">
          <el-input v-model="form.RoomName" placeholder="请输入房间名称" />
        </el-form-item>
        <el-form-item label="房间号" prop="RoomNumber">
          <el-input v-model="form.RoomNumber" placeholder="请输入房间号" />
        </el-form-item>
        <el-form-item label="所属楼宇" prop="BuildingID">
          <el-select v-model="form.BuildingID" placeholder="请选择楼宇">
            <el-option v-for="building in buildingList" :key="building.BuildingID" :label="building.BuildingName" :value="building.BuildingID" />
          </el-select>
        </el-form-item>
        <el-form-item label="楼层" prop="Floor">
          <el-input-number v-model="form.Floor" :min="1" placeholder="请输入楼层" />
        </el-form-item>
        <el-form-item label="房间类型" prop="RoomType">
          <el-input v-model="form.RoomType" placeholder="请输入房间类型" />
        </el-form-item>
        <el-form-item label="座位数" prop="SeatCount">
          <el-input-number v-model="form.SeatCount" :min="0" placeholder="请输入座位数" />
        </el-form-item>
        <el-form-item label="面积(㎡)" prop="Area">
          <el-input v-model.number="form.Area" type="number" placeholder="请输入面积" />
        </el-form-item>
        <el-form-item label="是否可用" prop="IsAvailable">
          <el-radio-group v-model="form.IsAvailable">
            <el-radio :label="1">是</el-radio>
            <el-radio :label="0">否</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="状态" prop="Status">
          <el-radio-group v-model="form.Status">
            <el-radio :label="1">正常</el-radio>
            <el-radio :label="0">禁用</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox, FormInstance, FormRules } from 'element-plus'
import { Search, Refresh, Plus } from '@element-plus/icons-vue'
import { get, post, put, del } from '@/utils/request'

const loading = ref(false)
const dialogVisible = ref(false)
const dialogTitle = ref('新增房间')
const isEdit = ref(false)
const formRef = ref<FormInstance>()

const buildingList = ref<any[]>([])

const allData = ref<any[]>([])
const tableData = ref<any[]>([])

const fetchBuildingList = async () => {
  try {
    const result = await get('/buildings')
    buildingList.value = Array.isArray(result) ? result : []
  } catch (error) {
    console.error(error)
    ElMessage.error('获取楼宇列表失败')
  }
}

const updatePageData = () => {
  const start = (pagination.page - 1) * pagination.pageSize
  const end = start + pagination.pageSize
  tableData.value = allData.value.slice(start, end)
  pagination.total = allData.value.length
}

const fetchData = async () => {
  loading.value = true
  try {
    const params: any = {}
    if (searchParams.code) {
      params.RoomCode = searchParams.code
    }
    if (searchParams.name) {
      params.RoomName = searchParams.name
    }
    if (searchParams.building) {
      params.buildingId = searchParams.building
    }
    const result = await get('/rooms', params)
    allData.value = Array.isArray(result) ? result : []
    updatePageData()
  } catch (error) {
    console.error(error)
    ElMessage.error('获取房间列表失败')
    allData.value = []
    tableData.value = []
    pagination.total = 0
  } finally {
    loading.value = false
  }
}

const getBuildingName = (BuildingID: number): string => {
  const building = buildingList.value.find(item => item.BuildingID === BuildingID)
  return building ? building.BuildingName : ''
}

const searchParams = reactive({
  code: '',
  name: '',
  building: ''
})

const pagination = reactive({ 
  page: 1, 
  pageSize: 10, 
  total: 100 
})

const form = reactive({
  RoomID: 0,
  RoomCode: '',
  RoomName: '',
  RoomNumber: '',
  BuildingID: 1,
  Floor: 1,
  RoomType: '',
  SeatCount: 0,
  Area: 0,
  IsAvailable: 1,
  Status: 1
})

const rules = reactive<FormRules>({
  RoomCode: [
    { required: true, message: '请输入房间编码', trigger: 'blur' }
  ],
  RoomName: [
    { required: true, message: '请输入房间名称', trigger: 'blur' }
  ],
  RoomNumber: [
    { required: true, message: '请输入房间号', trigger: 'blur' }
  ],
  BuildingID: [
    { required: true, message: '请选择所属楼宇', trigger: 'change' }
  ],
  Floor: [
    { required: true, message: '请输入楼层', trigger: 'blur' }
  ],
  RoomType: [
    { required: true, message: '请输入房间类型', trigger: 'blur' }
  ],
  SeatCount: [
    { required: true, message: '请输入座位数', trigger: 'blur' }
  ],
  Area: [
    { required: true, message: '请输入面积', trigger: 'blur' }
  ]
})

const handleSearch = () => {
  pagination.page = 1
  fetchData()
}

const handleReset = () => {
  searchParams.code = ''
  searchParams.name = ''
  searchParams.building = ''
  pagination.page = 1
  fetchData()
}

const handleAdd = () => {
  isEdit.value = false
  dialogTitle.value = '新增房间'
  Object.assign(form, {
    RoomID: 0,
    RoomCode: '',
    RoomName: '',
    RoomNumber: '',
    BuildingID: buildingList.value[0]?.BuildingID || 1,
    Floor: 1,
    RoomType: '',
    SeatCount: 0,
    Area: 0,
    IsAvailable: 1,
    Status: 1
  })
  dialogVisible.value = true
}

const handleEdit = (row: any) => {
  isEdit.value = true
  dialogTitle.value = '编辑房间'
  Object.assign(form, {
    RoomID: row.RoomID,
    RoomCode: row.RoomCode,
    RoomName: row.RoomName,
    RoomNumber: row.RoomNumber || row.RoomCode,
    BuildingID: row.BuildingID,
    Floor: row.Floor,
    RoomType: row.RoomType,
    SeatCount: row.Capacity || row.SeatCount,
    Area: row.Area,
    IsAvailable: row.IsAvailable,
    Status: row.Status
  })
  dialogVisible.value = true
}

const handleDelete = async (row: any) => {
  ElMessageBox.confirm(
    `确定要删除房间 "${row.RoomName}" 吗？`,
    '删除确认',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(async () => {
    try {
      await del(`/rooms/${row.RoomID}`)
      await fetchData()
      ElMessage.success('删除成功')
    } catch (error) {
      console.error(error)
      ElMessage.error('删除失败')
    }
  }).catch(() => {})
}

const handleSubmit = async () => {
  formRef.value?.validate(async (valid) => {
    if (valid) {
      try {
        // 转换字段名以匹配后端API和数据库
        const submitData = {
          RoomCode: form.RoomCode,
          RoomName: form.RoomName,
          BuildingID: form.BuildingID,
          Floor: form.Floor,
          Capacity: form.SeatCount,
          Area: form.Area,
          RoomType: form.RoomType,
          Status: form.Status,
          SortOrder: 0,
          Description: '',
          Equipment: ''
        }
        if (isEdit.value) {
          await put(`/rooms/${form.RoomID}`, submitData)
          ElMessage.success('编辑成功')
        } else {
          await post('/rooms', submitData)
          ElMessage.success('新增成功')
        }
        await fetchData()
        dialogVisible.value = false
      } catch (error) {
        console.error(error)
        ElMessage.error(isEdit.value ? '编辑失败' : '新增失败')
      }
    }
  })
}

const handleDialogClose = () => {
  formRef.value?.resetFields()
}

const handleSizeChange = (size: number) => {
  pagination.pageSize = size
  pagination.page = 1
  updatePageData()
}

const handleCurrentChange = (page: number) => {
  pagination.page = page
  updatePageData()
}

onMounted(async () => {
  await fetchBuildingList()
  fetchData()
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

.search-input {
  width: 200px;
}

.search-select {
  width: 200px;
}

.action-buttons {
  display: flex;
  gap: 10px;
}

.search-button {
  background-color: #67C23A;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 8px 16px;
  font-size: 14px;
  cursor: pointer;
}

.search-button:hover {
  background-color: #85ce61;
}

.reset-button {
  background-color: white;
  color: #606266;
  border: 1px solid #DCDFE6;
  border-radius: 4px;
  padding: 8px 16px;
  font-size: 14px;
  cursor: pointer;
}

.reset-button:hover {
  border-color: #C0C4CC;
  color: #303133;
}

@media (max-width: 768px) {
  .header-right {
    width: 100%;
    justify-content: flex-end;
  }
  
  .search-input,
  .search-select {
    width: 100%;
  }
  
  .action-buttons {
    width: 100%;
    justify-content: flex-end;
  }
}
</style>
