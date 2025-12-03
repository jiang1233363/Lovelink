<template>
  <div class="admin-login-page">
    <div class="login-card">
      <h1 class="title">🛠️ 管理后台登录</h1>
      <p class="subtitle">LoveLink 管理系统</p>
      
      <div class="form">
        <div class="form-group">
          <label>管理员账号</label>
          <input 
            v-model="username" 
            class="admin-username-input"
            type="text" 
            placeholder="请输入管理员账号"
            @keyup.enter="login"
          />
        </div>
        
        <div class="form-group">
          <label>管理员密码</label>
          <input 
            v-model="password" 
            class="admin-password-input"
            type="password" 
            placeholder="请输入管理员密码"
            @keyup.enter="login"
          />
        </div>
        
        <button class="admin-login-btn" @click="login">登录管理后台</button>
        <p class="hint">默认账号: admin / 密码: admin123</p>
        <p class="hint" @click="$router.push('/login')" style="cursor: pointer; color: #FF4D88;">← 返回用户端登录</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import http from '../api/http.js'

const router = useRouter()
const username = ref('')
const password = ref('')

const login = async () => {
  if (!username.value || !password.value) {
    alert('请输入管理员账号和密码')
    return
  }
  
  try {
    console.log('🔐 管理员登录中...', { username: username.value })
    const res = await http.post('/admin/login', {
      username: username.value,
      password: password.value
    })
    
    console.log('✅ 登录响应:', res)
    
    if (res.code === 200 && res.data.token) {
      localStorage.setItem('adminToken', res.data.token)
      localStorage.setItem('adminInfo', JSON.stringify(res.data.adminInfo))
      localStorage.setItem('isAdmin', 'true')
      
      alert('登录成功！')
      router.push('/admin')
    } else {
      alert(res.message || '登录失败')
    }
  } catch (error) {
    console.error('❌ 登录失败:', error)
    alert('登录失败：' + (error.response?.data?.message || error.message))
  }
}
</script>

<style scoped>
.admin-login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #FF4D88, #FF98B9);
}

.login-card {
  background: white;
  border-radius: 42px;
  padding: 50px;
  width: 400px;
  box-shadow: 0 17px 42px rgba(255, 77, 136, 0.3);
}

.title {
  text-align: center;
  font-size: 32px;
  color: #333;
  margin-bottom: 10px;
}

.subtitle {
  text-align: center;
  color: #666;
  margin-bottom: 40px;
  font-size: 16px;
}

.form-group {
  margin-bottom: 25px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  color: #333;
  font-weight: 500;
}

.form-group input {
  width: 100%;
  padding: 14px 18px;
  border: 2px solid #e0e0e0;
  border-radius: 12px;
  font-size: 16px;
  transition: border 0.3s;
}

.form-group input:focus {
  outline: none;
  border-color: #FF4D88;
}

.admin-login-btn {
  width: 100%;
  padding: 16px;
  background: linear-gradient(135deg, #FF4D88, #FF98B9);
  color: white;
  border: none;
  border-radius: 25px;
  font-size: 18px;
  font-weight: bold;
  cursor: pointer;
  transition: transform 0.2s;
  box-shadow: 0 8px 21px rgba(255, 77, 136, 0.3);
  margin-bottom: 20px;
}

.admin-login-btn:hover {
  transform: translateY(-2px);
}

.admin-login-btn:active {
  transform: translateY(0);
}

.hint {
  text-align: center;
  color: #999;
  font-size: 14px;
  margin-top: 15px;
}
</style>

