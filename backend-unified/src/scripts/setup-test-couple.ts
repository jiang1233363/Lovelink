import { pool } from '../config/database';

async function setupTestCouple() {
  try {
    console.log('🔄 开始设置测试用户配对关系...\n');

    // 1. 获取前两个用户（假设是测试用户）
    const [users] = await pool.execute(
      'SELECT id, username, couple_id FROM users ORDER BY id LIMIT 2'
    ) as any[];

    if (users.length < 2) {
      console.log('❌ 数据库中用户不足2个');
      process.exit(1);
    }

    console.log('✅ 找到用户:');
    users.forEach((u: any) => {
      console.log(`   - ${u.username} (ID: ${u.id}, couple_id: ${u.couple_id || '无'})`);
    });

    const user1 = users[0];
    const user2 = users[1];

    // 2. 检查是否已有配对关系
    const [existingCouples] = await pool.execute(
      'SELECT id FROM couples WHERE (user1_id = ? AND user2_id = ?) OR (user1_id = ? AND user2_id = ?)',
      [user1.id, user2.id, user2.id, user1.id]
    ) as any[];

    let coupleId;

    if (existingCouples.length > 0) {
      coupleId = existingCouples[0].id;
      console.log(`\n✅ 配对关系已存在 (couple_id: ${coupleId})`);
    } else {
      // 3. 创建配对关系
      const [result] = await pool.execute(
        'INSERT INTO couples (user1_id, user2_id, relationship_start_date) VALUES (?, ?, ?)',
        [user1.id, user2.id, '2024-01-01']
      ) as any[];

      coupleId = result.insertId;
      console.log(`\n✅ 创建配对关系成功 (couple_id: ${coupleId})`);
    }

    // 4. 更新用户的couple_id
    await pool.execute(
      'UPDATE users SET couple_id = ? WHERE id IN (?, ?)',
      [coupleId, user1.id, user2.id]
    );

    console.log('✅ 更新用户couple_id成功');

    // 5. 显示最终结果
    const [finalUsers] = await pool.execute(
      `SELECT 
        u.id, 
        u.username, 
        u.couple_id,
        c.user1_id,
        c.user2_id,
        c.relationship_start_date
      FROM users u
      LEFT JOIN couples c ON u.couple_id = c.id
      WHERE u.id IN (?, ?)`,
      [user1.id, user2.id]
    ) as any[];

    console.log('\n✅ 配对设置完成！最终状态:');
    console.log('='.repeat(80));
    finalUsers.forEach((u: any) => {
      console.log(`用户: ${u.username} (ID: ${u.id})`);
      console.log(`  couple_id: ${u.couple_id}`);
      console.log(`  配对用户: ${u.user1_id === u.id ? u.user2_id : u.user1_id}`);
      console.log(`  关系开始日期: ${u.relationship_start_date}`);
      console.log('-'.repeat(80));
    });

    console.log('\n🎉 现在可以使用test1和test2进行聊天测试了！');
    console.log('   请重新登录以获取最新的partner_id信息。\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ 设置失败:', error);
    process.exit(1);
  }
}

setupTestCouple();

