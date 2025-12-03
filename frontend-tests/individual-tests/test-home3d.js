const puppeteer = require('puppeteer');

const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function testHome3D() {
  console.log('\n🧪 测试：爱巢装扮功能');
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

    console.log('\n📝 步骤 2: 进入爱巢装扮页面...');
    await page.evaluate(() => {
      const home3dCard = Array.from(document.querySelectorAll('.module-card'))
        .find(card => card.textContent.includes('爱巢') || card.textContent.includes('装扮') || card.textContent.includes('3D'));
      if (home3dCard) home3dCard.click();
    });
    await wait(3000);
    console.log('✅ 进入爱巢装扮页面');

    console.log('\n📝 步骤 3: 获取初始金币和物品状态...');
    const initialState = await page.evaluate(() => {
      const coins = document.querySelector('.coin-amount');
      const items = document.querySelectorAll('.item-card');
      const ownedItems = document.querySelectorAll('.item-card.owned');
      return {
        coins: coins ? coins.textContent : '未知',
        totalItems: items.length,
        ownedCount: ownedItems.length
      };
    });
    console.log(`✅ 初始状态: 金币=${initialState.coins}, 物品总数=${initialState.totalItems}, 已拥有=${initialState.ownedCount}`);

    console.log('\n📝 步骤 4: 点击第一个物品...');
    const clickResult = await page.evaluate(() => {
      const items = document.querySelectorAll('.item-card');
      if (items.length > 0) {
        const firstItem = items[0];
        const isOwned = firstItem.classList.contains('owned');
        const itemName = firstItem.querySelector('.item-name')?.textContent || '物品';
        firstItem.click();
        return { success: true, isOwned, itemName };
      }
      return { success: false };
    });

    if (clickResult.success) {
      console.log(`✅ 点击物品: ${clickResult.itemName} (${clickResult.isOwned ? '已拥有-应用' : '购买'})`);
      await wait(3000);
    } else {
      console.log('⚠️  未找到物品');
    }

    console.log('\n📝 步骤 5: 刷新页面验证状态...');
    await page.reload();
    await wait(3000);

    const finalState = await page.evaluate(() => {
      const coins = document.querySelector('.coin-amount');
      const items = document.querySelectorAll('.item-card');
      const ownedItems = document.querySelectorAll('.item-card.owned');
      const appliedItems = document.querySelectorAll('.item-card.applied');
      const content = document.body.textContent;
      return {
        coins: coins ? coins.textContent : '未知',
        ownedCount: ownedItems.length,
        appliedCount: appliedItems.length,
        hasContent: content.includes('爱巢') || content.includes('装扮')
      };
    });
    console.log(`✅ 刷新后状态: 金币=${finalState.coins}, 已拥有=${finalState.ownedCount}, 已应用=${finalState.appliedCount}`);

    if (finalState.hasContent) {
      console.log('✅ 成功！爱巢装扮功能正常');
      console.log('\n' + '='.repeat(60));
      console.log('🎉 爱巢装扮功能测试通过！');
      console.log('='.repeat(60));
    } else {
      console.log('❌ 失败！爱巢装扮功能异常');
      console.log('\n' + '='.repeat(60));
      console.log('❌ 爱巢装扮功能测试失败！');
      console.log('='.repeat(60));
    }

    await wait(2000);

  } catch (error) {
    console.error('❌ 测试出错:', error.message);
    console.log('\n' + '='.repeat(60));
    console.log('❌ 爱巢装扮功能测试失败！');
    console.log('='.repeat(60));
  }

  await browser.close();
}

testHome3D().catch(console.error);

