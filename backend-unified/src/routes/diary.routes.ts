import express from 'express';
import { authMiddleware } from '../middleware/auth';
import { pool } from '../config/database';
import multer from 'multer';
import path from 'path';

const router = express.Router();

// 配置文件上传
const storage = multer.diskStorage({
  destination: 'uploads/diary/',
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (extname && mimetype) {
      cb(null, true);
    } else {
      cb(new Error('只允许上传图片文件'));
    }
  }
});

// 获取日记列表
router.get('/list', authMiddleware, async (req: any, res) => {
  try {
    console.log('=== 日记路由 - 2024-11-04 14:00 最新版本 ===');
    const { page = 1, limit = 20 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    console.log('[DEBUG] 日记列表参数:', {
      coupleId: req.coupleId,
      coupleIdType: typeof req.coupleId,
      page, 
      pageType: typeof page,
      limit, 
      limitType: typeof limit,
      offset,
      offsetType: typeof offset,
      转换后: {
        coupleId: Number(req.coupleId),
        limit: Number(limit),
        offset: Number(offset)
      }
    });

    const [diaries] = await pool.execute(
      `SELECT d.*, u.username as author_name 
       FROM diaries d 
       LEFT JOIN users u ON d.user_id = u.id 
       WHERE d.couple_id = ? 
       ORDER BY d.created_at DESC 
       LIMIT ${Number(limit)} OFFSET ${Number(offset)}`,
      [Number(req.coupleId)]
    ) as any[];

    const [total] = await pool.execute(
      'SELECT COUNT(*) as count FROM diaries WHERE couple_id = ?',
      [Number(req.coupleId)]
    ) as any[];

    res.json({ 
      code: 200, 
      data: {
        list: diaries,
        total: total[0].count,
        page: Number(page),
        pageSize: Number(limit)
      }
    });
  } catch (error: any) {
    console.error('获取日记列表失败:', error);
    res.json({ code: 500, message: `获取失败: ${error.message}` });
  }
});

// 获取日记详情
router.get('/detail/:id', authMiddleware, async (req: any, res) => {
  try {
    const { id } = req.params;
    const [diaries] = await pool.execute(
      `SELECT d.*, u.username as author_name 
       FROM diaries d 
       LEFT JOIN users u ON d.user_id = u.id 
       WHERE d.id = ? AND d.couple_id = ?`,
      [id, Number(req.coupleId)]
    ) as any[];

    if (diaries.length === 0) {
      return res.json({ code: 404, message: '日记不存在' });
    }

    res.json({ code: 200, data: diaries[0] });
  } catch (error) {
    console.error('获取日记详情失败:', error);
    res.json({ code: 500, message: '获取失败' });
  }
});

// 创建日记
router.post('/create', authMiddleware, async (req: any, res) => {
  try {
    console.log('📝 创建日记 - userId:', req.userId, 'coupleId:', req.coupleId);
    const { title, content, mood, images, is_private = 0 } = req.body;
    console.log('   参数:', { title, content: content?.substring(0, 50), mood, images, is_private });

    if (!content || content.trim() === '') {
      return res.json({ code: 400, message: '日记内容不能为空' });
    }

    const coupleId = req.coupleId || null;
    const insertData = [coupleId, req.userId, title || '', content, mood || null, images || null, is_private];
    console.log('   插入数据:', insertData);

    const [result] = await pool.execute(
      'INSERT INTO diaries (couple_id, user_id, title, content, mood, image_urls, is_private) VALUES (?, ?, ?, ?, ?, ?, ?)',
      insertData
    ) as any[];

    console.log('✅ 日记创建成功，ID:', result.insertId);
    res.json({ 
      code: 200, 
      message: '创建成功', 
      data: { id: result.insertId } 
    });
  } catch (error: any) {
    console.error('❌ 创建日记失败:', error.message);
    console.error('   堆栈:', error.stack);
    res.json({ code: 500, message: `创建失败: ${error.message}` });
  }
});

// 更新日记
router.put('/update/:id', authMiddleware, async (req: any, res) => {
  try {
    const { id } = req.params;
    const { title, content, mood, images, is_private } = req.body;

    const [diaries] = await pool.execute(
      'SELECT user_id FROM diaries WHERE id = ? AND couple_id = ?',
      [id, Number(req.coupleId)]
    ) as any[];

    if (diaries.length === 0) {
      return res.json({ code: 404, message: '日记不存在' });
    }

    if (diaries[0].user_id !== req.userId) {
      return res.json({ code: 403, message: '只能编辑自己的日记' });
    }

    // 动态构建更新语句，只更新提供的字段
    const updates: string[] = [];
    const values: any[] = [];

    if (title !== undefined) {
      updates.push('title = ?');
      values.push(title);
    }
    if (content !== undefined) {
      updates.push('content = ?');
      values.push(content);
    }
    if (mood !== undefined) {
      updates.push('mood = ?');
      values.push(mood);
    }
    if (images !== undefined) {
      updates.push('image_urls = ?');
      values.push(images);
    }
    if (is_private !== undefined) {
      updates.push('is_private = ?');
      values.push(is_private);
    }

    if (updates.length === 0) {
      return res.json({ code: 400, message: '没有要更新的字段' });
    }

    updates.push('updated_at = NOW()');
    values.push(id);

    await pool.execute(
      `UPDATE diaries SET ${updates.join(', ')} WHERE id = ?`,
      values
    );

    res.json({ code: 200, message: '更新成功' });
  } catch (error) {
    console.error('更新日记失败:', error);
    res.json({ code: 500, message: '更新失败' });
  }
});

// 删除日记
router.delete('/delete/:id', authMiddleware, async (req: any, res) => {
  try {
    const { id } = req.params;

    const [diaries] = await pool.execute(
      'SELECT user_id FROM diaries WHERE id = ? AND couple_id = ?',
      [id, Number(req.coupleId)]
    ) as any[];

    if (diaries.length === 0) {
      return res.json({ code: 404, message: '日记不存在' });
    }

    if (diaries[0].user_id !== req.userId) {
      return res.json({ code: 403, message: '只能删除自己的日记' });
    }

    await pool.execute('DELETE FROM diaries WHERE id = ?', [id]);

    res.json({ code: 200, message: '删除成功' });
  } catch (error) {
    console.error('删除日记失败:', error);
    res.json({ code: 500, message: '删除失败' });
  }
});

// 上传图片
router.post('/upload', authMiddleware, upload.single('image'), (req: any, res) => {
  try {
    if (!req.file) {
      return res.json({ code: 400, message: '未上传文件' });
    }

    const url = `/uploads/diary/${req.file.filename}`;
    res.json({
      code: 200,
      data: { url }
    });
  } catch (error) {
    console.error('上传图片失败:', error);
    res.json({ code: 500, message: '上传失败' });
  }
});

export default router;
