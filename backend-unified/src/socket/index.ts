import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';

interface UserSocket extends Socket {
  userId?: string;
  coupleId?: string;
}

// 存储在线用户
const onlineUsers = new Map<string, string>(); // userId -> socketId

export function initSocket(io: Server) {
  // Socket认证中间件
  io.use((socket: UserSocket, next) => {
    const token = socket.handshake.auth.token || socket.handshake.headers.authorization;
    
    if (!token) {
      return next(new Error('认证失败'));
    }

    try {
      const secret = process.env.JWT_SECRET || 'lovelink_secret_key';
      const decoded = jwt.verify(token.replace('Bearer ', ''), secret) as any;
      socket.userId = decoded.userId;
      socket.coupleId = decoded.coupleId;
      next();
    } catch (error) {
      next(new Error('令牌无效'));
    }
  });

  io.on('connection', (socket: UserSocket) => {
    console.log(`✅ 用户连接: ${socket.userId} (${socket.id})`);

    // 记录在线用户
    if (socket.userId) {
      onlineUsers.set(socket.userId, socket.id);
      
      // 通知伴侣上线
      notifyPartner(socket, 'user_online', { userId: socket.userId });
    }

    // 加入情侣房间
    if (socket.coupleId) {
      socket.join(`couple:${socket.coupleId}`);
    }

    // 聊天消息
    socket.on('send_message', async (data) => {
      try {
        // 发送给情侣房间的所有成员
        io.to(`couple:${socket.coupleId}`).emit('receive_message', {
          ...data,
          sender_id: socket.userId,
          created_at: new Date().toISOString()
        });
      } catch (error) {
        socket.emit('error', { message: '发送消息失败' });
      }
    });

    // 位置更新
    socket.on('update_location', (data) => {
      notifyPartner(socket, 'location_updated', {
        ...data,
        userId: socket.userId
      });
    });

    // 心情更新
    socket.on('update_mood', (data) => {
      notifyPartner(socket, 'mood_updated', {
        ...data,
        userId: socket.userId
      });
    });

    // 打卡通知
    socket.on('checkin_notify', (data) => {
      notifyPartner(socket, 'checkin_notified', {
        ...data,
        userId: socket.userId
      });
    });

    // 断开连接
    socket.on('disconnect', () => {
      console.log(`❌ 用户断开: ${socket.userId} (${socket.id})`);
      
      if (socket.userId) {
        onlineUsers.delete(socket.userId);
        // 通知伴侣离线
        notifyPartner(socket, 'user_offline', { userId: socket.userId });
      }
    });
  });

  // 辅助函数：通知伴侣
  function notifyPartner(socket: UserSocket, event: string, data: any) {
    if (socket.coupleId) {
      io.to(`couple:${socket.coupleId}`).except(socket.id).emit(event, data);
    }
  }

  console.log('✅ Socket.IO 初始化完成');
}

export function getOnlineUsers() {
  return Array.from(onlineUsers.keys());
}















