const mongoose = require('mongoose');

const certificateSchema = new mongoose.Schema({
  certificateNumber: {
    type: String,
    required: true,
    unique: true,
    index: true,
    trim: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  recipientName: {
    type: String,
    required: true,
    trim: true
  },
  recipientEmail: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
  },
  event: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: true,
    index: true
  },
  eventName: {
    type: String,
    required: true,
    trim: true
  },
  eventDate: {
    type: Date,
    default: Date.now
  },
  eventLocation: {
    type: String,
    default: 'EventSync Venue'
  },
  attendance: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Attendance',
    default: null
  },
  certificateType: {
    type: String,
    enum: ['participation', 'completion', 'excellence', 'achievement'],
    default: 'completion'
  },
  verificationHash: {
    type: String,
    required: true
  },
  qrCodeDataUrl: {
    type: String,
    default: ''
  },
  verificationUrl: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['active', 'revoked'],
    default: 'active'
  },
  isPublic: {
    type: Boolean,
    default: true,
    index: true
  },
  featured: {
    type: Boolean,
    default: false
  },
  issuedBy: {
    type: String,
    default: 'EventSync Credential Authority'
  },
  skills: [{
    type: String,
    trim: true
  }],
  grade: {
    type: String,
    default: null
  },
  customNote: {
    type: String,
    default: ''
  },
  issuedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Ensure a user has at most one certificate per event
certificateSchema.index({ event: 1, user: 1 }, { unique: true });
// Index for public showcase queries
certificateSchema.index({ isPublic: 1, status: 1, createdAt: -1 });

module.exports = mongoose.model('Certificate', certificateSchema);
