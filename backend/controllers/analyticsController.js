const asyncHandler = require('express-async-handler');
const Event = require('../models/Event');
const Feedback = require('../models/Feedback');
const FeedbackAnalytics = require('../models/FeedbackAnalytics');
const geminiAIService = require('../services/geminiAIService');

// @desc    Get analytics for a completed event
// @route   GET /api/analytics/event/:eventId
// @access  Private (Admin)
const getEventAnalytics = asyncHandler(async (req, res) => {
  const event = await Event.findById(req.params.eventId);

  if (!event) {
    res.status(404);
    throw new Error('Event not found');
  }

  // Check if event is completed
  const now = new Date();
  const eventEnd = new Date(event.endDateTime);
  const isCompleted = now > eventEnd;

  // Fetch all feedback for this event
  const feedbacks = await Feedback.find({ event: req.params.eventId })
    .populate('user', 'fullName email')
    .sort({ submittedAt: -1 });

  // Calculate basic statistics
  const totalFeedbacks = feedbacks.length;
  const averageRating = totalFeedbacks > 0
    ? (feedbacks.reduce((sum, f) => sum + f.rating, 0) / totalFeedbacks).toFixed(2)
    : 0;

  const ratingDistribution = {
    5: feedbacks.filter(f => f.rating === 5).length,
    4: feedbacks.filter(f => f.rating === 4).length,
    3: feedbacks.filter(f => f.rating === 3).length,
    2: feedbacks.filter(f => f.rating === 2).length,
    1: feedbacks.filter(f => f.rating === 1).length
  };

  // Check if we have cached analytics
  let analytics = await FeedbackAnalytics.findOne({ event: req.params.eventId });

  // If no analytics or data is stale (more than 1 hour old), regenerate
  const shouldRegenerate = !analytics ||
    (Date.now() - new Date(analytics.lastAnalyzed).getTime() > 3600000) ||
    analytics.totalFeedbacks !== totalFeedbacks;

  if (shouldRegenerate && totalFeedbacks > 0) {
    console.log(`[Analytics] Generating AI insights for event: ${event.eventName}`);

    // Get AI insights
    const aiInsights = await geminiAIService.analyzeFeedback(feedbacks, event.eventName);
    const topComments = geminiAIService.extractTopComments(feedbacks);

    // Calculate sentiment counts
    const sentimentCounts = {
      positive: Math.round((aiInsights.sentiment.positive / 100) * totalFeedbacks),
      neutral: Math.round((aiInsights.sentiment.neutral / 100) * totalFeedbacks),
      negative: Math.round((aiInsights.sentiment.negative / 100) * totalFeedbacks)
    };

    // Update or create analytics
    analytics = await FeedbackAnalytics.findOneAndUpdate(
      { event: req.params.eventId },
      {
        event: req.params.eventId,
        totalFeedbacks,
        averageRating: parseFloat(averageRating),
        ratingDistribution,
        sentimentAnalysis: sentimentCounts,
        aiInsights: {
          summary: aiInsights.summary,
          positiveHighlights: aiInsights.positiveHighlights,
          commonIssues: aiInsights.commonIssues,
          recommendations: aiInsights.recommendations,
          keyThemes: aiInsights.keyThemes
        },
        topComments,
        lastAnalyzed: new Date()
      },
      { upsert: true, new: true }
    );
  }

  res.json({
    event: {
      id: event._id,
      name: event.eventName,
      startDate: event.startDateTime,
      endDate: event.endDateTime,
      isCompleted
    },
    statistics: {
      totalFeedbacks,
      averageRating: parseFloat(averageRating),
      ratingDistribution
    },
    analytics: analytics || {
      sentimentAnalysis: { positive: 0, neutral: 0, negative: 0 },
      aiInsights: {
        summary: 'No feedback data available yet.',
        positiveHighlights: [],
        commonIssues: [],
        recommendations: [],
        keyThemes: []
      },
      topComments: { positive: [], negative: [] }
    },
    feedbacks: feedbacks.map(f => ({
      id: f._id,
      user: f.user?.fullName || 'Anonymous',
      rating: f.rating,
      comment: f.comment,
      submittedAt: f.submittedAt
    })),
    lastAnalyzed: analytics?.lastAnalyzed || null
  });
});

// @desc    Get list of all completed events with analytics summary
// @route   GET /api/analytics/completed-events
// @access  Private (Admin)
const getCompletedEvents = asyncHandler(async (req, res) => {
  const now = new Date();

  // Find all completed events
  const completedEvents = await Event.find({
    endDateTime: { $lt: now }
  }).sort({ endDateTime: -1 });

  // Get analytics summary for each
  const eventsWithAnalytics = await Promise.all(
    completedEvents.map(async (event) => {
      const feedbackCount = await Feedback.countDocuments({ event: event._id });
      const analytics = await FeedbackAnalytics.findOne({ event: event._id });

      return {
        id: event._id,
        name: event.eventName,
        startDate: event.startDateTime,
        endDate: event.endDateTime,
        feedbackCount,
        averageRating: analytics?.averageRating || 0,
        hasAnalytics: !!analytics,
        lastAnalyzed: analytics?.lastAnalyzed || null
      };
    })
  );

  res.json({
    total: eventsWithAnalytics.length,
    events: eventsWithAnalytics
  });
});

// @desc    Regenerate analytics for an event
// @route   POST /api/analytics/event/:eventId/regenerate
// @access  Private (Admin)
const regenerateAnalytics = asyncHandler(async (req, res) => {
  const event = await Event.findById(req.params.eventId);

  if (!event) {
    res.status(404);
    throw new Error('Event not found');
  }

  const feedbacks = await Feedback.find({ event: req.params.eventId })
    .populate('user', 'fullName email');

  if (feedbacks.length === 0) {
    res.status(400);
    throw new Error('No feedback available to analyze');
  }

  console.log(`[Analytics] Regenerating insights for: ${event.eventName}`);

  // Force regenerate AI insights
  const aiInsights = await geminiAIService.analyzeFeedback(feedbacks, event.eventName);
  const topComments = geminiAIService.extractTopComments(feedbacks);

  const totalFeedbacks = feedbacks.length;
  const averageRating = feedbacks.reduce((sum, f) => sum + f.rating, 0) / totalFeedbacks;

  const ratingDistribution = {
    5: feedbacks.filter(f => f.rating === 5).length,
    4: feedbacks.filter(f => f.rating === 4).length,
    3: feedbacks.filter(f => f.rating === 3).length,
    2: feedbacks.filter(f => f.rating === 2).length,
    1: feedbacks.filter(f => f.rating === 1).length
  };

  const sentimentCounts = {
    positive: Math.round((aiInsights.sentiment.positive / 100) * totalFeedbacks),
    neutral: Math.round((aiInsights.sentiment.neutral / 100) * totalFeedbacks),
    negative: Math.round((aiInsights.sentiment.negative / 100) * totalFeedbacks)
  };

  const analytics = await FeedbackAnalytics.findOneAndUpdate(
    { event: req.params.eventId },
    {
      event: req.params.eventId,
      totalFeedbacks,
      averageRating,
      ratingDistribution,
      sentimentAnalysis: sentimentCounts,
      aiInsights: {
        summary: aiInsights.summary,
        positiveHighlights: aiInsights.positiveHighlights,
        commonIssues: aiInsights.commonIssues,
        recommendations: aiInsights.recommendations,
        keyThemes: aiInsights.keyThemes
      },
      topComments,
      lastAnalyzed: new Date()
    },
    { upsert: true, new: true }
  );

  res.json({
    message: 'Analytics regenerated successfully',
    analytics
  });
});

module.exports = {
  getEventAnalytics,
  getCompletedEvents,
  regenerateAnalytics
};
