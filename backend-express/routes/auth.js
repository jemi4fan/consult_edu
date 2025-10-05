const express = require('express');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const User = require('../models/User');
const Applicant = require('../models/Applicant');
const Staff = require('../models/Staff');
const { generateToken, generateRefreshToken, verifyRefreshToken } = require('../middleware/auth');
const { userValidation } = require('../middleware/validation');
const { authenticate, logout } = require('../middleware/auth');

const router = express.Router();

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
router.post('/register', userValidation.register, async (req, res, next) => {
  try {
    const { first_name, father_name, grandfather_name, username, email, password, phone, national_id, role = 'applicant' } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [
        { email: email.toLowerCase() },
        { username: username.toLowerCase() }
      ]
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email or username'
      });
    }

    // Create user
    const user = await User.create({
      first_name,
      father_name,
      grandfather_name,
      username: username.toLowerCase(),
      email: email.toLowerCase(),
      password,
      phone,
      national_id,
      role,
      verification_token: crypto.randomBytes(32).toString('hex')
    });

    // Create applicant profile if role is applicant
    if (role === 'applicant') {
      await Applicant.create({
        user_id: user._id,
        profile_completion: 10 // Basic info completed
      });
    }

    // Create staff profile if role is staff
    if (role === 'staff') {
      await Staff.create({
        user_id: user._id,
        department: 'General',
        position: 'Staff Member'
      });
    }

    // Generate tokens
    const token = generateToken(user.id);
    const refreshToken = generateRefreshToken(user.id);

    // Add refresh token to user
    await user.addRefreshToken(refreshToken);

    // Set cookie
    res.cookie('token', token, {
      expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict'
    });

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user: {
          id: user.id,
          first_name: user.first_name,
          father_name: user.father_name,
          grandfather_name: user.grandfather_name,
          username: user.username,
          email: user.email,
          role: user.role,
          phone: user.phone,
          national_id: user.national_id,
          is_verified: user.is_verified,
          created_at: user.createdAt
        },
        token,
        refreshToken
      }
    });

  } catch (error) {
    next(error);
  }
});

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
router.post('/login', userValidation.login, async (req, res, next) => {
  try {
    const { identifier, password } = req.body;

    // Find user by email or username
    const user = await User.findByEmailOrUsername(identifier);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check if user is active
    if (!user.is_active) {
      return res.status(401).json({
        success: false,
        message: 'Account is deactivated'
      });
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Update last login
    user.last_login = new Date();
    await user.save();

    // Generate tokens
    const token = generateToken(user.id);
    const refreshToken = generateRefreshToken(user.id);

    // Add refresh token to user
    await user.addRefreshToken(refreshToken);

    // Set cookie
    res.cookie('token', token, {
      expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict'
    });

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user.id,
          first_name: user.first_name,
          father_name: user.father_name,
          grandfather_name: user.grandfather_name,
          username: user.username,
          email: user.email,
          role: user.role,
          phone: user.phone,
          national_id: user.national_id,
          is_verified: user.is_verified,
          last_login: user.last_login,
          created_at: user.createdAt
        },
        token,
        refreshToken
      }
    });

  } catch (error) {
    next(error);
  }
});

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Private
router.post('/logout', authenticate, logout, (req, res) => {
  res.json({
    success: true,
    message: 'Logout successful'
  });
});

// @desc    Refresh token
// @route   POST /api/auth/refresh
// @access  Public
router.post('/refresh', async (req, res, next) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        message: 'Refresh token is required'
      });
    }

    // Verify refresh token
    const decoded = verifyRefreshToken(refreshToken);

    // Find user
    const user = await User.findById(decoded.userId);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid refresh token'
      });
    }

    // Check if refresh token exists in user's tokens
    const tokenExists = user.refresh_tokens.some(rt => rt.token === refreshToken);

    if (!tokenExists) {
      return res.status(401).json({
        success: false,
        message: 'Invalid refresh token'
      });
    }

    // Generate new tokens
    const newToken = generateToken(user._id);
    const newRefreshToken = generateRefreshToken(user._id);

    // Remove old refresh token and add new one
    await user.removeRefreshToken(refreshToken);
    await user.addRefreshToken(newRefreshToken);

    res.json({
      success: true,
      message: 'Token refreshed successfully',
      data: {
        token: newToken,
        refreshToken: newRefreshToken
      }
    });

  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid refresh token'
      });
    }
    next(error);
  }
});

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
router.get('/me', authenticate, async (req, res, next) => {
  try {
    const user = await User.findOne({ id: req.user.id })
      .populate('applicant_data')
      .populate('staff_data');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          first_name: user.first_name,
          father_name: user.father_name,
          grandfather_name: user.grandfather_name,
          username: user.username,
          email: user.email,
          role: user.role,
          phone: user.phone,
          national_id: user.national_id,
          address: user.address,
          is_verified: user.is_verified,
          last_login: user.last_login,
          created_at: user.createdAt,
          applicant_data: user.applicant_data,
          staff_data: user.staff_data
        }
      }
    });

  } catch (error) {
    next(error);
  }
});

// @desc    Update password
// @route   PUT /api/auth/password
// @access  Private
router.put('/password', authenticate, async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Current password and new password are required'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters long'
      });
    }

    // Get user with password
    const user = await User.findOne({ id: req.user.id }).select('+password');

    // Check current password
    const isCurrentPasswordValid = await user.comparePassword(currentPassword);

    if (!isCurrentPasswordValid) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    res.json({
      success: true,
      message: 'Password updated successfully'
    });

  } catch (error) {
    next(error);
  }
});

// @desc    Forgot password
// @route   POST /api/auth/forgot-password
// @access  Public
router.post('/forgot-password', async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      // Don't reveal if user exists or not
      return res.json({
        success: true,
        message: 'If an account with that email exists, a password reset link has been sent'
      });
    }

    // Generate reset token
    const resetToken = user.generatePasswordResetToken();
    await user.save();

    // TODO: Send email with reset token
    // For now, we'll just return the token (remove this in production)
    res.json({
      success: true,
      message: 'Password reset link has been sent to your email',
      // Remove this in production
      resetToken: process.env.NODE_ENV === 'development' ? resetToken : undefined
    });

  } catch (error) {
    next(error);
  }
});

// @desc    Reset password
// @route   PUT /api/auth/reset-password
// @access  Public
router.put('/reset-password', async (req, res, next) => {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return res.status(400).json({
        success: false,
        message: 'Token and password are required'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long'
      });
    }

    // Find user by reset token
    const user = await User.findOne({
      password_reset_token: token,
      password_reset_expires: { $gt: Date.now() }
    }).select('+password_reset_token +password_reset_expires');

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired reset token'
      });
    }

    // Update password
    user.password = password;
    user.password_reset_token = undefined;
    user.password_reset_expires = undefined;
    await user.save();

    res.json({
      success: true,
      message: 'Password reset successfully'
    });

  } catch (error) {
    next(error);
  }
});

// @desc    Verify email
// @route   GET /api/auth/verify-email/:token
// @access  Public
router.get('/verify-email/:token', async (req, res, next) => {
  try {
    const { token } = req.params;

    const user = await User.findOne({
      verification_token: token,
      is_verified: false
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid verification token'
      });
    }

    // Verify user
    user.is_verified = true;
    user.verification_token = undefined;
    await user.save();

    res.json({
      success: true,
      message: 'Email verified successfully'
    });

  } catch (error) {
    next(error);
  }
});

// @desc    Resend verification email
// @route   POST /api/auth/resend-verification
// @access  Private
router.post('/resend-verification', authenticate, async (req, res, next) => {
  try {
    const user = await User.findOne({ id: req.user.id });

    if (user.is_verified) {
      return res.status(400).json({
        success: false,
        message: 'Email is already verified'
      });
    }

    // Generate new verification token
    user.verification_token = user.generateVerificationToken();
    await user.save();

    // TODO: Send verification email
    // For now, we'll just return the token (remove this in production)
    res.json({
      success: true,
      message: 'Verification email has been sent',
      // Remove this in production
      verificationToken: process.env.NODE_ENV === 'development' ? user.verification_token : undefined
    });

  } catch (error) {
    next(error);
  }
});

module.exports = router;


