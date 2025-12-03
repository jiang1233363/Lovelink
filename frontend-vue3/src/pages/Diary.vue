<template>
  <div class="diary-page">
    <div class="header">
      <button class="back-btn" @click="$router.back()">← 返回</button>
      <h1>共享日记</h1>
      <button class="add-diary-btn" @click="showEditor = true">+ 新建</button>
    </div>
    
    <div class="content">
      <!-- 日记编辑器 -->
      <div v-if="showEditor" class="diary-editor">
        <h3>{{ editingDiary.id ? '编辑日记' : '新建日记' }}</h3>
        <input 
          v-model="editingDiary.title" 
          class="diary-title-input"
          placeholder="标题"
        />
        <textarea 
          v-model="editingDiary.content" 
          class="diary-content-input"
          placeholder="记录你们的故事..."
          rows="8"
        ></textarea>
        <div class="editor-actions">
          <button class="save-diary-btn" @click="saveDiary">保存</button>
          <button class="cancel-btn" @click="cancelEdit">取消</button>
        </div>
      </div>
      
      <!-- 日记列表 -->
      <div class="diary-list">
        <h3>日记列表 ({{ diaries.length }}篇)</h3>
        <div v-if="diaries.length === 0" class="empty">还没有日记，开始记录吧</div>
        <div v-for="diary in diaries" :key="diary.id" class="diary-item">
          <div class="diary-date">
            <div class="month">{{ formatMonth(diary.created_at || diary.date) }}</div>
            <div class="day">{{ formatDay(diary.created_at || diary.date) }}</div>
          </div>
          <div class="diary-info">
            <h4 class="diary-title">{{ diary.title }}</h4>
            <p class="diary-content">{{ diary.content }}</p>
            <div class="diary-meta">{{ formatTime(diary.created_at) }}</div>
          </div>
          <div class="diary-actions">
            <button class="edit-diary-btn" @click="editDiary(diary)">编辑</button>
            <button class="delete-diary-btn" @click="deleteDiary(diary.id)">删除</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import http from '../api/http.js'

const showEditor = ref(false)
const editingDiary = ref({ id: null, title: '', content: '' })
const diaries = ref([])

const formatMonth = (date) => {
  if (!date) return '--月'
  const d = new Date(date)
  if (isNaN(d.getTime())) return '--月'
  return (d.getMonth() + 1) + '月'
}

const formatDay = (date) => {
  if (!date) return '--'
  const d = new Date(date)
  if (isNaN(d.getTime())) return '--'
  return d.getDate()
}

const formatTime = (date) => {
  if (!date) return '--'
  const d = new Date(date)
  if (isNaN(d.getTime())) return '--'
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

const loadDiaries = async () => {
  try {
    console.log('📋 加载日记列表...')
    const res = await http.get('/diary/list', {
      params: { page: 1, limit: 100 }
    })
    console.log('✅ 日记数据:', res)
    diaries.value = res.data?.list || res.data || []
  } catch (error) {
    console.error('❌ 加载日记失败:', error)
  }
}

const saveDiary = async () => {
  if (!editingDiary.value.title || !editingDiary.value.content) {
    alert('请填写标题和内容')
    return
  }
  
  try {
    console.log('💾 保存日记...', editingDiary.value)
    
    if (editingDiary.value.id) {
      // 更新
      await http.put(`/diary/${editingDiary.value.id}`, {
        title: editingDiary.value.title,
        content: editingDiary.value.content
      })
    } else {
      // 新建
      await http.post('/diary/create', {
        title: editingDiary.value.title,
        content: editingDiary.value.content,
        mood: 'happy',
        date: new Date().toISOString().split('T')[0]
      })
    }
    
    alert('保存成功！')
    showEditor.value = false
    editingDiary.value = { id: null, title: '', content: '' }
    await loadDiaries()
  } catch (error) {
    console.error('❌ 保存失败:', error)
    alert('保存失败：' + (error.response?.data?.message || error.message))
  }
}

const editDiary = (diary) => {
  editingDiary.value = { ...diary }
  showEditor.value = true
}

const cancelEdit = () => {
  showEditor.value = false
  editingDiary.value = { id: null, title: '', content: '' }
}

const deleteDiary = async (id) => {
  if (!confirm('确定删除这篇日记吗？')) return
  
  try {
    await http.delete(`/diary/${id}`)
    alert('删除成功！')
    await loadDiaries()
  } catch (error) {
    console.error('❌ 删除失败:', error)
    alert('删除失败')
  }
}

onMounted(() => {
  loadDiaries()
})
</script>

<style scoped>
.diary-page {
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

.back-btn, .add-diary-btn {
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

.diary-editor {
  background: white;
  border-radius: 34px;
  padding: 30px;
  margin-bottom: 30px;
  box-shadow: 0 8px 21px rgba(255, 77, 136, 0.1);
}

.diary-editor h3 {
  margin-bottom: 20px;
  color: #333;
}

.diary-title-input {
  width: 100%;
  padding: 12px;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 18px;
  margin-bottom: 15px;
  font-weight: bold;
}

.diary-content-input {
  width: 100%;
  padding: 12px;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 16px;
  resize: vertical;
  margin-bottom: 15px;
  font-family: inherit;
  line-height: 1.6;
}

.editor-actions {
  display: flex;
  gap: 10px;
}

.save-diary-btn {
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

.diary-list {
  background: white;
  border-radius: 34px;
  padding: 30px;
  box-shadow: 0 8px 21px rgba(255, 77, 136, 0.1);
}

.diary-list h3 {
  margin-bottom: 20px;
  color: #333;
}

.empty {
  text-align: center;
  color: #999;
  padding: 40px;
}

.diary-item {
  display: flex;
  gap: 20px;
  padding: 20px;
  border-bottom: 1px solid #f0f0f0;
}

.diary-item:last-child {
  border-bottom: none;
}

.diary-date {
  background: linear-gradient(135deg, #FF4D88, #FF98B9);
  color: white;
  border-radius: 16px;
  padding: 15px;
  text-align: center;
  min-width: 80px;
}

.month {
  font-size: 12px;
}

.day {
  font-size: 32px;
  font-weight: bold;
}

.diary-info {
  flex: 1;
}

.diary-title {
  font-size: 20px;
  color: #333;
  margin-bottom: 10px;
}

.diary-content {
  color: #666;
  line-height: 1.6;
  margin-bottom: 10px;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.diary-meta {
  font-size: 14px;
  color: #999;
}

.diary-actions {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.edit-diary-btn, .delete-diary-btn {
  padding: 6px 12px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
}

.edit-diary-btn {
  background: #FF4D88;
  color: white;
}

.delete-diary-btn {
  background: #ff4444;
  color: white;
}
</style>

