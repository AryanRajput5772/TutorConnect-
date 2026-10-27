require('dotenv').config();
const mongoose = require('mongoose');
const Admin = require('./models/Admin');
const Tutor = require('./models/Tutor');
const Inquiry = require('./models/Inquiry');
const connectDB = require('./config/db');

const seedData = async () => {
  try {
    await connectDB();

    console.log('🌱 Starting TutorConnect database seed...');

    // 1. Seed or Update Admin Account
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@tutorconnect.com';
    const existingAdmin = await Admin.findOne({ email: adminEmail });

    if (!existingAdmin) {
      await Admin.create({
        name: process.env.ADMIN_NAME || 'Head Academic Admin',
        email: adminEmail,
        password: process.env.ADMIN_PASSWORD || 'admin123',
        role: 'superadmin'
      });
      console.log(`✅ Admin account created: ${adminEmail} (password: ${process.env.ADMIN_PASSWORD || 'admin123'})`);
    } else {
      console.log(`ℹ️ Admin account already exists: ${adminEmail}`);
    }

    // 2. Clear previous sample tutors (optional or only seed if none exist)
    const tutorCount = await Tutor.countDocuments();
    if (tutorCount === 0) {
      console.log('Seeding initial verified, pending, and scheduled tutors...');

      const sampleTutors = [
        // Verified Tutor 1: Mathematics Specialist
        {
          name: 'Dr. Rajesh Sharma',
          email: 'rajesh.sharma@example.com',
          password: 'password123',
          phone: '+91 98112 34567',
          avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
          city: 'New Delhi',
          preferredLocations: ['South Extension', 'Lajpat Nagar', 'Defence Colony', 'Hauz Khas'],
          qualification: 'Ph.D. in Applied Mathematics, Delhi University',
          college: 'St. Stephen\'s College, Delhi University',
          experienceYears: 8,
          subjects: ['Mathematics', 'Applied Mathematics', 'IIT-JEE Foundation', 'Vedic Math'],
          classes: ['Class 9-10', 'Class 11-12'],
          boards: ['CBSE', 'ICSE', 'IB'],
          teachingMode: 'home_tuition',
          hourlyFee: 700,
          monthlyFee: 8000,
          bio: 'Passionate mathematics educator with 8+ years of dedicated 1-on-1 home tuition experience. Specializes in transforming math anxiety into conceptual clarity. Over 90% of my students have scored 95+ in Class 10 and 12 CBSE board exams. I focus on step-by-step problem-solving, daily practice worksheets, and weekly mock tests.',
          availability: 'Mon - Fri (4:30 PM - 8:30 PM)',
          gender: 'Male',
          verificationStatus: 'verified',
          isVerified: true,
          verifiedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5), // 5 days ago
          rating: 4.9,
          reviewCount: 24,
          interviewDetails: {
            zoomLink: 'https://zoom.us/j/9812345678',
            scheduledAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 6),
            notes: 'Verified original Ph.D. and M.Sc. degree certificates. Outstanding conceptual clarity.'
          }
        },

        // Verified Tutor 2: Physics & Chemistry Specialist
        {
          name: 'Pooja Narang',
          email: 'pooja.narang@example.com',
          password: 'password123',
          phone: '+91 98711 22334',
          avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&auto=format&fit=crop&q=80',
          city: 'New Delhi',
          preferredLocations: ['Saket', 'Vasant Kunj', 'Malviya Nagar', 'Greater Kailash'],
          qualification: 'M.Sc. Physics (Gold Medalist), IIT Delhi',
          college: 'IIT Delhi',
          experienceYears: 5,
          subjects: ['Physics', 'Chemistry', 'Science', 'NEET Foundation'],
          classes: ['Class 6-8', 'Class 9-10', 'Class 11-12'],
          boards: ['CBSE', 'ICSE'],
          teachingMode: 'home_tuition',
          hourlyFee: 650,
          monthlyFee: 7500,
          bio: 'Former school faculty member and IIT Delhi alumna offering dedicated home tuition for Physics and Science. I utilize real-world analogies, visual experiments, and numerical breakdown methods to make tough mechanics and electromagnetism concepts easy to grasp.',
          availability: 'Tue, Thu, Sat (5 PM - 8 PM)',
          gender: 'Female',
          verificationStatus: 'verified',
          isVerified: true,
          verifiedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3),
          rating: 5.0,
          reviewCount: 18,
          interviewDetails: {
            zoomLink: 'https://zoom.us/j/8765432109',
            scheduledAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 4),
            notes: 'Verified IIT Delhi degrees and certificates. Excellent pedagogy.'
          }
        },

        // Verified Tutor 3: English & Humanities Specialist
        {
          name: 'Ananya Deshmukh',
          email: 'ananya.deshmukh@example.com',
          password: 'password123',
          phone: '+91 99201 54321',
          avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&auto=format&fit=crop&q=80',
          city: 'Mumbai',
          preferredLocations: ['Andheri West', 'Bandra', 'Juhu', 'Lokhandwala'],
          qualification: 'M.A. English Literature & B.Ed',
          college: 'St. Xavier\'s College, Mumbai',
          experienceYears: 6,
          subjects: ['English', 'English Literature', 'Social Studies', 'History', 'Creative Writing'],
          classes: ['Class 1-5', 'Class 6-8', 'Class 9-10'],
          boards: ['ICSE', 'CBSE', 'IGCSE'],
          teachingMode: 'both',
          hourlyFee: 550,
          monthlyFee: 6000,
          bio: 'Certified B.Ed educator with 6 years experience helping school children excel in English grammar, essay structuring, comprehension, and expressive speech. Personalized attention guaranteed.',
          availability: 'Mon - Fri (3 PM - 7 PM)',
          gender: 'Female',
          verificationStatus: 'verified',
          isVerified: true,
          verifiedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2),
          rating: 4.8,
          reviewCount: 15
        },

        // Verified Tutor 4: Coding & Computer Science Specialist
        {
          name: 'Vikram Malhotra',
          email: 'vikram.malhotra@example.com',
          password: 'password123',
          phone: '+91 98450 12345',
          avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80',
          city: 'Bengaluru',
          preferredLocations: ['Koramangala', 'Indiranagar', 'HSR Layout', 'Whitefield'],
          qualification: 'B.Tech in Computer Science & Engineering',
          college: 'RV College of Engineering, Bengaluru',
          experienceYears: 4,
          subjects: ['Coding', 'Python', 'Computer Science', 'Informatics Practices', 'Java'],
          classes: ['Class 6-8', 'Class 9-10', 'Class 11-12'],
          boards: ['CBSE', 'ICSE', 'IB'],
          teachingMode: 'both',
          hourlyFee: 600,
          monthlyFee: 7000,
          bio: 'Software engineer and enthusiastic mentor teaching school students coding fundamentals, logical thinking, Python, and CBSE Computer Science syllabus. Hands-on coding in every lesson.',
          availability: 'Weekdays (6 PM - 9 PM), Weekends',
          gender: 'Male',
          verificationStatus: 'verified',
          isVerified: true,
          verifiedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 1),
          rating: 4.9,
          reviewCount: 11
        },

        // Pending Tutor 1: Just Applied! (Shows up immediately on admin dashboard for Zoom interview scheduling)
        {
          name: 'Suresh Kumar Patel',
          email: 'suresh.patel@example.com',
          password: 'password123',
          phone: '+91 97234 56789',
          avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&auto=format&fit=crop&q=80',
          city: 'New Delhi',
          preferredLocations: ['Rohini', 'Pitampura', 'Shalimar Bagh'],
          qualification: 'M.Sc. Chemistry, University of Delhi',
          college: 'Hindu College, Delhi University',
          experienceYears: 3,
          subjects: ['Chemistry', 'Science', 'Mathematics'],
          classes: ['Class 9-10', 'Class 11-12'],
          boards: ['CBSE'],
          teachingMode: 'home_tuition',
          hourlyFee: 500,
          monthlyFee: 5500,
          bio: 'Energetic chemistry tutor specializing in organic and physical chemistry. Ready to take 1-on-1 home tuition in North and West Delhi.',
          availability: 'Mon - Sat (5 PM - 8 PM)',
          gender: 'Male',
          verificationStatus: 'pending',
          isVerified: false
        },

        // Interview Scheduled Tutor 2: Zoom link sent, awaiting interview completion
        {
          name: 'Meera Iyer',
          email: 'meera.iyer@example.com',
          password: 'password123',
          phone: '+91 98200 87654',
          avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&auto=format&fit=crop&q=80',
          city: 'Bengaluru',
          preferredLocations: ['Jayanagar', 'JP Nagar', 'Banashankari'],
          qualification: 'M.Sc. Biology & Genetics',
          college: 'Bangalore University',
          experienceYears: 4,
          subjects: ['Biology', 'NEET Biology', 'General Science'],
          classes: ['Class 9-10', 'Class 11-12'],
          boards: ['CBSE', 'ICSE'],
          teachingMode: 'home_tuition',
          hourlyFee: 550,
          monthlyFee: 6000,
          bio: 'Biology specialist with deep focus on diagrams, NCERT line-by-line understanding, and NEET prep for Class 11-12 students.',
          availability: 'Mon - Fri (4 PM - 7 PM)',
          gender: 'Female',
          verificationStatus: 'interview_scheduled',
          isVerified: false,
          interviewDetails: {
            zoomLink: 'https://zoom.us/j/91234567890?pwd=samplepasscode',
            meetingId: '912 3456 7890',
            passcode: '829104',
            scheduledAt: new Date(Date.now() + 1000 * 60 * 60 * 18), // Tomorrow
            notes: 'Please keep M.Sc. degree certificate and government ID ready for video inspection.',
            sentAt: new Date()
          }
        }
      ];

      for (const tutorData of sampleTutors) {
        await Tutor.create(tutorData);
      }
      console.log(`✅ Seeded ${sampleTutors.length} sample tutors (Verified, Pending & Interview Scheduled)`);

      // Seed a sample parent inquiry for Dr. Rajesh Sharma
      const rajesh = await Tutor.findOne({ email: 'rajesh.sharma@example.com' });
      if (rajesh) {
        await Inquiry.create({
          tutor: rajesh._id,
          parentName: 'Sunil Aggarwal',
          parentPhone: '+91 98101 99887',
          parentEmail: 'sunil.aggarwal@gmail.com',
          studentGrade: 'Class 10',
          locality: 'South Extension Part 2, New Delhi',
          subjectsNeeded: ['Mathematics'],
          preferredTiming: 'Evening (5 PM - 7 PM)',
          message: 'My son is preparing for CBSE 10th boards next year and needs personal attention to build confidence in Trigonometry and Geometry.',
          status: 'demo_scheduled'
        });
        console.log('✅ Seeded sample parent inquiry');
      }
    } else {
      console.log(`ℹ️ Database already has ${tutorCount} tutors, skipping tutor seed.`);
    }

    console.log('\n🎉 Seed process completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during database seed:', error);
    process.exit(1);
  }
};

seedData();
