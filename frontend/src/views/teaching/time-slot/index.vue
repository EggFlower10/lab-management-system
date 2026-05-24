<template>
  <div class="page-container">
    <el-card class="table-card">
      <template #header>
        <div class="card-header">
          <span>节次管理</span>
          <div class="header-right">
            <el-select v-model="searchParams.name" placeholder="节次名称" class="search-input" clearable>
              <el-option label="全部节次" value="" />
              <el-option v-for="option in sectionOptions" :key="option.value" :label="option.label" :value="option.label" />
            </el-select>
            <el-select v-model="searchParams.period" placeholder="时段" class="search-select">
              <el-option label="全部时段" value="" />
              <el-option label="上午" value="上午" />
              <el-option label="下午" value="下午" />
              <el-option label="晚上" value="晚上" />
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
        :data="tableData"
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
          <el-select v-model="form.name" placeholder="请选择节次名称">
            <el-option v-for="option in sectionOptions" :key="option.value" :label="option.label" :value="option.label" />
          </el-select>
        </el-form-item>
        <el-form-item label="起止节" prop="startSection">
          <div class="section-range">
            <el-input v-model.number="form.startSection" type="number" placeholder="开始节" class="section-input" disabled />
            <span class="section-separator">-</span>
            <el-input v-model.number="form.endSection" type="number" placeholder="结束节" class="section-input" disabled />
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
            <el-option label="上午" value="上午" />
            <el-option label="下午" value="下午" />
            <el-option label="晚上" value="晚上" />
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
        <el-button type="primary" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, watch } from 'vue'
import { ElMessage, ElMessageBox, FormInstance, FormRules } from 'element-plus'
import { Search, Refresh, Plus } from '@element-plus/icons-vue'

const loading = ref(false)
const dialogVisible = ref(false)
const dialogTitle = ref('新增节次')
const isEdit = ref(false)
const formRef = ref<FormInstance>()

// 节次选项
const sectionOptions = ref([
  { label: '第1-2节', value: '1-2', start: 1, end: 2 },
  { label: '第3-4节', value: '3-4', start: 3, end: 4 },
  { label: '第5-6节', value: '5-6', start: 5, end: 6 },
  { label: '第7-8节', value: '7-8', start: 7, end: 8 },
  { label: '第9-10节', value: '9-10', start: 9, end: 10 },
  { label: '第11-12节', value: '11-12', start: 11, end: 12 }
])

const originalTableData = ref<any[]>([
  {
    id: 1,
    name: '第1-2节',
    startSection: 1,
    endSection: 2,
    startTime: '08:00',
    endTime: '09:40',
    period: '上午',
    sort: 1,
    status: 1
  },
  {
    id: 2,
    name: '第3-4节',
    startSection: 3,
    endSection: 4,
    startTime: '10:00',
    endTime: '11:40',
    period: '上午',
    sort: 2,
    status: 1
  },
  {
    id: 3,
    name: '第5-6节',
    startSection: 5,
    endSection: 6,
    startTime: '14:00',
    endTime: '15:40',
    period: '下午',
    sort: 3,
    status: 1
  },
  {
    id: 4,
    name: '第7-8节',
    startSection: 7,
    endSection: 8,
    startTime: '16:00',
    endTime: '17:40',
    period: '下午',
    sort: 4,
    status: 1
  },
  {
    id: 5,
    name: '第9-10节',
    startSection: 9,
    endSection: 10,
    startTime: '19:00',
    endTime: '20:40',
    period: '晚上',
    sort: 5,
    status: 1
  },
  {
    id: 6,
    name: '第11-12节',
    startSection: 11,
    endSection: 12,
    startTime: '20:50',
    endTime: '22:30',
    period: '晚上',
    sort: 6,
    status: 1
  }
])

const tableData = ref<any[]>([...originalTableData.value])

const searchParams = reactive({
  name: '',
  period: ''
})

const pagination = reactive({ 
  page: 1, 
  pageSize: 10, 
  total: 100 
})

const form = reactive({
  id: 0,
  name: '',
  startSection: 1,
  endSection: 2,
  startTime: '',
  endTime: '',
  period: '上午',
  sort: 0,
  status: 1
})

// 监听节次名称变化，自动更新起止节
watch(() => form.name, (newName) => {
  const selectedOption = sectionOptions.value.find(option => option.label === newName)
  if (selectedOption) {
    form.startSection = selectedOption.start
    form.endSection = selectedOption.end
  }
})

const rules = reactive<FormRules>({
  name: [
    { required: true, message: '请选择节次名称', trigger: 'change' }
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

const handleSearch = () => {
  const filteredData = originalTableData.value.filter(item => {
    const nameMatch = !searchParams.name || item.name.includes(searchParams.name)
    const periodMatch = !searchParams.period || item.period === searchParams.period
    return nameMatch && periodMatch
  })
  
  tableData.value = filteredData
  pagination.total = filteredData.length
  
  if (filteredData.length === 0) {
    ElMessage.info('未找到匹配的节次')
  } else {
    ElMessage.success(`搜索成功，找到 ${filteredData.length} 条记录`)
  }
}

const handleReset = () => {
  searchParams.name = ''
  searchParams.period = ''
  tableData.value = [...originalTableData.value]
  pagination.total = 100
}

const handleAdd = () => {
  isEdit.value = false
  dialogTitle.value = '新增节次'
  Object.assign(form, {
    id: 0,
    name: '',
    startSection: 1,
    endSection: 2,
    startTime: '',
    endTime: '',
    period: '上午',
    sort: 0,
    status: 1
  })
  dialogVisible.value = true
}

const handleEdit = (row: any) => {
  isEdit.value = true
  dialogTitle.value = '编辑节次'
  Object.assign(form, row)
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
  ).then(() => {
    const index = tableData.value.findIndex(item => item.id === row.id)
    if (index !== -1) {
      tableData.value.splice(index, 1)
      ElMessage.success('删除成功')
    }
  }).catch(() => {})
}

const handleSubmit = () => {
  formRef.value?.validate((valid) => {
    if (valid) {
      if (isEdit.value) {
        const index = tableData.value.findIndex(item => item.id === form.id)
        if (index !== -1) {
          tableData.value[index] = { ...form }
          ElMessage.success('编辑成功')
        }
      } else {
        const newId = Math.max(...tableData.value.map(item => item.id)) + 1
        tableData.value.push({
          ...form,
          id: newId
        })
        ElMessage.success('新增成功')
      }
      dialogVisible.value = false
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
  // 初始化数据
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
