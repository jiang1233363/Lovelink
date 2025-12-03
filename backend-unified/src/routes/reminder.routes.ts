import express from 'express';
import { authMiddleware } from '../middleware/auth';
import { pool } from '../config/database';

const router = express.Router();

// 获取提醒列表
router.get('/list', authMiddleware, async (req: any, res) => {
  try {
    console.log('📋 获取提醒列表 - coupleId:', req.coupleId, 'type:', typeof req.coupleId, 'userId:', req.userId);
    
    const { status = 'all', page = 1, limit = 50 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    // 如果没有coupleId，使用userId查询个人提醒
    const coupleId = req.coupleId ? Number(req.coupleId) : null;
    
    let whereClause = coupleId ? 'couple_id = ?' : 'user_id = ?';
    const params: any[] = coupleId ? [coupleId] : [req.userId];

    if (status === 'pending') {
      whereClause += ' AND is_completed = 0';
    } else if (status === 'completed') {
      whereClause += ' AND is_completed = 1';
    }

    console.log('📝 SQL参数:', { coupleId, limit: Number(limit), offset: Number(offset) });

    // MySQL不支持LIMIT/OFFSET使用占位符，必须直接拼接
    const [reminders] = await pool.execute(
      `SELECT * FROM reminders 
       WHERE ${whereClause}
       ORDER BY created_at DESC
       LIMIT ${Number(limit)} OFFSET ${Number(offset)}`,
      params
    ) as any[];

    const [total] = await pool.execute(
      `SELECT COUNT(*) as count FROM reminders WHERE ${whereClause}`,
      params
    ) as any[];

    console.log(`✅ 获取到 ${reminders.length} 条提醒`);
    if (reminders.length > 0) {
      console.log('   最新3条:', reminders.slice(0, 3).map((r: any) => `[${r.id}] ${r.title}`).join(', '));
    }

    res.json({ 
      code: 200, 
      data: {
        list: reminders,
        total: total[0].count,
        page: Number(page),
        pageSize: Number(limit)
      }
    });
  } catch (error: any) {
    console.error('❌ 获取提醒失败:', error.message);
    console.error('   coupleId:', req.coupleId, 'type:', typeof req.coupleId);
    res.json({ code: 500, message: `获取失败: ${error.message}` });
  }
});

// 创建提醒
router.post('/create', authMiddleware, async (req: any, res) => {
  try {
    // 支持两种字段名：remind_at (新) 和 remind_time (旧)
    const { title, description, remind_at, remind_time, repeat_type, remind_type } = req.body;
    const remindTimeValue = remind_at || remind_time;
    const repeatTypeValue = repeat_type || remind_type || 'none';

    console.log('📝 创建提醒:', {
      coupleId: req.coupleId,
      userId: req.userId,
      title,
      remind_at: remindTimeValue,
      repeat_type: repeatTypeValue
    });

    if (!title || title.trim() === '') {
      return res.json({ code: 400, message: '标题不能为空' });
    }

    // 验证重复类型
    const validRepeatTypes = ['none', 'daily', 'weekly', 'monthly'];
    if (!validRepeatTypes.includes(repeatTypeValue)) {
      return res.json({ code: 400, message: '无效的重复类型' });
    }

    // 确保所有参数都不是undefined，用null替代
    // 如果没有coupleId，使用userId创建个人提醒
    const coupleId = req.coupleId ? Number(req.coupleId) : null;
    const userId = req.userId || null;
    
    if (!userId) {
      console.error('❌ userId为空！');
      return res.json({ code: 401, message: '用户未登录，请重新登录' });
    }
    
    // 使用正确的字段名: remind_at (数据库中的实际字段)
    // 转换为MySQL datetime格式: YYYY-MM-DD HH:MM:SS
    let remindAt: string;
    if (remindTimeValue) {
      const date = new Date(remindTimeValue);
      remindAt = date.toISOString().slice(0, 19).replace('T', ' ');
      
      // 验证提醒时间不能是过去时间（给予1分钟容差，避免时区和网络延迟问题）
      const now = new Date();
      const oneMinuteAgo = new Date(now.getTime() - 60 * 1000); // 1分钟前
      if (date < oneMinuteAgo) {
        console.log('⚠️ 提醒时间验证:', {
          传入时间: date.toISOString(),
          当前时间: now.toISOString(),
          一分钟前: oneMinuteAgo.toISOString(),
          是否过期: date < oneMinuteAgo
        });
        return res.json({ code: 400, message: '提醒时间不能早于当前时间' });
      }
    } else {
      const now = new Date();
      remindAt = now.toISOString().slice(0, 19).replace('T', ' ');
    }
    
    console.log('   转换后的时间:', remindAt);
    
    const [result] = await pool.execute(
      `INSERT INTO reminders 
       (couple_id, user_id, title, description, remind_at, repeat_type) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [coupleId, userId, title, description || null, remindAt, repeatTypeValue]
    ) as any[];

    console.log('✅ 创建成功，ID:', result.insertId);

    res.json({ 
      code: 200, 
      message: '创建成功', 
      data: { id: result.insertId } 
    });
  } catch (error: any) {
    console.error('❌ 创建提醒失败:', error.message);
    console.error('   coupleId:', req.coupleId, 'userId:', req.userId);
    console.error('   完整错误:', error);
    res.json({ code: 500, message: `创建失败: ${error.message}` });
  }
});

// 获取提醒详情
router.get('/detail/:id', authMiddleware, async (req: any, res) => {
  try {
    const { id } = req.params;

    const [reminders] = await pool.execute(
      'SELECT * FROM reminders WHERE id = ? AND couple_id = ?',
      [id, Number(req.coupleId)]
    ) as any[];

    if (reminders.length === 0) {
      return res.json({ code: 404, message: '提醒不存在' });
    }

    res.json({ code: 200, data: reminders[0] });
  } catch (error) {
    console.error('获取详情失败:', error);
    res.json({ code: 500, message: '获取失败' });
  }
});

// 更新提醒
router.put('/update/:id', authMiddleware, async (req: any, res) => {
  try {
    const { id } = req.params;
    const { title, description, remind_time, is_completed, remind_type, repeat_interval } = req.body;

    const [reminders] = await pool.execute(
      'SELECT id FROM reminders WHERE id = ? AND couple_id = ?',
      [id, Number(req.coupleId)]
    ) as any[];

    if (reminders.length === 0) {
      return res.json({ code: 404, message: '提醒不存在' });
    }

    // 构建更新语句
    const updates: string[] = [];
    const values: any[] = [];

    if (title !== undefined) {
      updates.push('title = ?');
      values.push(title);
    }
    if (description !== undefined) {
      updates.push('description = ?');
      values.push(description);
    }
    if (remind_time !== undefined) {
      updates.push('remind_time = ?');
      values.push(remind_time);
    }
    if (is_completed !== undefined) {
      updates.push('is_completed = ?');
      values.push(is_completed);
    }
    if (remind_type !== undefined) {
      updates.push('remind_type = ?');
      values.push(remind_type);
    }
    if (repeat_interval !== undefined) {
      updates.push('repeat_interval = ?');
      values.push(repeat_interval);
    }

    if (updates.length === 0) {
      return res.json({ code: 400, message: '没有要更新的字段' });
    }

    values.push(id);

    await pool.execute(
      `UPDATE reminders SET ${updates.join(', ')}, updated_at = NOW() WHERE id = ?`,
      values
    );

    res.json({ code: 200, message: '更新成功' });
  } catch (error) {
    console.error('更新提醒失败:', error);
    res.json({ code: 500, message: '更新失败' });
  }
});

// 标记完成/未完成
router.put('/toggle/:id', authMiddleware, async (req: any, res) => {
  try {
    const { id } = req.params;

    const [reminders] = await pool.execute(
      'SELECT is_completed FROM reminders WHERE id = ? AND couple_id = ?',
      [id, Number(req.coupleId)]
    ) as any[];

    if (reminders.length === 0) {
      return res.json({ code: 404, message: '提醒不存在' });
    }

    const newStatus = !reminders[0].is_completed;

    await pool.execute(
      'UPDATE reminders SET is_completed = ?, updated_at = NOW() WHERE id = ?',
      [newStatus, id]
    );

    res.json({ 
      code: 200, 
      message: newStatus ? '已标记为完成' : '已标记为未完成',
      data: { is_completed: newStatus }
    });
  } catch (error) {
    console.error('更新状态失败', error);
    res.json({ code: 500, message: '更新失败' });
  }
});

// 删除提醒
router.delete('/delete/:id', authMiddleware, async (req: any, res) => {
  try {
    const { id } = req.params;

    const [reminders] = await pool.execute(
      'SELECT id FROM reminders WHERE id = ? AND couple_id = ?',
      [id, Number(req.coupleId)]
    ) as any[];

    if (reminders.length === 0) {
      return res.json({ code: 404, message: '提醒不存在' });
    }

    await pool.execute('DELETE FROM reminders WHERE id = ?', [id]);

    res.json({ code: 200, message: '删除成功' });
  } catch (error) {
    console.error('删除提醒失败:', error);
    res.json({ code: 500, message: '删除失败' });
  }
});

// 批量删除已完成的提醒
router.delete('/clear-completed', authMiddleware, async (req: any, res) => {
  try {
    const [result] = await pool.execute(
      'DELETE FROM reminders WHERE couple_id = ? AND is_completed = 1',
      [Number(req.coupleId)]
    ) as any[];

    res.json({ 
      code: 200, 
      message: '清除成功',
      data: { deleted_count: result.affectedRows }
    });
  } catch (error) {
    console.error('清除失败:', error);
    res.json({ code: 500, message: '清除失败' });
  }
});

// 获取即将到来的提醒
router.get('/upcoming', authMiddleware, async (req: any, res) => {
  try {
    const { days = 7 } = req.query;

    const [reminders] = await pool.execute(
      `SELECT * FROM reminders 
       WHERE couple_id = ? 
       AND is_completed = 0
       AND remind_time BETWEEN NOW() AND DATE_ADD(NOW(), INTERVAL ? DAY)
       ORDER BY remind_time ASC`,
      [Number(req.coupleId), Number(days)]
    ) as any[];

    res.json({ code: 200, data: reminders });
  } catch (error) {
    console.error('获取即将到来的提醒失败', error);
    res.json({ code: 500, message: '获取失败' });
  }
});

// 获取逾期提醒
router.get('/overdue', authMiddleware, async (req: any, res) => {
  try {
    const [reminders] = await pool.execute(
      `SELECT * FROM reminders 
       WHERE couple_id = ? 
       AND is_completed = 0
       AND remind_time < NOW()
       ORDER BY remind_time DESC`,
      [Number(req.coupleId)]
    ) as any[];

    res.json({ code: 200, data: reminders });
  } catch (error) {
    console.error('获取逾期提醒失败:', error);
    res.json({ code: 500, message: '获取失败' });
  }
});

// 获取统计信息
router.get('/stats', authMiddleware, async (req: any, res) => {
  try {
    // 总数
    const [total] = await pool.execute(
      'SELECT COUNT(*) as count FROM reminders WHERE couple_id = ?',
      [Number(req.coupleId)]
    ) as any[];

    // 已完成
    const [completed] = await pool.execute(
      'SELECT COUNT(*) as count FROM reminders WHERE couple_id = ? AND is_completed = 1',
      [Number(req.coupleId)]
    ) as any[];

    // 待完成
    const [pending] = await pool.execute(
      'SELECT COUNT(*) as count FROM reminders WHERE couple_id = ? AND is_completed = 0',
      [Number(req.coupleId)]
    ) as any[];

    // 逾期
    const [overdue] = await pool.execute(
      `SELECT COUNT(*) as count FROM reminders 
       WHERE couple_id = ? 
       AND is_completed = 0 
       AND remind_at < NOW()`,
      [Number(req.coupleId)]
    ) as any[];

    res.json({
      code: 200,
      data: {
        total: total[0].count,
        completed: completed[0].count,
        pending: pending[0].count,
        overdue: overdue[0].count,
        completion_rate: total[0].count > 0 
          ? Math.round((completed[0].count / total[0].count) * 100)
          : 0
      }
    });
  } catch (error) {
    console.error('获取统计失败:', error);
    res.json({ code: 500, message: '获取失败' });
  }
});

export default router;
