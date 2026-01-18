# AI-Powered Event Analytics System

## Overview
This module provides comprehensive AI-powered feedback analysis for completed events using Google Gemini API. Admins can view detailed analytics, sentiment analysis, and actionable insights from user feedback.

## Features

### Backend Features
1. **AI-Powered Analysis**
   - Google Gemini API integration for intelligent feedback analysis
   - Sentiment analysis (positive, neutral, negative)
   - Automated insight extraction
   - Common issues identification
   - Positive highlights detection
   - Actionable recommendations generation
   - Key themes extraction

2. **Data Caching**
   - Analytics results cached in MongoDB
   - Automatic regeneration when data changes
   - 1-hour cache validity
   - Manual regeneration option

3. **REST API Endpoints**
   - `GET /api/analytics/completed-events` - List all completed events
   - `GET /api/analytics/event/:eventId` - Get detailed analytics
   - `POST /api/analytics/event/:eventId/regenerate` - Force regenerate analytics

4. **Statistics Tracking**
   - Total feedback count
   - Average rating
   - Rating distribution (1-5 stars)
   - Sentiment distribution
   - Top positive/negative comments

### Frontend Features
1. **Completed Events List**
   - Overview of all completed events
   - Quick stats (feedback count, average rating)
   - Analytics status indicator
   - Click to view detailed analytics

2. **Event Analytics Dashboard**
   - **Visual Charts:**
     - Bar chart for rating distribution
     - Pie chart for sentiment analysis
   - **AI Insights:**
     - Executive summary
     - Positive highlights
     - Areas for improvement
     - Recommendations
     - Key themes
   - **Top Comments:**
     - Best positive feedback
     - Critical feedback for improvement
   - **Complete Feedback Table:**
     - All user feedback with ratings
     - Sortable and filterable

3. **Mobile Responsive**
   - Fully responsive design
   - Touch-friendly interface
   - Optimized for all screen sizes

## Setup Instructions

### 1. Backend Setup

#### Install Dependencies
```bash
cd backend
npm install @google/generative-ai
```

#### Configure Environment Variables
Add to `backend/.env`:
```env
GEMINI_API_KEY=your_actual_gemini_api_key_here
```

**To get your Gemini API key:**
1. Visit https://makersuite.google.com/app/apikey
2. Create a new API key
3. Copy and paste into .env file

### 2. Frontend Setup

#### Install Dependencies
```bash
cd frontend
npm install chart.js react-chartjs-2
```

### 3. Start Services
```bash
# Terminal 1 - Backend
cd backend
npm start

# Terminal 2 - Frontend
cd frontend
npm run dev
```

## Usage Guide

### For Admins

1. **Access Analytics**
   - Navigate to Admin Dashboard
   - Click "AI Analytics" button
   - View list of completed events

2. **View Event Analytics**
   - Click on any completed event
   - View AI-generated insights
   - Explore charts and statistics
   - Read top comments

3. **Regenerate Analytics**
   - Click "Regenerate AI Insights" button
   - Wait for AI analysis to complete
   - View updated insights

## API Documentation

### Get Completed Events
```http
GET /api/analytics/completed-events
Authorization: Bearer <token>

Response:
{
  "total": 5,
  "events": [
    {
      "id": "event_id",
      "name": "Event Name",
      "startDate": "2024-01-15T10:00:00Z",
      "endDate": "2024-01-15T18:00:00Z",
      "feedbackCount": 45,
      "averageRating": 4.5,
      "hasAnalytics": true,
      "lastAnalyzed": "2024-01-16T10:00:00Z"
    }
  ]
}
```

### Get Event Analytics
```http
GET /api/analytics/event/:eventId
Authorization: Bearer <token>

Response:
{
  "event": {
    "id": "event_id",
    "name": "Event Name",
    "startDate": "2024-01-15T10:00:00Z",
    "endDate": "2024-01-15T18:00:00Z",
    "isCompleted": true
  },
  "statistics": {
    "totalFeedbacks": 45,
    "averageRating": 4.5,
    "ratingDistribution": {
      "5": 25,
      "4": 15,
      "3": 3,
      "2": 1,
      "1": 1
    }
  },
  "analytics": {
    "sentimentAnalysis": {
      "positive": 35,
      "neutral": 8,
      "negative": 2
    },
    "aiInsights": {
      "summary": "Overall positive event...",
      "positiveHighlights": ["Great organization", "Excellent speakers"],
      "commonIssues": ["Long queues", "Limited parking"],
      "recommendations": ["Add more staff", "Improve signage"],
      "keyThemes": ["Organization", "Content Quality", "Venue"]
    },
    "topComments": {
      "positive": [...],
      "negative": [...]
    }
  },
  "feedbacks": [...],
  "lastAnalyzed": "2024-01-16T10:00:00Z"
}
```

### Regenerate Analytics
```http
POST /api/analytics/event/:eventId/regenerate
Authorization: Bearer <token>

Response:
{
  "message": "Analytics regenerated successfully",
  "analytics": {...}
}
```

## Database Schema

### FeedbackAnalytics Model
```javascript
{
  event: ObjectId,              // Reference to Event
  totalFeedbacks: Number,       // Total feedback count
  averageRating: Number,        // Average rating (0-5)
  ratingDistribution: {         // Count per rating
    5: Number,
    4: Number,
    3: Number,
    2: Number,
    1: Number
  },
  sentimentAnalysis: {          // Sentiment counts
    positive: Number,
    neutral: Number,
    negative: Number
  },
  aiInsights: {
    summary: String,            // AI-generated summary
    positiveHighlights: [String],
    commonIssues: [String],
    recommendations: [String],
    keyThemes: [String]
  },
  topComments: {
    positive: [{
      comment: String,
      rating: Number,
      user: String
    }],
    negative: [...]
  },
  lastAnalyzed: Date,           // Last analysis timestamp
  analysisVersion: String       // Version for future updates
}
```

## Architecture

### MVC Pattern
- **Models:** FeedbackAnalytics.js
- **Views:** EventAnalyticsDashboard.jsx, CompletedEventsAnalytics.jsx
- **Controllers:** analyticsController.js

### Services Layer
- **geminiAIService.js:** Handles all AI operations
  - Feedback analysis
  - Sentiment detection
  - Insight generation
  - Fallback for when AI is unavailable

### Security
- JWT-based authentication required
- Admin role verification (implement as needed)
- CORS configured for production
- API key stored in environment variables

## Scalability Considerations

1. **Caching Strategy**
   - Results cached for 1 hour
   - Reduces API calls to Gemini
   - Improves response times

2. **Batch Processing**
   - Can process large feedback datasets
   - Handles events with 100+ feedback submissions

3. **Fallback Mechanism**
   - Works without AI if API key not configured
   - Provides basic statistics
   - Graceful degradation

4. **Future Enhancements**
   - Image analysis support (Gemini Vision)
   - Multi-language feedback support
   - Trend analysis across events
   - Export to PDF/Excel
   - Email reports to stakeholders

## Troubleshooting

### AI Analysis Not Working
1. Check GEMINI_API_KEY in .env
2. Verify API key is valid
3. Check console for error messages
4. Ensure feedback data exists

### Charts Not Displaying
1. Verify chart.js and react-chartjs-2 installed
2. Check browser console for errors
3. Ensure data is loading correctly

### Slow Performance
1. Check cache validity (1 hour)
2. Reduce feedback dataset size
3. Optimize database queries
4. Consider pagination for large datasets

## File Structure
```
backend/
├── models/
│   └── FeedbackAnalytics.js
├── controllers/
│   └── analyticsController.js
├── services/
│   └── geminiAIService.js
├── routes/
│   └── analyticsRoutes.js
└── .env (GEMINI_API_KEY)

frontend/
├── components/
│   ├── CompletedEventsAnalytics.jsx
│   └── EventAnalyticsDashboard.jsx
└── App.jsx (routes configured)
```

## Support & Maintenance

### Monitoring
- Check analytics generation logs
- Monitor API usage (Gemini has rate limits)
- Track cache hit/miss rates

### Updates
- Keep @google/generative-ai package updated
- Monitor Gemini API changes
- Update prompts for better insights

## License
Part of Event Management System - All Rights Reserved
