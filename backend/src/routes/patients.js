const router = require('express').Router();
const { getProfile, updateProfile } = require('../controllers/patientController');
const { authenticate, authorise }   = require('../middleware/auth');

router.get('/profile',  authenticate, authorise('patient'), getProfile);
router.put('/profile',  authenticate, authorise('patient'), updateProfile);

module.exports = router;
