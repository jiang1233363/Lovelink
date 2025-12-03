<template>
  <div class="home3d-page">
    <div class="header">
      <button class="back-btn" @click="$router.back()">← 返回</button>
      <h2>爱巢装扮 🏠</h2>
      <div class="coins-display">
        <span class="coin-icon">💰</span>
        <span class="coin-amount">{{ coins }}</span>
      </div>
    </div>

    <div class="content">
      <!-- 3D房间预览 -->
      <div class="room-preview">
        <div class="room-container">
          <div class="room-bg" :style="getBackgroundStyle()">
            <!-- 宠物展示 -->
            <div v-if="appliedPet" class="pet-container">
              <div class="pet-icon">{{ appliedPet.icon }}</div>
              <div class="pet-info">
                <div class="pet-name">{{ appliedPet.name }}</div>
                <div class="pet-status">
                  <span>❤️ {{ petStats.health }}/100</span>
                  <span>😊 {{ petStats.happiness }}/100</span>
                </div>
              </div>
            </div>
            
            <!-- 家具展示 -->
            <div 
              v-for="item in appliedFurniture" 
              :key="item.id"
              class="furniture-item"
              :style="{ 
                left: item.position?.x || '50%', 
                top: item.position?.y || '50%',
                transform: 'translate(-50%, -50%)'
              }"
            >
              <div class="furniture-icon">{{ item.icon }}</div>
            </div>
            
            <!-- 默认房间 -->
            <div v-if="appliedFurniture.length === 0 && !appliedPet" class="empty-room">
              <p>🏠</p>
              <p>开始装扮你们的爱巢吧！</p>
            </div>
          </div>
        </div>
        
        <!-- 宠物互动按钮 -->
        <div v-if="appliedPet" class="pet-actions">
          <button @click="feedPet" class="action-btn">🍖 喂食</button>
          <button @click="playWithPet" class="action-btn">🎾 玩耍</button>
          <button @click="cleanPet" class="action-btn">🛁 清洁</button>
        </div>
      </div>

      <!-- 装扮商店 -->
      <div class="shop-section">
        <div class="shop-tabs">
          <button 
            v-for="tab in tabs" 
            :key="tab.id"
            :class="['tab-btn', { active: activeTab === tab.id }]"
            @click="activeTab = tab.id"
          >
            {{ tab.name }}
          </button>
        </div>

        <div class="items-grid">
          <div 
            v-for="item in filteredItems" 
            :key="item.id"
            :class="['item-card', { owned: item.owned, applied: item.applied }]"
            @click="handleItemClick(item)"
          >
            <div class="item-icon">{{ item.icon }}</div>
            <div class="item-name">{{ item.name }}</div>
            <div class="item-price">
              <span v-if="!item.owned" class="price">💰 {{ item.price }}</span>
              <span v-else-if="item.applied" class="applied-badge">使用中</span>
              <span v-else class="apply-btn">应用</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 已拥有的物品 -->
      <div class="inventory-section">
        <h3>我的物品</h3>
        <div class="inventory-grid">
          <div 
            v-for="item in ownedItems" 
            :key="item.id"
            class="inventory-item"
            @click="applyItem(item)"
          >
            <div class="item-icon">{{ item.icon }}</div>
            <div class="item-name">{{ item.name }}</div>
            <span v-if="item.applied" class="using-badge">✓</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import http from '../api/http.js'

const activeTab = ref('pet')
const coins = ref(1000)
const appliedItems = ref({
  wallpaper: null,
  floor: null,
  furniture: []
})
const petStats = ref({
  health: 80,
  happiness: 75
})

const tabs = [
  { id: 'pet', name: '🐱 宠物' },
  { id: 'wallpaper', name: '🎨 墙纸' },
  { id: 'floor', name: '🪵 地板' },
  { id: 'furniture', name: '🛋️ 家具' },
  { id: 'decoration', name: '✨ 装饰' }
]

const shopItems = ref([
  // 宠物
  { id: 101, type: 'pet', name: '橘猫', icon: '🐱', price: 500, owned: false, applied: false },
  { id: 102, type: 'pet', name: '柴犬', icon: '🐶', price: 500, owned: false, applied: false },
  { id: 103, type: 'pet', name: '兔子', icon: '🐰', price: 450, owned: false, applied: false },
  { id: 104, type: 'pet', name: '仓鼠', icon: '🐹', price: 300, owned: false, applied: false },
  { id: 105, type: 'pet', name: '企鹅', icon: '🐧', price: 800, owned: false, applied: false },
  { id: 106, type: 'pet', name: '熊猫', icon: '🐼', price: 1000, owned: false, applied: false },
  
  // 墙纸
  { id: 1, type: 'wallpaper', name: '粉色渐变', icon: '🎨', price: 100, owned: true, applied: false, color: 'linear-gradient(180deg, #FFB6C1, #FFE5EC)' },
  { id: 2, type: 'wallpaper', name: '星空主题', icon: '🌌', price: 200, owned: false, applied: false, color: 'linear-gradient(180deg, #1a1a2e, #16213e)' },
  { id: 3, type: 'wallpaper', name: '森林清新', icon: '🌲', price: 150, owned: false, applied: false, color: 'linear-gradient(180deg, #a8e6cf, #dcedc1)' },
  
  // 地板
  { id: 11, type: 'floor', name: '木质地板', icon: '🪵', price: 150, owned: true, applied: false },
  { id: 12, type: 'floor', name: '大理石', icon: '⬜', price: 250, owned: false, applied: false },
  { id: 13, type: 'floor', name: '地毯', icon: '🧶', price: 180, owned: false, applied: false },
  
  // 家具
  { id: 21, type: 'furniture', name: '沙发', icon: '🛋️', price: 300, owned: false, applied: false, position: { x: '30%', y: '60%' } },
  { id: 22, type: 'furniture', name: '书桌', icon: '🪑', price: 250, owned: false, applied: false, position: { x: '70%', y: '40%' } },
  { id: 23, type: 'furniture', name: '床', icon: '🛏️', price: 400, owned: false, applied: false, position: { x: '50%', y: '70%' } },
  { id: 24, type: 'furniture', name: '衣柜', icon: '🚪', price: 350, owned: false, applied: false, position: { x: '20%', y: '30%' } },
  
  // 装饰
  { id: 31, type: 'decoration', name: '盆栽', icon: '🪴', price: 80, owned: false, applied: false, position: { x: '80%', y: '20%' } },
  { id: 32, type: 'decoration', name: '画框', icon: '🖼️', price: 120, owned: false, applied: false, position: { x: '50%', y: '20%' } },
  { id: 33, type: 'decoration', name: '台灯', icon: '💡', price: 100, owned: false, applied: false, position: { x: '75%', y: '35%' } },
  { id: 34, type: 'decoration', name: '挂钟', icon: '🕐', price: 90, owned: false, applied: false, position: { x: '30%', y: '15%' } }
])

const filteredItems = computed(() => {
  return shopItems.value.filter(item => item.type === activeTab.value)
})

const ownedItems = computed(() => {
  return shopItems.value.filter(item => item.owned)
})

const appliedFurniture = computed(() => {
  return shopItems.value.filter(item => 
    (item.type === 'furniture' || item.type === 'decoration') && item.applied
  )
})

const appliedPet = computed(() => {
  return shopItems.value.find(item => item.type === 'pet' && item.applied)
})

const getBackgroundStyle = () => {
  const wallpaper = shopItems.value.find(item => item.type === 'wallpaper' && item.applied)
  if (wallpaper && wallpaper.color) {
    return { background: wallpaper.color }
  }
  return { background: 'linear-gradient(180deg, #FFE5EC, #FFF5F8)' }
}

const handleItemClick = async (item) => {
  if (item.owned) {
    applyItem(item)
  } else {
    buyItem(item)
  }
}

const buyItem = async (item) => {
  if (coins.value < item.price) {
    alert('金币不足！')
    return
  }
  
  if (!confirm(`确定花费 ${item.price} 金币购买 ${item.name} 吗？`)) {
    return
  }
  
  try {
    const res = await http.post('/nest/buy', {
      item_id: item.id,
      price: item.price
    })
    
    if (res.code === 200) {
      item.owned = true
      coins.value -= item.price
      alert('购买成功！')
    }
  } catch (error) {
    console.error('购买失败:', error)
    alert('购买失败，请稍后重试')
  }
}

const applyItem = async (item) => {
  try {
    const res = await http.post('/nest/apply', {
      item_id: item.id,
      type: item.type
    })
    
    if (res.code === 200) {
      // 取消同类型其他物品的应用状态
      shopItems.value.forEach(i => {
        if (i.type === item.type && i.id !== item.id) {
          i.applied = false
        }
      })
      
      item.applied = true
      
      // 更新应用的物品
      if (item.type === 'wallpaper') {
        appliedItems.value.wallpaper = item
      } else if (item.type === 'floor') {
        appliedItems.value.floor = item
      }
      
      alert('应用成功！')
    }
  } catch (error) {
    console.error('应用失败:', error)
    alert('应用失败，请稍后重试')
  }
}

const feedPet = () => {
  petStats.value.health = Math.min(100, petStats.value.health + 10)
  petStats.value.happiness = Math.min(100, petStats.value.happiness + 5)
  alert('🍖 喂食成功！宠物很开心~')
}

const playWithPet = () => {
  petStats.value.happiness = Math.min(100, petStats.value.happiness + 15)
  petStats.value.health = Math.max(0, petStats.value.health - 5)
  alert('🎾 玩耍成功！宠物很兴奋~')
}

const cleanPet = () => {
  petStats.value.health = Math.min(100, petStats.value.health + 5)
  petStats.value.happiness = Math.min(100, petStats.value.happiness + 5)
  alert('🛁 清洁成功！宠物很舒服~')
}

const loadInventory = async () => {
  try {
    const res = await http.get('/nest/inventory')
    if (res.code === 200) {
      // 更新拥有和应用状态
      const ownedIds = res.data.owned || []
      const appliedIds = res.data.applied || []
      
      shopItems.value.forEach(item => {
        item.owned = ownedIds.includes(item.id)
        item.applied = appliedIds.includes(item.id)
        
        if (item.applied) {
          if (item.type === 'wallpaper') {
            appliedItems.value.wallpaper = item
          } else if (item.type === 'floor') {
            appliedItems.value.floor = item
          }
        }
      })
      
      coins.value = res.data.coins || 1000
    }
  } catch (error) {
    console.error('加载物品失败:', error)
  }
}

onMounted(() => {
  loadInventory()
})
</script>

<style scoped>
.home3d-page {
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

.coins-display {
  background: rgba(255,255,255,0.2);
  padding: 8px 16px;
  border-radius: 20px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.coin-icon {
  font-size: 20px;
}

.coin-amount {
  font-weight: bold;
  font-size: 18px;
}

.content {
  padding: 20px;
}

.room-preview {
  background: white;
  border-radius: 20px;
  padding: 20px;
  margin-bottom: 20px;
  box-shadow: 0 8px 21px rgba(255, 77, 136, 0.1);
}

.room-container {
  width: 100%;
  height: 400px;
  border-radius: 15px;
  overflow: hidden;
}

.room-bg {
  width: 100%;
  height: 100%;
  background: linear-gradient(180deg, #FFE5EC, #FFF5F8);
  background-size: cover;
  background-position: center;
  position: relative;
}

.furniture-item {
  position: absolute;
  transition: all 0.3s;
}

.furniture-icon {
  font-size: 48px;
  filter: drop-shadow(2px 2px 4px rgba(0,0,0,0.2));
}

.empty-room {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #999;
}

.empty-room p:first-child {
  font-size: 64px;
  margin-bottom: 10px;
}

.pet-container {
  position: absolute;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding: 15px;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 20px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  animation: petBounce 2s infinite;
}

@keyframes petBounce {
  0%, 100% { transform: translateX(-50%) translateY(0); }
  50% { transform: translateX(-50%) translateY(-10px); }
}

.pet-icon {
  font-size: 64px;
}

.pet-info {
  text-align: center;
}

.pet-name {
  font-size: 16px;
  font-weight: bold;
  color: #FF4D88;
  margin-bottom: 5px;
}

.pet-status {
  display: flex;
  gap: 10px;
  font-size: 12px;
}

.pet-actions {
  display: flex;
  justify-content: center;
  gap: 10px;
  margin-top: 15px;
}

.action-btn {
  padding: 10px 20px;
  background: linear-gradient(135deg, #FF4D88, #FF98B9);
  color: white;
  border: none;
  border-radius: 15px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.3s;
}

.action-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(255, 77, 136, 0.3);
}

.shop-section {
  background: white;
  border-radius: 20px;
  padding: 20px;
  margin-bottom: 20px;
  box-shadow: 0 8px 21px rgba(255, 77, 136, 0.1);
}

.shop-tabs {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
  overflow-x: auto;
}

.tab-btn {
  padding: 10px 20px;
  border: 2px solid #E5E7EB;
  background: white;
  border-radius: 15px;
  cursor: pointer;
  transition: all 0.3s;
  white-space: nowrap;
}

.tab-btn.active {
  background: linear-gradient(135deg, #FF4D88, #FF98B9);
  color: white;
  border-color: transparent;
}

.items-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 15px;
}

.item-card {
  background: #FFF5F8;
  border-radius: 15px;
  padding: 15px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s;
  border: 2px solid transparent;
}

.item-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 5px 15px rgba(255, 77, 136, 0.2);
}

.item-card.owned {
  border-color: #4CAF50;
}

.item-card.applied {
  border-color: #FF4D88;
  background: linear-gradient(135deg, rgba(255, 77, 136, 0.1), rgba(255, 152, 185, 0.1));
}

.item-icon {
  font-size: 48px;
  margin-bottom: 10px;
}

.item-name {
  color: #333;
  font-size: 14px;
  margin-bottom: 8px;
  font-weight: bold;
}

.item-price {
  font-size: 12px;
}

.price {
  color: #FF4D88;
  font-weight: bold;
}

.applied-badge {
  background: #FF4D88;
  color: white;
  padding: 4px 8px;
  border-radius: 8px;
  font-size: 11px;
}

.apply-btn {
  color: #4CAF50;
  font-weight: bold;
}

.inventory-section {
  background: white;
  border-radius: 20px;
  padding: 20px;
  box-shadow: 0 8px 21px rgba(255, 77, 136, 0.1);
}

.inventory-section h3 {
  color: #333;
  margin-bottom: 15px;
}

.inventory-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
  gap: 12px;
}

.inventory-item {
  background: #FFF5F8;
  border-radius: 12px;
  padding: 12px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s;
  position: relative;
}

.inventory-item:hover {
  transform: scale(1.05);
}

.using-badge {
  position: absolute;
  top: 5px;
  right: 5px;
  background: #4CAF50;
  color: white;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
}
</style>

