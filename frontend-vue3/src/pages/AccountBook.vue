<template>
  <div class="accountbook-page">
    <div class="header">
      <button class="back-btn" @click="$router.back()">← 返回</button>
      <h1>共同账本</h1>
      <button class="add-record-btn" @click="showEditor = true">+ 记一笔</button>
    </div>
    
    <div class="content">
      <!-- 记账编辑器 -->
      <div v-if="showEditor" class="record-editor">
        <h3>{{ editingRecord.id ? '编辑记录' : '新建记录' }}</h3>
        
        <div class="type-selector">
          <button 
            class="type-btn"
            :class="{ active: editingRecord.type === 'expense' }"
            @click="editingRecord.type = 'expense'"
          >支出</button>
          <button 
            class="type-btn"
            :class="{ active: editingRecord.type === 'income' }"
            @click="editingRecord.type = 'income'"
          >收入</button>
        </div>
        
        <input 
          v-model.number="editingRecord.amount" 
          class="amount-input"
          type="number"
          placeholder="金额"
        />
        
        <select v-model="editingRecord.category" class="category-select">
          <option value="">选择分类</option>
          <option v-for="cat in categories" :key="cat" :value="cat">{{ cat }}</option>
        </select>
        
        <textarea 
          v-model="editingRecord.description" 
          class="description-input"
          placeholder="备注说明..."
          rows="3"
        ></textarea>
        
        <div class="editor-actions">
          <button class="save-record-btn" @click="saveRecord">保存</button>
          <button class="cancel-btn" @click="cancelEdit">取消</button>
        </div>
      </div>
      
      <!-- 记账列表 -->
      <div class="record-list">
        <h3>记账记录 ({{ records.length }}条)</h3>
        <div v-if="records.length === 0" class="empty">还没有记账记录</div>
        <div v-for="record in records" :key="record.id" class="record-item">
          <div class="record-icon" :class="record.type">
            {{ record.type === 'income' ? '💰' : '💸' }}
          </div>
          <div class="record-info">
            <div class="record-category">{{ record.category }}</div>
            <div class="record-desc">{{ record.description || '无备注' }}</div>
            <div class="record-time">{{ formatDate(record.transaction_date || record.date) }}</div>
          </div>
          <div class="record-right">
            <div class="record-amount" :class="record.type">
              {{ record.type === 'income' ? '+' : '-' }}¥{{ record.amount }}
            </div>
            <div class="record-actions">
              <button class="edit-record-btn" @click="editRecord(record)">编辑</button>
              <button class="delete-record-btn" @click="deleteRecord(record.id)">删除</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import http from '../api/http.js'

const categories = ['餐饮', '交通', '购物', '娱乐', '医疗', '学习', '工资', '奖金', '其他']

const showEditor = ref(false)
const editingRecord = ref({
  id: null,
  type: 'expense',
  amount: '',
  category: '',
  description: ''
})
const records = ref([])

const formatDate = (date) => {
  const d = new Date(date)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

const loadRecords = async () => {
  try {
    console.log('📋 加载记账列表...')
    const res = await http.get('/accountBook/list', {
      params: { page: 1, limit: 100 }
    })
    console.log('✅ 记账数据:', res)
    records.value = res.data?.list || res.data || []
  } catch (error) {
    console.error('❌ 加载记账失败:', error)
  }
}

const saveRecord = async () => {
  if (!editingRecord.value.amount || !editingRecord.value.category) {
    alert('请填写金额和分类')
    return
  }
  
  try {
    console.log('💾 保存记账...', editingRecord.value)
    
    const data = {
      type: editingRecord.value.type,
      amount: parseFloat(editingRecord.value.amount),
      category: editingRecord.value.category,
      description: editingRecord.value.description,
      transaction_date: new Date().toISOString().split('T')[0]
    }
    
    if (editingRecord.value.id) {
      // 更新
      await http.put(`/accountBook/${editingRecord.value.id}`, data)
    } else {
      // 新建
      await http.post('/accountBook/create', data)
    }
    
    alert('保存成功！')
    showEditor.value = false
    editingRecord.value = { id: null, type: 'expense', amount: '', category: '', description: '' }
    await loadRecords()
  } catch (error) {
    console.error('❌ 保存失败:', error)
    alert('保存失败：' + (error.response?.data?.message || error.message))
  }
}

const editRecord = (record) => {
  editingRecord.value = { ...record }
  showEditor.value = true
}

const cancelEdit = () => {
  showEditor.value = false
  editingRecord.value = { id: null, type: 'expense', amount: '', category: '', description: '' }
}

const deleteRecord = async (id) => {
  if (!confirm('确定删除这条记账记录吗？')) return
  
  try {
    await http.delete(`/account-book/${id}`)
    alert('删除成功！')
    await loadRecords()
  } catch (error) {
    console.error('❌ 删除失败:', error)
    alert('删除失败')
  }
}

onMounted(() => {
  loadRecords()
})
</script>

<style scoped>
.accountbook-page {
  min-height: 100vh;
  background: #FFF5F8;
}

.header {
  background: linear-gradient(135deg, #FF4D88, #FF98B9);
  color: white;
  padding: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.back-btn, .add-record-btn {
  padding: 8px 16px;
  background: rgba(255,255,255,0.2);
  border: none;
  color: white;
  border-radius: 8px;
  cursor: pointer;
  font-size: 16px;
}

.content {
  max-width: 900px;
  margin: 30px auto;
  padding: 0 20px;
}

.record-editor {
  background: white;
  border-radius: 34px;
  padding: 30px;
  margin-bottom: 30px;
  box-shadow: 0 8px 21px rgba(255, 77, 136, 0.1);
}

.record-editor h3 {
  margin-bottom: 20px;
  color: #333;
}

.type-selector {
  display: flex;
  gap: 10px;
  margin-bottom: 15px;
}

.type-btn {
  flex: 1;
  padding: 12px;
  border: 2px solid #e0e0e0;
  background: white;
  border-radius: 8px;
  font-size: 16px;
  cursor: pointer;
}

.type-btn.active {
  background: linear-gradient(135deg, #FF4D88, #FF98B9);
  color: white;
  border-color: #FF4D88;
}

.amount-input, .category-select, .description-input {
  width: 100%;
  padding: 12px;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 16px;
  margin-bottom: 15px;
  font-family: inherit;
}

.editor-actions {
  display: flex;
  gap: 10px;
}

.save-record-btn {
  flex: 1;
  padding: 12px;
  background: linear-gradient(135deg, #FF4D88, #FF98B9);
  color: white;
  border: none;
  border-radius: 25px;
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
  box-shadow: 0 4px 10px rgba(255, 77, 136, 0.2);
}

.cancel-btn {
  flex: 1;
  padding: 12px;
  background: #e0e0e0;
  color: #666;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  cursor: pointer;
}

.record-list {
  background: white;
  border-radius: 34px;
  padding: 30px;
  box-shadow: 0 8px 21px rgba(255, 77, 136, 0.1);
}

.record-list h3 {
  margin-bottom: 20px;
  color: #333;
}

.empty {
  text-align: center;
  color: #999;
  padding: 40px;
}

.record-item {
  display: flex;
  gap: 15px;
  padding: 15px;
  border-bottom: 1px solid #f0f0f0;
  align-items: center;
}

.record-item:last-child {
  border-bottom: none;
}

.record-icon {
  font-size: 32px;
}

.record-info {
  flex: 1;
}

.record-category {
  font-size: 16px;
  font-weight: bold;
  color: #333;
  margin-bottom: 5px;
}

.record-desc {
  font-size: 14px;
  color: #666;
  margin-bottom: 5px;
}

.record-time {
  font-size: 12px;
  color: #999;
}

.record-right {
  text-align: right;
}

.record-amount {
  font-size: 20px;
  font-weight: bold;
  margin-bottom: 8px;
}

.record-amount.income {
  color: #38ef7d;
}

.record-amount.expense {
  color: #ff4444;
}

.record-actions {
  display: flex;
  gap: 5px;
}

.edit-record-btn, .delete-record-btn {
  padding: 4px 8px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
}

.edit-record-btn {
  background: #FF4D88;
  color: white;
}

.delete-record-btn {
  background: #ff4444;
  color: white;
}
</style>

