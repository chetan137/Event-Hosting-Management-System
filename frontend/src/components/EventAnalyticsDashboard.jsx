import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { Bar, Pie, Line } from 'react-chartjs-2';
import {
  TrendingUp,
  Star,
  MessageSquare,
  ThumbsUp,
  ThumbsDown,
  Sparkles,
  RefreshCw,
  ArrowLeft,
  Calendar,
  Users,
  Award,
  AlertCircle,
  Lightbulb,
  Target
} from 'lucide-react';
import API from '../services/api';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend
);

const EventAnalyticsDashboard = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [regenerating, setRegenerating] = useState(false);
  const [analyticsData, setAnalyticsData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchAnalytics();
  }, [eventId]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setError('');
      const { data } = await API.get(`/api/analytics/event/${eventId}`);
      console.log('Analytics Data Received:', data);
      setAnalyticsData(data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load analytics');
      console.error('Analytics fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRegenerateAnalytics = async () => {
    try {
      setRegenerating(true);
      await API.post(`/api/analytics/event/${eventId}/regenerate`);
      await fetchAnalytics();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to regenerate analytics');
    } finally {
      setRegenerating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#121212] flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#121212] flex items-center justify-center p-4"> <br /> <br /><br />
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6 max-w-md">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <p className="text-red-400 text-center">{error}</p>
          <button
            onClick={() => navigate('/admin')}
            className="mt-4 w-full px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-all"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const { event, statistics, analytics, feedbacks, lastAnalyzed } = analyticsData;

  // Chart data configurations
  const ratingDistributionData = {
    labels: ['5 Stars', '4 Stars', '3 Stars', '2 Stars', '1 Star'],
    datasets: [
      {
        label: 'Number of Ratings',
        data: [
          statistics.ratingDistribution?.[5] || 0,
          statistics.ratingDistribution?.[4] || 0,
          statistics.ratingDistribution?.[3] || 0,
          statistics.ratingDistribution?.[2] || 0,
          statistics.ratingDistribution?.[1] || 0
        ],
        backgroundColor: [
          'rgba(34, 197, 94, 0.8)',
          'rgba(59, 130, 246, 0.8)',
          'rgba(234, 179, 8, 0.8)',
          'rgba(249, 115, 22, 0.8)',
          'rgba(239, 68, 68, 0.8)'
        ],
        borderColor: [
          'rgb(34, 197, 94)',
          'rgb(59, 130, 246)',
          'rgb(234, 179, 8)',
          'rgb(249, 115, 22)',
          'rgb(239, 68, 68)'
        ],
        borderWidth: 2
      }
    ]
  };

  const sentimentData = {
    labels: ['Positive', 'Neutral', 'Negative'],
    datasets: [
      {
        data: [
          analytics.sentimentAnalysis?.positive || 0,
          analytics.sentimentAnalysis?.neutral || 0,
          analytics.sentimentAnalysis?.negative || 0
        ],
        backgroundColor: [
          'rgba(34, 197, 94, 0.8)',
          'rgba(234, 179, 8, 0.8)',
          'rgba(239, 68, 68, 0.8)'
        ],
        borderColor: [
          'rgb(34, 197, 94)',
          'rgb(234, 179, 8)',
          'rgb(239, 68, 68)'
        ],
        borderWidth: 2
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: {
          color: '#fff',
          font: { size: 12 }
        }
      }
    },
    scales: {
      y: {
        ticks: { color: '#9ca3af' },
        grid: { color: 'rgba(255, 255, 255, 0.1)' }
      },
      x: {
        ticks: { color: '#9ca3af' },
        grid: { color: 'rgba(255, 255, 255, 0.1)' }
      }
    }
  };

  const pieOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          color: '#fff',
          font: { size: 12 },
          padding: 15
        }
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#121212] p-4 sm:p-6 lg:p-8"> <br /><br /><br />
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <button
              onClick={() => navigate('/admin')}
              className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-2"
            >
              <ArrowLeft size={20} />
              <span>Back to Dashboard</span>
            </button>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white flex items-center gap-3">
              <Sparkles className="text-cyan-400" />
              Event Analytics
            </h1>
            <p className="text-gray-400 mt-1">{event.name}</p>
          </div>
          <button
            onClick={handleRegenerateAnalytics}
            disabled={regenerating}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-500 to-pink-500 text-white font-semibold rounded-xl hover:shadow-lg transition-all disabled:opacity-50"
          >
            <RefreshCw size={18} className={regenerating ? 'animate-spin' : ''} />
            {regenerating ? 'Regenerating...' : 'Regenerate AI Insights'}
          </button>
        </div>

        {/* Event Info */}
        <div className="bg-[#1E1E1E] rounded-2xl p-4 sm:p-6 border border-white/10">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="flex items-center gap-3">
              <Calendar className="text-cyan-400" size={24} />
              <div>
                <p className="text-gray-400 text-sm">Event Date</p>
                <p className="text-white font-semibold">
                  {new Date(event.startDate).toLocaleDateString()}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Users className="text-pink-400" size={24} />
              <div>
                <p className="text-gray-400 text-sm">Total Feedback</p>
                <p className="text-white font-semibold">{statistics.totalFeedbacks}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Award className="text-yellow-400" size={24} />
              <div>
                <p className="text-gray-400 text-sm">Average Rating</p>
                <p className="text-white font-semibold flex items-center gap-1">
                  {statistics.averageRating}
                  <Star size={16} className="text-yellow-400 fill-yellow-400" />
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* AI Summary */}
        {analytics.aiInsights.summary && (
          <div className="bg-gradient-to-br from-cyan-500/10 to-pink-500/10 border border-cyan-500/30 rounded-2xl p-6">
            <div className="flex items-start gap-3">
              <Sparkles className="text-cyan-400 flex-shrink-0 mt-1" size={24} />
              <div>
                <h2 className="text-xl font-bold text-white mb-2">AI-Generated Summary</h2>
                <p className="text-gray-300 leading-relaxed">{analytics.aiInsights.summary}</p>
                {lastAnalyzed && (
                  <p className="text-gray-500 text-sm mt-3">
                    Last analyzed: {new Date(lastAnalyzed).toLocaleString()}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Rating Distribution */}
          <div className="bg-[#1E1E1E] rounded-2xl p-6 border border-white/10">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Star className="text-yellow-400" />
              Rating Distribution
            </h3>
            <div className="h-64">
              <Bar data={ratingDistributionData} options={chartOptions} />
            </div>
          </div>

          {/* Sentiment Analysis */}
          <div className="bg-[#1E1E1E] rounded-2xl p-6 border border-white/10">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <TrendingUp className="text-cyan-400" />
              Sentiment Analysis
            </h3>
            <div className="h-64">
              <Pie data={sentimentData} options={pieOptions} />
            </div>
          </div>
        </div>

        {/* AI Insights Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Positive Highlights */}
          {analytics.aiInsights.positiveHighlights?.length > 0 && (
            <div className="bg-[#1E1E1E] rounded-2xl p-6 border border-white/10">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <ThumbsUp className="text-green-400" />
                Positive Highlights
              </h3>
              <ul className="space-y-3">
                {analytics.aiInsights.positiveHighlights.map((highlight, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    <span className="text-green-400 text-xl">•</span>
                    <span className="text-gray-300">{highlight}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Common Issues */}
          {analytics.aiInsights.commonIssues?.length > 0 && (
            <div className="bg-[#1E1E1E] rounded-2xl p-6 border border-white/10">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <ThumbsDown className="text-red-400" />
                Areas for Improvement
              </h3>
              <ul className="space-y-3">
                {analytics.aiInsights.commonIssues.map((issue, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    <span className="text-red-400 text-xl">•</span>
                    <span className="text-gray-300">{issue}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Recommendations */}
          {analytics.aiInsights.recommendations?.length > 0 && (
            <div className="bg-[#1E1E1E] rounded-2xl p-6 border border-white/10">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <Lightbulb className="text-yellow-400" />
                Recommendations
              </h3>
              <ul className="space-y-3">
                {analytics.aiInsights.recommendations.map((rec, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    <span className="text-yellow-400 text-xl">•</span>
                    <span className="text-gray-300">{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Key Themes */}
          {analytics.aiInsights.keyThemes?.length > 0 && (
            <div className="bg-[#1E1E1E] rounded-2xl p-6 border border-white/10">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <Target className="text-purple-400" />
                Key Themes
              </h3>
              <div className="flex flex-wrap gap-2">
                {analytics.aiInsights.keyThemes.map((theme, idx) => (
                  <span
                    key={idx}
                    className="px-4 py-2 bg-purple-500/20 border border-purple-500/30 rounded-full text-purple-300 text-sm"
                  >
                    {theme}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Top Comments */}
        {(analytics.topComments?.positive?.length > 0 || analytics.topComments?.negative?.length > 0) && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Positive Comments */}
            {analytics.topComments.positive?.length > 0 && (
              <div className="bg-[#1E1E1E] rounded-2xl p-6 border border-white/10">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <MessageSquare className="text-green-400" />
                  Top Positive Comments
                </h3>
                <div className="space-y-4">
                  {analytics.topComments.positive.map((comment, idx) => (
                    <div key={idx} className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-gray-400 text-sm">{comment.user}</span>
                        <div className="flex items-center gap-1">
                          {[...Array(comment.rating)].map((_, i) => (
                            <Star key={i} size={14} className="text-yellow-400 fill-yellow-400" />
                          ))}
                        </div>
                      </div>
                      <p className="text-gray-300 text-sm italic">"{comment.comment}"</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Top Negative Comments */}
            {analytics.topComments.negative?.length > 0 && (
              <div className="bg-[#1E1E1E] rounded-2xl p-6 border border-white/10">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <MessageSquare className="text-red-400" />
                  Critical Feedback
                </h3>
                <div className="space-y-4">
                  {analytics.topComments.negative.map((comment, idx) => (
                    <div key={idx} className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-gray-400 text-sm">{comment.user}</span>
                        <div className="flex items-center gap-1">
                          {[...Array(comment.rating)].map((_, i) => (
                            <Star key={i} size={14} className="text-yellow-400 fill-yellow-400" />
                          ))}
                        </div>
                      </div>
                      <p className="text-gray-300 text-sm italic">"{comment.comment}"</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* All Feedback Table */}
        <div className="bg-[#1E1E1E] rounded-2xl p-6 border border-white/10">
          <h3 className="text-lg font-bold text-white mb-4">All Feedback ({feedbacks.length})</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left text-gray-400 font-semibold p-3">User</th>
                  <th className="text-left text-gray-400 font-semibold p-3">Rating</th>
                  <th className="text-left text-gray-400 font-semibold p-3">Comment</th>
                  <th className="text-left text-gray-400 font-semibold p-3">Date</th>
                </tr>
              </thead>
              <tbody>
                {feedbacks.map((feedback, idx) => (
                  <tr key={idx} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                    <td className="p-3 text-gray-300">{feedback.user}</td>
                    <td className="p-3">
                      <div className="flex items-center gap-1">
                        {[...Array(feedback.rating)].map((_, i) => (
                          <Star key={i} size={14} className="text-yellow-400 fill-yellow-400" />
                        ))}
                      </div>
                    </td>
                    <td className="p-3 text-gray-300 max-w-md truncate">
                      {feedback.comment || <span className="text-gray-500 italic">No comment</span>}
                    </td>
                    <td className="p-3 text-gray-400 text-sm">
                      {new Date(feedback.submittedAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventAnalyticsDashboard;
