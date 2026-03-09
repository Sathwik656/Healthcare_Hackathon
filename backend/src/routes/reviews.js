const router = require('express').Router();
const { createReview, getDoctorReviews, deleteReview } = require('../controllers/reviewController');
const { authenticate, authorise } = require('../middleware/auth');

router.get('/doctor/:doctor_id',  getDoctorReviews);                              // public
router.post('/',                  authenticate, authorise('patient'), createReview);
router.delete('/:review_id',      authenticate, authorise('patient'), deleteReview);

module.exports = router;
