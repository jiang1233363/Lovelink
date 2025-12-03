import axios from 'axios'

const http = axios.create({
  baseURL: '/api',
  timeout: 10000
})

// 请求拦截器
http.interceptors.request.use(
  config => {
    // 检查是否是管理端请求
    const isAdminRequest = config.url.startsWith('/admin')
    const isAdmin = localStorage.getItem('isAdmin') === 'true'
    
    // 根据请求类型选择token
    const token = (isAdminRequest || isAdmin) 
      ? localStorage.getItem('adminToken') 
      : localStorage.getItem('token')
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    
    // 管理端请求添加额外标识
    if (isAdminRequest || isAdmin) {
      config.headers['X-Admin'] = 'true'
    }
    
    console.log('🌐 请求:', config.method.toUpperCase(), config.url, config.data)
    return config
  },
  error => {
    console.error('❌ 请求错误:', error)
    return Promise.reject(error)
  }
)

// 响应拦截器
http.interceptors.response.use(
  response => {
    console.log('✅ 响应:', response.config.url, response.data)
    return response.data
  },
  error => {
    console.error('❌ 响应错误:', error)
    if (error.response?.status === 401) {
      const isAdminArea = window.location.hash.includes('/admin')
      
      if (isAdminArea) {
        // 管理端清除管理员数据并跳转到管理端登录
        localStorage.removeItem('adminToken')
        localStorage.removeItem('adminInfo')
        localStorage.removeItem('isAdmin')
        window.location.hash = '#/admin/login'
      } else {
        // 用户端清除用户数据并跳转到用户登录
        localStorage.removeItem('token')
        localStorage.removeItem('userInfo')
        window.location.hash = '#/login'
      }
    }
    return Promise.reject(error)
  }
)

export default http




