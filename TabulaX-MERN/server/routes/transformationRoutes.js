const express = require('express');
const router = express.Router();
const { executeTransformation } = require('../controllers/transformationController');

// @route   POST /api/transformations/execute
// @desc    Execute a saved transformation function on provided data
// @access  Private (assuming your controller handles auth, if not, add middleware here)
router.post('/execute', executeTransformation);

// You can add other routes from your transformationController here as needed
// For example:
// const { classifyTransformation, applyTransformation, ... } = require('../controllers/transformationController');
// router.post('/classify', classifyTransformation);
// router.post('/apply', applyTransformation);
// router.get('/', getUserTransformations);
// router.post('/', saveTransformation);
// router.get('/:id', getTransformation);
// router.delete('/:id', deleteTransformation);
// router.post('/fuzzy-join', performFuzzyJoin);

module.exports = router;
