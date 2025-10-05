# Scholarship & Job Application Platform - Express.js Backend

A comprehensive Express.js backend API for managing scholarship and job applications with MongoDB database.

## 🚀 Features

### Core Features
- **User Authentication & Authorization** (JWT-based)
- **Role-based Access Control** (Admin, Staff, Applicant)
- **Multi-step Application Process** for Jobs and Scholarships
- **Real-time Chat System** with Socket.io
- **File Upload & Document Management**
- **Comprehensive API with Validation**
- **Statistics & Analytics Dashboard**

### User Roles
- **Admin**: Full system access, user management, content management
- **Staff**: Application review, user support, limited admin access
- **Applicant**: Profile management, application submission, document upload

## 📋 Prerequisites

- Node.js (v14 or higher)
- MongoDB (v4.4 or higher)
- npm or yarn

## 🛠️ Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd backend-express
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Configuration**
   ```bash
   cp env.example .env
   ```
   
   Update the `.env` file with your configuration:
   ```env
   # Server Configuration
   PORT=8000
   NODE_ENV=development

   # Database Configuration
   MONGODB_URI=mongodb://localhost:27017/scholarship_job_platform

   # JWT Configuration
   JWT_SECRET=your-super-secret-jwt-key-here
   JWT_EXPIRE=7d
   JWT_REFRESH_SECRET=your-refresh-secret-key-here
   JWT_REFRESH_EXPIRE=30d

   # File Upload Configuration
   UPLOAD_PATH=./uploads
   MAX_FILE_SIZE=10485760
   ALLOWED_FILE_TYPES=pdf,doc,docx,png,jpg,jpeg

   # CORS Configuration
   CORS_ORIGIN=http://localhost:3000
   ```

4. **Start MongoDB**
   ```bash
   # Using MongoDB service
   sudo systemctl start mongod

   # Or using Docker
   docker run -d -p 27017:27017 --name mongodb mongo:latest
   ```

5. **Create upload directories**
   ```bash
   mkdir -p uploads/documents
   mkdir -p uploads/images
   mkdir -p uploads/ads
   ```

6. **Start the server**
   ```bash
   # Development mode
   npm run dev

   # Production mode
   npm start
   ```

## 📁 Project Structure

```
backend-express/
├── models/                 # MongoDB models
│   ├── User.js
│   ├── Applicant.js
│   ├── Education.js
│   ├── Document.js
│   ├── Job.js
│   ├── Scholarship.js
│   ├── Application.js
│   ├── Chat.js
│   ├── Staff.js
│   └── Ad.js
├── routes/                 # API routes
│   ├── auth.js
│   ├── users.js
│   ├── applicants.js
│   ├── jobs.js
│   ├── scholarships.js
│   ├── applications.js
│   ├── documents.js
│   ├── chat.js
│   └── ads.js
├── middleware/             # Custom middleware
│   ├── auth.js
│   ├── errorHandler.js
│   ├── upload.js
│   └── validation.js
├── services/               # Business logic services
│   └── socketService.js
├── uploads/                # File uploads directory
├── server.js               # Main server file
├── package.json
├── env.example
└── README.md
```

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `POST /api/auth/refresh` - Refresh JWT token
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/password` - Update password
- `POST /api/auth/forgot-password` - Forgot password
- `PUT /api/auth/reset-password` - Reset password
- `GET /api/auth/verify-email/:token` - Verify email
- `POST /api/auth/resend-verification` - Resend verification

### Users
- `GET /api/users` - Get all users (Admin/Staff)
- `GET /api/users/:id` - Get user by ID
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user (Admin)
- `PUT /api/users/:id/activate` - Activate user (Admin)
- `GET /api/users/stats/overview` - User statistics
- `GET /api/users/search` - Search users

### Applicants
- `GET /api/applicants` - Get all applicants (Admin/Staff)
- `GET /api/applicants/:id` - Get applicant by ID
- `GET /api/applicants/profile/me` - Get current user's profile
- `POST /api/applicants` - Create applicant profile
- `PUT /api/applicants/:id` - Update applicant profile
- `PUT /api/applicants/profile/me` - Update current user's profile
- `POST /api/applicants/:id/skills` - Add skill
- `DELETE /api/applicants/:id/skills/:skill` - Remove skill
- `POST /api/applicants/:id/languages` - Add language
- `DELETE /api/applicants/:id/languages/:language` - Remove language

### Jobs
- `GET /api/jobs` - Get all jobs
- `GET /api/jobs/:id` - Get job by ID
- `POST /api/jobs` - Create job (Admin/Staff)
- `PUT /api/jobs/:id` - Update job (Admin/Staff)
- `DELETE /api/jobs/:id` - Delete job (Admin)
- `GET /api/jobs/featured/list` - Get featured jobs
- `GET /api/jobs/search` - Search jobs
- `GET /api/jobs/country/:country` - Get jobs by country
- `GET /api/jobs/company/:company` - Get jobs by company
- `GET /api/jobs/stats/overview` - Job statistics
- `PUT /api/jobs/:id/status` - Update job status
- `PUT /api/jobs/:id/feature` - Feature/unfeature job

### Scholarships
- `GET /api/scholarships` - Get all scholarships
- `GET /api/scholarships/:id` - Get scholarship by ID
- `POST /api/scholarships` - Create scholarship (Admin/Staff)
- `PUT /api/scholarships/:id` - Update scholarship (Admin/Staff)
- `DELETE /api/scholarships/:id` - Delete scholarship (Admin)
- `GET /api/scholarships/featured/list` - Get featured scholarships
- `GET /api/scholarships/search` - Search scholarships
- `GET /api/scholarships/country/:country` - Get scholarships by country
- `GET /api/scholarships/university/:university` - Get scholarships by university
- `GET /api/scholarships/program/:program` - Get scholarships by program
- `GET /api/scholarships/stats/overview` - Scholarship statistics
- `PUT /api/scholarships/:id/status` - Update scholarship status
- `PUT /api/scholarships/:id/feature` - Feature/unfeature scholarship

### Applications
- `GET /api/applications` - Get all applications (Admin/Staff)
- `GET /api/applications/:id` - Get application by ID
- `GET /api/applications/my/list` - Get current user's applications
- `POST /api/applications` - Create application
- `PUT /api/applications/:id` - Update application
- `PUT /api/applications/:id/submit` - Submit application
- `PUT /api/applications/:id/status` - Update application status (Admin/Staff)
- `POST /api/applications/:id/notes` - Add review note (Admin/Staff)
- `GET /api/applications/stats/overview` - Application statistics
- `GET /api/applications/pending/list` - Get pending applications

### Documents
- `GET /api/documents` - Get all documents (Admin/Staff)
- `GET /api/documents/:id` - Get document by ID
- `GET /api/documents/my/list` - Get current user's documents
- `POST /api/documents/upload` - Upload single document
- `POST /api/documents/upload-multiple` - Upload multiple documents
- `GET /api/documents/:id/download` - Download document
- `PUT /api/documents/:id` - Update document
- `DELETE /api/documents/:id` - Delete document
- `PUT /api/documents/:id/verify` - Verify document (Admin/Staff)
- `PUT /api/documents/:id/unverify` - Unverify document (Admin/Staff)
- `GET /api/documents/stats/overview` - Document statistics

### Chat
- `GET /api/chat/conversations` - Get conversations
- `GET /api/chat/conversation/:userId` - Get conversation with user
- `POST /api/chat/send` - Send message
- `PUT /api/chat/:messageId/read` - Mark message as read
- `DELETE /api/chat/:messageId` - Delete message
- `GET /api/chat/unread-count` - Get unread messages count
- `GET /api/chat/search` - Search messages
- `GET /api/chat/stats/overview` - Chat statistics
- `GET /api/chat/online-users` - Get online users

### Ads
- `GET /api/ads` - Get all ads
- `GET /api/ads/:id` - Get ad by ID
- `POST /api/ads` - Create ad (Admin/Staff)
- `PUT /api/ads/:id` - Update ad (Admin/Staff)
- `DELETE /api/ads/:id` - Delete ad (Admin)
- `GET /api/ads/featured/list` - Get featured ads
- `GET /api/ads/pinned/list` - Get pinned ads
- `GET /api/ads/active/list` - Get active ads
- `GET /api/ads/search` - Search ads
- `PUT /api/ads/:id/approve` - Approve ad (Admin)
- `PUT /api/ads/:id/reject` - Reject ad (Admin)
- `PUT /api/ads/:id/publish` - Publish ad (Admin)
- `PUT /api/ads/:id/unpublish` - Unpublish ad (Admin)
- `PUT /api/ads/:id/feature` - Feature/unfeature ad (Admin)
- `PUT /api/ads/:id/pin` - Pin/unpin ad (Admin)
- `POST /api/ads/:id/click` - Record ad click
- `GET /api/ads/stats/overview` - Ad statistics

## 🔐 Authentication

The API uses JWT (JSON Web Tokens) for authentication. Include the token in the Authorization header:

```javascript
Authorization: Bearer <your-jwt-token>
```

## 📊 Socket.io Events

### Client to Server
- `join_conversation` - Join a conversation room
- `leave_conversation` - Leave a conversation room
- `typing_start` - Start typing indicator
- `typing_stop` - Stop typing indicator
- `message_reaction` - React to a message
- `application_status_update` - Update application status
- `document_uploaded` - Notify document upload
- `send_notification` - Send notification to user
- `broadcast_announcement` - Broadcast announcement

### Server to Client
- `new_message` - New message received
- `message_sent` - Message sent confirmation
- `message_read` - Message read confirmation
- `message_deleted` - Message deleted
- `user_typing` - User typing indicator
- `user_stop_typing` - User stop typing indicator
- `message_reaction_added` - Message reaction added
- `application_updated` - Application status updated
- `new_document` - New document uploaded
- `notification` - System notification
- `announcement` - System announcement
- `user_online` - User came online
- `user_offline` - User went offline

## 🗄️ Database Schema

### Users Collection
- Basic user information, authentication, roles

### Applicants Collection
- Extended applicant information, profile completion

### Education Collection
- Educational background and qualifications

### Documents Collection
- File uploads, verification status

### Jobs Collection
- Job listings, requirements, application details

### Scholarships Collection
- Scholarship opportunities, eligibility criteria

### Applications Collection
- Job and scholarship applications, status tracking

### Chat Collection
- Real-time messaging between users

### Staff Collection
- Staff-specific information and permissions

### Ads Collection
- System announcements and advertisements

## 🧪 Testing

### Manual Testing
1. Start the server: `npm run dev`
2. Use Postman or similar tool to test endpoints
3. Check MongoDB for data persistence

### Health Check
```bash
curl http://localhost:8000/health
```

## 🚀 Deployment

### Environment Variables for Production
```env
NODE_ENV=production
PORT=8000
MONGODB_URI=mongodb://your-production-db-url
JWT_SECRET=your-production-jwt-secret
JWT_REFRESH_SECRET=your-production-refresh-secret
CORS_ORIGIN=https://your-frontend-domain.com
```

### Using PM2
```bash
npm install -g pm2
pm2 start server.js --name "scholarship-backend"
pm2 startup
pm2 save
```

### Using Docker
```dockerfile
FROM node:16-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 8000
CMD ["npm", "start"]
```

## 📝 API Documentation

For detailed API documentation with examples, visit:
- Swagger UI: `http://localhost:8000/api-docs` (if implemented)
- Postman Collection: Available in `/docs` folder

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Commit changes: `git commit -m 'Add feature'`
4. Push to branch: `git push origin feature-name`
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Contact the development team
- Check the documentation

## 🔄 Version History

- **v1.0.0** - Initial release with core features
- **v1.1.0** - Added real-time chat and file upload
- **v1.2.0** - Enhanced security and validation
- **v1.3.0** - Added statistics and analytics

---

**Built with ❤️ using Express.js, MongoDB, and Socket.io**


