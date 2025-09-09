// 汉字数据结构
export interface HanziData {
  序号: number
  汉字: string
  拼音: string
  词语1: string
  词语2: string
  词语3: string
}

// 用户学习记录
export interface LearningRecord {
  字符: string
  拼音: string
  学习次数: number
  检查次数: number
  正确次数: number
  连续正确次数: number
  最后学习时间: string
  最后检查时间: string
  掌握度: '未学习' | '需要复习' | '基本掌握' | '完全掌握'
  错误类型: string[]
}

// 用户统计数据
export interface UserStats {
  总学习汉字数: number
  总掌握汉字数: number
  整体正确率: number
  学习天数: number
  连续学习天数: number
  最后学习日期: string
}

// 用户信息
export interface CurrentUser {
  fileName: string
  name: string
  studentId: string
}

// 学习设置
export interface LearningSettings {
  学习数量: number
  复习数量: number
  检查类型: '拼音选汉字' | '汉字选拼音' | '混合模式'
  学习范围: '全新汉字' | '自定义范围' | '学前诊断' | '错字本' | '需要复习' | '顺序复习' | '随机复习' | '基本掌握' | '完全掌握'
  是否显示声调: boolean
  是否显示笔画: boolean
  倒计时秒数: number
  起始序号: number
  结束序号?: number
  // 诊断相关设置
  诊断范围起始?: number
  诊断范围结束?: number
}

// 复习设置
export interface ReviewSettings {
  复习数量: number
  检查类型: '拼音选汉字' | '汉字选拼音' | '混合模式'
  复习范围: '错字本' | '需要复习' | '顺序复习' | '随机复习' | '基本掌握' | '完全掌握'
  倒计时秒数: number
  是否显示声调: boolean
  打乱选项顺序: boolean
}

// 检查题目
export interface QuizQuestion {
  id: string
  type: '拼音选汉字' | '汉字选拼音'
  question: string // 题目内容（汉字或拼音）
  correctAnswer: string // 正确答案
  options: string[] // 选项（包含正确答案和干扰项）
  词语: string[] // 相关词语
  explanation?: string // 答案解析
}

// 学习阶段状态
export type LearningPhase = 
  | 'settings' 
  | 'learning' 
  | 'quiz' 
  | 'statistics'
  | 'diagnostic-settings'  // 诊断设置阶段
  | 'diagnostic'          // 诊断测试阶段
  | 'diagnostic-result'   // 诊断结果阶段
  | 'diagnostic-learning' // 基于诊断的学习阶段
  | 'diagnostic-review'   // 诊断式复习阶段

// 答题结果
export interface QuizResult {
  questionId: string
  userAnswer: string
  isCorrect: boolean
  timeSpent: number // 用时（秒）
  timestamp: string
  // 用于统计分析的额外字段
  character?: string
  correctAnswer?: string
}

// 学习模式类型
export type LearningMode = 'traditional' | 'diagnostic' | 'review'

// 错字本条目
export interface ErrorBookItem {
  id: string
  character: string
  pinyin: string
  meaning: string
  addedDate: string
  errorCount: number
  lastErrorDate: string
  source: 'diagnostic' | 'learning' | 'review' // 错误来源
}

// 诊断结果
export interface DiagnosticResult {
  诊断ID: string
  诊断时间: string
  诊断范围: string
  总测试数: number
  正确汉字: HanziData[]
  错误汉字: HanziData[]
  正确率: number
  平均答题时间: number
}

// 诊断设置
export interface DiagnosticSettings {
  诊断数量: number
  起始范围: number
  结束范围: number
  题目类型: '汉字选拼音'
  答题时间: number
} 