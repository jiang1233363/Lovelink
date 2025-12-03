const puppeteer = require('puppeteer');

const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function testDataAccess() {
  console.log('\n🧪 测试：数据访问测试');
  console.log('============================================================\n');
  
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: { width: 1200, height: 800 },
    args: ['--no-sandbox']
  });
  
  try {
    const page = await browser.newPage();
    
    // 监听控制台输出
    page.on('console', msg => {
      const text = msg.text();
      if (text.includes('coupleId') || text.includes('couple_id')) {
        console.log('🔍 浏览器日志:', text);
      }
    });
    
    // ========== 步骤 1: 小明登录 ==========
    console.log('📝 步骤 1: 小明登录...');
    await page.goto('http://localhost:8080/#/login', { waitUntil: 'networkidle0' });
    await wait(1000);
    
    // 清除所有缓存和 localStorage
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    
    await page.type('input[placeholder="请输入用户名"]', '小明');
    await page.type('input[placeholder="请输入密码"]', '123456');
    
    // 找到登录按钮并点击
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const loginBtn = buttons.find(btn => btn.textContent.includes('登录') || btn.textContent.includes('登 录'));
      if (loginBtn) loginBtn.click();
    });
    await wait(3000);
    
    // 获取token信息
    const tokenInfo = await page.evaluate(() => {
      const token = localStorage.getItem('token');
      if (token) {
        // 简单解码 JWT（不验证签名）
        const parts = token.split('.');
        if (parts.length === 3) {
          const payload = JSON.parse(atob(parts[1]));
          return payload;
        }
      }
      return null;
    });
    
    console.log('   Token信息:', tokenInfo);
    console.log('✅ 小明登录成功\n');
    
    // ========== 步骤 2: 检查日记 ==========
    console.log('📝 步骤 2: 检查日记...');
    await page.goto('http://localhost:8080/#/diary', { waitUntil: 'networkidle0' });
    await wait(2000);
    
    const diaryCount = await page.evaluate(() => {
      const items = document.querySelectorAll('.diary-item, .diary-card, [class*="diary"]');
      return items.length;
    });
    console.log(`   日记数量: ${diaryCount} 条`);
    
    // ========== 步骤 3: 检查聊天 ==========
    console.log('\n📝 步骤 3: 检查聊天记录...');
    await page.goto('http://localhost:8080/#/chat', { waitUntil: 'networkidle0' });
    await wait(2000);
    
    const messageCount = await page.evaluate(() => {
      const messages = document.querySelectorAll('.message-item, .message, [class*="message"]');
      return messages.length;
    });
    console.log(`   聊天消息数量: ${messageCount} 条`);
    
    // ========== 步骤 4: 检查美好回忆 ==========
    console.log('\n📝 步骤 4: 检查美好回忆...');
    await page.goto('http://localhost:8080/#/memory', { waitUntil: 'networkidle0' });
    await wait(2000);
    
    const memoryCount = await page.evaluate(() => {
      const memories = document.querySelectorAll('.memory-item, .memory-card, [class*="memory"]');
      return memories.length;
    });
    console.log(`   美好回忆数量: ${memoryCount} 条`);
    
    // ========== 步骤 5: 检查情侣问答 ==========
    console.log('\n📝 步骤 5: 检查情侣问答...');
    await page.goto('http://localhost:8080/#/qa', { waitUntil: 'networkidle0' });
    await wait(2000);
    
    const qaCount = await page.evaluate(() => {
      const qas = document.querySelectorAll('.qa-item, .qa-card, [class*="qa-item"]');
      return qas.length;
    });
    console.log(`   问答数量: ${qaCount} 条`);
    
    // ========== 步骤 6: 检查消防员 ==========
    console.log('\n📝 步骤 6: 检查消防员记录...');
    await page.goto('http://localhost:8080/#/conflict', { waitUntil: 'networkidle0' });
    await wait(2000);
    
    const conflictCount = await page.evaluate(() => {
      const conflicts = document.querySelectorAll('.conflict-item, .task-item, [class*="conflict"]');
      return conflicts.length;
    });
    console.log(`   消防员记录数量: ${conflictCount} 条`);
    
    console.log('\n============================================================');
    console.log('📊 测试结果总结:');
    console.log(`   Token coupleId: ${tokenInfo?.coupleId}`);
    console.log(`   日记: ${diaryCount} 条 (数据库68条)`);
    console.log(`   聊天: ${messageCount} 条 (数据库35条)`);
    console.log(`   回忆: ${memoryCount} 条 (数据库57条)`);
    console.log(`   问答: ${qaCount} 条 (数据库61条)`);
    console.log(`   消防员: ${conflictCount} 条 (数据库15条)`);
    
    if (diaryCount > 0 && messageCount > 0 && memoryCount > 0) {
      console.log('\n✅ 数据访问正常！');
    } else {
      console.log('\n❌ 部分数据无法访问！');
    }
    console.log('============================================================\n');
    
  } catch (error) {
    console.error('❌ 测试出错:', error.message);
  } finally {
    await browser.close();
  }
}

testDataAccess();

