const bcrypt          = require('bcryptjs');
const pool            = require('../config/db');
const { issueToken, clearToken } = require('../utils/jwt');
const { success, error }         = require('../utils/response');

// ─── POST /auth/register ──────────────────────────────────────────────────────
async function register(req, res, next) {
  try {
    const { name, email, password, phone, language_preference } = req.body;

    if (!name || !email || !password) {
      return error(res, 'name, email, and password are required.', 400);
    }

    // Check duplicate email
    const existing = await pool.query('SELECT user_id FROM users WHERE email = $1', [email]);
    if (existing.rows.length) {
      return error(res, 'An account with that email already exists.', 409);
    }

    const hashed = await bcrypt.hash(password, 12);

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Insert user
      const userRes = await client.query(
        `INSERT INTO users (name, email, password, phone, language_preference)
         VALUES ($1, $2, $3, $4, $5) RETURNING user_id, name, email, phone, language_preference, created_at`,
        [name, email, hashed, phone || null, language_preference || 'en']
      );
      const user = userRes.rows[0];

      // Assign patient role by default
      const roleRes = await client.query(`SELECT role_id FROM roles WHERE role_name = 'patient'`);
      await client.query(
        `INSERT INTO user_roles (user_id, role_id) VALUES ($1, $2)`,
        [user.user_id, roleRes.rows[0].role_id]
      );

      // Create patient profile row
      await client.query(
        `INSERT INTO patient_profiles (patient_id) VALUES ($1)`,
        [user.user_id]
      );

      await client.query('COMMIT');

      // Issue cookie immediately so user is logged in after registering
      issueToken(res, { user_id: user.user_id, email: user.email, name: user.name });

      return success(res, { user: { ...user, roles: ['patient'] } }, 'Registration successful.', 201);
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  } catch (err) {
    next(err);
  }
}

// ─── POST /auth/login ─────────────────────────────────────────────────────────
async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return error(res, 'Email and password are required.', 400);
    }

    const { rows } = await pool.query(`SELECT * FROM users WHERE email = $1`, [email]);
    const user = rows[0];
    if (!user) return error(res, 'Invalid email or password.', 401);

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return error(res, 'Invalid email or password.', 401);

    // Fetch roles
    const rolesRes = await pool.query(
      `SELECT r.role_name FROM user_roles ur
       JOIN roles r ON r.role_id = ur.role_id
       WHERE ur.user_id = $1`,
      [user.user_id]
    );
    const roles = rolesRes.rows.map(r => r.role_name);

    // ✅ Server sets the httpOnly cookie — client JS never touches the token
    issueToken(res, { user_id: user.user_id, email: user.email, name: user.name });

    const { password: _, ...safeUser } = user;
    return success(res, { user: { ...safeUser, roles } }, 'Login successful.');
  } catch (err) {
    next(err);
  }
}

// ─── POST /auth/logout ────────────────────────────────────────────────────────
async function logout(req, res, next) {
  try {
    // ✅ Server clears the cookie — client is immediately unauthenticated
    clearToken(res);
    return success(res, {}, 'Logged out successfully.');
  } catch (err) {
    next(err);
  }
}

// ─── GET /auth/me ─────────────────────────────────────────────────────────────
async function me(req, res, next) {
  try {
    const { rows } = await pool.query(
      `SELECT user_id, name, email, phone, language_preference, created_at
       FROM users WHERE user_id = $1`,
      [req.user.user_id]
    );
    if (!rows.length) return error(res, 'User not found.', 404);

    const user = rows[0];
    return success(res, { user: { ...user, roles: req.user.roles } });
  } catch (err) {
    next(err);
  }
}

module.exports = { register, login, logout, me };
