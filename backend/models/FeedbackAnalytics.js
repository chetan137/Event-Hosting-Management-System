const mongoose = require('mongoose');

const feedbackAnalyticsSchema = new mongoose.Schema({
  event: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: true,
    unique: true
  },
  totalFeedbacks: {
    type: Number,
    default: 0
  },
  averageRating: {
    type: Number,
    default: 0
  },
  ratingDistribution: {
    5: { type: Number, default: 0 },
    4: { type: Number, default: 0 },
    3: { type: Number, default: 0 },
    2: { type: Number, default: 0 },
    1: { type: Number, default: 0 }
  },
  sentimentAnalysis: {
    positive: { type: Number, default: 0 },
    neutral: { type: Number, default: 0 },
    negative: { type: Number, default: 0 }
  },
  aiInsights: {
    summary: {
      type: String,
      default: ''
    },
    positiveHighlights: [{
      type: String
    }],
    commonIssues: [{
      type: String
    }],
    recommendations: [{
      type: String
    }],
    keyThemes: [{
      type: String
    }]
  },
  topComments: {
    positive: [{
      comment: String,
      rating: Number,
      user: String
    }],
    negative: [{
      comment: String,
      rating: Number,
      user: String
    }]
  },
  lastAnalyzed: {
    type: Date,
    default: Date.now
  },
  analysisVersion: {
    type: String,
    default: '1.0'
  }
}, {
  timestamps: true
});

// Index for faster queries
feedbackAnalyticsSchema.index({ event: 1 });
feedbackAnalyticsSchema.index({ lastAnalyzed: -1 });

module.exports = mongoose.model('FeedbackAnalytics', feedbackAnalyticsSchema);
