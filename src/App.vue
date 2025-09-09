<template>
  <div id="app">
    <el-container class="app-container">
      <!-- 头部导航 - 仅在用户登录时显示 -->
      <el-header class="app-header" v-if="isAuthenticated">
        <div class="header-content">
          <div class="logo">
            <h1>🎯 汉字学习工具</h1>
            <span class="subtitle">小学生2500汉字学习系统</span>
          </div>
          
          <div class="user-info">
            <span class="welcome-text">欢迎，{{ currentUser?.name }}</span>
            <el-button 
              text 
              type="primary" 
              @click="handleLogout"
              style="margin-left: 10px;"
            >
              <el-icon><SwitchButton /></el-icon>
              切换用户
            </el-button>
          </div>
          
          <nav class="nav-menu">
            <el-menu 
              mode="horizontal" 
              :default-active="currentRoute"
              @select="handleMenuSelect"
              background-color="transparent"
              text-color="#333"
              active-text-color="#409EFF"
            >
              <el-menu-item index="/">
                <el-icon><House /></el-icon>
                首页
              </el-menu-item>
              <el-menu-item index="/learning">
                <el-icon><Reading /></el-icon>
                开始学习
              </el-menu-item>
              <el-menu-item index="/review">
                <el-icon><Refresh /></el-icon>
                开始复习
              </el-menu-item>
              <el-menu-item index="/statistics">
                <el-icon><TrendCharts /></el-icon>
                学习统计
              </el-menu-item>

              <el-menu-item index="/hanzi-detail">
                <el-icon><Document /></el-icon>
                汉字详情
              </el-menu-item>

              <el-menu-item index="/settings">
                <el-icon><Setting /></el-icon>
                设置
              </el-menu-item>
            </el-menu>
          </nav>
        </div>
      </el-header>
      
      <!-- 主要内容区域 -->
      <el-main class="app-main">
        <router-view v-slot="{ Component }">
          <transition name="fade" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </el-main>
      
      <!-- 底部信息 -->
      <el-footer class="app-footer" v-if="isAuthenticated">
        <div class="footer-content">
          <div class="stats-summary" v-if="userStats">
            <span>📚 已学习: {{ userStats.总学习汉字数 }} 字</span>
            <span>✅ 已掌握: {{ userStats.总掌握汉字数 }} 字</span>
            <span>📊 正确率: {{ userStats.整体正确率 }}%</span>
            <span>🔥 连续学习: {{ userStats.连续学习天数 }} 天</span>
          </div>
          <div class="copyright">
            © 2024 汉字学习工具 - 专为小学生设计
          </div>
        </div>
      </el-footer>
    </el-container>
    
    <!-- 加载状态 -->
    <div 
      v-loading="isLoading" 
      element-loading-text="正在加载汉字数据..."
      element-loading-background="rgba(0, 0, 0, 0.8)"
      v-if="isLoading"
      class="loading-overlay"
    ></div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useLearningStore } from '@/stores/learning'
import { ElMessage, ElMessageBox } from 'element-plus'

const route = useRoute()
const router = useRouter()
const learningStore = useLearningStore()

const isLoading = ref(true)

// 计算当前路由
const currentRoute = computed(() => route.path)

// 用户认证状态
const isAuthenticated = computed(() => !!learningStore.currentUser)
const currentUser = computed(() => learningStore.currentUser)

// 用户统计数据
const userStats = computed(() => learningStore.userStats)

// 菜单选择处理
const handleMenuSelect = (key: string) => {
  router.push(key)
}

// 用户登出处理
const handleLogout = async () => {
  try {
    await ElMessageBox.confirm(
      '确定要切换用户吗？当前学习进度将被保存。',
      '切换用户确认',
      {
        confirmButtonText: '确定切换',
        cancelButtonText: '取消',
        type: 'info',
      }
    )
    
    // 保存当前用户数据
    if (learningStore.currentUser) {
      await learningStore.saveToServer()
    }
    
    // 清除当前用户状态
    learningStore.setCurrentUser(null)
    
    // 重定向到登录页
    router.push('/login')
    ElMessage.success('已退出当前用户')
  } catch (error: any) {
    if (error !== 'cancel') {
      console.error('登出失败:', error)
      ElMessage.error('切换用户失败')
    }
  }
}

// 初始化应用
onMounted(async () => {
  try {
    await learningStore.initializeData()
    
    // 检查是否已有用户登录
    if (!learningStore.currentUser) {
      router.push('/login')
    } else {
      ElMessage.success('汉字数据加载完成！')
    }
  } catch (error) {
    console.error('初始化失败:', error)
    ElMessage.error('汉字数据加载失败，请刷新页面重试')
  } finally {
    isLoading.value = false
  }
})
</script>

<style lang="scss">
// 全局样式重置
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: 'Microsoft YaHei', 'PingFang SC', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  line-height: 1.6;
  color: #333;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  min-height: 100vh;
}

#app {
  min-height: 100vh;
}

.app-container {
  min-height: 100vh;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
}

// 头部样式
.app-header {
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid #e0e0e0;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  
  .header-content {
    display: flex;
    justify-content: space-between;
    align-items: center;
    max-width: 1200px;
    margin: 0 auto;
    height: 100%;
    padding: 0 20px;
  }
  
  .user-info {
    display: flex;
    align-items: center;
    margin-right: 20px;
    
    .welcome-text {
      color: #666;
      font-size: 14px;
      font-weight: 500;
    }
  }
  
  .logo {
    h1 {
      font-size: 24px;
      color: #409EFF;
      margin: 0;
      font-weight: 600;
    }
    
    .subtitle {
      font-size: 12px;
      color: #666;
      display: block;
      margin-top: -5px;
    }
  }
  
  .nav-menu {
    .el-menu {
      border: none;
      
      .el-menu-item {
        border-radius: 8px;
        margin: 0 4px;
        transition: all 0.3s ease;
        
        &:hover {
          background-color: rgba(64, 158, 255, 0.1);
        }
        
        .el-icon {
          margin-right: 5px;
        }
      }
    }
  }
}

// 主要内容区域
.app-main {
  min-height: calc(100vh - 120px);
  padding: 20px;
  background: transparent;
  
  .fade-enter-active,
  .fade-leave-active {
    transition: opacity 0.3s ease;
  }
  
  .fade-enter-from,
  .fade-leave-to {
    opacity: 0;
  }
}

// 底部样式
.app-footer {
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
  border-top: 1px solid #e0e0e0;
  
  .footer-content {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 20px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 10px;
  }
  
  .stats-summary {
    display: flex;
    gap: 20px;
    flex-wrap: wrap;
    
    span {
      font-size: 14px;
      color: #666;
      font-weight: 500;
    }
  }
  
  .copyright {
    font-size: 12px;
    color: #999;
  }
}

// 响应式设计
@media (max-width: 768px) {
  .app-header {
    .header-content {
      flex-direction: column;
      padding: 10px;
      gap: 10px;
    }
    
    .nav-menu .el-menu {
      justify-content: center;
    }
  }
  
  .app-main {
    padding: 10px;
  }
  
  .app-footer {
    .footer-content {
      flex-direction: column;
      text-align: center;
      gap: 10px;
    }
    
    .stats-summary {
      justify-content: center;
      gap: 10px;
    }
  }
}

// Element Plus 样式自定义
.el-loading-mask {
  backdrop-filter: blur(5px);
}

// 通用卡片样式
.learning-card {
  background: rgba(255, 255, 255, 0.9);
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15);
  }
}

// 按钮样式增强
.el-button {
  border-radius: 12px;
  font-weight: 500;
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-1px);
  }
}

// 加载遮罩样式
.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  z-index: 9999;
}
</style> 