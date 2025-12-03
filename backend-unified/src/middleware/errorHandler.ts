import { Request, Response, NextFunction } from 'express';

// 404 处理
export const notFoundHandler = (req: Request, res: Response, next: NextFunction) => {
  res.status(404).json({
    code: 404,
    message: '请求的资源不存在',
    path: req.path
  });
};

// 全局错误处理
export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error('服务器错误:', err);

  // 判断错误类型
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      code: 400,
      message: '数据验证失败',
      errors: err.errors
    });
  }

  if (err.name === 'UnauthorizedError') {
    return res.status(401).json({
      code: 401,
      message: '未授权访问'
    });
  }

  if (err.code === 'ER_DUP_ENTRY') {
    return res.status(409).json({
      code: 409,
      message: '数据已存在'
    });
  }

  // 默认错误
  res.status(err.statusCode || 500).json({
    code: err.statusCode || 500,
    message: err.message || '服务器内部错误',
    error: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
};















