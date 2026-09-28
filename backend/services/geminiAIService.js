const { GoogleGenerativeAI } = require('@google/generative-ai');

class GeminiAIService {
  constructor() {
    const key = process.env.GEMINI_API_KEY;
    if (!key || key.toLowerCase() === 'your_api_key_here' || key.trim() === '') {
      console.warn('⚠️  GEMINI_API_KEY not configured. AI analysis will use intelligent contextual fallbacks.');
      this.enabled = false;
      return;
    }

    try {
      this.genAI = new GoogleGenerativeAI(key);
      // Support gemini-1.5-flash with fallback to gemini-pro
      try {
        this.model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
      } catch (e) {
        this.model = this.genAI.getGenerativeModel({ model: 'gemini-pro' });
      }
      this.enabled = true;
    } catch (err) {
      console.warn('⚠️  Failed to initialize Gemini AI model:', err.message);
      this.enabled = false;
    }
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

  /**
   * Generate a rich 2-paragraph narrative for an attendee's public showcase
   * @param {Object} params
   * @param {string} params.attendeeName - Full name of the attendee
   * @param {string} params.eventName - Name of the event
   * @param {string} [params.eventDescription] - Brief summary of event
   * @param {string} [params.eventTheme] - Visual or organizational theme
   * @param {string} [params.location] - Location / format (e.g. Virtual, In-person)
   * @param {string} [params.tone] - 'inspirational' | 'technical' | 'executive' | 'creative'
   * @param {string} [params.feedback] - Attendee's own reflection or takeaway
   * @param {Array<string>} [params.skills] - Specific skills or achievements
   * @returns {Promise<string>} 2-paragraph personalized showcase narrative
   */
  async generateShowcaseNarrative({
    attendeeName,
    eventName,
    eventDescription = '',
    eventTheme = 'minimal',
    location = 'Online / Offline',
    tone = 'inspirational',
    feedback = '',
    skills = []
  }) {
    if (!this.enabled) {
      return this.getFallbackShowcaseNarrative({ attendeeName, eventName, eventDescription, tone });
    }

    try {
      const prompt = `You are an AI biographer crafting an official event showcase narrative for a distinguished participant.
Write an engaging, authentic 2-paragraph narrative highlighting ${attendeeName}'s journey, engagement, and takeaways from the event.

DETAILS:
- Attendee: ${attendeeName}
- Event Name: ${eventName}
- Description: ${eventDescription}
- Theme: ${eventTheme}
- Location: ${location}
- Tone: ${tone}
${feedback ? `- Attendee's Personal Reflection: "${feedback}"` : ''}
${skills && skills.length > 0 ? `- Demonstrated Focus Areas: ${skills.join(', ')}` : ''}

GUIDELINES:
- Paragraph 1: Set the stage of the event and describe ${attendeeName}'s active participation, mindset, and exploration.
- Paragraph 2: Emphasize their mastery, peer collaboration, key milestone accomplished, and future momentum.
- Respond with ONLY the 2-paragraph text (no markdown formatting, no JSON, no conversational filler).`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text().trim();

      if (!text || text.length < 50) {
        return this.getFallbackShowcaseNarrative({ attendeeName, eventName, eventDescription, tone });
      }

      return text;
    } catch (error) {
      console.warn('⚠️ Gemini AI narrative generation failed, using intelligent fallback:', error.message);
      return this.getFallbackShowcaseNarrative({ attendeeName, eventName, eventDescription, tone });
    }
  }

  /**
   * Generate a custom attendee accomplishment quote
   * @param {Object} params
   * @param {string} params.attendeeName - Full name of the attendee
   * @param {string} params.eventName - Name of the event
   * @param {string} [params.tone] - 'inspirational' | 'technical' | 'executive' | 'creative'
   * @param {string} [params.role] - Attendee role or focus
   * @param {string} [params.feedback] - Attendee's takeaway
   * @param {Array<string>} [params.skills] - Acquired skills
   * @returns {Promise<string>} 1-2 sentence punchy accomplishment quote
   */
  async generateAccomplishmentQuote({
    attendeeName,
    eventName,
    tone = 'inspirational',
    role = 'Participant',
    feedback = '',
    skills = []
  }) {
    if (!this.enabled) {
      return this.getFallbackAccomplishmentQuote({ attendeeName, eventName, tone, role });
    }

    try {
      const prompt = `You are an AI accomplishment quote writer for verified event credentials and certificates.
Write a powerful, memorable 1-2 sentence accomplishment quote celebrating ${attendeeName}'s achievement at "${eventName}".

CRITERIA:
- Participant: ${attendeeName}
- Event: ${eventName}
- Desired Tone: ${tone} (options: inspirational, technical, executive, creative)
${role ? `- Role: ${role}` : ''}
${feedback ? `- Reflection: "${feedback}"` : ''}
${skills && skills.length > 0 ? `- Core competencies: ${skills.join(', ')}` : ''}

RULES:
- Must be punchy, inspiring, and dignified.
- Return ONLY the quote wrapped in double quotes. Do not include markdown or explanation.`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text().trim();

      if (!text) {
        return this.getFallbackAccomplishmentQuote({ attendeeName, eventName, tone, role });
      }

      return text;
    } catch (error) {
      console.warn('⚠️ Gemini AI quote generation failed, using intelligent fallback:', error.message);
      return this.getFallbackAccomplishmentQuote({ attendeeName, eventName, tone, role });
    }
  }

  /**
   * Generate complete showcase package: narrative, quote, and verified skill badges
   * @param {Object} params
   * @returns {Promise<{accomplishmentQuote: string, showcaseNarrative: string, skills: string[], tone: string}>}
   */
  async generateShowcaseHighlights({
    attendeeName,
    eventName,
    eventDescription = '',
    eventTheme = 'minimal',
    location = 'Online / Offline',
    tone = 'inspirational',
    feedback = '',
    skills = []
  }) {
    if (!this.enabled) {
      return {
        accomplishmentQuote: this.getFallbackAccomplishmentQuote({ attendeeName, eventName, tone }),
        showcaseNarrative: this.getFallbackShowcaseNarrative({ attendeeName, eventName, eventDescription, tone }),
        skills: skills && skills.length > 0 ? skills : this.extractDefaultSkills(eventName, eventDescription),
        tone
      };
    }

    try {
      const prompt = `You are an AI biographer for verified event credentialing and public showcase highlights.
Analyze the following participant and event details and generate:
1. An accomplishment quote (1-2 punchy sentences)
2. A showcase narrative (2 paragraphs describing their journey and impact)
3. 3 to 5 verified skill/competency tags

INPUT:
- Attendee: ${attendeeName}
- Event: ${eventName}
- Description: ${eventDescription}
- Theme: ${eventTheme}
- Format: ${location}
- Tone: ${tone}
${feedback ? `- Feedback: "${feedback}"` : ''}
${skills && skills.length > 0 ? `- Given Skills: ${skills.join(', ')}` : ''}

OUTPUT FORMAT:
Respond with ONLY valid JSON (no markdown formatting, no code fences):
{
  "accomplishmentQuote": "...",
  "showcaseNarrative": "...",
  "skills": ["Skill 1", "Skill 2", "Skill 3", "Skill 4"],
  "tone": "${tone}"
}`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }

      const parsed = JSON.parse(jsonMatch[0]);

      return {
        accomplishmentQuote: parsed.accomplishmentQuote || this.getFallbackAccomplishmentQuote({ attendeeName, eventName, tone }),
        showcaseNarrative: parsed.showcaseNarrative || this.getFallbackShowcaseNarrative({ attendeeName, eventName, eventDescription, tone }),
        skills: Array.isArray(parsed.skills) && parsed.skills.length > 0
          ? parsed.skills
          : this.extractDefaultSkills(eventName, eventDescription),
        tone: parsed.tone || tone
      };
    } catch (err) {
      console.warn('⚠️ Gemini highlights batch generation failed, falling back to individual generators:', err.message);
      const [quote, narrative] = await Promise.all([
        this.generateAccomplishmentQuote({ attendeeName, eventName, tone, feedback, skills }),
        this.generateShowcaseNarrative({ attendeeName, eventName, eventDescription, eventTheme, location, tone, feedback, skills })
      ]);

      return {
        accomplishmentQuote: quote,
        showcaseNarrative: narrative,
        skills: skills && skills.length > 0 ? skills : this.extractDefaultSkills(eventName, eventDescription),
        tone
      };
    }
  }

  /**
   * Fallback narrative generator when Gemini API is unavailable or rate limited
   */
  getFallbackShowcaseNarrative({ attendeeName, eventName, eventDescription = '', tone = 'inspirational' }) {
    const focusContext = eventDescription
      ? `dedicated to ${eventDescription.slice(0, 110).trim()}...`
      : 'fostering collaboration, technical excellence, and rapid innovation.';

    const toneAdjectives = {
      inspirational: 'boundless curiosity and inspiring teamwork',
      technical: 'algorithmic rigor, analytical precision, and robust problem-solving',
      executive: 'strategic foresight, decisive execution, and high-impact delivery',
      creative: 'inventive imagination, human-centered empathy, and bold design'
    };

    const adj = toneAdjectives[tone] || toneAdjectives.inspirational;

    return `At ${eventName}, ${attendeeName} distinguished themselves as an active participant in an intensive environment ${focusContext} Throughout the sessions, ${attendeeName} demonstrated ${adj}, engaging deeply with cutting-edge concepts, contributing valuable perspective to group challenges, and driving collaborative momentum.

By completing this milestone at ${eventName}, ${attendeeName} demonstrated exceptional adaptability and commitment to personal mastery. This showcase honor recognizes their enduring drive to bridge vision with tangible accomplishment, inspiring peers and shaping the future of the community.`;
  }

  /**
   * Fallback accomplishment quote generator when Gemini API is unavailable
   */
  getFallbackAccomplishmentQuote({ attendeeName, eventName, tone = 'inspirational', role = 'Participant' }) {
    const quotes = {
      inspirational: [
        `"Demonstrated visionary curiosity, boundless passion, and collaborative excellence at ${eventName}, setting a benchmark for future innovators."`,
        `"Pioneered impactful solutions and empowered fellow participants with bold ideas and unwavering dedication during ${eventName}."`,
        `"Embraced complex challenges with resilience, transforming ambitious vision into reality at ${eventName}."`
      ],
      technical: [
        `"Engineered robust solutions, mastered advanced methodologies, and pushed the frontier of technical execution at ${eventName}."`,
        `"Distinguished by exceptional analytical rigor, high-velocity development, and relentless dedication to software craftsmanship at ${eventName}."`,
        `"Turned abstract technical challenges into high-performance deliverables through algorithmic precision at ${eventName}."`
      ],
      executive: [
        `"Exemplified strategic foresight, cross-functional leadership, and decisive problem resolution throughout ${eventName}."`,
        `"Spearheaded collaborative innovation and demonstrated outstanding delivery capabilities under high-stakes timelines at ${eventName}."`,
        `"Bridged visionary objectives with tangible execution, leaving an indelible footprint of professional excellence at ${eventName}."`
      ],
      creative: [
        `"Transformed bold concepts into captivating user experiences with artistic ingenuity and distinctive storytelling at ${eventName}."`,
        `"Broke conventional boundaries to craft immersive, human-centered solutions that resonated across ${eventName}."`,
        `"Infused vivid imagination and aesthetic sophistication into every deliverable at ${eventName}."`
      ]
    };

    const pool = quotes[tone] || quotes.inspirational;
    const index = Math.floor(Math.random() * pool.length);
    return pool[index];
  }

  /**
   * Helper to derive relevant competency tags from event context
   */
  extractDefaultSkills(eventName = '', eventDescription = '') {
    const text = `${eventName} ${eventDescription}`.toLowerCase();
    const skills = new Set();

    if (text.includes('devops') || text.includes('cloud') || text.includes('docker') || text.includes('kubernetes')) {
      skills.add('DevOps CI/CD');
      skills.add('Cloud Architecture');
    }
    if (text.includes('hackathon') || text.includes('bootcamp') || text.includes('code')) {
      skills.add('Rapid Prototyping');
      skills.add('Agile Problem Solving');
    }
    if (text.includes('ai') || text.includes('ml') || text.includes('gemini') || text.includes('data')) {
      skills.add('Applied AI & ML');
      skills.add('Prompt Engineering');
    }
    if (text.includes('web') || text.includes('fullstack') || text.includes('react') || text.includes('node')) {
      skills.add('Full-Stack Engineering');
      skills.add('Modern Web Architecture');
    }
    if (text.includes('founder') || text.includes('leadership') || text.includes('management')) {
      skills.add('Strategic Leadership');
      skills.add('Ecosystem Networking');
    }

    if (skills.size === 0) {
      skills.add('Collaborative Innovation');
      skills.add('Applied Problem Solving');
      skills.add('Domain Mastery');
    }

    return Array.from(skills).slice(0, 4);
  }
}

module.exports = new GeminiAIService();

