const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  eventName: {
    type: String,
    required: [true, 'Event name is required'],
    trim: true
  },
  description: {
    type: String,
    default: ''
  },
  coverImage: {
    type: String,
    default: '' // URL to the image
  },
  calendarType: {
    type: String,
    enum: ['personal', 'team'],
    default: 'personal'
  },
  visibility: {
    type: String,
    enum: ['public', 'private'],
    default: 'public'
  },
  startDateTime: {
    type: Date,
    required: [true, 'Start date and time are required']
  },
  endDateTime: {
    type: Date,
    required: [true, 'End date and time are required']
  },
  timeZone: {
    type: String,
    default: 'GMT+05:30'
  },
  locationType: {
    type: String,
    enum: ['offline', 'online'],
    default: 'offline'
  },
  locationValue: {
    type: String,
    required: function() {
      // Required if locationType is offline (address) or online (link)
      // You can adjust logic if one is optional
      return true;
    }
  },
  theme: {
    type: String,
    default: 'minimal'
  },
  ticketType: {
    type: String,
    enum: ['free', 'paid'],
    default: 'free'
  },
  ticketPrice: {
    type: Number,
    default: 0,
    validate: {
      validator: function(v) {
        if (this.ticketType === 'paid') {
          return v > 0;
        }
        return true;
      },
      message: 'Paid events must have a price greater than 0'
    }
  },
  requireApproval: {
    type: Boolean,
    default: false
  },
  capacity: {
    type: Number,
    default: null // null implies unlimited
  },
  registrationDeadline: {
    type: Date,
    default: function() {
      // Default to 1 hour before event start
      const deadline = new Date(this.startDateTime);
      deadline.setHours(deadline.getHours() - 1);
      return deadline;
    }
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    required: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Event', eventSchema);
