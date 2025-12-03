import { pool } from '../config/database';

async function checkUsers() {
  try {
    console.log('🔍 检查当前数据库中的用户...\n');

    const [users] = await pool.execute(
      'SELECT id, username, couple_id FROM users ORDER BY id'
    ) as any[];

    if (users.length === 0) {
      console.log('❌ 数据库中没有用户');
    } else {
      console.log(`✅ 找到 ${users.length} 个用户:\n`);
      users.forEach((u: any) => {
        console.log(`  ID: ${u.id} | 用户名: ${u.username} | couple_id: ${u.couple_id || '无'}`);
      });
    }

    console.log('\n');
    process.exit(0);
  } catch (error) {
    console.error('❌ 查询失败:', error);
    process.exit(1);
  }
}

checkUsers();












