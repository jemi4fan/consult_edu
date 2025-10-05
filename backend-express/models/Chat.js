const mongoose = require('mongoose');

const chatSchema = new mongoose.Schema({
  sender_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  receiver_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  message: {
    type: String,
    required: true,
    trim: true,
    maxlength: 2000
  },
  message_type: {
    type: String,
    enum: ['text', 'image', 'file', 'system'],
    default: 'text'
  },
  attachment: {
    filename: {
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
  read_status: {
    type: Boolean,
    default: false
  },
  read_at: {
    type: Date,
    default: null
  },
  is_deleted: {
    type: Boolean,
    default: false
  },
  deleted_at: {
    type: Date,
    default: null
  },
  deleted_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  reply_to: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Chat',
    default: null
  },
  reactions: [{
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    emoji: {
      type: String,
      required: true,
      maxlength: 10
    },
    created_at: {
      type: Date,
      default: Date.now
    }
  }],
  thread_id: {
    type: mongoose.Schema.Types.ObjectId,
    default: null
  },
  priority: {
    type: String,
    enum: ['low', 'normal', 'high', 'urgent'],
    default: 'normal'
  },
  tags: [{
    type: String,
    trim: true,
    lowercase: true
  }]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
chatSchema.index({ sender_id: 1 });
chatSchema.index({ receiver_id: 1 });
chatSchema.index({ created_at: -1 });
chatSchema.index({ read_status: 1 });
chatSchema.index({ thread_id: 1 });
chatSchema.index({ is_deleted: 1 });

// Compound indexes for efficient queries
chatSchema.index({ sender_id: 1, receiver_id: 1, created_at: -1 });
chatSchema.index({ receiver_id: 1, read_status: 1 });

// Virtual for sender
chatSchema.virtual('sender', {
  ref: 'User',
  localField: 'sender_id',
  foreignField: '_id',
  justOne: true
});

// Virtual for receiver
chatSchema.virtual('receiver', {
  ref: 'User',
  localField: 'receiver_id',
  foreignField: '_id',
  justOne: true
});

// Virtual for reply message
chatSchema.virtual('reply_message', {
  ref: 'Chat',
  localField: 'reply_to',
  foreignField: '_id',
  justOne: true
});

// Virtual for thread messages
chatSchema.virtual('thread_messages', {
  ref: 'Chat',
  localField: 'thread_id',
  foreignField: 'thread_id'
});

// Virtual for time ago
chatSchema.virtual('time_ago').get(function() {
  const now = new Date();
  const messageTime = new Date(this.created_at);
  const diffTime = Math.abs(now - messageTime);
  const diffMinutes = Math.floor(diffTime / (1000 * 60));
  
  if (diffMinutes < 1) return 'Just now';
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  
  const diffWeeks = Math.floor(diffDays / 7);
  if (diffWeeks < 4) return `${diffWeeks}w ago`;
  
  const diffMonths = Math.floor(diffDays / 30);
  return `${diffMonths}mo ago`;
});

// Virtual for is attachment
chatSchema.virtual('has_attachment').get(function() {
  return this.attachment && this.attachment.filename;
});

// Pre-save middleware to validate message
chatSchema.pre('save', function(next) {
  // Check if message is not empty (unless it's a system message with attachment)
  if (!this.message && this.message_type === 'text') {
    return next(new Error('Message content is required'));
  }
  
  // Check if attachment is provided for file/image messages
  if (['image', 'file'].includes(this.message_type) && !this.attachment) {
    return next(new Error('Attachment is required for file/image messages'));
  }
  
  // Validate file size for attachments
  if (this.attachment && this.attachment.file_size > 10 * 1024 * 1024) { // 10MB
    return next(new Error('File size exceeds maximum allowed size'));
  }
  
  next();
});

// Instance method to mark as read
chatSchema.methods.markAsRead = function() {
  this.read_status = true;
  this.read_at = new Date();
  return this.save();
};

// Instance method to mark as unread
chatSchema.methods.markAsUnread = function() {
  this.read_status = false;
  this.read_at = null;
  return this.save();
};

// Instance method to delete message
chatSchema.methods.deleteMessage = function(userId) {
  this.is_deleted = true;
  this.deleted_at = new Date();
  this.deleted_by = userId;
  return this.save();
};

// Instance method to add reaction
chatSchema.methods.addReaction = function(userId, emoji) {
  // Remove existing reaction from this user
  this.reactions = this.reactions.filter(reaction => reaction.user_id.toString() !== userId.toString());
  
  // Add new reaction
  this.reactions.push({
    user_id: userId,
    emoji: emoji,
    created_at: new Date()
  });
  
  return this.save();
};

// Instance method to remove reaction
chatSchema.methods.removeReaction = function(userId) {
  this.reactions = this.reactions.filter(reaction => reaction.user_id.toString() !== userId.toString());
  return this.save();
};

// Instance method to add tag
chatSchema.methods.addTag = function(tag) {
  const lowercaseTag = tag.toLowerCase().trim();
  if (!this.tags.includes(lowercaseTag)) {
    this.tags.push(lowercaseTag);
  }
  return this.save();
};

// Instance method to remove tag
chatSchema.methods.removeTag = function(tag) {
  const lowercaseTag = tag.toLowerCase().trim();
  this.tags = this.tags.filter(t => t !== lowercaseTag);
  return this.save();
};

// Static method to find conversation between two users
chatSchema.statics.findConversation = function(user1Id, user2Id, limit = 50, skip = 0) {
  return this.find({
    $or: [
      { sender_id: user1Id, receiver_id: user2Id },
      { sender_id: user2Id, receiver_id: user1Id }
    ],
    is_deleted: false
  })
  .sort({ created_at: -1 })
  .limit(limit)
  .skip(skip)
  .populate('sender', 'first_name father_name email')
  .populate('receiver', 'first_name father_name email');
};

// Static method to find unread messages for a user
chatSchema.statics.findUnreadMessages = function(userId) {
  return this.find({
    receiver_id: userId,
    read_status: false,
    is_deleted: false
  })
  .populate('sender', 'first_name father_name email')
  .sort({ created_at: -1 });
};

// Static method to mark conversation as read
chatSchema.statics.markConversationAsRead = function(senderId, receiverId) {
  return this.updateMany(
    {
      sender_id: senderId,
      receiver_id: receiverId,
      read_status: false
    },
    {
      $set: {
        read_status: true,
        read_at: new Date()
      }
    }
  );
};

// Static method to get chat statistics
chatSchema.statics.getChatStats = async function() {
  const stats = await this.aggregate([
    {
      $group: {
        _id: '$message_type',
        count: { $sum: 1 }
      }
    }
  ]);
  
  const unreadStats = await this.aggregate([
    {
      $match: {
        read_status: false,
        is_deleted: false
      }
    },
    {
      $group: {
        _id: '$receiver_id',
        unread_count: { $sum: 1 }
      }
    },
    {
      $lookup: {
        from: 'users',
        localField: '_id',
        foreignField: '_id',
        as: 'user'
      }
    },
    {
      $unwind: '$user'
    },
    {
      $project: {
        user_name: {
          $concat: ['$user.first_name', ' ', '$user.father_name']
        },
        email: '$user.email',
        unread_count: 1
      }
    },
    {
      $sort: { unread_count: -1 }
    },
    {
      $limit: 10
    }
  ]);
  
  return {
    message_type_stats: stats,
    unread_stats: unreadStats
  };
};

// Static method to search messages
chatSchema.statics.searchMessages = function(userId, searchTerm, limit = 20) {
  return this.find({
    $or: [
      { sender_id: userId },
      { receiver_id: userId }
    ],
    message: { $regex: searchTerm, $options: 'i' },
    is_deleted: false
  })
  .sort({ created_at: -1 })
  .limit(limit)
  .populate('sender', 'first_name father_name email')
  .populate('receiver', 'first_name father_name email');
};

const Chat = mongoose.model('Chat', chatSchema);

module.exports = Chat;


