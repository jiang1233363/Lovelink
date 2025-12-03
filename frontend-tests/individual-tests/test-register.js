const puppeteer = require('puppeteer');

const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function testRegister() {
  console.log('\n🧪 测试：用户注册功能');
  console.log('='.repeat(60));

  const browser = await puppeteer.launch({
    headless: false,
    slowMo: 50,
    args: ['--window-size=1280,800']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });

  // 捕获所有控制台消息
  const consoleMessages = [];
  page.on('console', msg => {
    const text = msg.text();
    consoleMessages.push(text);
    console.log('📋 浏览器:', text);
  });

  // 捕获网络响应
  const responses = [];
  page.on('response', async response => {
    const url = response.url();
    if (url.includes('/user/register')) {
      try {
        const body = await response.json();
        console.log('🌐 注册API响应:', JSON.stringify(body, null, 2));
        responses.push(body);
      } catch (e) {
        console.log('⚠️  无法解析响应');
      }
    }
  });

  // 自动处理弹窗
  page.on('dialog', async dialog => {
    console.log('⚠️  弹窗消息:', dialog.message());
    await dialog.accept();
  });

  try {
    console.log('📝 步骤 1: 访问登录页面...');
    await page.goto('http://localhost:8080/#/login');
    await wait(2000);
    console.log('✅ 登录页面已加载');

    console.log('\n📝 步骤 2: 点击"去注册"链接...');
    await page.evaluate(() => {
      const registerLink = Array.from(document.querySelectorAll('.hint'))
        .find(el => el.textContent.includes('去注册'));
      if (registerLink) registerLink.click();
    });
    await wait(2000);
    console.log('✅ 进入注册页面');

    console.log('\n📝 步骤 3: 检查注册表单元素...');
    const formElements = await page.evaluate(() => {
      return {
        hasUsernameInput: !!document.querySelector('.username-input'),
        hasEmailInput: !!document.querySelector('.email-input'),
        hasPasswordInput: !!document.querySelector('.password-input'),
        hasRegisterBtn: !!document.querySelector('.register-btn'),
        pageTitle: document.querySelector('.title')?.textContent || ''
      };
    });
    
    console.log(`✅ 用户名输入框: ${formElements.hasUsernameInput ? '存在' : '不存在'}`);
    console.log(`✅ 邮箱输入框: ${formElements.hasEmailInput ? '存在' : '不存在'}`);
    console.log(`✅ 密码输入框: ${formElements.hasPasswordInput ? '存在' : '不存在'}`);
    console.log(`✅ 注册按钮: ${formElements.hasRegisterBtn ? '存在' : '不存在'}`);
    console.log(`✅ 页面标题: ${formElements.pageTitle}`);

    // 生成唯一的测试用户名
    const timestamp = Date.now();
    const testUsername = `测试用户_${timestamp}`;
    const testEmail = `test_${timestamp}@lovelink.com`;
    const testPassword = 'Test123456';

    console.log(`\n📝 步骤 4: 填写注册表单...`);
    console.log(`   用户名: ${testUsername}`);
    console.log(`   邮箱: ${testEmail}`);
    console.log(`   密码: ${testPassword}`);

    // 填写表单
    await page.type('.username-input', testUsername);
    await wait(500);
    await page.type('.email-input', testEmail);
    await wait(500);
    await page.type('.password-input', testPassword);
    await wait(500);
    console.log('✅ 表单填写完成');

    console.log('\n📝 步骤 5: 提交注册...');
    await page.click('.register-btn');
    await wait(3000);
    console.log('✅ 注册请求已发送');

    console.log('\n📝 步骤 6: 检查注册结果...');
    const currentUrl = page.url();
    const isOnLoginPage = currentUrl.includes('/login');
    
    if (isOnLoginPage) {
      console.log('✅ 注册成功，已跳转到登录页面');
      
      console.log('\n📝 步骤 7: 使用新账号登录验证...');
      await wait(2000);
      
      // 填写登录表单
      await page.type('.username-input', testUsername);
      await wait(500);
      await page.type('.password-input', testPassword);
      await wait(500);
      
      console.log('✅ 登录表单填写完成');
      
      console.log('\n📝 步骤 8: 提交登录...');
      await page.click('.login-btn');
      await wait(4000);
      
      const finalUrl = page.url();
      const isOnHomePage = finalUrl.includes('/home');
      
      if (isOnHomePage) {
        console.log('✅ 使用新账号登录成功！');
        
        // 获取用户信息
        const userInfo = await page.evaluate(() => {
          const info = localStorage.getItem('userInfo');
          return info ? JSON.parse(info) : null;
        });
        
        console.log(`✅ 用户信息: ${JSON.stringify(userInfo)}`);
        
        console.log('\n' + '='.repeat(60));
        console.log('🎉 用户注册功能测试通过！');
        console.log('   ✅ 注册表单显示正常');
        console.log('   ✅ 注册提交成功');
        console.log('   ✅ 自动跳转到登录页');
        console.log('   ✅ 新账号可以正常登录');
        console.log(`   ✅ 测试账号: ${testUsername}`);
        console.log('='.repeat(60));
      } else {
        console.log('❌ 登录失败，未跳转到首页');
        console.log('   当前URL:', finalUrl);
      }
    } else {
      console.log('❌ 注册后未跳转到登录页面');
      console.log('   当前URL:', currentUrl);
      console.log('\n' + '='.repeat(60));
      console.log('❌ 用户注册功能测试失败！');
      console.log('   原因: 注册后未跳转到登录页');
      console.log('='.repeat(60));
    }

    await wait(2000);

  } catch (error) {
    console.error('❌ 测试出错:', error.message);
    console.log('\n' + '='.repeat(60));
    console.log('❌ 用户注册功能测试失败！');
    console.log('   错误:', error.message);
    console.log('='.repeat(60));
  }

  await browser.close();
}

testRegister().catch(console.error);

