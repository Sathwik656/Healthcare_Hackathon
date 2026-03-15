const router = require('express').Router();
const ctrl   = require('../controllers/adminController');
const { authenticate, authorise } = require('../middleware/auth');

const adminOnly = [authenticate, authorise('admin')];

// Doctors
router.get('/doctors',                          ...adminOnly, ctrl.getAllDoctors);
router.post('/doctors',                         ...adminOnly, ctrl.createDoctor);
router.put('/doctors/:doctor_id/suspend',       ...adminOnly, ctrl.suspendDoctor);
router.put('/doctors/:doctor_id/activate',      ...adminOnly, ctrl.activateDoctor);

// Appointments
router.get('/appointments',                     ...adminOnly, ctrl.getAllAppointments);
router.put('/appointments/:appointment_id',     ...adminOnly, ctrl.updateAppointment);

// Health Centers
router.get('/health-centers',                              ...adminOnly, ctrl.getAllHealthCenters);
router.post('/health-centers',                             ...adminOnly, ctrl.createHealthCenter);
router.put('/health-centers/:health_center_id',            ...adminOnly, ctrl.updateHealthCenter);
router.delete('/health-centers/:health_center_id',         ...adminOnly, ctrl.deleteHealthCenter);

// Dashboard
router.get('/dashboard', ...adminOnly, ctrl.getDashboardStats);

module.exports = router;
