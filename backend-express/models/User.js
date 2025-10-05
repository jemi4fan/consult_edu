const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const IdCounter = require('./IdCounter');

const userSchema = new mongoose.Schema({
  id: {
    type: Number,
    unique: true
  },
  role: {
    type: String,
    enum: ['admin', 'staff', 'applicant'],
    required: true,
    default: 'applicant'
  },
  first_name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50
  },
  father_name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50
  },
  grandfather_name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50
  },
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    maxlength: 50,
    lowercase: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: true,
    minlength: 6,
    select: false // Don't include password in queries by default
  },
  phone: {
    type: String,
    trim: true,
    maxlength: 20
  },
  national_id: {
    type: String,
    trim: true,
    maxlength: 50
  },
  address: {
    type: String,
    trim: true
  },
  is_active: {
    type: Boolean,
    default: true
  },
  is_verified: {
    type: Boolean,
    default: false
  },
  verification_token: {
    type: String,
    select: false
  },
  password_reset_token: {
    type: String,
    select: false
  },
  password_reset_expires: {
    type: Date,
    select: false
  },
  last_login: {
    type: Date
  },
  refresh_tokens: [{
    token: String,
    createdAt: {
      type: Date,
      default: Date.now,
      expires: '30d'
    }
  }]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
userSchema.index({ id: 1 });
userSchema.index({ email: 1 });
userSchema.index({ username: 1 });
userSchema.index({ role: 1 });
userSchema.index({ created_at: -1 });

// Virtual for full name
userSchema.virtual('full_name').get(function() {
  return `${this.first_name} ${this.father_name} ${this.grandfather_name}`.trim();
});

// Virtual for applicant data
userSchema.virtual('applicant_data', {
  ref: 'Applicant',
  localField: 'id',
  foreignField: 'user_id',
  justOne: true
});

// Virtual for staff data
userSchema.virtual('staff_data', {
  ref: 'Staff',
  localField: '_id',
  foreignField: 'user_id',
  justOne: true
});

// Pre-save middleware to assign ID and hash password
userSchema.pre('save', async function(next) {
  try {
    // Assign auto-incrementing ID if new document
    if (this.isNew && !this.id) {
      const counter = await IdCounter.getNextSequence('user_id');
      this.id = counter.sequence_value;
    }
    
    // Only hash the password if it has been modified (or is new)
    if (!this.isModified('password')) return next();
    
    // Hash password with cost of 12
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Instance method to check password
userSchema.methods.comparePassword = async function(candidatePassword) {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw new Error('Password comparison failed');
  }
};

// Instance method to generate verification token
userSchema.methods.generateVerificationToken = function() {
  const crypto = require('crypto');
  this.verification_token = crypto.randomBytes(32).toString('hex');
  return this.verification_token;
};

// Instance method to generate password reset token
userSchema.methods.generatePasswordResetToken = function() {
  const crypto = require('crypto');
  this.password_reset_token = crypto.randomBytes(32).toString('hex');
  this.password_reset_expires = Date.now() + 10 * 60 * 1000; // 10 minutes
  return this.password_reset_token;
};

// Instance method to add refresh token
userSchema.methods.addRefreshToken = function(token) {
  this.refresh_tokens.push({ token });
  if (this.refresh_tokens.length > 5) { // Keep only last 5 tokens
    this.refresh_tokens = this.refresh_tokens.slice(-5);
  }
  return this.save();
};

// Instance method to remove refresh token
userSchema.methods.removeRefreshToken = function(token) {
  this.refresh_tokens = this.refresh_tokens.filter(rt => rt.token !== token);
  return this.save();
};

// Static method to find user by email or username
userSchema.statics.findByEmailOrUsername = function(identifier) {
  return this.findOne({
    $or: [
      { email: identifier.toLowerCase() },
      { username: identifier.toLowerCase() }
    ]
  }).select('+password');
};

// Transform function to remove sensitive data
userSchema.methods.toJSON = function() {
  const userObject = this.toObject();
  delete userObject.password;
  delete userObject.verification_token;
  delete userObject.password_reset_token;
  delete userObject.password_reset_expires;
  delete userObject.refresh_tokens;
  return userObject;
};

const User = mongoose.model('User', userSchema);

module.exports = User;


