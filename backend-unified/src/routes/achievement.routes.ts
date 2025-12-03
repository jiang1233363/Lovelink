import express from 'express';
import { authMiddleware } from '../middleware/auth';
import { pool } from '../config/database';

const router = express.Router();

// 获取成就列表
router.get('/list', authMiddleware, async (req: any, res) => {
  try {
    const [achievements] = await pool.execute(
      `SELECT a.*, 
       CASE WHEN ua.id IS NOT NULL THEN 1 ELSE 0 END as is_unlocked,
       ua.unlocked_at
       FROM achievements a
       LEFT JOIN user_achievements ua ON a.id = ua.achievement_id AND ua.couple_id = ?
       ORDER BY a.points DESC`,
      [Number(req.coupleId)]
    ) as any[];
    
    const [stats] = await pool.execute(
      `SELECT 
       COUNT(*) as unlocked_count, 
       SUM(a.points) as total_points
       FROM user_achievements ua 
       JOIN achievements a ON ua.achievement_id = a.id 
       WHERE ua.couple_id = ?`,
      [Number(req.coupleId)]
    ) as any[];
    
    res.json({ 
      code: 200, 
      data: {
        achievements,
        unlocked_count: stats[0].unlocked_count || 0,
        total_points: stats[0].total_points || 0
      }
    });
  } catch (error) {
    console.error('获取成就列表失败:', error);
    res.json({ code: 500, message: '获取失败' });
  }
});

// 解锁成就
router.post('/unlock', authMiddleware, async (req: any, res) => {
  try {
    const { achievement_id } = req.body;

    // 检查成就是否存在
    const [achievements] = await pool.execute(
      'SELECT * FROM achievements WHERE id = ?',
      [achievement_id]
    ) as any[];

    if (achievements.length === 0) {
      return res.json({ code: 404, message: '成就不存在' });
    }

    // 检查是否已解锁
    const [existing] = await pool.execute(
      'SELECT id FROM user_achievements WHERE couple_id = ? AND achievement_id = ?',
      [Number(req.coupleId), achievement_id]
    ) as any[];

    if (existing.length > 0) {
      return res.json({ code: 400, message: '成就已解锁' });
    }

    // 解锁成就
    await pool.execute(
      'INSERT INTO user_achievements (couple_id, achievement_id) VALUES (?, ?)',
      [Number(req.coupleId), achievement_id]
    );

    res.json({ 
      code: 200, 
      message: '成就解锁成功',
      data: {
        achievement: achievements[0],
        points: achievements[0].points
      }
    });
  } catch (error) {
    console.error('解锁成就失败:', error);
    res.json({ code: 500, message: '解锁失败' });
  }
});

// 检查并自动解锁成就
router.post('/check', authMiddleware, async (req: any, res) => {
  try {
    const unlocked: any[] = [];

    // 获取所有未解锁的成就
    const [achievements] = await pool.execute(
      `SELECT a.* FROM achievements a
       WHERE NOT EXISTS (
         SELECT 1 FROM user_achievements ua 
         WHERE ua.achievement_id = a.id AND ua.couple_id = ?
       )`,
      [Number(req.coupleId)]
    ) as any[];

    for (const achievement of achievements) {
      let shouldUnlock = false;

      // 根据条件类型检查
      switch (achievement.condition_type) {
        case 'checkin_count':
          const [checkins] = await pool.execute(
            'SELECT COUNT(*) as count FROM heartbeat_checkins WHERE couple_id = ?',
            [Number(req.coupleId)]
          ) as any[];
          shouldUnlock = checkins[0].count >= achievement.condition_value;
          break;

        case 'consecutive_days':
          const [consecutive] = await pool.execute(
            `SELECT COUNT(*) as count FROM heartbeat_checkins 
             WHERE couple_id = ? 
             AND check_date >= DATE_SUB(CURDATE(), INTERVAL ? DAY)`,
            [Number(req.coupleId), achievement.condition_value]
          ) as any[];
          shouldUnlock = consecutive[0].count >= achievement.condition_value;
          break;

        case 'days_together':
          const [couple] = await pool.execute(
            `SELECT DATEDIFF(NOW(), relationship_start_date) as days 
             FROM couples WHERE id = ?`,
            [Number(req.coupleId)]
          ) as any[];
          if (couple.length > 0) {
            shouldUnlock = couple[0].days >= achievement.condition_value;
          }
          break;
      }

      if (shouldUnlock) {
        await pool.execute(
          'INSERT IGNORE INTO user_achievements (couple_id, achievement_id) VALUES (?, ?)',
          [Number(req.coupleId), achievement.id]
        );
        unlocked.push(achievement);
      }
    }

    res.json({ 
      code: 200, 
      message: unlocked.length > 0 ? `解锁了${unlocked.length}个成就` : '暂无新成就',
      data: { unlocked }
    });
  } catch (error) {
    console.error('检查成就失败', error);
    res.json({ code: 500, message: '检查失败' });
  }
});

export default router;
