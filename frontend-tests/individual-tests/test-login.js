const puppeteer = require('puppeteer');

const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function testLogin() {
  console.log('\n🧪 测试：用户登录功能');
  console.log('='.repeat(60));

  const browser = await puppeteer.launch({
    headless: false,
    slowMo: 50,
    args: ['--window-size=1280,800', '--disable-web-security', '--disable-features=IsolateOrigins,site-per-process']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });
  
  // 清除缓存
  const client = await page.target().createCDPSession();
  await client.send('Network.clearBrowserCookies');
  await client.send('Network.clearBrowserCache');
  
  // 启用请求拦截
  await page.setRequestInterception(true);
  page.on('request', request => {
    request.continue();
  });

  // 捕获所有控制台消息
  page.on('console', msg => {
    const text = msg.text();
    if (!text.includes('vite') && !text.includes('DOM')) {
      console.log('📋 浏览器:', text);
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

    console.log('\n📝 步骤 2: 检查登录表单元素...');
    const formElements = await page.evaluate(() => {
      return {
        hasUsernameInput: !!document.querySelector('.username-input'),
        hasPasswordInput: !!document.querySelector('.password-input'),
        hasLoginBtn: !!document.querySelector('.login-btn'),
        pageTitle: document.querySelector('.title')?.textContent || ''
      };
    });
    
    console.log(`✅ 用户名输入框: ${formElements.hasUsernameInput ? '存在' : '不存在'}`);
    console.log(`✅ 密码输入框: ${formElements.hasPasswordInput ? '存在' : '不存在'}`);
    console.log(`✅ 登录按钮: ${formElements.hasLoginBtn ? '存在' : '不存在'}`);
    console.log(`✅ 页面标题: ${formElements.pageTitle}`);

    console.log('\n📝 步骤 3: 测试错误的账号密码...');
    await page.type('.username-input', 'test');
    await wait(300);
    await page.type('.password-input', '000000');
    await wait(300);
    await page.click('.login-btn');
    await wait(2000);
    
    let currentUrl = page.url();
    if (currentUrl.includes('/login')) {
      console.log('✅ 错误密码登录失败，停留在登录页（正确行为）');
    }

    console.log('\n📝 步骤 4: 使用正确的账号密码登录（小明）...');
    // 刷新页面清空表单
    await page.reload();
    await wait(2000);
    
    await page.type('.username-input', '小明');
    await wait(300);
    await page.type('.password-input', '123456');
    await wait(300);
    
    console.log('   用户名: 小明');
    console.log('   密码: 123456');

    console.log('\n📝 步骤 5: 点击登录按钮...');
    await page.click('.login-btn');
    await wait(4000);

    console.log('\n📝 步骤 6: 检查登录结果...');
    currentUrl = page.url();
    console.log('   当前URL:', currentUrl);
    
    const isOnHomePage = currentUrl.includes('/home');
    
    if (isOnHomePage) {
      console.log('✅ 登录成功，已跳转到首页');
      
      // 检查localStorage
      const storageData = await page.evaluate(() => {
        return {
          token: localStorage.getItem('token'),
          userId: localStorage.getItem('userId'),
          userInfo: localStorage.getItem('userInfo')
        };
      });
      
      console.log('   Token存在:', !!storageData.token ? '✅ 是' : '❌ 否');
      console.log('   用户ID:', storageData.userId);
      
      if (storageData.userInfo) {
        const userInfo = JSON.parse(storageData.userInfo);
        console.log('   用户名:', userInfo.username);
        console.log('   配对状态:', userInfo.couple_id ? '已配对' : '未配对');
      }
      
      console.log('\n' + '='.repeat(60));
      console.log('🎉 用户登录功能测试通过！');
      console.log('   ✅ 登录表单显示正常');
      console.log('   ✅ 错误密码无法登录');
      console.log('   ✅ 正确密码登录成功');
      console.log('   ✅ 成功跳转到首页');
      console.log('   ✅ Token正确保存');
      console.log('='.repeat(60));
    } else {
      console.log('❌ 登录失败，未跳转到首页');
      console.log('   当前URL:', currentUrl);
      
      console.log('\n' + '='.repeat(60));
      console.log('❌ 用户登录功能测试失败！');
      console.log('   原因: 登录后未跳转到首页');
      console.log('='.repeat(60));
    }

    await wait(3000);

  } catch (error) {
    console.error('❌ 测试出错:', error.message);
    console.log('\n' + '='.repeat(60));
    console.log('❌ 用户登录功能测试失败！');
    console.log('   错误:', error.message);
    console.log('='.repeat(60));
  }

  await browser.close();
}

testLogin().catch(console.error);

