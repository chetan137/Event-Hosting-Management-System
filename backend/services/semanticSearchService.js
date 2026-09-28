const geminiAIService = require('./geminiAIService');

// Canonical Event Categories and Rich Semantic Lexicons
const CATEGORY_LEXICON = {
  Technology: {
    name: 'Technology',
    icon: '💻',
    keywords: [
      'code', 'coding', 'program', 'programming', 'software', 'developer', 'development',
      'web', 'frontend', 'backend', 'fullstack', 'javascript', 'python', 'java', 'react',
      'node', 'c++', 'golang', 'rust', 'ai', 'artificial intelligence', 'ml', 'machine learning',
      'deep learning', 'llm', 'neural', 'data science', 'database', 'sql', 'nosql', 'cloud',
      'aws', 'azure', 'gcp', 'devops', 'docker', 'kubernetes', 'cybersecurity', 'security',
      'infosec', 'hacker', 'hacking', 'hackathon', 'blockchain', 'crypto', 'web3', 'api',
      'tech', 'computer', 'iot', 'robotics', 'algorithms', 'git', 'github', 'linux', 'open source'
    ]
  },
  Workshop: {
    name: 'Workshop',
    icon: '🛠️',
    keywords: [
      'workshop', 'boot camp', 'bootcamp', 'hands-on', 'hands on', 'tutorial', 'masterclass',
      'training', 'seminar', 'skill', 'interactive', 'lab', 'certification', 'practical',
      'course', 'learn', 'learning', 'study', 'coaching', 'practice', 'session', 'walkthrough',
      'beginner', 'advanced', 'crash course', 'intensive', 'guided'
    ]
  },
  Business: {
    name: 'Business',
    icon: '💼',
    keywords: [
      'business', 'startup', 'startups', 'entrepreneur', 'entrepreneurship', 'founder',
      'co-founder', 'pitch', 'pitching', 'investor', 'investment', 'funding', 'vc',
      'venture capital', 'finance', 'fintech', 'marketing', 'branding', 'sales', 'management',
      'leadership', 'strategy', 'product management', 'commerce', 'ecommerce', 'trading',
      'economics', 'monetization', 'growth', 'b2b', 'b2c', 'incubator', 'accelerator'
    ]
  },
  Entertainment: {
    name: 'Entertainment',
    icon: '🎭',
    keywords: [
      'entertainment', 'show', 'comedy', 'standup', 'stand-up', 'magic', 'festival', 'fest',
      'movie', 'film', 'screening', 'drama', 'theatre', 'theater', 'play', 'fun', 'party',
      'celebration', 'carnival', 'amusement', 'improv', 'circus', 'performance', 'trivia',
      'nightlife', 'gathering', 'recreation'
    ]
  },
  Music: {
    name: 'Music',
    icon: '🎵',
    keywords: [
      'music', 'concert', 'band', 'live music', 'singer', 'acoustic', 'edm', 'dj', 'dance',
      'rave', 'rock', 'pop', 'hip hop', 'rap', 'jazz', 'classical', 'symphony', 'orchestra',
      'rhythm', 'beat', 'gig', 'instrumental', 'guitar', 'piano', 'drums', 'audio', 'sound',
      'festival', 'jam', 'musical', 'karaoke'
    ]
  },
  'Sports & Fitness': {
    name: 'Sports & Fitness',
    icon: '🏃',
    keywords: [
      'sports', 'fitness', 'workout', 'marathon', 'run', 'running', 'gym', 'yoga',
      'meditation', 'health', 'wellness', 'football', 'soccer', 'cricket', 'basketball',
      'tennis', 'badminton', 'athletic', 'athletics', 'crossfit', 'cycling', 'race',
      'tournament', 'exercise', 'training', 'swimming', 'aerobics', 'hiking', 'trekking', 'cardio'
    ]
  },
  Networking: {
    name: 'Networking',
    icon: '🤝',
    keywords: [
      'networking', 'network', 'mixer', 'meet and greet', 'meetup', 'social', 'connect',
      'connections', 'professionals', 'roundtable', 'alumni', 'community', 'gathering',
      'collab', 'collaboration', 'exchange', 'mingle', 'contacts', 'peers', 'coffee chat',
      'speed networking', 'relationship'
    ]
  },
  Education: {
    name: 'Education',
    icon: '📚',
    keywords: [
      'education', 'lecture', 'academic', 'research', 'scholar', 'scholarship', 'university',
      'college', 'school', 'student', 'students', 'symposium', 'conference', 'panel', 'talk',
      'keynote', 'thesis', 'science', 'math', 'literature', 'history', 'curriculum',
      'faculty', 'professors', 'exam', 'webinar'
    ]
  },
  Design: {
    name: 'Design',
    icon: '🎨',
    keywords: [
      'design', 'designer', 'ui', 'ux', 'user experience', 'user interface', 'figma',
      'visual', 'graphic design', 'typography', 'prototype', 'prototyping', 'creative',
      'art', 'artwork', 'animation', '3d', 'blender', 'drawing', 'illustration', 'branding',
      'aesthetic', 'interaction design', 'wireframe', 'photoshop', 'illustrator'
    ]
  },
  Gaming: {
    name: 'Gaming',
    icon: '🎮',
    keywords: [
      'gaming', 'game', 'games', 'gamer', 'esports', 'tournament', 'lan', 'vr',
      'virtual reality', 'playstation', 'xbox', 'nintendo', 'pc gaming', 'discord',
      'streaming', 'twitch', 'valorant', 'fifa', 'counter-strike', 'csgo', 'bgmi',
      'pubg', 'board games', 'tabletop', 'rpg', 'd&d', 'arcade'
    ]
  },
  Other: {
    name: 'Other',
    icon: '🌟',
    keywords: ['general', 'miscellaneous', 'special', 'community', 'featured']
  }
};

// In-memory LRU cache for semantic enhancement queries
const queryCache = new Map();
const MAX_CACHE_SIZE = 200;

class SemanticSearchService {
  constructor() {
    this.categories = CATEGORY_LEXICON;
  }

  /**
   * Calculate Levenshtein distance between two strings
   */
  levenshteinDistance(a, b) {
    if (a.length === 0) return b.length;
    if (b.length === 0) return a.length;

    const matrix = [];
    for (let i = 0; i <= b.length; i++) matrix[i] = [i];
    for (let j = 0; j <= a.length; j++) matrix[0][j] = j;

    for (let i = 1; i <= b.length; i++) {
      for (let j = 1; j <= a.length; j++) {
        if (b.charAt(i - 1) === a.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1, // substitution
            matrix[i][j - 1] + 1,     // insertion
            matrix[i - 1][j] + 1      // deletion
          );
        }
      }
    }
    return matrix[b.length][a.length];
  }

  /**
   * Normalized similarity score (0 to 1) based on edit distance
   */
  stringSimilarity(str1, str2) {
    const s1 = str1.toLowerCase().trim();
    const s2 = str2.toLowerCase().trim();
    if (s1 === s2) return 1.0;
    if (s1.includes(s2) || s2.includes(s1)) {
      const minLen = Math.min(s1.length, s2.length);
      const maxLen = Math.max(s1.length, s2.length);
      return Math.max(0.75, minLen / maxLen);
    }
    const maxLen = Math.max(s1.length, s2.length);
    if (maxLen === 0) return 1.0;
    const distance = this.levenshteinDistance(s1, s2);
    return Math.max(0, 1 - distance / maxLen);
  }

  /**
   * Tokenize and normalize query text
   */
  tokenize(text) {
    if (!text) return [];
    return text
      .toLowerCase()
      .replace(/[^a-z0-9+#\s-]/g, ' ')
      .split(/\s+/)
      .filter(t => t.length > 1);
  }

  /**
   * Vector & Fuzzy Semantic Keyword Enhancer (Local Engine)
   */
  fuzzyVectorEnhance(query) {
    const tokens = this.tokenize(query);
    if (tokens.length === 0) {
      return {
        originalQuery: query,
        enhancedKeywords: [],
        inferredCategories: [],
        primaryCategory: null,
        confidence: 0,
        semanticSource: 'fuzzy_vector_engine'
      };
    }

    const categoryScores = {};
    const matchedKeywordsMap = {};

    // Evaluate tokens against category lexicons
    Object.keys(this.categories).forEach(catKey => {
      const category = this.categories[catKey];
      categoryScores[catKey] = 0;
      matchedKeywordsMap[catKey] = new Set();

      tokens.forEach(token => {
        // Direct category name match
        const catNameSim = this.stringSimilarity(token, catKey.toLowerCase());
        if (catNameSim >= 0.8) {
          categoryScores[catKey] += catNameSim * 3.0; // High weight for category name match
        }

        category.keywords.forEach(keyword => {
          // Exact keyword match
          if (token === keyword) {
            categoryScores[catKey] += 2.0;
            matchedKeywordsMap[catKey].add(keyword);
            return;
          }

          // Multi-word keyword phrase match in original query
          if (keyword.includes(' ') && query.toLowerCase().includes(keyword)) {
            categoryScores[catKey] += 2.5;
            matchedKeywordsMap[catKey].add(keyword);
            return;
          }

          // Fuzzy match for typo tolerance (e.g. "pyhton" -> "python")
          if (token.length >= 4 && keyword.length >= 4) {
            const sim = this.stringSimilarity(token, keyword);
            if (sim >= 0.82) {
              categoryScores[catKey] += sim * 1.5;
              matchedKeywordsMap[catKey].add(keyword);
            }
          }
        });
      });
    });

    // Rank categories by score
    const rankedCategories = Object.keys(categoryScores)
      .map(cat => ({
        category: cat,
        score: categoryScores[cat],
        matchedKeywords: Array.from(matchedKeywordsMap[cat] || [])
      }))
      .filter(item => item.score > 0.9)
      .sort((a, b) => b.score - a.score);

    const inferredCategories = rankedCategories.slice(0, 3).map(r => r.category);
    const primaryCategory = inferredCategories.length > 0 ? inferredCategories[0] : null;

    // Collect enhanced keywords (matched keywords + top related category keywords)
    const enhancedKeywords = new Set(tokens);
    rankedCategories.slice(0, 2).forEach(rc => {
      rc.matchedKeywords.forEach(k => enhancedKeywords.add(k));
      // Add top 3 defining keywords for that category to expand recall
      const topLexicon = this.categories[rc.category]?.keywords.slice(0, 4) || [];
      topLexicon.forEach(k => enhancedKeywords.add(k));
    });

    const maxScore = rankedCategories.length > 0 ? rankedCategories[0].score : 0;
    const confidence = Math.min(1.0, +(maxScore / 4.0).toFixed(2));

    return {
      originalQuery: query,
      enhancedKeywords: Array.from(enhancedKeywords).slice(0, 10),
      inferredCategories,
      primaryCategory,
      confidence,
      semanticSource: 'fuzzy_vector_engine'
    };
  }

  /**
   * Enhance ambiguous search query via Gemini AI or Vector/Fuzzy Engine
   */
  async enhanceQuery(query) {
    if (!query || !query.trim()) {
      return {
        originalQuery: '',
        enhancedKeywords: [],
        inferredCategories: [],
        primaryCategory: null,
        confidence: 0,
        semanticSource: 'none'
      };
    }

    const cleanQuery = query.trim();
    const cacheKey = cleanQuery.toLowerCase();

    // Check in-memory cache
    if (queryCache.has(cacheKey)) {
      return queryCache.get(cacheKey);
    }

    // Always run fuzzy vector enhancer first as reliable baseline
    const localResult = this.fuzzyVectorEnhance(cleanQuery);

    // If Gemini AI is active and configured, use AI semantic mapping
    if (geminiAIService && geminiAIService.enabled) {
      try {
        const availableCategories = Object.keys(this.categories);
        const prompt = `You are a semantic search optimizer for an event management platform.
Analyze this user search query: "${cleanQuery}"

Given these available event categories: ${JSON.stringify(availableCategories)}

Map ambiguous or intent-based keywords to the most relevant categories and expand synonyms.
Respond ONLY with a valid JSON object (no markdown, no code blocks):
{
  "inferredCategories": ["Category1", "Category2"],
  "primaryCategory": "Category1",
  "enhancedKeywords": ["synonym1", "synonym2", "relatedTerm"],
  "explanation": "Short 1-sentence explanation of inferred user intent",
  "confidence": 0.95
}`;

        // Timeout promise after 1500ms to keep user search debounced and blazing fast
        const aiPromise = (async () => {
          const result = await geminiAIService.model.generateContent(prompt);
          const response = await result.response;
          const text = response.text();
          const match = text.match(/\{[\s\S]*\}/);
          if (!match) return null;
          return JSON.parse(match[0]);
        })();

        const timeoutPromise = new Promise(resolve => setTimeout(() => resolve(null), 1500));
        const aiData = await Promise.race([aiPromise, timeoutPromise]);

        if (aiData && Array.isArray(aiData.inferredCategories) && aiData.inferredCategories.length > 0) {
          // Merge AI suggestions with local vector tokens
          const mergedCategories = Array.from(
            new Set([...aiData.inferredCategories, ...localResult.inferredCategories])
          ).filter(cat => availableCategories.includes(cat)).slice(0, 3);

          const mergedKeywords = Array.from(
            new Set([
              ...cleanQuery.toLowerCase().split(/\s+/),
              ...(aiData.enhancedKeywords || []),
              ...localResult.enhancedKeywords
            ])
          ).slice(0, 10);

          const finalResult = {
            originalQuery: cleanQuery,
            enhancedKeywords: mergedKeywords,
            inferredCategories: mergedCategories,
            primaryCategory: aiData.primaryCategory || mergedCategories[0] || localResult.primaryCategory,
            explanation: aiData.explanation || `Mapped to ${mergedCategories.join(', ')}`,
            confidence: aiData.confidence || localResult.confidence || 0.9,
            semanticSource: 'gemini_ai'
          };

          this.saveToCache(cacheKey, finalResult);
          return finalResult;
        }
      } catch (aiError) {
        console.warn('Gemini query enhancement skipped, using vector/fuzzy engine:', aiError.message);
      }
    }

    // Fallback to local vector/fuzzy enhancer
    this.saveToCache(cacheKey, localResult);
    return localResult;
  }

  saveToCache(key, value) {
    if (queryCache.size >= MAX_CACHE_SIZE) {
      const firstKey = queryCache.keys().next().value;
      queryCache.delete(firstKey);
    }
    queryCache.set(key, value);
  }

  /**
   * Get available categories list with metadata
   */
  getCategories() {
    return Object.keys(this.categories).map(key => ({
      id: key,
      name: this.categories[key].name,
      icon: this.categories[key].icon
    }));
  }
}

module.exports = new SemanticSearchService();
