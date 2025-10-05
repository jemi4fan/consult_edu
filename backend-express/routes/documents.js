const express = require('express');
const Document = require('../models/Document');
const Applicant = require('../models/Applicant');
const Application = require('../models/Application');
const { authenticate, authorize, staffOrAdmin, checkOwnership } = require('../middleware/auth');
const { paramValidation, queryValidation } = require('../middleware/validation');
const { uploadSingle, uploadMultiple, cleanupFile, getFileInfo } = require('../middleware/upload');
const path = require('path');
const fs = require('fs');

const router = express.Router();

// @desc    Get all documents
// @route   GET /api/documents
// @access  Private (Admin/Staff only)
router.get('/', authenticate, staffOrAdmin, queryValidation.pagination, async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const sort = req.query.sort || '-created_at';

    // Build query
    const query = {};

    // Filter by type
    if (req.query.type) {
      query.type = req.query.type;
    }

    // Filter by applicant_id
    if (req.query.applicant_id) {
      query.applicant_id = req.query.applicant_id;
    }

    // Filter by application_id
    if (req.query.application_id) {
      query.application_id = req.query.application_id;
    }

    // Filter by verification status
    if (req.query.is_verified !== undefined) {
      query.is_verified = req.query.is_verified === 'true';
    }

    // Search by filename
    if (req.query.search) {
      query.filename = { $regex: req.query.search, $options: 'i' };
    }

    const documents = await Document.find(query)
      .populate('applicant_id')
      .populate('application_id')
      .populate('verified_by', 'first_name father_name email')
      .sort(sort)
      .skip(skip)
      .limit(limit);

    const total = await Document.countDocuments(query);

    res.json({
      success: true,
      data: {
        documents,
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

// @desc    Get document by ID
// @route   GET /api/documents/:id
// @access  Private
router.get('/:id', authenticate, paramValidation.mongoId, async (req, res, next) => {
  try {
    const document = await Document.findById(req.params.id)
      .populate('applicant_id')
      .populate('application_id')
      .populate('verified_by', 'first_name father_name email');

    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      });
    }

    // Check if user can access this document
    if (req.user.role !== 'admin' && req.user.role !== 'staff' && 
        req.user.id.toString() !== document.applicant_id.user_id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    res.json({
      success: true,
      data: { document }
    });

  } catch (error) {
    next(error);
  }
});

// @desc    Get current user's documents
// @route   GET /api/documents/my/list
// @access  Private (Applicant only)
router.get('/my/list', authenticate, authorize('applicant'), queryValidation.pagination, async (req, res, next) => {
  try {
    // Get applicant profile
    const applicant = await Applicant.findOne({ user_id: req.user.id });

    if (!applicant) {
      return res.status(404).json({
        success: false,
        message: 'Applicant profile not found'
      });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const sort = req.query.sort || '-created_at';

    // Build query
    const query = { applicant_id: applicant._id };

    // Filter by type
    if (req.query.type) {
      query.type = req.query.type;
    }

    // Filter by application_id
    if (req.query.application_id) {
      query.application_id = req.query.application_id;
    }

    // Filter by verification status
    if (req.query.is_verified !== undefined) {
      query.is_verified = req.query.is_verified === 'true';
    }

    const documents = await Document.find(query)
      .populate('application_id', 'type job_id scholarship_id status')
      .populate('verified_by', 'first_name father_name email')
      .sort(sort)
      .skip(skip)
      .limit(limit);

    const total = await Document.countDocuments(query);

    res.json({
      success: true,
      data: {
        documents,
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

// @desc    Upload single document
// @route   POST /api/documents/upload
// @access  Private (Applicant only)
router.post('/upload', authenticate, authorize('applicant'), uploadSingle('document'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    // Get applicant profile
    const applicant = await Applicant.findOne({ user_id: req.user.id });

    if (!applicant) {
      // Clean up uploaded file
      cleanupFile(req.file.path);
      return res.status(404).json({
        success: false,
        message: 'Applicant profile not found'
      });
    }

    const { type, application_id, description } = req.body;

    if (!type) {
      // Clean up uploaded file
      cleanupFile(req.file.path);
      return res.status(400).json({
        success: false,
        message: 'Document type is required'
      });
    }

    // Validate application_id if provided
    if (application_id) {
      const application = await Application.findById(application_id);
      if (!application || application.applicant_id.toString() !== applicant._id.toString()) {
        // Clean up uploaded file
        cleanupFile(req.file.path);
        return res.status(400).json({
          success: false,
          message: 'Invalid application ID'
        });
      }
    }

    // Create document record
    const document = await Document.create({
      applicant_id: applicant._id,
      application_id: application_id || null,
      type,
      filename: req.file.filename,
      original_filename: req.file.originalname,
      filepath: req.file.path,
      file_size: req.file.size,
      mime_type: req.file.mimetype,
      description: description || ''
    });

    res.status(201).json({
      success: true,
      message: 'Document uploaded successfully',
      data: { document }
    });

  } catch (error) {
    // Clean up uploaded file on error
    if (req.file) {
      cleanupFile(req.file.path);
    }
    next(error);
  }
});

// @desc    Upload multiple documents
// @route   POST /api/documents/upload-multiple
// @access  Private (Applicant only)
router.post('/upload-multiple', authenticate, authorize('applicant'), uploadMultiple('documents', 10), async (req, res, next) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No files uploaded'
      });
    }

    // Get applicant profile
    const applicant = await Applicant.findOne({ user_id: req.user.id });

    if (!applicant) {
      // Clean up uploaded files
      req.files.forEach(file => cleanupFile(file.path));
      return res.status(404).json({
        success: false,
        message: 'Applicant profile not found'
      });
    }

    const { application_id, documents } = req.body;
    let documentTypes = [];

    try {
      documentTypes = JSON.parse(documents || '[]');
    } catch (error) {
      // Clean up uploaded files
      req.files.forEach(file => cleanupFile(file.path));
      return res.status(400).json({
        success: false,
        message: 'Invalid documents format'
      });
    }

    if (documentTypes.length !== req.files.length) {
      // Clean up uploaded files
      req.files.forEach(file => cleanupFile(file.path));
      return res.status(400).json({
        success: false,
        message: 'Document types must match number of files'
      });
    }

    // Validate application_id if provided
    if (application_id) {
      const application = await Application.findById(application_id);
      if (!application || application.applicant_id.toString() !== applicant._id.toString()) {
        // Clean up uploaded files
        req.files.forEach(file => cleanupFile(file.path));
        return res.status(400).json({
          success: false,
          message: 'Invalid application ID'
        });
      }
    }

    // Create document records
    const createdDocuments = [];
    for (let i = 0; i < req.files.length; i++) {
      const file = req.files[i];
      const docType = documentTypes[i];

      const document = await Document.create({
        applicant_id: applicant._id,
        application_id: application_id || null,
        type: docType.type,
        filename: file.filename,
        original_filename: file.originalname,
        filepath: file.path,
        file_size: file.size,
        mime_type: file.mimetype,
        description: docType.description || ''
      });

      createdDocuments.push(document);
    }

    res.status(201).json({
      success: true,
      message: `${createdDocuments.length} documents uploaded successfully`,
      data: { documents: createdDocuments }
    });

  } catch (error) {
    // Clean up uploaded files on error
    if (req.files) {
      req.files.forEach(file => cleanupFile(file.path));
    }
    next(error);
  }
});

// @desc    Download document
// @route   GET /api/documents/:id/download
// @access  Private
router.get('/:id/download', authenticate, paramValidation.mongoId, async (req, res, next) => {
  try {
    const document = await Document.findById(req.params.id)
      .populate('applicant_id');

    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      });
    }

    // Check if user can access this document
    if (req.user.role !== 'admin' && req.user.role !== 'staff' && 
        req.user.id.toString() !== document.applicant_id.user_id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Check if file exists
    if (!fs.existsSync(document.filepath)) {
      return res.status(404).json({
        success: false,
        message: 'File not found on server'
      });
    }

    // Increment download count
    await document.incrementDownloadCount();

    // Set appropriate headers
    res.setHeader('Content-Disposition', `attachment; filename="${document.original_filename}"`);
    res.setHeader('Content-Type', document.mime_type);
    res.setHeader('Content-Length', document.file_size);

    // Stream the file
    const fileStream = fs.createReadStream(document.filepath);
    fileStream.pipe(res);

    fileStream.on('error', (error) => {
      console.error('File stream error:', error);
      res.status(500).json({
        success: false,
        message: 'Error downloading file'
      });
    });

  } catch (error) {
    next(error);
  }
});

// @desc    Update document
// @route   PUT /api/documents/:id
// @access  Private
router.put('/:id', authenticate, paramValidation.mongoId, async (req, res, next) => {
  try {
    const document = await Document.findById(req.params.id)
      .populate('applicant_id');

    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      });
    }

    // Check if user can update this document
    if (req.user.role !== 'admin' && req.user.role !== 'staff' && 
        req.user.id.toString() !== document.applicant_id.user_id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Update document
    const updatedDocument = await Document.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('applicant_id')
     .populate('application_id')
     .populate('verified_by', 'first_name father_name email');

    res.json({
      success: true,
      message: 'Document updated successfully',
      data: { document: updatedDocument }
    });

  } catch (error) {
    next(error);
  }
});

// @desc    Delete document
// @route   DELETE /api/documents/:id
// @access  Private
router.delete('/:id', authenticate, paramValidation.mongoId, async (req, res, next) => {
  try {
    const document = await Document.findById(req.params.id)
      .populate('applicant_id');

    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      });
    }

    // Check if user can delete this document
    if (req.user.role !== 'admin' && req.user.role !== 'staff' && 
        req.user.id.toString() !== document.applicant_id.user_id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Delete file from filesystem
    if (fs.existsSync(document.filepath)) {
      fs.unlinkSync(document.filepath);
    }

    // Delete document record
    await Document.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Document deleted successfully'
    });

  } catch (error) {
    next(error);
  }
});

// @desc    Verify document
// @route   PUT /api/documents/:id/verify
// @access  Private (Admin/Staff only)
router.put('/:id/verify', authenticate, staffOrAdmin, paramValidation.mongoId, async (req, res, next) => {
  try {
    const { notes = '' } = req.body;

    const document = await Document.findById(req.params.id);

    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      });
    }

    // Verify document
    await document.verify(req.user.id, notes);

    res.json({
      success: true,
      message: 'Document verified successfully',
      data: { document }
    });

  } catch (error) {
    next(error);
  }
});

// @desc    Unverify document
// @route   PUT /api/documents/:id/unverify
// @access  Private (Admin/Staff only)
router.put('/:id/unverify', authenticate, staffOrAdmin, paramValidation.mongoId, async (req, res, next) => {
  try {
    const document = await Document.findById(req.params.id);

    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      });
    }

    // Unverify document
    await document.unverify();

    res.json({
      success: true,
      message: 'Document unverified successfully',
      data: { document }
    });

  } catch (error) {
    next(error);
  }
});

// @desc    Get document statistics
// @route   GET /api/documents/stats/overview
// @access  Private (Admin/Staff only)
router.get('/stats/overview', authenticate, staffOrAdmin, async (req, res, next) => {
  try {
    const stats = await Document.getDocumentStats();
    const storageStats = await Document.getStorageUsageByApplicant();

    const totalDocuments = await Document.countDocuments();
    const verifiedDocuments = await Document.countDocuments({ is_verified: true });
    const totalSize = await Document.aggregate([
      {
        $group: {
          _id: null,
          total_size: { $sum: '$file_size' }
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        overview: {
          total_documents: totalDocuments,
          verified_documents: verifiedDocuments,
          verification_rate: totalDocuments > 0 ? Math.round((verifiedDocuments / totalDocuments) * 100) : 0,
          total_size: totalSize[0]?.total_size || 0
        },
        ...stats,
        storage_usage: storageStats
      }
    });

  } catch (error) {
    next(error);
  }
});

module.exports = router;


