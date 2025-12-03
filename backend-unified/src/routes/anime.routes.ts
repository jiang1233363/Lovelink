import express from 'express';
import { authMiddleware } from '../middleware/auth';
import { pool } from '../config/database';
import multer from 'multer';
import path from 'path';

const router = express.Router();

// 配置文件上传
const storage = multer.diskStorage({
  destination: 'uploads/anime/',
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + Math.random().toString(36).substring(7) + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }
});

// 获取动漫照片列表
router.get('/photos', authMiddleware, async (req: any, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    const [photos] = await pool.execute(
      `SELECT * FROM anime_photos 
       WHERE couple_id = ? 
       ORDER BY created_at DESC 
       LIMIT ${Number(limit)} OFFSET ${Number(offset)}`,
      [Number(req.coupleId)]
    ) as any[];

    const [total] = await pool.execute(
      'SELECT COUNT(*) as count FROM anime_photos WHERE couple_id = ?',
      [Number(req.coupleId)]
    ) as any[];

    res.json({ 
      code: 200, 
      data: {
        list: photos,
        total: total[0].count
      }
    });
  } catch (error) {
    console.error('获取照片列表失败:', error);
    res.json({ code: 500, message: '获取失败' });
  }
});

// 上传照片
router.post('/upload', authMiddleware, upload.single('photo'), async (req: any, res) => {
  try {
    if (!req.file) {
      return res.json({ code: 400, message: '未上传文件' });
    }

    const original_url = `/uploads/anime/${req.file.filename}`;

    // 创建记录（状态为processing）
    const [result] = await pool.execute(
      'INSERT INTO anime_photos (couple_id, user_id, original_url, status) VALUES (?, ?, ?, ?)',
      [Number(req.coupleId), req.userId, original_url, 'processing']
    ) as any[];

    // 这里可以调用AI服务进行转换
    // 暂时模拟2秒后自动标记为completed
    setTimeout(async () => {
      try {
        // 模拟AI转换完成，使用原图作为动漫图
        await pool.execute(
          'UPDATE anime_photos SET anime_url = ?, status = ? WHERE id = ?',
          [original_url, 'completed', result.insertId]
        );
      } catch (error) {
        console.error('更新照片状态失败', error);
      }
    }, 2000);

    res.json({
      code: 200,
      message: '上传成功，正在生成动漫风格...',
      data: { 
        id: result.insertId,
        original_url
      }
    });
  } catch (error) {
    console.error('上传照片失败:', error);
    res.json({ code: 500, message: '上传失败' });
  }
});

// 删除照片
router.delete('/delete/:id', authMiddleware, async (req: any, res) => {
  try {
    const { id } = req.params;

    const [photos] = await pool.execute(
      'SELECT id FROM anime_photos WHERE id = ? AND couple_id = ?',
      [id, Number(req.coupleId)]
    ) as any[];

    if (photos.length === 0) {
      return res.json({ code: 404, message: '照片不存在' });
    }

    await pool.execute('DELETE FROM anime_photos WHERE id = ?', [id]);

    res.json({ code: 200, message: '删除成功' });
  } catch (error) {
    console.error('删除照片失败:', error);
    res.json({ code: 500, message: '删除失败' });
  }
});

// 获取照片详情
router.get('/detail/:id', authMiddleware, async (req: any, res) => {
  try {
    const { id } = req.params;

    const [photos] = await pool.execute(
      'SELECT * FROM anime_photos WHERE id = ? AND couple_id = ?',
      [id, Number(req.coupleId)]
    ) as any[];

    if (photos.length === 0) {
      return res.json({ code: 404, message: '照片不存在' });
    }

    res.json({ code: 200, data: photos[0] });
  } catch (error) {
    console.error('获取照片详情失败:', error);
    res.json({ code: 500, message: '获取失败' });
  }
});

// === 动漫卡片系统 ===

// 获取卡片收藏
router.get('/collection', authMiddleware, async (req: any, res) => {
  try {
    // 简单返回空集合
    res.json({
      code: 200,
      data: {
        cards: [],
        daily_draw_count: 1
      }
    });
  } catch (error) {
    console.error('获取收藏失败:', error);
    res.json({ code: 500, message: '获取失败' });
  }
});

// 抽卡
router.post('/draw', authMiddleware, async (req: any, res) => {
  try {
    // 随机抽取一张卡片（1-15）
    const cardId = Math.floor(Math.random() * 15) + 1;
    
    res.json({
      code: 200,
      message: '抽卡成功',
      data: {
        card_id: cardId
      }
    });
  } catch (error) {
    console.error('抽卡失败:', error);
    res.json({ code: 500, message: '抽卡失败' });
  }
});

export default router;
