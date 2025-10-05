const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Socket.io connection handling
const initializeSocket = (io) => {
  // Authentication middleware for socket connections
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];
      
      if (!token) {
        return next(new Error('Authentication token required'));
      }

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Get user
      const user = await User.findById(decoded.userId).select('-password');
      
      if (!user || !user.is_active) {
        return next(new Error('Invalid or inactive user'));
      }

      socket.userId = user._id.toString();
      socket.user = user;
      
      next();
    } catch (error) {
      console.error('Socket authentication error:', error);
      next(new Error('Authentication failed'));
    }
  });

  // Handle connection
  io.on('connection', (socket) => {
    console.log(`User ${socket.user.first_name} connected with socket ${socket.id}`);

    // Join user to their personal room
    const userRoom = `user_${socket.userId}`;
    socket.join(userRoom);

    // Join admin/staff to admin room for notifications
    if (socket.user.role === 'admin' || socket.user.role === 'staff') {
      socket.join('admin_room');
    }

    // Join applicant to applicant room
    if (socket.user.role === 'applicant') {
      socket.join('applicant_room');
    }

    // Broadcast user online status
    socket.broadcast.emit('user_online', {
      user_id: socket.userId,
      user_name: `${socket.user.first_name} ${socket.user.father_name}`,
      role: socket.user.role
    });

    // Handle joining conversation room
    socket.on('join_conversation', (data) => {
      const { conversation_id } = data;
      if (conversation_id) {
        socket.join(`conversation_${conversation_id}`);
      }
    });

    // Handle leaving conversation room
    socket.on('leave_conversation', (data) => {
      const { conversation_id } = data;
      if (conversation_id) {
        socket.leave(`conversation_${conversation_id}`);
      }
    });

    // Handle typing indicator
    socket.on('typing_start', (data) => {
      const { receiver_id, conversation_id } = data;
      
      // Send typing indicator to receiver
      socket.to(`user_${receiver_id}`).emit('user_typing', {
        sender_id: socket.userId,
        sender_name: `${socket.user.first_name} ${socket.user.father_name}`,
        conversation_id
      });
    });

    socket.on('typing_stop', (data) => {
      const { receiver_id, conversation_id } = data;
      
      // Send stop typing indicator to receiver
      socket.to(`user_${receiver_id}`).emit('user_stop_typing', {
        sender_id: socket.userId,
        conversation_id
      });
    });

    // Handle message reaction
    socket.on('message_reaction', async (data) => {
      try {
        const { message_id, emoji } = data;
        
        // Here you would update the message reaction in the database
        // For now, we'll just broadcast the reaction
        
        socket.broadcast.emit('message_reaction_added', {
          message_id,
          user_id: socket.userId,
          user_name: `${socket.user.first_name} ${socket.user.father_name}`,
          emoji
        });
      } catch (error) {
        console.error('Error handling message reaction:', error);
      }
    });

    // Handle application status updates
    socket.on('application_status_update', (data) => {
      // Broadcast to admin/staff rooms
      socket.to('admin_room').emit('application_updated', {
        application_id: data.application_id,
        status: data.status,
        updated_by: {
          id: socket.userId,
          name: `${socket.user.first_name} ${socket.user.father_name}`
        }
      });
    });

    // Handle document upload notifications
    socket.on('document_uploaded', (data) => {
      // Notify admin/staff about new document
      socket.to('admin_room').emit('new_document', {
        document_id: data.document_id,
        applicant_id: data.applicant_id,
        document_type: data.document_type,
        uploaded_by: {
          id: socket.userId,
          name: `${socket.user.first_name} ${socket.user.father_name}`
        }
      });
    });

    // Handle system notifications
    socket.on('send_notification', (data) => {
      const { target_user_id, message, type = 'info' } = data;
      
      if (target_user_id) {
        // Send to specific user
        io.to(`user_${target_user_id}`).emit('notification', {
          message,
          type,
          from: {
            id: socket.userId,
            name: `${socket.user.first_name} ${socket.user.father_name}`
          },
          timestamp: new Date()
        });
      } else {
        // Broadcast to all users
        io.emit('notification', {
          message,
          type,
          from: {
            id: socket.userId,
            name: `${socket.user.first_name} ${socket.user.father_name}`
          },
          timestamp: new Date()
        });
      }
    });

    // Handle announcement broadcasts
    socket.on('broadcast_announcement', (data) => {
      const { message, target_role = 'all' } = data;
      
      if (target_role === 'all') {
        io.emit('announcement', {
          message,
          from: {
            id: socket.userId,
            name: `${socket.user.first_name} ${socket.user.father_name}`,
            role: socket.user.role
          },
          timestamp: new Date()
        });
      } else {
        // Send to specific role
        io.to(`${target_role}_room`).emit('announcement', {
          message,
          from: {
            id: socket.userId,
            name: `${socket.user.first_name} ${socket.user.father_name}`,
            role: socket.user.role
          },
          timestamp: new Date()
        });
      }
    });

    // Handle disconnect
    socket.on('disconnect', (reason) => {
      console.log(`User ${socket.user.first_name} disconnected: ${reason}`);
      
      // Broadcast user offline status
      socket.broadcast.emit('user_offline', {
        user_id: socket.userId,
        user_name: `${socket.user.first_name} ${socket.user.father_name}`
      });
    });

    // Handle errors
    socket.on('error', (error) => {
      console.error('Socket error:', error);
    });
  });

  // Handle server errors
  io.on('error', (error) => {
    console.error('Socket.io server error:', error);
  });

  return io;
};

// Utility functions for socket operations
const socketUtils = {
  // Send notification to specific user
  sendNotificationToUser: (io, userId, notification) => {
    io.to(`user_${userId}`).emit('notification', {
      ...notification,
      timestamp: new Date()
    });
  },

  // Send notification to all admins
  sendNotificationToAdmins: (io, notification) => {
    io.to('admin_room').emit('notification', {
      ...notification,
      timestamp: new Date()
    });
  },

  // Send notification to all staff
  sendNotificationToStaff: (io, notification) => {
    io.to('admin_room').emit('notification', {
      ...notification,
      timestamp: new Date()
    });
  },

  // Send notification to all applicants
  sendNotificationToApplicants: (io, notification) => {
    io.to('applicant_room').emit('notification', {
      ...notification,
      timestamp: new Date()
    });
  },

  // Broadcast announcement
  broadcastAnnouncement: (io, announcement) => {
    io.emit('announcement', {
      ...announcement,
      timestamp: new Date()
    });
  },

  // Get online users count
  getOnlineUsersCount: (io) => {
    const rooms = io.sockets.adapter.rooms;
    let onlineCount = 0;

    for (const [roomId, room] of rooms) {
      if (roomId.startsWith('user_')) {
        onlineCount++;
      }
    }

    return onlineCount;
  },

  // Get online users list
  getOnlineUsers: async (io) => {
    const rooms = io.sockets.adapter.rooms;
    const onlineUsers = [];

    for (const [roomId, room] of rooms) {
      if (roomId.startsWith('user_')) {
        const userId = roomId.replace('user_', '');
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
          console.error('Error getting user info:', error);
        }
      }
    }

    return onlineUsers;
  }
};

module.exports = {
  initializeSocket,
  socketUtils
};


