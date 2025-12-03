import { pool } from '../config/database';

async function migrateCoupleData() {
  try {
    console.log('🔧 迁移couple_id=4的所有数据到couple_id=1...\n');
    
    // 1. 检查并更新 diaries 表
    console.log('1️⃣ 检查 diaries 表...');
    const [diaries] = await pool.execute(
      'SELECT COUNT(*) as count FROM diaries WHERE couple_id = 4'
    ) as any[];
    console.log(`   找到 ${diaries[0].count} 条日记记录`);
    if (diaries[0].count > 0) {
      await pool.execute('UPDATE diaries SET couple_id = 1 WHERE couple_id = 4');
      console.log('   ✅ 已更新');
    }
    
    // 2. 检查并更新 chat_messages 表
    console.log('\n2️⃣ 检查 chat_messages 表...');
    const [messages] = await pool.execute(
      'SELECT COUNT(*) as count FROM chat_messages WHERE couple_id = 4'
    ) as any[];
    console.log(`   找到 ${messages[0].count} 条聊天记录`);
    if (messages[0].count > 0) {
      await pool.execute('UPDATE chat_messages SET couple_id = 1 WHERE couple_id = 4');
      console.log('   ✅ 已更新');
    }
    
    // 3. 检查并更新 memories 表
    console.log('\n3️⃣ 检查 memories 表...');
    const [memories] = await pool.execute(
      'SELECT COUNT(*) as count FROM memories WHERE couple_id = 4'
    ) as any[];
    console.log(`   找到 ${memories[0].count} 条美好回忆记录`);
    if (memories[0].count > 0) {
      await pool.execute('UPDATE memories SET couple_id = 1 WHERE couple_id = 4');
      console.log('   ✅ 已更新');
    }
    
    // 4. 检查并更新 qas 表
    console.log('\n4️⃣ 检查 qas 表...');
    const [qas] = await pool.execute(
      'SELECT COUNT(*) as count FROM qas WHERE couple_id = 4'
    ) as any[];
    console.log(`   找到 ${qas[0].count} 条情侣问答记录`);
    if (qas[0].count > 0) {
      await pool.execute('UPDATE qas SET couple_id = 1 WHERE couple_id = 4');
      console.log('   ✅ 已更新');
    }
    
    // 5. 检查并更新 fireman_tasks 表
    console.log('\n5️⃣ 检查 fireman_tasks 表...');
    const [firemanTasks] = await pool.execute(
      'SELECT COUNT(*) as count FROM fireman_tasks WHERE couple_id = 4'
    ) as any[];
    console.log(`   找到 ${firemanTasks[0].count} 条消防员记录`);
    if (firemanTasks[0].count > 0) {
      await pool.execute('UPDATE fireman_tasks SET couple_id = 1 WHERE couple_id = 4');
      console.log('   ✅ 已更新');
    }
    
    // 6. 检查并更新 fireman_notifications 表
    console.log('\n6️⃣ 检查 fireman_notifications 表...');
    const [firemanNotifs] = await pool.execute(
      'SELECT COUNT(*) as count FROM fireman_notifications WHERE couple_id = 4'
    ) as any[];
    console.log(`   找到 ${firemanNotifs[0].count} 条消防员通知记录`);
    if (firemanNotifs[0].count > 0) {
      await pool.execute('UPDATE fireman_notifications SET couple_id = 1 WHERE couple_id = 4');
      console.log('   ✅ 已更新');
    }
    
    // 7. 检查并更新 heartbeat_checkins 表
    console.log('\n7️⃣ 检查 heartbeat_checkins 表...');
    const [heartbeat] = await pool.execute(
      'SELECT COUNT(*) as count FROM heartbeat_checkins WHERE couple_id = 4'
    ) as any[];
    console.log(`   找到 ${heartbeat[0].count} 条心动计划记录`);
    if (heartbeat[0].count > 0) {
      await pool.execute('UPDATE heartbeat_checkins SET couple_id = 1 WHERE couple_id = 4');
      console.log('   ✅ 已更新');
    }
    
    // 8. 检查并更新 albums 表
    console.log('\n8️⃣ 检查 albums 表...');
    try {
      const [albums] = await pool.execute(
        'SELECT COUNT(*) as count FROM albums WHERE couple_id = 4'
      ) as any[];
      console.log(`   找到 ${albums[0].count} 条相册记录`);
      if (albums[0].count > 0) {
        await pool.execute('UPDATE albums SET couple_id = 1 WHERE couple_id = 4');
        console.log('   ✅ 已更新');
      }
    } catch (e) {
      console.log('   ⚠️ albums 表可能不存在');
    }
    
    // 9. 检查并更新 account_books 表
    console.log('\n9️⃣ 检查 account_books 表...');
    try {
      const [accountBooks] = await pool.execute(
        'SELECT COUNT(*) as count FROM account_books WHERE couple_id = 4'
      ) as any[];
      console.log(`   找到 ${accountBooks[0].count} 条账本记录`);
      if (accountBooks[0].count > 0) {
        await pool.execute('UPDATE account_books SET couple_id = 1 WHERE couple_id = 4');
        console.log('   ✅ 已更新');
      }
    } catch (e) {
      console.log('   ⚠️ account_books 表可能不存在');
    }
    
    // 10. 检查并更新 calendar_events 表
    console.log('\n🔟 检查 calendar_events 表...');
    try {
      const [events] = await pool.execute(
        'SELECT COUNT(*) as count FROM calendar_events WHERE couple_id = 4'
      ) as any[];
      console.log(`   找到 ${events[0].count} 条日历事件记录`);
      if (events[0].count > 0) {
        await pool.execute('UPDATE calendar_events SET couple_id = 1 WHERE couple_id = 4');
        console.log('   ✅ 已更新');
      }
    } catch (e) {
      console.log('   ⚠️ calendar_events 表可能不存在');
    }
    
    // 11. 检查并更新 locations 表
    console.log('\n1️⃣1️⃣ 检查 locations 表...');
    try {
      const [locations] = await pool.execute(
        'SELECT COUNT(*) as count FROM locations WHERE couple_id = 4'
      ) as any[];
      console.log(`   找到 ${locations[0].count} 条位置记录`);
      if (locations[0].count > 0) {
        await pool.execute('UPDATE locations SET couple_id = 1 WHERE couple_id = 4');
        console.log('   ✅ 已更新');
      }
    } catch (e) {
      console.log('   ⚠️ locations 表可能不存在');
    }
    
    // 12. 检查并更新 moods 表
    console.log('\n1️⃣2️⃣ 检查 moods 表...');
    try {
      const [moods] = await pool.execute(
        'SELECT COUNT(*) as count FROM moods WHERE couple_id = 4'
      ) as any[];
      console.log(`   找到 ${moods[0].count} 条心情记录`);
      if (moods[0].count > 0) {
        await pool.execute('UPDATE moods SET couple_id = 1 WHERE couple_id = 4');
        console.log('   ✅ 已更新');
      }
    } catch (e) {
      console.log('   ⚠️ moods 表可能不存在');
    }
    
    console.log('\n✅ 数据迁移完成！');
    console.log('\n验证结果...');
    
    // 验证 couple_id=4 是否还有数据
    const tables = [
      'diaries', 'chat_messages', 'memories', 'qas', 
      'fireman_tasks', 'fireman_notifications', 'heartbeat_checkins'
    ];
    
    for (const table of tables) {
      const [rows] = await pool.execute(
        `SELECT COUNT(*) as count FROM ${table} WHERE couple_id = 4`
      ) as any[];
      console.log(`   ${table}: ${rows[0].count} 条记录 (应该为0)`);
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ 错误:', error);
    process.exit(1);
  }
}

migrateCoupleData();


