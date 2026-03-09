const { verifyToken } = require('../utils/jwt');
const cookie          = require('cookie');

/**
 * Initialise Socket.IO with cookie-based JWT authentication.
 * Each authenticated user joins their own room: user_{user_id}
 */
function initSocket(io) {
  // ── Auth middleware for Socket.IO ──────────────────────────────────────────
  io.use((socket, next) => {
    try {
      // Parse cookies from the handshake headers
      const rawCookies = socket.handshake.headers.cookie || '';
      const cookies    = cookie.parse(rawCookies);
      const token      = cookies.auth_token;

      if (!token) {
        return next(new Error('Authentication required. Please log in.'));
      }

      const decoded     = verifyToken(token);
      socket.user       = decoded; // attach to socket
      next();
    } catch (err) {
      next(new Error('Invalid or expired session.'));
    }
  });

  // ── Connection handler ─────────────────────────────────────────────────────
  io.on('connection', (socket) => {
    const { user_id, name } = socket.user;

    // Join personal room so server can push to this user directly
    const room = `user_${user_id}`;
    socket.join(room);

    console.log(`🔌 [WS] ${name} (${user_id}) connected → joined room ${room}`);

    // ── Client-initiated: mark notification read via WS ──────────────────────
    socket.on('mark_notification_read', async ({ notification_id }) => {
      try {
        const pool = require('../config/db');
        await pool.query(
          `UPDATE notifications SET is_read = TRUE
           WHERE notification_id = $1 AND user_id = $2`,
          [notification_id, user_id]
        );
        socket.emit('notification_marked_read', { notification_id });
      } catch (e) {
        socket.emit('error', { message: 'Failed to mark notification.' });
      }
    });

    // ── Ping/pong health check ───────────────────────────────────────────────
    socket.on('ping', () => socket.emit('pong', { ts: Date.now() }));

    socket.on('disconnect', (reason) => {
      console.log(`🔌 [WS] ${name} (${user_id}) disconnected: ${reason}`);
    });

    socket.on('error', (err) => {
      console.error(`[WS ERROR] ${user_id}:`, err.message);
    });
  });
}

module.exports = { initSocket };
