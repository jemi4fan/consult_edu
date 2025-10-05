const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure upload directory exists
const ensureUploadDir = (dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

// File filter function
const fileFilter = (req, file, cb) => {
  const allowedTypes = (process.env.ALLOWED_FILE_TYPES || 'pdf,doc,docx,png,jpg,jpeg').split(',');
  const fileExtension = path.extname(file.originalname).toLowerCase().substring(1);
  
  if (allowedTypes.includes(fileExtension)) {
    cb(null, true);
  } else {
    cb(new Error(`File type .${fileExtension} is not allowed. Allowed types: ${allowedTypes.join(', ')}`), false);
  }
};

// Storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let uploadPath = process.env.UPLOAD_PATH || './uploads';
    
    // Create subdirectories based on file type
    const fileType = file.fieldname || 'general';
    const fullPath = path.join(uploadPath, fileType);
    
    ensureUploadDir(fullPath);
    cb(null, fullPath);
  },
  filename: (req, file, cb) => {
    // Generate unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const fileExtension = path.extname(file.originalname);
    const filename = file.fieldname + '-' + uniqueSuffix + fileExtension;
    cb(null, filename);
  }
});

// Memory storage for temporary files
const memoryStorage = multer.memoryStorage();

// Multer configuration
const upload = multer({
  storage: storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024, // 10MB default
    files: 5 // Maximum 5 files per request
  },
  fileFilter: fileFilter
});

// Memory upload configuration
const memoryUpload = multer({
  storage: memoryStorage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024,
    files: 1
  },
  fileFilter: fileFilter
});

// Single file upload middleware
const uploadSingle = (fieldName) => {
  return (req, res, next) => {
    const uploadMiddleware = upload.single(fieldName);
    
    uploadMiddleware(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({
            success: false,
            message: 'File too large. Maximum size allowed is ' + (parseInt(process.env.MAX_FILE_SIZE) / 1024 / 1024) + 'MB'
          });
        }
        if (err.code === 'LIMIT_UNEXPECTED_FILE') {
          return res.status(400).json({
            success: false,
            message: 'Unexpected field name for file upload'
          });
        }
      }
      
      if (err) {
        return res.status(400).json({
          success: false,
          message: err.message
        });
      }
      
      next();
    });
  };
};

// Multiple files upload middleware
const uploadMultiple = (fieldName, maxCount = 5) => {
  return (req, res, next) => {
    const uploadMiddleware = upload.array(fieldName, maxCount);
    
    uploadMiddleware(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({
            success: false,
            message: 'File too large. Maximum size allowed is ' + (parseInt(process.env.MAX_FILE_SIZE) / 1024 / 1024) + 'MB'
          });
        }
        if (err.code === 'LIMIT_FILE_COUNT') {
          return res.status(400).json({
            success: false,
            message: `Too many files. Maximum ${maxCount} files allowed`
          });
        }
      }
      
      if (err) {
        return res.status(400).json({
          success: false,
          message: err.message
        });
      }
      
      next();
    });
  };
};

// Mixed files upload middleware
const uploadFields = (fields) => {
  return (req, res, next) => {
    const uploadMiddleware = upload.fields(fields);
    
    uploadMiddleware(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({
            success: false,
            message: 'File too large. Maximum size allowed is ' + (parseInt(process.env.MAX_FILE_SIZE) / 1024 / 1024) + 'MB'
          });
        }
        if (err.code === 'LIMIT_UNEXPECTED_FILE') {
          return res.status(400).json({
            success: false,
            message: 'Unexpected field name for file upload'
          });
        }
      }
      
      if (err) {
        return res.status(400).json({
          success: false,
          message: err.message
        });
      }
      
      next();
    });
  };
};

// Memory upload middleware
const uploadMemory = (fieldName) => {
  return (req, res, next) => {
    const uploadMiddleware = memoryUpload.single(fieldName);
    
    uploadMiddleware(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({
            success: false,
            message: 'File too large. Maximum size allowed is ' + (parseInt(process.env.MAX_FILE_SIZE) / 1024 / 1024) + 'MB'
          });
        }
      }
      
      if (err) {
        return res.status(400).json({
          success: false,
          message: err.message
        });
      }
      
      next();
    });
  };
};

// File cleanup utility
const cleanupFile = (filePath) => {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      return true;
    }
  } catch (error) {
    console.error('Error cleaning up file:', error);
  }
  return false;
};

// Get file info utility
const getFileInfo = (file) => {
  if (!file) return null;
  
  return {
    originalname: file.originalname,
    filename: file.filename,
    mimetype: file.mimetype,
    size: file.size,
    path: file.path,
    destination: file.destination,
    fieldname: file.fieldname,
    encoding: file.encoding
  };
};

// Validate file type utility
const validateFileType = (filename, allowedTypes) => {
  const fileExtension = path.extname(filename).toLowerCase().substring(1);
  return allowedTypes.includes(fileExtension);
};

// Get file size in human readable format
const getFileSizeFormatted = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

module.exports = {
  upload,
  memoryUpload,
  uploadSingle,
  uploadMultiple,
  uploadFields,
  uploadMemory,
  cleanupFile,
  getFileInfo,
  validateFileType,
  getFileSizeFormatted,
  ensureUploadDir
};


