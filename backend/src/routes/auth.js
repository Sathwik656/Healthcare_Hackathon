const router = require('express').Router();
const ctrl   = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');

router.post('/register',    ctrl.register);
router.post('/verify-otp',  ctrl.verifyOtp);
router.post('/resend-otp',  ctrl.resendOtp);
router.post('/login',       ctrl.login);
router.post('/logout',      authenticate, ctrl.logout);
router.get('/me',           authenticate, ctrl.me);

module.exports = router;