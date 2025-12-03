// 示例数据种子文件
import { pool } from '../config/database';
import bcrypt from 'bcryptjs';

async function seedDatabase() {
  try {
    console.log('🌱 开始填充示例数据...');

    // 1. 创建示例用户
    console.log('创建示例用户...');
    const hashedPassword = await bcrypt.hash('123456', 10);
    
    const [user1] = await pool.execute(
      'INSERT INTO users (username, password, email) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE id=id',
      ['小明', hashedPassword, 'xiaoming@example.com']
    ) as any[];

    const [user2] = await pool.execute(
      'INSERT INTO users (username, password, email) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE id=id',
      ['小红', hashedPassword, 'xiaohong@example.com']
    ) as any[];

    console.log('✅ 示例用户创建完成');
    console.log('   用户名: 小明 / 小红');
    console.log('   密码: 123456');

    // 2. 创建情侣关系
    console.log('\n创建情侣关系...');
    const [couple] = await pool.execute(
      'INSERT INTO couples (user1_id, user2_id, relationship_start_date) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE id=id',
      [user1.insertId || 1, user2.insertId || 2, '2024-01-01']
    ) as any[];

    const coupleId = couple.insertId || 1;

    // 更新用户的 couple_id
    await pool.execute('UPDATE users SET couple_id = ? WHERE id IN (?, ?)', [coupleId, user1.insertId || 1, user2.insertId || 2]);
    
    console.log('✅ 情侣关系创建完成');

    // 3. 创建示例日记
    console.log('\n创建示例数据...');
    await pool.execute(
      'INSERT INTO diaries (couple_id, user_id, title, content, mood) VALUES (?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE id=id',
      [coupleId, user1.insertId || 1, '今天的美好', '今天我们一起去了公园，天气很好，心情也很好！', 'happy']
    );

    // 4. 创建示例回忆
    await pool.execute(
      'INSERT INTO memories (couple_id, user_id, title, content, memory_date) VALUES (?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE id=id',
      [coupleId, user1.insertId || 1, '第一次约会', '在咖啡厅第一次见面，很紧张但也很开心', '2024-01-15']
    );

    // 5. 创建示例心动任务
    const today = new Date().toISOString().split('T')[0];
    await pool.execute(
      'INSERT INTO heartbeat_tasks (task_date, task_content, task_reward) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE id=id',
      [today, '给TA一个大大的拥抱', 10]
    );

    console.log('✅ 示例数据创建完成');

    console.log('\n========================================');
    console.log('🎉 数据库填充完成！');
    console.log('========================================');
    console.log('\n📝 测试账号信息：');
    console.log('   账号1: 小明 / 123456');
    console.log('   账号2: 小红 / 123456');
    console.log('\n现在可以使用这些账号登录测试！');
    console.log('========================================\n');

  } catch (error) {
    console.error('❌ 填充数据失败:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

// 执行
seedDatabase().catch(console.error);















