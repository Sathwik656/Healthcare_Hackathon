const router = require('express').Router();
const { getNotifications, markAsRead, markAllRead } = require('../controllers/notificationController');
const { authenticate } = require('../middleware/auth');

router.get('/',                          authenticate, getNotifications);
router.put('/read-all',                  authenticate, markAllRead);
router.put('/:notification_id/read',     authenticate, markAsRead);

module.exports = router;
