<template>
  <div class="reminder-page">
    <div class="header">
      <button class="back-btn" @click="$router.back()">← 返回</button>
      <h1>提醒事项</h1>
      <div></div>
    </div>
    
    <div class="content">
      <!-- 添加提醒 -->
      <div class="add-reminder">
        <input 
          v-model="newReminder" 
          class="reminder-input"
          placeholder="添加提醒事项..."
          @keyup.enter="addReminder"
        />
        <button class="add-reminder-btn" @click="addReminder">添加</button>
      </div>
      
      <!-- 提醒列表 -->
      <div class="reminder-list">
        <h3>提醒列表 ({{ reminders.length }}条)</h3>
        <div v-if="reminders.length === 0" class="empty">暂无提醒事项</div>
        <div v-for="reminder in reminders" :key="reminder.id" 
          class="reminder-item"
          :class="{ completed: reminder.is_completed }"
        >
          <div class="checkbox" @click="toggleReminder(reminder)">
            <span v-if="reminder.is_completed">✓</span>
          </div>
          <div class="reminder-info">
            <div class="reminder-title">{{ reminder.title }}</div>
            <div class="reminder-time">{{ formatTime(reminder.remind_at) }}</div>
          </div>
          <button class="delete-reminder-btn" @click="deleteReminder(reminder.id)">删除</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import http from '../api/http.js'

const newReminder = ref('')
const reminders = ref([])

const formatTime = (time) => {
  if (!time) return '未设置时间'
  const d = new Date(time)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

const loadReminders = async () => {
  try {
    console.log('📋 加载提醒列表...')
    const res = await http.get('/reminder/list', {
      params: { limit: 100 }
    })
    console.log('✅ 提醒数据:', res)
    reminders.value = Array.isArray(res.data) ? res.data : (res.data?.list || [])
  } catch (error) {
    console.error('❌ 加载提醒失败:', error)
  }
}

const addReminder = async () => {
  if (!newReminder.value.trim()) {
    alert('请输入提醒内容')
    return
  }
  
  try {
    console.log('💾 添加提醒...', newReminder.value)
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    
    await http.post('/reminder/create', {
      title: newReminder.value,
      description: '',
      remind_at: tomorrow.toISOString().slice(0, 19).replace('T', ' '),
      repeat_type: 'none'
    })
    
    alert('添加成功！')
    newReminder.value = ''
    await loadReminders()
  } catch (error) {
    console.error('❌ 添加失败:', error)
    alert('添加失败：' + (error.response?.data?.message || error.message))
  }
}

const toggleReminder = async (reminder) => {
  try {
    await http.put(`/reminders/${reminder.id}`, {
      is_completed: !reminder.is_completed
    })
    await loadReminders()
  } catch (error) {
    console.error('❌ 更新失败:', error)
  }
}

const deleteReminder = async (id) => {
  if (!confirm('确定删除这条提醒吗？')) return
  
  try {
    await http.delete(`/reminders/${id}`)
    alert('删除成功！')
    await loadReminders()
  } catch (error) {
    console.error('❌ 删除失败:', error)
    alert('删除失败')
  }
}

onMounted(() => {
  loadReminders()
})
</script>

<style scoped>
.reminder-page {
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

.add-reminder {
  background: white;
  border-radius: 34px;
  padding: 20px;
  margin-bottom: 30px;
  display: flex;
  gap: 10px;
  box-shadow: 0 8px 21px rgba(255, 77, 136, 0.1);
}

.reminder-input {
  flex: 1;
  padding: 12px;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 16px;
}

.add-reminder-btn {
  padding: 12px 24px;
  background: linear-gradient(135deg, #FF4D88, #FF98B9);
  color: white;
  border: none;
  border-radius: 25px;
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
  box-shadow: 0 4px 10px rgba(255, 77, 136, 0.2);
}

.reminder-list {
  background: white;
  border-radius: 34px;
  padding: 30px;
  box-shadow: 0 8px 21px rgba(255, 77, 136, 0.1);
}

.reminder-list h3 {
  margin-bottom: 20px;
  color: #333;
}

.empty {
  text-align: center;
  color: #999;
  padding: 40px;
}

.reminder-item {
  display: flex;
  align-items: center;
  padding: 15px;
  border-bottom: 1px solid #f0f0f0;
  gap: 15px;
  transition: opacity 0.3s;
}

.reminder-item:last-child {
  border-bottom: none;
}

.reminder-item.completed {
  opacity: 0.5;
}

.checkbox {
  width: 24px;
  height: 24px;
  border: 2px solid #FF4D88;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #FF4D88;
  font-weight: bold;
}

.reminder-info {
  flex: 1;
}

.reminder-title {
  font-size: 16px;
  color: #333;
  margin-bottom: 5px;
}

.reminder-item.completed .reminder-title {
  text-decoration: line-through;
}

.reminder-time {
  font-size: 14px;
  color: #999;
}

.delete-reminder-btn {
  padding: 6px 12px;
  background: #ff4444;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
}
</style>

