// 汉字数据API服务
import { AppError, handleNetworkError } from '@/utils/data'

export interface HanziData {
  序号: number
  汉字: string
  拼音: string
  词语1: string
  词语2: string
  词语3: string
}

export interface UpdateHanziData {
  拼音?: string
  词语1?: string
  词语2?: string
  词语3?: string
}

export interface ApiResponse<T> {
  success: boolean
  data?: T
  message?: string
  total?: number
}

const API_BASE_URL = import.meta.env.DEV ? 'http://localhost:3001' : 'http://localhost:3001'

class HanziApiService {
  private async request<T>(url: string, options: RequestInit = {}): Promise<T> {
    try {
      const response = await fetch(`${API_BASE_URL}${url}`, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      })

      if (!response.ok) {
        throw new AppError(`请求失败: HTTP ${response.status}`, 'HTTP_ERROR')
      }

      const data = await response.json()
      if (!data.success && data.message) {
        throw new AppError(data.message, 'API_ERROR')
      }

      return data
    } catch (error) {
      return handleNetworkError(error, `API请求 ${url}`)
    }
  }

  // 获取所有汉字数据
  async getAllHanzi(): Promise<ApiResponse<HanziData[]>> {
    return this.request<ApiResponse<HanziData[]>>('/api/hanzi')
  }

  // 获取单个汉字数据
  async getHanziBySequence(sequence: number): Promise<ApiResponse<HanziData>> {
    return this.request<ApiResponse<HanziData>>(`/api/hanzi/${sequence}`)
  }

  // 更新汉字数据
  async updateHanzi(sequence: number, data: UpdateHanziData): Promise<ApiResponse<HanziData>> {
    return this.request<ApiResponse<HanziData>>(`/api/hanzi/${sequence}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  // 批量获取汉字数据（分页）
  async getHanziPaginated(page: number = 1, pageSize: number = 50): Promise<{
    data: HanziData[]
    total: number
    page: number
    pageSize: number
    totalPages: number
  }> {
    const response = await this.getAllHanzi()
    if (!response.success || !response.data) {
      throw new Error('获取汉字数据失败')
    }

    const allData = response.data
    const total = allData.length
    const totalPages = Math.ceil(total / pageSize)
    const startIndex = (page - 1) * pageSize
    const endIndex = startIndex + pageSize
    const data = allData.slice(startIndex, endIndex)

    return {
      data,
      total,
      page,
      pageSize,
      totalPages
    }
  }

  // 搜索汉字
  async searchHanzi(keyword: string): Promise<HanziData[]> {
    const response = await this.getAllHanzi()
    if (!response.success || !response.data) {
      throw new Error('获取汉字数据失败')
    }

    return response.data.filter(hanzi => 
      hanzi.汉字.includes(keyword) || 
      hanzi.拼音.includes(keyword) ||
      hanzi.词语1.includes(keyword) ||
      hanzi.词语2.includes(keyword) ||
      hanzi.词语3.includes(keyword)
    )
  }
}

export const hanziApi = new HanziApiService() 