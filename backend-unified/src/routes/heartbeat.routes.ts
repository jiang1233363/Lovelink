import express from 'express';
import { authMiddleware } from '../middleware/auth';
import { pool } from '../config/database';
import { tasks365 } from '../data/heartbeat-tasks-365';

const router = express.Router();

// 获取统计数据
router.get('/stats', authMiddleware, async (req: any, res) => {
  try {
    console.log('📊 获取365心动统计 - coupleId:', req.coupleId);
    // 总打卡天数
    const [stats] = await pool.execute(
      `SELECT 
        COUNT(*) as total_check_days,
        SUM(task_reward) as total_reward
      FROM heartbeat_checkins
      WHERE couple_id = ?`,
      [Number(req.coupleId)]
    ) as any[];
    
    // 计算连续打卡天数
    const [allCheckins] = await pool.execute(
      `SELECT check_date FROM heartbeat_checkins
       WHERE couple_id = ?
       ORDER BY check_date DESC`,
      [Number(req.coupleId)]
    ) as any[];

    let consecutive_days = 0;
    let currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);

    for (const checkin of allCheckins) {
      const checkinDate = new Date(checkin.check_date);
      checkinDate.setHours(0, 0, 0, 0);
      
      const diffDays = Math.floor((currentDate.getTime() - checkinDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (diffDays === consecutive_days) {
        consecutive_days++;
        currentDate.setDate(currentDate.getDate() - 1);
      } else {
        break;
      }
    }

    // 本月打卡天数
    const [thisMonth] = await pool.execute(
      `SELECT COUNT(*) as count FROM heartbeat_checkins
       WHERE couple_id = ?
       AND YEAR(check_date) = YEAR(NOW())
       AND MONTH(check_date) = MONTH(NOW())`,
      [Number(req.coupleId)]
    ) as any[];

    // 最高连续天数（简化版）
    const max_streak = consecutive_days; // 简化：使用当前连续天数
    
    console.log('✅ 统计数据获取成功');
    res.json({
      code: 200,
      data: {
        total_check_days: stats[0]?.total_check_days || 0,
        total_days: stats[0]?.total_check_days || 0, // 前端兼容字段
        total_reward: stats[0]?.total_reward || 0,
        consecutive_days: consecutive_days,
        continuous_days: consecutive_days, // 前端兼容字段
        this_month_days: thisMonth[0].count,
        max_streak: max_streak,
        completion_rate: 100, // 简化计算
        total_tasks: stats[0]?.total_check_days || 0 // 简化：使用打卡天数
      }
    });
  } catch (error: any) {
    console.error('❌ 获取统计数据失败:', error.message);
    console.error('   coupleId:', req.coupleId);
    res.json({ code: 500, message: `获取统计数据失败: ${error.message}` });
  }
});

// 获取今日任务
router.get('/today', authMiddleware, async (req: any, res) => {
  try {
    console.log('📅 获取今日任务 - coupleId:', req.coupleId);
    
    if (!req.coupleId) {
      console.log('❌ coupleId为空');
      return res.json({ code: 200, data: null, message: '暂无任务' });
    }
    
    const today = new Date().toISOString().split('T')[0];
    
    // 检查是否有今天的任务
    let [tasks] = await pool.execute(
      `SELECT * FROM heartbeat_tasks 
       WHERE task_date = ?
       LIMIT 1`,
      [today]
    ) as any[];
    
    // 如果有任务，检查是否已打卡
    if (tasks.length > 0) {
      const [checkins] = await pool.execute(
        'SELECT id FROM heartbeat_checkins WHERE check_date = ? AND couple_id = ?',
        [today, Number(req.coupleId)]
      ) as any[];
      tasks[0].is_checked_in = checkins.length > 0 ? 1 : 0;
      tasks[0].is_completed = checkins.length > 0 ? 1 : 0; // 前端兼容字段
      tasks[0].title = tasks[0].task_content; // 前端兼容字段
      tasks[0].description = '每日心动任务'; // 前端兼容字段
    }
    
    // 如果没有今天的任务，从365天计划中生成
    if (tasks.length === 0) {
      // 获取当前情侣的总打卡天数，决定今天是第几天
      const [checkinStats] = await pool.execute(
        'SELECT COUNT(*) as total_days FROM heartbeat_checkins WHERE couple_id = ?',
        [Number(req.coupleId)]
      ) as any[];
      
      const currentDay = (checkinStats[0]?.total_days || 0) + 1; // 下一天
      const taskIndex = (currentDay - 1) % 365; // 循环使用365天任务
      const todayTaskData = tasks365[taskIndex];

      const [result] = await pool.execute(
        'INSERT INTO heartbeat_tasks (task_date, task_content, task_reward) VALUES (?, ?, ?)',
        [today, todayTaskData.content, todayTaskData.reward]
      ) as any[];

      [tasks] = await pool.execute(
        `SELECT t.*, 0 as is_checked_in
         FROM heartbeat_tasks t
         WHERE t.id = ?`,
        [result.insertId]
      ) as any[];
      
      // 添加前端兼容字段
      if (tasks.length > 0) {
        tasks[0].is_completed = 0;
        tasks[0].title = tasks[0].task_content;
        tasks[0].description = '每日心动任务';
      }
    }
    
    res.json({
      code: 200,
      data: tasks[0] || null
    });
  } catch (error: any) {
    console.error('❌ 获取今日任务失败:', error.message);
    console.error('   coupleId:', req.coupleId);
    res.json({ code: 500, message: `获取今日任务失败: ${error.message}` });
  }
});

// 打卡
router.post('/checkin', authMiddleware, async (req: any, res) => {
  console.log('\n🚀 ========== 打卡 API 调用 ==========');
  console.log('📥 req.body:', JSON.stringify(req.body));
  console.log('📥 req.userId:', req.userId);
  console.log('📥 req.coupleId:', req.coupleId);
  
  try {
    const { task_id } = req.body;
    console.log('📦 task_id:', task_id, '类型:', typeof task_id, 'undefined?', task_id === undefined);
    console.log('✅ 打卡 - coupleId:', req.coupleId, 'taskId:', task_id);
    const today = new Date().toISOString().split('T')[0];
    
    if (!task_id) {
      return res.json({ code: 400, message: '任务ID不能为空' });
    }

    // 检查是否已打卡
    const [existing] = await pool.execute(
      'SELECT id FROM heartbeat_checkins WHERE couple_id = ? AND check_date = ?',
      [Number(req.coupleId), today]
    ) as any[];
    
    if (existing.length > 0) {
      return res.json({ code: 400, message: '今日已打卡' });
    }
    
    // 获取任务信息
    const [tasks] = await pool.execute(
      'SELECT task_reward, task_content FROM heartbeat_tasks WHERE id = ?',
      [task_id]
    ) as any[];
    
    if (tasks.length === 0) {
      return res.json({ code: 404, message: '任务不存在' });
    }
    
    // 获取当前总打卡天数（在插入前）
    const [statsBeforeInsert] = await pool.execute(
      'SELECT COUNT(*) as count FROM heartbeat_checkins WHERE couple_id = ?',
      [Number(req.coupleId)]
    ) as any[];
    
    const dayNumber = (statsBeforeInsert[0]?.count || 0) + 1; // 下一天的编号
    
    // 创建打卡记录
    const [result] = await pool.execute(
      `INSERT INTO heartbeat_checkins (couple_id, user_id, check_date, day_number, task_reward, task_content)
      VALUES (?, ?, ?, ?, ?, ?)`,
      [Number(req.coupleId), req.userId, today, dayNumber, tasks[0].task_reward, tasks[0].task_content]
    );

    // 获取当前总打卡天数（插入后）
    const [stats] = await pool.execute(
      'SELECT COUNT(*) as count FROM heartbeat_checkins WHERE couple_id = ?',
      [Number(req.coupleId)]
    ) as any[];
    
    res.json({
      code: 200,
      message: '打卡成功',
      data: { 
        reward: tasks[0].task_reward,
        total_days: stats[0].count
      }
    });
  } catch (error) {
    console.error('打卡失败:', error);
    res.json({ code: 500, message: '打卡失败' });
  }
});

// 获取打卡历史
router.get('/history', authMiddleware, async (req: any, res) => {
  try {
    const { page = 1, limit = 30 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    const [history] = await pool.execute(
      `SELECT c.*, 
        DATEDIFF(NOW(), c.check_date) + 1 as day,
        c.check_date as task_date,
        c.task_content as title,
        '已完成' as description,
        1 as is_completed,
        u.username
      FROM heartbeat_checkins c
      JOIN users u ON c.user_id = u.id
      WHERE c.couple_id = ?
      ORDER BY c.check_date DESC
      LIMIT ${Number(limit)} OFFSET ${Number(offset)}`,
      [Number(req.coupleId)]
    ) as any[];

    const [total] = await pool.execute(
      'SELECT COUNT(*) as count FROM heartbeat_checkins WHERE couple_id = ?',
      [Number(req.coupleId)]
    ) as any[];
    
    res.json({
      code: 200,
      data: {
        list: history,
        total: total[0].count,
        page: Number(page),
        pageSize: Number(limit)
      }
    });
  } catch (error) {
    console.error('获取打卡历史失败:', error);
    res.json({ code: 500, message: '获取打卡历史失败' });
  }
});

// 获取打卡日历（某月的所有打卡日期）
router.get('/calendar', authMiddleware, async (req: any, res) => {
  try {
    const { year, month } = req.query;
    const currentDate = new Date();
    const targetYear = year || currentDate.getFullYear();
    const targetMonth = month || (currentDate.getMonth() + 1);

    const [checkins] = await pool.execute(
      `SELECT check_date, task_content, task_reward 
       FROM heartbeat_checkins
       WHERE couple_id = ?
       AND YEAR(check_date) = ?
       AND MONTH(check_date) = ?
       ORDER BY check_date ASC`,
      [Number(req.coupleId), targetYear, targetMonth]
    ) as any[];

    res.json({
      code: 200,
      data: checkins
    });
  } catch (error) {
    console.error('获取日历失败:', error);
    res.json({ code: 500, message: '获取日历失败' });
  }
});

// 获取任务详情
router.get('/task/:id', authMiddleware, async (req: any, res) => {
  try {
    const { id } = req.params;

    const [tasks] = await pool.execute(
      'SELECT * FROM heartbeat_tasks WHERE id = ?',
      [id]
    ) as any[];

    if (tasks.length === 0) {
      return res.json({ code: 404, message: '任务不存在' });
    }

    // 获取打卡记录
    const [checkins] = await pool.execute(
      `SELECT c.*, u.username 
       FROM heartbeat_checkins c
       JOIN users u ON c.user_id = u.id
       WHERE c.task_id = ?`,
      [id]
    ) as any[];

    res.json({
      code: 200,
      data: {
        task: tasks[0],
        checkins
      }
    });
  } catch (error) {
    console.error('获取任务详情失败:', error);
    res.json({ code: 500, message: '获取详情失败' });
  }
});

// 创建自定义任务
router.post('/create-task', authMiddleware, async (req: any, res) => {
  try {
    const { task_content, task_reward = 10, task_date } = req.body;

    if (!task_content) {
      return res.json({ code: 400, message: '任务内容不能为空' });
    }

    const targetDate = task_date || new Date().toISOString().split('T')[0];

    // 检查当天是否已有任务
    const [existing] = await pool.execute(
      'SELECT id FROM heartbeat_tasks WHERE task_date = ?',
      [targetDate]
    ) as any[];

    if (existing.length > 0) {
      return res.json({ code: 400, message: '当天已有任务' });
    }

    const [result] = await pool.execute(
      'INSERT INTO heartbeat_tasks (task_date, task_content, task_reward) VALUES (?, ?, ?)',
      [targetDate, task_content, task_reward]
    ) as any[];

    res.json({
      code: 200,
      message: '创建成功',
      data: { id: result.insertId }
    });
  } catch (error) {
    console.error('创建任务失败:', error);
    res.json({ code: 500, message: '创建失败' });
  }
});

// 完成任务（前端兼容路由）
router.post('/complete/:id', authMiddleware, async (req: any, res) => {
  console.log('\n🚀 ========== 完成任务 API 调用 ==========');
  console.log('📥 task_id:', req.params.id);
  console.log('📥 req.userId:', req.userId);
  console.log('📥 req.coupleId:', req.coupleId);
  
  try {
    const task_id = req.params.id;
    const today = new Date().toISOString().split('T')[0];
    
    if (!task_id) {
      return res.json({ code: 400, message: '任务ID不能为空' });
    }

    // 检查是否已打卡
    const [existing] = await pool.execute(
      'SELECT id FROM heartbeat_checkins WHERE couple_id = ? AND check_date = ?',
      [Number(req.coupleId), today]
    ) as any[];
    
    if (existing.length > 0) {
      return res.json({ code: 400, message: '今日已打卡' });
    }
    
    // 获取任务信息
    const [tasks] = await pool.execute(
      'SELECT task_reward, task_content FROM heartbeat_tasks WHERE id = ?',
      [task_id]
    ) as any[];
    
    if (tasks.length === 0) {
      return res.json({ code: 404, message: '任务不存在' });
    }
    
    // 获取当前总打卡天数（在插入前）
    const [statsBeforeInsert] = await pool.execute(
      'SELECT COUNT(*) as count FROM heartbeat_checkins WHERE couple_id = ?',
      [Number(req.coupleId)]
    ) as any[];
    
    const dayNumber = (statsBeforeInsert[0]?.count || 0) + 1; // 下一天的编号
    
    // 创建打卡记录
    await pool.execute(
      `INSERT INTO heartbeat_checkins (couple_id, user_id, check_date, day_number, task_reward, task_content)
      VALUES (?, ?, ?, ?, ?, ?)`,
      [Number(req.coupleId), req.userId, today, dayNumber, tasks[0].task_reward, tasks[0].task_content]
    );

    // 获取当前总打卡天数（插入后）
    const [stats] = await pool.execute(
      'SELECT COUNT(*) as count FROM heartbeat_checkins WHERE couple_id = ?',
      [Number(req.coupleId)]
    ) as any[];
    
    console.log('✅ 完成任务成功');
    res.json({
      code: 200,
      message: '打卡成功',
      data: { 
        reward: tasks[0].task_reward,
        total_days: stats[0].count
      }
    });
  } catch (error: any) {
    console.error('❌ 完成任务失败:', error);
    console.error('   错误详情:', error.message);
    console.error('   错误堆栈:', error.stack);
    res.json({ code: 500, message: `完成任务失败: ${error.message}` });
  }
});

// 删除打卡记录（仅限今天的）
router.delete('/checkin/:id', authMiddleware, async (req: any, res) => {
  try {
    const { id } = req.params;
    const today = new Date().toISOString().split('T')[0];

    const [checkins] = await pool.execute(
      'SELECT id FROM heartbeat_checkins WHERE id = ? AND user_id = ? AND check_date = ?',
      [id, req.userId, today]
    ) as any[];

    if (checkins.length === 0) {
      return res.json({ code: 404, message: '打卡记录不存在或不可删除' });
    }

    await pool.execute('DELETE FROM heartbeat_checkins WHERE id = ?', [id]);

    res.json({ code: 200, message: '删除成功' });
  } catch (error) {
    console.error('删除打卡失败:', error);
    res.json({ code: 500, message: '删除失败' });
  }
});

// 获取365天任务列表
router.get('/tasks-365', authMiddleware, async (req: any, res) => {
  try {
    // 获取当前情侣的总打卡天数
    const [checkinStats] = await pool.execute(
      'SELECT COUNT(*) as total_days FROM heartbeat_checkins WHERE couple_id = ?',
      [Number(req.coupleId)]
    ) as any[];
    
    const completedDays = checkinStats[0]?.total_days || 0;
    
    // 返回365天任务列表，标记已完成的任务
    const tasksWithStatus = tasks365.map((task, index) => ({
      ...task,
      is_completed: index < completedDays,
      is_current: index === completedDays,
      is_locked: index > completedDays
    }));
    
    res.json({
      code: 200,
      data: {
        tasks: tasksWithStatus,
        completed_days: completedDays,
        current_day: completedDays + 1
      }
    });
  } catch (error) {
    console.error('获取365天任务列表失败:', error);
    res.json({ code: 500, message: '获取失败' });
  }
});

// 获取排行榜（本月打卡最多的情侣）
router.get('/leaderboard', authMiddleware, async (req: any, res) => {
  try {
    const [leaderboard] = await pool.execute(
      `SELECT 
        c.couple_id,
        COUNT(*) as checkin_count,
        SUM(c.task_reward) as total_reward
       FROM heartbeat_checkins c
       WHERE YEAR(c.check_date) = YEAR(NOW())
       AND MONTH(c.check_date) = MONTH(NOW())
       GROUP BY c.couple_id
       ORDER BY checkin_count DESC
       LIMIT 10`
    ) as any[];

    res.json({
      code: 200,
      data: leaderboard
    });
  } catch (error) {
    console.error('获取排行榜失败', error);
    res.json({ code: 500, message: '获取失败' });
  }
});

export default router;
