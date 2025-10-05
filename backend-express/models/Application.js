const mongoose = require('mongoose');
const IdCounter = require('./IdCounter');

const applicationSchema = new mongoose.Schema({
  id: {
    type: Number,
    unique: true
  },
  applicant_id: {
    type: Number,
    ref: 'Applicant',
    required: true
  },
  type: {
    type: String,
    enum: ['Job', 'Scholarship'],
    required: true
  },
  job_id: {
    type: Number,
    ref: 'Job',
    default: null
  },
  scholarship_id: {
    type: Number,
    ref: 'Scholarship',
    default: null
  },
  status: {
    type: String,
    enum: ['Draft', 'In Progress', 'Submitted', 'Under Review', 'Approved', 'Rejected', 'Withdrawn'],
    default: 'Draft'
  },
  progress: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  current_step: {
    type: Number,
    default: 0,
    min: 0
  },
  passport_number: {
    type: String,
    trim: true,
    maxlength: 50
  },
  job_interest: {
    type: String,
    trim: true,
    maxlength: 255
  },
  application_data: {
    personal_info: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },
    academic_info: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },
    work_experience: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },
    documents: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },
    additional_info: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    }
  },
  review_notes: [{
    reviewer_id: {
      type: Number,
      ref: 'User',
      required: true
    },
    note: {
      type: String,
      required: true,
      trim: true
    },
    status: {
      type: String,
      enum: ['Info', 'Warning', 'Error', 'Success'],
      default: 'Info'
    },
    created_at: {
      type: Date,
      default: Date.now
    }
  }],
  interview_details: {
    scheduled_date: {
      type: Date
    },
    interview_type: {
      type: String,
      enum: ['In-person', 'Video Call', 'Phone Call'],
      default: 'Video Call'
    },
    interviewer_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    meeting_link: {
      type: String,
      trim: true
    },
    notes: {
      type: String,
      trim: true
    },
    result: {
      type: String,
      enum: ['Passed', 'Failed', 'Pending'],
      default: 'Pending'
    }
  },
  payment_info: {
    amount: {
      type: Number,
      min: 0
    },
    currency: {
      type: String,
      default: 'USD'
    },
    payment_method: {
      type: String,
      enum: ['Credit Card', 'Bank Transfer', 'PayPal', 'Cash'],
      default: 'Credit Card'
    },
    payment_status: {
      type: String,
      enum: ['Pending', 'Paid', 'Failed', 'Refunded'],
      default: 'Pending'
    },
    payment_date: {
      type: Date
    },
    transaction_id: {
      type: String,
      trim: true
    }
  },
  submission_date: {
    type: Date
  },
  last_modified_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
applicationSchema.index({ id: 1 });
applicationSchema.index({ applicant_id: 1 });
applicationSchema.index({ job_id: 1 });
applicationSchema.index({ scholarship_id: 1 });
applicationSchema.index({ type: 1 });
applicationSchema.index({ status: 1 });
applicationSchema.index({ created_at: -1 });
applicationSchema.index({ submission_date: -1 });

// Virtual for applicant
applicationSchema.virtual('applicant', {
  ref: 'Applicant',
  localField: 'applicant_id',
  foreignField: 'id',
  justOne: true
});

// Virtual for job
applicationSchema.virtual('job', {
  ref: 'Job',
  localField: 'job_id',
  foreignField: 'id',
  justOne: true
});

// Virtual for scholarship
applicationSchema.virtual('scholarship', {
  ref: 'Scholarship',
  localField: 'scholarship_id',
  foreignField: 'id',
  justOne: true
});

// Virtual for documents
applicationSchema.virtual('documents', {
  ref: 'Document',
  localField: 'id',
  foreignField: 'application_id'
});

// Virtual for target entity (job or scholarship)
applicationSchema.virtual('target_entity', {
  refPath: 'type',
  localField: function() {
    return this.type === 'Job' ? 'job_id' : 'scholarship_id';
  },
  foreignField: 'id',
  justOne: true
});

// Virtual for days since submission
applicationSchema.virtual('days_since_submission').get(function() {
  if (!this.submission_date) return null;
  const now = new Date();
  const submission = new Date(this.submission_date);
  const diffTime = now - submission;
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
});

// Virtual for is submitted
applicationSchema.virtual('is_submitted').get(function() {
  return this.status !== 'Draft' && this.submission_date !== null;
});

// Pre-save middleware to assign ID and validate application
applicationSchema.pre('save', async function(next) {
  try {
    // Assign auto-incrementing ID if new document
    if (this.isNew && !this.id) {
      const counter = await IdCounter.getNextSequence('application_id');
      this.id = counter.sequence_value;
    }
    
    // Validate that either job_id or scholarship_id is provided based on type
    if (this.type === 'Job' && !this.job_id) {
      return next(new Error('Job ID is required for job applications'));
    }
    
    if (this.type === 'Scholarship' && !this.scholarship_id) {
      return next(new Error('Scholarship ID is required for scholarship applications'));
    }
    
    // Set submission date when status changes to submitted
    if (this.isModified('status') && this.status === 'Submitted' && !this.submission_date) {
      this.submission_date = new Date();
    }
    
    // Calculate progress based on application data
    this.calculateProgress();
    
    next();
  } catch (error) {
    next(error);
  }
});

// Instance method to calculate progress
applicationSchema.methods.calculateProgress = function() {
  let progress = 0;
  const sections = Object.keys(this.application_data);
  const totalSections = sections.length;
  
  if (totalSections === 0) {
    this.progress = 0;
    return;
  }
  
  sections.forEach(section => {
    const sectionData = this.application_data[section];
    if (sectionData && Object.keys(sectionData).length > 0) {
      progress += (100 / totalSections);
    }
  });
  
  this.progress = Math.round(progress);
};

// Instance method to add review note
applicationSchema.methods.addReviewNote = function(reviewerId, note, status = 'Info') {
  this.review_notes.push({
    reviewer_id: reviewerId,
    note,
    status,
    created_at: new Date()
  });
  return this.save();
};

// Instance method to update status
applicationSchema.methods.updateStatus = function(newStatus, userId = null) {
  this.status = newStatus;
  if (userId) {
    this.last_modified_by = userId;
  }
  
  if (newStatus === 'Submitted' && !this.submission_date) {
    this.submission_date = new Date();
  }
  
  return this.save();
};

// Instance method to schedule interview
applicationSchema.methods.scheduleInterview = function(interviewData) {
  Object.assign(this.interview_details, interviewData);
  return this.save();
};

// Instance method to update payment
applicationSchema.methods.updatePayment = function(paymentData) {
  Object.assign(this.payment_info, paymentData);
  return this.save();
};

// Static method to find by applicant
applicationSchema.statics.findByApplicant = function(applicantId) {
  return this.find({ applicant_id: applicantId });
};

// Static method to find by status
applicationSchema.statics.findByStatus = function(status) {
  return this.find({ status });
};

// Static method to find by type
applicationSchema.statics.findByType = function(type) {
  return this.find({ type });
};

// Static method to get application statistics
applicationSchema.statics.getApplicationStats = async function() {
  const stats = await this.aggregate([
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    }
  ]);
  
  const typeStats = await this.aggregate([
    {
      $group: {
        _id: '$type',
        count: { $sum: 1 }
      }
    }
  ]);
  
  const monthlyStats = await this.aggregate([
    {
      $group: {
        _id: {
          year: { $year: '$created_at' },
          month: { $month: '$created_at' }
        },
        count: { $sum: 1 }
      }
    },
    {
      $sort: { '_id.year': -1, '_id.month': -1 }
    }
  ]);
  
  return {
    status_stats: stats,
    type_stats: typeStats,
    monthly_stats: monthlyStats
  };
};

// Static method to get pending applications
applicationSchema.statics.getPendingApplications = function() {
  return this.find({
    status: { $in: ['Submitted', 'Under Review'] }
  }).sort({ submission_date: -1 });
};

const Application = mongoose.model('Application', applicationSchema);

module.exports = Application;


