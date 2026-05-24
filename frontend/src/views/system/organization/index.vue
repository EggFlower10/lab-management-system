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
              <el-icon><Plus /></el-icon>新增机构
            </el-button>
          </div>
        </div>
      </template>
      <el-table
        ref="tableRef"
        :data="tableTreeData"
        v-loading="loading"
        row-key="InstitutionID"
        border
        :default-expand-all="isExpandAll"
        :tree-props="{ children: 'children', hasChildren: 'hasChildren' }"
      >
        <el-table-column prop="InstitutionID" label="ID" width="80" />
        <el-table-column prop="InstitutionCode" label="机构编码" width="150" />
        <el-table-column prop="InstitutionName" label="机构名称" width="200" />
        <el-table-column prop="SortOrder" label="排序" width="80" />
        <el-table-column prop="Status" label="状态" width="80">
          <template #default="{ row }">
            <el-tag :type="row.Status === 1 ? 'success' : 'danger'">
              {{ row.Status === 1 ? '启用' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="Description" label="备注" />
        <el-table-column label="操作" fixed="right" width="240">
          <template #default="{ row }">
            <div class="action-buttons">
              <el-button type="warning" size="small" @click="handleAdd(row.InstitutionID)">
                <el-icon><Plus /></el-icon>新增子级
              </el-button>
              <el-button type="primary" size="small" @click="handleEdit(row)">编辑</el-button>
              <el-button type="danger" size="small" @click="handleDelete(row)">删除</el-button>
            </div>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="500px" @close="handleDialogClose">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
        <el-form-item label="上级机构" prop="ParentID">
          <el-tree-select
            v-model="form.ParentID"
            :data="orgTree"
            :props="{ label: 'InstitutionName', children: 'children' }"
            check-strictly
            clearable
            placeholder="请选择上级机构"
          />
        </el-form-item>
        <el-form-item label="机构名称" prop="InstitutionName">
          <el-input v-model="form.InstitutionName" placeholder="请输入机构名称" />
        </el-form-item>
        <el-form-item label="机构编码" prop="InstitutionCode">
          <el-input v-model="form.InstitutionCode" placeholder="请输入机构编码" />
        </el-form-item>
        <el-form-item label="排序" prop="SortOrder">
          <el-input-number v-model="form.SortOrder" :min="0" />
        </el-form-item>
        <el-form-item label="备注" prop="Description">
          <el-input v-model="form.Description" type="textarea" placeholder="请输入备注" />
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
import { ref, reactive, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox, FormInstance, FormRules } from 'element-plus'
import { Plus, ArrowDown, ArrowUp, Refresh } from '@element-plus/icons-vue'
import { get, post, put, del } from '@/utils/request'

const loading = ref(false)
const dialogVisible = ref(false)
const dialogTitle = ref('新增机构')
const isEdit = ref(false)
const formRef = ref<FormInstance>()
const tableRef = ref()
const isExpandAll = ref(true)

const tableData = ref<any[]>([])

const tableTreeData = computed(() => {
  return buildTree(tableData.value, 0)
})

const orgTree = computed(() => {
  return buildTree(tableData.value, 0)
})

const form = reactive({
  InstitutionID: 0,
  ParentID: 0,
  InstitutionName: '',
  InstitutionCode: '',
  SortOrder: 0,
  Description: '',
  Status: 1
})

const rules = reactive<FormRules>({
  InstitutionName: [
    { required: true, message: '请输入机构名称', trigger: 'blur' }
  ],
  InstitutionCode: [
    { required: true, message: '请输入机构编码', trigger: 'blur' }
  ]
})

function buildTree(data: any[], parentId: number): any[] {
  return data
    .filter(item => item.ParentID === parentId)
    .map(item => ({
      ...item,
      children: buildTree(data, item.InstitutionID),
      hasChildren: data.some(child => child.ParentID === item.InstitutionID)
    }))
}

async function fetchData() {
  loading.value = true
  try {
    const result = await get('/organizations')
    tableData.value = Array.isArray(result) ? result : []
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

function handleAdd(ParentID: number) {
  isEdit.value = false
  dialogTitle.value = ParentID === 0 ? '新增根机构' : '新增子机构'
  Object.assign(form, {
    InstitutionID: 0,
    ParentID: ParentID,
    InstitutionName: '',
    InstitutionCode: '',
    SortOrder: 0,
    Description: '',
    Status: 1
  })
  dialogVisible.value = true
}

function handleEdit(row: any) {
  isEdit.value = true
  dialogTitle.value = '编辑机构'
  Object.assign(form, {
    InstitutionID: row.InstitutionID,
    ParentID: row.ParentID,
    InstitutionName: row.InstitutionName,
    InstitutionCode: row.InstitutionCode,
    SortOrder: row.SortOrder,
    Description: row.Description,
    Status: row.Status
  })
  dialogVisible.value = true
}

function handleDelete(row: any) {
  ElMessageBox.confirm(
    `确定要删除机构 "${row.InstitutionName}" 吗？`,
    '删除确认',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(async () => {
    try {
      await del(`/organizations/${row.InstitutionID}`)
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
        const data = {
          ...form,
          ParentID: form.ParentID || 0
        }
        if (isEdit.value) {
          await put(`/organizations/${form.InstitutionID}`, data)
          ElMessage.success('编辑成功')
        } else {
          await post('/organizations', data)
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

.header-right {
  display: flex;
  gap: 10px;
}

.action-buttons {
  display: flex;
  gap: 8px;
}
</style>
