const mongoose = require('mongoose');
const IdCounter = require('./IdCounter');

const adSchema = new mongoose.Schema({
  id: {
    type: Number,
    unique: true
  },
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 255
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  content: {
    type: String,
    trim: true
  },
  type: {
    type: String,
    enum: ['Announcement', 'News', 'Event', 'Promotion', 'Policy', 'Update'],
    default: 'Announcement'
  },
  category: {
    type: String,
    enum: ['General', 'Job', 'Scholarship', 'System', 'Maintenance', 'Other'],
    default: 'General'
  },
  priority: {
    type: String,
    enum: ['Low', 'Normal', 'High', 'Urgent'],
    default: 'Normal'
  },
  target_audience: {
    type: [String],
    enum: ['All', 'Applicants', 'Staff', 'Admin'],
    default: ['All']
  },
  file: {
    filename: {
      type: String,
      trim: true
    },
    original_filename: {
      type: String,
      trim: true
    },
    filepath: {
      type: String,
      trim: true
    },
    file_size: {
      type: Number,
      min: 0
    },
    mime_type: {
      type: String,
      trim: true
    }
  },
  image: {
    filename: {
      type: String,
      trim: true
    },
    original_filename: {
      type: String,
      trim: true
    },
    filepath: {
      type: String,
      trim: true
    },
    file_size: {
      type: Number,
      min: 0
    },
    mime_type: {
      type: String,
      trim: true
    },
    alt_text: {
      type: String,
      trim: true,
      maxlength: 255
    }
  },
  url: {
    type: String,
    trim: true,
    match: [/^https?:\/\/.+/, 'Please provide a valid URL']
  },
  start_date: {
    type: Date,
    default: Date.now
  },
  end_date: {
    type: Date
  },
  is_active: {
    type: Boolean,
    default: true
  },
  is_featured: {
    type: Boolean,
    default: false
  },
  is_pinned: {
    type: Boolean,
    default: false
  },
  view_count: {
    type: Number,
    default: 0
  },
  click_count: {
    type: Number,
    default: 0
  },
  engagement_metrics: {
    views: {
      type: Number,
      default: 0
    },
    clicks: {
      type: Number,
      default: 0
    },
    shares: {
      type: Number,
      default: 0
    },
    comments: {
      type: Number,
      default: 0
    }
  },
  tags: [{
    type: String,
    trim: true,
    lowercase: true
  }],
  metadata: {
    author: {
      type: String,
      trim: true
    },
    source: {
      type: String,
      trim: true
    },
    language: {
      type: String,
      default: 'en'
    },
    version: {
      type: Number,
      default: 1
    }
  },
  created_by: {
    type: Number,
    ref: 'User',
    required: true
  },
  last_modified_by: {
    type: Number,
    ref: 'User'
  },
  approved_by: {
    type: Number,
    ref: 'User',
    default: null
  },
  approval_status: {
    type: String,
    enum: ['Pending', 'Approved', 'Rejected', 'Draft'],
    default: 'Draft'
  },
  approval_notes: {
    type: String,
    trim: true,
    maxlength: 500
  },
  rejection_reason: {
    type: String,
    trim: true,
    maxlength: 500
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
adSchema.index({ id: 1 });
adSchema.index({ title: 1 });
adSchema.index({ type: 1 });
adSchema.index({ category: 1 });
adSchema.index({ priority: 1 });
adSchema.index({ is_active: 1 });
adSchema.index({ is_featured: 1 });
adSchema.index({ is_pinned: 1 });
adSchema.index({ start_date: -1 });
adSchema.index({ end_date: 1 });
adSchema.index({ approval_status: 1 });
adSchema.index({ created_at: -1 });
adSchema.index({ tags: 1 });

// Text search index
adSchema.index({
  title: 'text',
  description: 'text',
  content: 'text',
  tags: 'text'
});

// Virtual for creator
adSchema.virtual('creator', {
  ref: 'User',
  localField: 'created_by',
  foreignField: 'id',
  justOne: true
});

// Virtual for approver
adSchema.virtual('approver', {
  ref: 'User',
  localField: 'approved_by',
  foreignField: 'id',
  justOne: true
});

// Virtual for days until end
adSchema.virtual('days_until_end').get(function() {
  if (!this.end_date) return null;
  const now = new Date();
  const endDate = new Date(this.end_date);
  const diffTime = endDate - now;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
});

// Virtual for is expired
adSchema.virtual('is_expired').get(function() {
  if (!this.end_date) return false;
  return new Date() > new Date(this.end_date);
});

// Virtual for is currently active
adSchema.virtual('is_currently_active').get(function() {
  const now = new Date();
  const startDate = new Date(this.start_date);
  const endDate = this.end_date ? new Date(this.end_date) : null;
  
  return this.is_active && 
         this.approval_status === 'Approved' &&
         now >= startDate &&
         (!endDate || now <= endDate);
});

// Virtual for has attachment
adSchema.virtual('has_attachment').get(function() {
  return this.file && this.file.filename;
});

// Virtual for has image
adSchema.virtual('has_image').get(function() {
  return this.image && this.image.filename;
});

// Virtual for click through rate
adSchema.virtual('click_through_rate').get(function() {
  if (this.view_count === 0) return 0;
  return Math.round((this.click_count / this.view_count) * 100);
});

// Pre-save middleware to validate dates
adSchema.pre('save', async function(next) {
  try {
    // Assign auto-incrementing ID if new document
    if (this.isNew && !this.id) {
      const counter = await IdCounter.getNextSequence('ad_id');
      this.id = counter.sequence_value;
    }
    
    if (this.start_date && this.end_date) {
      if (this.end_date < this.start_date) {
        return next(new Error('End date cannot be before start date'));
      }
    }
    
    // Auto-deactivate if expired
    if (this.end_date && new Date() > new Date(this.end_date)) {
      this.is_active = false;
    }
    
    next();
  } catch (error) {
    next(error);
  }
});

// Instance method to increment view count
adSchema.methods.incrementViewCount = function() {
  this.view_count += 1;
  this.engagement_metrics.views += 1;
  return this.save();
};

// Instance method to increment click count
adSchema.methods.incrementClickCount = function() {
  this.click_count += 1;
  this.engagement_metrics.clicks += 1;
  return this.save();
};

// Instance method to increment share count
adSchema.methods.incrementShareCount = function() {
  this.engagement_metrics.shares += 1;
  return this.save();
};

// Instance method to add tag
adSchema.methods.addTag = function(tag) {
  const lowercaseTag = tag.toLowerCase().trim();
  if (!this.tags.includes(lowercaseTag)) {
    this.tags.push(lowercaseTag);
  }
  return this.save();
};

// Instance method to remove tag
adSchema.methods.removeTag = function(tag) {
  const lowercaseTag = tag.toLowerCase().trim();
  this.tags = this.tags.filter(t => t !== lowercaseTag);
  return this.save();
};

// Instance method to approve
adSchema.methods.approve = function(approverId, notes = '') {
  this.approval_status = 'Approved';
  this.approved_by = approverId;
  this.approval_notes = notes;
  this.rejection_reason = '';
  return this.save();
};

// Instance method to reject
adSchema.methods.reject = function(approverId, reason = '') {
  this.approval_status = 'Rejected';
  this.approved_by = approverId;
  this.rejection_reason = reason;
  this.approval_notes = '';
  return this.save();
};

// Instance method to publish
adSchema.methods.publish = function() {
  this.approval_status = 'Approved';
  this.is_active = true;
  this.start_date = new Date();
  return this.save();
};

// Instance method to unpublish
adSchema.methods.unpublish = function() {
  this.is_active = false;
  return this.save();
};

// Static method to find active ads
adSchema.statics.findActive = function() {
  const now = new Date();
  return this.find({
    is_active: true,
    approval_status: 'Approved',
    start_date: { $lte: now },
    $or: [
      { end_date: { $gte: now } },
      { end_date: { $exists: false } }
    ]
  });
};

// Static method to find featured ads
adSchema.statics.findFeatured = function(limit = 5) {
  return this.find({
    is_featured: true,
    is_currently_active: true
  })
  .sort({ created_at: -1 })
  .limit(limit);
};

// Static method to find pinned ads
adSchema.statics.findPinned = function(limit = 3) {
  return this.find({
    is_pinned: true,
    is_currently_active: true
  })
  .sort({ created_at: -1 })
  .limit(limit);
};

// Static method to find by category
adSchema.statics.findByCategory = function(category) {
  return this.find({ category });
};

// Static method to find by type
adSchema.statics.findByType = function(type) {
  return this.find({ type });
};

// Static method to search ads
adSchema.statics.searchAds = function(query, filters = {}) {
  const searchQuery = { ...filters };
  
  if (query) {
    searchQuery.$text = { $search: query };
  }
  
  return this.find(searchQuery, { score: { $meta: 'textScore' } })
    .sort({ score: { $meta: 'textScore' } });
};

// Static method to get ad statistics
adSchema.statics.getAdStats = async function() {
  const stats = await this.aggregate([
    {
      $group: {
        _id: '$approval_status',
        count: { $sum: 1 }
      }
    }
  ]);
  
  const typeStats = await this.aggregate([
    {
      $group: {
        _id: '$type',
        count: { $sum: 1 },
        total_views: { $sum: '$view_count' },
        total_clicks: { $sum: '$click_count' }
      }
    },
    {
      $sort: { count: -1 }
    }
  ]);
  
  const engagementStats = await this.aggregate([
    {
      $group: {
        _id: null,
        total_views: { $sum: '$view_count' },
        total_clicks: { $sum: '$click_count' },
        total_shares: { $sum: '$engagement_metrics.shares' },
        avg_click_through_rate: {
          $avg: {
            $cond: [
              { $eq: ['$view_count', 0] },
              0,
              { $divide: ['$click_count', '$view_count'] }
            ]
          }
        }
      }
    }
  ]);
  
  return {
    approval_stats: stats,
    type_stats: typeStats,
    engagement_stats: engagementStats[0] || {}
  };
};

// Static method to get top performing ads
adSchema.statics.getTopPerformingAds = function(limit = 10) {
  return this.find({ is_currently_active: true })
    .sort({ click_count: -1 })
    .limit(limit);
};

const Ad = mongoose.model('Ad', adSchema);

module.exports = Ad;


