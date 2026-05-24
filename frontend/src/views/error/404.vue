<template>
  <div class="error-page">
    <div class="error-content">
      <h1>404</h1>
      <h2>抱歉，您访问的页面不存在</h2>
      <el-button type="primary" @click="$router.push('/')">返回首页</el-button>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.error-page {
  width: 100%;
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #f5f7fa;
}

.error-content {
  text-align: center;

  h1 {
    font-size: 120px;
    font-weight: 600;
    color: #409eff;
    margin-bottom: 20px;
  }

  h2 {
    font-size: 24px;
    color: #606266;
    margin-bottom: 30px;
  }
}
</style>
