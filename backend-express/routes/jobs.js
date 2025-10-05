const express = require('express');
const Job = require('../models/Job');
const Application = require('../models/Application');
const { authenticate, authorize, staffOrAdmin, checkStaffPermission } = require('../middleware/auth');
const { jobValidation, paramValidation, queryValidation } = require('../middleware/validation');

const router = express.Router();

// @desc    Get countries with available jobs
// @route   GET /api/jobs/countries
// @access  Public
router.get('/countries', async (req, res, next) => {
  try {
    const query = {};
    
    // Only show active jobs
    query.status = { $in: ['Active', 'Open'] };
    
    // Check if deadline hasn't passed
    query.deadline = { $gte: new Date() };

    const countries = await Job.distinct('country', query);
    
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

// @desc    Get all jobs
// @route   GET /api/jobs
// @access  Public
router.get('/', queryValidation.pagination, async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const sort = req.query.sort || '-created_at';

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

    // Build query
    const query = {};

    // Filter by status
    if (req.query.status && ['Active', 'Closed', 'Upcoming', 'Draft'].includes(req.query.status)) {
      query.status = req.query.status;
    } else {
      // For authenticated admin/staff users, show all jobs by default
      // For public access, show only active jobs
      if (user && (user.role === 'admin' || user.role === 'staff')) {
        // Show all jobs for admin/staff
      } else {
        // Default to active jobs for public access
        query.status = { $in: ['Active', 'Upcoming'] };
      }
    }

    // Filter by country
    if (req.query.country) {
      query.country = { $regex: req.query.country, $options: 'i' };
    }

    // Filter by company
    if (req.query.company) {
      query['company.name'] = { $regex: req.query.company, $options: 'i' };
    }

    // Filter by featured
    if (req.query.featured === 'true') {
      query.is_featured = true;
    }

    // Search jobs
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

    const jobs = await Job.find(query)
      .populate('creator', 'first_name father_name email')
      .sort(sort)
      .skip(skip)
      .limit(limit);

    const total = await Job.countDocuments(query);

    res.json({
      success: true,
      data: {
        jobs,
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

// @desc    Get job by ID
// @route   GET /api/jobs/:id
// @access  Public
router.get('/:id', paramValidation.integerId, async (req, res, next) => {
  try {
    const job = await Job.findOne({ id: parseInt(req.params.id) })
      .populate('creator', 'first_name father_name email')
      .populate('applications');

    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }

    // Increment view count
    await job.incrementViewCount();

    res.json({
      success: true,
      data: { job }
    });

  } catch (error) {
    next(error);
  }
});

// @desc    Create job
// @route   POST /api/jobs
// @access  Private (Admin/Staff only)
router.post('/', authenticate, staffOrAdmin, jobValidation.create, async (req, res, next) => {
  try {
    // Handle field mapping
    const jobData = {
      ...req.body,
      created_by: req.user.id,
      last_modified_by: req.user.id
    };

    // Map title to name if title is provided
    if (jobData.title && !jobData.name) {
      jobData.name = jobData.title;
    }

    // Map company_name to company.name if company_name is provided
    if (jobData.company_name && !jobData.company?.name) {
      jobData.company = {
        ...jobData.company,
        name: jobData.company_name
      };
    }

    // Convert application_fee to number
    if (jobData.application_fee) {
      jobData.application_fee = parseFloat(jobData.application_fee);
    }

    const job = await Job.create(jobData);

    // Populate the created job
    const populatedJob = await Job.findOne({ id: job.id })
      .populate('creator', 'first_name father_name email');

    res.status(201).json({
      success: true,
      message: 'Job created successfully',
      data: { job: populatedJob }
    });

  } catch (error) {
    next(error);
  }
});

// @desc    Update job
// @route   PUT /api/jobs/:id
// @access  Private (Admin/Staff only)
router.put('/:id', authenticate, staffOrAdmin, paramValidation.integerId, async (req, res, next) => {
  try {
    const job = await Job.findOne({ id: parseInt(req.params.id) });

    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }

    // Check if user can update this job
    // Admin and staff can update any job, applicants can only update their own
    if (req.user.role === 'applicant' && req.user.id !== job.created_by) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Update job
    const updatedJob = await Job.findOneAndUpdate(
      { id: parseInt(req.params.id) },
      {
        ...req.body,
        last_modified_by: req.user.id
      },
      { new: true, runValidators: true }
    ).populate('creator', 'first_name father_name email');

    res.json({
      success: true,
      message: 'Job updated successfully',
      data: { job: updatedJob }
    });

  } catch (error) {
    next(error);
  }
});

// @desc    Delete job
// @route   DELETE /api/jobs/:id
// @access  Private (Admin only)
router.delete('/:id', authenticate, authorize('admin'), paramValidation.integerId, async (req, res, next) => {
  try {
    const job = await Job.findOne({ id: parseInt(req.params.id) });

    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }

    // Check if there are any applications for this job
    const applicationCount = await Application.countDocuments({ job_id: req.params.id });

    if (applicationCount > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete job with existing applications'
      });
    }

    await Job.findOneAndDelete({ id: parseInt(req.params.id) });

    res.json({
      success: true,
      message: 'Job deleted successfully'
    });

  } catch (error) {
    next(error);
  }
});

// @desc    Get featured jobs
// @route   GET /api/jobs/featured/list
// @access  Public
router.get('/featured/list', async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit) || 5;
    
    const jobs = await Job.getFeaturedJobs(limit);

    res.json({
      success: true,
      data: { jobs }
    });

  } catch (error) {
    next(error);
  }
});

// @desc    Search jobs
// @route   GET /api/jobs/search
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

    if (req.query.status) {
      filters.status = req.query.status;
    }

    if (req.query.featured === 'true') {
      filters.is_featured = true;
    }

    const jobs = await Job.searchJobs(q, filters)
      .populate('creator', 'first_name father_name email')
      .limit(limit);

    res.json({
      success: true,
      data: { jobs }
    });

  } catch (error) {
    next(error);
  }
});

// @desc    Get jobs by country
// @route   GET /api/jobs/country/:country
// @access  Public
router.get('/country/:country', async (req, res, next) => {
  try {
    const { country } = req.params;
    const limit = parseInt(req.query.limit) || 10;

    const jobs = await Job.findByCountry(country)
      .populate('creator', 'first_name father_name email')
      .limit(limit);

    res.json({
      success: true,
      data: { jobs }
    });

  } catch (error) {
    next(error);
  }
});

// @desc    Get jobs by company
// @route   GET /api/jobs/company/:company
// @access  Public
router.get('/company/:company', async (req, res, next) => {
  try {
    const { company } = req.params;
    const limit = parseInt(req.query.limit) || 10;

    const jobs = await Job.findByCompany(company)
      .populate('creator', 'first_name father_name email')
      .limit(limit);

    res.json({
      success: true,
      data: { jobs }
    });

  } catch (error) {
    next(error);
  }
});

// @desc    Get job statistics
// @route   GET /api/jobs/stats/overview
// @access  Private (Admin/Staff only)
router.get('/stats/overview', authenticate, staffOrAdmin, async (req, res, next) => {
  try {
    const stats = await Job.getJobStats();

    const totalJobs = await Job.countDocuments();
    const activeJobs = await Job.countDocuments({ status: 'Active' });
    const upcomingJobs = await Job.countDocuments({ status: 'Upcoming' });
    const closedJobs = await Job.countDocuments({ status: 'Closed' });

    // Recent jobs (last 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const recentJobs = await Job.countDocuments({
      createdAt: { $gte: thirtyDaysAgo }
    });

    res.json({
      success: true,
      data: {
        overview: {
          total_jobs: totalJobs,
          active_jobs: activeJobs,
          upcoming_jobs: upcomingJobs,
          closed_jobs: closedJobs,
          recent_jobs: recentJobs
        },
        ...stats
      }
    });

  } catch (error) {
    next(error);
  }
});

// @desc    Get top performing jobs
// @route   GET /api/jobs/stats/top-performing
// @access  Private (Admin/Staff only)
router.get('/stats/top-performing', authenticate, staffOrAdmin, async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit) || 10;

    const jobs = await Job.find({ status: 'Active' })
      .sort({ application_count: -1, view_count: -1 })
      .limit(limit)
      .populate('creator', 'first_name father_name email');

    res.json({
      success: true,
      data: { jobs }
    });

  } catch (error) {
    next(error);
  }
});

// @desc    Update job status
// @route   PUT /api/jobs/:id/status
// @access  Private (Admin/Staff only)
router.put('/:id/status', authenticate, staffOrAdmin, paramValidation.integerId, async (req, res, next) => {
  try {
    const { status } = req.body;

    if (!['Active', 'Closed', 'Upcoming', 'Draft'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status'
      });
    }

    const job = await Job.findOne({ id: parseInt(req.params.id) });

    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }

    // Check if user can update this job
    // Admin and staff can update any job, applicants can only update their own
    if (req.user.role === 'applicant' && req.user.id !== job.created_by) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    job.status = status;
    job.last_modified_by = req.user.id;
    await job.save();

    res.json({
      success: true,
      message: 'Job status updated successfully',
      data: { job }
    });

  } catch (error) {
    next(error);
  }
});

// @desc    Feature/Unfeature job
// @route   PUT /api/jobs/:id/feature
// @access  Private (Admin only)
router.put('/:id/feature', authenticate, authorize('admin'), paramValidation.integerId, async (req, res, next) => {
  try {
    const { is_featured } = req.body;

    if (typeof is_featured !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: 'is_featured must be a boolean value'
      });
    }

    const job = await Job.findOne({ id: parseInt(req.params.id) });

    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }

    job.is_featured = is_featured;
    job.last_modified_by = req.user.id;
    await job.save();

    res.json({
      success: true,
      message: `Job ${is_featured ? 'featured' : 'unfeatured'} successfully`,
      data: { job }
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

module.exports = router;


