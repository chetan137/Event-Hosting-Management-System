const asyncHandler = require('express-async-handler');
const Event = require('../models/Event');
const Feedback = require('../models/Feedback');
const FeedbackAnalytics = require('../models/FeedbackAnalytics');
const geminiAIService = require('../services/geminiAIService');

/**
 * @desc    Get AI sentiment analysis for an event with statistical fallback
 * @route   GET /api/events/:id/ai-sentiment
 * @access  Public / Private
 */
const getEventAISentiment = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { refresh } = req.query;

  const event = await Event.findById(id);
  if (!event) {
    res.status(404);
    throw new Error('Event not found');
  }

  // Fetch all feedbacks for this event
  const feedbacks = await Feedback.find({ event: id })
    .populate('user', 'fullName email')
    .sort({ submittedAt: -1 });

  const totalReviews = feedbacks.length;

  if (totalReviews === 0) {
    return res.status(200).json({
      eventId: event._id,
      eventName: event.eventName,
      totalReviews: 0,
      averageRating: 0,
      source: 'statistical_fallback',
      isFallback: true,
      sentiment: { positive: 0, neutral: 0, negative: 0 },
      positiveThemes: [],
      criticalIssues: [],
      summary: `No attendee reviews have been submitted yet for ${event.eventName}.`,
      lastUpdated: new Date()
    });
  }

  const avgRating = parseFloat(
    (feedbacks.reduce((sum, f) => sum + (f.rating || 0), 0) / totalReviews).toFixed(1)
  );

  // Check cache in FeedbackAnalytics if not forcing refresh
  if (refresh !== 'true') {
    const cachedAnalytics = await FeedbackAnalytics.findOne({ event: id });
    const isFresh = cachedAnalytics &&
      (Date.now() - new Date(cachedAnalytics.lastAnalyzed).getTime() < 1800000) && // 30 mins
      cachedAnalytics.totalFeedbacks === totalReviews &&
      cachedAnalytics.aiInsights?.positiveHighlights?.length > 0;

    if (isFresh) {
      // Format positiveThemes and criticalIssues from cached records
      const positiveThemes = (cachedAnalytics.aiInsights?.positiveHighlights || []).map(h => ({
        tag: h,
        count: Math.max(1, Math.round((cachedAnalytics.sentimentAnalysis?.positive || 50) / 100 * totalReviews)),
        description: `Highlight from attendee feedback`
      }));

      const criticalIssues = (cachedAnalytics.aiInsights?.commonIssues || []).map(i => ({
        issue: i,
        category: 'General',
        severity: 'medium',
        count: Math.max(1, Math.round((cachedAnalytics.sentimentAnalysis?.negative || 20) / 100 * totalReviews))
      }));

      const posCount = cachedAnalytics.sentimentAnalysis?.positive || 0;
      const neuCount = cachedAnalytics.sentimentAnalysis?.neutral || 0;
      const negCount = cachedAnalytics.sentimentAnalysis?.negative || 0;
      const totalS = posCount + neuCount + negCount;

      const posPct = totalS > 0 ? Math.round((posCount / totalS) * 100) : 50;
      const neuPct = totalS > 0 ? Math.round((neuCount / totalS) * 100) : 30;
      const negPct = totalS > 0 ? Math.max(0, 100 - posPct - neuPct) : 20;

      return res.status(200).json({
        eventId: event._id,
        eventName: event.eventName,
        totalReviews,
        averageRating: cachedAnalytics.averageRating || avgRating,
        source: 'cached',
        isFallback: false,
        sentiment: { positive: posPct, neutral: neuPct, negative: negPct },
        positiveThemes,
        criticalIssues,
        summary: cachedAnalytics.aiInsights?.summary || `Feedback analysis for ${event.eventName}`,
        lastUpdated: cachedAnalytics.lastAnalyzed
      });
    }
  }

  // Run the Team Alpha NLP classification pipeline with 4.5s timeout & statistical fallback
  const result = await geminiAIService.classifyReviewSentiment(feedbacks, event.eventName, 4500);

  // Update or persist to FeedbackAnalytics cache in the background
  try {
    const positiveThemesList = (result.positiveThemes || []).map(t => typeof t === 'string' ? t : t.tag);
    const criticalIssuesList = (result.criticalIssues || []).map(i => typeof i === 'string' ? i : i.issue);

    const posCount = Math.round((result.sentiment.positive / 100) * totalReviews);
    const neuCount = Math.round((result.sentiment.neutral / 100) * totalReviews);
    const negCount = Math.round((result.sentiment.negative / 100) * totalReviews);

    await FeedbackAnalytics.findOneAndUpdate(
      { event: id },
      {
        event: id,
        totalFeedbacks: totalReviews,
        averageRating: avgRating,
        ratingDistribution: {
          5: feedbacks.filter(f => f.rating === 5).length,
          4: feedbacks.filter(f => f.rating === 4).length,
          3: feedbacks.filter(f => f.rating === 3).length,
          2: feedbacks.filter(f => f.rating === 2).length,
          1: feedbacks.filter(f => f.rating === 1).length
        },
        sentimentAnalysis: {
          positive: posCount,
          neutral: neuCount,
          negative: negCount
        },
        aiInsights: {
          summary: result.summary,
          positiveHighlights: positiveThemesList,
          commonIssues: criticalIssuesList,
          recommendations: [
            'Capitalize on positive attendee highlights.',
            'Review critical issues before planning future events.'
          ],
          keyThemes: positiveThemesList
        },
        lastAnalyzed: new Date()
      },
      { upsert: true, new: true }
    );
  } catch (cacheErr) {
    console.warn('[AnalyticsCache] Non-blocking cache update error:', cacheErr.message);
  }

  return res.status(200).json({
    eventId: event._id,
    eventName: event.eventName,
    totalReviews,
    averageRating: avgRating,
    source: result.source,
    isFallback: result.isFallback,
    sentiment: result.sentiment,
    positiveThemes: result.positiveThemes,
    criticalIssues: result.criticalIssues,
    summary: result.summary,
    lastUpdated: result.lastUpdated
  });
});

module.exports = {
  getEventAISentiment
};
