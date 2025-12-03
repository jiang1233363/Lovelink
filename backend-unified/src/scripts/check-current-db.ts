import { pool } from '../config/database';

async function checkCurrentDB() {
  try {
    console.log('🔍 检查当前数据库信息...\n');

    // 获取当前数据库名
    const [dbResult] = await pool.execute('SELECT DATABASE() as db') as any[];
    const currentDB = dbResult[0].db;
    console.log(`当前数据库: ${currentDB}\n`);

    // 获取所有表
    const [tables] = await pool.execute('SHOW TABLES') as any[];
    
    if (tables.length === 0) {
      console.log('❌ 当前数据库中没有表！');
    } else {
      console.log(`✅ 找到 ${tables.length} 个表:\n`);
      for (const table of tables) {
        const tableName = Object.values(table)[0] as string;
        const [countResult] = await pool.execute(
          `SELECT COUNT(*) as count FROM \`${tableName}\``
        ) as any[];
        console.log(`  ${tableName.padEnd(25)} - ${countResult[0].count} 条记录`);
      }
    }

    console.log('\n');
    process.exit(0);
  } catch (error) {
    console.error('❌ 检查失败:', error);
    process.exit(1);
  }
}

checkCurrentDB();












