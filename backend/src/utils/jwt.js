const jwt = require('jsonwebtoken');

const SECRET      = process.env.JWT_SECRET;
const EXPIRES_IN  = process.env.JWT_EXPIRES_IN || '7d';

// Cookie options — httpOnly prevents JS access; secure in production
const cookieOptions = () => ({
  httpOnly: true,
  secure:   process.env.NODE_ENV === 'production',
  sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
  maxAge:   7 * 24 * 60 * 60 * 1000, // 7 days in ms
  path:     '/',
});

/**
 * Sign a JWT and set it as an httpOnly cookie on the response.
 * The client JS never sees the raw token.
 */
function issueToken(res, payload) {
  const token = jwt.sign(payload, SECRET, { expiresIn: EXPIRES_IN });
  res.cookie('auth_token', token, cookieOptions());
  return token;
}

/**
 * Clear the auth cookie — effectively "logs out" the user server-side.
 */
function clearToken(res) {
  res.clearCookie('auth_token', {
    httpOnly: true,
    secure:   process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
    path:     '/',
  });
}

/**
 * Verify a JWT string and return the decoded payload.
 */
function verifyToken(token) {
  return jwt.verify(token, SECRET);
}

module.exports = { issueToken, clearToken, verifyToken };
