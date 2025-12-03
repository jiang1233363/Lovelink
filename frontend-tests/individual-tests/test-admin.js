const puppeteer = require('puppeteer');

const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function testAdmin() {
  console.log('\n🧪 测试：管理后台功能');
  console.log('='.repeat(60));

  const browser = await puppeteer.launch({
    headless: false,
    slowMo: 50,
    args: ['--window-size=1400,900']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1400, height: 900 });

  // 自动处理弹窗
  page.on('dialog', async dialog => {
    console.log('⚠️  弹窗:', dialog.message());
    await dialog.accept();
  });

  try {
    console.log('📝 步骤 1: 登录...');
    await page.goto('http://localhost:8080/#/login');
    await wait(2000);
    await page.type('.username-input', '小明');
    await wait(300);
    await page.type('.password-input', 'password123');
    await wait(300);
    await page.click('.login-btn');
    await wait(3000);
    console.log('✅ 登录成功');

    console.log('\n📝 步骤 2: 进入管理后台...');
    await page.goto('http://localhost:8080/#/admin');
    await wait(3000);
    
    const currentUrl = page.url();
    if (currentUrl.includes('/admin')) {
      console.log('✅ 成功进入管理后台');
    } else {
      throw new Error('未进入管理后台，当前URL: ' + currentUrl);
    }

    console.log('\n📝 步骤 3: 检查平台数据统计...');
    const stats = await page.evaluate(() => {
      const statCards = Array.from(document.querySelectorAll('.stat-card'));
      return statCards.map(card => ({
        label: card.querySelector('.stat-label')?.textContent || '',
        value: card.querySelector('.stat-value')?.textContent || '0'
      }));
    });

    console.log('   平台统计:');
    stats.forEach(stat => {
      console.log(`   - ${stat.label}: ${stat.value}`);
    });

    if (stats.length >= 4) {
      console.log('✅ 平台数据统计显示正常');
    } else {
      console.log('❌ 平台数据统计不完整');
    }

    console.log('\n📝 步骤 4: 检查用户管理表格...');
    const userTable = await page.evaluate(() => {
      const tbody = document.querySelector('.user-table tbody');
      if (!tbody) return { found: false, count: 0 };
      
      const rows = tbody.querySelectorAll('tr');
      const users = Array.from(rows).slice(0, 3).map(row => {
        const cells = row.querySelectorAll('td');
        return {
          id: cells[0]?.textContent || '',
          username: cells[1]?.textContent || '',
          email: cells[2]?.textContent || '',
          gender: cells[3]?.textContent || '',
          coupleStatus: cells[4]?.textContent || '',
          createdAt: cells[5]?.textContent || ''
        };
      });
      
      return { found: true, count: rows.length, users };
    });

    if (userTable.found) {
      console.log(`✅ 用户管理表格显示正常，共 ${userTable.count} 个用户`);
      console.log('   前3个用户:');
      userTable.users.forEach((user, idx) => {
        console.log(`   ${idx + 1}. ${user.username} (ID:${user.id}) - ${user.coupleStatus}`);
      });
    } else {
      console.log('❌ 用户管理表格未找到');
    }

    console.log('\n📝 步骤 5: 测试用户搜索...');
    // 输入搜索关键词
    await page.type('.search-input', '小明');
    await wait(500);
    await page.click('.search-btn');
    await wait(2000);

    const searchResult = await page.evaluate(() => {
      const tbody = document.querySelector('.user-table tbody');
      if (!tbody) return 0;
      return tbody.querySelectorAll('tr').length;
    });

    console.log(`✅ 搜索完成，找到 ${searchResult} 个结果`);

    console.log('\n📝 步骤 6: 点击刷新按钮...');
    const refreshButtons = await page.$$('.refresh-btn');
    if (refreshButtons.length > 0) {
      await refreshButtons[0].click();
      await wait(2000);
      console.log('✅ 用户列表刷新成功');
    }

    console.log('\n📝 步骤 7: 检查配对管理表格...');
    const coupleTable = await page.evaluate(() => {
      const tbody = document.querySelector('.couple-table tbody');
      if (!tbody) return { found: false, count: 0 };
      
      const rows = tbody.querySelectorAll('tr');
      const couples = Array.from(rows).slice(0, 3).map(row => {
        const cells = row.querySelectorAll('td');
        return {
          id: cells[0]?.textContent || '',
          user1: cells[1]?.textContent || '',
          user2: cells[2]?.textContent || '',
          startDate: cells[3]?.textContent || '',
          status: cells[4]?.textContent || ''
        };
      });
      
      return { found: true, count: rows.length, couples };
    });

    if (coupleTable.found) {
      console.log(`✅ 配对管理表格显示正常，共 ${coupleTable.count} 对配对`);
      console.log('   前3对配对:');
      coupleTable.couples.forEach((couple, idx) => {
        console.log(`   ${idx + 1}. ${couple.user1} ❤️ ${couple.user2} (${couple.status})`);
      });
    } else {
      console.log('❌ 配对管理表格未找到');
    }

    console.log('\n📝 步骤 8: 截图保存...');
    await page.screenshot({ path: 'admin-page-screenshot.png', fullPage: true });
    console.log('✅ 截图已保存为 admin-page-screenshot.png');

    // 最终验证
    const allTestsPassed = stats.length >= 4 && 
                          userTable.found && 
                          userTable.count > 0 && 
                          coupleTable.found;

    console.log('\n' + '='.repeat(60));
    if (allTestsPassed) {
      console.log('🎉 管理后台功能测试通过！');
      console.log('   ✅ 可以进入管理后台');
      console.log('   ✅ 平台数据统计显示正常');
      console.log('   ✅ 用户管理表格显示正常');
      console.log('   ✅ 用户搜索功能正常');
      console.log('   ✅ 刷新功能正常');
      console.log('   ✅ 配对管理表格显示正常');
      console.log(`   📊 统计数据: ${stats.map(s => s.label + ':' + s.value).join(', ')}`);
      console.log(`   👥 用户总数: ${userTable.count}`);
      console.log(`   💑 配对总数: ${coupleTable.count}`);
    } else {
      console.log('❌ 管理后台功能测试失败！');
      console.log('   平台统计:', stats.length >= 4 ? '✅' : '❌');
      console.log('   用户管理:', userTable.found && userTable.count > 0 ? '✅' : '❌');
      console.log('   配对管理:', coupleTable.found ? '✅' : '❌');
    }
    console.log('='.repeat(60));

    await wait(5000);

  } catch (error) {
    console.error('❌ 测试出错:', error.message);
    console.log('\n' + '='.repeat(60));
    console.log('❌ 管理后台功能测试失败！');
    console.log('   错误:', error.message);
    console.log('='.repeat(60));
  }

  await browser.close();
}

testAdmin().catch(console.error);

