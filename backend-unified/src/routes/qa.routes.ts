import express from 'express';
import { authMiddleware } from '../middleware/auth';
import { pool } from '../config/database';

const router = express.Router();

// 获取问答列表（兼容两种路由）
const getQAList = async (req: any, res: any) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    const [qas] = await pool.execute(
      `SELECT * FROM qas 
       WHERE couple_id = ? 
       ORDER BY created_at DESC 
       LIMIT ${Number(limit)} OFFSET ${Number(offset)}`,
      [Number(req.coupleId)]
    ) as any[];

    const [total] = await pool.execute(
      'SELECT COUNT(*) as count FROM qas WHERE couple_id = ?',
      [Number(req.coupleId)]
    ) as any[];

    res.json({ 
      code: 200, 
      data: {
        list: qas,
        total: total[0].count,
        page: Number(page),
        pageSize: Number(limit)
      }
    });
  } catch (error) {
    console.error('获取问答列表失败:', error);
    res.json({ code: 500, message: '获取失败' });
  }
};

router.get('/list', authMiddleware, getQAList);
router.get('/', authMiddleware, getQAList); // 兼容前端调用

// 获取问答详情
router.get('/detail/:id', authMiddleware, async (req: any, res) => {
  try {
    const { id } = req.params;
    
    const [qas] = await pool.execute(
      'SELECT * FROM qas WHERE id = ? AND couple_id = ?',
      [id, Number(req.coupleId)]
    ) as any[];

    if (qas.length === 0) {
      return res.json({ code: 404, message: '问答不存在' });
    }

    res.json({ code: 200, data: qas[0] });
  } catch (error) {
    console.error('获取问答详情失败:', error);
    res.json({ code: 500, message: '获取失败' });
  }
});

// 创建问答
const createQA = async (req: any, res: any) => {
  try {
    console.log('❓ 创建问答 - userId:', req.userId, 'coupleId:', req.coupleId);
    const { question, user1_answer, user2_answer } = req.body;
    console.log('   参数:', { question, user1_answer, user2_answer });

    if (!question || question.trim() === '') {
      return res.json({ code: 400, message: '问题不能为空' });
    }

    const coupleId = req.coupleId || null;
    const creatorId = req.userId; // 记录创建者
    const insertData = [coupleId, creatorId, question, user1_answer || null, user2_answer || null];
    console.log('   插入数据:', insertData);

    const [result] = await pool.execute(
      'INSERT INTO qas (couple_id, creator_id, question, user1_answer, user2_answer) VALUES (?, ?, ?, ?, ?)',
      insertData
    ) as any[];

    console.log('✅ 问答创建成功，ID:', result.insertId, '创建者:', creatorId);
    res.json({ 
      code: 200, 
      message: '创建成功', 
      data: { id: result.insertId } 
    });
  } catch (error: any) {
    console.error('❌ 创建问答失败:', error.message);
    console.error('   堆栈:', error.stack);
    res.json({ code: 500, message: `创建失败: ${error.message}` });
  }
};

router.post('/create', authMiddleware, createQA);
router.post('/', authMiddleware, createQA); // 兼容前端调用

// 更新回答
const updateAnswer = async (req: any, res: any) => {
  try {
    const { id } = req.params;
    const { answer } = req.body;

    if (!answer || answer.trim() === '') {
      return res.json({ code: 400, message: '回答不能为空' });
    }

    // 查询问答和情侣关系
    const [qas] = await pool.execute(
      'SELECT id FROM qas WHERE id = ? AND couple_id = ?',
      [id, Number(req.coupleId)]
    ) as any[];

    if (qas.length === 0) {
      return res.json({ code: 404, message: '问答不存在' });
    }

    // 查询情侣关系，判断当前用户是user1还是user2
    const [couples] = await pool.execute(
      'SELECT user1_id, user2_id FROM couples WHERE id = ?',
      [Number(req.coupleId)]
    ) as any[];

    if (couples.length === 0) {
      return res.json({ code: 404, message: '情侣关系不存在' });
    }

    const couple = couples[0];
    const isUser1 = couple.user1_id === req.userId;
    const field = isUser1 ? 'user1_answer' : 'user2_answer';
    
    await pool.execute(
      `UPDATE qas SET ${field} = ? WHERE id = ?`,
      [answer, id]
    );

    console.log(`✅ 用户${isUser1 ? '1' : '2'}回答成功`);
    res.json({ code: 200, message: '回答成功' });
  } catch (error) {
    console.error('更新回答失败:', error);
    res.json({ code: 500, message: '更新失败' });
  }
};

router.put('/answer/:id', authMiddleware, updateAnswer);
router.post('/:id/answer', authMiddleware, updateAnswer); // 兼容前端调用

// 删除问答
router.delete('/delete/:id', authMiddleware, async (req: any, res) => {
  try {
    const { id } = req.params;

    const [qas] = await pool.execute(
      'SELECT id FROM qas WHERE id = ? AND couple_id = ?',
      [id, Number(req.coupleId)]
    ) as any[];

    if (qas.length === 0) {
      return res.json({ code: 404, message: '问答不存在' });
    }

    await pool.execute('DELETE FROM qas WHERE id = ?', [id]);

    res.json({ code: 200, message: '删除成功' });
  } catch (error) {
    console.error('删除问答失败:', error);
    res.json({ code: 500, message: '删除失败' });
  }
});

// 获取随机问题（用于生成新问答）
router.get('/random-question', authMiddleware, (req, res) => {
  const questions = [
    "你最喜欢我的哪一点？",
    "你觉得我们的关系中最重要的是什么？",
    "你希望我们在一起10年后是什么样子？",
    "如果可以改变我的一件事，你会改变什么？",
    "你认为完美的约会是什么样的？",
    "你最珍惜我们在一起的哪个时刻？",
    "你希望我多做什么？",
    "你对我们的未来有什么期待？",
    "你觉得我们最大的优势是什么？",
    "如果有一天，你会对我说什么？"
  ];

  const randomQuestion = questions[Math.floor(Math.random() * questions.length)];
  res.json({ code: 200, data: { question: randomQuestion } });
});

export default router;
