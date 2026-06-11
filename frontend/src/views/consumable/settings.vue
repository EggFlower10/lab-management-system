<template>
  <div class="page-container">
    <el-card class="main-card">
      <div class="page-title">耗材设置</div>

      <el-form :model="form" label-width="160px" class="settings-form">
        <el-form-item label="审批模式">
          <el-radio-group v-model="form.approvalMode">
            <el-radio value="single">一级审批</el-radio>
            <el-radio value="multi">二级审批</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="单次最大领用数量">
          <el-input-number v-model="form.maxOutQuantity" :min="1" :step="10" />
        </el-form-item>
        <el-form-item label="月度领用额度">
          <el-input-number v-model="form.monthlyLimit" :min="1" :step="50" />
        </el-form-item>
        <el-form-item label="低库存通知">
          <el-switch
            v-model="warningEnabled"
            active-text="开启"
            inactive-text="关闭"
          />
        </el-form-item>
      </el-form>

      <div class="actions">
        <el-button @click="loadSettings">重置</el-button>
        <el-button type="primary" :loading="saving" @click="handleSave">保存设置</el-button>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { get, post, put } from '@/utils/request'

interface SettingsForm {
  approvalMode: 'single' | 'multi'
  maxOutQuantity: number
  monthlyLimit: number
  warningNotification: string
}

interface ConfigItem {
  id: number
  configKey: string
  configValue: string
  name: string
  group?: string
  description?: string
}

const CONSUMABLE_CONFIG_META = {
  consumable_approval_mode: {
    name: '耗材审批模式',
    group: 'consumable',
    description: 'single=一级审批，multi=二级审批'
  },
  consumable_max_out_quantity: {
    name: '单次最大领用数量',
    group: 'consumable',
    description: '单个申请单允许的最大总领用数量'
  },
  consumable_monthly_out_limit: {
    name: '月度领用额度',
    group: 'consumable',
    description: '按申请人统计的月度总领用额度'
  },
  consumable_warning_notification: {
    name: '低库存通知开关',
    group: 'consumable',
    description: '1=开启低库存站内通知，0=关闭'
  }
} as const

const configMap = ref<Record<string, ConfigItem>>({})

const saving = ref(false)
const form = reactive<SettingsForm>({
  approvalMode: 'single',
  maxOutQuantity: 100,
  monthlyLimit: 500,
  warningNotification: '1'
})

const warningEnabled = computed({
  get: () => form.warningNotification === '1',
  set: (value: boolean) => {
    form.warningNotification = value ? '1' : '0'
  }
})

const loadSettings = async () => {
  const configs = await get<ConfigItem[]>('/configs')
  configMap.value = Object.fromEntries(configs.map((item) => [item.configKey, item]))

  form.approvalMode = (configMap.value.consumable_approval_mode?.configValue as 'single' | 'multi') || 'single'
  form.maxOutQuantity = Number(configMap.value.consumable_max_out_quantity?.configValue || 100)
  form.monthlyLimit = Number(configMap.value.consumable_monthly_out_limit?.configValue || 500)
  form.warningNotification = String(configMap.value.consumable_warning_notification?.configValue || '1')
}

const saveConfigValue = async (configKey: keyof typeof CONSUMABLE_CONFIG_META, configValue: string) => {
  const existing = configMap.value[configKey]
  const meta = CONSUMABLE_CONFIG_META[configKey]

  if (existing?.id) {
    await put(`/configs/${existing.id}`, {
      configKey,
      name: existing.name || meta.name,
      configValue,
      group: existing.group || meta.group,
      description: existing.description || meta.description
    })
    return
  }

  await post('/configs', {
    configKey,
    name: meta.name,
    configValue,
    group: meta.group,
    description: meta.description
  })
}

const handleSave = async () => {
  saving.value = true
  try {
    await Promise.all([
      saveConfigValue('consumable_approval_mode', form.approvalMode),
      saveConfigValue('consumable_max_out_quantity', String(form.maxOutQuantity)),
      saveConfigValue('consumable_monthly_out_limit', String(form.monthlyLimit)),
      saveConfigValue('consumable_warning_notification', form.warningNotification)
    ])
    ElMessage.success('保存成功')
    await loadSettings()
  } catch (error) {
    console.error(error)
  } finally {
    saving.value = false
  }
}

onMounted(() => {
  loadSettings()
})
</script>

<style scoped>
.page-container {
  padding: 20px;
}

.main-card {
  min-height: calc(100vh - 120px);
}

.page-title {
  margin-bottom: 24px;
  font-size: 18px;
  font-weight: 600;
}

.settings-form {
  max-width: 720px;
}

.actions {
  margin-top: 24px;
}
</style>
