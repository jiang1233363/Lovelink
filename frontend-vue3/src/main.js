import { createApp } from 'vue'
import { createRouter, createWebHashHistory } from 'vue-router'
import App from './App.vue'
import Login from './pages/Login.vue'
import Register from './pages/Register.vue'
import Home from './pages/Home.vue'
import Mood from './pages/Mood.vue'
import Diary from './pages/Diary.vue'
import Reminder from './pages/Reminder.vue'
import AccountBook from './pages/AccountBook.vue'
import Memory from './pages/Memory.vue'
import Chat from './pages/Chat.vue'
import QA from './pages/QA.vue'
import Heartbeat from './pages/Heartbeat.vue'
import Period from './pages/Period.vue'
import Achievement from './pages/Achievement.vue'
import Location from './pages/Location.vue'
import Conflict from './pages/Conflict.vue'
import Home3D from './pages/Home3D.vue'
import AnimeCard from './pages/AnimeCard.vue'
import Couple from './pages/Couple.vue'
import Profile from './pages/Profile.vue'
import Admin from './pages/Admin.vue'
import AdminLogin from './pages/AdminLogin.vue'

const routes = [
  { path: '/', redirect: '/login' },
  { path: '/login', component: Login },
  { path: '/register', component: Register },
  { path: '/home', component: Home },
  { path: '/mood', component: Mood },
  { path: '/diary', component: Diary },
  { path: '/reminder', component: Reminder },
  { path: '/accountBook', component: AccountBook },
  { path: '/memory', component: Memory },
  { path: '/chat', component: Chat },
  { path: '/qa', component: QA },
  { path: '/heartbeat', component: Heartbeat },
  { path: '/period', component: Period },
  { path: '/achievement', component: Achievement },
  { path: '/location', component: Location },
  { path: '/conflict', component: Conflict },
  { path: '/home3d', component: Home3D },
  { path: '/pet', redirect: '/home3d' }, // 宠物功能合并到爱巢
  { path: '/animecard', component: AnimeCard },
  { path: '/couple', component: Couple },
  { path: '/profile', component: Profile },
  { path: '/admin/login', component: AdminLogin },
  { path: '/admin', component: Admin }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

const app = createApp(App)
app.use(router)
app.mount('#app')

