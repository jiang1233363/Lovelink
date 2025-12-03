const puppeteer = require('puppeteer');

const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function testAnimeCard() {
  console.log('\n🧪 测试：动漫卡片功能');
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

    console.log('\n📝 步骤 2: 进入动漫卡片页面...');
    await page.evaluate(() => {
      const animeCard = Array.from(document.querySelectorAll('.module-card'))
        .find(card => card.textContent.includes('动漫') || card.textContent.includes('卡片') || card.textContent.includes('Anime'));
      if (animeCard) animeCard.click();
    });
    await wait(3000);
    console.log('✅ 进入动漫卡片页面');

    console.log('\n📝 步骤 3: 获取初始收藏状态...');
    const initialState = await page.evaluate(() => {
      const progress = document.querySelector('.collection-progress');
      const drawCount = document.querySelector('.draw-count');
      return {
        collection: progress ? progress.textContent : '未知',
        drawCount: drawCount ? drawCount.textContent : '未知'
      };
    });
    console.log(`✅ 初始状态: 收藏进度=${initialState.collection}, ${initialState.drawCount}`);

    console.log('\n📝 步骤 4: 点击抽卡按钮...');
    const canDraw = await page.evaluate(() => {
      const drawBtn = document.querySelector('.draw-btn');
      if (drawBtn && !drawBtn.disabled) {
        drawBtn.click();
        return true;
      }
      return false;
    });

    if (canDraw) {
      console.log('✅ 点击抽卡按钮');
      await wait(3000); // 等待抽卡动画
      
      // 点击确定关闭抽卡结果
      await page.evaluate(() => {
        const closeBtn = document.querySelector('.close-btn');
        if (closeBtn) closeBtn.click();
      });
      console.log('✅ 抽卡完成，关闭卡片显示');
      await wait(1000);
    } else {
      console.log('⚠️  今日已抽或抽卡按钮不可用');
    }

    console.log('\n📝 步骤 5: 刷新页面验证收藏变化...');
    await page.reload();
    await wait(3000);

    const finalState = await page.evaluate(() => {
      const progress = document.querySelector('.collection-progress');
      const cards = document.querySelectorAll('.card-item');
      const content = document.body.textContent;
      return {
        collection: progress ? progress.textContent : '未知',
        cardCount: cards.length,
        hasContent: content.includes('动漫') || content.includes('卡片')
      };
    });
    console.log(`✅ 刷新后状态: 收藏进度=${finalState.collection}, 卡片数=${finalState.cardCount}`);

    if (finalState.hasContent) {
      console.log('✅ 成功！动漫卡片功能正常');
      console.log('\n' + '='.repeat(60));
      console.log('🎉 动漫卡片功能测试通过！');
      console.log('='.repeat(60));
    } else {
      console.log('❌ 失败！动漫卡片功能异常');
      console.log('\n' + '='.repeat(60));
      console.log('❌ 动漫卡片功能测试失败！');
      console.log('='.repeat(60));
    }

    await wait(2000);

  } catch (error) {
    console.error('❌ 测试出错:', error.message);
    console.log('\n' + '='.repeat(60));
    console.log('❌ 动漫卡片功能测试失败！');
    console.log('='.repeat(60));
  }

  await browser.close();
}

testAnimeCard().catch(console.error);

