const { body, param, query, validationResult } = require('express-validator');

// Validation result handler
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }
  next();
};

// User validation rules
const userValidation = {
  register: [
    body('first_name')
      .trim()
      .notEmpty()
      .withMessage('First name is required')
      .isLength({ min: 2, max: 50 })
      .withMessage('First name must be between 2 and 50 characters'),
    
    body('father_name')
      .trim()
      .notEmpty()
      .withMessage('Father name is required')
      .isLength({ min: 2, max: 50 })
      .withMessage('Father name must be between 2 and 50 characters'),
    
    body('grandfather_name')
      .trim()
      .notEmpty()
      .withMessage('Grandfather name is required')
      .isLength({ min: 2, max: 50 })
      .withMessage('Grandfather name must be between 2 and 50 characters'),
    
    body('username')
      .trim()
      .notEmpty()
      .withMessage('Username is required')
      .isLength({ min: 3, max: 50 })
      .withMessage('Username must be between 3 and 50 characters')
      .matches(/^[a-zA-Z0-9_]+$/)
      .withMessage('Username can only contain letters, numbers, and underscores'),
    
    body('email')
      .trim()
      .notEmpty()
      .withMessage('Email is required')
      .isEmail()
      .withMessage('Please provide a valid email address')
      .normalizeEmail(),
    
    body('password')
      .notEmpty()
      .withMessage('Password is required')
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters long')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .withMessage('Password must contain at least one lowercase letter, one uppercase letter, and one number'),
    
    body('phone')
      .optional()
      .trim()
      .matches(/^[\+]?[1-9][\d]{0,15}$/)
      .withMessage('Please provide a valid phone number'),
    
    body('national_id')
      .optional()
      .trim()
      .isLength({ min: 5, max: 50 })
      .withMessage('National ID must be between 5 and 50 characters'),
    
    body('role')
      .optional()
      .isIn(['admin', 'staff', 'applicant'])
      .withMessage('Role must be admin, staff, or applicant'),
    
    handleValidationErrors
  ],

  login: [
    body('identifier')
      .trim()
      .notEmpty()
      .withMessage('Email or username is required'),
    
    body('password')
      .notEmpty()
      .withMessage('Password is required'),
    
    handleValidationErrors
  ],

  create: [
    body('first_name')
      .trim()
      .notEmpty()
      .withMessage('First name is required')
      .isLength({ min: 2, max: 50 })
      .withMessage('First name must be between 2 and 50 characters'),
    
    body('father_name')
      .trim()
      .notEmpty()
      .withMessage('Father name is required')
      .isLength({ min: 2, max: 50 })
      .withMessage('Father name must be between 2 and 50 characters'),
    
    body('grandfather_name')
      .trim()
      .notEmpty()
      .withMessage('Grandfather name is required')
      .isLength({ min: 2, max: 50 })
      .withMessage('Grandfather name must be between 2 and 50 characters'),
    
    body('username')
      .trim()
      .notEmpty()
      .withMessage('Username is required')
      .isLength({ min: 3, max: 50 })
      .withMessage('Username must be between 3 and 50 characters')
      .matches(/^[a-zA-Z0-9_]+$/)
      .withMessage('Username can only contain letters, numbers, and underscores'),
    
    body('email')
      .trim()
      .notEmpty()
      .withMessage('Email is required')
      .isEmail()
      .withMessage('Please provide a valid email address')
      .normalizeEmail(),
    
    body('password')
      .notEmpty()
      .withMessage('Password is required')
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters long')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .withMessage('Password must contain at least one lowercase letter, one uppercase letter, and one number'),
    
    body('phone')
      .optional()
      .trim()
      .matches(/^[\+]?[1-9][\d]{0,15}$/)
      .withMessage('Please provide a valid phone number'),
    
    body('national_id')
      .optional()
      .trim()
      .isLength({ min: 5, max: 50 })
      .withMessage('National ID must be between 5 and 50 characters'),
    
    body('role')
      .optional()
      .isIn(['admin', 'staff', 'applicant'])
      .withMessage('Role must be admin, staff, or applicant'),
    
    handleValidationErrors
  ],

  update: [
    body('first_name')
      .optional()
      .trim()
      .isLength({ min: 2, max: 50 })
      .withMessage('First name must be between 2 and 50 characters'),
    
    body('father_name')
      .optional()
      .trim()
      .isLength({ min: 2, max: 50 })
      .withMessage('Father name must be between 2 and 50 characters'),
    
    body('grandfather_name')
      .optional()
      .trim()
      .isLength({ min: 2, max: 50 })
      .withMessage('Grandfather name must be between 2 and 50 characters'),
    
    body('email')
      .optional()
      .trim()
      .isEmail()
      .withMessage('Please provide a valid email address')
      .normalizeEmail(),
    
    body('phone')
      .optional()
      .trim()
      .matches(/^[\+]?[1-9][\d]{0,15}$/)
      .withMessage('Please provide a valid phone number'),
    
    body('national_id')
      .optional()
      .trim()
      .isLength({ min: 5, max: 50 })
      .withMessage('National ID must be between 5 and 50 characters'),
    
    body('address')
      .optional()
      .trim()
      .isLength({ max: 500 })
      .withMessage('Address must be less than 500 characters'),
    
    handleValidationErrors
  ]
};

// Applicant validation rules
const applicantValidation = {
  create: [
    body('dob')
      .notEmpty()
      .withMessage('Date of birth is required')
      .isISO8601()
      .withMessage('Please provide a valid date of birth')
      .custom((value) => {
        const dob = new Date(value);
        const today = new Date();
        const age = today.getFullYear() - dob.getFullYear();
        if (age < 16 || age > 100) {
          throw new Error('Age must be between 16 and 100 years');
        }
        return true;
      }),
    
    body('gender')
      .notEmpty()
      .withMessage('Gender is required')
      .isIn(['Male', 'Female', 'Other'])
      .withMessage('Gender must be Male, Female, or Other'),
    
    body('nationality')
      .optional()
      .trim()
      .isLength({ max: 100 })
      .withMessage('Nationality must be less than 100 characters'),
    
    body('bio')
      .optional()
      .trim()
      .isLength({ max: 500 })
      .withMessage('Bio must be less than 500 characters'),
    
    handleValidationErrors
  ],

  update: [
    body('dob')
      .optional()
      .isISO8601()
      .withMessage('Please provide a valid date of birth'),
    
    body('gender')
      .optional()
      .isIn(['Male', 'Female', 'Other'])
      .withMessage('Gender must be Male, Female, or Other'),
    
    body('nationality')
      .optional()
      .trim()
      .isLength({ max: 100 })
      .withMessage('Nationality must be less than 100 characters'),
    
    body('bio')
      .optional()
      .trim()
      .isLength({ max: 500 })
      .withMessage('Bio must be less than 500 characters'),
    
    handleValidationErrors
  ]
};

// Education validation rules
const educationValidation = {
  create: [
    body('degree')
      .trim()
      .notEmpty()
      .withMessage('Degree is required')
      .isLength({ max: 50 })
      .withMessage('Degree must be less than 50 characters'),
    
    body('institution')
      .trim()
      .notEmpty()
      .withMessage('Institution name is required')
      .isLength({ max: 100 })
      .withMessage('Institution name must be less than 100 characters'),
    
    body('graduation_year')
      .notEmpty()
      .withMessage('Graduation year is required')
      .isInt({ min: 1900, max: new Date().getFullYear() + 10 })
      .withMessage('Graduation year must be a valid year'),
    
    body('gpa')
      .optional()
      .isFloat({ min: 0, max: 4.0 })
      .withMessage('GPA must be between 0 and 4.0'),
    
    body('major')
      .trim()
      .notEmpty()
      .withMessage('Major is required')
      .isLength({ max: 50 })
      .withMessage('Major must be less than 50 characters'),
    
    body('country')
      .optional()
      .trim()
      .isLength({ max: 50 })
      .withMessage('Country must be less than 50 characters'),
    
    body('start_date')
      .optional()
      .isISO8601()
      .withMessage('Please provide a valid start date'),
    
    body('end_date')
      .optional()
      .isISO8601()
      .withMessage('Please provide a valid end date'),
    
    handleValidationErrors
  ]
};

// Job validation rules
const jobValidation = {
  create: [
    body('name')
      .optional()
      .trim()
      .isLength({ max: 100 })
      .withMessage('Job name must be less than 100 characters'),
    
    body('title')
      .optional()
      .trim()
      .isLength({ max: 100 })
      .withMessage('Job title must be less than 100 characters'),
    
    // Custom validation to ensure at least one of name or title is provided
    body().custom((value, { req }) => {
      if (!req.body.name && !req.body.title) {
        throw new Error('Either job name or title is required');
      }
      return true;
    }),
    
    body('description')
      .trim()
      .notEmpty()
      .withMessage('Job description is required')
      .isLength({ min: 10 })
      .withMessage('Job description must be at least 10 characters'),
    
    body('country')
      .trim()
      .notEmpty()
      .withMessage('Country is required')
      .isLength({ max: 50 })
      .withMessage('Country must be less than 50 characters'),
    
    body('city')
      .optional()
      .trim()
      .isLength({ max: 50 })
      .withMessage('City must be less than 50 characters'),
    
    body('application_fee')
      .notEmpty()
      .withMessage('Application fee is required')
      .custom((value) => {
        const fee = parseFloat(value);
        if (isNaN(fee) || fee < 0) {
          throw new Error('Application fee must be a positive number');
        }
        return true;
      }),
    
    body('deadline')
      .notEmpty()
      .withMessage('Application deadline is required')
      .isISO8601()
      .withMessage('Please provide a valid deadline date'),
    
    body('company.name')
      .optional()
      .trim()
      .isLength({ max: 100 })
      .withMessage('Company name must be less than 100 characters'),
    
    body('company_name')
      .optional()
      .trim()
      .isLength({ max: 100 })
      .withMessage('Company name must be less than 100 characters'),
    
    handleValidationErrors
  ]
};

// Scholarship validation rules
const scholarshipValidation = {
  create: [
    body('name')
      .trim()
      .notEmpty()
      .withMessage('Scholarship name is required')
      .isLength({ max: 100 })
      .withMessage('Scholarship name must be less than 100 characters'),
    
    body('program')
      .notEmpty()
      .withMessage('Program is required')
      .isArray({ min: 1 })
      .withMessage('At least one program must be selected'),
    
    body('program.*')
      .isIn(['UG', 'MSC', 'PhD', 'HOD'])
      .withMessage('Invalid program type'),
    
    body('country')
      .trim()
      .notEmpty()
      .withMessage('Country is required')
      .isLength({ max: 50 })
      .withMessage('Country must be less than 50 characters'),
    
    body('university_name')
      .trim()
      .notEmpty()
      .withMessage('University name is required')
      .isLength({ max: 100 })
      .withMessage('University name must be less than 100 characters'),
    
    body('deadline')
      .notEmpty()
      .withMessage('Application deadline is required')
      .isISO8601()
      .withMessage('Please provide a valid deadline date'),
    
    body('intake_date')
      .notEmpty()
      .withMessage('Intake date is required')
      .isISO8601()
      .withMessage('Please provide a valid intake date'),
    
    body('major')
      .trim()
      .notEmpty()
      .withMessage('Major is required')
      .isLength({ max: 100 })
      .withMessage('Major must be less than 100 characters'),
    
    body('description')
      .trim()
      .notEmpty()
      .withMessage('Description is required')
      .isLength({ min: 10 })
      .withMessage('Description must be at least 10 characters'),
    
    body('application_fee')
      .notEmpty()
      .withMessage('Application fee is required')
      .custom((value) => {
        const fee = parseFloat(value);
        if (isNaN(fee) || fee < 0) {
          throw new Error('Application fee must be a positive number');
        }
        return true;
      }),
    
    handleValidationErrors
  ]
};

// Application validation rules
const applicationValidation = {
  create: [
    body('type')
      .notEmpty()
      .withMessage('Application type is required')
      .isIn(['Job', 'Scholarship'])
      .withMessage('Application type must be Job or Scholarship'),
    
    body('job_id')
      .if(body('type').equals('Job'))
      .notEmpty()
      .withMessage('Job ID is required for job applications')
      .isMongoId()
      .withMessage('Invalid job ID'),
    
    body('scholarship_id')
      .if(body('type').equals('Scholarship'))
      .notEmpty()
      .withMessage('Scholarship ID is required for scholarship applications')
      .isMongoId()
      .withMessage('Invalid scholarship ID'),
    
    handleValidationErrors
  ]
};

// Chat validation rules
const chatValidation = {
  send: [
    body('receiver_id')
      .notEmpty()
      .withMessage('Receiver ID is required')
      .isMongoId()
      .withMessage('Invalid receiver ID'),
    
    body('message')
      .trim()
      .notEmpty()
      .withMessage('Message is required')
      .isLength({ max: 2000 })
      .withMessage('Message must be less than 2000 characters'),
    
    body('message_type')
      .optional()
      .isIn(['text', 'image', 'file', 'system'])
      .withMessage('Invalid message type'),
    
    handleValidationErrors
  ]
};

// Ad validation rules
const adValidation = {
  create: [
    body('title')
      .trim()
      .notEmpty()
      .withMessage('Title is required')
      .isLength({ max: 255 })
      .withMessage('Title must be less than 255 characters'),
    
    body('description')
      .trim()
      .notEmpty()
      .withMessage('Description is required')
      .isLength({ min: 20 })
      .withMessage('Description must be at least 20 characters'),
    
    body('type')
      .optional()
      .isIn(['Announcement', 'News', 'Event', 'Promotion', 'Policy', 'Update'])
      .withMessage('Invalid ad type'),
    
    body('category')
      .optional()
      .isIn(['General', 'Job', 'Scholarship', 'System', 'Maintenance', 'Other'])
      .withMessage('Invalid ad category'),
    
    body('priority')
      .optional()
      .isIn(['Low', 'Normal', 'High', 'Urgent'])
      .withMessage('Invalid priority level'),
    
    body('target_audience')
      .optional()
      .isArray()
      .withMessage('Target audience must be an array'),
    
    body('target_audience.*')
      .isIn(['All', 'Applicants', 'Staff', 'Admin'])
      .withMessage('Invalid target audience'),
    
    handleValidationErrors
  ]
};

// Parameter validation rules
const paramValidation = {
  mongoId: [
    param('id')
      .isMongoId()
      .withMessage('Invalid ID format'),
    
    handleValidationErrors
  ],

  integerId: [
    param('id')
      .isInt({ min: 1 })
      .withMessage('ID must be a positive integer'),
    
    handleValidationErrors
  ],

  userId: [
    param('userId')
      .isMongoId()
      .withMessage('Invalid user ID format'),
    
    handleValidationErrors
  ]
};

// Query validation rules
const queryValidation = {
  pagination: [
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page must be a positive integer'),
    
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100'),
    
    query('sort')
      .optional()
      .isIn(['asc', 'desc', 'created_at', '-created_at', 'createdAt', '-createdAt', 'name', '-name', 'updated_at', '-updated_at', 'updatedAt', '-updatedAt'])
      .withMessage('Invalid sort option'),
    
    handleValidationErrors
  ],

  search: [
    query('q')
      .optional()
      .trim()
      .isLength({ min: 2 })
      .withMessage('Search query must be at least 2 characters'),
    
    handleValidationErrors
  ]
};

module.exports = {
  handleValidationErrors,
  userValidation,
  applicantValidation,
  educationValidation,
  jobValidation,
  scholarshipValidation,
  applicationValidation,
  chatValidation,
  adValidation,
  paramValidation,
  queryValidation
};

