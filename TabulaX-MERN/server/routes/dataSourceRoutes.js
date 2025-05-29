const express = require('express');
const router = express.Router();
const dataSourceController = require('../controllers/dataSourceController');
const { protect } = require('../middleware/authMiddleware');

// @route   POST api/data-sources/mongodb/fetch
// @desc    Fetch data from a user-provided MongoDB instance and collection
// @access  Private (requires authentication)
router.post('/mongodb/fetch', protect, dataSourceController.fetchExternalMongoDBData);

// @route   POST api/data-sources/mysql/fetch
// @desc    Fetch data from a user-provided MySQL instance and table
// @access  Private (requires authentication)
router.post('/mysql/fetch', protect, dataSourceController.fetchExternalMySQLData);

module.exports = router;
