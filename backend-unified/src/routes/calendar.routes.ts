import express from 'express';
import { authMiddleware } from '../middleware/auth';
import { pool } from '../config/database';

const router = express.Router();

// 获取日程列表
router.get('/list', authMiddleware, async (req: any, res) => {
  try {
    console.log('📋 获取日历列表 - coupleId:', req.coupleId);
    const { start_date, end_date, page = 1, limit = 100 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    let whereClause = 'ce.couple_id = ?';
    let params: any[] = [Number(req.coupleId)];

    if (start_date) {
      whereClause += ' AND ce.event_date >= ?';
      params.push(start_date);
    }

    if (end_date) {
      whereClause += ' AND ce.event_date <= ?';
      params.push(end_date);
    }

    console.log('   查询参数:', params, 'LIMIT:', Number(limit), 'OFFSET:', Number(offset));

    const [events] = await pool.execute(
      `SELECT ce.*, u.username as creator_name 
       FROM calendar_events ce 
       LEFT JOIN users u ON ce.user_id = u.id 
       WHERE ${whereClause}
       ORDER BY ce.event_date, ce.event_time 
       LIMIT ${Number(limit)} OFFSET ${Number(offset)}`,
      params
    ) as any[];

    console.log('✅ 查询到', events.length, '个日历事件');
    res.json({ code: 200, data: events });
  } catch (error: any) {
    console.error('❌ 获取日程列表失败:', error.message);
    res.json({ code: 500, message: `获取失败: ${error.message}` });
  }
});

// 获取日程详情
router.get('/detail/:id', authMiddleware, async (req: any, res) => {
  try {
    const { id } = req.params;
    
    const [events] = await pool.execute(
      `SELECT ce.*, u.username as creator_name 
       FROM calendar_events ce 
       LEFT JOIN users u ON ce.user_id = u.id 
       WHERE ce.id = ? AND ce.couple_id = ?`,
      [id, Number(req.coupleId)]
    ) as any[];

    if (events.length === 0) {
      return res.json({ code: 404, message: '日程不存在' });
    }

    res.json({ code: 200, data: events[0] });
  } catch (error) {
    console.error('获取日程详情失败:', error);
    res.json({ code: 500, message: '获取失败' });
  }
});

// 创建日程
router.post('/create', authMiddleware, async (req: any, res) => {
  try {
    console.log('📅 创建日历事件 - userId:', req.userId, 'coupleId:', req.coupleId);
    const { title, description, event_date, event_time, location, reminder_time, is_completed = 0, event_type } = req.body;
    console.log('   参数:', { title, event_date, event_time, event_type });

    if (!title || !event_date) {
      return res.json({ code: 400, message: '标题和日期不能为空' });
    }

    const coupleId = req.coupleId || null;
    const insertData = [
      coupleId, 
      req.userId, 
      title, 
      description || null, 
      event_date, 
      event_time || null, 
      location || null, 
      reminder_time || null, 
      is_completed
    ];
    console.log('   插入数据:', insertData);

    const [result] = await pool.execute(
      `INSERT INTO calendar_events (couple_id, user_id, title, description, event_date, event_time, location, reminder_time, is_completed) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      insertData
    ) as any[];

    console.log('✅ 日历事件创建成功，ID:', result.insertId);
    res.json({ 
      code: 200, 
      message: '创建成功', 
      data: { id: result.insertId } 
    });
  } catch (error: any) {
    console.error('❌ 创建日程失败:', error.message);
    console.error('   堆栈:', error.stack);
    res.json({ code: 500, message: `创建失败: ${error.message}` });
  }
});

// 更新日程
router.put('/update/:id', authMiddleware, async (req: any, res) => {
  try {
    const { id } = req.params;
    const { title, description, event_date, event_time, location, reminder_time, is_completed } = req.body;

    const [events] = await pool.execute(
      'SELECT id FROM calendar_events WHERE id = ? AND couple_id = ?',
      [id, Number(req.coupleId)]
    ) as any[];

    if (events.length === 0) {
      return res.json({ code: 404, message: '日程不存在' });
    }

    // 动态构建更新语句，只更新提供的字段
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
    if (event_date !== undefined) {
      updates.push('event_date = ?');
      values.push(event_date);
    }
    if (event_time !== undefined) {
      updates.push('event_time = ?');
      values.push(event_time);
    }
    if (location !== undefined) {
      updates.push('location = ?');
      values.push(location);
    }
    if (reminder_time !== undefined) {
      updates.push('reminder_time = ?');
      values.push(reminder_time);
    }
    if (is_completed !== undefined) {
      updates.push('is_completed = ?');
      values.push(is_completed);
    }

    if (updates.length === 0) {
      return res.json({ code: 400, message: '没有要更新的字段' });
    }

    updates.push('updated_at = NOW()');
    values.push(id);

    await pool.execute(
      `UPDATE calendar_events SET ${updates.join(', ')} WHERE id = ?`,
      values
    );

    res.json({ code: 200, message: '更新成功' });
  } catch (error) {
    console.error('更新日程失败:', error);
    res.json({ code: 500, message: '更新失败' });
  }
});

// 删除日程
router.delete('/delete/:id', authMiddleware, async (req: any, res) => {
  try {
    const { id } = req.params;

    const [events] = await pool.execute(
      'SELECT id FROM calendar_events WHERE id = ? AND couple_id = ?',
      [id, Number(req.coupleId)]
    ) as any[];

    if (events.length === 0) {
      return res.json({ code: 404, message: '日程不存在' });
    }

    await pool.execute('DELETE FROM calendar_events WHERE id = ?', [id]);

    res.json({ code: 200, message: '删除成功' });
  } catch (error) {
    console.error('删除日程失败:', error);
    res.json({ code: 500, message: '删除失败' });
  }
});

// 标记完成
router.put('/complete/:id', authMiddleware, async (req: any, res) => {
  try {
    const { id } = req.params;

    const [events] = await pool.execute(
      'SELECT id FROM calendar_events WHERE id = ? AND couple_id = ?',
      [id, Number(req.coupleId)]
    ) as any[];

    if (events.length === 0) {
      return res.json({ code: 404, message: '日程不存在' });
    }

    await pool.execute(
      'UPDATE calendar_events SET is_completed = 1 WHERE id = ?',
      [id]
    );

    res.json({ code: 200, message: '已标记完成' });
  } catch (error) {
    console.error('标记完成失败:', error);
    res.json({ code: 500, message: '操作失败' });
  }
});

export default router;
