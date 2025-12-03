<template>
  <div class="period-page">
    <div class="header">
      <button class="back-btn" @click="$router.back()">← 返回</button>
      <h1>经期管理</h1>
      <button class="add-period-btn" @click="showEditor = true">+ 记录</button>
    </div>
    
    <div class="content">
      <!-- 记录编辑器 -->
      <div v-if="showEditor" class="period-editor">
        <h3>记录经期</h3>
        
        <div class="form-group">
          <label>开始日期</label>
          <input 
            v-model="newPeriod.start_date" 
            class="date-input"
            type="date"
          />
        </div>
        
        <div class="form-group">
          <label>结束日期（可选）</label>
          <input 
            v-model="newPeriod.end_date" 
            class="date-input"
            type="date"
          />
        </div>
        
        <div class="form-group">
          <label>周期长度（天）</label>
          <input 
            v-model.number="newPeriod.cycle_length" 
            class="number-input"
            type="number"
            min="21"
            max="45"
            placeholder="默认28天"
          />
        </div>
        
        <div class="editor-actions">
          <button class="save-period-btn" @click="savePeriod">保存</button>
          <button class="cancel-btn" @click="cancelEdit">取消</button>
        </div>
      </div>
      
      <!-- 预测卡片 -->
      <div v-if="prediction" class="prediction-card">
        <h3>📅 下次经期预测</h3>
        <div class="prediction-info">
          <div class="prediction-date">
            <span class="date-label">预计开始日期：</span>
            <span class="date-value">{{ prediction.next_start_date }}</span>
          </div>
          <div class="prediction-note">
            <span class="countdown">距离：{{ prediction.days_until }} 天</span>
          </div>
        </div>
      </div>
      
      <!-- 本月信息 -->
      <div v-if="currentMonth" class="current-month">
        <h3>📊 本月信息</h3>
        <div class="month-info">
          <div class="info-item">
            <span class="label">状态：</span>
            <span class="value" :class="currentMonth.status">
              {{ getStatusText(currentMonth.status) }}
            </span>
          </div>
          <div v-if="currentMonth.start_date" class="info-item">
            <span class="label">开始日期：</span>
            <span class="value">{{ currentMonth.start_date }}</span>
          </div>
          <div v-if="currentMonth.cycle_length" class="info-item">
            <span class="label">周期：</span>
            <span class="value">{{ currentMonth.cycle_length }} 天</span>
          </div>
        </div>
      </div>
      
      <!-- 历史记录 -->
      <div class="history-section">
        <h3>📖 历史记录</h3>
        <div v-if="history.length === 0" class="empty">暂无历史记录</div>
        <div v-for="record in history" :key="record.id" class="history-item">
          <div class="history-date">
            <div class="month">{{ formatMonth(record.start_date) }}</div>
            <div class="day">{{ formatDay(record.start_date) }}</div>
          </div>
          <div class="history-info">
            <div class="date-range">
              <span>{{ record.start_date }}</span>
              <span v-if="record.end_date"> - {{ record.end_date }}</span>
            </div>
            <div class="cycle-info">
              周期：{{ record.cycle_length }} 天
              <span v-if="record.end_date" class="duration">
                （持续 {{ calculateDuration(record.start_date, record.end_date) }} 天）
              </span>
            </div>
          </div>
          <button class="delete-period-btn" @click="deletePeriod(record.id)">删除</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import http from '../api/http.js'

const showEditor = ref(false)
const newPeriod = ref({ start_date: '', end_date: '', cycle_length: 28 })
const prediction = ref(null)
const currentMonth = ref(null)
const history = ref([])

const formatMonth = (date) => {
  return new Date(date).getMonth() + 1 + '月'
}

const formatDay = (date) => {
  return new Date(date).getDate()
}

const getStatusText = (status) => {
  const statusMap = {
    'in_period': '经期中',
    'before_period': '安全期',
    'after_period': '安全期'
  }
  return statusMap[status] || '未知'
}

const calculateDuration = (start, end) => {
  const s = new Date(start)
  const e = new Date(end)
  return Math.ceil((e - s) / (1000 * 60 * 60 * 24)) + 1
}

const loadPrediction = async () => {
  try {
    const res = await http.get('/period/predict')
    prediction.value = res.data
  } catch (error) {
    console.error('❌ 加载预测失败:', error)
  }
}

const loadCurrentMonth = async () => {
  try {
    const res = await http.get('/period/month')
    currentMonth.value = res.data
  } catch (error) {
    console.error('❌ 加载本月信息失败:', error)
  }
}

const loadHistory = async () => {
  try {
    const res = await http.get('/period/history', {
      params: { page: 1, limit: 12 }
    })
    history.value = res.data?.list || res.data || []
  } catch (error) {
    console.error('❌ 加载历史失败:', error)
  }
}

const savePeriod = async () => {
  if (!newPeriod.value.start_date) {
    alert('请选择开始日期')
    return
  }
  
  if (newPeriod.value.cycle_length < 21 || newPeriod.value.cycle_length > 45) {
    alert('周期长度应在21-45天之间')
    return
  }
  
  try {
    await http.post('/period/record', newPeriod.value)
    alert('保存成功！')
    newPeriod.value = { start_date: '', end_date: '', cycle_length: 28 }
    showEditor.value = false
    await loadPrediction()
    await loadCurrentMonth()
    await loadHistory()
  } catch (error) {
    console.error('❌ 保存失败:', error)
    alert('保存失败：' + (error.response?.data?.message || error.message))
  }
}

const cancelEdit = () => {
  showEditor.value = false
  newPeriod.value = { start_date: '', end_date: '', cycle_length: 28 }
}

const deletePeriod = async (id) => {
  if (!confirm('确定删除这条记录吗？')) return
  
  try {
    await http.delete(`/period/${id}`)
    alert('删除成功！')
    await loadHistory()
    await loadPrediction()
  } catch (error) {
    console.error('❌ 删除失败:', error)
    alert('删除失败')
  }
}

onMounted(() => {
  loadPrediction()
  loadCurrentMonth()
  loadHistory()
})
</script>

<style scoped>
.period-page {
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

.back-btn, .add-period-btn {
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

.period-editor {
  background: white;
  border-radius: 34px;
  padding: 30px;
  margin-bottom: 30px;
  box-shadow: 0 8px 21px rgba(255, 77, 136, 0.1);
}

.period-editor h3 {
  margin-bottom: 20px;
  color: #333;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  color: #333;
  font-weight: 500;
}

.date-input, .number-input {
  width: 100%;
  padding: 12px;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 16px;
}

.editor-actions {
  display: flex;
  gap: 10px;
}

.save-period-btn {
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

.prediction-card {
  background: white;
  border-radius: 34px;
  padding: 30px;
  margin-bottom: 30px;
  box-shadow: 0 8px 21px rgba(255, 77, 136, 0.1);
}

.prediction-card h3 {
  margin-bottom: 20px;
  color: #333;
  font-size: 20px;
}

.prediction-info {
  background: linear-gradient(135deg, #fff0f5, #ffe4e8);
  padding: 25px;
  border-radius: 20px;
}

.prediction-date {
  margin-bottom: 15px;
}

.date-label {
  color: #666;
  font-size: 16px;
}

.date-value {
  color: #FF4D88;
  font-size: 24px;
  font-weight: bold;
  margin-left: 10px;
}

.countdown {
  color: #666;
  font-size: 16px;
}

.current-month {
  background: white;
  border-radius: 34px;
  padding: 30px;
  margin-bottom: 30px;
  box-shadow: 0 8px 21px rgba(255, 77, 136, 0.1);
}

.current-month h3 {
  margin-bottom: 20px;
  color: #333;
  font-size: 20px;
}

.month-info {
  background: #f9f9f9;
  padding: 20px;
  border-radius: 16px;
}

.info-item {
  margin-bottom: 12px;
  font-size: 16px;
}

.info-item:last-child {
  margin-bottom: 0;
}

.info-item .label {
  color: #666;
  margin-right: 10px;
}

.info-item .value {
  color: #333;
  font-weight: 500;
}

.info-item .value.in_period {
  color: #FF4D88;
  font-weight: bold;
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

.date-range {
  font-size: 16px;
  font-weight: bold;
  color: #333;
  margin-bottom: 5px;
}

.cycle-info {
  font-size: 14px;
  color: #666;
}

.duration {
  color: #FF4D88;
  font-weight: 500;
}

.delete-period-btn {
  padding: 6px 16px;
  background: #ff4444;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
}
</style>




