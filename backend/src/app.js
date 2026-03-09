const express      = require('express');
const cors         = require('cors');
const helmet       = require('helmet');
const cookieParser = require('cookie-parser');
const rateLimit    = require('express-rate-limit');
const errorHandler = require('./middleware/errorHandler');

const authRoutes          = require('./routes/auth');
const doctorRoutes        = require('./routes/doctors');
const patientRoutes       = require('./routes/patients');
const appointmentRoutes   = require('./routes/appointments');
const adminRoutes         = require('./routes/admin');
const notificationRoutes  = require('./routes/notifications');
const aiRoutes            = require('./routes/ai');
const reviewRoutes        = require('./routes/reviews');
const healthCenterRoutes  = require('./routes/healthCenters');

const app = express();

// ── Security headers ──────────────────────────────────────────────────────────
app.use(helmet());

// ── CORS — allow credentials so cookies are passed ───────────────────────────
const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:3000').split(',');
app.use(cors({
  origin: (origin, cb) => {
    if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
    cb(new Error(`CORS: origin ${origin} not allowed`));
  },
  credentials: true,
}));

// ── Body parsers ──────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser(process.env.COOKIE_SECRET));

// ── Rate limiting ─────────────────────────────────────────────────────────────
app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests. Please try again later.' },
}));

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { success: false, message: 'Too many auth attempts. Please wait.' },
});

// ── Routes ────────────────────────────────────────────────────────────────────
app.use('/auth',            authLimiter, authRoutes);
app.use('/doctors',         doctorRoutes);
app.use('/patients',        patientRoutes);
app.use('/appointments',    appointmentRoutes);
app.use('/admin',           adminRoutes);
app.use('/notifications',   notificationRoutes);
app.use('/ai',              aiRoutes);
app.use('/reviews',         reviewRoutes);
app.use('/health-centers',  healthCenterRoutes);

// ── Health check ──────────────────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ── 404 handler ───────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.method} ${req.path} not found.` });
});

// ── Global error handler ──────────────────────────────────────────────────────
app.use(errorHandler);

module.exports = app;
