const router = require('express').Router();
const { getHomepageData } = require('../controllers/homePageController');

router.get('/', getHomepageData);

module.exports = router;