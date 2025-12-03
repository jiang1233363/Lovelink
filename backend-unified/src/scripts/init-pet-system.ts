import { pool } from '../config/database';

async function initPetSystem() {
  try {
    console.log('🐾 初始化宠物系统...\n');
    
    // 创建宠物表
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS couple_pets (
        id INT PRIMARY KEY AUTO_INCREMENT,
        couple_id INT NOT NULL,
        pet_type VARCHAR(50) NOT NULL COMMENT '宠物类型：cat, dog, rabbit等',
        pet_name VARCHAR(100) NOT NULL COMMENT '宠物名字',
        level INT DEFAULT 1 COMMENT '宠物等级',
        experience INT DEFAULT 0 COMMENT '经验值',
        happiness INT DEFAULT 100 COMMENT '快乐度 0-100',
        hunger INT DEFAULT 50 COMMENT '饥饿度 0-100',
        last_fed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '最后喂食时间',
        last_played_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '最后互动时间',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_couple (couple_id),
        FOREIGN KEY (couple_id) REFERENCES couples(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ couple_pets 表创建成功');
    
    // 创建宠物类型表
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS pet_types (
        id INT PRIMARY KEY AUTO_INCREMENT,
        pet_type VARCHAR(50) NOT NULL UNIQUE,
        display_name VARCHAR(100) NOT NULL,
        icon VARCHAR(100) NOT NULL COMMENT 'Emoji图标',
        description VARCHAR(500) DEFAULT NULL,
        unlock_cost INT DEFAULT 0 COMMENT '解锁花费（火花值）'
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ pet_types 表创建成功');
    
    // 插入默认宠物类型
    await pool.execute(`
      INSERT IGNORE INTO pet_types (pet_type, display_name, icon, description, unlock_cost) VALUES
      ('cat', '可爱小猫', '🐱', '温柔可爱的小猫咪，喜欢被抚摸', 0),
      ('dog', '忠诚小狗', '🐶', '活泼忠诚的小狗，喜欢陪你玩耍', 0),
      ('rabbit', '软萌兔子', '🐰', '蹦蹦跳跳的小兔子，超级可爱', 50),
      ('hamster', '仓鼠宝宝', '🐹', '小小的仓鼠，喜欢囤食物', 50),
      ('bird', '快乐小鸟', '🐦', '会唱歌的小鸟，每天都很开心', 100),
      ('fish', '游泳小鱼', '🐠', '在水里游来游去的小鱼', 30),
      ('panda', '熊猫宝宝', '🐼', '憨态可掬的小熊猫', 200),
      ('penguin', '企鹅朋友', '🐧', '摇摇摆摆的小企鹅', 150)
    `);
    console.log('✅ 插入默认宠物类型');
    
    // 创建宠物物品表
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS pet_items (
        id INT PRIMARY KEY AUTO_INCREMENT,
        item_name VARCHAR(100) NOT NULL,
        item_type ENUM('food', 'toy', 'accessory') NOT NULL,
        icon VARCHAR(100) NOT NULL,
        description VARCHAR(500) DEFAULT NULL,
        effect_type VARCHAR(50) COMMENT '效果类型：happiness, hunger等',
        effect_value INT COMMENT '效果值',
        price INT NOT NULL COMMENT '火花值价格',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ pet_items 表创建成功');
    
    // 插入宠物物品
    await pool.execute(`
      INSERT IGNORE INTO pet_items (item_name, item_type, icon, description, effect_type, effect_value, price) VALUES
      ('小鱼干', 'food', '🐟', '宠物最爱的小鱼干', 'hunger', -30, 10),
      ('狗粮', 'food', '🦴', '营养丰富的狗粮', 'hunger', -40, 15),
      ('胡萝卜', 'food', '🥕', '新鲜的胡萝卜', 'hunger', -25, 8),
      ('牛奶', 'food', '🥛', '香浓的牛奶', 'hunger', -20, 12),
      ('皮球', 'toy', '⚽', '可以滚来滚去的皮球', 'happiness', 20, 20),
      ('羽毛玩具', 'toy', '🪶', '能引起宠物兴趣的羽毛', 'happiness', 25, 25),
      ('玩具老鼠', 'toy', '🐭', '会动的玩具老鼠', 'happiness', 30, 30),
      ('飞盘', 'toy', '🥏', '可以飞很远的飞盘', 'happiness', 35, 35),
      ('蝴蝶结', 'accessory', '🎀', '漂亮的蝴蝶结', 'happiness', 10, 15),
      ('项圈', 'accessory', '🎗️', '时尚的项圈', 'happiness', 10, 18)
    `);
    console.log('✅ 插入宠物物品');
    
    // 统计
    const [petTypes] = await pool.execute('SELECT COUNT(*) as count FROM pet_types') as any[];
    const [petItems] = await pool.execute('SELECT COUNT(*) as count FROM pet_items') as any[];
    
    console.log(`\n📊 统计信息:`);
    console.log(`   宠物类型: ${petTypes[0].count} 种`);
    console.log(`   宠物物品: ${petItems[0].count} 个`);
    console.log('\n✅ 宠物系统初始化完成！');
    
  } catch (error) {
    console.error('❌ 初始化失败:', error);
  } finally {
    process.exit(0);
  }
}

initPetSystem();

