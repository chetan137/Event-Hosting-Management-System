const asyncHandler = require('express-async-handler');
const Event = require('../models/Event');

// @desc    Create a new event
// @route   POST /api/admin/events
// @access  Private
const createEvent = asyncHandler(async (req, res) => {
  const {
    eventName,
    description,
    coverImage,
    calendarType,
    visibility,
    startDateTime,
    endDateTime,
    registrationDeadline,
    timeZone,
    locationType,
    locationValue,
    theme,
    ticketType,
    ticketPrice,
    requireApproval,
    capacity
  } = req.body;

  // Basic validation checked by Mongoose, but we can add custom logic here
  if (!eventName || !startDateTime || !endDateTime) {
    res.status(400);
    throw new Error('Please fill in all required fields');
  }

  const event = new Event({
    eventName,
    description,
    coverImage,
    calendarType,
    visibility,
    startDateTime,
    endDateTime,
    registrationDeadline,
    timeZone,
    locationType,
    locationValue,
    theme,
    ticketType,
    ticketPrice,
    requireApproval,
    capacity,
    createdBy: '65a1234567890abcdef12345' // Temporary bypass for testing
  });

  const createdEvent = await event.save();
  res.status(201).json(createdEvent);
});

// @desc    Get all events (Admin view)
// @route   GET /api/admin/events
// @access  Private
const getEvents = asyncHandler(async (req, res) => {
  const events = await Event.find({});
  res.json(events);
});

// @desc    Get event by ID
// @route   GET /api/admin/events/:id
// @access  Private
const getEventById = asyncHandler(async (req, res) => {
  const event = await Event.findById(req.params.id);

  if (event) {
    // Calculate registration count
    const EventRegistration = require('../models/EventRegistration');
    const registrationCount = await EventRegistration.countDocuments({
      event: event._id,
      status: { $in: ['approved', 'pending'] }
    });

    // Calculate event status
    const now = new Date();
    const start = new Date(event.startDateTime);
    const end = new Date(event.endDateTime);
    let status = 'completed';
    if (now < start) status = 'upcoming';
    if (now >= start && now <= end) status = 'live';

    const eventData = event.toObject();
    eventData.registrationCount = registrationCount;
    eventData.status = status;
    eventData.spotsLeft = event.capacity ? event.capacity - registrationCount : null;

    res.json(eventData);
  } else {
    res.status(404);
    throw new Error('Event not found');
  }
});

// @desc    Update event
// @route   PUT /api/admin/events/:id
// @access  Private
const updateEvent = asyncHandler(async (req, res) => {
  const event = await Event.findById(req.params.id);

  if (event) {
    // Check if admin owns the event
    // if (event.createdBy.toString() !== req.admin._id.toString()) {
    //     res.status(401);
    //     throw new Error('Not authorized to update this event');
    // }

    // Store old values to detect changes
    const oldEventName = event.eventName;
    const oldStartDateTime = event.startDateTime;
    const oldEndDateTime = event.endDateTime;
    const oldLocationValue = event.locationValue;
    const oldDescription = event.description;

    event.eventName = req.body.eventName || event.eventName;
    event.description = req.body.description || event.description;
    event.coverImage = req.body.coverImage || event.coverImage;
    event.calendarType = req.body.calendarType || event.calendarType;
    event.visibility = req.body.visibility || event.visibility;
    event.startDateTime = req.body.startDateTime || event.startDateTime;
    event.endDateTime = req.body.endDateTime || event.endDateTime;
    event.registrationDeadline = req.body.registrationDeadline !== undefined ? req.body.registrationDeadline : event.registrationDeadline;
    event.timeZone = req.body.timeZone || event.timeZone;
    event.locationType = req.body.locationType || event.locationType;
    event.locationValue = req.body.locationValue || event.locationValue;
    event.theme = req.body.theme || event.theme;
    event.ticketType = req.body.ticketType || event.ticketType;
    event.ticketPrice = req.body.ticketPrice || event.ticketPrice;
    event.requireApproval = req.body.requireApproval !== undefined ? req.body.requireApproval : event.requireApproval;
    event.capacity = req.body.capacity !== undefined ? req.body.capacity : event.capacity;

    const updatedEvent = await event.save();

    // Notify registered users about changes
    const EventRegistration = require('../models/EventRegistration');
    const axios = require('axios');
    
    try {
      const registrations = await EventRegistration.find({
        event: event._id,
        status: { $in: ['approved', 'pending'] }
      }).populate('user', 'email fullName');

      // Prepare change summary
      let changesSummary = '📢 <strong>Event Details Updated:</strong><br><ul style="text-align: left;">';
      if (oldEventName !== event.eventName) {
        changesSummary += `<li><strong>Event Name:</strong> ${oldEventName} → ${event.eventName}</li>`;
      }
      if (oldStartDateTime.toString() !== event.startDateTime.toString()) {
        changesSummary += `<li><strong>Start Date/Time:</strong> ${new Date(oldStartDateTime).toLocaleString()} → ${new Date(event.startDateTime).toLocaleString()}</li>`;
      }
      if (oldEndDateTime.toString() !== event.endDateTime.toString()) {
        changesSummary += `<li><strong>End Date/Time:</strong> ${new Date(oldEndDateTime).toLocaleString()} → ${new Date(event.endDateTime).toLocaleString()}</li>`;
      }
      if (oldLocationValue !== event.locationValue) {
        changesSummary += `<li><strong>Location:</strong> ${oldLocationValue} → ${event.locationValue}</li>`;
      }
      if (oldDescription !== event.description) {
        changesSummary += `<li><strong>Description:</strong> Updated</li>`;
      }
      changesSummary += '</ul>';

      // Send email to each registered user
      if (registrations.length > 0) {
        for (const registration of registrations) {
          try {
            const emailHtml = `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #f59e0b;">⚠️ Event Details Updated</h2>
                <p>Dear ${registration.user.fullName},</p>
                <p>The event <strong>${event.eventName}</strong> that you're registered for has been updated.</p>

                <div style="background: #fffbeb; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b;">
                  ${changesSummary}
                </div>

                <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                  <h3 style="margin-top: 0;">📅 Updated Event Details:</h3>
                  <p><strong>Event:</strong> ${event.eventName}</p>
                  <p><strong>Date:</strong> ${new Date(event.startDateTime).toLocaleString()}</p>
                  <p><strong>Location:</strong> ${event.locationType === 'online' ? '🌐 Online Event' : event.locationValue}</p>
                  <p><strong>Description:</strong> ${event.description}</p>
                </div>

                <p style="color: #6b7280; font-size: 14px;">
                  Please check the updated details and make sure you're still able to attend.
                </p>

                <p>Best regards,<br/>EventSync Team</p>
              </div>
            `;

            await axios.post(
              'https://api.brevo.com/v3/smtp/email',
              {
                sender: { email: process.env.BREVO_SENDER_EMAIL || 'chetanshende1111@gmail.com', name: 'EventSync' },
                to: [{ email: registration.user.email }],
                subject: `📢 Event Updated - ${event.eventName}`,
                htmlContent: emailHtml
              },
              {
                headers: {
                  'api-key': process.env.BREVO_API_KEY,
                  'Content-Type': 'application/json'
                }
              }
            );
          } catch (emailError) {
            console.error(`Failed to send update email to ${registration.user.email}:`, emailError);
          }
        }
      }
    } catch (notificationError) {
      console.error('Error sending update notifications:', notificationError);
      // Don't fail the update if notification fails
    }

    res.json(updatedEvent);
  } else {
    res.status(404);
    throw new Error('Event not found');
  }
});

// @desc    Delete event
// @route   DELETE /api/admin/events/:id
// @access  Private
const deleteEvent = asyncHandler(async (req, res) => {
  const event = await Event.findById(req.params.id);

  if (event) {
    // if (event.createdBy.toString() !== req.admin._id.toString()) {
    //     res.status(401);
    //     throw new Error('Not authorized to delete this event');
    // }
    await event.deleteOne();
    res.json({ message: 'Event removed' });
  } else {
    res.status(404);
    throw new Error('Event not found');
  }
});

module.exports = {
  createEvent,
  getEvents,
  getEventById,
  updateEvent,
  deleteEvent
};
