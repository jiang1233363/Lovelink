<template>
  <div class="mood-page">
    <div class="header">
      <button class="back-btn" @click="$router.back()">← 返回</button>
      <h1>心情记录</h1>
      <div></div>
    </div>
    
    <div class="content">
      <!-- 今日心情选择 -->
      <div class="mood-selector">
        <h3>今天的心情如何？</h3>
        <div class="mood-options">
          <div v-for="m in moodOptions" :key="m.value"
            class="mood-option"
            :class="{ selected: selectedMood === m.value }"
            @click="selectedMood = m.value"
          >
            <span class="emoji">{{ m.emoji }}</span>
            <span class="label">{{ m.label }}</span>
          </div>
        </div>
        
        <textarea 
          v-model="moodNote" 
          class="mood-note-input"
          placeholder="记录此刻的感受..."
          rows="4"
        ></textarea>
        
        <button class="save-mood-btn" @click="saveMood">保存心情</button>
      </div>
      
      <!-- 心情列表 -->
      <div class="mood-list">
        <h3>最近心情 ({{ moods.length }}条)</h3>
        <div v-if="moods.length === 0" class="empty">暂无心情记录</div>
        <div v-for="mood in moods" :key="mood.id" class="mood-item">
          <div class="mood-emoji">{{ getMoodEmoji(mood.mood) }}</div>
          <div class="mood-info">
            <div class="mood-date">{{ formatDate(mood.date) }}</div>
            <div class="mood-note">{{ mood.note || '无备注' }}</div>
          </div>
          <button class="delete-mood-btn" @click="deleteMood(mood.id)">删除</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import http from '../api/http.js'

const moodOptions = [
  { value: 'loved', emoji: '🥰', label: '被爱' },
  { value: 'excited', emoji: '😄', label: '兴奋' },
  { value: 'happy', emoji: '😊', label: '开心' },
  { value: 'calm', emoji: '😌', label: '平静' },
  { value: 'worried', emoji: '😰', label: '担心' },
  { value: 'sad', emoji: '😢', label: '难过' },
  { value: 'angry', emoji: '😠', label: '生气' }
]

const selectedMood = ref('')
const moodNote = ref('')
const moods = ref([])

const getMoodEmoji = (mood) => {
  return moodOptions.find(m => m.value === mood)?.emoji || '😊'
}

const formatDate = (date) => {
  const d = new Date(date)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

const loadMoods = async () => {
  try {
    console.log('📋 加载心情列表...')
    const now = new Date()
    const res = await http.get('/mood/month', {
      params: {
        year: now.getFullYear(),
        month: now.getMonth() + 1
      }
    })
    console.log('✅ 心情数据:', res)
    moods.value = res.data || []
  } catch (error) {
    console.error('❌ 加载心情失败:', error)
  }
}

const saveMood = async () => {
  if (!selectedMood.value) {
    alert('请选择心情')
    return
  }
  
  try {
    console.log('💾 保存心情...', { mood: selectedMood.value, note: moodNote.value })
    const res = await http.post('/mood/save', {
      mood: selectedMood.value,
      note: moodNote.value,
      date: new Date().toISOString().split('T')[0]
    })
    console.log('✅ 保存成功:', res)
    
    alert('保存成功！')
    selectedMood.value = ''
    moodNote.value = ''
    await loadMoods()
  } catch (error) {
    console.error('❌ 保存失败:', error)
    alert('保存失败：' + (error.response?.data?.message || error.message))
  }
}

const deleteMood = async (id) => {
  if (!confirm('确定删除这条心情记录吗？')) return
  
  try {
    await http.delete(`/mood/${id}`)
    alert('删除成功！')
    await loadMoods()
  } catch (error) {
    console.error('❌ 删除失败:', error)
    alert('删除失败')
  }
}

onMounted(() => {
  loadMoods()
})
</script>

<style scoped>
.mood-page {
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

.back-btn {
  padding: 8px 16px;
  background: rgba(255,255,255,0.2);
  border: none;
  color: white;
  border-radius: 8px;
  cursor: pointer;
  font-size: 16px;
}

.content {
  max-width: 800px;
  margin: 30px auto;
  padding: 0 20px;
}

.mood-selector {
  background: white;
  border-radius: 34px;
  padding: 30px;
  margin-bottom: 30px;
  box-shadow: 0 8px 21px rgba(255, 77, 136, 0.1);
}

.mood-selector h3 {
  margin-bottom: 20px;
  color: #333;
}

.mood-options {
  display: flex;
  justify-content: space-around;
  margin-bottom: 20px;
  flex-wrap: wrap;
  gap: 10px;
}

.mood-option {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 15px;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s;
  border: 2px solid transparent;
}

.mood-option:hover {
  background: #f0f0f0;
}

.mood-option.selected {
  background: linear-gradient(135deg, #FF4D88, #FF98B9);
  border-color: #FF4D88;
}

.mood-option.selected .label {
  color: white;
}

.emoji {
  font-size: 40px;
  margin-bottom: 5px;
}

.label {
  font-size: 14px;
  color: #666;
}

.mood-note-input {
  width: 100%;
  padding: 12px;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 16px;
  resize: vertical;
  margin-bottom: 15px;
  font-family: inherit;
}

.save-mood-btn {
  width: 100%;
  padding: 14px;
  background: linear-gradient(135deg, #FF4D88, #FF98B9);
  color: white;
  border: none;
  border-radius: 25px;
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
  box-shadow: 0 4px 10px rgba(255, 77, 136, 0.2);
}

.mood-list {
  background: white;
  border-radius: 34px;
  padding: 30px;
  box-shadow: 0 8px 21px rgba(255, 77, 136, 0.1);
}

.mood-list h3 {
  margin-bottom: 20px;
  color: #333;
}

.empty {
  text-align: center;
  color: #999;
  padding: 40px;
}

.mood-item {
  display: flex;
  align-items: center;
  padding: 15px;
  border-bottom: 1px solid #f0f0f0;
  gap: 15px;
}

.mood-item:last-child {
  border-bottom: none;
}

.mood-emoji {
  font-size: 32px;
}

.mood-info {
  flex: 1;
}

.mood-date {
  font-size: 14px;
  color: #999;
  margin-bottom: 5px;
}

.mood-note {
  color: #333;
}

.delete-mood-btn {
  padding: 6px 12px;
  background: #ff4444;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
}
</style>

