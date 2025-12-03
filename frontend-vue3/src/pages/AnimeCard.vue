<template>
  <div class="animecard-page">
    <div class="header">
      <button class="back-btn" @click="$router.back()">← 返回</button>
      <h2>动漫卡片 🎴</h2>
      <div class="collection-progress">
        <span>{{ collectedCards.length }}/{{ allCards.length }}</span>
      </div>
    </div>

    <div class="content">
      <!-- 今日抽卡 -->
      <div class="draw-section">
        <div class="draw-card">
          <h3>今日抽卡</h3>
          <p>每天可以免费抽取一张卡片</p>
          <div class="draw-count">剩余次数: {{ dailyDrawCount }}/1</div>
          <button 
            class="draw-btn" 
            :disabled="dailyDrawCount === 0"
            @click="drawCard"
          >
            {{ dailyDrawCount > 0 ? '抽卡' : '今日已抽' }}
          </button>
        </div>
        
        <!-- 抽卡动画 -->
        <div v-if="showDrawAnimation" class="draw-animation">
          <div class="card-flip">
            <div class="card-back">🎴</div>
          </div>
        </div>
        
        <!-- 抽到的卡片 -->
        <div v-if="drawnCard" class="drawn-card-overlay" @click="drawnCard = null">
          <div class="drawn-card-content" @click.stop>
            <div :class="['card-display', `rarity-${drawnCard.rarity}`]">
              <div class="card-rarity">{{ getRarityText(drawnCard.rarity) }}</div>
              <div class="card-image">{{ drawnCard.image }}</div>
              <div class="card-name">{{ drawnCard.name }}</div>
              <div class="card-desc">{{ drawnCard.description }}</div>
              <div class="card-stats">
                <div class="stat-item">
                  <span>❤️</span>
                  <span>{{ drawnCard.love }}</span>
                </div>
                <div class="stat-item">
                  <span>⭐</span>
                  <span>{{ drawnCard.star }}</span>
                </div>
              </div>
            </div>
            <button class="close-btn" @click="drawnCard = null">确定</button>
          </div>
        </div>
      </div>

      <!-- 卡片筛选 -->
      <div class="filter-section">
        <button 
          v-for="filter in filters" 
          :key="filter.value"
          :class="['filter-btn', { active: activeFilter === filter.value }]"
          @click="activeFilter = filter.value"
        >
          {{ filter.label }}
        </button>
      </div>

      <!-- 卡片图鉴 -->
      <div class="cards-grid">
        <div 
          v-for="card in filteredCards" 
          :key="card.id"
          :class="['card-item', `rarity-${card.rarity}`, { collected: card.collected }]"
          @click="viewCard(card)"
        >
          <div v-if="!card.collected" class="card-locked">
            <div class="lock-icon">🔒</div>
            <div class="card-silhouette">{{ card.image }}</div>
          </div>
          <div v-else class="card-unlocked">
            <div class="rarity-badge">{{ getRarityText(card.rarity) }}</div>
            <div class="card-image">{{ card.image }}</div>
            <div class="card-name">{{ card.name }}</div>
            <div class="card-count">x{{ card.count || 1 }}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import http from '../api/http.js'

const dailyDrawCount = ref(1)
const showDrawAnimation = ref(false)
const drawnCard = ref(null)
const activeFilter = ref('all')

const filters = [
  { label: '全部', value: 'all' },
  { label: '普通', value: 'common' },
  { label: '稀有', value: 'rare' },
  { label: '史诗', value: 'epic' },
  { label: '传说', value: 'legendary' }
]

const allCards = ref([
  // 普通卡片 (60%)
  { id: 1, name: '樱花之约', image: '🌸', rarity: 'common', love: 50, star: 1, description: '樱花树下的约定', collected: false, count: 0 },
  { id: 2, name: '夕阳漫步', image: '🌅', rarity: 'common', love: 55, star: 1, description: '一起看夕阳', collected: false, count: 0 },
  { id: 3, name: '咖啡时光', image: '☕', rarity: 'common', love: 52, star: 1, description: '悠闲的下午茶', collected: false, count: 0 },
  { id: 4, name: '雨中漫步', image: '☔', rarity: 'common', love: 48, star: 1, description: '共撑一把伞', collected: false, count: 0 },
  { id: 5, name: '星光闪烁', image: '✨', rarity: 'common', love: 53, star: 1, description: '星空下的许愿', collected: false, count: 0 },
  
  // 稀有卡片 (25%)
  { id: 11, name: '月下之舞', image: '🌙', rarity: 'rare', love: 120, star: 2, description: '月光下的华尔兹', collected: false, count: 0 },
  { id: 12, name: '花海漫游', image: '🌺', rarity: 'rare', love: 125, star: 2, description: '徜徉在花的海洋', collected: false, count: 0 },
  { id: 13, name: '雪夜温馨', image: '❄️', rarity: 'rare', love: 130, star: 2, description: '雪夜里的温暖', collected: false, count: 0 },
  { id: 14, name: '烟花绽放', image: '🎆', rarity: 'rare', love: 128, star: 2, description: '一起看烟花', collected: false, count: 0 },
  
  // 史诗卡片 (10%)
  { id: 21, name: '时光倒流', image: '⏰', rarity: 'epic', love: 250, star: 3, description: '回到相遇的那天', collected: false, count: 0 },
  { id: 22, name: '天空之城', image: '🏰', rarity: 'epic', love: 260, star: 3, description: '梦幻的天空之城', collected: false, count: 0 },
  { id: 23, name: '极光之恋', image: '🌌', rarity: 'epic', love: 255, star: 3, description: '北极光下的浪漫', collected: false, count: 0 },
  
  // 传说卡片 (5%)
  { id: 31, name: '永恒之爱', image: '💖', rarity: 'legendary', love: 500, star: 5, description: '永不褪色的爱恋', collected: false, count: 0 },
  { id: 32, name: '时空之门', image: '🌀', rarity: 'legendary', love: 520, star: 5, description: '穿越时空的羁绊', collected: false, count: 0 }
])

const collectedCards = computed(() => {
  return allCards.value.filter(card => card.collected)
})

const filteredCards = computed(() => {
  if (activeFilter.value === 'all') {
    return allCards.value
  }
  return allCards.value.filter(card => card.rarity === activeFilter.value)
})

const getRarityText = (rarity) => {
  const rarityMap = {
    common: 'N',
    rare: 'R',
    epic: 'SR',
    legendary: 'SSR'
  }
  return rarityMap[rarity] || 'N'
}

const getRarityChance = () => {
  const rand = Math.random() * 100
  if (rand < 5) return 'legendary'
  if (rand < 15) return 'epic'
  if (rand < 40) return 'rare'
  return 'common'
}

const drawCard = async () => {
  if (dailyDrawCount.value === 0) {
    alert('今日抽卡次数已用完！')
    return
  }
  
  showDrawAnimation.value = true
  
  setTimeout(async () => {
    showDrawAnimation.value = false
    
    try {
      const res = await http.post('/anime/draw')
      if (res.code === 200) {
        const card = allCards.value.find(c => c.id === res.data.card_id)
        if (card) {
          if (!card.collected) {
            card.collected = true
            card.count = 1
          } else {
            card.count++
          }
          drawnCard.value = { ...card }
          dailyDrawCount.value--
        }
      }
    } catch (error) {
      console.error('抽卡失败:', error)
      
      // 模拟抽卡（后端未实现时）
      const rarity = getRarityChance()
      const cardsOfRarity = allCards.value.filter(c => c.rarity === rarity)
      const randomCard = cardsOfRarity[Math.floor(Math.random() * cardsOfRarity.length)]
      
      if (!randomCard.collected) {
        randomCard.collected = true
        randomCard.count = 1
      } else {
        randomCard.count++
      }
      
      drawnCard.value = { ...randomCard }
      dailyDrawCount.value--
    }
  }, 1500)
}

const viewCard = (card) => {
  if (card.collected) {
    drawnCard.value = card
  }
}

const loadCollection = async () => {
  try {
    const res = await http.get('/anime/collection')
    if (res.code === 200) {
      const collection = res.data.cards || []
      collection.forEach(item => {
        const card = allCards.value.find(c => c.id === item.card_id)
        if (card) {
          card.collected = true
          card.count = item.count
        }
      })
      
      dailyDrawCount.value = res.data.daily_draw_count || 1
    }
  } catch (error) {
    console.error('加载收藏失败:', error)
  }
}

onMounted(() => {
  loadCollection()
})
</script>

<style scoped>
.animecard-page {
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

.collection-progress {
  background: rgba(255,255,255,0.2);
  padding: 8px 16px;
  border-radius: 20px;
  font-weight: bold;
  font-size: 16px;
}

.content {
  padding: 20px;
}

.draw-section {
  background: white;
  border-radius: 20px;
  padding: 30px;
  margin-bottom: 20px;
  text-align: center;
  box-shadow: 0 8px 21px rgba(255, 77, 136, 0.1);
  position: relative;
}

.draw-card h3 {
  color: #333;
  margin-bottom: 10px;
  font-size: 24px;
}

.draw-card p {
  color: #666;
  margin-bottom: 15px;
}

.draw-count {
  color: #FF4D88;
  font-weight: bold;
  margin-bottom: 20px;
}

.draw-btn {
  background: linear-gradient(135deg, #FF4D88, #FF98B9);
  color: white;
  border: none;
  padding: 15px 50px;
  border-radius: 25px;
  font-size: 18px;
  font-weight: bold;
  cursor: pointer;
  transition: transform 0.3s;
  box-shadow: 0 8px 21px rgba(255, 77, 136, 0.3);
}

.draw-btn:hover:not(:disabled) {
  transform: scale(1.05);
}

.draw-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
  box-shadow: none;
}

.draw-animation {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  animation: fadeIn 0.3s;
}

.card-flip {
  animation: flip 1.5s;
}

.card-back {
  font-size: 120px;
  animation: glow 1.5s infinite;
}

@keyframes flip {
  0%, 100% { transform: rotateY(0deg); }
  50% { transform: rotateY(180deg); }
}

@keyframes glow {
  0%, 100% { filter: brightness(1); }
  50% { filter: brightness(1.5); }
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.drawn-card-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1001;
  animation: fadeIn 0.3s;
}

.drawn-card-content {
  background: white;
  border-radius: 20px;
  padding: 30px;
  max-width: 400px;
}

.card-display {
  padding: 30px;
  border-radius: 15px;
  margin-bottom: 20px;
  position: relative;
}

.card-display.rarity-common {
  background: linear-gradient(135deg, #E5E7EB, #F3F4F6);
}

.card-display.rarity-rare {
  background: linear-gradient(135deg, #60A5FA, #93C5FD);
}

.card-display.rarity-epic {
  background: linear-gradient(135deg, #A78BFA, #C4B5FD);
}

.card-display.rarity-legendary {
  background: linear-gradient(135deg, #FBBF24, #FCD34D);
  animation: legendary-glow 2s infinite;
}

@keyframes legendary-glow {
  0%, 100% { box-shadow: 0 0 20px rgba(251, 191, 36, 0.5); }
  50% { box-shadow: 0 0 40px rgba(251, 191, 36, 0.8); }
}

.card-rarity {
  position: absolute;
  top: 10px;
  right: 10px;
  background: rgba(0,0,0,0.5);
  color: white;
  padding: 4px 12px;
  border-radius: 10px;
  font-weight: bold;
  font-size: 14px;
}

.card-image {
  font-size: 100px;
  text-align: center;
  margin-bottom: 15px;
}

.card-name {
  text-align: center;
  font-size: 24px;
  font-weight: bold;
  color: #333;
  margin-bottom: 10px;
}

.card-desc {
  text-align: center;
  color: #666;
  margin-bottom: 20px;
}

.card-stats {
  display: flex;
  justify-content: center;
  gap: 30px;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 18px;
  font-weight: bold;
}

.close-btn {
  width: 100%;
  background: linear-gradient(135deg, #FF4D88, #FF98B9);
  color: white;
  border: none;
  padding: 12px;
  border-radius: 15px;
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
}

.filter-section {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
  overflow-x: auto;
}

.filter-btn {
  padding: 10px 20px;
  border: 2px solid #E5E7EB;
  background: white;
  border-radius: 15px;
  cursor: pointer;
  transition: all 0.3s;
  white-space: nowrap;
}

.filter-btn.active {
  background: linear-gradient(135deg, #FF4D88, #FF98B9);
  color: white;
  border-color: transparent;
}

.cards-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 15px;
}

.card-item {
  background: white;
  border-radius: 15px;
  padding: 15px;
  cursor: pointer;
  transition: all 0.3s;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  border: 3px solid transparent;
}

.card-item.rarity-common.collected {
  border-color: #9CA3AF;
}

.card-item.rarity-rare.collected {
  border-color: #60A5FA;
}

.card-item.rarity-epic.collected {
  border-color: #A78BFA;
}

.card-item.rarity-legendary.collected {
  border-color: #FBBF24;
  animation: legendary-border 2s infinite;
}

@keyframes legendary-border {
  0%, 100% { box-shadow: 0 0 10px rgba(251, 191, 36, 0.5); }
  50% { box-shadow: 0 0 20px rgba(251, 191, 36, 0.8); }
}

.card-item:hover {
  transform: translateY(-5px);
}

.card-locked {
  text-align: center;
  opacity: 0.5;
}

.lock-icon {
  font-size: 32px;
  margin-bottom: 10px;
}

.card-silhouette {
  font-size: 64px;
  filter: brightness(0);
}

.card-unlocked {
  text-align: center;
  position: relative;
}

.rarity-badge {
  position: absolute;
  top: -5px;
  right: -5px;
  background: #FF4D88;
  color: white;
  padding: 2px 8px;
  border-radius: 8px;
  font-size: 11px;
  font-weight: bold;
}

.card-unlocked .card-image {
  font-size: 64px;
  margin-bottom: 10px;
}

.card-unlocked .card-name {
  color: #333;
  font-size: 14px;
  font-weight: bold;
  margin-bottom: 5px;
}

.card-count {
  color: #666;
  font-size: 12px;
}
</style>

