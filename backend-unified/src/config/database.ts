import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

// 数据库连接池配置
const poolConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306'),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'lovelink_db',
  waitForConnections: true,
  connectionLimit: 100,  // 增加到100以支持高并发
  queueLimit: 0,
  maxIdle: 50,  // 最大空闲连接数
  idleTimeout: 60000,  // 空闲连接超时（60秒）
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
};

// 创建连接池
export const pool = mysql.createPool(poolConfig);

// 测试数据库连接
export async function testConnection() {
  try {
    const connection = await pool.getConnection();
    console.log('✅ 数据库连接成功');
    connection.release();
    return true;
  } catch (error) {
    console.error('❌ 数据库连接失败:', error);
    return false;
  }
}

// 执行查询
export async function query(sql: string, params?: any[]) {
  try {
    const [results] = await pool.execute(sql, params);
    return results;
  } catch (error) {
    console.error('数据库查询错误:', error);
    throw error;
  }
}

export default pool;















