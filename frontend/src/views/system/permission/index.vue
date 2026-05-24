<template>
  <div class="page-container">
    <el-card class="table-card">
      <template #header>
        <div class="card-header">
          <div class="header-left">
            <el-button type="primary" @click="handleExpandAll">
              <el-icon><ArrowDown /></el-icon>全部展开
            </el-button>
            <el-button type="primary" @click="handleCollapseAll">
              <el-icon><ArrowUp /></el-icon>全部折叠
            </el-button>
          </div>
          <div class="header-right">
            <el-button @click="handleRefresh">
              <el-icon><Refresh /></el-icon>重置
            </el-button>
            <el-button type="primary" @click="handleAdd(0)">
              <el-icon><Plus /></el-icon>新增权限
            </el-button>
          </div>
        </div>
      </template>
      <el-table
        ref="tableRef"
        :data="tableTreeData"
        v-loading="loading"
        row-key="id"
        border
        :default-expand-all="isExpandAll"
        :tree-props="{ children: 'children', hasChildren: 'hasChildren' }"
      >
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="name" label="权限名称" width="200" />
        <el-table-column prop="code" label="权限编码" width="200" />
        <el-table-column prop="type" label="类型" width="100">
          <template #default="{ row }">
            <el-tag :type="row.type === 'menu' ? 'primary' : 'warning'">
              {{ row.type === 'menu' ? '菜单' : '按钮' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="path" label="API路径" width="250" />
        <el-table-column prop="method" label="HTTP方法" width="100">
          <template #default="{ row }">
            <el-tag :type="methodTagType(row.method)">{{ row.method }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="sort" label="排序" width="80" />
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
              <el-button type="warning" size="small" @click="handleAdd(row.id)">
                <el-icon><Plus /></el-icon>新增下级
              </el-button>
              <el-button type="primary" size="small" @click="handleEdit(row)">编辑</el-button>
              <el-button type="danger" size="small" @click="handleDelete(row)">删除</el-button>
            </div>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="600px" @close="handleDialogClose">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
        <el-form-item label="父级权限" prop="parent_id">
          <el-tree-select
            v-model="form.parent_id"
            :data="permissionTree"
            :props="{ label: 'name', children: 'children' } as const"
            check-strictly
            clearable
            placeholder="请选择父级权限"
          />
        </el-form-item>
        <el-form-item label="权限名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入权限名称" />
        </el-form-item>
        <el-form-item label="权限编码" prop="code">
          <el-input v-model="form.code" placeholder="请输入权限编码" />
        </el-form-item>
        <el-form-item label="类型" prop="type">
          <el-radio-group v-model="form.type">
            <el-radio label="menu">菜单</el-radio>
            <el-radio label="button">按钮</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="API路径" prop="path">
          <el-input v-model="form.path" placeholder="请输入API路径" />
        </el-form-item>
        <el-form-item label="HTTP方法" prop="method">
          <el-select v-model="form.method" placeholder="请选择HTTP方法">
            <el-option label="GET" value="GET" />
            <el-option label="POST" value="POST" />
            <el-option label="PUT" value="PUT" />
            <el-option label="DELETE" value="DELETE" />
          </el-select>
        </el-form-item>
        <el-form-item label="排序" prop="sort">
          <el-input-number v-model="form.sort" :min="0" :max="999" />
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
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox, FormInstance, FormRules } from 'element-plus'
import { Plus, ArrowDown, ArrowUp, Refresh } from '@element-plus/icons-vue'
import { get, post, put, del } from '@/utils/request'

const loading = ref(false)
const dialogVisible = ref(false)
const dialogTitle = ref('新增权限')
const isEdit = ref(false)
const formRef = ref<FormInstance>()
const tableRef = ref()
const isExpandAll = ref(true)

const originalTableData = ref<any[]>([])

const fetchData = async () => {
  loading.value = true
  try {
    const result = await get('/permissions')
    originalTableData.value = result || []
  } catch (error) {
    console.error(error)
    ElMessage.error('获取权限列表失败')
    originalTableData.value = []
  } finally {
    loading.value = false
  }
}

const tableTreeData = computed(() => {
  return buildTree(originalTableData.value, 0)
})

const permissionTree = computed(() => {
  return buildTree(originalTableData.value, 0)
})

const form = reactive({
  id: 0,
  parent_id: 0 as number | null,
  name: '',
  code: '',
  type: 'menu',
  path: '',
  method: 'GET',
  sort: 0,
  status: 1
})

const rules = reactive<FormRules>({
  name: [
    { required: true, message: '请输入权限名称', trigger: 'blur' }
  ],
  code: [
    { required: true, message: '请输入权限编码', trigger: 'blur' }
  ],
  type: [
    { required: true, message: '请选择类型', trigger: 'change' }
  ],
  path: [
    { required: true, message: '请输入API路径', trigger: 'blur' }
  ],
  method: [
    { required: true, message: '请选择HTTP方法', trigger: 'change' }
  ],
  sort: [
    { required: true, message: '请输入排序', trigger: 'blur' }
  ],
  status: [
    { required: true, message: '请选择状态', trigger: 'change' }
  ]
})

type TagType = 'primary' | 'success' | 'warning' | 'info' | 'danger' | undefined

const methodTagType = (method: string): TagType => {
  const types: Record<string, TagType> = { 
    GET: 'success', 
    POST: 'primary', 
    PUT: 'warning', 
    DELETE: 'danger' 
  }
  return types[method] || 'info'
}

function buildTree(data: any[], parentId: number): any[] {
  return data
    .filter(item => item.parent_id === parentId)
    .map(item => ({
      ...item,
      children: buildTree(data, item.id),
      hasChildren: data.some(child => child.parent_id === item.id)
    }))
}

function handleExpandAll() {
  isExpandAll.value = true
  // 重新渲染表格以应用默认展开状态
  originalTableData.value = [...originalTableData.value]
  // 强制重新渲染表格组件
  setTimeout(() => {
    if (tableRef.value) {
      // 遍历所有数据并展开
      const expandAll = (data: any[]) => {
        data.forEach((item) => {
          if (tableRef.value) {
            tableRef.value.toggleRowExpansion(item, true)
          }
          if (item.children && item.children.length > 0) {
            expandAll(item.children)
          }
        })
      }
      expandAll(tableTreeData.value)
    }
  }, 0)
}

function handleCollapseAll() {
  isExpandAll.value = false
  // 重新渲染表格以应用默认折叠状态
  originalTableData.value = [...originalTableData.value]
  // 强制重新渲染表格组件
  setTimeout(() => {
    if (tableRef.value) {
      // 遍历所有数据并折叠
      const collapseAll = (data: any[]) => {
        data.forEach((item) => {
          if (tableRef.value) {
            tableRef.value.toggleRowExpansion(item, false)
          }
          if (item.children && item.children.length > 0) {
            collapseAll(item.children)
          }
        })
      }
      collapseAll(tableTreeData.value)
    }
  }, 0)
}

function handleRefresh() {
  fetchData()
}

function handleAdd(parentId: number) {
  isEdit.value = false
  dialogTitle.value = parentId === 0 ? '新增权限' : '新增下级权限'
  Object.assign(form, {
    id: 0,
    parent_id: parentId as number | null,
    name: '',
    code: '',
    type: 'menu',
    path: '',
    method: 'GET',
    sort: 0,
    status: 1
  })
  dialogVisible.value = true
}

function handleEdit(row: any) {
  isEdit.value = true
  dialogTitle.value = '编辑权限'
  Object.assign(form, { ...row })
  dialogVisible.value = true
}

async function handleDelete(row: any) {
  ElMessageBox.confirm(
    `确定要删除权限 "${row.name}" 吗？`,
    '删除确认',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(async () => {
    try {
      await del(`/permissions/${row.id}`)
      await fetchData()
      ElMessage.success('删除成功')
    } catch (error) {
      console.error(error)
      ElMessage.error('删除失败')
    }
  }).catch(() => {})
}

async function handleSubmit() {
  formRef.value?.validate(async (valid) => {
    if (valid) {
      try {
        if (isEdit.value) {
          await put(`/permissions/${form.id}`, { ...form })
          ElMessage.success('编辑成功')
        } else {
          await post('/permissions', { ...form })
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

function handleDialogClose() {
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

.table-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-left {
  display: flex;
  gap: 10px;
}

.action-buttons {
  display: flex;
  gap: 10px;
}

.header-right {
  display: flex;
  gap: 10px;
  align-items: center;
}
</style>