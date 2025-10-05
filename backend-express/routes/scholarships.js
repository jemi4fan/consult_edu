const express = require('express');
const Scholarship = require('../models/Scholarship');
const Application = require('../models/Application');
const { authenticate, authorize, staffOrAdmin } = require('../middleware/auth');
const { scholarshipValidation, paramValidation, queryValidation } = require('../middleware/validation');

const router = express.Router();

// @desc    Get countries with available scholarships
// @route   GET /api/scholarships/countries
// @access  Public
router.get('/countries', async (req, res, next) => {
  try {
    const query = {};
    
    // Only show active scholarships
    query.status = { $in: ['Active', 'Upcoming'] };
    
    // Check if deadline hasn't passed
    query.deadline = { $gte: new Date() };

    const countries = await Scholarship.distinct('country', query);
    
    res.json({
      success: true,
      data: {
        countries: countries.map(country => ({
          name: country,
          flag: getCountryFlag(country)
        }))
      }
    });

  } catch (error) {
    next(error);
  }
});

// @desc    Get programs available for a specific country
// @route   GET /api/scholarships/programs/:country
// @access  Public
router.get('/programs/:country', async (req, res, next) => {
  try {
    const { country } = req.params;
    
    const query = {
      country: country,
      status: { $in: ['Active', 'Upcoming'] },
      deadline: { $gte: new Date() }
    };

    const programs = await Scholarship.distinct('program', query);
    
    res.json({
      success: true,
      data: {
        programs: programs.map(program => ({
          id: program,
          name: getProgramName(program),
          description: getProgramDescription(program)
        }))
      }
    });

  } catch (error) {
    next(error);
  }
});

// @desc    Get all scholarships
// @route   GET /api/scholarships
// @access  Public
router.get('/', queryValidation.pagination, async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const sort = req.query.sort || '-created_at';

    // Build query
    const query = {};

    // Optional authentication check
    let user = null;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      try {
        const token = req.headers.authorization.split(' ')[1];
        const jwt = require('jsonwebtoken');
        const User = require('../models/User');
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        user = await User.findOne({ id: decoded.userId }).select('-password');
      } catch (error) {
        // Token invalid, continue without authentication
      }
    }

    // Filter by status
    if (req.query.status && ['Active', 'Closed', 'Upcoming', 'Draft'].includes(req.query.status)) {
      query.status = req.query.status;
    } else {
      // For authenticated admin/staff users, show all scholarships by default
      // For public access, show only active scholarships
      if (user && (user.role === 'admin' || user.role === 'staff')) {
        // Show all scholarships for admin/staff
      } else {
        // Default to active scholarships for public access
        query.status = { $in: ['Active', 'Upcoming'] };
      }
    }

    // Filter by country
    if (req.query.country) {
      query.country = { $regex: req.query.country, $options: 'i' };
    }

    // Filter by university
    if (req.query.university) {
      query.university_name = { $regex: req.query.university, $options: 'i' };
    }

    // Filter by program
    if (req.query.program && ['UG', 'MSC', 'PhD', 'HOD'].includes(req.query.program)) {
      query.program = req.query.program;
    }

    // Filter by major
    if (req.query.major) {
      query.major = { $regex: req.query.major, $options: 'i' };
    }

    // Filter by featured
    if (req.query.featured === 'true') {
      query.is_featured = true;
    }

    // Search scholarships
    if (req.query.search) {
      query.$text = { $search: req.query.search };
    }

    // Filter by deadline
    if (req.query.deadline_from) {
      query.deadline = { ...query.deadline, $gte: new Date(req.query.deadline_from) };
    }

    if (req.query.deadline_to) {
      query.deadline = { ...query.deadline, $lte: new Date(req.query.deadline_to) };
    }

    // Filter by intake date
    if (req.query.intake_from) {
      query.intake_date = { ...query.intake_date, $gte: new Date(req.query.intake_from) };
    }

    if (req.query.intake_to) {
      query.intake_date = { ...query.intake_date, $lte: new Date(req.query.intake_to) };
    }

    const scholarships = await Scholarship.find(query)
      .populate('creator', 'first_name father_name email')
      .sort(sort)
      .skip(skip)
      .limit(limit);

    const total = await Scholarship.countDocuments(query);

    res.json({
      success: true,
      data: {
        scholarships,
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

// @desc    Get scholarship by ID
// @route   GET /api/scholarships/:id
// @access  Public
router.get('/:id', paramValidation.mongoId, async (req, res, next) => {
  try {
    const scholarship = await Scholarship.findById(req.params.id)
      .populate('creator', 'first_name father_name email')
      .populate('applications');

    if (!scholarship) {
      return res.status(404).json({
        success: false,
        message: 'Scholarship not found'
      });
    }

    // Increment view count
    await scholarship.incrementViewCount();

    res.json({
      success: true,
      data: { scholarship }
    });

  } catch (error) {
    next(error);
  }
});

// @desc    Create scholarship
// @route   POST /api/scholarships
// @access  Private (Admin/Staff only)
router.post('/', authenticate, staffOrAdmin, scholarshipValidation.create, async (req, res, next) => {
  try {
    // Handle field mapping
    const scholarshipData = {
      ...req.body,
      created_by: req.user.id,
      last_modified_by: req.user.id
    };

    // Convert application_fee to number
    if (scholarshipData.application_fee) {
      scholarshipData.application_fee = parseFloat(scholarshipData.application_fee);
    }

    const scholarship = await Scholarship.create(scholarshipData);

    // Populate the created scholarship
    const populatedScholarship = await Scholarship.findOne({ id: scholarship.id })
      .populate('creator', 'first_name father_name email');

    res.status(201).json({
      success: true,
      message: 'Scholarship created successfully',
      data: { scholarship: populatedScholarship }
    });

  } catch (error) {
    next(error);
  }
});

// @desc    Update scholarship
// @route   PUT /api/scholarships/:id
// @access  Private (Admin/Staff only)
router.put('/:id', authenticate, staffOrAdmin, paramValidation.integerId, async (req, res, next) => {
  try {
    const scholarship = await Scholarship.findOne({ id: parseInt(req.params.id) });

    if (!scholarship) {
      return res.status(404).json({
        success: false,
        message: 'Scholarship not found'
      });
    }

    // Check if user can update this scholarship
    // Admin and staff can update any scholarship, applicants can only update their own
    if (req.user.role === 'applicant' && req.user.id !== scholarship.created_by) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Update scholarship
    const updatedScholarship = await Scholarship.findOneAndUpdate(
      { id: parseInt(req.params.id) },
      {
        ...req.body,
        last_modified_by: req.user.id
      },
      { new: true, runValidators: true }
    ).populate('creator', 'first_name father_name email');

    res.json({
      success: true,
      message: 'Scholarship updated successfully',
      data: { scholarship: updatedScholarship }
    });

  } catch (error) {
    next(error);
  }
});

// @desc    Delete scholarship
// @route   DELETE /api/scholarships/:id
// @access  Private (Admin only)
router.delete('/:id', authenticate, authorize('admin'), paramValidation.integerId, async (req, res, next) => {
  try {
    const scholarship = await Scholarship.findOne({ id: parseInt(req.params.id) });

    if (!scholarship) {
      return res.status(404).json({
        success: false,
        message: 'Scholarship not found'
      });
    }

    // Check if there are any applications for this scholarship
    const applicationCount = await Application.countDocuments({ scholarship_id: req.params.id });

    if (applicationCount > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete scholarship with existing applications'
      });
    }

    await Scholarship.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Scholarship deleted successfully'
    });

  } catch (error) {
    next(error);
  }
});

// @desc    Get featured scholarships
// @route   GET /api/scholarships/featured/list
// @access  Public
router.get('/featured/list', async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit) || 5;
    
    const scholarships = await Scholarship.getFeaturedScholarships(limit);

    res.json({
      success: true,
      data: { scholarships }
    });

  } catch (error) {
    next(error);
  }
});

// @desc    Search scholarships
// @route   GET /api/scholarships/search
// @access  Public
router.get('/search', queryValidation.search, async (req, res, next) => {
  try {
    const { q } = req.query;
    const limit = parseInt(req.query.limit) || 20;
    const filters = {};

    // Apply filters
    if (req.query.country) {
      filters.country = { $regex: req.query.country, $options: 'i' };
    }

    if (req.query.university) {
      filters.university_name = { $regex: req.query.university, $options: 'i' };
    }

    if (req.query.program) {
      filters.program = req.query.program;
    }

    if (req.query.major) {
      filters.major = { $regex: req.query.major, $options: 'i' };
    }

    if (req.query.status) {
      filters.status = req.query.status;
    }

    if (req.query.featured === 'true') {
      filters.is_featured = true;
    }

    const scholarships = await Scholarship.searchScholarships(q, filters)
      .populate('creator', 'first_name father_name email')
      .limit(limit);

    res.json({
      success: true,
      data: { scholarships }
    });

  } catch (error) {
    next(error);
  }
});

// @desc    Get scholarships by country
// @route   GET /api/scholarships/country/:country
// @access  Public
router.get('/country/:country', async (req, res, next) => {
  try {
    const { country } = req.params;
    const limit = parseInt(req.query.limit) || 10;

    const scholarships = await Scholarship.findByCountry(country)
      .populate('creator', 'first_name father_name email')
      .limit(limit);

    res.json({
      success: true,
      data: { scholarships }
    });

  } catch (error) {
    next(error);
  }
});

// @desc    Get scholarships by university
// @route   GET /api/scholarships/university/:university
// @access  Public
router.get('/university/:university', async (req, res, next) => {
  try {
    const { university } = req.params;
    const limit = parseInt(req.query.limit) || 10;

    const scholarships = await Scholarship.findByUniversity(university)
      .populate('creator', 'first_name father_name email')
      .limit(limit);

    res.json({
      success: true,
      data: { scholarships }
    });

  } catch (error) {
    next(error);
  }
});

// @desc    Get scholarships by program
// @route   GET /api/scholarships/program/:program
// @access  Public
router.get('/program/:program', async (req, res, next) => {
  try {
    const { program } = req.params;
    const limit = parseInt(req.query.limit) || 10;

    if (!['UG', 'MSC', 'PhD', 'HOD'].includes(program)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid program type'
      });
    }

    const scholarships = await Scholarship.findByProgram(program)
      .populate('creator', 'first_name father_name email')
      .limit(limit);

    res.json({
      success: true,
      data: { scholarships }
    });

  } catch (error) {
    next(error);
  }
});

// @desc    Get scholarship statistics
// @route   GET /api/scholarships/stats/overview
// @access  Private (Admin/Staff only)
router.get('/stats/overview', authenticate, staffOrAdmin, async (req, res, next) => {
  try {
    const stats = await Scholarship.getScholarshipStats();

    const totalScholarships = await Scholarship.countDocuments();
    const activeScholarships = await Scholarship.countDocuments({ status: 'Active' });
    const upcomingScholarships = await Scholarship.countDocuments({ status: 'Upcoming' });
    const closedScholarships = await Scholarship.countDocuments({ status: 'Closed' });

    // Recent scholarships (last 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const recentScholarships = await Scholarship.countDocuments({
      createdAt: { $gte: thirtyDaysAgo }
    });

    res.json({
      success: true,
      data: {
        overview: {
          total_scholarships: totalScholarships,
          active_scholarships: activeScholarships,
          upcoming_scholarships: upcomingScholarships,
          closed_scholarships: closedScholarships,
          recent_scholarships: recentScholarships
        },
        ...stats
      }
    });

  } catch (error) {
    next(error);
  }
});

// @desc    Get top performing scholarships
// @route   GET /api/scholarships/stats/top-performing
// @access  Private (Admin/Staff only)
router.get('/stats/top-performing', authenticate, staffOrAdmin, async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit) || 10;

    const scholarships = await Scholarship.find({ status: 'Active' })
      .sort({ application_count: -1, view_count: -1 })
      .limit(limit)
      .populate('creator', 'first_name father_name email');

    res.json({
      success: true,
      data: { scholarships }
    });

  } catch (error) {
    next(error);
  }
});

// @desc    Update scholarship status
// @route   PUT /api/scholarships/:id/status
// @access  Private (Admin/Staff only)
router.put('/:id/status', authenticate, staffOrAdmin, paramValidation.mongoId, async (req, res, next) => {
  try {
    const { status } = req.body;

    if (!['Active', 'Closed', 'Upcoming', 'Draft'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status'
      });
    }

    const scholarship = await Scholarship.findOne({ id: parseInt(req.params.id) });

    if (!scholarship) {
      return res.status(404).json({
        success: false,
        message: 'Scholarship not found'
      });
    }

    // Check if user can update this scholarship
    // Admin and staff can update any scholarship, applicants can only update their own
    if (req.user.role === 'applicant' && req.user.id !== scholarship.created_by) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    scholarship.status = status;
    scholarship.last_modified_by = req.user.id;
    await scholarship.save();

    res.json({
      success: true,
      message: 'Scholarship status updated successfully',
      data: { scholarship }
    });

  } catch (error) {
    next(error);
  }
});

// @desc    Feature/Unfeature scholarship
// @route   PUT /api/scholarships/:id/feature
// @access  Private (Admin only)
router.put('/:id/feature', authenticate, authorize('admin'), paramValidation.mongoId, async (req, res, next) => {
  try {
    const { is_featured } = req.body;

    if (typeof is_featured !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: 'is_featured must be a boolean value'
      });
    }

    const scholarship = await Scholarship.findOne({ id: parseInt(req.params.id) });

    if (!scholarship) {
      return res.status(404).json({
        success: false,
        message: 'Scholarship not found'
      });
    }

    scholarship.is_featured = is_featured;
    scholarship.last_modified_by = req.user.id;
    await scholarship.save();

    res.json({
      success: true,
      message: `Scholarship ${is_featured ? 'featured' : 'unfeatured'} successfully`,
      data: { scholarship }
    });

  } catch (error) {
    next(error);
  }
});

// Helper functions
function getCountryFlag(country) {
  const flags = {
    'United States': '🇺🇸',
    'Canada': '🇨🇦',
    'United Kingdom': '🇬🇧',
    'Australia': '🇦🇺',
    'Germany': '🇩🇪',
    'France': '🇫🇷',
    'Netherlands': '🇳🇱',
    'Sweden': '🇸🇪',
    'Norway': '🇳🇴',
    'Denmark': '🇩🇰',
    'Finland': '🇫🇮',
    'Switzerland': '🇨🇭',
    'Austria': '🇦🇹',
    'Belgium': '🇧🇪',
    'Italy': '🇮🇹',
    'Spain': '🇪🇸',
    'Japan': '🇯🇵',
    'South Korea': '🇰🇷',
    'China': '🇨🇳',
    'Singapore': '🇸🇬',
    'New Zealand': '🇳🇿',
    'Ireland': '🇮🇪',
    'Portugal': '🇵🇹',
    'Czech Republic': '🇨🇿',
    'Poland': '🇵🇱',
    'Hungary': '🇭🇺',
    'Estonia': '🇪🇪',
    'Latvia': '🇱🇻',
    'Lithuania': '🇱🇹'
  };
  return flags[country] || '🌍';
}

function getProgramName(program) {
  const programs = {
    'UG': 'Bachelor\'s',
    'MSC': 'Master\'s',
    'PhD': 'PhD',
    'HOD': 'Higher Diploma'
  };
  return programs[program] || program;
}

function getProgramDescription(program) {
  const descriptions = {
    'UG': 'Undergraduate degree programs',
    'MSC': 'Graduate degree programs',
    'PhD': 'Doctoral degree programs',
    'HOD': 'Higher diploma programs'
  };
  return descriptions[program] || '';
}

module.exports = router;


