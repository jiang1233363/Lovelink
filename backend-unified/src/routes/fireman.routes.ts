import express from 'express';
import { authMiddleware } from '../middleware/auth';
import { pool } from '../config/database';

const router = express.Router();

// 获取消防员状态
router.get('/status', authMiddleware, async (req: any, res) => {
  try {
    console.log('🚒 获取消防员状态 - coupleId:', req.coupleId);
    
    if (!req.coupleId) {
      console.log('❌ coupleId为空，返回默认状态');
      return res.json({ 
        code: 200, 
        data: {
          fireLevel: 0,
          currentTask: null,
          history: [],
          totalResolved: 0,
          avgResolveTime: 0
        }
      });
    }
    
    // 获取所有任务（不按状态筛选）
    const [allTasks] = await pool.execute(
      `SELECT * FROM fireman_tasks 
       WHERE couple_id = ? 
       ORDER BY created_at DESC`,
      [Number(req.coupleId)]
    ) as any[];

    let fireLevel = 0;
    let currentTask = null;
    const history: any[] = [];
    
    // 手动筛选active和resolved任务
    for (const task of allTasks) {
      const hasResolvedAt = task.resolved_at != null;
      if (!hasResolvedAt && !currentTask) {
        // 第一个未解决的任务
        currentTask = task;
        const hoursSinceReport = Math.floor(
          (Date.now() - new Date(task.created_at).getTime()) / (1000 * 60 * 60)
        );
        fireLevel = Math.min(3, Math.floor(hoursSinceReport / 2) + 1);
      } else if (hasResolvedAt && history.length < 10) {
        // 已解决的任务
        history.push(task);
      }
    }

    // 格式化历史记录
    const formattedHistory = history.map((task: any) => {
      const createdAt = new Date(task.created_at);
      const resolvedAt = new Date(task.resolved_at);
      const duration = Math.round((resolvedAt.getTime() - createdAt.getTime()) / (1000 * 60 * 60));
      
      return {
        date: createdAt.toISOString().split('T')[0],
        action: task.description || '矛盾已解决',
        duration: Math.max(1, duration)
      };
    });

    console.log('✅ 消防员状态获取成功');
    res.json({ 
      code: 200, 
      data: { 
        fire_level: fireLevel,
        current_task: currentTask,
        history: formattedHistory,
        total_resolved: history.length
      }
    });
  } catch (error: any) {
    console.error('❌ 获取状态失败:', error.message);
    console.error('   coupleId:', req.coupleId);
    res.json({ code: 500, message: `获取失败: ${error.message}` });
  }
});

// 报告矛盾/争吵
router.post('/report', authMiddleware, async (req: any, res) => {
  try {
    const { description, severity = 'medium' } = req.body;

    // 检查是否有未解决的矛盾（没有resolved_at的）
    const [activeTask] = await pool.execute(
      'SELECT id FROM fireman_tasks WHERE couple_id = ? AND resolved_at IS NULL',
      [Number(req.coupleId)]
    ) as any[];

    if (activeTask.length > 0) {
      return res.json({ code: 400, message: '已有未解决的矛盾，请先和好' });
    }

    // 创建新的矛盾记录
    const [result] = await pool.execute(
      `INSERT INTO fireman_tasks 
       (couple_id, reporter_id, description, severity) 
       VALUES (?, ?, ?, ?)`,
      [Number(req.coupleId), req.userId, description || '出现矛盾', severity]
    ) as any[];

    res.json({ 
      code: 200, 
      message: '已记录，快去沟通吧',
      data: { task_id: result.insertId }
    });
  } catch (error) {
    console.error('报告失败:', error);
    res.json({ code: 500, message: '操作失败' });
  }
});

// 和好灭火
router.post('/extinguish', authMiddleware, async (req: any, res) => {
  try {
    const { solution } = req.body;

    // 获取活跃的矛盾（没有resolved_at的）
    const [activeTask] = await pool.execute(
      'SELECT * FROM fireman_tasks WHERE couple_id = ? AND resolved_at IS NULL',
      [Number(req.coupleId)]
    ) as any[];

    if (activeTask.length === 0) {
      return res.json({ code: 400, message: '当前没有未解决的矛盾' });
    }

    const task = activeTask[0];

    // 更新状态为已解决
    await pool.execute(
      `UPDATE fireman_tasks 
       SET resolver_id = ?,
           solution = ?,
           resolved_at = NOW()
       WHERE id = ?`,
      [req.userId, solution || '已和好', task.id]
    );

    // 计算持续时长
    const duration = Math.round(
      (Date.now() - new Date(task.created_at).getTime()) / (1000 * 60 * 60)
    );

    res.json({ 
      code: 200, 
      message: '太好了！继续保持',
      data: { 
        duration_hours: Math.max(1, duration),
        task_id: task.id
      }
    });
  } catch (error) {
    console.error('操作失败:', error);
    res.json({ code: 500, message: '操作失败' });
  }
});

// 获取统计数据
router.get('/stats', authMiddleware, async (req: any, res) => {
  try {
    // 总共完成的任务数（两人都完成）
    const [completed] = await pool.execute(
      'SELECT COUNT(*) as count FROM fireman_tasks WHERE couple_id = ? AND user1_completed = 1 AND user2_completed = 1',
      [Number(req.coupleId)]
    ) as any[];

    // 本月任务数
    const [thisMonth] = await pool.execute(
      `SELECT COUNT(*) as count 
       FROM fireman_tasks 
       WHERE couple_id = ? 
       AND YEAR(task_date) = YEAR(NOW())
       AND MONTH(task_date) = MONTH(NOW())`,
      [Number(req.coupleId)]
    ) as any[];

    // 总任务数
    const [total] = await pool.execute(
      'SELECT COUNT(*) as count FROM fireman_tasks WHERE couple_id = ?',
      [Number(req.coupleId)]
    ) as any[];

    // 完成率
    const completionRate = total[0].count > 0 
      ? Math.round((completed[0].count / total[0].count) * 100) 
      : 0;

    res.json({
      code: 200,
      data: {
        total_tasks: total[0].count,
        total_completed: completed[0].count,
        this_month_count: thisMonth[0].count,
        completion_rate: completionRate,
        peace_days: 0 // 可以根据最后一次任务完成时间计算
      }
    });
  } catch (error) {
    console.error('获取统计失败:', error);
    res.json({ code: 500, message: '获取失败' });
  }
});

// 获取矛盾详情
router.get('/detail/:id', authMiddleware, async (req: any, res) => {
  try {
    const { id } = req.params;

    const [tasks] = await pool.execute(
      'SELECT * FROM fireman_tasks WHERE id = ? AND couple_id = ?',
      [id, Number(req.coupleId)]
    ) as any[];

    if (tasks.length === 0) {
      return res.json({ code: 404, message: '记录不存在' });
    }

    res.json({ code: 200, data: tasks[0] });
  } catch (error) {
    console.error('获取详情失败:', error);
    res.json({ code: 500, message: '获取失败' });
  }
});

// 添加争吵记录
router.post('/record', authMiddleware, async (req: any, res) => {
  try {
    const { date, reason, solution } = req.body;

    if (!req.coupleId) {
      return res.json({ code: 400, message: '未找到情侣关系' });
    }

    const [result] = await pool.execute(
      `INSERT INTO fireman_tasks 
       (couple_id, reporter_id, description, solution) 
       VALUES (?, ?, ?, ?)`,
      [Number(req.coupleId), req.userId, reason, solution || null]
    ) as any[];

    res.json({ 
      code: 200, 
      message: '记录成功',
      data: { id: result.insertId }
    });
  } catch (error: any) {
    console.error('记录失败:', error);
    res.json({ code: 500, message: `操作失败: ${error.message}` });
  }
});

// 发送道歉
router.post('/apology', authMiddleware, async (req: any, res) => {
  try {
    console.log('🙏 发送道歉 - userId:', req.userId, 'coupleId:', req.coupleId, 'type:', typeof req.coupleId);
    
    // 获取对方的ID
    const [couple] = await pool.execute(
      'SELECT user1_id, user2_id FROM couples WHERE id = ?',
      [Number(req.coupleId)]
    ) as any[];
    
    console.log('   查询结果:', couple);
    
    if (couple.length === 0) {
      return res.json({ code: 400, message: '未找到情侣关系' });
    }
    
    const receiverId = couple[0].user1_id === req.userId ? couple[0].user2_id : couple[0].user1_id;
    
    // 保存通知记录
    await pool.execute(
      `INSERT INTO fireman_notifications 
       (couple_id, sender_id, receiver_id, type, message) 
       VALUES (?, ?, ?, 'apology', '发送了一个道歉 🙏')`,
      [Number(req.coupleId), req.userId, receiverId]
    );
    
    res.json({ 
      code: 200, 
      message: '道歉已发送'
    });
  } catch (error) {
    console.error('发送道歉失败:', error);
    res.json({ code: 500, message: '发送失败' });
  }
});

// 发送拥抱
router.post('/hug', authMiddleware, async (req: any, res) => {
  try {
    // 获取对方的ID
    const [couple] = await pool.execute(
      'SELECT user1_id, user2_id FROM couples WHERE id = ?',
      [Number(req.coupleId)]
    ) as any[];
    
    if (couple.length === 0) {
      return res.json({ code: 400, message: '未找到情侣关系' });
    }
    
    const receiverId = couple[0].user1_id === req.userId ? couple[0].user2_id : couple[0].user1_id;
    
    // 保存通知记录
    await pool.execute(
      `INSERT INTO fireman_notifications 
       (couple_id, sender_id, receiver_id, type, message) 
       VALUES (?, ?, ?, 'hug', '发送了一个虚拟拥抱 🤗')`,
      [Number(req.coupleId), req.userId, receiverId]
    );
    
    res.json({ 
      code: 200, 
      message: '拥抱已发送'
    });
  } catch (error) {
    console.error('发送拥抱失败:', error);
    res.json({ code: 500, message: '发送失败' });
  }
});

// 标记和解
router.post('/:id/resolve', authMiddleware, async (req: any, res) => {
  try {
    const { id } = req.params;

    await pool.execute(
      `UPDATE fireman_tasks 
       SET resolver_id = ?, resolved_at = NOW()
       WHERE id = ? AND couple_id = ?`,
      [req.userId, id, Number(req.coupleId)]
    );

    res.json({ 
      code: 200, 
      message: '标记成功'
    });
  } catch (error) {
    console.error('标记失败:', error);
    res.json({ code: 500, message: '操作失败' });
  }
});

// 删除记录
router.delete('/:id', authMiddleware, async (req: any, res) => {
  try {
    const { id } = req.params;

    await pool.execute(
      'DELETE FROM fireman_tasks WHERE id = ? AND couple_id = ?',
      [id, Number(req.coupleId)]
    );

    res.json({ 
      code: 200, 
      message: '删除成功'
    });
  } catch (error) {
    console.error('删除失败:', error);
    res.json({ code: 500, message: '删除失败' });
  }
});

// 获取通知列表
router.get('/notifications', authMiddleware, async (req: any, res) => {
  try {
    console.log('🔔 获取通知列表 - userId:', req.userId);
    const [notifications] = await pool.execute(
      `SELECT n.*, u.username as sender_name 
       FROM fireman_notifications n
       JOIN users u ON n.sender_id = u.id
       WHERE n.receiver_id = ?
       ORDER BY n.created_at DESC
       LIMIT 20`,
      [req.userId]
    ) as any[];
    
    res.json({
      code: 200,
      data: notifications || []
    });
  } catch (error) {
    console.error('获取通知失败:', error);
    res.json({ code: 500, message: '获取失败' });
  }
});

// 标记通知为已读
router.post('/notifications/:id/read', authMiddleware, async (req: any, res) => {
  try {
    const { id } = req.params;
    
    await pool.execute(
      'UPDATE fireman_notifications SET is_read = 1 WHERE id = ? AND receiver_id = ?',
      [id, req.userId]
    );
    
    res.json({
      code: 200,
      message: '已标记'
    });
  } catch (error) {
    console.error('标记失败:', error);
    res.json({ code: 500, message: '操作失败' });
  }
});

// 获取完整历史记录（分页）
router.get('/history', authMiddleware, async (req: any, res) => {
  try {
    const { page = 1, limit = 20, status = 'all' } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    let whereClause = 'couple_id = ?';
    const params: any[] = [Number(req.coupleId)];

    if (status === 'resolved') {
      whereClause += ' AND resolved_at IS NOT NULL';
    } else if (status === 'active') {
      whereClause += ' AND resolved_at IS NULL';
    }
    // 'all' 不添加条件

    const [tasks] = await pool.execute(
      `SELECT * FROM fireman_tasks 
       WHERE ${whereClause}
       ORDER BY created_at DESC 
       LIMIT ${Number(limit)} OFFSET ${Number(offset)}`,
      params
    ) as any[];

    const [total] = await pool.execute(
      `SELECT COUNT(*) as count FROM fireman_tasks WHERE ${whereClause}`,
      params
    ) as any[];

    // 格式化数据，添加前端需要的字段
    const formattedTasks = tasks.map((task: any) => ({
      ...task,
      date: task.created_at, // 添加 date 字段供前端使用
      reason: task.description, // 添加 reason 字段供前端使用
      resolved: task.resolved_at != null // 添加 resolved 布尔值
    }));

    res.json({
      code: 200,
      data: formattedTasks || []
    });
  } catch (error) {
    console.error('获取历史失败:', error);
    res.json({ code: 500, message: '获取失败' });
  }
});

export default router;
