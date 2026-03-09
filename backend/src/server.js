require('dotenv').config();

const http               = require('http');
const { Server }         = require('socket.io');
const app                = require('./app');
const { initSocket }     = require('./websocket/socketHandler');
const notifService       = require('./services/notificationService');

const PORT = process.env.PORT || 5000;

// ── Create HTTP server (shared between Express and Socket.IO) ─────────────────
const server = http.createServer(app);

// ── Attach Socket.IO to the same server ──────────────────────────────────────
const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:3000').split(',');

const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST'],
    credentials: true, // allow cookies on WS handshake
  },
  transports: ['websocket', 'polling'],
});

// ── Bootstrap services ────────────────────────────────────────────────────────
initSocket(io);           // register WS auth + event handlers
notifService.init(io);    // inject io into notification service

// ── Start listening ───────────────────────────────────────────────────────────
server.listen(PORT, () => {
  console.log(`
  ╔══════════════════════════════════════════════════╗
  ║   🏥  Healthcare Appointment API                 ║
  ║   🚀  Running on http://localhost:${PORT}            ║
  ║   📡  WebSockets (Socket.IO) ready               ║
  ║   🌍  Environment: ${(process.env.NODE_ENV || 'development').padEnd(28)}║
  ╚══════════════════════════════════════════════════╝
  `);
});

// ── Graceful shutdown ─────────────────────────────────────────────────────────
process.on('SIGTERM', () => {
  console.log('SIGTERM received — shutting down gracefully...');
  server.close(() => {
    console.log('HTTP server closed.');
    process.exit(0);
  });
});

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled Rejection:', reason);
});
