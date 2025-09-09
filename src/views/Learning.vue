<template>
  <div class="learning-container">
    <!-- 学习设置阶段 -->
    <div v-if="currentPhase === 'settings'" class="settings-phase">
      <div class="learning-card settings-card">
        <h2>📚 开始学习</h2>
        <p class="phase-description">请配置本次学习的参数，系统将根据你的设置智能选择汉字</p>
        
        <el-form :model="tempSettings" label-width="120px" size="large">
          <el-form-item label="学习数量">
            <el-slider 
              v-model="tempSettings.学习数量" 
              :min="5" 
              :max="50" 
              :step="5"
              :show-input="true"
              show-stops
            />
            <span class="form-tip">建议新手选择5-15个汉字</span>
          </el-form-item>
          
          <el-form-item label="检查类型">
            <el-radio-group v-model="tempSettings.检查类型" size="large">
              <el-radio value="拼音选汉字">拼音选汉字</el-radio>
              <el-radio value="汉字选拼音">汉字选拼音</el-radio>
              <el-radio value="混合模式">混合模式</el-radio>
            </el-radio-group>
          </el-form-item>
          
          <el-form-item label="学习范围">
            <el-radio-group v-model="tempSettings.学习范围" size="large">
              <el-radio value="全新汉字">全新汉字 ({{ newCharsCount }} 个)</el-radio>
              <el-radio value="错字本">错字本 ({{ errorBookCount }} 个)</el-radio>
              <el-radio value="自定义范围">自定义范围</el-radio>
            </el-radio-group>
            <div class="form-tip">
              学习新汉字包含学习和测试两个阶段<br/>
              错字本包含诊断和练习中答错的汉字<br/>
              如需复习已学汉字，请使用"开始复习"功能
            </div>
          </el-form-item>
          
          <el-form-item label="起始序号" v-if="tempSettings.学习范围 === '全新汉字' || tempSettings.学习范围 === '自定义范围'">
            <el-input-number 
              v-model="tempSettings.起始序号"
              :min="1"
              :max="2525"
              :step="1"
              size="large"
              placeholder="从第几个汉字开始学习"
            />
            <div class="form-tip">设置从第几个汉字开始学习（适用于换设备后继续学习）</div>
          </el-form-item>
          
          <el-form-item label="结束序号" v-if="tempSettings.学习范围 === '自定义范围'">
            <el-input-number 
              v-model="tempSettings.结束序号"
              :min="tempSettings.起始序号 || 1"
              :max="2525"
              :step="1"
              size="large"
              placeholder="学习到第几个汉字"
            />
            <div class="form-tip">设置学习到第几个汉字（留空则学习到最后）</div>
          </el-form-item>
          
          <el-form-item label="高级选项">
            <el-checkbox v-model="tempSettings.是否显示声调">显示拼音声调</el-checkbox>
            <br>
            <el-checkbox v-model="tempSettings.是否显示笔画">显示笔画动画</el-checkbox>
          </el-form-item>
          
          <el-form-item label="答题时间">
            <el-select v-model="tempSettings.倒计时秒数" placeholder="选择答题时间限制">
              <el-option label="无限制" :value="0" />
              <el-option label="15秒" :value="15" />
              <el-option label="30秒" :value="30" />
              <el-option label="45秒" :value="45" />
              <el-option label="60秒" :value="60" />
            </el-select>
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
            @click="startLearning"
            :disabled="!canStartLearning"
          >
            <el-icon><Reading /></el-icon>
            开始学习 ({{ selectedCharsCount }} 字)
          </el-button>
        </div>
      </div>
    </div>
    
    <!-- 学习阶段 -->
    <div v-else-if="currentPhase === 'learning'" class="learning-phase">
      <div class="progress-header">
        <el-progress 
          :percentage="learningProgress.percentage" 
          :stroke-width="8"
          :show-text="false"
        />
        <div class="progress-info">
          <span>学习进度: {{ currentCharIndex + 1 }} / {{ currentLearningChars.length }}</span>
          <span>{{ learningProgress.percentage }}%</span>
        </div>
      </div>
      
      <div class="learning-card main-learning-card">
        <div v-if="currentChar" class="char-display">
          <!-- 汉字展示 -->
          <div class="char-main">
            <div class="char-number">第 {{ Math.floor(currentChar.序号) }} 字</div>
            <div class="char-text">{{ currentChar.汉字 }}</div>
            <div v-if="settings.是否显示声调" class="char-pinyin">
              {{ currentChar.拼音 }}
            </div>
          </div>
          
          <!-- 词语展示 -->
          <div class="char-words">
            <h4>📝 相关词语</h4>
            <div class="words-list">
              <el-tag 
                v-for="word in getCharWords(currentChar)" 
                :key="word"
                size="large"
                class="word-tag"
              >
                {{ word }}
              </el-tag>
            </div>
          </div>
          
          <!-- 学习操作 -->
          <div class="learning-actions">
            <el-button 
              size="large" 
              @click="previousCharacter"
              :disabled="currentCharIndex === 0"
            >
              <el-icon><ArrowLeft /></el-icon>
              上个字
            </el-button>
            <el-button 
              size="large" 
              @click="markAsFavorite"
              :type="isCurrentCharFavorite ? 'warning' : 'default'"
            >
              <el-icon><Star /></el-icon>
              {{ isCurrentCharFavorite ? '已收藏' : '收藏' }}
            </el-button>
            <el-button 
              type="primary" 
              size="large" 
              @click="nextCharacter"
            >
              <el-icon><ArrowRight /></el-icon>
              下一字
            </el-button>
          </div>
          
          <!-- 学习控制按钮 -->
          <div class="learning-controls">
            <el-button 
              @click="$router.push('/')" 
              size="large"
            >
              <el-icon><House /></el-icon>
              返回首页
            </el-button>
            <el-button 
              @click="restartLearningWithOriginalStart" 
              size="large"
              type="warning"
            >
              <el-icon><Refresh /></el-icon>
              重新设置开始学习
            </el-button>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 检查阶段 -->
    <div v-else-if="currentPhase === 'quiz'" class="quiz-phase">
      <!-- 检查没有内容的情况 -->
      <div v-if="currentQuizQuestions.length === 0 && isReviewMode" class="learning-card">
        <div style="text-align: center; padding: 40px;">
          <h2>😔 暂无可复习内容</h2>
          <el-alert
            v-if="settings.学习范围 === '需要复习'"
            title="没有需要复习的汉字"
            description="当前没有掌握度为'需要复习'的汉字。建议先学习一些新汉字后再来复习。"
            type="info"
            :closable="false"
            show-icon
            style="margin: 20px 0;"
          />
          <el-alert
            v-else-if="settings.学习范围 === '随机复习'"
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
            <el-button 
              @click="startNewLearning" 
              type="primary" 
              size="large"
              v-if="newCharsCount > 0"
            >
              <el-icon><Reading /></el-icon>
              学习新汉字
            </el-button>
          </div>
        </div>
      </div>
      
      <!-- 复习模式提示 -->
      <div v-else-if="isReviewMode" class="review-mode-tip">
        <el-alert
          title="复习模式"
          :description="reviewModeDescription"
          type="info"
          :closable="false"
          show-icon
        />
      </div>
      
      <div class="progress-header">
        <el-progress 
          :percentage="quizProgress.percentage" 
          :stroke-width="8"
          :show-text="false"
          color="#E6A23C"
        />
        <div class="progress-info">
          <span>{{ isReviewMode ? '复习进度' : '检查进度' }}: {{ currentQuestionIndex + 1 }} / {{ currentQuizQuestions.length }}</span>
          <span>{{ quizProgress.percentage }}%</span>
        </div>
      </div>
      
      <div class="learning-card quiz-card">
        <div v-if="currentQuestion" class="question-display">
          <!-- 题目类型标识 -->
          <div class="question-type">
            <el-tag :type="currentQuestion.type === '拼音选汉字' ? 'primary' : 'success'">
              {{ currentQuestion.type }}
            </el-tag>
          </div>
          
          <!-- 倒计时 -->
          <div v-if="settings.倒计时秒数 > 0" class="countdown">
            <el-progress
              type="circle"
              :percentage="countdownPercentage"
              :width="60"
              :stroke-width="6"
              :color="countdownColor"
            >
              <span class="countdown-text">{{ countdown }}</span>
            </el-progress>
          </div>
          
          <!-- 题目内容 -->
          <div class="question-content">
            <div class="question-number">第 {{ Math.floor(currentLearningChars[currentQuestionIndex]?.序号 || 0) }} 字</div>
            <h3>{{ currentQuestion.question }}</h3>
            <div v-if="currentQuestion.词语 && currentQuestion.词语.length > 0" class="question-words">
              相关词语: {{ currentQuestion.词语.join('、') }}
            </div>
          </div>
          
          <!-- 选项 -->
          <div class="options-grid">
            <el-button
              v-for="option in currentQuestion.options"
              :key="option"
              :class="{ 
                'option-button': true,
                'selected': selectedAnswer === option,
                'correct': showAnswer && option === currentQuestion.correctAnswer,
                'wrong': showAnswer && selectedAnswer === option && option !== currentQuestion.correctAnswer
              }"
              size="large"
              @click="selectAnswer(option)"
              :disabled="showAnswer"
            >
              {{ option }}
            </el-button>
          </div>
          
          <!-- 答案解析 -->
          <div v-if="showAnswer" class="answer-explanation">
            <el-alert
              :type="lastAnswerCorrect ? 'success' : 'error'"
              :title="lastAnswerCorrect ? '回答正确！' : '回答错误'"
              :description="currentQuestion.explanation"
              :closable="false"
              show-icon
            />
          </div>
          
          <!-- 答题操作 -->
          <div class="quiz-actions">
            <el-button 
              v-if="!showAnswer"
              type="primary" 
              size="large"
              @click="submitAnswer"
              :disabled="!selectedAnswer"
            >
              <el-icon><Check /></el-icon>
              提交答案
            </el-button>
            <el-button 
              v-else
              type="primary" 
              size="large"
              @click="nextQuestion"
            >
              <el-icon><ArrowRight /></el-icon>
              {{ currentQuestionIndex < currentQuizQuestions.length - 1 ? '下一题' : '查看结果' }}
            </el-button>
          </div>
          
          <!-- 检查控制按钮 -->
          <div class="quiz-controls">
            <el-button 
              @click="$router.push('/')" 
              size="large"
            >
              <el-icon><House /></el-icon>
              返回首页
            </el-button>
            <el-button 
              @click="restartQuiz" 
              size="large"
              type="info"
            >
              <el-icon><VideoPlay /></el-icon>
              重新设置开始检查
            </el-button>
            <el-button 
              @click="restartLearningWithOriginalStart" 
              size="large"
              type="warning"
            >
              <el-icon><Refresh /></el-icon>
              重新设置开始学习
            </el-button>
          </div>
        </div>
        
        <!-- 没有题目时的错误提示 -->
        <div v-else class="no-questions-error">
          <el-alert
            title="生成题目失败"
            description="无法生成检查题目，请重新开始学习。"
            type="warning"
            show-icon
            :closable="false"
          />
          <div style="margin-top: 20px;">
            <el-button @click="restartLearning" type="primary" size="large">
              重新开始
            </el-button>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 统计结果阶段 -->
    <div v-else-if="currentPhase === 'statistics'" class="statistics-phase">
      <div class="learning-card results-card">
        <h2>🎉 学习完成！</h2>
        <p class="phase-description">恭喜你完成了本次学习，查看你的学习成果</p>
        
        <!-- 总体统计 -->
        <div class="results-summary">
          <div class="summary-item">
            <div class="summary-icon">📚</div>
            <div class="summary-content">
              <div class="summary-number">{{ currentLearningChars.length }}</div>
              <div class="summary-label">学习汉字</div>
            </div>
          </div>
          
          <div class="summary-item">
            <div class="summary-icon">✅</div>
            <div class="summary-content">
              <div class="summary-number">{{ correctAnswers }}</div>
              <div class="summary-label">回答正确</div>
            </div>
          </div>
          
          <div class="summary-item">
            <div class="summary-icon">📊</div>
            <div class="summary-content">
              <div class="summary-number">{{ sessionAccuracy }}%</div>
              <div class="summary-label">正确率</div>
            </div>
          </div>
          
          <div class="summary-item">
            <div class="summary-icon">⏱️</div>
            <div class="summary-content">
              <div class="summary-number">{{ averageTime }}s</div>
              <div class="summary-label">平均用时</div>
            </div>
          </div>
        </div>
        
        <!-- 错题回顾 -->
        <div v-if="wrongAnswers.length > 0" class="wrong-answers-section">
          <h3>❌ 错题回顾 ({{ wrongAnswers.length }}题)</h3>
          <div class="wrong-answers-list">
            <div 
              v-for="wrong in wrongAnswers" 
              :key="wrong.questionId"
              class="wrong-answer-item"
            >
              <!-- 汉字显示 -->
              <div v-if="wrong.character" class="wrong-character">
                <span class="character-display">{{ wrong.character }}</span>
              </div>
              
              <!-- 题目描述 -->
              <div class="wrong-question">{{ wrong.question }}</div>
              
              <!-- 答案对比 -->
              <div class="wrong-details">
                <div class="answer-comparison">
                  <span class="your-answer">
                    <el-icon><Close /></el-icon>
                    你的答案: {{ wrong.userAnswer || '未作答' }}
                  </span>
                  <span class="correct-answer">
                    <el-icon><Check /></el-icon>
                    正确答案: {{ wrong.correctAnswer }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- 学习建议 -->
        <div class="learning-suggestions">
          <h3>💡 学习建议</h3>
          <div class="suggestions">
            <el-alert
              v-for="suggestion in sessionSuggestions"
              :key="suggestion.type"
              :type="suggestion.type"
              :title="suggestion.title"
              :description="suggestion.description"
              :closable="false"
              show-icon
            />
          </div>
        </div>
        
        <!-- 结果操作 -->
        <div class="results-actions">
          <el-button @click="$router.push('/')" size="large">
            <el-icon><House /></el-icon>
            返回首页
          </el-button>
          <el-button @click="restartLearning" size="large">
            <el-icon><Refresh /></el-icon>
            重新学习
          </el-button>
          <el-button @click="continueNewSession" type="primary" size="large">
            <el-icon><Reading /></el-icon>
            继续学习
          </el-button>
        </div>
      </div>
    </div>

    <!-- 学前诊断设置阶段 -->
    <div v-else-if="currentPhase === 'diagnostic-settings'" class="diagnostic-settings-phase">
      <div class="learning-card settings-card">
        <h2>🔍 学前诊断</h2>
        <p class="phase-description">通过快速测试，找出你不熟悉的汉字，制定专属学习计划</p>
        
        <el-form :model="diagnosticSettings" label-width="120px" size="large">
          <el-form-item label="诊断数量">
            <el-slider 
              v-model="diagnosticSettings.诊断数量" 
              :min="10" 
              :max="200" 
              :step="10"
              :show-input="true"
              show-stops
            />
            <span class="form-tip">推荐50-100字，便于快速测试</span>
          </el-form-item>
          
          <el-form-item label="测试范围">
            <div class="range-inputs">
              <el-input-number 
                v-model="diagnosticSettings.起始范围" 
                :min="1" 
                :max="2500" 
                placeholder="起始序号"
              />
              <span class="range-separator">至</span>
              <el-input-number 
                v-model="diagnosticSettings.结束范围" 
                :min="diagnosticSettings.起始范围" 
                :max="2500" 
                placeholder="结束序号"
              />
            </div>
            <span class="form-tip">选择汉字序号范围（1-500为最常用字）</span>
          </el-form-item>
          
          <el-form-item label="答题时间">
            <el-radio-group v-model="diagnosticSettings.答题时间" size="large">
              <el-radio :value="0">无限制</el-radio>
              <el-radio :value="10">快速模式（10秒/题）</el-radio>
              <el-radio :value="15">标准模式（15秒/题）</el-radio>
              <el-radio :value="20">宽松模式（20秒/题）</el-radio>
            </el-radio-group>
          </el-form-item>
        </el-form>
        
        <div class="diagnostic-preview">
          <h3>📋 诊断说明</h3>
          <ul>
            <li>📝 每题显示一个汉字，选择正确的拼音</li>
            <li>⚡ 有时间限制时超时未答题视为错误，无限制时可自由答题</li>
            <li>📊 测试完成后，系统分析错误汉字</li>
            <li>🎯 仅对错误汉字进行针对性学习</li>
          </ul>
        </div>
        
        <div class="action-buttons">
          <el-button size="large" @click="backToHome">
            <el-icon><ArrowLeft /></el-icon>
            返回首页
          </el-button>
          <el-button type="primary" size="large" @click="startDiagnostic">
            <el-icon><Play /></el-icon>
            开始诊断
          </el-button>
        </div>
      </div>
    </div>

    <!-- 诊断测试阶段 -->
    <div v-else-if="currentPhase === 'diagnostic'" class="diagnostic-phase">
      <div class="diagnostic-header">
        <div class="progress-section">
          <div class="progress-text">
            诊断进度: {{ currentQuestionIndex + 1 }} / {{ currentQuizQuestions.length }}
          </div>
          <el-progress 
            :percentage="Math.round(((currentQuestionIndex + 1) / currentQuizQuestions.length) * 100)"
            :show-text="false"
            stroke-width="8"
            color="#667eea"
          />
        </div>
        
        <div class="timer-section">
          <div class="timer-display" :class="{ warning: timeLeft <= 5 && diagnosticSettings.答题时间 > 0 }">
            <el-icon><Timer /></el-icon>
            {{ diagnosticSettings.答题时间 === 0 ? '无限制' : timeLeft + 's' }}
          </div>
        </div>
      </div>

      <div class="diagnostic-content" v-if="currentQuestion">
        <div class="question-card">
          <div class="question-header">
            <h3>请选择汉字"{{ currentQuestion.question }}"的正确拼音</h3>
          </div>
          
          <div class="options-grid">
            <button 
              v-for="(option, index) in currentQuestion.options"
              :key="index"
              class="option-button"
              :class="{
                'selected': selectedAnswer === option,
                'correct': showAnswer && option === currentQuestion.correctAnswer,
                'incorrect': showAnswer && selectedAnswer === option && option !== currentQuestion.correctAnswer,
                'disabled': showAnswer
              }"
              @click="!showAnswer && selectAnswer(option)"
            >
              {{ option }}
              <el-icon v-if="showAnswer && option === currentQuestion.correctAnswer" class="result-icon">
                <Check />
              </el-icon>
              <el-icon v-if="showAnswer && selectedAnswer === option && option !== currentQuestion.correctAnswer" class="result-icon">
                <Close />
              </el-icon>
            </button>
          </div>
          
          <div class="question-info" v-if="currentQuestion.词语?.length">
            <p><strong>相关词语：</strong>{{ currentQuestion.词语.join('、') }}</p>
          </div>
          
          <!-- 诊断模式下的手动下一题按钮（错误时显示） -->
          <div v-if="showAnswer && !lastAnswerCorrect" class="diagnostic-next-actions">
            <el-button 
              type="primary" 
              size="large"
              @click="handleDiagnosticNextQuestion"
            >
              <el-icon><ArrowRight /></el-icon>
              {{ currentQuestionIndex < currentQuizQuestions.length - 1 ? '下一题' : '完成诊断' }}
            </el-button>
          </div>
        </div>
      </div>
    </div>

    <!-- 诊断结果阶段 -->
    <div v-else-if="currentPhase === 'diagnostic-result'" class="diagnostic-result-phase">
      <div class="learning-card results-card">
        <h2>📊 诊断完成！</h2>
        <p class="phase-description">分析完成，为你制定专属学习方案</p>
        
        <!-- 诊断统计 -->
        <div class="diagnostic-stats" v-if="diagnosticResult">
          <div class="stat-card correct">
            <div class="stat-icon">✅</div>
            <div class="stat-content">
              <div class="stat-number">{{ diagnosticResult.正确汉字.length }}</div>
              <div class="stat-label">已掌握</div>
            </div>
          </div>
          
          <div class="stat-card incorrect">
            <div class="stat-icon">❌</div>
            <div class="stat-content">
              <div class="stat-number">{{ diagnosticResult.错误汉字.length }}</div>
              <div class="stat-label">需学习</div>
            </div>
          </div>
          
          <div class="stat-card accuracy">
            <div class="stat-icon">📈</div>
            <div class="stat-content">
              <div class="stat-number">{{ diagnosticResult.正确率 }}%</div>
              <div class="stat-label">正确率</div>
            </div>
          </div>
          
          <div class="stat-card time">
            <div class="stat-icon">⏱️</div>
            <div class="stat-content">
              <div class="stat-number">{{ diagnosticResult.平均答题时间 }}s</div>
              <div class="stat-label">平均用时</div>
            </div>
          </div>
        </div>
        
        <!-- 学习建议 -->
        <div class="learning-suggestion" v-if="diagnosticResult">
          <h3>🎯 个性化学习建议</h3>
          <div class="suggestion-content">
            <div class="suggestion-item" v-if="diagnosticResult.错误汉字.length > 0">
              <el-icon class="suggestion-icon"><Star /></el-icon>
              <div>
                <p><strong>专项学习：</strong>需要学习 {{ diagnosticResult.错误汉字.length }} 个汉字</p>
                <p class="suggestion-desc">预计节省 {{ Math.round((diagnosticResult.正确汉字.length / diagnosticResult.总测试数) * 100) }}% 的学习时间</p>
              </div>
            </div>
            <div class="suggestion-item">
              <el-icon class="suggestion-icon"><Trophy /></el-icon>
              <div>
                <p><strong>学习策略：</strong>先学习错误汉字，再进行混合复习</p>
                <p class="suggestion-desc">巩固新学内容，加强记忆效果</p>
              </div>
            </div>
          </div>
        </div>
        
        <!-- 行动按钮 -->
        <div class="action-buttons">
          <el-button size="large" @click="resetDiagnostic">
            <el-icon><RefreshRight /></el-icon>
            重新诊断
          </el-button>
          <el-button 
            type="primary" 
            size="large" 
            @click="startDiagnosticLearning"
            :disabled="!diagnosticResult || diagnosticResult.错误汉字.length === 0"
          >
            <el-icon><Reading /></el-icon>
            开始专项学习 ({{ diagnosticResult?.错误汉字.length || 0 }}字)
          </el-button>
        </div>
      </div>
    </div>

    <!-- 基于诊断的学习阶段 -->
    <div v-else-if="currentPhase === 'diagnostic-learning'" class="diagnostic-learning-phase">
      <div class="learning-header">
        <div class="phase-indicator">
          <el-icon><Reading /></el-icon>
          <span>专项学习 - 基于诊断结果</span>
        </div>
        
        <div class="progress-info">
          <span>进度: {{ currentCharIndex + 1 }} / {{ currentLearningChars.length }}</span>
        </div>
      </div>

      <div class="learning-content" v-if="currentChar">
        <!-- 使用现有的学习卡片组件 -->
        <div class="character-card">
          <div class="char-number">{{ currentChar.序号 }}</div>
          <div class="char-display">{{ currentChar.汉字 }}</div>
          <div class="char-pinyin">{{ currentChar.拼音 }}</div>
          
          <div class="char-words">
            <h4>词语示例：</h4>
            <div class="words-list">
              <span v-for="word in getCharWords(currentChar)" :key="word" class="word-item">{{ word }}</span>
            </div>
          </div>
          
          <div class="learning-controls">
            <el-button @click="previousCharacter" :disabled="currentCharIndex === 0">
              <el-icon><ArrowLeft /></el-icon>
              上一个
            </el-button>
            <el-button type="primary" @click="nextCharacterOrFinish">
              <el-icon><ArrowRight /></el-icon>
              {{ currentCharIndex < currentLearningChars.length - 1 ? '下一个' : '开始复习' }}
            </el-button>
          </div>
        </div>
      </div>
    </div>

    <!-- 诊断式复习阶段 -->
    <div v-else-if="currentPhase === 'diagnostic-review'" class="diagnostic-review-phase">
      <div class="quiz-header">
        <div class="phase-indicator">
          <el-icon><Refresh /></el-icon>
          <span>诊断复习 - 巩固学习成果</span>
        </div>
        
        <div class="quiz-progress">
          <span>题目: {{ currentQuestionIndex + 1 }} / {{ currentQuizQuestions.length }}</span>
          <el-progress 
            :percentage="quizProgressPercentage" 
            :show-text="false"
            stroke-width="6"
          />
        </div>
        
        <div class="timer-section">
          <div class="timer-display" :class="{ warning: timeLeft <= 5 && diagnosticSettings.答题时间 > 0 }">
            <el-icon><Timer /></el-icon>
            {{ diagnosticSettings.答题时间 === 0 ? '无限制' : timeLeft + 's' }}
          </div>
        </div>
      </div>

      <div class="quiz-content" v-if="currentQuestion">
        <!-- 复用现有的测试组件 -->
        <div class="question-card">
          <div class="question-type">{{ currentQuestion.type }}</div>
          <div class="question-text">{{ currentQuestion.question }}</div>
          
          <div class="options-container">
            <button 
              v-for="(option, index) in currentQuestion.options"
              :key="index"
              class="option-button"
              :class="{
                'selected': selectedAnswer === option,
                'correct': showAnswer && option === currentQuestion.correctAnswer,
                'incorrect': showAnswer && selectedAnswer === option && option !== currentQuestion.correctAnswer,
                'disabled': showAnswer
              }"
              @click="!showAnswer && selectAnswer(option)"
            >
              {{ option }}
              <el-icon v-if="showAnswer && option === currentQuestion.correctAnswer" class="result-icon">
                <Check />
              </el-icon>
              <el-icon v-if="showAnswer && selectedAnswer === option && option !== currentQuestion.correctAnswer" class="result-icon">
                <Close />
              </el-icon>
            </button>
          </div>
          
          <div v-if="currentQuestion.词语?.length" class="question-words">
            <strong>词语：</strong>{{ currentQuestion.词语.join('、') }}
          </div>
          
          <!-- 诊断式复习模式下的手动下一题按钮（错误时显示） -->
          <div v-if="showAnswer && !lastAnswerCorrect" class="diagnostic-next-actions">
            <el-button 
              type="primary" 
              size="large"
              @click="handleDiagnosticNextQuestion"
            >
              <el-icon><ArrowRight /></el-icon>
              {{ currentQuestionIndex < currentQuizQuestions.length - 1 ? '下一题' : '完成复习' }}
            </el-button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { useLearningStore } from '@/stores/learning'
import { ElMessage } from 'element-plus'
import { Check, Close } from '@element-plus/icons-vue'
import type { LearningSettings, HanziData } from '@/types'

const router = useRouter()
const learningStore = useLearningStore()

// 临时设置 - 初始化为空，在onMounted中同步
const tempSettings = ref<LearningSettings>({
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

// 检查状态
const selectedAnswer = ref('')
const showAnswer = ref(false)
const lastAnswerCorrect = ref(false)
const answerStartTime = ref(0)

// 倒计时
const countdown = ref(0)
const countdownTimer = ref<number | undefined>(undefined)

// 计算属性
const currentPhase = computed(() => learningStore.currentPhase)
const settings = computed(() => learningStore.settings)
const currentChar = computed(() => learningStore.currentChar)
const currentCharIndex = computed(() => learningStore.currentCharIndex)
const currentLearningChars = computed(() => learningStore.currentLearningChars)
const currentQuestion = computed(() => learningStore.currentQuestion)
const currentQuestionIndex = computed(() => learningStore.currentQuestionIndex)
const currentQuizQuestions = computed(() => learningStore.currentQuizQuestions)
const quizResults = computed(() => learningStore.quizResults)
const learningProgress = computed(() => learningStore.learningProgress)
const quizProgress = computed(() => learningStore.quizProgress)

// 诊断相关计算属性
const diagnosticResult = computed(() => learningStore.diagnosticResult)
const diagnosticSettings = computed(() => learningStore.diagnosticSettings)

// 设置阶段计算属性
const newCharsCount = computed(() => {
  return learningStore.hanziData.filter(char => 
    !learningStore.learningRecords.has(char.汉字) && 
    char.序号 >= (tempSettings.value.起始序号 || 1)
  ).length
})

// 错字本汉字计数
const errorBookCount = computed(() => {
  return learningStore.errorBook.size
})

const selectedCharsCount = computed(() => {
  const range = tempSettings.value.学习范围
  
  if (range === '全新汉字') {
    const available = newCharsCount.value
    return Math.min(tempSettings.value.学习数量, available)
  } else if (range === '错字本') {
    const available = errorBookCount.value
    return Math.min(tempSettings.value.学习数量, available)
  } else if (range === '自定义范围') {
    const 起始 = tempSettings.value.起始序号 || 1
    const 结束 = tempSettings.value.结束序号 || 2525
    const 范围内汉字数 = Math.max(0, 结束 - 起始 + 1)
    return Math.min(tempSettings.value.学习数量, 范围内汉字数)
  }
  
  return 0
})

const canStartLearning = computed(() => {
  return selectedCharsCount.value > 0
})



// 收藏状态
const isCurrentCharFavorite = computed(() => {
  if (!currentChar.value) return false
  return learningStore.isFavorite(currentChar.value.汉字)
})

// 复习模式判断
const isReviewMode = computed(() => {
  const range = settings.value.学习范围
  return range === '需要复习' || range === '顺序复习' || range === '随机复习'
})

const reviewModeDescription = computed(() => {
  const range = settings.value.学习范围
  if (range === '需要复习') {
    return '正在复习需要加强的汉字，直接进入测试环节'
  } else if (range === '顺序复习') {
    return '正在按学习时间顺序复习已学汉字，直接进入测试环节'
  } else if (range === '随机复习') {
    return '正在随机复习已学汉字，直接进入测试环节'
  }
  return ''
})

// 检查进度百分比
const quizProgressPercentage = computed(() => {
  if (currentQuizQuestions.value.length === 0) return 0
  return Math.round(((currentQuestionIndex.value + 1) / currentQuizQuestions.value.length) * 100)
})

// 倒计时相关
const countdownPercentage = computed(() => {
  if (settings.value.倒计时秒数 === 0) return 100
  return Math.round((countdown.value / settings.value.倒计时秒数) * 100)
})

const countdownColor = computed(() => {
  const percentage = countdownPercentage.value
  if (percentage > 60) return '#67C23A'
  if (percentage > 30) return '#E6A23C'
  return '#F56C6C'
})

// 结果统计
const correctAnswers = computed(() => {
  return quizResults.value.filter(result => result.isCorrect).length
})

const sessionAccuracy = computed(() => {
  if (quizResults.value.length === 0) return 0
  return Math.round((correctAnswers.value / quizResults.value.length) * 100)
})

const averageTime = computed(() => {
  if (quizResults.value.length === 0) return 0
  const totalTime = quizResults.value.reduce((sum, result) => sum + result.timeSpent, 0)
  return Math.round(totalTime / quizResults.value.length)
})

const wrongAnswers = computed(() => {
  return quizResults.value
    .filter(result => !result.isCorrect)
    .map(result => {
      // 尝试从题目列表中找到对应题目
      const question = currentQuizQuestions.value.find(q => q.id === result.questionId)
      
      // 如果找到题目，使用题目描述；否则根据存储的信息构建题目描述
      let questionText = ''
      if (question?.question) {
        questionText = question.question
      } else if (result.character) {
        // 根据答案类型判断题目类型
        const isHanziAnswer = /^[\u4e00-\u9fff]$/.test(result.correctAnswer)
        if (isHanziAnswer) {
          // 正确答案是汉字，说明题目是 拼音选汉字
          questionText = `选择拼音对应的汉字： ${result.character}`
        } else {
          // 正确答案是拼音，说明题目是 汉字选拼音  
          questionText = `选择汉字"${result.character}"的正确拼音：`
        }
      } else {
        questionText = '题目信息缺失'
      }
      
      return {
        questionId: result.questionId,
        question: questionText,
        userAnswer: result.userAnswer,
        correctAnswer: result.correctAnswer,
        character: result.character || '' // 添加字符信息方便显示
      }
    })
})

const sessionSuggestions = computed(() => {
  const suggestions = []
  const accuracy = sessionAccuracy.value
  
  if (accuracy >= 90) {
    suggestions.push({
      type: 'success',
      title: '表现优秀！',
      description: '你的正确率很高，可以尝试增加学习数量或学习新的汉字。'
    })
  } else if (accuracy >= 70) {
    suggestions.push({
      type: 'info',
      title: '不错的表现',
      description: '继续保持，可以多复习错误的汉字。'
    })
  } else {
    suggestions.push({
      type: 'warning',
      title: '需要加强练习',
      description: '建议减少每次学习的汉字数量，重点复习基础汉字。'
    })
  }
  
  if (wrongAnswers.value.length > 0) {
    suggestions.push({
      type: 'info',
      title: '重点复习',
      description: `有 ${wrongAnswers.value.length} 个汉字需要重点复习，系统会在下次学习中优先安排。`
    })
  }
  
  return suggestions
})

// 方法
const getCharWords = (char: HanziData): string[] => {
  return [char.词语1, char.词语2, char.词语3].filter(word => word && word.trim())
}

const startLearning = () => {
  learningStore.updateSettings(tempSettings.value)
  learningStore.startLearningSession()
  ElMessage.success('开始学习！')
}

const startNewLearning = () => {
  // 设置为学习新汉字模式，使用当前的学习数量设置
  tempSettings.value.学习范围 = '全新汉字'
  learningStore.updateSettings(tempSettings.value)
  learningStore.startLearningSession()
  ElMessage.success('开始学习新汉字！')
}

const nextCharacter = () => {
  learningStore.nextCharacter()
}

const previousCharacter = () => {
  learningStore.previousCharacter()
}

const markAsFavorite = () => {
  if (currentChar.value) {
    const isFavorited = learningStore.toggleFavorite(currentChar.value.汉字)
    if (isFavorited) {
      ElMessage.success(`已收藏汉字"${currentChar.value.汉字}"`)
    } else {
      ElMessage.info(`已取消收藏汉字"${currentChar.value.汉字}"`)
    }
  }
}

const selectAnswer = (answer: string) => {
  const phase = currentPhase.value
  
  // 诊断模式：直接提交答案
  if (phase === 'diagnostic' || phase === 'diagnostic-review') {
    if (timer.value) {
      clearInterval(timer.value)
    }
    handleDiagnosticAnswer(answer)
    return
  }
  
  // 传统模式：设置选择的答案，等待提交
  if (showAnswer.value) return
  selectedAnswer.value = answer
}

const submitAnswer = () => {
  if (!selectedAnswer.value || !currentQuestion.value) return
  
  const timeSpent = Date.now() - answerStartTime.value
  const isCorrect = selectedAnswer.value === currentQuestion.value.correctAnswer
  
  learningStore.submitAnswer(selectedAnswer.value, Math.round(timeSpent / 1000))
  
  lastAnswerCorrect.value = isCorrect
  showAnswer.value = true
  
  // 停止倒计时
  if (countdownTimer.value) {
    clearInterval(countdownTimer.value)
  }
  
  ElMessage({
    type: isCorrect ? 'success' : 'error',
    message: isCorrect ? '回答正确！' : '回答错误'
  })
  
  // 如果答题正确，2秒后自动跳到下一题
  if (isCorrect) {
    setTimeout(() => {
      if (showAnswer.value) { // 确保还在显示答案状态，防止用户已经手动点击了下一题
        nextQuestion()
      }
    }, 2000)
  }
}

const nextQuestion = () => {
  selectedAnswer.value = ''
  showAnswer.value = false
  learningStore.nextQuestion()
  
  // 重置倒计时
  if (settings.value.倒计时秒数 > 0) {
    startCountdown()
  }
}

const startCountdown = () => {
  countdown.value = settings.value.倒计时秒数
  answerStartTime.value = Date.now()
  
  countdownTimer.value = setInterval(() => {
    countdown.value--
    if (countdown.value <= 0) {
      if (countdownTimer.value) clearInterval(countdownTimer.value)
      if (!showAnswer.value) {
        // 时间到，自动提交
        if (selectedAnswer.value) {
          submitAnswer()
        } else {
          // 没有选择答案，自动选择第一个选项
          selectedAnswer.value = currentQuestion.value?.options[0] || ''
          submitAnswer()
        }
      }
    }
  }, 1000) as unknown as number
}

const restartLearning = () => {
  learningStore.resetSession()
}

const continueNewSession = () => {
  learningStore.resetSession()
  // 保持当前设置，重新开始
}

const restartLearningWithOriginalStart = () => {
  // 获取当前学习会话的第一个汉字的序号
  const firstCharStartIndex = currentLearningChars.value.length > 0 
    ? currentLearningChars.value[0].序号 
    : tempSettings.value.起始序号
  
  // 重置到设置阶段
  learningStore.resetSession()
  
  // 保持原始起始序号，允许用户重新配置其他参数
  tempSettings.value.起始序号 = firstCharStartIndex
  
  ElMessage.success(`已重置到设置阶段，起始序号保持为第${firstCharStartIndex}字`)
}

const restartQuiz = () => {
  // 重新生成检查题目（会自动重置currentQuestionIndex为0）
  learningStore.generateQuizQuestions()
  
  // 重置检查状态
  selectedAnswer.value = ''
  showAnswer.value = false
  
  // 重置倒计时
  if (settings.value.倒计时秒数 > 0) {
    startCountdown()
  }
  
  ElMessage.success('已重新生成检查题目，可以重新开始检查！')
}

// 监听问题变化，重置状态
watch(currentQuestion, (newQuestion) => {
  if (newQuestion && currentPhase.value === 'quiz') {
    selectedAnswer.value = ''
    showAnswer.value = false
    
    if (settings.value.倒计时秒数 > 0) {
      startCountdown()
    } else {
      answerStartTime.value = Date.now()
    }
  }
})

// 组件卸载时清理定时器
onUnmounted(() => {
  // 组件销毁时清除所有计时器
  if (countdownTimer.value) {
    clearInterval(countdownTimer.value)
  }
  if (timer.value) {
    clearInterval(timer.value)
  }
})

// 初始化
// 同步tempSettings与store settings
const syncTempSettings = () => {
  Object.assign(tempSettings.value, learningStore.settings)
}

// 防止循环更新的标志
const isUpdatingTempSettings = ref(false)

// 监听tempSettings变化，同步到store
watch(tempSettings, (newSettings) => {
  if (!isUpdatingTempSettings.value) {
    learningStore.updateSettings(newSettings)
  }
}, { deep: true })

// 监听store settings变化，同步到tempSettings
watch(() => learningStore.settings, () => {
  isUpdatingTempSettings.value = true
  syncTempSettings()
  nextTick(() => {
    isUpdatingTempSettings.value = false
  })
}, { deep: true, immediate: true })

// === 诊断相关方法 ===

// 开始诊断
const startDiagnostic = () => {
  learningStore.startDiagnosticSession()
  startTimer()
}

// 重置诊断
const resetDiagnostic = () => {
  learningStore.resetDiagnosticSession()
  router.push('/')
}

// 开始基于诊断的学习
const startDiagnosticLearning = () => {
  learningStore.startDiagnosticBasedLearning()
}

// 诊断式学习中的下一个汉字或完成
const nextCharacterOrFinish = () => {
  if (currentCharIndex.value < currentLearningChars.value.length - 1) {
    learningStore.nextCharacter()
  } else {
    // 学习完成，开始复习
    learningStore.generateDiagnosticReview()
    startTimer()
  }
}

// 定时器相关（统一管理所有计时功能）
const timeLeft = ref(0)
const timer = ref<number | undefined>(undefined)

const startTimer = () => {
  const phase = currentPhase.value
  let duration = 30 // 默认30秒
  
  if (phase === 'diagnostic' || phase === 'diagnostic-review') {
    duration = diagnosticSettings.value.答题时间
  } else if (phase === 'quiz') {
    duration = settings.value.倒计时秒数
  }
  
  timeLeft.value = duration
  
  if (timer.value) {
    clearInterval(timer.value)
  }
  
  // 如果时间为0（无限制），则不启动计时器
  if (duration === 0) {
    return
  }
  
  timer.value = setInterval(() => {
    if (timeLeft.value > 0) {
      timeLeft.value--
    } else {
      handleTimeout()
    }
  }, 1000) as unknown as number
}

const handleTimeout = () => {
  if (timer.value) {
    clearInterval(timer.value)
  }
  
  const phase = currentPhase.value
  // 诊断模式：自动提交空答案
  if (phase === 'diagnostic' || phase === 'diagnostic-review') {
    handleDiagnosticAnswer('')
  } else {
    // 传统模式：自动提交当前选择
    if (selectedAnswer.value) {
      submitAnswer()
    } else {
      // 如果没有选择，跳过这题
      nextQuestion()
    }
  }
}

// 诊断模式的选择答案处理
const handleDiagnosticAnswer = (answer: string) => {
  const phase = currentPhase.value
  const startTime = answerStartTime.value
  const timeSpent = startTime ? (Date.now() - startTime) / 1000 : (diagnosticSettings.value.答题时间 - timeLeft.value)
  const isCorrect = answer === currentQuestion.value?.correctAnswer
  
  learningStore.submitAnswer(answer, timeSpent)
  
  // 显示答题结果
  selectedAnswer.value = answer
  showAnswer.value = true
  lastAnswerCorrect.value = isCorrect
  
  // 显示结果消息
  ElMessage({
    type: isCorrect ? 'success' : 'error',
    message: isCorrect ? '✅ 回答正确！' : `❌ 回答错误，正确答案是：${currentQuestion.value?.correctAnswer}`,
    duration: isCorrect ? 1500 : 3500
  })
  
  // 如果答题正确，2秒后自动跳到下一题；如果错误，需要手动点击
  if (isCorrect) {
  setTimeout(() => {
      if (showAnswer.value) { // 确保还在显示答案状态
    showAnswer.value = false
    selectedAnswer.value = ''
    
    if (phase === 'diagnostic') {
      // 诊断阶段：进入下一题或完成诊断
      if (currentQuestionIndex.value < currentQuizQuestions.value.length - 1) {
        learningStore.nextQuestion()
        answerStartTime.value = Date.now()
        startTimer()
      } else {
        // 诊断完成，分析结果
        learningStore.completeDiagnosticAnalysis()
      }
    } else if (phase === 'diagnostic-review') {
      // 诊断复习阶段
      if (currentQuestionIndex.value < currentQuizQuestions.value.length - 1) {
        learningStore.nextQuestion()
        answerStartTime.value = Date.now()
        startTimer()
      } else {
        // 复习完成，显示统计
        learningStore.currentPhase = 'statistics'
      }
    }
      }
    }, 2000) // 正确答案2秒后自动跳转
  }
  // 错误答案不自动跳转，需要用户手动点击下一题
}

// 诊断模式手动下一题
const handleDiagnosticNextQuestion = () => {
  const phase = currentPhase.value
  
  showAnswer.value = false
  selectedAnswer.value = ''
  
  if (phase === 'diagnostic') {
    // 诊断阶段：进入下一题或完成诊断
    if (currentQuestionIndex.value < currentQuizQuestions.value.length - 1) {
      learningStore.nextQuestion()
      answerStartTime.value = Date.now()
      startTimer()
    } else {
      // 诊断完成，分析结果
      learningStore.completeDiagnosticAnalysis()
    }
  } else if (phase === 'diagnostic-review') {
    // 诊断复习阶段
    if (currentQuestionIndex.value < currentQuizQuestions.value.length - 1) {
      learningStore.nextQuestion()
      answerStartTime.value = Date.now()
      startTimer()
    } else {
      // 复习完成，显示统计
      learningStore.currentPhase = 'statistics'
    }
  }
}

// 返回首页
const backToHome = () => {
  learningStore.resetSession()
  router.push('/')
}

onMounted(() => {
  // 确保tempSettings与store同步
  syncTempSettings()
  
  // 根据学习模式处理
  const phase = currentPhase.value
  if (phase === 'diagnostic' || phase === 'diagnostic-review') {
    answerStartTime.value = Date.now()
    startTimer()
  } else if (phase !== 'settings' && phase !== 'learning' && 
      phase !== 'quiz' && phase !== 'statistics' &&
      phase !== 'diagnostic-settings' && phase !== 'diagnostic-result' && 
      phase !== 'diagnostic-learning') {
    learningStore.resetSession()
  }
})
</script>

<style lang="scss" scoped>
.learning-container {
  max-width: 1000px;
  margin: 0 auto;
  padding: 20px;
}

.progress-header {
  margin-bottom: 20px;
  
  .progress-info {
    display: flex;
    justify-content: space-between;
    margin-top: 8px;
    font-size: 14px;
    color: #666;
  }
}

// 设置阶段样式
.settings-card {
  padding: 40px;
  max-width: 800px;
  margin: 0 auto;
  
  h2 {
    text-align: center;
    color: #409EFF;
    margin-bottom: 16px;
  }
  
  .phase-description {
    text-align: center;
    color: #666;
    margin-bottom: 30px;
  }
  
  .form-tip {
    font-size: 12px;
    color: #999;
    margin-left: 10px;
  }
  
  .settings-actions {
    display: flex;
    justify-content: center;
    gap: 20px;
    margin-top: 40px;
  }
}

// 学习阶段样式
.main-learning-card {
  padding: 40px;
  text-align: center;
  
  .char-main {
    margin-bottom: 40px;
    
    .char-number {
      font-size: 16px;
      color: #999;
      margin-bottom: 10px;
      font-weight: 500;
      letter-spacing: 1px;
    }
    
    .char-text {
      font-size: 120px;
      font-weight: 600;
      color: #333;
      margin-bottom: 20px;
      text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.1);
    }
    
    .char-pinyin {
      font-size: 32px;
      color: #409EFF;
      font-weight: 500;
    }
  }
  
  .char-words {
    margin-bottom: 40px;
    
    h4 {
      font-size: 18px;
      color: #333;
      margin-bottom: 16px;
    }
    
    .words-list {
      display: flex;
      justify-content: center;
      gap: 12px;
      flex-wrap: wrap;
      
      .word-tag {
        font-size: 16px;
        padding: 8px 16px;
      }
    }
  }
  
  .learning-actions {
    display: flex;
    justify-content: center;
    gap: 16px;
    flex-wrap: wrap;
    
    .el-button {
      min-width: 120px;
      height: 48px;
      font-size: 16px;
      border-radius: 24px;
      font-weight: 500;
      transition: all 0.3s ease;
      
      &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
      
      &.el-button--warning {
        background: linear-gradient(135deg, #FFC107, #FF9800);
        border: none;
        color: white;
        
        &:hover:not(:disabled) {
          background: linear-gradient(135deg, #FFB300, #F57C00);
          transform: translateY(-1px);
        }
      }
      
      &.el-button--primary {
        background: linear-gradient(135deg, #409EFF, #2E7CE0);
        border: none;
        
        &:hover:not(:disabled) {
          background: linear-gradient(135deg, #2E7CE0, #1D5FB8);
          transform: translateY(-1px);
        }
      }
      
      &.el-button--default {
        &:hover:not(:disabled) {
          transform: translateY(-1px);
        }
      }
    }
  }
  
  .learning-controls {
    display: flex;
    justify-content: center;
    gap: 16px;
    margin-top: 20px;
    padding: 20px 0;
    border-top: 1px solid #e4e7ed;
    
    .el-button {
      min-width: 140px;
      height: 44px;
      font-size: 15px;
      border-radius: 22px;
      font-weight: 500;
      transition: all 0.3s ease;
      
      &.el-button--warning {
        background: linear-gradient(135deg, #E6A23C, #D4921A);
        border: none;
        color: white;
        
        &:hover {
          background: linear-gradient(135deg, #D4921A, #C4811A);
          transform: translateY(-1px);
        }
      }
      
      &.el-button--default {
        &:hover {
          transform: translateY(-1px);
        }
      }
    }
  }
}

// 检查阶段样式
.quiz-phase {
  .quiz-controls {
    display: flex;
    justify-content: center;
    gap: 12px;
    margin-top: 20px;
    padding: 20px 0;
    border-top: 1px solid #e4e7ed;
    flex-wrap: wrap;
    
    .el-button {
      min-width: 130px;
      height: 42px;
      font-size: 14px;
      border-radius: 21px;
      font-weight: 500;
      transition: all 0.3s ease;
      
      &.el-button--info {
        background: linear-gradient(135deg, #909399, #73767A);
        border: none;
        color: white;
        
        &:hover {
          background: linear-gradient(135deg, #73767A, #606266);
          transform: translateY(-1px);
        }
      }
      
      &.el-button--warning {
        background: linear-gradient(135deg, #E6A23C, #D4921A);
        border: none;
        color: white;
        
        &:hover {
          background: linear-gradient(135deg, #D4921A, #C4811A);
          transform: translateY(-1px);
        }
      }
      
      &.el-button--default {
        &:hover {
          transform: translateY(-1px);
        }
      }
    }
  }
}

// 错误提示样式
.no-questions-error {
  text-align: center;
  padding: 40px 20px;
  
  .el-alert {
    margin-bottom: 20px;
  }
}

// 复习模式提示样式
.review-mode-tip {
  margin-bottom: 20px;
  
  .el-alert {
    border-radius: 12px;
  }
}

// 检查阶段样式
.quiz-card {
  padding: 40px;
  
  .question-type {
    text-align: center;
    margin-bottom: 20px;
  }
  
  .countdown {
    text-align: center;
    margin-bottom: 20px;
    
    .countdown-text {
      font-size: 14px;
      font-weight: 600;
    }
  }
  
  .question-content {
    text-align: center;
    margin-bottom: 30px;
    
    .question-number {
      font-size: 14px;
      color: #999;
      margin-bottom: 10px;
      font-weight: 500;
      letter-spacing: 1px;
    }
    
    h3 {
      font-size: 48px;
      color: #333;
      margin-bottom: 16px;
      font-weight: 600;
    }
    
    .question-words {
      font-size: 16px;
      color: #666;
    }
  }
  
  .options-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 16px;
    margin-bottom: 30px;
    
    .option-button {
      height: 80px;
      font-size: 24px;
      font-weight: 500;
      border: 2px solid #e0e0e0;
      background: white;
      transition: all 0.3s ease;
      
      &:hover {
        border-color: #409EFF;
        background: rgba(64, 158, 255, 0.05);
      }
      
      &.selected {
        border-color: #409EFF;
        background: rgba(64, 158, 255, 0.1);
        color: #409EFF;
      }
      
      &.correct {
        border-color: #67C23A;
        background: rgba(103, 194, 58, 0.1);
        color: #67C23A;
      }
      
      &.wrong {
        border-color: #F56C6C;
        background: rgba(245, 108, 108, 0.1);
        color: #F56C6C;
      }
    }
  }
  
  .answer-explanation {
    margin-bottom: 30px;
  }
  
  .quiz-actions {
    text-align: center;
  }
}

// 统计结果样式
.results-card {
  padding: 40px;
  text-align: center;
  
  h2 {
    color: #67C23A;
    margin-bottom: 16px;
  }
  
  .phase-description {
    color: #666;
    margin-bottom: 40px;
  }
}

.results-summary {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 20px;
  margin-bottom: 40px;
  
  .summary-item {
    padding: 24px;
    background: rgba(64, 158, 255, 0.05);
    border-radius: 12px;
    border: 1px solid rgba(64, 158, 255, 0.1);
    
    .summary-icon {
      font-size: 32px;
      margin-bottom: 12px;
    }
    
    .summary-number {
      font-size: 28px;
      font-weight: 700;
      color: #409EFF;
      margin-bottom: 8px;
    }
    
    .summary-label {
      font-size: 14px;
      color: #666;
    }
  }
}

.wrong-answers-section, .learning-suggestions {
  text-align: left;
  margin-bottom: 30px;
  
  h3 {
    color: #333;
    margin-bottom: 16px;
  }
}

.wrong-answers-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  
  .wrong-answer-item {
    padding: 16px;
    background: rgba(245, 108, 108, 0.05);
    border-radius: 8px;
    border-left: 4px solid #F56C6C;
      
      .wrong-character {
        display: flex;
        justify-content: center;
        margin-bottom: 12px;
        
        .character-display {
          font-size: 24px;
          font-weight: bold;
          color: #333;
          padding: 8px 12px;
          background: rgba(255, 255, 255, 0.8);
          border-radius: 6px;
          border: 2px solid #E6E8EB;
        }
      }
    
    .wrong-question {
        font-size: 16px;
        font-weight: 500;
        margin-bottom: 12px;
        color: #666;
        text-align: center;
    }
    
    .wrong-details {
        .answer-comparison {
      display: flex;
          flex-direction: column;
          gap: 8px;
          
          .your-answer, .correct-answer {
            display: flex;
            align-items: center;
            gap: 6px;
            padding: 8px 12px;
            border-radius: 6px;
      font-size: 14px;
            font-weight: 500;
          }
      
      .your-answer {
            background: rgba(245, 108, 108, 0.1);
        color: #F56C6C;
            border: 1px solid rgba(245, 108, 108, 0.3);
      }
      
      .correct-answer {
            background: rgba(103, 194, 58, 0.1);
        color: #67C23A;
            border: 1px solid rgba(103, 194, 58, 0.3);
          }
      }
    }
  }
}

.suggestions {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.results-actions {
  display: flex;
  justify-content: center;
  gap: 20px;
  margin-top: 40px;
}

@media (max-width: 768px) {
  .learning-container {
    padding: 10px;
  }
  
  .settings-card, .main-learning-card, .quiz-card, .results-card {
    padding: 20px;
  }
  
  .char-text {
    font-size: 80px !important;
  }
  
  .char-number {
    font-size: 14px !important;
  }
  
  .question-content h3 {
    font-size: 32px !important;
  }
  
  .question-number {
    font-size: 12px !important;
  }
  
  .options-grid {
    grid-template-columns: 1fr;
    
    .option-button {
      height: 60px;
      font-size: 18px;
    }
  }
  
  .results-summary {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .results-actions, .settings-actions, .learning-actions {
    flex-direction: column;
    
    .el-button {
      width: 100%;
      min-width: auto;
    }
  }
}

// === 诊断相关样式 ===

.diagnostic-next-actions {
  margin-top: 24px;
  padding-top: 16px;
  border-top: 1px solid #eee;
  text-align: center;

  .el-button {
    padding: 12px 24px;
    font-size: 16px;
    font-weight: 500;
  }
}

.diagnostic-settings-phase, .diagnostic-result-phase {
  .settings-card, .results-card {
    max-width: 800px;
    margin: 0 auto;
    padding: 40px;
    text-align: center;
  }

  .range-inputs {
    display: flex;
    align-items: center;
    gap: 16px;
    justify-content: center;

    .range-separator {
      color: #666;
      font-weight: 500;
    }
  }

  .diagnostic-preview {
    background: #f8f9fa;
    border-radius: 12px;
    padding: 24px;
    margin: 30px 0;
    text-align: left;

    h3 {
      color: #409EFF;
      margin-bottom: 16px;
      text-align: center;
    }

    ul {
      list-style: none;
      padding: 0;
      margin: 0;

      li {
        padding: 8px 0;
        color: #666;
        font-size: 15px;
        line-height: 1.6;
      }
    }
  }
}

.diagnostic-phase, .diagnostic-review-phase {
  .diagnostic-header, .quiz-header {
    background: white;
    border-radius: 16px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
    padding: 24px;
    margin-bottom: 24px;
    display: flex;
    justify-content: space-between;
    align-items: center;

    .progress-section, .quiz-progress {
      flex: 1;

      .progress-text {
        color: #409EFF;
        font-weight: 600;
        margin-bottom: 8px;
        font-size: 16px;
      }
    }

    .timer-section {
      .timer-display {
        background: #409EFF;
        color: white;
        padding: 12px 20px;
        border-radius: 25px;
        font-size: 18px;
        font-weight: bold;
        display: flex;
        align-items: center;
        gap: 8px;
        min-width: 80px;
        justify-content: center;

        &.warning {
          background: #F56C6C;
          animation: pulse 1s infinite;
        }
      }
    }
  }

  .diagnostic-content, .quiz-content {
    .question-card {
      background: white;
      border-radius: 16px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
      padding: 40px;
      text-align: center;

      .question-header h3 {
        color: #333;
        font-size: 28px;
        font-weight: 600;
        margin-bottom: 40px;
      }

      .question-type {
        background: #409EFF;
        color: white;
        padding: 8px 16px;
        border-radius: 20px;
        font-size: 14px;
        font-weight: 500;
        display: inline-block;
        margin-bottom: 20px;
      }

      .question-text {
        font-size: 36px;
        color: #333;
        margin-bottom: 32px;
        font-weight: bold;
      }

      .options-grid, .options-container {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 16px;
        margin-bottom: 30px;

        .option-button {
          background: #f8f9fa;
          border: 2px solid #e9ecef;
          border-radius: 12px;
          padding: 20px 16px;
          font-size: 18px;
          cursor: pointer;
          transition: all 0.3s ease;
          color: #333;
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;

          &:hover:not(.disabled) {
            background: #409EFF;
            border-color: #409EFF;
            color: white;
            transform: translateY(-2px);
            box-shadow: 0 8px 20px rgba(64, 158, 255, 0.3);
          }

          &:active:not(.disabled) {
            transform: translateY(0);
          }

          &.selected:not(.correct):not(.incorrect) {
            background: #409EFF;
            border-color: #409EFF;
            color: white;
          }

          &.correct {
            background: #f0f9ff;
            border-color: #67C23A;
            color: #67C23A;
            font-weight: bold;
            
            .result-icon {
              color: #67C23A;
              font-size: 20px;
            }
          }

          &.incorrect {
            background: #fef2f2;
            border-color: #F56C6C;
            color: #F56C6C;
            font-weight: bold;
            
            .result-icon {
              color: #F56C6C;
              font-size: 20px;
            }
          }

          &.disabled {
            cursor: not-allowed;
            opacity: 0.8;
          }

          .result-icon {
            font-size: 18px;
            font-weight: bold;
          }
        }
      }

      .question-info, .question-words {
        color: #666;
        font-size: 14px;
        padding: 16px;
        background: rgba(64, 158, 255, 0.1);
        border-radius: 8px;
      }
    }
  }
}

.diagnostic-result-phase {
  .diagnostic-stats {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
    gap: 20px;
    margin: 30px 0;

    .stat-card {
      background: white;
      border-radius: 16px;
      padding: 24px;
      text-align: center;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
      border: 2px solid transparent;
      transition: all 0.3s ease;

      &.correct {
        border-color: #67C23A;
        .stat-icon { color: #67C23A; }
      }

      &.incorrect {
        border-color: #F56C6C;
        .stat-icon { color: #F56C6C; }
      }

      &.accuracy {
        border-color: #409EFF;
        .stat-icon { color: #409EFF; }
      }

      &.time {
        border-color: #E6A23C;
        .stat-icon { color: #E6A23C; }
      }

      .stat-icon {
        font-size: 32px;
        margin-bottom: 12px;
        display: block;
      }

      .stat-number {
        font-size: 28px;
        font-weight: bold;
        color: #333;
        margin-bottom: 4px;
      }

      .stat-label {
        color: #666;
        font-size: 14px;
      }
    }
  }

  .learning-suggestion {
    background: #f8f9fa;
    border-radius: 16px;
    padding: 30px;
    margin: 30px 0;
    text-align: left;

    h3 {
      color: #409EFF;
      margin-bottom: 20px;
      text-align: center;
    }

    .suggestion-content {
      .suggestion-item {
        display: flex;
        align-items: flex-start;
        gap: 16px;
        padding: 16px 0;
        border-bottom: 1px solid #e9ecef;

        &:last-child {
          border-bottom: none;
        }

        .suggestion-icon {
          color: #409EFF;
          font-size: 20px;
          margin-top: 2px;
        }

        p {
          margin: 0 0 8px 0;
          color: #333;

          &.suggestion-desc {
            color: #666;
            font-size: 14px;
            margin: 4px 0 0 0;
          }
        }
      }
    }
  }
}

.diagnostic-learning-phase {
  .learning-header {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    border-radius: 16px;
    padding: 24px;
    margin-bottom: 24px;
    display: flex;
    justify-content: space-between;
    align-items: center;

    .phase-indicator {
      display: flex;
      align-items: center;
      gap: 12px;
      font-size: 18px;
      font-weight: 600;
    }

    .progress-info {
      background: rgba(255, 255, 255, 0.2);
      padding: 8px 16px;
      border-radius: 20px;
      font-weight: 500;
    }
  }

  .character-card {
    background: white;
    border-radius: 20px;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
    padding: 50px;
    text-align: center;
    max-width: 600px;
    margin: 0 auto;

    .char-number {
      background: #409EFF;
      color: white;
      width: 60px;
      height: 60px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 20px;
      font-weight: bold;
      margin: 0 auto 20px;
    }

    .char-display {
      font-size: 120px;
      color: #333;
      margin-bottom: 20px;
      font-weight: bold;
    }

    .char-pinyin {
      font-size: 36px;
      color: #409EFF;
      margin-bottom: 30px;
      font-weight: 600;
    }

    .char-words {
      margin-bottom: 40px;

      h4 {
        color: #333;
        margin-bottom: 16px;
        font-size: 18px;
      }

      .words-list {
        display: flex;
        flex-wrap: wrap;
        gap: 12px;
        justify-content: center;

        .word-item {
          background: #f8f9fa;
          padding: 8px 16px;
          border-radius: 20px;
          color: #333;
          border: 1px solid #e9ecef;
        }
      }
    }

    .learning-controls {
      display: flex;
      gap: 16px;
      justify-content: center;

      .el-button {
        padding: 12px 24px;
        font-size: 16px;
      }
    }
  }
}

@keyframes pulse {
  0% { transform: scale(1); }
  50% { transform: scale(1.05); }
  100% { transform: scale(1); }
}

@media (max-width: 768px) {
  .diagnostic-phase, .diagnostic-review-phase {
    .diagnostic-header, .quiz-header {
      flex-direction: column;
      gap: 16px;
    }

    .diagnostic-content, .quiz-content {
      .question-card {
        padding: 24px;

        .question-header h3 {
          font-size: 22px;
        }

        .options-grid, .options-container {
          grid-template-columns: 1fr;
          gap: 12px;
        }
      }
    }
  }

  .diagnostic-result-phase {
    .diagnostic-stats {
      grid-template-columns: repeat(2, 1fr);
    }
  }

  .diagnostic-learning-phase {
    .character-card {
      padding: 30px 20px;

      .char-display {
        font-size: 80px;
      }

      .char-pinyin {
        font-size: 28px;
      }
    }
  }
}
</style> 