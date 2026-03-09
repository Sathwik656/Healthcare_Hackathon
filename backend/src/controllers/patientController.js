const pool           = require('../config/db');
const { success, error } = require('../utils/response');

// ─── GET /patients/profile ────────────────────────────────────────────────────
async function getProfile(req, res, next) {
  try {
    const { rows } = await pool.query(
      `SELECT u.user_id, u.name, u.email, u.phone, u.language_preference, u.created_at,
              pp.date_of_birth, pp.gender, pp.medical_notes
       FROM   patient_profiles pp
       JOIN   users u ON u.user_id = pp.patient_id
       WHERE  pp.patient_id = $1`,
      [req.user.user_id]
    );
    if (!rows.length) return error(res, 'Patient profile not found.', 404);
    return success(res, { patient: rows[0] });
  } catch (err) {
    next(err);
  }
}

// ─── PUT /patients/profile ────────────────────────────────────────────────────
async function updateProfile(req, res, next) {
  try {
    const patientId = req.user.user_id;
    const { name, phone, language_preference, date_of_birth, gender, medical_notes } = req.body;

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      await client.query(
        `UPDATE users SET
           name                = COALESCE($1, name),
           phone               = COALESCE($2, phone),
           language_preference = COALESCE($3, language_preference)
         WHERE user_id = $4`,
        [name, phone, language_preference, patientId]
      );

      await client.query(
        `UPDATE patient_profiles SET
           date_of_birth = COALESCE($1, date_of_birth),
           gender        = COALESCE($2, gender),
           medical_notes = COALESCE($3, medical_notes),
           updated_at    = NOW()
         WHERE patient_id = $4`,
        [date_of_birth || null, gender || null, medical_notes || null, patientId]
      );

      await client.query('COMMIT');

      const { rows } = await pool.query(
        `SELECT u.user_id, u.name, u.email, u.phone, u.language_preference, u.created_at,
                pp.date_of_birth, pp.gender, pp.medical_notes
         FROM   patient_profiles pp
         JOIN   users u ON u.user_id = pp.patient_id
         WHERE  pp.patient_id = $1`,
        [patientId]
      );

      return success(res, { patient: rows[0] }, 'Profile updated.');
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

module.exports = { getProfile, updateProfile };
