import fs from 'fs';
import path from 'path';

// 文件工具函数

export class FileHelper {
  // 确保目录存在
  static ensureDir(dirPath: string): void {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
  }

  // 删除文件
  static deleteFile(filePath: string): boolean {
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        return true;
      }
      return false;
    } catch (error) {
      console.error('删除文件失败:', error);
      return false;
    }
  }

  // 获取文件扩展名
  static getExtension(filename: string): string {
    return path.extname(filename).toLowerCase();
  }

  // 生成唯一文件名
  static generateFilename(originalName: string): string {
    const ext = this.getExtension(originalName);
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(7);
    return `${timestamp}-${random}${ext}`;
  }

  // 检查是否是图片
  static isImage(filename: string): boolean {
    const ext = this.getExtension(filename);
    return ['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(ext);
  }

  // 检查是否是视频
  static isVideo(filename: string): boolean {
    const ext = this.getExtension(filename);
    return ['.mp4', '.avi', '.mov', '.wmv', '.flv'].includes(ext);
  }

  // 获取文件大小（字节）
  static getFileSize(filePath: string): number {
    try {
      const stats = fs.statSync(filePath);
      return stats.size;
    } catch (error) {
      return 0;
    }
  }

  // 格式化文件大小
  static formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  }

  // 清理旧文件（删除N天前的文件）
  static cleanOldFiles(dirPath: string, days: number = 30): number {
    let deletedCount = 0;
    
    try {
      const files = fs.readdirSync(dirPath);
      const now = Date.now();
      const maxAge = days * 24 * 60 * 60 * 1000;

      for (const file of files) {
        const filePath = path.join(dirPath, file);
        const stats = fs.statSync(filePath);
        
        if (now - stats.mtimeMs > maxAge) {
          this.deleteFile(filePath);
          deletedCount++;
        }
      }
    } catch (error) {
      console.error('清理文件失败:', error);
    }

    return deletedCount;
  }
}















