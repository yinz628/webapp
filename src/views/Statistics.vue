<template>
  <div class="statistics-container">
    <div class="stats-header">
      <div class="learning-card header-card">
        <h2>📊 学习统计</h2>
        <p class="description">查看你的学习进度和成绩分析</p>
      </div>
    </div>
    
    <!-- 总体统计 -->
    <div class="overview-section">
      <div class="learning-card">
        <h3>📈 总体概览</h3>
        <div class="overview-grid">
          <div class="overview-item">
            <div class="item-icon">📚</div>
            <div class="item-content">
              <div class="item-number">{{ userStats.总学习汉字数 }}</div>
              <div class="item-label">学习汉字总数</div>
              <div class="item-progress">
                <el-progress 
                  :percentage="Math.round((userStats.总学习汉字数 / 2500) * 100)" 
                  :stroke-width="6"
                  :show-text="false"
                />
                <span class="progress-text">{{ Math.round((userStats.总学习汉字数 / 2500) * 100) }}%</span>
              </div>
            </div>
          </div>
          
          <div class="overview-item">
            <div class="item-icon">✅</div>
            <div class="item-content">
              <div class="item-number">{{ userStats.总掌握汉字数 }}</div>
              <div class="item-label">掌握汉字数</div>
              <div class="item-progress">
                <el-progress 
                  :percentage="masteryPercentage" 
                  :stroke-width="6"
                  :show-text="false"
                  color="#67C23A"
                />
                <span class="progress-text">{{ masteryPercentage }}%</span>
              </div>
            </div>
          </div>
          
          <div class="overview-item">
            <div class="item-icon">🎯</div>
            <div class="item-content">
              <div class="item-number">{{ userStats.整体正确率 }}%</div>
              <div class="item-label">整体正确率</div>
              <div class="item-progress">
                <el-progress 
                  :percentage="userStats.整体正确率" 
                  :stroke-width="6"
                  :show-text="false"
                  :color="accuracyColor"
                />
                <span class="progress-text">{{ accuracyGrade }}</span>
              </div>
            </div>
          </div>
          
          <div class="overview-item">
            <div class="item-icon">🔥</div>
            <div class="item-content">
              <div class="item-number">{{ userStats.连续学习天数 }}</div>
              <div class="item-label">连续学习天数</div>
              <div class="item-progress">
                <el-progress 
                  :percentage="Math.min((userStats.连续学习天数 / 30) * 100, 100)" 
                  :stroke-width="6"
                  :show-text="false"
                  color="#E6A23C"
                />
                <span class="progress-text">{{ streakLevel }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 掌握度分布 -->
    <div class="mastery-section">
      <div class="learning-card">
        <h3>📋 掌握度分布</h3>
        <div class="mastery-grid">
          <div class="mastery-item mastery-complete">
            <div class="mastery-count">{{ masteryStats.完全掌握 }}</div>
            <div class="mastery-label">完全掌握</div>
            <div class="mastery-bar">
              <div 
                class="mastery-fill"
                :style="{ width: masteryStats.完全掌握率 + '%' }"
              ></div>
            </div>
          </div>
          
          <div class="mastery-item mastery-basic">
            <div class="mastery-count">{{ masteryStats.基本掌握 }}</div>
            <div class="mastery-label">基本掌握</div>
            <div class="mastery-bar">
              <div 
                class="mastery-fill"
                :style="{ width: masteryStats.基本掌握率 + '%' }"
              ></div>
            </div>
          </div>
          
          <div class="mastery-item mastery-review">
            <div class="mastery-count">{{ masteryStats.需要复习 }}</div>
            <div class="mastery-label">需要复习</div>
            <div class="mastery-bar">
              <div 
                class="mastery-fill"
                :style="{ width: masteryStats.需要复习率 + '%' }"
              ></div>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 最近表现 -->
    <div class="recent-performance">
      <div class="learning-card">
        <h3>📈 最近表现</h3>
        <div class="performance-content">
          <div class="performance-summary">
            <div class="summary-card">
              <h4>本周学习</h4>
              <div class="summary-data">
                <span class="data-number">{{ weeklyStats.学习天数 }}</span>
                <span class="data-label">天</span>
              </div>
            </div>
            
            <div class="summary-card">
              <h4>本周新学</h4>
              <div class="summary-data">
                <span class="data-number">{{ weeklyStats.新学汉字 }}</span>
                <span class="data-label">字</span>
              </div>
            </div>
            
            <div class="summary-card">
              <h4>本周正确率</h4>
              <div class="summary-data">
                <span class="data-number">{{ weeklyStats.正确率 }}%</span>
                <span class="data-label">
                  <el-icon v-if="weeklyStats.趋势 > 0" class="trend-up"><TrendCharts /></el-icon>
                  <el-icon v-else-if="weeklyStats.趋势 < 0" class="trend-down"><Bottom /></el-icon>
                  <el-icon v-else class="trend-stable"><Minus /></el-icon>
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 错题分析 -->
    <div v-if="errorAnalysis.length > 0" class="error-analysis">
      <div class="learning-card">
        <h3>🔍 错题分析</h3>
        <div class="error-list">
          <div 
            v-for="error in errorAnalysis" 
            :key="error.type"
            class="error-item"
          >
            <div class="error-header">
              <h4>{{ error.title }}</h4>
              <el-tag :type="error.severity">{{ error.count }} 次</el-tag>
            </div>
            <p class="error-description">{{ error.description }}</p>
            <div class="error-examples">
              <el-tag 
                v-for="example in error.examples" 
                :key="example"
                size="small"
                class="example-tag"
              >
                {{ example }}
              </el-tag>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 学习建议 -->
    <div class="recommendations">
      <div class="learning-card">
        <h3>💡 个性化建议</h3>
        <div class="recommendation-list">
          <el-alert
            v-for="recommendation in recommendations"
            :key="recommendation.type"
            :type="recommendation.alertType"
            :title="recommendation.title"
            :description="recommendation.description"
            :closable="false"
            show-icon
          />
        </div>
      </div>
    </div>
    
    <!-- 操作按钮 -->
    <div class="action-section">
      <div class="learning-card">
        <div class="actions">
          <el-button @click="$router.push('/')" size="large">
            <el-icon><House /></el-icon>
            返回首页
          </el-button>
          <el-button @click="exportData" size="large">
            <el-icon><Download /></el-icon>
            导出数据
          </el-button>
          <el-button @click="resetProgress" type="danger" size="large">
            <el-icon><Delete /></el-icon>
            重置进度
          </el-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
// import { useRouter } from 'vue-router' // 保留备用
import { useLearningStore } from '@/stores/learning'
import { ElMessage, ElMessageBox } from 'element-plus'

// const router = useRouter() // 当前未使用，但保留备用
const learningStore = useLearningStore()

// 用户统计数据
const userStats = computed(() => learningStore.userStats)

// 掌握度百分比
const masteryPercentage = computed(() => {
  if (userStats.value.总学习汉字数 === 0) return 0
  return Math.round((userStats.value.总掌握汉字数 / userStats.value.总学习汉字数) * 100)
})

// 正确率颜色和等级
const accuracyColor = computed(() => {
  const rate = userStats.value.整体正确率
  if (rate >= 90) return '#67C23A'
  if (rate >= 80) return '#409EFF'
  if (rate >= 70) return '#E6A23C'
  return '#F56C6C'
})

const accuracyGrade = computed(() => {
  const rate = userStats.value.整体正确率
  if (rate >= 90) return '优秀'
  if (rate >= 80) return '良好'
  if (rate >= 70) return '及格'
  return '需努力'
})

// 连续学习等级
const streakLevel = computed(() => {
  const days = userStats.value.连续学习天数
  if (days >= 30) return '学霸'
  if (days >= 14) return '坚持者'
  if (days >= 7) return '入门者'
  return '新手'
})

// 掌握度统计
const masteryStats = computed(() => {
  const records = Array.from(learningStore.learningRecords.values())
  const total = records.length
  
  const 完全掌握 = records.filter(r => r.掌握度 === '完全掌握').length
  const 基本掌握 = records.filter(r => r.掌握度 === '基本掌握').length
  const 需要复习 = records.filter(r => r.掌握度 === '需要复习').length
  
  return {
    完全掌握,
    基本掌握,
    需要复习,
    完全掌握率: total > 0 ? Math.round((完全掌握 / total) * 100) : 0,
    基本掌握率: total > 0 ? Math.round((基本掌握 / total) * 100) : 0,
    需要复习率: total > 0 ? Math.round((需要复习 / total) * 100) : 0
  }
})

// 本周统计（模拟数据）
const weeklyStats = computed(() => {
  const now = new Date()
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  const records = Array.from(learningStore.learningRecords.values())
  
  // 计算本周学习记录
  const weeklyRecords = records.filter(record => {
    const lastLearningDate = record.最后学习时间 || record.最后检查时间
    if (!lastLearningDate) return false
    
    try {
      const recordDate = new Date(lastLearningDate)
      return recordDate >= oneWeekAgo && recordDate <= now
    } catch (e) {
      return false
    }
  })
  
  // 计算本周统计
  // 统计本周学习天数：收集所有不同的学习日期
  const learningDates = new Set<string>()
  weeklyRecords.forEach(record => {
    const lastLearningDate = record.最后学习时间 || record.最后检查时间
    if (lastLearningDate) {
      try {
        const recordDate = new Date(lastLearningDate)
        // 只保留日期部分，忽略时间
        const dateString = recordDate.toDateString()
        learningDates.add(dateString)
      } catch (e) {
        // 忽略无效日期
      }
    }
  })
  const 学习天数 = learningDates.size
  
  const 新学汉字 = weeklyRecords.filter(record => record.学习次数 > 0).length
  const 本周检查次数 = weeklyRecords.reduce((sum, record) => sum + record.检查次数, 0)
  const 本周正确次数 = weeklyRecords.reduce((sum, record) => sum + record.正确次数, 0)
  const 正确率 = 本周检查次数 > 0 ? Math.round((本周正确次数 / 本周检查次数) * 100) : 0
  
  // 计算趋势（与上周对比）
  const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000)
  const lastWeekRecords = records.filter(record => {
    const lastLearningDate = record.最后学习时间 || record.最后检查时间
    if (!lastLearningDate) return false
    
    try {
      const recordDate = new Date(lastLearningDate)
      return recordDate >= twoWeeksAgo && recordDate < oneWeekAgo
    } catch (e) {
      return false
    }
  })
  
  const 上周检查次数 = lastWeekRecords.reduce((sum, record) => sum + record.检查次数, 0)
  const 上周正确次数 = lastWeekRecords.reduce((sum, record) => sum + record.正确次数, 0)
  const 上周正确率 = 上周检查次数 > 0 ? Math.round((上周正确次数 / 上周检查次数) * 100) : 0
  
  let 趋势 = 0
  if (正确率 > 上周正确率 + 5) {
    趋势 = 1 // 上升
  } else if (正确率 < 上周正确率 - 5) {
    趋势 = -1 // 下降
  }
  
  return {
    学习天数,
    新学汉字,
    正确率,
    趋势
  }
})

// 错题分析
const errorAnalysis = computed(() => {
  const records = Array.from(learningStore.learningRecords.values())
  const analysis = []
  
  // 分析拼音选字错误
  const pinyinErrors = records.filter(r => 
    r.错误类型.includes('拼音选汉字') && r.检查次数 > 0 && r.正确次数 / r.检查次数 < 0.7
  )
  
  if (pinyinErrors.length > 0) {
    analysis.push({
      type: 'pinyin-error',
      title: '拼音选汉字易错',
      description: '在根据拼音选择汉字时经常出错，建议加强拼音识别练习',
      count: pinyinErrors.length,
      severity: 'warning',
      examples: pinyinErrors.slice(0, 5).map(r => r.字符)
    })
  }
  
  // 分析汉字选拼音错误
  const hanziErrors = records.filter(r => 
    r.错误类型.includes('汉字选拼音') && r.检查次数 > 0 && r.正确次数 / r.检查次数 < 0.7
  )
  
  if (hanziErrors.length > 0) {
    analysis.push({
      type: 'hanzi-error',
      title: '汉字选拼音易错',
      description: '在根据汉字选择拼音时经常出错，建议加强拼音记忆',
      count: hanziErrors.length,
      severity: 'warning',
      examples: hanziErrors.slice(0, 5).map(r => r.字符)
    })
  }
  
  return analysis
})

// 个性化建议
const recommendations = computed(() => {
  const recommendations = []
  const stats = userStats.value
  const records = Array.from(learningStore.learningRecords.values())
  
  // 学习进度建议
  if (stats.总学习汉字数 < 100) {
    recommendations.push({
      type: 'progress',
      alertType: 'info',
      title: '加快学习进度',
      description: '你已经掌握了基础，可以适当增加每次学习的汉字数量。'
    })
  } else if (stats.总学习汉字数 >= 1000) {
    recommendations.push({
      type: 'advanced',
      alertType: 'success',
      title: '学习进展优秀',
      description: '你已经学习了很多汉字，可以尝试更有挑战性的练习。'
    })
  }
  
  // 正确率建议
  if (stats.整体正确率 < 70) {
    recommendations.push({
      type: 'accuracy',
      alertType: 'warning',
      title: '放慢学习节奏',
      description: '建议减少每次学习的数量，重点巩固已学汉字。'
    })
  }
  
  // 复习建议
  const needReview = records.filter(r => r.掌握度 === '需要复习').length
  if (needReview > 20) {
    recommendations.push({
      type: 'review',
      alertType: 'warning',
      title: '重点复习',
      description: `有 ${needReview} 个汉字需要复习，建议优先安排复习时间。`
    })
  }
  
  // 坚持学习建议
  if (stats.连续学习天数 >= 7) {
    recommendations.push({
      type: 'streak',
      alertType: 'success',
      title: '坚持不懈',
      description: '连续学习效果显著，继续保持这个良好习惯！'
    })
  }
  
  return recommendations
})

// 方法
const exportData = () => {
  try {
    const data = {
      userStats: userStats.value,
      learningRecords: Object.fromEntries(learningStore.learningRecords),
      exportTime: new Date().toISOString()
    }
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `hanzi-learning-data-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
    
    ElMessage.success('数据导出成功')
  } catch (error) {
    ElMessage.error('数据导出失败')
  }
}

const resetProgress = async () => {
  try {
    await ElMessageBox.confirm(
      '确定要重置所有学习进度吗？此操作不可恢复。',
      '重置确认',
      {
        confirmButtonText: '确定重置',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    // 清空本地存储
    localStorage.removeItem('learningRecords')
    localStorage.removeItem('userStats')
    
    // 重新加载页面
    window.location.reload()
  } catch {
    // 用户取消
  }
}
</script>

<style lang="scss" scoped>
.statistics-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  
  > div {
    margin-bottom: 30px;
  }
}

.stats-header {
  .header-card {
    text-align: center;
    padding: 40px;
    
    h2 {
      color: #409EFF;
      margin-bottom: 16px;
    }
    
    .description {
      color: #666;
      font-size: 16px;
    }
  }
}

.overview-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  
  .overview-item {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 24px;
    background: rgba(64, 158, 255, 0.05);
    border-radius: 12px;
    
    .item-icon {
      font-size: 32px;
      width: 50px;
      text-align: center;
    }
    
    .item-content {
      flex: 1;
      
      .item-number {
        font-size: 24px;
        font-weight: 700;
        color: #409EFF;
        margin-bottom: 4px;
      }
      
      .item-label {
        font-size: 14px;
        color: #666;
        margin-bottom: 8px;
      }
      
      .item-progress {
        display: flex;
        align-items: center;
        gap: 8px;
        
        .el-progress {
          flex: 1;
        }
        
        .progress-text {
          font-size: 12px;
          color: #666;
          font-weight: 500;
        }
      }
    }
  }
}

.mastery-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  
  .mastery-item {
    text-align: center;
    padding: 20px;
    border-radius: 12px;
    
    &.mastery-complete {
      background: rgba(103, 194, 58, 0.1);
      border: 1px solid rgba(103, 194, 58, 0.2);
      
      .mastery-fill {
        background: #67C23A;
      }
    }
    
    &.mastery-basic {
      background: rgba(64, 158, 255, 0.1);
      border: 1px solid rgba(64, 158, 255, 0.2);
      
      .mastery-fill {
        background: #409EFF;
      }
    }
    
    &.mastery-review {
      background: rgba(230, 162, 60, 0.1);
      border: 1px solid rgba(230, 162, 60, 0.2);
      
      .mastery-fill {
        background: #E6A23C;
      }
    }
    
    .mastery-count {
      font-size: 28px;
      font-weight: 700;
      margin-bottom: 8px;
    }
    
    .mastery-label {
      font-size: 14px;
      color: #666;
      margin-bottom: 12px;
    }
    
    .mastery-bar {
      height: 6px;
      background: rgba(0, 0, 0, 0.1);
      border-radius: 3px;
      overflow: hidden;
      
      .mastery-fill {
        height: 100%;
        transition: width 0.3s ease;
      }
    }
  }
}

.performance-summary {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 20px;
  
  .summary-card {
    text-align: center;
    padding: 20px;
    background: rgba(0, 0, 0, 0.02);
    border-radius: 12px;
    
    h4 {
      font-size: 14px;
      color: #666;
      margin-bottom: 12px;
    }
    
    .summary-data {
      display: flex;
      align-items: baseline;
      justify-content: center;
      gap: 4px;
      
      .data-number {
        font-size: 24px;
        font-weight: 700;
        color: #409EFF;
      }
      
      .data-label {
        font-size: 14px;
        color: #666;
        
        .trend-up {
          color: #67C23A;
        }
        
        .trend-down {
          color: #F56C6C;
        }
        
        .trend-stable {
          color: #909399;
        }
      }
    }
  }
}

.error-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
  
  .error-item {
    padding: 20px;
    background: rgba(245, 108, 108, 0.05);
    border-radius: 12px;
    border-left: 4px solid #F56C6C;
    
    .error-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
      
      h4 {
        font-size: 16px;
        color: #333;
        margin: 0;
      }
    }
    
    .error-description {
      color: #666;
      margin-bottom: 12px;
    }
    
    .error-examples {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
      
      .example-tag {
        background: rgba(245, 108, 108, 0.1);
        border: 1px solid rgba(245, 108, 108, 0.2);
      }
    }
  }
}

.recommendation-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.actions {
  display: flex;
  justify-content: center;
  gap: 20px;
  flex-wrap: wrap;
}

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

@media (max-width: 768px) {
  .statistics-container {
    padding: 10px;
  }
  
  .learning-card {
    padding: 20px;
  }
  
  .overview-grid, .mastery-grid {
    grid-template-columns: 1fr;
  }
  
  .performance-summary {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .actions {
    flex-direction: column;
    
    .el-button {
      width: 100%;
    }
  }
}
</style> 