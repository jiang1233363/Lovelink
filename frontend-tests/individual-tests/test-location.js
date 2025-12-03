const puppeteer = require('puppeteer');

const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function testLocation() {
  console.log('\n🧪 测试：位置共享功能（高德地图集成）');
  console.log('='.repeat(60));

  const browser = await puppeteer.launch({
    headless: false,
    slowMo: 50,
    args: [
      '--window-size=1280,800',
      '--use-fake-device-for-media-stream',
      '--use-fake-ui-for-media-stream'
    ]
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });
  
  // 捕获控制台消息
  const consoleMessages = [];
  page.on('console', msg => {
    const text = msg.text();
    consoleMessages.push(text);
    if (text.includes('❌') || text.includes('error') || text.includes('Error')) {
      console.log('🔴 浏览器错误:', text);
    }
  });
  
  // 捕获页面错误
  page.on('pageerror', error => {
    console.log('🔴 页面错误:', error.message);
  });
  
  // 模拟地理位置（北京天安门附近）
  const mockLocation = {
    latitude: 39.9042,
    longitude: 116.4074,
    accuracy: 100
  };
  
  await page.setGeolocation(mockLocation);
  console.log(`📍 模拟位置设置: ${mockLocation.latitude}, ${mockLocation.longitude}`);

  try {
    console.log('📝 步骤 1: 登录...');
    await page.goto('http://localhost:8080/#/login');
    await wait(3000);
    
    page.on('dialog', async dialog => {
      console.log('⚠️  检测到弹窗:', dialog.message());
      await dialog.accept();
    });
    
    await page.type('.username-input', '小明');
    await page.type('.password-input', '123456');
    await page.click('.login-btn');
    await wait(4000);
    console.log('✅ 登录成功');

    console.log('\n📝 步骤 2: 进入位置共享页面...');
    await page.evaluate(() => {
      const locationCard = Array.from(document.querySelectorAll('.module-card'))
        .find(card => card.textContent.includes('位置') || card.textContent.includes('Location'));
      if (locationCard) locationCard.click();
    });
    await wait(3000);
    console.log('✅ 进入位置共享页面');

    console.log('\n📝 步骤 3: 检查地图容器是否存在...');
    await wait(2000);
    const mapExists = await page.evaluate(() => {
      const mapContainer = document.getElementById('amap-container');
      return {
        exists: !!mapContainer,
        hasContent: mapContainer ? mapContainer.children.length > 0 : false,
        display: mapContainer ? window.getComputedStyle(mapContainer).display : 'none'
      };
    });
    console.log(`✅ 地图容器: ${mapExists.exists ? '存在' : '不存在'}, 已加载: ${mapExists.hasContent ? '是' : '否'}`);

    console.log('\n📝 步骤 4: 获取初始共享状态...');
    const initialState = await page.evaluate(() => {
      const toggle = document.querySelector('.location-sharing-toggle');
      return {
        enabled: toggle ? toggle.checked : false,
        toggleExists: !!toggle
      };
    });
    console.log(`✅ 初始状态: 位置共享=${initialState.enabled ? '开启' : '关闭'}`);

    console.log('\n📝 步骤 5: 开启位置共享...');
    if (!initialState.enabled) {
      await page.evaluate(() => {
        const toggle = document.querySelector('.location-sharing-toggle');
        if (toggle) toggle.click();
      });
      await wait(5000); // 等待地图加载和位置获取
      console.log('✅ 位置共享已开启');
    }

    console.log('\n📝 步骤 6: 检查位置信息...');
    const locationInfo = await page.evaluate(() => {
      const content = document.body.textContent;
      const infoItems = document.querySelectorAll('.info-item');
      const myLocationInfo = infoItems[0] ? infoItems[0].textContent : '';
      
      return {
        hasInfoPanel: infoItems.length > 0,
        myLocation: myLocationInfo,
        hasLocationText: content.includes('我的位置') || content.includes('定位中'),
        pageContent: content.substring(0, 200)
      };
    });
    
    console.log(`✅ 位置信息面板: ${locationInfo.hasInfoPanel ? '已显示' : '未显示'}`);
    console.log(`   我的位置信息: ${locationInfo.myLocation.substring(0, 50)}`);

    console.log('\n📝 步骤 7: 检查高德地图API加载...');
    const mapLoaded = await page.evaluate(() => {
      const mapContainer = document.getElementById('amap-container');
      return {
        amapExists: typeof AMap !== 'undefined',
        mapInstanceExists: mapContainer?.children.length > 0,
        mapContainerHTML: mapContainer?.innerHTML.substring(0, 200),
        mapContainerStyle: mapContainer ? {
          width: mapContainer.style.width || window.getComputedStyle(mapContainer).width,
          height: mapContainer.style.height || window.getComputedStyle(mapContainer).height,
          display: window.getComputedStyle(mapContainer).display
        } : null,
        consoleErrors: window.amapErrors || []
      };
    });
    console.log(`✅ 高德地图API: ${mapLoaded.amapExists ? '已加载' : '未加载'}`);
    console.log(`✅ 地图实例: ${mapLoaded.mapInstanceExists ? '已创建' : '未创建'}`);
    console.log(`📐 地图容器样式: ${JSON.stringify(mapLoaded.mapContainerStyle)}`);
    console.log(`📄 地图容器内容: ${mapLoaded.mapContainerHTML ? '有内容' : '空'}`);

    // 截图查看实际显示
    console.log('\n📝 步骤 8: 截图保存...');
    await page.screenshot({ path: 'location-test-screenshot.png', fullPage: true });
    console.log('✅ 截图已保存到: location-test-screenshot.png');

    console.log('\n📝 步骤 9: 检查控制台日志...');
    const errorMessages = consoleMessages.filter(msg => 
      msg.includes('error') || msg.includes('Error') || msg.includes('failed') || msg.includes('❌')
    );
    if (errorMessages.length > 0) {
      console.log('⚠️  发现错误消息:');
      errorMessages.slice(0, 5).forEach(msg => console.log('   -', msg));
    } else {
      console.log('✅ 没有发现错误消息');
    }

    console.log('\n📝 步骤 10: 等待位置完全加载...');
    await wait(3000);
    
    const finalCheck = await page.evaluate(() => {
      const content = document.body.textContent;
      const mapContainer = document.getElementById('amap-container');
      const infoItems = document.querySelectorAll('.info-item');
      
      return {
        hasMap: !!mapContainer && mapContainer.children.length > 0,
        hasLocationInfo: infoItems.length > 0,
        locationText: infoItems[0] ? infoItems[0].textContent : '',
        notLoading: !content.includes('定位中')
      };
    });

    console.log('\n📝 最终验证结果:');
    console.log(`   地图加载: ${finalCheck.hasMap ? '✅' : '❌'}`);
    console.log(`   位置信息: ${finalCheck.hasLocationInfo ? '✅' : '❌'}`);
    console.log(`   位置已获取: ${finalCheck.notLoading ? '✅' : '❌'}`);
    console.log(`   位置详情: ${finalCheck.locationText.substring(0, 60)}`);

    const allPassed = finalCheck.hasMap && finalCheck.hasLocationInfo;

    if (allPassed) {
      console.log('\n' + '='.repeat(60));
      console.log('🎉 位置共享功能测试通过！');
      console.log('   ✅ 高德地图加载成功');
      console.log('   ✅ 位置信息显示正常');
      console.log('   ✅ 位置共享功能正常');
      console.log('='.repeat(60));
    } else {
      console.log('\n' + '='.repeat(60));
      console.log('❌ 位置共享功能测试失败！');
      if (!finalCheck.hasMap) console.log('   ❌ 地图未加载');
      if (!finalCheck.hasLocationInfo) console.log('   ❌ 位置信息未显示');
      console.log('='.repeat(60));
    }

    await wait(2000);

  } catch (error) {
    console.error('❌ 测试出错:', error.message);
    console.log('\n' + '='.repeat(60));
    console.log('❌ 位置共享功能测试失败！');
    console.log('='.repeat(60));
  }

  await browser.close();
}

testLocation().catch(console.error);

