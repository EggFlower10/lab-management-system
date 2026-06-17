<template>
  <div class="page-container">
    <el-card class="table-card">
      <div class="card-header">
        <div class="header-left">
          <el-button type="primary" @click="handleAdd(0)">
            <el-icon><Plus /></el-icon>新增菜单
          </el-button>
        </div>
        <div class="header-right">
          <el-button @click="handleExpandAll">
            <el-icon><ArrowDown /></el-icon>展开
          </el-button>
          <el-button @click="handleCollapseAll">
            <el-icon><ArrowUp /></el-icon>折叠
          </el-button>
          <el-button @click="handleRefresh">
            <el-icon><Refresh /></el-icon>刷新
          </el-button>
          <el-button type="success" @click="handleExport">
            <el-icon><Download /></el-icon>导出
          </el-button>
        </div>
      </div>
      <el-table
        ref="tableRef"
        :data="tableTreeData"
        v-loading="loading"
        border
        row-key="id"
        :tree-props="{ children: 'children', hasChildren: 'hasChildren' }"
        default-expand-all
      >
        <el-table-column prop="name" label="菜单名称" />
        <el-table-column prop="code" label="菜单编码" />
        <el-table-column prop="type" label="类型">
          <template #default="{ row }">
            <el-tag :type="row.type === 'menu' ? 'success' : row.type === 'button' ? 'warning' : 'info'">
              {{ row.type === 'menu' ? '菜单' : row.type === 'button' ? '按钮' : '目录' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="path" label="路由路径" />
        <el-table-column prop="component" label="组件路径" />
        <el-table-column prop="icon" label="图标" />
        <el-table-column prop="sort" label="排序" />
        <el-table-column prop="permission" label="权限标识" />
        <el-table-column prop="visible" label="显示">
          <template #default="{ row }">
            <el-tag :type="row.visible === 1 ? 'success' : 'danger'">
              {{ row.visible === 1 ? '显示' : '隐藏' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'danger'">
              {{ row.status === 1 ? '启用' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200">
          <template #default="{ row }">
            <el-button size="small" type="primary" @click="handleAdd(row.id)">
              新增子菜单
            </el-button>
            <el-button size="small" type="success" @click="handleEdit(row)">
              编辑
            </el-button>
            <el-button size="small" type="danger" @click="handleDelete(row)">
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="600px">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
        <el-form-item label="上级菜单">
          <el-tree-select
            v-model="form.parent_id"
            :data="menuTree"
            :props="{ label: 'name' }"
            node-key="id"
            placeholder="请选择上级菜单"
            :show-checkbox="false"
          />
        </el-form-item>
        <el-form-item label="菜单名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入菜单名称" />
        </el-form-item>
        <el-form-item label="菜单编码" prop="code">
          <el-input v-model="form.code" placeholder="请输入菜单编码" />
        </el-form-item>
        <el-form-item label="类型" prop="type">
          <el-select v-model="form.type" placeholder="请选择类型">
            <el-option label="目录" value="dir" />
            <el-option label="菜单" value="menu" />
            <el-option label="按钮" value="button" />
          </el-select>
        </el-form-item>
        <el-form-item label="路由路径" prop="path">
          <el-input v-model="form.path" placeholder="请输入路由路径" />
        </el-form-item>
        <el-form-item label="组件路径" prop="component">
          <el-input v-model="form.component" placeholder="请输入组件路径" />
        </el-form-item>
        <el-form-item label="图标">
          <el-input v-model="form.icon" placeholder="请输入图标名称" />
        </el-form-item>
        <el-form-item label="排序" prop="sort">
          <el-input-number v-model="form.sort" :min="0" />
        </el-form-item>
        <el-form-item label="权限标识">
          <el-input v-model="form.permission" placeholder="请输入权限标识" />
        </el-form-item>
        <el-form-item label="是否显示" prop="visible">
          <el-radio-group v-model="form.visible">
            <el-radio :label="1">显示</el-radio>
            <el-radio :label="0">隐藏</el-radio>
          </el-radio-group>
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
import { Plus, ArrowDown, ArrowUp, Refresh, Setting, Download } from '@element-plus/icons-vue'
import { get, post, put, del } from '@/utils/request'

const loading = ref(false)
const dialogVisible = ref(false)
const dialogTitle = ref('新增菜单')
const isEdit = ref(false)
const formRef = ref<FormInstance>()
const tableRef = ref()
const isExpandAll = ref(true)

const tableData = ref<any[]>([])

const tableTreeData = computed(() => {
  return buildTree(tableData.value, 0)
})

const menuTree = computed(() => {
  return buildTree(tableData.value, 0)
})

const form = reactive({
  id: 0,
  parent_id: 0,
  name: '',
  code: '',
  type: 'menu',
  path: '',
  component: '',
  icon: '',
  sort: 0,
  permission: '',
  visible: 1,
  status: 1
})

const rules = reactive<FormRules>({
  name: [
    { required: true, message: '请输入菜单名称', trigger: 'blur' }
  ],
  code: [
    { required: true, message: '请输入菜单编码', trigger: 'blur' }
  ],
  type: [
    { required: true, message: '请选择类型', trigger: 'change' }
  ],
  path: [
    { required: true, message: '请输入路由路径', trigger: 'blur' }
  ],
  sort: [
    { required: true, message: '请输入排序', trigger: 'blur' }
  ],
  visible: [
    { required: true, message: '请选择是否显示', trigger: 'change' }
  ],
  status: [
    { required: true, message: '请选择状态', trigger: 'change' }
  ]
})

function buildTree(data: any[], parentId: number): any[] {
  return data
    .filter(item => item.parent_id === parentId)
    .map(item => ({
      ...item,
      children: buildTree(data, item.id),
      hasChildren: data.some(child => child.parent_id === item.id)
    }))
}

async function fetchData() {
  loading.value = true
  try {
    const result = await get('/menus')
    tableData.value = result || []
  } catch (error) {
    console.error(error)
    ElMessage.error('获取数据失败')
  } finally {
    loading.value = false
  }
}

function handleExpandAll() {
  isExpandAll.value = true
  setTimeout(() => {
    if (tableRef.value) {
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
  setTimeout(() => {
    if (tableRef.value) {
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

async function handleExport() {
  try {
    const response = await get('/menus/export', null, { responseType: 'blob' })
    const url = window.URL.createObjectURL(new Blob([response], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    }))
    const link = document.createElement('a')
    link.href = url
    link.download = 'menu-list.xlsx'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
    ElMessage.success('导出成功')
  } catch (error) {
    console.error('导出失败:', error)
    ElMessage.error('导出失败')
  }
}

function handleAdd(parentId: number) {
  isEdit.value = false
  dialogTitle.value = parentId === 0 ? '新增根菜单' : '新增子菜单'
  Object.assign(form, {
    id: 0,
    parent_id: parentId,
    name: '',
    code: '',
    type: 'menu',
    path: '',
    component: '',
    icon: '',
    sort: 0,
    permission: '',
    visible: 1,
    status: 1
  })
  dialogVisible.value = true
}

function handleEdit(row: any) {
  isEdit.value = true
  dialogTitle.value = '编辑菜单'
  Object.assign(form, { ...row })
  dialogVisible.value = true
}

function handleDelete(row: any) {
  ElMessageBox.confirm(
    `确定要删除菜单 "${row.name}" 吗？`,
    '删除确认',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(async () => {
    try {
      await del(`/menus/${row.id}`)
      ElMessage.success('删除成功')
      fetchData()
    } catch (error) {
      ElMessage.error('删除失败')
    }
  }).catch(() => {})
}

async function handleSubmit() {
  if (!formRef.value) return
  await formRef.value.validate(async (valid) => {
    if (valid) {
      try {
        if (isEdit.value) {
          await put(`/menus/${form.id}`, form)
          ElMessage.success('编辑成功')
        } else {
          await post('/menus', form)
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
