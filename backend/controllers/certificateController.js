const asyncHandler = require('express-async-handler');
const crypto = require('crypto');
const QRCode = require('qrcode');
const Certificate = require('../models/Certificate');
const Event = require('../models/Event');
const User = require('../models/User');
const Attendance = require('../models/Attendance');
const EventRegistration = require('../models/EventRegistration');
const { generateCertificatePdf } = require('../services/certificatePdfService');
const axios = require('axios');

// Helper to generate verification hash
const createVerificationHash = (certNumber, userId, eventId, timestamp) => {
  const secret = process.env.JWT_SECRET || 'eventsync_default_secret_key_2026';
  return crypto
    .createHmac('sha256', secret)
    .update(`${certNumber}:${userId}:${eventId}:${timestamp}`)
    .digest('hex');
};

// Helper function to send email via Brevo if configured
const sendCertificateEmail = async (to, recipientName, eventName, certNumber, certUrl) => {
  if (!process.env.BREVO_API_KEY) {
    return;
  }
  try {
    await axios.post(
      'https://api.brevo.com/v3/smtp/email',
      {
        sender: {
          email: process.env.BREVO_SENDER_EMAIL || 'noreply@eventsync.com',
          name: 'EventSync Credential Authority'
        },
        to: [{ email: to, name: recipientName }],
        subject: `🎓 Your Verified Certificate for ${eventName}`,
        htmlContent: `
          <div style="font-family: Arial, sans-serif; background: #0f172a; color: #f8fafc; padding: 30px; border-radius: 12px; max-width: 600px; margin: auto;">
            <h2 style="color: #38bdf8; margin-top: 0;">Congratulations, ${recipientName}! 🎉</h2>
            <p>Your official, verified certificate of completion for <strong>${eventName}</strong> has been generated and cryptographically sealed on the EventSync ledger.</p>
            <div style="background: #1e293b; padding: 18px; border-radius: 8px; margin: 24px 0; border: 1px solid #334155;">
              <p style="margin: 0 0 8px 0; color: #94a3b8; font-size: 13px;">CERTIFICATE ID</p>
              <p style="margin: 0; font-family: monospace; font-size: 18px; color: #00f2fe; font-weight: bold;">${certNumber}</p>
            </div>
            <p>You can view, verify, and download your high-resolution certificate anytime using the link below:</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${certUrl}" style="background: linear-gradient(135deg, #00f2fe, #4facfe); color: #000; padding: 12px 28px; text-decoration: none; font-weight: bold; border-radius: 8px; display: inline-block;">View Verified Certificate</a>
            </div>
            <p style="color: #64748b; font-size: 12px;">This certificate is permanently verifiable online by employers, academic institutions, and peers.</p>
          </div>
        `
      },
      {
        headers: {
          'api-key': process.env.BREVO_API_KEY,
          'Content-Type': 'application/json'
        }
      }
    );
  } catch (error) {
    console.error('Certificate email sending failed:', error.response?.data || error.message);
  }
};

// @desc    Generate a verified certificate for the authenticated user for an event
// @route   POST /api/certificates/generate
// @access  Private (User)
const generateCertificate = asyncHandler(async (req, res) => {
  const { eventId, certificateType = 'completion', isPublic = true } = req.body;

  if (!eventId) {
    res.status(400);
    throw new Error('Event ID is required');
  }

  const event = await Event.findById(eventId);
  if (!event) {
    res.status(404);
    throw new Error('Event not found');
  }

  // Check if certificate already exists
  const existingCert = await Certificate.findOne({
    event: eventId,
    user: req.user._id
  });

  if (existingCert) {
    return res.status(200).json({
      success: true,
      message: 'Certificate already generated',
      certificate: existingCert
    });
  }

  // Check user registration & attendance
  const registration = await EventRegistration.findOne({
    event: eventId,
    user: req.user._id
  });

  const attendance = await Attendance.findOne({
    event: eventId,
    user: req.user._id
  });

  // Verify eligibility:
  // Must either:
  // 1. Have attended (attendance recorded)
  // OR 2. Have approved registration AND event is completed/past endDateTime
  const isEventPast = new Date() >= new Date(event.endDateTime || event.startDateTime);
  const isApproved = registration && registration.status === 'approved';

  if (!attendance && (!isApproved || !isEventPast)) {
    res.status(400);
    throw new Error('Attendance must be verified or event must be completed to claim certificate.');
  }

  // Generate unique Certificate Number
  const randomSuffix = crypto.randomBytes(3).toString('hex').toUpperCase();
  const certNumber = `ES-${new Date().getFullYear()}-${randomSuffix}`;
  const timestamp = Date.now();

  // Verification URL
  const origin = req.headers.origin || 'http://localhost:5173';
  const verificationUrl = `${origin}/verify-certificate/${certNumber}`;

  // Cryptographic HMAC SHA-256 hash
  const verificationHash = createVerificationHash(certNumber, req.user._id, eventId, timestamp);

  // High-resolution QR code data URL
  const qrCodeDataUrl = await QRCode.toDataURL(verificationUrl, {
    errorCorrectionLevel: 'H',
    type: 'image/png',
    width: 400,
    margin: 2,
    color: {
      dark: '#000000',
      light: '#ffffff'
    }
  });

  // Create certificate
  const certificate = await Certificate.create({
    certificateNumber: certNumber,
    user: req.user._id,
    recipientName: req.user.fullName || 'Participant',
    recipientEmail: req.user.email,
    event: eventId,
    eventName: event.eventName,
    eventDate: event.startDateTime,
    eventLocation: event.locationType === 'online' ? 'Online Virtual Room' : (event.locationValue || 'EventSync Venue'),
    attendance: attendance ? attendance._id : null,
    certificateType,
    verificationHash,
    qrCodeDataUrl,
    verificationUrl,
    status: 'active',
    isPublic: Boolean(isPublic),
    issuedAt: new Date(timestamp)
  });

  // Send email in background
  sendCertificateEmail(
    req.user.email,
    req.user.fullName,
    event.eventName,
    certNumber,
    verificationUrl
  ).catch(e => console.error(e));

  res.status(201).json({
    success: true,
    message: 'Certificate successfully generated and verified',
    certificate
  });
});

// @desc    Admin issue verified certificate to any participant
// @route   POST /api/certificates/admin/issue
// @access  Private (Admin)
const issueAdminCertificate = asyncHandler(async (req, res) => {
  const {
    userId,
    eventId,
    certificateType = 'completion',
    isPublic = true,
    skills = [],
    grade,
    customNote = '',
    featured = false
  } = req.body;

  if (!userId || !eventId) {
    res.status(400);
    throw new Error('User ID and Event ID are required');
  }

  const [user, event] = await Promise.all([
    User.findById(userId),
    Event.findById(eventId)
  ]);

  if (!user || !event) {
    res.status(404);
    throw new Error('User or Event not found');
  }

  // Check if exists
  let certificate = await Certificate.findOne({ event: eventId, user: userId });

  const randomSuffix = crypto.randomBytes(3).toString('hex').toUpperCase();
  const certNumber = certificate ? certificate.certificateNumber : `ES-${new Date().getFullYear()}-${randomSuffix}`;
  const timestamp = Date.now();
  const origin = req.headers.origin || 'http://localhost:5173';
  const verificationUrl = `${origin}/verify-certificate/${certNumber}`;
  const verificationHash = createVerificationHash(certNumber, userId, eventId, timestamp);

  const qrCodeDataUrl = await QRCode.toDataURL(verificationUrl, {
    errorCorrectionLevel: 'H',
    type: 'image/png',
    width: 400,
    margin: 2
  });

  if (certificate) {
    certificate.certificateType = certificateType;
    certificate.isPublic = isPublic;
    certificate.featured = featured;
    certificate.skills = skills;
    certificate.grade = grade || null;
    certificate.customNote = customNote;
    certificate.verificationHash = verificationHash;
    certificate.qrCodeDataUrl = qrCodeDataUrl;
    certificate.verificationUrl = verificationUrl;
    await certificate.save();
  } else {
    certificate = await Certificate.create({
      certificateNumber: certNumber,
      user: userId,
      recipientName: user.fullName,
      recipientEmail: user.email,
      event: eventId,
      eventName: event.eventName,
      eventDate: event.startDateTime,
      eventLocation: event.locationType === 'online' ? 'Online Virtual Room' : (event.locationValue || 'EventSync Venue'),
      certificateType,
      verificationHash,
      qrCodeDataUrl,
      verificationUrl,
      status: 'active',
      isPublic,
      featured,
      skills,
      grade,
      customNote,
      issuedAt: new Date(timestamp)
    });
  }

  res.status(200).json({
    success: true,
    message: 'Certificate issued successfully',
    certificate
  });
});

// @desc    Get logged in user's certificates
// @route   GET /api/certificates/my-certificates
// @access  Private (User)
const getMyCertificates = asyncHandler(async (req, res) => {
  const certificates = await Certificate.find({ user: req.user._id })
    .populate('event', 'eventName coverImage theme startDateTime endDateTime locationType locationValue')
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    count: certificates.length,
    certificates
  });
});

// @desc    Get single certificate by ID or Certificate Number
// @route   GET /api/certificates/:identifier
// @access  Public
const getCertificateByIdOrNumber = asyncHandler(async (req, res) => {
  const { identifier } = req.params;

  const isObjectId = identifier.match(/^[0-9a-fA-F]{24}$/);
  const query = isObjectId ? { _id: identifier } : { certificateNumber: identifier.toUpperCase() };

  const certificate = await Certificate.findOne(query)
    .populate('event', 'eventName coverImage theme startDateTime endDateTime locationType locationValue description')
    .populate('user', 'fullName email');

  if (!certificate) {
    res.status(404);
    throw new Error('Certificate not found');
  }

  res.status(200).json({
    success: true,
    certificate
  });
});

// @desc    Public verification endpoint for third parties and employers
// @route   GET /api/certificates/verify/:certificateNumber
// @access  Public
const verifyCertificate = asyncHandler(async (req, res) => {
  const { certificateNumber } = req.params;

  if (!certificateNumber) {
    res.status(400);
    throw new Error('Certificate number is required');
  }

  const certificate = await Certificate.findOne({
    certificateNumber: certificateNumber.trim().toUpperCase()
  }).populate('event', 'eventName theme startDateTime endDateTime locationType locationValue createdBy');

  if (!certificate) {
    return res.status(404).json({
      verified: false,
      status: 'not_found',
      message: 'Certificate record not found on the EventSync registry.'
    });
  }

  const isValid = certificate.status === 'active';

  // Mask recipient email for privacy (e.g. j***@domain.com)
  const maskEmail = (email) => {
    if (!email) return '';
    const [user, domain] = email.split('@');
    if (!domain) return email;
    return `${user.charAt(0)}***@${domain}`;
  };

  res.status(200).json({
    verified: isValid,
    status: certificate.status,
    message: isValid ? 'Certificate is authentic, verified, and active.' : 'This certificate has been revoked.',
    details: {
      certificateNumber: certificate.certificateNumber,
      recipientName: certificate.recipientName,
      recipientEmailMasked: maskEmail(certificate.recipientEmail),
      eventName: certificate.eventName,
      eventDate: certificate.eventDate,
      eventLocation: certificate.eventLocation,
      certificateType: certificate.certificateType,
      issuedAt: certificate.issuedAt,
      issuer: certificate.issuedBy || 'EventSync Credential Authority',
      verificationHash: certificate.verificationHash,
      skills: certificate.skills || [],
      grade: certificate.grade,
      isPublic: certificate.isPublic
    }
  });
});

// @desc    Download certificate as a high-res PDF
// @route   GET /api/certificates/:identifier/pdf
// @access  Public
const downloadCertificatePdf = asyncHandler(async (req, res) => {
  const { identifier } = req.params;

  const isObjectId = identifier.match(/^[0-9a-fA-F]{24}$/);
  const query = isObjectId ? { _id: identifier } : { certificateNumber: identifier.toUpperCase() };

  const certificate = await Certificate.findOne(query);

  if (!certificate) {
    res.status(404);
    throw new Error('Certificate not found');
  }

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader(
    'Content-Disposition',
    `inline; filename="Certificate-${certificate.certificateNumber}.pdf"`
  );

  await generateCertificatePdf(certificate, res);
});

// @desc    Toggle certificate visibility in public showcase gallery
// @route   PUT /api/certificates/:id/privacy
// @access  Private (User)
const toggleCertificatePrivacy = asyncHandler(async (req, res) => {
  const certificate = await Certificate.findById(req.params.id);

  if (!certificate) {
    res.status(404);
    throw new Error('Certificate not found');
  }

  if (certificate.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    res.status(403);
    throw new Error('Not authorized to edit this certificate');
  }

  certificate.isPublic = req.body.isPublic !== undefined ? Boolean(req.body.isPublic) : !certificate.isPublic;
  await certificate.save();

  res.status(200).json({
    success: true,
    message: `Certificate is now ${certificate.isPublic ? 'public' : 'private'}`,
    certificate
  });
});

// @desc    PUBLIC SHOWCASE GALLERY AGGREGATION ENDPOINT
//          Aggregates metrics, verified showcase certificates, categories, top events, and ratings
// @route   GET /api/certificates/showcase or GET /api/gallery/showcase
// @access  Public
const getShowcaseGallery = asyncHandler(async (req, res) => {
  const {
    search,
    category,
    certificateType,
    eventId,
    page = 1,
    limit = 12,
    sort = 'newest'
  } = req.query;

  const pageNum = Math.max(1, parseInt(page, 10));
  const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10)));
  const skip = (pageNum - 1) * limitNum;

  // Base match filter for public active certificates
  const matchFilter = {
    status: 'active',
    isPublic: true
  };

  if (certificateType && certificateType !== 'all') {
    matchFilter.certificateType = certificateType;
  }

  if (eventId) {
    const mongoose = require('mongoose');
    matchFilter.event = new mongoose.Types.ObjectId(eventId);
  }

  if (search && search.trim()) {
    const searchRegex = new RegExp(search.trim(), 'i');
    matchFilter.$or = [
      { eventName: searchRegex },
      { recipientName: searchRegex },
      { certificateNumber: searchRegex }
    ];
  }

  // Sort criteria
  let sortStage = { createdAt: -1 };
  if (sort === 'oldest') sortStage = { createdAt: 1 };
  if (sort === 'recipient') sortStage = { recipientName: 1 };
  if (sort === 'event') sortStage = { eventName: 1 };

  // MongoDB Aggregation Pipeline using $facet for metrics and gallery
  const aggregationResult = await Certificate.aggregate([
    {
      $facet: {
        // 1. Overall System Metrics
        overallMetrics: [
          { $match: { status: 'active' } },
          {
            $group: {
              _id: null,
              totalCertificatesIssued: { $sum: 1 },
              certifiedUsers: { $addToSet: '$user' },
              distinctEvents: { $addToSet: '$event' }
            }
          },
          {
            $project: {
              _id: 0,
              totalCertificatesIssued: 1,
              totalCertifiedAttendees: { $size: '$certifiedUsers' },
              totalCompletedEvents: { $size: '$distinctEvents' }
            }
          }
        ],

        // 2. Showcase Gallery Items (filtered, joined with Event & User)
        galleryItems: [
          { $match: matchFilter },
          { $sort: sortStage },
          { $skip: skip },
          { $limit: limitNum },
          // Join with Event
          {
            $lookup: {
              from: 'events',
              localField: 'event',
              foreignField: '_id',
              as: 'eventDetails'
            }
          },
          {
            $unwind: {
              path: '$eventDetails',
              preserveNullAndEmptyArrays: true
            }
          },
          // Filter by category/theme if provided
          ...(category && category !== 'all'
            ? [{ $match: { 'eventDetails.theme': category } }]
            : []),
          // Project clean public fields
          {
            $project: {
              _id: 1,
              certificateNumber: 1,
              recipientName: 1,
              eventName: 1,
              eventDate: 1,
              eventLocation: 1,
              certificateType: 1,
              issuedAt: 1,
              featured: 1,
              verificationUrl: 1,
              qrCodeDataUrl: 1,
              skills: 1,
              grade: 1,
              eventTheme: '$eventDetails.theme',
              eventCoverImage: '$eventDetails.coverImage',
              eventDescription: '$eventDetails.description'
            }
          }
        ],

        // 3. Total Matching Count for Pagination
        totalMatchingCount: [
          { $match: matchFilter },
          {
            $lookup: {
              from: 'events',
              localField: 'event',
              foreignField: '_id',
              as: 'eventDetails'
            }
          },
          {
            $unwind: {
              path: '$eventDetails',
              preserveNullAndEmptyArrays: true
            }
          },
          ...(category && category !== 'all'
            ? [{ $match: { 'eventDetails.theme': category } }]
            : []),
          { $count: 'count' }
        ],

        // 4. Category breakdown aggregation
        categoryBreakdown: [
          { $match: { status: 'active', isPublic: true } },
          {
            $lookup: {
              from: 'events',
              localField: 'event',
              foreignField: '_id',
              as: 'eventDetails'
            }
          },
          {
            $unwind: {
              path: '$eventDetails',
              preserveNullAndEmptyArrays: true
            }
          },
          {
            $group: {
              _id: { $ifNull: ['$eventDetails.theme', 'general'] },
              count: { $sum: 1 }
            }
          },
          {
            $project: {
              category: '$_id',
              count: 1,
              _id: 0
            }
          }
        ],

        // 5. Top Events with most certified participants
        topEvents: [
          { $match: { status: 'active' } },
          {
            $group: {
              _id: '$event',
              eventName: { $first: '$eventName' },
              certifiedCount: { $sum: 1 },
              lastIssuedAt: { $max: '$issuedAt' }
            }
          },
          { $sort: { certifiedCount: -1 } },
          { $limit: 5 },
          {
            $lookup: {
              from: 'events',
              localField: '_id',
              foreignField: '_id',
              as: 'details'
            }
          },
          {
            $unwind: {
              path: '$details',
              preserveNullAndEmptyArrays: true
            }
          },
          {
            $project: {
              eventId: '$_id',
              eventName: 1,
              certifiedCount: 1,
              coverImage: '$details.coverImage',
              theme: '$details.theme',
              startDateTime: '$details.startDateTime'
            }
          }
        ]
      }
    }
  ]);

  const facet = aggregationResult[0] || {};
  const metrics = facet.overallMetrics?.[0] || {
    totalCertificatesIssued: 0,
    totalCertifiedAttendees: 0,
    totalCompletedEvents: 0
  };
  const totalItems = facet.totalMatchingCount?.[0]?.count || 0;
  const totalPages = Math.ceil(totalItems / limitNum) || 1;

  res.status(200).json({
    success: true,
    data: {
      metrics: {
        totalCertificatesIssued: metrics.totalCertificatesIssued,
        totalCertifiedAttendees: metrics.totalCertifiedAttendees,
        totalCompletedEvents: metrics.totalCompletedEvents,
        verificationRate: '100%'
      },
      pagination: {
        currentPage: pageNum,
        totalPages,
        totalItems,
        limit: limitNum,
        hasNextPage: pageNum < totalPages,
        hasPrevPage: pageNum > 1
      },
      galleryItems: facet.galleryItems || [],
      categories: facet.categoryBreakdown || [],
      topEvents: facet.topEvents || []
    }
  });
});

module.exports = {
  generateCertificate,
  issueAdminCertificate,
  getMyCertificates,
  getCertificateByIdOrNumber,
  verifyCertificate,
  downloadCertificatePdf,
  toggleCertificatePrivacy,
  getShowcaseGallery
};
