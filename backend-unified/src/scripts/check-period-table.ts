import { pool } from '../config/database';

async function checkPeriodTable() {
  try {
    console.log('检查 period_records 表...\n');
    
    // 检查表是否存在
    const [tables] = await pool.execute(
      "SHOW TABLES LIKE 'period_records'"
    ) as any[];
    
    if (tables.length === 0) {
      console.log('❌ period_records 表不存在！');
      console.log('\n正在创建表...\n');
      
      await pool.execute(`
        CREATE TABLE IF NOT EXISTS period_records (
          id INT PRIMARY KEY AUTO_INCREMENT,
          user_id INT NOT NULL,
          start_date DATE NOT NULL,
          end_date DATE DEFAULT NULL,
          cycle_length INT DEFAULT 28 COMMENT '周期长度（天）',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          INDEX idx_user (user_id),
          INDEX idx_start_date (start_date),
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);
      
      console.log('✅ period_records 表创建成功！');
    } else {
      console.log('✅ period_records 表已存在');
    }
    
    // 查看表结构
    const [structure] = await pool.execute(
      'DESC period_records'
    ) as any[];
    
    console.log('\n表结构:');
    console.table(structure);
    
    // 检查是否有数据
    const [count] = await pool.execute(
      'SELECT COUNT(*) as count FROM period_records'
    ) as any[];
    
    console.log(`\n记录数: ${count[0].count}`);
    
  } catch (error) {
    console.error('检查失败:', error);
  } finally {
    process.exit(0);
  }
}

checkPeriodTable();








