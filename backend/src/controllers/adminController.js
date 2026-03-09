const bcrypt             = require('bcryptjs');
const pool               = require('../config/db');
const { success, error } = require('../utils/response');
const notif              = require('../services/notificationService');

// ─── GET /admin/doctors ───────────────────────────────────────────────────────
async function getAllDoctors(req, res, next) {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let query = `
      SELECT u.user_id, u.name, u.email, u.phone, u.created_at,
             dp.specialty_id, s.specialty_name,
             dp.health_center_id, hc.name AS health_center_name,
             dp.experience_years, dp.bio, dp.status
      FROM   doctor_profiles dp
      JOIN   users u              ON u.user_id           = dp.doctor_id
      JOIN   specialties s        ON s.specialty_id      = dp.specialty_id
      LEFT JOIN health_centers hc ON hc.health_center_id = dp.health_center_id
    `;
    const params = [];

    if (status) {
      params.push(status);
      query += ` WHERE dp.status = $${params.length}`;
    }
    query += ` ORDER BY u.name ASC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(parseInt(limit), offset);

    const { rows } = await pool.query(query, params);
    return success(res, { doctors: rows });
  } catch (err) {
    next(err);
  }
}

// ─── POST /admin/doctors ──────────────────────────────────────────────────────
async function createDoctor(req, res, next) {
  try {
    const {
      name, email, password, phone,
      specialty_id, health_center_id,
      experience_years, bio, language_preference,
    } = req.body;

    if (!name || !email || !password || !specialty_id) {
      return error(res, 'name, email, password, and specialty_id are required.', 400);
    }

    const existing = await pool.query(`SELECT user_id FROM users WHERE email = $1`, [email]);
    if (existing.rows.length) return error(res, 'Email already registered.', 409);

    const hashed = await bcrypt.hash(password, 12);
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      const userRes = await client.query(
        `INSERT INTO users (name, email, password, phone, language_preference)
         VALUES ($1, $2, $3, $4, $5) RETURNING user_id, name, email, created_at`,
        [name, email, hashed, phone || null, language_preference || 'en']
      );
      const user = userRes.rows[0];

      const roleRes = await client.query(`SELECT role_id FROM roles WHERE role_name = 'doctor'`);
      await client.query(
        `INSERT INTO user_roles (user_id, role_id) VALUES ($1, $2)`,
        [user.user_id, roleRes.rows[0].role_id]
      );

      await client.query(
        `INSERT INTO doctor_profiles (doctor_id, specialty_id, health_center_id, experience_years, bio)
         VALUES ($1, $2, $3, $4, $5)`,
        [user.user_id, specialty_id, health_center_id || null, experience_years || 0, bio || null]
      );

      await client.query('COMMIT');
      return success(res, {
        doctor: { ...user, specialty_id, health_center_id, experience_years, bio }
      }, 'Doctor account created.', 201);
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

// ─── PUT /admin/doctors/:doctor_id/suspend ────────────────────────────────────
async function suspendDoctor(req, res, next) {
  try {
    const { doctor_id } = req.params;

    const { rows } = await pool.query(
      `SELECT dp.status, u.name FROM doctor_profiles dp
       JOIN users u ON u.user_id = dp.doctor_id
       WHERE dp.doctor_id = $1`,
      [doctor_id]
    );
    if (!rows.length) return error(res, 'Doctor not found.', 404);
    if (rows[0].status === 'suspended') return error(res, 'Doctor is already suspended.', 400);

    await pool.query(
      `UPDATE doctor_profiles SET status = 'suspended', updated_at = NOW() WHERE doctor_id = $1`,
      [doctor_id]
    );

    await notif.doctorSuspended(doctor_id, rows[0].name);
    return success(res, {}, `Dr. ${rows[0].name} has been suspended.`);
  } catch (err) {
    next(err);
  }
}

// ─── PUT /admin/doctors/:doctor_id/activate ───────────────────────────────────
async function activateDoctor(req, res, next) {
  try {
    const { doctor_id } = req.params;

    const { rows } = await pool.query(
      `SELECT u.name FROM doctor_profiles dp
       JOIN users u ON u.user_id = dp.doctor_id
       WHERE dp.doctor_id = $1`,
      [doctor_id]
    );
    if (!rows.length) return error(res, 'Doctor not found.', 404);

    await pool.query(
      `UPDATE doctor_profiles SET status = 'active', updated_at = NOW() WHERE doctor_id = $1`,
      [doctor_id]
    );
    return success(res, {}, `Dr. ${rows[0].name} has been re-activated.`);
  } catch (err) {
    next(err);
  }
}

// ─── GET /admin/appointments ──────────────────────────────────────────────────
async function getAllAppointments(req, res, next) {
  try {
    const { status, doctor_id, patient_id, page = 1, limit = 30 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let query = `
      SELECT a.*, pu.name AS patient_name, du.name AS doctor_name,
             s.specialty_name, hc.name AS health_center_name
      FROM   appointments a
      JOIN   users pu              ON pu.user_id          = a.patient_id
      JOIN   users du              ON du.user_id          = a.doctor_id
      LEFT JOIN doctor_profiles dp ON dp.doctor_id        = a.doctor_id
      LEFT JOIN specialties s      ON s.specialty_id      = dp.specialty_id
      LEFT JOIN health_centers hc  ON hc.health_center_id = dp.health_center_id
      WHERE 1=1
    `;
    const params = [];

    if (status)     { params.push(status);     query += ` AND a.status = $${params.length}`; }
    if (doctor_id)  { params.push(doctor_id);  query += ` AND a.doctor_id = $${params.length}`; }
    if (patient_id) { params.push(patient_id); query += ` AND a.patient_id = $${params.length}`; }

    query += ` ORDER BY a.appointment_date DESC, a.appointment_time DESC
               LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(parseInt(limit), offset);

    const { rows } = await pool.query(query, params);
    return success(res, { appointments: rows });
  } catch (err) {
    next(err);
  }
}

// ─── PUT /admin/appointments/:appointment_id ──────────────────────────────────
async function updateAppointment(req, res, next) {
  try {
    const { appointment_id } = req.params;
    const { appointment_date, appointment_time, status, reason, duration_minutes } = req.body;

    const { rows } = await pool.query(
      `UPDATE appointments SET
         appointment_date = COALESCE($1, appointment_date),
         appointment_time = COALESCE($2, appointment_time),
         status           = COALESCE($3, status),
         reason           = COALESCE($4, reason),
         duration_minutes = COALESCE($5, duration_minutes),
         updated_at       = NOW()
       WHERE appointment_id = $6
       RETURNING *`,
      [
        appointment_date || null, appointment_time || null,
        status || null, reason || null,
        duration_minutes || null, appointment_id,
      ]
    );

    if (!rows.length) return error(res, 'Appointment not found.', 404);
    return success(res, { appointment: rows[0] }, 'Appointment updated.');
  } catch (err) {
    next(err);
  }
}

// ─── GET /admin/health-centers ────────────────────────────────────────────────
async function getAllHealthCenters(req, res, next) {
  try {
    const { rows } = await pool.query(
      `SELECT hc.*, COUNT(dp.doctor_id) AS doctor_count
       FROM   health_centers hc
       LEFT JOIN doctor_profiles dp ON dp.health_center_id = hc.health_center_id
       GROUP BY hc.health_center_id
       ORDER BY hc.name ASC`
    );
    return success(res, { health_centers: rows });
  } catch (err) {
    next(err);
  }
}

// ─── POST /admin/health-centers ───────────────────────────────────────────────
async function createHealthCenter(req, res, next) {
  try {
    const { name, address, phone, email } = req.body;
    if (!name) return error(res, 'name is required.', 400);

    const { rows } = await pool.query(
      `INSERT INTO health_centers (name, address, phone, email)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [name, address || null, phone || null, email || null]
    );
    return success(res, { health_center: rows[0] }, 'Health center created.', 201);
  } catch (err) {
    next(err);
  }
}

// ─── PUT /admin/health-centers/:health_center_id ──────────────────────────────
async function updateHealthCenter(req, res, next) {
  try {
    const { health_center_id } = req.params;
    const { name, address, phone, email } = req.body;

    const { rows } = await pool.query(
      `UPDATE health_centers SET
         name    = COALESCE($1, name),
         address = COALESCE($2, address),
         phone   = COALESCE($3, phone),
         email   = COALESCE($4, email)
       WHERE health_center_id = $5
       RETURNING *`,
      [name || null, address || null, phone || null, email || null, health_center_id]
    );
    if (!rows.length) return error(res, 'Health center not found.', 404);
    return success(res, { health_center: rows[0] }, 'Health center updated.');
  } catch (err) {
    next(err);
  }
}

// ─── DELETE /admin/health-centers/:health_center_id ───────────────────────────
async function deleteHealthCenter(req, res, next) {
  try {
    const { health_center_id } = req.params;
    const { rows } = await pool.query(
      `DELETE FROM health_centers WHERE health_center_id = $1 RETURNING name`,
      [health_center_id]
    );
    if (!rows.length) return error(res, 'Health center not found.', 404);
    return success(res, {}, `Health center "${rows[0].name}" deleted.`);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getAllDoctors,
  createDoctor,
  suspendDoctor,
  activateDoctor,
  getAllAppointments,
  updateAppointment,
  getAllHealthCenters,
  createHealthCenter,
  updateHealthCenter,
  deleteHealthCenter,
};
