const mongoose = require('mongoose');
const IdCounter = require('./IdCounter');

const applicantSchema = new mongoose.Schema({
  id: {
    type: Number,
    unique: true
  },
  user_id: {
    type: Number,
    ref: 'User',
    required: true,
    unique: true
  },
  dob: {
    type: Date,
    required: false
  },
  gender: {
    type: String,
    enum: ['Male', 'Female', 'Other'],
    required: false
  },
  nationality: {
    type: String,
    trim: true,
    maxlength: 100
  },
  profile_completion: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  bio: {
    type: String,
    trim: true,
    maxlength: 500
  },
  skills: [{
    type: String,
    trim: true
  }],
  languages: [{
    language: {
      type: String,
      required: true,
      trim: true
    },
    proficiency: {
      type: String,
      enum: ['Beginner', 'Intermediate', 'Advanced', 'Native'],
      required: true
    }
  }],
  work_experience: [{
    company: {
      type: String,
      required: true,
      trim: true
    },
    position: {
      type: String,
      required: true,
      trim: true
    },
    start_date: {
      type: Date,
      required: true
    },
    end_date: {
      type: Date
    },
    current: {
      type: Boolean,
      default: false
    },
    description: {
      type: String,
      trim: true
    }
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
applicantSchema.index({ id: 1 });
applicantSchema.index({ user_id: 1 });
applicantSchema.index({ profile_completion: -1 });
applicantSchema.index({ created_at: -1 });

// Virtual for age
applicantSchema.virtual('age').get(function() {
  if (!this.dob) return null;
  const today = new Date();
  const birthDate = new Date(this.dob);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age;
});

// Virtual for education records
applicantSchema.virtual('education', {
  ref: 'Education',
  localField: '_id',
  foreignField: 'applicant_id'
});

// Virtual for documents
applicantSchema.virtual('documents', {
  ref: 'Document',
  localField: 'id',
  foreignField: 'applicant_id'
});

// Virtual for applications
applicantSchema.virtual('applications', {
  ref: 'Application',
  localField: 'id',
  foreignField: 'applicant_id'
});

// Virtual for user
applicantSchema.virtual('user', {
  ref: 'User',
  localField: 'user_id',
  foreignField: 'id',
  justOne: true
});

// Pre-save middleware to assign ID and calculate profile completion
applicantSchema.pre('save', async function(next) {
  try {
    // Assign auto-incrementing ID if new document
    if (this.isNew && !this.id) {
      const counter = await IdCounter.getNextSequence('applicant_id');
      this.id = counter.sequence_value;
    }
    let completion = 0;
    const fields = [
      'dob', 'gender', 'nationality', 'bio'
    ];
    
    fields.forEach(field => {
      if (this[field] && this[field] !== '') {
        completion += 25;
      }
    });
    
    // Check if user has education records
      if (this.education && this.education.length > 0) {
        completion += 10;
      }
      
      // Check if user has documents
      if (this.documents && this.documents.length > 0) {
        completion += 10;
      }
      
      // Check if user has skills
      if (this.skills && this.skills.length > 0) {
        completion += 5;
      }
      
      // Check if user has languages
      if (this.languages && this.languages.length > 0) {
        completion += 5;
      }
      
      this.profile_completion = Math.min(completion, 100);
      next();
    } catch (error) {
      next(error);
    }
  });

// Instance method to add skill
applicantSchema.methods.addSkill = function(skill) {
  if (!this.skills.includes(skill)) {
    this.skills.push(skill);
  }
  return this.save();
};

// Instance method to remove skill
applicantSchema.methods.removeSkill = function(skill) {
  this.skills = this.skills.filter(s => s !== skill);
  return this.save();
};

// Instance method to add language
applicantSchema.methods.addLanguage = function(language, proficiency) {
  const existingIndex = this.languages.findIndex(lang => lang.language === language);
  
  if (existingIndex >= 0) {
    this.languages[existingIndex].proficiency = proficiency;
  } else {
    this.languages.push({ language, proficiency });
  }
  
  return this.save();
};

// Instance method to remove language
applicantSchema.methods.removeLanguage = function(language) {
  this.languages = this.languages.filter(lang => lang.language !== language);
  return this.save();
};

// Instance method to add work experience
applicantSchema.methods.addWorkExperience = function(experience) {
  this.work_experience.push(experience);
  return this.save();
};

// Instance method to update work experience
applicantSchema.methods.updateWorkExperience = function(experienceId, updates) {
  const experience = this.work_experience.id(experienceId);
  if (experience) {
    Object.assign(experience, updates);
  }
  return this.save();
};

// Instance method to remove work experience
applicantSchema.methods.removeWorkExperience = function(experienceId) {
  this.work_experience.pull(experienceId);
  return this.save();
};

const Applicant = mongoose.model('Applicant', applicantSchema);

module.exports = Applicant;

