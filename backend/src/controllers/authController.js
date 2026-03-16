const bcrypt = require("bcryptjs");
const pool = require("../config/db");
const { issueToken, clearToken } = require("../utils/jwt");
const { success, error } = require("../utils/response");
const { generateOtp, sendOtpEmail } = require("../services/emailService");

// POST /auth/register
async function register(req, res, next) {
  try {
    const { name, email, password, phone, language_preference } = req.body;
    if (!name || !email || !password)
      return error(res, "name, email, and password are required.", 400);

    const existing = await pool.query(
      "SELECT user_id, is_verified FROM users WHERE email = $1",
      [email],
    );
    if (existing.rows.length) {
      if (existing.rows[0].is_verified)
        return error(res, "An account with that email already exists.", 409);

      // Unverified — just resend OTP
      const otp = generateOtp();
      await pool.query(
        `UPDATE users SET otp_code = $1, otp_expires_at = $2 WHERE user_id = $3`,
        [otp, new Date(Date.now() + 10 * 60 * 1000), existing.rows[0].user_id],
      );
      sendOtpEmail(email, name, otp).catch(() => {});
      return success(
        res,
        { email, user_id: existing.rows[0].user_id },
        "Account pending verification. A new OTP has been sent.",
        200,
      );
    }

    const hashed = await bcrypt.hash(password, 12);
    const otp = generateOtp();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      const {
        rows: [user],
      } = await client.query(
        `INSERT INTO users (name, email, password, phone, language_preference, otp_code, otp_expires_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING user_id, name, email`,
        [
          name,
          email,
          hashed,
          phone || null,
          language_preference || "en",
          otp,
          otpExpiry,
        ],
      );

      const {
        rows: [role],
      } = await client.query(
        `SELECT role_id FROM roles WHERE role_name = 'patient'`,
      );
      await client.query(
        `INSERT INTO user_roles (user_id, role_id) VALUES ($1,$2)`,
        [user.user_id, role.role_id],
      );
      await client.query(
        `INSERT INTO patient_profiles (patient_id) VALUES ($1)`,
        [user.user_id],
      );

      await client.query("COMMIT");

      try {
        const result = await sendOtpEmail(email, name, otp);
        console.log("[OTP DEBUG] Email result:", result);
      } catch (e) {
        console.error("[OTP DEBUG] Email error:", e);
      }
      
      return success(
        res,
        { email, user_id: user.user_id },
        "Registration successful. Check your email for a verification code.",
        201,
      );
    } catch (e) {
      await client.query("ROLLBACK");
      throw e;
    } finally {
      client.release();
    }
  } catch (err) {
    next(err);
  }
}

// POST /auth/verify-otp
async function verifyOtp(req, res, next) {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) return error(res, "email and otp are required.", 400);

    const { rows } = await pool.query(
      `SELECT user_id, name, email, otp_code, otp_expires_at, is_verified FROM users WHERE email = $1`,
      [email],
    );
    const user = rows[0];
    if (!user) return error(res, "Account not found.", 404);
    if (user.is_verified)
      return error(res, "Account already verified. Please log in.", 400);
    if (user.otp_code !== String(otp))
      return error(res, "Invalid verification code.", 400);
    if (new Date() > new Date(user.otp_expires_at))
      return error(res, "Code expired. Please request a new one.", 400);

    await pool.query(
      `UPDATE users SET is_verified = TRUE, otp_code = NULL, otp_expires_at = NULL WHERE user_id = $1`,
      [user.user_id],
    );

    const { rows: roleRows } = await pool.query(
      `SELECT r.role_name FROM user_roles ur JOIN roles r ON r.role_id = ur.role_id WHERE ur.user_id = $1`,
      [user.user_id],
    );

    issueToken(res, {
      user_id: user.user_id,
      email: user.email,
      name: user.name,
    });
    return success(
      res,
      {
        user: {
          user_id: user.user_id,
          name: user.name,
          email: user.email,
          roles: roleRows.map((r) => r.role_name),
        },
      },
      "Email verified. Welcome!",
    );
  } catch (err) {
    next(err);
  }
}

// POST /auth/resend-otp
async function resendOtp(req, res, next) {
  try {
    const { email } = req.body;
    if (!email) return error(res, "email is required.", 400);

    const { rows } = await pool.query(
      `SELECT user_id, name, is_verified FROM users WHERE email = $1`,
      [email],
    );
    const user = rows[0];
    if (!user) return error(res, "Account not found.", 404);
    if (user.is_verified) return error(res, "Account already verified.", 400);

    const otp = generateOtp();
    await pool.query(
      `UPDATE users SET otp_code = $1, otp_expires_at = $2 WHERE user_id = $3`,
      [otp, new Date(Date.now() + 10 * 60 * 1000), user.user_id],
    );
    sendOtpEmail(email, user.name, otp).catch((e) =>
      console.error("[EMAIL]", e.message),
    );

    return success(res, { email }, "A new verification code has been sent.");
  } catch (err) {
    next(err);
  }
}

// POST /auth/login
async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return error(res, "Email and password are required.", 400);

    const { rows } = await pool.query(`SELECT * FROM users WHERE email = $1`, [
      email,
    ]);
    const user = rows[0];
    if (!user) return error(res, "Invalid email or password.", 401);

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return error(res, "Invalid email or password.", 401);

    if (!user.is_verified) {
      const otp = generateOtp();
      await pool.query(
        `UPDATE users SET otp_code = $1, otp_expires_at = $2 WHERE user_id = $3`,
        [otp, new Date(Date.now() + 10 * 60 * 1000), user.user_id],
      );
      sendOtpEmail(email, user.name, otp).catch(() => {});
      return error(
        res,
        "Email not verified. A new code has been sent to your email.",
        403,
      );
    }

    const { rows: roleRows } = await pool.query(
      `SELECT r.role_name FROM user_roles ur JOIN roles r ON r.role_id = ur.role_id WHERE ur.user_id = $1`,
      [user.user_id],
    );

    issueToken(res, {
      user_id: user.user_id,
      email: user.email,
      name: user.name,
    });
    const {
      password: _,
      otp_code: __,
      otp_expires_at: ___,
      ...safeUser
    } = user;
    return success(
      res,
      { user: { ...safeUser, roles: roleRows.map((r) => r.role_name) } },
      "Login successful.",
    );
  } catch (err) {
    next(err);
  }
}

// POST /auth/logout
async function logout(req, res, next) {
  try {
    clearToken(res);
    return success(res, {}, "Logged out successfully.");
  } catch (err) {
    next(err);
  }
}

// GET /auth/me
async function me(req, res, next) {
  try {
    const { rows } = await pool.query(
      `SELECT user_id, name, email, phone, language_preference, is_verified, created_at FROM users WHERE user_id = $1`,
      [req.user.user_id],
    );
    if (!rows.length) return error(res, "User not found.", 404);
    return success(res, { user: { ...rows[0], roles: req.user.roles } });
  } catch (err) {
    next(err);
  }
}

module.exports = { register, login, logout, me, verifyOtp, resendOtp };
