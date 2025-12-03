import express from 'express';
import { authMiddleware } from '../middleware/auth';
import { pool } from '../config/database';
import bcrypt from 'bcryptjs';
import { generateToken } from '../middleware/auth';

const router = express.Router();

// 注册
router.post('/register', async (req, res) => {
  try {
    const { username, password, email } = req.body;
    console.log('📝 注册请求:', { username, email });
    
    // 检查用户是否已存在
    const [existing] = await pool.execute(
      'SELECT id FROM users WHERE username = ? OR email = ?',
      [username, email]
    ) as any[];
    
    if (existing.length > 0) {
      console.log('⚠️  用户已存在');
      return res.json({ code: 400, message: '用户名或邮箱已存在' });
    }
    
    // 加密密码
    const hashedPassword = await bcrypt.hash(password, 10);
    console.log('✅ 密码已加密');
    
    // 创建用户
    const [result] = await pool.execute(
      'INSERT INTO users (username, password, email) VALUES (?, ?, ?)',
      [username, hashedPassword, email]
    ) as any[];
    
    console.log('✅ 用户创建成功, ID:', (result as any).insertId);
    
    res.json({
      code: 200,
      message: '注册成功',
      data: { userId: (result as any).insertId }
    });
  } catch (error: any) {
    console.error('❌ 注册失败详情:', error.message);
    console.error('   错误代码:', error.code);
    console.error('   SQL状态:', error.sqlState);
    console.error('   SQL:', error.sql);
    res.json({ 
      code: 500, 
      message: '注册失败：' + (error.message || '未知错误')
    });
  }
});

// 登录
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    // 查找用户
    const [users] = await pool.execute(
      'SELECT * FROM users WHERE username = ?',
      [username]
    ) as any[];
    
    if (users.length === 0) {
      return res.json({ code: 401, message: '用户名或密码错误' });
    }
    
    const user = users[0];
    
    // 验证密码
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return res.json({ code: 401, message: '用户名或密码错误' });
    }
    
    // 生成token
    const token = generateToken(user.id.toString(), user.couple_id?.toString() || '');
    
    // 查询配对信息
    let partnerId = null;
    if (user.couple_id) {
      const [couples] = await pool.execute(
        'SELECT user1_id, user2_id FROM couples WHERE id = ?',
        [user.couple_id]
      ) as any[];
      
      if (couples.length > 0) {
        const couple = couples[0];
        // 如果当前用户是user1，则对方是user2，反之亦然
        partnerId = couple.user1_id === user.id ? couple.user2_id : couple.user1_id;
      }
    }
    
    res.json({
      code: 200,
      message: '登录成功',
      data: {
        token,
        userInfo: {
          id: user.id,
          username: user.username,
          email: user.email,
          couple_id: user.couple_id,
          partner_id: partnerId,
          avatar: user.avatar
        }
      }
    });
  } catch (error) {
    console.error('登录失败:', error);
    res.json({ code: 500, message: '登录失败' });
  }
});

// 获取用户信息
router.get('/info', authMiddleware, async (req: any, res) => {
  try {
    const [users] = await pool.execute(
      'SELECT id, username, email, couple_id, avatar, created_at FROM users WHERE id = ?',
      [req.userId]
    ) as any[];
    
    if (users.length === 0) {
      return res.json({ code: 404, message: '用户不存在' });
    }
    
    res.json({
      code: 200,
      data: users[0]
    });
  } catch (error) {
    console.error('获取用户信息失败:', error);
    res.json({ code: 500, message: '获取用户信息失败' });
  }
});

// 获取当前用户信息
router.get('/me', authMiddleware, async (req: any, res) => {
  try {
    const userId = req.userId;
    
    const [users] = await pool.execute(
      `SELECT u.id, u.username, u.email, u.avatar, u.couple_id,
              c.user1_id, c.user2_id, c.relationship_start_date
       FROM users u
       LEFT JOIN couples c ON u.couple_id = c.id
       WHERE u.id = ?`,
      [userId]
    ) as any[];
    
    if (users.length === 0) {
      return res.json({ code: 404, message: '用户不存在' });
    }
    
    const user = users[0];
    let partnerId = null;
    
    if (user.couple_id) {
      partnerId = user.user1_id === user.id ? user.user2_id : user.user1_id;
    }
    
    res.json({
      code: 200,
      data: {
        id: user.id,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
        couple_id: user.couple_id,
        user1_id: user.user1_id,
        user2_id: user.user2_id,
        partner_id: partnerId,
        relationship_start_date: user.relationship_start_date
      }
    });
  } catch (error: any) {
    console.error('获取用户信息失败:', error);
    res.json({ code: 500, message: '获取用户信息失败' });
  }
});

// 获取指定用户信息
router.get('/:userId', authMiddleware, async (req: any, res) => {
  try {
    const { userId } = req.params;
    
    const [users] = await pool.execute(
      `SELECT u.id, u.username, u.email, u.avatar, u.couple_id,
              c.relationship_start_date
       FROM users u
       LEFT JOIN couples c ON u.couple_id = c.id
       WHERE u.id = ?`,
      [userId]
    ) as any[];
    
    if (users.length === 0) {
      return res.json({ code: 404, message: '用户不存在' });
    }
    
    const user = users[0];
    
    res.json({
      code: 200,
      data: {
        id: user.id,
        username: user.username,
        avatar: user.avatar,
        relationship_start_date: user.relationship_start_date
      }
    });
  } catch (error: any) {
    console.error('获取用户信息失败:', error);
    res.json({ code: 500, message: '获取用户信息失败' });
  }
});

// 更新用户资料
router.put('/profile', authMiddleware, async (req: any, res) => {
  try {
    const userId = req.userId;
    const { email, gender, birthday, location } = req.body;
    
    console.log('📝 更新用户资料:', { userId, email, gender, birthday, location });
    
    await pool.execute(
      'UPDATE users SET email = ?, gender = ?, birthday = ?, location = ? WHERE id = ?',
      [email, gender, birthday, location, userId]
    );
    
    res.json({ code: 200, message: '更新成功' });
  } catch (error: any) {
    console.error('更新用户资料失败:', error);
    res.json({ code: 500, message: '更新失败' });
  }
});

// 修改密码
router.put('/password', authMiddleware, async (req: any, res) => {
  try {
    const userId = req.userId;
    const { oldPassword, newPassword } = req.body;
    
    console.log('🔐 修改密码:', userId);
    
    // 验证旧密码
    const [users] = await pool.execute(
      'SELECT password FROM users WHERE id = ?',
      [userId]
    ) as any[];
    
    if (users.length === 0) {
      return res.json({ code: 404, message: '用户不存在' });
    }
    
    const isValid = await bcrypt.compare(oldPassword, users[0].password);
    if (!isValid) {
      return res.json({ code: 401, message: '当前密码错误' });
    }
    
    // 更新密码
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await pool.execute(
      'UPDATE users SET password = ? WHERE id = ?',
      [hashedPassword, userId]
    );
    
    res.json({ code: 200, message: '密码修改成功' });
  } catch (error: any) {
    console.error('修改密码失败:', error);
    res.json({ code: 500, message: '修改密码失败' });
  }
});

export default router;




