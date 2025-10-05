const express = require('express');
const Chat = require('../models/Chat');
const User = require('../models/User');
const { authenticate, authorize, staffOrAdmin } = require('../middleware/auth');
const { chatValidation, paramValidation, queryValidation } = require('../middleware/validation');

const router = express.Router();

// @desc    Get all conversations for current user
// @route   GET /api/chat/conversations
// @access  Private
router.get('/conversations', authenticate, async (req, res, next) => {
  try {
    const conversations = await Chat.aggregate([
      {
        $match: {
          $or: [
            { sender_id: req.user.id },
            { receiver_id: req.user.id }
          ],
          is_deleted: false
        }
      },
      {
        $sort: { created_at: -1 }
      },
      {
        $group: {
          _id: {
            $cond: [
              { $eq: ['$sender_id', req.user.id] },
              '$receiver_id',
              '$sender_id'
            ]
          },
          last_message: { $first: '$$ROOT' },
          unread_count: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ['$receiver_id', req.user.id] },
                    { $eq: ['$read_status', false] }
                  ]
                },
                1,
                0
              ]
            }
          }
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
          user_id: '$_id',
          user_info: {
            first_name: '$user.first_name',
            father_name: '$user.father_name',
            email: '$user.email',
            role: '$user.role'
          },
          last_message: {
            message: '$last_message.message',
            message_type: '$last_message.message_type',
            created_at: '$last_message.created_at',
            read_status: '$last_message.read_status'
          },
          unread_count: 1
        }
      },
      {
        $sort: { 'last_message.created_at': -1 }
      }
    ]);

    res.json({
      success: true,
      data: { conversations }
    });

  } catch (error) {
    next(error);
  }
});

// @desc    Get conversation between two users
// @route   GET /api/chat/conversation/:userId
// @access  Private
router.get('/conversation/:userId', authenticate, paramValidation.userId, queryValidation.pagination, async (req, res, next) => {
  try {
    const { userId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    // Check if the other user exists
    const otherUser = await User.findById(userId);
    if (!otherUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Get conversation messages
    const messages = await Chat.findConversation(req.user.id, userId, limit, skip);

    // Mark messages as read
    await Chat.markConversationAsRead(userId, req.user.id);

    const total = await Chat.countDocuments({
      $or: [
        { sender_id: req.user.id, receiver_id: userId },
        { sender_id: userId, receiver_id: req.user.id }
      ],
      is_deleted: false
    });

    res.json({
      success: true,
      data: {
        messages: messages.reverse(), // Reverse to show oldest first
        other_user: {
          id: otherUser._id,
          first_name: otherUser.first_name,
          father_name: otherUser.father_name,
          email: otherUser.email,
          role: otherUser.role
        },
        pagination: {
          current_page: page,
          total_pages: Math.ceil(total / limit),
          total_items: total,
          items_per_page: limit,
          has_next: page < Math.ceil(total / limit),
          has_previous: page > 1
        }
      }
    });

  } catch (error) {
    next(error);
  }
});

// @desc    Send message
// @route   POST /api/chat/send
// @access  Private
router.post('/send', authenticate, chatValidation.send, async (req, res, next) => {
  try {
    const { receiver_id, message, message_type = 'text' } = req.body;

    // Check if receiver exists
    const receiver = await User.findById(receiver_id);
    if (!receiver) {
      return res.status(404).json({
        success: false,
        message: 'Receiver not found'
      });
    }

    // Check if receiver is active
    if (!receiver.is_active) {
      return res.status(400).json({
        success: false,
        message: 'Cannot send message to inactive user'
      });
    }

    // Create message
    const chatMessage = await Chat.create({
      sender_id: req.user.id,
      receiver_id,
      message: message.trim(),
      message_type
    });

    // Populate the message
    const populatedMessage = await Chat.findById(chatMessage._id)
      .populate('sender', 'first_name father_name email')
      .populate('receiver', 'first_name father_name email');

    // Emit message to receiver via Socket.io
    req.io.to(receiver_id.toString()).emit('new_message', {
      message: populatedMessage,
      sender: {
        id: req.user.id,
        first_name: req.user.first_name,
        father_name: req.user.father_name,
        email: req.user.email
      }
    });

    // Emit message to sender for confirmation
    req.io.to(req.user.id.toString()).emit('message_sent', {
      message: populatedMessage
    });

    res.status(201).json({
      success: true,
      message: 'Message sent successfully',
      data: { message: populatedMessage }
    });

  } catch (error) {
    next(error);
  }
});

// @desc    Mark message as read
// @route   PUT /api/chat/:messageId/read
// @access  Private
router.put('/:messageId/read', authenticate, paramValidation.mongoId, async (req, res, next) => {
  try {
    const message = await Chat.findById(req.params.messageId);

    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }

    // Check if user is the receiver
    if (message.receiver_id.toString() !== req.user.id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Mark as read
    await message.markAsRead();

    // Notify sender that message was read
    req.io.to(message.sender_id.toString()).emit('message_read', {
      message_id: message._id,
      read_by: {
        id: req.user.id,
        first_name: req.user.first_name,
        father_name: req.user.father_name
      },
      read_at: message.read_at
    });

    res.json({
      success: true,
      message: 'Message marked as read',
      data: { message }
    });

  } catch (error) {
    next(error);
  }
});

// @desc    Delete message
// @route   DELETE /api/chat/:messageId
// @access  Private
router.delete('/:messageId', authenticate, paramValidation.mongoId, async (req, res, next) => {
  try {
    const message = await Chat.findById(req.params.messageId);

    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }

    // Check if user is the sender or receiver
    if (message.sender_id.toString() !== req.user.id.toString() && 
        message.receiver_id.toString() !== req.user.id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Delete message
    await message.deleteMessage(req.user.id);

    // Notify the other user
    const otherUserId = message.sender_id.toString() === req.user.id.toString() 
      ? message.receiver_id 
      : message.sender_id;

    req.io.to(otherUserId.toString()).emit('message_deleted', {
      message_id: message._id,
      deleted_by: {
        id: req.user.id,
        first_name: req.user.first_name,
        father_name: req.user.father_name
      }
    });

    res.json({
      success: true,
      message: 'Message deleted successfully'
    });

  } catch (error) {
    next(error);
  }
});

// @desc    Get unread messages count
// @route   GET /api/chat/unread-count
// @access  Private
router.get('/unread-count', authenticate, async (req, res, next) => {
  try {
    const unreadMessages = await Chat.findUnreadMessages(req.user.id);
    const unreadCount = unreadMessages.length;

    res.json({
      success: true,
      data: { unread_count: unreadCount }
    });

  } catch (error) {
    next(error);
  }
});

// @desc    Search messages
// @route   GET /api/chat/search
// @access  Private
router.get('/search', authenticate, queryValidation.search, async (req, res, next) => {
  try {
    const { q } = req.query;
    const limit = parseInt(req.query.limit) || 20;

    if (!q || q.length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Search query must be at least 2 characters'
      });
    }

    const messages = await Chat.searchMessages(req.user.id, q, limit);

    res.json({
      success: true,
      data: { messages }
    });

  } catch (error) {
    next(error);
  }
});

// @desc    Get chat statistics
// @route   GET /api/chat/stats/overview
// @access  Private (Admin/Staff only)
router.get('/stats/overview', authenticate, staffOrAdmin, async (req, res, next) => {
  try {
    const stats = await Chat.getChatStats();

    const totalMessages = await Chat.countDocuments();
    const unreadMessages = await Chat.countDocuments({ read_status: false });
    const todayMessages = await Chat.countDocuments({
      created_at: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) }
    });

    res.json({
      success: true,
      data: {
        overview: {
          total_messages: totalMessages,
          unread_messages: unreadMessages,
          today_messages: todayMessages
        },
        ...stats
      }
    });

  } catch (error) {
    next(error);
  }
});

// @desc    Get online users
// @route   GET /api/chat/online-users
// @access  Private
router.get('/online-users', authenticate, async (req, res, next) => {
  try {
    // Get all connected socket rooms (users)
    const rooms = req.io.sockets.adapter.rooms;
    const onlineUsers = [];

    // Get user IDs from socket rooms
    for (const [roomId, room] of rooms) {
      if (roomId.startsWith('user_')) {
        const userId = roomId.replace('user_', '');
        if (userId !== req.user.id.toString()) {
          try {
            const user = await User.findById(userId).select('first_name father_name email role');
            if (user && user.is_active) {
              onlineUsers.push({
                id: user._id,
                first_name: user.first_name,
                father_name: user.father_name,
                email: user.email,
                role: user.role
              });
            }
          } catch (error) {
            // Skip invalid user IDs
            continue;
          }
        }
      }
    }

    res.json({
      success: true,
      data: { online_users: onlineUsers }
    });

  } catch (error) {
    next(error);
  }
});

module.exports = router;


