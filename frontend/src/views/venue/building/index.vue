<template>
  <div class="page-container">
    <el-card class="table-card">
      <template #header>
        <div class="card-header">
          <span>楼宇管理</span>
          <div class="header-right">
            <el-input v-model="searchParams.keyword" placeholder="楼宇编码/名称" class="search-input" clearable />
            <el-button type="success" @click="handleSearch" class="search-button">
              <el-icon><Search /></el-icon>搜索
            </el-button>
            <el-button type="default" @click="handleReset" class="reset-button">
              <el-icon><Refresh /></el-icon>重置
            </el-button>
            <el-button type="primary" @click="handleAdd">
              <el-icon><Plus /></el-icon>新增楼宇
            </el-button>
          </div>
        </div>
      </template>
      <el-table
        :data="tableData"
        v-loading="loading"
        border
        stripe
        style="width: 100%"
      >
        <el-table-column prop="BuildingID" label="ID" width="80" />
        <el-table-column prop="BuildingCode" label="楼宇编码" width="120" />
        <el-table-column prop="BuildingName" label="楼宇名称" width="200" />
        <el-table-column prop="Address" label="地址" />
        <el-table-column prop="TotalFloors" label="楼层数" width="100" />
        <el-table-column prop="UseType" label="楼宇类型" width="120">
          <template #default="{ row }">
            {{ row.UseType === 'teaching' ? '教学楼' : row.UseType === 'administration' ? '行政楼' : row.UseType === 'dormitory' ? '宿舍' : row.UseType === 'sports' ? '体育馆' : row.UseType }}
          </template>
        </el-table-column>
        <el-table-column prop="Status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.Status === 1 ? 'success' : 'danger'">
              {{ row.Status === 1 ? '正常' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150">
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
        <el-form-item label="楼宇编码" prop="BuildingCode">
          <el-input v-model="form.BuildingCode" placeholder="请输入楼宇编码" />
        </el-form-item>
        <el-form-item label="楼宇名称" prop="BuildingName">
          <el-input v-model="form.BuildingName" placeholder="请输入楼宇名称" />
        </el-form-item>
        <el-form-item label="地址" prop="Address">
          <el-input v-model="form.Address" placeholder="请输入地址" />
        </el-form-item>
        <el-form-item label="楼层数" prop="TotalFloors">
          <el-input-number v-model="form.TotalFloors" :min="1" placeholder="请输入楼层数" />
        </el-form-item>
        <el-form-item label="楼宇类型" prop="UseType">
          <el-select v-model="form.UseType" placeholder="请选择楼宇类型">
            <el-option label="教学楼" value="teaching" />
            <el-option label="行政楼" value="administration" />
            <el-option label="宿舍" value="dormitory" />
            <el-option label="体育馆" value="sports" />
            <el-option label="图书馆" value="library" />
            <el-option label="食堂" value="canteen" />
          </el-select>
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
const dialogTitle = ref('新增楼宇')
const isEdit = ref(false)
const formRef = ref<FormInstance>()

const tableData = ref<any[]>([])

const searchParams = reactive({
  keyword: ''
})

const pagination = reactive({ 
  page: 1, 
  pageSize: 10, 
  total: 0 
})

const form = reactive({
  BuildingID: 0,
  BuildingCode: '',
  BuildingName: '',
  BuildingNameEn: '',
  Address: '',
  TotalFloors: 1,
  Area: 0,
  BuildYear: 2020,
  UseType: 'teaching',
  Status: 1,
  SortOrder: 0
})

const rules = reactive<FormRules>({
  BuildingCode: [
    { required: true, message: '请输入楼宇编码', trigger: 'blur' }
  ],
  BuildingName: [
    { required: true, message: '请输入楼宇名称', trigger: 'blur' }
  ]
})

const fetchData = async () => {
  loading.value = true
  try {
    const result = await get('/buildings')
    let data = result || []
    
    if (searchParams.keyword) {
      data = data.filter((item: any) => 
        item.BuildingCode.toLowerCase().includes(searchParams.keyword.toLowerCase()) ||
        item.BuildingName.toLowerCase().includes(searchParams.keyword.toLowerCase())
      )
    }
    
    tableData.value = data
    pagination.total = tableData.value.length
  } catch (error) {
    console.error(error)
    ElMessage.error('获取楼宇列表失败')
    tableData.value = []
    pagination.total = 0
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  pagination.page = 1
  fetchData()
}

const handleReset = () => {
  searchParams.keyword = ''
  pagination.page = 1
  fetchData()
}

const handleAdd = () => {
  isEdit.value = false
  dialogTitle.value = '新增楼宇'
  Object.assign(form, {
    BuildingID: 0,
    BuildingCode: '',
    BuildingName: '',
    BuildingNameEn: '',
    Address: '',
    TotalFloors: 1,
    Area: 0,
    BuildYear: 2020,
    UseType: 'teaching',
    Status: 1,
    SortOrder: 0
  })
  dialogVisible.value = true
}

const handleEdit = (row: any) => {
  isEdit.value = true
  dialogTitle.value = '编辑楼宇'
  Object.assign(form, {
    BuildingID: row.BuildingID,
    BuildingCode: row.BuildingCode,
    BuildingName: row.BuildingName,
    BuildingNameEn: row.BuildingNameEn || '',
    Address: row.Address || '',
    TotalFloors: row.TotalFloors,
    Area: row.Area || 0,
    BuildYear: row.BuildYear || 2020,
    UseType: row.UseType,
    Status: row.Status,
    SortOrder: row.SortOrder || 0
  })
  dialogVisible.value = true
}

const handleDelete = (row: any) => {
  ElMessageBox.confirm(`确定要删除楼宇 "${row.BuildingName}" 吗？`, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  }).then(async () => {
    try {
      await del(`/buildings/${row.BuildingID}`)
      ElMessage.success('删除成功')
      fetchData()
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
          await put(`/buildings/${form.BuildingID}`, form)
          ElMessage.success('编辑成功')
        } else {
          await post('/buildings', form)
          ElMessage.success('新增成功')
        }
        dialogVisible.value = false
        fetchData()
      } catch (error) {
        ElMessage.error(isEdit.value ? '编辑失败' : '新增失败')
      }
    }
  })
}

const handleDialogClose = () => {
  formRef.value?.resetFields()
}

const handleSizeChange = () => {
  pagination.page = 1
  fetchData()
}

const handleCurrentChange = () => {
  fetchData()
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
  width: 200px;
}
.action-buttons {
  display: flex;
  gap: 5px;
}
</style>
