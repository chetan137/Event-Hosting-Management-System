const asyncHandler = require('express-async-handler');
const jwt = require('jsonwebtoken');
const QRCodeModel = require('../models/QRCode');
const Attendance = require('../models/Attendance');
const EventRegistration = require('../models/EventRegistration');
const Event = require('../models/Event');
const User = require('../models/User');
const Feedback = require('../models/Feedback');
const axios = require('axios');

// Helper function to send email
const sendEventEmail = async (to, subject, htmlContent) => {
  try {
    const response = await axios.post(
      'https://api.brevo.com/v3/smtp/email',
      {
        sender: { email: process.env.BREVO_SENDER_EMAIL || 'noreply@eventsync.com', name: 'EventSync' },
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
  }
};

// @desc    Scan and validate QR code
// @route   POST /api/attendance/scan
// @access  Private (Admin)
const scanQRCode = asyncHandler(async (req, res) => {
  const { qrToken } = req.body;
  console.log(`\n📱 [SCAN] Received scan request`);
  console.log(`📱 [SCAN] Token length: ${qrToken?.length}, Token value: "${qrToken}"`);
  console.log(`📱 [SCAN] Token type: ${typeof qrToken}`);

  if (!qrToken) {
    res.status(400);
    throw new Error('QR token or Attendance ID is required');
  }

  // Clean up the token (trim and remove special chars)
  const cleanToken = qrToken.trim();
  console.log(`📱 [SCAN] Cleaned token length: ${cleanToken.length}, value: "${cleanToken}"`);

  let registration;
  let qrCode;

  // Check if input is Attendance ID (12 character registration ID) or QR token
  // MongoDB ObjectID format: 24 hex chars, but we show first 12 chars to user (lowercase)
  // User input might be uppercase, so we normalize to lowercase
  if (cleanToken.length === 12) {
    console.log(`📱 [SCAN] Token is 12 characters, checking if it's an Attendance ID...`);
    const normalizedToken = cleanToken.toLowerCase();
    console.log(`📱 [SCAN] Normalized token: "${normalizedToken}"`);
    
    // Check if it's valid hex
    if (/^[a-f0-9]+$/.test(normalizedToken)) {
      // It's an Attendance ID - look up registration directly
      console.log(`🔍 [ATTENDANCE] Looking up by Attendance ID: ${cleanToken}`);
      
      try {
        // Find registration by checking if toString() of ObjectID starts with provided ID
        const allRegs = await EventRegistration.find().select('_id status');
        console.log(`🔍 [ATTENDANCE] Total registrations in DB: ${allRegs.length}`);
        
        registration = allRegs.find(reg => {
          const regIdStr = reg._id.toString().toLowerCase();
          const match = regIdStr.startsWith(normalizedToken);
          if (match) {
            console.log(`🔍 [ATTENDANCE] MATCHED! Registration ID: ${reg._id}, Starts with: ${normalizedToken}`);
          }
          return match;
        });
        
        if (!registration) {
          console.error(`❌ [ATTENDANCE] No registration found starting with: ${normalizedToken}`);
          res.status(404);
          throw new Error('Attendance ID not found');
        }
        
        // Re-fetch with populated data
        registration = await EventRegistration.findById(registration._id);
        console.log(`✅ [ATTENDANCE] Found registration: ${registration._id}`);
      } catch (regError) {
        console.error(`❌ [ATTENDANCE] Error looking up by Attendance ID:`, regError.message);
        if (res.statusCode !== 404) {
          throw regError;
        }
        throw regError;
      }
    } else {
      console.log(`❌ [SCAN] 12-char token is not valid hex: "${normalizedToken}"`);
      // Not a valid hex, treat as QR token
      console.log(`🔍 [ATTENDANCE] Treating as QR token...`);
      // Continue to QR token processing below
    }
  }

  // If not found as Attendance ID or token is longer than 12, treat as QR token
  if (!registration) {
    console.log(`🔍 [ATTENDANCE] Processing as QR token...`);
    
    // Verify JWT token
    let decoded;
    try {
      decoded = jwt.verify(cleanToken, process.env.JWT_SECRET);
      console.log(`✅ [ATTENDANCE] JWT decoded successfully`);
    } catch (error) {
      console.error(`❌ [ATTENDANCE] JWT verification failed:`, error.message);
      res.status(400);
      throw new Error('Invalid or expired QR code');
    }

    // Find QR code in database
    qrCode = await QRCodeModel.findOne({ qrToken: cleanToken })
      .populate('event')
      .populate('user')
      .populate('registration');

    if (!qrCode) {
      console.error(`❌ [ATTENDANCE] QR code not found in database`);
      res.status(404);
      throw new Error('QR code not found');
    }

    registration = qrCode.registration;
    console.log(`✅ [ATTENDANCE] Found QR code, registration: ${registration._id}`);
  }

  // Populate data if not already populated
  console.log(`📋 [SCAN] Populating registration data...`);
  try {
    if (!registration.event) await registration.populate('event');
    if (!registration.user) await registration.populate('user');
    console.log(`✅ [SCAN] Registration populated - User: ${registration.user?.fullName}, Event: ${registration.event?.eventName}`);
  } catch (err) {
    console.error(`❌ [SCAN] Error populating registration:`, err.message);
    throw err;
  }

  // Check if registration is approved
  if (registration.status !== 'approved') {
    console.error(`❌ [SCAN] Registration not approved - Status: ${registration.status}`);
    res.status(400);
    throw new Error('Registration is not approved');
  }

  // Check if already attended (unless using different QR codes)
  const existingAttendance = await Attendance.findOne({
    event: registration.event._id,
    user: registration.user._id
  });

  if (existingAttendance) {
    res.status(400);
    throw new Error('User has already checked in for this event');
  }

  // Mark QR code as used (if using QR token)
  if (qrCode) {
    // Check if already used
    if (qrCode.isUsed) {
      res.status(400);
      throw new Error('QR code has already been scanned');
    }

    // Check if expired
    if (qrCode.isExpired || new Date() > qrCode.expiresAt) {
      qrCode.isExpired = true;
      await qrCode.save();
      res.status(400);
      throw new Error('QR code has expired');
    }

    qrCode.isUsed = true;
    qrCode.isExpired = true;
    qrCode.scannedAt = new Date();
    qrCode.scannedBy = req.user._id; // Admin who scanned
    await qrCode.save();
  }

  // Create attendance record
  const attendance = await Attendance.create({
    event: registration.event._id,
    user: registration.user._id,
    registration: registration._id,
    qrCode: qrCode ? qrCode._id : null,
    scannedBy: req.user._id,
    scanTime: new Date(),
    scanMethod: qrCode ? 'qr_code' : 'manual_id' // Track how attendance was marked
  });

  // Send confirmation email with feedback prompt
  try {
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #10b981;">✅ Welcome to ${registration.event.eventName}!</h2>
        <p>Hi ${registration.user.fullName},</p>
        <p>🎉 Your attendance has been successfully recorded!</p>

        <div style="background: #d1fae5; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
          <h3 style="color: #065f46; margin-top: 0;">✨ Check-in Confirmed ✨</h3>
          <p style="font-size: 48px; margin: 10px 0;">🎊</p>
          <p style="color: #047857; margin: 0;">
            <strong>Event:</strong> ${registration.event.eventName}<br>
            <strong>Time:</strong> ${new Date().toLocaleString()}
          </p>
        </div>

        <div style="background: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 0; color: #92400e;">
            <strong>📝 We'd love your feedback!</strong><br>
            After the event, please share your experience to help us improve future events.
            You can submit feedback from your dashboard.
          </p>
        </div>

        <p>Enjoy the event! 🎉</p>
        <p>Best regards,<br/>EventSync Team</p>
      </div>
    `;

    await sendEventEmail(
      registration.user.email,
      `✅ Check-in Confirmed - ${registration.event.eventName}`,
      emailHtml
    );
  } catch (emailError) {
    console.error('Failed to send confirmation email:', emailError);
  }

  console.log(`✅ [ATTENDANCE] Successfully marked attendance for ${registration.user.fullName}`);

  res.json({
    success: true,
    message: '✅ Attendance recorded successfully!',
    attendance: {
      ...attendance.toObject(),
      userName: registration.user.fullName,
      userEmail: registration.user.email,
      eventName: registration.event.eventName
    },
    playSound: true // Signal to play success sound
  });
});

// @desc    Get attendance list for an event
// @route   GET /api/attendance/event/:eventId
// @access  Private (Admin)
const getEventAttendance = asyncHandler(async (req, res) => {
  const attendance = await Attendance.find({ event: req.params.eventId })
    .populate('user', 'fullName email')
    .populate('scannedBy', 'username')
    .sort({ scanTime: -1 });

  const event = await Event.findById(req.params.eventId);
  const totalRegistrations = await EventRegistration.countDocuments({
    event: req.params.eventId,
    status: 'approved'
  });

  res.json({
    event: event.eventName,
    totalRegistrations,
    totalAttendance: attendance.length,
    attendanceRate: totalRegistrations > 0 ? ((attendance.length / totalRegistrations) * 100).toFixed(2) : 0,
    attendance
  });
});

// @desc    Submit feedback for attended event
// @route   POST /api/feedback
// @access  Private (User)
const submitFeedback = asyncHandler(async (req, res) => {
  const { eventId, rating, comment } = req.body;

  if (!eventId || !rating) {
    res.status(400);
    throw new Error('Event ID and rating are required');
  }

  if (rating < 1 || rating > 5) {
    res.status(400);
    throw new Error('Rating must be between 1 and 5');
  }

  // Check if user attended the event
  const attendance = await Attendance.findOne({
    event: eventId,
    user: req.user._id
  });

  if (!attendance) {
    res.status(400);
    throw new Error('You must attend the event to submit feedback');
  }

  // Check if feedback already submitted
  const existingFeedback = await Feedback.findOne({
    event: eventId,
    user: req.user._id
  });

  if (existingFeedback) {
    res.status(400);
    throw new Error('You have already submitted feedback for this event');
  }

  // Create feedback
  const feedback = await Feedback.create({
    event: eventId,
    user: req.user._id,
    attendance: attendance._id,
    rating,
    comment: comment || ''
  });

  // Update attendance record
  attendance.feedbackSubmitted = true;
  await attendance.save();

  res.status(201).json({
    message: '🎉 Thank you for your feedback!',
    feedback
  });
});

// @desc    Get feedback for an event
// @route   GET /api/feedback/event/:eventId
// @access  Private (Admin)
const getEventFeedback = asyncHandler(async (req, res) => {
  const feedback = await Feedback.find({ event: req.params.eventId })
    .populate('user', 'fullName email')
    .sort({ submittedAt: -1 });

  const totalFeedback = feedback.length;
  const averageRating = totalFeedback > 0
    ? (feedback.reduce((sum, f) => sum + f.rating, 0) / totalFeedback).toFixed(2)
    : 0;

  const ratingDistribution = {
    5: feedback.filter(f => f.rating === 5).length,
    4: feedback.filter(f => f.rating === 4).length,
    3: feedback.filter(f => f.rating === 3).length,
    2: feedback.filter(f => f.rating === 2).length,
    1: feedback.filter(f => f.rating === 1).length
  };

  res.json({
    totalFeedback,
    averageRating,
    ratingDistribution,
    feedback
  });
});

// @desc    Get user's feedback history
// @route   GET /api/feedback/my-feedback
// @access  Private (User)
const getMyFeedback = asyncHandler(async (req, res) => {
  const feedback = await Feedback.find({ user: req.user._id })
    .populate('event', 'eventName startDateTime')
    .sort({ submittedAt: -1 });

  res.json(feedback);
});

module.exports = {
  scanQRCode,
  getEventAttendance,
  submitFeedback,
  getEventFeedback,
  getMyFeedback
};
