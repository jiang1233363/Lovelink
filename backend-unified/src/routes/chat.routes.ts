import express from 'express';
import { authMiddleware } from '../middleware/auth';
import { pool } from '../config/database';
import multer from 'multer';
import path from 'path';

const router = express.Router();

// 配置文件上传
const storage = multer.diskStorage({
  destination: 'uploads/chat/',
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ storage });

// 获取消息列表
router.get('/messages', authMiddleware, async (req: any, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;
    
    // 如果没有coupleId，返回空列表
    if (!req.coupleId) {
      return res.json({
        code: 200,
        data: {
          list: [],
          total: 0,
          message: '请先配对情侣关系'
        }
      });
    }
    
    const [messages] = await pool.execute(
      `SELECT m.*, u.username as sender_name, u.avatar
      FROM chat_messages m
      LEFT JOIN users u ON m.sender_id = u.id
      WHERE m.couple_id = ?
      ORDER BY m.created_at DESC
      LIMIT ${Number(limit)} OFFSET ${Number(offset)}`,
      [Number(req.coupleId)]
    ) as any[];
    
    res.json({
      code: 200,
      data: {
        list: messages.reverse(),
        total: messages.length
      }
    });
  } catch (error) {
    console.error('获取消息列表失败:', error);
    res.json({ code: 500, message: '获取消息列表失败' });
  }
});

// 获取聊天历史（前端兼容）
router.get('/history', authMiddleware, async (req: any, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;
    
    // 如果没有coupleId，返回空列表
    if (!req.coupleId) {
      return res.json({
        code: 200,
        data: {
          list: [],
          total: 0,
          message: '请先配对情侣关系'
        }
      });
    }
    
    const [messages] = await pool.execute(
      `SELECT m.*, u.username as sender_name, u.avatar
      FROM chat_messages m
      LEFT JOIN users u ON m.sender_id = u.id
      WHERE m.couple_id = ?
      ORDER BY m.created_at DESC
      LIMIT ${Number(limit)} OFFSET ${Number(offset)}`,
      [Number(req.coupleId)]
    ) as any[];
    
    res.json({
      code: 200,
      data: {
        list: messages.reverse(),
        total: messages.length
      }
    });
  } catch (error) {
    console.error('获取消息列表失败:', error);
    res.json({ code: 500, message: '获取消息列表失败' });
  }
});

// 发送消息
router.post('/send', authMiddleware, async (req: any, res) => {
  try {
    const { receiver_id, type, content } = req.body;
    
    if (!content || !content.trim()) {
      return res.json({ code: 400, message: '消息内容不能为空' });
    }
    
    // 如果没有coupleId，提示需要配对
    if (!req.coupleId) {
      return res.json({ code: 400, message: '请先配对情侣关系才能发送消息' });
    }
    
    // 获取情侣另一方的ID作为receiver_id
    const [couples] = await pool.execute(
      `SELECT user1_id, user2_id FROM couples WHERE id = ?`,
      [Number(req.coupleId)]
    ) as any[];
    
    let receiverId = receiver_id;
    if (!receiverId && couples.length > 0) {
      const couple = couples[0];
      receiverId = couple.user1_id === req.userId ? couple.user2_id : couple.user1_id;
    }
    
    const [result] = await pool.execute(
      `INSERT INTO chat_messages (couple_id, sender_id, receiver_id, type, content)
      VALUES (?, ?, ?, ?, ?)`,
      [Number(req.coupleId), req.userId, receiverId, type || 'text', content]
    ) as any[];
    
    // 获取刚插入的消息
    const [messages] = await pool.execute(
      `SELECT m.*, u.username as sender_name, u.avatar
      FROM chat_messages m
      LEFT JOIN users u ON m.sender_id = u.id
      WHERE m.id = ?`,
      [result.insertId]
    ) as any[];
    
    res.json({
      code: 200,
      message: '发送成功',
      data: messages[0]
    });
  } catch (error: any) {
    console.error('发送消息失败', error);
    res.json({ code: 500, message: `发送消息失败: ${error.message}` });
  }
});

// 上传图片
router.post('/upload', authMiddleware, upload.single('image'), (req: any, res) => {
  try {
    if (!req.file) {
      return res.json({ code: 400, message: '未上传文件' });
    }
    
    const url = `/uploads/chat/${req.file.filename}`;
    res.json({
      code: 200,
      data: { url }
    });
  } catch (error) {
    console.error('上传图片失败:', error);
    res.json({ code: 500, message: '上传图片失败' });
  }
});

export default router;
