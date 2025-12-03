import express from 'express';
import { authMiddleware } from '../middleware/auth';
import { pool } from '../config/database';

const router = express.Router();

// 分享位置
router.post('/share', authMiddleware, async (req: any, res) => {
  try {
    const { latitude, longitude, address, accuracy } = req.body;

    if (!latitude || !longitude) {
      return res.json({ code: 400, message: '经纬度不能为空' });
    }

    // 插入新的位置记录
    const [result] = await pool.execute(
      `INSERT INTO location_shares 
       (user_id, couple_id, latitude, longitude, address, accuracy) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [req.userId, Number(req.coupleId), latitude, longitude, address, accuracy]
    ) as any[];

    res.json({ 
      code: 200, 
      message: '位置已分享',
      data: { id: result.insertId }
    });
  } catch (error) {
    console.error('分享位置失败:', error);
    res.json({ code: 500, message: '分享失败' });
  }
});

// 获取伴侣最新位置
router.get('/partner', authMiddleware, async (req: any, res) => {
  try {
    const [locations] = await pool.execute(
      `SELECT l.*, u.username, u.avatar
       FROM location_shares l
       JOIN users u ON l.user_id = u.id
       WHERE l.couple_id = ? 
       AND l.user_id != ? 
       ORDER BY l.created_at DESC 
       LIMIT 1`,
      [Number(req.coupleId), req.userId]
    ) as any[];

    if (locations.length === 0) {
      return res.json({ code: 200, data: null, message: '伴侣尚未分享位置' });
    }

    // 计算位置分享的时间
    const location = locations[0];
    const sharedTime = new Date(location.created_at);
    const now = new Date();
    const minutesAgo = Math.floor((now.getTime() - sharedTime.getTime()) / (1000 * 60));

    res.json({ 
      code: 200, 
      data: {
        ...location,
        minutes_ago: minutesAgo
      }
    });
  } catch (error) {
    console.error('获取伴侣位置失败:', error);
    res.json({ code: 500, message: '获取失败' });
  }
});

// 获取我的最新位置
router.get('/mine', authMiddleware, async (req: any, res) => {
  try {
    const [locations] = await pool.execute(
      `SELECT * FROM location_shares 
       WHERE user_id = ? 
       ORDER BY created_at DESC 
       LIMIT 1`,
      [req.userId]
    ) as any[];

    res.json({ 
      code: 200, 
      data: locations[0] || null
    });
  } catch (error) {
    console.error('获取我的位置失败:', error);
    res.json({ code: 500, message: '获取失败' });
  }
});

// 获取共享状态
router.get('/status', authMiddleware, async (req: any, res) => {
  try {
    // 简单返回共享状态
    res.json({
      code: 200,
      data: {
        enabled: true,
        last_share_at: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('获取状态失败:', error);
    res.json({ code: 500, message: '获取失败' });
  }
});

// 切换共享开关
router.post('/toggle', authMiddleware, async (req: any, res) => {
  try {
    const { enabled } = req.body;
    res.json({
      code: 200,
      message: enabled ? '位置共享已开启' : '位置共享已关闭',
      data: { enabled }
    });
  } catch (error) {
    console.error('切换失败:', error);
    res.json({ code: 500, message: '切换失败' });
  }
});

// 更新位置
router.post('/update', authMiddleware, async (req: any, res) => {
  try {
    const { lat, lng } = req.body;
    
    await pool.execute(
      `INSERT INTO location_shares 
       (user_id, couple_id, latitude, longitude, address) 
       VALUES (?, ?, ?, ?, ?)`,
      [req.userId, Number(req.coupleId), lat, lng, '位置更新成功']
    );

    res.json({
      code: 200,
      message: '位置更新成功',
      data: { address: '位置更新成功' }
    });
  } catch (error) {
    console.error('更新位置失败:', error);
    res.json({ code: 500, message: '更新失败' });
  }
});

// 获取位置历史记录
router.get('/history', authMiddleware, async (req: any, res) => {
  try {
    // 如果没有coupleId，返回空列表
    if (!req.coupleId) {
      return res.json({
        code: 200,
        data: []
      });
    }

    const { user_id, page = 1, limit = 20 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    let whereClause = 'couple_id = ?';
    const params: any[] = [Number(req.coupleId)];

    if (user_id) {
      whereClause += ' AND user_id = ?';
      params.push(user_id);
    }

    const [locations] = await pool.execute(
      `SELECT l.*, u.username, u.avatar
       FROM location_shares l
       JOIN users u ON l.user_id = u.id
       WHERE ${whereClause}
       ORDER BY l.created_at DESC
       LIMIT ${Number(limit)} OFFSET ${Number(offset)}`,
      params
    ) as any[];

    res.json({
      code: 200,
      data: locations || []
    });
  } catch (error: any) {
    console.error('获取历史记录失败:', error);
    res.json({ code: 500, message: `获取失败: ${error.message}` });
  }
});

// 获取双方当前位置（用于地图显示）
router.get('/both', authMiddleware, async (req: any, res) => {
  try {
    // 获取两人最新位置
    const [locations] = await pool.execute(
      `SELECT l.*, u.username, u.avatar
       FROM location_shares l
       JOIN users u ON l.user_id = u.id
       WHERE l.couple_id = ?
       AND l.id IN (
         SELECT MAX(id) FROM location_shares 
         WHERE couple_id = ? 
         GROUP BY user_id
       )`,
      [Number(req.coupleId), Number(req.coupleId)]
    ) as any[];

    // 如果有两个位置，计算距离
    let distance = null;
    if (locations.length === 2) {
      const [loc1, loc2] = locations;
      // 使用haversine公式计算距离（简化版）
      const R = 6371; // 地球半径（公里）
      const dLat = (loc2.latitude - loc1.latitude) * Math.PI / 180;
      const dLon = (loc2.longitude - loc1.longitude) * Math.PI / 180;
      const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(loc1.latitude * Math.PI / 180) * Math.cos(loc2.latitude * Math.PI / 180) *
        Math.sin(dLon/2) * Math.sin(dLon/2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      distance = (R * c).toFixed(2); // 距离（公里）
    }

    res.json({
      code: 200,
      data: {
        locations,
        distance,
        my_location: locations.find((l: any) => l.user_id === req.userId) || null,
        partner_location: locations.find((l: any) => l.user_id !== req.userId) || null
      }
    });
  } catch (error) {
    console.error('获取双方位置失败:', error);
    res.json({ code: 500, message: '获取失败' });
  }
});

// 删除位置记录
router.delete('/delete/:id', authMiddleware, async (req: any, res) => {
  try {
    const { id } = req.params;

    const [locations] = await pool.execute(
      'SELECT id FROM location_shares WHERE id = ? AND user_id = ?',
      [id, req.userId]
    ) as any[];

    if (locations.length === 0) {
      return res.json({ code: 404, message: '位置记录不存在' });
    }

    await pool.execute('DELETE FROM location_shares WHERE id = ?', [id]);

    res.json({ code: 200, message: '删除成功' });
  } catch (error) {
    console.error('删除位置失败:', error);
    res.json({ code: 500, message: '删除失败' });
  }
});

// 获取位置统计
router.get('/stats', authMiddleware, async (req: any, res) => {
  try {
    // 总分享次数
    const [totalShares] = await pool.execute(
      'SELECT COUNT(*) as count FROM location_shares WHERE couple_id = ?',
      [Number(req.coupleId)]
    ) as any[];

    // 我的分享次数
    const [myShares] = await pool.execute(
      'SELECT COUNT(*) as count FROM location_shares WHERE user_id = ?',
      [req.userId]
    ) as any[];

    // 最后一次分享时间
    const [lastShare] = await pool.execute(
      `SELECT created_at FROM location_shares 
       WHERE user_id = ? 
       ORDER BY created_at DESC 
       LIMIT 1`,
      [req.userId]
    ) as any[];

    // 本月分享次数
    const [thisMonth] = await pool.execute(
      `SELECT COUNT(*) as count FROM location_shares 
       WHERE user_id = ? 
       AND YEAR(created_at) = YEAR(NOW())
       AND MONTH(created_at) = MONTH(NOW())`,
      [req.userId]
    ) as any[];

    res.json({
      code: 200,
      data: {
        total_shares: totalShares[0].count,
        my_shares: myShares[0].count,
        last_share_at: lastShare[0]?.created_at || null,
        this_month_shares: thisMonth[0].count
      }
    });
  } catch (error) {
    console.error('获取统计失败:', error);
    res.json({ code: 500, message: '获取失败' });
  }
});

// 批量获取特定日期的位置轨迹
router.get('/track', authMiddleware, async (req: any, res) => {
  try {
    const { date, user_id } = req.query;

    if (!date) {
      return res.json({ code: 400, message: '日期不能为空' });
    }

    let whereClause = 'couple_id = ? AND DATE(created_at) = ?';
    const params: any[] = [Number(req.coupleId), date];

    if (user_id) {
      whereClause += ' AND user_id = ?';
      params.push(user_id);
    }

    const [locations] = await pool.execute(
      `SELECT l.*, u.username, u.avatar
       FROM location_shares l
       JOIN users u ON l.user_id = u.id
       WHERE ${whereClause}
       ORDER BY l.created_at ASC`,
      params
    ) as any[];

    res.json({
      code: 200,
      data: locations
    });
  } catch (error) {
    console.error('获取轨迹失败:', error);
    res.json({ code: 500, message: '获取失败' });
  }
});

export default router;
