const express = require('express');
const router = express.Router();
const Admin = require('../models/Admin');
const Tutor = require('../models/Tutor');
const Inquiry = require('../models/Inquiry');
const { isAdminAuth, redirectIfAdminAuth } = require('../middleware/auth');
const { sendZoomInterviewEmail, sendProfileVerifiedEmail } = require('../utils/mailer');

// GET /admin/login
router.get('/login', redirectIfAdminAuth, (req, res) => {
  res.render('admin/login', {
    title: 'Admin Portal Login - TutorConnect'
  });
});

// POST /admin/login
router.post('/login', redirectIfAdminAuth, async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      req.flash('error_msg', 'Please provide admin email and password');
      return res.redirect('/admin/login');
    }

    const admin = await Admin.findOne({ email: email.toLowerCase().trim() });
    if (!admin) {
      req.flash('error_msg', 'Invalid admin credentials');
      return res.redirect('/admin/login');
    }

    let isMatch = await admin.comparePassword(password);
    
    // Auto-sync if ADMIN_PASSWORD environment variable was updated in production (e.g. on Vercel)
    if (!isMatch && process.env.ADMIN_PASSWORD && password === process.env.ADMIN_PASSWORD) {
      admin.password = process.env.ADMIN_PASSWORD;
      await admin.save();
      isMatch = true;
    }

    if (!isMatch) {
      req.flash('error_msg', 'Invalid admin credentials');
      return res.redirect('/admin/login');
    }

    req.session.adminId = admin._id;
    req.session.adminName = admin.name;
    req.session.adminEmail = admin.email;
    req.session.isAdmin = true;

    req.flash('success_msg', `Welcome back, ${admin.name}!`);
    res.redirect('/admin/dashboard');
  } catch (error) {
    console.error('Error in admin login:', error);
    req.flash('error_msg', 'Login error: ' + error.message);
    res.redirect('/admin/login');
  }
});

// GET /admin/dashboard - Main Verification Dashboard
router.get('/dashboard', isAdminAuth, async (req, res) => {
  try {
    const { status, search } = req.query;

    const query = {};

    if (status && status !== 'all') {
      query.verificationStatus = status;
    }

    if (search && search.trim() !== '') {
      query.$or = [
        { name: { $regex: new RegExp(search.trim(), 'i') } },
        { email: { $regex: new RegExp(search.trim(), 'i') } },
        { phone: { $regex: new RegExp(search.trim(), 'i') } },
        { qualification: { $regex: new RegExp(search.trim(), 'i') } },
        { city: { $regex: new RegExp(search.trim(), 'i') } }
      ];
    }

    // Get Tutors list (pending and new tutors at the top by default)
    const tutors = await Tutor.find(query).sort({ createdAt: -1 });

    // Aggregate counts for summary badges
    const totalTutors = await Tutor.countDocuments();
    const pendingCount = await Tutor.countDocuments({ verificationStatus: 'pending' });
    const scheduledCount = await Tutor.countDocuments({ verificationStatus: 'interview_scheduled' });
    const verifiedCount = await Tutor.countDocuments({ verificationStatus: 'verified' });
    const rejectedCount = await Tutor.countDocuments({ verificationStatus: 'rejected' });
    const totalInquiries = await Inquiry.countDocuments();

    res.render('admin/dashboard', {
      title: 'Admin Verification Dashboard - TutorConnect',
      admin: {
        name: req.session.adminName,
        email: req.session.adminEmail
      },
      tutors,
      metrics: {
        totalTutors,
        pendingCount,
        scheduledCount,
        verifiedCount,
        rejectedCount,
        totalInquiries
      },
      currentStatus: status || 'all',
      search: search || ''
    });
  } catch (error) {
    console.error('Error loading admin dashboard:', error);
    req.flash('error_msg', 'Could not load dashboard data');
    res.render('admin/dashboard', {
      title: 'Admin Verification Dashboard',
      admin: { name: 'Admin', email: '' },
      tutors: [],
      metrics: { totalTutors: 0, pendingCount: 0, scheduledCount: 0, verifiedCount: 0, rejectedCount: 0, totalInquiries: 0 },
      currentStatus: 'all',
      search: ''
    });
  }
});

// GET /admin/tutors/:id - View single tutor application detail
router.get('/tutors/:id', isAdminAuth, async (req, res) => {
  try {
    const tutor = await Tutor.findById(req.params.id);
    if (!tutor) {
      req.flash('error_msg', 'Tutor record not found');
      return res.redirect('/admin/dashboard');
    }

    const inquiries = await Inquiry.find({ tutor: tutor._id }).sort({ createdAt: -1 });

    res.render('admin/tutor-view', {
      title: `Review Tutor: ${tutor.name} - Admin Portal`,
      tutor,
      inquiries
    });
  } catch (error) {
    console.error('Error viewing tutor:', error);
    req.flash('error_msg', 'Could not retrieve tutor application');
    res.redirect('/admin/dashboard');
  }
});

// POST /admin/tutors/:id/send-zoom - Admin sends Zoom link through email
router.post(['/tutors/:id/send-zoom', '/admin/tutors/:id/send-zoom'], isAdminAuth, async (req, res) => {
  try {
    const tutor = await Tutor.findById(req.params.id);
    if (!tutor) {
      req.flash('error_msg', 'Tutor not found');
      return res.redirect('/admin/dashboard');
    }

    const { zoomLink, meetingId, passcode, scheduledAt, notes } = req.body;

    if (!zoomLink || zoomLink.trim() === '') {
      req.flash('error_msg', 'Please provide a valid Zoom meeting link');
      return res.redirect(`/admin/tutors/${tutor._id}`);
    }

    // Save interview details to tutor document
    tutor.interviewDetails = {
      zoomLink: zoomLink.trim(),
      meetingId: meetingId ? meetingId.trim() : '',
      passcode: passcode ? passcode.trim() : '',
      scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
      notes: notes ? notes.trim() : '',
      sentAt: new Date()
    };
    tutor.verificationStatus = 'interview_scheduled';

    await tutor.save();

    // Send email with Zoom link to tutor
    const emailResult = await sendZoomInterviewEmail({
      to: tutor.email,
      tutorName: tutor.name,
      zoomLink: zoomLink.trim(),
      meetingId: meetingId ? meetingId.trim() : '',
      passcode: passcode ? passcode.trim() : '',
      scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
      notes: notes ? notes.trim() : ''
    });

    let msg = ` Zoom meeting interview link has been sent to ${tutor.name} (${tutor.email})! Status changed to 'Interview Scheduled'.`;
    if (emailResult.previewUrl) {
      msg += ` Ethereal Email Preview: ${emailResult.previewUrl}`;
    }

    req.flash('success_msg', msg);
    res.redirect('/admin/dashboard');
  } catch (error) {
    console.error('Error sending zoom interview link:', error);
    req.flash('error_msg', 'Failed to send Zoom meeting email: ' + error.message);
    res.redirect(`/admin/tutors/${req.params.id}`);
  }
});

// POST /admin/tutors/:id/verify - Admin verifies tutor profile after Zoom interview
router.post(['/tutors/:id/verify', '/admin/tutors/:id/verify'], isAdminAuth, async (req, res) => {
  try {
    const tutor = await Tutor.findById(req.params.id);
    if (!tutor) {
      req.flash('error_msg', 'Tutor record not found');
      return res.redirect('/admin/dashboard');
    }

    const { adminNotes } = req.body;

    tutor.isVerified = true;
    tutor.verificationStatus = 'verified';
    tutor.verifiedAt = new Date();
    if (adminNotes) {
      tutor.adminNotes = adminNotes;
    }

    await tutor.save();

    // Trigger notification email to tutor
    await sendProfileVerifiedEmail({
      to: tutor.email,
      tutorName: tutor.name
    });

    req.flash(
      'success_msg',
      `🎉 Tutor ${tutor.name} has been VERIFIED! Their profile is now LIVE on the TutorConnect homepage for parents.`
    );
    res.redirect('/admin/dashboard');
  } catch (error) {
    console.error('Error verifying tutor:', error);
    req.flash('error_msg', 'Could not verify tutor: ' + error.message);
    res.redirect('/admin/dashboard');
  }
});

// POST /admin/tutors/:id/reject - Admin rejects tutor profile
router.post(['/tutors/:id/reject', '/admin/tutors/:id/reject'], isAdminAuth, async (req, res) => {
  try {
    const tutor = await Tutor.findById(req.params.id);
    if (!tutor) {
      req.flash('error_msg', 'Tutor not found');
      return res.redirect('/admin/dashboard');
    }

    const { adminNotes } = req.body;

    tutor.isVerified = false;
    tutor.verificationStatus = 'rejected';
    if (adminNotes) tutor.adminNotes = adminNotes;

    await tutor.save();

    req.flash('success_msg', `Tutor ${tutor.name} has been marked as Rejected.`);
    res.redirect('/admin/dashboard');
  } catch (error) {
    console.error('Error rejecting tutor:', error);
    req.flash('error_msg', 'Could not reject tutor: ' + error.message);
    res.redirect('/admin/dashboard');
  }
});

// POST /admin/tutors/:id/revert-pending - Revert to pending
router.post(['/tutors/:id/revert-pending', '/admin/tutors/:id/revert-pending'], isAdminAuth, async (req, res) => {
  try {
    const tutor = await Tutor.findById(req.params.id);
    if (tutor) {
      tutor.isVerified = false;
      tutor.verificationStatus = 'pending';
      await tutor.save();
      req.flash('success_msg', `Tutor ${tutor.name} status reverted to Pending.`);
    }
    res.redirect('/admin/dashboard');
  } catch (error) {
    console.error('Error reverting status:', error);
    req.flash('error_msg', 'Could not revert status');
    res.redirect('/admin/dashboard');
  }
});

// GET /admin/inquiries - Parent Inquiries Management
router.get('/inquiries', isAdminAuth, async (req, res) => {
  try {
    const inquiries = await Inquiry.find().populate('tutor').sort({ createdAt: -1 });

    res.render('admin/inquiries', {
      title: 'Parent Home Tuition Inquiries - Admin Portal',
      inquiries
    });
  } catch (error) {
    console.error('Error loading inquiries:', error);
    req.flash('error_msg', 'Could not retrieve inquiries');
    res.redirect('/admin/dashboard');
  }
});

// POST /admin/inquiries/:id/status - Update Inquiry Status
router.post(['/inquiries/:id/status', '/admin/inquiries/:id/status'], isAdminAuth, async (req, res) => {
  try {
    const { status } = req.body;
    await Inquiry.findByIdAndUpdate(req.params.id, { status });
    req.flash('success_msg', 'Inquiry status updated successfully');
    res.redirect('/admin/inquiries');
  } catch (error) {
    console.error('Error updating inquiry status:', error);
    req.flash('error_msg', 'Failed to update status');
    res.redirect('/admin/inquiries');
  }
});

// GET /admin/logout
router.get('/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) console.error('Admin logout session error:', err);
    res.redirect('/admin/login');
  });
});

module.exports = router;
