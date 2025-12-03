const mysql = require('mysql2/promise');

async function createTables() {
  const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '123456',
    database: 'lovelink_db',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
  });

  try {
    console.log('📦 正在创建缺失的数据库表...');
    
    // 1. 创建location_shares表
    try {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS location_shares (
          id INT PRIMARY KEY AUTO_INCREMENT,
          user_id INT NOT NULL,
          couple_id INT NOT NULL,
          latitude DECIMAL(10, 8) NOT NULL,
          longitude DECIMAL(11, 8) NOT NULL,
          address VARCHAR(255) DEFAULT NULL,
          accuracy DECIMAL(10, 2) DEFAULT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          INDEX idx_user (user_id),
          INDEX idx_couple (couple_id),
          INDEX idx_created (created_at)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);
      console.log('✅ location_shares表创建成功');
    } catch (e) {
      console.log('⚠️  location_shares表已存在');
    }
    
    // 2. 创建fireman_tasks表
    try {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS fireman_tasks (
          id INT PRIMARY KEY AUTO_INCREMENT,
          couple_id INT NOT NULL,
          reporter_id INT NOT NULL,
          resolver_id INT DEFAULT NULL,
          description TEXT DEFAULT NULL,
          solution TEXT DEFAULT NULL,
          severity ENUM('low', 'medium', 'high') DEFAULT 'medium',
          resolved_at TIMESTAMP NULL DEFAULT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          INDEX idx_couple (couple_id),
          INDEX idx_resolved (resolved_at)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);
      console.log('✅ fireman_tasks表创建成功');
    } catch (e) {
      console.log('⚠️  fireman_tasks表已存在');
    }
    
    // 3. 确保nest_shop_items表有type列
    try {
      await pool.query(`
        ALTER TABLE nest_shop_items 
        ADD COLUMN type ENUM('wallpaper', 'floor', 'furniture', 'decoration') DEFAULT 'decoration' AFTER icon
      `);
      console.log('✅ nest_shop_items表type列添加成功');
    } catch (e) {
      console.log('⚠️  nest_shop_items表type列已存在');
    }
    
    // 4. 插入默认商店物品
    try {
      await pool.query(`
        INSERT IGNORE INTO nest_shop_items (id, name, icon, type, price, description) VALUES
        (1, '粉色渐变墙纸', '🎨', 'wallpaper', 100, '温馨的粉色渐变墙纸'),
        (2, '星空主题墙纸', '🌌', 'wallpaper', 200, '浪漫的星空主题'),
        (3, '木质地板', '🪵', 'floor', 150, '温暖的木质地板'),
        (4, '沙发', '🛋️', 'furniture', 300, '舒适的双人沙发'),
        (5, '盆栽', '🪴', 'decoration', 80, '清新的绿植')
      `);
      console.log('✅ 默认商店物品插入成功');
    } catch (e) {
      console.log('⚠️  默认商店物品已存在');
    }
    
    console.log('\n✅ 所有表和数据初始化完成！');
    
  } catch (error) {
    console.error('❌ 创建表失败:', error.message);
  } finally {
    await pool.end();
  }
}

createTables();

