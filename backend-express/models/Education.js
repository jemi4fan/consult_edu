const mongoose = require('mongoose');

const educationSchema = new mongoose.Schema({
  applicant_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Applicant',
    required: true
  },
  degree: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50
  },
  institution: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  graduation_year: {
    type: Number,
    required: true,
    min: 1900,
    max: new Date().getFullYear() + 10
  },
  gpa: {
    type: Number,
    min: 0,
    max: 4.0,
    validate: {
      validator: function(v) {
        return v >= 0 && v <= 4.0;
      },
      message: 'GPA must be between 0 and 4.0'
    }
  },
  major: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50
  },
  minor: {
    type: String,
    trim: true,
    maxlength: 50
  },
  country: {
    type: String,
    trim: true,
    maxlength: 50
  },
  city: {
    type: String,
    trim: true,
    maxlength: 50
  },
  is_current: {
    type: Boolean,
    default: false
  },
  start_date: {
    type: Date
  },
  end_date: {
    type: Date
  },
  description: {
    type: String,
    trim: true,
    maxlength: 500
  },
  achievements: [{
    type: String,
    trim: true
  }],
  additional_info: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
educationSchema.index({ applicant_id: 1 });
educationSchema.index({ graduation_year: -1 });
educationSchema.index({ degree: 1 });
educationSchema.index({ institution: 1 });

// Virtual for applicant
educationSchema.virtual('applicant', {
  ref: 'Applicant',
  localField: 'applicant_id',
  foreignField: '_id',
  justOne: true
});

// Virtual for duration in years
educationSchema.virtual('duration_years').get(function() {
  if (this.start_date && this.end_date) {
    const start = new Date(this.start_date);
    const end = new Date(this.end_date);
    const diffTime = Math.abs(end - start);
    const diffYears = Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 365));
    return diffYears;
  }
  return null;
});

// Pre-save middleware to validate dates
educationSchema.pre('save', function(next) {
  if (this.start_date && this.end_date) {
    if (this.end_date < this.start_date) {
      return next(new Error('End date cannot be before start date'));
    }
  }
  
  if (this.is_current && this.end_date) {
    return next(new Error('Current education cannot have an end date'));
  }
  
  next();
});

// Instance method to add achievement
educationSchema.methods.addAchievement = function(achievement) {
  if (!this.achievements.includes(achievement)) {
    this.achievements.push(achievement);
  }
  return this.save();
};

// Instance method to remove achievement
educationSchema.methods.removeAchievement = function(achievement) {
  this.achievements = this.achievements.filter(a => a !== achievement);
  return this.save();
};

// Static method to find by degree
educationSchema.statics.findByDegree = function(degree) {
  return this.find({ degree: new RegExp(degree, 'i') });
};

// Static method to find by institution
educationSchema.statics.findByInstitution = function(institution) {
  return this.find({ institution: new RegExp(institution, 'i') });
};

// Static method to get education statistics
educationSchema.statics.getEducationStats = async function() {
  const stats = await this.aggregate([
    {
      $group: {
        _id: '$degree',
        count: { $sum: 1 },
        avgGpa: { $avg: '$gpa' }
      }
    },
    {
      $sort: { count: -1 }
    }
  ]);
  
  return stats;
};

const Education = mongoose.model('Education', educationSchema);

module.exports = Education;


