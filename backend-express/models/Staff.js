const mongoose = require('mongoose');

const staffSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  employee_id: {
    type: String,
    unique: true,
    trim: true,
    maxlength: 20
  },
  department: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50
  },
  position: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  hire_date: {
    type: Date,
    required: true,
    default: Date.now
  },
  employment_type: {
    type: String,
    enum: ['Full-time', 'Part-time', 'Contract', 'Intern'],
    default: 'Full-time'
  },
  salary: {
    amount: {
      type: Number,
      min: 0
    },
    currency: {
      type: String,
      default: 'USD'
    },
    payment_frequency: {
      type: String,
      enum: ['Monthly', 'Bi-weekly', 'Weekly'],
      default: 'Monthly'
    }
  },
  supervisor_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  permissions: {
    can_view_applications: {
      type: Boolean,
      default: true
    },
    can_edit_applications: {
      type: Boolean,
      default: false
    },
    can_delete_applications: {
      type: Boolean,
      default: false
    },
    can_view_users: {
      type: Boolean,
      default: true
    },
    can_edit_users: {
      type: Boolean,
      default: false
    },
    can_delete_users: {
      type: Boolean,
      default: false
    },
    can_manage_jobs: {
      type: Boolean,
      default: false
    },
    can_manage_scholarships: {
      type: Boolean,
      default: false
    },
    can_manage_documents: {
      type: Boolean,
      default: true
    },
    can_send_messages: {
      type: Boolean,
      default: true
    },
    can_view_reports: {
      type: Boolean,
      default: false
    },
    can_manage_ads: {
      type: Boolean,
      default: false
    }
  },
  working_hours: {
    start_time: {
      type: String,
      default: '09:00'
    },
    end_time: {
      type: String,
      default: '17:00'
    },
    timezone: {
      type: String,
      default: 'UTC'
    },
    work_days: [{
      type: String,
      enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
      default: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
    }]
  },
  contact_info: {
    office_phone: {
      type: String,
      trim: true,
      maxlength: 20
    },
    extension: {
      type: String,
      trim: true,
      maxlength: 10
    },
    office_location: {
      type: String,
      trim: true,
      maxlength: 100
    }
  },
  performance_metrics: {
    applications_reviewed: {
      type: Number,
      default: 0
    },
    applications_approved: {
      type: Number,
      default: 0
    },
    applications_rejected: {
      type: Number,
      default: 0
    },
    response_time_avg: {
      type: Number,
      default: 0
    },
    customer_satisfaction: {
      type: Number,
      min: 0,
      max: 5,
      default: 0
    }
  },
  status: {
    type: String,
    enum: ['Active', 'Inactive', 'On Leave', 'Terminated'],
    default: 'Active'
  },
  notes: {
    type: String,
    trim: true,
    maxlength: 1000
  },
  last_activity: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
staffSchema.index({ user_id: 1 });
staffSchema.index({ employee_id: 1 });
staffSchema.index({ department: 1 });
staffSchema.index({ position: 1 });
staffSchema.index({ status: 1 });
staffSchema.index({ hire_date: -1 });

// Virtual for user
staffSchema.virtual('user', {
  ref: 'User',
  localField: 'user_id',
  foreignField: '_id',
  justOne: true
});

// Virtual for supervisor
staffSchema.virtual('supervisor', {
  ref: 'User',
  localField: 'supervisor_id',
  foreignField: '_id',
  justOne: true
});

// Virtual for subordinates
staffSchema.virtual('subordinates', {
  ref: 'Staff',
  localField: '_id',
  foreignField: 'supervisor_id'
});

// Virtual for years of service
staffSchema.virtual('years_of_service').get(function() {
  const now = new Date();
  const hireDate = new Date(this.hire_date);
  const diffTime = Math.abs(now - hireDate);
  const diffYears = Math.floor(diffTime / (1000 * 60 * 60 * 24 * 365));
  return diffYears;
});

// Virtual for approval rate
staffSchema.virtual('approval_rate').get(function() {
  const total = this.performance_metrics.applications_approved + this.performance_metrics.applications_rejected;
  if (total === 0) return 0;
  return Math.round((this.performance_metrics.applications_approved / total) * 100);
});

// Virtual for is currently working
staffSchema.virtual('is_currently_working').get(function() {
  if (this.status !== 'Active') return false;
  
  const now = new Date();
  const currentHour = now.getHours();
  const currentDay = now.toLocaleDateString('en-US', { weekday: 'long' });
  
  const startHour = parseInt(this.working_hours.start_time.split(':')[0]);
  const endHour = parseInt(this.working_hours.end_time.split(':')[0]);
  
  return this.working_hours.work_days.includes(currentDay) && 
         currentHour >= startHour && 
         currentHour < endHour;
});

// Pre-save middleware to generate employee ID
staffSchema.pre('save', function(next) {
  if (!this.employee_id) {
    // Generate employee ID based on department and hire date
    const deptCode = this.department.substring(0, 3).toUpperCase();
    const year = new Date(this.hire_date).getFullYear();
    const randomNum = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    this.employee_id = `${deptCode}${year}${randomNum}`;
  }
  next();
});

// Instance method to update performance metrics
staffSchema.methods.updatePerformanceMetrics = function(metric, value) {
  if (this.performance_metrics.hasOwnProperty(metric)) {
    this.performance_metrics[metric] = value;
  }
  this.last_activity = new Date();
  return this.save();
};

// Instance method to increment application count
staffSchema.methods.incrementApplicationCount = function(type = 'reviewed') {
  const metric = `applications_${type}`;
  if (this.performance_metrics.hasOwnProperty(metric)) {
    this.performance_metrics[metric] += 1;
  }
  this.last_activity = new Date();
  return this.save();
};

// Instance method to update response time
staffSchema.methods.updateResponseTime = function(responseTime) {
  const currentAvg = this.performance_metrics.response_time_avg;
  const currentCount = this.performance_metrics.applications_reviewed;
  
  if (currentCount === 0) {
    this.performance_metrics.response_time_avg = responseTime;
  } else {
    this.performance_metrics.response_time_avg = 
      ((currentAvg * currentCount) + responseTime) / (currentCount + 1);
  }
  
  this.last_activity = new Date();
  return this.save();
};

// Instance method to check permission
staffSchema.methods.hasPermission = function(permission) {
  return this.permissions[permission] === true;
};

// Instance method to update permissions
staffSchema.methods.updatePermissions = function(newPermissions) {
  Object.assign(this.permissions, newPermissions);
  return this.save();
};

// Instance method to update status
staffSchema.methods.updateStatus = function(newStatus) {
  this.status = newStatus;
  this.last_activity = new Date();
  return this.save();
};

// Static method to find by department
staffSchema.statics.findByDepartment = function(department) {
  return this.find({ department: new RegExp(department, 'i') });
};

// Static method to find active staff
staffSchema.statics.findActive = function() {
  return this.find({ status: 'Active' });
};

// Static method to find by supervisor
staffSchema.statics.findBySupervisor = function(supervisorId) {
  return this.find({ supervisor_id: supervisorId });
};

// Static method to get staff statistics
staffSchema.statics.getStaffStats = async function() {
  const stats = await this.aggregate([
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    }
  ]);
  
  const departmentStats = await this.aggregate([
    {
      $group: {
        _id: '$department',
        count: { $sum: 1 },
        avg_approval_rate: { $avg: '$approval_rate' }
      }
    },
    {
      $sort: { count: -1 }
    }
  ]);
  
  const performanceStats = await this.aggregate([
    {
      $group: {
        _id: null,
        total_applications_reviewed: { $sum: '$performance_metrics.applications_reviewed' },
        total_applications_approved: { $sum: '$performance_metrics.applications_approved' },
        total_applications_rejected: { $sum: '$performance_metrics.applications_rejected' },
        avg_response_time: { $avg: '$performance_metrics.response_time_avg' },
        avg_satisfaction: { $avg: '$performance_metrics.customer_satisfaction' }
      }
    }
  ]);
  
  return {
    status_stats: stats,
    department_stats: departmentStats,
    performance_stats: performanceStats[0] || {}
  };
};

// Static method to get top performers
staffSchema.statics.getTopPerformers = function(limit = 10) {
  return this.find({ status: 'Active' })
    .sort({ 'performance_metrics.customer_satisfaction': -1 })
    .limit(limit)
    .populate('user', 'first_name father_name email');
};

const Staff = mongoose.model('Staff', staffSchema);

module.exports = Staff;
