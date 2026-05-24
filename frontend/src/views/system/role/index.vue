<template>
  <div class="page-container">
    <el-card class="search-card">
      <el-form :model="searchForm" inline>
        <el-form-item>
          <el-input v-model="searchForm.keyword" placeholder="角色名称/编码" clearable />
        </el-form-item>
        <el-form-item>
          <el-button type="success" class="btn-search" @click="handleSearch">
            <el-icon><Search /></el-icon>搜索
          </el-button>
          <el-button class="btn-reset" @click="handleReset">
            <el-icon><Refresh /></el-icon>重置
          </el-button>
          <el-button type="primary" class="btn-add" @click="handleAdd">
            <el-icon><Plus /></el-icon>新增角色
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card class="table-card">
      <el-table :data="tableData" v-loading="loading" border stripe>
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="name" label="角色名称" width="150" />
        <el-table-column prop="code" label="角色编码" width="150" />
        <el-table-column prop="description" label="描述" />
        <el-table-column prop="status" label="状态" width="80">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'danger'">
              {{ row.status === 1 ? '启用' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" fixed="right" width="280">
          <template #default="{ row }">
            <div class="action-buttons">
              <el-button type="primary" size="small" @click="handleEdit(row)">编辑</el-button>
              <el-button type="warning" size="small" @click="handleAssignPermission(row)">分配权限</el-button>
              <el-button
                :type="row.status === 1 ? 'danger' : 'success'"
                size="small"
                @click="handleStatusChange(row)"
              >
                {{ row.status === 1 ? '禁用' : '启用' }}
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
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </el-card>

    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="500px" @close="handleDialogClose">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="80px">
        <el-form-item label="角色名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入角色名称" />
        </el-form-item>
        <el-form-item label="角色编码" prop="code">
          <el-input v-model="form.code" placeholder="请输入角色编码" />
        </el-form-item>
        <el-form-item label="描述" prop="description">
          <el-input v-model="form.description" type="textarea" placeholder="请输入描述" />
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-radio-group v-model="form.status">
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

    <el-dialog v-model="permissionDialogVisible" title="分配权限" width="600px">
      <el-tree
        ref="permissionTreeRef"
        :data="permissionTree"
        show-checkbox
        node-key="id"
        default-expand-all
        :props="{ label: 'label', children: 'children' }"
      />
      <template #footer>
        <el-button @click="permissionDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handlePermissionSubmit">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox, FormInstance, FormRules } from 'element-plus'
import { Plus, Refresh, Search } from '@element-plus/icons-vue'
import { del, get, post, put } from '@/utils/request'

interface RoleItem {
  id: number
  name: string
  code: string
  description: string
  status: number
}

interface PermissionNode {
  id: number
  label: string
  children?: PermissionNode[]
}

const loading = ref(false)
const tableData = ref<RoleItem[]>([])
const dialogVisible = ref(false)
const permissionDialogVisible = ref(false)
const dialogTitle = ref('新增角色')
const isEdit = ref(false)
const formRef = ref<FormInstance>()
const permissionTreeRef = ref()

const searchForm = reactive({
  keyword: '',
})

const pagination = reactive({
  page: 1,
  pageSize: 20,
  total: 0,
})

const form = reactive<RoleItem>({
  id: 0,
  name: '',
  code: '',
  description: '',
  status: 1,
})

const permissionTree = ref<PermissionNode[]>([
  {
    id: 1,
    label: '系统管理',
    children: [
      { id: 11, label: '用户管理' },
      { id: 12, label: '角色管理' },
      { id: 13, label: '机构管理' },
      { id: 14, label: '部门管理' },
      { id: 15, label: '菜单管理' },
      { id: 16, label: '权限管理' },
      { id: 17, label: '系统配置' },
    ],
  },
  {
    id: 2,
    label: '教学信息管理',
    children: [
      { id: 21, label: '学期管理' },
      { id: 22, label: '班级管理' },
      { id: 23, label: '课程管理' },
      { id: 24, label: '任务管理' },
      { id: 25, label: '节次管理' },
    ],
  },
  {
    id: 3,
    label: '场馆信息管理',
    children: [
      { id: 31, label: '校区管理' },
      { id: 32, label: '楼宇管理' },
      { id: 33, label: '房间管理' },
    ],
  },
])

const rules: FormRules = {
  name: [{ required: true, message: '请输入角色名称', trigger: 'blur' }],
  code: [{ required: true, message: '请输入角色编码', trigger: 'blur' }],
}

const fetchData = async () => {
  loading.value = true
  try {
    const result = await get<RoleItem[]>('/roles')
    let data = result || []

    if (searchForm.keyword) {
      const keyword = searchForm.keyword.toLowerCase()
      data = data.filter((item) =>
        item.name?.toLowerCase().includes(keyword) || item.code?.toLowerCase().includes(keyword)
      )
    }

    tableData.value = data
    pagination.total = tableData.value.length
  } catch (error) {
    console.error(error)
    ElMessage.error('获取角色列表失败')
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
  form.id = 0
  form.name = ''
  form.code = ''
  form.description = ''
  form.status = 1
}

const handleAdd = () => {
  isEdit.value = false
  dialogTitle.value = '新增角色'
  resetForm()
  dialogVisible.value = true
}

const handleEdit = (row: RoleItem) => {
  isEdit.value = true
  dialogTitle.value = '编辑角色'
  form.id = row.id
  form.name = row.name
  form.code = row.code
  form.description = row.description || ''
  form.status = row.status
  dialogVisible.value = true
}

const handleStatusChange = (row: RoleItem) => {
  const newStatus = row.status === 1 ? 0 : 1
  const statusText = newStatus === 1 ? '启用' : '禁用'

  ElMessageBox.confirm(`确定要将该角色设置为“${statusText}”吗？`, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  }).then(async () => {
    try {
      await put(`/roles/${row.id}`, { ...row, status: newStatus })
      row.status = newStatus
      ElMessage.success(`${statusText}成功`)
    } catch (error) {
      ElMessage.error(`${statusText}失败`)
    }
  }).catch(() => {})
}

const handleDelete = (row: RoleItem) => {
  ElMessageBox.confirm('确定要删除该角色吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  }).then(async () => {
    try {
      await del(`/roles/${row.id}`)
      ElMessage.success('删除成功')
      fetchData()
    } catch (error) {
      ElMessage.error('删除失败')
    }
  }).catch(() => {})
}

const handleAssignPermission = (_row?: RoleItem) => {
  permissionDialogVisible.value = true
}

const handlePermissionSubmit = async () => {
  ElMessage.success('权限分配成功')
  permissionDialogVisible.value = false
}

const handleDialogClose = () => {
  formRef.value?.resetFields()
}

const handleSubmit = async () => {
  if (!formRef.value) return

  await formRef.value.validate(async (valid) => {
    if (!valid) return

    try {
      if (isEdit.value) {
        await put(`/roles/${form.id}`, form)
        ElMessage.success('更新成功')
      } else {
        await post('/roles', form)
        ElMessage.success('创建成功')
      }

      dialogVisible.value = false
      fetchData()
    } catch (error) {
      ElMessage.error(isEdit.value ? '更新失败' : '创建失败')
    }
  })
}

onMounted(() => {
  fetchData()
})
</script>

<style lang="scss" scoped>
.page-container {
  .search-card {
    margin-bottom: 20px;
  }

  .btn-search {
    background-color: #67c23a;
    border-color: #67c23a;
    color: #fff;

    &:hover {
      background-color: #85ce61;
      border-color: #85ce61;
    }
  }

  .btn-reset {
    background-color: #fff;
    border-color: #dcdfe6;
    color: #606266;

    &:hover {
      background-color: #f5f7fa;
      border-color: #c0c4cc;
    }
  }

  .btn-add {
    background-color: #409eff;
    border-color: #409eff;
    color: #fff;

    &:hover {
      background-color: #66b1ff;
      border-color: #66b1ff;
    }
  }

  .action-buttons {
    display: flex;
    gap: 8px;
  }
}
</style>
