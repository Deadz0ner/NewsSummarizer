const mongoose = require('mongoose');

const summarySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  articleUrl: {
    type: String,
    required: true
  },
  title: {
    type: String,
    required: true
  },
  originalContent: {
    type: String,
    required: true
  },
  summary: {
    type: String,
    required: true
  },
  category: String,
  source: String,
  publishedAt: Date,
  summaryLength: {
    type: String,
    enum: ['short', 'medium', 'detailed'],
    default: 'medium'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Summary', summarySchema);
