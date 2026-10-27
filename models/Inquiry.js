const mongoose = require('mongoose');

const inquirySchema = new mongoose.Schema(
  {
    tutor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tutor',
      required: true
    },
    parentName: {
      type: String,
      required: [true, 'Please enter your name'],
      trim: true
    },
    parentPhone: {
      type: String,
      required: [true, 'Please enter your phone number'],
      trim: true
    },
    parentEmail: {
      type: String,
      trim: true,
      lowercase: true
    },
    studentGrade: {
      type: String,
      required: [true, 'Please specify the student class/grade'],
      trim: true
    },
    locality: {
      type: String,
      required: [true, 'Please enter your residential area / locality'],
      trim: true
    },
    subjectsNeeded: {
      type: [String],
      default: []
    },
    preferredTiming: {
      type: String,
      default: 'Evening (5 PM - 8 PM)'
    },
    message: {
      type: String,
      trim: true
    },
    status: {
      type: String,
      enum: ['new', 'contacted', 'demo_scheduled', 'enrolled', 'closed'],
      default: 'new'
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Inquiry', inquirySchema);
