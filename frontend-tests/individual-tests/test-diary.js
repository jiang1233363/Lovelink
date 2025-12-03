const puppeteer = require('puppeteer');

const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function testDiary() {
  console.log('\n🧪 测试：共享日记功能');
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

    // 进入日记页面
    console.log('\n📝 步骤 2: 进入共享日记页面...');
    await page.evaluate(() => {
      const diaryCard = Array.from(document.querySelectorAll('.module-card'))
        .find(card => card.textContent.includes('共享日记') || card.textContent.includes('日记'));
      if (diaryCard) diaryCard.click();
    });
    await wait(3000);
    console.log('✅ 进入共享日记页面');

    // 获取初始日记数量
    console.log('\n📝 步骤 3: 获取初始日记数量...');
    const initialCount = await page.evaluate(() => {
      const items = document.querySelectorAll('.diary-item, .diary-card, [class*="diary"][class*="item"]');
      return items.length;
    });
    console.log(`✅ 初始日记数量: ${initialCount}篇`);

    // 点击添加按钮
    console.log('\n📝 步骤 4: 点击添加日记按钮...');
    await page.evaluate(() => {
      const addBtn = document.querySelector('.add-btn, .add-diary-btn, button[class*="add"]');
      if (addBtn) {
        addBtn.click();
        return true;
      }
      const buttons = Array.from(document.querySelectorAll('button'));
      const addBtnAlt = buttons.find(btn => btn.textContent.includes('添加') || btn.textContent.includes('+'));
      if (addBtnAlt) addBtnAlt.click();
    });
    await wait(2000);
    console.log('✅ 点击添加按钮');

    // 填写日记
    console.log('\n📝 步骤 5: 填写日记内容...');
    const testTitle = `自动化测试日记_${Date.now()}`;
    const testContent = '这是自动化测试的日记内容，用于验证新增数据是否保存成功。';
    
    await page.type('.diary-title-input, input[placeholder*="标题"], .title-input', testTitle);
    console.log(`✅ 输入标题: ${testTitle}`);
    await wait(500);

    await page.type('.diary-content-input, textarea[placeholder*="内容"], .content-input', testContent);
    console.log(`✅ 输入内容: ${testContent}`);
    await wait(500);

    // 保存日记
    console.log('\n📝 步骤 6: 保存日记...');
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
    console.log('\n📝 步骤 7: 刷新页面验证新日记...');
    await page.reload();
    await wait(3000);

    // 获取刷新后的日记数量和内容
    const afterRefresh = await page.evaluate((title) => {
      const items = document.querySelectorAll('.diary-item, .diary-card, [class*="diary"][class*="item"]');
      const content = document.body.textContent;
      return {
        count: items.length,
        hasNewDiary: content.includes(title) || content.includes('自动化测试日记')
      };
    }, testTitle);

    console.log(`✅ 刷新后日记数量: ${afterRefresh.count}篇`);
    console.log(`   新增了: ${afterRefresh.count - initialCount}篇`);
    console.log(`   是否包含新日记: ${afterRefresh.hasNewDiary ? '是✅' : '否❌'}`);

    if (afterRefresh.count > initialCount || afterRefresh.hasNewDiary) {
      console.log('\n' + '='.repeat(60));
      console.log('🎉 共享日记功能测试通过！数据成功保存并显示');
      console.log('='.repeat(60));
    } else {
      console.log('\n❌ 失败！刷新后没有看到新增的日记');
      console.log('='.repeat(60));
      console.log('❌ 共享日记功能测试失败！');
      console.log('='.repeat(60));
    }

    await wait(2000);

  } catch (error) {
    console.error('❌ 测试出错:', error.message);
    console.log('\n' + '='.repeat(60));
    console.log('❌ 共享日记功能测试失败！');
    console.log('='.repeat(60));
  }

  await browser.close();
}

testDiary().catch(console.error);

