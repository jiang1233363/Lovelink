<template>
  <div class="qa-page">
    <div class="header">
      <button class="back-btn" @click="$router.back()">← 返回</button>
      <h1>情侣问答</h1>
      <button class="add-qa-btn" @click="showEditor = true">+ 新问题</button>
    </div>
    
    <div class="content">
      <!-- 问答编辑器 -->
      <div v-if="showEditor" class="qa-editor">
        <h3>添加新问题</h3>
        
        <textarea 
          v-model="newQuestion" 
          class="question-input"
          placeholder="输入问题..."
          rows="3"
        ></textarea>
        
        <div class="editor-actions">
          <button class="save-qa-btn" @click="saveQuestion">保存</button>
          <button class="cancel-btn" @click="cancelEdit">取消</button>
        </div>
      </div>
      
      <!-- 统计卡片 -->
      <div class="stats-card">
        <div class="stat-item">
          <div class="stat-value">{{ qas.length }}</div>
          <div class="stat-label">问题总数</div>
        </div>
        <div class="stat-item">
          <div class="stat-value">{{ answeredCount }}</div>
          <div class="stat-label">已回答</div>
        </div>
        <div class="stat-item">
          <div class="stat-value">{{ qas.length - answeredCount }}</div>
          <div class="stat-label">待回答</div>
        </div>
      </div>
      
      <!-- 问答列表 -->
      <div class="qa-list">
        <h3>问答列表</h3>
        <div v-if="qas.length === 0" class="empty">还没有问题</div>
        <div v-for="qa in qas" :key="qa.id" class="qa-item">
          <div class="qa-question">
            <span class="question-icon">❓</span>
            <span class="question-text">{{ qa.question }}</span>
            <span v-if="qa.isMyQuestion" class="badge my-question">我的提问</span>
            <span v-else class="badge partner-question">Ta的提问</span>
          </div>
          
          <!-- 如果是Ta提的问题，显示我的回答区 -->
          <div v-if="!qa.isMyQuestion" class="answer-section">
            <div class="answer-label">我的回答:</div>
            <textarea 
              v-if="!qa.my_answer"
              v-model="qa.myAnswerInput"
              class="answer-input"
              placeholder="输入你的回答..."
              rows="2"
            ></textarea>
            <div v-else class="answer-text">{{ qa.my_answer }}</div>
            <button 
              v-if="!qa.my_answer"
              class="submit-answer-btn" 
              @click="submitAnswer(qa, 'my')"
            >提交回答</button>
          </div>
          
          <!-- 如果是我提的问题，显示Ta的回答 -->
          <div v-if="qa.isMyQuestion" class="answer-section partner">
            <div class="answer-label">Ta的回答:</div>
            <div v-if="qa.partner_answer" class="answer-text">{{ qa.partner_answer }}</div>
            <div v-else class="answer-text empty">还未回答</div>
          </div>
          
          <div class="qa-actions">
            <button v-if="qa.isMyQuestion" class="delete-qa-btn" @click="deleteQA(qa.id)">删除</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import http from '../api/http.js'

const showEditor = ref(false)
const newQuestion = ref('')
const qas = ref([])

const answeredCount = computed(() => {
  return qas.value.filter(qa => qa.my_answer).length
})

const loadQAs = async () => {
  try {
    console.log('📋 加载问答列表...')
    const userId = Number(localStorage.getItem('userId'))
    
    // 获取用户信息（包含couple信息）
    const userRes = await http.get('/user/me')
    const userInfo = userRes.data
    const isUser1 = userInfo?.user1_id === userId
    
    console.log('👤 当前用户:', userInfo)
    
    // 获取问答列表
    const res = await http.get('/qa', {
      params: { page: 1, limit: 100 }
    })
    console.log('✅ 问答数据:', res)
    
    // 根据当前用户身份映射回答
    qas.value = (res.data?.list || res.data || []).map(qa => ({
      ...qa,
      isMyQuestion: qa.creator_id === userId, // 判断是否是我提的问题
      my_answer: isUser1 ? qa.user1_answer : qa.user2_answer,
      partner_answer: isUser1 ? qa.user2_answer : qa.user1_answer,
      myAnswerInput: ''
    }))
    
    console.log('📝 问答映射完成:', qas.value)
  } catch (error) {
    console.error('❌ 加载问答失败:', error)
  }
}

const saveQuestion = async () => {
  if (!newQuestion.value.trim()) {
    alert('请输入问题')
    return
  }
  
  try {
    console.log('💾 保存问题...', newQuestion.value)
    await http.post('/qa', {
      question: newQuestion.value
    })
    
    alert('保存成功！')
    newQuestion.value = ''
    showEditor.value = false
    await loadQAs()
  } catch (error) {
    console.error('❌ 保存失败:', error)
    alert('保存失败')
  }
}

const submitAnswer = async (qa, type) => {
  const answer = qa.myAnswerInput
  if (!answer || !answer.trim()) {
    alert('请输入回答')
    return
  }
  
  try {
    console.log('📝 提交回答...', { qaId: qa.id, answer })
    await http.post(`/qa/${qa.id}/answer`, {
      answer: answer
    })
    
    alert('提交成功！')
    await loadQAs()
  } catch (error) {
    console.error('❌ 提交失败:', error)
    alert('提交失败')
  }
}

const cancelEdit = () => {
  showEditor.value = false
  newQuestion.value = ''
}

const deleteQA = async (id) => {
  if (!confirm('确定删除这个问题吗？')) return
  
  try {
    await http.delete(`/qa/${id}`)
    alert('删除成功！')
    await loadQAs()
  } catch (error) {
    console.error('❌ 删除失败:', error)
    alert('删除失败')
  }
}

onMounted(() => {
  loadQAs()
})
</script>

<style scoped>
.qa-page {
  min-height: 100vh;
  background: #FFF5F8;
}

.header {
  background: linear-gradient(135deg, #FF4D88, #FF98B9);
  color: white;
  padding: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.back-btn, .add-qa-btn {
  padding: 8px 16px;
  background: rgba(255,255,255,0.2);
  border: none;
  color: white;
  border-radius: 8px;
  cursor: pointer;
  font-size: 16px;
}

.content {
  max-width: 900px;
  margin: 30px auto;
  padding: 0 20px;
}

.qa-editor {
  background: white;
  border-radius: 34px;
  padding: 30px;
  margin-bottom: 30px;
  box-shadow: 0 8px 21px rgba(255, 77, 136, 0.1);
}

.qa-editor h3 {
  margin-bottom: 20px;
  color: #333;
}

.question-input {
  width: 100%;
  padding: 12px;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 16px;
  resize: vertical;
  margin-bottom: 15px;
  font-family: inherit;
}

.editor-actions {
  display: flex;
  gap: 10px;
}

.save-qa-btn {
  flex: 1;
  padding: 12px;
  background: linear-gradient(135deg, #FF4D88, #FF98B9);
  color: white;
  border: none;
  border-radius: 25px;
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
  box-shadow: 0 4px 10px rgba(255, 77, 136, 0.2);
}

.cancel-btn {
  flex: 1;
  padding: 12px;
  background: #e0e0e0;
  color: #666;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  cursor: pointer;
}

.stats-card {
  background: white;
  border-radius: 34px;
  padding: 30px;
  margin-bottom: 30px;
  display: flex;
  justify-content: space-around;
  box-shadow: 0 8px 21px rgba(255, 77, 136, 0.1);
}

.stat-item {
  text-align: center;
}

.stat-value {
  font-size: 36px;
  font-weight: bold;
  color: #FF4D88;
  margin-bottom: 5px;
}

.stat-label {
  font-size: 14px;
  color: #666;
}

.qa-list {
  background: white;
  border-radius: 34px;
  padding: 30px;
  box-shadow: 0 8px 21px rgba(255, 77, 136, 0.1);
}

.qa-list h3 {
  margin-bottom: 20px;
  color: #333;
}

.empty {
  text-align: center;
  color: #999;
  padding: 40px;
}

.qa-item {
  padding: 25px;
  border: 2px solid #f0f0f0;
  border-radius: 20px;
  margin-bottom: 20px;
}

.qa-question {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 20px;
  font-size: 18px;
  font-weight: bold;
  color: #333;
}

.question-icon {
  font-size: 24px;
}

.badge {
  font-size: 12px;
  padding: 3px 10px;
  border-radius: 12px;
  font-weight: 500;
  margin-left: auto;
}

.my-question {
  background: #E3F2FD;
  color: #1976D2;
}

.partner-question {
  background: #FCE4EC;
  color: #C2185B;
}

.answer-section {
  margin-bottom: 15px;
  padding: 15px;
  background: #f9f9f9;
  border-radius: 12px;
}

.answer-section.partner {
  background: #fff0f5;
}

.answer-label {
  font-size: 14px;
  color: #666;
  margin-bottom: 10px;
  font-weight: 500;
}

.answer-input {
  width: 100%;
  padding: 10px;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 14px;
  resize: vertical;
  margin-bottom: 10px;
  font-family: inherit;
}

.answer-text {
  color: #333;
  line-height: 1.6;
  font-size: 15px;
}

.answer-text.empty {
  color: #999;
  font-style: italic;
}

.submit-answer-btn {
  padding: 8px 20px;
  background: #FF4D88;
  color: white;
  border: none;
  border-radius: 20px;
  font-size: 14px;
  cursor: pointer;
}

.qa-actions {
  text-align: right;
  margin-top: 15px;
}

.delete-qa-btn {
  padding: 6px 16px;
  background: #ff4444;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
}
</style>




