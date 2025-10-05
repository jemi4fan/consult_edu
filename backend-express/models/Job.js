const mongoose = require('mongoose');
const IdCounter = require('./IdCounter');

const jobSchema = new mongoose.Schema({
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
  description: {
    type: String,
    required: true,
    trim: true
  },
  requirements: {
    type: String,
    trim: true
  },
  responsibilities: {
    type: String,
    trim: true
  },
  qualifications: {
    type: String,
    trim: true
  },
  benefits: {
    type: String,
    trim: true
  },
  country: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50
  },
  city: {
    type: String,
    trim: true,
    maxlength: 50
  },
  positions: [{
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100
    },
    department: {
      type: String,
      trim: true,
      maxlength: 50
    },
    level: {
      type: String,
      enum: ['Entry', 'Mid', 'Senior', 'Executive'],
      default: 'Mid'
    },
    employment_type: {
      type: String,
      enum: ['Full-time', 'Part-time', 'Contract', 'Internship'],
      default: 'Full-time'
    },
    salary_range: {
      min: Number,
      max: Number,
      currency: {
        type: String,
        default: 'USD'
      }
    },
    vacancies: {
      type: Number,
      default: 1,
      min: 1
    }
  }],
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
  deadline: {
    type: Date,
    required: true
  },
  start_date: {
    type: Date
  },
  end_date: {
    type: Date
  },
  company: {
    name: {
      type: String,
      required: false,
      trim: true,
      maxlength: 100
    },
    website: {
      type: String,
      trim: true
    },
    logo: {
      type: String,
      trim: true
    },
    description: {
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
jobSchema.index({ id: 1 });
jobSchema.index({ name: 1 });
jobSchema.index({ country: 1 });
jobSchema.index({ status: 1 });
jobSchema.index({ deadline: 1 });
jobSchema.index({ created_at: -1 });
jobSchema.index({ is_featured: -1 });
jobSchema.index({ 'company.name': 1 });
jobSchema.index({ tags: 1 });
jobSchema.index({ created_by: 1 });

// Text search index
jobSchema.index({
  name: 'text',
  description: 'text',
  requirements: 'text',
  'company.name': 'text',
  tags: 'text'
});

// Virtual for creator
jobSchema.virtual('creator', {
  ref: 'User',
  localField: 'created_by',
  foreignField: 'id',
  justOne: true
});

// Virtual for applications
jobSchema.virtual('applications', {
  ref: 'Application',
  localField: 'id',
  foreignField: 'job_id'
});

// Virtual for total vacancies
jobSchema.virtual('total_vacancies').get(function() {
  return this.positions.reduce((total, position) => total + position.vacancies, 0);
});

// Virtual for days until deadline
jobSchema.virtual('days_until_deadline').get(function() {
  if (!this.deadline) return null;
  const now = new Date();
  const deadline = new Date(this.deadline);
  const diffTime = deadline - now;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
});

// Virtual for is deadline passed
jobSchema.virtual('is_deadline_passed').get(function() {
  if (!this.deadline) return false;
  return new Date() > new Date(this.deadline);
});

// Virtual for is accepting applications
jobSchema.virtual('is_accepting_applications').get(function() {
  return this.status === 'Active' && !this.is_deadline_passed;
});

// Pre-save middleware to assign ID and validate dates
jobSchema.pre('save', async function(next) {
  try {
    // Assign auto-incrementing ID if new document
    if (this.isNew && !this.id) {
      const counter = await IdCounter.getNextSequence('job_id');
      this.id = counter.sequence_value;
    }
    
    // Validate dates
    if (this.start_date && this.end_date) {
      if (this.end_date < this.start_date) {
        return next(new Error('End date cannot be before start date'));
      }
    }
    
    if (this.deadline && this.start_date) {
      if (this.deadline > this.start_date) {
        return next(new Error('Application deadline cannot be after job start date'));
      }
    }
    
    next();
  } catch (error) {
    next(error);
  }
});

// Pre-save middleware to update status based on deadline
jobSchema.pre('save', function(next) {
  if (this.deadline && new Date() > new Date(this.deadline) && this.status === 'Active') {
    this.status = 'Closed';
  }
  next();
});

// Instance method to increment view count
jobSchema.methods.incrementViewCount = function() {
  this.view_count += 1;
  return this.save();
};

// Instance method to increment application count
jobSchema.methods.incrementApplicationCount = function() {
  this.application_count += 1;
  return this.save();
};

// Instance method to add tag
jobSchema.methods.addTag = function(tag) {
  const lowercaseTag = tag.toLowerCase().trim();
  if (!this.tags.includes(lowercaseTag)) {
    this.tags.push(lowercaseTag);
  }
  return this.save();
};

// Instance method to remove tag
jobSchema.methods.removeTag = function(tag) {
  const lowercaseTag = tag.toLowerCase().trim();
  this.tags = this.tags.filter(t => t !== lowercaseTag);
  return this.save();
};

// Instance method to update position
jobSchema.methods.updatePosition = function(positionId, updates) {
  const position = this.positions.id(positionId);
  if (position) {
    Object.assign(position, updates);
  }
  return this.save();
};

// Instance method to remove position
jobSchema.methods.removePosition = function(positionId) {
  this.positions.pull(positionId);
  return this.save();
};

// Static method to find active jobs
jobSchema.statics.findActive = function() {
  return this.find({ 
    status: 'Active',
    deadline: { $gte: new Date() }
  });
};

// Static method to find by country
jobSchema.statics.findByCountry = function(country) {
  return this.find({ country: new RegExp(country, 'i') });
};

// Static method to find by company
jobSchema.statics.findByCompany = function(companyName) {
  return this.find({ 'company.name': new RegExp(companyName, 'i') });
};

// Static method to search jobs
jobSchema.statics.searchJobs = function(query, filters = {}) {
  const searchQuery = { ...filters };
  
  if (query) {
    searchQuery.$text = { $search: query };
  }
  
  return this.find(searchQuery, { score: { $meta: 'textScore' } })
    .sort({ score: { $meta: 'textScore' } });
};

// Static method to get job statistics
jobSchema.statics.getJobStats = async function() {
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
  
  return {
    status_stats: stats,
    country_stats: countryStats
  };
};

// Static method to get featured jobs
jobSchema.statics.getFeaturedJobs = function(limit = 5) {
  return this.find({ 
    is_featured: true,
    status: 'Active',
    deadline: { $gte: new Date() }
  })
  .sort({ created_at: -1 })
  .limit(limit);
};

const Job = mongoose.model('Job', jobSchema);

module.exports = Job;


