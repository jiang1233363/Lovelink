import express from 'express';
import { authMiddleware } from '../middleware/auth';
import { pool } from '../config/database';

const router = express.Router();

// 获取账本列表
router.get('/list', authMiddleware, async (req: any, res) => {
  try {
    const { page = 1, limit = 50, type, start_date, end_date } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    let whereClause = 'ab.couple_id = ?';
    let params: any[] = [Number(req.coupleId)];

    if (type) {
      whereClause += ' AND type = ?';
      params.push(type);
    }

    if (start_date) {
      whereClause += ' AND transaction_date >= ?';
      params.push(start_date);
    }

    if (end_date) {
      whereClause += ' AND transaction_date <= ?';
      params.push(end_date);
    }

    const [records] = await pool.execute(
      `SELECT ab.*, u.username as creator_name 
       FROM account_book ab 
       LEFT JOIN users u ON ab.user_id = u.id 
       WHERE ${whereClause}
       ORDER BY ab.transaction_date DESC, ab.created_at DESC 
       LIMIT ${Number(limit)} OFFSET ${Number(offset)}`,
      params
    ) as any[];

    const [total] = await pool.execute(
      `SELECT COUNT(*) as count FROM account_book ab WHERE ${whereClause}`,
      params
    ) as any[];

    res.json({ 
      code: 200, 
      data: {
        list: records,
        total: total[0].count,
        page: Number(page),
        pageSize: Number(limit)
      }
    });
  } catch (error) {
    console.error('获取账本列表失败:', error);
    res.json({ code: 500, message: '获取失败' });
  }
});

// 获取统计信息
router.get('/statistics', authMiddleware, async (req: any, res) => {
  try {
    const { start_date, end_date } = req.query;

    let whereClause = 'ab.couple_id = ?';
    let params: any[] = [Number(req.coupleId)];

    if (start_date) {
      whereClause += ' AND transaction_date >= ?';
      params.push(start_date);
    }

    if (end_date) {
      whereClause += ' AND transaction_date <= ?';
      params.push(end_date);
    }

    // 收支统计
    const [summary] = await pool.execute(
      `SELECT 
        SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as total_income,
        SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as total_expense,
        COUNT(*) as total_count
       FROM account_book ab
       WHERE ${whereClause}`,
      params
    ) as any[];

    // 分类统计
    const [categoryStats] = await pool.execute(
      `SELECT category, type, SUM(amount) as amount, COUNT(*) as count
       FROM account_book ab
       WHERE ${whereClause}
       GROUP BY category, type
       ORDER BY amount DESC`,
      params
    ) as any[];

    res.json({ 
      code: 200, 
      data: {
        summary: {
          total_income: summary[0].total_income || 0,
          total_expense: summary[0].total_expense || 0,
          balance: (summary[0].total_income || 0) - (summary[0].total_expense || 0),
          total_count: summary[0].total_count
        },
        categoryStats
      }
    });
  } catch (error) {
    console.error('获取统计信息失败:', error);
    res.json({ code: 500, message: '获取失败' });
  }
});

// 创建账单
router.post('/create', authMiddleware, async (req: any, res) => {
  try {
    const { type, category, amount, description, transaction_date } = req.body;

    console.log('📝 创建账单:', {
      coupleId: req.coupleId,
      userId: req.userId,
      type, category, amount, description, transaction_date
    });

    // 确保userId不是undefined
    if (!req.userId) {
      console.error('❌ userId为空！');
      return res.json({ code: 400, message: 'userId不能为空，请重新登录' });
    }

    if (!type || !amount || !transaction_date) {
      return res.json({ code: 400, message: '类型、金额和日期不能为空' });
    }

    if (type !== 'income' && type !== 'expense') {
      return res.json({ code: 400, message: '类型只能是income或expense' });
    }

    if (amount <= 0) {
      return res.json({ code: 400, message: '金额必须大于0' });
    }

    // 确保所有参数都不是undefined
    const params = [
      Number(req.coupleId),
      req.userId ? Number(req.userId) : null,
      type,
      category || null,
      amount,
      description || null,
      transaction_date
    ];

    console.log('   SQL参数:', params);

    const [result] = await pool.execute(
      'INSERT INTO account_book (couple_id, user_id, type, category, amount, description, transaction_date) VALUES (?, ?, ?, ?, ?, ?, ?)',
      params
    ) as any[];

    console.log('✅ 创建成功，ID:', result.insertId);

    res.json({ 
      code: 200, 
      message: '创建成功', 
      data: { id: result.insertId } 
    });
  } catch (error: any) {
    console.error('❌ 创建账单失败:', error.message);
    console.error('   完整错误:', error);
    res.json({ code: 500, message: `创建失败: ${error.message}` });
  }
});

// 更新账单
router.put('/update/:id', authMiddleware, async (req: any, res) => {
  try {
    const { id } = req.params;
    const { type, category, amount, description, transaction_date } = req.body;

    const [records] = await pool.execute(
      'SELECT user_id FROM account_book WHERE id = ? AND couple_id = ?',
      [id, Number(req.coupleId)]
    ) as any[];

    if (records.length === 0) {
      return res.json({ code: 404, message: '账单不存在' });
    }

    if (records[0].user_id !== req.userId) {
      return res.json({ code: 403, message: '只能编辑自己的账单' });
    }

    if (amount && amount <= 0) {
      return res.json({ code: 400, message: '金额必须大于0' });
    }

    await pool.execute(
      'UPDATE account_book SET type = ?, category = ?, amount = ?, description = ?, transaction_date = ? WHERE id = ?',
      [type, category, amount, description, transaction_date, id]
    );

    res.json({ code: 200, message: '更新成功' });
  } catch (error) {
    console.error('更新账单失败:', error);
    res.json({ code: 500, message: '更新失败' });
  }
});

// 删除账单
router.delete('/delete/:id', authMiddleware, async (req: any, res) => {
  try {
    const { id } = req.params;

    const [records] = await pool.execute(
      'SELECT user_id FROM account_book WHERE id = ? AND couple_id = ?',
      [id, Number(req.coupleId)]
    ) as any[];

    if (records.length === 0) {
      return res.json({ code: 404, message: '账单不存在' });
    }

    if (records[0].user_id !== req.userId) {
      return res.json({ code: 403, message: '只能删除自己的账单' });
    }

    await pool.execute('DELETE FROM account_book WHERE id = ?', [id]);

    res.json({ code: 200, message: '删除成功' });
  } catch (error) {
    console.error('删除账单失败:', error);
    res.json({ code: 500, message: '删除失败' });
  }
});

export default router;
