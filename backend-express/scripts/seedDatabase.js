const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');

// Load environment variables
dotenv.config({ path: './.env' });

// Import models
const User = require('../models/User');
const Applicant = require('../models/Applicant');
const Job = require('../models/Job');
const Scholarship = require('../models/Scholarship');
const Ad = require('../models/Ad');
const IdCounter = require('../models/IdCounter');

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB Connected for seeding...');
  } catch (err) {
    console.error(`MongoDB connection error: ${err.message}`);
    process.exit(1);
  }
};

const seedDatabase = async () => {
  try {
    console.log('🌱 Starting database seeding...');

    // Initialize ID counters
    console.log('📊 Initializing ID counters...');
    await IdCounter.create([
      { _id: 'user_id', sequence_value: 0 },
      { _id: 'applicant_id', sequence_value: 0 },
      { _id: 'job_id', sequence_value: 0 },
      { _id: 'scholarship_id', sequence_value: 0 },
      { _id: 'ad_id', sequence_value: 0 },
      { _id: 'application_id', sequence_value: 0 },
      { _id: 'document_id', sequence_value: 0 }
    ]);

    // Create users
    console.log('👥 Creating users...');
    const users = await User.create([
      {
        first_name: 'Admin',
        father_name: 'User',
        grandfather_name: 'System',
        username: 'admin',
        email: 'admin@example.com',
        password: 'password123',
        phone: '+1234567890',
        national_id: 'ADMIN001',
        role: 'admin',
        is_verified: true,
        is_active: true
      },
      {
        first_name: 'John',
        father_name: 'Staff',
        grandfather_name: 'Manager',
        username: 'staff',
        email: 'staff@example.com',
        password: 'password123',
        phone: '+1234567891',
        national_id: 'STAFF001',
        role: 'staff',
        is_verified: true,
        is_active: true
      },
      {
        first_name: 'Alice',
        father_name: 'Johnson',
        grandfather_name: 'Smith',
        username: 'alice',
        email: 'alice@example.com',
        password: 'password123',
        phone: '+1234567892',
        national_id: 'APPLICANT001',
        role: 'applicant',
        is_verified: true,
        is_active: true
      },
      {
        first_name: 'Bob',
        father_name: 'Wilson',
        grandfather_name: 'Brown',
        username: 'bob',
        email: 'bob@example.com',
        password: 'password123',
        phone: '+1234567893',
        national_id: 'APPLICANT002',
        role: 'applicant',
        is_verified: true,
        is_active: true
      },
      {
        first_name: 'Carol',
        father_name: 'Davis',
        grandfather_name: 'Miller',
        username: 'carol',
        email: 'carol@example.com',
        password: 'password123',
        phone: '+1234567894',
        national_id: 'APPLICANT003',
        role: 'applicant',
        is_verified: true,
        is_active: true
      }
    ]);

    console.log(`✅ Created ${users.length} users`);

    // Create applicants
    console.log('🎓 Creating applicants...');
    const applicants = await Applicant.create([
      {
        user_id: users[2].id, // Alice
        dob: new Date('1995-05-15'),
        gender: 'Female',
        nationality: 'American',
        bio: 'Passionate computer science student with interest in web development.',
        skills: ['JavaScript', 'React', 'Node.js', 'Python'],
        languages: [
          { language: 'English', proficiency: 'Native' },
          { language: 'Spanish', proficiency: 'Intermediate' }
        ],
        work_experience: [
          {
            company: 'Tech Corp',
            position: 'Junior Developer',
            start_date: new Date('2023-06-01'),
            end_date: new Date('2024-05-31'),
            current: false,
            description: 'Worked on frontend development using React and JavaScript'
          }
        ]
      },
      {
        user_id: users[3].id, // Bob
        dob: new Date('1998-08-22'),
        gender: 'Male',
        nationality: 'Canadian',
        bio: 'Recent computer science graduate looking for opportunities in software engineering.',
        skills: ['Java', 'Spring Boot', 'MySQL', 'Git'],
        languages: [
          { language: 'English', proficiency: 'Native' },
          { language: 'French', proficiency: 'Advanced' }
        ]
      },
      {
        user_id: users[4].id, // Carol
        dob: new Date('1996-12-10'),
        gender: 'Female',
        nationality: 'British',
        bio: 'Data science enthusiast with strong analytical skills.',
        skills: ['Python', 'R', 'Machine Learning', 'SQL'],
        languages: [
          { language: 'English', proficiency: 'Native' },
          { language: 'German', proficiency: 'Beginner' }
        ]
      }
    ]);

    console.log(`✅ Created ${applicants.length} applicants`);

    // Create jobs
    console.log('💼 Creating jobs...');
    const jobs = await Job.create([
      {
        name: 'Senior Software Engineer',
        description: 'We are looking for an experienced software engineer to join our growing team. You will be responsible for designing and implementing scalable web applications.',
        requirements: 'Bachelor degree in Computer Science, 5+ years experience with JavaScript/Node.js, experience with React, strong problem-solving skills.',
        responsibilities: 'Design and develop web applications, collaborate with cross-functional teams, mentor junior developers, participate in code reviews.',
        benefits: 'Competitive salary, health insurance, flexible working hours, professional development budget.',
        country: 'United States',
        city: 'San Francisco',
        application_fee: 0,
        deadline: new Date('2025-12-31'),
        company: {
          name: 'Tech Innovations Inc',
          website: 'https://techinnovations.com',
          description: 'Leading technology company specializing in web solutions'
        },
        positions: [
          {
            title: 'Senior Software Engineer',
            department: 'Engineering',
            level: 'Senior',
            employment_type: 'Full-time',
            vacancies: 2
          }
        ],
        tags: ['javascript', 'react', 'nodejs', 'senior'],
        created_by: users[0].id, // Admin
        last_modified_by: users[0].id
      },
      {
        name: 'Data Scientist',
        description: 'Join our data science team to work on exciting machine learning projects. You will analyze large datasets and build predictive models.',
        requirements: 'Master degree in Data Science or related field, 3+ years experience with Python/R, experience with machine learning frameworks, SQL knowledge.',
        responsibilities: 'Analyze data to identify trends, build predictive models, collaborate with business stakeholders, present insights to management.',
        benefits: 'Competitive salary, comprehensive benefits package, remote work options, learning opportunities.',
        country: 'Canada',
        city: 'Toronto',
        application_fee: 50,
        deadline: new Date('2025-11-30'),
        company: {
          name: 'DataCorp Solutions',
          website: 'https://datacorp.com',
          description: 'Data analytics and machine learning company'
        },
        positions: [
          {
            title: 'Data Scientist',
            department: 'Analytics',
            level: 'Mid',
            employment_type: 'Full-time',
            vacancies: 1
          }
        ],
        tags: ['python', 'machine-learning', 'data-science', 'analytics'],
        created_by: users[1].id, // Staff
        last_modified_by: users[1].id
      },
      {
        name: 'Frontend Developer',
        description: 'We are seeking a talented frontend developer to create beautiful and responsive user interfaces for our web applications.',
        requirements: 'Bachelor degree in Computer Science or related field, 2+ years experience with React/Vue.js, HTML/CSS expertise, responsive design knowledge.',
        responsibilities: 'Develop user interfaces, optimize application performance, collaborate with UX designers, ensure cross-browser compatibility.',
        benefits: 'Competitive salary, flexible schedule, modern tech stack, team events.',
        country: 'United Kingdom',
        city: 'London',
        application_fee: 25,
        deadline: new Date('2025-10-31'),
        company: {
          name: 'WebCraft Studios',
          website: 'https://webcraft.com',
          description: 'Creative web development agency'
        },
        positions: [
          {
            title: 'Frontend Developer',
            department: 'Development',
            level: 'Mid',
            employment_type: 'Full-time',
            vacancies: 3
          }
        ],
        tags: ['frontend', 'react', 'javascript', 'css'],
        created_by: users[1].id, // Staff
        last_modified_by: users[1].id
      }
    ]);

    console.log(`✅ Created ${jobs.length} jobs`);

    // Create scholarships
    console.log('🎓 Creating scholarships...');
    const scholarships = await Scholarship.create([
      {
        name: 'Computer Science Excellence Scholarship',
        description: 'A prestigious scholarship for outstanding computer science students with exceptional academic performance and leadership potential.',
        program: ['UG', 'MSC', 'PhD'],
        country: 'United States',
        university_name: 'Stanford University',
        major: 'Computer Science',
        application_fee: 100,
        deadline: new Date('2025-08-15'),
        intake_date: new Date('2025-09-01'),
        requirements: 'Minimum GPA of 3.8, demonstrated leadership skills, community service experience, strong recommendation letters.',
        benefits: 'Full tuition coverage, living allowance, research opportunities, mentorship program.',
        coverage: {
          tuition: true,
          living_expenses: true,
          travel: false,
          health_insurance: true
        },
        financial_support: {
          amount: 75000,
          currency: 'USD',
          renewable: true
        },
        eligibility_criteria: {
          min_age: 18,
          max_age: 25,
          nationality: ['American', 'International'],
          gpa_requirement: 3.8
        },
        tags: ['computer-science', 'full-tuition', 'research'],
        created_by: users[0].id, // Admin
        last_modified_by: users[0].id
      },
      {
        name: 'Data Science Innovation Grant',
        description: 'Supporting innovative research in data science and artificial intelligence with focus on real-world applications.',
        program: ['MSC', 'PhD'],
        country: 'Canada',
        university_name: 'University of Toronto',
        major: 'Data Science',
        application_fee: 75,
        deadline: new Date('2025-07-30'),
        intake_date: new Date('2025-09-01'),
        requirements: 'Strong background in mathematics and programming, research proposal, previous research experience preferred.',
        benefits: 'Tuition coverage, research funding, conference attendance support, industry partnerships.',
        coverage: {
          tuition: true,
          living_expenses: false,
          travel: true,
          health_insurance: false
        },
        financial_support: {
          amount: 45000,
          currency: 'CAD',
          renewable: true
        },
        tags: ['data-science', 'research', 'ai'],
        created_by: users[1].id, // Staff
        last_modified_by: users[1].id
      }
    ]);

    console.log(`✅ Created ${scholarships.length} scholarships`);

    // Create ads
    console.log('📢 Creating ads...');
    const ads = await Ad.create([
      {
        title: 'Welcome to Our Platform',
        description: 'Discover amazing job opportunities and scholarships from top companies and universities worldwide.',
        content: 'Our platform connects talented individuals with the best opportunities in education and career development. Join thousands of successful applicants who found their dream jobs and scholarships through our platform.',
        type: 'Announcement',
        category: 'General',
        target_audience: ['All'],
        priority: 'High',
        start_date: new Date('2025-01-01'),
        end_date: new Date('2025-12-31'),
        is_active: true,
        is_featured: true,
        tags: ['welcome', 'platform', 'opportunities'],
        created_by: users[0].id, // Admin
        last_modified_by: users[0].id,
        approved_by: users[0].id,
        approval_status: 'Approved'
      },
      {
        title: 'New Features Coming Soon',
        description: 'We are working on exciting new features to enhance your experience on our platform.',
        content: 'Stay tuned for upcoming features including advanced search filters, application tracking, and personalized recommendations.',
        type: 'Update',
        category: 'System',
        target_audience: ['All'],
        priority: 'Normal',
        start_date: new Date('2025-01-01'),
        end_date: new Date('2025-06-30'),
        is_active: true,
        is_featured: false,
        tags: ['features', 'updates', 'coming-soon'],
        created_by: users[1].id, // Staff
        last_modified_by: users[1].id,
        approved_by: users[0].id,
        approval_status: 'Approved'
      },
      {
        title: 'Success Story: From Application to Dream Job',
        description: 'Read how Sarah Johnson landed her dream job as a software engineer at a top tech company.',
        content: 'Sarah applied through our platform and within 3 months, she was offered her dream position. "The platform made it so easy to find relevant opportunities and track my applications," she says.',
        type: 'Announcement',
        category: 'General',
        target_audience: ['Applicants'],
        priority: 'Normal',
        start_date: new Date('2025-02-01'),
        end_date: new Date('2025-08-31'),
        is_active: true,
        is_featured: false,
        tags: ['success-story', 'testimonials', 'motivation'],
        created_by: users[1].id, // Staff
        last_modified_by: users[1].id,
        approved_by: users[0].id,
        approval_status: 'Approved'
      }
    ]);

    console.log(`✅ Created ${ads.length} ads`);

    console.log('\n🎉 Database seeding completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`- Users: ${users.length}`);
    console.log(`- Applicants: ${applicants.length}`);
    console.log(`- Jobs: ${jobs.length}`);
    console.log(`- Scholarships: ${scholarships.length}`);
    console.log(`- Ads: ${ads.length}`);
    
    console.log('\n🔐 Login Credentials:');
    console.log('Admin: admin@example.com / password123');
    console.log('Staff: staff@example.com / password123');
    console.log('Applicant: alice@example.com / password123');

  } catch (error) {
    console.error('❌ Error seeding database:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
    process.exit(0);
  }
};

// Run the seeding process
connectDB().then(() => {
  seedDatabase();
}).catch((error) => {
  console.error('Failed to connect to database:', error);
  process.exit(1);
});
