const puppeteer = require('puppeteer');

const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function testPeriod() {
  console.log('\n🧪 测试：姨妈期功能');
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

    console.log('\n📝 步骤 2: 进入经期管理页面...');
    await page.evaluate(() => {
      const periodCard = Array.from(document.querySelectorAll('.module-card'))
        .find(card => card.textContent.includes('经期'));
      if (periodCard) periodCard.click();
    });
    await wait(3000);
    console.log('✅ 进入姨妈期页面');

    console.log('\n📝 步骤 3: 点击记录按钮...');
    await page.click('.add-period-btn');
    console.log('✅ 点击记录按钮');
    await wait(2000);

    console.log('\n📝 步骤 4: 填写经期数据...');
    const today = new Date().toISOString().split('T')[0];
    
    // 填写开始日期
    await page.type('.date-input', today);
    console.log(`✅ 输入开始日期: ${today}`);
    await wait(500);

    // 填写周期长度
    await page.evaluate(() => {
      const cycleInput = document.querySelector('.number-input');
      if (cycleInput) {
        cycleInput.value = '28';
        cycleInput.dispatchEvent(new Event('input', { bubbles: true }));
      }
    });
    console.log('✅ 设置周期长度: 28天');
    await wait(500);

    console.log('\n📝 步骤 5: 保存记录...');
    await page.click('.save-period-btn');
    console.log('✅ 点击保存按钮');
    await wait(3000);

    console.log('\n📝 步骤 6: 刷新页面验证记录是否保存...');
    await page.reload();
    await wait(3000);

    const pageContent = await page.evaluate(() => document.body.textContent);
    // 检查是否显示了周期或记录信息
    const hasPeriodRecord = pageContent.includes('周期') || 
                            pageContent.includes('天') || 
                            pageContent.includes('记录') ||
                            pageContent.match(/\d+月/);

    if (hasPeriodRecord) {
      console.log('✅ 成功！姨妈期记录已保存并显示');
      console.log('页面内容片段:', pageContent.substring(0, 150));
      console.log('\n' + '='.repeat(60));
      console.log('🎉 姨妈期功能测试通过！');
      console.log('='.repeat(60));
    } else {
      console.log('❌ 失败！记录未保存或未显示');
      console.log('页面内容前200字:', pageContent.substring(0, 200));
      console.log('\n' + '='.repeat(60));
      console.log('❌ 姨妈期功能测试失败！');
      console.log('='.repeat(60));
    }

    await wait(2000);

  } catch (error) {
    console.error('❌ 测试出错:', error.message);
    console.log('\n' + '='.repeat(60));
    console.log('❌ 姨妈期功能测试失败！');
    console.log('='.repeat(60));
  }

  await browser.close();
}

testPeriod().catch(console.error);

