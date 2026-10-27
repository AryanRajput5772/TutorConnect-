require('dotenv').config();
const mongoose = require('mongoose');
const Tutor = require('./models/Tutor');
const Admin = require('./models/Admin');
const Inquiry = require('./models/Inquiry');
const { sendZoomInterviewEmail, sendProfileVerifiedEmail } = require('./utils/mailer');
const connectDB = require('./config/db');

const runWorkflowTest = async () => {
  try {
    await connectDB();
    console.log('\n--- 🧪 STARTING TUTORCONNECT END-TO-END FLOW TEST ---');

    // Step 1: Check existing verified tutors
    const verifiedTutors = await Tutor.find({ isVerified: true });
    console.log(`✅ Step 1: Found ${verifiedTutors.length} verified tutors on front page directory.`);
    if (verifiedTutors.length === 0) throw new Error('Expected verified tutors in database');

    const firstTutor = verifiedTutors[0];
    console.log(`   Sample verified tutor: ${firstTutor.name} (${firstTutor.qualification}) - ₹${firstTutor.hourlyFee}/hr`);

    // Step 2: Parent submits inquiry for verified tutor
    console.log('\n✅ Step 2: Simulating Parent Inquiry Submission for home tuition...');
    const parentInquiry = await Inquiry.create({
      tutor: firstTutor._id,
      parentName: 'Deepak Mehrotra',
      parentPhone: '+91 98999 11223',
      parentEmail: 'deepak.m@example.com',
      studentGrade: 'Class 9',
      locality: 'Saket, New Delhi',
      subjectsNeeded: firstTutor.subjects.slice(0, 2),
      preferredTiming: 'Evening (5 PM - 7 PM)',
      message: 'Looking for 3 days a week home tuition.'
    });
    console.log(`   Inquiry created successfully (ID: ${parentInquiry._id}) for tutor: ${firstTutor.name}`);

    // Step 3: New tutor registers and fills their details
    console.log('\n✅ Step 3: New Educator registers and fills details on TutorConnect...');
    const testEmail = `new.tutor.${Date.now()}@example.com`;
    const newTutor = await Tutor.create({
      name: 'Rohan Verma',
      email: testEmail,
      password: 'mypassword123',
      phone: '+91 98765 00000',
      city: 'New Delhi',
      preferredLocations: ['Lajpat Nagar', 'South Extension', 'Kailash Colony'],
      qualification: 'M.Sc. in Physics, Delhi University',
      college: 'Hansraj College',
      experienceYears: 4,
      subjects: ['Physics', 'Science'],
      hourlyFee: 550,
      monthlyFee: 6500,
      bio: 'Energetic physics educator with 4 years teaching experience.',
      verificationStatus: 'pending',
      isVerified: false
    });
    console.log(`   Tutor registered: ${newTutor.name} (Status: ${newTutor.verificationStatus}, isVerified: ${newTutor.isVerified})`);

    // Verify they are NOT on the front page
    const publicTutorsCheck1 = await Tutor.find({ isVerified: true, email: testEmail });
    if (publicTutorsCheck1.length > 0) {
      throw new Error('Pending tutor must NOT be listed on front page!');
    }
    console.log('   ✓ Verified: Pending tutor is NOT shown on the front page directory.');

    // Step 4: Admin dashboard finds pending tutor and sends Zoom interview link
    console.log('\n✅ Step 4: Admin schedules & sends Zoom interview link via email...');
    const pendingTutors = await Tutor.find({ verificationStatus: 'pending' });
    console.log(`   Admin sees ${pendingTutors.length} pending applications in Admin Dashboard queue.`);

    const zoomLink = 'https://us02web.zoom.us/j/9871234567?pwd=testzoominterview';
    const interviewDate = new Date(Date.now() + 1000 * 60 * 60 * 24); // Tomorrow

    const emailResult = await sendZoomInterviewEmail({
      to: newTutor.email,
      tutorName: newTutor.name,
      zoomLink,
      meetingId: '987 123 4567',
      passcode: '459102',
      scheduledAt: interviewDate,
      notes: 'Please keep your original M.Sc. degree ready.'
    });

    console.log(`   Email dispatch result: success=${emailResult.success}`);

    // Update status to interview_scheduled
    newTutor.verificationStatus = 'interview_scheduled';
    newTutor.interviewDetails = {
      zoomLink,
      meetingId: '987 123 4567',
      passcode: '459102',
      scheduledAt: interviewDate,
      notes: 'Please keep your original M.Sc. degree ready.',
      sentAt: new Date()
    };
    await newTutor.save();
    console.log(`   Tutor status updated to: '${newTutor.verificationStatus}'`);

    // Step 5: Admin conducts interview via Zoom and marks tutor as VERIFIED
    console.log('\n✅ Step 5: Admin takes Zoom interview and verifies the tutor profile...');
    newTutor.isVerified = true;
    newTutor.verificationStatus = 'verified';
    newTutor.verifiedAt = new Date();
    newTutor.adminNotes = 'Excellent subject knowledge and clear pedagogical approach.';
    await newTutor.save();

    await sendProfileVerifiedEmail({
      to: newTutor.email,
      tutorName: newTutor.name
    });
    console.log(`   Tutor ${newTutor.name} marked as VERIFIED! (isVerified: ${newTutor.isVerified})`);

    // Step 6: Verify they are now LIVE on the main website front page
    console.log('\n✅ Step 6: Verifying tutor profile is now published on front page...');
    const publicTutorsCheck2 = await Tutor.find({ isVerified: true, email: testEmail });
    if (publicTutorsCheck2.length === 0) {
      throw new Error('Verified tutor MUST appear on front page!');
    }
    console.log(`   ✓ Success! ${publicTutorsCheck2[0].name} is now LIVE on the front page directory.`);
    console.log(`   ✓ Location: ${publicTutorsCheck2[0].preferredLocations.join(', ')}`);
    console.log(`   ✓ Hourly Tuition Fee: ₹${publicTutorsCheck2[0].hourlyFee}/hr`);
    console.log(`   ✓ Qualification: ${publicTutorsCheck2[0].qualification}`);
    console.log(`   ✓ Subjects: ${publicTutorsCheck2[0].subjects.join(', ')}`);

    // Clean up test tutor and inquiry
    await Tutor.deleteOne({ _id: newTutor._id });
    await Inquiry.deleteOne({ _id: parentInquiry._id });
    console.log('\n🧹 Test artifacts cleaned up successfully.');

    console.log('\n=============================================================');
    console.log('🎉 ALL WORKFLOW STEPS PASSED WITH 100% SUCCESS!');
    console.log('=============================================================\n');
    process.exit(0);
  } catch (error) {
    console.error('❌ Flow test failed:', error);
    process.exit(1);
  }
};

runWorkflowTest();
