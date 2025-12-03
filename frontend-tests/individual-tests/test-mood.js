const puppeteer = require('puppeteer');

const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function testMood() {
  console.log('\n🧪 测试：心情记录功能');
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
    
    // 清空可能存在的旧输入
    await page.evaluate(() => {
      const usernameInput = document.querySelector('.username-input');
      const passwordInput = document.querySelector('.password-input');
      if (usernameInput) usernameInput.value = '';
      if (passwordInput) passwordInput.value = '';
    });
    
    await page.type('.username-input', '小明');
    await page.type('.password-input', '123456');
    console.log('✅ 输入账号密码');
    await wait(500);
    
    await page.click('.login-btn');
    console.log('✅ 点击登录按钮');
    await wait(4000); // 等待登录和页面跳转

    const currentUrl = page.url();
    console.log('当前URL:', currentUrl);
    
    if (!currentUrl.includes('home')) {
      // 尝试检查是否有错误提示
      const errorMsg = await page.evaluate(() => {
        return document.body.textContent;
      });
      console.log('页面内容:', errorMsg.substring(0, 200));
      throw new Error('登录失败 - 未跳转到首页');
    }
    console.log('✅ 登录成功');

    // 进入心情记录页面
    console.log('\n📝 步骤 2: 进入心情记录页面...');
    await page.evaluate(() => {
      const moodCard = Array.from(document.querySelectorAll('.module-card'))
        .find(card => card.textContent.includes('心情记录'));
      if (moodCard) moodCard.click();
    });
    await wait(3000);
    console.log('✅ 进入心情记录页面');

    // 获取初始心情记录数量
    console.log('\n📝 步骤 3: 获取初始数据...');
    const initialCount = await page.evaluate(() => {
      const items = document.querySelectorAll('.mood-item, .history-item, [class*="mood"][class*="item"]');
      const content = document.body.textContent;
      const match = content.match(/(\d+)条/);
      return {
        itemCount: items.length,
        displayCount: match ? parseInt(match[1]) : 0,
        preview: content.substring(0, 150)
      };
    });
    console.log(`✅ 初始记录: ${initialCount.displayCount}条 (DOM元素: ${initialCount.itemCount}个)`);

    // 保存新心情
    console.log('\n📝 步骤 4: 添加新心情记录...');
    const testNote = `自动化测试_${Date.now()}`;
    
    // 点击happy心情选项
    await page.evaluate(() => {
      const moodOptions = document.querySelectorAll('.mood-option');
      for (let option of moodOptions) {
        if (option.textContent.includes('😊') || option.textContent.includes('开心')) {
          option.click();
          break;
        }
      }
    });
    await wait(500);
    console.log('✅ 选择心情：开心 😊');

    // 输入备注
    await page.type('.mood-note-input', testNote);
    console.log(`✅ 输入备注: ${testNote}`);
    await wait(500);

    // 点击保存按钮
    await page.evaluate(() => {
      const saveBtn = document.querySelector('.save-mood-btn, .save-btn, button[type="submit"]');
      if (saveBtn) saveBtn.click();
      else {
        const buttons = Array.from(document.querySelectorAll('button'));
        const saveBtnAlt = buttons.find(btn => btn.textContent.includes('保存'));
        if (saveBtnAlt) saveBtnAlt.click();
      }
    });
    await wait(3000);
    console.log('✅ 点击保存按钮');

    // 刷新页面验证
    console.log('\n📝 步骤 5: 刷新页面验证新数据...');
    await page.reload();
    await wait(3000);

    // 检查新增记录
    const afterCount = await page.evaluate((testNote) => {
      const items = document.querySelectorAll('.mood-item, .history-item, [class*="mood"][class*="item"]');
      const content = document.body.textContent;
      const match = content.match(/(\d+)条/);
      const hasNewNote = content.includes(testNote) || content.includes('自动化测试');
      return {
        itemCount: items.length,
        displayCount: match ? parseInt(match[1]) : 0,
        hasNewNote: hasNewNote,
        preview: content.substring(0, 200)
      };
    }, testNote);

    console.log(`✅ 刷新后记录: ${afterCount.displayCount}条 (DOM元素: ${afterCount.itemCount}个)`);
    console.log(`   新增了: ${afterCount.displayCount - initialCount.displayCount}条`);
    console.log(`   是否包含新备注: ${afterCount.hasNewNote ? '是✅' : '否❌'}`);

    if (afterCount.displayCount > initialCount.displayCount || afterCount.hasNewNote) {
      console.log('\n' + '='.repeat(60));
      console.log('🎉 心情记录功能测试通过！数据成功保存并显示');
      console.log('='.repeat(60));
    } else {
      console.log('❌ 失败！刷新后没有看到新增的心情记录');
      console.log('页面内容:', afterCount.preview);
      console.log('\n' + '='.repeat(60));
      console.log('❌ 心情记录功能测试失败！');
      console.log('='.repeat(60));
    }

    await wait(2000);

  } catch (error) {
    console.error('❌ 测试出错:', error.message);
    console.log('\n' + '='.repeat(60));
    console.log('❌ 心情记录功能测试失败！');
    console.log('='.repeat(60));
  }

  await browser.close();
}

testMood().catch(console.error);

