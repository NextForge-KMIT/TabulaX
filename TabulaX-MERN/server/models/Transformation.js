const mongoose = require('mongoose');

const TransformationSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Transformation name is required'],
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  transformationType: {
    type: String,
    enum: ['String-based', 'Numerical', 'Algorithmic', 'General'],
    required: true
  },
  transformationCode: {
    type: String,
    required: function() {
      return this.transformationType !== 'General';
    }
  },
  sourceExamples: {
    type: [String],
    required: true
  },
  targetExamples: {
    type: [String],
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Transformation', TransformationSchema);
