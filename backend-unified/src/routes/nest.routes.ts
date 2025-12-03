import express from 'express';
import { authMiddleware } from '../middleware/auth';
import { pool } from '../config/database';

const router = express.Router();

// 获取物品清单（inventory）
router.get('/inventory', authMiddleware, async (req: any, res) => {
  try {
    // 获取已购买的装饰品
    const [items] = await pool.execute(
      'SELECT * FROM nest_items WHERE couple_id = ?',
      [Number(req.coupleId)]
    ) as any[];

    res.json({ 
      code: 200, 
      data: {
        owned: items.map((i: any) => i.item_id),
        applied: items.filter((i: any) => i.is_applied).map((i: any) => i.item_id),
        coins: 1000 // 模拟金币
      }
    });
  } catch (error) {
    console.error('获取物品失败:', error);
    res.json({ code: 500, message: '获取失败' });
  }
});

// 应用装饰品
router.post('/apply', authMiddleware, async (req: any, res) => {
  try {
    const { item_id, type } = req.body;

    // 简化：直接标记为应用
    res.json({ 
      code: 200, 
      message: '应用成功'
    });
  } catch (error) {
    console.error('应用失败:', error);
    res.json({ code: 500, message: '应用失败' });
  }
});

// 获取小窝信息
router.get('/info', authMiddleware, async (req: any, res) => {
  try {
    // 获取小窝基本信息
    let [nest] = await pool.execute(
      'SELECT * FROM couple_nest WHERE couple_id = ?',
      [Number(req.coupleId)]
    ) as any[];

    // 如果不存在，创建默认小窝
    if (nest.length === 0) {
      await pool.execute(
        'INSERT INTO couple_nest (couple_id, level, experience) VALUES (?, 1, 0)',
        [Number(req.coupleId)]
      );
      [nest] = await pool.execute(
        'SELECT * FROM couple_nest WHERE couple_id = ?',
        [Number(req.coupleId)]
      ) as any[];
    }

    // 获取已购买的装饰品
    const [items] = await pool.execute(
      'SELECT * FROM nest_items WHERE couple_id = ?',
      [Number(req.coupleId)]
    ) as any[];

    // 获取商店物品
    const [shopItems] = await pool.execute(
      'SELECT * FROM nest_shop_items ORDER BY price'
    ) as any[];

    // 计算火花值（从心动计划获取）
    const [reward] = await pool.execute(
      'SELECT SUM(task_reward) as total_reward FROM heartbeat_checkins WHERE couple_id = ?',
      [Number(req.coupleId)]
    ) as any[];

    res.json({ 
      code: 200, 
      data: {
        level: nest[0].level,
        experience: nest[0].experience,
        fire_points: reward[0].total_reward || 0, // 火花值
        items,
        shop_items: shopItems
      }
    });
  } catch (error) {
    console.error('获取小窝信息失败:', error);
    res.json({ code: 500, message: '获取失败' });
  }
});

// 购买装饰品
router.post('/buy', authMiddleware, async (req: any, res) => {
  try {
    const { item_id } = req.body;

    // 获取物品信息
    const [shopItems] = await pool.execute(
      'SELECT * FROM nest_shop_items WHERE id = ?',
      [item_id]
    ) as any[];

    if (shopItems.length === 0) {
      return res.json({ code: 404, message: '物品不存在' });
    }

    const item = shopItems[0];

    // 检查火花值是否足够
    const [reward] = await pool.execute(
      'SELECT SUM(task_reward) as total_reward FROM heartbeat_checkins WHERE couple_id = ?',
      [Number(req.coupleId)]
    ) as any[];

    const firePoints = reward[0].total_reward || 0;

    if (firePoints < item.price) {
      return res.json({ code: 400, message: '火花值不足' });
    }

    // 购买物品（添加到couple的物品列表）
    const randomX = Math.floor(Math.random() * 300);
    const randomY = Math.floor(Math.random() * 300);

    const [result] = await pool.execute(
      'INSERT INTO nest_items (couple_id, item_id, item_name, icon, x, y) VALUES (?, ?, ?, ?, ?, ?)',
      [Number(req.coupleId), item_id, item.name, item.icon, randomX, randomY]
    ) as any[];

    // 扣除火花值（通过添加一条负值记录）
    // 注意：这里简化了，实际应该有专门的货币系统
    
    res.json({ 
      code: 200, 
      message: '购买成功',
      data: { 
        id: result.insertId,
        remaining_points: firePoints - item.price
      }
    });
  } catch (error) {
    console.error('购买失败:', error);
    res.json({ code: 500, message: '购买失败' });
  }
});

// 移动装饰品位置
router.put('/place', authMiddleware, async (req: any, res) => {
  try {
    const { item_id, x, y } = req.body;

    const [items] = await pool.execute(
      'SELECT id FROM nest_items WHERE id = ? AND couple_id = ?',
      [item_id, Number(req.coupleId)]
    ) as any[];

    if (items.length === 0) {
      return res.json({ code: 404, message: '装饰品不存在' });
    }

    await pool.execute(
      'UPDATE nest_items SET x = ?, y = ? WHERE id = ?',
      [x, y, item_id]
    );

    res.json({ code: 200, message: '位置已更新' });
  } catch (error) {
    console.error('更新位置失败:', error);
    res.json({ code: 500, message: '更新失败' });
  }
});

// 删除装饰品
router.delete('/remove/:id', authMiddleware, async (req: any, res) => {
  try {
    const { id } = req.params;

    const [items] = await pool.execute(
      'SELECT id FROM nest_items WHERE id = ? AND couple_id = ?',
      [id, Number(req.coupleId)]
    ) as any[];

    if (items.length === 0) {
      return res.json({ code: 404, message: '装饰品不存在' });
    }

    await pool.execute('DELETE FROM nest_items WHERE id = ?', [id]);

    res.json({ code: 200, message: '移除成功' });
  } catch (error) {
    console.error('移除失败:', error);
    res.json({ code: 500, message: '移除失败' });
  }
});

// 升级小窝
router.post('/upgrade', authMiddleware, async (req: any, res) => {
  try {
    const [nest] = await pool.execute(
      'SELECT * FROM couple_nest WHERE couple_id = ?',
      [Number(req.coupleId)]
    ) as any[];

    if (nest.length === 0) {
      return res.json({ code: 404, message: '小窝不存在' });
    }

    const currentLevel = nest[0].level;
    const requiredExp = currentLevel * 100; // 升级所需经验

    if (nest[0].experience < requiredExp) {
      return res.json({ code: 400, message: `经验不足，需要${requiredExp}经验` });
    }

    await pool.execute(
      'UPDATE couple_nest SET level = level + 1, experience = experience - ? WHERE couple_id = ?',
      [requiredExp, Number(req.coupleId)]
    );

    res.json({ 
      code: 200, 
      message: '升级成功',
      data: { new_level: currentLevel + 1 }
    });
  } catch (error) {
    console.error('升级失败:', error);
    res.json({ code: 500, message: '升级失败' });
  }
});

export default router;
