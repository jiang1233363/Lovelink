import express from 'express';
import { authMiddleware } from '../middleware/auth';
import { pool } from '../config/database';

const router = express.Router();

// 获取可选宠物列表
router.get('/types', authMiddleware, async (req: any, res) => {
  try {
    const [types] = await pool.execute(
      'SELECT * FROM pet_types ORDER BY unlock_cost ASC'
    ) as any[];

    res.json({ code: 200, data: types });
  } catch (error) {
    console.error('获取宠物类型失败:', error);
    res.json({ code: 500, message: '获取失败' });
  }
});

// 获取当前宠物信息
router.get('/info', authMiddleware, async (req: any, res) => {
  try {
    const [pets] = await pool.execute(
      'SELECT * FROM couple_pets WHERE couple_id = ?',
      [Number(req.coupleId)]
    ) as any[];

    if (pets.length === 0) {
      return res.json({
        code: 200,
        data: {
          has_pet: false,
          pet: null
        }
      });
    }

    const pet = pets[0];
    
    // 计算饥饿度和快乐度衰减
    const now = new Date();
    const lastFed = new Date(pet.last_fed_at);
    const lastPlayed = new Date(pet.last_played_at);
    
    const hoursSinceFed = Math.floor((now.getTime() - lastFed.getTime()) / (1000 * 60 * 60));
    const hoursSincePlayed = Math.floor((now.getTime() - lastPlayed.getTime()) / (1000 * 60 * 60));
    
    // 每小时饥饿度+5，快乐度-3
    pet.hunger = Math.min(100, pet.hunger + hoursSinceFed * 5);
    pet.happiness = Math.max(0, pet.happiness - hoursSincePlayed * 3);

    res.json({
      code: 200,
      data: {
        has_pet: true,
        pet
      }
    });
  } catch (error) {
    console.error('获取宠物信息失败:', error);
    res.json({ code: 500, message: '获取失败' });
  }
});

// 领养宠物
router.post('/adopt', authMiddleware, async (req: any, res) => {
  try {
    const { pet_type, pet_name } = req.body;

    if (!pet_type || !pet_name) {
      return res.json({ code: 400, message: '请提供宠物类型和名字' });
    }

    // 检查是否已有宠物
    const [existing] = await pool.execute(
      'SELECT id FROM couple_pets WHERE couple_id = ?',
      [Number(req.coupleId)]
    ) as any[];

    if (existing.length > 0) {
      return res.json({ code: 400, message: '已经有宠物了哦' });
    }

    // 检查宠物类型是否存在
    const [petTypes] = await pool.execute(
      'SELECT * FROM pet_types WHERE pet_type = ?',
      [pet_type]
    ) as any[];

    if (petTypes.length === 0) {
      return res.json({ code: 404, message: '宠物类型不存在' });
    }

    const petTypeInfo = petTypes[0];

    // TODO: 检查火花值是否足够 (需要火花值系统)
    
    // 创建宠物
    const [result] = await pool.execute(
      `INSERT INTO couple_pets 
       (couple_id, pet_type, pet_name, level, experience, happiness, hunger) 
       VALUES (?, ?, ?, 1, 0, 100, 50)`,
      [Number(req.coupleId), pet_type, pet_name]
    ) as any[];

    res.json({
      code: 200,
      message: `欢迎${pet_name}加入你们的小窝！`,
      data: { pet_id: result.insertId }
    });
  } catch (error) {
    console.error('领养宠物失败:', error);
    res.json({ code: 500, message: '领养失败' });
  }
});

// 喂食宠物
router.post('/feed', authMiddleware, async (req: any, res) => {
  try {
    const { item_id } = req.body;

    const [pets] = await pool.execute(
      'SELECT * FROM couple_pets WHERE couple_id = ?',
      [Number(req.coupleId)]
    ) as any[];

    if (pets.length === 0) {
      return res.json({ code: 404, message: '还没有宠物哦' });
    }

    const pet = pets[0];

    // 获取物品信息
    const [items] = await pool.execute(
      "SELECT * FROM pet_items WHERE id = ? AND item_type = 'food'",
      [item_id]
    ) as any[];

    if (items.length === 0) {
      return res.json({ code: 404, message: '物品不存在' });
    }

    const item = items[0];

    // 更新宠物状态
    const newHunger = Math.max(0, pet.hunger + item.effect_value);
    const newExp = pet.experience + 10;

    await pool.execute(
      `UPDATE couple_pets 
       SET hunger = ?, experience = ?, last_fed_at = NOW() 
       WHERE id = ?`,
      [newHunger, newExp, pet.id]
    );

    res.json({
      code: 200,
      message: `${pet.pet_name}吃得很开心！`,
      data: {
        hunger: newHunger,
        experience: newExp
      }
    });
  } catch (error) {
    console.error('喂食失败:', error);
    res.json({ code: 500, message: '喂食失败' });
  }
});

// 与宠物玩耍
router.post('/play', authMiddleware, async (req: any, res) => {
  try {
    const { item_id } = req.body;

    const [pets] = await pool.execute(
      'SELECT * FROM couple_pets WHERE couple_id = ?',
      [Number(req.coupleId)]
    ) as any[];

    if (pets.length === 0) {
      return res.json({ code: 404, message: '还没有宠物哦' });
    }

    const pet = pets[0];

    // 获取玩具信息
    const [items] = await pool.execute(
      "SELECT * FROM pet_items WHERE id = ? AND item_type = 'toy'",
      [item_id]
    ) as any[];

    if (items.length === 0) {
      return res.json({ code: 404, message: '玩具不存在' });
    }

    const item = items[0];

    // 更新宠物状态
    const newHappiness = Math.min(100, pet.happiness + item.effect_value);
    const newExp = pet.experience + 15;

    await pool.execute(
      `UPDATE couple_pets 
       SET happiness = ?, experience = ?, last_played_at = NOW() 
       WHERE id = ?`,
      [newHappiness, newExp, pet.id]
    );

    res.json({
      code: 200,
      message: `${pet.pet_name}玩得超级开心！`,
      data: {
        happiness: newHappiness,
        experience: newExp
      }
    });
  } catch (error) {
    console.error('玩耍失败:', error);
    res.json({ code: 500, message: '玩耍失败' });
  }
});

// 获取宠物商店物品
router.get('/shop', authMiddleware, async (req: any, res) => {
  try {
    const { type } = req.query;

    let query = 'SELECT * FROM pet_items';
    const params: any[] = [];

    if (type) {
      query += ' WHERE item_type = ?';
      params.push(type);
    }

    query += ' ORDER BY price ASC';

    const [items] = await pool.execute(query, params) as any[];

    res.json({ code: 200, data: items });
  } catch (error) {
    console.error('获取商店物品失败:', error);
    res.json({ code: 500, message: '获取失败' });
  }
});

export default router;








