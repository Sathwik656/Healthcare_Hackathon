const pool               = require('../config/db');
const { success, error } = require('../utils/response');

// ─── GET /health-centers ──────────────────────────────────────────────────────
async function getAllHealthCenters(req, res, next) {
  try {
    const { search } = req.query;
    let query = `
      SELECT hc.*, COUNT(dp.doctor_id) AS doctor_count
      FROM   health_centers hc
      LEFT JOIN doctor_profiles dp ON dp.health_center_id = hc.health_center_id AND dp.status = 'active'
    `;
    const params = [];
    if (search) {
      params.push(`%${search}%`);
      query += ` WHERE hc.name ILIKE $1 OR hc.address ILIKE $1`;
    }
    query += ` GROUP BY hc.health_center_id ORDER BY hc.name ASC`;

    const { rows } = await pool.query(query, params);
    return success(res, { health_centers: rows });
  } catch (err) {
    next(err);
  }
}

// ─── GET /health-centers/:health_center_id ────────────────────────────────────
async function getHealthCenterById(req, res, next) {
  try {
    const { health_center_id } = req.params;

    const hcRes = await pool.query(
      `SELECT * FROM health_centers WHERE health_center_id = $1`,
      [health_center_id]
    );
    if (!hcRes.rows.length) return error(res, 'Health center not found.', 404);

    // Also return active doctors at this center
    const doctorRes = await pool.query(
      `SELECT u.user_id, u.name, dp.experience_years, dp.bio,
              s.specialty_name,
              ROUND(AVG(dr.rating),1) AS avg_rating
       FROM   doctor_profiles dp
       JOIN   users u       ON u.user_id      = dp.doctor_id
       JOIN   specialties s ON s.specialty_id = dp.specialty_id
       LEFT JOIN doctor_reviews dr ON dr.doctor_id = dp.doctor_id
       WHERE  dp.health_center_id = $1 AND dp.status = 'active'
       GROUP  BY u.user_id, dp.doctor_id, s.specialty_id
       ORDER  BY u.name ASC`,
      [health_center_id]
    );

    return success(res, {
      health_center: hcRes.rows[0],
      doctors: doctorRes.rows,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { getAllHealthCenters, getHealthCenterById };
