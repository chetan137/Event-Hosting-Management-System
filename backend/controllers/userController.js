const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const axios = require('axios');

// Helper function to send email via Brevo
const sendEmail = async (to, subject, htmlContent) => {
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
    // Log helpful solution if 401
    if (error.response?.status === 401) {
      console.error('CHECK YOUR BREVO_API_KEY. It might be invalid.');
    }
    throw error;
  }
};

// Generate JWT
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
};

// @desc    Register a new user
// @route   POST /api/users/register
// @access  Public
const registerUser = asyncHandler(async (req, res) => {
  const { fullName, email, password } = req.body;

  if (!fullName || !email || !password) {
    res.status(400);
    throw new Error('Please add all fields');
  }

  // Check if user exists
  const userExists = await User.findOne({ email });

  if (userExists) {
    res.status(400);
    throw new Error('User already exists');
  }

  // Create user
  const user = await User.create({
    fullName,
    email,
    password,
    role: 'user', // Always set role to 'user' - no admin registration allowed
  });

  if (user) {
    res.status(201).json({
      _id: user._id,
      fullName: user.fullName,
      email: user.email,
      role: user.role, // Return role
      token: generateToken(user._id),
    });
  } else {
    res.status(400);
    throw new Error('Invalid user data');
  }
});

// @desc    Authenticate a user
// @route   POST /api/users/login
// @access  Public
const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // Check for user email
  const user = await User.findOne({ email });

  if (user && (await user.matchPassword(password))) {
    res.json({
      _id: user._id,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      token: generateToken(user._id),
    });
  } else {
    res.status(401);
    throw new Error('Invalid email or password');
  }
});

// @desc    Get user data
// @route   GET /api/users/me
// @access  Private
const getMe = asyncHandler(async (req, res) => {
  const { _id, fullName, email } = await User.findById(req.user.id);

  res.status(200).json({
    id: _id,
    fullName,
    email,
  });
});

// @desc    Forgot Password - Generate Token
// @route   POST /api/users/forgot-password
// @access  Public
const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });

  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  // Get reset token (simple random hex for now)
  const resetToken = crypto.randomBytes(20).toString('hex');

  // Hash it and set to resetPasswordToken field
  user.resetPasswordToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  // Set expire (10 minutes)
  user.resetPasswordExpire = Date.now() + 10 * 60 * 1000;

  await user.save();

  // Create reset url
  // Use header origin for automatic detection of frontend URL (local or prod)
  // Fallback to localhost:5173 if header is missing
  const frontendUrl = req.headers.origin || 'http://localhost:5173';
  const resetUrl = `${frontendUrl}/reset-password/${resetToken}`;

  const message = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #4f46e5;">Password Reset Request</h2>
      <p>You have requested a password reset. Please click the link below to reset your password:</p>
      <a href="${resetUrl}" style="display: inline-block; background-color: #4f46e5; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin: 20px 0;">Reset Password</a>
      <p>or copy this link: <br> ${resetUrl}</p>
      <p style="color: #666; font-size: 12px;">This link will expire in 10 minutes.</p>
    </div>
  `;

  try {
    await sendEmail(user.email, 'Password Reset Request', message);

    res.status(200).json({
      success: true,
      data: 'Email sent'
    });
  } catch (error) {
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    res.status(500);
    throw new Error('Email could not be sent');
  }
});

// @desc    Reset Password
// @route   PUT /api/users/reset-password/:resetToken
// @access  Public
const resetPassword = asyncHandler(async (req, res) => {
  const resetPasswordToken = crypto
    .createHash('sha256')
    .update(req.params.resetToken)
    .digest('hex');

  const user = await User.findOne({
    resetPasswordToken,
    resetPasswordExpire: { $gt: Date.now() },
  });

  if (!user) {
    res.status(400);
    throw new Error('Invalid token');
  }

  // Set new password
  user.password = req.body.password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;

  await user.save();

  res.status(201).json({
    success: true,
    data: 'Password updated success',
    token: generateToken(user._id)
  });
});


module.exports = {
  registerUser,
  loginUser,
  getMe,
  forgotPassword,
  resetPassword,
};
