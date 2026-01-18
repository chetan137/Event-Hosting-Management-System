const asyncHandler = require('express-async-handler');
const axios = require('axios');

// @desc    Test email service
// @route   POST /api/test/email
// @access  Public (for testing only - remove in production)
const testEmail = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email) {
    res.status(400);
    throw new Error('Please provide an email address');
  }

  // Check if Brevo API key is configured
  if (!process.env.BREVO_API_KEY || process.env.BREVO_API_KEY === 'your_brevo_api_key_here') {
    res.status(500);
    throw new Error('Brevo API key is not configured. Please add BREVO_API_KEY to .env file');
  }

  try {
    const response = await axios.post(
      'https://api.brevo.com/v3/smtp/email',
      {
        sender: {
          email: process.env.BREVO_SENDER_EMAIL || 'noreply@eventsync.com',
          name: 'EventSync'
        },
        to: [{ email: email }],
        subject: 'EventSync - Email Service Test',
        htmlContent: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #4f46e5;">✅ Email Service is Working!</h2>
            <p>Congratulations! Your Brevo email service is properly configured.</p>
            <p>This is a test email from EventSync to verify that the email integration is working correctly.</p>
            <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="margin-top: 0;">Configuration Details:</h3>
              <p><strong>Sender Email:</strong> ${process.env.BREVO_SENDER_EMAIL || 'noreply@eventsync.com'}</p>
              <p><strong>Recipient:</strong> ${email}</p>
              <p><strong>Status:</strong> Successfully sent</p>
            </div>
            <p style="color: #6b7280; font-size: 14px;">
              You can now use this email service for event registration confirmations and notifications.
            </p>
            <p>Best regards,<br/>EventSync Team</p>
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

    res.json({
      success: true,
      message: 'Test email sent successfully! Check your inbox.',
      messageId: response.data.messageId,
      recipient: email
    });
  } catch (error) {
    console.error('Email test failed:', error.response?.data || error.message);
    res.status(500);
    throw new Error(
      error.response?.data?.message ||
      'Failed to send test email. Please check your Brevo API key and configuration.'
    );
  }
});

const QRCode = require('qrcode');
const PDFDocument = require('pdfkit');

// @desc    Test reminder email with QR code
// @route   POST /api/test/reminder
// @access  Public
const testReminderEmail = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email) {
    res.status(400);
    throw new Error('Please provide an email address');
  }

  // Check if Brevo API key is configured
  if (!process.env.BREVO_API_KEY || process.env.BREVO_API_KEY === 'your_brevo_api_key_here') {
    res.status(500);
    throw new Error('Brevo API key is not configured');
  }

  try {
    // Generate dummy QR Code
    const qrToken = 'TEST_QR_TOKEN_' + Date.now();
    const qrDataUrl = await QRCode.toDataURL(qrToken);

    // Create dummy PDF
    const createPDF = () => new Promise((resolve, reject) => {
      const doc = new PDFDocument({ size: 'A4', margin: 50 });
      const chunks = [];
      doc.on('data', chunk => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks).toString('base64')));
      doc.on('error', reject);

      // Simple PDF content matching the real one
      doc.fontSize(24).fillColor('#4f46e5').text('EventSync', { align: 'center' }).moveDown(0.5);
      doc.fontSize(18).fillColor('#000000').text('Event Entry Pass (TEST)', { align: 'center' }).moveDown(1);

      const eventName = "Test Event 2026";
      const userName = "Test User";

      doc.fontSize(12).fillColor('#666666').text('Attendee Name:', { continued: true })
         .fillColor('#000000').text(` ${userName}`).moveDown(0.5);
      doc.fillColor('#666666').text('Event:', { continued: true })
         .fillColor('#000000').text(` ${eventName}`).moveDown(0.5);
      doc.fillColor('#666666').text('Date & Time:', { continued: true })
         .fillColor('#000000').text(` ${new Date().toLocaleString()}`).moveDown(2);

      doc.fontSize(14).fillColor('#4f46e5').text('Your Entry QR Code', { align: 'center' }).moveDown(0.5);
      const qrImageBuffer = Buffer.from(qrDataUrl.split(',')[1], 'base64');
      doc.image(qrImageBuffer, { fit: [200, 200], align: 'center' });

      doc.end();
    });

    const pdfBase64 = await createPDF();

    // Send email using Brevo
    const response = await axios.post(
      'https://api.brevo.com/v3/smtp/email',
      {
        sender: {
          email: process.env.BREVO_SENDER_EMAIL || 'noreply@eventsync.com',
          name: 'EventSync'
        },
        to: [{ email: email }],
        subject: '⏰ Starting in 15 mins: Test Event 2026 - QR Code Attached',
        htmlContent: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #4f46e5;">⏰ Event Starting Soon!</h2>
              <p>Hi Test User,</p>
              <p>This is a friendly reminder that your event is starting in <strong>15 minutes</strong>!</p>

              <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="margin-top: 0; color: #1f2937;">Event Details:</h3>
                <p><strong>Event:</strong> Test Event 2026</p>
                <p><strong>Start Time:</strong> ${new Date(Date.now() + 15*60000).toLocaleString()}</p>
                <p><strong>Location:</strong> 📍 Test Location Hall A</p>
              </div>

              <div style="background: #dbeafe; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #3b82f6;">
                <p style="margin: 0; color: #1e40af;">
                  <strong>📎 Your QR Code is attached!</strong><br/>
                  Please have it ready for quick check-in at the entrance.
                </p>
              </div>

              <div style="background: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <p style="margin: 0; color: #92400e;">
                  <strong>💡 Tips:</strong><br/>
                  • Arrive a few minutes early<br/>
                  • Have your QR code ready on your device<br/>
                  • Check your internet connection if it's an online event
                </p>
              </div>

              <p>We look forward to seeing you at the event! 🎉</p>
              <p>Best regards,<br/>EventSync Team</p>
            </div>
        `,
        attachment: [
          {
            content: pdfBase64,
            name: "Test_Event_QR_Code.pdf"
          }
        ]
      },
      {
        headers: {
          'api-key': process.env.BREVO_API_KEY,
          'Content-Type': 'application/json'
        }
      }
    );

    res.json({
      success: true,
      message: 'Test reminder email sent successfully!',
      recipient: email
    });
  } catch (error) {
    console.error('Test reminder failed:', error);
    res.status(500);
    throw new Error(error.response?.data?.message || error.message);
  }
});

module.exports = { testEmail, testReminderEmail };
