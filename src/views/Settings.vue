<template>
  <div class="settings-container">
    <div class="settings-header">
      <div class="learning-card header-card">
        <h2>⚙️ 学习设置</h2>
        <p class="description">个性化配置你的学习参数和偏好</p>
        <el-alert 
          title="💾 设置自动保存" 
          description="您的所有设置更改会自动保存，无需手动点击保存按钮"
          type="info" 
          :closable="false"
          show-icon
          style="margin-top: 15px;"
        />
      </div>
    </div>
    
    <!-- 学习参数设置 -->
    <div class="learning-settings">
      <div class="learning-card">
        <h3>📚 学习参数</h3>
        <el-form :model="formSettings" label-width="140px" size="large">
          <el-form-item label="默认学习数量">
            <el-slider 
              v-model="formSettings.学习数量" 
              :min="5" 
              :max="50" 
              :step="5"
              :show-input="true"
              show-stops
              style="width: 300px;"
            />
            <div class="setting-tip">
              推荐新手选择5-15个汉字，有经验者可选择20-50个汉字
            </div>
          </el-form-item>
          

          
          <el-form-item label="默认检查类型">
            <el-radio-group v-model="formSettings.检查类型">
              <el-radio value="拼音选汉字">拼音选汉字</el-radio>
              <el-radio value="汉字选拼音">汉字选拼音</el-radio>
              <el-radio value="混合模式">混合模式（推荐）</el-radio>
            </el-radio-group>
            <div class="setting-tip">
              混合模式可以全面检查汉字和拼音的掌握情况
            </div>
          </el-form-item>
          
          <el-form-item label="默认学习范围">
            <el-radio-group v-model="formSettings.学习范围">
              <el-radio value="全新汉字">全新汉字</el-radio>
              <el-radio value="自定义范围">自定义范围</el-radio>
            </el-radio-group>
            <div class="setting-tip">
              学习新汉字包含学习和测试两个阶段<br/>
              复习已学汉字请使用"开始复习"功能
            </div>
          </el-form-item>
          
          <el-form-item label="起始序号">
            <el-input-number 
              v-model="formSettings.起始序号"
              :min="1"
              :max="2525"
              :step="1"
              size="default"
              style="width: 200px;"
            />
            <div class="setting-tip">
              设置从第几个汉字开始学习，适用于换设备后继续学习的情况<br/>
              范围：1-2525
            </div>
          </el-form-item>
          
          <el-form-item label="结束序号" v-if="formSettings.学习范围 === '自定义范围'">
            <el-input-number 
              v-model="formSettings.结束序号"
              :min="formSettings.起始序号 || 1"
              :max="2525"
              :step="1"
              size="default"
              style="width: 200px;"
              placeholder="留空则学习到最后"
            />
            <div class="setting-tip">
              设置学习到第几个汉字，留空则学习到最后一个汉字
            </div>
          </el-form-item>
          
          <el-form-item label="答题时间限制">
            <el-select v-model="formSettings.倒计时秒数" style="width: 200px;">
              <el-option label="无时间限制" :value="0" />
              <el-option label="15秒（快速）" :value="15" />
              <el-option label="30秒（标准）" :value="30" />
              <el-option label="45秒（宽松）" :value="45" />
              <el-option label="60秒（充足）" :value="60" />
            </el-select>
            <div class="setting-tip">
              时间限制可以提高反应速度，建议根据自己的水平选择
            </div>
          </el-form-item>
        </el-form>
      </div>
    </div>
    
    <!-- 复习参数设置 -->
    <div class="review-settings">
      <div class="learning-card">
        <h3>🔄 复习参数</h3>
        <el-form :model="formReviewSettings" label-width="140px" size="large">
          <el-form-item label="默认复习数量">
            <el-slider 
              v-model="formReviewSettings.复习数量" 
              :min="5" 
              :max="50" 
              :step="5"
              :show-input="true"
              show-stops
              style="width: 300px;"
            />
            <div class="setting-tip">
              复习练习的默认数量设置
            </div>
          </el-form-item>
          
          <el-form-item label="默认测试类型">
            <el-radio-group v-model="formReviewSettings.检查类型">
              <el-radio value="拼音选汉字">拼音选汉字</el-radio>
              <el-radio value="汉字选拼音">汉字选拼音</el-radio>
              <el-radio value="混合模式">混合模式（推荐）</el-radio>
            </el-radio-group>
            <div class="setting-tip">
              复习时的默认测试类型，可在复习时单独调整
            </div>
          </el-form-item>
          
          <el-form-item label="默认复习范围">
            <el-radio-group v-model="formReviewSettings.复习范围">
              <el-radio value="需要复习">需要复习的汉字</el-radio>
              <el-radio value="顺序复习">按学习顺序复习</el-radio>
              <el-radio value="随机复习">随机复习已学汉字</el-radio>
              <el-radio value="基本掌握">基本掌握的汉字</el-radio>
              <el-radio value="完全掌握">完全掌握的汉字</el-radio>
            </el-radio-group>
            <div class="setting-tip">
              选择复习的默认范围，建议优先复习"需要复习"的汉字
            </div>
          </el-form-item>
          
          <el-form-item label="答题时间">
            <el-select v-model="formReviewSettings.倒计时秒数" style="width: 200px;">
              <el-option label="无限制" :value="0" />
              <el-option label="15秒" :value="15" />
              <el-option label="30秒" :value="30" />
              <el-option label="45秒" :value="45" />
              <el-option label="60秒" :value="60" />
            </el-select>
            <div class="setting-tip">
              复习时的默认答题时间
            </div>
          </el-form-item>
          
          <el-form-item label="高级选项">
            <el-checkbox v-model="formReviewSettings.是否显示声调">显示拼音声调</el-checkbox>
            <br>
            <el-checkbox v-model="formReviewSettings.打乱选项顺序">打乱选项顺序</el-checkbox>
            <div class="setting-tip">
              复习时的默认高级选项设置
            </div>
          </el-form-item>
        </el-form>
      </div>
    </div>
    
    <!-- 显示选项设置 -->
    <div class="display-settings">
      <div class="learning-card">
        <h3>🎨 显示选项</h3>
        <el-form :model="formSettings" label-width="140px" size="large">
          <el-form-item label="拼音显示">
            <el-switch 
              v-model="formSettings.是否显示声调"
              active-text="显示声调"
              inactive-text="不显示声调"
            />
            <div class="setting-tip">
              显示声调有助于正确掌握汉字读音
            </div>
          </el-form-item>
          
          <el-form-item label="笔画动画">
            <el-switch 
              v-model="formSettings.是否显示笔画"
              active-text="显示笔画"
              inactive-text="不显示笔画"
            />
            <div class="setting-tip">
              笔画动画可以帮助学习汉字书写顺序（功能开发中）
            </div>
          </el-form-item>
          
          <el-form-item label="主题色彩">
            <el-radio-group v-model="themeColor">
              <el-radio value="blue">蓝色（默认）</el-radio>
              <el-radio value="green">绿色</el-radio>
              <el-radio value="purple">紫色</el-radio>
              <el-radio value="orange">橙色</el-radio>
            </el-radio-group>
            <div class="setting-tip">
              选择你喜欢的主题色彩
            </div>
          </el-form-item>
          
          <el-form-item label="字体大小">
            <el-slider 
              v-model="fontSize" 
              :min="12" 
              :max="20" 
              :step="1"
              :show-input="true"
              style="width: 200px;"
            />
            <div class="setting-tip">
              调整界面字体大小，适合不同视力需求
            </div>
          </el-form-item>
        </el-form>
      </div>
    </div>
    
    <!-- 学习提醒设置 -->
    <div class="notification-settings">
      <div class="learning-card">
        <h3>🔔 学习提醒</h3>
        <el-form label-width="140px" size="large">
          <el-form-item label="每日提醒">
            <el-switch 
              v-model="dailyReminder"
              active-text="开启提醒"
              inactive-text="关闭提醒"
            />
            <div class="setting-tip">
              每天定时提醒你进行汉字学习
            </div>
          </el-form-item>
          
          <el-form-item v-if="dailyReminder" label="提醒时间">
            <el-time-picker
              v-model="reminderTime"
              format="HH:mm"
              placeholder="选择提醒时间"
            />
          </el-form-item>
          
          <el-form-item label="学习目标">
            <el-input-number 
              v-model="dailyGoal" 
              :min="1" 
              :max="100"
              controls-position="right"
            />
            <span style="margin-left: 8px;">个汉字/天</span>
            <div class="setting-tip">
              设置每日学习目标，培养良好的学习习惯
            </div>
          </el-form-item>
        </el-form>
      </div>
    </div>
    
    <!-- 数据管理 -->
    <div class="data-management">
      <div class="learning-card">
        <h3>💾 数据管理</h3>
        <div class="data-actions">
          <div class="action-group">
            <h4>设置管理</h4>
            <div class="action-buttons">
              <el-button @click="exportSettings" size="large" type="success">
                <el-icon><Download /></el-icon>
                导出设置到本地文件
              </el-button>
              <el-button @click="triggerSettingsFileInput" size="large" type="success">
                <el-icon><Upload /></el-icon>
                从本地文件导入设置
              </el-button>
              <!-- 隐藏的设置文件输入 -->
              <input 
                ref="settingsFileInput"
                type="file" 
                accept=".json"
                @change="handleSettingsFileChange"
                style="display: none;"
              >
            </div>
            <div class="action-tip">
              保存个人设置到本地文件，可在其他设备上导入
            </div>
          </div>
          
          <div class="action-group">
            <h4>学习数据备份</h4>
            <div class="action-buttons">
              <el-button @click="exportData" size="large">
                <el-icon><Download /></el-icon>
                导出学习数据
              </el-button>
              <el-button @click="triggerFileInput" size="large">
                <el-icon><Upload /></el-icon>
                导入学习数据
              </el-button>
              <!-- 隐藏的文件输入 -->
              <input 
                ref="fileInput"
                type="file" 
                accept=".json"
                @change="handleFileChange"
                style="display: none;"
              >
            </div>
            <div class="action-tip">
              定期备份学习数据，避免数据丢失
            </div>
          </div>
          
          <div class="action-group">
            <h4>功能测试</h4>
            <div class="action-buttons">
              <el-button @click="generateTestData" type="primary" size="large">
                <el-icon><Tools /></el-icon>
                生成测试数据
              </el-button>
              <el-button @click="testImportExport" type="warning" size="large">
                <el-icon><Check /></el-icon>
                测试导入导出
              </el-button>
            </div>
            <div class="action-tip">
              生成测试数据来验证导入导出功能是否正常
            </div>
          </div>
          
          <div class="action-group">
            <h4>数据清理</h4>
            <div class="action-buttons">
              <el-button @click="clearCache" size="large">
                <el-icon><Delete /></el-icon>
                清理缓存
              </el-button>
              <el-button @click="resetSettings" type="warning" size="large">
                <el-icon><Refresh /></el-icon>
                重置设置
              </el-button>
              <el-button @click="resetAllData" type="danger" size="large">
                <el-icon><Warning /></el-icon>
                重置所有数据
              </el-button>
            </div>
            <div class="action-tip">
              谨慎操作，重置数据将无法恢复
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 关于信息 -->
    <div class="about-section">
      <div class="learning-card">
        <h3>ℹ️ 关于应用</h3>
        <div class="about-content">
          <div class="app-info">
            <h4>汉字学习工具 v1.0.0</h4>
            <p>专为小学生设计的智能汉字学习系统</p>
          </div>
          
          <div class="features-list">
            <h5>主要功能</h5>
            <ul>
              <li>🎯 智能选字算法，个性化学习路径</li>
              <li>📊 详细的学习统计和进度追踪</li>
              <li>🔄 科学的复习机制，基于遗忘曲线</li>
              <li>🎮 游戏化学习体验，提高学习兴趣</li>
              <li>📱 响应式设计，支持多设备使用</li>
            </ul>
          </div>
          
          <div class="data-info">
            <h5>数据来源</h5>
            <p>汉字数据：小学生必学2500汉字及拼音词语</p>
            <p>算法设计：基于艾宾浩斯遗忘曲线理论</p>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 操作按钮 -->
    <div class="actions-section">
      <div class="learning-card">
        <div class="main-actions">
          <el-button @click="$router.push('/')" size="large">
            <el-icon><ArrowLeft /></el-icon>
            返回首页
          </el-button>
          <el-button @click="saveSettings" type="primary" size="large">
            <el-icon><Check /></el-icon>
            保存设置
          </el-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, watch, nextTick } from 'vue'
// import { useRouter } from 'vue-router' // 保留备用
import { useLearningStore } from '@/stores/learning'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { LearningSettings, ReviewSettings } from '@/types'

// const router = useRouter() // 当前未使用，但保留备用
const learningStore = useLearningStore()

// 表单数据 - 使用reactive对象并手动同步
const formSettings = reactive<LearningSettings>({
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

// 复习设置表单数据
const formReviewSettings = reactive<ReviewSettings>({
  复习数量: 15,
  检查类型: '混合模式',
  复习范围: '需要复习',
  倒计时秒数: 30,
  是否显示声调: true,
  打乱选项顺序: true
})

// 其他设置
const themeColor = ref('blue')
const fontSize = ref(14)
const dailyReminder = ref(false)
const reminderTime = ref(new Date())
const dailyGoal = ref(10)
const fileInput = ref<HTMLInputElement>()
const settingsFileInput = ref<HTMLInputElement>()

// 同步标志，防止循环更新
const isUpdatingFromStore = ref(false)
const isUpdatingReviewFromStore = ref(false)

// 监听formSettings变化，同步到store
watch(formSettings, (newSettings) => {
  if (!isUpdatingFromStore.value) {
    learningStore.updateSettings(newSettings)
  }
}, { deep: true })

// 监听store变化，同步到formSettings
watch(() => learningStore.settings, (newSettings) => {
  isUpdatingFromStore.value = true
  Object.assign(formSettings, newSettings)
  
  // 使用nextTick确保UI更新后再允许watch触发
  nextTick(() => {
    isUpdatingFromStore.value = false
  })
}, { deep: true, immediate: true })

// 监听formReviewSettings变化，同步到store
watch(formReviewSettings, (newSettings) => {
  if (!isUpdatingReviewFromStore.value) {
    learningStore.updateReviewSettings(newSettings)
  }
}, { deep: true })

// 监听store变化，同步到formReviewSettings
watch(() => learningStore.reviewSettings, (newSettings) => {
  isUpdatingReviewFromStore.value = true
  Object.assign(formReviewSettings, newSettings)
  
  // 使用nextTick确保UI更新后再允许watch触发
  nextTick(() => {
    isUpdatingReviewFromStore.value = false
  })
}, { deep: true, immediate: true })

// 监听其他设置变化并自动保存
watch([themeColor, fontSize, dailyReminder, reminderTime, dailyGoal], () => {
  const otherSettings = {
    themeColor: themeColor.value,
    fontSize: fontSize.value,
    dailyReminder: dailyReminder.value,
    reminderTime: reminderTime.value,
    dailyGoal: dailyGoal.value
  }
  localStorage.setItem('appSettings', JSON.stringify(otherSettings))
}, { deep: true })

// 方法
const saveSettings = () => {
  try {
    // 学习设置已经自动保存，这里只需要保存其他设置
    const otherSettings = {
      themeColor: themeColor.value,
      fontSize: fontSize.value,
      dailyReminder: dailyReminder.value,
      reminderTime: reminderTime.value,
      dailyGoal: dailyGoal.value
    }
    localStorage.setItem('appSettings', JSON.stringify(otherSettings))
    
    ElMessage.success('所有设置已手动保存成功！（注：学习设置和复习设置会自动保存）')
  } catch (error) {
    ElMessage.error('设置保存失败')
  }
}



// 导出设置到本地文件
const exportSettings = () => {
  try {
    const allSettings = {
      learningSettings: learningStore.settings,
      reviewSettings: learningStore.reviewSettings,
      appSettings: {
        themeColor: themeColor.value,
        fontSize: fontSize.value,
        dailyReminder: dailyReminder.value,
        reminderTime: reminderTime.value,
        dailyGoal: dailyGoal.value
      },
      exportTime: new Date().toISOString(),
      version: '1.0.0'
    }
    
    const blob = new Blob([JSON.stringify(allSettings, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `汉字学习工具-设置备份-${new Date().toISOString().slice(0, 10)}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    
    ElMessage.success('设置导出成功！')
  } catch (error) {
    console.error('导出设置失败:', error)
    ElMessage.error('设置导出失败')
  }
}

// 触发设置文件输入
const triggerSettingsFileInput = () => {
  settingsFileInput.value?.click()
}

// 处理设置文件变化
const handleSettingsFileChange = (event: Event) => {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  
  const reader = new FileReader()
  reader.onload = (e) => {
    try {
      const content = e.target?.result as string
      const data = JSON.parse(content)
      
      // 验证数据格式
      if (!data.learningSettings && !data.reviewSettings && !data.appSettings) {
        throw new Error('不是有效的设置文件')
      }
      
      // 导入学习设置
      if (data.learningSettings) {
        learningStore.updateSettings(data.learningSettings)
        // formSettings会通过watch自动同步
      }
      
      // 导入复习设置
      if (data.reviewSettings) {
        learningStore.updateReviewSettings(data.reviewSettings)
        // formReviewSettings会通过watch自动同步
      }
      
      // 导入应用设置
      if (data.appSettings) {
        const settings = data.appSettings
        themeColor.value = settings.themeColor || 'blue'
        fontSize.value = settings.fontSize || 14
        dailyReminder.value = settings.dailyReminder || false
        reminderTime.value = settings.reminderTime ? new Date(settings.reminderTime) : new Date()
        dailyGoal.value = settings.dailyGoal || 10
        
        localStorage.setItem('appSettings', JSON.stringify(settings))
      }
      
      ElMessage.success('设置导入成功！')
    } catch (error) {
      console.error('导入设置失败:', error)
      ElMessage.error('设置导入失败：文件格式不正确')
    }
  }
  reader.readAsText(file)
  
  // 清空input值，允许重复选择同一文件
  input.value = ''
}

const exportData = () => {
  try {
    // 确保数据完整性
    const recordsData: { [key: string]: any } = {}
    learningStore.learningRecords.forEach((record, key) => {
      recordsData[key] = record
    })
    
    const data = {
      userStats: learningStore.userStats,
      learningRecords: recordsData,
      settings: learningStore.settings,
      exportTime: new Date().toISOString(),
      version: '1.0.0',
      totalRecords: learningStore.learningRecords.size
    }
    

    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `hanzi-learning-backup-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
    
    ElMessage.success(`数据导出成功！包含 ${data.totalRecords} 条学习记录`)
  } catch (error) {
    console.error('导出失败:', error)
    ElMessage.error('数据导出失败：' + (error as Error).message)
  }
}

const triggerFileInput = () => {
  fileInput.value?.click()
}

const handleFileChange = (event: Event) => {
  const target = event.target as HTMLInputElement
  if (target.files && target.files.length > 0) {
    const file = target.files[0]
    handleImport(file)
  }
}

const handleImport = (file: File) => {
  const reader = new FileReader()
  reader.onload = (e) => {
    try {
      const data = JSON.parse(e.target?.result as string)
      
      // 详细验证数据格式
      if (!data.userStats) {
        throw new Error('缺少用户统计数据 (userStats)')
      }
      
      if (!data.learningRecords) {
        throw new Error('缺少学习记录数据 (learningRecords)')
      }
      
      // 验证userStats结构
      const requiredStatsFields = ['总学习汉字数', '总掌握汉字数', '整体正确率', '学习天数', '连续学习天数', '最后学习日期']
      for (const field of requiredStatsFields) {
        if (!(field in data.userStats)) {
          throw new Error(`用户统计数据缺少字段: ${field}`)
        }
      }
      
      // 处理learningRecords数据格式
      let recordsData = data.learningRecords
      let recordCount = 0
      
      // 如果是对象格式，转换为数组格式
      if (typeof recordsData === 'object' && !Array.isArray(recordsData)) {
        recordsData = Object.entries(recordsData)
        recordCount = Object.keys(data.learningRecords).length
      } else if (Array.isArray(recordsData)) {
        recordCount = recordsData.length
      }
      

      
      // 导入数据到localStorage
      localStorage.setItem('userStats', JSON.stringify(data.userStats))
      localStorage.setItem('learningRecords', JSON.stringify(recordsData))
      
      if (data.settings) {
        localStorage.setItem('learningSettings', JSON.stringify(data.settings))
      }
      
      // 重新加载store数据
      learningStore.loadFromStorage()
      
      ElMessage.success(`数据导入成功！恢复了 ${recordCount} 条学习记录`)
      
      // 清空文件输入
      if (fileInput.value) {
        fileInput.value.value = ''
      }
    } catch (error) {
      console.error('导入错误:', error)
      const errorMsg = error instanceof Error ? error.message : '未知错误'
      ElMessage.error(`数据导入失败: ${errorMsg}`)
    }
  }
  
  reader.onerror = () => {
    ElMessage.error('文件读取失败')
  }
  
  reader.readAsText(file)
}

const generateTestData = () => {
  learningStore.generateTestData()
  ElMessage.success('测试数据已生成！可以在统计页面查看效果，也可以测试导入导出功能')
}

const testImportExport = async () => {
  try {
    // 先生成测试数据
    learningStore.generateTestData()
    
    // 导出数据
    const recordsData: { [key: string]: any } = {}
    learningStore.learningRecords.forEach((record, key) => {
      recordsData[key] = record
    })
    
    const exportData = {
      userStats: learningStore.userStats,
      learningRecords: recordsData,
      settings: learningStore.settings,
      exportTime: new Date().toISOString(),
      version: '1.0.0'
    }
    
    // 模拟导入过程
    const jsonString = JSON.stringify(exportData, null, 2)
    const mockFile = new File([jsonString], 'test-data.json', { type: 'application/json' })
    
    // 备份当前数据
    const backup = {
      userStats: { ...learningStore.userStats },
      learningRecords: new Map(learningStore.learningRecords),
      settings: { ...learningStore.settings }
    }
    
    // 清空当前数据
    learningStore.learningRecords.clear()
    
    // 测试导入
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string)
        
        let recordsData = data.learningRecords
        if (typeof recordsData === 'object' && !Array.isArray(recordsData)) {
          recordsData = Object.entries(recordsData)
        }
        
        localStorage.setItem('userStats', JSON.stringify(data.userStats))
        localStorage.setItem('learningRecords', JSON.stringify(recordsData))
        localStorage.setItem('learningSettings', JSON.stringify(data.settings))
        
        learningStore.loadFromStorage()
        
        ElMessage.success(`导入导出测试成功！恢复了 ${learningStore.learningRecords.size} 条记录`)
      } catch (error) {
        // 恢复备份数据
        learningStore.learningRecords = backup.learningRecords
        Object.assign(learningStore.userStats, backup.userStats)
        Object.assign(learningStore.settings, backup.settings)
        
        ElMessage.error('导入导出测试失败，已恢复原数据')
        console.error('测试错误:', error)
      }
    }
    reader.readAsText(mockFile)
    
  } catch (error) {
    ElMessage.error('导入导出测试失败')
    console.error('测试错误:', error)
  }
}

const clearCache = () => {
  try {
    // 清理非关键缓存数据
    const keysToKeep = ['learningRecords', 'userStats', 'learningSettings']
    Object.keys(localStorage).forEach(key => {
      if (!keysToKeep.includes(key)) {
        localStorage.removeItem(key)
      }
    })
    ElMessage.success('缓存清理完成')
  } catch (error) {
    ElMessage.error('缓存清理失败')
  }
}

const resetSettings = async () => {
  try {
    await ElMessageBox.confirm(
      '确定要重置所有设置为默认值吗？',
      '重置设置',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    // 重置设置
    localStorage.removeItem('learningSettings')
    localStorage.removeItem('appSettings')
    
    ElMessage.success('设置重置成功，页面即将刷新')
    setTimeout(() => {
      window.location.reload()
    }, 1000)
  } catch {
    // 用户取消
  }
}

const resetAllData = async () => {
  try {
    await ElMessageBox.confirm(
      '确定要重置所有数据吗？包括学习记录、统计数据和设置。此操作不可恢复！',
      '重置所有数据',
      {
        confirmButtonText: '确定重置',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    // 清空所有数据
    localStorage.clear()
    
    ElMessage.success('数据重置完成，页面即将刷新')
    setTimeout(() => {
      window.location.reload()
    }, 1000)
  } catch {
    // 用户取消
  }
}

// 初始化
onMounted(() => {
  // 确保formSettings与store同步（watch的immediate可能不够及时）
  isUpdatingFromStore.value = true
  Object.assign(formSettings, learningStore.settings)
  nextTick(() => {
    isUpdatingFromStore.value = false
  })
  
  // 确保formReviewSettings与store同步
  isUpdatingReviewFromStore.value = true
  Object.assign(formReviewSettings, learningStore.reviewSettings)
  nextTick(() => {
    isUpdatingReviewFromStore.value = false
  })
  
  // 加载其他设置
  try {
    const savedSettings = localStorage.getItem('appSettings')
    if (savedSettings) {
      const settings = JSON.parse(savedSettings)
      themeColor.value = settings.themeColor || 'blue'
      fontSize.value = settings.fontSize || 14
      dailyReminder.value = settings.dailyReminder || false
      reminderTime.value = settings.reminderTime ? new Date(settings.reminderTime) : new Date()
      dailyGoal.value = settings.dailyGoal || 10
    }
  } catch (error) {
    console.error('加载设置失败:', error)
  }
})
</script>

<style lang="scss" scoped>
.settings-container {
  max-width: 1000px;
  margin: 0 auto;
  padding: 20px;
  
  > div {
    margin-bottom: 30px;
  }
}

.settings-header {
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

.learning-card {
  padding: 30px;
  
  h3 {
    font-size: 20px;
    color: #333;
    margin-bottom: 24px;
    display: flex;
    align-items: center;
    gap: 8px;
  }
  
  .setting-tip {
    font-size: 12px;
    color: #999;
    margin-top: 8px;
    line-height: 1.4;
  }
}

.data-actions {
  .action-group {
    margin-bottom: 30px;
    
    h4 {
      font-size: 16px;
      color: #333;
      margin-bottom: 16px;
    }
    
    .action-buttons {
      display: flex;
      gap: 12px;
      flex-wrap: wrap;
      margin-bottom: 8px;
    }
    
    .action-tip {
      font-size: 12px;
      color: #999;
      line-height: 1.4;
    }
  }
}

.about-content {
  .app-info {
    margin-bottom: 24px;
    
    h4 {
      font-size: 18px;
      color: #409EFF;
      margin-bottom: 8px;
    }
    
    p {
      color: #666;
      font-size: 14px;
    }
  }
  
  .features-list, .data-info {
    margin-bottom: 20px;
    
    h5 {
      font-size: 14px;
      color: #333;
      margin-bottom: 12px;
      font-weight: 600;
    }
    
    ul {
      list-style: none;
      padding: 0;
      
      li {
        font-size: 14px;
        color: #666;
        margin-bottom: 6px;
        line-height: 1.4;
      }
    }
    
    p {
      font-size: 14px;
      color: #666;
      margin-bottom: 4px;
      line-height: 1.4;
    }
  }
}

.main-actions {
  display: flex;
  justify-content: center;
  gap: 20px;
}

// 响应式设计
@media (max-width: 768px) {
  .settings-container {
    padding: 10px;
  }
  
  .learning-card {
    padding: 20px;
  }
  
  .action-buttons {
    flex-direction: column;
    
    .el-button {
      width: 100%;
    }
  }
  
  .main-actions {
    flex-direction: column;
    
    .el-button {
      width: 100%;
    }
  }
  
  .el-form-item {
    flex-direction: column;
    
    .el-form-item__label {
      text-align: left;
      width: auto !important;
      margin-bottom: 8px;
    }
    
    .el-form-item__content {
      margin-left: 0 !important;
    }
  }
}
</style> 