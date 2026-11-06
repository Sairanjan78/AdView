const mongoose = require('mongoose');
const validator = require('validator');

const ContactMessageSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide your name'],
      trim: true,
      maxlength: [80, 'Name cannot exceed 80 characters']
    },
    email: {
      type: String,
      required: [true, 'Please provide your email address'],
      trim: true,
      lowercase: true,
      validate: [validator.isEmail, 'Please provide a valid email address']
    },
    subject: {
      type: String,
      trim: true,
      default: 'General enquiry',
      maxlength: [150, 'Subject cannot exceed 150 characters']
    },
    message: {
      type: String,
      required: [true, 'Please write a message'],
      trim: true,
      minlength: [10, 'Message must be at least 10 characters'],
      maxlength: [5000, 'Message cannot exceed 5000 characters']
    },
    status: {
      type: String,
      enum: ['new', 'read', 'archived'],
      default: 'new',
      index: true
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('ContactMessage', ContactMessageSchema);
