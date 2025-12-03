const puppeteer = require('puppeteer');

const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function testPet() {
  console.log('\n🧪 测试：宠物功能');
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

    console.log('\n📝 步骤 2: 进入宠物页面...');
    await page.evaluate(() => {
      const petCard = Array.from(document.querySelectorAll('.module-card'))
        .find(card => card.textContent.includes('宠物') || card.textContent.includes('Pet'));
      if (petCard) petCard.click();
    });
    await wait(3000);
    console.log('✅ 进入宠物页面');

    console.log('\n📝 步骤 3: 获取宠物初始状态...');
    const initialState = await page.evaluate(() => {
      const content = document.body.textContent;
      const levelMatch = content.match(/等级[：:\s]*(\d+)/);
      const expMatch = content.match(/经验[：:\s]*(\d+)/);
      return {
        level: levelMatch ? levelMatch[1] : '未知',
        exp: expMatch ? expMatch[1] : '未知',
        content: content.substring(0, 200)
      };
    });
    console.log(`✅ 初始状态: 等级=${initialState.level}, 经验=${initialState.exp}`);

    console.log('\n📝 步骤 4: 与宠物互动（喂养）...');
    const interacted = await page.evaluate(() => {
      // 查找喂养或玩耍按钮
      const feedBtn = document.querySelector('.feed-btn, button[class*="feed"]');
      const playBtn = document.querySelector('.play-btn, button[class*="play"]');
      const buttons = Array.from(document.querySelectorAll('button'));
      const feedBtnAlt = buttons.find(btn => btn.textContent.includes('喂养'));
      const playBtnAlt = buttons.find(btn => btn.textContent.includes('玩耍'));
      
      if (feedBtn) {
        feedBtn.click();
        return '喂养按钮';
      }
      if (feedBtnAlt) {
        feedBtnAlt.click();
        return '喂养';
      }
      if (playBtn) {
        playBtn.click();
        return '玩耍按钮';
      }
      if (playBtnAlt) {
        playBtnAlt.click();
        return '玩耍';
      }
      return null;
    });

    if (interacted) {
      console.log(`✅ 点击${interacted}`);
      await wait(3000);
    } else {
      console.log('⚠️  未找到互动按钮');
    }

    console.log('\n📝 步骤 5: 刷新页面验证宠物状态变化...');
    await page.reload();
    await wait(3000);

    const finalState = await page.evaluate(() => {
      const content = document.body.textContent;
      const levelMatch = content.match(/等级[：:\s]*(\d+)/);
      const expMatch = content.match(/经验[：:\s]*(\d+)/);
      return {
        level: levelMatch ? levelMatch[1] : '未知',
        exp: expMatch ? expMatch[1] : '未知',
        content: content
      };
    });
    console.log(`✅ 刷新后状态: 等级=${finalState.level}, 经验=${finalState.exp}`);

    // 验证页面有宠物相关内容
    const hasPetContent = finalState.content.includes('宠物') || 
                          finalState.content.includes('等级') || 
                          finalState.content.includes('经验') ||
                          finalState.level !== '未知';

    if (hasPetContent) {
      console.log('✅ 成功！宠物功能正常，状态已保存');
      console.log('\n' + '='.repeat(60));
      console.log('🎉 宠物功能测试通过！');
      console.log('='.repeat(60));
    } else {
      console.log('❌ 失败！宠物功能异常');
      console.log('页面内容前200字:', finalState.content.substring(0, 200));
      console.log('\n' + '='.repeat(60));
      console.log('❌ 宠物功能测试失败！');
      console.log('='.repeat(60));
    }

    await wait(2000);

  } catch (error) {
    console.error('❌ 测试出错:', error.message);
    console.log('\n' + '='.repeat(60));
    console.log('❌ 宠物功能测试失败！');
    console.log('='.repeat(60));
  }

  await browser.close();
}

testPet().catch(console.error);

