const pool = require('../config/db');

let _io = null;

/**
 * Inject the Socket.IO instance once at startup.
 */
function init(io) {
  _io = io;
}

/**
 * Create a notification record and push it in real-time.
 *
 * @param {string} userId      - UUID of the recipient
 * @param {string} type        - notification type key
 * @param {string} message     - human-readable message
 * @param {string} socketEvent - the Socket.IO event name to emit
 * @param {object} [extra]     - additional payload for the socket event
 */
async function notify(userId, type, message, socketEvent, extra = {}) {
  // 1 — Persist
  const { rows } = await pool.query(
    `INSERT INTO notifications (user_id, type, message)
     VALUES ($1, $2, $3)
     RETURNING *`,
    [userId, type, message]
  );

  const notification = rows[0];

  // 2 — Emit to the user's personal room
  if (_io) {
    _io.to(`user_${userId}`).emit(socketEvent, {
      notification,
      ...extra,
    });
  }

  return notification;
}

// ── Convenience wrappers for each event type ──────────────────────────────────

async function appointmentCreated(doctorId, appointmentData) {
  return notify(
    doctorId,
    'appointment_created',
    `New appointment request from ${appointmentData.patient_name} on ${appointmentData.appointment_date} at ${appointmentData.appointment_time}.`,
    'new_appointment',
    { appointment: appointmentData }
  );
}

async function appointmentAccepted(patientId, appointmentData) {
  return notify(
    patientId,
    'appointment_accepted',
    `Your appointment with Dr. ${appointmentData.doctor_name} on ${appointmentData.appointment_date} has been accepted.`,
    'appointment_accepted',
    { appointment: appointmentData }
  );
}

async function appointmentDeclined(patientId, appointmentData) {
  return notify(
    patientId,
    'appointment_declined',
    `Your appointment with Dr. ${appointmentData.doctor_name} on ${appointmentData.appointment_date} was declined.`,
    'appointment_declined',
    { appointment: appointmentData }
  );
}

async function appointmentCancelled(doctorId, appointmentData) {
  return notify(
    doctorId,
    'appointment_cancelled',
    `Appointment with ${appointmentData.patient_name} on ${appointmentData.appointment_date} has been cancelled by the patient.`,
    'appointment_cancelled',
    { appointment: appointmentData }
  );
}

async function doctorSuspended(doctorId, doctorName) {
  return notify(
    doctorId,
    'doctor_suspended',
    `Your account has been suspended by an administrator. Please contact support.`,
    'doctor_suspended',
    { doctor_name: doctorName }
  );
}

module.exports = {
  init,
  notify,
  appointmentCreated,
  appointmentAccepted,
  appointmentDeclined,
  appointmentCancelled,
  doctorSuspended,
};
