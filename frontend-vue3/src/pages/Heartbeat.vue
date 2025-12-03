<template>
  <div class="heartbeat-page">
    <div class="header">
      <button class="back-btn" @click="$router.back()">← 返回</button>
      <h1>365心动计划</h1>
      <div></div>
    </div>
    
    <div class="content">
      <!-- 统计卡片 -->
      <div class="stats-section">
        <div class="main-stat">
          <div class="stat-icon">💖</div>
          <div class="stat-info">
            <div class="stat-value">{{ stats.total_days || 0 }}</div>
            <div class="stat-label">累计打卡天数</div>
          </div>
        </div>
        
        <div class="sub-stats">
          <div class="sub-stat">
            <div class="value">{{ stats.continuous_days || 0 }}</div>
            <div class="label">连续天数</div>
          </div>
          <div class="sub-stat">
            <div class="value">{{ stats.completion_rate || 0 }}%</div>
            <div class="label">完成率</div>
          </div>
          <div class="sub-stat">
            <div class="value">{{ stats.total_tasks || 0 }}</div>
            <div class="label">任务总数</div>
          </div>
        </div>
      </div>
      
      <!-- 查看365天任务按钮 -->
      <div class="action-buttons">
        <button class="view-tasks-btn" @click="showTasksModal = true">📅 查看365天任务计划</button>
      </div>
      
      <!-- 今日任务 -->
      <div class="today-task">
        <h3>🎯 今日任务</h3>
        <div v-if="!todayTask" class="no-task">
          <p>暂无今日任务</p>
          <button class="create-task-btn" @click="createTodayTask">创建今日任务</button>
        </div>
        <div v-else class="task-card">
          <div class="task-title">{{ todayTask.title }}</div>
          <div class="task-description">{{ todayTask.description }}</div>
          <div class="task-status">
            <span v-if="todayTask.is_completed" class="completed">✅ 已完成</span>
            <button v-else class="complete-btn" @click="completeTask">完成任务</button>
          </div>
        </div>
      </div>
      
      <!-- 历史记录 -->
      <div class="history-section">
        <h3>📅 打卡历史</h3>
        <div v-if="history.length === 0" class="empty">暂无历史记录</div>
        <div v-for="record in history" :key="record.id" class="history-item">
          <div class="history-date">
            <div class="month">{{ formatMonth(record.task_date) }}</div>
            <div class="day">{{ formatDay(record.task_date) }}</div>
          </div>
          <div class="history-info">
            <div class="history-title">{{ record.title }}</div>
            <div class="history-desc">{{ record.description }}</div>
          </div>
          <div class="history-status">
            <span v-if="record.is_completed" class="status-badge completed">已完成</span>
            <span v-else class="status-badge pending">未完成</span>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 365天任务列表弹窗 -->
    <div v-if="showTasksModal" class="modal-overlay" @click="showTasksModal = false">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h2>📅 365天心动计划</h2>
          <button class="close-btn" @click="showTasksModal = false">✕</button>
        </div>
        <div class="modal-body">
          <div v-if="!tasks365List.length" class="loading">加载中...</div>
          <div v-else class="tasks-grid">
            <div v-for="task in tasks365List" :key="task.day" 
                 :class="['task-item', {
                   'completed': task.is_completed,
                   'current': task.is_current,
                   'locked': task.is_locked
                 }]">
              <div class="task-day">Day {{ task.day }}</div>
              <div class="task-info">
                <div class="task-name">{{ task.content }}</div>
                <div class="task-reward">🏆 {{ task.reward }}</div>
              </div>
              <div class="task-status-icon">
                <span v-if="task.is_completed">✅</span>
                <span v-else-if="task.is_current">📍</span>
                <span v-else>🔒</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import http from '../api/http.js'

const stats = ref({})
const todayTask = ref(null)
const history = ref([])
const showTasksModal = ref(false)
const tasks365List = ref([])

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

const loadStats = async () => {
  try {
    const res = await http.get('/heartbeat/stats')
    stats.value = res.data || {}
  } catch (error) {
    console.error('❌ 加载统计失败:', error)
  }
}

const loadTodayTask = async () => {
  try {
    const res = await http.get('/heartbeat/today')
    todayTask.value = res.data
  } catch (error) {
    console.error('❌ 加载今日任务失败:', error)
  }
}

const loadHistory = async () => {
  try {
    const res = await http.get('/heartbeat/history', {
      params: { page: 1, limit: 30 }
    })
    history.value = res.data?.list || res.data || []
  } catch (error) {
    console.error('❌ 加载历史失败:', error)
  }
}

const createTodayTask = async () => {
  const title = prompt('输入任务标题:')
  if (!title) return
  
  try {
    await http.post('/heartbeat/create', {
      title: title,
      description: '每日心动任务',
      task_date: new Date().toISOString().split('T')[0]
    })
    alert('创建成功！')
    await loadTodayTask()
    await loadStats()
  } catch (error) {
    console.error('❌ 创建失败:', error)
    alert('创建失败')
  }
}

const completeTask = async () => {
  if (!todayTask.value) return
  
  try {
    const res = await http.post(`/heartbeat/complete/${todayTask.value.id}`)
    if (res.code === 200) {
      alert('恭喜完成今日任务！💖')
      await loadTodayTask()
      await loadStats()
      await loadHistory()
    } else {
      console.error('❌ 完成失败:', res.message)
      alert('完成失败：' + res.message)
    }
  } catch (error) {
    console.error('❌ 完成失败:', error)
    alert('完成失败')
  }
}

const load365Tasks = async () => {
  try {
    const res = await http.get('/heartbeat/tasks-365')
    if (res.code === 200) {
      tasks365List.value = res.data.tasks || []
    }
  } catch (error) {
    console.error('❌ 加载365天任务失败:', error)
  }
}

// 监听弹窗打开，加载365天任务
watch(showTasksModal, (newVal) => {
  if (newVal && tasks365List.value.length === 0) {
    load365Tasks()
  }
})

onMounted(() => {
  loadStats()
  loadTodayTask()
  loadHistory()
})
</script>

<style scoped>
.heartbeat-page {
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
  max-width: 900px;
  margin: 30px auto;
  padding: 0 20px;
}

.stats-section {
  background: white;
  border-radius: 34px;
  padding: 30px;
  margin-bottom: 30px;
  box-shadow: 0 8px 21px rgba(255, 77, 136, 0.1);
}

.main-stat {
  display: flex;
  align-items: center;
  gap: 20px;
  margin-bottom: 30px;
  padding-bottom: 30px;
  border-bottom: 2px solid #f0f0f0;
}

.stat-icon {
  font-size: 60px;
}

.stat-info .stat-value {
  font-size: 48px;
  font-weight: bold;
  color: #FF4D88;
}

.stat-info .stat-label {
  font-size: 16px;
  color: #666;
  margin-top: 5px;
}

.sub-stats {
  display: flex;
  justify-content: space-around;
}

.sub-stat {
  text-align: center;
}

.sub-stat .value {
  font-size: 28px;
  font-weight: bold;
  color: #FF4D88;
  margin-bottom: 5px;
}

.sub-stat .label {
  font-size: 14px;
  color: #666;
}

.today-task {
  background: white;
  border-radius: 34px;
  padding: 30px;
  margin-bottom: 30px;
  box-shadow: 0 8px 21px rgba(255, 77, 136, 0.1);
}

.today-task h3 {
  margin-bottom: 20px;
  color: #333;
  font-size: 20px;
}

.no-task {
  text-align: center;
  padding: 40px 20px;
}

.no-task p {
  color: #999;
  margin-bottom: 20px;
}

.create-task-btn {
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

.task-card {
  padding: 25px;
  background: linear-gradient(135deg, #fff0f5, #ffe4e8);
  border-radius: 20px;
}

.task-title {
  font-size: 20px;
  font-weight: bold;
  color: #333;
  margin-bottom: 10px;
}

.task-description {
  color: #666;
  margin-bottom: 20px;
  line-height: 1.6;
}

.task-status {
  text-align: right;
}

.completed {
  color: #48BB78;
  font-weight: bold;
  font-size: 16px;
}

.complete-btn {
  padding: 10px 25px;
  background: #FF4D88;
  color: white;
  border: none;
  border-radius: 20px;
  font-size: 15px;
  font-weight: bold;
  cursor: pointer;
}

.history-section {
  background: white;
  border-radius: 34px;
  padding: 30px;
  box-shadow: 0 8px 21px rgba(255, 77, 136, 0.1);
}

.history-section h3 {
  margin-bottom: 20px;
  color: #333;
  font-size: 20px;
}

.empty {
  text-align: center;
  color: #999;
  padding: 40px;
}

.history-item {
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 20px;
  border-bottom: 1px solid #f0f0f0;
}

.history-item:last-child {
  border-bottom: none;
}

.history-date {
  background: linear-gradient(135deg, #FF4D88, #FF98B9);
  color: white;
  border-radius: 16px;
  padding: 15px;
  text-align: center;
  min-width: 70px;
}

.month {
  font-size: 12px;
}

.day {
  font-size: 28px;
  font-weight: bold;
}

.history-info {
  flex: 1;
}

.history-title {
  font-size: 16px;
  font-weight: bold;
  color: #333;
  margin-bottom: 5px;
}

.history-desc {
  font-size: 14px;
  color: #666;
}

.history-status {
  flex-shrink: 0;
}

.status-badge {
  padding: 6px 16px;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 500;
}

.status-badge.completed {
  background: #d4edda;
  color: #155724;
}

.status-badge.pending {
  background: #fff3cd;
  color: #856404;
}

.action-buttons {
  margin: 20px 0;
  text-align: center;
}

.view-tasks-btn {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  color: white;
  border: none;
  padding: 15px 30px;
  border-radius: 25px;
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
  box-shadow: 0 4px 15px rgba(245, 87, 108, 0.3);
  transition: all 0.3s ease;
}

.view-tasks-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(245, 87, 108, 0.4);
}

/* 弹窗样式 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 20px;
  width: 90%;
  max-width: 1000px;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 10px 50px rgba(0, 0, 0, 0.3);
}

.modal-header {
  padding: 20px 30px;
  border-bottom: 2px solid #f0f0f0;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-header h2 {
  margin: 0;
  color: #333;
  font-size: 24px;
}

.close-btn {
  background: none;
  border: none;
  font-size: 28px;
  cursor: pointer;
  color: #999;
  transition: color 0.3s;
}

.close-btn:hover {
  color: #f5576c;
}

.modal-body {
  padding: 20px 30px;
  overflow-y: auto;
  flex: 1;
}

.loading {
  text-align: center;
  padding: 40px;
  color: #999;
  font-size: 18px;
}

.tasks-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 15px;
}

.task-item {
  background: white;
  border: 2px solid #e0e0e0;
  border-radius: 12px;
  padding: 15px;
  display: flex;
  align-items: center;
  gap: 12px;
  transition: all 0.3s ease;
}

.task-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.task-item.completed {
  background: linear-gradient(135deg, #a8edea 0%, #fed6e3 100%);
  border-color: #6dd5ed;
}

.task-item.current {
  background: linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%);
  border-color: #ff9068;
  animation: pulse 2s infinite;
}

.task-item.locked {
  opacity: 0.5;
  background: #f5f5f5;
}

@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.02); }
}

.task-day {
  font-weight: bold;
  font-size: 14px;
  color: #666;
  min-width: 50px;
}

.task-info {
  flex: 1;
}

.task-name {
  font-size: 14px;
  color: #333;
  margin-bottom: 5px;
}

.task-reward {
  font-size: 12px;
  color: #f5576c;
  font-weight: bold;
}

.task-status-icon {
  font-size: 20px;
}
</style>


