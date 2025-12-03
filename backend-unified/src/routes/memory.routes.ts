import express from 'express';
import { authMiddleware } from '../middleware/auth';
import { pool } from '../config/database';
import multer from 'multer';
import path from 'path';

const router = express.Router();

// 配置文件上传
const storage = multer.diskStorage({
  destination: 'uploads/memory/',
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }
});

// 获取回忆列表
router.get('/list', authMiddleware, async (req: any, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    const [memories] = await pool.execute(
      `SELECT m.*, u.username as author_name 
       FROM memories m 
       LEFT JOIN users u ON m.user_id = u.id 
       WHERE m.couple_id = ? 
       ORDER BY m.memory_date DESC 
       LIMIT ${Number(limit)} OFFSET ${Number(offset)}`,
      [Number(req.coupleId)]
    ) as any[];

    const [total] = await pool.execute(
      'SELECT COUNT(*) as count FROM memories WHERE couple_id = ?',
      [Number(req.coupleId)]
    ) as any[];

    res.json({ 
      code: 200, 
      data: {
        list: memories,
        total: total[0].count
      }
    });
  } catch (error) {
    console.error('获取回忆列表失败:', error);
    res.json({ code: 500, message: '获取失败' });
  }
});

// 获取回忆详情
router.get('/detail/:id', authMiddleware, async (req: any, res) => {
  try {
    const { id } = req.params;
    const [memories] = await pool.execute(
      `SELECT m.*, u.username as author_name 
       FROM memories m 
       LEFT JOIN users u ON m.user_id = u.id 
       WHERE m.id = ? AND m.couple_id = ?`,
      [id, Number(req.coupleId)]
    ) as any[];

    if (memories.length === 0) {
      return res.json({ code: 404, message: '回忆不存在' });
    }

    res.json({ code: 200, data: memories[0] });
  } catch (error) {
    console.error('获取回忆详情失败:', error);
    res.json({ code: 500, message: '获取失败' });
  }
});

// 创建回忆
router.post('/create', authMiddleware, async (req: any, res) => {
  try {
    console.log('💭 创建回忆 - userId:', req.userId, 'coupleId:', req.coupleId);
    const { title, content, memory_date, images, tags } = req.body;
    console.log('   参数:', { title, content: content?.substring(0, 50), memory_date, images, tags });

    if (!title || title.trim() === '') {
      return res.json({ code: 400, message: '标题不能为空' });
    }

    const coupleId = req.coupleId || null;
    const insertData = [coupleId, req.userId, title, content || '', memory_date || null, images || null, tags || null];
    console.log('   插入数据:', insertData);

    const [result] = await pool.execute(
      'INSERT INTO memories (couple_id, user_id, title, content, memory_date, image_url, tags) VALUES (?, ?, ?, ?, ?, ?, ?)',
      insertData
    ) as any[];

    console.log('✅ 回忆创建成功，ID:', result.insertId);
    res.json({ 
      code: 200, 
      message: '创建成功', 
      data: { id: result.insertId } 
    });
  } catch (error: any) {
    console.error('❌ 创建回忆失败:', error.message);
    console.error('   堆栈:', error.stack);
    res.json({ code: 500, message: `创建失败: ${error.message}` });
  }
});

// 更新回忆
router.put('/update/:id', authMiddleware, async (req: any, res) => {
  try {
    const { id } = req.params;
    const { title, content, memory_date, images, tags } = req.body;

    const [memories] = await pool.execute(
      'SELECT user_id FROM memories WHERE id = ? AND couple_id = ?',
      [id, Number(req.coupleId)]
    ) as any[];

    if (memories.length === 0) {
      return res.json({ code: 404, message: '回忆不存在' });
    }

    if (memories[0].user_id !== req.userId) {
      return res.json({ code: 403, message: '只能编辑自己的回忆' });
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
    if (memory_date !== undefined) {
      updates.push('memory_date = ?');
      values.push(memory_date);
    }
    if (images !== undefined) {
      updates.push('image_urls = ?');
      values.push(images);
    }
    if (tags !== undefined) {
      updates.push('tags = ?');
      values.push(tags);
    }

    if (updates.length === 0) {
      return res.json({ code: 400, message: '没有要更新的字段' });
    }

    updates.push('updated_at = NOW()');
    values.push(id);

    await pool.execute(
      `UPDATE memories SET ${updates.join(', ')} WHERE id = ?`,
      values
    );

    res.json({ code: 200, message: '更新成功' });
  } catch (error) {
    console.error('更新回忆失败:', error);
    res.json({ code: 500, message: '更新失败' });
  }
});

// 删除回忆
router.delete('/delete/:id', authMiddleware, async (req: any, res) => {
  try {
    const { id } = req.params;

    const [memories] = await pool.execute(
      'SELECT user_id FROM memories WHERE id = ? AND couple_id = ?',
      [id, Number(req.coupleId)]
    ) as any[];

    if (memories.length === 0) {
      return res.json({ code: 404, message: '回忆不存在' });
    }

    if (memories[0].user_id !== req.userId) {
      return res.json({ code: 403, message: '只能删除自己的回忆' });
    }

    await pool.execute('DELETE FROM memories WHERE id = ?', [id]);

    res.json({ code: 200, message: '删除成功' });
  } catch (error) {
    console.error('删除回忆失败:', error);
    res.json({ code: 500, message: '删除失败' });
  }
});

// 上传图片
router.post('/upload', authMiddleware, upload.single('image'), (req: any, res) => {
  try {
    if (!req.file) {
      return res.json({ code: 400, message: '未上传文件' });
    }

    const url = `/uploads/memory/${req.file.filename}`;
    res.json({ code: 200, data: { url } });
  } catch (error) {
    console.error('上传图片失败:', error);
    res.json({ code: 500, message: '上传失败' });
  }
});

export default router;
