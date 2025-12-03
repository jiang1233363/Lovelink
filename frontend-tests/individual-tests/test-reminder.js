const puppeteer = require('puppeteer');

const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function testReminder() {
  console.log('\n🧪 测试：提醒事项功能');
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
    
    // 监听并自动关闭alert对话框
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

    // 进入提醒事项页面
    console.log('\n📝 步骤 2: 进入提醒事项页面...');
    await page.evaluate(() => {
      const reminderCard = Array.from(document.querySelectorAll('.module-card'))
        .find(card => card.textContent.includes('提醒事项') || card.textContent.includes('提醒'));
      if (reminderCard) reminderCard.click();
    });
    await wait(3000);
    console.log('✅ 进入提醒事项页面');

    // 获取初始提醒数量
    console.log('\n📝 步骤 3: 获取初始提醒数量...');
    const initialData = await page.evaluate(() => {
      const items = document.querySelectorAll('.reminder-item, [class*="reminder"][class*="item"]');
      const content = document.body.textContent;
      const match = content.match(/提醒列表.*?(\d+)条/);
      return {
        count: items.length,
        displayCount: match ? parseInt(match[1]) : 0
      };
    });
    console.log(`✅ 初始提醒数量: ${initialData.displayCount}条 (DOM元素: ${initialData.count}个)`);

    // 填写提醒（Reminder页面没有添加按钮，直接在输入框输入）
    console.log('\n📝 步骤 4: 填写新提醒内容...');
    const testReminder = `自动化测试提醒_${Date.now()}`;
    
    await page.type('.reminder-input, input[placeholder*="提醒"]', testReminder);
    console.log(`✅ 输入提醒: ${testReminder}`);
    await wait(500);

    // 直接按Enter键添加（如果有keyup.enter监听）
    await page.keyboard.press('Enter');
    console.log('✅ 按Enter添加提醒');
    await wait(3000);

    // 刷新页面验证
    console.log('\n📝 步骤 5: 刷新页面验证新提醒...');
    await page.reload();
    await wait(3000);

    // 获取刷新后的数据
    const afterData = await page.evaluate((testText) => {
      const items = document.querySelectorAll('.reminder-item, [class*="reminder"][class*="item"]');
      const content = document.body.textContent;
      const match = content.match(/提醒列表.*?(\d+)条/);
      return {
        count: items.length,
        displayCount: match ? parseInt(match[1]) : 0,
        hasNewReminder: content.includes(testText) || content.includes('自动化测试提醒')
      };
    }, testReminder);

    console.log(`✅ 刷新后提醒数量: ${afterData.displayCount}条 (DOM元素: ${afterData.count}个)`);
    console.log(`   新增了: ${afterData.displayCount - initialData.displayCount}条`);
    console.log(`   是否包含新提醒: ${afterData.hasNewReminder ? '是✅' : '否❌'}`);

    if (afterData.displayCount > initialData.displayCount || afterData.hasNewReminder) {
      console.log('\n' + '='.repeat(60));
      console.log('🎉 提醒事项功能测试通过！数据成功保存并显示');
      console.log('='.repeat(60));
    } else {
      console.log('\n❌ 失败！刷新后没有看到新增的提醒');
      console.log('='.repeat(60));
      console.log('❌ 提醒事项功能测试失败！');
      console.log('='.repeat(60));
    }

    await wait(2000);

  } catch (error) {
    console.error('❌ 测试出错:', error.message);
    console.log('\n' + '='.repeat(60));
    console.log('❌ 提醒事项功能测试失败！');
    console.log('='.repeat(60));
  }

  await browser.close();
}

testReminder().catch(console.error);

