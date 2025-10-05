const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const User = require('../models/User');
const Job = require('../models/Job');
const Scholarship = require('../models/Scholarship');
const Application = require('../models/Application');
const Applicant = require('../models/Applicant');
const Document = require('../models/Document');
const Ad = require('../models/Ad');
const IdCounter = require('../models/IdCounter');

const connectDB = async () => {
  try {
    await mongoose.connect(
      process.env.MONGODB_URI || 'mongodb://localhost:27017/scholarship_job_platform',
      {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      }
    );
    console.log('MongoDB Connected');
  } catch (error) {
    console.error('Database connection error:', error);
    process.exit(1);
  }
};

const migrateToIntegerIds = async () => {
  try {
    console.log('Starting migration to integer IDs...');

    // Create ObjectId to integer ID mapping
    const userIdMap = new Map();
    const jobIdMap = new Map();
    const scholarshipIdMap = new Map();
    const applicantIdMap = new Map();
    const applicationIdMap = new Map();
    const documentIdMap = new Map();
    const adIdMap = new Map();

    // Initialize counters
    await IdCounter.findOneAndUpdate(
      { _id: 'user_id' },
      { sequence_value: 0 },
      { upsert: true }
    );
    await IdCounter.findOneAndUpdate(
      { _id: 'job_id' },
      { sequence_value: 0 },
      { upsert: true }
    );
    await IdCounter.findOneAndUpdate(
      { _id: 'scholarship_id' },
      { sequence_value: 0 },
      { upsert: true }
    );
    await IdCounter.findOneAndUpdate(
      { _id: 'application_id' },
      { sequence_value: 0 },
      { upsert: true }
    );
    await IdCounter.findOneAndUpdate(
      { _id: 'applicant_id' },
      { sequence_value: 0 },
      { upsert: true }
    );
    await IdCounter.findOneAndUpdate(
      { _id: 'document_id' },
      { sequence_value: 0 },
      { upsert: true }
    );
    await IdCounter.findOneAndUpdate(
      { _id: 'ad_id' },
      { sequence_value: 0 },
      { upsert: true }
    );

    // Step 1: Migrate Users and create mapping
    console.log('Migrating Users...');
    const users = await User.find({ id: { $exists: false } });
    for (const user of users) {
      const counter = await IdCounter.getNextSequence('user_id');
      user.id = counter.sequence_value;
      userIdMap.set(user._id.toString(), counter.sequence_value);
      await user.save();
    }
    console.log(`Migrated ${users.length} users`);

    // Step 2: Migrate Jobs and create mapping
    console.log('Migrating Jobs...');
    const jobs = await Job.find({ id: { $exists: false } });
    for (const job of jobs) {
      const counter = await IdCounter.getNextSequence('job_id');
      
      // Update ObjectId references to integer IDs first
      let createdById = job.created_by;
      let lastModifiedById = job.last_modified_by;
      
      if (job.created_by && userIdMap.has(job.created_by.toString())) {
        createdById = userIdMap.get(job.created_by.toString());
      }
      if (job.last_modified_by && userIdMap.has(job.last_modified_by.toString())) {
        lastModifiedById = userIdMap.get(job.last_modified_by.toString());
      }
      
      // Update directly in database to avoid validation
      await Job.updateOne(
        { _id: job._id },
        {
          $set: {
            id: counter.sequence_value,
            created_by: createdById,
            last_modified_by: lastModifiedById
          }
        }
      );
      
      jobIdMap.set(job._id.toString(), counter.sequence_value);
    }
    console.log(`Migrated ${jobs.length} jobs`);

    // Step 3: Migrate Scholarships and create mapping
    console.log('Migrating Scholarships...');
    const scholarships = await Scholarship.find({ id: { $exists: false } });
    for (const scholarship of scholarships) {
      const counter = await IdCounter.getNextSequence('scholarship_id');
      
      // Update ObjectId references to integer IDs first
      let createdById = scholarship.created_by;
      let lastModifiedById = scholarship.last_modified_by;
      
      if (scholarship.created_by && userIdMap.has(scholarship.created_by.toString())) {
        createdById = userIdMap.get(scholarship.created_by.toString());
      }
      if (scholarship.last_modified_by && userIdMap.has(scholarship.last_modified_by.toString())) {
        lastModifiedById = userIdMap.get(scholarship.last_modified_by.toString());
      }
      
      // Update directly in database to avoid validation
      await Scholarship.updateOne(
        { _id: scholarship._id },
        {
          $set: {
            id: counter.sequence_value,
            created_by: createdById,
            last_modified_by: lastModifiedById
          }
        }
      );
      
      scholarshipIdMap.set(scholarship._id.toString(), counter.sequence_value);
    }
    console.log(`Migrated ${scholarships.length} scholarships`);

    // Step 4: Migrate Applicants and create mapping
    console.log('Migrating Applicants...');
    const applicants = await Applicant.find({ id: { $exists: false } });
    for (const applicant of applicants) {
      const counter = await IdCounter.getNextSequence('applicant_id');
      
      // Update ObjectId references to integer IDs first
      let userId = applicant.user_id;
      if (applicant.user_id && userIdMap.has(applicant.user_id.toString())) {
        userId = userIdMap.get(applicant.user_id.toString());
      }
      
      // Update directly in database to avoid validation
      await Applicant.updateOne(
        { _id: applicant._id },
        {
          $set: {
            id: counter.sequence_value,
            user_id: userId
          }
        }
      );
      
      applicantIdMap.set(applicant._id.toString(), counter.sequence_value);
    }
    console.log(`Migrated ${applicants.length} applicants`);

    // Step 5: Migrate Applications and create mapping
    console.log('Migrating Applications...');
    const applications = await Application.find({ id: { $exists: false } });
    for (const application of applications) {
      const counter = await IdCounter.getNextSequence('application_id');
      
      // Update ObjectId references to integer IDs
      let applicantId = application.applicant_id;
      let jobId = application.job_id;
      let scholarshipId = application.scholarship_id;
      
      if (application.applicant_id && applicantIdMap.has(application.applicant_id.toString())) {
        applicantId = applicantIdMap.get(application.applicant_id.toString());
      }
      if (application.job_id && jobIdMap.has(application.job_id.toString())) {
        jobId = jobIdMap.get(application.job_id.toString());
      }
      if (application.scholarship_id && scholarshipIdMap.has(application.scholarship_id.toString())) {
        scholarshipId = scholarshipIdMap.get(application.scholarship_id.toString());
      }
      
      // Update review notes
      let reviewNotes = application.review_notes;
      if (reviewNotes && reviewNotes.length > 0) {
        reviewNotes = reviewNotes.map(note => {
          if (note.reviewer_id && userIdMap.has(note.reviewer_id.toString())) {
            return { ...note, reviewer_id: userIdMap.get(note.reviewer_id.toString()) };
          }
          return note;
        });
      }
      
      // Update directly in database to avoid validation
      await Application.updateOne(
        { _id: application._id },
        {
          $set: {
            id: counter.sequence_value,
            applicant_id: applicantId,
            job_id: jobId,
            scholarship_id: scholarshipId,
            review_notes: reviewNotes
          }
        }
      );
      
      applicationIdMap.set(application._id.toString(), counter.sequence_value);
    }
    console.log(`Migrated ${applications.length} applications`);

    // Step 6: Migrate Documents and create mapping
    console.log('Migrating Documents...');
    const documents = await Document.find({ id: { $exists: false } });
    for (const document of documents) {
      const counter = await IdCounter.getNextSequence('document_id');
      
      // Update ObjectId references to integer IDs
      let applicantId = document.applicant_id;
      let applicationId = document.application_id;
      let verifiedById = document.verified_by;
      
      if (document.applicant_id && applicantIdMap.has(document.applicant_id.toString())) {
        applicantId = applicantIdMap.get(document.applicant_id.toString());
      }
      if (document.application_id && applicationIdMap.has(document.application_id.toString())) {
        applicationId = applicationIdMap.get(document.application_id.toString());
      }
      if (document.verified_by && userIdMap.has(document.verified_by.toString())) {
        verifiedById = userIdMap.get(document.verified_by.toString());
      }
      
      // Update directly in database to avoid validation
      await Document.updateOne(
        { _id: document._id },
        {
          $set: {
            id: counter.sequence_value,
            applicant_id: applicantId,
            application_id: applicationId,
            verified_by: verifiedById
          }
        }
      );
      
      documentIdMap.set(document._id.toString(), counter.sequence_value);
    }
    console.log(`Migrated ${documents.length} documents`);

    // Step 7: Migrate Ads and create mapping
    console.log('Migrating Ads...');
    const ads = await Ad.find({ id: { $exists: false } });
    for (const ad of ads) {
      const counter = await IdCounter.getNextSequence('ad_id');
      
      // Update ObjectId references to integer IDs
      let createdById = ad.created_by;
      let lastModifiedById = ad.last_modified_by;
      let approvedById = ad.approved_by;
      
      if (ad.created_by && userIdMap.has(ad.created_by.toString())) {
        createdById = userIdMap.get(ad.created_by.toString());
      }
      if (ad.last_modified_by && userIdMap.has(ad.last_modified_by.toString())) {
        lastModifiedById = userIdMap.get(ad.last_modified_by.toString());
      }
      if (ad.approved_by && userIdMap.has(ad.approved_by.toString())) {
        approvedById = userIdMap.get(ad.approved_by.toString());
      }
      
      // Update directly in database to avoid validation
      await Ad.updateOne(
        { _id: ad._id },
        {
          $set: {
            id: counter.sequence_value,
            created_by: createdById,
            last_modified_by: lastModifiedById,
            approved_by: approvedById
          }
        }
      );
      
      adIdMap.set(ad._id.toString(), counter.sequence_value);
    }
    console.log(`Migrated ${ads.length} ads`);

    console.log('Migration completed successfully!');

  } catch (error) {
    console.error('Migration error:', error);
  }
};

const main = async () => {
  await connectDB();
  await migrateToIntegerIds();
  process.exit(0);
};

main();
