import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { 
  HanziData, 
  LearningRecord, 
  UserStats, 
  LearningSettings, 
  ReviewSettings,
  QuizQuestion, 
  LearningPhase,
  CurrentUser,
  LearningMode,
  DiagnosticResult,
  DiagnosticSettings,
  ErrorBookItem
} from '../types'
import { userApi } from '@/services/userApi'
import { 
  loadHanziData, 
  getSimilarPinyinCharacters, 
  calculateMasteryLevel,
  formatDate,
  removeTone
} from '../utils/data'

export const useLearningStore = defineStore('learning', () => {
  // 当前用户
  const currentUser = ref<CurrentUser | null>(null)
  
  // 基础数据
  const hanziData = ref<HanziData[]>([])
  const learningRecords = ref<Map<string, LearningRecord>>(new Map())
  const favoriteChars = ref<Set<string>>(new Set())
  const userStats = ref<UserStats>({
    总学习汉字数: 0,
    总掌握汉字数: 0,
    整体正确率: 0,
    学习天数: 0,
    连续学习天数: 0,
    最后学习日期: ''
  })
  
  // 学习状态
  const currentPhase = ref<LearningPhase>('settings')
  const settings = ref<LearningSettings>({
    学习数量: 10,
    复习数量: 15,
    检查类型: '混合模式',
    学习范围: '全新汉字',
    是否显示声调: true,
    是否显示笔画: false,
    倒计时秒数: 30,
    起始序号: 1,
    结束序号: undefined
  })
  
  // 复习设置
  const reviewSettings = ref<ReviewSettings>({
    复习数量: 15,
    检查类型: '混合模式',
    复习范围: '需要复习',
    倒计时秒数: 30,
    是否显示声调: true,
    打乱选项顺序: true
  })
  
  // 当前学习会话数据
  const currentLearningChars = ref<HanziData[]>([])
  const currentCharIndex = ref(0)
  const currentQuizQuestions = ref<QuizQuestion[]>([])
  const currentQuestionIndex = ref(0)
  const quizResults = ref<any[]>([])

  // 诊断相关状态
  const currentLearningMode = ref<LearningMode>('traditional')
  const diagnosticResult = ref<DiagnosticResult | null>(null)
  const diagnosticSettings = ref<DiagnosticSettings>({
    诊断数量: 50,
    起始范围: 1,
    结束范围: 500,
    题目类型: '汉字选拼音',
    答题时间: 15
  })

  // 错字本状态
  const errorBook = ref<Map<string, ErrorBookItem>>(new Map())

  // 计算属性
  const currentChar = computed(() => {
    return currentLearningChars.value[currentCharIndex.value]
  })
  
  const learningProgress = computed(() => {
    if (currentLearningChars.value.length === 0) return { current: 0, total: 0, percentage: 0 }
    return {
      current: currentCharIndex.value + 1,
      total: currentLearningChars.value.length,
      percentage: Math.round(((currentCharIndex.value + 1) / currentLearningChars.value.length) * 100)
    }
  })

  const quizProgress = computed(() => {
    if (currentQuizQuestions.value.length === 0) return { current: 0, total: 0, percentage: 0 }
    return {
      current: currentQuestionIndex.value + 1,
      total: currentQuizQuestions.value.length,
      percentage: Math.round(((currentQuestionIndex.value + 1) / currentQuizQuestions.value.length) * 100)
    }
  })

  const currentCharacter = computed(() => {
    return currentLearningChars.value[currentCharIndex.value]
  })

  const currentQuestion = computed(() => {
    return currentQuizQuestions.value[currentQuestionIndex.value]
  })

  const sessionProgress = computed(() => {
    if (currentPhase.value === 'learning') {
      return learningProgress.value
    } else if (currentPhase.value === 'quiz') {
      return quizProgress.value
    }
    return { current: 0, total: 0, percentage: 0 }
  })

  // 获取相似拼音选项（用于汉字选拼音题目的干扰项）
  function getSimilarPinyinOptions(targetPinyin: string, allPinyins: string[], count: number = 3): string[] {
    const similar: string[] = []
    const targetBase = removeTone(targetPinyin)
    
    // 1. 同音不同调的拼音（最相似）
    const sameTone = allPinyins.filter(p => removeTone(p) === targetBase && p !== targetPinyin)
    similar.push(...sameTone.slice(0, 2))
    
    // 2. 相似声母的拼音
    if (similar.length < count && targetBase.length > 0) {
      const sameInitial = allPinyins.filter(p => {
        const pBase = removeTone(p)
        return pBase !== targetBase && pBase.length > 0 && 
               pBase[0] === targetBase[0] && !similar.includes(p)
      })
      similar.push(...sameInitial.slice(0, count - similar.length))
    }
    
    // 3. 相似韵母的拼音  
    if (similar.length < count && targetBase.length > 1) {
      const sameRhyme = allPinyins.filter(p => {
        const pBase = removeTone(p)
        const targetRhyme = targetBase.slice(1)
        const pRhyme = pBase.slice(1)
        return pBase !== targetBase && targetRhyme === pRhyme && 
               !similar.includes(p)
      })
      similar.push(...sameRhyme.slice(0, count - similar.length))
    }
    
    // 4. 随机填充剩余
    if (similar.length < count) {
      const remaining = allPinyins.filter(p => 
        !similar.includes(p) && removeTone(p) !== targetBase
      ).sort(() => Math.random() - 0.5)
      similar.push(...remaining.slice(0, count - similar.length))
    }
    
    return similar.slice(0, count)
  }

  // 立即加载localStorage数据（同步）
  loadFromStorage()
  
  // 初始化数据
  async function initializeData() {
    try {
      await loadHanziDataFromFile()
      // localStorage数据已经在store创建时加载了
    } catch (error) {
      console.error('初始化失败:', error)
      throw error
    }
  }

  // 从CSV文件加载汉字数据
  async function loadHanziDataFromFile() {
    try {
      const data = await loadHanziData()
      hanziData.value = data
    } catch (error) {
      console.error('加载汉字数据失败:', error)
      throw new Error('无法加载汉字数据文件')
    }
  }

  // 设置当前用户
  function setCurrentUser(user: CurrentUser | null) {
    currentUser.value = user
    // 保存当前用户到localStorage
    if (user) {
      localStorage.setItem('currentUser', JSON.stringify(user))
    } else {
      localStorage.removeItem('currentUser')
    }
  }

  // 从服务器加载用户数据
  async function loadUserDataFromServer(userData: any) {
    try {
      // 转换学习记录格式
      if (userData.learningRecords) {
        const recordsMap = new Map<string, LearningRecord>()
        Object.entries(userData.learningRecords).forEach(([key, value]) => {
          recordsMap.set(key, value as LearningRecord)
        })
        learningRecords.value = recordsMap
      }

      // 加载用户统计
      if (userData.userStats) {
        userStats.value = { ...userStats.value, ...userData.userStats }
      }

      // 加载学习设置
      if (userData.settings) {
        settings.value = { ...settings.value, ...userData.settings }
      }

      // 加载复习设置
      if (userData.reviewSettings) {
        reviewSettings.value = { ...reviewSettings.value, ...userData.reviewSettings }
      }

      // 加载收藏汉字
      if (userData.favoriteChars) {
        favoriteChars.value = new Set(userData.favoriteChars)
      }

      // 加载错字本
      await loadErrorBookFromStorage()


    } catch (error) {
      console.error('加载用户数据失败:', error)
      throw error
    }
  }

  // 保存数据到服务器
  async function saveToServer() {
    if (!currentUser.value) {
      console.warn('没有当前用户，无法保存到服务器')
      return
    }

    try {
      // 转换学习记录为普通对象
      const recordsObject: { [key: string]: LearningRecord } = {}
      learningRecords.value.forEach((value, key) => {
        recordsObject[key] = value
      })

      const userData = {
        userInfo: {
          name: currentUser.value.name,
          studentId: currentUser.value.studentId,
          lastActivity: new Date().toISOString()
        },
        learningRecords: recordsObject,
        userStats: userStats.value,
        settings: settings.value,
        reviewSettings: reviewSettings.value,
        favoriteChars: Array.from(favoriteChars.value),
        appSettings: {
          themeColor: localStorage.getItem('themeColor') || 'blue',
          fontSize: localStorage.getItem('fontSize') || 'normal',
          dailyReminder: localStorage.getItem('dailyReminder') === 'true',
          reminderTime: localStorage.getItem('reminderTime') || '19:00',
          dailyGoal: parseInt(localStorage.getItem('dailyGoal') || '10')
        }
      }

      await userApi.saveUserData(currentUser.value.fileName, userData)

    } catch (error) {
      console.error('保存到服务器失败:', error)
      // 保存失败时仍然保存到本地
      saveToStorage()
      throw error
    }
  }

  // 兼容性：从localStorage加载数据（用于迁移）
  function loadFromStorage() {
    try {
      // 加载学习记录
      const savedRecords = localStorage.getItem('learningRecords')
      if (savedRecords) {
        const recordsArray = JSON.parse(savedRecords)
        const recordsMap = new Map<string, LearningRecord>()
        recordsArray.forEach(([key, value]: [string, LearningRecord]) => {
          recordsMap.set(key, value)
        })
        learningRecords.value = recordsMap
      }

      // 加载用户统计
      const savedStats = localStorage.getItem('userStats')
      if (savedStats) {
        userStats.value = JSON.parse(savedStats)
      }

      // 加载学习设置
      const savedSettings = localStorage.getItem('learningSettings')
      if (savedSettings) {
        const loadedSettings = JSON.parse(savedSettings)
        settings.value = { ...settings.value, ...loadedSettings }
      }
      
      // 加载复习设置
      const savedReviewSettings = localStorage.getItem('reviewSettings')
      if (savedReviewSettings) {
        const loadedReviewSettings = JSON.parse(savedReviewSettings)
        reviewSettings.value = { ...reviewSettings.value, ...loadedReviewSettings }
      }
      
      // 加载收藏汉字
      const savedFavorites = localStorage.getItem('favoriteChars')
      if (savedFavorites) {
        const favoritesArray = JSON.parse(savedFavorites)
        favoriteChars.value = new Set(favoritesArray)
      }

      // 加载当前用户
      const savedUser = localStorage.getItem('currentUser')
      if (savedUser) {
        currentUser.value = JSON.parse(savedUser)
      }
    } catch (error) {
      console.error('从本地存储加载数据失败:', error)
    }
  }

  // 统一的保存函数，优先保存到服务器，确保数据一致性
  async function saveData() {
    if (!currentUser.value) {
      // 如果没有用户登录，只保存到localStorage
      saveToStorage()
      return
    }

    try {
      // 首先尝试保存到服务器
      await saveToServer()
      // 服务器保存成功后，更新localStorage作为缓存
      saveToStorage()
      console.log('数据已同步到服务器和本地缓存')
    } catch (error) {
      // 服务器保存失败时，只保存到localStorage作为后备
      console.warn('服务器保存失败，仅保存到本地缓存:', error)
      saveToStorage()
      
      // 可选：通知用户数据同步问题
      if (typeof window !== 'undefined' && window.ElMessage) {
        window.ElMessage.warning('数据暂时保存在本地，请检查网络连接')
      }
    }
  }

  // 保存到localStorage（备份用）
  function saveToStorage() {
    try {
      // 保存学习记录
      const recordsArray = Array.from(learningRecords.value.entries())
      localStorage.setItem('learningRecords', JSON.stringify(recordsArray))

      // 保存用户统计
      localStorage.setItem('userStats', JSON.stringify(userStats.value))

      // 保存学习设置
      localStorage.setItem('learningSettings', JSON.stringify(settings.value))
      
      // 保存复习设置
      localStorage.setItem('reviewSettings', JSON.stringify(reviewSettings.value))
      
      // 保存收藏汉字
      localStorage.setItem('favoriteChars', JSON.stringify(Array.from(favoriteChars.value)))
    } catch (error) {
      console.error('保存到本地存储失败:', error)
    }
  }

  // 获取当前用户
  function getCurrentUser() {
    if (!currentUser.value) {
      // 尝试从localStorage恢复
      const savedUser = localStorage.getItem('currentUser')
      if (savedUser) {
        currentUser.value = JSON.parse(savedUser)
      }
    }
    return currentUser.value
  }

  // 用户注销
  function logout() {
    currentUser.value = null
    localStorage.removeItem('currentUser')
    
    // 清空当前数据
    learningRecords.value.clear()
    favoriteChars.value.clear()
    userStats.value = {
      总学习汉字数: 0,
      总掌握汉字数: 0,
      整体正确率: 0,
      学习天数: 0,
      连续学习天数: 0,
      最后学习日期: ''
    }
    settings.value = {
      学习数量: 10,
      复习数量: 15,
      检查类型: '混合模式',
      学习范围: '全新汉字',
      是否显示声调: true,
      是否显示笔画: false,
      倒计时秒数: 30,
      起始序号: 1,
      结束序号: undefined
    }
  }

  // 选择学习字符
  function selectLearningCharacters() {
    const { 学习数量, 学习范围, 起始序号, 结束序号 } = settings.value
    let selectedChars: HanziData[] = []

    if (学习范围 === '全新汉字') {
      selectedChars = hanziData.value
        .filter(char => !learningRecords.value.has(char.汉字) && char.序号 >= 起始序号)
        .slice(0, 学习数量)
    } else if (学习范围 === '自定义范围') {
      const 结束位置 = 结束序号 || 2525
      selectedChars = hanziData.value
        .filter(char => char.序号 >= 起始序号 && char.序号 <= 结束位置)
        .slice(0, 学习数量)
    } else if (学习范围 === '错字本') {
      selectedChars = getErrorBookCharacters().slice(0, 学习数量)
    }

    return selectedChars
  }

  // 开始学习会话
  function startLearningSession() {
    currentLearningChars.value = selectLearningCharacters()
    currentCharIndex.value = 0
    currentPhase.value = 'learning'
  }

  // 下一个汉字
  function nextCharacter() {
    // 记录当前汉字的学习数据
    const currentChar = currentLearningChars.value[currentCharIndex.value]
    if (currentChar) {
      updateLearningRecord(currentChar.汉字, true, true) // 学习阶段默认为正确，isLearning=true
    }
    
    if (currentCharIndex.value < currentLearningChars.value.length - 1) {
      currentCharIndex.value++
    } else {
      // 学习阶段完成，生成检查题目并进入检查阶段
      generateQuizQuestions()
      currentPhase.value = 'quiz'
    }
  }

  // 上一个汉字
  function previousCharacter() {
    if (currentCharIndex.value > 0) {
      currentCharIndex.value--
    }
  }

  // 生成检查题目
  function generateQuizQuestions() {
    const questions: QuizQuestion[] = []
    const 检查类型 = settings.value.检查类型

    currentLearningChars.value.forEach((char, index) => {
      let questionType = 检查类型
      if (检查类型 === '混合模式') {
        questionType = Math.random() > 0.5 ? '拼音选汉字' : '汉字选拼音'
      }

      if (questionType === '拼音选汉字') {
        // 给定拼音，选择汉字
        const correctAnswer = char.汉字
        const wrongAnswers = getSimilarPinyinCharacters(char.拼音, hanziData.value)
          .filter(c => c !== correctAnswer)
          .slice(0, 3)
        
        const options = [correctAnswer, ...wrongAnswers].sort(() => Math.random() - 0.5)
        
        questions.push({
          id: `question_${index}`,
          type: '拼音选汉字',
          question: `选择拼音"${char.拼音}"对应的汉字：`,
          correctAnswer,
          options,
          词语: [char.词语1, char.词语2, char.词语3].filter(word => word && word.trim())
        })
      } else {
        // 给定汉字，选择拼音
        const correctAnswer = char.拼音
        
        // 获取所有不同的拼音（去重）
        const allPinyins = Array.from(new Set(
          hanziData.value
            .filter(c => c.拼音 !== correctAnswer && c.拼音.trim())
          .map(c => c.拼音)
        ))
        
        // 优先选择相似的拼音作为干扰项
        const similarPinyins = getSimilarPinyinOptions(correctAnswer, allPinyins)
        
        // 如果相似的拼音不够，用随机拼音补充
        const randomPinyins = allPinyins
          .filter(p => !similarPinyins.includes(p))
          .sort(() => Math.random() - 0.5)
        
        // 组合干扰项，确保有3个不重复的选项
        const wrongAnswers = [...similarPinyins, ...randomPinyins].slice(0, 3)
        
        const options = [correctAnswer, ...wrongAnswers].sort(() => Math.random() - 0.5)
        
        questions.push({
          id: `question_${index}`,
          type: '汉字选拼音',
          question: `选择汉字"${char.汉字}"的正确拼音：`,
          correctAnswer,
          options,
          词语: [char.词语1, char.词语2, char.词语3].filter(word => word && word.trim())
        })
      }
    })

    currentQuizQuestions.value = questions
    currentQuestionIndex.value = 0
  }

  // 提交答案
  function submitAnswer(selectedAnswer: string, timeSpent: number = 0) {
    const currentQ = currentQuizQuestions.value[currentQuestionIndex.value]
    if (!currentQ) return

    const isCorrect = selectedAnswer === currentQ.correctAnswer
    
    // 从当前学习汉字中获取字符信息
    const currentChar = currentLearningChars.value[currentQuestionIndex.value]
    const character = currentChar ? currentChar.汉字 : ''
    
    quizResults.value.push({
      questionId: currentQ.id,
      userAnswer: selectedAnswer,
      isCorrect,
      timeSpent,
      timestamp: new Date().toISOString(),
      // 临时添加这些字段用于统计分析
      character: character,
      correctAnswer: currentQ.correctAnswer
    })

    // 记录测试数据到学习记录中
    if (character) {
      updateLearningRecord(character, isCorrect, false)
    }

    return isCorrect
  }

  // 下一题
  function nextQuestion() {
    if (currentQuestionIndex.value < currentQuizQuestions.value.length - 1) {
      currentQuestionIndex.value++
    } else {
      // 检查完成，更新用户统计并显示统计结果
      updateUserStats()
      currentPhase.value = 'statistics'
    }
  }

  // 更新学习记录
  function updateLearningRecord(character: string, isCorrect: boolean, isLearning: boolean = false) {
    const hanziInfo = hanziData.value.find(h => h.汉字 === character)
    if (!hanziInfo) return

    const now = new Date().toISOString() // 使用完整的ISO时间戳
    let record = learningRecords.value.get(character)

    if (!record) {
      record = {
        字符: character,
        拼音: hanziInfo.拼音,
        学习次数: 0,
        检查次数: 0,
        正确次数: 0,
        连续正确次数: 0,
        最后学习时间: '',
        最后检查时间: '',
        掌握度: '未学习',
        错误类型: []
      }
    }

    if (isLearning) {
      record.学习次数++
      record.最后学习时间 = now
    } else {
      record.检查次数++
      record.最后检查时间 = now
      
      if (isCorrect) {
        record.正确次数++
        record.连续正确次数++
      } else {
        record.连续正确次数 = 0
        // 可以在这里记录错误类型
      }
    }

    // 计算掌握度
    record.掌握度 = calculateMasteryLevel(record.正确次数, record.检查次数, record.连续正确次数)
    
    learningRecords.value.set(character, record)
    saveData()
  }

  // 更新用户统计
  function updateUserStats() {
    const totalChars = learningRecords.value.size
    const masteredChars = Array.from(learningRecords.value.values())
      .filter(record => record.掌握度 === '完全掌握').length

    const totalTests = Array.from(learningRecords.value.values())
      .reduce((sum, record) => sum + record.检查次数, 0)
    const totalCorrect = Array.from(learningRecords.value.values())
      .reduce((sum, record) => sum + record.正确次数, 0)

    const today = formatDate(new Date()) // 使用formatDate获取今天的日期
    const lastDate = userStats.value.最后学习日期

    let learningDays = userStats.value.学习天数
    let consecutiveDays = userStats.value.连续学习天数

    if (lastDate !== today) {
      learningDays++
      const yesterday = formatDate(new Date(Date.now() - 24 * 60 * 60 * 1000))
      if (lastDate === yesterday) {
        consecutiveDays++
      } else {
        consecutiveDays = 1
      }
    }

    userStats.value = {
      总学习汉字数: totalChars,
      总掌握汉字数: masteredChars,
      整体正确率: totalTests > 0 ? Math.round((totalCorrect / totalTests) * 100) : 0,
      学习天数: learningDays,
      连续学习天数: consecutiveDays,
      最后学习日期: today
    }

    saveData()
  }
  
  // 重置当前会话
  function resetSession() {
    currentLearningChars.value = []
    currentCharIndex.value = 0
    currentQuizQuestions.value = []
    currentQuestionIndex.value = 0
    quizResults.value = []
    currentPhase.value = 'settings'
  }
  
  // 更新设置
  function updateSettings(newSettings: Partial<LearningSettings>) {
    settings.value = { ...settings.value, ...newSettings }
    saveData()
  }
  
  // 更新复习设置
  function updateReviewSettings(newSettings: Partial<ReviewSettings>) {
    reviewSettings.value = { ...reviewSettings.value, ...newSettings }
    saveData()
  }
  
  // 获取复习统计
  function getReviewStats() {
    const allRecords = Array.from(learningRecords.value.values())
    
    return {
      需要复习: allRecords.filter(r => r.掌握度 === '需要复习').length,
      基本掌握: allRecords.filter(r => r.掌握度 === '基本掌握').length,
      完全掌握: allRecords.filter(r => r.掌握度 === '完全掌握').length,
      已学总数: allRecords.length
    }
  }
  
  // 收藏/取消收藏汉字
  function toggleFavorite(character: string) {
    if (favoriteChars.value.has(character)) {
      favoriteChars.value.delete(character)
    } else {
      favoriteChars.value.add(character)
    }
    saveData()
    return favoriteChars.value.has(character)
  }

  // 检查汉字是否已收藏
  function isFavorite(character: string) {
    return favoriteChars.value.has(character)
  }

  // 获取收藏汉字列表
  const favoriteCharsList = computed(() => {
    return Array.from(favoriteChars.value)
      .map(char => hanziData.value.find(h => h.汉字 === char))
      .filter(Boolean) as HanziData[]
  })

  // === 诊断相关方法 ===
  
  // 设置学习模式
  function setLearningMode(mode: LearningMode) {
    currentLearningMode.value = mode
    if (mode === 'diagnostic') {
      currentPhase.value = 'diagnostic-settings'
    } else {
      currentPhase.value = 'settings'
    }
  }

  // 选择诊断汉字
  function selectDiagnosticCharacters(): HanziData[] {
    const { 起始范围, 结束范围, 诊断数量 } = diagnosticSettings.value
    
    const availableChars = hanziData.value.filter(char => 
      char.序号 >= 起始范围 && char.序号 <= 结束范围
    )
    
    // 随机选择指定数量的汉字
    const shuffled = [...availableChars].sort(() => Math.random() - 0.5)
    return shuffled.slice(0, Math.min(诊断数量, shuffled.length))
  }

  // 开始学前诊断
  function startDiagnosticSession() {
    const diagnosticChars = selectDiagnosticCharacters()
    currentLearningChars.value = diagnosticChars
    currentCharIndex.value = 0
    currentPhase.value = 'diagnostic'
    
    // 生成诊断题目（全部为汉字选拼音）
    generateDiagnosticQuestions()
  }

  // 生成诊断题目
  function generateDiagnosticQuestions() {
    const questions: QuizQuestion[] = []
    
    currentLearningChars.value.forEach((char, index) => {
      const correctAnswer = char.拼音
      const wrongAnswers = getSimilarPinyinOptions(char.拼音, 
        Array.from(new Set(hanziData.value.map(c => c.拼音))), 3)
      
      const options = [correctAnswer, ...wrongAnswers]
        .sort(() => Math.random() - 0.5)
      
      questions.push({
        id: `diagnostic_${index}`,
        type: '汉字选拼音',
        question: char.汉字,
        correctAnswer,
        options,
        词语: [char.词语1, char.词语2, char.词语3].filter(word => word && word.trim()),
        explanation: `汉字"${char.汉字}"的拼音是"${char.拼音}"`
      })
    })
    
    currentQuizQuestions.value = questions
    currentQuestionIndex.value = 0
  }

  // 完成诊断分析
  function completeDiagnosticAnalysis() {
    const correct: HanziData[] = []
    const incorrect: HanziData[] = []
    
    quizResults.value.forEach((result, index) => {
      const char = currentLearningChars.value[index]
      if (result.isCorrect) {
        correct.push(char)
      } else {
        incorrect.push(char)
      }
    })
    
    const totalTime = quizResults.value.reduce((sum, r) => sum + r.timeSpent, 0)
    
    diagnosticResult.value = {
      诊断ID: `diagnostic_${Date.now()}`,
      诊断时间: new Date().toISOString(),
      诊断范围: `${diagnosticSettings.value.起始范围}-${diagnosticSettings.value.结束范围}`,
      总测试数: currentLearningChars.value.length,
      正确汉字: correct,
      错误汉字: incorrect,
      正确率: Math.round((correct.length / currentLearningChars.value.length) * 100),
      平均答题时间: Math.round(totalTime / quizResults.value.length)
    }
    
    // 将错误汉字添加到错字本
    incorrect.forEach(char => {
      addToErrorBook(char, 'diagnostic')
    })
    
    currentPhase.value = 'diagnostic-result'
  }

  // 开始基于诊断的学习
  function startDiagnosticBasedLearning() {
    if (!diagnosticResult.value || diagnosticResult.value.错误汉字.length === 0) {
      currentPhase.value = 'diagnostic-result'
      return
    }
    
    // 只学习错误的汉字
    currentLearningChars.value = diagnosticResult.value.错误汉字
    currentCharIndex.value = 0
    currentPhase.value = 'diagnostic-learning'
  }

  // 生成诊断式复习
  function generateDiagnosticReview() {
    if (!diagnosticResult.value) return
    
    const { 正确汉字, 错误汉字 } = diagnosticResult.value
    const reviewChars: HanziData[] = []
    
    // 计算复习题目数量（错误汉字数量的2倍，最少15题）
    const totalReviewCount = Math.max(错误汉字.length * 2, 15)
    
    // 70%来自错误汉字
    const incorrectCount = Math.ceil(totalReviewCount * 0.7)
    for (let i = 0; i < incorrectCount; i++) {
      reviewChars.push(错误汉字[i % 错误汉字.length])
    }
    
    // 30%来自正确汉字
    if (正确汉字.length > 0) {
      const correctCount = totalReviewCount - incorrectCount
      const shuffledCorrect = [...正确汉字].sort(() => Math.random() - 0.5)
      for (let i = 0; i < correctCount; i++) {
        reviewChars.push(shuffledCorrect[i % shuffledCorrect.length])
      }
    }
    
    // 打乱顺序
    currentLearningChars.value = reviewChars.sort(() => Math.random() - 0.5)
    currentPhase.value = 'diagnostic-review'
    generateQuizQuestions() // 复用现有的题目生成逻辑
  }

  // 重置诊断状态
  function resetDiagnosticSession() {
    diagnosticResult.value = null
    currentLearningMode.value = 'traditional'
    resetSession() // 调用现有的重置方法
  }

  // === 错字本管理功能 ===
  
  // 添加汉字到错字本
  function addToErrorBook(character: HanziData, source: 'diagnostic' | 'learning' | 'review') {
    const key = character.汉字
    const existing = errorBook.value.get(key)
    
    if (existing) {
      // 更新已存在的条目
      existing.errorCount++
      existing.lastErrorDate = new Date().toISOString()
      existing.source = source
    } else {
      // 创建新条目
      const newItem: ErrorBookItem = {
        id: `error_${key}_${Date.now()}`,
        character: character.汉字,
        pinyin: character.拼音,
        meaning: character.词语1 || '',
        addedDate: new Date().toISOString(),
        errorCount: 1,
        lastErrorDate: new Date().toISOString(),
        source
      }
      errorBook.value.set(key, newItem)
    }
    
    // 保存到本地存储
    saveErrorBookToStorage()
  }

  // 从错字本移除汉字
  function removeFromErrorBook(character: string) {
    errorBook.value.delete(character)
    saveErrorBookToStorage()
  }

  // 获取错字本汉字列表
  function getErrorBookCharacters(): HanziData[] {
    const errorItems = Array.from(errorBook.value.values())
    return errorItems
      .sort((a, b) => new Date(b.lastErrorDate).getTime() - new Date(a.lastErrorDate).getTime())
      .map(item => {
        // 从hanziData中找到完整的汉字信息
        const hanziInfo = hanziData.value.find(h => h.汉字 === item.character)
        return hanziInfo || {
          汉字: item.character,
          拼音: item.pinyin,
          序号: 0,
          词语1: item.meaning || '',
          词语2: '',
          词语3: ''
        }
      })
  }

  // 保存错字本到本地存储
  async function saveErrorBookToStorage() {
    if (!currentUser.value) return
    
    try {
      const errorBookArray = Array.from(errorBook.value.entries()).map(([key, value]) => ({ key, value }))
      await userApi.saveErrorBook(currentUser.value.fileName, errorBookArray)
    } catch (error) {
      console.error('保存错字本失败:', error)
    }
  }

  // 从本地存储加载错字本
  async function loadErrorBookFromStorage() {
    if (!currentUser.value) return
    
    try {
      const data = await userApi.loadErrorBook(currentUser.value.fileName)
      if (data && Array.isArray(data)) {
        errorBook.value.clear()
        data.forEach(({ key, value }) => {
          errorBook.value.set(key, value)
        })
      }
    } catch (error) {
      console.error('加载错字本失败:', error)
    }
  }

  // 测试函数：生成模拟学习记录（仅用于测试Statistics页面）
  function generateTestData() {
    const testChars = ['的', '一', '是', '在', '不', '了', '有', '和', '人', '这']
    const now = new Date()
    
    testChars.forEach((char, index) => {
      const hanziInfo = hanziData.value.find(h => h.汉字 === char)
      if (!hanziInfo) return
      
      // 生成过去几天的学习记录
      const daysAgo = Math.floor(index / 2) // 每2个字符代表一天
      const recordDate = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000)
      
      const record: LearningRecord = {
        字符: char,
        拼音: hanziInfo.拼音,
        学习次数: Math.floor(Math.random() * 3) + 1,
        检查次数: Math.floor(Math.random() * 5) + 2,
        正确次数: 0,
        连续正确次数: Math.floor(Math.random() * 3),
        最后学习时间: recordDate.toISOString(),
        最后检查时间: recordDate.toISOString(),
        掌握度: '需要复习',
        错误类型: []
      }
      
      // 设置正确次数（不超过检查次数）
      record.正确次数 = Math.floor(record.检查次数 * (0.6 + Math.random() * 0.3))
      
      // 计算掌握度
      record.掌握度 = calculateMasteryLevel(record.正确次数, record.检查次数, record.连续正确次数)
      
      learningRecords.value.set(char, record)
    })
    
    // 更新用户统计
    updateUserStats()
    saveData()
    

  }
  
  return {
    // 数据
    hanziData,
    learningRecords,
    userStats,
    settings,
    reviewSettings,
    currentUser,
    
    // 学习状态
    currentPhase,
    currentLearningChars,
    currentCharIndex,
    currentQuizQuestions,
    currentQuestionIndex,
    quizResults,
    
    // 收藏功能
    favoriteChars,
    favoriteCharsList,
    
    // 诊断功能
    currentLearningMode,
    diagnosticResult,
    diagnosticSettings,
    
    // 计算属性
    currentChar,
    currentQuestion,
    currentCharacter,
    sessionProgress,
    learningProgress,
    quizProgress,
    
    // 方法
    initializeData,
    loadHanziDataFromFile,
    setCurrentUser,
    loadUserDataFromServer,
    saveToServer,
    saveData,
    loadFromStorage,
    saveToStorage,
    selectLearningCharacters,
    startLearningSession,
    nextCharacter,
    previousCharacter,
    generateQuizQuestions,
    submitAnswer,
    nextQuestion,
    updateLearningRecord,
    updateUserStats,
    resetSession,
    updateSettings,
    updateReviewSettings,
    getReviewStats,
    toggleFavorite,
    isFavorite,
    generateTestData,
    
    // 诊断方法
    setLearningMode,
    startDiagnosticSession,
    completeDiagnosticAnalysis,
    startDiagnosticBasedLearning,
    generateDiagnosticReview,
    resetDiagnosticSession,
    
    // 错字本方法
    addToErrorBook,
    removeFromErrorBook,
    getErrorBookCharacters,
    saveErrorBookToStorage,
    loadErrorBookFromStorage,
    errorBook: computed(() => errorBook.value),
    
    // 用户相关方法
    getCurrentUser,
    logout
  }
}) 