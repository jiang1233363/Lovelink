import express from 'express';
import { authMiddleware } from '../middleware/auth';
import { pool } from '../config/database';

const router = express.Router();

// 保存今日心情
router.post('/save', authMiddleware, async (req: any, res) => {
  console.log('\n🚀 ========== 保存心情 API 调用 ==========');
  console.log('📥 req.body:', JSON.stringify(req.body));
  console.log('📥 req.userId:', req.userId);
  
  try {
    const { mood, note, mood_date } = req.body;
    
    console.log('📦 解构后的参数:');
    console.log('   - mood:', mood, '类型:', typeof mood, 'undefined?', mood === undefined);
    console.log('   - note:', note, '类型:', typeof note, 'undefined?', note === undefined);
    console.log('   - mood_date:', mood_date, '类型:', typeof mood_date, 'undefined?', mood_date === undefined);
    
    if (!mood) {
      console.log('❌ 心情类型为空');
      return res.json({ code: 400, message: '心情类型不能为空' });
    }

    const validMoods = ['happy', 'sad', 'angry', 'excited', 'calm', 'worried', 'loved'];
    if (!validMoods.includes(mood)) {
      console.log('❌ 无效的心情类型:', mood);
      return res.json({ code: 400, message: '无效的心情类型' });
    }

    // 处理日期参数：如果没有传日期，使用今天
    let date: string;
    
    if (!mood_date || (typeof mood_date === 'string' && mood_date.trim() === '')) {
      // 没有传日期，使用今天的日期
      date = new Date().toISOString().split('T')[0];
      console.log('📅 未传日期，使用今天:', date);
    } else {
      date = String(mood_date);
      console.log('📅 使用传入日期:', date);
      
      // 验证日期格式
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        console.log('❌ 日期格式无效:', date);
        return res.json({ code: 400, message: '日期格式无效，应为YYYY-MM-DD' });
      }
    }

    // 检查今天是否已记录
    console.log('🔍 检查是否存在记录...');
    const [existing] = await pool.execute(
      'SELECT id FROM mood_records WHERE user_id = ? AND date = ?',
      [req.userId, date]
    ) as any[];
    console.log('   查询结果:', existing.length, '条');

    if (existing.length > 0) {
      // 更新
      console.log('🔄 更新现有记录:', existing[0].id);
      const updateParams = [mood, note || null, existing[0].id];
      console.log('   更新参数:', updateParams);
      
      await pool.execute(
        'UPDATE mood_records SET mood_type = ?, note = ? WHERE id = ?',
        updateParams
      );
      console.log('✅ 更新成功');
      console.log('========================================\n');
      res.json({ code: 200, message: '更新成功', data: { id: existing[0].id } });
    } else {
      // 插入
      console.log('➕ 插入新记录');
      const insertParams = [req.userId, mood, note || null, date];
      console.log('   插入参数:', insertParams);
      
      // 需要添加couple_id
      const coupleId = req.coupleId || null;
      const insertParamsWithCouple = [coupleId, req.userId, mood, note || null, date];
      console.log('   插入参数（含couple_id）:', insertParamsWithCouple);
      
      const [result] = await pool.execute(
        'INSERT INTO mood_records (couple_id, user_id, mood_type, note, date) VALUES (?, ?, ?, ?, ?)',
        insertParamsWithCouple
      ) as any[];
      console.log('✅ 保存成功，ID:', result.insertId);
      console.log('========================================\n');
      res.json({ code: 200, message: '保存成功', data: { id: result.insertId } });
    }
  } catch (error: any) {
    console.error('❌❌❌ 保存心情失败 ❌❌❌');
    console.error('错误类型:', error.constructor.name);
    console.error('错误消息:', error.message);
    console.error('错误堆栈:', error.stack);
    console.log('========================================\n');
    res.json({ code: 500, message: `保存失败: ${error.message}` });
  }
});

// 获取心情列表（分页）
router.get('/list', authMiddleware, async (req: any, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    // 获取心情记录列表
    const [moods] = await pool.execute(
      `SELECT * FROM mood_records 
       WHERE user_id = ? 
       ORDER BY date DESC 
       LIMIT ${Number(limit)} OFFSET ${Number(offset)}`,
      [req.userId]
    ) as any[];

    // 获取总数
    const [totalResult] = await pool.execute(
      'SELECT COUNT(*) as total FROM mood_records WHERE user_id = ?',
      [req.userId]
    ) as any[];

    res.json({ 
      code: 200, 
      data: {
        list: moods,
        total: totalResult[0].total,
        page: Number(page),
        limit: Number(limit)
      }
    });
  } catch (error) {
    console.error('获取心情列表失败:', error);
    res.json({ code: 500, message: '获取失败' });
  }
});

// 获取某月的心情记录
router.get('/month', authMiddleware, async (req: any, res) => {
  try {
    const now = new Date();
    const { year = now.getFullYear(), month = now.getMonth() + 1 } = req.query;

    const [moods] = await pool.execute(
      `SELECT id, couple_id, user_id, mood_type as mood, note, date, created_at, updated_at 
       FROM mood_records 
       WHERE user_id = ? 
       AND YEAR(date) = ? 
       AND MONTH(date) = ? 
       ORDER BY date ASC`,
      [req.userId, year, month]
    ) as any[];

    console.log(`✅ 获取到 ${moods.length} 条心情记录`);
    if (moods.length > 0) {
      console.log('   最新3条:', moods.slice(0, 3).map((m: any) => `${m.date}: ${m.mood}`).join(', '));
    }

    res.json({ code: 200, data: moods });
  } catch (error: any) {
    console.error('获取心情失败:', error);
    res.json({ code: 500, message: `获取失败: ${error.message}` });
  }
});

// 获取心情统计
router.get('/stats', authMiddleware, async (req: any, res) => {
  try {
    const now = new Date();
    const { year = now.getFullYear(), month = now.getMonth() + 1 } = req.query;

    // 按心情类型统计
    const [stats] = await pool.execute(
      `SELECT mood_type as mood, COUNT(*) as count 
       FROM mood_records 
       WHERE user_id = ? 
       AND YEAR(date) = ? 
       AND MONTH(date) = ?
       GROUP BY mood`,
      [req.userId, year, month]
    ) as any[];

    res.json({ code: 200, data: stats });
  } catch (error) {
    console.error('获取统计失败:', error);
    res.json({ code: 500, message: '获取失败' });
  }
});

// 获取今日心情
router.get('/today', authMiddleware, async (req: any, res) => {
  try {
    const date = new Date().toISOString().split('T')[0];

    const [moods] = await pool.execute(
      'SELECT * FROM mood_records WHERE user_id = ? AND date = ?',
      [req.userId, date]
    ) as any[];

    if (moods.length > 0) {
      res.json({ code: 200, data: moods[0] });
    } else {
      res.json({ code: 200, data: null });
    }
  } catch (error) {
    console.error('获取今日心情失败:', error);
    res.json({ code: 500, message: '获取失败' });
  }
});

// 获取心情详情
router.get('/detail/:id', authMiddleware, async (req: any, res) => {
  try {
    const { id } = req.params;

    const [moods] = await pool.execute(
      'SELECT * FROM mood_records WHERE id = ? AND user_id = ?',
      [id, req.userId]
    ) as any[];

    if (moods.length === 0) {
      return res.json({ code: 404, message: '记录不存在' });
    }

    res.json({ code: 200, data: moods[0] });
  } catch (error) {
    console.error('获取详情失败:', error);
    res.json({ code: 500, message: '获取失败' });
  }
});

// 删除心情记录
router.delete('/delete/:id', authMiddleware, async (req: any, res) => {
  try {
    const { id } = req.params;

    const [moods] = await pool.execute(
      'SELECT id FROM mood_records WHERE id = ? AND user_id = ?',
      [id, req.userId]
    ) as any[];

    if (moods.length === 0) {
      return res.json({ code: 404, message: '记录不存在' });
    }

    await pool.execute('DELETE FROM mood_records WHERE id = ?', [id]);

    res.json({ code: 200, message: '删除成功' });
  } catch (error) {
    console.error('删除失败:', error);
    res.json({ code: 500, message: '删除失败' });
  }
});

// 获取连续记录天数
router.get('/streak', authMiddleware, async (req: any, res) => {
  try {
    const [records] = await pool.execute(
      `SELECT date FROM mood_records 
       WHERE user_id = ? 
       ORDER BY date DESC`,
      [req.userId]
    ) as any[];

    let streak = 0;
    let currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);

    for (const record of records) {
      const recordDate = new Date(record.date);
      recordDate.setHours(0, 0, 0, 0);

      const diffDays = Math.floor((currentDate.getTime() - recordDate.getTime()) / (1000 * 60 * 60 * 24));

      if (diffDays === streak) {
        streak++;
        currentDate.setDate(currentDate.getDate() - 1);
      } else {
        break;
      }
    }

    res.json({ code: 200, data: { streak } });
  } catch (error) {
    console.error('获取连续天数失败:', error);
    res.json({ code: 500, message: '获取失败' });
  }
});

// 获取年度统计
router.get('/year-stats', authMiddleware, async (req: any, res) => {
  try {
    const { year = new Date().getFullYear() } = req.query;

    // 每月心情统计
    const [monthlyStats] = await pool.execute(
      `SELECT MONTH(date) as month, mood_type as mood, COUNT(*) as count
       FROM mood_records
       WHERE user_id = ? AND YEAR(date) = ?
       GROUP BY MONTH(date), mood
       ORDER BY month`,
      [req.userId, year]
    ) as any[];

    // 总记录数
    const [totalCount] = await pool.execute(
      'SELECT COUNT(*) as count FROM mood_records WHERE user_id = ? AND YEAR(date) = ?',
      [req.userId, year]
    ) as any[];

    // 最常见心情
    const [topMood] = await pool.execute(
      `SELECT mood_type as mood, COUNT(*) as count
       FROM mood_records
       WHERE user_id = ? AND YEAR(date) = ?
       GROUP BY mood
       ORDER BY count DESC
       LIMIT 1`,
      [req.userId, year]
    ) as any[];

    res.json({
      code: 200,
      data: {
        monthly_stats: monthlyStats,
        total_count: totalCount[0].count,
        top_mood: topMood[0] || null
      }
    });
  } catch (error) {
    console.error('获取年度统计失败:', error);
    res.json({ code: 500, message: '获取失败' });
  }
});

// 获取心情趋势（最近N天）
router.get('/trend', authMiddleware, async (req: any, res) => {
  try {
    const { days = 30 } = req.query;

    const [records] = await pool.execute(
      `SELECT date, mood_type as mood, note
       FROM mood_records
       WHERE user_id = ?
       AND date >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
       ORDER BY date DESC`,
      [req.userId, Number(days)]
    ) as any[];

    res.json({ code: 200, data: records });
  } catch (error) {
    console.error('获取趋势失败:', error);
    res.json({ code: 500, message: '获取失败' });
  }
});

export default router;
