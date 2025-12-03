<template>
  <div class="couple-page">
    <div class="header">
      <button class="back-btn" @click="$router.back()">← 返回</button>
      <h1>情侣配对 💕</h1>
      <div></div>
    </div>
    
    <div class="content">
      <!-- 已配对状态 -->
      <div v-if="coupleInfo.partnerId" class="couple-status">
        <div class="status-card paired">
          <div class="status-icon">💑</div>
          <h2>已配对</h2>
          <div class="partner-info">
            <div class="avatar">{{ partnerName.charAt(0) }}</div>
            <div class="info">
              <h3>{{ partnerName }}</h3>
              <p>恋爱 {{ getDaysInLove() }} 天</p>
            </div>
          </div>
          <button class="unpair-btn" @click="confirmUnpair">解除配对</button>
        </div>

        <!-- 配对功能说明 -->
        <div class="feature-tips">
          <h3>🎉 已启用的情侣功能</h3>
          <div class="tip-item">✅ 共享日记 - 你们可以共同查看和编辑日记</div>
          <div class="tip-item">✅ 实时聊天 - 与TA随时交流</div>
          <div class="tip-item">✅ 位置共享 - 知道彼此的位置</div>
          <div class="tip-item">✅ 共同账本 - 一起记录开销</div>
          <div class="tip-item">✅ 美好回忆 - 共同的回忆墙</div>
          <div class="tip-item">✅ 情侣问答 - 互相回答问题</div>
          <div class="tip-item">✅ 心动计划 - 共同完成任务</div>
        </div>
      </div>

      <!-- 未配对状态 -->
      <div v-else class="couple-status">
        <div class="status-card unpaired">
          <div class="status-icon">💔</div>
          <h2>未配对</h2>
          <p>邀请TA成为你的专属伴侣吧~</p>
        </div>

        <!-- 邀请表单 -->
        <div class="invite-section">
          <h3>发送配对邀请</h3>
          <p class="hint">输入对方的用户名</p>
          <input 
            v-model="inviteUsername" 
            class="invite-input"
            placeholder="对方的用户名"
          />
          <button class="invite-btn" @click="sendInvite">发送邀请</button>
        </div>

        <!-- 待处理的邀请 -->
        <div v-if="pendingInvites.length > 0" class="invites-section">
          <h3>收到的配对邀请</h3>
          <div v-for="invite in pendingInvites" :key="invite.id" class="invite-item">
            <div class="invite-avatar">{{ invite.from_username.charAt(0) }}</div>
            <div class="invite-info">
              <h4>{{ invite.from_username }}</h4>
              <p>{{ formatTime(invite.created_at) }}</p>
            </div>
            <div class="invite-actions">
              <button class="accept-btn" @click="acceptInvite(invite.id)">接受</button>
              <button class="reject-btn" @click="rejectInvite(invite.id)">拒绝</button>
            </div>
          </div>
        </div>

        <!-- 已发送的邀请 -->
        <div v-if="sentInvites.length > 0" class="sent-section">
          <h3>已发送的邀请</h3>
          <div v-for="invite in sentInvites" :key="invite.id" class="sent-item">
            <div class="sent-avatar">{{ invite.to_username.charAt(0) }}</div>
            <div class="sent-info">
              <h4>{{ invite.to_username }}</h4>
              <p class="status">等待对方回应...</p>
            </div>
            <button class="cancel-btn" @click="cancelInvite(invite.id)">取消</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import http from '../api/http.js'

const router = useRouter()
const inviteUsername = ref('')
const pendingInvites = ref([])
const sentInvites = ref([])
const coupleInfo = ref({
  partnerId: null,
  partnerName: '',
  relationshipStartDate: null
})

const partnerName = computed(() => coupleInfo.value.partnerName || '对方')

const getDaysInLove = () => {
  if (!coupleInfo.value.relationshipStartDate) return 0
  const start = new Date(coupleInfo.value.relationshipStartDate)
  const now = new Date()
  const diff = Math.floor((now - start) / (1000 * 60 * 60 * 24))
  return diff > 0 ? diff : 0
}

const formatTime = (time) => {
  const d = new Date(time)
  return `${d.getMonth() + 1}月${d.getDate()}日`
}

const loadCoupleInfo = async () => {
  try {
    console.log('📋 加载配对信息...')
    const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}')
    
    if (userInfo.couple_id && userInfo.partner_id) {
      // 获取伴侣信息
      const res = await http.get(`/user/${userInfo.partner_id}`)
      coupleInfo.value = {
        partnerId: userInfo.partner_id,
        partnerName: res.data?.username || '对方',
        relationshipStartDate: res.data?.relationship_start_date || new Date()
      }
      console.log('✅ 已配对:', coupleInfo.value)
    } else {
      console.log('⚠️  未配对')
    }
  } catch (error) {
    console.error('❌ 加载配对信息失败:', error)
  }
}

const loadInvites = async () => {
  try {
    console.log('📋 加载邀请列表...')
    const res = await http.get('/couple/invites')
    pendingInvites.value = res.data?.pending || []
    sentInvites.value = res.data?.sent || []
    console.log('✅ 邀请列表:', { pending: pendingInvites.value.length, sent: sentInvites.value.length })
  } catch (error) {
    console.error('❌ 加载邀请失败:', error)
  }
}

const sendInvite = async () => {
  if (!inviteUsername.value.trim()) {
    alert('请输入对方的用户名')
    return
  }
  
  try {
    console.log('💌 发送配对邀请:', inviteUsername.value)
    await http.post('/couple/invite', {
      to_username: inviteUsername.value
    })
    alert('邀请已发送！')
    inviteUsername.value = ''
    await loadInvites()
  } catch (error) {
    console.error('❌ 发送邀请失败:', error)
    alert('发送失败：' + (error.response?.data?.message || error.message))
  }
}

const acceptInvite = async (inviteId) => {
  try {
    console.log('✅ 接受邀请:', inviteId)
    await http.post(`/couple/accept/${inviteId}`)
    alert('配对成功！🎉')
    
    // 重新获取用户信息
    const loginRes = await http.get('/user/me')
    localStorage.setItem('userInfo', JSON.stringify(loginRes.data))
    
    await loadCoupleInfo()
    await loadInvites()
  } catch (error) {
    console.error('❌ 接受邀请失败:', error)
    alert('操作失败：' + (error.response?.data?.message || error.message))
  }
}

const rejectInvite = async (inviteId) => {
  try {
    console.log('❌ 拒绝邀请:', inviteId)
    await http.post(`/couple/reject/${inviteId}`)
    alert('已拒绝邀请')
    await loadInvites()
  } catch (error) {
    console.error('❌ 拒绝邀请失败:', error)
    alert('操作失败')
  }
}

const cancelInvite = async (inviteId) => {
  try {
    console.log('🚫 取消邀请:', inviteId)
    await http.delete(`/couple/invite/${inviteId}`)
    alert('已取消邀请')
    await loadInvites()
  } catch (error) {
    console.error('❌ 取消邀请失败:', error)
    alert('操作失败')
  }
}

const confirmUnpair = () => {
  if (confirm('确定要解除配对吗？这将清除你们之间的情侣关系')) {
    unpair()
  }
}

const unpair = async () => {
  try {
    console.log('💔 解除配对')
    await http.post('/couple/unpair')
    alert('已解除配对')
    
    // 更新本地用户信息
    const loginRes = await http.get('/user/me')
    localStorage.setItem('userInfo', JSON.stringify(loginRes.data))
    
    coupleInfo.value = {
      partnerId: null,
      partnerName: '',
      relationshipStartDate: null
    }
    await loadInvites()
  } catch (error) {
    console.error('❌ 解除配对失败:', error)
    alert('操作失败')
  }
}

onMounted(() => {
  loadCoupleInfo()
  loadInvites()
})
</script>

<style scoped>
.couple-page {
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

.couple-status {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.status-card {
  background: white;
  border-radius: 34px;
  padding: 40px;
  text-align: center;
  box-shadow: 0 8px 21px rgba(255, 77, 136, 0.1);
}

.status-icon {
  font-size: 80px;
  margin-bottom: 20px;
}

.status-card h2 {
  color: #333;
  margin-bottom: 10px;
}

.partner-info {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 20px;
  margin: 30px 0;
  padding: 20px;
  background: #FFF5F8;
  border-radius: 20px;
}

.avatar {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: linear-gradient(135deg, #FF4D88, #FF98B9);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  font-weight: bold;
}

.partner-info .info {
  text-align: left;
}

.partner-info h3 {
  color: #333;
  margin-bottom: 5px;
}

.partner-info p {
  color: #666;
  font-size: 14px;
}

.unpair-btn {
  padding: 10px 30px;
  background: #ff4444;
  color: white;
  border: none;
  border-radius: 20px;
  cursor: pointer;
  font-size: 14px;
}

.feature-tips {
  background: white;
  border-radius: 34px;
  padding: 30px;
  box-shadow: 0 8px 21px rgba(255, 77, 136, 0.1);
}

.feature-tips h3 {
  color: #333;
  margin-bottom: 20px;
}

.tip-item {
  padding: 12px;
  background: #FFF5F8;
  border-radius: 10px;
  margin-bottom: 10px;
  color: #666;
}

.invite-section, .invites-section, .sent-section {
  background: white;
  border-radius: 34px;
  padding: 30px;
  box-shadow: 0 8px 21px rgba(255, 77, 136, 0.1);
}

.invite-section h3, .invites-section h3, .sent-section h3 {
  color: #333;
  margin-bottom: 15px;
}

.hint {
  color: #666;
  font-size: 14px;
  margin-bottom: 10px;
}

.invite-input {
  width: 100%;
  padding: 12px;
  border: 2px solid #e0e0e0;
  border-radius: 10px;
  font-size: 16px;
  margin-bottom: 15px;
}

.invite-btn {
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

.invite-item, .sent-item {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 15px;
  background: #FFF5F8;
  border-radius: 15px;
  margin-bottom: 10px;
}

.invite-avatar, .sent-avatar {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background: linear-gradient(135deg, #FF4D88, #FF98B9);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  font-weight: bold;
  flex-shrink: 0;
}

.invite-info, .sent-info {
  flex: 1;
}

.invite-info h4, .sent-info h4 {
  color: #333;
  margin-bottom: 5px;
}

.invite-info p, .sent-info p {
  color: #999;
  font-size: 12px;
}

.invite-actions {
  display: flex;
  gap: 10px;
}

.accept-btn, .reject-btn, .cancel-btn {
  padding: 8px 16px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
}

.accept-btn {
  background: #4CAF50;
  color: white;
}

.reject-btn, .cancel-btn {
  background: #ff4444;
  color: white;
}
</style>

