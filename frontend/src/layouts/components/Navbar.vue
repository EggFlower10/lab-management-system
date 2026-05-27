<template>
  <div class="navbar">
    <div class="left-menu">
      <el-icon class="hamburger" @click="toggleSidebar">
        <Fold v-if="!collapsed" />
        <Expand v-else />
      </el-icon>
      <Breadcrumb class="breadcrumb-wrapper" />
    </div>
    <div class="right-menu">
      <div class="notification-container" @click="toggleNotificationDrawer">
        <el-badge :value="unreadCount" :max="99" class="notification-badge">
          <el-icon class="notification-icon"><Bell /></el-icon>
        </el-badge>
      </div>
      <el-dropdown class="avatar-container" trigger="click">
        <div class="avatar-wrapper">
          <el-avatar :size="30" :src="avatar">
            <el-icon><UserFilled /></el-icon>
          </el-avatar>
          <span class="username">{{ realName || username }}</span>
          <el-icon class="el-icon--right"><ArrowDown /></el-icon>
        </div>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item @click="handleProfile">
              <el-icon><User /></el-icon>
              个人中心
            </el-dropdown-item>
            <el-dropdown-item @click="handlePassword">
              <el-icon><Lock /></el-icon>
              修改密码
            </el-dropdown-item>
            <el-dropdown-item divided @click="handleLogout">
              <el-icon><SwitchButton /></el-icon>
              退出登录
            </el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </div>
  </div>

  <el-drawer v-model="notificationDrawerVisible" title="消息通知" :size="400" placement="right">
    <div class="notification-drawer">
      <div class="drawer-header">
        <span class="title">消息通知</span>
        <el-button size="small" @click="markAllRead" v-if="unreadCount > 0">全部标为已读</el-button>
      </div>
      
      <div v-if="notifications.length === 0" class="empty-state">
        <el-icon class="empty-icon"><Bell /></el-icon>
        <p>暂无消息</p>
      </div>
      
      <div v-else class="notification-list">
        <div 
          v-for="notification in notifications" 
          :key="notification.id" 
          class="notification-item"
          :class="{ 'is-unread': !notification.is_read }"
          @click="markAsRead(notification.id)"
        >
          <div class="notification-icon">
            <el-icon v-if="getNotificationIcon(notification.notification_type)">
              <component :is="getNotificationIcon(notification.notification_type)" />
            </el-icon>
          </div>
          <div class="notification-content">
            <div class="notification-title">{{ notification.title }}</div>
            <div class="notification-text">{{ notification.content }}</div>
            <div class="notification-time">{{ formatTime(notification.created_at) }}</div>
          </div>
          <div v-if="!notification.is_read" class="unread-dot"></div>
        </div>
      </div>
    </div>
  </el-drawer>

  <el-dialog v-model="passwordDialogVisible" title="修改密码" width="400px">
    <el-form ref="passwordFormRef" :model="passwordForm" :rules="passwordRules" label-width="80px">
      <el-form-item label="原密码" prop="oldPassword">
        <el-input v-model="passwordForm.oldPassword" type="password" show-password placeholder="请输入原密码" />
      </el-form-item>
      <el-form-item label="新密码" prop="newPassword">
        <el-input v-model="passwordForm.newPassword" type="password" show-password placeholder="请输入新密码" />
      </el-form-item>
      <el-form-item label="确认密码" prop="confirmPassword">
        <el-input v-model="passwordForm.confirmPassword" type="password" show-password placeholder="请确认新密码" />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="passwordDialogVisible = false">取消</el-button>
      <el-button type="primary" @click="submitPassword">确定</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue'
import { ElMessageBox, ElMessage, FormInstance, FormRules } from 'element-plus'
import { useAppStore, useUserStore } from '@/stores'
import Breadcrumb from './Breadcrumb.vue'
import { get, put } from '@/utils/request'
import { Bell, Message, Warning, Clock, CircleCheck, CircleClose } from '@element-plus/icons-vue'

const appStore = useAppStore()
const userStore = useUserStore()

const collapsed = computed(() => appStore.sidebar.collapsed)
const username = computed(() => userStore.username)
const realName = computed(() => userStore.realName)
const avatar = computed(() => userStore.avatar)

const toggleSidebar = () => {
  appStore.toggleSidebar()
}

const notificationDrawerVisible = ref(false)
const notifications = ref<any[]>([])
const unreadCount = ref(0)
let refreshTimer: number | null = null

const toggleNotificationDrawer = () => {
  notificationDrawerVisible.value = !notificationDrawerVisible.value
  if (notificationDrawerVisible.value) {
    loadNotifications()
  }
}

const loadNotifications = async () => {
  try {
    const res = await get('/notification')
    notifications.value = res || []
    unreadCount.value = notifications.value.filter(n => !n.is_read).length
  } catch (error) {
    console.error('加载通知失败:', error)
  }
}

const loadUnreadCount = async () => {
  try {
    const res = await get('/notification/count-unread')
    unreadCount.value = res?.count || 0
  } catch (error) {
    console.error('获取未读数量失败:', error)
  }
}

const markAsRead = async (id: number) => {
  try {
    await put(`/notification/${id}/read`)
    const notification = notifications.value.find(n => n.id === id)
    if (notification) {
      notification.is_read = 1
      unreadCount.value--
    }
  } catch (error) {
    console.error('标记已读失败:', error)
  }
}

const markAllRead = async () => {
  try {
    await put('/notification/all-read')
    notifications.value.forEach(n => n.is_read = 1)
    unreadCount.value = 0
    ElMessage.success('已全部标为已读')
  } catch (error) {
    console.error('全部标为已读失败:', error)
  }
}

const getNotificationIcon = (type: string) => {
  const icons: Record<string, any> = {
    borrow_apply: Message,
    borrow_approved: CircleCheck,
    borrow_rejected: CircleClose,
    borrow_receive: CircleCheck,
    borrow_return: CircleCheck,
    borrow_damaged: Warning,
    overdue: Warning,
    calibration: Clock,
    test: Bell
  }
  return icons[type] || Bell
}

const formatTime = (dateStr: string) => {
  const date = new Date(dateStr)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  
  if (days === 0) {
    const hours = Math.floor(diff / (1000 * 60 * 60))
    if (hours === 0) {
      const minutes = Math.floor(diff / (1000 * 60))
      return minutes <= 0 ? '刚刚' : `${minutes}分钟前`
    }
    return `${hours}小时前`
  } else if (days === 1) {
    return '昨天'
  } else if (days < 7) {
    return `${days}天前`
  } else {
    return date.toLocaleDateString('zh-CN')
  }
}

onMounted(() => {
  loadUnreadCount()
  refreshTimer = window.setInterval(loadUnreadCount, 30000)
})

onUnmounted(() => {
  if (refreshTimer) {
    clearInterval(refreshTimer)
  }
})

const handleProfile = () => {
  ElMessage.info('个人中心功能开发中')
}

const passwordDialogVisible = ref(false)
const passwordFormRef = ref<FormInstance>()
const passwordForm = reactive({
  oldPassword: '',
  newPassword: '',
  confirmPassword: '',
})

const validateConfirmPassword = (_rule: any, value: string, callback: any) => {
  if (value !== passwordForm.newPassword) {
    callback(new Error('两次输入的密码不一致'))
  } else {
    callback()
  }
}

const passwordRules: FormRules = {
  oldPassword: [{ required: true, message: '请输入原密码', trigger: 'blur' }],
  newPassword: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 6, message: '密码长度不能少于6位', trigger: 'blur' },
  ],
  confirmPassword: [
    { required: true, message: '请确认新密码', trigger: 'blur' },
    { validator: validateConfirmPassword, trigger: 'blur' },
  ],
}

const handlePassword = () => {
  passwordForm.oldPassword = ''
  passwordForm.newPassword = ''
  passwordForm.confirmPassword = ''
  passwordDialogVisible.value = true
}

const submitPassword = async () => {
  if (!passwordFormRef.value) return
  await passwordFormRef.value.validate(async (valid) => {
    if (valid) {
      try {
        await userStore.updatePassword(passwordForm)
        ElMessage.success('密码修改成功，请重新登录')
        passwordDialogVisible.value = false
        await userStore.logout()
      } catch (error) {
        console.error(error)
      }
    }
  })
}

const handleLogout = () => {
  ElMessageBox.confirm('确定要退出登录吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  }).then(() => {
    userStore.logout()
  })
}
</script>

<style lang="scss" scoped>
.navbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 100%;
  padding: 0 20px;
}

.left-menu {
  display: flex;
  align-items: center;
}

.hamburger {
  font-size: 20px;
  cursor: pointer;
  margin-right: 15px;

  &:hover {
    color: #409eff;
  }
}

.breadcrumb-wrapper {
  margin-left: 10px;
}

.right-menu {
  display: flex;
  align-items: center;
  gap: 15px;
}

.notification-container {
  position: relative;
  cursor: pointer;
  padding: 8px;
  border-radius: 4px;
  
  &:hover {
    background-color: #f5f7fa;
  }
}

.notification-icon {
  font-size: 20px;
  color: #606266;
}

.notification-badge {
  --el-badge-background-color: #f56c6c;
}

.avatar-container {
  cursor: pointer;
}

.avatar-wrapper {
  display: flex;
  align-items: center;
  padding: 5px 10px;
  border-radius: 4px;

  &:hover {
    background-color: #f5f7fa;
  }
}

.username {
  margin-left: 10px;
  font-size: 14px;
  color: #606266;
}

.notification-drawer {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.drawer-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 15px;
  border-bottom: 1px solid #ebeef5;
  margin-bottom: 15px;
  
  .title {
    font-size: 16px;
    font-weight: bold;
    color: #303133;
  }
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  color: #909399;
  
  .empty-icon {
    font-size: 48px;
    margin-bottom: 15px;
    color: #c0c4cc;
  }
  
  p {
    margin: 0;
    font-size: 14px;
  }
}

.notification-list {
  flex: 1;
  overflow-y: auto;
}

.notification-item {
  display: flex;
  align-items: flex-start;
  padding: 12px 15px;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.2s;
  
  &:hover {
    background-color: #f5f7fa;
  }
  
  &.is-unread {
    background-color: #fafbfc;
    
    .notification-title {
      font-weight: 600;
    }
  }
  
  .notification-icon {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-right: 12px;
    font-size: 18px;
    
    :deep(.el-icon) {
      color: #fff;
    }
    
    & .el-message {
      background-color: #409eff;
    }
    
    & .el-circle-check {
      background-color: #67c23a;
    }
    
    & .el-circle-close {
      background-color: #f56c6c;
    }
    
    & .el-warning {
      background-color: #e6a23c;
    }
    
    & .el-clock {
      background-color: #909399;
    }
    
    & .el-bell {
      background-color: #67c23a;
    }
  }
  
  .notification-content {
    flex: 1;
    min-width: 0;
  }
  
  .notification-title {
    font-size: 14px;
    color: #303133;
    margin-bottom: 4px;
  }
  
  .notification-text {
    font-size: 13px;
    color: #606266;
    line-height: 1.5;
    margin-bottom: 6px;
    overflow: hidden;
    text-overflow: ellipsis;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
  }
  
  .notification-time {
    font-size: 12px;
    color: #909399;
  }
  
  .unread-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background-color: #f56c6c;
    margin-top: 8px;
    margin-left: 8px;
  }
}
</style>
