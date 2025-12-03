import express from 'express';
import { authMiddleware, generateToken } from '../middleware/auth';
import { pool } from '../config/database';
import bcrypt from 'bcryptjs';

const router = express.Router();

// 创建管理员表
async function ensureAdminTable() {
  try {
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS admins (
        id INT PRIMARY KEY AUTO_INCREMENT,
        username VARCHAR(50) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(20) DEFAULT 'admin',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_username (username)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    
    // 检查是否存在默认管理员
    const [admins] = await pool.execute(
      'SELECT id FROM admins WHERE username = ?',
      ['admin']
    ) as any[];
    
    if (admins.length === 0) {
      // 创建默认管理员: admin / admin123
      const hashedPassword = await bcrypt.hash('admin123', 10);
      await pool.execute(
        'INSERT INTO admins (username, password) VALUES (?, ?)',
        ['admin', hashedPassword]
      );
      console.log('✅ 默认管理员账号已创建: admin / admin123');
    }
  } catch (error) {
    console.error('创建管理员表失败:', error);
  }
}

ensureAdminTable();

// 管理员权限检查
const adminMiddleware = async (req: any, res: any, next: any) => {
  // 简化处理，所有通过认证的用户都可以访问管理功能
  next();
};

// 管理员登录
router.post('/login', async (req: any, res) => {
  try {
    const { username, password } = req.body;
    console.log('🔐 管理员登录:', username);
    
    // 查找管理员
    const [admins] = await pool.execute(
      'SELECT * FROM admins WHERE username = ?',
      [username]
    ) as any[];
    
    if (admins.length === 0) {
      return res.json({ code: 401, message: '管理员账号或密码错误' });
    }
    
    const admin = admins[0];
    
    // 验证密码
    const isValid = await bcrypt.compare(password, admin.password);
    if (!isValid) {
      return res.json({ code: 401, message: '管理员账号或密码错误' });
    }
    
    // 生成token
    const token = generateToken(admin.id.toString(), '0');
    
    res.json({
      code: 200,
      message: '登录成功',
      data: {
        token,
        adminInfo: {
          id: admin.id,
          username: admin.username,
          role: admin.role
        }
      }
    });
  } catch (error: any) {
    console.error('管理员登录失败:', error);
    res.json({ code: 500, message: '登录失败' });
  }
});

// 获取平台统计数据
router.get('/stats', authMiddleware, adminMiddleware, async (req: any, res) => {
  try {
    console.log('📊 获取平台统计...');
    
    // 总用户数
    const [userCount] = await pool.execute(
      'SELECT COUNT(*) as count FROM users'
    ) as any[];
    
    // 总配对数
    const [coupleCount] = await pool.execute(
      'SELECT COUNT(*) as count FROM couples WHERE relationship_status = \'active\''
    ) as any[];
    
    // 总日记数
    const [diaryCount] = await pool.execute(
      'SELECT COUNT(*) as count FROM diaries'
    ) as any[];
    
    // 总回忆数
    const [memoryCount] = await pool.execute(
      'SELECT COUNT(*) as count FROM memories'
    ) as any[];
    
    res.json({
      code: 200,
      data: {
        totalUsers: userCount[0].count,
        totalCouples: coupleCount[0].count,
        totalDiaries: diaryCount[0].count,
        totalMemories: memoryCount[0].count
      }
    });
  } catch (error: any) {
    console.error('获取平台统计失败:', error);
    res.json({ code: 500, message: '获取统计失败' });
  }
});

// 获取所有用户
router.get('/users', authMiddleware, adminMiddleware, async (req: any, res) => {
  try {
    const { page = 1, limit = 100 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);
    
    console.log('👥 获取用户列表...');
    
    const [users] = await pool.execute(
      `SELECT id, username, email, gender, couple_id, created_at
       FROM users
       ORDER BY created_at DESC
       LIMIT ${Number(limit)} OFFSET ${Number(offset)}`
    ) as any[];
    
    const [total] = await pool.execute(
      'SELECT COUNT(*) as count FROM users'
    ) as any[];
    
    res.json({
      code: 200,
      data: {
        list: users,
        total: total[0].count
      }
    });
  } catch (error: any) {
    console.error('获取用户列表失败:', error);
    res.json({ code: 500, message: '获取用户列表失败' });
  }
});

// 搜索用户
router.get('/users/search', authMiddleware, adminMiddleware, async (req: any, res) => {
  try {
    const { keyword } = req.query;
    
    console.log('🔍 搜索用户:', keyword);
    
    const [users] = await pool.execute(
      `SELECT id, username, email, gender, couple_id, created_at
       FROM users
       WHERE username LIKE ? OR email LIKE ?
       ORDER BY created_at DESC
       LIMIT 50`,
      [`%${keyword}%`, `%${keyword}%`]
    ) as any[];
    
    res.json({
      code: 200,
      data: users
    });
  } catch (error: any) {
    console.error('搜索用户失败:', error);
    res.json({ code: 500, message: '搜索用户失败' });
  }
});

// 获取所有配对
router.get('/couples', authMiddleware, adminMiddleware, async (req: any, res) => {
  try {
    console.log('💑 获取配对列表...');
    
    const [couples] = await pool.execute(
      `SELECT 
        c.id, 
        c.user1_id, 
        c.user2_id, 
        c.relationship_start_date, 
        c.relationship_status,
        u1.username as user1_name,
        u2.username as user2_name
       FROM couples c
       LEFT JOIN users u1 ON c.user1_id = u1.id
       LEFT JOIN users u2 ON c.user2_id = u2.id
       ORDER BY c.created_at DESC`
    ) as any[];
    
    res.json({
      code: 200,
      data: couples
    });
  } catch (error: any) {
    console.error('获取配对列表失败:', error);
    res.json({ code: 500, message: '获取配对列表失败' });
  }
});

export default router;

