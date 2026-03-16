const pool               = require('../config/db');
const { success, error } = require('../utils/response');
const notif              = require('../services/notificationService');

// Helper: fetch full appointment with patient & doctor names
async function fetchAppointment(appointmentId) {
  const { rows } = await pool.query(
    `SELECT a.*,
            pu.name AS patient_name,
            du.name AS doctor_name
     FROM   appointments a
     JOIN   users pu ON pu.user_id = a.patient_id
     JOIN   users du ON du.user_id = a.doctor_id
     WHERE  a.appointment_id = $1`,
    [appointmentId]
  );
  return rows[0] || null;
}

// ─── POST /appointments ───────────────────────────────────────────────────────
async function createAppointment(req, res, next) {
  try {
    const patientId = req.user.user_id;
    const { doctor_id, appointment_date, appointment_time, reason, duration_minutes } = req.body;

    if (!doctor_id || !appointment_date || !appointment_time) {
      return error(res, 'doctor_id, appointment_date, and appointment_time are required.', 400);
    }

    // Verify doctor exists and is active
    const docCheck = await pool.query(
      `SELECT doctor_id FROM doctor_profiles WHERE doctor_id = $1 AND status = 'active'`,
      [doctor_id]
    );
    if (!docCheck.rows.length) return error(res, 'Doctor not found or is unavailable.', 404);

    // Verify the slot exists in doctor availability
    const dateObj   = new Date(appointment_date);
    const dayOfWeek = dateObj.getDay();
    const availCheck = await pool.query(
      `SELECT availability_id FROM doctor_availability
       WHERE  doctor_id = $1 AND day_of_week = $2
         AND  start_time <= $3::time AND end_time > $3::time`,
      [doctor_id, dayOfWeek, appointment_time]
    );
    if (!availCheck.rows.length) {
      return error(res, 'Doctor is not available at that time. Please check available slots.', 409);
    }

    // The UNIQUE constraint on (doctor_id, appointment_date, appointment_time)
    // handles double-booking at the DB level — we catch it in the error handler.
    const { rows } = await pool.query(
      `INSERT INTO appointments
         (patient_id, doctor_id, appointment_date, appointment_time, reason, duration_minutes)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [patientId, doctor_id, appointment_date, appointment_time, reason || null, duration_minutes || 30]
    );

    const appointment = await fetchAppointment(rows[0].appointment_id);
    await notif.appointmentCreated(doctor_id, appointment);

    return success(res, { appointment }, 'Appointment request created.', 201);
  } catch (err) {
    // Postgres unique violation = slot already taken
    if (err.code === '23505') {
      return error(res, 'That time slot is already booked. Please choose another.', 409);
    }
    next(err);
  }
}

// ─── GET /appointments/patient ────────────────────────────────────────────────
async function getPatientAppointments(req, res, next) {
  try {
    const { status, page = 1, limit = 20 } = req.query;
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
      WHERE  a.patient_id = $1
    `;
    const params = [req.user.user_id];

    if (status) {
      params.push(status);
      query += ` AND a.status = $${params.length}`;
    }
    query += ` ORDER BY a.appointment_date DESC, a.appointment_time DESC
               LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(parseInt(limit), offset);

    const { rows } = await pool.query(query, params);
    return success(res, { appointments: rows });
  } catch (err) {
    next(err);
  }
}

// ─── GET /appointments/doctor ─────────────────────────────────────────────────
async function getDoctorAppointments(req, res, next) {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let query = `
      SELECT a.*, pu.name AS patient_name, du.name AS doctor_name
      FROM   appointments a
      JOIN   users pu ON pu.user_id = a.patient_id
      JOIN   users du ON du.user_id = a.doctor_id
      WHERE  a.doctor_id = $1
    `;
    const params = [req.user.user_id];

    if (status) {
      params.push(status);
      query += ` AND a.status = $${params.length}`;
    }
    query += ` ORDER BY a.appointment_date ASC, a.appointment_time ASC
               LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(parseInt(limit), offset);

    const { rows } = await pool.query(query, params);
    return success(res, { appointments: rows });
  } catch (err) {
    next(err);
  }
}

// ─── PUT /appointments/:appointment_id/cancel ─────────────────────────────────
async function cancelAppointment(req, res, next) {
  try {
    const { appointment_id } = req.params;
    const patientId = req.user.user_id;

    const existing = await fetchAppointment(appointment_id);
    if (!existing) return error(res, 'Appointment not found.', 404);
    if (existing.patient_id !== patientId) return error(res, 'Not your appointment.', 403);
    if (['cancelled', 'declined'].includes(existing.status)) {
      return error(res, `Appointment is already ${existing.status}.`, 400);
    }

    await pool.query(
      `UPDATE appointments SET status = 'cancelled', updated_at = NOW() WHERE appointment_id = $1`,
      [appointment_id]
    );

    const updated = await fetchAppointment(appointment_id);
    await notif.appointmentCancelled(existing.doctor_id, updated);
    return success(res, { appointment: updated }, 'Appointment cancelled.');
  } catch (err) {
    next(err);
  }
}

// ─── PUT /appointments/:appointment_id/accept ─────────────────────────────────
async function acceptAppointment(req, res, next) {
  try {
    const { appointment_id } = req.params;
    const doctorId = req.user.user_id;

    const existing = await fetchAppointment(appointment_id);
    if (!existing) return error(res, 'Appointment not found.', 404);
    if (existing.doctor_id !== doctorId) return error(res, 'Not your appointment.', 403);
    if (existing.status !== 'pending') return error(res, 'Only pending appointments can be accepted.', 400);

    await pool.query(
      `UPDATE appointments SET status = 'accepted', updated_at = NOW() WHERE appointment_id = $1`,
      [appointment_id]
    );

    const updated = await fetchAppointment(appointment_id);
    await notif.appointmentAccepted(existing.patient_id, updated);
    return success(res, { appointment: updated }, 'Appointment accepted.');
  } catch (err) {
    next(err);
  }
}

// ─── PUT /appointments/:appointment_id/decline ────────────────────────────────
async function declineAppointment(req, res, next) {
  try {
    const { appointment_id } = req.params;
    const doctorId = req.user.user_id;

    const existing = await fetchAppointment(appointment_id);
    if (!existing) return error(res, 'Appointment not found.', 404);
    if (existing.doctor_id !== doctorId) return error(res, 'Not your appointment.', 403);
    if (existing.status !== 'pending') return error(res, 'Only pending appointments can be declined.', 400);

    await pool.query(
      `UPDATE appointments SET status = 'declined', updated_at = NOW() WHERE appointment_id = $1`,
      [appointment_id]
    );

    const updated = await fetchAppointment(appointment_id);
    await notif.appointmentDeclined(existing.patient_id, updated);
    return success(res, { appointment: updated }, 'Appointment declined.');
  } catch (err) {
    next(err);
  }
}

// ─── PATCH /appointments/:appointment_id ──────────────────────────────────────
async function rescheduleAppointment(req, res, next) {
  try {
    const { appointment_id } = req.params;
    const patientId = req.user.user_id;
    const { date, time } = req.body;

    if (!date || !time) {
      return error(res, 'date and time are required.', 400);
    }

    const existing = await fetchAppointment(appointment_id);
    if (!existing) return error(res, 'Appointment not found.', 404);
    if (existing.patient_id !== patientId) return error(res, 'Not your appointment.', 403);
    if (['cancelled', 'declined', 'completed'].includes(existing.status)) {
      return error(res, `Cannot reschedule a ${existing.status} appointment.`, 400);
    }

    // Verify the new slot exists in doctor availability
    const dateObj   = new Date(date);
    const dayOfWeek = dateObj.getDay();
    const availCheck = await pool.query(
      `SELECT availability_id FROM doctor_availability
       WHERE  doctor_id = $1 AND day_of_week = $2
         AND  start_time <= $3::time AND end_time > $3::time`,
      [existing.doctor_id, dayOfWeek, time]
    );
    if (!availCheck.rows.length) {
      return error(res, 'Doctor is not available at that time.', 409);
    }

    await pool.query(
      `UPDATE appointments
       SET appointment_date = $1,
           appointment_time = $2,
           status           = 'pending',
           updated_at       = NOW()
       WHERE appointment_id = $3`,
      [date, time, appointment_id]
    );

    const updated = await fetchAppointment(appointment_id);
    await notif.appointmentCreated(existing.doctor_id, updated);
    return success(res, { appointment: updated }, 'Appointment rescheduled.');
  } catch (err) {
    if (err.code === '23505') {
      return error(res, 'That time slot is already booked. Please choose another.', 409);
    }
    next(err);
  }
}

// ─── PUT /appointments/:appointment_id/complete ───────────────────────────────
async function completeAppointment(req, res, next) {
  try {
    const { appointment_id } = req.params;
    const doctorId = req.user.user_id;

    const existing = await fetchAppointment(appointment_id);
    if (!existing)                          return error(res, 'Appointment not found.', 404);
    if (existing.doctor_id !== doctorId)    return error(res, 'Not your appointment.', 403);
    if (existing.status !== 'accepted')     return error(res, 'Only accepted appointments can be marked as completed.', 400);

    await pool.query(
      `UPDATE appointments SET status = 'completed', updated_at = NOW() WHERE appointment_id = $1`,
      [appointment_id]
    );

    const updated = await fetchAppointment(appointment_id);

    // Notify patient — they can now leave a review
    await notif.notify(
      existing.patient_id,
      'appointment_completed',
      `Your appointment with Dr. ${existing.doctor_name} is complete. Please leave a review!`,
      'appointment_completed',
      { appointment: updated }
    );

    return success(res, { appointment: updated }, 'Appointment marked as completed.');
  } catch (err) {
    next(err);
  }
}

module.exports = {
  createAppointment,
  getPatientAppointments,
  getDoctorAppointments,
  cancelAppointment,
  acceptAppointment,
  declineAppointment,
  rescheduleAppointment,
  completeAppointment
};
