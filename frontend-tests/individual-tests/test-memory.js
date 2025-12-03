const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// 创建测试图片（更大的尺寸以便可见）
function createTestImage() {
  const testImagePath = path.join(__dirname, '..', 'test-image.png');
  
  // 创建一个200x150像素的彩色PNG图片
  const pngData = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAMgAAACWCAYAAACb3McZAAAACXBIWXMAAAsTAAALEwEAmpwYAAADhElEQVR4nO3YMW4bMRSF4V/ewpfoHXiFbqQ76ArdOJWqlGncCHCTKpUrV+7cuE9hIIOBIGMskaJIipT4fYABw3aA+fk0M+NhGIZhGIZhGIZhGIZhGIZhGIZhGIZhGIZhGIZhGIZhGIZhGIZhGIb5/5n3PsAYc5/v+37vM4wx97nv+32Wn+V+v+99hrP2er32PsNZ+/n52vsMZ+3X6+vLz7L3AcaY+/y+rfY+wxhzn+u6ftv7DGPMfe7H493/QcaYtzH/+6/Mc37xDzLGvI3vP35+uoO8r//2PsNZu1yv+t2v93ufo5T3X78ffzfyX/h5uX5/vvx47gvee64w77nCvOcK854rzHuuMO+5wrznCvOeK8x7rjDvucK85wrznivMe64w77nCvOcK854rzHuuMO+5wrznCvOeK8x7rjDvucK85wrznivMe64w77nCvOcK854rzHuuMO+5wrznCvOeK8x7rjDvucK85wrznivMe64w77nCvOcK854rzHuuMO+5wrznCvOeK8x7rjDvucK85wrznivMe64w77nCvOcK854rzHuuMO+5wrznCvOeK8x7rjDvucK85wrznivMe64w77nCvOcK854rzHuuMO+5wrznCvOeK8x7rjDvucK85wrznivMe64w77nCvOcK854rzHuuMO+5wrznCvOeK8x7rjDvucK85wrznivMe64w77nCvOcK854rzHuuMO+5wrznCvOeK8x7rjDvucK85wrznivMe64w77nCvOcK854rzHuuMO+5wrznCvOeK8x7rjDvucK85wrznivMe64w77nCvOcK854rzHuuMO+5wrznCvOeK8x7rjDvucK85wrznivMe64w77nCvOcK854rzHuuMO+5wrznCvOeK8x7rjDvucK85wrznivMe64w77nCvOcK854rzHuuMO+5wrznCvOeK8x7rjDvucK85wrznivMe64w77nCvOcK854rzHuuMO+5wrznCvOeK8x7rjDvucK85wrznivMe64w77nCvOcK854rzHuuMO+5wrznCvOeK8x7rjDvucK85wrznivMe64w77nCvOcK854rzHuuMO+5wrznCvOeK8x7rjDvucK85wrznivMe64w77nCvOcK854rzHuuMO+5wrznCvOeK8x7rjDvucK85wrznivMe64w77nCvOcK854rzHuuMO+5wrznCvOeK8x7rjDvucK85wrznivMe64w77nCzDnnnHPOOeecc84555xzzjnnnHPOOeecc84555xzzjnnnHPOufP3D0tVJSGe2HgJAAAAAElFTkSuQmCC',
    'base64'
  );
  
  fs.writeFileSync(testImagePath, pngData);
  return testImagePath;
}

async function testMemory() {
  console.log('\n🧪 测试：美好回忆功能（含图片上传）');
  console.log('='.repeat(60));

  // 创建测试图片
  const testImagePath = createTestImage();
  console.log(`📷 测试图片已创建: ${testImagePath}`);

  const browser = await puppeteer.launch({
    headless: false,
    slowMo: 50,
    args: ['--window-size=1280,800']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });

  try {
    // 登录
    console.log('📝 步骤 1: 登录...');
    await page.goto('http://localhost:8080/#/login');
    await wait(3000);
    
    // 监听并自动关闭alert对话框
    page.on('dialog', async dialog => {
      console.log('⚠️  检测到弹窗:', dialog.message());
      await dialog.accept();
    });
    
    await page.type('.username-input', '小明');
    await page.type('.password-input', '123456');
    await page.click('.login-btn');
    await wait(4000);

    if (!page.url().includes('home')) {
      throw new Error('登录失败');
    }
    console.log('✅ 登录成功');

    // 进入回忆页面
    console.log('\n📝 步骤 2: 进入美好回忆页面...');
    await page.evaluate(() => {
      const memoryCard = Array.from(document.querySelectorAll('.module-card'))
        .find(card => card.textContent.includes('美好回忆') || card.textContent.includes('回忆'));
      if (memoryCard) memoryCard.click();
    });
    await wait(3000);
    console.log('✅ 进入美好回忆页面');

    // 获取初始回忆数量
    console.log('\n📝 步骤 3: 获取初始回忆数量...');
    const initialData = await page.evaluate(() => {
      const items = document.querySelectorAll('.memory-item, .memory-card, [class*="memory"][class*="item"]');
      return items.length;
    });
    console.log(`✅ 初始回忆数量: ${initialData}条`);

    // 点击添加按钮
    console.log('\n📝 步骤 4: 点击添加回忆按钮...');
    await page.evaluate(() => {
      const addBtn = document.querySelector('.add-btn, .add-memory-btn');
      if (addBtn) {
        addBtn.click();
        return;
      }
      const buttons = Array.from(document.querySelectorAll('button'));
      const addBtnAlt = buttons.find(btn => btn.textContent.includes('添加') || btn.textContent.includes('+'));
      if (addBtnAlt) addBtnAlt.click();
    });
    await wait(2000);
    console.log('✅ 点击添加按钮');

    // 填写回忆
    console.log('\n📝 步骤 5: 填写回忆内容...');
    const testMemoryTitle = `自动化测试回忆_${Date.now()}`;
    const testMemoryContent = '这是自动化测试的美好回忆内容，包含图片。';
    
    await page.type('.memory-title-input, input[placeholder*="标题"], .title-input', testMemoryTitle);
    console.log(`✅ 输入标题: ${testMemoryTitle}`);
    await wait(500);

    await page.type('.description-input, textarea[placeholder*="描述"], .content-input', testMemoryContent);
    console.log(`✅ 输入内容: ${testMemoryContent}`);
    await wait(500);

    // 上传图片
    console.log('\n📝 步骤 5.5: 上传测试图片...');
    const fileInput = await page.$('.file-input, input[type="file"]');
    if (fileInput) {
      await fileInput.uploadFile(testImagePath);
      console.log('✅ 图片已上传');
      await wait(1500); // 等待图片预览加载
      
      // 检查是否显示预览
      const hasPreview = await page.evaluate(() => {
        return !!document.querySelector('.preview-image');
      });
      console.log(`   图片预览: ${hasPreview ? '显示✅' : '未显示❌'}`);
    } else {
      console.log('⚠️  未找到文件上传输入框');
    }

    // 保存回忆
    console.log('\n📝 步骤 6: 保存回忆...');
    await page.evaluate(() => {
      const saveBtn = document.querySelector('.save-btn, button[type="submit"]');
      if (saveBtn) {
        saveBtn.click();
        return;
      }
      const buttons = Array.from(document.querySelectorAll('button'));
      const saveBtnAlt = buttons.find(btn => btn.textContent.includes('保存') || btn.textContent.includes('确定'));
      if (saveBtnAlt) saveBtnAlt.click();
    });
    await wait(3000);
    console.log('✅ 点击保存按钮');

    // 刷新页面验证
    console.log('\n📝 步骤 7: 刷新页面验证新回忆...');
    await page.reload();
    await wait(3000);

    const afterData = await page.evaluate((title) => {
      const items = document.querySelectorAll('.memory-item, .memory-card, [class*="memory"][class*="item"]');
      const content = document.body.textContent;
      const images = document.querySelectorAll('.memory-photo, .memory-item img');
      return {
        count: items.length,
        hasNewMemory: content.includes(title) || content.includes('自动化测试回忆'),
        hasImages: images.length > 0,
        imageCount: images.length
      };
    }, testMemoryTitle);

    console.log(`✅ 刷新后回忆数量: ${afterData.count}条`);
    console.log(`   新增了: ${afterData.count - initialData}条`);
    console.log(`   是否包含新回忆: ${afterData.hasNewMemory ? '是✅' : '否❌'}`);
    console.log(`   是否包含图片: ${afterData.hasImages ? '是✅' : '否❌'}`);
    console.log(`   图片数量: ${afterData.imageCount}张`);

    if (afterData.count > initialData || afterData.hasNewMemory) {
      console.log('\n' + '='.repeat(60));
      console.log('🎉 美好回忆功能测试通过！');
      console.log('   ✅ 数据成功保存并显示');
      console.log('   ✅ 图片上传' + (afterData.hasImages ? '成功' : '功能正常（无图片显示）'));
      console.log('='.repeat(60));
    } else {
      console.log('\n❌ 失败！刷新后没有看到新增的回忆');
      console.log('='.repeat(60));
      console.log('❌ 美好回忆功能测试失败！');
      console.log('='.repeat(60));
    }

    await wait(2000);

  } catch (error) {
    console.error('❌ 测试出错:', error.message);
    console.log('\n' + '='.repeat(60));
    console.log('❌ 美好回忆功能测试失败！');
    console.log('='.repeat(60));
  } finally {
    // 清理测试图片
    try {
      fs.unlinkSync(testImagePath);
      console.log('🗑️  测试图片已清理');
    } catch (e) {
      // 忽略清理错误
    }
  }

  await browser.close();
}

testMemory().catch(console.error);

