import type { HanziData } from '@/types'

// 统一错误处理
export class AppError extends Error {
  constructor(message: string, public code?: string) {
    super(message)
    this.name = 'AppError'
  }
}

// 网络错误处理
export function handleNetworkError(error: any, operation: string = '操作'): never {
  console.error(`${operation}失败:`, error)
  
  if (error.name === 'TypeError' && error.message.includes('fetch')) {
    throw new AppError(`网络连接失败，请检查网络连接后重试`, 'NETWORK_ERROR')
  }
  
  if (error.name === 'AppError') {
    throw error
  }
  
  throw new AppError(`${operation}失败: ${error.message}`, 'UNKNOWN_ERROR')
}

// 解析CSV数据
export function parseCSVData(csvText: string): HanziData[] {
  const lines = csvText.split('\n')
  const data: HanziData[] = []
  
  // 跳过标题行和空行
  for (let i = 2; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) continue
    
    const columns = line.split(',')
    if (columns.length >= 6) {
      const 序号 = parseFloat(columns[0]) || 0
      if (序号 > 0) { // 确保是有效的汉字数据
        data.push({
          序号,
          汉字: columns[1]?.trim() || '',
          拼音: columns[2]?.trim() || '',
          词语1: columns[3]?.trim() || '',
          词语2: columns[4]?.trim() || '',
          词语3: columns[5]?.trim() || ''
        })
      }
    }
  }
  
  return data
}

// 加载汉字数据
export async function loadHanziData(): Promise<HanziData[]> {
  try {
    console.log('开始加载汉字数据...')
    
    // 首先尝试从API加载
    try {
      console.log('尝试从API加载数据...')
      const apiResponse = await fetch('/api/hanzi')
      if (apiResponse.ok) {
        const result = await apiResponse.json()
        if (result.success && result.data) {
          console.log('API加载成功，数据量:', result.data.length)
          return result.data
        }
      }
      console.log('API加载失败，尝试直接加载CSV文件...')
    } catch (apiError) {
      console.log('API请求失败:', apiError)
    }
    
    // 如果API失败，尝试直接加载CSV文件
    const response = await fetch('/zici.csv')
    if (!response.ok) {
      throw new AppError(`无法加载汉字数据: HTTP ${response.status}`, 'FETCH_ERROR')
    }
    const csvText = await response.text()
    console.log('CSV文件加载成功，内容长度:', csvText.length)
    
    const data = parseCSVData(csvText)
    
    if (data.length === 0) {
      throw new AppError('汉字数据文件为空或格式错误', 'DATA_EMPTY')
    }
    
    console.log('数据解析成功，汉字数量:', data.length)
    return data
  } catch (error) {
    console.error('加载汉字数据失败:', error)
    return handleNetworkError(error, '加载汉字数据')
  }
}

// 获取相似拼音的汉字（用于生成干扰项）
export function getSimilarPinyinCharacters(targetPinyin: string, allData: HanziData[], count: number = 3): string[] {
  const similar: string[] = []
  const target = removeTone(targetPinyin)
  
  // 1. 完全相同拼音（不同声调）
  const samePinyin = allData.filter(item => 
    removeTone(item.拼音) === target && item.拼音 !== targetPinyin
  )
  similar.push(...samePinyin.slice(0, 2).map(item => item.汉字))
  
  // 2. 相似声母或韵母
  if (similar.length < count) {
    const similarSound = allData.filter(item => {
      const itemPinyin = removeTone(item.拼音)
      return (
        itemPinyin !== target &&
        (itemPinyin.startsWith(target[0]) || // 相同声母
         itemPinyin.slice(1) === target.slice(1)) // 相同韵母
      )
    })
    similar.push(...similarSound.slice(0, count - similar.length).map(item => item.汉字))
  }
  
  // 3. 随机填充到指定数量
  if (similar.length < count) {
    const random = allData
      .filter(item => !similar.includes(item.汉字) && item.拼音 !== targetPinyin)
      .sort(() => Math.random() - 0.5)
      .slice(0, count - similar.length)
    similar.push(...random.map(item => item.汉字))
  }
  
  return similar.slice(0, count)
}

// 获取形近字（用于生成干扰项）
export function getSimilarShapeCharacters(targetChar: string, allData: HanziData[], count: number = 2): string[] {
  // 这里简化处理，实际可以根据汉字部首、结构等进行更精确的匹配
  const similar = allData
    .filter(item => item.汉字 !== targetChar)
    .sort(() => Math.random() - 0.5)
    .slice(0, count)
    .map(item => item.汉字)
  
  return similar
}

// 去除拼音声调
export function removeTone(pinyin: string): string {
  return pinyin
    .replace(/[āáǎà]/g, 'a')
    .replace(/[ēéěè]/g, 'e')
    .replace(/[īíǐì]/g, 'i')
    .replace(/[ōóǒò]/g, 'o')
    .replace(/[ūúǔù]/g, 'u')
    .replace(/[ǖǘǚǜ]/g, 'ü')
    .replace(/[ńňǹ]/g, 'n')
}

// 计算汉字掌握度
export function calculateMasteryLevel(正确次数: number, 检查次数: number, 连续正确次数: number): '需要复习' | '基本掌握' | '完全掌握' {
  if (检查次数 === 0) return '需要复习'
  
  const 正确率 = 正确次数 / 检查次数
  const 连续正确 = 连续正确次数
  
  if (正确率 >= 0.9 && 连续正确 >= 3) return '完全掌握'
  if (正确率 >= 0.7 && 连续正确 >= 2) return '基本掌握'
  return '需要复习'
}

// 格式化日期
export function formatDate(date: Date): string {
  return date.toISOString().split('T')[0]
}

// 获取今天的日期字符串
export function getTodayString(): string {
  return formatDate(new Date())
} 