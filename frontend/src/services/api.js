import axios from 'axios';

// Create axios instance
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:8000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (identifier, password) => api.post('/auth/login', { identifier, password }),
  register: (userData) => api.post('/auth/register', userData),
  logout: () => api.post('/auth/logout'),
  getProfile: () => api.get('/auth/me'),
  refreshToken: (refreshToken) => api.post('/auth/refresh', { refreshToken }),
  changePassword: (currentPassword, newPassword) => api.put('/auth/password', { currentPassword, newPassword }),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  resetPassword: (token, password) => api.put('/auth/reset-password', { token, password }),
  verifyEmail: (token) => api.get(`/auth/verify-email/${token}`),
  resendVerification: () => api.post('/auth/resend-verification'),
};

// Users API
export const usersAPI = {
  getUsers: (params) => api.get('/users', { params }),
  getUser: (id) => api.get(`/users/${id}`),
  createUser: (userData) => api.post('/users', userData),
  updateUser: (id, userData) => api.put(`/users/${id}`, userData),
  deleteUser: (id) => api.delete(`/users/${id}`),
  activateUser: (id) => api.put(`/users/${id}/activate`),
  searchUsers: (params) => api.get('/users/search', { params }),
  getUserStats: () => api.get('/users/stats/overview'),
  bulkUpdateUsers: (userIds, updates) => api.put('/users/bulk', { user_ids: userIds, updates }),
};

// Jobs API
export const jobsAPI = {
  getJobs: (params) => api.get('/jobs', { params }),
  getJob: (id) => api.get(`/jobs/${id}`),
  getCountries: () => api.get('/jobs/countries'),
  createJob: (jobData) => api.post('/jobs', jobData),
  updateJob: (id, jobData) => api.put(`/jobs/${id}`, jobData),
  deleteJob: (id) => api.delete(`/jobs/${id}`),
  getFeaturedJobs: (limit = 5) => api.get(`/jobs/featured/list?limit=${limit}`),
  searchJobs: (params) => api.get('/jobs/search', { params }),
  getJobsByCountry: (country, limit = 10) => api.get(`/jobs/country/${country}?limit=${limit}`),
  getJobsByCompany: (company, limit = 10) => api.get(`/jobs/company/${company}?limit=${limit}`),
  getJobStats: () => api.get('/jobs/stats/overview'),
  getTopPerformingJobs: (limit = 10) => api.get(`/jobs/stats/top-performing?limit=${limit}`),
  updateJobStatus: (id, status) => api.put(`/jobs/${id}/status`, { status }),
  featureJob: (id, is_featured) => api.put(`/jobs/${id}/feature`, { is_featured }),
};

// Scholarships API
export const scholarshipsAPI = {
  getScholarships: (params) => api.get('/scholarships', { params }),
  getScholarship: (id) => api.get(`/scholarships/${id}`),
  getCountries: () => api.get('/scholarships/countries'),
  getPrograms: (country) => api.get(`/scholarships/programs/${country}`),
  createScholarship: (scholarshipData) => api.post('/scholarships', scholarshipData),
  updateScholarship: (id, scholarshipData) => api.put(`/scholarships/${id}`, scholarshipData),
  deleteScholarship: (id) => api.delete(`/scholarships/${id}`),
  getFeaturedScholarships: (limit = 5) => api.get(`/scholarships/featured/list?limit=${limit}`),
  searchScholarships: (params) => api.get('/scholarships/search', { params }),
  getScholarshipsByCountry: (country, limit = 10) => api.get(`/scholarships/country/${country}?limit=${limit}`),
  getScholarshipsByUniversity: (university, limit = 10) => api.get(`/scholarships/university/${university}?limit=${limit}`),
  getScholarshipsByProgram: (program, limit = 10) => api.get(`/scholarships/program/${program}?limit=${limit}`),
  getScholarshipStats: () => api.get('/scholarships/stats/overview'),
  getTopPerformingScholarships: (limit = 10) => api.get(`/scholarships/stats/top-performing?limit=${limit}`),
  updateScholarshipStatus: (id, status) => api.put(`/scholarships/${id}/status`, { status }),
  featureScholarship: (id, is_featured) => api.put(`/scholarships/${id}/feature`, { is_featured }),
};

// Applications API
export const applicationsAPI = {
  getApplications: (params) => api.get('/applications', { params }),
  getApplication: (id) => api.get(`/applications/${id}`),
  createApplication: (applicationData) => api.post('/applications', applicationData),
  updateApplication: (id, applicationData) => api.put(`/applications/${id}`, applicationData),
  submitApplication: ({ id, data }) => api.put(`/applications/${id}/submit`, data),
  restartApplication: (id) => api.put(`/applications/${id}/restart`),
  getUserApplications: (params) => api.get('/applications/my/list', { params }),
  updateApplicationStatus: (id, status) => api.put(`/applications/${id}/status`, { status }),
  addReviewNote: (id, note, status = 'Info') => api.post(`/applications/${id}/notes`, { note, status }),
  getApplicationStats: () => api.get('/applications/stats/overview'),
  getPendingApplications: (limit = 20) => api.get(`/applications/pending/list?limit=${limit}`),
};

// Documents API
export const documentsAPI = {
  getDocuments: (params) => api.get('/documents', { params }),
  getDocument: (id) => api.get(`/documents/${id}`),
  getUserDocuments: (params) => api.get('/documents/my/list', { params }),
  uploadDocument: (formData) => api.post('/documents/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  }),
  uploadMultipleDocuments: (formData) => api.post('/documents/upload-multiple', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  }),
  downloadDocument: (id) => api.get(`/documents/${id}/download`, {
    responseType: 'blob',
  }),
  updateDocument: (id, documentData) => api.put(`/documents/${id}`, documentData),
  deleteDocument: (id) => api.delete(`/documents/${id}`),
  verifyDocument: (id, notes = '') => api.put(`/documents/${id}/verify`, { notes }),
  unverifyDocument: (id) => api.put(`/documents/${id}/unverify`),
  getDocumentStats: () => api.get('/documents/stats/overview'),
};

// Applicants API
export const applicantsAPI = {
  getApplicants: (params) => api.get('/applicants', { params }),
  getApplicant: (id) => api.get(`/applicants/${id}`),
  getMyProfile: () => api.get('/applicants/profile/me'),
  createProfile: (profileData) => api.post('/applicants', profileData),
  updateProfile: (id, profileData) => api.put(`/applicants/${id}`, profileData),
  updateMyProfile: (profileData) => api.put('/applicants/profile/me', profileData),
  addSkill: (id, skill) => api.post(`/applicants/${id}/skills`, { skill }),
  removeSkill: (id, skill) => api.delete(`/applicants/${id}/skills/${skill}`),
  addLanguage: (id, language, proficiency) => api.post(`/applicants/${id}/languages`, { language, proficiency }),
  removeLanguage: (id, language) => api.delete(`/applicants/${id}/languages/${language}`),
  getApplicantStats: () => api.get('/applicants/stats/overview'),
};

// Chat API
export const chatAPI = {
  getChats: () => api.get('/chat/conversations'),
  getConversations: () => api.get('/chat/conversations'),
  getConversation: (userId, params) => api.get(`/chat/conversation/${userId}`, { params }),
  getChatMessages: (chatId) => api.get(`/chat/conversation/${chatId}/messages`),
  sendMessage: (chatId, messageData) => api.post('/chat/send', { chatId, ...messageData }),
  markMessageAsRead: (messageId) => api.put(`/chat/${messageId}/read`),
  deleteMessage: (messageId) => api.delete(`/chat/${messageId}`),
  deleteChat: (chatId) => api.delete(`/chat/conversation/${chatId}`),
  getUnreadCount: () => api.get('/chat/unread-count'),
  searchMessages: (params) => api.get('/chat/search', { params }),
  getChatStats: () => api.get('/chat/stats/overview'),
  getOnlineUsers: () => api.get('/chat/online-users'),
};

// Ads API
export const adsAPI = {
  getAds: (params) => api.get('/ads', { params }),
  getAd: (id) => api.get(`/ads/${id}`),
  createAd: (adData) => api.post('/ads', adData),
  updateAd: (id, adData) => api.put(`/ads/${id}`, adData),
  deleteAd: (id) => api.delete(`/ads/${id}`),
  getFeaturedAds: (limit = 5) => api.get(`/ads/featured/list?limit=${limit}`),
  getPinnedAds: (limit = 3) => api.get(`/ads/pinned/list?limit=${limit}`),
  getActiveAds: (limit = 10) => api.get(`/ads/active/list?limit=${limit}`),
  searchAds: (params) => api.get('/ads/search', { params }),
  approveAd: (id, notes = '') => api.put(`/ads/${id}/approve`, { notes }),
  rejectAd: (id, reason = '') => api.put(`/ads/${id}/reject`, { reason }),
  publishAd: (id) => api.put(`/ads/${id}/publish`),
  unpublishAd: (id) => api.put(`/ads/${id}/unpublish`),
  featureAd: (id, is_featured) => api.put(`/ads/${id}/feature`, { is_featured }),
  pinAd: (id, is_pinned) => api.put(`/ads/${id}/pin`, { is_pinned }),
  clickAd: (id) => api.post(`/ads/${id}/click`),
  getAdStats: () => api.get('/ads/stats/overview'),
  getTopPerformingAds: (limit = 10) => api.get(`/ads/stats/top-performing?limit=${limit}`),
};

// File upload utility
export const uploadFile = async (file, type = 'document', onProgress) => {
  const formData = new FormData();
  formData.append('document', file);
  formData.append('type', type);
  
  return api.post('/documents/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    onUploadProgress: (progressEvent) => {
      if (onProgress) {
        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        onProgress(percentCompleted);
      }
    },
  });
};

// Export default api instance
export default api;
