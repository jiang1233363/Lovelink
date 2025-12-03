const puppeteer = require('puppeteer');

const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function testFireman() {
  console.log('\n🧪 测试：情侣消防员功能（双用户测试）');
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

  // 监听弹窗
  page1.on('dialog', async dialog => {
    console.log('👤 小明弹窗:', dialog.message());
    await dialog.accept();
  });
  
  page2.on('dialog', async dialog => {
    console.log('👤 小红弹窗:', dialog.message());
    await dialog.accept();
  });

  try {
    // ========== 步骤 1: 两个用户登录 ==========
    console.log('\n📝 步骤 1: 小明登录...');
    await page1.goto('http://localhost:8080/#/login');
    await wait(2000);
    await page1.type('.username-input', '小明');
    await wait(200);
    await page1.type('.password-input', '123456');
    await wait(200);
    await page1.click('.login-btn');
    await wait(3000);
    console.log('✅ 小明登录成功');

    console.log('\n📝 步骤 2: 小红登录...');
    await page2.goto('http://localhost:8080/#/login');
    await wait(2000);
    await page2.type('.username-input', '小红');
    await wait(200);
    await page2.type('.password-input', '123456');
    await wait(200);
    await page2.click('.login-btn');
    await wait(3000);
    console.log('✅ 小红登录成功');

    // ========== 步骤 2: 两个用户进入消防员页面 ==========
    console.log('\n📝 步骤 3: 小明进入争吵消防员页面...');
    await page1.evaluate(() => {
      const card = Array.from(document.querySelectorAll('.module-card'))
        .find(c => c.textContent.includes('消防员') || c.textContent.includes('争吵'));
      if (card) card.click();
    });
    await wait(2000);
    console.log('✅ 小明已进入消防员页面');

    console.log('\n📝 步骤 4: 小红进入争吵消防员页面...');
    await page2.evaluate(() => {
      const card = Array.from(document.querySelectorAll('.module-card'))
        .find(c => c.textContent.includes('消防员') || c.textContent.includes('争吵'));
      if (card) card.click();
    });
    await wait(2000);
    console.log('✅ 小红已进入消防员页面');

    // ========== 步骤 3: 小明添加争吵记录 ==========
    console.log('\n📝 步骤 5: 小明添加争吵记录...');
    await page1.click('.add-btn');
    await wait(1000);
    await page1.type('.conflict-reason-input', '测试：关于晚饭吃什么的小争执');
    await wait(500);
    await page1.click('.save-btn');
    await wait(2000);
    console.log('✅ 小明添加争吵记录成功');

    // ========== 步骤 4: 检查小红是否能看到记录 ==========
    console.log('\n📝 步骤 6: 刷新小红的页面，检查是否能看到记录...');
    await page2.reload();
    await wait(2000);
    
    const xiaohongCanSeeRecord = await page2.evaluate(() => {
      const content = document.body.textContent;
      return content.includes('关于晚饭吃什么');
    });
    
    console.log(`   小红能看到记录: ${xiaohongCanSeeRecord ? '✅' : '❌'}`);

    // ========== 步骤 5: 小明发送道歉 ==========
    console.log('\n📝 步骤 7: 小明发送道歉...');
    const xiaomingBeforeApology = await page1.evaluate(() => document.body.textContent);
    await page1.click('.action-btn.sorry');
    await wait(2000);
    console.log('✅ 小明已点击发送道歉');

    // ========== 步骤 6: 检查小红是否收到道歉通知 ==========
    console.log('\n📝 步骤 8: 检查小红是否收到道歉通知...');
    await page2.reload();
    await wait(2000);
    
    const xiaohongReceivedApology = await page2.evaluate(() => {
      const content = document.body.textContent;
      // 检查是否有道歉相关的通知或显示
      return content.includes('道歉') || content.includes('🙏');
    });
    
    console.log(`   小红收到道歉通知: ${xiaohongReceivedApology ? '✅' : '❌'}`);

    // ========== 步骤 7: 小明发送拥抱 ==========
    console.log('\n📝 步骤 9: 小明发送虚拟拥抱...');
    await page1.click('.action-btn.hug');
    await wait(2000);
    console.log('✅ 小明已点击发送拥抱');

    // ========== 步骤 8: 检查小红是否收到拥抱通知 ==========
    console.log('\n📝 步骤 10: 检查小红是否收到拥抱通知...');
    await page2.reload();
    await wait(2000);
    
    const xiaohongReceivedHug = await page2.evaluate(() => {
      const content = document.body.textContent;
      // 检查是否有拥抱相关的通知或显示
      return content.includes('拥抱') || content.includes('🤗');
    });
    
    console.log(`   小红收到拥抱通知: ${xiaohongReceivedHug ? '✅' : '❌'}`);

    // ========== 步骤 9: 小红标记和解 ==========
    console.log('\n📝 步骤 11: 小红标记和解...');
    const resolveBtn = await page2.$('.resolve-btn');
    if (resolveBtn) {
      await resolveBtn.click();
      await wait(2000);
      console.log('✅ 小红已点击标记和解');
    } else {
      console.log('⚠️  未找到和解按钮');
    }

    // ========== 步骤 10: 检查小明是否能看到和解状态 ==========
    console.log('\n📝 步骤 12: 检查小明是否能看到和解状态...');
    await page1.reload();
    await wait(2000);
    
    const xiaomingSeesResolved = await page1.evaluate(() => {
      const content = document.body.textContent;
      return content.includes('已和解');
    });
    
    console.log(`   小明看到和解状态: ${xiaomingSeesResolved ? '✅' : '❌'}`);

    // ========== 最终结果 ==========
    console.log('\n' + '='.repeat(60));
    console.log('📊 测试结果总结:');
    console.log(`   ✅ 争吵记录共享: ${xiaohongCanSeeRecord ? '正常' : '❌ 失败'}`);
    console.log(`   ${xiaohongReceivedApology ? '✅' : '❌'} 道歉通知: ${xiaohongReceivedApology ? '正常' : '失败（对方看不到）'}`);
    console.log(`   ${xiaohongReceivedHug ? '✅' : '❌'} 拥抱通知: ${xiaohongReceivedHug ? '正常' : '失败（对方看不到）'}`);
    console.log(`   ${xiaomingSeesResolved ? '✅' : '❌'} 和解状态共享: ${xiaomingSeesResolved ? '正常' : '失败'}`);
    
    if (xiaohongCanSeeRecord && xiaomingSeesResolved && !xiaohongReceivedApology && !xiaohongReceivedHug) {
      console.log('\n🔍 诊断结果:');
      console.log('   ✅ 争吵记录可以共享（存入数据库）');
      console.log('   ✅ 和解状态可以共享（更新数据库）');
      console.log('   ❌ 道歉和拥抱没有通知机制（后端只返回成功，没有保存记录或推送）');
      console.log('\n💡 建议修复:');
      console.log('   1. 后端应该保存道歉/拥抱记录到数据库');
      console.log('   2. 添加通知表或消息队列');
      console.log('   3. 前端定期拉取或使用 WebSocket 实时推送');
    }
    
    console.log('='.repeat(60));

    await wait(3000);

  } catch (error) {
    console.error('❌ 测试出错:', error.message);
    console.error(error.stack);
  }

  await browser1.close();
  await browser2.close();
}

testFireman().catch(console.error);





