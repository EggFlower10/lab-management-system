<template>
  <div class="dashboard">
    <!-- 欢迎区域 -->
    <div class="welcome-section">
      <h1>欢迎使用实验室信息管理系统</h1>
      <p>Laboratory Information Management System V1.0</p>
    </div>

    <!-- 统计卡片 -->
    <div class="stats-section">
      <div class="stat-card">
        <div class="stat-icon user-icon">
          <el-icon><User /></el-icon>
        </div>
        <div class="stat-value">{{ userCount }}</div>
        <div class="stat-label">用户总数</div>
      </div>
      <div class="stat-card">
        <div class="stat-icon role-icon">
          <el-icon><UserFilled /></el-icon>
        </div>
        <div class="stat-value">{{ roleCount }}</div>
        <div class="stat-label">角色总数</div>
      </div>
      <div class="stat-card">
        <div class="stat-icon org-icon">
          <el-icon><OfficeBuilding /></el-icon>
        </div>
        <div class="stat-value">{{ orgCount }}</div>
        <div class="stat-label">机构总数</div>
      </div>
      <div class="stat-card">
        <div class="stat-icon operation-icon">
          <el-icon><Operation /></el-icon>
        </div>
        <div class="stat-value">{{ operationCount }}</div>
        <div class="stat-label">今日操作</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { User, UserFilled, OfficeBuilding, Operation } from '@element-plus/icons-vue'

// 模拟数据，实际项目中应该从API获取
const userCount = ref(4) // 用户总数，来自用户管理页面
const roleCount = ref(2) // 角色总数，来自角色管理页面
const orgCount = ref(7) // 机构总数，来自机构管理页面
const operationCount = ref(65) // 今日操作数
</script>

<style lang="scss" scoped>
.dashboard {
  min-height: 100vh;
  background: #f5f7fa;
  padding: 40px 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
}

.welcome-section {
  text-align: center;
  margin-bottom: 80px;
  max-width: 800px;
  width: 100%;
  
  h1 {
    font-size: 32px;
    color: #303133;
    margin-bottom: 15px;
  }
  
  p {
    font-size: 18px;
    color: #909399;
  }
}

.stats-section {
  display: flex;
  justify-content: center;
  gap: 60px;
  margin-bottom: 80px;
  max-width: 800px;
  width: 100%;
  
  .stat-card {
    width: 140px;
    text-align: center;
    
    .stat-icon {
      width: 70px;
      height: 70px;
      border-radius: 50%;
      display: flex;
      justify-content: center;
      align-items: center;
      font-size: 28px;
      color: #fff;
      margin: 0 auto 25px;
    }
    
    .user-icon {
      background: #1890ff;
    }
    
    .role-icon {
      background: #fa8c16;
    }
    
    .org-icon {
      background: #52c41a;
    }
    
    .operation-icon {
      background: #722ed1;
    }
    
    .stat-value {
      font-size: 36px;
      font-weight: 600;
      color: #303133;
      margin-bottom: 12px;
    }
    
    .stat-label {
      font-size: 16px;
      color: #909399;
    }
  }
}
</style>
