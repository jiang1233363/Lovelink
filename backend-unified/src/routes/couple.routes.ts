import express from 'express';
import { authMiddleware } from '../middleware/auth';
import { pool } from '../config/database';

const router = express.Router();

// 创建配对邀请表（如果不存在）
async function ensureInvitesTable() {
  try {
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS couple_invites (
        id INT PRIMARY KEY AUTO_INCREMENT,
        from_user_id INT NOT NULL,
        to_user_id INT NOT NULL,
        status ENUM('pending', 'accepted', 'rejected', 'cancelled') DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_from_user (from_user_id),
        INDEX idx_to_user (to_user_id),
        INDEX idx_status (status),
        FOREIGN KEY (from_user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (to_user_id) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
  } catch (error) {
    console.error('创建配对邀请表失败:', error);
  }
}

ensureInvitesTable();

// 发送配对邀请
router.post('/invite', authMiddleware, async (req: any, res) => {
  try {
    const { to_username } = req.body;
    const fromUserId = req.userId;

    console.log('💌 发送配对邀请:', { from: fromUserId, to: to_username });

    // 检查是否已经配对
    const [myInfo] = await pool.execute(
      'SELECT couple_id FROM users WHERE id = ?',
      [fromUserId]
    ) as any[];

    if (myInfo[0].couple_id) {
      return res.json({ code: 400, message: '你已经配对了，不能发送新的邀请' });
    }

    // 查找目标用户
    const [targetUsers] = await pool.execute(
      'SELECT id, username, couple_id FROM users WHERE username = ?',
      [to_username]
    ) as any[];

    if (targetUsers.length === 0) {
      return res.json({ code: 404, message: '用户不存在' });
    }

    const targetUser = targetUsers[0];

    if (targetUser.id === fromUserId) {
      return res.json({ code: 400, message: '不能邀请自己' });
    }

    if (targetUser.couple_id) {
      return res.json({ code: 400, message: '对方已经配对了' });
    }

    // 检查是否已有待处理的邀请
    const [existingInvites] = await pool.execute(
      `SELECT id FROM couple_invites 
       WHERE ((from_user_id = ? AND to_user_id = ?) OR (from_user_id = ? AND to_user_id = ?))
       AND status = 'pending'`,
      [fromUserId, targetUser.id, targetUser.id, fromUserId]
    ) as any[];

    if (existingInvites.length > 0) {
      return res.json({ code: 400, message: '已有待处理的邀请' });
    }

    // 创建邀请
    await pool.execute(
      'INSERT INTO couple_invites (from_user_id, to_user_id, status) VALUES (?, ?, ?)',
      [fromUserId, targetUser.id, 'pending']
    );

    console.log('✅ 邀请创建成功');
    res.json({ code: 200, message: '邀请已发送' });
  } catch (error: any) {
    console.error('❌ 发送邀请失败:', error);
    res.json({ code: 500, message: '发送邀请失败' });
  }
});

// 获取邀请列表
router.get('/invites', authMiddleware, async (req: any, res) => {
  try {
    const userId = req.userId;

    // 获取收到的邀请
    const [pendingInvites] = await pool.execute(
      `SELECT ci.id, ci.from_user_id, u.username as from_username, ci.created_at
       FROM couple_invites ci
       LEFT JOIN users u ON ci.from_user_id = u.id
       WHERE ci.to_user_id = ? AND ci.status = 'pending'
       ORDER BY ci.created_at DESC`,
      [userId]
    ) as any[];

    // 获取发出的邀请
    const [sentInvites] = await pool.execute(
      `SELECT ci.id, ci.to_user_id, u.username as to_username, ci.created_at
       FROM couple_invites ci
       LEFT JOIN users u ON ci.to_user_id = u.id
       WHERE ci.from_user_id = ? AND ci.status = 'pending'
       ORDER BY ci.created_at DESC`,
      [userId]
    ) as any[];

    res.json({
      code: 200,
      data: {
        pending: pendingInvites,
        sent: sentInvites
      }
    });
  } catch (error: any) {
    console.error('❌ 获取邀请列表失败:', error);
    res.json({ code: 500, message: '获取邀请列表失败' });
  }
});

// 接受邀请
router.post('/accept/:inviteId', authMiddleware, async (req: any, res) => {
  try {
    const { inviteId } = req.params;
    const userId = req.userId;

    console.log('✅ 接受邀请:', { inviteId, userId });

    // 获取邀请信息
    const [invites] = await pool.execute(
      'SELECT * FROM couple_invites WHERE id = ? AND to_user_id = ? AND status = \'pending\'',
      [inviteId, userId]
    ) as any[];

    if (invites.length === 0) {
      return res.json({ code: 404, message: '邀请不存在或已处理' });
    }

    const invite = invites[0];

    // 检查双方是否都未配对
    const [users] = await pool.execute(
      'SELECT id, couple_id FROM users WHERE id IN (?, ?)',
      [invite.from_user_id, invite.to_user_id]
    ) as any[];

    if (users.some((u: any) => u.couple_id !== null)) {
      return res.json({ code: 400, message: '有用户已配对，无法完成配对' });
    }

    // 创建配对关系
    const [result] = await pool.execute(
      'INSERT INTO couples (user1_id, user2_id, relationship_start_date) VALUES (?, ?, ?)',
      [invite.from_user_id, invite.to_user_id, new Date().toISOString().split('T')[0]]
    ) as any[];

    const coupleId = result.insertId;

    // 更新用户的couple_id
    await pool.execute(
      'UPDATE users SET couple_id = ? WHERE id IN (?, ?)',
      [coupleId, invite.from_user_id, invite.to_user_id]
    );

    // 更新邀请状态
    await pool.execute(
      'UPDATE couple_invites SET status = \'accepted\' WHERE id = ?',
      [inviteId]
    );

    // 取消其他所有待处理的邀请
    await pool.execute(
      `UPDATE couple_invites SET status = 'cancelled' 
       WHERE (from_user_id IN (?, ?) OR to_user_id IN (?, ?)) 
       AND status = 'pending' AND id != ?`,
      [invite.from_user_id, invite.to_user_id, invite.from_user_id, invite.to_user_id, inviteId]
    );

    console.log('✅ 配对成功, couple_id:', coupleId);
    res.json({ code: 200, message: '配对成功', data: { coupleId } });
  } catch (error: any) {
    console.error('❌ 接受邀请失败:', error);
    res.json({ code: 500, message: '接受邀请失败' });
  }
});

// 拒绝邀请
router.post('/reject/:inviteId', authMiddleware, async (req: any, res) => {
  try {
    const { inviteId } = req.params;
    const userId = req.userId;

    await pool.execute(
      'UPDATE couple_invites SET status = \'rejected\' WHERE id = ? AND to_user_id = ?',
      [inviteId, userId]
    );

    res.json({ code: 200, message: '已拒绝邀请' });
  } catch (error: any) {
    console.error('❌ 拒绝邀请失败:', error);
    res.json({ code: 500, message: '拒绝邀请失败' });
  }
});

// 取消邀请
router.delete('/invite/:inviteId', authMiddleware, async (req: any, res) => {
  try {
    const { inviteId } = req.params;
    const userId = req.userId;

    await pool.execute(
      'UPDATE couple_invites SET status = \'cancelled\' WHERE id = ? AND from_user_id = ?',
      [inviteId, userId]
    );

    res.json({ code: 200, message: '已取消邀请' });
  } catch (error: any) {
    console.error('❌ 取消邀请失败:', error);
    res.json({ code: 500, message: '取消邀请失败' });
  }
});

// 解除配对
router.post('/unpair', authMiddleware, async (req: any, res) => {
  try {
    const userId = req.userId;

    console.log('💔 解除配对:', userId);

    // 获取用户的couple_id
    const [users] = await pool.execute(
      'SELECT couple_id FROM users WHERE id = ?',
      [userId]
    ) as any[];

    if (users.length === 0 || !users[0].couple_id) {
      return res.json({ code: 400, message: '未配对' });
    }

    const coupleId = users[0].couple_id;

    // 清除双方的couple_id
    await pool.execute(
      'UPDATE users SET couple_id = NULL WHERE couple_id = ?',
      [coupleId]
    );

    // 删除配对关系（或标记为inactive）
    await pool.execute(
      'UPDATE couples SET relationship_status = \'inactive\' WHERE id = ?',
      [coupleId]
    );

    console.log('✅ 配对已解除');
    res.json({ code: 200, message: '配对已解除' });
  } catch (error: any) {
    console.error('❌ 解除配对失败:', error);
    res.json({ code: 500, message: '解除配对失败' });
  }
});

export default router;

