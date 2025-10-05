const express = require('express');
const Application = require('../models/Application');
const Job = require('../models/Job');
const Scholarship = require('../models/Scholarship');
const Applicant = require('../models/Applicant');
const { authenticate, authorize, staffOrAdmin, checkOwnership } = require('../middleware/auth');
const { applicationValidation, paramValidation, queryValidation } = require('../middleware/validation');

const router = express.Router();

// @desc    Get all applications
// @route   GET /api/applications
// @access  Private (Admin/Staff only)
router.get('/', authenticate, staffOrAdmin, queryValidation.pagination, async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const sort = req.query.sort || '-created_at';

    // Build query
    const query = {};

    // Filter by status
    if (req.query.status && ['Draft', 'In Progress', 'Submitted', 'Under Review', 'Approved', 'Rejected', 'Withdrawn'].includes(req.query.status)) {
      query.status = req.query.status;
    }

    // Filter by type
    if (req.query.type && ['Job', 'Scholarship'].includes(req.query.type)) {
      query.type = req.query.type;
    }

    // Filter by job_id
    if (req.query.job_id) {
      query.job_id = req.query.job_id;
    }

    // Filter by scholarship_id
    if (req.query.scholarship_id) {
      query.scholarship_id = req.query.scholarship_id;
    }

    // Filter by applicant_id
    if (req.query.applicant_id) {
      query.applicant_id = req.query.applicant_id;
    }

    // Filter by progress
    if (req.query.min_progress) {
      query.progress = { $gte: parseInt(req.query.min_progress) };
    }

    const applications = await Application.find(query)
      .populate('applicant_id')
      .populate('job_id')
      .populate('scholarship_id')
      .populate('last_modified_by', 'first_name father_name email')
      .sort(sort)
      .skip(skip)
      .limit(limit);

    const total = await Application.countDocuments(query);

    res.json({
      success: true,
      data: {
        applications,
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

// @desc    Get application by ID
// @route   GET /api/applications/:id
// @access  Private
router.get('/:id', authenticate, paramValidation.mongoId, async (req, res, next) => {
  try {
    const application = await Application.findById(req.params.id)
      .populate('applicant_id')
      .populate('job_id')
      .populate('scholarship_id')
      .populate('last_modified_by', 'first_name father_name email')
      .populate('review_notes.reviewer_id', 'first_name father_name email')
      .populate('documents');

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      });
    }

    // Check if user can access this application
    if (req.user.role !== 'admin' && req.user.role !== 'staff' && 
        req.user.id.toString() !== application.applicant_id.user_id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    res.json({
      success: true,
      data: { application }
    });

  } catch (error) {
    next(error);
  }
});

// @desc    Get current user's applications
// @route   GET /api/applications/my/list
// @access  Private (Applicant, Staff, Admin)
router.get('/my/list', authenticate, authorize('applicant', 'staff', 'admin'), queryValidation.pagination, async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const sort = req.query.sort || '-created_at';

    let query = {};
    
    // For applicants, only show their own applications
    if (req.user.role === 'applicant') {
      const applicant = await Applicant.findOne({ user_id: req.user.id });

      if (!applicant) {
        return res.status(404).json({
          success: false,
          message: 'Applicant profile not found'
        });
      }
      
      query = { applicant_id: applicant._id };
    }
    // For staff and admin, show all applications (no filtering by applicant)

    // Filter by status
    if (req.query.status && ['Draft', 'In Progress', 'Submitted', 'Under Review', 'Approved', 'Rejected', 'Withdrawn'].includes(req.query.status)) {
      query.status = req.query.status;
    }

    // Filter by type
    if (req.query.type && ['Job', 'Scholarship'].includes(req.query.type)) {
      query.type = req.query.type;
    }

    const applications = await Application.find(query)
      .populate('job_id', 'name company application_fee deadline status')
      .populate('scholarship_id', 'name university_name application_fee deadline status')
      .sort(sort)
      .skip(skip)
      .limit(limit);

    const total = await Application.countDocuments(query);

    res.json({
      success: true,
      data: {
        applications,
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

// @desc    Create application
// @route   POST /api/applications
// @access  Private (Applicant only)
router.post('/', authenticate, authorize('applicant'), applicationValidation.create, async (req, res, next) => {
  try {
    // Get applicant profile
    const applicant = await Applicant.findOne({ user_id: req.user.id });

    if (!applicant) {
      return res.status(404).json({
        success: false,
        message: 'Applicant profile not found'
      });
    }

    const { type, job_id, scholarship_id } = req.body;

    // Validate that the job or scholarship exists and is active
    if (type === 'Job') {
      const job = await Job.findById(job_id);
      if (!job || job.status !== 'Active') {
        return res.status(400).json({
          success: false,
          message: 'Job not found or not active'
        });
      }

      // Check if deadline has passed
      if (new Date() > new Date(job.deadline)) {
        return res.status(400).json({
          success: false,
          message: 'Application deadline has passed'
        });
      }

      // Check if user already applied for this job
      const existingApplication = await Application.findOne({
        applicant_id: applicant._id,
        job_id: job_id
      });

      if (existingApplication) {
        return res.status(400).json({
          success: false,
          message: 'You have already applied for this job'
        });
      }
    }

    if (type === 'Scholarship') {
      const scholarship = await Scholarship.findById(scholarship_id);
      if (!scholarship || scholarship.status !== 'Active') {
        return res.status(400).json({
          success: false,
          message: 'Scholarship not found or not active'
        });
      }

      // Check if deadline has passed
      if (new Date() > new Date(scholarship.deadline)) {
        return res.status(400).json({
          success: false,
          message: 'Application deadline has passed'
        });
      }

      // Check if user already applied for this scholarship
      const existingApplication = await Application.findOne({
        applicant_id: applicant._id,
        scholarship_id: scholarship_id
      });

      if (existingApplication) {
        return res.status(400).json({
          success: false,
          message: 'You have already applied for this scholarship'
        });
      }
    }

    // Create application
    const application = await Application.create({
      applicant_id: applicant._id,
      type,
      job_id: type === 'Job' ? job_id : null,
      scholarship_id: type === 'Scholarship' ? scholarship_id : null,
      status: 'Draft',
      progress: 0
    });

    // Increment application count for job or scholarship
    if (type === 'Job') {
      await Job.findByIdAndUpdate(job_id, { $inc: { application_count: 1 } });
    } else {
      await Scholarship.findByIdAndUpdate(scholarship_id, { $inc: { application_count: 1 } });
    }

    // Populate the created application
    const populatedApplication = await Application.findById(application._id)
      .populate('job_id', 'name company application_fee deadline status')
      .populate('scholarship_id', 'name university_name application_fee deadline status');

    res.status(201).json({
      success: true,
      message: 'Application created successfully',
      data: { application: populatedApplication }
    });

  } catch (error) {
    next(error);
  }
});

// @desc    Update application
// @route   PUT /api/applications/:id
// @access  Private
router.put('/:id', authenticate, paramValidation.mongoId, async (req, res, next) => {
  try {
    const application = await Application.findById(req.params.id);

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      });
    }

    // Check if user can update this application
    if (req.user.role !== 'admin' && req.user.role !== 'staff' && 
        req.user.id.toString() !== application.applicant_id.user_id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Update application
    const updatedApplication = await Application.findByIdAndUpdate(
      req.params.id,
      {
        ...req.body,
        last_modified_by: req.user.id
      },
      { new: true, runValidators: true }
    ).populate('job_id', 'name company application_fee deadline status')
     .populate('scholarship_id', 'name university_name application_fee deadline status');

    res.json({
      success: true,
      message: 'Application updated successfully',
      data: { application: updatedApplication }
    });

  } catch (error) {
    next(error);
  }
});

// @desc    Submit application
// @route   PUT /api/applications/:id/submit
// @access  Private (Applicant only)
router.put('/:id/submit', authenticate, authorize('applicant'), paramValidation.mongoId, async (req, res, next) => {
  try {
    const application = await Application.findById(req.params.id);

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      });
    }

    // Check if user owns this application
    if (req.user.id.toString() !== application.applicant_id.user_id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Check if application is already submitted
    if (application.status !== 'Draft' && application.status !== 'In Progress') {
      return res.status(400).json({
        success: false,
        message: 'Application has already been submitted'
      });
    }

    // Check if application is complete enough to submit
    if (application.progress < 80) {
      return res.status(400).json({
        success: false,
        message: 'Application must be at least 80% complete to submit'
      });
    }

    // Submit application
    await application.updateStatus('Submitted', req.user.id);

    res.json({
      success: true,
      message: 'Application submitted successfully',
      data: { application }
    });

  } catch (error) {
    next(error);
  }
});

// @desc    Restart application
// @route   PUT /api/applications/:id/restart
// @access  Private (Applicant only)
router.put('/:id/restart', authenticate, authorize('applicant'), paramValidation.mongoId, async (req, res, next) => {
  try {
    const application = await Application.findById(req.params.id);

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      });
    }

    // Check if user owns this application
    if (req.user.id.toString() !== application.applicant_id.user_id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Check if application can be restarted (not submitted or approved)
    if (application.status === 'Submitted' || application.status === 'Approved') {
      return res.status(400).json({
        success: false,
        message: 'Cannot restart submitted or approved applications'
      });
    }

    // Restart application - reset progress and status
    const updatedApplication = await Application.findByIdAndUpdate(
      req.params.id,
      {
        status: 'Draft',
        progress: 0,
        current_step: 0,
        last_modified_by: req.user.id,
        $unset: {
          submitted_at: 1
        }
      },
      { new: true, runValidators: true }
    ).populate('job_id', 'name company application_fee deadline status')
     .populate('scholarship_id', 'name university_name application_fee deadline status');

    res.json({
      success: true,
      message: 'Application restarted successfully',
      data: { application: updatedApplication }
    });

  } catch (error) {
    next(error);
  }
});

// @desc    Update application status (Admin/Staff only)
// @route   PUT /api/applications/:id/status
// @access  Private (Admin/Staff only)
router.put('/:id/status', authenticate, staffOrAdmin, paramValidation.mongoId, async (req, res, next) => {
  try {
    const { status } = req.body;

    if (!['Draft', 'In Progress', 'Submitted', 'Under Review', 'Approved', 'Rejected', 'Withdrawn'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status'
      });
    }

    const application = await Application.findById(req.params.id);

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      });
    }

    // Update status
    await application.updateStatus(status, req.user.id);

    res.json({
      success: true,
      message: 'Application status updated successfully',
      data: { application }
    });

  } catch (error) {
    next(error);
  }
});

// @desc    Add review note to application
// @route   POST /api/applications/:id/notes
// @access  Private (Admin/Staff only)
router.post('/:id/notes', authenticate, staffOrAdmin, paramValidation.mongoId, async (req, res, next) => {
  try {
    const { note, status = 'Info' } = req.body;

    if (!note || note.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Note is required'
      });
    }

    if (!['Info', 'Warning', 'Error', 'Success'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid note status'
      });
    }

    const application = await Application.findById(req.params.id);

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      });
    }

    // Add review note
    await application.addReviewNote(req.user.id, note.trim(), status);

    res.json({
      success: true,
      message: 'Review note added successfully',
      data: { application }
    });

  } catch (error) {
    next(error);
  }
});

// @desc    Get application statistics
// @route   GET /api/applications/stats/overview
// @access  Private (Admin/Staff only)
router.get('/stats/overview', authenticate, staffOrAdmin, async (req, res, next) => {
  try {
    const stats = await Application.getApplicationStats();

    const totalApplications = await Application.countDocuments();
    const submittedApplications = await Application.countDocuments({ status: 'Submitted' });
    const approvedApplications = await Application.countDocuments({ status: 'Approved' });
    const rejectedApplications = await Application.countDocuments({ status: 'Rejected' });

    // Recent applications (last 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const recentApplications = await Application.countDocuments({
      createdAt: { $gte: thirtyDaysAgo }
    });

    res.json({
      success: true,
      data: {
        overview: {
          total_applications: totalApplications,
          submitted_applications: submittedApplications,
          approved_applications: approvedApplications,
          rejected_applications: rejectedApplications,
          recent_applications: recentApplications
        },
        ...stats
      }
    });

  } catch (error) {
    next(error);
  }
});

// @desc    Get pending applications
// @route   GET /api/applications/pending/list
// @access  Private (Admin/Staff only)
router.get('/pending/list', authenticate, staffOrAdmin, async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit) || 20;

    const applications = await Application.getPendingApplications()
      .populate('applicant_id')
      .populate('job_id', 'name company')
      .populate('scholarship_id', 'name university_name')
      .limit(limit);

    res.json({
      success: true,
      data: { applications }
    });

  } catch (error) {
    next(error);
  }
});

module.exports = router;


