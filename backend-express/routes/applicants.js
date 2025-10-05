const express = require('express');
const Applicant = require('../models/Applicant');
const User = require('../models/User');
const Education = require('../models/Education');
const Document = require('../models/Document');
const { authenticate, authorize, staffOrAdmin, checkOwnership } = require('../middleware/auth');
const { applicantValidation, paramValidation, queryValidation } = require('../middleware/validation');

const router = express.Router();

// @desc    Get all applicants
// @route   GET /api/applicants
// @access  Private (Admin/Staff only)
router.get('/', authenticate, staffOrAdmin, queryValidation.pagination, async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const sort = req.query.sort || '-created_at';

    // Build query
    const query = {};

    // Filter by profile completion
    if (req.query.min_completion) {
      query.profile_completion = { $gte: parseInt(req.query.min_completion) };
    }

    // Filter by gender
    if (req.query.gender && ['Male', 'Female', 'Other'].includes(req.query.gender)) {
      query.gender = req.query.gender;
    }

    // Search by user details
    if (req.query.search) {
      const userQuery = {
        $or: [
          { first_name: { $regex: req.query.search, $options: 'i' } },
          { father_name: { $regex: req.query.search, $options: 'i' } },
          { grandfather_name: { $regex: req.query.search, $options: 'i' } },
          { email: { $regex: req.query.search, $options: 'i' } }
        ]
      };
      
      const matchingUsers = await User.find(userQuery).select('id');
      const userIds = matchingUsers.map(user => user.id);
      
      if (userIds.length > 0) {
        query.user_id = { $in: userIds };
      } else {
        // No matching users found
        query.user_id = { $in: [] };
      }
    }

    const applicants = await Applicant.find(query)
      .populate({
        path: 'user',
        select: 'first_name father_name grandfather_name email username phone national_id is_active is_verified created_at id'
      })
      .populate('education')
      .populate('documents')
      .sort(sort)
      .skip(skip)
      .limit(limit);

    const total = await Applicant.countDocuments(query);

    // Transform applicants to include user_id for frontend compatibility
    const transformedApplicants = applicants.map(applicant => {
      const applicantObj = applicant.toObject();
      if (applicantObj.user) {
        applicantObj.user_id = applicantObj.user;
        delete applicantObj.user;
      }
      return applicantObj;
    });

    res.json({
      success: true,
      data: {
        applicants: transformedApplicants,
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

// @desc    Get applicant by ID
// @route   GET /api/applicants/:id
// @access  Private
router.get('/:id', authenticate, paramValidation.integerId, async (req, res, next) => {
  try {
    const applicant = await Applicant.findOne({ id: parseInt(req.params.id) })
      .populate({
        path: 'user',
        select: 'first_name father_name grandfather_name email username phone national_id address is_active is_verified'
      })
      .populate('education')
      .populate('documents')
      .populate('applications');

    if (!applicant) {
      return res.status(404).json({
        success: false,
        message: 'Applicant not found'
      });
    }

    // Check if user can access this profile
    if (req.user.role !== 'admin' && req.user.role !== 'staff' && 
        req.user.id.toString() !== applicant.user.id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Transform applicant to include user_id for frontend compatibility
    const applicantObj = applicant.toObject();
    if (applicantObj.user) {
      applicantObj.user_id = applicantObj.user;
      delete applicantObj.user;
    }

    res.json({
      success: true,
      data: { applicant: applicantObj }
    });

  } catch (error) {
    next(error);
  }
});

// @desc    Get current user's applicant profile
// @route   GET /api/applicants/profile/me
// @access  Private (Applicant only)
router.get('/profile/me', authenticate, authorize('applicant'), async (req, res, next) => {
  try {
    const applicant = await Applicant.findOne({ user_id: req.user.id })
      .populate({
        path: 'user_id',
        select: 'first_name father_name grandfather_name email username phone national_id address'
      })
      .populate('education')
      .populate('documents')
      .populate('applications');

    if (!applicant) {
      return res.status(404).json({
        success: false,
        message: 'Applicant profile not found'
      });
    }

    res.json({
      success: true,
      data: { applicant }
    });

  } catch (error) {
    next(error);
  }
});

// @desc    Create applicant profile
// @route   POST /api/applicants
// @access  Private (Applicant only)
router.post('/', authenticate, authorize('applicant'), applicantValidation.create, async (req, res, next) => {
  try {
    // Check if applicant profile already exists
    const existingApplicant = await Applicant.findOne({ user_id: req.user.id });

    if (existingApplicant) {
      return res.status(400).json({
        success: false,
        message: 'Applicant profile already exists'
      });
    }

    const applicant = await Applicant.create({
      user_id: req.user.id,
      ...req.body
    });

    // Populate the created applicant
    const populatedApplicant = await Applicant.findById(applicant._id)
      .populate({
        path: 'user_id',
        select: 'first_name father_name grandfather_name email username phone national_id'
      });

    res.status(201).json({
      success: true,
      message: 'Applicant profile created successfully',
      data: { applicant: populatedApplicant }
    });

  } catch (error) {
    next(error);
  }
});

// @desc    Update applicant profile
// @route   PUT /api/applicants/:id
// @access  Private
router.put('/:id', authenticate, paramValidation.integerId, applicantValidation.update, async (req, res, next) => {
  try {
    const applicant = await Applicant.findOne({ id: parseInt(req.params.id) });

    if (!applicant) {
      return res.status(404).json({
        success: false,
        message: 'Applicant not found'
      });
    }

    // Check if user can update this profile
    if (req.user.role !== 'admin' && req.user.role !== 'staff' && 
        req.user.id.toString() !== applicant.user_id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Update applicant
    const updatedApplicant = await Applicant.findOneAndUpdate(
      { id: parseInt(req.params.id) },
      req.body,
      { new: true, runValidators: true }
    ).populate({
      path: 'user_id',
      select: 'first_name father_name grandfather_name email username phone national_id'
    });

    res.json({
      success: true,
      message: 'Applicant profile updated successfully',
      data: { applicant: updatedApplicant }
    });

  } catch (error) {
    next(error);
  }
});

// @desc    Update current user's applicant profile
// @route   PUT /api/applicants/profile/me
// @access  Private (Applicant only)
router.put('/profile/me', authenticate, authorize('applicant'), applicantValidation.update, async (req, res, next) => {
  try {
    const applicant = await Applicant.findOne({ user_id: req.user.id });

    if (!applicant) {
      return res.status(404).json({
        success: false,
        message: 'Applicant profile not found'
      });
    }

    // Update applicant
    const updatedApplicant = await Applicant.findByIdAndUpdate(
      applicant._id,
      req.body,
      { new: true, runValidators: true }
    ).populate({
      path: 'user_id',
      select: 'first_name father_name grandfather_name email username phone national_id'
    });

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: { applicant: updatedApplicant }
    });

  } catch (error) {
    next(error);
  }
});

// @desc    Add skill to applicant
// @route   POST /api/applicants/:id/skills
// @access  Private
router.post('/:id/skills', authenticate, paramValidation.integerId, async (req, res, next) => {
  try {
    const { skill } = req.body;

    if (!skill || skill.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Skill is required'
      });
    }

    const applicant = await Applicant.findOne({ id: parseInt(req.params.id) });

    if (!applicant) {
      return res.status(404).json({
        success: false,
        message: 'Applicant not found'
      });
    }

    // Check if user can update this profile
    if (req.user.role !== 'admin' && req.user.role !== 'staff' && 
        req.user.id.toString() !== applicant.user_id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    await applicant.addSkill(skill.trim());

    res.json({
      success: true,
      message: 'Skill added successfully',
      data: { skills: applicant.skills }
    });

  } catch (error) {
    next(error);
  }
});

// @desc    Remove skill from applicant
// @route   DELETE /api/applicants/:id/skills/:skill
// @access  Private
router.delete('/:id/skills/:skill', authenticate, paramValidation.integerId, async (req, res, next) => {
  try {
    const applicant = await Applicant.findOne({ id: parseInt(req.params.id) });

    if (!applicant) {
      return res.status(404).json({
        success: false,
        message: 'Applicant not found'
      });
    }

    // Check if user can update this profile
    if (req.user.role !== 'admin' && req.user.role !== 'staff' && 
        req.user.id.toString() !== applicant.user_id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    await applicant.removeSkill(req.params.skill);

    res.json({
      success: true,
      message: 'Skill removed successfully',
      data: { skills: applicant.skills }
    });

  } catch (error) {
    next(error);
  }
});

// @desc    Add language to applicant
// @route   POST /api/applicants/:id/languages
// @access  Private
router.post('/:id/languages', authenticate, paramValidation.integerId, async (req, res, next) => {
  try {
    const { language, proficiency } = req.body;

    if (!language || !proficiency) {
      return res.status(400).json({
        success: false,
        message: 'Language and proficiency are required'
      });
    }

    if (!['Beginner', 'Intermediate', 'Advanced', 'Native'].includes(proficiency)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid proficiency level'
      });
    }

    const applicant = await Applicant.findOne({ id: parseInt(req.params.id) });

    if (!applicant) {
      return res.status(404).json({
        success: false,
        message: 'Applicant not found'
      });
    }

    // Check if user can update this profile
    if (req.user.role !== 'admin' && req.user.role !== 'staff' && 
        req.user.id.toString() !== applicant.user_id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    await applicant.addLanguage(language.trim(), proficiency);

    res.json({
      success: true,
      message: 'Language added successfully',
      data: { languages: applicant.languages }
    });

  } catch (error) {
    next(error);
  }
});

// @desc    Remove language from applicant
// @route   DELETE /api/applicants/:id/languages/:language
// @access  Private
router.delete('/:id/languages/:language', authenticate, paramValidation.integerId, async (req, res, next) => {
  try {
    const applicant = await Applicant.findOne({ id: parseInt(req.params.id) });

    if (!applicant) {
      return res.status(404).json({
        success: false,
        message: 'Applicant not found'
      });
    }

    // Check if user can update this profile
    if (req.user.role !== 'admin' && req.user.role !== 'staff' && 
        req.user.id.toString() !== applicant.user_id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    await applicant.removeLanguage(req.params.language);

    res.json({
      success: true,
      message: 'Language removed successfully',
      data: { languages: applicant.languages }
    });

  } catch (error) {
    next(error);
  }
});

// @desc    Get applicant statistics
// @route   GET /api/applicants/stats/overview
// @access  Private (Admin/Staff only)
router.get('/stats/overview', authenticate, staffOrAdmin, async (req, res, next) => {
  try {
    const stats = await Applicant.aggregate([
      {
        $group: {
          _id: null,
          total_applicants: { $sum: 1 },
          avg_profile_completion: { $avg: '$profile_completion' },
          gender_distribution: {
            $push: '$gender'
          }
        }
      }
    ]);

    const genderStats = await Applicant.aggregate([
      {
        $group: {
          _id: '$gender',
          count: { $sum: 1 }
        }
      }
    ]);

    const profileCompletionStats = await Applicant.aggregate([
      {
        $bucket: {
          groupBy: '$profile_completion',
          boundaries: [0, 25, 50, 75, 100],
          default: 'other',
          output: {
            count: { $sum: 1 }
          }
        }
      }
    ]);

    const totalApplicants = await Applicant.countDocuments();
    const completedProfiles = await Applicant.countDocuments({ profile_completion: 100 });

    res.json({
      success: true,
      data: {
        overview: {
          total_applicants: totalApplicants,
          completed_profiles: completedProfiles,
          completion_rate: totalApplicants > 0 ? Math.round((completedProfiles / totalApplicants) * 100) : 0
        },
        gender_stats: genderStats,
        profile_completion_stats: profileCompletionStats,
        detailed_stats: stats[0] || {}
      }
    });

  } catch (error) {
    next(error);
  }
});

module.exports = router;


