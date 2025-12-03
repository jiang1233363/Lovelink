<template>
  <div class="login-page">
    <div class="login-card">
      <h1 class="title">LoveLink ❤️</h1>
      <p class="subtitle">情侣互动平台</p>
      
      <div class="form">
        <div class="form-group">
          <label>用户名</label>
          <input 
            v-model="username" 
            class="username-input"
            type="text" 
            placeholder="请输入用户名"
            @keyup.enter="login"
          />
        </div>
        
        <div class="form-group">
          <label>密码</label>
          <input 
            v-model="password" 
            class="password-input"
            type="password" 
            placeholder="请输入密码"
            @keyup.enter="login"
          />
        </div>
        
        <button class="login-btn" @click="login">登录</button>
        <p class="hint">测试账号: user1 / password123</p>
        <p class="hint" @click="$router.push('/register')" style="cursor: pointer; color: #FF4D88;">没有账号？去注册</p>
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
    alert('请输入用户名和密码')
    return
  }
  
  try {
    console.log('🔐 登录中...', { username: username.value })
    const res = await http.post('/user/login', {
      username: username.value,
      password: password.value
    })
    
    console.log('✅ 登录成功:', res)
    
    if (res.code === 200 && res.data.token) {
      localStorage.setItem('token', res.data.token)
      localStorage.setItem('userInfo', JSON.stringify(res.data.userInfo))
      localStorage.setItem('userId', res.data.userInfo.id)
      
      alert('登录成功！')
      router.push('/home')
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
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(180deg, #FFB6C1, #FFD1DC);
}

.login-card {
  background: white;
  border-radius: 42px;
  padding: 50px;
  width: 400px;
  box-shadow: 0 17px 42px rgba(255, 77, 136, 0.15);
}

.title {
  text-align: center;
  font-size: 36px;
  color: #333;
  margin-bottom: 10px;
}

.subtitle {
  text-align: center;
  color: #666;
  margin-bottom: 40px;
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

.form-group input {
  width: 100%;
  padding: 12px 16px;
  border: 2px solid #e0e0e0;
  border-radius: 10px;
  font-size: 16px;
  transition: border 0.3s;
}

.form-group input:focus {
  outline: none;
  border-color: #FF4D88;
}

.login-btn {
  width: 100%;
  padding: 14px;
  background: linear-gradient(135deg, #FF4D88, #FF98B9);
  color: white;
  border: none;
  border-radius: 25px;
  font-size: 18px;
  font-weight: bold;
  cursor: pointer;
  transition: transform 0.2s;
  box-shadow: 0 8px 21px rgba(255, 77, 136, 0.2);
}

.login-btn:hover {
  transform: translateY(-2px);
}

.login-btn:active {
  transform: translateY(0);
}

.hint {
  text-align: center;
  color: #999;
  font-size: 14px;
  margin-top: 20px;
}
</style>

