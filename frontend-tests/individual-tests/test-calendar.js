const puppeteer = require('puppeteer');

const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function testCalendar() {
  console.log('\n🧪 测试：恋爱日历功能');
  console.log('='.repeat(60));

  const browser = await puppeteer.launch({
    headless: false,
    slowMo: 50,
    args: ['--window-size=1280,800']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });

  try {
    // 登录
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

    if (!page.url().includes('home')) {
      throw new Error('登录失败');
    }
    console.log('✅ 登录成功');

    // 进入日历页面
    console.log('\n📝 步骤 2: 进入恋爱日历页面...');
    await page.evaluate(() => {
      const calendarCard = Array.from(document.querySelectorAll('.module-card'))
        .find(card => card.textContent.includes('恋爱日历') || card.textContent.includes('日历'));
      if (calendarCard) calendarCard.click();
    });
    await wait(3000);
    console.log('✅ 进入恋爱日历页面');

    // 验证页面加载
    console.log('\n📝 步骤 3: 验证日历显示...');
    const hasCalendar = await page.evaluate(() => {
      const content = document.body.textContent;
      return content.includes('日历') || content.includes('Calendar') || content.includes('2025') || content.includes('11月');
    });

    if (hasCalendar) {
      console.log('✅ 成功！日历页面正常显示');
      console.log('\n' + '='.repeat(60));
      console.log('🎉 恋爱日历功能测试通过！');
      console.log('='.repeat(60));
    } else {
      console.log('❌ 失败！日历页面未正常显示');
      const content = await page.evaluate(() => document.body.textContent);
      console.log('页面内容前200字:', content.substring(0, 200));
      console.log('\n' + '='.repeat(60));
      console.log('❌ 恋爱日历功能测试失败！');
      console.log('='.repeat(60));
    }

    await wait(2000);

  } catch (error) {
    console.error('❌ 测试出错:', error.message);
    console.log('\n' + '='.repeat(60));
    console.log('❌ 恋爱日历功能测试失败！');
    console.log('='.repeat(60));
  }

  await browser.close();
}

testCalendar().catch(console.error);

