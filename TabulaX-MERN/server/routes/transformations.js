const express = require('express');
const router = express.Router();
const {
  classifyTransformation,
  applyTransformation, 
  
  saveTransformation,
  getUserTransformations,
  getTransformation,
  deleteTransformation,
  executeTransformation,
  downloadJoinedData
} = require('../controllers/transformationController');
const { protect } = require('../middleware/authMiddleware');
const multer = require('multer');

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// All routes in this file will be protected by default by applying middleware here if desired
// router.use(protect); // Or apply protect individually

// Transformation learning and application routes
router.post('/classify', protect, classifyTransformation);

router.get('/download/:filename', protect, downloadJoinedData);

// New route for executing a specific transformation function
router.post('/execute', protect, executeTransformation);

// CRUD operations for saved transformations
router.route('/')
  .post(protect, saveTransformation)
  .get(protect, getUserTransformations);

router.route('/:id')
  .get(protect, getTransformation)
  .delete(protect, deleteTransformation);

// The old '/apply' route might need review based on new '/execute' functionality
// For now, let's assume it might still be used or will be deprecated.
// If it's different from '/execute', it can remain.
// router.post('/apply', protect, applyTransformation); // Example if it's still needed and distinct

module.exports = router;
