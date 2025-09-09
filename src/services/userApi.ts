// 用户API服务
import { AppError, handleNetworkError } from '@/utils/data'

const API_BASE_URL = import.meta.env.DEV ? 'http://localhost:3001' : ''

interface UserInfo {
  name: string
  studentId: string
}

interface UserListItem {
  fileName: string
  name: string
  studentId: string
  lastActivity: string
}

interface CreateUserResponse {
  success: boolean
  fileName: string
  userData: any
}

class UserApiService {
  private async request<T>(url: string, options: RequestInit = {}): Promise<T> {
    try {
      const response = await fetch(`${API_BASE_URL}/api${url}`, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      })

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: '网络错误' }))
        throw new AppError(error.error || `HTTP ${response.status}`, 'HTTP_ERROR')
      }

      return response.json()
    } catch (error) {
      return handleNetworkError(error, `用户API请求 ${url}`)
    }
  }

  // 获取所有用户列表
  async getUsers(): Promise<UserListItem[]> {
    return this.request<UserListItem[]>('/users')
  }

  // 创建或获取用户
  async createUser(userInfo: UserInfo): Promise<CreateUserResponse> {
    return this.request<CreateUserResponse>('/user', {
      method: 'POST',
      body: JSON.stringify(userInfo),
    })
  }

  // 保存用户数据
  async saveUserData(fileName: string, userData: any): Promise<{ success: boolean }> {
    return this.request<{ success: boolean }>(`/user/${fileName}`, {
      method: 'PUT',
      body: JSON.stringify(userData),
    })
  }

  // 删除用户
  async deleteUser(fileName: string): Promise<{ success: boolean }> {
    return this.request<{ success: boolean }>(`/user/${fileName}`, {
      method: 'DELETE',
    })
  }

  // 保存错字本数据
  async saveErrorBook(fileName: string, errorBookData: any): Promise<{ success: boolean }> {
    return this.request<{ success: boolean }>(`/user/${fileName}/errorbook`, {
      method: 'POST',
      body: JSON.stringify(errorBookData),
    })
  }

  // 加载错字本数据
  async loadErrorBook(fileName: string): Promise<any> {
    try {
      return await this.request(`/user/${fileName}/errorbook`)
    } catch (error) {
      // 错字本文件可能不存在，返回空数组
      return []
    }
  }
}

export const userApi = new UserApiService() 