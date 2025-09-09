<template>
  <div class="review-container">
    <!-- 复习设置阶段 -->
    <div v-if="currentPhase === 'settings'" class="settings-phase">
      <div class="learning-card settings-card">
        <h2>🔄 开始复习</h2>
        <p class="phase-description">配置复习参数，系统将智能选择需要复习的汉字进行测试</p>
        
        <el-form :model="reviewSettings" label-width="120px" size="large">
          <el-form-item label="复习数量">
            <el-slider 
              v-model="reviewSettings.复习数量" 
              :min="5" 
              :max="50" 
              :step="5"
              :show-input="true"
              show-stops
            />
            <span class="form-tip">建议选择10-30个汉字进行复习</span>
          </el-form-item>
          
          <el-form-item label="测试类型">
            <el-radio-group v-model="reviewSettings.检查类型" size="large">
              <el-radio value="拼音选汉字">拼音选汉字</el-radio>
              <el-radio value="汉字选拼音">汉字选拼音</el-radio>
              <el-radio value="混合模式">混合模式</el-radio>
            </el-radio-group>
          </el-form-item>
          
          <el-form-item label="复习范围">
            <el-radio-group v-model="reviewSettings.复习范围" size="large">
              <el-radio value="错字本">错字本汉字 ({{ errorBookCount }} 个)</el-radio>
              <el-radio value="需要复习">需要复习的汉字 ({{ needReviewCount }} 个)</el-radio>
              <el-radio value="顺序复习">按学习顺序复习 ({{ learnedCount }} 个)</el-radio>
              <el-radio value="随机复习">随机复习已学汉字 ({{ learnedCount }} 个)</el-radio>
              <el-radio value="基本掌握">基本掌握的汉字 ({{ basicMasteryCount }} 个)</el-radio>
              <el-radio value="完全掌握">完全掌握的汉字 ({{ fullMasteryCount }} 个)</el-radio>
            </el-radio-group>
            <div class="form-tip">
              建议优先复习"需要复习"的汉字以提高掌握度
            </div>
          </el-form-item>
          
          <el-form-item label="答题时间">
            <el-select v-model="reviewSettings.倒计时秒数" placeholder="选择答题时间限制">
              <el-option label="无限制" :value="0" />
              <el-option label="15秒" :value="15" />
              <el-option label="30秒" :value="30" />
              <el-option label="45秒" :value="45" />
              <el-option label="60秒" :value="60" />
            </el-select>
          </el-form-item>

          <el-form-item label="高级选项">
            <el-checkbox v-model="reviewSettings.是否显示声调">显示拼音声调</el-checkbox>
            <br>
            <el-checkbox v-model="reviewSettings.打乱选项顺序">打乱选项顺序</el-checkbox>
          </el-form-item>
        </el-form>
        
        <div class="settings-actions">
          <el-button @click="$router.push('/')" size="large">
            <el-icon><ArrowLeft /></el-icon>
            返回首页
          </el-button>
          <el-button 
            type="primary" 
            size="large" 
            @click="startReview"
            :disabled="!canStartReview"
          >
            <el-icon><VideoPlay /></el-icon>
            开始复习 ({{ selectedReviewCount }} 字)
          </el-button>
        </div>
      </div>
    </div>
    
    <!-- 复习测试阶段 -->
    <div v-else-if="currentPhase === 'quiz'" class="quiz-phase">
      <!-- 没有可复习内容的情况 -->
      <div v-if="currentQuizQuestions.length === 0" class="learning-card">
        <div style="text-align: center; padding: 40px;">
          <h2>😔 暂无可复习内容</h2>
          <el-alert
            v-if="reviewSettings.复习范围 === '错字本'"
            title="错字本为空"
            description="当前错字本中没有汉字。进行学前诊断或答错题目后，错误汉字会自动添加到错字本。"
            type="info"
            :closable="false"
            show-icon
            style="margin: 20px 0;"
          />
          <el-alert
            v-else-if="reviewSettings.复习范围 === '需要复习'"
            title="没有需要复习的汉字"
            description="当前没有掌握度为'需要复习'的汉字。建议先学习一些新汉字后再来复习。"
            type="info"
            :closable="false"
            show-icon
            style="margin: 20px 0;"
          />
          <el-alert
            v-else-if="reviewSettings.复习范围 === '顺序复习' || reviewSettings.复习范围 === '随机复习'"
            title="没有已学汉字"
            description="当前还没有学习过的汉字。建议先学习一些新汉字后再使用复习功能。"
            type="info"
            :closable="false"
            show-icon
            style="margin: 20px 0;"
          />
          <div style="margin-top: 30px;">
            <el-button @click="$router.push('/')" size="large" style="margin-right: 10px;">
              <el-icon><House /></el-icon>
              返回首页
            </el-button>
            <el-button @click="$router.push('/learning')" type="primary" size="large">
              <el-icon><Reading /></el-icon>
              开始学习
            </el-button>
          </div>
        </div>
      </div>

      <!-- 正常复习测试界面 -->
      <div v-else>
        <div class="progress-header">
          <el-progress 
            :percentage="quizProgress.percentage" 
            :stroke-width="8"
            :show-text="false"
          />
          <div class="progress-info">
            <span>复习进度: {{ currentQuestionIndex + 1 }} / {{ currentQuizQuestions.length }}</span>
            <span>{{ quizProgress.percentage }}%</span>
          </div>
        </div>
        
        <div class="learning-card main-quiz-card">
          <div v-if="currentQuestion" class="quiz-content">
            <!-- 题目显示 -->
            <div class="question-header">
              <div class="question-number">第 {{ currentQuestionIndex + 1 }} 题</div>
              <div v-if="reviewSettings.倒计时秒数 > 0" class="timer">
                <el-icon><Timer /></el-icon>
                {{ timeLeft }}s
              </div>
            </div>
            
            <div class="question-content">
              <h3 class="question-text">{{ currentQuestion.question }}</h3>
              
              <!-- 相关词语提示 -->
              <div v-if="currentQuestion.词语.length > 0" class="word-hints">
                <span class="hints-label">相关词语：</span>
                <el-tag 
                  v-for="word in currentQuestion.词语" 
                  :key="word"
                  size="small"
                  class="word-hint"
                >
                  {{ word }}
                </el-tag>
              </div>
            </div>
            
            <!-- 选项区域 -->
            <div class="options-container">
              <el-button
                v-for="(option, index) in displayOptions"
                :key="index"
                :class="['option-button', getOptionClass(option)]"
                :disabled="answered"
                @click="selectAnswer(option)"
                size="large"
              >
                {{ String.fromCharCode(65 + index) }}. {{ option }}
              </el-button>
            </div>
            
            <!-- 答题结果显示 -->
            <div v-if="answered" class="answer-result">
              <div :class="['result-message', isCurrentCorrect ? 'correct' : 'incorrect']">
                <el-icon>
                  <Check v-if="isCurrentCorrect" />
                  <Close v-else />
                </el-icon>
                <span>{{ isCurrentCorrect ? '回答正确！' : '回答错误！' }}</span>
              </div>
              <div v-if="!isCurrentCorrect" class="correct-answer">
                正确答案：{{ currentQuestion.correctAnswer }}
              </div>
            </div>
            
            <!-- 操作按钮 -->
            <div class="quiz-actions">
              <el-button 
                size="large" 
                @click="previousQuestion"
                :disabled="currentQuestionIndex === 0"
              >
                <el-icon><ArrowLeft /></el-icon>
                上一题
              </el-button>
              <el-button 
                type="primary" 
                size="large" 
                @click="nextQuestion"
                :disabled="!answered"
              >
                <el-icon><ArrowRight /></el-icon>
                {{ currentQuestionIndex === currentQuizQuestions.length - 1 ? '完成复习' : '下一题' }}
              </el-button>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 复习统计阶段 -->
    <div v-else-if="currentPhase === 'statistics'" class="statistics-phase">
      <div class="learning-card stats-card">
        <div class="stats-header">
          <h2>📊 复习完成</h2>
          <p class="completion-message">恭喜你完成了本次复习！</p>
        </div>
        
        <!-- 复习成绩 -->
        <div class="review-score">
          <div class="score-circle">
            <el-progress 
              type="circle" 
              :percentage="reviewAccuracy" 
              :width="120"
              :stroke-width="8"
              :color="scoreColor"
            />
            <div class="score-label">正确率</div>
          </div>
          
          <div class="score-details">
            <div class="detail-item">
              <div class="detail-number">{{ correctCount }}</div>
              <div class="detail-label">答对题数</div>
            </div>
            <div class="detail-item">
              <div class="detail-number">{{ currentQuizQuestions.length }}</div>
              <div class="detail-label">总题数</div>
            </div>
            <div class="detail-item">
              <div class="detail-number">{{ averageTime }}s</div>
              <div class="detail-label">平均用时</div>
            </div>
          </div>
        </div>
        
        <!-- 复习建议 -->
        <div class="review-suggestions">
          <h3>📝 复习建议</h3>
          <div class="suggestions-list">
            <el-alert
              v-for="suggestion in reviewSuggestions"
              :key="suggestion.type"
              :title="suggestion.title"
              :description="suggestion.description"
              :type="suggestion.alertType"
              show-icon
              :closable="false"
              style="margin-bottom: 10px;"
            />
          </div>
        </div>
        
        <!-- 操作按钮 -->
        <div class="stats-actions">
          <el-button @click="$router.push('/')" size="large">
            <el-icon><House /></el-icon>
            返回首页
          </el-button>
          <el-button @click="restartReview" size="large">
            <el-icon><Refresh /></el-icon>
            再次复习
          </el-button>
          <el-button @click="$router.push('/learning')" type="primary" size="large">
            <el-icon><Reading /></el-icon>
            学习新字
          </el-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
// import { useRouter } from 'vue-router' // 保留备用
import { useLearningStore } from '@/stores/learning'
import { ElMessage } from 'element-plus'
import { 
  ArrowLeft, 
  ArrowRight, 
  VideoPlay, 
  House, 
  Reading, 
  Refresh, 
  Timer, 
  Check, 
  Close 
} from '@element-plus/icons-vue'
import type { QuizQuestion } from '@/types'

// const router = useRouter() // 当前未使用，但保留备用
const learningStore = useLearningStore()

// 本地复习设置（用于v-model绑定）
const reviewSettings = ref({
  复习数量: 15,
  检查类型: '混合模式' as '拼音选汉字' | '汉字选拼音' | '混合模式',
  复习范围: '需要复习' as '错字本' | '需要复习' | '顺序复习' | '随机复习' | '基本掌握' | '完全掌握',
  倒计时秒数: 30,
  是否显示声调: true,
  打乱选项顺序: true
})

// 复习状态
const currentPhase = ref<'settings' | 'quiz' | 'statistics'>('settings')
const currentQuizQuestions = ref<QuizQuestion[]>([])
const currentQuestionIndex = ref(0)
const quizResults = ref<any[]>([])
const answered = ref(false)
const selectedAnswer = ref('')
const isCurrentCorrect = ref(false)
const timeLeft = ref(0)
const timer = ref<NodeJS.Timeout | null>(null)

// 从store加载初始设置
onMounted(() => {
  reviewSettings.value = { ...learningStore.reviewSettings }
})

// 计算属性
const needReviewCount = computed(() => {
  return Array.from(learningStore.learningRecords.values())
    .filter(record => record.掌握度 === '需要复习').length
})

const learnedCount = computed(() => {
  return Array.from(learningStore.learningRecords.values()).length
})

const basicMasteryCount = computed(() => {
  return Array.from(learningStore.learningRecords.values())
    .filter(record => record.掌握度 === '基本掌握').length
})

const fullMasteryCount = computed(() => {
  return Array.from(learningStore.learningRecords.values())
    .filter(record => record.掌握度 === '完全掌握').length
})

// 错字本汉字计数
const errorBookCount = computed(() => {
  return learningStore.errorBook.size
})

const selectedReviewCount = computed(() => {
  const range = reviewSettings.value.复习范围
  const amount = reviewSettings.value.复习数量
  
  let availableCount = 0
  if (range === '错字本') availableCount = errorBookCount.value
  else if (range === '需要复习') availableCount = needReviewCount.value
  else if (range === '基本掌握') availableCount = basicMasteryCount.value
  else if (range === '完全掌握') availableCount = fullMasteryCount.value
  else availableCount = learnedCount.value
  
  return Math.min(amount, availableCount)
})

const canStartReview = computed(() => {
  return selectedReviewCount.value > 0
})

const currentQuestion = computed(() => {
  return currentQuizQuestions.value[currentQuestionIndex.value]
})

const displayOptions = computed(() => {
  if (!currentQuestion.value) return []
  const options = [...currentQuestion.value.options]
  return reviewSettings.value.打乱选项顺序 ? 
    options.sort(() => Math.random() - 0.5) : options
})

const quizProgress = computed(() => {
  if (currentQuizQuestions.value.length === 0) return { current: 0, total: 0, percentage: 0 }
  return {
    current: currentQuestionIndex.value + 1,
    total: currentQuizQuestions.value.length,
    percentage: Math.round(((currentQuestionIndex.value + 1) / currentQuizQuestions.value.length) * 100)
  }
})

const correctCount = computed(() => {
  return quizResults.value.filter(result => result.isCorrect).length
})

const reviewAccuracy = computed(() => {
  if (quizResults.value.length === 0) return 0
  return Math.round((correctCount.value / quizResults.value.length) * 100)
})

const averageTime = computed(() => {
  if (quizResults.value.length === 0) return 0
  const totalTime = quizResults.value.reduce((sum, result) => sum + result.timeSpent, 0)
  return Math.round(totalTime / quizResults.value.length)
})

const scoreColor = computed(() => {
  const accuracy = reviewAccuracy.value
  if (accuracy >= 90) return '#67C23A'
  if (accuracy >= 70) return '#409EFF'
  if (accuracy >= 60) return '#E6A23C'
  return '#F56C6C'
})

const reviewSuggestions = computed(() => {
  const suggestions = []
  const accuracy = reviewAccuracy.value
  
  if (accuracy >= 90) {
    suggestions.push({
      type: 'excellent',
      title: '优秀表现！',
      description: '你的复习效果非常好，可以尝试学习新的汉字了。',
      alertType: 'success'
    })
  } else if (accuracy >= 70) {
    suggestions.push({
      type: 'good',
      title: '表现良好',
      description: '大部分汉字掌握得不错，建议继续巩固薄弱的汉字。',
      alertType: 'info'
    })
  } else if (accuracy >= 60) {
    suggestions.push({
      type: 'needs_improvement',
      title: '需要加强',
      description: '建议重点复习答错的汉字，可以适当降低复习数量。',
      alertType: 'warning'
    })
  } else {
    suggestions.push({
      type: 'poor',
      title: '建议重新学习',
      description: '正确率较低，建议重新学习这些汉字，加强记忆。',
      alertType: 'error'
    })
  }
  
  return suggestions
})

// 方法
const startReview = () => {
  if (!canStartReview.value) {
    ElMessage.warning('没有可复习的汉字')
    return
  }
  
  // 将本地设置同步到store
  learningStore.updateReviewSettings(reviewSettings.value)
  
  generateReviewQuestions()
  currentPhase.value = 'quiz'
  resetQuizState()
}

const generateReviewQuestions = () => {
  const { 复习数量, 复习范围, 检查类型 } = reviewSettings.value
  let selectedItems: any[] = []
  let questions: QuizQuestion[] = []
  
  if (复习范围 === '错字本') {
    // 处理错字本复习
    const errorBookChars = learningStore.getErrorBookCharacters()
    selectedItems = errorBookChars.slice(0, 复习数量).map(char => ({
      字符: char.汉字,
      拼音: char.拼音,
      isErrorBookItem: true
    }))
    
    selectedItems.forEach((item, index) => {
      const hanziInfo = learningStore.hanziData.find(h => h.汉字 === item.字符)
      if (!hanziInfo) return
      
      generateQuestionForChar(hanziInfo, index, questions, 检查类型)
    })
  } else {
    // 处理其他复习范围
    const allRecords = Array.from(learningStore.learningRecords.values())
  let filteredRecords: any[] = []
  
  switch (复习范围) {
    case '需要复习':
      filteredRecords = allRecords.filter(record => record.掌握度 === '需要复习')
      break
    case '基本掌握':
      filteredRecords = allRecords.filter(record => record.掌握度 === '基本掌握')
      break
    case '完全掌握':
      filteredRecords = allRecords.filter(record => record.掌握度 === '完全掌握')
      break
    case '顺序复习':
      filteredRecords = allRecords.sort((a, b) => 
        (a.最后学习时间 || a.最后检查时间 || '0').localeCompare(
          b.最后学习时间 || b.最后检查时间 || '0'
        )
      )
      break
    case '随机复习':
      filteredRecords = allRecords.sort(() => Math.random() - 0.5)
      break
  }
  
  const selectedRecords = filteredRecords.slice(0, 复习数量)
  
  selectedRecords.forEach((record, index) => {
    const hanziInfo = learningStore.hanziData.find(h => h.汉字 === record.字符)
    if (!hanziInfo) return
    
        generateQuestionForChar(hanziInfo, index, questions, 检查类型)
      })
    }
    
    currentQuizQuestions.value = questions
  }
  
  // 为指定汉字生成题目的辅助函数
  const generateQuestionForChar = (hanziInfo: any, index: number, questions: any[], 检查类型: string) => {
    let questionType = 检查类型
    if (检查类型 === '混合模式') {
      questionType = Math.random() > 0.5 ? '拼音选汉字' : '汉字选拼音'
    }
    
    if (questionType === '拼音选汉字') {
      const correctAnswer = hanziInfo.汉字
      const wrongAnswers = learningStore.hanziData
        .filter(h => h.汉字 !== correctAnswer)
        .sort(() => Math.random() - 0.5)
        .slice(0, 3)
        .map(h => h.汉字)
      
      const options = [correctAnswer, ...wrongAnswers].sort(() => Math.random() - 0.5)
      
      questions.push({
        id: `review_question_${index}`,
        type: '拼音选汉字',
        question: `选择拼音"${hanziInfo.拼音}"对应的汉字：`,
        correctAnswer,
        options,
        词语: [hanziInfo.词语1, hanziInfo.词语2, hanziInfo.词语3].filter(word => word && word.trim())
      })
    } else {
      const correctAnswer = hanziInfo.拼音
      const wrongAnswers = learningStore.hanziData
        .filter(h => h.拼音 !== correctAnswer)
        .sort(() => Math.random() - 0.5)
        .slice(0, 3)
        .map(h => h.拼音)
      
      const options = [correctAnswer, ...wrongAnswers].sort(() => Math.random() - 0.5)
      
      questions.push({
        id: `review_question_${index}`,
        type: '汉字选拼音',
        question: `选择汉字"${hanziInfo.汉字}"的正确拼音：`,
        correctAnswer,
        options,
        词语: [hanziInfo.词语1, hanziInfo.词语2, hanziInfo.词语3].filter(word => word && word.trim())
      })
    }
}

const resetQuizState = () => {
  currentQuestionIndex.value = 0
  quizResults.value = []
  answered.value = false
  selectedAnswer.value = ''
  isCurrentCorrect.value = false
  startTimer()
}

const startTimer = () => {
  if (reviewSettings.value.倒计时秒数 > 0) {
    timeLeft.value = reviewSettings.value.倒计时秒数
    timer.value = setInterval(() => {
      timeLeft.value--
      if (timeLeft.value <= 0) {
        if (!answered.value) {
          selectAnswer('') // 时间到，自动提交空答案
        }
      }
    }, 1000)
  }
}

const stopTimer = () => {
  if (timer.value) {
    clearInterval(timer.value)
    timer.value = null
  }
}

const selectAnswer = (answer: string) => {
  if (answered.value || !currentQuestion.value) return
  
  const startTime = reviewSettings.value.倒计时秒数 - timeLeft.value
  const timeSpent = reviewSettings.value.倒计时秒数 > 0 ? startTime : 0
  
  selectedAnswer.value = answer
  isCurrentCorrect.value = answer === currentQuestion.value.correctAnswer
  answered.value = true
  
  // 记录答题结果
  quizResults.value.push({
    questionId: currentQuestion.value.id,
    userAnswer: answer,
    isCorrect: isCurrentCorrect.value,
    timeSpent,
    timestamp: new Date().toISOString(),
    character: getCharacterFromQuestion(),
    correctAnswer: currentQuestion.value.correctAnswer
  })
  
  // 更新学习记录
  const character = getCharacterFromQuestion()
  if (character) {
    learningStore.updateLearningRecord(character, isCurrentCorrect.value, false)
  }
  
  stopTimer()
  
  // 如果答题正确，2秒后自动跳到下一题
  if (isCurrentCorrect.value) {
    setTimeout(() => {
      if (answered.value) { // 确保还在答题状态，防止用户已经手动点击了下一题
        nextQuestion()
      }
    }, 2000)
  }
}

const getCharacterFromQuestion = () => {
  if (!currentQuestion.value) return ''
  
  if (currentQuestion.value.type === '拼音选汉字') {
    return currentQuestion.value.correctAnswer
  } else {
    // 从题目中提取汉字
    const match = currentQuestion.value.question.match(/汉字"(.+?)"的/)
    return match ? match[1] : ''
  }
}

const getOptionClass = (option: string) => {
  if (!answered.value || !currentQuestion.value) return ''
  
  if (option === currentQuestion.value.correctAnswer) {
    return 'correct'
  } else if (option === selectedAnswer.value && option !== currentQuestion.value.correctAnswer) {
    return 'incorrect'
  }
  
  return 'disabled'
}

const nextQuestion = () => {
  if (currentQuestionIndex.value < currentQuizQuestions.value.length - 1) {
    currentQuestionIndex.value++
    answered.value = false
    selectedAnswer.value = ''
    isCurrentCorrect.value = false
    startTimer()
  } else {
    // 复习完成
    finishReview()
  }
}

const previousQuestion = () => {
  if (currentQuestionIndex.value > 0) {
    currentQuestionIndex.value--
    
    // 恢复上一题的答题状态
    const prevResult = quizResults.value[currentQuestionIndex.value]
    if (prevResult) {
      selectedAnswer.value = prevResult.userAnswer
      isCurrentCorrect.value = prevResult.isCorrect
      answered.value = true
      stopTimer()
    }
  }
}

const finishReview = () => {
  stopTimer()
  learningStore.updateUserStats()
  currentPhase.value = 'statistics'
  ElMessage.success('复习完成！')
}

const restartReview = () => {
  currentPhase.value = 'settings'
  resetQuizState()
}

// 生命周期
onUnmounted(() => {
  stopTimer()
})
</script>

<style lang="scss" scoped>
.review-container {
  max-width: 900px;
  margin: 0 auto;
  padding: 20px;
}

.settings-phase, .quiz-phase, .statistics-phase {
  .learning-card {
    padding: 30px;
    margin-bottom: 20px;
  }
}

.phase-description {
  color: #666;
  margin-bottom: 30px;
  line-height: 1.6;
}

.form-tip {
  font-size: 12px;
  color: #999;
  margin-top: 5px;
  display: block;
}

.settings-actions, .quiz-actions, .stats-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 30px;
  
  @media (max-width: 768px) {
    flex-direction: column;
    gap: 15px;
    
    .el-button {
      width: 100%;
    }
  }
}

.progress-header {
  margin-bottom: 20px;
  
  .progress-info {
    display: flex;
    justify-content: space-between;
    margin-top: 10px;
    font-size: 14px;
    color: #666;
  }
}

.main-quiz-card {
  min-height: 500px;
}

.quiz-content {
  text-align: center;
}

.question-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
  
  .question-number {
    font-size: 18px;
    font-weight: 600;
    color: #409EFF;
  }
  
  .timer {
    display: flex;
    align-items: center;
    gap: 5px;
    font-size: 16px;
    font-weight: 600;
    color: #E6A23C;
  }
}

.question-content {
  margin-bottom: 30px;
  
  .question-text {
    font-size: 24px;
    color: #333;
    margin-bottom: 20px;
  }
  
  .word-hints {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    flex-wrap: wrap;
    
    .hints-label {
      color: #666;
      font-size: 14px;
    }
    
    .word-hint {
      margin: 2px;
    }
  }
}

.options-container {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 15px;
  margin: 30px 0;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
}

.option-button {
  height: 60px;
  font-size: 18px;
  border-radius: 12px;
  transition: all 0.3s ease;
  
  &:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }
  
  &.correct {
    background-color: #67C23A;
    border-color: #67C23A;
    color: white;
    
    &:hover {
      background-color: #67C23A;
      border-color: #67C23A;
    }
  }
  
  &.incorrect {
    background-color: #F56C6C;
    border-color: #F56C6C;
    color: white;
    
    &:hover {
      background-color: #F56C6C;
      border-color: #F56C6C;
    }
  }
  
  &.disabled {
    opacity: 0.5;
  }
}

.answer-result {
  margin: 20px 0;
  
  .result-message {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    font-size: 18px;
    font-weight: 600;
    margin-bottom: 10px;
    
    &.correct {
      color: #67C23A;
    }
    
    &.incorrect {
      color: #F56C6C;
    }
  }
  
  .correct-answer {
    color: #666;
    font-size: 16px;
  }
}

.stats-header {
  text-align: center;
  margin-bottom: 30px;
  
  h2 {
    color: #409EFF;
    margin-bottom: 10px;
  }
  
  .completion-message {
    color: #666;
    font-size: 16px;
  }
}

.review-score {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 40px;
  margin: 40px 0;
  
  @media (max-width: 768px) {
    flex-direction: column;
    gap: 20px;
  }
  
  .score-circle {
    text-align: center;
    
    .score-label {
      margin-top: 10px;
      font-size: 16px;
      color: #666;
    }
  }
  
  .score-details {
    display: flex;
    gap: 30px;
    
    @media (max-width: 768px) {
      gap: 20px;
    }
    
    .detail-item {
      text-align: center;
      
      .detail-number {
        font-size: 24px;
        font-weight: 600;
        color: #409EFF;
        margin-bottom: 5px;
      }
      
      .detail-label {
        font-size: 14px;
        color: #666;
      }
    }
  }
}

.review-suggestions {
  margin: 30px 0;
  
  h3 {
    color: #333;
    margin-bottom: 15px;
  }
}

@media (max-width: 768px) {
  .review-container {
    padding: 10px;
  }
  
  .learning-card {
    padding: 20px;
  }
  
  .question-text {
    font-size: 20px;
  }
  
  .option-button {
    height: 50px;
    font-size: 16px;
  }
}
</style> 