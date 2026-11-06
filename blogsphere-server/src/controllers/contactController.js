const ContactMessage = require('../models/ContactMessage');
const sendEmail = require('../utils/email');
const env = require('../config/env');
const { sendSuccess, sendError } = require('../utils/response');
const { parseLimit } = require('../utils/query');

/**
 * @desc    Submit a contact form message (stored in MongoDB)
 * @route   POST /api/v1/contact
 * @access  Public (rate limited)
 */
exports.submitContact = async (req, res, next) => {
  try {
    const { name, email, subject, message, website } = req.body;

    // Honeypot field: real visitors never fill it, bots usually do
    if (website) {
      return sendSuccess(res, 201, 'Thanks! Your message has been received.');
    }

    if (!name || !email || !message) {
      return sendError(res, 400, 'Please provide your name, email and message');
    }

    const saved = await ContactMessage.create({ name, email, subject, message });

    // Notify the site owner (console in development; SMTP hook in production)
    if (env.contactEmail) {
      await sendEmail({
        to: env.contactEmail,
        subject: `[Contact] ${saved.subject}`,
        text: `From: ${saved.name} <${saved.email}>\n\n${saved.message}`
      }).catch(() => {});
    }

    return sendSuccess(res, 201, 'Thanks! Your message has been received.', { id: saved._id });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    List contact messages (newest first)
 * @route   GET /api/v1/contact?status=new&limit=50
 * @access  Private (Admin)
 */
exports.getContactMessages = async (req, res) => {
  try {
    const query = {};
    if (req.query.status) query.status = String(req.query.status);
    const messages = await ContactMessage.find(query)
      .sort({ createdAt: -1 })
      .limit(parseLimit(req.query.limit, 50, 200))
      .lean();
    return sendSuccess(res, 200, 'Contact messages retrieved', { messages });
  } catch (err) {
    return sendError(res, 500, err.message);
  }
};
