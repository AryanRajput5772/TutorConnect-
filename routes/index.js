const express = require('express');
const router = express.Router();
const Tutor = require('../models/Tutor');
const Inquiry = require('../models/Inquiry');

// GET / - Home page
router.get('/', async (req, res) => {
  try {
    const { subject, location, classGrade, maxFee } = req.query;

    // Filter query: only VERIFIED tutors on public pages
    const query = { isVerified: true };

    if (subject && subject.trim() !== '') {
      query.subjects = { $regex: new RegExp(subject.trim(), 'i') };
    }

    if (location && location.trim() !== '') {
      query.$or = [
        { city: { $regex: new RegExp(location.trim(), 'i') } },
        { preferredLocations: { $regex: new RegExp(location.trim(), 'i') } }
      ];
    }

    if (classGrade && classGrade.trim() !== '') {
      query.classes = { $in: [new RegExp(classGrade.trim(), 'i')] };
    }

    if (maxFee && !isNaN(maxFee)) {
      query.hourlyFee = { $lte: Number(maxFee) };
    }

    // Fetch verified tutors sorted by rating & experience
    const verifiedTutors = await Tutor.find(query).sort({ rating: -1, experienceYears: -1 }).limit(12);

    // Get statistics for the trust banner
    const totalVerifiedCount = await Tutor.countDocuments({ isVerified: true });
    const distinctSubjects = await Tutor.distinct('subjects', { isVerified: true });
    const distinctLocations = await Tutor.distinct('city', { isVerified: true });

    res.render('index', {
      title: 'TutorConnect - Connect with Verified Home Tutors for Your Child',
      tutors: verifiedTutors,
      totalVerifiedCount,
      subjectCount: distinctSubjects.length,
      locationCount: distinctLocations.length,
      filters: {
        subject: subject || '',
        location: location || '',
        classGrade: classGrade || '',
        maxFee: maxFee || ''
      }
    });
  } catch (error) {
    console.error('Error fetching home page tutors:', error);
    req.flash('error_msg', 'Could not load tutors directory');
    res.render('index', {
      title: 'TutorConnect - Connect with Verified Home Tutors',
      tutors: [],
      totalVerifiedCount: 0,
      subjectCount: 0,
      locationCount: 0,
      filters: {}
    });
  }
});

// GET /tutors - All Verified Tutors Directory with Search & Filtering
router.get('/tutors', async (req, res) => {
  try {
    const { subject, location, classGrade, maxFee, mode, sortBy } = req.query;

    const query = { isVerified: true };

    if (subject && subject.trim() !== '') {
      query.subjects = { $regex: new RegExp(subject.trim(), 'i') };
    }

    if (location && location.trim() !== '') {
      query.$or = [
        { city: { $regex: new RegExp(location.trim(), 'i') } },
        { preferredLocations: { $regex: new RegExp(location.trim(), 'i') } }
      ];
    }

    if (classGrade && classGrade.trim() !== '') {
      query.classes = { $regex: new RegExp(classGrade.trim(), 'i') };
    }

    if (maxFee && !isNaN(maxFee)) {
      query.hourlyFee = { $lte: Number(maxFee) };
    }

    if (mode && mode !== 'all') {
      query.teachingMode = { $in: [mode, 'both'] };
    }

    let sortOption = { rating: -1, experienceYears: -1 };
    if (sortBy === 'fee_low') sortOption = { hourlyFee: 1 };
    if (sortBy === 'fee_high') sortOption = { hourlyFee: -1 };
    if (sortBy === 'experience') sortOption = { experienceYears: -1 };
    if (sortBy === 'newest') sortOption = { verifiedAt: -1 };

    const tutors = await Tutor.find(query).sort(sortOption);

    res.render('tutors', {
      title: 'Find Verified Home Tutors - TutorConnect',
      tutors,
      filters: {
        subject: subject || '',
        location: location || '',
        classGrade: classGrade || '',
        maxFee: maxFee || '',
        mode: mode || 'all',
        sortBy: sortBy || 'rating'
      }
    });
  } catch (error) {
    console.error('Error loading tutors directory:', error);
    req.flash('error_msg', 'Failed to retrieve tutors');
    res.redirect('/');
  }
});

// GET /tutors/:id - Tutor Profile Detail View
router.get('/tutors/:id', async (req, res) => {
  try {
    const tutor = await Tutor.findById(req.params.id);

    if (!tutor || !tutor.isVerified) {
      req.flash('error_msg', 'Tutor profile not found or is currently pending verification.');
      return res.redirect('/tutors');
    }

    // Find similar verified tutors (same subjects or city)
    const similarTutors = await Tutor.find({
      _id: { $ne: tutor._id },
      isVerified: true,
      $or: [
        { subjects: { $in: tutor.subjects } },
        { city: tutor.city }
      ]
    }).limit(3);

    res.render('tutor-detail', {
      title: `${tutor.name} - Verified Home Tutor | TutorConnect`,
      tutor,
      similarTutors
    });
  } catch (error) {
    console.error('Error fetching tutor detail:', error);
    req.flash('error_msg', 'Invalid tutor profile requested');
    res.redirect('/tutors');
  }
});

// POST /tutors/:id/inquire - Parent Books Demo / Inquires about a Tutor
router.post('/tutors/:id/inquire', async (req, res) => {
  try {
    const tutor = await Tutor.findById(req.params.id);
    if (!tutor) {
      req.flash('error_msg', 'Tutor not found');
      return res.redirect('/tutors');
    }

    const { parentName, parentPhone, parentEmail, studentGrade, locality, subjectsNeeded, preferredTiming, message } = req.body;

    if (!parentName || !parentPhone || !studentGrade || !locality) {
      req.flash('error_msg', 'Please fill in all required inquiry fields');
      return res.redirect(`/tutors/${tutor._id}`);
    }

    const subjectsArray = subjectsNeeded
      ? Array.isArray(subjectsNeeded)
        ? subjectsNeeded
        : subjectsNeeded.split(',').map(s => s.trim())
      : [];

    await Inquiry.create({
      tutor: tutor._id,
      parentName,
      parentPhone,
      parentEmail: parentEmail || '',
      studentGrade,
      locality,
      subjectsNeeded: subjectsArray,
      preferredTiming: preferredTiming || 'Evening',
      message: message || ''
    });

    req.flash('success_msg', `🎉 Your request for a home tuition demo with ${tutor.name} has been submitted! Our coordinator and the tutor will call you on ${parentPhone} shortly.`);
    res.redirect(`/tutors/${tutor._id}`);
  } catch (error) {
    console.error('Error saving parent inquiry:', error);
    req.flash('error_msg', 'Could not submit inquiry. Please try again.');
    res.redirect(`/tutors/${req.params.id}`);
  }
});

// GET /how-it-works - Trust & Verification Process Details
router.get('/how-it-works', (req, res) => {
  res.render('how-it-works', {
    title: 'How It Works - TutorConnect Safety & Verification'
  });
});

// GET /about - About Us
router.get('/about', (req, res) => {
  res.render('about', {
    title: 'About TutorConnect - Connecting Families with Certified Tutors'
  });
});

// GET /contact - Contact Support
router.get('/contact', (req, res) => {
  res.render('contact', {
    title: 'Contact Us - TutorConnect'
  });
});

router.post('/contact', (req, res) => {
  req.flash('success_msg', 'Thank you! Your message has been received. Our team will get back to you within 24 hours.');
  res.redirect('/contact');
});

module.exports = router;
