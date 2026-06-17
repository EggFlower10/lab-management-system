<template>
  <div class="page-container">
    <el-card class="table-card">
      <template #header>
        <div class="card-header">
          <span>节次管理</span>
          <div class="header-right">
            <el-select v-model="searchParams.name" placeholder="节次名称" class="search-input" clearable>
              <el-option label="全部节次" value="" />
              <el-option v-for="item in timeSlots" :key="item.id" :label="item.name" :value="item.name" />
            </el-select>
            <el-select v-model="searchParams.period" placeholder="时段" class="search-select">
              <el-option label="全部时段" value="" />
              <el-option label="上午" value="morning" />
              <el-option label="下午" value="afternoon" />
              <el-option label="晚上" value="evening" />
            </el-select>
            <el-button type="success" @click="handleSearch" class="search-button">
              <el-icon><Search /></el-icon>搜索
            </el-button>
            <el-button type="default" @click="handleReset" class="reset-button">
              <el-icon><Refresh /></el-icon>重置
            </el-button>
            <el-button type="primary" @click="handleAdd">
              <el-icon><Plus /></el-icon>新增节次
            </el-button>
          </div>
        </div>
      </template>
      <el-table
        :data="pagedData"
        v-loading="loading"
        border
        stripe
      >
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="name" label="节次名称" width="150" />
        <el-table-column prop="startSection" label="起止节" width="120">
          <template #default="{ row }">
            {{ row.startSection }}-{{ row.endSection }}
          </template>
        </el-table-column>
        <el-table-column prop="startTime" label="开始时间" width="120" />
        <el-table-column prop="endTime" label="结束时间" width="120" />
        <el-table-column prop="period" label="时段" width="100">
          <template #default="{ row }">
            <el-tag :type="row.period === '上午' ? 'success' : (row.period === '下午' ? 'warning' : 'info')">
              {{ row.period }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="sort" label="排序" width="80" />
        <el-table-column prop="status" label="状态" width="80">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'danger'">
              {{ row.status === 1 ? '正常' : '禁用' }}
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
        <el-form-item label="节次名称" prop="name">
          <el-input v-model="form.name" placeholder="如：第1-2节" />
        </el-form-item>
        <el-form-item label="起止节" prop="startSection">
          <div class="section-range">
            <el-input v-model.number="form.startSection" type="number" placeholder="开始节" class="section-input" />
            <span class="section-separator">-</span>
            <el-input v-model.number="form.endSection" type="number" placeholder="结束节" class="section-input" />
          </div>
        </el-form-item>
        <el-form-item label="开始时间" prop="startTime">
          <el-time-picker v-model="form.startTime" format="HH:mm" value-format="HH:mm" placeholder="请选择开始时间" />
        </el-form-item>
        <el-form-item label="结束时间" prop="endTime">
          <el-time-picker v-model="form.endTime" format="HH:mm" value-format="HH:mm" placeholder="请选择结束时间" />
        </el-form-item>
        <el-form-item label="时段" prop="period">
          <el-select v-model="form.period" placeholder="请选择时段">
            <el-option label="上午" value="morning" />
            <el-option label="下午" value="afternoon" />
            <el-option label="晚上" value="evening" />
          </el-select>
        </el-form-item>
        <el-form-item label="排序" prop="sort">
          <el-input v-model.number="form.sort" type="number" placeholder="请输入排序" />
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-radio-group v-model="form.status">
            <el-radio :label="1">正常</el-radio>
            <el-radio :label="0">禁用</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitLoading" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox, FormInstance, FormRules } from 'element-plus'
import { Search, Refresh, Plus } from '@element-plus/icons-vue'
import request from '@/utils/request'

const loading = ref(false)
const submitLoading = ref(false)
const dialogVisible = ref(false)
const dialogTitle = ref('新增节次')
const isEdit = ref(false)
const formRef = ref<FormInstance>()

// 节次列表（来自数据库）
const timeSlots = ref<any[]>([])

const searchParams = reactive({
  name: '',
  period: ''
})

const pagination = reactive({
  page: 1,
  pageSize: 10,
  total: 0
})

// 前端过滤后的数据
const filteredData = computed(() => {
  return timeSlots.value.filter(item => {
    const nameMatch = !searchParams.name || String(item.name).includes(searchParams.name)
    // period 可能是中文(period字段)或英文(type字段)，统一比较
    const periodValue = item.period || item.type
    const periodMatch = !searchParams.period || periodValue === searchParams.period
    return nameMatch && periodMatch
  })
})

// 分页后的数据
const pagedData = computed(() => {
  const start = (pagination.page - 1) * pagination.pageSize
  return filteredData.value.slice(start, start + pagination.pageSize)
})

const form = reactive({
  id: 0,
  name: '',
  startSection: 1,
  endSection: 2,
  startTime: '',
  endTime: '',
  period: 'morning',
  sort: 0,
  status: 1
})

const rules = reactive<FormRules>({
  name: [
    { required: true, message: '请输入节次名称', trigger: 'blur' }
  ],
  startSection: [
    { required: true, message: '请输入开始节', trigger: 'blur' }
  ],
  endSection: [
    { required: true, message: '请输入结束节', trigger: 'blur' }
  ],
  startTime: [
    { required: true, message: '请选择开始时间', trigger: 'change' }
  ],
  endTime: [
    { required: true, message: '请选择结束时间', trigger: 'change' }
  ],
  period: [
    { required: true, message: '请选择时段', trigger: 'change' }
  ],
  sort: [
    { required: true, message: '请输入排序', trigger: 'blur' }
  ]
})

const fetchTimeSlots = async () => {
  loading.value = true
  try {
    const res: any = await request({
        url: '/time-slots',
        method: 'get'
      })
    timeSlots.value = Array.isArray(res) ? res : []
    pagination.total = timeSlots.value.length
  } catch (error) {
    console.error('获取节次列表失败:', error)
    ElMessage.error('获取节次列表失败')
    timeSlots.value = []
    pagination.total = 0
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  pagination.page = 1
  pagination.total = filteredData.value.length
  if (filteredData.value.length === 0) {
    ElMessage.info('未找到匹配的节次')
  } else {
    ElMessage.success(`搜索成功，找到 ${filteredData.value.length} 条记录`)
  }
}

const handleReset = () => {
  searchParams.name = ''
  searchParams.period = ''
  pagination.page = 1
  pagination.total = timeSlots.value.length
}

const handleAdd = () => {
  isEdit.value = false
  dialogTitle.value = '新增节次'
  Object.assign(form, {
    id: 0,
    name: '',
    startSection: 1,
    endSection: 2,
    startTime: null,
    endTime: null,
    period: 'morning',
    sort: 0,
    status: 1
  })
  dialogVisible.value = true
}

const handleEdit = (row: any) => {
  isEdit.value = true
  dialogTitle.value = '编辑节次'
  // period 后端返回为中文，需要转为后端存储的英文值
  const periodMap: Record<string, string> = { '上午': 'morning', '下午': 'afternoon', '晚上': 'evening' }
  const periodValue = periodMap[row.period] || row.period || row.type || 'morning'
  Object.assign(form, {
    id: row.id,
    name: row.name,
    startSection: row.startSection,
    endSection: row.endSection,
    startTime: row.startTime,
    endTime: row.endTime,
    period: periodValue,
    sort: row.sort,
    status: row.status
  })
  dialogVisible.value = true
}

const handleDelete = (row: any) => {
  ElMessageBox.confirm(
    `确定要删除节次 "${row.name}" 吗？`,
    '删除确认',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(async () => {
    try {
      await request({
        url: `/time-slots/${row.id}`,
        method: 'delete'
      })
      ElMessage.success('删除成功')
      await fetchTimeSlots()
      pagination.total = filteredData.value.length
    } catch (error: any) {
      console.error('删除节次失败:', error)
      ElMessage.error(error?.response?.data?.message || '删除失败')
    }
  }).catch(() => {})
}

const handleSubmit = () => {
  formRef.value?.validate(async (valid) => {
    if (!valid) return
    submitLoading.value = true
    try {
      const payload = {
        name: form.name,
        startSection: form.startSection,
        endSection: form.endSection,
        startTime: form.startTime,
        endTime: form.endTime,
        sort: form.sort,
        period: form.period,
        status: form.status
      }
      let res: any
      if (isEdit.value) {
        res = await request({
          url: `/time-slots/${form.id}`,
          method: 'put',
          data: payload
        })
      } else {
        res = await request({
          url: '/time-slots',
          method: 'post',
          data: payload
        })
      }
      ElMessage.success(isEdit.value ? '编辑成功' : '新增成功')
      dialogVisible.value = false
      await fetchTimeSlots()
      pagination.total = filteredData.value.length
    } catch (error: any) {
      console.error('保存节次失败:', error)
      ElMessage.error(error?.response?.data?.message || '保存失败')
    } finally {
      submitLoading.value = false
    }
  })
}

const handleDialogClose = () => {
  formRef.value?.resetFields()
}

const handleSizeChange = (size: number) => {
  pagination.pageSize = size
  pagination.page = 1
}

const handleCurrentChange = (page: number) => {
  pagination.page = page
}

onMounted(() => {
  fetchTimeSlots()
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
  width: 120px;
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

.section-range {
  display: flex;
  align-items: center;
  gap: 10px;
}

.section-input {
  width: 100px;
}

.section-separator {
  font-size: 16px;
  font-weight: bold;
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

  .section-range {
    flex-direction: column;
    align-items: flex-start;
    gap: 5px;
  }

  .section-input {
    width: 100%;
  }

  .section-separator {
    display: none;
  }
}
</style>
