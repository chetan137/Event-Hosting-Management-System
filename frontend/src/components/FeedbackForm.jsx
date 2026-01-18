import React, { useState } from 'react';
import { Star, Send, Loader, Heart } from 'lucide-react';
import API from '../services/api';

const FeedbackForm = ({ eventId, eventName, onSubmitSuccess }) => {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (rating === 0) {
      setError('Please select a rating');
      return;
    }

    try {
      setSubmitting(true);
      setError('');

      await API.post('/api/attendance/feedback', {
        eventId,
        rating,
        comment
      });

      if (onSubmitSuccess) {
        onSubmitSuccess();
      }

      // Reset form
      setRating(0);
      setComment('');

      window.showToast('Thank you for your feedback! 🎉', 'success', 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit feedback');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-[#1E1E1E] rounded-2xl p-4 sm:p-6 border border-white/10">
      {/* Header */}
      <div className="text-center mb-6">
        <div className="text-4xl mb-3">💭</div>
        <h3 className="text-xl sm:text-2xl font-bold text-white mb-2">Share Your Experience</h3>
        <p className="text-gray-400 text-sm sm:text-base">{eventName}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Rating */}
        <div>
          <label className="block text-white font-semibold mb-3 text-center">
            How would you rate this event?
          </label>
          <div className="flex justify-center gap-2 sm:gap-3">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
                className="transition-transform hover:scale-110 active:scale-95"
              >
                <Star
                  className={`w-8 h-8 sm:w-10 sm:h-10 ${
                    star <= (hoverRating || rating)
                      ? 'fill-yellow-400 text-yellow-400'
                      : 'text-gray-600'
                  }`}
                />
              </button>
            ))}
          </div>
          {rating > 0 && (
            <p className="text-center mt-3 text-sm sm:text-base">
              {rating === 5 && <span className="text-green-400">🌟 Amazing!</span>}
              {rating === 4 && <span className="text-blue-400">😊 Great!</span>}
              {rating === 3 && <span className="text-yellow-400">👍 Good</span>}
              {rating === 2 && <span className="text-orange-400">😐 Okay</span>}
              {rating === 1 && <span className="text-red-400">😞 Poor</span>}
            </p>
          )}
        </div>

        {/* Comment */}
        <div>
          <label className="block text-white font-semibold mb-2">
            Tell us more (optional)
          </label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="What did you like? What could be improved?"
            className="w-full px-4 py-3 bg-[#2a2a2a] border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500/50 transition-colors resize-none"
            rows="4"
            maxLength="500"
          />
          <p className="text-gray-500 text-xs mt-1 text-right">
            {comment.length}/500
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="p-3 bg-red-500/20 border border-red-500/30 rounded-lg text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={submitting || rating === 0}
          className="w-full py-3 sm:py-4 bg-gradient-to-r from-cyan-500 to-pink-500 text-white font-bold rounded-xl hover:shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2 text-sm sm:text-base"
        >
          {submitting ? (
            <>
              <Loader className="w-5 h-5 animate-spin" />
              Submitting...
            </>
          ) : (
            <>
              <Heart className="w-5 h-5" />
              Submit Feedback
            </>
          )}
        </button>
      </form>

      {/* Thank you message */}
      <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
        <p className="text-blue-400 text-xs sm:text-sm text-center">
          💙 Your feedback helps us create better events for everyone!
        </p>
      </div>
    </div>
  );
};

export default FeedbackForm;
