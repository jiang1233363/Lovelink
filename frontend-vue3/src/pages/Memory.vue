<template>
  <div class="memory-page">
    <div class="header">
      <button class="back-btn" @click="$router.back()">← 返回</button>
      <h1>美好回忆</h1>
      <button class="add-memory-btn" @click="showEditor = true">+ 新建</button>
    </div>
    
    <div class="content">
      <!-- 回忆编辑器 -->
      <div v-if="showEditor" class="memory-editor">
        <h3>{{ editingMemory.id ? '编辑回忆' : '新建回忆' }}</h3>
        
        <select v-model="editingMemory.type" class="type-select">
          <option value="photo">📷 照片</option>
          <option value="video">🎬 视频</option>
          <option value="gift">🎁 礼物</option>
          <option value="anniversary">💕 纪念日</option>
          <option value="travel">✈️ 旅行</option>
          <option value="other">📝 其他</option>
        </select>
        
        <input 
          v-model="editingMemory.title" 
          class="title-input"
          placeholder="标题"
        />
        
        <div class="upload-section">
          <label class="upload-label">📷 上传图片（可选）</label>
          <input 
            type="file" 
            class="file-input"
            accept="image/*"
            @change="handleFileSelect"
          />
          <div v-if="editingMemory.photo_url" class="preview-image">
            <img :src="editingMemory.photo_url" alt="预览" />
            <button class="remove-image-btn" @click="removeImage">✕</button>
          </div>
        </div>
        
        <textarea 
          v-model="editingMemory.description" 
          class="description-input"
          placeholder="描述这个美好的回忆..."
          rows="6"
        ></textarea>
        
        <div class="editor-actions">
          <button class="save-memory-btn" @click="saveMemory">保存</button>
          <button class="cancel-btn" @click="cancelEdit">取消</button>
        </div>
      </div>
      
      <!-- 回忆列表 -->
      <div class="memory-list">
        <h3>回忆列表 ({{ memories.length }}个)</h3>
        <div v-if="memories.length === 0" class="empty">还没有回忆记录</div>
        <div v-for="memory in memories" :key="memory.id" class="memory-item">
          <div class="memory-type">{{ getTypeIcon(memory.type) }}</div>
          <div class="memory-info">
            <h4 class="memory-title">{{ memory.title }}</h4>
            <img v-if="memory.image_url || memory.photo_url" :src="getImageUrl(memory.image_url || memory.photo_url)" class="memory-photo" alt="回忆图片" />
            <p class="memory-description">{{ memory.content || memory.description }}</p>
            <div class="memory-date">{{ formatDate(memory.memory_date || memory.date) }}</div>
          </div>
          <div class="memory-actions">
            <button class="edit-memory-btn" @click="editMemory(memory)">编辑</button>
            <button class="delete-memory-btn" @click="deleteMemory(memory.id)">删除</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import http from '../api/http.js'

// 后端地址（用于图片URL）
const API_BASE = 'http://localhost:3000'

const showEditor = ref(false)
const editingMemory = ref({
  id: null,
  type: 'photo',
  title: '',
  description: '',
  photo_url: ''
})
const memories = ref([])
const selectedFile = ref(null)

// 获取完整的图片URL
const getImageUrl = (url) => {
  if (!url) return ''
  if (url.startsWith('http')) return url
  if (url.startsWith('data:')) return url
  return `${API_BASE}${url}`
}

const typeIcons = {
  photo: '📷',
  video: '🎬',
  gift: '🎁',
  anniversary: '💕',
  travel: '✈️',
  other: '📝'
}

const getTypeIcon = (type) => {
  return typeIcons[type] || '📝'
}

const handleFileSelect = (event) => {
  const file = event.target.files[0]
  if (file) {
    selectedFile.value = file
    // 创建预览URL
    const reader = new FileReader()
    reader.onload = (e) => {
      editingMemory.value.photo_url = e.target.result
    }
    reader.readAsDataURL(file)
  }
}

const removeImage = () => {
  editingMemory.value.photo_url = ''
  selectedFile.value = null
}

const formatDate = (date) => {
  const d = new Date(date)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

const loadMemories = async () => {
  try {
    console.log('📋 加载回忆列表...')
    const res = await http.get('/memory/list', {
      params: { page: 1, limit: 100 }
    })
    console.log('✅ 回忆数据:', res)
    memories.value = res.data?.list || res.data || []
  } catch (error) {
    console.error('❌ 加载回忆失败:', error)
  }
}

const saveMemory = async () => {
  if (!editingMemory.value.title) {
    alert('请填写标题')
    return
  }
  
  try {
    console.log('💾 保存回忆...', editingMemory.value)
    
    let imageUrl = null
    
    // 如果有图片且是base64格式，先上传图片
    if (editingMemory.value.photo_url && editingMemory.value.photo_url.startsWith('data:')) {
      console.log('📤 上传图片...')
      try {
        const uploadRes = await http.post('/upload/base64', {
          base64: editingMemory.value.photo_url,
          type: 'memory'
        })
        if (uploadRes.code === 200) {
          imageUrl = uploadRes.data.url
          console.log('✅ 图片上传成功:', imageUrl)
        }
      } catch (uploadError) {
        console.error('❌ 图片上传失败:', uploadError)
        alert('图片上传失败，是否继续保存文字内容？')
        // 继续保存文字内容
      }
    } else if (editingMemory.value.photo_url) {
      // 如果已经是URL（编辑时），直接使用
      imageUrl = editingMemory.value.photo_url
    }
    
    const data = {
      title: editingMemory.value.title,
      content: editingMemory.value.description,
      images: imageUrl,
      memory_date: new Date().toISOString().split('T')[0]
    }
    
    if (editingMemory.value.id) {
      // 更新
      await http.put(`/memory/update/${editingMemory.value.id}`, data)
    } else {
      // 新建
      await http.post('/memory/create', data)
    }
    
    alert('保存成功！')
    showEditor.value = false
    editingMemory.value = { id: null, type: 'photo', title: '', description: '', photo_url: '' }
    selectedFile.value = null
    await loadMemories()
  } catch (error) {
    console.error('❌ 保存失败:', error)
    alert('保存失败：' + (error.response?.data?.message || error.message))
  }
}

const editMemory = (memory) => {
  editingMemory.value = {
    id: memory.id,
    type: memory.type || 'photo',
    title: memory.title,
    description: memory.content || memory.description,
    photo_url: memory.image_url || memory.photo_url || ''
  }
  showEditor.value = true
}

const cancelEdit = () => {
  showEditor.value = false
  editingMemory.value = { id: null, type: 'photo', title: '', description: '', photo_url: '' }
  selectedFile.value = null
}

const deleteMemory = async (id) => {
  if (!confirm('确定删除这个回忆吗？')) return
  
  try {
    await http.delete(`/memory/delete/${id}`)
    alert('删除成功！')
    await loadMemories()
  } catch (error) {
    console.error('❌ 删除失败:', error)
    alert('删除失败：' + (error.response?.data?.message || error.message))
  }
}

onMounted(() => {
  loadMemories()
})
</script>

<style scoped>
.memory-page {
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

.back-btn, .add-memory-btn {
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

.memory-editor {
  background: white;
  border-radius: 34px;
  padding: 30px;
  margin-bottom: 30px;
  box-shadow: 0 8px 21px rgba(255, 77, 136, 0.1);
}

.memory-editor h3 {
  margin-bottom: 20px;
  color: #333;
}

.type-select, .title-input, .description-input {
  width: 100%;
  padding: 12px;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 16px;
  margin-bottom: 15px;
  font-family: inherit;
}

.upload-section {
  margin-bottom: 15px;
}

.upload-label {
  display: block;
  font-size: 14px;
  color: #666;
  margin-bottom: 8px;
}

.file-input {
  width: 100%;
  padding: 12px;
  border: 2px dashed #e0e0e0;
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
}

.preview-image {
  margin-top: 15px;
  position: relative;
  display: inline-block;
}

.preview-image img {
  max-width: 300px;
  max-height: 200px;
  border-radius: 8px;
  border: 2px solid #e0e0e0;
}

.remove-image-btn {
  position: absolute;
  top: -8px;
  right: -8px;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: #ff4444;
  color: white;
  border: none;
  cursor: pointer;
  font-size: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 6px rgba(0,0,0,0.2);
}

.editor-actions {
  display: flex;
  gap: 10px;
}

.save-memory-btn {
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

.memory-list {
  background: white;
  border-radius: 34px;
  padding: 30px;
  box-shadow: 0 8px 21px rgba(255, 77, 136, 0.1);
}

.memory-list h3 {
  margin-bottom: 20px;
  color: #333;
}

.empty {
  text-align: center;
  color: #999;
  padding: 40px;
}

.memory-item {
  display: flex;
  gap: 20px;
  padding: 20px;
  border-bottom: 1px solid #f0f0f0;
  align-items: flex-start;
}

.memory-item:last-child {
  border-bottom: none;
}

.memory-type {
  font-size: 40px;
}

.memory-info {
  flex: 1;
}

.memory-title {
  font-size: 18px;
  color: #333;
  margin-bottom: 10px;
}

.memory-photo {
  max-width: 100%;
  max-height: 200px;
  border-radius: 8px;
  margin-bottom: 10px;
  object-fit: cover;
}

.memory-description {
  color: #666;
  line-height: 1.6;
  margin-bottom: 10px;
}

.memory-date {
  font-size: 14px;
  color: #999;
}

.memory-actions {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.edit-memory-btn, .delete-memory-btn {
  padding: 6px 12px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  white-space: nowrap;
}

.edit-memory-btn {
  background: #FF4D88;
  color: white;
}

.delete-memory-btn {
  background: #ff4444;
  color: white;
}
</style>

