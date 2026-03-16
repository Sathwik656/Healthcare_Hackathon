const pool = require("../config/db");
const { success, error } = require("../utils/response");

// ─── POST /reviews ────────────────────────────────────────────────────────────
// Patient submits a review for a doctor they had an accepted appointment with
async function createReview(req, res, next) {
  try {
    const patientId = req.user.user_id;
    const { doctor_id, rating, comment } = req.body;

    if (!doctor_id || !rating) {
      return error(res, "doctor_id and rating are required.", 400);
    }
    if (rating < 1 || rating > 5) {
      return error(res, "Rating must be between 1 and 5.", 400);
    }

    // Patient must have had at least one accepted appointment with the doctor
    const eligCheck = await pool.query(
      `SELECT appointment_id FROM appointments
   WHERE  patient_id = $1 AND doctor_id = $2 AND status = 'completed'
   LIMIT  1`,
      [patientId, doctor_id],
    );
        
    if (!eligCheck.rows.length) {
      return error(
        res,
        "You can only review doctors you have had an accepted appointment with.",
        403,
      );
    }

    // UNIQUE(doctor_id, patient_id) — one review per patient per doctor
    const { rows } = await pool.query(
      `INSERT INTO doctor_reviews (doctor_id, patient_id, rating, comment)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (doctor_id, patient_id)
       DO UPDATE SET rating = $3, comment = $4, created_at = NOW()
       RETURNING *`,
      [doctor_id, patientId, rating, comment || null],
    );

    return success(res, { review: rows[0] }, "Review submitted.", 201);
  } catch (err) {
    next(err);
  }
}

// ─── GET /reviews/doctor/:doctor_id ──────────────────────────────────────────
async function getDoctorReviews(req, res, next) {
  try {
    const { doctor_id } = req.params;
    const { page = 1, limit = 20 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const { rows } = await pool.query(
      `SELECT dr.review_id, dr.rating, dr.comment, dr.created_at,
              u.name AS patient_name
       FROM   doctor_reviews dr
       JOIN   users u ON u.user_id = dr.patient_id
       WHERE  dr.doctor_id = $1
       ORDER  BY dr.created_at DESC
       LIMIT  $2 OFFSET $3`,
      [doctor_id, parseInt(limit), offset],
    );

    const statsRes = await pool.query(
      `SELECT ROUND(AVG(rating),1) AS avg_rating, COUNT(*) AS total
       FROM   doctor_reviews WHERE doctor_id = $1`,
      [doctor_id],
    );

    return success(res, {
      reviews: rows,
      stats: statsRes.rows[0],
    });
  } catch (err) {
    next(err);
  }
}

// ─── DELETE /reviews/:review_id ───────────────────────────────────────────────
async function deleteReview(req, res, next) {
  try {
    const { review_id } = req.params;
    const patientId = req.user.user_id;

    const { rows } = await pool.query(
      `DELETE FROM doctor_reviews
       WHERE review_id = $1 AND patient_id = $2
       RETURNING review_id`,
      [review_id, patientId],
    );
    if (!rows.length) return error(res, "Review not found or not yours.", 404);
    return success(res, {}, "Review deleted.");
  } catch (err) {
    next(err);
  }
}

module.exports = { createReview, getDoctorReviews, deleteReview };
