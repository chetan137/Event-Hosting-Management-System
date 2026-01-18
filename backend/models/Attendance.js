const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  event: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  registration: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'EventRegistration',
    required: true
  },
  qrCode: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'QRCode',
    default: null  // Can be null if using manual Attendance ID
  },
  scannedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    default: null
  },
  scanTime: {
    type: Date,
    default: Date.now
  },
  scanMethod: {
    type: String,
    enum: ['qr_code', 'manual_id'],
    default: 'qr_code'
  },
  scanLocation: {
    type: String,
    default: 'Event Venue'
  },
  feedbackSubmitted: {
    type: Boolean,
    default: false
  },
  feedbackReminderSent: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Compound index to prevent duplicate attendance
attendanceSchema.index({ event: 1, user: 1 }, { unique: true });

module.exports = mongoose.model('Attendance', attendanceSchema);
