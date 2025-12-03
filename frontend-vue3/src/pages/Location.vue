<template>
  <div class="location-page">
    <div class="header">
      <button class="back-btn" @click="$router.back()">← 返回</button>
      <h2>位置共享 📍</h2>
      <div class="placeholder"></div>
    </div>

    <div class="content">
      <!-- 控制面板 -->
      <div class="control-panel">
        <div class="switch-item">
          <span>位置共享</span>
          <label class="switch">
            <input type="checkbox" class="location-sharing-toggle" v-model="sharingEnabled" @change="toggleSharing">
            <span class="slider"></span>
          </label>
        </div>
        <p class="hint">开启后，对方可以看到你的实时位置</p>
      </div>

      <!-- 地图区域 -->
      <div class="map-container">
        <div id="amap-container" class="amap-container"></div>
        <div v-if="distance" class="distance-info">
          <span class="distance-icon">📏</span>
          <span class="distance-text">距离 {{ distance }} 公里</span>
        </div>
        <div class="location-info-panel">
          <div class="info-item mine">
            <div class="info-icon">📍</div>
            <div class="info-text">
              <div class="info-label">我的位置</div>
              <div class="info-address">{{ myLocation.address || '定位中...' }}</div>
            </div>
          </div>
          <div v-if="partnerLocation.lat" class="info-item partner">
            <div class="info-icon">💝</div>
            <div class="info-text">
              <div class="info-label">TA的位置</div>
              <div class="info-address">{{ partnerLocation.address || '未知位置' }}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- 位置历史 -->
      <div class="history-section">
        <h3>位置历史</h3>
        <div class="history-list">
          <div 
            v-for="record in locationHistory" 
            :key="record.id"
            class="history-item"
          >
            <div class="history-icon">📍</div>
            <div class="history-info">
              <div class="history-address">{{ record.address }}</div>
              <div class="history-time">{{ formatTime(record.created_at) }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import http from '../api/http.js'

const sharingEnabled = ref(false)
const myLocation = ref({
  lat: null,
  lng: null,
  address: ''
})
const partnerLocation = ref({
  lat: null,
  lng: null,
  address: ''
})
const distance = ref('')
const locationHistory = ref([])
let locationInterval = null
let map = null
let myMarker = null
let partnerMarker = null
let geocoder = null

const toggleSharing = async () => {
  try {
    const res = await http.post('/location/toggle', {
      enabled: sharingEnabled.value
    })
    
    if (res.code === 200) {
      if (sharingEnabled.value) {
        startLocationTracking()
      } else {
        stopLocationTracking()
      }
    }
  } catch (error) {
    console.error('切换位置共享失败:', error)
    sharingEnabled.value = !sharingEnabled.value
  }
}

const startLocationTracking = () => {
  updateLocation()
  locationInterval = setInterval(updateLocation, 30000) // 每30秒更新一次
}

const stopLocationTracking = () => {
  if (locationInterval) {
    clearInterval(locationInterval)
    locationInterval = null
  }
}

const initMap = () => {
  console.log('🗺️ 开始初始化地图...')
  
  if (typeof AMap === 'undefined') {
    console.error('❌ 高德地图API未加载')
    myLocation.value.address = '地图加载失败，请刷新页面'
    return
  }
  
  console.log('✅ 高德地图API已加载')
  
  try {
    map = new AMap.Map('amap-container', {
      zoom: 13,
      center: [116.397428, 39.90923], // 默认中心点（北京）
      resizeEnable: true,
      viewMode: '2D'
    })
    
    console.log('✅ 地图容器创建成功')
    
    // 监听地图加载错误
    map.on('error', (error) => {
      console.error('❌ 地图加载错误:', error)
      myLocation.value.address = '地图加载失败，请检查网络或刷新页面'
    })
    
    // 初始化地理编码器
    AMap.plugin('AMap.Geocoder', () => {
      geocoder = new AMap.Geocoder({
        city: '全国'
      })
      console.log('✅ 地理编码器加载成功')
    })
    
    // 地图加载完成后自动获取位置
    map.on('complete', () => {
      console.log('✅ 地图加载完成')
      console.log('🗺️ 地图中心:', map.getCenter())
      console.log('🗺️ 地图缩放级别:', map.getZoom())
      // 如果开启了共享，立即获取位置
      if (sharingEnabled.value) {
        updateLocation()
      }
    })
    
    // 添加地图图层加载监听
    setTimeout(() => {
      const layers = map.getLayers()
      console.log('🗺️ 地图图层数量:', layers ? layers.length : 0)
      if (!layers || layers.length === 0) {
        console.warn('⚠️ 地图图层未加载，可能是网络问题或API配额用完')
      }
    }, 2000)
  } catch (error) {
    console.error('❌ 地图初始化失败:', error)
    myLocation.value.address = '地图初始化失败'
  }
}

const updateMapMarkers = () => {
  if (!map) return
  
  // 更新我的标记
  if (myLocation.value.lat && myLocation.value.lng) {
    if (myMarker) {
      myMarker.setPosition([myLocation.value.lng, myLocation.value.lat])
    } else {
      // 创建我的位置标记（蓝色）
      myMarker = new AMap.Marker({
        position: [myLocation.value.lng, myLocation.value.lat],
        icon: new AMap.Icon({
          size: new AMap.Size(36, 36),
          image: 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(`
            <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 36 36">
              <circle cx="18" cy="18" r="16" fill="#1890ff" stroke="white" stroke-width="3"/>
              <circle cx="18" cy="18" r="8" fill="white"/>
            </svg>
          `),
          imageSize: new AMap.Size(36, 36)
        }),
        title: '我的位置',
        label: {
          content: '我',
          offset: new AMap.Pixel(0, -36),
          direction: 'top'
        },
        map: map
      })
    }
    map.setCenter([myLocation.value.lng, myLocation.value.lat])
  }
  
  // 更新对方的标记
  if (partnerLocation.value.lat && partnerLocation.value.lng) {
    if (partnerMarker) {
      partnerMarker.setPosition([partnerLocation.value.lng, partnerLocation.value.lat])
    } else {
      // 创建对方位置标记（粉色）
      partnerMarker = new AMap.Marker({
        position: [partnerLocation.value.lng, partnerLocation.value.lat],
        icon: new AMap.Icon({
          size: new AMap.Size(36, 36),
          image: 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(`
            <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 36 36">
              <circle cx="18" cy="18" r="16" fill="#ff69b4" stroke="white" stroke-width="3"/>
              <circle cx="18" cy="18" r="8" fill="white"/>
            </svg>
          `),
          imageSize: new AMap.Size(36, 36)
        }),
        title: 'TA的位置',
        label: {
          content: 'TA',
          offset: new AMap.Pixel(0, -36),
          direction: 'top'
        },
        map: map
      })
    }
    
    // 如果两个标记都存在，调整视野包含两个标记
    if (myMarker && partnerMarker) {
      map.setFitView([myMarker, partnerMarker])
    }
  }
}

const reverseGeocode = async (lng, lat) => {
  if (!geocoder) return null
  
  return new Promise((resolve) => {
    geocoder.getAddress([lng, lat], (status, result) => {
      console.log('🗺️ 逆地理编码状态:', status)
      console.log('🗺️ 逆地理编码结果:', result)
      
      if (status === 'complete' && result.info === 'OK') {
        const address = result.regeocode.formattedAddress
        console.log('✅ 地址解析成功:', address)
        resolve(address)
      } else {
        console.warn('⚠️ 地址解析失败:', status, result)
        // 返回null，让调用方使用坐标作为备用显示
        resolve(null)
      }
    })
  })
}

const updateLocation = async () => {
  console.log('📍 开始获取位置...')
  
  if (!navigator.geolocation) {
    console.error('❌ 浏览器不支持定位')
    myLocation.value.address = '浏览器不支持定位'
    return
  }
  
  myLocation.value.address = '定位中...'
  
  navigator.geolocation.getCurrentPosition(
    async (position) => {
      console.log('✅ GPS位置获取成功:', position.coords)
      
      myLocation.value.lat = position.coords.latitude
      myLocation.value.lng = position.coords.longitude
      
      console.log(`📍 我的位置: ${myLocation.value.lat}, ${myLocation.value.lng}`)
      
      // 逆地理编码获取地址
      try {
        const address = await reverseGeocode(myLocation.value.lng, myLocation.value.lat)
        if (address) {
          myLocation.value.address = address
          console.log('📍 地址解析成功:', myLocation.value.address)
        } else {
          // 如果逆地理编码失败，显示坐标
          myLocation.value.address = `经纬度: ${myLocation.value.lat.toFixed(4)}, ${myLocation.value.lng.toFixed(4)}`
          console.log('📍 显示坐标:', myLocation.value.address)
        }
      } catch (error) {
        console.error('❌ 地址解析异常:', error)
        myLocation.value.address = `经纬度: ${myLocation.value.lat.toFixed(4)}, ${myLocation.value.lng.toFixed(4)}`
      }
      
      // 更新地图标记
      updateMapMarkers()
      
      // 发送位置到后端
      try {
        await http.post('/location/update', {
          lat: myLocation.value.lat,
          lng: myLocation.value.lng
        })
        console.log('✅ 位置已发送到后端')
        
        loadPartnerLocation()
      } catch (error) {
        console.error('❌ 更新位置到后端失败:', error)
      }
    },
    (error) => {
      console.error('❌ 获取位置失败:', error)
      let errorMsg = '无法获取位置'
      switch (error.code) {
        case error.PERMISSION_DENIED:
          errorMsg = '用户拒绝了位置请求'
          break
        case error.POSITION_UNAVAILABLE:
          errorMsg = '位置信息不可用'
          break
        case error.TIMEOUT:
          errorMsg = '请求位置超时'
          break
      }
      myLocation.value.address = errorMsg
      alert('❌ ' + errorMsg + '\n\n请确保：\n1. 已允许浏览器访问位置\n2. 设备GPS已开启')
    },
    {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0
    }
  )
}

const loadPartnerLocation = async () => {
  try {
    const res = await http.get('/location/partner')
    if (res.code === 200 && res.data) {
      partnerLocation.value.lat = res.data.latitude
      partnerLocation.value.lng = res.data.longitude
      partnerLocation.value.address = res.data.address
      
      // 如果没有地址，进行逆地理编码
      if (!partnerLocation.value.address && partnerLocation.value.lng && partnerLocation.value.lat) {
        const address = await reverseGeocode(partnerLocation.value.lng, partnerLocation.value.lat)
        partnerLocation.value.address = address
      }
      
      updateMapMarkers()
      calculateDistance()
    }
  } catch (error) {
    console.error('获取对方位置失败:', error)
  }
}

const calculateDistance = () => {
  if (myLocation.value.lat && partnerLocation.value.lat) {
    const R = 6371 // 地球半径（公里）
    const dLat = (partnerLocation.value.lat - myLocation.value.lat) * Math.PI / 180
    const dLon = (partnerLocation.value.lng - myLocation.value.lng) * Math.PI / 180
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(myLocation.value.lat * Math.PI / 180) * Math.cos(partnerLocation.value.lat * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
    distance.value = (R * c).toFixed(2)
  }
}

const loadHistory = async () => {
  try {
    const res = await http.get('/location/history')
    if (res.code === 200) {
      locationHistory.value = res.data
    }
  } catch (error) {
    console.error('加载位置历史失败:', error)
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

onMounted(async () => {
  // 初始化地图
  setTimeout(() => {
    initMap()
  }, 500)
  
  // 加载共享状态
  try {
    const res = await http.get('/location/status')
    if (res.code === 200) {
      sharingEnabled.value = res.data.enabled
      if (sharingEnabled.value) {
        startLocationTracking()
      }
    }
  } catch (error) {
    console.error('加载共享状态失败:', error)
  }
  
  loadHistory()
})

onUnmounted(() => {
  stopLocationTracking()
})
</script>

<style scoped>
.location-page {
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

.control-panel {
  background: white;
  border-radius: 20px;
  padding: 20px;
  margin-bottom: 20px;
  box-shadow: 0 8px 21px rgba(255, 77, 136, 0.1);
}

.switch-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.switch-item span {
  font-size: 16px;
  color: #333;
  font-weight: bold;
}

.switch {
  position: relative;
  display: inline-block;
  width: 50px;
  height: 26px;
}

.switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #ccc;
  transition: .4s;
  border-radius: 26px;
}

.slider:before {
  position: absolute;
  content: "";
  height: 20px;
  width: 20px;
  left: 3px;
  bottom: 3px;
  background-color: white;
  transition: .4s;
  border-radius: 50%;
}

input:checked + .slider {
  background: linear-gradient(135deg, #FF4D88, #FF98B9);
}

input:checked + .slider:before {
  transform: translateX(24px);
}

.hint {
  color: #999;
  font-size: 12px;
  margin: 0;
}

.map-container {
  background: white;
  border-radius: 20px;
  padding: 20px;
  margin-bottom: 20px;
  box-shadow: 0 8px 21px rgba(255, 77, 136, 0.1);
  position: relative;
}

.amap-container {
  width: 100%;
  height: 400px;
  border-radius: 15px;
  overflow: hidden;
}

.location-info-panel {
  position: absolute;
  top: 30px;
  left: 30px;
  right: 30px;
  display: flex;
  gap: 10px;
  z-index: 10;
  pointer-events: none;
}

.info-item {
  flex: 1;
  background: rgba(255, 255, 255, 0.95);
  padding: 12px 15px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  gap: 10px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  backdrop-filter: blur(10px);
}

.info-item.mine {
  border-left: 4px solid #FF4D88;
}

.info-item.partner {
  border-left: 4px solid #FF98B9;
}

.info-icon {
  font-size: 28px;
}

.info-text {
  flex: 1;
  min-width: 0;
}

.info-label {
  font-weight: bold;
  color: #333;
  font-size: 13px;
  margin-bottom: 3px;
}

.info-address {
  color: #666;
  font-size: 11px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.distance-info {
  position: absolute;
  bottom: 30px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(255, 77, 136, 0.95);
  color: white;
  padding: 12px 24px;
  border-radius: 25px;
  display: flex;
  align-items: center;
  gap: 8px;
  z-index: 10;
  box-shadow: 0 4px 12px rgba(255, 77, 136, 0.4);
  backdrop-filter: blur(10px);
}

.distance-icon {
  font-size: 20px;
}

.distance-text {
  font-weight: bold;
}

.history-section {
  background: white;
  border-radius: 20px;
  padding: 20px;
  box-shadow: 0 8px 21px rgba(255, 77, 136, 0.1);
}

.history-section h3 {
  color: #333;
  margin-bottom: 15px;
}

.history-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.history-item {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 12px;
  background: #FFF5F8;
  border-radius: 10px;
}

.history-icon {
  font-size: 24px;
}

.history-info {
  flex: 1;
}

.history-address {
  color: #333;
  font-size: 14px;
  margin-bottom: 4px;
}

.history-time {
  color: #999;
  font-size: 12px;
}
</style>

