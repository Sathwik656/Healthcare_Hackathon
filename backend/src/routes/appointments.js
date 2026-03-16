const router = require('express').Router();
const ctrl   = require('../controllers/appointmentController');
const { authenticate, authorise } = require('../middleware/auth');

router.post('/',                          authenticate, authorise('patient'), ctrl.createAppointment);
router.patch('/:appointment_id', authenticate, authorise('patient'), ctrl.rescheduleAppointment);
router.get('/patient',                    authenticate, authorise('patient'), ctrl.getPatientAppointments);
router.get('/doctor',                     authenticate, authorise('doctor'),  ctrl.getDoctorAppointments);
router.put('/:appointment_id/cancel',     authenticate, authorise('patient'), ctrl.cancelAppointment);
router.put('/:appointment_id/accept',     authenticate, authorise('doctor'),  ctrl.acceptAppointment);
router.put('/:appointment_id/decline',    authenticate, authorise('doctor'),  ctrl.declineAppointment);
router.put('/:appointment_id/complete',    authenticate, authorise('doctor'),  ctrl.completeAppointment);

module.exports = router;
