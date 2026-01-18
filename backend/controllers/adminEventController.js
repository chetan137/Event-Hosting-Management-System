const asyncHandler = require('express-async-handler');
const Event = require('../models/Event');
const EventRegistration = require('../models/EventRegistration');
const User = require('../models/User');
const QRCodeModel = require('../models/QRCode');
const QRCode = require('qrcode');
const jwt = require('jsonwebtoken');
const axios = require('axios');

// Helper function to send email via Brevo
const sendEventEmail = async (to, subject, htmlContent) => {
  if (!process.env.BREVO_API_KEY) {
    console.error('🔴 BREVO_API_KEY is missing in environment variables!');
    throw new Error('Email service not configured');
  }

  try {
    console.log(`\n📨 [EMAIL] Sending to: ${to}`);
    console.log(`📨 [EMAIL] Subject: ${subject}`);
    console.log(`📨 [EMAIL] API Key exists: ${process.env.BREVO_API_KEY ? 'YES' : 'NO'}`);
    
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
    console.log(`✅ [BREVO] Email sent successfully. Message ID:`, response.data?.messageId || 'N/A');
    return response.data;
  } catch (error) {
    console.error(`\n❌ [BREVO ERROR] Failed to send email:`);
    console.error(`Status:`, error.response?.status);
    console.error(`Message:`, error.response?.data?.message || error.message);
    console.error(`Errors:`, error.response?.data?.errors);
    throw error;
  }
};

// Helper to generate QR
const generateQRForRegistration = async (registration) => {
    console.log(`🎟️ [QR] Starting QR generation for registration ${registration._id}`);
    
    // Check if exists
    let qrDoc = await QRCodeModel.findOne({
        event: registration.event._id,
        user: registration.user._id,
        registration: registration._id
     });

     if (!qrDoc) {
        console.log(`🎟️ [QR] QR doesn't exist, creating new one...`);
        
        // Create Token
        const qrToken = jwt.sign(
           {
             id: registration.user._id,
             eventId: registration.event._id,
             registrationId: registration._id,
             type: 'event_entry'
           },
           process.env.JWT_SECRET,
           { expiresIn: '30d' }
        );

        // Generate QR Code Image FIRST
        const qrCodeImage = await QRCode.toDataURL(qrToken, {
          errorCorrectionLevel: 'H',
          type: 'image/png',
          width: 300,
          margin: 1
        });
        
        console.log(`✅ [QR] QR image generated (${qrCodeImage.length} bytes)`);

        // Create DB Entry with the image
        qrDoc = await QRCodeModel.create({
            event: registration.event._id,
            user: registration.user._id,
            registration: registration._id,
            qrToken: qrToken,
            qrCodeImage: qrCodeImage,
            isUsed: false,
            isExpired: false,
            expiresAt: new Date(new Date().setDate(new Date().getDate() + 30))
        });
        
        console.log(`✅ [QR] QR document saved to database`);
     } else {
        console.log(`🎟️ [QR] QR already exists, using existing`);
     }

     // Return the image data URL
     console.log(`✅ [QR] Returning QR image (${qrDoc.qrCodeImage ? qrDoc.qrCodeImage.length : 0} bytes)`);
     return qrDoc.qrCodeImage;
};

// @desc    Get all registrations for an event
// @route   GET /api/admin/events/:id/registrations
// @access  Private (Admin)
const getEventRegistrations = asyncHandler(async (req, res) => {
  const event = await Event.findById(req.params.id);

  if (!event) {
    res.status(404);
    throw new Error('Event not found');
  }

  const registrations = await EventRegistration.find({ event: req.params.id })
    .populate('user', 'fullName email')
    .sort({ registrationDate: -1 });

  res.json(registrations);
});

// @desc    Approve or reject registration
// @route   PUT /api/admin/events/:eventId/registrations/:registrationId
// @access  Private (Admin)
const updateRegistrationStatus = asyncHandler(async (req, res) => {
  const { status } = req.body; // 'approved' or 'rejected'

  console.log(`\n🔵 [APPROVAL] Starting approval process for registration: ${req.params.registrationId}, Status: ${status}`);

  if (!['approved', 'rejected'].includes(status)) {
    res.status(400);
    throw new Error('Invalid status. Must be approved or rejected');
  }

  let registration = await EventRegistration.findById(req.params.registrationId);
  console.log(`✅ Found registration:`, registration ? 'YES' : 'NO');

  if (!registration) {
    res.status(404);
    throw new Error('Registration not found');
  }

  // Populate user
  await registration.populate('user');
  console.log(`✅ User populated:`, registration.user?.email || 'FAILED');
  
  // Populate event
  await registration.populate('event');
  console.log(`✅ Event populated:`, registration.event?.eventName || 'FAILED');

  registration.status = status;
  await registration.save();
  console.log(`✅ Status saved: ${status}`);
  await registration.save();

  // Send email notification
  try {
    console.log(`\n📧 Preparing email for ${registration.user.email}...`);
    
    let qrImage = null;
    if (status === 'approved') {
      console.log(`🎟️ Generating QR code...`);
      try {
        qrImage = await generateQRForRegistration(registration);
        console.log(`✅ QR code generated`);
      } catch (qrError) {
        console.error(`❌ QR generation failed:`, qrError.message);
      }
    }

    const emailHtml = status === 'approved'
      ? `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
          <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; border-radius: 12px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px;">✅ Registration Approved!</h1>
          </div>
          
          <p style="font-size: 16px; margin: 20px 0;">Dear <strong>${registration.user.fullName}</strong>,</p>
          <p style="font-size: 16px; line-height: 1.6;">Great news! Your registration for <strong style="color: #10b981;">${registration.event.eventName}</strong> has been approved! 🎉</p>

          <div style="background: #f3f4f6; padding: 20px; border-radius: 12px; margin: 20px 0; border-left: 4px solid #10b981;">
            <h3 style="margin-top: 0; color: #1f2937;">📅 Event Details:</h3>
            <p><strong>Event:</strong> ${registration.event.eventName}</p>
            <p><strong>Date & Time:</strong> ${new Date(registration.event.startDateTime).toLocaleString()}</p>
            <p><strong>Location:</strong> ${registration.event.locationType === 'online' ? '🌐 Online Event' : '📍 ' + registration.event.locationValue}</p>
          </div>

          <div style="text-align: center; margin: 30px 0; padding: 20px; background: #f0f9ff; border-radius: 12px; border: 2px dashed #0ea5e9;">
            <p style="color: #0369a1; font-weight: bold; font-size: 16px; margin: 0 0 15px 0;">🎟️ Your Entry QR Code:</p>
            ${qrImage ? `<img src="${qrImage}" alt="QR Code" style="width: 200px; height: 200px; border: 3px solid #0ea5e9; border-radius: 8px; margin: 10px auto; display: block;"/>` : '<p style="color: #ef4444;">QR code will be available in your event dashboard</p>'}
            <p style="font-size: 14px; color: #0369a1; margin: 15px 0 0 0;"><strong>📱 Important:</strong> Save or screenshot this QR code. Show it at the event entrance.</p>
            
            <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #0ea5e9;">
              <p style="color: #0369a1; font-weight: bold; font-size: 14px; margin: 0 0 8px 0;">📇 Manual Attendance ID:</p>
              <p style="font-family: monospace; font-size: 18px; font-weight: bold; color: #0369a1; margin: 0; letter-spacing: 2px;">${registration._id.toString().substring(0, 12).toUpperCase()}</p>
              <p style="font-size: 12px; color: #0369a1; margin: 8px 0 0 0;">Use this ID if QR code cannot be scanned at event entrance</p>
            </div>
          </div>

          <div style="background: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b;">
            <p style="margin: 0; color: #b45309;"><strong>⚠️ Do not share:</strong> This QR code and Attendance ID are unique to you and cannot be transferred to another person.</p>
          </div>

          <p style="font-size: 14px; color: #666; margin-top: 30px;">You can also view your QR code anytime in your dashboard under "My Events".</p>

          <p style="font-size: 14px; margin-top: 30px;">We look forward to seeing you at the event!</p>
          <p style="font-size: 14px; margin: 0;"><strong>Best regards,</strong><br/><span style="color: #10b981;">EventSync Team</span></p>
        </div>
      `
      : `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
          <div style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); padding: 30px; border-radius: 12px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px;">Registration Update</h1>
          </div>
          
          <p style="font-size: 16px; margin: 20px 0;">Dear <strong>${registration.user.fullName}</strong>,</p>
          <p style="font-size: 16px; line-height: 1.6;">We regret to inform you that your registration for <strong style="color: #ef4444;">${registration.event.eventName}</strong> could not be approved at this time.</p>
          
          <p style="font-size: 14px; color: #666; margin-top: 20px;">If you have any questions, please don't hesitate to contact us.</p>

          <p style="font-size: 14px; margin-top: 30px;"><strong>Best regards,</strong><br/><span style="color: #ef4444;">EventSync Team</span></p>
        </div>
      `;

    console.log(`📤 Sending email via Brevo to ${registration.user.email}...`);
    const emailResult = await sendEventEmail(
      registration.user.email,
      `Registration ${status === 'approved' ? 'Approved ✅' : 'Update'} - ${registration.event.eventName}`,
      emailHtml
    );
    console.log(`✅ [SUCCESS] Email sent to ${registration.user.email}`);
  } catch (emailError) {
    console.error(`\n❌ [EMAIL ERROR] Failed to send email:`, emailError.message);
    if (emailError.response?.data) {
      console.error(`API Response:`, emailError.response.data);
    }
  }

  res.json({
    message: `Registration ${status}`,
    registration
  });
});

// @desc    Manually add user to event
// @route   POST /api/admin/events/:id/add-user
// @access  Private (Admin)
const addUserToEvent = asyncHandler(async (req, res) => {
  const { userId } = req.body;

  let event = await Event.findById(req.params.id);
  if (!event) {
    res.status(404);
    throw new Error('Event not found');
  }

  const user = await User.findById(userId);
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  // Check if already registered
  const existing = await EventRegistration.findOne({
    event: event._id,
    user: userId
  });

  if (existing) {
    res.status(400);
    throw new Error('User is already registered for this event');
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

  const registration = await EventRegistration.create({
    event: event._id,
    user: userId,
    status: 'approved', // Admin-added users are auto-approved
    paymentStatus: 'not_required'
  });

  // Re-fetch to populate
  const populatedRegistration = await EventRegistration.findById(registration._id)
      .populate('user')
      .populate('event');

  // Send email with QR
  try {
    const qrImage = await generateQRForRegistration(populatedRegistration);

    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #4f46e5;">You've Been Added to an Event!</h2>
        <p>Dear ${user.fullName},</p>
        <p>You have been registered for <strong>${event.eventName}</strong> by an administrator.</p>

        <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0;">Event Details:</h3>
          <p><strong>Event:</strong> ${event.eventName}</p>
          <p><strong>Date:</strong> ${new Date(event.startDateTime).toLocaleString()}</p>
          <p><strong>Location:</strong> ${event.locationType === 'online' ? 'Online' : event.locationValue}</p>
        </div>

        <div style="text-align: center; margin: 20px 0;">
            <p><strong>Your Entry QR Code:</strong></p>
            <img src="${qrImage}" alt="QR Code" style="width: 200px; height: 200px; border: 2px solid #ddd; border-radius: 8px;"/>
        </div>

        <p>We look forward to seeing you!</p>
        <p>Best regards,<br/>EventSync Team</p>
      </div>
    `;

    await sendEventEmail(
      user.email,
      `Added to Event - ${event.eventName}`,
      emailHtml
    );
  } catch (emailError) {
    console.error('Failed to send email:', emailError);
  }

  res.status(201).json({
    message: 'User added to event successfully',
    registration
  });
});

// @desc    Remove user from event
// @route   DELETE /api/admin/events/:eventId/registrations/:registrationId
// @access  Private (Admin)
const removeUserFromEvent = asyncHandler(async (req, res) => {
  const registration = await EventRegistration.findById(req.params.registrationId);

  if (!registration) {
    res.status(404);
    throw new Error('Registration not found');
  }

  // Also remove QR code if exists
  await QRCodeModel.deleteMany({ registration: registration._id });

  await registration.deleteOne();
  res.json({ message: 'User removed from event' });
});

// @desc    Get event statistics
// @route   GET /api/admin/events/:id/stats
// @access  Private (Admin)
const getEventStats = asyncHandler(async (req, res) => {
  const event = await Event.findById(req.params.id);

  if (!event) {
    res.status(404);
    throw new Error('Event not found');
  }

  const totalRegistrations = await EventRegistration.countDocuments({ event: req.params.id });
  const approvedRegistrations = await EventRegistration.countDocuments({
    event: req.params.id,
    status: 'approved'
  });
  const pendingRegistrations = await EventRegistration.countDocuments({
    event: req.params.id,
    status: 'pending'
  });
  const rejectedRegistrations = await EventRegistration.countDocuments({
    event: req.params.id,
    status: 'rejected'
  });

  res.json({
    eventId: event._id,
    eventName: event.eventName,
    capacity: event.capacity,
    totalRegistrations,
    approvedRegistrations,
    pendingRegistrations,
    rejectedRegistrations,
    spotsLeft: event.capacity ? event.capacity - approvedRegistrations : null
  });
});

module.exports = {
  getEventRegistrations,
  updateRegistrationStatus,
  addUserToEvent,
  removeUserFromEvent,
  getEventStats
};
