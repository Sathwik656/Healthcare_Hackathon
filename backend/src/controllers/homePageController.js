const pool               = require('../config/db');
const { success, error } = require('../utils/response');

async function getHomepageData(req, res, next) {
  try {
    const [featuredDoctors, hospitals, specialties, testimonials, stats] = await Promise.all([

      pool.query(`
        SELECT u.user_id, u.name, dp.bio, dp.experience_years,
               s.specialty_name, hc.name AS health_center_name,
               ROUND(AVG(dr.rating), 1) AS avg_rating,
               COUNT(dr.review_id)      AS review_count
        FROM   doctor_profiles dp
        JOIN   users u              ON u.user_id           = dp.doctor_id
        JOIN   specialties s        ON s.specialty_id      = dp.specialty_id
        LEFT JOIN health_centers hc ON hc.health_center_id = dp.health_center_id
        LEFT JOIN doctor_reviews dr ON dr.doctor_id        = dp.doctor_id
        WHERE  dp.status = 'active'
        GROUP  BY u.user_id, dp.doctor_id, s.specialty_id, hc.health_center_id
        ORDER  BY avg_rating DESC NULLS LAST, dp.experience_years DESC
        LIMIT  6
      `),

      pool.query(`
        SELECT hc.health_center_id, hc.name, hc.address, hc.phone,
               COUNT(dp.doctor_id) AS doctor_count
        FROM   health_centers hc
        LEFT JOIN doctor_profiles dp
               ON dp.health_center_id = hc.health_center_id AND dp.status = 'active'
        GROUP  BY hc.health_center_id
        ORDER  BY doctor_count DESC
        LIMIT  8
      `),

      pool.query(`
        SELECT s.specialty_id, s.specialty_name, s.description,
               COUNT(dp.doctor_id) AS doctor_count
        FROM   specialties s
        LEFT JOIN doctor_profiles dp
               ON dp.specialty_id = s.specialty_id AND dp.status = 'active'
        GROUP  BY s.specialty_id
        ORDER  BY doctor_count DESC
      `),

      pool.query(`
        SELECT dr.review_id, dr.rating, dr.comment, dr.created_at,
               u.name  AS patient_name,
               du.name AS doctor_name,
               s.specialty_name
        FROM   doctor_reviews dr
        JOIN   users u  ON u.user_id  = dr.patient_id
        JOIN   users du ON du.user_id = dr.doctor_id
        JOIN   doctor_profiles dp ON dp.doctor_id   = dr.doctor_id
        JOIN   specialties s      ON s.specialty_id  = dp.specialty_id
        WHERE  dr.comment IS NOT NULL AND dr.rating >= 4
        ORDER  BY dr.created_at DESC
        LIMIT  6
      `),

      pool.query(`
        SELECT
          (SELECT COUNT(*) FROM doctor_profiles WHERE status = 'active')        AS total_doctors,
          (SELECT COUNT(*) FROM health_centers)                                  AS total_hospitals,
          (SELECT COUNT(*) FROM user_roles ur
           JOIN roles r ON r.role_id = ur.role_id WHERE r.role_name = 'patient') AS total_patients,
          (SELECT COUNT(*) FROM appointments WHERE status = 'accepted')          AS total_appointments
      `),
    ]);

    return success(res, {
      stats:            stats.rows[0],
      featured_doctors: featuredDoctors.rows,
      hospitals:        hospitals.rows,
      specialties:      specialties.rows,
      testimonials:     testimonials.rows,
    });
  } catch (err) { next(err); }
}

module.exports = { getHomepageData };