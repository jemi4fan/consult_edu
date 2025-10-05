# Scholarship & Job Application Platform - Frontend

A modern, component-based React frontend for the Scholarship & Job Application Platform.

## Features

### 🎯 Core Functionality
- **Role-based Access Control**: Admin, Staff, and Applicant dashboards
- **Multi-step Application Wizard**: For jobs and scholarships
- **Real-time Chat System**: Communication between applicants and staff
- **Document Management**: Upload, view, and manage application documents
- **Profile Management**: Complete user profiles with progress tracking

### 👥 User Roles

#### Admin Dashboard
- Manage applicants, jobs, and scholarships
- Staff management
- Ads and announcements
- Real-time chat with all users
- Full CRUD operations

#### Staff Dashboard
- Manage applicants, jobs, and scholarships
- Real-time chat with applicants
- Same functionality as admin (except staff management and ads)

#### Applicant Dashboard
- Browse jobs and scholarships
- Multi-step application wizard
- Profile completion tracking
- Document upload and management
- Chat with staff/admin
- Application progress tracking

## 🚀 Getting Started

### Prerequisites
- Node.js 16+ 
- npm or yarn
- Backend API running on port 8000

### Installation

1. **Clone and navigate to frontend directory**
   ```bash
   cd frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   Edit `.env` file with your configuration.

4. **Start development server**
   ```bash
   npm start
   ```

   The app will open at [http://localhost:3000](http://localhost:3000)

### Available Scripts

- `npm start` - Start development server
- `npm build` - Build for production
- `npm test` - Run tests
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint errors

## 🏗️ Project Structure

```
src/
├── components/           # Reusable UI components
│   ├── ui/              # Base UI components (Button, Input, Modal, etc.)
│   ├── layout/          # Layout components (Sidebar, Header, etc.)
│   └── wizard/          # Application wizard components
├── contexts/            # React contexts (Auth, etc.)
├── pages/               # Page components
│   ├── admin/           # Admin/Staff pages
│   ├── applicant/       # Applicant pages
│   ├── auth/            # Authentication pages
│   ├── wizard/          # Application wizard pages
│   └── error/           # Error pages
├── services/            # API services
├── utils/               # Utility functions
└── App.js               # Main application component
```

## 🎨 Component Architecture

### Base Components
- **Button**: Configurable button with variants and sizes
- **Input**: Form input with validation states
- **Modal**: Reusable modal component
- **Card**: Content container with header, content, and footer
- **Badge**: Status and category indicators
- **ProgressBar**: Progress tracking component

### Layout Components
- **DashboardLayout**: Main layout wrapper
- **AuthLayout**: Authentication page layout
- **Sidebar**: Navigation sidebar with role-based menus
- **Header**: Top navigation with user menu
- **MobileSidebar**: Mobile-responsive sidebar

### Wizard Components
- **Stepper**: Multi-step progress indicator
- **ApplicationWizard**: Main wizard container

## 🔐 Authentication

The app uses JWT-based authentication with role-based access control:

- **Admin**: Full system access
- **Staff**: Limited admin access (no staff management, no ads)
- **Applicant**: Personal dashboard and applications

## 📱 Responsive Design

- Mobile-first approach
- Responsive grid layouts
- Mobile-optimized navigation
- Touch-friendly interactions

## 🎯 Key Features

### Application Wizard
- **Job Applications**: 4-step process (Selection → Country → Documents → Summary)
- **Scholarship Applications**: 6-step process (Selection → Country → Program → Scholarship → Documents → Summary)
- Progress tracking and validation
- Draft saving functionality

### Real-time Chat
- Conversation management
- File attachments
- Message status indicators
- Online/offline status

### Document Management
- Drag & drop file upload
- Multiple file type support
- File preview and download
- Document type categorization

## 🔧 Configuration

### Environment Variables
- `REACT_APP_API_URL`: Backend API URL
- `REACT_APP_ENV`: Environment (development/production)
- `REACT_APP_ENABLE_CHAT`: Enable chat functionality
- `REACT_APP_MAX_FILE_SIZE`: Maximum file upload size
- `REACT_APP_ALLOWED_FILE_TYPES`: Allowed file extensions

### API Integration
The frontend integrates with the Django REST API:
- Authentication endpoints
- User management
- Job and scholarship management
- Application processing
- Chat functionality
- Document handling

## 🚀 Deployment

### Production Build
```bash
npm run build
```

### Docker Deployment
```dockerfile
FROM node:16-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

## 📝 Development Guidelines

### Code Style
- Use functional components with hooks
- Follow React best practices
- Use TypeScript for type safety (if needed)
- Implement proper error handling
- Use semantic HTML and ARIA attributes

### Component Guidelines
- Keep components small and focused
- Use prop validation
- Implement loading states
- Handle error states gracefully
- Make components accessible

### State Management
- Use React Context for global state
- Use local state for component-specific data
- Implement proper state updates
- Handle async operations correctly

## 🐛 Troubleshooting

### Common Issues
1. **API Connection**: Ensure backend is running on correct port
2. **Authentication**: Check JWT token handling
3. **File Uploads**: Verify file size and type restrictions
4. **Routing**: Check route definitions and permissions

### Debug Mode
Enable debug mode by setting `REACT_APP_DEBUG=true` in your environment.

## 📚 Additional Resources

- [React Documentation](https://reactjs.org/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [React Router](https://reactrouter.com/docs)
- [React Hook Form](https://react-hook-form.com)

## 🤝 Contributing

1. Follow the existing code style
2. Add proper error handling
3. Include loading states
4. Test responsive design
5. Ensure accessibility compliance

## 📄 License

This project is part of the Scholarship & Job Application Platform.


