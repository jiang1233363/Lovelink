import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { authMiddleware } from '../middleware/auth';

const router = express.Router();

// 确保上传目录存在
const uploadDirs = [
  'uploads/avatars',
  'uploads/diaries',
  'uploads/memories',
  'uploads/albums',
  'uploads/chat',
  'uploads/anime',
  'uploads/temp'
];

uploadDirs.forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// 配置文件存储
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const type = (req.query.type || 'temp') as string;
    const destMap: { [key: string]: string } = {
      'avatar': 'uploads/avatars/',
      'diary': 'uploads/diaries/',
      'memory': 'uploads/memories/',
      'album': 'uploads/albums/',
      'chat': 'uploads/chat/',
      'anime': 'uploads/anime/',
      'temp': 'uploads/temp/'
    };
    cb(null, destMap[type] || 'uploads/temp/');
  },
  filename: (req, file, cb) => {
    // 生成唯一文件名：时间戳_随机数_原文件名
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 10000);
    const ext = path.extname(file.originalname);
    const nameWithoutExt = path.basename(file.originalname, ext);
    const sanitizedName = nameWithoutExt.replace(/[^a-zA-Z0-9_-]/g, '_');
    cb(null, `${timestamp}_${random}_${sanitizedName}${ext}`);
  }
});

// 文件过滤器
const fileFilter = (req: any, file: any, cb: any) => {
  // 允许的文件类型
  const allowedTypes = /jpeg|jpg|png|gif|webp|mp4|mov|avi|pdf|doc|docx/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);
  
  if (extname && mimetype) {
    cb(null, true);
  } else {
    cb(new Error('不支持的文件类型'));
  }
};

// 配置multer
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB
  },
  fileFilter: fileFilter
});

/**
 * 单文件上传
 * POST /api/upload/single?type=avatar|diary|memory|album|chat|anime|temp
 */
router.post('/single', authMiddleware, upload.single('file'), (req: any, res) => {
  try {
    if (!req.file) {
      return res.json({ code: 400, message: '未上传文件' });
    }

    const url = `/${req.file.path.replace(/\\/g, '/')}`;
    
    res.json({
      code: 200,
      message: '上传成功',
      data: {
        url,
        filename: req.file.filename,
        originalname: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
        uploadedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('上传文件失败:', error);
    res.json({ code: 500, message: '上传文件失败' });
  }
});

/**
 * 多文件上传（最多10个）
 * POST /api/upload/multiple?type=album|diary|memory
 */
router.post('/multiple', authMiddleware, upload.array('files', 10), (req: any, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.json({ code: 400, message: '未上传文件' });
    }

    const files = (req.files as Express.Multer.File[]).map(file => ({
      url: `/${file.path.replace(/\\/g, '/')}`,
      filename: file.filename,
      originalname: file.originalname,
      mimetype: file.mimetype,
      size: file.size
    }));

    res.json({
      code: 200,
      message: '上传成功',
      data: {
        files,
        count: files.length,
        uploadedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('上传文件失败:', error);
    res.json({ code: 500, message: '上传文件失败' });
  }
});

/**
 * 删除文件
 * DELETE /api/upload/delete
 */
router.delete('/delete', authMiddleware, async (req: any, res) => {
  try {
    const { url } = req.body;
    
    if (!url) {
      return res.json({ code: 400, message: '文件URL不能为空' });
    }

    // 构造完整的文件路径
    const filePath = url.replace(/^\//, '');
    
    // 检查文件是否存在
    if (!fs.existsSync(filePath)) {
      return res.json({ code: 404, message: '文件不存在' });
    }

    // 删除文件
    fs.unlinkSync(filePath);

    res.json({
      code: 200,
      message: '文件删除成功'
    });
  } catch (error) {
    console.error('删除文件失败:', error);
    res.json({ code: 500, message: '删除文件失败' });
  }
});

/**
 * 获取文件信息
 * GET /api/upload/info?url=/uploads/xxx
 */
router.get('/info', authMiddleware, (req: any, res) => {
  try {
    const { url } = req.query;
    
    if (!url) {
      return res.json({ code: 400, message: '文件URL不能为空' });
    }

    const filePath = (url as string).replace(/^\//, '');
    
    if (!fs.existsSync(filePath)) {
      return res.json({ code: 404, message: '文件不存在' });
    }

    const stats = fs.statSync(filePath);
    
    res.json({
      code: 200,
      data: {
        url,
        size: stats.size,
        created: stats.birthtime,
        modified: stats.mtime,
        isFile: stats.isFile(),
        extension: path.extname(filePath)
      }
    });
  } catch (error) {
    console.error('获取文件信息失败:', error);
    res.json({ code: 500, message: '获取文件信息失败' });
  }
});

/**
 * Base64上传（适用于小文件、头像等）
 * POST /api/upload/base64
 */
router.post('/base64', authMiddleware, async (req: any, res) => {
  try {
    const { base64, type = 'temp', filename } = req.body;
    
    if (!base64) {
      return res.json({ code: 400, message: 'base64数据不能为空' });
    }

    // 解析base64数据
    const matches = base64.match(/^data:(.+);base64,(.+)$/);
    if (!matches) {
      return res.json({ code: 400, message: '无效的base64格式' });
    }

    const mimeType = matches[1];
    const data = matches[2];
    const buffer = Buffer.from(data, 'base64');

    // 确定文件扩展名
    const extMap: { [key: string]: string } = {
      'image/jpeg': '.jpg',
      'image/jpg': '.jpg',
      'image/png': '.png',
      'image/gif': '.gif',
      'image/webp': '.webp'
    };
    const ext = extMap[mimeType] || '.jpg';

    // 生成文件名
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 10000);
    const finalFilename = filename || `${timestamp}_${random}${ext}`;

    // 确定保存路径（使用绝对路径）
    const projectRoot = path.resolve(__dirname, '..', '..');
    const destMap: { [key: string]: string } = {
      'avatar': path.join(projectRoot, 'uploads', 'avatars'),
      'diary': path.join(projectRoot, 'uploads', 'diaries'),
      'memory': path.join(projectRoot, 'uploads', 'memories'),
      'album': path.join(projectRoot, 'uploads', 'albums'),
      'chat': path.join(projectRoot, 'uploads', 'chat'),
      'temp': path.join(projectRoot, 'uploads', 'temp')
    };
    const destDir = destMap[type] || path.join(projectRoot, 'uploads', 'temp');
    
    // 确保目录存在
    if (!fs.existsSync(destDir)) {
      fs.mkdirSync(destDir, { recursive: true });
    }
    
    const filePath = path.join(destDir, finalFilename);

    // 保存文件
    fs.writeFileSync(filePath, buffer);
    console.log(`✅ 文件已保存: ${filePath}`);

    // 生成正确的URL（相对于uploads目录）
    const relativeDir = type === 'avatar' ? 'avatars' :
                       type === 'diary' ? 'diaries' :
                       type === 'memory' ? 'memories' :
                       type === 'album' ? 'albums' :
                       type === 'chat' ? 'chat' : 'temp';
    const url = `/uploads/${relativeDir}/${finalFilename}`;

    res.json({
      code: 200,
      message: '上传成功',
      data: {
        url,
        filename: finalFilename,
        mimetype: mimeType,
        size: buffer.length,
        uploadedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Base64上传失败:', error);
    res.json({ code: 500, message: 'Base64上传失败' });
  }
});

export default router;

