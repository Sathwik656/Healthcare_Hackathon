const { verifyToken } = require('../utils/jwt');
const { error }       = require('../utils/response');
const pool            = require('../config/db');

/**
 * authenticate
 * Reads the JWT from the httpOnly cookie (set by the server at login).
 * Attaches req.user with { user_id, email, roles[] } if valid.
 */
async function authenticate(req, res, next) {
  try {
    const token = req.cookies?.auth_token;
    if (!token) {
      return error(res, 'Not authenticated. Please log in.', 401);
    }

    const decoded = verifyToken(token);

    // Fetch live roles from DB (so role changes take effect immediately)
    const { rows } = await pool.query(
      `SELECT r.role_name
       FROM   user_roles ur
       JOIN   roles r ON r.role_id = ur.role_id
       WHERE  ur.user_id = $1`,
      [decoded.user_id]
    );

    req.user = {
      user_id: decoded.user_id,
      email:   decoded.email,
      name:    decoded.name,
      roles:   rows.map(r => r.role_name),
    };

    next();
  } catch (err) {
    return error(res, 'Invalid or expired session. Please log in again.', 401);
  }
}

/**
 * authorise(...allowedRoles)
 * Returns middleware that checks req.user has at least one of the allowed roles.
 */
function authorise(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) return error(res, 'Not authenticated.', 401);
    const hasRole = req.user.roles.some(r => allowedRoles.includes(r));
    if (!hasRole) {
      return error(res, 'Access denied. Insufficient permissions.', 403);
    }
    next();
  };
}

module.exports = { authenticate, authorise };
