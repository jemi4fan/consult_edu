const express = require('express');
const Ad = require('../models/Ad');
const { authenticate, authorize, adminOnly, staffOrAdmin } = require('../middleware/auth');
const { adValidation, paramValidation, queryValidation } = require('../middleware/validation');
const { uploadSingle, uploadMultiple, cleanupFile } = require('../middleware/upload');

const router = express.Router();

// @desc    Get all ads
// @route   GET /api/ads
// @access  Public
router.get('/', queryValidation.pagination, async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const sort = req.query.sort || '-created_at';

    // Build query
    const query = {};

    // Filter by type
    if (req.query.type && ['Announcement', 'News', 'Event', 'Promotion', 'Policy', 'Update'].includes(req.query.type)) {
      query.type = req.query.type;
    }

    // Filter by category
    if (req.query.category && ['General', 'Job', 'Scholarship', 'System', 'Maintenance', 'Other'].includes(req.query.category)) {
      query.category = req.query.category;
    }

    // Filter by priority
    if (req.query.priority && ['Low', 'Normal', 'High', 'Urgent'].includes(req.query.priority)) {
      query.priority = req.query.priority;
    }

    // Filter by approval status
    if (req.query.approval_status && ['Pending', 'Approved', 'Rejected', 'Draft'].includes(req.query.approval_status)) {
      query.approval_status = req.query.approval_status;
    }

    // Filter by featured
    if (req.query.featured === 'true') {
      query.is_featured = true;
    }

    // Filter by pinned
    if (req.query.pinned === 'true') {
      query.is_pinned = true;
    }

    // Search ads
    if (req.query.search) {
      query.$text = { $search: req.query.search };
    }

    // Filter by date range
    if (req.query.start_date) {
      query.start_date = { ...query.start_date, $gte: new Date(req.query.start_date) };
    }

    if (req.query.end_date) {
      query.end_date = { ...query.end_date, $lte: new Date(req.query.end_date) };
    }

    // For public access, only show approved and active ads
    if (!req.user || (req.user.role !== 'admin' && req.user.role !== 'staff')) {
      query.approval_status = 'Approved';
      query.is_active = true;
      query.start_date = { ...query.start_date, $lte: new Date() };
      query.$or = [
        { end_date: { $gte: new Date() } },
        { end_date: { $exists: false } }
      ];
    }

    const ads = await Ad.find(query)
      .populate('creator', 'first_name father_name email')
      .populate('approver', 'first_name father_name email')
      .sort(sort)
      .skip(skip)
      .limit(limit);

    const total = await Ad.countDocuments(query);

    res.json({
      success: true,
      data: {
        ads,
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

// @desc    Get ad by ID
// @route   GET /api/ads/:id
// @access  Public
router.get('/:id', paramValidation.integerId, async (req, res, next) => {
  try {
    const ad = await Ad.findOne({ id: parseInt(req.params.id) })
      .populate('creator', 'first_name father_name email')
      .populate('approver', 'first_name father_name email');

    if (!ad) {
      return res.status(404).json({
        success: false,
        message: 'Ad not found'
      });
    }

    // Check if user can view this ad
    if (!req.user || (req.user.role !== 'admin' && req.user.role !== 'staff')) {
      if (ad.approval_status !== 'Approved' || !ad.is_active || !ad.is_currently_active) {
        return res.status(404).json({
          success: false,
          message: 'Ad not found'
        });
      }
    }

    // Increment view count
    await ad.incrementViewCount();

    res.json({
      success: true,
      data: { ad }
    });

  } catch (error) {
    next(error);
  }
});

// @desc    Create ad
// @route   POST /api/ads
// @access  Private (Admin/Staff only)
router.post('/', authenticate, staffOrAdmin, adValidation.create, async (req, res, next) => {
  try {
    const ad = await Ad.create({
      ...req.body,
      created_by: req.user.id,
      last_modified_by: req.user.id,
      approval_status: req.user.role === 'admin' ? 'Approved' : 'Pending'
    });

    // Populate the created ad
    const populatedAd = await Ad.findOne({ id: ad.id })
      .populate('creator', 'first_name father_name email');

    res.status(201).json({
      success: true,
      message: 'Ad created successfully',
      data: { ad: populatedAd }
    });

  } catch (error) {
    next(error);
  }
});

// @desc    Update ad
// @route   PUT /api/ads/:id
// @access  Private (Admin/Staff only)
router.put('/:id', authenticate, staffOrAdmin, paramValidation.integerId, async (req, res, next) => {
  try {
    const ad = await Ad.findOne({ id: parseInt(req.params.id) });

    if (!ad) {
      return res.status(404).json({
        success: false,
        message: 'Ad not found'
      });
    }

    // Check if user can update this ad
    // Admin and staff can update any ad, applicants can only update their own
    if (req.user.role === 'applicant' && req.user.id !== ad.created_by) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Update ad
    const updatedAd = await Ad.findOneAndUpdate(
      { id: parseInt(req.params.id) },
      {
        ...req.body,
        last_modified_by: req.user.id
      },
      { new: true, runValidators: true }
    ).populate('creator', 'first_name father_name email')
     .populate('approver', 'first_name father_name email');

    res.json({
      success: true,
      message: 'Ad updated successfully',
      data: { ad: updatedAd }
    });

  } catch (error) {
    next(error);
  }
});

// @desc    Delete ad
// @route   DELETE /api/ads/:id
// @access  Private (Admin only)
router.delete('/:id', authenticate, adminOnly, paramValidation.integerId, async (req, res, next) => {
  try {
    const ad = await Ad.findOne({ id: parseInt(req.params.id) });

    if (!ad) {
      return res.status(404).json({
        success: false,
        message: 'Ad not found'
      });
    }

    // Clean up files if they exist
    if (ad.file && ad.file.filepath) {
      cleanupFile(ad.file.filepath);
    }

    if (ad.image && ad.image.filepath) {
      cleanupFile(ad.image.filepath);
    }

    await Ad.findOneAndDelete({ id: parseInt(req.params.id) });

    res.json({
      success: true,
      message: 'Ad deleted successfully'
    });

  } catch (error) {
    next(error);
  }
});

// @desc    Get featured ads
// @route   GET /api/ads/featured/list
// @access  Public
router.get('/featured/list', async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit) || 5;
    
    const ads = await Ad.findFeatured(limit);

    res.json({
      success: true,
      data: { ads }
    });

  } catch (error) {
    next(error);
  }
});

// @desc    Get pinned ads
// @route   GET /api/ads/pinned/list
// @access  Public
router.get('/pinned/list', async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit) || 3;
    
    const ads = await Ad.findPinned(limit);

    res.json({
      success: true,
      data: { ads }
    });

  } catch (error) {
    next(error);
  }
});

// @desc    Get active ads
// @route   GET /api/ads/active/list
// @access  Public
router.get('/active/list', async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    
    const ads = await Ad.findActive();

    res.json({
      success: true,
      data: { ads }
    });

  } catch (error) {
    next(error);
  }
});

// @desc    Search ads
// @route   GET /api/ads/search
// @access  Public
router.get('/search', queryValidation.search, async (req, res, next) => {
  try {
    const { q } = req.query;
    const limit = parseInt(req.query.limit) || 20;
    const filters = {};

    // Apply filters
    if (req.query.type) {
      filters.type = req.query.type;
    }

    if (req.query.category) {
      filters.category = req.query.category;
    }

    if (req.query.priority) {
      filters.priority = req.query.priority;
    }

    // For public access, only show approved and active ads
    if (!req.user || (req.user.role !== 'admin' && req.user.role !== 'staff')) {
      filters.approval_status = 'Approved';
      filters.is_active = true;
    }

    const ads = await Ad.searchAds(q, filters)
      .populate('creator', 'first_name father_name email')
      .limit(limit);

    res.json({
      success: true,
      data: { ads }
    });

  } catch (error) {
    next(error);
  }
});

// @desc    Approve ad
// @route   PUT /api/ads/:id/approve
// @access  Private (Admin only)
router.put('/:id/approve', authenticate, adminOnly, paramValidation.integerId, async (req, res, next) => {
  try {
    const { notes = '' } = req.body;

    const ad = await Ad.findOne({ id: parseInt(req.params.id) });

    if (!ad) {
      return res.status(404).json({
        success: false,
        message: 'Ad not found'
      });
    }

    // Approve ad
    await ad.approve(req.user.id, notes);

    res.json({
      success: true,
      message: 'Ad approved successfully',
      data: { ad }
    });

  } catch (error) {
    next(error);
  }
});

// @desc    Reject ad
// @route   PUT /api/ads/:id/reject
// @access  Private (Admin only)
router.put('/:id/reject', authenticate, adminOnly, paramValidation.integerId, async (req, res, next) => {
  try {
    const { reason = '' } = req.body;

    const ad = await Ad.findOne({ id: parseInt(req.params.id) });

    if (!ad) {
      return res.status(404).json({
        success: false,
        message: 'Ad not found'
      });
    }

    // Reject ad
    await ad.reject(req.user.id, reason);

    res.json({
      success: true,
      message: 'Ad rejected successfully',
      data: { ad }
    });

  } catch (error) {
    next(error);
  }
});

// @desc    Publish ad
// @route   PUT /api/ads/:id/publish
// @access  Private (Admin only)
router.put('/:id/publish', authenticate, adminOnly, paramValidation.integerId, async (req, res, next) => {
  try {
    const ad = await Ad.findOne({ id: parseInt(req.params.id) });

    if (!ad) {
      return res.status(404).json({
        success: false,
        message: 'Ad not found'
      });
    }

    // Publish ad
    await ad.publish();

    res.json({
      success: true,
      message: 'Ad published successfully',
      data: { ad }
    });

  } catch (error) {
    next(error);
  }
});

// @desc    Unpublish ad
// @route   PUT /api/ads/:id/unpublish
// @access  Private (Admin only)
router.put('/:id/unpublish', authenticate, adminOnly, paramValidation.integerId, async (req, res, next) => {
  try {
    const ad = await Ad.findOne({ id: parseInt(req.params.id) });

    if (!ad) {
      return res.status(404).json({
        success: false,
        message: 'Ad not found'
      });
    }

    // Unpublish ad
    await ad.unpublish();

    res.json({
      success: true,
      message: 'Ad unpublished successfully',
      data: { ad }
    });

  } catch (error) {
    next(error);
  }
});

// @desc    Feature/Unfeature ad
// @route   PUT /api/ads/:id/feature
// @access  Private (Admin only)
router.put('/:id/feature', authenticate, adminOnly, paramValidation.integerId, async (req, res, next) => {
  try {
    const { is_featured } = req.body;

    if (typeof is_featured !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: 'is_featured must be a boolean value'
      });
    }

    const ad = await Ad.findOne({ id: parseInt(req.params.id) });

    if (!ad) {
      return res.status(404).json({
        success: false,
        message: 'Ad not found'
      });
    }

    ad.is_featured = is_featured;
    ad.last_modified_by = req.user.id;
    await ad.save();

    res.json({
      success: true,
      message: `Ad ${is_featured ? 'featured' : 'unfeatured'} successfully`,
      data: { ad }
    });

  } catch (error) {
    next(error);
  }
});

// @desc    Pin/Unpin ad
// @route   PUT /api/ads/:id/pin
// @access  Private (Admin only)
router.put('/:id/pin', authenticate, adminOnly, paramValidation.integerId, async (req, res, next) => {
  try {
    const { is_pinned } = req.body;

    if (typeof is_pinned !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: 'is_pinned must be a boolean value'
      });
    }

    const ad = await Ad.findOne({ id: parseInt(req.params.id) });

    if (!ad) {
      return res.status(404).json({
        success: false,
        message: 'Ad not found'
      });
    }

    ad.is_pinned = is_pinned;
    ad.last_modified_by = req.user.id;
    await ad.save();

    res.json({
      success: true,
      message: `Ad ${is_pinned ? 'pinned' : 'unpinned'} successfully`,
      data: { ad }
    });

  } catch (error) {
    next(error);
  }
});

// @desc    Increment ad click count
// @route   POST /api/ads/:id/click
// @access  Public
router.post('/:id/click', paramValidation.integerId, async (req, res, next) => {
  try {
    const ad = await Ad.findOne({ id: parseInt(req.params.id) });

    if (!ad) {
      return res.status(404).json({
        success: false,
        message: 'Ad not found'
      });
    }

    // Increment click count
    await ad.incrementClickCount();

    res.json({
      success: true,
      message: 'Click recorded successfully'
    });

  } catch (error) {
    next(error);
  }
});

// @desc    Get ad statistics
// @route   GET /api/ads/stats/overview
// @access  Private (Admin/Staff only)
router.get('/stats/overview', authenticate, staffOrAdmin, async (req, res, next) => {
  try {
    const stats = await Ad.getAdStats();

    const totalAds = await Ad.countDocuments();
    const activeAds = await Ad.countDocuments({ is_active: true });
    const approvedAds = await Ad.countDocuments({ approval_status: 'Approved' });
    const pendingAds = await Ad.countDocuments({ approval_status: 'Pending' });
    const featuredAds = await Ad.countDocuments({ is_featured: true });

    // Recent ads (last 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const recentAds = await Ad.countDocuments({
      createdAt: { $gte: thirtyDaysAgo }
    });

    res.json({
      success: true,
      data: {
        overview: {
          total_ads: totalAds,
          active_ads: activeAds,
          approved_ads: approvedAds,
          pending_ads: pendingAds,
          featured_ads: featuredAds,
          recent_ads: recentAds
        },
        ...stats
      }
    });

  } catch (error) {
    next(error);
  }
});

// @desc    Get top performing ads
// @route   GET /api/ads/stats/top-performing
// @access  Private (Admin/Staff only)
router.get('/stats/top-performing', authenticate, staffOrAdmin, async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit) || 10;

    const ads = await Ad.getTopPerformingAds(limit);

    res.json({
      success: true,
      data: { ads }
    });

  } catch (error) {
    next(error);
  }
});

module.exports = router;


