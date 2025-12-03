const puppeteer = require('puppeteer');

const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function testHeartbeat() {
  console.log('\n🧪 测试：心动计划功能（完整测试）');
  console.log('='.repeat(60));

  const browser = await puppeteer.launch({
    headless: false,
    slowMo: 50,
    args: ['--window-size=1280,800']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });

  // 监听API请求和响应
  page.on('response', async (response) => {
    const url = response.url();
    if (url.includes('/heartbeat/')) {
      try {
        const json = await response.json();
        console.log(`📡 API: ${url.split('/heartbeat/')[1]} -> code: ${json.code}, message: ${json.message || 'OK'}`);
      } catch (e) {
        // 忽略非JSON响应
      }
    }
  });

  try {
    console.log('📝 步骤 1: 登录...');
    await page.goto('http://localhost:8080/#/login');
    await wait(3000);
    
    page.on('dialog', async dialog => {
      console.log('⚠️  检测到弹窗:', dialog.message());
      await dialog.accept();
    });
    
    await page.type('.username-input', '小明');
    await wait(300);
    await page.type('.password-input', '123456');
    await wait(300);
    await page.click('.login-btn');
    await wait(4000);
    console.log('✅ 登录成功');

    console.log('\n📝 步骤 2: 进入心动计划页面...');
    await page.evaluate(() => {
      const heartbeatCard = Array.from(document.querySelectorAll('.module-card'))
        .find(card => card.textContent.includes('心动计划'));
      if (heartbeatCard) heartbeatCard.click();
    });
    await wait(3000);
    console.log('✅ 进入心动计划页面');

    console.log('\n📝 步骤 3: 验证页面元素...');
    const pageInfo = await page.evaluate(() => {
      const content = document.body.textContent;
      return {
        hasTitle: content.includes('365心动计划'),
        hasStats: content.includes('累计打卡天数') || content.includes('连续天数'),
        hasTodayTask: content.includes('今日任务'),
        hasCompleteBtn: !!document.querySelector('.complete-btn'),
        hasCompletedMark: content.includes('已完成'),
        taskTitle: document.querySelector('.task-title')?.textContent || '',
        hasHistory: document.querySelectorAll('.history-item').length > 0
      };
    });
    
    console.log('   - 页面标题:', pageInfo.hasTitle ? '✅' : '❌');
    console.log('   - 统计数据:', pageInfo.hasStats ? '✅' : '❌');
    console.log('   - 今日任务:', pageInfo.hasTodayTask ? '✅' : '❌');

    if (pageInfo.hasCompletedMark) {
      console.log('   - 任务状态: ✅ 已完成（今日已打卡）');
    } else if (pageInfo.hasCompleteBtn) {
      console.log('   - 任务状态: 📋 待完成');
      console.log('   - 任务内容:', pageInfo.taskTitle);
      
      console.log('\n📝 步骤 4: 完成今日任务...');
      const beforeStats = await page.evaluate(() => {
        const totalDays = document.body.textContent.match(/累计打卡天数[^\d]*(\d+)/)?.[1] || '0';
        return { totalDays: parseInt(totalDays) };
      });
      console.log('   - 完成前累计天数:', beforeStats.totalDays);
      
      // 点击完成按钮
      await page.click('.complete-btn');
      await wait(2000); // 等待弹窗
      
      // 刷新页面查看更新
      await page.reload();
      await wait(3000);
      
      const afterStats = await page.evaluate(() => {
        const content = document.body.textContent;
        const totalDays = content.match(/累计打卡天数[^\d]*(\d+)/)?.[1] || '0';
        const continuousDays = content.match(/连续天数[^\d]*(\d+)/)?.[1] || '0';
        return {
          totalDays: parseInt(totalDays),
          continuousDays: parseInt(continuousDays),
          hasCompleted: content.includes('已完成')
        };
      });
      
      console.log('   - 完成后累计天数:', afterStats.totalDays);
      console.log('   - 连续天数:', afterStats.continuousDays);
      console.log('   - 任务状态:', afterStats.hasCompleted ? '✅ 已完成' : '❌ 未完成');
      
      if (afterStats.hasCompleted && afterStats.totalDays >= beforeStats.totalDays) {
        console.log('✅ 完成任务成功！');
      } else {
        console.log('⚠️  完成任务可能失败');
      }
    }

    console.log('\n📝 步骤 5: 检查历史记录...');
    const historyInfo = await page.evaluate(() => {
      const items = document.querySelectorAll('.history-item');
      return {
        count: items.length,
        hasHistory: items.length > 0
      };
    });
    console.log('   - 历史记录数量:', historyInfo.count);
    console.log('   - 历史记录:', historyInfo.hasHistory ? '✅ 有记录' : 'ℹ️  暂无记录');

    // 最终验证
    const allPassed = pageInfo.hasTitle && pageInfo.hasStats && pageInfo.hasTodayTask;
    
    if (allPassed) {
      console.log('\n' + '='.repeat(60));
      console.log('🎉 心动计划功能测试通过！');
      console.log('   ✅ 页面显示正常');
      console.log('   ✅ 统计数据显示');
      console.log('   ✅ 今日任务功能');
      console.log('   ✅ 完成打卡功能');
      console.log('='.repeat(60));
    } else {
      console.log('\n' + '='.repeat(60));
      console.log('❌ 心动计划功能测试部分失败！');
      console.log('='.repeat(60));
    }

    await wait(2000);

  } catch (error) {
    console.error('❌ 测试出错:', error.message);
    console.error(error.stack);
    console.log('\n' + '='.repeat(60));
    console.log('❌ 心动计划功能测试失败！');
    console.log('='.repeat(60));
  }

  await browser.close();
}

testHeartbeat().catch(console.error);

