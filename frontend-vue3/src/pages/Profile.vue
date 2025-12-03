<template>
  <div class="profile-page">
    <div class="header">
      <button class="back-btn" @click="$router.back()">← 返回</button>
      <h1>个人主页</h1>
      <button class="edit-btn" @click="toggleEdit">{{ isEditing ? '取消' : '编辑' }}</button>
    </div>
    
    <div class="content">
      <!-- 个人信息卡片 -->
      <div class="profile-card">
        <div class="avatar-section">
          <div class="avatar">{{ userInfo.username ? userInfo.username.charAt(0) : '?' }}</div>
          <h2>{{ userInfo.username }}</h2>
          <p class="user-id">ID: {{ userInfo.id }}</p>
        </div>

        <!-- 查看模式 -->
        <div v-if="!isEditing" class="info-section">
          <div class="info-item">
            <span class="label">📧 邮箱</span>
            <span class="value">{{ userInfo.email || '未设置' }}</span>
          </div>
          <div class="info-item">
            <span class="label">⚧️ 性别</span>
            <span class="value">{{ getGenderText(userInfo.gender) }}</span>
          </div>
          <div class="info-item">
            <span class="label">🎂 生日</span>
            <span class="value">{{ userInfo.birthday || '未设置' }}</span>
          </div>
          <div class="info-item">
            <span class="label">📍 位置</span>
            <span class="value">{{ userInfo.location || '未设置' }}</span>
          </div>
          <div class="info-item">
            <span class="label">💑 配对状态</span>
            <span class="value">{{ userInfo.couple_id ? '已配对' : '未配对' }}</span>
          </div>
          <div class="info-item">
            <span class="label">📅 注册时间</span>
            <span class="value">{{ formatDate(userInfo.created_at) }}</span>
          </div>
        </div>

        <!-- 编辑模式 -->
        <div v-else class="edit-section">
          <div class="form-group">
            <label>📧 邮箱</label>
            <input v-model="editForm.email" type="email" class="email-input" placeholder="请输入邮箱">
          </div>
          <div class="form-group">
            <label>⚧️ 性别</label>
            <select v-model="editForm.gender" class="gender-select">
              <option value="">未设置</option>
              <option value="male">男</option>
              <option value="female">女</option>
              <option value="other">其他</option>
            </select>
          </div>
          <div class="form-group">
            <label>🎂 生日</label>
            <input v-model="editForm.birthday" type="date" class="birthday-input">
          </div>
          <div class="form-group">
            <label>📍 位置</label>
            <input v-model="editForm.location" type="text" class="location-input" placeholder="请输入位置">
          </div>
          <button class="save-btn" @click="saveProfile">保存修改</button>
        </div>
      </div>

      <!-- 配对信息卡片 -->
      <div v-if="userInfo.couple_id" class="couple-card">
        <h3>💑 配对信息</h3>
        <div class="couple-info">
          <div class="partner-avatar">{{ partnerInfo.username ? partnerInfo.username.charAt(0) : 'TA' }}</div>
          <div class="partner-details">
            <h4>{{ partnerInfo.username || '加载中...' }}</h4>
            <p>恋爱 {{ getDaysInLove() }} 天</p>
          </div>
        </div>
        <button class="manage-couple-btn" @click="$router.push('/couple')">管理配对</button>
      </div>

      <!-- 未配对提示 -->
      <div v-else class="no-couple-card">
        <div class="icon">💔</div>
        <p>还没有配对哦</p>
        <button class="find-couple-btn" @click="$router.push('/couple')">去配对</button>
      </div>

      <!-- 数据统计 -->
      <div class="stats-card">
        <h3>📊 数据统计</h3>
        <div class="stats-grid">
          <div class="stat-item">
            <div class="stat-value">{{ stats.diaryCount }}</div>
            <div class="stat-label">日记数</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">{{ stats.memoryCount }}</div>
            <div class="stat-label">回忆数</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">{{ stats.chatCount }}</div>
            <div class="stat-label">消息数</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">{{ stats.moodCount }}</div>
            <div class="stat-label">心情数</div>
          </div>
        </div>
      </div>

      <!-- 修改密码 -->
      <div class="password-card">
        <h3>🔐 修改密码</h3>
        <div class="form-group">
          <label>当前密码</label>
          <input v-model="passwordForm.oldPassword" type="password" class="old-password-input" placeholder="请输入当前密码">
        </div>
        <div class="form-group">
          <label>新密码</label>
          <input v-model="passwordForm.newPassword" type="password" class="new-password-input" placeholder="请输入新密码">
        </div>
        <div class="form-group">
          <label>确认新密码</label>
          <input v-model="passwordForm.confirmPassword" type="password" placeholder="请再次输入新密码">
        </div>
        <button class="change-password-btn" @click="changePassword">修改密码</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import http from '../api/http.js'

const router = useRouter()
const isEditing = ref(false)
const userInfo = ref({})
const partnerInfo = ref({})
const editForm = ref({})
const passwordForm = ref({
  oldPassword: '',
  newPassword: '',
  confirmPassword: ''
})
const stats = ref({
  diaryCount: 0,
  memoryCount: 0,
  chatCount: 0,
  moodCount: 0
})

const getGenderText = (gender) => {
  const map = { 'male': '男', 'female': '女', 'other': '其他' }
  return map[gender] || '未设置'
}

const formatDate = (date) => {
  if (!date) return '未知'
  const d = new Date(date)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

const getDaysInLove = () => {
  if (!partnerInfo.value.relationship_start_date) return 0
  const start = new Date(partnerInfo.value.relationship_start_date)
  const now = new Date()
  const diff = Math.floor((now - start) / (1000 * 60 * 60 * 24))
  return diff > 0 ? diff : 0
}

const loadUserInfo = async () => {
  try {
    console.log('📋 加载用户信息...')
    const res = await http.get('/user/me')
    userInfo.value = res.data
    console.log('✅ 用户信息:', userInfo.value)
    
    // 如果有配对，加载伴侣信息
    if (userInfo.value.partner_id) {
      const partnerRes = await http.get(`/user/${userInfo.value.partner_id}`)
      partnerInfo.value = partnerRes.data
      partnerInfo.value.relationship_start_date = userInfo.value.relationship_start_date
    }
  } catch (error) {
    console.error('❌ 加载用户信息失败:', error)
    alert('加载失败：' + (error.response?.data?.message || error.message))
  }
}

const loadStats = async () => {
  try {
    console.log('📊 加载数据统计...')
    
    // 加载日记数
    const diaryRes = await http.get('/diary/list', { params: { page: 1, limit: 1 } })
    stats.value.diaryCount = diaryRes.data?.total || 0
    
    // 加载回忆数
    const memoryRes = await http.get('/memory/list', { params: { page: 1, limit: 1 } })
    stats.value.memoryCount = memoryRes.data?.total || 0
    
    // 加载消息数
    const chatRes = await http.get('/chat/history', { params: { page: 1, limit: 1 } })
    stats.value.chatCount = chatRes.data?.total || 0
    
    // 加载心情数
    const moodRes = await http.get('/mood/list', { params: { page: 1, limit: 1 } })
    stats.value.moodCount = moodRes.data?.total || 0
    
    console.log('✅ 数据统计:', stats.value)
  } catch (error) {
    console.error('❌ 加载统计失败:', error)
  }
}

const toggleEdit = () => {
  if (!isEditing.value) {
    // 进入编辑模式，复制当前信息
    editForm.value = {
      email: userInfo.value.email || '',
      gender: userInfo.value.gender || '',
      birthday: userInfo.value.birthday || '',
      location: userInfo.value.location || ''
    }
  }
  isEditing.value = !isEditing.value
}

const saveProfile = async () => {
  try {
    console.log('💾 保存个人信息...', editForm.value)
    await http.put('/user/profile', editForm.value)
    alert('保存成功！')
    isEditing.value = false
    await loadUserInfo()
  } catch (error) {
    console.error('❌ 保存失败:', error)
    alert('保存失败：' + (error.response?.data?.message || error.message))
  }
}

const changePassword = async () => {
  if (!passwordForm.value.oldPassword || !passwordForm.value.newPassword) {
    alert('请填写所有密码字段')
    return
  }
  
  if (passwordForm.value.newPassword !== passwordForm.value.confirmPassword) {
    alert('两次输入的新密码不一致')
    return
  }
  
  if (passwordForm.value.newPassword.length < 6) {
    alert('新密码至少需要6个字符')
    return
  }
  
  try {
    console.log('🔐 修改密码...')
    await http.put('/user/password', {
      oldPassword: passwordForm.value.oldPassword,
      newPassword: passwordForm.value.newPassword
    })
    alert('密码修改成功！')
    passwordForm.value = {
      oldPassword: '',
      newPassword: '',
      confirmPassword: ''
    }
  } catch (error) {
    console.error('❌ 修改密码失败:', error)
    alert('修改失败：' + (error.response?.data?.message || error.message))
  }
}

onMounted(() => {
  loadUserInfo()
  loadStats()
})
</script>

<style scoped>
.profile-page {
  min-height: 100vh;
  background: linear-gradient(180deg, #FFE5EC, #FFF5F8);
}

.header {
  background: linear-gradient(135deg, #FF4D88, #FF98B9);
  color: white;
  padding: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.back-btn, .edit-btn {
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
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.profile-card, .couple-card, .no-couple-card, .stats-card, .password-card {
  background: white;
  border-radius: 34px;
  padding: 30px;
  box-shadow: 0 8px 21px rgba(255, 77, 136, 0.1);
}

.avatar-section {
  text-align: center;
  margin-bottom: 30px;
}

.avatar {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  background: linear-gradient(135deg, #FF4D88, #FF98B9);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 40px;
  font-weight: bold;
  margin: 0 auto 15px;
}

.avatar-section h2 {
  color: #333;
  margin-bottom: 5px;
}

.user-id {
  color: #999;
  font-size: 14px;
}

.info-section {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px;
  background: #FFF5F8;
  border-radius: 15px;
}

.label {
  font-weight: 500;
  color: #666;
}

.value {
  color: #333;
  font-weight: 600;
}

.edit-section {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-group label {
  font-weight: 500;
  color: #666;
}

.form-group input, .form-group select {
  padding: 12px;
  border: 2px solid #e0e0e0;
  border-radius: 10px;
  font-size: 16px;
}

.save-btn, .change-password-btn, .manage-couple-btn, .find-couple-btn {
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

.couple-card h3, .stats-card h3, .password-card h3 {
  color: #333;
  margin-bottom: 20px;
}

.couple-info {
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 20px;
  background: #FFF5F8;
  border-radius: 20px;
  margin-bottom: 15px;
}

.partner-avatar {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  font-weight: bold;
}

.partner-details h4 {
  color: #333;
  margin-bottom: 5px;
}

.partner-details p {
  color: #666;
  font-size: 14px;
}

.no-couple-card {
  text-align: center;
  padding: 40px;
}

.no-couple-card .icon {
  font-size: 60px;
  margin-bottom: 20px;
}

.no-couple-card p {
  color: #999;
  margin-bottom: 20px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 15px;
}

.stat-item {
  text-align: center;
  padding: 20px;
  background: #FFF5F8;
  border-radius: 15px;
}

.stat-value {
  font-size: 32px;
  font-weight: bold;
  color: #FF4D88;
  margin-bottom: 5px;
}

.stat-label {
  font-size: 14px;
  color: #666;
}

@media (max-width: 768px) {
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>

