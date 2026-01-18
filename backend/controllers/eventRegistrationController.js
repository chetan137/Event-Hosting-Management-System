const asyncHandler = require('express-async-handler');
const Event = require('../models/Event');
const EventRegistration = require('../models/EventRegistration');
const User = require('../models/User');
const axios = require('axios');
const QRCode = require('qrcode');
const jwt = require('jsonwebtoken');
const QRCodeModel = require('../models/QRCode');

// Helper function to calculate event status
const getEventStatus = (event) => {
  const now = new Date();
  const start = new Date(event.startDateTime);
  const end = new Date(event.endDateTime);

  if (now < start) return 'upcoming';
  if (now >= start && now <= end) return 'live';
  return 'completed';
};

// Helper function to generate QR code for registration
const generateQRForRegistration = async (registration) => {
  try {
    // Check if QR already exists
    let qrDoc = await QRCodeModel.findOne({
      event: registration.event._id,
      user: registration.user._id,
      registration: registration._id
    });

    if (qrDoc && !qrDoc.isExpired) {
      return qrDoc;
    }

    // Create JWT token (unique to this registration)
    const qrToken = jwt.sign(
      {
        registrationId: registration._id,
        userId: registration.user._id,
        eventId: registration.event._id,
        timestamp: Date.now(),
        nonce: Math.random().toString(36).substr(2, 9)
      },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );

    // Generate QR code image
    const qrCodeImage = await QRCode.toDataURL(qrToken, {
      errorCorrectionLevel: 'H',
      type: 'image/png',
      width: 400,
      margin: 2
    });

    // Calculate expiry (event end time + 1 hour)
    const expiresAt = new Date(registration.event.endDateTime);
    expiresAt.setHours(expiresAt.getHours() + 1);

    // Create or update QR code
    if (qrDoc) {
      qrDoc.qrToken = qrToken;
      qrDoc.qrCodeImage = qrCodeImage;
      qrDoc.expiresAt = expiresAt;
      qrDoc.isUsed = false;
      qrDoc.isExpired = false;
      qrDoc = await qrDoc.save();
    } else {
      qrDoc = await QRCodeModel.create({
        event: registration.event._id,
        user: registration.user._id,
        registration: registration._id,
        qrToken,
        qrCodeImage,
        expiresAt,
        isUsed: false,
        isExpired: false
      });
    }

    return qrDoc;
  } catch (error) {
    console.error('Error generating QR:', error);
    throw error;
  }
};

// Helper function to send email via Brevo
const sendEventEmail = async (to, subject, htmlContent) => {
  if (!process.env.BREVO_API_KEY) {
    console.error('FATAL CORTEX ERROR: BREVO_API_KEY is missing in environment variables!');
  }

  try {
    const response = await axios.post(
      'https://api.brevo.com/v3/smtp/email',
      {
        sender: { email: process.env.BREVO_SENDER_EMAIL || 'chetanshende1111@gmail.com', name: 'EventSync' },
        to: [{ email: to }],
        subject: subject,
        htmlContent: htmlContent
      },
      {
        headers: {
          'api-key': process.env.BREVO_API_KEY,
          'Content-Type': 'application/json'
        }
      }
    );
    return response.data;
  } catch (error) {
    console.error('Email sending failed:', error.response?.data || error.message);
    throw error;
  }
};

// @desc    Get all public events for users
// @route   GET /api/events
// @access  Public
const getPublicEvents = asyncHandler(async (req, res) => {
  const { status } = req.query;

  const events = await Event.find({ visibility: 'public' }).sort({ startDateTime: 1 });

  // Add status and registration count to each event
  const eventsWithStatus = await Promise.all(events.map(async (event) => {
    const eventStatus = getEventStatus(event);
    const registrationCount = await EventRegistration.countDocuments({
      event: event._id,
      status: { $in: ['approved', 'pending'] }
    });

    return {
      ...event.toObject(),
      status: eventStatus,
      registeredUsers: registrationCount,
      spotsLeft: event.capacity ? event.capacity - registrationCount : null
    };
  }));

  // Filter by status if provided
  const filteredEvents = status
    ? eventsWithStatus.filter(e => e.status === status)
    : eventsWithStatus;

  res.json(filteredEvents);
});

// @desc    Get event details by ID
// @route   GET /api/events/:id
// @access  Public
const getEventDetails = asyncHandler(async (req, res) => {
  const event = await Event.findById(req.params.id);

  if (!event) {
    res.status(404);
    throw new Error('Event not found');
  }

  const eventStatus = getEventStatus(event);
  const registrationCount = await EventRegistration.countDocuments({
    event: event._id,
    status: { $in: ['approved', 'pending'] }
  });

  res.json({
    ...event.toObject(),
    status: eventStatus,
    registeredUsers: registrationCount,
    spotsLeft: event.capacity ? event.capacity - registrationCount : null
  });
});

// @desc    Register user for an event
// @route   POST /api/events/:id/register
// @access  Private (User)
const registerForEvent = asyncHandler(async (req, res) => {
  // Check if user is an admin
  if (req.user.role === 'admin') {
    res.status(403);
    throw new Error('Admins cannot register for events');
  }

  const event = await Event.findById(req.params.id);

  if (!event) {
    res.status(404);
    throw new Error('Event not found');
  }

  // Check if event is public
  if (event.visibility !== 'public') {
    res.status(403);
    throw new Error('This event is private');
  }

  // Check if event has ended
  const now = new Date();
  const eventEndTime = new Date(event.endDateTime);
  if (now > eventEndTime) {
    res.status(400);
    throw new Error('This event has already ended. You cannot register for past events');
  }

  // Check registration deadline
  if (event.registrationDeadline) {
    const registrationDeadline = new Date(event.registrationDeadline);
    if (now > registrationDeadline) {
      res.status(400);
      throw new Error('Registration deadline has passed. You can no longer register for this event');
    }
  }

  // Check capacity
  const registrationCount = await EventRegistration.countDocuments({
    event: event._id,
    status: { $in: ['approved', 'pending'] }
  });

  if (event.capacity && registrationCount >= event.capacity) {
    res.status(400);
    throw new Error('Event is full');
  }

  // Check if user already registered
  const existingRegistration = await EventRegistration.findOne({
    event: event._id,
    user: req.user._id
  });

  if (existingRegistration) {
    res.status(400);
    throw new Error('You are already registered for this event');
  }

  // Create registration
  const registration = await EventRegistration.create({
    event: event._id,
    user: req.user._id,
    status: event.requireApproval ? 'pending' : 'approved',
    paymentStatus: event.ticketType === 'paid' ? 'pending' : 'not_required'
  });

  // Populate for email and QR generation
  await registration.populate('user');
  await registration.populate('event');
  const populatedReg = registration;

  // Send confirmation email
  try {
    let qrCodeHtml = '';
    let qrImage = null;

    // If auto-approved, generate QR code immediately
    if (!event.requireApproval) {
      try {
        const qrDoc = await generateQRForRegistration(populatedReg);
        qrImage = qrDoc.qrCodeImage;
        qrCodeHtml = `
          <div style="text-align: center; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #4f46e5;">🎟️ Your Entry QR Code:</h3>
            <img src="${qrImage}" alt="QR Code" style="width: 250px; height: 250px; border: 3px solid #4f46e5; border-radius: 12px; padding: 10px; background: white;"/>
            <p style="font-size: 14px; color: #6b7280; margin-top: 15px; max-width: 100%; word-wrap: break-word;">
              <strong>📱 Important:</strong> Save this QR code or screenshot. Show it at the event entrance.
            </p>
            <p style="font-size: 12px; color: #ef4444; background: #fef2f2; padding: 12px; border-radius: 8px; border-left: 4px solid #ef4444;">
              ⚠️ This QR code is unique to you. Do not share it!
            </p>
          </div>
        `;
      } catch (qrError) {
        console.error('Error generating QR code:', qrError);
        qrCodeHtml = '<p style="color: #6b7280; font-size: 12px;">QR code will be available in your dashboard.</p>';
      }
    }

    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #4f46e5;">✅ Event Registration Confirmation</h2>
        <p>Dear ${req.user.fullName},</p>
        <p>Thank you for registering for <strong>${event.eventName}</strong>!</p>

        <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0;">📅 Event Details:</h3>
          <p><strong>Event:</strong> ${event.eventName}</p>
          <p><strong>Date:</strong> ${new Date(event.startDateTime).toLocaleString()}</p>
          <p><strong>Location:</strong> ${event.locationType === 'online' ? '🌐 Online Event' : event.locationValue}</p>
          ${event.locationType === 'online' ? `<p><strong>Link:</strong> <a href="${event.locationValue}">${event.locationValue}</a></p>` : ''}
          <p><strong>Status:</strong> ${event.requireApproval ? '⏳ Pending Approval' : '✅ Confirmed'}</p>
        </div>

        ${qrCodeHtml}

        <p style="color: #6b7280; font-size: 14px;">
          ${event.requireApproval
            ? 'Your registration is pending approval. You will receive another email with your QR code once approved.'
            : 'Your registration is confirmed! We look forward to seeing you at the event.'}
        </p>

        <p style="color: #6b7280; font-size: 12px; margin-top: 30px;">
          You can also view your QR code anytime in your dashboard under "My Events".
        </p>

        <p>Best regards,<br/>EventSync Team</p>
      </div>
    `;

    await sendEventEmail(
      req.user.email,
      `Registration Confirmation - ${event.eventName}`,
      emailHtml
    );
  } catch (emailError) {
    console.error('Failed to send confirmation email:', emailError);
    // Don't fail the registration if email fails
  }

  res.status(201).json({
    message: 'Successfully registered for event',
    registration,
    status: event.requireApproval ? 'pending' : 'approved'
  });
});

// @desc    Get user's registered events
// @route   GET /api/events/my-events
// @access  Private (User)
const getMyEvents = asyncHandler(async (req, res) => {
  const registrations = await EventRegistration.find({ user: req.user._id })
    .populate('event')
    .sort({ registrationDate: -1 });

  const myEvents = registrations.map(reg => ({
    ...reg.event.toObject(),
    registrationStatus: reg.status,
    registrationDate: reg.registrationDate,
    registrationId: reg._id,
    eventStatus: getEventStatus(reg.event)
  }));

  res.json(myEvents);
});

// @desc    Cancel event registration
// @route   DELETE /api/events/:id/register
// @access  Private (User)
const cancelRegistration = asyncHandler(async (req, res) => {
  // Check if user is an admin
  if (req.user.role === 'admin') {
    res.status(403);
    throw new Error('Admins cannot cancel event registrations');
  }

  const registration = await EventRegistration.findOne({
    event: req.params.id,
    user: req.user._id
  });

  if (!registration) {
    res.status(404);
    throw new Error('Registration not found');
  }

  await registration.deleteOne();
  res.json({ message: 'Registration cancelled successfully' });
});

// @desc    Get event attendees
// @route   GET /api/events/:id/attendees
// @access  Public
const getEventAttendees = asyncHandler(async (req, res) => {
  const registrations = await EventRegistration.find({
    event: req.params.id,
    status: { $in: ['approved', 'pending'] }
  }).populate('user', 'fullName email avatar');

  const attendees = registrations.map(reg => ({
    _id: reg._id,
    name: reg.user?.fullName || 'Anonymous',
    email: reg.user?.email,
    status: reg.status,
    registeredAt: reg.createdAt
  }));

  res.json(attendees);
});

module.exports = {
  getPublicEvents,
  getEventDetails,
  registerForEvent,
  getMyEvents,
  cancelRegistration,
  getEventAttendees
};
