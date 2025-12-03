const puppeteer = require('puppeteer');

const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function testQA() {
  console.log('\n🧪 测试：情侣问答功能（双用户）');
  console.log('='.repeat(60));

  // 启动两个浏览器实例
  const browser1 = await puppeteer.launch({
    headless: false,
    slowMo: 50,
    args: ['--window-size=800,900', '--window-position=0,0']
  });
  
  const browser2 = await puppeteer.launch({
    headless: false,
    slowMo: 50,
    args: ['--window-size=800,900', '--window-position=820,0']
  });

  const page1 = await browser1.newPage();
  const page2 = await browser2.newPage();
  
  await page1.setViewport({ width: 800, height: 900 });
  await page2.setViewport({ width: 800, height: 900 });

  try {
    // 自动处理弹窗
    page1.on('dialog', async dialog => {
      console.log('🔵 小明弹窗:', dialog.message());
      await dialog.accept();
    });
    
    page2.on('dialog', async dialog => {
      console.log('🟢 小红弹窗:', dialog.message());
      await dialog.accept();
    });

    // 用户1（小明）登录
    console.log('📝 步骤 1: 小明登录...');
    await page1.goto('http://localhost:8080/#/login');
    await wait(2000);
    await page1.type('.username-input', '小明');
    await page1.type('.password-input', '123456');
    await page1.click('.login-btn');
    await wait(3000);
    console.log('✅ 小明登录成功');

    // 用户2（小红）登录
    console.log('\n📝 步骤 2: 小红登录...');
    await page2.goto('http://localhost:8080/#/login');
    await wait(2000);
    await page2.type('.username-input', '小红');
    await page2.type('.password-input', '123456');
    await page2.click('.login-btn');
    await wait(3000);
    console.log('✅ 小红登录成功');

    // 小明进入问答页面
    console.log('\n📝 步骤 3: 小明进入问答页面...');
    await page1.evaluate(() => {
      const qaCard = Array.from(document.querySelectorAll('.module-card'))
        .find(card => card.textContent.includes('问答'));
      if (qaCard) qaCard.click();
    });
    await wait(3000);
    console.log('✅ 小明进入问答页面');

    // 小明添加新问题
    console.log('\n📝 步骤 4: 小明添加新问题...');
    await page1.click('.add-qa-btn');
    await wait(1000);
    
    const testQuestion = `测试问题_${Date.now()}：你最喜欢我什么？`;
    await page1.type('.question-input', testQuestion);
    await wait(500);
    
    await page1.click('.save-qa-btn');
    await wait(3000);
    console.log('✅ 小明的问题已保存');

    // 小红进入问答页面
    console.log('\n📝 步骤 5: 小红进入问答页面...');
    await page2.evaluate(() => {
      const qaCard = Array.from(document.querySelectorAll('.module-card'))
        .find(card => card.textContent.includes('问答'));
      if (qaCard) qaCard.click();
    });
    await wait(3000);
    console.log('✅ 小红进入问答页面');

    // 小红回答问题
    console.log('\n📝 步骤 6: 小红回答小明的问题...');
    const answered = await page2.evaluate(() => {
      const qaItems = document.querySelectorAll('.qa-item');
      for (const item of qaItems) {
        if (item.textContent.includes('测试问题')) {
          const textarea = item.querySelector('.answer-input');
          if (textarea) {
            textarea.value = '我最喜欢你的善良和温柔！';
            textarea.dispatchEvent(new Event('input', { bubbles: true }));
            const btn = item.querySelector('.submit-answer-btn');
            if (btn) {
              btn.click();
              return true;
            }
          }
        }
      }
      return false;
    });
    
    if (answered) {
      await wait(3000);
      console.log('✅ 小红的回答已提交');
    } else {
      console.log('⚠️  小红未找到答题按钮');
    }

    // 小明刷新查看回答
    console.log('\n📝 步骤 7: 小明刷新查看回答...');
    await page1.reload();
    await wait(3000);
    
    const mingCheck = await page1.evaluate(() => {
      const content = document.body.textContent;
      return {
        hasQuestion: content.includes('测试问题'),
        hasAnswer: content.includes('善良') || content.includes('温柔'),
        answeredCount: content.match(/已回答\s*(\d+)/)?.[1] || '0'
      };
    });

    console.log('\n' + '='.repeat(60));
    if (mingCheck.hasQuestion && mingCheck.hasAnswer) {
      console.log('🎉 情侣问答功能测试通过！');
      console.log('   ✅ 小明提问成功');
      console.log('   ✅ 小红回答成功');
      console.log('   ✅ 小明看到回答');
      console.log('   📊 已回答数量:', mingCheck.answeredCount);
    } else {
      console.log('❌ 问答功能测试失败！');
      console.log('   问题:', mingCheck.hasQuestion ? '✅' : '❌');
      console.log('   回答:', mingCheck.hasAnswer ? '✅' : '❌');
    }
    console.log('='.repeat(60));

    await wait(3000);

  } catch (error) {
    console.error('❌ 测试出错:', error.message);
    console.log('\n' + '='.repeat(60));
    console.log('❌ 问答功能测试失败！');
    console.log('='.repeat(60));
  }

  await browser1.close();
  await browser2.close();
}

testQA().catch(console.error);

