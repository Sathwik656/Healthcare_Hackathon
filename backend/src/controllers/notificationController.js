const pool               = require('../config/db');
const { success, error } = require('../utils/response');

// ─── GET /notifications ───────────────────────────────────────────────────────
async function getNotifications(req, res, next) {
  try {
    const { is_read, page = 1, limit = 30 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const params = [req.user.user_id];

    let query = `
      SELECT * FROM notifications
      WHERE user_id = $1
    `;

    if (is_read !== undefined) {
      params.push(is_read === 'true');
      query += ` AND is_read = $${params.length}`;
    }

    query += ` ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(parseInt(limit), offset);

    const { rows } = await pool.query(query, params);

    // Unread count
    const countRes = await pool.query(
      `SELECT COUNT(*) FROM notifications WHERE user_id = $1 AND is_read = FALSE`,
      [req.user.user_id]
    );

    return success(res, {
      notifications: rows,
      unread_count: parseInt(countRes.rows[0].count),
    });
  } catch (err) {
    next(err);
  }
}

// ─── PUT /notifications/:id/read ─────────────────────────────────────────────
async function markAsRead(req, res, next) {
  try {
    const { notification_id } = req.params;
    const { rows } = await pool.query(
      `UPDATE notifications SET is_read = TRUE
       WHERE notification_id = $1 AND user_id = $2
       RETURNING *`,
      [notification_id, req.user.user_id]
    );
    if (!rows.length) return error(res, 'Notification not found.', 404);
    return success(res, { notification: rows[0] }, 'Marked as read.');
  } catch (err) {
    next(err);
  }
}

// ─── PUT /notifications/read-all ─────────────────────────────────────────────
async function markAllRead(req, res, next) {
  try {
    await pool.query(
      `UPDATE notifications SET is_read = TRUE WHERE user_id = $1 AND is_read = FALSE`,
      [req.user.user_id]
    );
    return success(res, {}, 'All notifications marked as read.');
  } catch (err) {
    next(err);
  }
}

module.exports = { getNotifications, markAsRead, markAllRead };
