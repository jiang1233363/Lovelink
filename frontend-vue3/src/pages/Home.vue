<template>
  <div class="home-page">
    <div class="header">
      <h1>LoveLink ❤️</h1>
      <div class="header-actions">
        <button class="profile-btn" @click="goto('/profile')">👤</button>
        <button class="couple-btn" @click="goto('/couple')">💑</button>
        <button class="logout-btn" @click="logout">退出</button>
      </div>
    </div>
    
    <div class="modules">
      <div class="module-card" @click="goto('/mood')">
        <div class="icon">😊</div>
        <h3>心情记录</h3>
        <p>记录每天的心情</p>
      </div>
      
      <div class="module-card" @click="goto('/diary')">
        <div class="icon">📔</div>
        <h3>共享日记</h3>
        <p>写下你们的故事</p>
      </div>
      
      <div class="module-card" @click="goto('/reminder')">
        <div class="icon">⏰</div>
        <h3>提醒事项</h3>
        <p>不错过重要时刻</p>
      </div>
      
      <div class="module-card" @click="goto('/accountBook')">
        <div class="icon">💰</div>
        <h3>共同账本</h3>
        <p>记录每笔开销</p>
      </div>
      
      <div class="module-card" @click="goto('/memory')">
        <div class="icon">📸</div>
        <h3>美好回忆</h3>
        <p>珍藏温馨瞬间</p>
      </div>
      
      <div class="module-card" @click="goto('/chat')">
        <div class="icon">💬</div>
        <h3>实时聊天</h3>
        <p>随时随地交流</p>
      </div>
      
      <div class="module-card" @click="goto('/qa')">
        <div class="icon">❓</div>
        <h3>情侣问答</h3>
        <p>365个问题</p>
      </div>
      
      <div class="module-card" @click="goto('/heartbeat')">
        <div class="icon">💖</div>
        <h3>心动计划</h3>
        <p>每日打卡任务</p>
      </div>
      
      <div class="module-card" @click="goto('/period')">
        <div class="icon">🌸</div>
        <h3>经期管理</h3>
        <p>智能预测周期</p>
      </div>
      
      <div class="module-card" @click="goto('/achievement')">
            <div class="icon">🏆</div>
            <h3>成就系统</h3>
            <p>解锁各种成就</p>
          </div>
          
          <div class="module-card" @click="goto('/location')">
            <div class="icon">📍</div>
            <h3>位置共享</h3>
            <p>实时位置分享</p>
          </div>
          
          <div class="module-card" @click="goto('/conflict')">
            <div class="icon">🧯</div>
            <h3>争吵消防员</h3>
            <p>化解小矛盾</p>
          </div>
          
          <div class="module-card" @click="goto('/home3d')">
            <div class="icon">🏠🐱</div>
            <h3>爱巢装扮</h3>
            <p>装扮你们的家，养可爱宠物</p>
          </div>
          
          <div class="module-card" @click="goto('/animecard')">
            <div class="icon">🎴</div>
            <h3>动漫卡片</h3>
            <p>收集精美卡片</p>
          </div>
        </div>
      </div>
    </template>

<script setup>
import { useRouter } from 'vue-router'

const router = useRouter()

const goto = (path) => {
  router.push(path)
}

const logout = () => {
  localStorage.clear()
  router.push('/login')
}
</script>

<style scoped>
.home-page {
  min-height: 100vh;
  background: #FFF5F8;
}

.header {
  background: linear-gradient(135deg, #FF4D88, #FF98B9);
  color: white;
  padding: 30px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header h1 {
  font-size: 32px;
}

.header-actions {
  display: flex;
  gap: 10px;
  align-items: center;
}

.profile-btn, .couple-btn, .logout-btn {
  padding: 8px 16px;
  background: rgba(255,255,255,0.2);
  border: 2px solid white;
  color: white;
  border-radius: 8px;
  cursor: pointer;
  font-size: 20px;
}

.logout-btn {
  font-size: 16px;
  padding: 10px 20px;
}

.modules {
  max-width: 1200px;
  margin: 50px auto;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 30px;
  padding: 0 30px;
}

.module-card {
  background: white;
  border-radius: 34px;
  padding: 40px;
  text-align: center;
  cursor: pointer;
  transition: transform 0.3s, box-shadow 0.3s;
  box-shadow: 0 8px 21px rgba(255, 77, 136, 0.1);
}

.module-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 26px rgba(255, 77, 136, 0.2);
}

.icon {
  font-size: 64px;
  margin-bottom: 20px;
}

.module-card h3 {
  font-size: 24px;
  color: #333;
  margin-bottom: 10px;
}

.module-card p {
  color: #666;
  font-size: 14px;
}
</style>

