<template>
  <div class="page-container">
    <el-card class="table-card">
      <template #header>
        <div class="card-header">
          <span>系统配置</span>
          <div class="header-right">
            <el-input v-model="searchParams.keyword" placeholder="配置Key/名称" class="search-input" clearable />
            <el-select v-model="searchParams.group" placeholder="全部分组" class="search-select">
              <el-option label="全部分组" value="" />
              <el-option label="系统设置" value="system" />
              <el-option label="安全设置" value="security" />
              <el-option label="设备管理" value="equipment" />
              <el-option label="耗材管理" value="consumable" />
              <el-option label="排课管理" value="reservation" />
              <el-option label="教学管理" value="teaching" />
              <el-option label="场地管理" value="venue" />
              <el-option label="通知设置" value="notification" />
              <el-option label="其他设置" value="other" />
            </el-select>
            <el-button type="success" @click="handleSearch">
              <el-icon><Search /></el-icon>搜索
            </el-button>
            <el-button @click="handleReset">
              <el-icon><Refresh /></el-icon>重置
            </el-button>
            <el-button type="primary" @click="handleAdd">
              <el-icon><Plus /></el-icon>新增配置
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
        <el-table-column prop="configKey" label="配置Key" width="200" />
        <el-table-column prop="name" label="名称" width="150" />
        <el-table-column prop="configValue" label="值" width="150" />
        <el-table-column prop="group" label="分组" width="120">
          <template #default="{ row }">
            <el-tag :type="getGroupTagType(row.group)">
              {{ getGroupLabel(row.group) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="description" label="备注" />
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
        <el-form-item label="配置Key" prop="configKey">
          <el-input v-model="form.configKey" placeholder="请输入配置Key" />
        </el-form-item>
        <el-form-item label="名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入配置名称" />
        </el-form-item>
        <el-form-item label="值" prop="configValue">
          <el-input v-model="form.configValue" placeholder="请输入配置值" />
        </el-form-item>
        <el-form-item label="分组" prop="group">
          <el-select v-model="form.group" placeholder="请选择分组">
            <el-option label="系统设置" value="system" />
            <el-option label="安全设置" value="security" />
            <el-option label="设备管理" value="equipment" />
            <el-option label="耗材管理" value="consumable" />
            <el-option label="排课管理" value="reservation" />
            <el-option label="教学管理" value="teaching" />
            <el-option label="场地管理" value="venue" />
            <el-option label="通知设置" value="notification" />
            <el-option label="其他设置" value="other" />
          </el-select>
        </el-form-item>
        <el-form-item label="备注" prop="description">
          <el-input v-model="form.description" type="textarea" :rows="3" placeholder="请输入备注" />
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
const dialogTitle = ref('新增配置')
const isEdit = ref(false)
const formRef = ref<FormInstance>()

const tableData = ref<any[]>([])
const originalData = ref<any[]>([])

const searchParams = reactive({
  keyword: '',
  group: ''
})

const pagination = reactive({ 
  page: 1, 
  pageSize: 10, 
  total: 0 
})

const renderTable = () => {
  const start = (pagination.page - 1) * pagination.pageSize
  const end = start + pagination.pageSize
  tableData.value = originalData.value.slice(start, end)
}

const form = reactive({
  id: 0,
  configKey: '',
  name: '',
  configValue: '',
  group: 'system',
  description: ''
})

const rules = reactive<FormRules>({
  configKey: [
    { required: true, message: '请输入配置Key', trigger: 'blur' }
  ],
  name: [
    { required: true, message: '请输入配置名称', trigger: 'blur' }
  ],
  configValue: [
    { required: true, message: '请输入配置值', trigger: 'blur' }
  ],
  group: [
    { required: true, message: '请选择分组', trigger: 'change' }
  ]
})

// 分组标签映射
const groupLabelMap: Record<string, string> = {
  'system': '系统设置',
  'security': '安全设置',
  'equipment': '设备管理',
  'consumable': '耗材管理',
  'reservation': '排课管理',
  'teaching': '教学管理',
  'venue': '场地管理',
  'notification': '通知设置',
  'other': '其他设置'
}

// 分组标签类型映射
const groupTagTypeMap: Record<string, string> = {
  'system': 'primary',
  'security': 'danger',
  'equipment': 'warning',
  'consumable': 'success',
  'reservation': 'info',
  'teaching': '',
  'venue': 'warning',
  'notification': 'success',
  'other': 'info'
}

const getGroupLabel = (group: string) => {
  return groupLabelMap[group] || '其他设置'
}

const getGroupTagType = (group: string) => {
  return groupTagTypeMap[group] || 'info'
}

const fetchData = async () => {
  loading.value = true
  try {
    const result = await get('/configs')
    const data = result || []
    data.sort((a: any, b: any) => {
      if (a.group !== b.group) {
        return (a.group || '').localeCompare(b.group || '')
      }
      return (a.sortOrder || 0) - (b.sortOrder || 0)
    })
    originalData.value = data
    pagination.total = data.length
    pagination.page = 1
    renderTable()
  } catch (error) {
    console.error(error)
    ElMessage.error('获取配置列表失败')
    tableData.value = []
    originalData.value = []
    pagination.total = 0
  } finally {
    loading.value = false
  }
}

const handleSearch = async () => {
  loading.value = true
  try {
    const result = await get('/configs')
    let data = result || []
    data.sort((a: any, b: any) => {
      if (a.group !== b.group) {
        return (a.group || '').localeCompare(b.group || '')
      }
      return (a.sortOrder || 0) - (b.sortOrder || 0)
    })
    
    const filteredData = data.filter(item => {
      const keywordMatch = !searchParams.keyword || 
        item.configKey.toLowerCase().includes(searchParams.keyword.toLowerCase()) ||
        item.name.toLowerCase().includes(searchParams.keyword.toLowerCase())
      
      const groupMatch = !searchParams.group || item.group === searchParams.group
      
      return keywordMatch && groupMatch
    })
    
    originalData.value = filteredData
    pagination.total = filteredData.length
    pagination.page = 1
    renderTable()
    
    if (filteredData.length === 0) {
      ElMessage.info('未找到匹配的配置项')
    }
  } catch (error) {
    ElMessage.error('搜索失败')
  } finally {
    loading.value = false
  }
}

const handleReset = () => {
  searchParams.keyword = ''
  searchParams.group = ''
  fetchData()
}

const handleAdd = () => {
  isEdit.value = false
  dialogTitle.value = '新增配置'
  Object.assign(form, {
    id: 0,
    configKey: '',
    name: '',
    configValue: '',
    group: 'system',
    description: ''
  })
  dialogVisible.value = true
}

const handleEdit = (row: any) => {
  isEdit.value = true
  dialogTitle.value = '编辑配置'
  Object.assign(form, {
    id: row.id,
    configKey: row.configKey,
    name: row.name,
    configValue: row.configValue,
    group: row.group,
    description: row.description
  })
  dialogVisible.value = true
}

const handleDelete = (row: any) => {
  ElMessageBox.confirm(
    `确定要删除配置 "${row.name}" 吗？`,
    '删除确认',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(async () => {
    try {
      await del(`/configs/${row.id}`)
      await fetchData()
      ElMessage.success('删除成功')
    } catch (error) {
      ElMessage.error('删除失败')
    }
  }).catch(() => {})
}

const handleSubmit = async () => {
  formRef.value?.validate(async (valid) => {
    if (valid) {
      try {
        if (isEdit.value) {
          await put(`/configs/${form.id}`, {
            configKey: form.configKey,
            name: form.name,
            configValue: form.configValue,
            group: form.group,
            description: form.description
          })
          ElMessage.success('编辑成功')
        } else {
          await post('/configs', {
            configKey: form.configKey,
            name: form.name,
            configValue: form.configValue,
            group: form.group,
            description: form.description
          })
          ElMessage.success('新增成功')
        }
        dialogVisible.value = false
        await fetchData()
      } catch (error) {
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
  renderTable()
}

const handleCurrentChange = (page: number) => {
  pagination.page = page
  renderTable()
}

onMounted(() => {
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
  width: 250px;
}

.search-select {
  width: 150px;
}

.action-buttons {
  display: flex;
  gap: 10px;
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
}
</style>
