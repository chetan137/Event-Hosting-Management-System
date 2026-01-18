const { GoogleGenerativeAI } = require('@google/generative-ai');

class GeminiAIService {
  constructor() {
    if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'your_gemini_api_key_here') {
      console.warn('⚠️  GEMINI_API_KEY not configured. AI analysis will be disabled.');
      this.enabled = false;
      return;
    }

    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-pro' });
    this.enabled = true;
  }

  /**
   * Analyze feedback comments using Gemini AI
   * @param {Array} feedbacks - Array of feedback objects with rating and comment
   * @param {String} eventName - Name of the event
   * @returns {Object} AI-generated insights
   */
  async analyzeFeedback(feedbacks, eventName) {
    if (!this.enabled) {
      return this.getFallbackAnalysis(feedbacks);
    }

    try {
      // Prepare feedback data for analysis
      const feedbackText = feedbacks
        .filter(f => f.comment && f.comment.trim())
        .map((f, idx) => `[${idx + 1}] Rating: ${f.rating}/5 - Comment: "${f.comment}"`)
        .join('\n');

      if (!feedbackText) {
        return this.getFallbackAnalysis(feedbacks);
      }

      const prompt = `You are an expert event analyst. Analyze the following feedback for the event "${eventName}".

FEEDBACK DATA:
${feedbackText}

Please provide a comprehensive analysis in the following JSON format (respond ONLY with valid JSON, no markdown):
{
  "summary": "A concise 2-3 sentence overall summary of the feedback",
  "positiveHighlights": ["highlight 1", "highlight 2", "highlight 3"],
  "commonIssues": ["issue 1", "issue 2", "issue 3"],
  "recommendations": ["recommendation 1", "recommendation 2", "recommendation 3"],
  "keyThemes": ["theme 1", "theme 2", "theme 3"],
  "sentiment": {
    "positive": <percentage 0-100>,
    "neutral": <percentage 0-100>,
    "negative": <percentage 0-100>
  }
}

Focus on actionable insights. If there are fewer than 3 items for any category, provide what's available.`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      // Parse JSON response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        console.error('Failed to extract JSON from Gemini response');
        return this.getFallbackAnalysis(feedbacks);
      }

      const analysis = JSON.parse(jsonMatch[0]);

      // Validate and normalize sentiment percentages
      if (analysis.sentiment) {
        const total = analysis.sentiment.positive + analysis.sentiment.neutral + analysis.sentiment.negative;
        if (total > 0) {
          analysis.sentiment.positive = Math.round((analysis.sentiment.positive / total) * 100);
          analysis.sentiment.neutral = Math.round((analysis.sentiment.neutral / total) * 100);
          analysis.sentiment.negative = Math.round((analysis.sentiment.negative / total) * 100);
        }
      }

      return {
        summary: analysis.summary || 'Analysis completed successfully.',
        positiveHighlights: analysis.positiveHighlights || [],
        commonIssues: analysis.commonIssues || [],
        recommendations: analysis.recommendations || [],
        keyThemes: analysis.keyThemes || [],
        sentiment: analysis.sentiment || { positive: 50, neutral: 30, negative: 20 }
      };

    } catch (error) {
      console.error('Gemini AI Analysis Error:', error.message);
      return this.getFallbackAnalysis(feedbacks);
    }
  }

  /**
   * Fallback analysis when AI is unavailable
   */
  getFallbackAnalysis(feedbacks) {
    const totalFeedbacks = feedbacks.length;
    const avgRating = totalFeedbacks > 0
      ? feedbacks.reduce((sum, f) => sum + f.rating, 0) / totalFeedbacks
      : 0;

    const positiveCount = feedbacks.filter(f => f.rating >= 4).length;
    const neutralCount = feedbacks.filter(f => f.rating === 3).length;
    const negativeCount = feedbacks.filter(f => f.rating <= 2).length;

    const positivePercentage = totalFeedbacks > 0 ? Math.round((positiveCount / totalFeedbacks) * 100) : 0;
    const neutralPercentage = totalFeedbacks > 0 ? Math.round((neutralCount / totalFeedbacks) * 100) : 0;
    const negativePercentage = totalFeedbacks > 0 ? Math.round((negativeCount / totalFeedbacks) * 100) : 0;

    return {
      summary: `Event received ${totalFeedbacks} feedback submissions with an average rating of ${avgRating.toFixed(1)}/5. ${positivePercentage}% positive, ${neutralPercentage}% neutral, ${negativePercentage}% negative responses.`,
      positiveHighlights: [
        'Attendees appreciated the event organization',
        'Good overall experience reported',
        'Positive engagement from participants'
      ],
      commonIssues: [
        'Some areas for improvement identified',
        'Mixed feedback on certain aspects',
        'Opportunities for enhancement noted'
      ],
      recommendations: [
        'Continue with successful elements',
        'Address feedback points for improvement',
        'Maintain communication with attendees'
      ],
      keyThemes: [
        'Event organization',
        'Attendee experience',
        'Content quality'
      ],
      sentiment: {
        positive: positivePercentage,
        neutral: neutralPercentage,
        negative: negativePercentage
      }
    };
  }

  /**
   * Extract top comments (most helpful positive and negative)
   */
  extractTopComments(feedbacks) {
    const withComments = feedbacks.filter(f => f.comment && f.comment.trim());

    const positive = withComments
      .filter(f => f.rating >= 4)
      .sort((a, b) => b.rating - a.rating || b.comment.length - a.comment.length)
      .slice(0, 5)
      .map(f => ({
        comment: f.comment,
        rating: f.rating,
        user: f.user?.fullName || 'Anonymous'
      }));

    const negative = withComments
      .filter(f => f.rating <= 2)
      .sort((a, b) => a.rating - b.rating || b.comment.length - a.comment.length)
      .slice(0, 5)
      .map(f => ({
        comment: f.comment,
        rating: f.rating,
        user: f.user?.fullName || 'Anonymous'
      }));

    return { positive, negative };
  }
}

module.exports = new GeminiAIService();
