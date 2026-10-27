const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const tutorSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please enter your full name'],
      trim: true
    },
    email: {
      type: String,
      required: [true, 'Please enter your email'],
      unique: true,
      lowercase: true,
      trim: true
    },
    password: {
      type: String,
      required: [true, 'Please provide a password'],
      minlength: 6
    },
    phone: {
      type: String,
      required: [true, 'Please provide your contact phone number'],
      trim: true
    },
    avatar: {
      type: String,
      default: '/images/default-avatar.png'
    },
    city: {
      type: String,
      required: [true, 'Please provide your primary city'],
      trim: true,
      default: 'New Delhi'
    },
    preferredLocations: {
      type: [String],
      default: [],
      // e.g. ["South Extension", "Lajpat Nagar", "Hauz Khas"]
    },
    qualification: {
      type: String,
      required: [true, 'Please enter your highest qualification'],
      trim: true
    },
    college: {
      type: String,
      trim: true
    },
    experienceYears: {
      type: Number,
      required: [true, 'Please specify your years of experience'],
      min: 0,
      default: 1
    },
    subjects: {
      type: [String],
      required: [true, 'Please list the subjects you teach'],
      default: []
    },
    classes: {
      type: [String],
      default: ['Class 1-5', 'Class 6-8', 'Class 9-10']
    },
    boards: {
      type: [String],
      default: ['CBSE', 'ICSE']
    },
    teachingMode: {
      type: String,
      enum: ['home_tuition', 'online', 'both'],
      default: 'home_tuition'
    },
    hourlyFee: {
      type: Number,
      required: [true, 'Please enter your hourly fee'],
      min: 0,
      default: 500
    },
    monthlyFee: {
      type: Number,
      min: 0,
      default: 5000
    },
    bio: {
      type: String,
      required: [true, 'Please provide a brief bio about your teaching approach'],
      trim: true
    },
    achievements: {
      type: String,
      trim: true
    },
    availability: {
      type: String,
      default: 'Mon - Fri (Evenings)'
    },
    gender: {
      type: String,
      enum: ['Male', 'Female', 'Other'],
      default: 'Male'
    },
    isProfileComplete: {
      type: Boolean,
      default: true
    },
    // Verification flow
    verificationStatus: {
      type: String,
      enum: ['pending', 'interview_scheduled', 'verified', 'rejected'],
      default: 'pending'
    },
    isVerified: {
      type: Boolean,
      default: false
    },
    verifiedAt: {
      type: Date
    },
    interviewDetails: {
      zoomLink: String,
      meetingId: String,
      passcode: String,
      scheduledAt: Date,
      notes: String,
      sentAt: Date
    },
    adminNotes: {
      type: String,
      default: ''
    },
    rating: {
      type: Number,
      default: 4.9,
      min: 1,
      max: 5
    },
    reviewCount: {
      type: Number,
      default: 12
    }
  },
  {
    timestamps: true
  }
);

// Hash password before saving
tutorSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Compare password method
tutorSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('Tutor', tutorSchema);
