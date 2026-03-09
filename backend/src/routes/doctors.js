const router = require('express').Router();
const ctrl   = require('../controllers/doctorController');
const { authenticate, authorise } = require('../middleware/auth');

// Public routes
router.get('/', ctrl.getAllDoctors);

router.get('/:doctor_id/availability', ctrl.getDoctorAvailability);
router.get('/:doctor_id/slots', ctrl.getDoctorSlots);

router.get('/:doctor_id', ctrl.getDoctorById);

// Doctor-only routes
router.put('/profile', authenticate, authorise('doctor'), ctrl.updateDoctorProfile);
router.post('/availability', authenticate, authorise('doctor'), ctrl.setAvailability);

module.exports = router;