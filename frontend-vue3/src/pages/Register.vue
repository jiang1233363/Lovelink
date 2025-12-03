<template>
  <div class="register-page">
    <div class="register-card">
      <h1 class="title">注册 LoveLink ❤️</h1>
      <p class="subtitle">创建你的账户</p>
      
      <div class="form">
        <div class="form-group">
          <label>用户名</label>
          <input 
            v-model="username" 
            class="username-input"
            type="text" 
            placeholder="请输入用户名"
          />
        </div>
        
        <div class="form-group">
          <label>邮箱</label>
          <input 
            v-model="email" 
            class="email-input"
            type="email" 
            placeholder="请输入邮箱"
          />
        </div>
        
        <div class="form-group">
          <label>密码</label>
          <input 
            v-model="password" 
            class="password-input"
            type="password" 
            placeholder="请输入密码"
          />
        </div>
        
        <button class="register-btn" @click="register">注册</button>
        <p class="hint" @click="$router.push('/login')" style="cursor: pointer;">已有账号？去登录</p>
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
const email = ref('')
const password = ref('')

const register = async () => {
  if (!username.value || !email.value || !password.value) {
    alert('请填写所有字段')
    return
  }
  
  try {
    console.log('📝 注册中...', { username: username.value, email: email.value })
    const res = await http.post('/user/register', {
      username: username.value,
      email: email.value,
      password: password.value
    })
    
    console.log('✅ 注册响应:', res)
    
    if (res.code === 200) {
      alert('注册成功！请登录')
      router.push('/login')
    } else {
      alert(res.message || '注册失败')
    }
  } catch (error) {
    console.error('❌ 注册失败:', error)
    alert('注册失败：' + (error.response?.data?.message || error.message))
  }
}
</script>

<style scoped>
.register-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(180deg, #FFB6C1, #FFD1DC);
}

.register-card {
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

.register-btn {
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

.register-btn:hover {
  transform: translateY(-2px);
}

.register-btn:active {
  transform: translateY(0);
}

.hint {
  text-align: center;
  color: #FF4D88;
  font-size: 14px;
  margin-top: 20px;
}
</style>




