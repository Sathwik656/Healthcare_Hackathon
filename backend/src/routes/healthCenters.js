const router = require('express').Router();
const { getAllHealthCenters, getHealthCenterById } = require('../controllers/healthCenterController');

router.get('/',                      getAllHealthCenters);    // public
router.get('/:health_center_id',     getHealthCenterById);   // public

module.exports = router;
