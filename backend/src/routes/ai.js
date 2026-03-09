const router = require('express').Router();
const { recommend, getRecommendations } = require('../controllers/aiController');
const { authenticate, authorise }       = require('../middleware/auth');

router.post('/recommend',       authenticate, authorise('patient'), recommend);
router.get('/recommendations',  authenticate, authorise('patient'), getRecommendations);

module.exports = router;
