const mongoose = require('mongoose');
const IdCounter = require('./IdCounter');

const scholarshipSchema = new mongoose.Schema({
  id: {
    type: Number,
    unique: true
  },
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  program: [{
    type: String,
    enum: ['UG', 'MSC', 'PhD', 'HOD'],
    required: true
  }],
  country: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50
  },
  university_name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  university_logo: {
    type: String,
    trim: true
  },
  university_website: {
    type: String,
    trim: true
  },
  university_description: {
    type: String,
    trim: true
  },
  intake_date: {
    type: Date,
    required: true
  },
  deadline: {
    type: Date,
    required: true
  },
  major: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  requirements: {
    type: String,
    trim: true
  },
  benefits: {
    type: String,
    trim: true
  },
  coverage: {
    tuition: {
      type: Boolean,
      default: false
    },
    living_expenses: {
      type: Boolean,
      default: false
    },
    travel: {
      type: Boolean,
      default: false
    },
    health_insurance: {
      type: Boolean,
      default: false
    },
    other: {
      type: String,
      trim: true
    }
  },
  financial_support: {
    amount: Number,
    currency: {
      type: String,
      default: 'USD'
    },
    duration_months: Number,
    renewable: {
      type: Boolean,
      default: false
    }
  },
  application_fee: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  status: {
    type: String,
    enum: ['Active', 'Closed', 'Upcoming', 'Draft'],
    default: 'Draft'
  },
  eligibility_criteria: {
    min_age: {
      type: Number,
      min: 16
    },
    max_age: {
      type: Number,
      max: 65
    },
    nationality: [{
      type: String,
      trim: true
    }],
    gpa_requirement: {
      type: Number,
      min: 0,
      max: 4.0
    },
    language_requirements: {
      english: {
        required: {
          type: Boolean,
          default: true
        },
        test_type: {
          type: String,
          enum: ['IELTS', 'TOEFL', 'PTE', 'Duolingo', 'Other'],
          default: 'IELTS'
        },
        min_score: Number
      },
      other_languages: [{
        language: String,
        test_type: String,
        min_score: Number
      }]
    }
  },
  application_process: {
    steps: [{
      step_number: Number,
      title: String,
      description: String,
      required: {
        type: Boolean,
        default: true
      }
    }],
    documents_required: [{
      type: String,
      trim: true
    }],
    interview_required: {
      type: Boolean,
      default: false
    },
    interview_details: {
      type: String,
      trim: true
    }
  },
  contact_info: {
    email: {
      type: String,
      trim: true,
      lowercase: true
    },
    phone: {
      type: String,
      trim: true
    },
    website: {
      type: String,
      trim: true
    },
    address: {
      type: String,
      trim: true
    }
  },
  tags: [{
    type: String,
    trim: true,
    lowercase: true
  }],
  is_featured: {
    type: Boolean,
    default: false
  },
  application_count: {
    type: Number,
    default: 0
  },
  view_count: {
    type: Number,
    default: 0
  },
  created_by: {
    type: Number,
    ref: 'User',
    required: true
  },
  last_modified_by: {
    type: Number,
    ref: 'User'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
scholarshipSchema.index({ id: 1 });
scholarshipSchema.index({ name: 1 });
scholarshipSchema.index({ country: 1 });
scholarshipSchema.index({ university_name: 1 });
scholarshipSchema.index({ program: 1 });
scholarshipSchema.index({ major: 1 });
scholarshipSchema.index({ status: 1 });
scholarshipSchema.index({ deadline: 1 });
scholarshipSchema.index({ intake_date: 1 });
scholarshipSchema.index({ created_at: -1 });
scholarshipSchema.index({ is_featured: -1 });
scholarshipSchema.index({ tags: 1 });

// Text search index
scholarshipSchema.index({
  name: 'text',
  description: 'text',
  university_name: 'text',
  major: 'text',
  tags: 'text'
});

// Virtual for creator
scholarshipSchema.virtual('creator', {
  ref: 'User',
  localField: 'created_by',
  foreignField: 'id',
  justOne: true
});

// Virtual for applications
scholarshipSchema.virtual('applications', {
  ref: 'Application',
  localField: 'id',
  foreignField: 'scholarship_id'
});

// Virtual for days until deadline
scholarshipSchema.virtual('days_until_deadline').get(function() {
  if (!this.deadline) return null;
  const now = new Date();
  const deadline = new Date(this.deadline);
  const diffTime = deadline - now;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
});

// Virtual for days until intake
scholarshipSchema.virtual('days_until_intake').get(function() {
  if (!this.intake_date) return null;
  const now = new Date();
  const intake = new Date(this.intake_date);
  const diffTime = intake - now;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
});

// Virtual for is deadline passed
scholarshipSchema.virtual('is_deadline_passed').get(function() {
  if (!this.deadline) return false;
  return new Date() > new Date(this.deadline);
});

// Virtual for is accepting applications
scholarshipSchema.virtual('is_accepting_applications').get(function() {
  return this.status === 'Active' && !this.is_deadline_passed;
});

// Virtual for program count
scholarshipSchema.virtual('program_count').get(function() {
  return this.program.length;
});

// Pre-save middleware to assign ID and validate dates
scholarshipSchema.pre('save', async function(next) {
  try {
    // Assign auto-incrementing ID if new document
    if (this.isNew && !this.id) {
      const counter = await IdCounter.getNextSequence('scholarship_id');
      this.id = counter.sequence_value;
    }
    
    // Validate dates
    if (this.intake_date && this.deadline) {
      if (this.deadline >= this.intake_date) {
        return next(new Error('Application deadline must be before intake date'));
      }
    }
    
    if (this.eligibility_criteria.min_age && this.eligibility_criteria.max_age) {
      if (this.eligibility_criteria.max_age <= this.eligibility_criteria.min_age) {
        return next(new Error('Maximum age must be greater than minimum age'));
      }
    }
    
    next();
  } catch (error) {
    next(error);
  }
});

// Pre-save middleware to update status based on deadline
scholarshipSchema.pre('save', function(next) {
  if (this.deadline && new Date() > new Date(this.deadline) && this.status === 'Active') {
    this.status = 'Closed';
  }
  next();
});

// Instance method to increment view count
scholarshipSchema.methods.incrementViewCount = function() {
  this.view_count += 1;
  return this.save();
};

// Instance method to increment application count
scholarshipSchema.methods.incrementApplicationCount = function() {
  this.application_count += 1;
  return this.save();
};

// Instance method to add tag
scholarshipSchema.methods.addTag = function(tag) {
  const lowercaseTag = tag.toLowerCase().trim();
  if (!this.tags.includes(lowercaseTag)) {
    this.tags.push(lowercaseTag);
  }
  return this.save();
};

// Instance method to remove tag
scholarshipSchema.methods.removeTag = function(tag) {
  const lowercaseTag = tag.toLowerCase().trim();
  this.tags = this.tags.filter(t => t !== lowercaseTag);
  return this.save();
};

// Instance method to add program
scholarshipSchema.methods.addProgram = function(program) {
  if (!this.program.includes(program)) {
    this.program.push(program);
  }
  return this.save();
};

// Instance method to remove program
scholarshipSchema.methods.removeProgram = function(program) {
  this.program = this.program.filter(p => p !== program);
  return this.save();
};

// Static method to find active scholarships
scholarshipSchema.statics.findActive = function() {
  return this.find({ 
    status: 'Active',
    deadline: { $gte: new Date() }
  });
};

// Static method to find by country
scholarshipSchema.statics.findByCountry = function(country) {
  return this.find({ country: new RegExp(country, 'i') });
};

// Static method to find by university
scholarshipSchema.statics.findByUniversity = function(universityName) {
  return this.find({ university_name: new RegExp(universityName, 'i') });
};

// Static method to find by program
scholarshipSchema.statics.findByProgram = function(program) {
  return this.find({ program: program });
};

// Static method to search scholarships
scholarshipSchema.statics.searchScholarships = function(query, filters = {}) {
  const searchQuery = { ...filters };
  
  if (query) {
    searchQuery.$text = { $search: query };
  }
  
  return this.find(searchQuery, { score: { $meta: 'textScore' } })
    .sort({ score: { $meta: 'textScore' } });
};

// Static method to get scholarship statistics
scholarshipSchema.statics.getScholarshipStats = async function() {
  const stats = await this.aggregate([
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        total_applications: { $sum: '$application_count' },
        total_views: { $sum: '$view_count' }
      }
    }
  ]);
  
  const countryStats = await this.aggregate([
    {
      $group: {
        _id: '$country',
        count: { $sum: 1 }
      }
    },
    {
      $sort: { count: -1 }
    },
    {
      $limit: 10
    }
  ]);
  
  const programStats = await this.aggregate([
    {
      $unwind: '$program'
    },
    {
      $group: {
        _id: '$program',
        count: { $sum: 1 }
      }
    },
    {
      $sort: { count: -1 }
    }
  ]);
  
  return {
    status_stats: stats,
    country_stats: countryStats,
    program_stats: programStats
  };
};

// Static method to get featured scholarships
scholarshipSchema.statics.getFeaturedScholarships = function(limit = 5) {
  return this.find({ 
    is_featured: true,
    status: 'Active',
    deadline: { $gte: new Date() }
  })
  .sort({ created_at: -1 })
  .limit(limit);
};

const Scholarship = mongoose.model('Scholarship', scholarshipSchema);

module.exports = Scholarship;


