import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthRequest extends Request {
  userId?: string;
  coupleId?: string;
}

export const authMiddleware = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        code: 401,
        message: '未提供认证令牌'
      });
    }

    const secret = process.env.JWT_SECRET || 'lovelink_secret_key';
    const decoded = jwt.verify(token, secret) as any;
    
    // 确保userId和coupleId都是数字类型
    req.userId = decoded.userId ? Number(decoded.userId) : decoded.userId;
    req.coupleId = decoded.coupleId ? Number(decoded.coupleId) : decoded.coupleId;
    
    console.log('[AUTH] Token解析:', {
      userId: decoded.userId,
      coupleId: decoded.coupleId,
      coupleIdType: typeof decoded.coupleId,
      转换后: req.coupleId,
      转换后类型: typeof req.coupleId
    });
    
    next();
  } catch (error) {
    return res.status(401).json({
      code: 401,
      message: '认证失败，令牌无效'
    });
  }
};

export const generateToken = (userId: string, coupleId: string): string => {
  const secret = process.env.JWT_SECRET || 'lovelink_secret_key';
  const expiresIn: string = process.env.JWT_EXPIRES_IN || '7d';
  
  return jwt.sign(
    { userId, coupleId },
    secret,
    { expiresIn: expiresIn as any }
  );
};

