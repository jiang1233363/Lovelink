import express from 'express';
import { authMiddleware } from '../middleware/auth';
import { pool } from '../config/database';
import multer from 'multer';
import path from 'path';

const router = express.Router();

// 配置文件上传
const storage = multer.diskStorage({
  destination: 'uploads/album/',
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + Math.random().toString(36).substring(7) + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
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

// 获取相册列表
router.get('/list', authMiddleware, async (req: any, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    const [albums] = await pool.execute(
      `SELECT a.*, u.username as author_name,
       (SELECT COUNT(*) FROM album_photos WHERE album_id = a.id) as photo_count
       FROM albums a 
       LEFT JOIN users u ON a.user_id = u.id 
       WHERE a.couple_id = ? 
       ORDER BY a.created_at DESC 
       LIMIT ${Number(limit)} OFFSET ${Number(offset)}`,
      [Number(req.coupleId)]
    ) as any[];

    const [total] = await pool.execute(
      'SELECT COUNT(*) as count FROM albums WHERE couple_id = ?',
      [Number(req.coupleId)]
    ) as any[];

    res.json({ 
      code: 200, 
      data: {
        list: albums,
        total: total[0].count,
        page: Number(page),
        pageSize: Number(limit)
      }
    });
  } catch (error) {
    console.error('获取相册列表失败:', error);
    res.json({ code: 500, message: '获取失败' });
  }
});

// 获取相册详情（包含照片）
router.get('/detail/:id', authMiddleware, async (req: any, res) => {
  try {
    const { id } = req.params;
    
    const [albums] = await pool.execute(
      `SELECT a.*, u.username as author_name 
       FROM albums a 
       LEFT JOIN users u ON a.user_id = u.id 
       WHERE a.id = ? AND a.couple_id = ?`,
      [id, Number(req.coupleId)]
    ) as any[];

    if (albums.length === 0) {
      return res.json({ code: 404, message: '相册不存在' });
    }

    const [photos] = await pool.execute(
      'SELECT * FROM album_photos WHERE album_id = ? ORDER BY taken_date DESC, created_at DESC',
      [id]
    ) as any[];

    res.json({ 
      code: 200, 
      data: {
        ...albums[0],
        photos
      }
    });
  } catch (error) {
    console.error('获取相册详情失败:', error);
    res.json({ code: 500, message: '获取失败' });
  }
});

// 创建相册
router.post('/create', authMiddleware, async (req: any, res) => {
  try {
    const { title, description, cover_image } = req.body;

    if (!title || title.trim() === '') {
      return res.json({ code: 400, message: '相册标题不能为空' });
    }

    const [result] = await pool.execute(
      'INSERT INTO albums (couple_id, user_id, title, description, cover_image) VALUES (?, ?, ?, ?, ?)',
      [Number(req.coupleId), req.userId, title, description, cover_image]
    ) as any[];

    res.json({ 
      code: 200, 
      message: '创建成功', 
      data: { id: result.insertId } 
    });
  } catch (error) {
    console.error('创建相册失败:', error);
    res.json({ code: 500, message: '创建失败' });
  }
});

// 更新相册
router.put('/update/:id', authMiddleware, async (req: any, res) => {
  try {
    const { id } = req.params;
    const { title, description, cover_image } = req.body;

    const [albums] = await pool.execute(
      'SELECT user_id FROM albums WHERE id = ? AND couple_id = ?',
      [id, Number(req.coupleId)]
    ) as any[];

    if (albums.length === 0) {
      return res.json({ code: 404, message: '相册不存在' });
    }

    if (albums[0].user_id !== req.userId) {
      return res.json({ code: 403, message: '只能编辑自己创建的相册' });
    }

    await pool.execute(
      'UPDATE albums SET title = ?, description = ?, cover_image = ? WHERE id = ?',
      [title, description, cover_image, id]
    );

    res.json({ code: 200, message: '更新成功' });
  } catch (error) {
    console.error('更新相册失败:', error);
    res.json({ code: 500, message: '更新失败' });
  }
});

// 删除相册
router.delete('/delete/:id', authMiddleware, async (req: any, res) => {
  try {
    const { id } = req.params;

    const [albums] = await pool.execute(
      'SELECT user_id FROM albums WHERE id = ? AND couple_id = ?',
      [id, Number(req.coupleId)]
    ) as any[];

    if (albums.length === 0) {
      return res.json({ code: 404, message: '相册不存在' });
    }

    if (albums[0].user_id !== req.userId) {
      return res.json({ code: 403, message: '只能删除自己创建的相册' });
    }

    // 删除相册照片
    await pool.execute('DELETE FROM album_photos WHERE album_id = ?', [id]);
    
    // 删除相册
    await pool.execute('DELETE FROM albums WHERE id = ?', [id]);

    res.json({ code: 200, message: '删除成功' });
  } catch (error) {
    console.error('删除相册失败:', error);
    res.json({ code: 500, message: '删除失败' });
  }
});

// 添加照片到相册
router.post('/addPhoto/:id', authMiddleware, async (req: any, res) => {
  try {
    const { id } = req.params;
    const { photo_url, caption, taken_date } = req.body;

    // 验证相册存在
    const [albums] = await pool.execute(
      'SELECT id FROM albums WHERE id = ? AND couple_id = ?',
      [id, Number(req.coupleId)]
    ) as any[];

    if (albums.length === 0) {
      return res.json({ code: 404, message: '相册不存在' });
    }

    const [result] = await pool.execute(
      'INSERT INTO album_photos (album_id, photo_url, caption, taken_date) VALUES (?, ?, ?, ?)',
      [id, photo_url, caption, taken_date]
    ) as any[];

    res.json({ 
      code: 200, 
      message: '添加成功',
      data: { id: result.insertId }
    });
  } catch (error) {
    console.error('添加照片失败:', error);
    res.json({ code: 500, message: '添加失败' });
  }
});

// 删除照片
router.delete('/deletePhoto/:photoId', authMiddleware, async (req: any, res) => {
  try {
    const { photoId } = req.params;

    // 验证照片属于该情侣的相册
    const [photos] = await pool.execute(
      `SELECT ap.id 
       FROM album_photos ap
       JOIN albums a ON ap.album_id = a.id
       WHERE ap.id = ? AND a.couple_id = ?`,
      [photoId, Number(req.coupleId)]
    ) as any[];

    if (photos.length === 0) {
      return res.json({ code: 404, message: '照片不存在' });
    }

    await pool.execute('DELETE FROM album_photos WHERE id = ?', [photoId]);

    res.json({ code: 200, message: '删除成功' });
  } catch (error) {
    console.error('删除照片失败:', error);
    res.json({ code: 500, message: '删除失败' });
  }
});

// 上传照片
router.post('/upload', authMiddleware, upload.single('photo'), (req: any, res) => {
  try {
    if (!req.file) {
      return res.json({ code: 400, message: '未上传文件' });
    }

    const url = `/uploads/album/${req.file.filename}`;
    res.json({
      code: 200,
      data: { url }
    });
  } catch (error) {
    console.error('上传照片失败:', error);
    res.json({ code: 500, message: '上传失败' });
  }
});

export default router;
