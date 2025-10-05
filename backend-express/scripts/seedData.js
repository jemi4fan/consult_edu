const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Import models
const User = require('../models/User');
const Applicant = require('../models/Applicant');
const Staff = require('../models/Staff');
const Job = require('../models/Job');
const Scholarship = require('../models/Scholarship');
const Ad = require('../models/Ad');

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/scholarship_job_platform');
    console.log('Connected to MongoDB');
  } catch (error) {
    console.error('Database connection error:', error);
    process.exit(1);
  }
};

// Seed data
const seedData = async () => {
  try {
    console.log('Starting data seeding...');

    // Clear existing data
    await User.deleteMany({});
    await Applicant.deleteMany({});
    await Staff.deleteMany({});
    await Job.deleteMany({});
    await Scholarship.deleteMany({});
    await Ad.deleteMany({});

    console.log('Cleared existing data');

    // Create Admin User
    const adminUser = await User.create({
      role: 'admin',
      first_name: 'Admin',
      father_name: 'User',
      grandfather_name: 'System',
      username: 'admin',
      email: 'admin@example.com',
      password: 'admin123',
      phone: '+1234567890',
      national_id: 'ADMIN001',
      address: 'System Address',
      is_active: true,
      is_verified: true
    });

    console.log('Created admin user');

    // Create Staff User
    const staffUser = await User.create({
      role: 'staff',
      first_name: 'John',
      father_name: 'Staff',
      grandfather_name: 'User',
      username: 'staff',
      email: 'staff@example.com',
      password: 'staff123',
      phone: '+1234567891',
      national_id: 'STAFF001',
      address: 'Staff Address',
      is_active: true,
      is_verified: true
    });

    console.log('Created staff user');

    // Create Staff Profile
    await Staff.create({
      user_id: staffUser._id,
      employee_id: 'STF2024001',
      department: 'Admissions',
      position: 'Admissions Officer',
      hire_date: new Date('2024-01-01'),
      employment_type: 'Full-time',
      salary: {
        amount: 50000,
        currency: 'USD',
        payment_frequency: 'Monthly'
      },
      permissions: {
        can_view_applications: true,
        can_edit_applications: true,
        can_view_users: true,
        can_manage_documents: true,
        can_send_messages: true
      }
    });

    console.log('Created staff profile');

    // Create Applicant Users
    const applicantUsers = [];
    for (let i = 1; i <= 5; i++) {
      const applicantUser = await User.create({
        role: 'applicant',
        first_name: `Applicant${i}`,
        father_name: 'Test',
        grandfather_name: 'User',
        username: `applicant${i}`,
        email: `applicant${i}@example.com`,
        password: 'applicant123',
        phone: `+123456789${i}`,
        national_id: `APP${i.toString().padStart(3, '0')}`,
        address: `Address ${i}`,
        is_active: true,
        is_verified: true
      });

      applicantUsers.push(applicantUser);

      // Create Applicant Profile
      await Applicant.create({
        user_id: applicantUser.id,
        dob: new Date(1995, i - 1, i * 5),
        gender: i % 2 === 0 ? 'Female' : 'Male',
        nationality: 'Ethiopian',
        profile_completion: 60 + (i * 5),
        bio: `This is a test bio for applicant ${i}`,
        skills: [`Skill${i}A`, `Skill${i}B`, `Skill${i}C`],
        languages: [
          { language: 'English', proficiency: 'Advanced' },
          { language: 'Amharic', proficiency: 'Native' }
        ]
      });
    }

    console.log('Created applicant users and profiles');

    // Create Sample Jobs
    const jobs = [
      {
        name: 'Software Engineer',
        description: 'We are looking for a talented software engineer to join our development team.',
        requirements: 'Bachelor\'s degree in Computer Science, 2+ years experience',
        responsibilities: 'Develop and maintain software applications, collaborate with team',
        qualifications: 'Proficiency in JavaScript, React, Node.js',
        benefits: 'Health insurance, flexible hours, remote work options',
        country: 'Ethiopia',
        city: 'Addis Ababa',
        positions: [{
          title: 'Software Engineer',
          department: 'Engineering',
          level: 'Mid',
          employment_type: 'Full-time',
          salary_range: { min: 50000, max: 70000, currency: 'USD' },
          vacancies: 3
        }],
        application_fee: 25.00,
        status: 'Active',
        deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        company: {
          name: 'Tech Solutions Inc',
          website: 'https://techsolutions.com',
          description: 'Leading technology company'
        },
        contact_info: {
          email: 'hr@techsolutions.com',
          phone: '+1234567890'
        },
        tags: ['technology', 'software', 'engineering'],
        created_by: adminUser.id
      },
      {
        name: 'Marketing Manager',
        description: 'Seeking an experienced marketing manager to lead our marketing initiatives.',
        requirements: 'Bachelor\'s degree in Marketing, 3+ years experience',
        responsibilities: 'Develop marketing strategies, manage campaigns',
        qualifications: 'Digital marketing experience, analytical skills',
        benefits: 'Competitive salary, growth opportunities',
        country: 'Ethiopia',
        city: 'Addis Ababa',
        positions: [{
          title: 'Marketing Manager',
          department: 'Marketing',
          level: 'Senior',
          employment_type: 'Full-time',
          salary_range: { min: 45000, max: 60000, currency: 'USD' },
          vacancies: 1
        }],
        application_fee: 20.00,
        status: 'Active',
        deadline: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
        company: {
          name: 'Marketing Pro Ltd',
          website: 'https://marketingpro.com',
          description: 'Creative marketing agency'
        },
        contact_info: {
          email: 'careers@marketingpro.com',
          phone: '+1234567891'
        },
        tags: ['marketing', 'management', 'strategy'],
        created_by: adminUser.id
      }
    ];

    for (const jobData of jobs) {
      await Job.create(jobData);
    }

    console.log('Created sample jobs');

    // Create Sample Scholarships
    const scholarships = [
      {
        name: 'Ethiopian Excellence Scholarship',
        program: ['UG', 'MSC'],
        country: 'United States',
        university_name: 'Harvard University',
        university_website: 'https://harvard.edu',
        university_description: 'World-renowned research university',
        intake_date: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000),
        deadline: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
        major: 'Computer Science',
        description: 'Full scholarship for Ethiopian students pursuing undergraduate or master\'s degrees in Computer Science.',
        requirements: 'High school diploma, excellent academic record, English proficiency',
        benefits: 'Full tuition coverage, living expenses, health insurance',
        coverage: {
          tuition: true,
          living_expenses: true,
          travel: true,
          health_insurance: true
        },
        financial_support: {
          amount: 50000,
          currency: 'USD',
          duration_months: 24,
          renewable: true
        },
        application_fee: 50.00,
        status: 'Active',
        eligibility_criteria: {
          min_age: 18,
          max_age: 25,
          nationality: ['Ethiopian'],
          gpa_requirement: 3.5,
          language_requirements: {
            english: {
              required: true,
              test_type: 'IELTS',
              min_score: 6.5
            }
          }
        },
        tags: ['computer-science', 'full-scholarship', 'harvard'],
        created_by: adminUser.id
      },
      {
        name: 'African Leadership Scholarship',
        program: ['MSC', 'PhD'],
        country: 'United Kingdom',
        university_name: 'University of Oxford',
        university_website: 'https://oxford.ac.uk',
        university_description: 'One of the oldest universities in the world',
        intake_date: new Date(Date.now() + 200 * 24 * 60 * 60 * 1000),
        deadline: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
        major: 'Business Administration',
        description: 'Scholarship for African students to pursue graduate studies in Business Administration.',
        requirements: 'Bachelor\'s degree, leadership experience, community involvement',
        benefits: 'Partial tuition coverage, mentorship program',
        coverage: {
          tuition: true,
          living_expenses: false,
          travel: false,
          health_insurance: false
        },
        financial_support: {
          amount: 25000,
          currency: 'GBP',
          duration_months: 12,
          renewable: false
        },
        application_fee: 75.00,
        status: 'Active',
        eligibility_criteria: {
          min_age: 22,
          max_age: 35,
          nationality: ['Ethiopian', 'Kenyan', 'Ghanaian'],
          gpa_requirement: 3.0,
          language_requirements: {
            english: {
              required: true,
              test_type: 'IELTS',
              min_score: 6.0
            }
          }
        },
        tags: ['business', 'leadership', 'oxford'],
        created_by: adminUser.id
      }
    ];

    for (const scholarshipData of scholarships) {
      await Scholarship.create(scholarshipData);
    }

    console.log('Created sample scholarships');

    // Create Sample Ads
    const ads = [
      {
        title: 'Welcome to Our Platform',
        description: 'Welcome to the Scholarship and Job Application Platform. We are here to help you find the best opportunities.',
        content: 'Our platform connects students and job seekers with the best opportunities worldwide. Start your journey today!',
        type: 'Announcement',
        category: 'General',
        priority: 'High',
        target_audience: ['All'],
        start_date: new Date(),
        end_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        is_active: true,
        is_featured: true,
        is_pinned: true,
        approval_status: 'Approved',
        created_by: adminUser.id,
        approved_by: adminUser.id
      },
      {
        title: 'New Job Opportunities Available',
        description: 'Check out our latest job postings from top companies.',
        content: 'We have added new job opportunities from leading companies. Don\'t miss out on these amazing positions!',
        type: 'News',
        category: 'Job',
        priority: 'Normal',
        target_audience: ['Applicants'],
        start_date: new Date(),
        end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        is_active: true,
        is_featured: false,
        is_pinned: false,
        approval_status: 'Approved',
        created_by: staffUser.id,
        approved_by: adminUser.id
      },
      {
        title: 'Scholarship Application Deadline Reminder',
        description: 'Don\'t forget to submit your scholarship applications before the deadline.',
        content: 'Several scholarship applications are closing soon. Make sure to submit your applications on time.',
        type: 'Update',
        category: 'Scholarship',
        priority: 'Urgent',
        target_audience: ['Applicants'],
        start_date: new Date(),
        end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        is_active: true,
        is_featured: true,
        is_pinned: false,
        approval_status: 'Approved',
        created_by: adminUser.id,
        approved_by: adminUser.id
      }
    ];

    for (const adData of ads) {
      await Ad.create(adData);
    }

    console.log('Created sample ads');

    console.log('Data seeding completed successfully!');
    console.log('\nDemo Accounts Created:');
    console.log('Admin: admin@example.com / admin123');
    console.log('Staff: staff@example.com / staff123');
    console.log('Applicant1: applicant1@example.com / applicant123');
    console.log('Applicant2: applicant2@example.com / applicant123');
    console.log('Applicant3: applicant3@example.com / applicant123');
    console.log('Applicant4: applicant4@example.com / applicant123');
    console.log('Applicant5: applicant5@example.com / applicant123');

  } catch (error) {
    console.error('Error seeding data:', error);
  } finally {
    mongoose.connection.close();
    console.log('Database connection closed');
    process.exit(0);
  }
};

// Run seeding
connectDB().then(() => {
  seedData();
});


