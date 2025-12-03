<template>
  <div class="conflict-page">
    <div class="header">
      <button class="back-btn" @click="$router.back()">← 返回</button>
      <h2>争吵消防员 🧯</h2>
      <div class="notification-bell" @click="toggleNotifications">
        <span class="bell-icon">🔔</span>
        <span v-if="unreadCount > 0" class="badge">{{ unreadCount }}</span>
      </div>
    </div>

    <div class="content">
      <!-- 状态卡片 -->
      <div class="status-card">
        <div class="status-icon">{{ currentMood === 'happy' ? '😊' : currentMood === 'neutral' ? '😐' : '😢' }}</div>
        <h3>{{ currentMood === 'happy' ? '关系良好' : currentMood === 'neutral' ? '平静状态' : '需要关注' }}</h3>
        <p>{{ getDaysWithoutConflict() }} 天没有争吵</p>
      </div>

      <!-- 通知弹窗 -->
      <transition name="slide-down">
        <div v-if="showNotificationsPanel" class="notifications-panel">
          <div class="panel-header">
            <h3>💌 收到的关怀</h3>
            <button class="close-panel-btn" @click="showNotificationsPanel = false">✕</button>
          </div>
          <div v-if="notifications.length === 0" class="empty-notifications">
            <span class="empty-icon">📭</span>
            <p>暂无新消息</p>
          </div>
          <div v-else class="notification-list">
            <div 
              v-for="notif in notifications" 
              :key="notif.id"
              :class="['notification-item', notif.type, { unread: !notif.is_read }]"
              @click="markAsRead(notif.id)"
            >
              <div class="notif-icon">{{ notif.type === 'apology' ? '🙏' : notif.type === 'hug' ? '🤗' : '🎁' }}</div>
              <div class="notif-content">
                <div class="notif-sender">{{ notif.sender_name }}</div>
                <div class="notif-message">{{ notif.message }}</div>
                <div class="notif-time">{{ formatTime(notif.created_at) }}</div>
              </div>
              <span v-if="!notif.is_read" class="unread-badge">新</span>
            </div>
          </div>
        </div>
      </transition>

      <!-- 快速和解 -->
      <div class="quick-actions">
        <button class="action-btn sorry" @click="sendApology">
          <span class="btn-icon">🙏</span>
          <span>发送道歉</span>
        </button>
        <button class="action-btn hug" @click="sendHug">
          <span class="btn-icon">🤗</span>
          <span>虚拟拥抱</span>
        </button>
        <button class="action-btn gift" @click="sendGift">
          <span class="btn-icon">🎁</span>
          <span>送个礼物</span>
        </button>
      </div>

      <!-- 冷静技巧 -->
      <div class="tips-section">
        <h3>💡 冷静技巧</h3>
        <div class="tip-card" v-for="tip in tips" :key="tip.id">
          <div class="tip-number">{{ tip.id }}</div>
          <div class="tip-content">
            <h4>{{ tip.title }}</h4>
            <p>{{ tip.content }}</p>
          </div>
        </div>
      </div>

      <!-- 争吵记录 -->
      <div class="record-section">
        <div class="section-header">
          <h3>争吵记录</h3>
          <button class="add-btn" @click="showAddDialog = true">+ 记录</button>
        </div>
        
        <div class="record-list">
          <div 
            v-for="record in conflicts" 
            :key="record.id"
            class="record-item"
          >
            <div class="record-header">
              <span class="record-date">{{ formatDate(record.date) }}</span>
              <span :class="['record-status', record.resolved ? 'resolved' : 'pending']">
                {{ record.resolved ? '已和解 ✓' : '未解决' }}
              </span>
            </div>
            <div class="record-reason">原因：{{ record.reason }}</div>
            <div v-if="record.solution" class="record-solution">解决方案：{{ record.solution }}</div>
            <div class="record-actions">
              <button v-if="!record.resolved" class="resolve-btn" @click="resolveConflict(record.id)">
                标记为已和解
              </button>
              <button class="delete-btn" @click="deleteConflict(record.id)">删除</button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 添加记录对话框 -->
    <div v-if="showAddDialog" class="dialog-overlay" @click="showAddDialog = false">
      <div class="dialog-content" @click.stop>
        <h3>记录争吵</h3>
        <div class="form-group">
          <label>日期</label>
          <input type="date" class="conflict-date-input" v-model="newConflict.date" />
        </div>
        <div class="form-group">
          <label>原因</label>
          <textarea class="conflict-reason-input" v-model="newConflict.reason" rows="3" placeholder="发生了什么..."></textarea>
        </div>
        <div class="form-group">
          <label>解决方案（可选）</label>
          <textarea class="conflict-solution-input" v-model="newConflict.solution" rows="3" placeholder="如何解决..."></textarea>
        </div>
        <div class="dialog-actions">
          <button class="cancel-btn" @click="showAddDialog = false">取消</button>
          <button class="save-btn" @click="saveConflict">保存</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import http from '../api/http.js'

const currentMood = ref('happy')
const showAddDialog = ref(false)
const showNotificationsPanel = ref(false)
const conflicts = ref([])
const notifications = ref([])
const unreadCount = ref(0)
const newConflict = ref({
  date: new Date().toISOString().split('T')[0],
  reason: '',
  solution: ''
})

const tips = [
  { id: 1, title: '深呼吸', content: '在回应之前，先深呼吸3次，给自己冷静的时间' },
  { id: 2, title: '倾听理解', content: '尝试从对方的角度理解问题，而不是急于辩解' },
  { id: 3, title: '使用"我"语句', content: '说"我感到..."而不是"你总是..."，避免指责' },
  { id: 4, title: '暂停冷静', content: '如果情绪激动，可以暂时分开冷静一下再谈' },
  { id: 5, title: '寻找共识', content: '找到你们都认同的点，从共识开始讨论' }
]

const getDaysWithoutConflict = () => {
  if (conflicts.value.length === 0) return 365 // 没有任何记录，显示365天
  
  const unresolvedConflicts = conflicts.value.filter(c => !c.resolved)
  
  if (unresolvedConflicts.length === 0) {
    // 所有争吵都已和解，计算最后一次解决的时间
    const lastResolved = conflicts.value
      .filter(c => c.resolved_at)
      .sort((a, b) => new Date(b.resolved_at) - new Date(a.resolved_at))[0]
    
    if (!lastResolved || !lastResolved.resolved_at) return 365
    
    const days = Math.floor((new Date() - new Date(lastResolved.resolved_at)) / (1000 * 60 * 60 * 24))
    return Math.max(0, days)
  }
  
  // 有未解决的争吵，返回0天
  return 0
}

const sendApology = async () => {
  try {
    const res = await http.post('/fireman/apology')
    if (res.code === 200) {
      alert('道歉已发送给对方 🙏')
    }
  } catch (error) {
    console.error('发送道歉失败:', error)
    alert('发送失败，请稍后重试')
  }
}

const sendHug = async () => {
  try {
    const res = await http.post('/fireman/hug')
    if (res.code === 200) {
      alert('虚拟拥抱已发送 🤗')
    }
  } catch (error) {
    console.error('发送拥抱失败:', error)
    alert('发送失败，请稍后重试')
  }
}

const sendGift = () => {
  alert('礼物功能开发中... 🎁')
}

const saveConflict = async () => {
  if (!newConflict.value.reason.trim()) {
    alert('请填写争吵原因')
    return
  }
  
  try {
    const res = await http.post('/fireman/record', {
      date: newConflict.value.date,
      reason: newConflict.value.reason,
      solution: newConflict.value.solution
    })
    
    if (res.code === 200) {
      conflicts.value.unshift({
        id: res.data.id,
        ...newConflict.value,
        resolved: false
      })
      
      alert('保存成功！')
      showAddDialog.value = false
      newConflict.value = {
        date: new Date().toISOString().split('T')[0],
        reason: '',
        solution: ''
      }
      await loadConflicts()
    } else {
      alert('保存失败：' + (res.message || '未知错误'))
    }
  } catch (error) {
    console.error('保存失败:', error)
    alert('保存失败：' + (error.response?.data?.message || error.message))
  }
}

const resolveConflict = async (id) => {
  try {
    const res = await http.post(`/fireman/${id}/resolve`)
    if (res.code === 200) {
      const conflict = conflicts.value.find(c => c.id === id)
      if (conflict) {
        conflict.resolved = true
      }
    }
  } catch (error) {
    console.error('标记和解失败:', error)
    alert('操作失败，请稍后重试')
  }
}

const deleteConflict = async (id) => {
  if (!confirm('确定要删除这条记录吗？')) return
  
  try {
    const res = await http.delete(`/fireman/${id}`)
    if (res.code === 200) {
      conflicts.value = conflicts.value.filter(c => c.id !== id)
    }
  } catch (error) {
    console.error('删除失败:', error)
    alert('删除失败，请稍后重试')
  }
}

const formatDate = (date) => {
  if (!date) return ''
  const d = new Date(date)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

const loadConflicts = async () => {
  try {
    const res = await http.get('/fireman/history')
    if (res.code === 200) {
      conflicts.value = res.data
    }
  } catch (error) {
    console.error('加载争吵记录失败:', error)
  }
}

const loadNotifications = async () => {
  try {
    const res = await http.get('/fireman/notifications')
    if (res.code === 200) {
      notifications.value = res.data
      // 计算未读数量
      unreadCount.value = notifications.value.filter(n => !n.is_read).length
    }
  } catch (error) {
    console.error('加载通知失败:', error)
  }
}

const toggleNotifications = () => {
  showNotificationsPanel.value = !showNotificationsPanel.value
}

const markAsRead = async (id) => {
  try {
    await http.post(`/fireman/notifications/${id}/read`)
    const notif = notifications.value.find(n => n.id === id)
    if (notif && !notif.is_read) {
      notif.is_read = 1
      unreadCount.value = Math.max(0, unreadCount.value - 1)
    }
  } catch (error) {
    console.error('标记已读失败:', error)
  }
}

const formatTime = (time) => {
  if (!time) return ''
  const date = new Date(time)
  const now = new Date()
  const diff = now - date
  
  if (diff < 60000) return '刚刚'
  if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`
  
  return `${date.getMonth() + 1}-${date.getDate()} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
}

onMounted(() => {
  loadConflicts()
  loadNotifications()
})
</script>

<style scoped>
.conflict-page {
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
  background: rgba(255,255,255,0.2);
  border: none;
  color: white;
  padding: 8px 16px;
  border-radius: 20px;
  cursor: pointer;
  font-size: 16px;
}

.notification-bell {
  position: relative;
  cursor: pointer;
  padding: 8px 16px;
  background: rgba(255,255,255,0.2);
  border-radius: 20px;
  display: flex;
  align-items: center;
  gap: 5px;
  transition: all 0.3s;
}

.notification-bell:hover {
  background: rgba(255,255,255,0.3);
  transform: scale(1.05);
}

.bell-icon {
  font-size: 20px;
  animation: ring 2s ease-in-out infinite;
}

@keyframes ring {
  0%, 100% { transform: rotate(0deg); }
  10%, 30% { transform: rotate(-15deg); }
  20%, 40% { transform: rotate(15deg); }
}

.badge {
  position: absolute;
  top: -5px;
  right: -5px;
  background: #FF1744;
  color: white;
  border-radius: 50%;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: bold;
  border: 2px solid white;
}

.content {
  padding: 20px;
}

.status-card {
  background: white;
  border-radius: 20px;
  padding: 40px;
  text-align: center;
  margin-bottom: 20px;
  box-shadow: 0 8px 21px rgba(255, 77, 136, 0.1);
}

.status-icon {
  font-size: 64px;
  margin-bottom: 15px;
}

.status-card h3 {
  color: #333;
  margin-bottom: 10px;
  font-size: 24px;
}

.status-card p {
  color: #666;
  font-size: 16px;
}

.quick-actions {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 15px;
  margin-bottom: 20px;
}

.action-btn {
  background: white;
  border: 2px solid #FF4D88;
  border-radius: 15px;
  padding: 20px 10px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  transition: all 0.3s;
}

.action-btn:hover {
  background: linear-gradient(135deg, #FF4D88, #FF98B9);
  color: white;
  transform: translateY(-2px);
}

.btn-icon {
  font-size: 32px;
}

.tips-section {
  background: white;
  border-radius: 20px;
  padding: 20px;
  margin-bottom: 20px;
  box-shadow: 0 8px 21px rgba(255, 77, 136, 0.1);
}

.tips-section h3 {
  color: #333;
  margin-bottom: 15px;
}

.tip-card {
  display: flex;
  gap: 15px;
  margin-bottom: 15px;
  padding: 15px;
  background: #FFF5F8;
  border-radius: 10px;
}

.tip-number {
  width: 30px;
  height: 30px;
  background: linear-gradient(135deg, #FF4D88, #FF98B9);
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  flex-shrink: 0;
}

.tip-content h4 {
  color: #333;
  margin-bottom: 5px;
  font-size: 16px;
}

.tip-content p {
  color: #666;
  font-size: 14px;
  line-height: 1.6;
}

.record-section {
  background: white;
  border-radius: 20px;
  padding: 20px;
  box-shadow: 0 8px 21px rgba(255, 77, 136, 0.1);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.section-header h3 {
  color: #333;
}

.add-btn {
  background: linear-gradient(135deg, #FF4D88, #FF98B9);
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 15px;
  cursor: pointer;
  font-size: 14px;
}

.record-list {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.record-item {
  padding: 15px;
  background: #FFF5F8;
  border-radius: 10px;
  border-left: 4px solid #FF4D88;
}

.record-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.record-date {
  color: #666;
  font-size: 14px;
}

.record-status {
  padding: 4px 12px;
  border-radius: 10px;
  font-size: 12px;
  font-weight: bold;
}

.record-status.resolved {
  background: #4CAF50;
  color: white;
}

.record-status.pending {
  background: #FFC107;
  color: white;
}

.record-reason {
  color: #333;
  margin-bottom: 8px;
  font-size: 14px;
}

.record-solution {
  color: #666;
  font-size: 13px;
  margin-bottom: 10px;
  font-style: italic;
}

.record-actions {
  display: flex;
  gap: 10px;
}

.resolve-btn, .delete-btn {
  padding: 6px 12px;
  border-radius: 8px;
  border: none;
  cursor: pointer;
  font-size: 12px;
}

.resolve-btn {
  background: #4CAF50;
  color: white;
}

.delete-btn {
  background: #f44336;
  color: white;
}

.dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.dialog-content {
  background: white;
  border-radius: 20px;
  padding: 30px;
  width: 90%;
  max-width: 500px;
}

.dialog-content h3 {
  color: #333;
  margin-bottom: 20px;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  color: #333;
  margin-bottom: 8px;
  font-weight: bold;
}

.form-group input,
.form-group textarea {
  width: 100%;
  padding: 12px;
  border: 2px solid #E5E7EB;
  border-radius: 10px;
  font-size: 14px;
  font-family: inherit;
}

.form-group input:focus,
.form-group textarea:focus {
  outline: none;
  border-color: #FF4D88;
}

.dialog-actions {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
}

.cancel-btn, .save-btn {
  padding: 10px 24px;
  border-radius: 15px;
  border: none;
  cursor: pointer;
  font-size: 14px;
  font-weight: bold;
}

.cancel-btn {
  background: #E5E7EB;
  color: #666;
}

.save-btn {
  background: linear-gradient(135deg, #FF4D88, #FF98B9);
  color: white;
}

/* 通知弹窗样式 */
.notifications-panel {
  position: fixed;
  top: 80px;
  right: 20px;
  width: 380px;
  max-height: 500px;
  background: white;
  border-radius: 20px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
  z-index: 1000;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.panel-header {
  padding: 20px;
  border-bottom: 2px solid #f0f0f0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: linear-gradient(135deg, #FF4D88, #FF98B9);
}

.panel-header h3 {
  color: white;
  margin: 0;
  font-size: 18px;
}

.close-panel-btn {
  background: rgba(255, 255, 255, 0.3);
  border: none;
  color: white;
  font-size: 24px;
  cursor: pointer;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s;
}

.close-panel-btn:hover {
  background: rgba(255, 255, 255, 0.5);
  transform: rotate(90deg);
}

.empty-notifications {
  padding: 60px 20px;
  text-align: center;
  color: #999;
}

.empty-icon {
  font-size: 64px;
  display: block;
  margin-bottom: 15px;
}

/* 动画效果 */
.slide-down-enter-active, .slide-down-leave-active {
  transition: all 0.3s ease;
}

.slide-down-enter-from {
  opacity: 0;
  transform: translateY(-20px);
}

.slide-down-leave-to {
  opacity: 0;
  transform: translateY(-20px);
}

.notification-list {
  display: flex;
  flex-direction: column;
  gap: 0;
  max-height: 400px;
  overflow-y: auto;
}

.notification-item {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 15px 20px;
  background: white;
  border-bottom: 1px solid #f0f0f0;
  cursor: pointer;
  transition: all 0.3s;
  position: relative;
}

.notification-item:hover {
  background: #FFF5F8;
}

.notification-item.unread {
  background: linear-gradient(135deg, #FFF5F8, #FFE5EE);
  border-left: 4px solid #FF4D88;
}

.notif-icon {
  font-size: 32px;
  flex-shrink: 0;
}

.notif-content {
  flex: 1;
}

.notif-sender {
  font-weight: bold;
  color: #FF4D88;
  margin-bottom: 4px;
  font-size: 14px;
}

.notif-message {
  color: #333;
  font-size: 14px;
  margin-bottom: 4px;
}

.notif-time {
  color: #999;
  font-size: 12px;
}

.unread-badge {
  background: #FF4D88;
  color: white;
  padding: 4px 8px;
  border-radius: 10px;
  font-size: 12px;
  font-weight: bold;
}
</style>

