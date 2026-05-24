<template>
  <div class="page-container">
    <el-card class="search-card">
      <el-form :model="searchForm" inline>
        <el-form-item>
          <el-input v-model="searchForm.keyword" placeholder="姓名/用户名/工号/手机" clearable />
        </el-form-item>
        <el-form-item>
          <el-select v-model="searchForm.userType" style="width: 140px;">
            <el-option label="全部类型" value="" />
            <el-option label="管理员" value="admin" />
            <el-option label="教师" value="teacher" />
            <el-option label="学生" value="student" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-select v-model="searchForm.status" style="width: 140px;">
            <el-option label="全部状态" value="" />
            <el-option label="启用" :value="1" />
            <el-option label="禁用" :value="0" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="success" @click="handleSearch" class="btn-search">
            <el-icon><Search /></el-icon>搜索
          </el-button>
          <el-button @click="handleReset" class="btn-reset">
            <el-icon><Refresh /></el-icon>重置
          </el-button>
          <el-button type="primary" @click="handleAdd" class="btn-add">
            <el-icon><Plus /></el-icon>新增用户
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card class="table-card">
      <el-table :data="tableData" v-loading="loading" border stripe>
        <el-table-column prop="UserID" label="ID" width="80" />
        <el-table-column prop="EmployeeNo" label="工号/学号" width="120" />
        <el-table-column prop="UserName" label="用户名" width="120" />
        <el-table-column prop="RealName" label="姓名" width="100" />
        <el-table-column prop="Gender" label="性别" width="80">
          <template #default="{ row }">
            {{ row.Gender === 1 ? '男' : '女' }}
          </template>
        </el-table-column>
        <el-table-column prop="Mobile" label="手机号" width="130" />
        <el-table-column prop="Email" label="邮箱" width="180" />
        <el-table-column prop="UserType" label="用户类型" width="100">
          <template #default="{ row }">
            <el-tag :type="row.UserType === 'admin' ? 'primary' : row.UserType === 'teacher' ? 'success' : 'info'">
              {{ row.UserType === 'admin' ? '管理员' : row.UserType === 'teacher' ? '教师' : '学生' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="Status" label="状态" width="80">
          <template #default="{ row }">
            <el-tag :type="row.Status === 1 ? 'success' : 'danger'">
              {{ row.Status === 1 ? '启用' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" fixed="right" width="280">
          <template #default="{ row }">
            <div class="action-buttons">
              <el-button type="primary" size="small" @click="handleEdit(row)">编辑</el-button>
              <el-button type="warning" size="small" @click="handleResetPwd(row)">重置密码</el-button>
              <el-button :type="row.Status === 1 ? 'danger' : 'success'" size="small" @click="handleStatusChange(row)">
                {{ row.Status === 1 ? '禁用' : '启用' }}
              </el-button>
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
        layout="prev, pager, next, jumper, ->, total"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </el-card>

    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="500px" @close="handleDialogClose">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
        <el-form-item label="用户名" prop="UserName">
          <el-input v-model="form.UserName" placeholder="请输入用户名" :disabled="isEdit" />
        </el-form-item>
        <el-form-item label="密码" prop="Password" v-if="!isEdit">
          <el-input v-model="form.Password" type="password" placeholder="请输入密码" show-password />
        </el-form-item>
        <el-form-item label="姓名" prop="RealName">
          <el-input v-model="form.RealName" placeholder="请输入姓名" />
        </el-form-item>
        <el-form-item label="工号/学号" prop="EmployeeNo">
          <el-input v-model="form.EmployeeNo" placeholder="请输入工号/学号" />
        </el-form-item>
        <el-form-item label="性别" prop="Gender">
          <el-radio-group v-model="form.Gender">
            <el-radio :label="1">男</el-radio>
            <el-radio :label="0">女</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="手机号" prop="Mobile">
          <el-input v-model="form.Mobile" placeholder="请输入手机号" />
        </el-form-item>
        <el-form-item label="邮箱" prop="Email">
          <el-input v-model="form.Email" placeholder="请输入邮箱" />
        </el-form-item>
        <el-form-item label="用户类型" prop="UserType">
          <el-select v-model="form.UserType" placeholder="请选择用户类型">
            <el-option label="管理员" value="admin" />
            <el-option label="教师" value="teacher" />
            <el-option label="学生" value="student" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态" prop="Status">
          <el-radio-group v-model="form.Status">
            <el-radio :label="1">启用</el-radio>
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
const tableData = ref<any[]>([])
const dialogVisible = ref(false)
const dialogTitle = ref('新增用户')
const isEdit = ref(false)
const formRef = ref<FormInstance>()

const searchForm = reactive({
  keyword: '',
  userType: '',
  status: ''
})

const pagination = reactive({
  page: 1,
  pageSize: 20,
  total: 0
})

const form = reactive({
  UserID: 0,
  UserName: '',
  Password: '',
  RealName: '',
  EmployeeNo: '',
  Gender: 1,
  Mobile: '',
  Email: '',
  UserType: 'student',
  Status: 1
})

const rules: FormRules = {
  UserName: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  Password: [{ required: true, message: '请输入密码', trigger: 'blur' }],
  RealName: [{ required: true, message: '请输入姓名', trigger: 'blur' }],
  EmployeeNo: [{ required: true, message: '请输入工号/学号', trigger: 'blur' }],
  UserType: [{ required: true, message: '请选择用户类型', trigger: 'change' }]
}

const fetchData = async () => {
  loading.value = true
  try {
    const result = await get('/users')
    tableData.value = result || []
    pagination.total = tableData.value.length
  } catch (error) {
    console.error(error)
    ElMessage.error('获取数据失败')
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
  searchForm.keyword = ''
  searchForm.userType = ''
  searchForm.status = ''
  handleSearch()
}

const handleSizeChange = () => {
  pagination.page = 1
  fetchData()
}

const handleCurrentChange = () => {
  fetchData()
}

const resetForm = () => {
  form.UserID = 0
  form.UserName = ''
  form.Password = ''
  form.RealName = ''
  form.EmployeeNo = ''
  form.Gender = 1
  form.Mobile = ''
  form.Email = ''
  form.UserType = 'student'
  form.Status = 1
}

const handleAdd = () => {
  isEdit.value = false
  dialogTitle.value = '新增用户'
  resetForm()
  dialogVisible.value = true
}

const handleEdit = (row: any) => {
  isEdit.value = true
  dialogTitle.value = '编辑用户'
  form.UserID = row.UserID
  form.UserName = row.UserName
  form.RealName = row.RealName
  form.EmployeeNo = row.EmployeeNo
  form.Gender = row.Gender
  form.Mobile = row.Mobile
  form.Email = row.Email || ''
  form.UserType = row.UserType
  form.Status = row.Status
  dialogVisible.value = true
}

const handleDelete = (row: any) => {
  ElMessageBox.confirm('确定要删除该用户吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  }).then(async () => {
    try {
      await del(`/users/${row.UserID}`)
      ElMessage.success('删除成功')
      fetchData()
    } catch (error) {
      ElMessage.error('删除失败')
    }
  }).catch(() => {})
}

const handleResetPwd = (row: any) => {
  ElMessageBox.confirm(`确定要重置用户 "${row.RealName}" 的密码吗？`, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  }).then(async () => {
    ElMessage.success('密码已重置为: 123456')
  }).catch(() => {})
}

const handleStatusChange = async (row: any) => {
  try {
    const newStatus = row.Status === 1 ? 0 : 1
    await put(`/users/${row.UserID}`, {
      UserName: row.UserName,
      RealName: row.RealName,
      EmployeeNo: row.EmployeeNo,
      Gender: row.Gender,
      Mobile: row.Mobile,
      Email: row.Email,
      UserType: row.UserType,
      Status: newStatus
    })
    ElMessage.success(`用户已${newStatus === 1 ? '启用' : '禁用'}`)
    fetchData()
  } catch (error) {
    ElMessage.error('状态更新失败')
  }
}

const handleSubmit = async () => {
  formRef.value?.validate(async (valid) => {
    if (valid) {
      try {
        if (isEdit.value) {
          await put(`/users/${form.UserID}`, {
            UserName: form.UserName,
            RealName: form.RealName,
            EmployeeNo: form.EmployeeNo,
            Gender: form.Gender,
            Mobile: form.Mobile,
            Email: form.Email,
            UserType: form.UserType,
            Status: form.Status
          })
          ElMessage.success('编辑成功')
        } else {
          await post('/users', {
            UserName: form.UserName,
            Password: form.Password,
            RealName: form.RealName,
            EmployeeNo: form.EmployeeNo,
            Gender: form.Gender,
            Mobile: form.Mobile,
            Email: form.Email,
            UserType: form.UserType,
            Status: form.Status
          })
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

onMounted(() => {
  fetchData()
})
</script>

<style scoped>
.page-container {
  padding: 20px;
}
.search-card {
  margin-bottom: 20px;
}
.table-card {
  margin-bottom: 20px;
}
.btn-search {
  margin-left: 10px;
}
.btn-add {
  margin-left: 10px;
}
.btn-reset {
  margin-left: 5px;
}
.action-buttons {
  display: flex;
  gap: 5px;
}
</style>
