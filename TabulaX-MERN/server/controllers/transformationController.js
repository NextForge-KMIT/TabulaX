const fs = require('fs');
const path = require('path');
const axios = require('axios');
const Transformation = require('../models/Transformation');

// Helper function to save uploaded file
const saveFile = (file, filename) => {
  return new Promise((resolve, reject) => {
    const filePath = path.join(__dirname, '../uploads', filename);
    fs.writeFile(filePath, file.buffer, (err) => {
      if (err) return reject(err);
      resolve(filePath);
    });
  });
};

// @desc    Classify transformation
// @route   POST /api/transformations/classify
// @access  Private
exports.classifyTransformation = async (req, res, next) => {
  try {
    const { sourceData, targetData } = req.body;
    if (!sourceData || !targetData || !Array.isArray(sourceData) || !Array.isArray(targetData)) {
      return res.status(400).json({
        success: false,
        message: 'Source and target data must be provided as arrays'
      });
    }
    // Call Flask API
    try {
      const flaskRes = await axios.post('http://localhost:5001/classify', {
        source_data: sourceData,
        target_data: targetData
      });
      const result = flaskRes.data;
      if (result.error) {
        return res.status(500).json({
          success: false,
          message: result.message || 'Error in classification script'
        });
      }
      res.status(200).json({
        success: true,
        transformationType: result.transformation_type,
        transformationCode: result.transformation_code || null
      });
    } catch (flaskErr) {
      console.error('Flask Error:', flaskErr.response ? flaskErr.response.data : flaskErr);
      return res.status(500).json({
        success: false,
        message: 'Error classifying transformation',
        error: flaskErr.toString(),
        flaskError: flaskErr.response ? flaskErr.response.data : undefined
      });
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Apply transformation
// @route   POST /api/transformations/apply
// @access  Private
exports.applyTransformation = async (req, res, next) => {
  try {
    const { transformationType, transformationCode, dataToTransform, columnToTransform } = req.body;
    
    if (!transformationType || !dataToTransform || !columnToTransform) {
      return res.status(400).json({
        success: false,
        message: 'Transformation type, data, and column name must be provided'
      });
    }

    // For non-General transformations, code must be provided
    if (transformationType !== 'General' && !transformationCode) {
      return res.status(400).json({
        success: false,
        message: 'Transformation code must be provided for non-General transformations'
      });
    }

    // Call Flask API
    try {
      const flaskRes = await axios.post('http://localhost:5001/apply', {
        data: dataToTransform,
        column: columnToTransform,
        transformation_type: transformationType,
        code_file_content: transformationType !== 'General' ? transformationCode : undefined
      });
      const result = flaskRes.data;
      if (result.error) {
        return res.status(500).json({
          success: false,
          message: result.message || 'Error in apply script'
        });
      }
      res.status(200).json({
        success: true,
        transformedData: result.transformed_data
      });
    } catch (flaskErr) {
      console.error('Flask Error:', flaskErr.response ? flaskErr.response.data : flaskErr);
      return res.status(500).json({
        success: false,
        message: 'Error applying transformation',
        error: flaskErr.toString(),
        flaskError: flaskErr.response ? flaskErr.response.data : undefined
      });
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Download joined data file
// @route   GET /api/transformations/download/:filename
// @access  Private
exports.downloadJoinedData = async (req, res, next) => {
  try {
    const filename = req.params.filename;
    if (!filename) {
      return res.status(400).json({
        success: false,
        message: 'Filename is required'
      });
    }
    
    // Set the file path
    const filePath = path.join(__dirname, '..', filename);
    
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        message: 'File not found'
      });
    }
    
    // Set headers for file download
    res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
    res.setHeader('Content-Type', 'text/csv');
    
    // Stream the file to the client
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
    
  } catch (error) {
    next(error);
  }
};

// @desc    Save transformation
// @route   POST /api/transformations
// @access  Private
exports.saveTransformation = async (req, res, next) => {
  try {
    const { 
      name, 
      description, 
      transformationType, 
      transformationCode,
      sourceExamples,
      targetExamples
    } = req.body;
    
    // Create transformation
    const transformation = await Transformation.create({
      name,
      description,
      transformationType,
      transformationCode,
      sourceExamples,
      targetExamples,
      user: req.user.id
    });

    res.status(201).json({
      success: true,
      transformation
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get user's transformations
// @route   GET /api/transformations
// @access  Private
exports.getUserTransformations = async (req, res, next) => {
  try {
    console.log('[getUserTransformations] User ID:', req.user && req.user.id);
    const transformations = await Transformation.find({ user: req.user.id });
    console.log('[getUserTransformations] Raw DB result:', transformations);
    const mapped = transformations.map(t => ({
      id: t._id,
      name: t.name,
      transformationType: t.transformationType,
      transformationCode: t.transformationCode,
      createdAt: t.createdAt,
      description: t.description,
      sourceExamples: t.sourceExamples,
      targetExamples: t.targetExamples
    }));
    console.log('[getUserTransformations] Mapped output:', mapped);
    if (!mapped.length) {
      console.warn('[getUserTransformations] No transformations found for user', req.user && req.user.id);
    }
    res.status(200).json({
      success: true,
      count: mapped.length,
      transformations: mapped
    });
  } catch (error) {
    console.error('[getUserTransformations] Error:', error);
    next(error);
  }
};

// @desc    Get transformation by ID
// @route   GET /api/transformations/:id
// @access  Private
exports.getTransformation = async (req, res, next) => {
  try {
    const transformation = await Transformation.findById(req.params.id);
    
    if (!transformation) {
      return res.status(404).json({
        success: false,
        message: 'Transformation not found'
      });
    }

    // Check if user owns the transformation
    if (transformation.user.toString() !== req.user.id) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to access this transformation'
      });
    }

    res.status(200).json({
      success: true,
      transformation
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete transformation
// @route   DELETE /api/transformations/:id
// @access  Private
exports.deleteTransformation = async (req, res, next) => {
  try {
    const transformation = await Transformation.findById(req.params.id);
    
    if (!transformation) {
      return res.status(404).json({
        success: false,
        message: 'Transformation not found'
      });
    }

    // Check if user owns the transformation
    if (transformation.user.toString() !== req.user.id) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to delete this transformation'
      });
    }

    await Transformation.deleteOne({ _id: req.params.id });

    res.status(200).json({
      success: true,
      message: 'Transformation deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Execute a saved transformation function on provided data
// @route   POST /api/transformations/execute
// @access  Private
exports.executeTransformation = async (req, res, next) => {
  try {
    const { tableData, transformationCode, inputColumnName, outputColumnName } = req.body;

    if (!tableData || !transformationCode || !inputColumnName || !outputColumnName) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: tableData, transformationCode, inputColumnName, or outputColumnName'
      });
    }

    if (!Array.isArray(tableData) || tableData.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'tableData must be a non-empty array.'
      });
    }

    try {
      const flaskApiUrl = process.env.FLASK_API_URL || 'http://localhost:5000'; 
      const response = await axios.post(`${flaskApiUrl}/execute-transformation`, {
        table_data: tableData,
        transformation_code: transformationCode,
        input_column_name: inputColumnName,
        output_column_name: outputColumnName,
      });

      if (response.data.success) {
        return res.status(200).json(response.data); 
      } else {
        return res.status(response.status || 400).json({ 
          message: response.data.message || 'Error executing transformation via Flask server',
          details: response.data.details || null
        });
      }
    } catch (error) {
      console.error('Error calling Flask API for execute-transformation:', error.message);
      const err = new Error(error.response?.data?.message || 'Failed to execute transformation via Flask server');
      err.statusCode = error.response?.status || 500;
      err.details = error.response?.data?.details;
      return next(err); 
    }
  } catch (error) {
    if (!error.statusCode) { 
        error.statusCode = 500;
    }
    next(error); 
  }
};
