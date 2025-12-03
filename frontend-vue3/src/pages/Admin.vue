<template>
  <div class="admin-page">
    <div class="header">
      <h1>🛠️ 管理后台</h1>
      <button class="back-btn" @click="$router.push('/home')">返回首页</button>
    </div>
    
    <div class="content">
      <!-- 数据统计 -->
      <div class="stats-section">
        <h2>📊 平台数据统计</h2>
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-value">{{ platformStats.totalUsers }}</div>
            <div class="stat-label">总用户数</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">{{ platformStats.totalCouples }}</div>
            <div class="stat-label">配对数</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">{{ platformStats.totalDiaries }}</div>
            <div class="stat-label">日记总数</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">{{ platformStats.totalMemories }}</div>
            <div class="stat-label">回忆总数</div>
          </div>
        </div>
      </div>

      <!-- 用户管理 -->
      <div class="management-section">
        <h2>👥 用户管理</h2>
        <div class="search-bar">
          <input 
            v-model="searchKeyword" 
            class="search-input"
            placeholder="搜索用户名..."
            @keyup.enter="searchUsers"
          />
          <button class="search-btn" @click="searchUsers">搜索</button>
          <button class="refresh-btn" @click="loadUsers">刷新</button>
        </div>
        
        <div class="table-container">
          <table class="user-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>用户名</th>
                <th>邮箱</th>
                <th>性别</th>
                <th>配对状态</th>
                <th>注册时间</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="user in users" :key="user.id">
                <td>{{ user.id }}</td>
                <td>{{ user.username }}</td>
                <td>{{ user.email || '未设置' }}</td>
                <td>{{ getGenderText(user.gender) }}</td>
                <td>
                  <span :class="['status-badge', user.couple_id ? 'paired' : 'unpaired']">
                    {{ user.couple_id ? '已配对' : '未配对' }}
                  </span>
                </td>
                <td>{{ formatDate(user.created_at) }}</td>
              </tr>
            </tbody>
          </table>
          <div v-if="users.length === 0" class="empty">暂无用户数据</div>
        </div>
      </div>

      <!-- 配对管理 -->
      <div class="management-section">
        <h2>💑 配对管理</h2>
        <button class="refresh-btn" @click="loadCouples" style="margin-bottom: 15px;">刷新</button>
        
        <div class="table-container">
          <table class="couple-table">
            <thead>
              <tr>
                <th>配对ID</th>
                <th>用户1</th>
                <th>用户2</th>
                <th>开始日期</th>
                <th>状态</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="couple in couples" :key="couple.id">
                <td>{{ couple.id }}</td>
                <td>{{ couple.user1_name || `ID:${couple.user1_id}` }}</td>
                <td>{{ couple.user2_name || `ID:${couple.user2_id}` }}</td>
                <td>{{ formatDate(couple.relationship_start_date) }}</td>
                <td>
                  <span :class="['status-badge', couple.relationship_status]">
                    {{ couple.relationship_status === 'active' ? '活跃' : '已结束' }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
          <div v-if="couples.length === 0" class="empty">暂无配对数据</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import http from '../api/http.js'

const platformStats = ref({
  totalUsers: 0,
  totalCouples: 0,
  totalDiaries: 0,
  totalMemories: 0
})

const searchKeyword = ref('')
const users = ref([])
const couples = ref([])

const getGenderText = (gender) => {
  const map = { 'male': '男', 'female': '女', 'other': '其他' }
  return map[gender] || '未设置'
}

const formatDate = (date) => {
  if (!date) return '未知'
  const d = new Date(date)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

const loadPlatformStats = async () => {
  try {
    console.log('📊 加载平台统计...')
    const res = await http.get('/admin/stats')
    platformStats.value = res.data || platformStats.value
    console.log('✅ 平台统计:', platformStats.value)
  } catch (error) {
    console.error('❌ 加载统计失败:', error)
  }
}

const loadUsers = async () => {
  try {
    console.log('👥 加载用户列表...')
    const res = await http.get('/admin/users', {
      params: { page: 1, limit: 100 }
    })
    users.value = res.data?.list || res.data || []
    console.log('✅ 用户列表:', users.value.length, '个用户')
  } catch (error) {
    console.error('❌ 加载用户失败:', error)
    alert('加载失败：' + (error.response?.data?.message || error.message))
  }
}

const searchUsers = async () => {
  if (!searchKeyword.value.trim()) {
    await loadUsers()
    return
  }
  
  try {
    console.log('🔍 搜索用户:', searchKeyword.value)
    const res = await http.get('/admin/users/search', {
      params: { keyword: searchKeyword.value }
    })
    users.value = res.data || []
    console.log('✅ 搜索结果:', users.value.length, '个用户')
  } catch (error) {
    console.error('❌ 搜索失败:', error)
    alert('搜索失败：' + (error.response?.data?.message || error.message))
  }
}

const loadCouples = async () => {
  try {
    console.log('💑 加载配对列表...')
    const res = await http.get('/admin/couples')
    couples.value = res.data || []
    console.log('✅ 配对列表:', couples.value.length, '对')
  } catch (error) {
    console.error('❌ 加载配对失败:', error)
    alert('加载失败：' + (error.response?.data?.message || error.message))
  }
}

onMounted(() => {
  loadPlatformStats()
  loadUsers()
  loadCouples()
})
</script>

<style scoped>
.admin-page {
  min-height: 100vh;
  background: #f5f5f5;
}

.header {
  background: linear-gradient(135deg, #FF4D88, #FF98B9);
  color: white;
  padding: 20px 40px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header h1 {
  font-size: 28px;
}

.back-btn {
  padding: 10px 20px;
  background: rgba(255,255,255,0.2);
  border: 2px solid white;
  color: white;
  border-radius: 8px;
  cursor: pointer;
  font-size: 16px;
}

.content {
  max-width: 1400px;
  margin: 40px auto;
  padding: 0 40px;
}

.stats-section {
  margin-bottom: 40px;
}

.stats-section h2, .management-section h2 {
  color: #333;
  margin-bottom: 20px;
  font-size: 24px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
}

.stat-card {
  background: white;
  border-radius: 20px;
  padding: 30px;
  text-align: center;
  box-shadow: 0 4px 15px rgba(0,0,0,0.1);
}

.stat-value {
  font-size: 48px;
  font-weight: bold;
  color: #FF4D88;
  margin-bottom: 10px;
}

.stat-label {
  font-size: 16px;
  color: #666;
}

.management-section {
  background: white;
  border-radius: 20px;
  padding: 30px;
  margin-bottom: 30px;
  box-shadow: 0 4px 15px rgba(0,0,0,0.1);
}

.search-bar {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
}

.search-input {
  flex: 1;
  padding: 12px 16px;
  border: 2px solid #e0e0e0;
  border-radius: 10px;
  font-size: 16px;
}

.search-btn, .refresh-btn {
  padding: 12px 24px;
  background: #FF4D88;
  color: white;
  border: none;
  border-radius: 10px;
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
}

.refresh-btn {
  background: #4CAF50;
}

.table-container {
  overflow-x: auto;
}

table {
  width: 100%;
  border-collapse: collapse;
}

thead {
  background: #f5f5f5;
}

th, td {
  padding: 15px;
  text-align: left;
  border-bottom: 1px solid #e0e0e0;
}

th {
  font-weight: bold;
  color: #333;
}

td {
  color: #666;
}

.status-badge {
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 500;
}

.status-badge.paired {
  background: #e8f5e9;
  color: #4CAF50;
}

.status-badge.unpaired {
  background: #fff3e0;
  color: #ff9800;
}

.status-badge.active {
  background: #e8f5e9;
  color: #4CAF50;
}

.status-badge.inactive {
  background: #ffebee;
  color: #f44336;
}

.empty {
  text-align: center;
  padding: 40px;
  color: #999;
}

@media (max-width: 1024px) {
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }
}
</style>

