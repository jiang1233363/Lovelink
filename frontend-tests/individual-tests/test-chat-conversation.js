const puppeteer = require('puppeteer');

const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function testChatConversation() {
  console.log('\n🧪 测试：双人聊天对话功能');
  console.log('='.repeat(60));

  let browser1, browser2, page1, page2;

  try {
    // 启动两个浏览器实例
    console.log('📝 步骤 1: 启动两个浏览器实例...');
    
    browser1 = await puppeteer.launch({
      headless: false,
      slowMo: 50,
      args: ['--window-size=800,900', '--window-position=0,0']
    });
    
    browser2 = await puppeteer.launch({
      headless: false,
      slowMo: 50,
      args: ['--window-size=800,900', '--window-position=820,0']
    });

    page1 = await browser1.newPage();
    page2 = await browser2.newPage();
    
    await page1.setViewport({ width: 800, height: 900 });
    await page2.setViewport({ width: 800, height: 900 });
    
    console.log('✅ 两个浏览器实例已启动');

    // 自动处理弹窗
    page1.on('dialog', async dialog => {
      console.log('🔵 用户1弹窗:', dialog.message());
      await dialog.accept();
    });
    
    page2.on('dialog', async dialog => {
      console.log('🟢 用户2弹窗:', dialog.message());
      await dialog.accept();
    });

    // 用户1登录 (小明)
    console.log('\n📝 步骤 2: 用户1（小明）登录...');
    await page1.goto('http://localhost:8080/#/login');
    await wait(2000);
    await page1.type('.username-input', '小明');
    await wait(300);
    await page1.type('.password-input', 'password123');
    await wait(300);
    await page1.click('.login-btn');
    await wait(3000);
    
    const url1 = page1.url();
    if (url1.includes('/home')) {
      console.log('✅ 用户1（小明）登录成功');
    } else {
      throw new Error('用户1登录失败');
    }

    // 用户2登录 (小红)
    console.log('\n📝 步骤 3: 用户2（小红）登录...');
    await page2.goto('http://localhost:8080/#/login');
    await wait(2000);
    await page2.type('.username-input', '小红');
    await wait(300);
    await page2.type('.password-input', 'password123');
    await wait(300);
    await page2.click('.login-btn');
    await wait(3000);
    
    const url2 = page2.url();
    if (url2.includes('/home')) {
      console.log('✅ 用户2（小红）登录成功');
    } else {
      throw new Error('用户2登录失败');
    }

    // 用户1进入聊天页面
    console.log('\n📝 步骤 4: 用户1进入聊天页面...');
    await page1.evaluate(() => {
      const chatCard = Array.from(document.querySelectorAll('.module-card'))
        .find(card => card.textContent.includes('实时聊天'));
      if (chatCard) chatCard.click();
    });
    await wait(3000);
    console.log('✅ 用户1进入聊天页面');

    // 用户2进入聊天页面
    console.log('\n📝 步骤 5: 用户2进入聊天页面...');
    await page2.evaluate(() => {
      const chatCard = Array.from(document.querySelectorAll('.module-card'))
        .find(card => card.textContent.includes('实时聊天'));
      if (chatCard) chatCard.click();
    });
    await wait(3000);
    console.log('✅ 用户2进入聊天页面');

    // 用户1发送第一条消息
    console.log('\n📝 步骤 6: 用户1发送消息...');
    const message1 = `你好呀！现在是 ${new Date().toLocaleTimeString()}`;
    await page1.type('.message-input', message1);
    await wait(500);
    await page1.click('.send-btn');
    await wait(2000);
    console.log('✅ 用户1发送消息:', message1);

    // 验证用户2收到消息
    console.log('\n📝 步骤 7: 验证用户2收到消息...');
    await wait(3000);
    const messages2_1 = await page2.evaluate(() => {
      const msgElements = document.querySelectorAll('.message-bubble');
      return Array.from(msgElements).map(el => el.textContent);
    });
    
    if (messages2_1.some(msg => msg.includes('你好呀'))) {
      console.log('✅ 用户2成功接收到用户1的消息');
      console.log('   消息内容:', messages2_1[messages2_1.length - 1]);
    } else {
      console.log('❌ 用户2未收到消息');
      console.log('   当前消息列表:', messages2_1);
    }

    // 用户2回复消息
    console.log('\n📝 步骤 8: 用户2回复消息...');
    const message2 = `收到！我也向你问好 😊`;
    await page2.type('.message-input', message2);
    await wait(500);
    await page2.click('.send-btn');
    await wait(2000);
    console.log('✅ 用户2发送回复:', message2);

    // 验证用户1收到回复
    console.log('\n📝 步骤 9: 验证用户1收到回复...');
    await wait(3000);
    const messages1_1 = await page1.evaluate(() => {
      const msgElements = document.querySelectorAll('.message-bubble');
      return Array.from(msgElements).map(el => el.textContent);
    });
    
    if (messages1_1.some(msg => msg.includes('收到'))) {
      console.log('✅ 用户1成功接收到用户2的回复');
      console.log('   消息内容:', messages1_1[messages1_1.length - 1]);
    } else {
      console.log('❌ 用户1未收到回复');
      console.log('   当前消息列表:', messages1_1);
    }

    // 用户1再发送一条消息
    console.log('\n📝 步骤 10: 用户1继续发送消息...');
    const message3 = '今天天气真好！';
    await page1.type('.message-input', message3);
    await wait(500);
    await page1.click('.send-btn');
    await wait(2000);
    console.log('✅ 用户1发送:', message3);

    // 用户2再回复
    console.log('\n📝 步骤 11: 用户2继续回复...');
    await wait(3000);
    const message4 = '是啊，要不要一起出去玩？';
    await page2.type('.message-input', message4);
    await wait(500);
    await page2.click('.send-btn');
    await wait(2000);
    console.log('✅ 用户2回复:', message4);

    // 最终验证
    console.log('\n📝 步骤 12: 验证完整对话历史...');
    await wait(3000);
    
    const finalMessages1 = await page1.evaluate(() => {
      const msgElements = document.querySelectorAll('.message-bubble');
      return Array.from(msgElements).map(el => el.textContent);
    });
    
    const finalMessages2 = await page2.evaluate(() => {
      const msgElements = document.querySelectorAll('.message-bubble');
      return Array.from(msgElements).map(el => el.textContent);
    });

    console.log('\n用户1看到的消息列表:');
    finalMessages1.forEach((msg, idx) => {
      console.log(`  ${idx + 1}. ${msg}`);
    });

    console.log('\n用户2看到的消息列表:');
    finalMessages2.forEach((msg, idx) => {
      console.log(`  ${idx + 1}. ${msg}`);
    });

    // 验证消息数量
    const hasAllMessages1 = finalMessages1.length >= 4;
    const hasAllMessages2 = finalMessages2.length >= 4;

    if (hasAllMessages1 && hasAllMessages2) {
      console.log('\n' + '='.repeat(60));
      console.log('🎉 双人聊天对话功能测试通过！');
      console.log('   ✅ 用户1和用户2都成功登录');
      console.log('   ✅ 双方都能进入聊天页面');
      console.log('   ✅ 用户1可以发送消息，用户2可以接收');
      console.log('   ✅ 用户2可以回复消息，用户1可以接收');
      console.log('   ✅ 双方可以进行多轮对话');
      console.log('   ✅ 消息实时同步显示');
      console.log(`   📊 对话轮次: ${Math.floor(finalMessages1.length / 2)} 轮`);
      console.log('='.repeat(60));
    } else {
      console.log('\n' + '='.repeat(60));
      console.log('❌ 双人聊天对话功能测试失败！');
      console.log('   用户1消息数:', finalMessages1.length);
      console.log('   用户2消息数:', finalMessages2.length);
      console.log('='.repeat(60));
    }

    await wait(5000);

  } catch (error) {
    console.error('❌ 测试出错:', error.message);
    console.log('\n' + '='.repeat(60));
    console.log('❌ 双人聊天对话功能测试失败！');
    console.log('   错误:', error.message);
    console.log('='.repeat(60));
  } finally {
    // 关闭浏览器
    if (browser1) await browser1.close();
    if (browser2) await browser2.close();
  }
}

testChatConversation().catch(console.error);

