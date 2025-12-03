import { pool } from '../config/database';

async function checkTables() {
  try {
    console.log('🔍 检查数据库表...\n');

    const tables = [
      'users',
      'couples',
      'diaries',
      'memories',
      'albums',
      'album_photos',
      'account_book',
      'chat_messages',
      'calendar_events',
      'qa_records'
    ];

    for (const table of tables) {
      const [rows] = await pool.execute(
        `SELECT COUNT(*) as count FROM information_schema.tables 
         WHERE table_schema = 'lovelink' AND table_name = ?`,
        [table]
      ) as any[];

      const exists = rows[0].count > 0;
      const status = exists ? '✅' : '❌';
      
      if (exists) {
        const [countResult] = await pool.execute(
          `SELECT COUNT(*) as count FROM ${table}`
        ) as any[];
        console.log(`${status} ${table.padEnd(20)} - ${countResult[0].count} 条记录`);
      } else {
        console.log(`${status} ${table.padEnd(20)} - 表不存在！`);
      }
    }

    console.log('\n');
    process.exit(0);
  } catch (error) {
    console.error('❌ 检查失败:', error);
    process.exit(1);
  }
}

checkTables();












