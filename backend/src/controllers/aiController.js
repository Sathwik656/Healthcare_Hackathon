const pool               = require('../config/db');
const { success, error } = require('../utils/response');
const aiService          = require('../services/aiService');

// ─── POST /ai/recommend ───────────────────────────────────────────────────────
async function recommend(req, res, next) {
  try {
    const { symptoms } = req.body;
    if (!symptoms || symptoms.trim().length < 3) {
      return error(res, 'Please describe your symptoms (at least 3 characters).', 400);
    }

    const result = await aiService.recommend(req.user.user_id, symptoms.trim());
    return success(res, result, 'Recommendation generated.');
  } catch (err) {
    next(err);
  }
}

// ─── GET /ai/recommendations ──────────────────────────────────────────────────
async function getRecommendations(req, res, next) {
  try {
    const { page = 1, limit = 10 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const { rows } = await pool.query(
      `SELECT ar.*, s.specialty_name, u.name AS doctor_name
       FROM   ai_recommendations ar
       LEFT JOIN specialties s ON s.specialty_id = ar.recommended_specialty_id
       LEFT JOIN users u       ON u.user_id = ar.recommended_doctor_id
       WHERE  ar.patient_id = $1
       ORDER  BY ar.created_at DESC
       LIMIT  $2 OFFSET $3`,
      [req.user.user_id, parseInt(limit), offset]
    );

    return success(res, { recommendations: rows });
  } catch (err) {
    next(err);
  }
}

module.exports = { recommend, getRecommendations };
