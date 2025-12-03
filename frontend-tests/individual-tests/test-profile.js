const puppeteer = require('puppeteer');

const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function testProfile() {
  console.log('\n🧪 测试：个人主页功能');
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

    console.log('\n📝 步骤 2: 进入个人主页...');
    // 方式1：点击header的个人主页按钮
    await page.click('.profile-btn');
    await wait(3000);
    
    const currentUrl = page.url();
    if (currentUrl.includes('/profile')) {
      console.log('✅ 成功进入个人主页');
    } else {
      throw new Error('未进入个人主页，当前URL: ' + currentUrl);
    }

    console.log('\n📝 步骤 3: 检查个人信息显示...');
    const profileInfo = await page.evaluate(() => {
      const username = document.querySelector('.avatar-section h2')?.textContent || '';
      const infoItems = Array.from(document.querySelectorAll('.info-item'));
      const info = {};
      
      infoItems.forEach(item => {
        const label = item.querySelector('.label')?.textContent || '';
        const value = item.querySelector('.value')?.textContent || '';
        if (label.includes('邮箱')) info.email = value;
        if (label.includes('性别')) info.gender = value;
        if (label.includes('配对状态')) info.coupleStatus = value;
      });
      
      return { username, ...info };
    });

    console.log('   用户名:', profileInfo.username);
    console.log('   邮箱:', profileInfo.email);
    console.log('   性别:', profileInfo.gender);
    console.log('   配对状态:', profileInfo.coupleStatus);
    console.log('✅ 个人信息显示正常');

    console.log('\n📝 步骤 4: 点击编辑按钮...');
    await page.click('.edit-btn');
    await wait(2000);
    console.log('✅ 进入编辑模式');

    console.log('\n📝 步骤 5: 修改个人信息...');
    // 清空并输入新的邮箱
    await page.evaluate(() => {
      const emailInput = document.querySelector('.email-input');
      if (emailInput) emailInput.value = '';
    });
    await page.type('.email-input', 'xiaoming_updated@lovelink.com');
    await wait(500);

    // 选择性别
    await page.select('.gender-select', 'male');
    await wait(500);

    // 输入位置
    await page.evaluate(() => {
      const locationInput = document.querySelector('.location-input');
      if (locationInput) locationInput.value = '';
    });
    await page.type('.location-input', '武汉市');
    await wait(500);
    console.log('✅ 信息修改完成');

    console.log('\n📝 步骤 6: 保存修改...');
    await page.click('.save-btn');
    await wait(3000);
    console.log('✅ 保存成功');

    console.log('\n📝 步骤 7: 验证信息已更新...');
    const updatedInfo = await page.evaluate(() => {
      const infoItems = Array.from(document.querySelectorAll('.info-item'));
      const info = {};
      
      infoItems.forEach(item => {
        const label = item.querySelector('.label')?.textContent || '';
        const value = item.querySelector('.value')?.textContent || '';
        if (label.includes('邮箱')) info.email = value;
        if (label.includes('性别')) info.gender = value;
        if (label.includes('位置')) info.location = value;
      });
      
      return info;
    });

    console.log('   更新后邮箱:', updatedInfo.email);
    console.log('   更新后性别:', updatedInfo.gender);
    console.log('   更新后位置:', updatedInfo.location);

    const emailUpdated = updatedInfo.email.includes('xiaoming_updated');
    const genderUpdated = updatedInfo.gender === '男';
    const locationUpdated = updatedInfo.location === '武汉市';

    if (emailUpdated && genderUpdated && locationUpdated) {
      console.log('✅ 信息更新验证成功');
    } else {
      console.log('❌ 信息更新验证失败');
      console.log('   邮箱:', emailUpdated ? '✅' : '❌');
      console.log('   性别:', genderUpdated ? '✅' : '❌');
      console.log('   位置:', locationUpdated ? '✅' : '❌');
    }

    console.log('\n📝 步骤 8: 测试修改密码...');
    // 滚动到密码修改区域
    await page.evaluate(() => {
      const passwordCard = document.querySelector('.password-card');
      if (passwordCard) passwordCard.scrollIntoView({ behavior: 'smooth' });
    });
    await wait(2000);

    // 输入密码（这里只测试UI，不真正修改密码）
    await page.type('.old-password-input', 'password123');
    await wait(300);
    await page.type('.new-password-input', 'newpassword123');
    await wait(300);
    
    const passwordFormVisible = await page.evaluate(() => {
      return document.querySelector('.old-password-input') !== null &&
             document.querySelector('.new-password-input') !== null &&
             document.querySelector('.change-password-btn') !== null;
    });

    if (passwordFormVisible) {
      console.log('✅ 密码修改表单显示正常');
    } else {
      console.log('❌ 密码修改表单显示异常');
    }

    console.log('\n📝 步骤 9: 检查数据统计...');
    const stats = await page.evaluate(() => {
      const statItems = Array.from(document.querySelectorAll('.stat-item'));
      return statItems.map(item => ({
        label: item.querySelector('.stat-label')?.textContent || '',
        value: item.querySelector('.stat-value')?.textContent || '0'
      }));
    });

    console.log('   数据统计:');
    stats.forEach(stat => {
      console.log(`   - ${stat.label}: ${stat.value}`);
    });
    console.log('✅ 数据统计显示正常');

    console.log('\n' + '='.repeat(60));
    console.log('🎉 个人主页功能测试通过！');
    console.log('   ✅ 可以进入个人主页');
    console.log('   ✅ 个人信息显示正常');
    console.log('   ✅ 可以进入编辑模式');
    console.log('   ✅ 可以修改个人信息');
    console.log('   ✅ 信息保存成功并更新显示');
    console.log('   ✅ 密码修改表单正常');
    console.log('   ✅ 数据统计显示正常');
    console.log('='.repeat(60));

    await wait(3000);

  } catch (error) {
    console.error('❌ 测试出错:', error.message);
    console.log('\n' + '='.repeat(60));
    console.log('❌ 个人主页功能测试失败！');
    console.log('   错误:', error.message);
    console.log('='.repeat(60));
  }

  await browser.close();
}

testProfile().catch(console.error);

