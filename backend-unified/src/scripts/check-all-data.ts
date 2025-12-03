import { pool } from '../config/database';

async function checkAllData() {
  try {
    console.log('🔍 检查 couple_id=1 的所有数据...\n');
    
    const tables = [
      'diaries',
      'chat_messages', 
      'memories',
      'qas',
      'fireman_tasks',
      'fireman_notifications',
      'heartbeat_checkins',
      'albums',
      'calendar_events',
      'moods'
    ];
    
    for (const table of tables) {
      try {
        const [rows] = await pool.execute(
          `SELECT COUNT(*) as count FROM ${table} WHERE couple_id = 1`
        ) as any[];
        console.log(`   ${table}: ${rows[0].count} 条记录`);
      } catch (e) {
        console.log(`   ${table}: ⚠️ 表不存在或查询失败`);
      }
    }
    
    // 检查小明和小红的具体数据
    console.log('\n🔍 检查小明和小红作为创建者的数据...\n');
    
    // 日记
    const [diaries] = await pool.execute(
      'SELECT COUNT(*) as count FROM diaries WHERE user_id IN (1, 2)'
    ) as any[];
    console.log(`   diaries (user_id 1或2): ${diaries[0].count} 条`);
    
    // 聊天消息
    const [messages] = await pool.execute(
      'SELECT COUNT(*) as count FROM chat_messages WHERE sender_id IN (1, 2) OR receiver_id IN (1, 2)'
    ) as any[];
    console.log(`   chat_messages (sender/receiver 1或2): ${messages[0].count} 条`);
    
    // 美好回忆
    const [memories] = await pool.execute(
      'SELECT COUNT(*) as count FROM memories WHERE user_id IN (1, 2)'
    ) as any[];
    console.log(`   memories (user_id 1或2): ${memories[0].count} 条`);
    
    // 问答
    const [qas] = await pool.execute(
      'SELECT COUNT(*) as count FROM qas WHERE creator_id IN (1, 2)'
    ) as any[];
    console.log(`   qas (creator_id 1或2): ${qas[0].count} 条`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ 错误:', error);
    process.exit(1);
  }
}

checkAllData();


