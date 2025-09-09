<template>
  <div class="user-login-container">
    <div class="login-card">
      <div class="welcome-header">
        <h1>🎯 汉字学习系统</h1>
        <p class="subtitle">专为小学生设计的2500汉字学习工具</p>
      </div>

      <!-- 新用户注册 -->
      <div class="new-user-section">
        <h2>新用户注册</h2>
        <el-form 
          :model="newUserForm" 
          :rules="formRules" 
          ref="newUserFormRef"
          label-width="80px"
          size="large"
        >
          <el-form-item label="姓名" prop="name">
            <el-input 
              v-model="newUserForm.name" 
              placeholder="请输入你的姓名"
              :prefix-icon="User"
              maxlength="10"
              show-word-limit
            />
          </el-form-item>
          
          <el-form-item label="学号" prop="studentId">
            <el-input 
              v-model="newUserForm.studentId" 
              placeholder="请输入学号"
              :prefix-icon="Postcard"
              maxlength="10"
              show-word-limit
            />
          </el-form-item>
          
          <el-form-item>
            <el-button 
              type="primary" 
              size="large" 
              @click="createNewUser"
              :loading="loading"
              class="create-user-btn"
            >
              <el-icon><Plus /></el-icon>
              开始学习
            </el-button>
          </el-form-item>
        </el-form>
      </div>

      <!-- 已有用户列表 -->
      <div class="existing-users-section" v-if="existingUsers.length > 0">
        <h2>选择已有用户</h2>
        <div class="users-grid">
          <div 
            class="user-card"
            v-for="user in existingUsers"
            :key="user.fileName"
            @click="selectUser(user)"
            :class="{ active: selectedUser?.fileName === user.fileName }"
          >
            <div class="user-avatar">{{ user.name.charAt(0) }}</div>
            <div class="user-info">
              <div class="user-name">{{ user.name }}</div>
              <div class="user-id">学号: {{ user.studentId }}</div>
              <div class="last-activity">
                最后活动: {{ formatDate(user.lastActivity) }}
              </div>
            </div>
            <el-button 
              type="danger" 
              size="small" 
              text
              @click.stop="deleteUser(user)"
              class="delete-btn"
            >
              <el-icon><Delete /></el-icon>
            </el-button>
          </div>
        </div>
        
        <div class="select-actions" v-if="selectedUser">
          <el-button 
            type="primary" 
            size="large" 
            @click="loginUser"
            :loading="loading"
          >
            <el-icon><Right /></el-icon>
            继续学习
          </el-button>
        </div>
      </div>

      <!-- 管理员功能 -->
      <div class="admin-section">
        <el-button 
          text 
          size="small" 
          @click="refreshUsers"
          :loading="refreshLoading"
        >
          <el-icon><Refresh /></el-icon>
          刷新用户列表
        </el-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { User, Postcard, Plus, Delete, Right, Refresh } from '@element-plus/icons-vue'
import { userApi } from '@/services/userApi'
import { useLearningStore } from '@/stores/learning'

const router = useRouter()
const learningStore = useLearningStore()

// 表单数据
const newUserForm = ref({
  name: '',
  studentId: ''
})

// 表单验证规则
const formRules = {
  name: [
    { required: true, message: '请输入姓名', trigger: 'blur' },
    { min: 2, max: 10, message: '姓名长度在 2 到 10 个字符', trigger: 'blur' }
  ],
  studentId: [
    { required: true, message: '请输入学号', trigger: 'blur' },
    { min: 1, max: 10, message: '学号长度在 1 到 10 个字符', trigger: 'blur' }
  ]
}

// 用户数据
const existingUsers = ref<any[]>([])
const selectedUser = ref<any>(null)
const loading = ref(false)
const refreshLoading = ref(false)
const newUserFormRef = ref()

// 获取用户列表
const fetchUsers = async () => {
  try {
    existingUsers.value = await userApi.getUsers()
  } catch (error) {
    console.error('获取用户列表失败:', error)
    ElMessage.error('获取用户列表失败')
  }
}

// 创建新用户
const createNewUser = async () => {
  if (!newUserFormRef.value) return
  
  try {
    await newUserFormRef.value.validate()
    loading.value = true
    
    const result = await userApi.createUser({
      name: newUserForm.value.name,
      studentId: newUserForm.value.studentId
    })
    
    // 设置当前用户
    learningStore.setCurrentUser({
      fileName: result.fileName,
      name: newUserForm.value.name,
      studentId: newUserForm.value.studentId
    })
    
    // 加载用户数据
    await learningStore.loadUserDataFromServer(result.userData)
    
    ElMessage.success(`欢迎，${newUserForm.value.name}！`)
    router.push('/')
  } catch (error: any) {
    console.error('创建用户失败:', error)
    ElMessage.error(error.message || '创建用户失败')
  } finally {
    loading.value = false
  }
}

// 选择用户
const selectUser = (user: any) => {
  selectedUser.value = selectedUser.value?.fileName === user.fileName ? null : user
}

// 登录用户
const loginUser = async () => {
  if (!selectedUser.value) return
  
  try {
    loading.value = true
    
    const result = await userApi.createUser({
      name: selectedUser.value.name,
      studentId: selectedUser.value.studentId
    })
    
    // 设置当前用户
    learningStore.setCurrentUser({
      fileName: result.fileName,
      name: selectedUser.value.name,
      studentId: selectedUser.value.studentId
    })
    
    // 加载用户数据
    await learningStore.loadUserDataFromServer(result.userData)
    
    ElMessage.success(`欢迎回来，${selectedUser.value.name}！`)
    router.push('/')
  } catch (error: any) {
    console.error('登录失败:', error)
    ElMessage.error(error.message || '登录失败')
  } finally {
    loading.value = false
  }
}

// 删除用户
const deleteUser = async (user: any) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除用户 "${user.name}" 的所有数据吗？此操作不可恢复。`,
      '删除确认',
      {
        confirmButtonText: '确定删除',
        cancelButtonText: '取消',
        type: 'warning',
      }
    )
    
    await userApi.deleteUser(user.fileName)
    ElMessage.success('用户删除成功')
    await fetchUsers()
    
    if (selectedUser.value?.fileName === user.fileName) {
      selectedUser.value = null
    }
  } catch (error: any) {
    if (error !== 'cancel') {
      console.error('删除用户失败:', error)
      ElMessage.error('删除用户失败')
    }
  }
}

// 刷新用户列表
const refreshUsers = async () => {
  refreshLoading.value = true
  await fetchUsers()
  refreshLoading.value = false
  ElMessage.success('用户列表已刷新')
}

// 格式化日期
const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  const now = new Date()
  const diffTime = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
  
  if (diffDays === 0) {
    return '今天'
  } else if (diffDays === 1) {
    return '昨天'
  } else if (diffDays < 7) {
    return `${diffDays}天前`
  } else {
    return date.toLocaleDateString()
  }
}

onMounted(() => {
  fetchUsers()
})
</script>

<style lang="scss" scoped>
.user-login-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.login-card {
  background: white;
  border-radius: 20px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
  padding: 40px;
  width: 100%;
  max-width: 800px;
  max-height: 90vh;
  overflow-y: auto;
}

.welcome-header {
  text-align: center;
  margin-bottom: 40px;
  
  h1 {
    font-size: 32px;
    color: #409EFF;
    margin-bottom: 10px;
    font-weight: 600;
  }
  
  .subtitle {
    color: #666;
    font-size: 16px;
    margin: 0;
  }
}

.new-user-section, .existing-users-section {
  margin-bottom: 40px;
  
  h2 {
    color: #333;
    font-size: 20px;
    margin-bottom: 20px;
    padding-bottom: 10px;
    border-bottom: 2px solid #f0f0f0;
  }
}

.create-user-btn {
  width: 100%;
  height: 50px;
  font-size: 16px;
}

.users-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 15px;
  margin-bottom: 20px;
}

.user-card {
  display: flex;
  align-items: center;
  padding: 15px;
  border: 2px solid #f0f0f0;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  
  &:hover {
    border-color: #409EFF;
    background: rgba(64, 158, 255, 0.05);
  }
  
  &.active {
    border-color: #409EFF;
    background: rgba(64, 158, 255, 0.1);
  }
}

.user-avatar {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background: linear-gradient(135deg, #409EFF, #67C23A);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  font-weight: 600;
  margin-right: 15px;
  flex-shrink: 0;
}

.user-info {
  flex: 1;
  
  .user-name {
    font-size: 16px;
    font-weight: 600;
    color: #333;
    margin-bottom: 4px;
  }
  
  .user-id {
    font-size: 14px;
    color: #666;
    margin-bottom: 4px;
  }
  
  .last-activity {
    font-size: 12px;
    color: #999;
  }
}

.delete-btn {
  position: absolute;
  top: 8px;
  right: 8px;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.user-card:hover .delete-btn {
  opacity: 1;
}

.select-actions {
  text-align: center;
  
  .el-button {
    min-width: 150px;
    height: 45px;
    font-size: 16px;
  }
}

.admin-section {
  text-align: center;
  padding-top: 20px;
  border-top: 1px solid #f0f0f0;
}

@media (max-width: 768px) {
  .login-card {
    padding: 20px;
    margin: 10px;
  }
  
  .welcome-header h1 {
    font-size: 24px;
  }
  
  .users-grid {
    grid-template-columns: 1fr;
  }
  
  .user-card {
    padding: 12px;
  }
  
  .user-avatar {
    width: 40px;
    height: 40px;
    font-size: 16px;
  }
}
</style> 