<template>
  <div class="home-container">
    <div class="welcome-section">
      <div class="learning-card main-card">
        <h2>🎉 欢迎使用汉字学习工具</h2>
        <p class="description">
          专为小学生设计的智能汉字学习系统，包含2500个必学汉字，
          通过科学的学习和检查方法，帮助孩子高效掌握汉字。
        </p>
        
        <!-- 快速统计 -->
        <div class="quick-stats">
          <div class="stat-item">
            <div class="stat-number">{{ userStats.总学习汉字数 }}</div>
            <div class="stat-label">已学汉字</div>
          </div>
          <div class="stat-item">
            <div class="stat-number">{{ userStats.总掌握汉字数 }}</div>
            <div class="stat-label">已掌握</div>
          </div>
          <div class="stat-item">
            <div class="stat-number">{{ userStats.整体正确率 }}%</div>
            <div class="stat-label">正确率</div>
          </div>
          <div class="stat-item">
            <div class="stat-number">{{ userStats.连续学习天数 }}</div>
            <div class="stat-label">连续学习</div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 快速操作 -->
    <div class="quick-actions">
      <div class="learning-card action-card featured-card" @click="startDiagnosticLearning">
        <div class="new-badge">推荐</div>
        <div class="action-icon">🔍</div>
        <h3>学前诊断</h3>
        <p>先测试100字，只学不会的汉字，节省75%时间</p>
        <el-button type="primary" size="large">
          <el-icon><Search /></el-icon>
          智能学习
        </el-button>
      </div>
      
      <div class="learning-card action-card" @click="startQuickLearning">
        <div class="action-icon">📚</div>
        <h3>传统学习</h3>
        <p>按顺序系统性学习新汉字</p>
        <el-button type="primary" size="large">
          <el-icon><Reading /></el-icon>
          开始学习
        </el-button>
      </div>
      
      <div class="learning-card action-card" @click="startReview">
        <div class="action-icon">🔄</div>
        <h3>复习练习</h3>
        <p>支持顺序/随机复习，独立数量设置</p>
        <el-button type="success" size="large">
          <el-icon><Refresh /></el-icon>
          开始复习
        </el-button>
      </div>
      
      <div class="learning-card action-card" @click="viewStatistics">
        <div class="action-icon">📊</div>
        <h3>学习统计</h3>
        <p>查看学习进度和成绩</p>
        <el-button type="info" size="large">
          <el-icon><TrendCharts /></el-icon>
          查看统计
        </el-button>
      </div>
      
      <div class="learning-card action-card" @click="openSettings">
        <div class="action-icon">⚙️</div>
        <h3>学习设置</h3>
        <p>调整学习参数和偏好</p>
        <el-button type="warning" size="large">
          <el-icon><Setting /></el-icon>
          设置参数
        </el-button>
      </div>
    </div>
    
    <!-- 学习建议 -->
    <div class="suggestions-section" v-if="suggestions.length > 0">
      <div class="learning-card">
        <h3>📝 今日学习建议</h3>
        <div class="suggestions-list">
          <div 
            v-for="suggestion in suggestions" 
            :key="suggestion.type"
            class="suggestion-item"
            :class="suggestion.type"
          >
            <div class="suggestion-icon">{{ suggestion.icon }}</div>
            <div class="suggestion-content">
              <h4>{{ suggestion.title }}</h4>
              <p>{{ suggestion.description }}</p>
            </div>
            <el-button 
              size="small" 
              :type="suggestion.buttonType"
              @click="handleSuggestion(suggestion)"
            >
              {{ suggestion.action }}
            </el-button>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 收藏汉字 -->
    <div class="favorite-section" v-if="favoriteChars.length > 0">
      <div class="learning-card">
        <h3>⭐ 收藏的汉字</h3>
        <div class="favorite-chars">
          <div 
            v-for="char in favoriteChars" 
            :key="char.汉字"
            class="char-item favorite"
            @click="startLearningFavorite(char.汉字)"
          >
            <div class="char-number-small">{{ Math.floor(char.序号) }}</div>
            <div class="char-display">{{ char.汉字 }}</div>
            <div class="char-info">
              <div class="char-pinyin">{{ char.拼音 }}</div>
              <div class="char-words">
                {{ getCharWords(char).join('、') }}
              </div>
            </div>
            <div class="favorite-action">
              <el-button 
                size="small" 
                type="danger" 
                text 
                @click.stop="removeFavorite(char.汉字)"
              >
                <el-icon><Delete /></el-icon>
              </el-button>
            </div>
          </div>
        </div>
        <div class="favorite-actions">
          <el-button @click="learningFavorites" type="primary">
            <el-icon><Reading /></el-icon>
            学习收藏汉字
          </el-button>
        </div>
      </div>
    </div>

    <!-- 最近学习记录 -->
    <div class="recent-section" v-if="recentChars.length > 0">
      <div class="learning-card">
        <h3>📝 最近学习的汉字</h3>
        <div class="recent-chars">
          <div 
            v-for="char in recentChars" 
            :key="char.字符"
            class="char-item"
            :class="char.掌握度"
          >
            <div class="char-display">{{ char.字符 }}</div>
            <div class="char-info">
              <div class="char-pinyin">{{ char.拼音 }}</div>
              <div class="char-status">{{ char.掌握度 }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useLearningStore } from '@/stores/learning'
import { ElMessage } from 'element-plus'
import type { LearningRecord } from '@/types'

const router = useRouter()
const learningStore = useLearningStore()

// 用户统计数据
const userStats = computed(() => learningStore.userStats)

// 学习建议
interface Suggestion {
  type: string
  icon: string
  title: string
  description: string
  action: string
  buttonType: 'primary' | 'success' | 'warning' | 'danger' | 'info'
}

const suggestions = computed((): Suggestion[] => {
  const result: Suggestion[] = []
  const stats = userStats.value
  const records = Array.from(learningStore.learningRecords.values())
  
  // 新用户建议
  if (stats.总学习汉字数 === 0) {
    result.push({
      type: 'first-time',
      icon: '🌟',
      title: '开始你的汉字学习之旅',
      description: '建议从10个汉字开始，逐步掌握学习节奏',
      action: '开始学习',
      buttonType: 'primary'
    })
  }
  
  // 需要复习的汉字
  const needReviewCount = records.filter(r => r.掌握度 === '需要复习').length
  if (needReviewCount > 0) {
    result.push({
      type: 'review',
      icon: '🔄',
      title: `有 ${needReviewCount} 个汉字需要复习`,
      description: '建议优先复习这些薄弱汉字，可选择顺序或随机模式',
      action: '开始复习',
      buttonType: 'warning'
    })
  }
  

  
  // 连续学习鼓励
  if (stats.连续学习天数 >= 3) {
    result.push({
      type: 'streak',
      icon: '🔥',
      title: `太棒了！连续学习 ${stats.连续学习天数} 天`,
      description: '坚持就是胜利，继续保持这个节奏',
      action: '继续学习',
      buttonType: 'success'
    })
  }
  
  // 正确率较低的建议
  if (stats.整体正确率 < 70 && stats.总学习汉字数 > 10) {
    result.push({
      type: 'accuracy',
      icon: '💪',
      title: '可以放慢学习节奏',
      description: '建议减少每次学习的汉字数量，重点巩固',
      action: '调整设置',
      buttonType: 'info'
    })
  }
  
  return result
})

// 收藏的汉字
const favoriteChars = computed(() => learningStore.favoriteCharsList)

// 最近学习的汉字
const recentChars = computed((): LearningRecord[] => {
  const records = Array.from(learningStore.learningRecords.values())
  return records
    .filter(r => r.最后学习时间)
    .sort((a, b) => b.最后学习时间.localeCompare(a.最后学习时间))
    .slice(0, 8)
})

// 快速操作方法
const startQuickLearning = () => {
  // 设置为传统学习模式
  learningStore.setLearningMode('traditional')
  // 修改学习范围，保持用户的数量设置
  learningStore.updateSettings({ 学习范围: '全新汉字' })
  learningStore.startLearningSession()
  router.push('/learning')
}

const startDiagnosticLearning = () => {
  // 设置为诊断学习模式
  learningStore.setLearningMode('diagnostic')
  router.push('/learning')
}

const startReview = () => {
  router.push('/review')
}

const viewStatistics = () => {
  router.push('/statistics')
}

const openSettings = () => {
  router.push('/settings')
}

const handleSuggestion = (suggestion: Suggestion) => {
  switch (suggestion.type) {
    case 'first-time':
      startQuickLearning()
      break
    case 'review':
      startReview()
      break
    case 'streak':
      startQuickLearning()
      break
    case 'accuracy':
      openSettings()
      break

  }
}



// 收藏相关功能
const getCharWords = (char: any) => {
  return [char.词语1, char.词语2, char.词语3].filter(word => word && word.trim())
}

const removeFavorite = (character: string) => {
  learningStore.toggleFavorite(character)
  ElMessage.success(`已取消收藏汉字"${character}"`)
}

const startLearningFavorite = (_character: string) => {
  // 可以实现单个汉字的学习功能
  ElMessage.info('单个汉字学习功能待实现')
}

const learningFavorites = () => {
  if (favoriteChars.value.length === 0) {
    ElMessage.warning('没有收藏的汉字')
    return
  }
  // 设置学习收藏的汉字，使用当前的学习数量设置
  const favoriteCount = favoriteChars.value.length
  const currentLearningCount = learningStore.settings.学习数量
  learningStore.updateSettings({ 
    学习范围: '自定义范围',
    学习数量: Math.min(favoriteCount, currentLearningCount)
  })
  // 这里需要实现收藏汉字的学习逻辑
  ElMessage.success(`开始学习收藏汉字（${Math.min(favoriteCount, currentLearningCount)}个）`)
  router.push('/learning')
}
</script>

<style lang="scss" scoped>
.home-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.welcome-section {
  margin-bottom: 30px;
  
  .main-card {
    text-align: center;
    padding: 40px;
    
    h2 {
      font-size: 32px;
      color: #409EFF;
      margin-bottom: 16px;
      font-weight: 600;
    }
    
    .description {
      font-size: 16px;
      color: #666;
      line-height: 1.8;
      max-width: 600px;
      margin: 0 auto 30px;
    }
  }
}

.quick-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 20px;
  margin-top: 30px;
  
  .stat-item {
    text-align: center;
    padding: 20px;
    background: rgba(64, 158, 255, 0.1);
    border-radius: 12px;
    transition: all 0.3s ease;
    
    &:hover {
      background: rgba(64, 158, 255, 0.15);
      transform: translateY(-2px);
    }
    
    .stat-number {
      font-size: 28px;
      font-weight: 700;
      color: #409EFF;
      margin-bottom: 8px;
    }
    
    .stat-label {
      font-size: 14px;
      color: #666;
      font-weight: 500;
    }
  }
}

.quick-actions {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
  
  .action-card {
    text-align: center;
    padding: 30px;
    cursor: pointer;
    transition: all 0.3s ease;
    position: relative;
    
    &:hover {
      transform: translateY(-4px);
      box-shadow: 0 16px 48px rgba(0, 0, 0, 0.2);
    }
    
    .action-icon {
      font-size: 48px;
      margin-bottom: 16px;
    }
    
    h3 {
      font-size: 20px;
      color: #333;
      margin-bottom: 8px;
    }
    
    p {
      color: #666;
      margin-bottom: 20px;
      font-size: 14px;
    }
    
    .el-button {
      width: 100%;
      font-size: 16px;
      padding: 12px 24px;
    }
    
    // 特色卡片样式
    &.featured-card {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border: 2px solid #667eea;
      
      h3, p {
        color: white;
      }
      
      .new-badge {
        position: absolute;
        top: -8px;
        right: -8px;
        background: #ff6b6b;
        color: white;
        padding: 4px 12px;
        border-radius: 16px;
        font-size: 12px;
        font-weight: bold;
        box-shadow: 0 2px 8px rgba(255, 107, 107, 0.3);
      }
      
      &:hover {
        background: linear-gradient(135deg, #5a67d8 0%, #6b5b95 100%);
        transform: translateY(-6px);
        box-shadow: 0 12px 30px rgba(102, 126, 234, 0.3);
      }
    }
  }
}

.suggestions-section, .recent-section {
  margin-bottom: 30px;
  
  .learning-card {
    padding: 30px;
    
    h3 {
      font-size: 20px;
      color: #333;
      margin-bottom: 20px;
      display: flex;
      align-items: center;
      gap: 8px;
    }
  }
}

.suggestions-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
  
  .suggestion-item {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 20px;
    background: rgba(0, 0, 0, 0.02);
    border-radius: 12px;
    border-left: 4px solid #409EFF;
    
    &.review {
      border-left-color: #E6A23C;
      background: rgba(230, 162, 60, 0.05);
    }
    
    &.accuracy {
      border-left-color: #F56C6C;
      background: rgba(245, 108, 108, 0.05);
    }
    
    &.streak {
      border-left-color: #67C23A;
      background: rgba(103, 194, 58, 0.05);
    }
    
    .suggestion-icon {
      font-size: 24px;
      width: 40px;
      text-align: center;
    }
    
    .suggestion-content {
      flex: 1;
      
      h4 {
        font-size: 16px;
        color: #333;
        margin-bottom: 4px;
      }
      
      p {
        font-size: 14px;
        color: #666;
        margin: 0;
      }
    }
  }
}

.favorite-chars, .recent-chars {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 16px;
  
  .char-item {
    text-align: center;
    padding: 16px;
    background: rgba(0, 0, 0, 0.02);
    border-radius: 12px;
    transition: all 0.3s ease;
    position: relative;
    
    &:hover {
      background: rgba(0, 0, 0, 0.05);
    }
    
    &.favorite {
      background: rgba(255, 193, 7, 0.1);
      border: 1px solid rgba(255, 193, 7, 0.3);
      cursor: pointer;
      
      &:hover {
        background: rgba(255, 193, 7, 0.15);
        transform: translateY(-2px);
      }
    }
    
    .char-number-small {
      position: absolute;
      top: 4px;
      left: 4px;
      font-size: 10px;
      color: #999;
      background: rgba(255, 255, 255, 0.8);
      padding: 2px 4px;
      border-radius: 4px;
      font-weight: 500;
    }
    
    &.完全掌握 {
      background: rgba(103, 194, 58, 0.1);
      border: 1px solid rgba(103, 194, 58, 0.2);
    }
    
    &.基本掌握 {
      background: rgba(64, 158, 255, 0.1);
      border: 1px solid rgba(64, 158, 255, 0.2);
    }
    
    &.需要复习 {
      background: rgba(230, 162, 60, 0.1);
      border: 1px solid rgba(230, 162, 60, 0.2);
    }
    
    .char-display {
      font-size: 32px;
      font-weight: 600;
      color: #333;
      margin-bottom: 8px;
    }
    
    .char-info {
      .char-pinyin {
        font-size: 14px;
        color: #666;
        margin-bottom: 4px;
      }
      
      .char-words {
        font-size: 12px;
        color: #999;
        margin-bottom: 4px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      
      .char-status {
        font-size: 12px;
        font-weight: 500;
        padding: 2px 8px;
        border-radius: 8px;
        
        &.完全掌握 {
          background: #67C23A;
          color: white;
        }
        
        &.基本掌握 {
          background: #409EFF;
          color: white;
        }
        
        &.需要复习 {
          background: #E6A23C;
          color: white;
        }
      }
    }
    
    .favorite-action {
      position: absolute;
      top: 4px;
      right: 4px;
      opacity: 0;
      transition: opacity 0.3s ease;
    }
    
    &:hover .favorite-action {
      opacity: 1;
    }
  }
}

.favorite-actions {
  margin-top: 20px;
  text-align: center;
}

.favorite-section, .recent-section {
  margin-bottom: 30px;
}

@media (max-width: 768px) {
  .home-container {
    padding: 10px;
  }
  
  .quick-actions {
    grid-template-columns: 1fr;
  }
  
  .quick-stats {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .favorite-chars, .recent-chars {
    grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
    gap: 12px;
    
    .char-number-small {
      font-size: 8px !important;
      padding: 1px 3px !important;
    }
  }
}
</style> 