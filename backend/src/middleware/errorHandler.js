function errorHandler(err, req, res, next) {
  console.error(`[ERROR] ${req.method} ${req.path}:`, err.message);

  // Postgres unique violation
  if (err.code === '23505') {
    return res.status(409).json({ success: false, message: 'Duplicate entry — that record already exists.' });
  }

  // Postgres foreign key violation
  if (err.code === '23503') {
    return res.status(400).json({ success: false, message: 'Referenced record does not exist.' });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    return res.status(401).json({ success: false, message: 'Invalid or expired session.' });
  }

  const statusCode = err.statusCode || err.status || 500;
  const message    = err.expose || process.env.NODE_ENV !== 'production'
    ? err.message
    : 'Internal server error.';

  res.status(statusCode).json({ success: false, message });
}

module.exports = errorHandler;
