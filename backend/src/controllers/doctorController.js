const pool               = require('../config/db');
const { success, error } = require('../utils/response');

// ─── GET /doctors ─────────────────────────────────────────────────────────────
async function getAllDoctors(req, res, next) {
  try {
    const { specialty_id, health_center_id, search, page = 1, limit = 20 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let query = `
      SELECT u.user_id, u.name, u.email, u.phone,
             dp.specialty_id, s.specialty_name,
             dp.health_center_id, hc.name AS health_center_name, hc.address AS health_center_address,
             dp.experience_years, dp.bio, dp.status,
             ROUND(AVG(dr.rating), 1) AS avg_rating,
             COUNT(dr.review_id)      AS review_count
      FROM   doctor_profiles dp
      JOIN   users u              ON u.user_id           = dp.doctor_id
      JOIN   specialties s        ON s.specialty_id      = dp.specialty_id
      LEFT JOIN health_centers hc ON hc.health_center_id = dp.health_center_id
      LEFT JOIN doctor_reviews dr ON dr.doctor_id        = dp.doctor_id
      WHERE  dp.status = 'active'
    `;
    const params = [];

    if (specialty_id) {
      params.push(specialty_id);
      query += ` AND dp.specialty_id = $${params.length}`;
    }
    if (health_center_id) {
      params.push(health_center_id);
      query += ` AND dp.health_center_id = $${params.length}`;
    }
    if (search) {
      params.push(`%${search}%`);
      query += ` AND (u.name ILIKE $${params.length} OR s.specialty_name ILIKE $${params.length})`;
    }

    query += `
      GROUP BY u.user_id, dp.doctor_id, s.specialty_id, hc.health_center_id
      ORDER BY u.name ASC
      LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(parseInt(limit), offset);

    const { rows } = await pool.query(query, params);
    return success(res, { doctors: rows, page: parseInt(page), limit: parseInt(limit) });
  } catch (err) {
    next(err);
  }
}

// ─── GET /doctors/:doctor_id ──────────────────────────────────────────────────
async function getDoctorById(req, res, next) {
  try {
    const { doctor_id } = req.params;

    const docRes = await pool.query(
      `SELECT u.user_id, u.name, u.email, u.phone,
              dp.specialty_id, s.specialty_name,
              dp.health_center_id, hc.name AS health_center_name, hc.address AS health_center_address,
              dp.experience_years, dp.bio, dp.status, dp.updated_at,
              ROUND(AVG(dr.rating), 1) AS avg_rating,
              COUNT(dr.review_id)      AS review_count
       FROM   doctor_profiles dp
       JOIN   users u              ON u.user_id           = dp.doctor_id
       JOIN   specialties s        ON s.specialty_id      = dp.specialty_id
       LEFT JOIN health_centers hc ON hc.health_center_id = dp.health_center_id
       LEFT JOIN doctor_reviews dr ON dr.doctor_id        = dp.doctor_id
       WHERE  dp.doctor_id = $1
       GROUP  BY u.user_id, dp.doctor_id, s.specialty_id, hc.health_center_id`,
      [doctor_id]
    );
    if (!docRes.rows.length) return error(res, 'Doctor not found.', 404);

    const reviewRes = await pool.query(
      `SELECT dr.rating, dr.comment, dr.created_at, u.name AS patient_name
       FROM   doctor_reviews dr
       JOIN   users u ON u.user_id = dr.patient_id
       WHERE  dr.doctor_id = $1
       ORDER  BY dr.created_at DESC LIMIT 10`,
      [doctor_id]
    );

    return success(res, { doctor: docRes.rows[0], recent_reviews: reviewRes.rows });
  } catch (err) {
    next(err);
  }
}

// ─── GET /doctors/:doctor_id/availability ─────────────────────────────────────
async function getDoctorAvailability(req, res, next) {
  try {
    const { doctor_id } = req.params;
    const { rows } = await pool.query(
      `SELECT * FROM doctor_availability
       WHERE  doctor_id = $1
       ORDER  BY day_of_week, start_time`,
      [doctor_id]
    );
    return success(res, { availability: rows });
  } catch (err) {
    next(err);
  }
}

// ─── GET /doctors/:doctor_id/slots?date=YYYY-MM-DD ───────────────────────────
// Returns all time slots for a date, flagging which are already booked
async function getDoctorSlots(req, res, next) {
  try {
    const { doctor_id } = req.params;
    const { date } = req.query;
    if (!date) return error(res, 'date query param is required (YYYY-MM-DD).', 400);

    const dayOfWeek = new Date(date).getDay(); // 0=Sun … 6=Sat

    const availRes = await pool.query(
      `SELECT * FROM doctor_availability
       WHERE  doctor_id = $1 AND day_of_week = $2`,
      [doctor_id, dayOfWeek]
    );
    if (!availRes.rows.length) {
      return success(res, { slots: [], message: 'Doctor is not available on this day.' });
    }

    const bookedRes = await pool.query(
      `SELECT appointment_time FROM appointments
       WHERE  doctor_id = $1 AND appointment_date = $2
         AND  status IN ('pending','accepted')`,
      [doctor_id, date]
    );
    const bookedTimes = new Set(bookedRes.rows.map(r => r.appointment_time.slice(0, 5)));

    const slots = [];
    for (const avail of availRes.rows) {
      const duration   = avail.slot_duration || 30;
      let [h, m]       = avail.start_time.split(':').map(Number);
      const [eh, em]   = avail.end_time.split(':').map(Number);
      const endMinutes = eh * 60 + em;

      while (h * 60 + m + duration <= endMinutes) {
        const time = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
        slots.push({ time, available: !bookedTimes.has(time), duration_minutes: duration });
        m += duration;
        if (m >= 60) { h += Math.floor(m / 60); m = m % 60; }
      }
    }

    return success(res, { date, slots });
  } catch (err) {
    next(err);
  }
}

// ─── PUT /doctors/profile ─────────────────────────────────────────────────────
async function updateDoctorProfile(req, res, next) {
  try {
    const doctorId = req.user.user_id;
    const { specialty_id, health_center_id, experience_years, bio, phone, language_preference } = req.body;

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      await client.query(
        `UPDATE users SET
           phone               = COALESCE($1, phone),
           language_preference = COALESCE($2, language_preference)
         WHERE user_id = $3`,
        [phone || null, language_preference || null, doctorId]
      );

      await client.query(
        `UPDATE doctor_profiles SET
           specialty_id     = COALESCE($1, specialty_id),
           health_center_id = COALESCE($2, health_center_id),
           experience_years = COALESCE($3, experience_years),
           bio              = COALESCE($4, bio),
           updated_at       = NOW()
         WHERE doctor_id = $5`,
        [specialty_id || null, health_center_id || null, experience_years || null, bio || null, doctorId]
      );

      await client.query('COMMIT');

      const { rows } = await pool.query(
        `SELECT u.user_id, u.name, u.email, u.phone,
                dp.specialty_id, s.specialty_name,
                dp.health_center_id, hc.name AS health_center_name,
                dp.experience_years, dp.bio, dp.status
         FROM   doctor_profiles dp
         JOIN   users u              ON u.user_id           = dp.doctor_id
         JOIN   specialties s        ON s.specialty_id      = dp.specialty_id
         LEFT JOIN health_centers hc ON hc.health_center_id = dp.health_center_id
         WHERE  dp.doctor_id = $1`,
        [doctorId]
      );

      return success(res, { doctor: rows[0] }, 'Profile updated.');
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

// ─── POST /doctors/availability ───────────────────────────────────────────────
async function setAvailability(req, res, next) {
  try {
    const doctorId = req.user.user_id;
    const { slots } = req.body;
    // slots: [{ day_of_week, start_time, end_time, slot_duration }]

    if (!Array.isArray(slots) || !slots.length) {
      return error(res, 'slots must be a non-empty array.', 400);
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      // Replace all availability for this doctor
      await client.query(`DELETE FROM doctor_availability WHERE doctor_id = $1`, [doctorId]);

      for (const slot of slots) {
        const { day_of_week, start_time, end_time, slot_duration = 30 } = slot;
        if (day_of_week === undefined || !start_time || !end_time) {
          throw new Error('Each slot needs day_of_week, start_time, and end_time.');
        }
        await client.query(
          `INSERT INTO doctor_availability (doctor_id, day_of_week, start_time, end_time, slot_duration)
           VALUES ($1, $2, $3, $4, $5)`,
          [doctorId, day_of_week, start_time, end_time, slot_duration]
        );
      }

      await client.query('COMMIT');
      const { rows } = await pool.query(
        `SELECT * FROM doctor_availability WHERE doctor_id = $1 ORDER BY day_of_week, start_time`,
        [doctorId]
      );
      return success(res, { availability: rows }, 'Availability updated.');
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

module.exports = {
  getAllDoctors,
  getDoctorById,
  getDoctorAvailability,
  getDoctorSlots,
  updateDoctorProfile,
  setAvailability,
};
