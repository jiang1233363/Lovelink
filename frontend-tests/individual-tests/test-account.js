const puppeteer = require('puppeteer');

const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function testAccount() {
  console.log('\n🧪 测试：共同账本功能');
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

    // 进入账本页面
    console.log('\n📝 步骤 2: 进入共同账本页面...');
    await page.evaluate(() => {
      const accountCard = Array.from(document.querySelectorAll('.module-card'))
        .find(card => card.textContent.includes('共同账本') || card.textContent.includes('账本'));
      if (accountCard) accountCard.click();
    });
    await wait(3000);
    console.log('✅ 进入共同账本页面');

    // 获取初始记录数量
    console.log('\n📝 步骤 3: 获取初始记录数量...');
    const initialData = await page.evaluate(() => {
      const items = document.querySelectorAll('.record-item, .account-item, [class*="record"][class*="item"]');
      const content = document.body.textContent;
      const match = content.match(/记账记录.*?(\d+)条/);
      return {
        count: items.length,
        displayCount: match ? parseInt(match[1]) : 0
      };
    });
    console.log(`✅ 初始记录: ${initialData.displayCount}条 (DOM元素: ${initialData.count}个)`);

    // 点击添加按钮
    console.log('\n📝 步骤 4: 点击添加账单按钮...');
    await page.evaluate(() => {
      const addBtn = document.querySelector('.add-btn, .add-record-btn');
      if (addBtn) {
        addBtn.click();
        return;
      }
      const buttons = Array.from(document.querySelectorAll('button'));
      const addBtnAlt = buttons.find(btn => btn.textContent.includes('添加') || btn.textContent.includes('+'));
      if (addBtnAlt) addBtnAlt.click();
    });
    await wait(2000);
    console.log('✅ 点击添加按钮');

    // 填写账单
    console.log('\n📝 步骤 5: 填写账单信息...');
    const testAmount = '88.88';
    const testDescription = `自动化测试账单_${Date.now()}`;
    
    await page.type('.amount-input, input[placeholder*="金额"], input[type="number"]', testAmount);
    console.log(`✅ 输入金额: ${testAmount}`);
    await wait(500);

    // 选择分类
    await page.select('.category-select, select', '餐饮');
    console.log(`✅ 选择分类: 餐饮`);
    await wait(500);

    await page.type('.description-input, input[placeholder*="描述"], .note-input, textarea', testDescription);
    console.log(`✅ 输入描述: ${testDescription}`);
    await wait(500);

    // 保存账单
    console.log('\n📝 步骤 6: 保存账单...');
    await page.evaluate(() => {
      const saveBtn = document.querySelector('.save-btn, button[type="submit"]');
      if (saveBtn) {
        saveBtn.click();
        return;
      }
      const buttons = Array.from(document.querySelectorAll('button'));
      const saveBtnAlt = buttons.find(btn => btn.textContent.includes('保存') || btn.textContent.includes('确定'));
      if (saveBtnAlt) saveBtnAlt.click();
    });
    await wait(3000);
    console.log('✅ 点击保存按钮');

    // 刷新页面验证
    console.log('\n📝 步骤 7: 刷新页面验证新账单...');
    await page.reload();
    await wait(3000);

    const afterData = await page.evaluate((testDesc) => {
      const items = document.querySelectorAll('.record-item, .account-item, [class*="record"][class*="item"]');
      const content = document.body.textContent;
      const match = content.match(/记账记录.*?(\d+)条/);
      return {
        count: items.length,
        displayCount: match ? parseInt(match[1]) : 0,
        hasNewRecord: content.includes(testDesc) || content.includes('自动化测试账单')
      };
    }, testDescription);

    console.log(`✅ 刷新后记录: ${afterData.displayCount}条 (DOM元素: ${afterData.count}个)`);
    console.log(`   新增了: ${afterData.displayCount - initialData.displayCount}条`);
    console.log(`   是否包含新账单: ${afterData.hasNewRecord ? '是✅' : '否❌'}`);

    if (afterData.displayCount > initialData.displayCount || afterData.hasNewRecord) {
      console.log('\n' + '='.repeat(60));
      console.log('🎉 共同账本功能测试通过！数据成功保存并显示');
      console.log('='.repeat(60));
    } else {
      console.log('\n❌ 失败！刷新后没有看到新增的账单');
      console.log('='.repeat(60));
      console.log('❌ 共同账本功能测试失败！');
      console.log('='.repeat(60));
    }

    await wait(2000);

  } catch (error) {
    console.error('❌ 测试出错:', error.message);
    console.log('\n' + '='.repeat(60));
    console.log('❌ 共同账本功能测试失败！');
    console.log('='.repeat(60));
  }

  await browser.close();
}

testAccount().catch(console.error);

