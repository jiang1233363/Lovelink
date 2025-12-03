import express from 'express';
import { authMiddleware } from '../middleware/auth';
import { pool } from '../config/database';

const router = express.Router();

// 获取经期信息
router.get('/info', authMiddleware, async (req: any, res) => {
  try {
    // 获取年月参数（前端可以切换月份）
    const now = new Date();
    const { year = now.getFullYear(), month = now.getMonth() + 1 } = req.query;
    
    console.log('📅 获取经期信息 - userId:', req.userId, 'year:', year, 'month:', month);
    
    // 获取最近一次经期记录
    const [records] = await pool.execute(
      'SELECT * FROM period_records WHERE user_id = ? ORDER BY start_date DESC LIMIT 1',
      [req.userId]
    ) as any[];

    let status = 'normal';
    let days_until_next = 0;
    const periodDates: string[] = [];

    if (records.length > 0) {
      const lastRecord = records[0];
      const cycle_length = lastRecord.cycle_length || 28;
      
      // 计算下次经期
      const lastDate = new Date(lastRecord.start_date);
      const nextDate = new Date(lastDate);
      nextDate.setDate(nextDate.getDate() + cycle_length);
      
      const today = new Date();
      const diffTime = nextDate.getTime() - today.getTime();
      days_until_next = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      // 判断当前状态
      if (days_until_next <= 0 && days_until_next >= -7) {
        status = 'period'; // 经期中
      } else if (days_until_next > 0 && days_until_next <= 7) {
        status = 'fertile'; // 易孕期
      } else {
        status = 'safe'; // 安全期
      }

      // 获取指定月份的经期日期（支持切换月份）
      const [monthRecords] = await pool.execute(
        `SELECT DATE(start_date) as date 
         FROM period_records 
         WHERE user_id = ? 
         AND YEAR(start_date) = ? 
         AND MONTH(start_date) = ?`,
        [req.userId, year, month]
      ) as any[];

      console.log('🔍 查询结果 monthRecords:', JSON.stringify(monthRecords));
      
      // 将日期转换为字符串格式
      const dates = monthRecords.map((r: any) => {
        const dateObj = r.date;
        let dateStr;
        if (dateObj instanceof Date) {
          dateStr = dateObj.toISOString().split('T')[0];
        } else {
          dateStr = String(dateObj);
        }
        console.log('   日期转换:', dateObj, '→', dateStr);
        return dateStr;
      });
      
      periodDates.push(...dates);
      console.log('✅ 查询到', periodDates.length, '个经期日期:', periodDates);
    }

    res.json({ 
      code: 200, 
      data: {
        status,
        days_until_next: Math.max(0, days_until_next),
        period_dates: periodDates,
        last_record: records[0] || null
      }
    });
  } catch (error) {
    console.error('获取经期信息失败:', error);
    res.json({ code: 500, message: '获取失败' });
  }
});

// 记录经期
router.post('/record', authMiddleware, async (req: any, res) => {
  console.log('\n🚀 ========== 记录经期 API 调用 ==========');
  console.log('📥 req.body:', JSON.stringify(req.body));
  console.log('📥 req.userId:', req.userId);
  console.log('📥 req.coupleId:', req.coupleId);
  
  try {
    const { start_date, end_date, cycle_length = 28 } = req.body;
    
    console.log('📦 解构后的参数:');
    console.log('   - start_date:', start_date, '类型:', typeof start_date, 'undefined?', start_date === undefined);
    console.log('   - end_date:', end_date, '类型:', typeof end_date, 'undefined?', end_date === undefined);
    console.log('   - cycle_length:', cycle_length, '类型:', typeof cycle_length, 'undefined?', cycle_length === undefined);

    if (!start_date) {
      console.log('❌ 开始日期为空');
      return res.json({ code: 400, message: '开始日期不能为空' });
    }

    // 验证周期长度范围（21-45天）
    const cycleLengthNum = Number(cycle_length) || 28;
    if (cycleLengthNum < 21 || cycleLengthNum > 45) {
      console.log('❌ 周期长度不合理:', cycleLengthNum);
      return res.json({ code: 400, message: '经期周期应在21-45天之间' });
    }

    // 验证开始日期不能是未来日期
    const startDateObj = new Date(start_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    startDateObj.setHours(0, 0, 0, 0);
    
    if (startDateObj > today) {
      console.log('❌ 开始日期是未来日期:', start_date);
      return res.json({ code: 400, message: '开始日期不能是未来日期' });
    }

    // 确保所有参数都不是undefined
    const userId = Number(req.userId);
    const startDateStr = String(start_date);
    const endDateValue = end_date ? String(end_date) : null;
    
    console.log('✅ 处理后的参数:');
    console.log('   - userId:', userId, '类型:', typeof userId);
    console.log('   - startDateStr:', startDateStr, '类型:', typeof startDateStr);
    console.log('   - endDateValue:', endDateValue, '类型:', typeof endDateValue);
    console.log('   - cycleLengthNum:', cycleLengthNum, '类型:', typeof cycleLengthNum);

    // 检查是否已存在该日期的记录
    console.log('🔍 检查是否存在记录...');
    const [existing] = await pool.execute(
      'SELECT id FROM period_records WHERE user_id = ? AND start_date = ?',
      [userId, startDateStr]
    ) as any[];
    console.log('   查询结果:', existing.length, '条');

    let result;
    if (existing.length > 0) {
      // 更新现有记录
      console.log('🔄 更新现有记录:', existing[0].id);
      const updateParams = [endDateValue, cycleLengthNum, existing[0].id];
      console.log('   更新参数:', updateParams);
      
      await pool.execute(
        'UPDATE period_records SET end_date = ?, cycle_length = ? WHERE id = ?',
        updateParams
      );
      result = { insertId: existing[0].id };
      console.log('✅ 更新成功');
    } else {
      // 插入新记录
      console.log('➕ 插入新记录');
      const insertParams = [userId, startDateStr, endDateValue, cycleLengthNum];
      console.log('   插入参数:', insertParams);
      console.log('   参数检查:');
      insertParams.forEach((param, index) => {
        console.log(`      [${index}]`, param, '类型:', typeof param, 'undefined?', param === undefined);
      });
      
      [result] = await pool.execute(
        'INSERT INTO period_records (user_id, start_date, end_date, cycle_length) VALUES (?, ?, ?, ?)',
        insertParams
      ) as any[];
      console.log('✅ 插入成功，ID:', result.insertId);
    }

    console.log('✅ 记录经期成功');
    console.log('========================================\n');
    res.json({ 
      code: 200, 
      message: '记录成功',
      data: { id: result.insertId }
    });
  } catch (error: any) {
    console.error('❌❌❌ 记录经期失败 ❌❌❌');
    console.error('错误类型:', error.constructor.name);
    console.error('错误消息:', error.message);
    console.error('错误堆栈:', error.stack);
    console.log('========================================\n');
    res.json({ code: 500, message: `记录失败: ${error.message}` });
  }
});

// 获取历史记录
router.get('/history', authMiddleware, async (req: any, res) => {
  try {
    const { limit = 12 } = req.query;

    const [records] = await pool.execute(
      `SELECT * FROM period_records WHERE user_id = ? ORDER BY start_date DESC LIMIT ${Number(limit)}`,
      [req.userId]
    ) as any[];

    res.json({ code: 200, data: records });
  } catch (error) {
    console.error('获取历史记录失败:', error);
    res.json({ code: 500, message: '获取失败' });
  }
});

// 更新记录
router.put('/update/:id', authMiddleware, async (req: any, res) => {
  try {
    const { id } = req.params;
    const { start_date, end_date, cycle_length } = req.body;

    const [records] = await pool.execute(
      'SELECT id FROM period_records WHERE id = ? AND user_id = ?',
      [id, req.userId]
    ) as any[];

    if (records.length === 0) {
      return res.json({ code: 404, message: '记录不存在' });
    }

    await pool.execute(
      'UPDATE period_records SET start_date = ?, end_date = ?, cycle_length = ? WHERE id = ?',
      [start_date, end_date, cycle_length, id]
    );

    res.json({ code: 200, message: '更新成功' });
  } catch (error) {
    console.error('更新记录失败:', error);
    res.json({ code: 500, message: '更新失败' });
  }
});

// 删除记录
router.delete('/delete/:id', authMiddleware, async (req: any, res) => {
  try {
    const { id } = req.params;

    const [records] = await pool.execute(
      'SELECT id FROM period_records WHERE id = ? AND user_id = ?',
      [id, req.userId]
    ) as any[];

    if (records.length === 0) {
      return res.json({ code: 404, message: '记录不存在' });
    }

    await pool.execute('DELETE FROM period_records WHERE id = ?', [id]);

    res.json({ code: 200, message: '删除成功' });
  } catch (error) {
    console.error('删除记录失败:', error);
    res.json({ code: 500, message: '删除失败' });
  }
});

// 获取预测
router.get('/prediction', authMiddleware, async (req: any, res) => {
  try {
    // 获取最近3次记录计算平均周期
    const [records] = await pool.execute(
      'SELECT * FROM period_records WHERE user_id = ? ORDER BY start_date DESC LIMIT 3',
      [req.userId]
    ) as any[];

    if (records.length < 2) {
      return res.json({ 
        code: 200, 
        data: { message: '记录不足，无法预测', predictions: [] }
      });
    }

    // 计算平均周期
    let totalCycle = 0;
    for (let i = 0; i < records.length - 1; i++) {
      const date1 = new Date(records[i].start_date);
      const date2 = new Date(records[i + 1].start_date);
      const diff = Math.abs(date1.getTime() - date2.getTime());
      totalCycle += Math.ceil(diff / (1000 * 60 * 60 * 24));
    }
    const avgCycle = Math.round(totalCycle / (records.length - 1));

    // 预测未来3个月
    const predictions = [];
    const lastDate = new Date(records[0].start_date);
    
    for (let i = 1; i <= 3; i++) {
      const nextDate = new Date(lastDate);
      nextDate.setDate(nextDate.getDate() + (avgCycle * i));
      predictions.push({
        date: nextDate.toISOString().split('T')[0],
        cycle: avgCycle
      });
    }

    res.json({ 
      code: 200, 
      data: {
        average_cycle: avgCycle,
        predictions
      }
    });
  } catch (error) {
    console.error('获取预测失败:', error);
    res.json({ code: 500, message: '获取失败' });
  }
});

export default router;
