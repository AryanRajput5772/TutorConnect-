const express = require('express');
const router = express.Router();
const Tutor = require('../models/Tutor');
const Inquiry = require('../models/Inquiry');
const { isTutorAuth, redirectIfTutorAuth } = require('../middleware/auth');

// GET /tutor/register
router.get('/register', redirectIfTutorAuth, (req, res) => {
  res.render('tutor/register', {
    title: 'Apply as a Home Tutor - TutorConnect Educator Registration',
    metaDescription: 'Register to teach as a verified home tutor on TutorConnect. Get direct tuition requests in your area with flexible hours and 0% commission.',
    formData: {}
  });
});

// POST /tutor/register
router.post('/register', redirectIfTutorAuth, async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      confirmPassword,
      phone,
      city,
      preferredLocations,
      qualification,
      college,
      experienceYears,
      subjects,
      classes,
      teachingMode,
      hourlyFee,
      monthlyFee,
      bio,
      availability,
      gender,
      avatar
    } = req.body;

    // Basic Validation
    if (!name || !email || !password || !phone || !qualification || !hourlyFee || !bio) {
      req.flash('error_msg', 'Please fill in all required fields');
      return res.render('tutor/register', {
        title: 'Join as a Tutor - TutorConnect',
        formData: req.body
      });
    }

    if (password.length < 6) {
      req.flash('error_msg', 'Password must be at least 6 characters long');
      return res.render('tutor/register', {
        title: 'Join as a Tutor - TutorConnect',
        formData: req.body
      });
    }

    if (password !== confirmPassword) {
      req.flash('error_msg', 'Passwords do not match');
      return res.render('tutor/register', {
        title: 'Join as a Tutor - TutorConnect',
        formData: req.body
      });
    }

    // Check if email already registered
    const existingTutor = await Tutor.findOne({ email: email.toLowerCase().trim() });
    if (existingTutor) {
      req.flash('error_msg', 'An account with this email already exists. Please log in.');
      return res.redirect('/tutor/login');
    }

    // Format subjects and locations from comma-separated string or array
    const subjectsArray = subjects
      ? (Array.isArray(subjects) ? subjects : subjects.split(',').map(s => s.trim()).filter(Boolean))
      : [];

    const locationsArray = preferredLocations
      ? (Array.isArray(preferredLocations) ? preferredLocations : preferredLocations.split(',').map(l => l.trim()).filter(Boolean))
      : [];

    const classesArray = classes
      ? (Array.isArray(classes) ? classes : [classes])
      : ['Class 6-8', 'Class 9-10'];

    // Use uploaded/provided avatar or default to standard logo avatar
    const finalAvatar = (avatar && avatar.trim())
      ? avatar.trim()
      : '/images/default-avatar.svg';

    // Create new Tutor (default verificationStatus: 'pending', isVerified: false)
    const newTutor = new Tutor({
      name,
      email: email.toLowerCase().trim(),
      password,
      phone,
      avatar: finalAvatar,
      city: city || 'New Delhi',
      preferredLocations: locationsArray,
      qualification,
      college: college || '',
      experienceYears: Number(experienceYears) || 1,
      subjects: subjectsArray,
      classes: classesArray,
      teachingMode: teachingMode || 'home_tuition',
      hourlyFee: Number(hourlyFee) || 500,
      monthlyFee: Number(monthlyFee) || (Number(hourlyFee) * 12) || 5000,
      bio,
      availability: availability || 'Mon - Fri (Evenings)',
      gender: gender || 'Male',
      verificationStatus: 'pending',
      isVerified: false
    });

    await newTutor.save();

    // Auto-login after registration
    req.session.tutorId = newTutor._id;
    req.session.tutorName = newTutor.name;
    req.session.isTutor = true;

    req.flash(
      'success_msg',
      '🎉 Registration successful! Your profile has been sent to the Admin Dashboard for verification. You will receive a Zoom interview link via email shortly.'
    );
    res.redirect('/tutor/dashboard');
  } catch (error) {
    console.error('Error in tutor registration:', error);
    req.flash('error_msg', 'Something went wrong during registration: ' + error.message);
    res.render('tutor/register', {
      title: 'Join as a Tutor - TutorConnect',
      formData: req.body
    });
  }
});

// GET /tutor/login
router.get('/login', redirectIfTutorAuth, (req, res) => {
  res.render('tutor/login', {
    title: 'Tutor Login - TutorConnect'
  });
});

// POST /tutor/login
router.post('/login', redirectIfTutorAuth, async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      req.flash('error_msg', 'Please provide both email and password');
      return res.redirect('/tutor/login');
    }

    const tutor = await Tutor.findOne({ email: email.toLowerCase().trim() });
    if (!tutor) {
      req.flash('error_msg', 'Invalid email or password');
      return res.redirect('/tutor/login');
    }

    const isMatch = await tutor.comparePassword(password);
    if (!isMatch) {
      req.flash('error_msg', 'Invalid email or password');
      return res.redirect('/tutor/login');
    }

    // Set Session
    req.session.tutorId = tutor._id;
    req.session.tutorName = tutor.name;
    req.session.isTutor = true;

    req.flash('success_msg', `Welcome back, ${tutor.name}!`);
    res.redirect('/tutor/dashboard');
  } catch (error) {
    console.error('Error in tutor login:', error);
    req.flash('error_msg', 'Login failed: ' + error.message);
    res.redirect('/tutor/login');
  }
});

// GET /tutor/dashboard
router.get('/dashboard', isTutorAuth, async (req, res) => {
  try {
    const tutor = await Tutor.findById(req.session.tutorId);
    if (!tutor) {
      req.session.destroy();
      return res.redirect('/tutor/login');
    }

    // Fetch parent inquiries received by this tutor
    const inquiries = await Inquiry.find({ tutor: tutor._id }).sort({ createdAt: -1 });

    res.render('tutor/dashboard', {
      title: `Tutor Portal - ${tutor.name} | TutorConnect`,
      tutor,
      inquiries
    });
  } catch (error) {
    console.error('Error fetching tutor dashboard:', error);
    req.flash('error_msg', 'Failed to load dashboard');
    res.redirect('/');
  }
});

// POST /tutor/profile/update
router.post('/profile/update', isTutorAuth, async (req, res) => {
  try {
    const tutor = await Tutor.findById(req.session.tutorId);
    if (!tutor) {
      return res.redirect('/tutor/login');
    }

    const {
      name,
      phone,
      city,
      preferredLocations,
      qualification,
      college,
      experienceYears,
      subjects,
      classes,
      teachingMode,
      hourlyFee,
      monthlyFee,
      bio,
      availability,
      avatar
    } = req.body;

    tutor.name = name || tutor.name;
    tutor.phone = phone || tutor.phone;
    tutor.city = city || tutor.city;
    tutor.qualification = qualification || tutor.qualification;
    tutor.college = college || tutor.college;
    tutor.experienceYears = Number(experienceYears) || tutor.experienceYears;
    tutor.teachingMode = teachingMode || tutor.teachingMode;
    tutor.hourlyFee = Number(hourlyFee) || tutor.hourlyFee;
    tutor.monthlyFee = Number(monthlyFee) || tutor.monthlyFee;
    tutor.bio = bio || tutor.bio;
    if (avatar !== undefined) {
      tutor.avatar = (avatar && avatar.trim()) ? avatar.trim() : '/images/default-avatar.svg';
    }

    if (subjects) {
      tutor.subjects = Array.isArray(subjects) ? subjects : subjects.split(',').map(s => s.trim()).filter(Boolean);
    }

    if (preferredLocations) {
      tutor.preferredLocations = Array.isArray(preferredLocations) ? preferredLocations : preferredLocations.split(',').map(l => l.trim()).filter(Boolean);
    }

    if (classes) {
      tutor.classes = Array.isArray(classes) ? classes : [classes];
    }

    await tutor.save();

    req.flash('success_msg', '✅ Your tutor profile has been updated successfully!');
    res.redirect('/tutor/dashboard');
  } catch (error) {
    console.error('Error updating tutor profile:', error);
    req.flash('error_msg', 'Could not update profile: ' + error.message);
    res.redirect('/tutor/dashboard');
  }
});

// GET /tutor/logout
router.get('/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) console.error('Session destroy error:', err);
    res.redirect('/tutor/login');
  });
});

module.exports = router;
