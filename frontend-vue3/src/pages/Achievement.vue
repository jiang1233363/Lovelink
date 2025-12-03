<template>
  <div class="achievement-page">
    <div class="header">
      <button class="back-btn" @click="$router.back()">← 返回</button>
      <h2>成就系统 🏆</h2>
      <div class="placeholder"></div>
    </div>

    <div class="content">
      <!-- 统计卡片 -->
      <div class="stats-card">
        <div class="stat-item">
          <div class="stat-value">{{ achievements.filter(a => a.unlocked).length }}</div>
          <div class="stat-label">已解锁</div>
        </div>
        <div class="stat-divider"></div>
        <div class="stat-item">
          <div class="stat-value">{{ achievements.length }}</div>
          <div class="stat-label">总成就</div>
        </div>
        <div class="stat-divider"></div>
        <div class="stat-item">
          <div class="stat-value">{{ totalPoints }}</div>
          <div class="stat-label">总积分</div>
        </div>
      </div>

      <!-- 成就列表 -->
      <div class="achievement-list">
        <div 
          v-for="achievement in achievements" 
          :key="achievement.id"
          :class="['achievement-card', { unlocked: achievement.unlocked }]"
        >
          <div class="achievement-icon">{{ achievement.icon }}</div>
          <div class="achievement-info">
            <h3>{{ achievement.title }}</h3>
            <p>{{ achievement.description }}</p>
            <div class="achievement-meta">
              <span class="points">+{{ achievement.points }} 积分</span>
              <span v-if="achievement.unlocked" class="unlock-date">
                {{ formatDate(achievement.unlock_date) }}
              </span>
              <span v-else class="locked">🔒 未解锁</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import http from '../api/http.js'

const achievements = ref([
  { id: 1, icon: '💝', title: '初次相遇', description: '完成账号注册并配对', points: 10, unlocked: true, unlock_date: new Date() },
  { id: 2, icon: '📝', title: '日记达人', description: '写下10篇共享日记', points: 20, unlocked: false },
  { id: 3, icon: '😊', title: '心情记录者', description: '连续7天记录心情', points: 15, unlocked: false },
  { id: 4, icon: '💬', title: '聊天狂魔', description: '发送100条消息', points: 30, unlocked: false },
  { id: 5, icon: '📸', title: '回忆收藏家', description: '上传50张照片', points: 25, unlocked: false },
  { id: 6, icon: '💰', title: '理财小能手', description: '记录100笔账单', points: 20, unlocked: false },
  { id: 7, icon: '🎯', title: '任务完成者', description: '完成50个提醒事项', points: 15, unlocked: false },
  { id: 8, icon: '❓', title: '问答达人', description: '回答100个情侣问题', points: 40, unlocked: false },
  { id: 9, icon: '💖', title: '心动100天', description: '连续打卡100天', points: 50, unlocked: false },
  { id: 10, icon: '🐱', title: '宠物大师', description: '宠物等级达到10级', points: 35, unlocked: false },
  { id: 11, icon: '🏠', title: '装扮爱好者', description: '购买10个装饰物品', points: 20, unlocked: false },
  { id: 12, icon: '🎴', title: '卡片收藏家', description: '收集30张动漫卡片', points: 30, unlocked: false }
])

const totalPoints = computed(() => {
  return achievements.value
    .filter(a => a.unlocked)
    .reduce((sum, a) => sum + a.points, 0)
})

const formatDate = (date) => {
  if (!date) return ''
  const d = new Date(date)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

onMounted(async () => {
  // TODO: 从后端加载成就数据
  // const res = await http.get('/achievement/list')
  // if (res.code === 200) {
  //   achievements.value = res.data
  // }
})
</script>

<style scoped>
.achievement-page {
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

.placeholder {
  width: 80px;
}

.content {
  padding: 20px;
}

.stats-card {
  background: white;
  border-radius: 20px;
  padding: 30px;
  margin-bottom: 20px;
  display: flex;
  justify-content: space-around;
  align-items: center;
  box-shadow: 0 8px 21px rgba(255, 77, 136, 0.1);
}

.stat-item {
  text-align: center;
  flex: 1;
}

.stat-value {
  font-size: 36px;
  font-weight: bold;
  color: #FF4D88;
  margin-bottom: 8px;
}

.stat-label {
  color: #666;
  font-size: 14px;
}

.stat-divider {
  width: 1px;
  height: 50px;
  background: #E5E7EB;
}

.achievement-list {
  display: grid;
  gap: 15px;
}

.achievement-card {
  background: white;
  border-radius: 20px;
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 20px;
  box-shadow: 0 8px 21px rgba(255, 77, 136, 0.1);
  transition: transform 0.3s;
  opacity: 0.6;
}

.achievement-card.unlocked {
  opacity: 1;
  box-shadow: 0 8px 21px rgba(255, 77, 136, 0.2);
}

.achievement-card:hover {
  transform: translateY(-2px);
}

.achievement-icon {
  font-size: 48px;
  width: 60px;
  text-align: center;
}

.achievement-info {
  flex: 1;
}

.achievement-info h3 {
  color: #333;
  margin-bottom: 8px;
  font-size: 18px;
}

.achievement-info p {
  color: #666;
  font-size: 14px;
  margin-bottom: 10px;
}

.achievement-meta {
  display: flex;
  gap: 15px;
  align-items: center;
}

.points {
  background: linear-gradient(135deg, #FF4D88, #FF98B9);
  color: white;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: bold;
}

.unlock-date {
  color: #999;
  font-size: 12px;
}

.locked {
  color: #999;
  font-size: 12px;
}
</style>



