const express = require('express');
const User = require('../models/User');
const { authenticate, authorize, adminOnly, staffOrAdmin, checkOwnership } = require('../middleware/auth');
const { userValidation, paramValidation, queryValidation } = require('../middleware/validation');

const router = express.Router();

// @desc    Create a new user
// @route   POST /api/users
// @access  Private (Admin only)
router.post('/', authenticate, adminOnly, userValidation.create, async (req, res, next) => {
  try {
    const userData = req.body;
    
    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [
        { email: userData.email },
        { username: userData.username }
      ]
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email or username already exists'
      });
    }

    // Create new user
    const user = new User(userData);
    await user.save();

    // Remove password from response
    const userResponse = user.toObject();
    delete userResponse.password;

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: { user: userResponse }
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Get all users
// @route   GET /api/users
// @access  Private (Admin/Staff only)
router.get('/', authenticate, staffOrAdmin, queryValidation.pagination, async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const sort = req.query.sort || '-created_at';

    // Build query
    const query = {};
    
    // Filter by role if specified
    if (req.query.role && ['admin', 'staff', 'applicant'].includes(req.query.role)) {
      query.role = req.query.role;
    }

    // Filter by status if specified
    if (req.query.status && ['active', 'inactive'].includes(req.query.status)) {
      query.is_active = req.query.status === 'active';
    }

    // Search by name, email, or username
    if (req.query.search) {
      query.$or = [
        { first_name: { $regex: req.query.search, $options: 'i' } },
        { father_name: { $regex: req.query.search, $options: 'i' } },
        { grandfather_name: { $regex: req.query.search, $options: 'i' } },
        { email: { $regex: req.query.search, $options: 'i' } },
        { username: { $regex: req.query.search, $options: 'i' } }
      ];
    }

    const users = await User.find(query)
      .populate('applicant_data')
      .populate('staff_data')
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .select('-password -refresh_tokens');

    const total = await User.countDocuments(query);

    res.json({
      success: true,
      data: {
        users,
        pagination: {
          current_page: page,
          total_pages: Math.ceil(total / limit),
          total_items: total,
          items_per_page: limit,
          has_next: page < Math.ceil(total / limit),
          has_previous: page > 1
        }
      }
    });

  } catch (error) {
    next(error);
  }
});

// @desc    Get user by ID
// @route   GET /api/users/:id
// @access  Private
router.get('/:id', authenticate, paramValidation.mongoId, async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id)
      .populate('applicant_data')
      .populate('staff_data')
      .select('-password -refresh_tokens');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if user can access this profile
    if (req.user.role !== 'admin' && req.user.id.toString() !== user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    res.json({
      success: true,
      data: { user }
    });

  } catch (error) {
    next(error);
  }
});

// @desc    Update user
// @route   PUT /api/users/:id
// @access  Private
router.put('/:id', authenticate, paramValidation.mongoId, userValidation.update, async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if user can update this profile
    if (req.user.role !== 'admin' && req.user.id.toString() !== user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Update user
    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).select('-password -refresh_tokens');

    res.json({
      success: true,
      message: 'User updated successfully',
      data: { user: updatedUser }
    });

  } catch (error) {
    next(error);
  }
});

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Private (Admin only)
router.delete('/:id', authenticate, adminOnly, paramValidation.mongoId, async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Prevent admin from deleting themselves
    if (req.user.id.toString() === user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'You cannot delete your own account'
      });
    }

    // Soft delete by deactivating the account
    user.is_active = false;
    await user.save();

    res.json({
      success: true,
      message: 'User deactivated successfully'
    });

  } catch (error) {
    next(error);
  }
});

// @desc    Activate user
// @route   PUT /api/users/:id/activate
// @access  Private (Admin only)
router.put('/:id/activate', authenticate, adminOnly, paramValidation.mongoId, async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    user.is_active = true;
    await user.save();

    res.json({
      success: true,
      message: 'User activated successfully',
      data: { user }
    });

  } catch (error) {
    next(error);
  }
});

// @desc    Get user statistics
// @route   GET /api/users/stats/overview
// @access  Private (Admin/Staff only)
router.get('/stats/overview', authenticate, staffOrAdmin, async (req, res, next) => {
  try {
    const stats = await User.aggregate([
      {
        $group: {
          _id: '$role',
          count: { $sum: 1 },
          active_count: {
            $sum: { $cond: ['$is_active', 1, 0] }
          },
          verified_count: {
            $sum: { $cond: ['$is_verified', 1, 0] }
          }
        }
      }
    ]);

    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ is_active: true });
    const verifiedUsers = await User.countDocuments({ is_verified: true });

    // Recent registrations (last 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const recentRegistrations = await User.countDocuments({
      createdAt: { $gte: thirtyDaysAgo }
    });

    // Monthly registration trend
    const monthlyTrend = await User.aggregate([
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { '_id.year': -1, '_id.month': -1 }
      },
      {
        $limit: 12
      }
    ]);

    res.json({
      success: true,
      data: {
        overview: {
          total_users: totalUsers,
          active_users: activeUsers,
          verified_users: verifiedUsers,
          recent_registrations: recentRegistrations
        },
        role_stats: stats,
        monthly_trend: monthlyTrend
      }
    });

  } catch (error) {
    next(error);
  }
});

// @desc    Search users
// @route   GET /api/users/search
// @access  Private (Admin/Staff only)
router.get('/search', authenticate, staffOrAdmin, queryValidation.search, async (req, res, next) => {
  try {
    const { q } = req.query;
    const limit = parseInt(req.query.limit) || 10;

    if (!q || q.length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Search query must be at least 2 characters'
      });
    }

    const users = await User.find({
      $or: [
        { first_name: { $regex: q, $options: 'i' } },
        { father_name: { $regex: q, $options: 'i' } },
        { grandfather_name: { $regex: q, $options: 'i' } },
        { email: { $regex: q, $options: 'i' } },
        { username: { $regex: q, $options: 'i' } }
      ]
    })
    .select('first_name father_name grandfather_name email username role is_active')
    .limit(limit);

    res.json({
      success: true,
      data: { users }
    });

  } catch (error) {
    next(error);
  }
});

// @desc    Bulk update users
// @route   PUT /api/users/bulk
// @access  Private (Admin only)
router.put('/bulk', authenticate, adminOnly, async (req, res, next) => {
  try {
    const { user_ids, updates } = req.body;

    if (!user_ids || !Array.isArray(user_ids) || user_ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'User IDs array is required'
      });
    }

    if (!updates || Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Updates object is required'
      });
    }

    // Prevent bulk updates that could affect security
    const allowedUpdates = ['is_active', 'role'];
    const filteredUpdates = {};
    
    Object.keys(updates).forEach(key => {
      if (allowedUpdates.includes(key)) {
        filteredUpdates[key] = updates[key];
      }
    });

    if (Object.keys(filteredUpdates).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid updates provided'
      });
    }

    const result = await User.updateMany(
      { _id: { $in: user_ids } },
      { $set: filteredUpdates }
    );

    res.json({
      success: true,
      message: `${result.modifiedCount} users updated successfully`,
      data: {
        matched_count: result.matchedCount,
        modified_count: result.modifiedCount
      }
    });

  } catch (error) {
    next(error);
  }
});

module.exports = router;

