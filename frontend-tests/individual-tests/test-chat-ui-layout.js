const puppeteer = require('puppeteer');

const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function testChatUILayout() {
  console.log('\n🧪 测试：聊天界面消息布局（左右显示）');
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
    page1.on('dialog', async dialog => await dialog.accept());
    page2.on('dialog', async dialog => await dialog.accept());

    // 用户1登录
    console.log('\n📝 步骤 2: 用户1（小明）登录...');
    await page1.goto('http://localhost:8080/#/login');
    await wait(2000);
    await page1.type('.username-input', '小明');
    await wait(300);
    await page1.type('.password-input', 'password123');
    await wait(300);
    await page1.click('.login-btn');
    await wait(3000);
    console.log('✅ 用户1登录成功');

    // 用户2登录
    console.log('\n📝 步骤 3: 用户2（小红）登录...');
    await page2.goto('http://localhost:8080/#/login');
    await wait(2000);
    await page2.type('.username-input', '小红');
    await wait(300);
    await page2.type('.password-input', 'password123');
    await wait(300);
    await page2.click('.login-btn');
    await wait(3000);
    console.log('✅ 用户2登录成功');

    // 用户1进入聊天
    console.log('\n📝 步骤 4: 用户1进入聊天页面...');
    await page1.evaluate(() => {
      const chatCard = Array.from(document.querySelectorAll('.module-card'))
        .find(card => card.textContent.includes('实时聊天'));
      if (chatCard) chatCard.click();
    });
    await wait(3000);
    console.log('✅ 用户1进入聊天');

    // 用户2进入聊天
    console.log('\n📝 步骤 5: 用户2进入聊天页面...');
    await page2.evaluate(() => {
      const chatCard = Array.from(document.querySelectorAll('.module-card'))
        .find(card => card.textContent.includes('实时聊天'));
      if (chatCard) chatCard.click();
    });
    await wait(3000);
    console.log('✅ 用户2进入聊天');

    // 用户1发送消息
    console.log('\n📝 步骤 6: 用户1发送测试消息...');
    await page1.type('.message-input', '测试消息_用户1');
    await wait(500);
    await page1.click('.send-btn');
    await wait(3000);
    console.log('✅ 用户1发送消息');

    // 检查用户1的界面布局
    console.log('\n📝 步骤 7: 检查用户1的消息布局...');
    const layout1 = await page1.evaluate(() => {
      const messages = Array.from(document.querySelectorAll('.message-item'));
      const lastMessage = messages[messages.length - 1];
      
      if (!lastMessage) return { found: false };
      
      const hasMyMessageClass = lastMessage.classList.contains('my-message');
      const bubble = lastMessage.querySelector('.message-bubble');
      const bubbleText = bubble ? bubble.textContent : '';
      const computedStyle = window.getComputedStyle(lastMessage);
      const flexDirection = computedStyle.flexDirection;
      
      return {
        found: true,
        hasMyMessageClass,
        flexDirection,
        bubbleText,
        classList: Array.from(lastMessage.classList)
      };
    });

    console.log('   用户1最后一条消息:');
    console.log('   - 内容:', layout1.bubbleText);
    console.log('   - 有 my-message 类:', layout1.hasMyMessageClass ? '✅ 是' : '❌ 否');
    console.log('   - flex-direction:', layout1.flexDirection);
    console.log('   - CSS类列表:', layout1.classList);

    // 用户2回复
    console.log('\n📝 步骤 8: 用户2回复消息...');
    await wait(2000);
    await page2.type('.message-input', '收到_用户2回复');
    await wait(500);
    await page2.click('.send-btn');
    await wait(3000);
    console.log('✅ 用户2回复');

    // 检查用户2的界面布局
    console.log('\n📝 步骤 9: 检查用户2的消息布局...');
    const layout2 = await page2.evaluate(() => {
      const messages = Array.from(document.querySelectorAll('.message-item'));
      const lastMessage = messages[messages.length - 1];
      
      if (!lastMessage) return { found: false };
      
      const hasMyMessageClass = lastMessage.classList.contains('my-message');
      const bubble = lastMessage.querySelector('.message-bubble');
      const bubbleText = bubble ? bubble.textContent : '';
      const computedStyle = window.getComputedStyle(lastMessage);
      const flexDirection = computedStyle.flexDirection;
      
      return {
        found: true,
        hasMyMessageClass,
        flexDirection,
        bubbleText,
        classList: Array.from(lastMessage.classList)
      };
    });

    console.log('   用户2最后一条消息:');
    console.log('   - 内容:', layout2.bubbleText);
    console.log('   - 有 my-message 类:', layout2.hasMyMessageClass ? '✅ 是' : '❌ 否');
    console.log('   - flex-direction:', layout2.flexDirection);
    console.log('   - CSS类列表:', layout2.classList);

    // 检查用户1看到的对方消息
    console.log('\n📝 步骤 10: 检查用户1看到对方消息的布局...');
    await wait(3000);
    const layout1_partner = await page1.evaluate(() => {
      const messages = Array.from(document.querySelectorAll('.message-item'));
      const lastMessage = messages[messages.length - 1];
      
      if (!lastMessage) return { found: false };
      
      const hasMyMessageClass = lastMessage.classList.contains('my-message');
      const bubble = lastMessage.querySelector('.message-bubble');
      const bubbleText = bubble ? bubble.textContent : '';
      const computedStyle = window.getComputedStyle(lastMessage);
      const flexDirection = computedStyle.flexDirection;
      
      return {
        found: true,
        hasMyMessageClass,
        flexDirection,
        bubbleText,
        classList: Array.from(lastMessage.classList)
      };
    });

    console.log('   用户1看到的最后一条消息（来自用户2）:');
    console.log('   - 内容:', layout1_partner.bubbleText);
    console.log('   - 有 my-message 类:', layout1_partner.hasMyMessageClass ? '❌ 是（错误！）' : '✅ 否（正确）');
    console.log('   - flex-direction:', layout1_partner.flexDirection);

    // 最终验证
    const user1_myMessageCorrect = layout1.hasMyMessageClass && layout1.flexDirection === 'row-reverse';
    const user2_myMessageCorrect = layout2.hasMyMessageClass && layout2.flexDirection === 'row-reverse';
    const user1_partnerMessageCorrect = !layout1_partner.hasMyMessageClass && layout1_partner.flexDirection === 'row';

    console.log('\n' + '='.repeat(60));
    if (user1_myMessageCorrect && user2_myMessageCorrect && user1_partnerMessageCorrect) {
      console.log('🎉 聊天界面消息布局测试通过！');
      console.log('   ✅ 用户1发送的消息正确显示在右边');
      console.log('   ✅ 用户2发送的消息正确显示在右边');
      console.log('   ✅ 用户1看到对方消息正确显示在左边');
      console.log('   ✅ my-message CSS类正确应用');
      console.log('   ✅ flex-direction 正确设置');
    } else {
      console.log('❌ 聊天界面消息布局测试失败！');
      console.log('   用户1自己的消息:', user1_myMessageCorrect ? '✅ 正确' : '❌ 错误');
      console.log('   用户2自己的消息:', user2_myMessageCorrect ? '✅ 正确' : '❌ 错误');
      console.log('   用户1看到对方消息:', user1_partnerMessageCorrect ? '✅ 正确' : '❌ 错误');
    }
    console.log('='.repeat(60));

    console.log('\n⏸️  浏览器将保持10秒，请目视确认消息布局...');
    await wait(10000);

  } catch (error) {
    console.error('❌ 测试出错:', error.message);
    console.log('\n' + '='.repeat(60));
    console.log('❌ 聊天界面消息布局测试失败！');
    console.log('   错误:', error.message);
    console.log('='.repeat(60));
  } finally {
    if (browser1) await browser1.close();
    if (browser2) await browser2.close();
  }
}

testChatUILayout().catch(console.error);

