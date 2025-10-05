const mongoose = require('mongoose');
const IdCounter = require('./IdCounter');

const documentSchema = new mongoose.Schema({
  id: {
    type: Number,
    unique: true
  },
  applicant_id: {
    type: Number,
    ref: 'Applicant',
    required: true
  },
  application_id: {
    type: Number,
    ref: 'Application',
    default: null
  },
  type: {
    type: String,
    required: true,
    enum: [
      'CV', 'Resume', 'Transcript', 'Recommendation', 'Cover_Letter',
      'Passport', 'ID_Card', 'Birth_Certificate', 'Portfolio',
      'Certificates', 'Research_Papers', 'Publications', 'Other'
    ]
  },
  filename: {
    type: String,
    required: true,
    trim: true,
    maxlength: 255
  },
  original_filename: {
    type: String,
    required: true,
    trim: true,
    maxlength: 255
  },
  filepath: {
    type: String,
    required: true,
    trim: true,
    maxlength: 500
  },
  file_size: {
    type: Number,
    required: true,
    min: 0
  },
  mime_type: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true,
    maxlength: 500
  },
  is_verified: {
    type: Boolean,
    default: false
  },
  verified_by: {
    type: Number,
    ref: 'User',
    default: null
  },
  verified_at: {
    type: Date,
    default: null
  },
  verification_notes: {
    type: String,
    trim: true,
    maxlength: 500
  },
  is_public: {
    type: Boolean,
    default: false
  },
  download_count: {
    type: Number,
    default: 0
  },
  last_downloaded: {
    type: Date,
    default: null
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
documentSchema.index({ id: 1 });
documentSchema.index({ applicant_id: 1 });
documentSchema.index({ application_id: 1 });
documentSchema.index({ type: 1 });
documentSchema.index({ is_verified: 1 });
documentSchema.index({ created_at: -1 });
documentSchema.index({ filename: 1 });

// Virtual for applicant
documentSchema.virtual('applicant', {
  ref: 'Applicant',
  localField: 'applicant_id',
  foreignField: '_id',
  justOne: true
});

// Virtual for application
documentSchema.virtual('application', {
  ref: 'Application',
  localField: 'application_id',
  foreignField: '_id',
  justOne: true
});

// Virtual for verifier
documentSchema.virtual('verifier', {
  ref: 'User',
  localField: 'verified_by',
  foreignField: '_id',
  justOne: true
});

// Virtual for file extension
documentSchema.virtual('file_extension').get(function() {
  return this.filename.split('.').pop().toLowerCase();
});

// Virtual for file size in human readable format
documentSchema.virtual('file_size_formatted').get(function() {
  const bytes = this.file_size;
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
});

// Virtual for download URL
documentSchema.virtual('download_url').get(function() {
  return `/api/documents/${this._id}/download`;
});

// Pre-save middleware to assign ID and validate file
documentSchema.pre('save', async function(next) {
  try {
    // Assign auto-incrementing ID if new document
    if (this.isNew && !this.id) {
      const counter = await IdCounter.getNextSequence('document_id');
      this.id = counter.sequence_value;
    }
    
    // Check if file size is within limits (10MB default)
    const maxSize = parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024;
    if (this.file_size > maxSize) {
      return next(new Error('File size exceeds maximum allowed size'));
    }
    
    // Check if file type is allowed
    const allowedTypes = (process.env.ALLOWED_FILE_TYPES || 'pdf,doc,docx,png,jpg,jpeg').split(',');
    const extension = this.file_extension;
    if (!allowedTypes.includes(extension)) {
      return next(new Error('File type not allowed'));
    }
    
    next();
  } catch (error) {
    next(error);
  }
});

// Instance method to increment download count
documentSchema.methods.incrementDownloadCount = function() {
  this.download_count += 1;
  this.last_downloaded = new Date();
  return this.save();
};

// Instance method to verify document
documentSchema.methods.verify = function(verifierId, notes = '') {
  this.is_verified = true;
  this.verified_by = verifierId;
  this.verified_at = new Date();
  this.verification_notes = notes;
  return this.save();
};

// Instance method to unverify document
documentSchema.methods.unverify = function() {
  this.is_verified = false;
  this.verified_by = null;
  this.verified_at = null;
  this.verification_notes = '';
  return this.save();
};

// Static method to find by type
documentSchema.statics.findByType = function(type) {
  return this.find({ type });
};

// Static method to find verified documents
documentSchema.statics.findVerified = function() {
  return this.find({ is_verified: true });
};

// Static method to find by applicant
documentSchema.statics.findByApplicant = function(applicantId) {
  return this.find({ applicant_id: applicantId });
};

// Static method to get document statistics
documentSchema.statics.getDocumentStats = async function() {
  const stats = await this.aggregate([
    {
      $group: {
        _id: '$type',
        count: { $sum: 1 },
        total_size: { $sum: '$file_size' },
        verified_count: {
          $sum: { $cond: ['$is_verified', 1, 0] }
        },
        total_downloads: { $sum: '$download_count' }
      }
    },
    {
      $sort: { count: -1 }
    }
  ]);
  
  return stats;
};

// Static method to get storage usage by applicant
documentSchema.statics.getStorageUsageByApplicant = async function() {
  const stats = await this.aggregate([
    {
      $group: {
        _id: '$applicant_id',
        total_files: { $sum: 1 },
        total_size: { $sum: '$file_size' },
        verified_files: {
          $sum: { $cond: ['$is_verified', 1, 0] }
        }
      }
    },
    {
      $lookup: {
        from: 'applicants',
        localField: '_id',
        foreignField: '_id',
        as: 'applicant'
      }
    },
    {
      $unwind: '$applicant'
    },
    {
      $lookup: {
        from: 'users',
        localField: 'applicant.user_id',
        foreignField: '_id',
        as: 'user'
      }
    },
    {
      $unwind: '$user'
    },
    {
      $project: {
        applicant_name: {
          $concat: ['$user.first_name', ' ', '$user.father_name', ' ', '$user.grandfather_name']
        },
        email: '$user.email',
        total_files: 1,
        total_size: 1,
        verified_files: 1
      }
    },
    {
      $sort: { total_size: -1 }
    }
  ]);
  
  return stats;
};

const Document = mongoose.model('Document', documentSchema);

module.exports = Document;


