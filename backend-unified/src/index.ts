import express from 'express';
import cors from 'cors';
import http from 'http';
import { Server } from 'socket.io';
import dotenv from 'dotenv';
import { testConnection } from './config/database';

// 导入路由
import userRoutes from './routes/user.routes';
import diaryRoutes from './routes/diary.routes';
import memoryRoutes from './routes/memory.routes';
import albumRoutes from './routes/album.routes';
import accountBookRoutes from './routes/accountBook.routes';
import calendarRoutes from './routes/calendar.routes';
import qaRoutes from './routes/qa.routes';
import heartbeatRoutes from './routes/heartbeat.routes';
import achievementRoutes from './routes/achievement.routes';
import animeRoutes from './routes/anime.routes';
import firemanRoutes from './routes/fireman.routes';
import nestRoutes from './routes/nest.routes';
import chatRoutes from './routes/chat.routes';
import moodRoutes from './routes/mood.routes';
import locationRoutes from './routes/location.routes';
import periodRoutes from './routes/period.routes';
import reminderRoutes from './routes/reminder.routes';
import petRoutes from './routes/pet.routes';
import mapRoutes from './routes/map.routes';
import uploadRoutes from './routes/upload.routes';
import coupleRoutes from './routes/couple.routes';
import adminRoutes from './routes/admin.routes';

// 导入Socket处理
import { initSocket } from './socket';

// 导入中间件
import { requestLogger } from './middleware/logger';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// 创建HTTP服务器
const server = http.createServer(app);

// 创建Socket.IO服务器
const io = new Server(server, {
  cors: {
    origin: process.env.CORS_ORIGIN || '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE']
  }
});

// 基础中间件
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 请求日志
app.use(requestLogger);

// 静态文件服务
app.use('/uploads', express.static('uploads'));
app.use('/public', express.static('public'));

// 路由
app.use('/api/user', userRoutes);
app.use('/api/diary', diaryRoutes);
app.use('/api/memory', memoryRoutes);
app.use('/api/album', albumRoutes);
app.use('/api/accountBook', accountBookRoutes);
app.use('/api/calendar', calendarRoutes);
app.use('/api/qa', qaRoutes);
app.use('/api/heartbeat', heartbeatRoutes);
app.use('/api/achievement', achievementRoutes);
app.use('/api/anime', animeRoutes);
app.use('/api/fireman', firemanRoutes);
app.use('/api/nest', nestRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/mood', moodRoutes);
app.use('/api/location', locationRoutes);
app.use('/api/period', periodRoutes);
app.use('/api/reminder', reminderRoutes);
app.use('/api/pet', petRoutes);
app.use('/api/map', mapRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/couple', coupleRoutes);
app.use('/api/admin', adminRoutes);

// 健康检查
app.get('/health', (req, res) => {
  res.json({
    code: 200,
    message: 'LoveLink API服务正常运行',
    timestamp: new Date().toISOString()
  });
});

// 根路由
app.get('/', (req, res) => {
  res.json({
    code: 200,
    message: '欢迎使用 LoveLink API',
    version: '2.0.0',
    environment: process.env.NODE_ENV || 'development',
    features: [
      '用户认证',
      '心情日记',
      '回忆墙',
      '智能纪念册',
      '共同账本',
      '情侣日程',
      '问答系统',
      '365心动计划',
      '成就系统',
      '动漫照片',
      '情侣消防员',
      '情侣小窝',
      '聊天系统',
      '心情日历',
      '位置共享',
      '经期管理',
      '提醒事项',
      '地图服务',
      '宠物系统',
      '文件上传',
      '实时通讯(Socket.IO)'
    ]
  });
});

// 404处理（必须在所有路由之后）
app.use(notFoundHandler);

// 全局错误处理（必须在最后）
app.use(errorHandler);

// 初始化Socket.IO
initSocket(io);

// 启动服务器
async function startServer() {
  try {
    // 测试数据库连接
    const dbConnected = await testConnection();
    if (!dbConnected) {
      console.error('❌ 数据库连接失败，请检查配置');
      process.exit(1);
    }

    // 启动服务器，监听所有网络接口（允许手机访问）
    server.listen(Number(PORT), '0.0.0.0', () => {
      console.log('');
      console.log('========================================');
      console.log('🚀 LoveLink 统一后端服务器已启动');
      console.log(`📡 HTTP服务: http://localhost:${PORT}`);
      console.log(`📱 手机访问: http://10.21.201.42:${PORT}`);
      console.log(`🔌 Socket.IO服务: ws://localhost:${PORT}`);
      console.log(`🗄️  数据库: ${process.env.DB_HOST}:${process.env.DB_PORT}`);
      console.log(`📂 上传目录: uploads/`);
      console.log('========================================');
      console.log('');
    });
  } catch (error) {
    console.error('❌ 服务器启动失败:', error);
    process.exit(1);
  }
}

startServer();

export { app, io };

