const axios = require('axios');

const API_BASE = 'http://localhost:3000/api';

async function testAPIData() {
  try {
    console.log('🔍 测试API数据访问...\n');
    
    // 1. 小明登录
    console.log('1️⃣ 小明登录...');
    const loginRes = await axios.post(`${API_BASE}/user/login`, {
      username: '小明',
      password: '123456'
    });
    const token = loginRes.data.data.token;
    const userInfo = loginRes.data.data.userInfo;
    console.log(`   用户ID: ${userInfo.id}, Couple ID: ${userInfo.couple_id}`);
    console.log('✅ 登录成功\n');
    
    const headers = { 'Authorization': `Bearer ${token}` };
    
    // 2. 测试日记API
    console.log('2️⃣ 测试日记API...');
    const diaryRes = await axios.get(`${API_BASE}/diary/list`, { headers });
    console.log(`   状态码: ${diaryRes.data.code}`);
    console.log(`   完整响应:`, JSON.stringify(diaryRes.data, null, 2));
    const diaryList = diaryRes.data.data?.list || diaryRes.data.data || [];
    console.log(`   日记数量: ${diaryList.length} 条`);
    if (diaryList.length > 0) {
      console.log(`   最新日记: ${diaryList[0].title || '无标题'}`);
    }
    
    // 3. 测试聊天API
    console.log('\n3️⃣ 测试聊天API...');
    const chatRes = await axios.get(`${API_BASE}/chat/history`, { headers });
    console.log(`   状态码: ${chatRes.data.code}`);
    console.log(`   聊天消息数量: ${chatRes.data.data?.length || 0} 条`);
    if (chatRes.data.data?.length > 0) {
      const lastMsg = chatRes.data.data[chatRes.data.data.length - 1];
      console.log(`   最新消息: ${lastMsg.content?.substring(0, 20)}...`);
    }
    
    // 4. 测试美好回忆API
    console.log('\n4️⃣ 测试美好回忆API...');
    const memoryRes = await axios.get(`${API_BASE}/memory`, { headers });
    console.log(`   状态码: ${memoryRes.data.code}`);
    console.log(`   回忆数量: ${memoryRes.data.data?.length || 0} 条`);
    if (memoryRes.data.data?.length > 0) {
      console.log(`   最新回忆: ${memoryRes.data.data[0].content?.substring(0, 20)}...`);
    }
    
    // 5. 测试情侣问答API
    console.log('\n5️⃣ 测试情侣问答API...');
    const qaRes = await axios.get(`${API_BASE}/qa`, { headers });
    console.log(`   状态码: ${qaRes.data.code}`);
    console.log(`   问答数量: ${qaRes.data.data?.length || 0} 条`);
    if (qaRes.data.data?.length > 0) {
      console.log(`   最新问题: ${qaRes.data.data[0].question?.substring(0, 30)}...`);
    }
    
    // 6. 测试消防员API
    console.log('\n6️⃣ 测试消防员API...');
    const firemanRes = await axios.get(`${API_BASE}/fireman/history`, { headers });
    console.log(`   状态码: ${firemanRes.data.code}`);
    console.log(`   消防员记录数量: ${firemanRes.data.data?.length || 0} 条`);
    
    console.log('\n============================================================');
    console.log('📊 总结:');
    console.log(`   ✅ Couple ID: ${userInfo.couple_id} (应该是1)`);
    console.log(`   ${diaryRes.data.data?.length > 0 ? '✅' : '❌'} 日记: ${diaryRes.data.data?.length || 0} 条`);
    console.log(`   ${chatRes.data.data?.length > 0 ? '✅' : '❌'} 聊天: ${chatRes.data.data?.length || 0} 条`);
    console.log(`   ${memoryRes.data.data?.length > 0 ? '✅' : '❌'} 回忆: ${memoryRes.data.data?.length || 0} 条`);
    console.log(`   ${qaRes.data.data?.length > 0 ? '✅' : '❌'} 问答: ${qaRes.data.data?.length || 0} 条`);
    console.log(`   ${firemanRes.data.data?.length > 0 ? '✅' : '❌'} 消防员: ${firemanRes.data.data?.length || 0} 条`);
    console.log('============================================================\n');
    
  } catch (error) {
    console.error('❌ 测试失败:', error.response?.data || error.message);
  }
}

testAPIData();

