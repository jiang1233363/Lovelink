const puppeteer = require('puppeteer');

const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function testAchievement() {
  console.log('\n🧪 测试：成就功能');
  console.log('='.repeat(60));

  const browser = await puppeteer.launch({
    headless: false,
    slowMo: 50,
    args: ['--window-size=1280,800']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });

  try {
    console.log('📝 步骤 1: 登录...');
    await page.goto('http://localhost:8080/#/login');
    await wait(3000);
    
    page.on('dialog', async dialog => {
      console.log('⚠️  检测到弹窗:', dialog.message());
      await dialog.accept();
    });
    
    await page.type('.username-input', '小明');
    await page.type('.password-input', '123456');
    await page.click('.login-btn');
    await wait(4000);
    console.log('✅ 登录成功');

    console.log('\n📝 步骤 2: 进入成就页面...');
    await page.evaluate(() => {
      const achievementCard = Array.from(document.querySelectorAll('.module-card'))
        .find(card => card.textContent.includes('成就') || card.textContent.includes('Achievement'));
      if (achievementCard) achievementCard.click();
    });
    await wait(3000);
    console.log('✅ 进入成就页面');

    console.log('\n📝 步骤 3: 获取初始成就统计...');
    const initialStats = await page.evaluate(() => {
      const stats = document.querySelectorAll('.stat-value');
      return {
        unlocked: stats[0]?.textContent || '0',
        total: stats[1]?.textContent || '0',
        points: stats[2]?.textContent || '0'
      };
    });
    console.log(`✅ 初始统计: 已解锁=${initialStats.unlocked}/${initialStats.total}, 积分=${initialStats.points}`);

    console.log('\n📝 步骤 4: 检查成就列表...');
    const achievementInfo = await page.evaluate(() => {
      const cards = document.querySelectorAll('.achievement-card');
      const unlockedCards = document.querySelectorAll('.achievement-card.unlocked');
      return {
        total: cards.length,
        unlocked: unlockedCards.length
      };
    });
    console.log(`✅ 成就卡片: 总数=${achievementInfo.total}, 已解锁=${achievementInfo.unlocked}`);

    console.log('\n📝 步骤 5: 刷新页面验证数据持久化...');
    await page.reload();
    await wait(3000);

    const finalStats = await page.evaluate(() => {
      const stats = document.querySelectorAll('.stat-value');
      const content = document.body.textContent;
      return {
        unlocked: stats[0]?.textContent || '0',
        total: stats[1]?.textContent || '0',
        points: stats[2]?.textContent || '0',
        hasContent: content.includes('成就') || content.includes('解锁')
      };
    });
    console.log(`✅ 刷新后统计: 已解锁=${finalStats.unlocked}/${finalStats.total}, 积分=${finalStats.points}`);

    const statsMatch = initialStats.unlocked === finalStats.unlocked && 
                       initialStats.total === finalStats.total &&
                       finalStats.hasContent;

    if (statsMatch) {
      console.log('✅ 成功！成就数据一致，功能正常');
      console.log('\n' + '='.repeat(60));
      console.log('🎉 成就功能测试通过！');
      console.log('='.repeat(60));
    } else {
      console.log('❌ 失败！数据不一致或页面异常');
      console.log('\n' + '='.repeat(60));
      console.log('❌ 成就功能测试失败！');
      console.log('='.repeat(60));
    }

    await wait(2000);

  } catch (error) {
    console.error('❌ 测试出错:', error.message);
    console.log('\n' + '='.repeat(60));
    console.log('❌ 成就功能测试失败！');
    console.log('='.repeat(60));
  }

  await browser.close();
}

testAchievement().catch(console.error);

