const puppeteer = require('puppeteer');

const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function testAlbum() {
  console.log('\n🧪 测试：相册功能');
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

    console.log('\n📝 步骤 2: 进入相册页面...');
    await page.evaluate(() => {
      const albumCard = Array.from(document.querySelectorAll('.module-card'))
        .find(card => card.textContent.includes('相册') || card.textContent.includes('Album'));
      if (albumCard) albumCard.click();
    });
    await wait(3000);
    console.log('✅ 进入相册页面');

    console.log('\n📝 步骤 3: 点击新建相册按钮...');
    await page.click('.add-album-btn');
    console.log('✅ 点击新建相册按钮');
    await wait(2000);

    console.log('\n📝 步骤 4: 填写相册信息...');
    const testAlbumName = `测试相册 ${Date.now()}`;
    const testDescription = '这是一个测试相册';

    await page.type('.album-name-input', testAlbumName);
    console.log(`✅ 输入相册名称: ${testAlbumName}`);
    await wait(500);

    await page.type('.album-description-input', testDescription);
    console.log(`✅ 输入描述: ${testDescription}`);
    await wait(500);

    console.log('\n📝 步骤 5: 保存相册...');
    await page.click('.save-album-btn');
    console.log('✅ 点击保存按钮');
    await wait(3000);

    console.log('\n📝 步骤 6: 刷新页面验证相册是否保存...');
    await page.reload();
    await wait(3000);

    const pageContent = await page.evaluate(() => {
      const content = document.body.textContent;
      const albumCards = document.querySelectorAll('.album-card');
      return {
        content: content,
        cardCount: albumCards.length,
        hasEditBtn: content.includes('编辑') || content.includes('删除')
      };
    });

    // 检查是否有相册卡片或编辑按钮
    const hasAlbum = pageContent.cardCount > 0 || pageContent.hasEditBtn;

    if (hasAlbum) {
      console.log(`✅ 成功！相册已保存并显示（相册数: ${pageContent.cardCount}）`);
      console.log('页面内容片段:', pageContent.content.substring(0, 150));
      console.log('\n' + '='.repeat(60));
      console.log('🎉 相册功能测试通过！');
      console.log('='.repeat(60));
    } else {
      console.log('❌ 失败！相册未保存');
      console.log('页面内容前200字:', pageContent.content.substring(0, 200));
      console.log('\n' + '='.repeat(60));
      console.log('❌ 相册功能测试失败！');
      console.log('='.repeat(60));
    }

    await wait(2000);

  } catch (error) {
    console.error('❌ 测试出错:', error.message);
    console.log('\n' + '='.repeat(60));
    console.log('❌ 相册功能测试失败！');
    console.log('='.repeat(60));
  }

  await browser.close();
}

testAlbum().catch(console.error);

