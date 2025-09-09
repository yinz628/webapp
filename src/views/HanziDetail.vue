<template>
  <div class="hanzi-detail-container">
    <div class="detail-header">
      <div class="learning-card header-card">
        <h2>📝 汉字详情管理</h2>
        <p class="description">查看和编辑每个汉字的读音、词语，追踪学习进度</p>
      </div>
    </div>

    <!-- 搜索和过滤 -->
    <div class="search-section">
      <div class="learning-card">
        <div class="search-controls">
          <el-input
            v-model="searchKeyword"
            placeholder="搜索汉字、拼音或词语..."
            clearable
            @input="handleSearch"
            class="search-input"
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>
          
          <el-select v-model="masteryFilter" placeholder="掌握度筛选" clearable @change="handleFilter">
            <el-option label="全部" value="" />
            <el-option label="完全掌握" value="完全掌握" />
            <el-option label="基本掌握" value="基本掌握" />
            <el-option label="需要复习" value="需要复习" />
            <el-option label="未学习" value="未学习" />
          </el-select>

          <el-button @click="resetFilters">重置筛选</el-button>
        </div>
      </div>
    </div>

    <!-- 汉字表格 -->
    <div class="table-section">
      <div class="learning-card">
        <el-table 
          :data="displayedHanziList" 
          v-loading="loading"
          row-key="序号"
          class="hanzi-table"
        >
          <el-table-column prop="序号" label="序号" width="80" sortable />
          
          <el-table-column prop="汉字" label="汉字" width="80" align="center">
            <template #default="{ row }">
              <span class="hanzi-character">{{ row.汉字 }}</span>
            </template>
          </el-table-column>
          
          <el-table-column prop="拼音" label="拼音" width="120">
            <template #default="{ row }">
              <div v-if="row.editing" class="edit-field">
                <el-input
                  v-model="row.editData.拼音"
                  placeholder="输入拼音"
                  size="small"
                />
              </div>
              <span v-else class="pinyin-text">{{ row.拼音 || '-' }}</span>
            </template>
          </el-table-column>
          
          <el-table-column label="词语" width="300">
            <template #default="{ row }">
              <div v-if="row.editing" class="edit-words">
                <el-input
                  v-model="row.editData.词语1"
                  placeholder="词语1"
                  size="small"
                  class="word-input"
                />
                <el-input
                  v-model="row.editData.词语2"
                  placeholder="词语2"
                  size="small"
                  class="word-input"
                />
                <el-input
                  v-model="row.editData.词语3"
                  placeholder="词语3"
                  size="small"
                  class="word-input"
                />
              </div>
              <div v-else class="words-display">
                <el-tag v-if="row.词语1" size="small" class="word-tag">{{ row.词语1 }}</el-tag>
                <el-tag v-if="row.词语2" size="small" class="word-tag">{{ row.词语2 }}</el-tag>
                <el-tag v-if="row.词语3" size="small" class="word-tag">{{ row.词语3 }}</el-tag>
                <span v-if="!row.词语1 && !row.词语2 && !row.词语3" class="empty-words">-</span>
              </div>
            </template>
          </el-table-column>
          
          <el-table-column label="学习进度" width="150">
            <template #default="{ row }">
              <div class="progress-info">
                <el-tag 
                  :type="getMasteryTagType(row.learningRecord?.掌握度)" 
                  size="small"
                  class="mastery-tag"
                >
                  {{ row.learningRecord?.掌握度 || '未学习' }}
                </el-tag>
                <div v-if="row.learningRecord" class="stats-text">
                  正确率: {{ getAccuracyRate(row.learningRecord) }}%
                </div>
              </div>
            </template>
          </el-table-column>

          <el-table-column label="学习统计" width="180">
            <template #default="{ row }">
              <div v-if="row.learningRecord" class="learning-stats">
                <div class="stat-item">
                  <span class="label">学习:</span>
                  <span class="value">{{ row.learningRecord.学习次数 }}次</span>
                </div>
                <div class="stat-item">
                  <span class="label">检查:</span>
                  <span class="value">{{ row.learningRecord.检查次数 }}次</span>
                </div>
                <div class="stat-item">
                  <span class="label">连续正确:</span>
                  <span class="value">{{ row.learningRecord.连续正确次数 }}次</span>
                </div>
              </div>
              <span v-else class="no-stats">暂无学习记录</span>
            </template>
          </el-table-column>

          <el-table-column label="操作" width="120" fixed="right">
            <template #default="{ row }">
              <div v-if="row.editing" class="edit-actions">
                <el-button 
                  @click="saveEdit(row)" 
                  type="primary" 
                  size="small"
                  :loading="row.saving"
                >
                  保存
                </el-button>
                <el-button @click="cancelEdit(row)" size="small">取消</el-button>
              </div>
              <div v-else class="normal-actions">
                <el-button @click="startEdit(row)" type="primary" size="small" text>
                  编辑
                </el-button>
              </div>
            </template>
          </el-table-column>
        </el-table>

        <!-- 分页 -->
        <div class="pagination-wrapper">
          <el-pagination
            v-model:current-page="currentPage"
            v-model:page-size="pageSize"
            :page-sizes="[20, 50, 100, 200]"
            :total="filteredHanziList.length"
            layout="total, sizes, prev, pager, next, jumper"
            @size-change="handleSizeChange"
            @current-change="handleCurrentChange"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { useLearningStore } from '@/stores/learning'
import { hanziApi, type HanziData, type UpdateHanziData } from '@/services/hanziApi'
import type { LearningRecord } from '@/types'

// 扩展HanziData类型以包含编辑状态和学习记录
interface ExtendedHanziData extends HanziData {
  editing?: boolean
  saving?: boolean
  learningRecord?: LearningRecord
  editData?: UpdateHanziData
}

const learningStore = useLearningStore()

// 数据状态
const loading = ref(false)
const hanziList = ref<ExtendedHanziData[]>([])
const searchKeyword = ref('')
const masteryFilter = ref('')
const currentPage = ref(1)
const pageSize = ref(50)

// 计算属性
const filteredHanziList = computed(() => {
  let filtered = hanziList.value

  // 搜索过滤
  if (searchKeyword.value) {
    const keyword = searchKeyword.value.toLowerCase()
    filtered = filtered.filter(hanzi => 
      hanzi.汉字.includes(keyword) || 
      hanzi.拼音.toLowerCase().includes(keyword) ||
      hanzi.词语1.toLowerCase().includes(keyword) ||
      hanzi.词语2.toLowerCase().includes(keyword) ||
      hanzi.词语3.toLowerCase().includes(keyword)
    )
  }

  // 掌握度过滤
  if (masteryFilter.value) {
    filtered = filtered.filter(hanzi => {
      const mastery = hanzi.learningRecord?.掌握度 || '未学习'
      return mastery === masteryFilter.value
    })
  }

  return filtered
})

const displayedHanziList = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return filteredHanziList.value.slice(start, end)
})

// 方法
const loadHanziData = async () => {
  loading.value = true
  try {
    const response = await hanziApi.getAllHanzi()
    if (response.success && response.data) {
      // 合并汉字数据和学习记录
      hanziList.value = response.data.map(hanzi => {
        const learningRecord = learningStore.learningRecords.get(hanzi.汉字)
        return {
          ...hanzi,
          learningRecord,
          editing: false,
          saving: false
        }
      })
    }
  } catch (error) {
    console.error('加载汉字数据失败:', error)
    ElMessage.error('加载汉字数据失败')
  } finally {
    loading.value = false
  }
}

const startEdit = (row: ExtendedHanziData) => {
  row.editing = true
  row.editData = {
    拼音: row.拼音,
    词语1: row.词语1,
    词语2: row.词语2,
    词语3: row.词语3
  }
}

const cancelEdit = (row: ExtendedHanziData) => {
  row.editing = false
  row.editData = undefined
}

const saveEdit = async (row: ExtendedHanziData) => {
  if (!row.editData) return

  row.saving = true
  try {
    const response = await hanziApi.updateHanzi(row.序号, row.editData)
    if (response.success && response.data) {
      // 更新本地数据
      Object.assign(row, response.data)
      row.editing = false
      row.editData = undefined
      ElMessage.success('汉字数据更新成功')
    }
  } catch (error) {
    console.error('更新汉字数据失败:', error)
    ElMessage.error('更新汉字数据失败')
  } finally {
    row.saving = false
  }
}

const handleSearch = () => {
  currentPage.value = 1
}

const handleFilter = () => {
  currentPage.value = 1
}

const resetFilters = () => {
  searchKeyword.value = ''
  masteryFilter.value = ''
  currentPage.value = 1
}

const handleSizeChange = (val: number) => {
  pageSize.value = val
  currentPage.value = 1
}

const handleCurrentChange = (val: number) => {
  currentPage.value = val
}

const getMasteryTagType = (mastery?: string) => {
  switch (mastery) {
    case '完全掌握': return 'success'
    case '基本掌握': return 'primary'
    case '需要复习': return 'warning'
    default: return 'info'
  }
}

const getAccuracyRate = (record: LearningRecord) => {
  if (record.检查次数 === 0) return 0
  return Math.round((record.正确次数 / record.检查次数) * 100)
}

// 生命周期
onMounted(() => {
  loadHanziData()
})
</script>

<style lang="scss" scoped>
.hanzi-detail-container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 20px;
  
  > div {
    margin-bottom: 20px;
  }
}

.detail-header {
  .header-card {
    text-align: center;
    padding: 30px;
    
    h2 {
      color: #409EFF;
      margin-bottom: 12px;
    }
    
    .description {
      color: #666;
      font-size: 14px;
    }
  }
}

.search-controls {
  display: flex;
  gap: 15px;
  align-items: center;
  flex-wrap: wrap;
  
  .search-input {
    flex: 1;
    min-width: 200px;
  }
  
  .el-select {
    width: 150px;
  }
}

.hanzi-table {
  .hanzi-character {
    font-size: 18px;
    font-weight: bold;
    color: #409EFF;
  }
  
  .pinyin-text {
    color: #666;
    font-style: italic;
  }
  
  .edit-field {
    .el-input {
      width: 100%;
    }
  }
  
  .edit-words {
    display: flex;
    flex-direction: column;
    gap: 4px;
    
    .word-input {
      .el-input {
        width: 100%;
      }
    }
  }
  
  .words-display {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
    
    .word-tag {
      margin: 0;
    }
    
    .empty-words {
      color: #999;
    }
  }
  
  .progress-info {
    .mastery-tag {
      margin-bottom: 4px;
    }
    
    .stats-text {
      font-size: 12px;
      color: #666;
    }
  }
  
  .learning-stats {
    .stat-item {
      display: flex;
      justify-content: space-between;
      margin-bottom: 2px;
      font-size: 12px;
      
      .label {
        color: #666;
      }
      
      .value {
        color: #333;
        font-weight: 500;
      }
    }
  }
  
  .no-stats {
    font-size: 12px;
    color: #999;
  }
  
  .edit-actions {
    display: flex;
    flex-direction: column;
    gap: 4px;
    
    .el-button {
      padding: 4px 8px;
      font-size: 12px;
    }
  }
  
  .normal-actions {
    .el-button {
      padding: 4px 8px;
      font-size: 12px;
    }
  }
}

.pagination-wrapper {
  margin-top: 20px;
  text-align: center;
}

.learning-card {
  padding: 20px;
  
  h3 {
    font-size: 18px;
    color: #333;
    margin-bottom: 15px;
    display: flex;
    align-items: center;
    gap: 8px;
  }
}

@media (max-width: 768px) {
  .hanzi-detail-container {
    padding: 10px;
  }
  
  .search-controls {
    flex-direction: column;
    align-items: stretch;
    
    .search-input {
      min-width: auto;
    }
    
    .el-select {
      width: 100%;
    }
  }
  
  .hanzi-table {
    font-size: 12px;
    
    .edit-actions, .normal-actions {
      .el-button {
        padding: 2px 6px;
        font-size: 11px;
      }
    }
  }
}
</style> 