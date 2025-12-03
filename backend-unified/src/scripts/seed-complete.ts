import { pool } from '../config/database';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

const seedDatabase = async () => {
  try {
    console.log('🚀 开始填充完整测试数据...\n');

    // 创建用户
    console.log('1️⃣  创建测试用户...');
    const hashedPassword = await bcrypt.hash('123456', 10);

    const [user1Result] = await pool.execute(
      'INSERT INTO users (username, password, avatar, gender, birthday, location) VALUES (?, ?, ?, ?, ?, ?)',
      ['小明', hashedPassword, '/static/avatar-male.png', 'male', '1995-05-20', '武汉市']
    ) as any[];
    const userId1 = user1Result.insertId;

    const [user2Result] = await pool.execute(
      'INSERT INTO users (username, password, avatar, gender, birthday, location) VALUES (?, ?, ?, ?, ?, ?)',
      ['小红', hashedPassword, '/static/avatar-female.png', 'female', '1997-08-15', '武汉市']
    ) as any[];
    const userId2 = user2Result.insertId;

    console.log(`   ✅ 用户创建成功 - 小明 (ID: ${userId1}), 小红 (ID: ${userId2})`);
    console.log(`   📝 测试账号: 小明/123456 或 小红/123456\n`);

    // 创建情侣关系
    console.log('2️⃣  创建情侣关系...');
    const relationshipStartDate = '2024-01-01';
    const [coupleResult] = await pool.execute(
      'INSERT INTO couples (user1_id, user2_id, relationship_start_date) VALUES (?, ?, ?)',
      [userId1, userId2, relationshipStartDate]
    ) as any[];
    const coupleId = coupleResult.insertId;

    await pool.execute('UPDATE users SET couple_id = ? WHERE id IN (?, ?)', [coupleId, userId1, userId2]);
    console.log(`   ✅ 情侣关系创建成功 (ID: ${coupleId})\n`);

    // 填充日记数据
    console.log('3️⃣  填充心情日记...');
    const diaries = [
      ['第一次约会', '今天和小红去了东湖，天气很好，我们一起骑车、拍照，很开心！', 'happy', userId1],
      ['收到小明送的花', '小明今天送了我一束玫瑰，好惊喜！他说这是我们在一起的第7天纪念', 'loved', userId2],
      ['一起做饭', '今天第一次一起做饭，虽然厨艺不佳但很温馨', 'excited', userId1],
      ['看电影', '晚上一起去看了电影，牵手的那一刻好心动', 'loved', userId2],
      ['加班的一天', '今天加班到很晚，但收到了小红的关心短信', 'calm', userId1]
    ];

    for (const [title, content, mood, userId] of diaries) {
      await pool.execute(
        'INSERT INTO diaries (couple_id, user_id, title, content, mood, created_at) VALUES (?, ?, ?, ?, ?, DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 30) DAY))',
        [coupleId, userId, title, content, mood]
      );
    }
    console.log(`   ✅ 已添加 ${diaries.length} 篇日记\n`);

    // 填充回忆数据
    console.log('4️⃣  填充回忆墙...');
    const memories = [
      ['我们的第一次旅行', '去了三亚，海边的日落太美了', '2024-02-14'],
      ['第一次牵手', '在公园的长椅上，紧张又甜蜜', '2024-01-07'],
      ['一起过生日', '给小红准备了惊喜生日派对', '2024-08-15']
    ];

    for (const [title, content, memoryDate] of memories) {
      await pool.execute(
        'INSERT INTO memories (couple_id, user_id, title, content, memory_date) VALUES (?, ?, ?, ?, ?)',
        [coupleId, userId1, title, content, memoryDate]
      );
    }
    console.log(`   ✅ 已添加 ${memories.length} 条回忆\n`);

    // 填充相册数据
    console.log('5️⃣  填充智能纪念册...');
    await pool.execute(
      'INSERT INTO albums (couple_id, user_id, title, description) VALUES (?, ?, ?, ?)',
      [coupleId, userId1, '我们的2024', '记录这一年的美好瞬间']
    );
    console.log(`   ✅ 已创建1个相册\n`);

    // 填充账本数据
    console.log('6️⃣  填充共同账本...');
    const accountRecords = [
      ['expense', '餐饮', 158.50, '和小红吃火锅', userId1],
      ['expense', '交通', 50.00, '打车去看电影', userId2],
      ['expense', '娱乐', 200.00, '电影票和零食', userId1],
      ['income', '其他', 500.00, '小红给的生活费', userId1],
      ['expense', '购物', 399.00, '买了情侣装', userId2]
    ];

    for (const [type, category, amount, description, userId] of accountRecords) {
      await pool.execute(
        'INSERT INTO account_book (couple_id, user_id, type, category, amount, description, transaction_date) VALUES (?, ?, ?, ?, ?, ?, DATE_SUB(CURDATE(), INTERVAL FLOOR(RAND() * 30) DAY))',
        [coupleId, userId, type, category, amount, description]
      );
    }
    console.log(`   ✅ 已添加 ${accountRecords.length} 条账单记录\n`);

    // 填充日程数据
    console.log('7️⃣  填充情侣日程...');
    const events = [
      ['周末约会', '去江汉路逛街', '2025-11-08'],
      ['看演唱会', '陈奕迅演唱会', '2025-11-15'],
      ['纪念日', '我们在一起365天了！', '2025-01-01']
    ];

    for (const [title, description, eventDate] of events) {
      await pool.execute(
        'INSERT INTO calendar_events (couple_id, user_id, title, description, event_date) VALUES (?, ?, ?, ?, ?)',
        [coupleId, userId1, title, description, eventDate]
      );
    }
    console.log(`   ✅ 已添加 ${events.length} 个日程\n`);

    // 填充问答数据
    console.log('8️⃣  填充问答系统...');
    const qas = [
      ['你最喜欢我的哪一点？', '你的笑容', '你的温柔'],
      ['理想的约会是什么样的？', '一起看日落', '一起做饭'],
      ['对未来有什么期待？', '一直在一起', '组建家庭']
    ];

    for (const [question, answer1, answer2] of qas) {
      await pool.execute(
        'INSERT INTO qas (couple_id, question, user1_answer, user2_answer) VALUES (?, ?, ?, ?)',
        [coupleId, question, answer1, answer2]
      );
    }
    console.log(`   ✅ 已添加 ${qas.length} 个问答\n`);

    // 填充心动计划打卡
    console.log('9️⃣  填充365心动计划...');
    for (let i = 1; i <= 10; i++) {
      await pool.execute(
        'INSERT INTO heartbeat_checkins (couple_id, user_id, check_date, day_number, task_content, task_reward) VALUES (?, ?, DATE_SUB(CURDATE(), INTERVAL ? DAY), ?, ?, ?)',
        [coupleId, i % 2 === 0 ? userId1 : userId2, 10 - i, i, `第${i}天的任务`, 10]
      );
    }
    console.log(`   ✅ 已添加10条打卡记录\n`);

    // 解锁成就
    console.log('🔟  解锁成就...');
    await pool.execute(
      'INSERT INTO user_achievements (couple_id, achievement_id) VALUES (?, 1), (?, 2)',
      [coupleId, coupleId]
    );
    console.log(`   ✅ 已解锁2个成就\n`);

    // 创建小窝
    console.log('1️⃣1️⃣  初始化情侣小窝...');
    await pool.execute(
      'INSERT INTO couple_nest (couple_id, level, experience) VALUES (?, ?, ?)',
      [coupleId, 2, 50]
    );
    await pool.execute(
      'INSERT INTO nest_items (couple_id, item_id, item_name, icon, x, y) VALUES (?, ?, ?, ?, ?, ?), (?, ?, ?, ?, ?, ?)',
      [coupleId, 1, '小沙发', '🛋️', 100, 200, coupleId, 3, '台灯', '💡', 300, 150]
    );
    console.log(`   ✅ 小窝初始化完成，拥有2件装饰\n`);

    // 填充聊天消息
    console.log('1️⃣2️⃣  填充聊天记录...');
    const messages = [
      [userId1, userId2, '小红，在吗？'],
      [userId2, userId1, '在呢，怎么啦？'],
      [userId1, userId2, '今天想你了'],
      [userId2, userId1, '我也是❤️'],
      [userId1, userId2, '周末一起出去玩吧'],
      [userId2, userId1, '好呀，去哪里？'],
      [userId1, userId2, '去东湖骑车怎么样'],
      [userId2, userId1, '太好了！']
    ];

    for (const [senderId, receiverId, content] of messages) {
      await pool.execute(
        'INSERT INTO chat_messages (couple_id, sender_id, receiver_id, type, content, created_at) VALUES (?, ?, ?, ?, ?, DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 2) HOUR))',
        [coupleId, senderId, receiverId, 'text', content]
      );
    }
    console.log(`   ✅ 已添加 ${messages.length} 条聊天消息\n`);

    // 填充心情日历
    console.log('1️⃣3️⃣  填充心情日历...');
    const moods = ['happy', 'loved', 'excited', 'calm'];
    for (let i = 0; i < 7; i++) {
      const mood = moods[Math.floor(Math.random() * moods.length)];
      await pool.execute(
        'INSERT INTO moods (couple_id, user_id, mood_type, date, note) VALUES (?, ?, ?, DATE_SUB(CURDATE(), INTERVAL ? DAY), ?)',
        [coupleId, i % 2 === 0 ? userId1 : userId2, mood, i, `今天心情${mood}`]
      );
    }
    console.log(`   ✅ 已添加7天心情记录\n`);

    // 填充位置共享
    console.log('1️⃣4️⃣  填充位置共享...');
    await pool.execute(
      'INSERT INTO locations (user_id, latitude, longitude, address) VALUES (?, ?, ?, ?), (?, ?, ?, ?)',
      [userId1, 30.5928, 114.3055, '武汉市武昌区', userId2, 30.5830, 114.2980, '武汉市洪山区']
    );
    console.log(`   ✅ 已添加2条位置记录\n`);

    // 填充经期记录
    console.log('1️⃣5️⃣  填充经期管理...');
    await pool.execute(
      'INSERT INTO period_records (user_id, start_date, end_date, cycle_length) VALUES (?, DATE_SUB(CURDATE(), INTERVAL 15 DAY), DATE_SUB(CURDATE(), INTERVAL 10 DAY), 28)',
      [userId2]
    );
    console.log(`   ✅ 已添加1条经期记录\n`);

    // 填充提醒事项
    console.log('1️⃣6️⃣  填充提醒事项...');
    const reminders = [
      ['纪念日提醒', '我们在一起365天啦！', '2025-01-01 00:00:00'],
      ['小红生日', '准备生日惊喜', '2025-08-15 00:00:00'],
      ['周末约会', '记得去江汉路', '2025-11-08 10:00:00']
    ];

    for (const [title, description, remindAt] of reminders) {
      await pool.execute(
        'INSERT INTO reminders (couple_id, user_id, title, description, remind_at) VALUES (?, ?, ?, ?, ?)',
        [coupleId, userId1, title, description, remindAt]
      );
    }
    console.log(`   ✅ 已添加 ${reminders.length} 个提醒\n`);

    // 填充消防员任务
    console.log('1️⃣7️⃣  填充情侣消防员...');
    await pool.execute(
      'INSERT INTO fireman_tasks (couple_id, task_date, task_content, user1_completed, user2_completed) VALUES (?, CURDATE(), ?, 1, 1)',
      [coupleId, '今天说一句"我爱你"']
    );
    console.log(`   ✅ 已添加今日任务\n`);

    console.log('═══════════════════════════════════════');
    console.log('✅  测试数据填充完成！');
    console.log('═══════════════════════════════════════\n');

    console.log('📊  数据统计:');
    console.log('   👥 用户: 2个');
    console.log('   💑 情侣: 1对');
    console.log('   📝 日记: 5篇');
    console.log('   🏛️  回忆: 3条');
    console.log('   📷 相册: 1个');
    console.log('   💰 账本: 5条');
    console.log('   📅 日程: 3个');
    console.log('   ❓ 问答: 3个');
    console.log('   💖 打卡: 10次');
    console.log('   🏆 成就: 2个');
    console.log('   🏠 小窝: 1个');
    console.log('   💬 聊天: 8条');
    console.log('   😊 心情: 7天');
    console.log('   📍 位置: 2条');
    console.log('   🌺 经期: 1条');
    console.log('   ⏰ 提醒: 3个');
    console.log('   🔥 消防员: 1个\n');

    console.log('🎉  现在可以使用以下账号登录测试:');
    console.log('   账号: 小明  密码: 123456');
    console.log('   账号: 小红  密码: 123456\n');

  } catch (error) {
    console.error('❌ 填充测试数据失败:', error);
  } finally {
    process.exit();
  }
};

seedDatabase();















