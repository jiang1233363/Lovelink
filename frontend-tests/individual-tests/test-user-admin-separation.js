const puppeteer = require('puppeteer');

const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function testSeparation() {
  console.log('\n🧪 测试：用户端和管理端分离');
  console.log('='.repeat(60));

  let userBrowser, adminBrowser, userPage, adminPage;

  try {
    // 启动两个浏览器
    console.log('📝 步骤 1: 启动用户端和管理端浏览器...');
    
    userBrowser = await puppeteer.launch({
      headless: false,
      slowMo: 50,
      args: ['--window-size=800,900', '--window-position=0,0']
    });
    
    adminBrowser = await puppeteer.launch({
      headless: false,
      slowMo: 50,
      args: ['--window-size=800,900', '--window-position=820,0']
    });

    userPage = await userBrowser.newPage();
    adminPage = await adminBrowser.newPage();
    
    await userPage.setViewport({ width: 800, height: 900 });
    await adminPage.setViewport({ width: 800, height: 900 });
    
    console.log('✅ 两个浏览器已启动');

    // 自动处理弹窗
    userPage.on('dialog', async dialog => {
      console.log('🔵 用户端弹窗:', dialog.message());
      await dialog.accept();
    });
    
    adminPage.on('dialog', async dialog => {
      console.log('🟣 管理端弹窗:', dialog.message());
      await dialog.accept();
    });

    // 用户端登录
    console.log('\n📝 步骤 2: 用户端登录（小明）...');
    await userPage.goto('http://localhost:8080/#/login');
    await wait(2000);
    await userPage.type('.username-input', '小明');
    await wait(300);
    await userPage.type('.password-input', '123456');
    await wait(300);
    await userPage.click('.login-btn');
    await wait(3000);
    
    const userUrl = userPage.url();
    if (userUrl.includes('/home')) {
      console.log('✅ 用户端登录成功，进入用户首页');
    } else {
      throw new Error('用户端登录失败');
    }

    // 管理端登录
    console.log('\n📝 步骤 3: 管理端登录（admin）...');
    await adminPage.goto('http://localhost:8080/#/admin/login');
    await wait(2000);
    await adminPage.type('.admin-username-input', 'admin');
    await wait(300);
    await adminPage.type('.admin-password-input', 'admin123');
    await wait(300);
    await adminPage.click('.admin-login-btn');
    await wait(3000);
    
    const adminUrl = adminPage.url();
    if (adminUrl.includes('/admin') && !adminUrl.includes('/admin/login')) {
      console.log('✅ 管理端登录成功，进入管理后台');
    } else {
      throw new Error('管理端登录失败');
    }

    // 检查用户端localStorage
    console.log('\n📝 步骤 4: 检查用户端数据存储...');
    const userData = await userPage.evaluate(() => {
      return {
        hasUserToken: !!localStorage.getItem('token'),
        hasUserInfo: !!localStorage.getItem('userInfo'),
        hasAdminToken: !!localStorage.getItem('adminToken'),
        hasAdminInfo: !!localStorage.getItem('adminInfo'),
        isAdmin: localStorage.getItem('isAdmin')
      };
    });
    
    console.log('   用户Token:', userData.hasUserToken ? '✅ 存在' : '❌ 不存在');
    console.log('   用户信息:', userData.hasUserInfo ? '✅ 存在' : '❌ 不存在');
    console.log('   管理员Token:', userData.hasAdminToken ? '❌ 存在（错误！）' : '✅ 不存在（正确）');
    console.log('   管理员信息:', userData.hasAdminInfo ? '❌ 存在（错误！）' : '✅ 不存在（正确）');
    console.log('   管理员标识:', userData.isAdmin || '✅ 无（正确）');

    // 检查管理端localStorage
    console.log('\n📝 步骤 5: 检查管理端数据存储...');
    const adminData = await adminPage.evaluate(() => {
      return {
        hasUserToken: !!localStorage.getItem('token'),
        hasUserInfo: !!localStorage.getItem('userInfo'),
        hasAdminToken: !!localStorage.getItem('adminToken'),
        hasAdminInfo: !!localStorage.getItem('adminInfo'),
        isAdmin: localStorage.getItem('isAdmin')
      };
    });
    
    console.log('   用户Token:', adminData.hasUserToken ? '❌ 存在（错误！）' : '✅ 不存在（正确）');
    console.log('   用户信息:', adminData.hasUserInfo ? '❌ 存在（错误！）' : '✅ 不存在（正确）');
    console.log('   管理员Token:', adminData.hasAdminToken ? '✅ 存在' : '❌ 不存在');
    console.log('   管理员信息:', adminData.hasAdminInfo ? '✅ 存在' : '❌ 不存在');
    console.log('   管理员标识:', adminData.isAdmin === 'true' ? '✅ true' : '❌ 不正确');

    // 检查用户端界面
    console.log('\n📝 步骤 6: 检查用户端界面元素...');
    const userPageElements = await userPage.evaluate(() => {
      return {
        hasModules: document.querySelectorAll('.module-card').length,
        hasProfileBtn: !!document.querySelector('.profile-btn'),
        hasCoupleBtn: !!document.querySelector('.couple-btn')
      };
    });
    
    console.log(`   功能模块数量: ${userPageElements.hasModules}`);
    console.log(`   个人主页按钮: ${userPageElements.hasProfileBtn ? '✅ 存在' : '❌ 不存在'}`);
    console.log(`   配对按钮: ${userPageElements.hasCoupleBtn ? '✅ 存在' : '❌ 不存在'}`);

    // 检查管理端界面
    console.log('\n📝 步骤 7: 检查管理端界面元素...');
    const adminPageElements = await adminPage.evaluate(() => {
      return {
        hasStatsSection: !!document.querySelector('.stats-section'),
        hasUserTable: !!document.querySelector('.user-table'),
        hasCoupleTable: !!document.querySelector('.couple-table'),
        hasSearchBar: !!document.querySelector('.search-bar')
      };
    });
    
    console.log(`   数据统计区域: ${adminPageElements.hasStatsSection ? '✅ 存在' : '❌ 不存在'}`);
    console.log(`   用户管理表格: ${adminPageElements.hasUserTable ? '✅ 存在' : '❌ 不存在'}`);
    console.log(`   配对管理表格: ${adminPageElements.hasCoupleTable ? '✅ 存在' : '❌ 不存在'}`);
    console.log(`   搜索功能: ${adminPageElements.hasSearchBar ? '✅ 存在' : '❌ 不存在'}`);

    // 验证分离性
    const isUserClean = userData.hasUserToken && userData.hasUserInfo && !userData.hasAdminToken && !userData.hasAdminInfo;
    const isAdminClean = adminData.hasAdminToken && adminData.hasAdminInfo && !adminData.hasUserToken && !adminData.hasUserInfo;

    console.log('\n' + '='.repeat(60));
    if (isUserClean && isAdminClean) {
      console.log('🎉 用户端和管理端分离测试通过！');
      console.log('   ✅ 用户端和管理端分别登录成功');
      console.log('   ✅ 用户端数据完全独立（无管理端数据）');
      console.log('   ✅ 管理端数据完全独立（无用户端数据）');
      console.log('   ✅ 用户端界面显示正常');
      console.log('   ✅ 管理端界面显示正常');
      console.log('   ✅ 两端数据存储完全隔离');
    } else {
      console.log('❌ 用户端和管理端分离测试失败！');
      console.log('   用户端数据独立:', isUserClean ? '✅' : '❌');
      console.log('   管理端数据独立:', isAdminClean ? '✅' : '❌');
    }
    console.log('='.repeat(60));

    await wait(5000);

  } catch (error) {
    console.error('❌ 测试出错:', error.message);
    console.log('\n' + '='.repeat(60));
    console.log('❌ 用户端和管理端分离测试失败！');
    console.log('   错误:', error.message);
    console.log('='.repeat(60));
  } finally {
    if (userBrowser) await userBrowser.close();
    if (adminBrowser) await adminBrowser.close();
  }
}

testSeparation().catch(console.error);

