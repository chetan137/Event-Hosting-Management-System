const { GoogleGenerativeAI } = require('@google/generative-ai');

class GeminiAIService {
  constructor() {
    this.apiKey = process.env.GEMINI_API_KEY;
    if (!this.apiKey || this.apiKey === 'your_gemini_api_key_here' || this.apiKey === 'your_actual_gemini_api_key_here') {
      console.warn('[GeminiAI] ⚠️ GEMINI_API_KEY not configured or placeholder detected. Statistical fallback will be used.');
      this.enabled = false;
      return;
    }

    try {
      this.genAI = new GoogleGenerativeAI(this.apiKey);
      const modelName = process.env.GEMINI_MODEL || 'gemini-1.5-flash';
      this.model = this.genAI.getGenerativeModel({ model: modelName });
      this.enabled = true;
      console.log(`[GeminiAI] Initialized successfully with model: ${modelName}`);
    } catch (err) {
      console.warn('[GeminiAI] Initialization error:', err.message);
      this.enabled = false;
    }
  }

  /**
   * Team Alpha AI: NLP prompt pipeline classifying attendee reviews into positive themes & critical issues
   * with strict timeout protection and statistical fallback.
   *
   * @param {Array} feedbacks - Array of feedback objects with rating and comment
   * @param {String} eventName - Name of the event
   * @param {Number} timeoutMs - Timeout budget in milliseconds (default: 4500ms)
   * @returns {Promise<Object>} Analysis containing sentiment distribution, positive themes, and critical issues
   */
  async classifyReviewSentiment(feedbacks = [], eventName = 'Event', timeoutMs = 4500) {
    // If no feedback or AI is disabled, immediately use statistical fallback
    if (!feedbacks || feedbacks.length === 0 || !this.enabled) {
      return this.getStatisticalFallback(feedbacks, eventName, !this.enabled ? 'AI disabled or API key missing' : 'No feedbacks available');
    }

    // Filter feedbacks with comments
    const withComments = feedbacks.filter(f => f.comment && f.comment.trim());
    if (withComments.length === 0) {
      return this.getStatisticalFallback(feedbacks, eventName, 'No textual comments provided in feedback');
    }

    // Create timeout promise
    let timeoutHandle;
    const timeoutPromise = new Promise((_, reject) => {
      timeoutHandle = setTimeout(() => {
        reject(new Error(`AI model request timed out after ${timeoutMs}ms`));
      }, timeoutMs);
    });

    // Execute LLM classification with race against timeout
    try {
      const aiExecutionPromise = this._runGeminiClassification(withComments, eventName, feedbacks.length);
      const result = await Promise.race([aiExecutionPromise, timeoutPromise]);
      clearTimeout(timeoutHandle);
      return result;
    } catch (error) {
      clearTimeout(timeoutHandle);
      console.warn(`[GeminiAI] NLP Classification failed (${error.message}). Activating Statistical Fallback.`);
      return this.getStatisticalFallback(feedbacks, eventName, error.message);
    }
  }

  /**
   * Internal Gemini classification prompt execution
   */
  async _runGeminiClassification(withComments, eventName, totalReviewsCount) {
    const feedbackText = withComments
      .slice(0, 30) // cap to reasonable prompt context
      .map((f, idx) => `[Review #${idx + 1}] Rating: ${f.rating}/5 | Comment: "${f.comment.trim()}"`)
      .join('\n');

    const prompt = `You are an expert NLP event intelligence analyst.
Analyze these post-event attendee reviews for the event "${eventName}".

CRITICAL INSTRUCTIONS:
1. Classify attendee reviews into:
   - "positiveThemes": Distinct tags/themes attendees appreciated with estimated frequency/count and sample quote.
   - "criticalIssues": Specific problems or bottlenecks reported, categorized with severity ("high", "medium", or "low").
   - "sentiment": Percentage breakdown of positive, neutral, and negative sentiment (must sum to 100).
   - "summary": 2-3 sentence executive recap of attendee sentiment.
2. Return ONLY a single raw JSON object with NO MARKDOWN formatting, NO backticks, and NO extra commentary.

Format:
{
  "summary": "...",
  "sentiment": {
    "positive": 70,
    "neutral": 20,
    "negative": 10
  },
  "positiveThemes": [
    { "tag": "Inspiring Speakers", "count": 12, "description": "High engagement during keynote presentations" }
  ],
  "criticalIssues": [
    { "issue": "Audio echo in auditorium", "severity": "high", "category": "Audio/AV", "count": 5 }
  ]
}

REVIEWS:
${feedbackText}`;

    const response = await this.model.generateContent(prompt);
    const responseText = await response.response.text();

    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Could not parse valid JSON from AI response');
    }

    const parsed = JSON.parse(jsonMatch[0]);

    // Normalize sentiment percentages
    let pos = Math.max(0, Number(parsed.sentiment?.positive) || 0);
    let neu = Math.max(0, Number(parsed.sentiment?.neutral) || 0);
    let neg = Math.max(0, Number(parsed.sentiment?.negative) || 0);
    const sum = pos + neu + neg;
    if (sum > 0) {
      pos = Math.round((pos / sum) * 100);
      neu = Math.round((neu / sum) * 100);
      neg = Math.max(0, 100 - pos - neu);
    } else {
      pos = 70; neu = 20; neg = 10;
    }

    return {
      source: 'ai',
      isFallback: false,
      totalReviews: totalReviewsCount,
      sentiment: { positive: pos, neutral: neu, negative: neg },
      summary: parsed.summary || `Attendees shared feedback across ${totalReviewsCount} submissions.`,
      positiveThemes: Array.isArray(parsed.positiveThemes) ? parsed.positiveThemes : [],
      criticalIssues: Array.isArray(parsed.criticalIssues) ? parsed.criticalIssues : [],
      lastUpdated: new Date()
    };
  }

  /**
   * Statistical Fallback when AI times out, errors, or is disabled.
   * Derives sentiment metrics and heuristic tags directly from ratings and keyword detection.
   */
  getStatisticalFallback(feedbacks = [], eventName = 'Event', reason = 'Statistical calculation') {
    const total = feedbacks.length;
    if (total === 0) {
      return {
        source: 'statistical_fallback',
        isFallback: true,
        reason: 'No feedback submitted yet',
        totalReviews: 0,
        sentiment: { positive: 0, neutral: 0, negative: 0 },
        summary: `No attendee feedback has been submitted yet for ${eventName}.`,
        positiveThemes: [],
        criticalIssues: [],
        lastUpdated: new Date()
      };
    }

    // Rating breakdown
    const positiveCount = feedbacks.filter(f => f.rating >= 4).length;
    const neutralCount = feedbacks.filter(f => f.rating === 3).length;
    const negativeCount = feedbacks.filter(f => f.rating <= 2).length;

    const positive = Math.round((positiveCount / total) * 100);
    const neutral = Math.round((neutralCount / total) * 100);
    const negative = Math.max(0, 100 - positive - neutral);

    const avgRating = (feedbacks.reduce((sum, f) => sum + (f.rating || 0), 0) / total).toFixed(1);

    // Heuristic keyword scanning on reviews
    const comments = feedbacks
      .map(f => ({ text: (f.comment || '').toLowerCase(), rating: f.rating }))
      .filter(c => c.text.length > 2);

    // Common positive patterns
    const positivePatterns = [
      { tag: 'High Content Quality', regex: /speaker|session|content|topic|knowledge|presentation|insight|learned/i },
      { tag: 'Seamless Organization', regex: /smooth|organized|schedule|time|manage|flow|checkin|entry|staff/i },
      { tag: 'Great Networking', regex: /network|connect|people|peers|community|interact/i },
      { tag: 'Engaging Atmosphere', regex: /vibe|energy|fun|ambience|venue|location|hospitality|food|refreshment/i },
      { tag: 'Overall Excellence', regex: /great|awesome|excellent|amazing|loved|fantastic|good job/i }
    ];

    const positiveThemes = [];
    positivePatterns.forEach(pattern => {
      const matches = comments.filter(c => c.rating >= 4 && pattern.regex.test(c.text));
      if (matches.length > 0) {
        positiveThemes.push({
          tag: pattern.tag,
          count: matches.length,
          description: `Identified from ${matches.length} attendee comments with 4-5 star ratings.`
        });
      }
    });

    if (positiveThemes.length === 0 && positiveCount > 0) {
      positiveThemes.push({
        tag: 'Positive Attendee Satisfaction',
        count: positiveCount,
        description: `${positiveCount} attendees rated the event 4 or 5 stars.`
      });
    }

    // Common issue patterns
    const issuePatterns = [
      { issue: 'Audio / Visual Glitches', category: 'AV/Tech', severity: 'high', regex: /audio|sound|mic|echo|hear|screen|projector|display|video|lag/i },
      { issue: 'Internet / Wi-Fi Connectivity', category: 'Infrastructure', severity: 'high', regex: /wifi|wi-fi|internet|network|connection|slow/i },
      { issue: 'Venue Capacity & Crowding', category: 'Venue', severity: 'medium', regex: /crowd|seat|space|hall|room|chair|packed|standing/i },
      { issue: 'Climate & Temperature', category: 'Venue', severity: 'medium', regex: /ac|air condition|cold|hot|heat|warm|ventilation/i },
      { issue: 'Registration / Queue Delay', category: 'Logistics', severity: 'medium', regex: /delay|late|queue|line|wait|slow entry|check-in/i },
      { issue: 'Catering / Refreshments Shortage', category: 'Hospitality', severity: 'low', regex: /food|snack|drink|water|coffee|lunch|tea/i }
    ];

    const criticalIssues = [];
    issuePatterns.forEach(pattern => {
      const matches = comments.filter(c => c.rating <= 3 && pattern.regex.test(c.text));
      if (matches.length > 0) {
        const hasLowRatings = matches.some(m => m.rating <= 2);
        criticalIssues.push({
          issue: pattern.issue,
          category: pattern.category,
          severity: hasLowRatings ? pattern.severity : 'low',
          count: matches.length
        });
      }
    });

    if (criticalIssues.length === 0 && negativeCount > 0) {
      criticalIssues.push({
        issue: 'General Attendee Dissatisfaction',
        category: 'General',
        severity: 'medium',
        count: negativeCount
      });
    }

    return {
      source: 'statistical_fallback',
      isFallback: true,
      reason,
      totalReviews: total,
      averageRating: parseFloat(avgRating),
      sentiment: { positive, neutral, negative },
      summary: `Statistical breakdown based on ${total} reviews (Avg: ${avgRating}/5). ${positive}% positive, ${neutral}% neutral, ${negative}% negative.`,
      positiveThemes,
      criticalIssues,
      lastUpdated: new Date()
    };
  }

  // Preserve backwards compatibility with existing analyzeFeedback callers
  async analyzeFeedback(feedbacks, eventName) {
    const classified = await this.classifyReviewSentiment(feedbacks, eventName, 4500);
    return {
      summary: classified.summary,
      positiveHighlights: classified.positiveThemes.map(t => typeof t === 'string' ? t : t.tag),
      commonIssues: classified.criticalIssues.map(i => typeof i === 'string' ? i : i.issue),
      recommendations: [
        'Review critical issues flagged by attendees before the next edition.',
        'Sustain and amplify the recognized positive highlights.'
      ],
      keyThemes: classified.positiveThemes.map(t => typeof t === 'string' ? t : t.tag),
      sentiment: classified.sentiment
    };
  }

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
