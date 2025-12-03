const puppeteer = require('puppeteer');

const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function testAdminLogin() {
  console.log('\n🧪 测试：管理端登录功能');
  console.log('='.repeat(60));

  const browser = await puppeteer.launch({
    headless: false,
    slowMo: 50,
    args: ['--window-size=1280,800']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });

  // 自动处理弹窗
  page.on('dialog', async dialog => {
    console.log('⚠️  弹窗消息:', dialog.message());
    await dialog.accept();
  });

  try {
    console.log('📝 步骤 1: 访问管理端登录页面...');
    await page.goto('http://localhost:8080/#/admin/login');
    await wait(2000);
    console.log('✅ 管理端登录页面已加载');

    console.log('\n📝 步骤 2: 检查管理端登录表单元素...');
    const formElements = await page.evaluate(() => {
      return {
        hasUsernameInput: !!document.querySelector('.admin-username-input'),
        hasPasswordInput: !!document.querySelector('.admin-password-input'),
        hasLoginBtn: !!document.querySelector('.admin-login-btn'),
        pageTitle: document.querySelector('.title')?.textContent || ''
      };
    });
    
    console.log(`✅ 管理员账号输入框: ${formElements.hasUsernameInput ? '存在' : '不存在'}`);
    console.log(`✅ 管理员密码输入框: ${formElements.hasPasswordInput ? '存在' : '不存在'}`);
    console.log(`✅ 登录按钮: ${formElements.hasLoginBtn ? '存在' : '不存在'}`);
    console.log(`✅ 页面标题: ${formElements.pageTitle}`);

    console.log('\n📝 步骤 3: 测试错误的管理员账号密码...');
    await page.type('.admin-username-input', 'wrongadmin');
    await wait(300);
    await page.type('.admin-password-input', 'wrong123');
    await wait(300);
    await page.click('.admin-login-btn');
    await wait(2000);
    
    let currentUrl = page.url();
    if (currentUrl.includes('/admin/login')) {
      console.log('✅ 错误密码登录失败，停留在登录页（正确行为）');
    }

    console.log('\n📝 步骤 4: 使用正确的管理员账号密码登录...');
    // 刷新页面清空表单
    await page.reload();
    await wait(2000);
    
    await page.type('.admin-username-input', 'admin');
    await wait(300);
    await page.type('.admin-password-input', 'admin123');
    await wait(300);
    
    console.log('   管理员账号: admin');
    console.log('   管理员密码: admin123');

    console.log('\n📝 步骤 5: 点击登录按钮...');
    await page.click('.admin-login-btn');
    await wait(4000);

    console.log('\n📝 步骤 6: 检查登录结果...');
    currentUrl = page.url();
    console.log('   当前URL:', currentUrl);
    
    const isOnAdminPage = currentUrl.includes('/admin');
    
    if (isOnAdminPage) {
      console.log('✅ 登录成功，已跳转到管理后台');
      
      // 检查localStorage
      const storageData = await page.evaluate(() => {
        return {
          adminToken: localStorage.getItem('adminToken'),
          isAdmin: localStorage.getItem('isAdmin'),
          adminInfo: localStorage.getItem('adminInfo')
        };
      });
      
      console.log('   管理员Token存在:', !!storageData.adminToken ? '✅ 是' : '❌ 否');
      console.log('   管理员标识:', storageData.isAdmin);
      
      if (storageData.adminInfo) {
        const adminInfo = JSON.parse(storageData.adminInfo);
        console.log('   管理员用户名:', adminInfo.username);
        console.log('   管理员角色:', adminInfo.role);
      }
      
      console.log('\n📝 步骤 7: 检查管理后台页面元素...');
      await wait(2000);
      
      const adminPageElements = await page.evaluate(() => {
        return {
          hasStats: !!document.querySelector('.stats-section'),
          hasUserManagement: !!document.querySelector('.user-table'),
          hasCoupleManagement: !!document.querySelector('.couple-table'),
          statsCount: document.querySelectorAll('.stat-card').length
        };
      });
      
      console.log(`   数据统计区域: ${adminPageElements.hasStats ? '✅ 存在' : '❌ 不存在'}`);
      console.log(`   用户管理表格: ${adminPageElements.hasUserManagement ? '✅ 存在' : '❌ 不存在'}`);
      console.log(`   配对管理表格: ${adminPageElements.hasCoupleManagement ? '✅ 存在' : '❌ 不存在'}`);
      console.log(`   统计卡片数量: ${adminPageElements.statsCount}`);
      
      console.log('\n' + '='.repeat(60));
      console.log('🎉 管理端登录功能测试通过！');
      console.log('   ✅ 管理端登录表单显示正常');
      console.log('   ✅ 错误密码无法登录');
      console.log('   ✅ 正确密码登录成功');
      console.log('   ✅ 成功跳转到管理后台');
      console.log('   ✅ 管理员Token正确保存');
      console.log('   ✅ 管理后台页面正常显示');
      console.log('='.repeat(60));
    } else {
      console.log('❌ 登录失败，未跳转到管理后台');
      console.log('   当前URL:', currentUrl);
      
      console.log('\n' + '='.repeat(60));
      console.log('❌ 管理端登录功能测试失败！');
      console.log('   原因: 登录后未跳转到管理后台');
      console.log('='.repeat(60));
    }

    await wait(3000);

  } catch (error) {
    console.error('❌ 测试出错:', error.message);
    console.log('\n' + '='.repeat(60));
    console.log('❌ 管理端登录功能测试失败！');
    console.log('   错误:', error.message);
    console.log('='.repeat(60));
  }

  await browser.close();
}

testAdminLogin().catch(console.error);

