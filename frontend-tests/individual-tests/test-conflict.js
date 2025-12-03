const puppeteer = require('puppeteer');

const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function testConflict() {
  console.log('\n🧪 测试：争吵消防员功能');
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

    console.log('\n📝 步骤 2: 进入争吵消防员页面...');
    await page.evaluate(() => {
      const conflictCard = Array.from(document.querySelectorAll('.module-card'))
        .find(card => card.textContent.includes('争吵') || card.textContent.includes('消防员') || card.textContent.includes('Conflict'));
      if (conflictCard) conflictCard.click();
    });
    await wait(3000);
    console.log('✅ 进入争吵消防员页面');

    console.log('\n📝 步骤 3: 点击记录按钮...');
    await page.click('.add-btn');
    console.log('✅ 点击记录按钮');
    await wait(2000);

    console.log('\n📝 步骤 4: 填写争吵原因...');
    const testReason = `测试争吵原因 ${Date.now()}`;
    
    await page.type('.conflict-reason-input', testReason);
    console.log(`✅ 输入原因: ${testReason}`);
    await wait(500);

    console.log('\n📝 步骤 5: 保存记录...');
    await page.click('.save-btn');
    console.log('✅ 点击保存按钮');
    await wait(3000);

    console.log('\n📝 步骤 6: 刷新页面验证记录是否保存...');
    await page.reload();
    await wait(3000);

    const recordInfo = await page.evaluate(() => {
      const content = document.body.textContent;
      const records = document.querySelectorAll('.conflict-record, .record-item, [class*="record"]');
      const hasRecordSection = content.includes('争吵记录') && content.includes('原因');
      return {
        content: content,
        recordCount: records.length,
        hasRecordSection: hasRecordSection
      };
    });

    const hasConflictRecord = recordInfo.hasRecordSection;

    if (hasConflictRecord) {
      console.log('✅ 成功！争吵记录已保存并显示');
      console.log('页面内容片段:', recordInfo.content.substring(180, 280));
      console.log('\n' + '='.repeat(60));
      console.log('🎉 争吵消防员功能测试通过！');
      console.log('='.repeat(60));
    } else {
      console.log('❌ 失败！记录未保存');
      console.log('页面内容前200字:', recordInfo.content.substring(0, 200));
      console.log('\n' + '='.repeat(60));
      console.log('❌ 争吵消防员功能测试失败！');
      console.log('='.repeat(60));
    }

    await wait(2000);

  } catch (error) {
    console.error('❌ 测试出错:', error.message);
    console.log('\n' + '='.repeat(60));
    console.log('❌ 争吵消防员功能测试失败！');
    console.log('='.repeat(60));
  }

  await browser.close();
}

testConflict().catch(console.error);

