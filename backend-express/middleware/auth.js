const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Staff = require('../models/Staff');

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d'
  });
};

// Generate refresh token
const generateRefreshToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRE || '30d'
  });
};

// Verify JWT token
const verifyToken = (token) => {
  return jwt.verify(token, process.env.JWT_SECRET);
};

// Verify refresh token
const verifyRefreshToken = (token) => {
  return jwt.verify(token, process.env.JWT_REFRESH_SECRET);
};

// Authentication middleware
const authenticate = async (req, res, next) => {
  try {
    let token;

    // Check for token in header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    // Check for token in cookies
    if (!token && req.cookies.token) {
      token = req.cookies.token;
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.'
      });
    }

    // Verify token
    const decoded = verifyToken(token);
    
    // Get user from token
    const user = await User.findOne({ id: decoded.userId }).select('-password');
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token. User not found.'
      });
    }

    // Check if user is active
    if (!user.is_active) {
      return res.status(401).json({
        success: false,
        message: 'Account is deactivated.'
      });
    }

    // Check if user is verified (optional, can be configured)
    if (process.env.REQUIRE_EMAIL_VERIFICATION === 'true' && !user.is_verified) {
      return res.status(401).json({
        success: false,
        message: 'Email not verified. Please verify your email.'
      });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token.'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired.'
      });
    }

    console.error('Auth middleware error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error.'
    });
  }
};

// Role-based authorization middleware
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. Please authenticate first.'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Required role: ${roles.join(' or ')}.`
      });
    }

    next();
  };
};

// Admin only middleware
const adminOnly = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Access denied. Please authenticate first.'
    });
  }

  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Admin role required.'
    });
  }

  next();
};

// Staff or Admin middleware
const staffOrAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Access denied. Please authenticate first.'
    });
  }

  if (!['admin', 'staff'].includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Staff or Admin role required.'
    });
  }

  next();
};

// Optional authentication middleware (doesn't fail if no token)
const optionalAuth = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token && req.cookies.token) {
      token = req.cookies.token;
    }

    if (token) {
      const decoded = verifyToken(token);
      const user = await User.findOne({ id: decoded.userId }).select('-password');
      
      if (user && user.is_active) {
        req.user = user;
      }
    }

    next();
  } catch (error) {
    // Continue without authentication for optional auth
    next();
  }
};

// Resource ownership middleware
const checkOwnership = (resourceUserIdField = 'user_id') => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. Please authenticate first.'
      });
    }

    // Admin can access any resource
    if (req.user.role === 'admin') {
      return next();
    }

    // Staff can access resources they created or are assigned to
    if (req.user.role === 'staff') {
      // Check if staff has permission to manage this resource
      // This can be extended based on specific requirements
      return next();
    }

    // For applicants, check if they own the resource
    const resourceUserId = req.resource ? req.resource[resourceUserIdField] : req.params.userId;
    
    if (req.user._id.toString() !== resourceUserId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only access your own resources.'
      });
    }

    next();
  };
};

// Permission-based middleware for staff
const checkStaffPermission = (permission) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Access denied. Please authenticate first.'
        });
      }

      // Admin has all permissions
      if (req.user.role === 'admin') {
        return next();
      }

      // Check staff permissions
      if (req.user.role === 'staff') {
        const staff = await Staff.findOne({ user_id: req.user._id });
        
        if (!staff) {
          return res.status(403).json({
            success: false,
            message: 'Staff profile not found.'
          });
        }

        if (!staff.hasPermission(permission)) {
          return res.status(403).json({
            success: false,
            message: `Permission denied. Required permission: ${permission}`
          });
        }

        req.staff = staff;
        return next();
      }

      return res.status(403).json({
        success: false,
        message: 'Access denied. Staff or Admin role required.'
      });
    } catch (error) {
      console.error('Permission check error:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error.'
      });
    }
  };
};

// Rate limiting middleware for sensitive operations
const sensitiveOperationLimit = (req, res, next) => {
  // This can be enhanced with Redis or database-based rate limiting
  // For now, we'll use a simple in-memory approach
  if (!req.user) {
    return next();
  }

  const userId = req.user._id.toString();
  const operation = req.route.path;
  const key = `${userId}:${operation}`;

  // Check if user has exceeded rate limit for this operation
  // Implementation depends on your rate limiting strategy
  next();
};

// Logout middleware (blacklist token)
const logout = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1] || req.cookies.token;
    
    if (token && req.user) {
      // Remove refresh token from user's tokens array
      await req.user.removeRefreshToken(token);
    }

    // Clear cookie if exists
    if (req.cookies.token) {
      res.clearCookie('token');
    }

    next();
  } catch (error) {
    console.error('Logout middleware error:', error);
    next();
  }
};

module.exports = {
  generateToken,
  generateRefreshToken,
  verifyToken,
  verifyRefreshToken,
  authenticate,
  authorize,
  adminOnly,
  staffOrAdmin,
  optionalAuth,
  checkOwnership,
  checkStaffPermission,
  sensitiveOperationLimit,
  logout
};


