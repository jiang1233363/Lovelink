<template>
  <div class="chat-page">
    <div class="header">
      <button class="back-btn" @click="$router.back()">← 返回</button>
      <h1>实时聊天</h1>
      <div></div>
    </div>
    
    <div class="chat-container">
      <!-- 消息列表 -->
      <div class="messages-list" ref="messagesList">
        <div v-if="messages.length === 0" class="empty">
          <p>还没有消息，开始聊天吧~</p>
        </div>
        <div v-for="msg in messages" :key="msg.id" 
          class="message-item"
          :class="{ 'my-message': Number(msg.sender_id) === Number(userId) }"
        >
          <div class="message-avatar">
            <div class="avatar-circle">{{ Number(msg.sender_id) === Number(userId) ? '我' : 'Ta' }}</div>
          </div>
          <div class="message-content">
            <div class="message-bubble">{{ msg.content }}</div>
            <div class="message-time">{{ formatTime(msg.created_at) }}</div>
          </div>
        </div>
      </div>
      
      <!-- 输入框 -->
      <div class="input-area">
        <input 
          v-model="newMessage" 
          class="message-input"
          placeholder="输入消息..."
          @keyup.enter="sendMessage"
        />
        <button class="send-btn" @click="sendMessage">发送</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick } from 'vue'
import http from '../api/http.js'

const userId = ref(Number(localStorage.getItem('userId')))
const newMessage = ref('')
const messages = ref([])
const messagesList = ref(null)

const formatTime = (time) => {
  const d = new Date(time)
  const now = new Date()
  const diff = now - d
  
  if (diff < 60000) return '刚刚'
  if (diff < 3600000) return Math.floor(diff / 60000) + '分钟前'
  if (diff < 86400000) return Math.floor(diff / 3600000) + '小时前'
  
  return `${d.getMonth() + 1}-${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

const loadMessages = async () => {
  try {
    console.log('📋 加载聊天记录...')
    const res = await http.get('/chat/history', {
      params: { page: 1, limit: 100 }
    })
    console.log('✅ 聊天数据:', res)
    messages.value = res.data?.list || res.data || []
    
    // 滚动到底部
    await nextTick()
    if (messagesList.value) {
      messagesList.value.scrollTop = messagesList.value.scrollHeight
    }
  } catch (error) {
    console.error('❌ 加载聊天失败:', error)
  }
}

const sendMessage = async () => {
  if (!newMessage.value.trim()) {
    alert('请输入消息内容')
    return
  }
  
  try {
    console.log('📤 发送消息...', newMessage.value)
    const res = await http.post('/chat/send', {
      content: newMessage.value,
      type: 'text'
    })
    console.log('✅ 发送成功:', res)
    
    newMessage.value = ''
    await loadMessages()
  } catch (error) {
    console.error('❌ 发送失败:', error)
    alert('发送失败：' + (error.response?.data?.message || error.message))
  }
}

onMounted(() => {
  loadMessages()
  // 每5秒自动刷新消息
  setInterval(loadMessages, 5000)
})
</script>

<style scoped>
.chat-page {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #FFF5F8;
}

.header {
  background: linear-gradient(135deg, #FF4D88, #FF98B9);
  color: white;
  padding: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-shrink: 0;
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

.chat-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  max-width: 900px;
  width: 100%;
  margin: 0 auto;
  padding: 20px;
  overflow: hidden;
}

.messages-list {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  background: white;
  border-radius: 34px 34px 0 0;
  box-shadow: 0 8px 21px rgba(255, 77, 136, 0.1);
}

.empty {
  text-align: center;
  color: #999;
  padding: 40px 20px;
}

.message-item {
  display: flex;
  gap: 15px;
  margin-bottom: 20px;
}

.message-item.my-message {
  flex-direction: row-reverse;
}

.message-avatar {
  flex-shrink: 0;
}

.avatar-circle {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: linear-gradient(135deg, #FF4D88, #FF98B9);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: bold;
}

.message-item.my-message .avatar-circle {
  background: linear-gradient(135deg, #667eea, #764ba2);
}

.message-content {
  max-width: 70%;
}

.message-item.my-message .message-content {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}

.message-bubble {
  background: #f0f0f0;
  padding: 12px 16px;
  border-radius: 18px;
  word-wrap: break-word;
  line-height: 1.5;
}

.message-item.my-message .message-bubble {
  background: linear-gradient(135deg, #FF4D88, #FF98B9);
  color: white;
}

.message-time {
  font-size: 12px;
  color: #999;
  margin-top: 5px;
}

.input-area {
  display: flex;
  gap: 10px;
  padding: 20px;
  background: white;
  border-radius: 0 0 34px 34px;
  box-shadow: 0 8px 21px rgba(255, 77, 136, 0.1);
}

.message-input {
  flex: 1;
  padding: 12px 16px;
  border: 2px solid #e0e0e0;
  border-radius: 25px;
  font-size: 16px;
  outline: none;
}

.message-input:focus {
  border-color: #FF4D88;
}

.send-btn {
  padding: 12px 30px;
  background: linear-gradient(135deg, #FF4D88, #FF98B9);
  color: white;
  border: none;
  border-radius: 25px;
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
  box-shadow: 0 4px 10px rgba(255, 77, 136, 0.2);
}

.send-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 6px 15px rgba(255, 77, 136, 0.3);
}
</style>




