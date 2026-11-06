const nodemailer = require('nodemailer');
const env = require('../config/env');

let transporter = null;
const getTransporter = () => {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: env.smtp.host,
      port: env.smtp.port,
      // Port 465 uses TLS from the start; 587/2525 upgrade with STARTTLS
      secure: env.smtp.port === 465,
      auth: { user: env.smtp.user, pass: env.smtp.pass }
    });
  }
  return transporter;
};

// Emails "sent" while NODE_ENV=test are collected here so the test suite can read them
const outbox = [];

/**
 * Sends an email.
 * - SMTP configured (SMTP_HOST, SMTP_USER, SMTP_PASS): delivered through nodemailer.
 * - Not configured, development: printed to the console so you can click links locally.
 * - Not configured, production: a clear warning is logged and nothing is sent.
 * Resolves to { delivered: boolean }. Throws only when the SMTP server rejects the message.
 */
const sendEmail = async ({ to, subject, html, text }) => {
  if (env.nodeEnv === 'test') {
    outbox.push({ to, subject, html, text });
    return { delivered: true, test: true };
  }

  if (!env.smtpConfigured) {
    if (env.nodeEnv === 'production') {
      console.warn(
        `[Email] SMTP is not configured (set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS). ` +
          `Email "${subject}" to ${to} was NOT sent.`
      );
      return { delivered: false };
    }
    console.log('\n================== [DEV EMAIL - not sent, SMTP not configured] ==================');
    console.log(`To: ${to}`);
    console.log(`From: ${env.fromName} <${env.fromEmail}>`);
    console.log(`Subject: ${subject}`);
    console.log('---------------------------------------------------------------------------------');
    console.log(text || html);
    console.log('=================================================================================\n');
    return { delivered: false, logged: true };
  }

  await getTransporter().sendMail({
    from: `"${env.fromName}" <${env.fromEmail}>`,
    to,
    subject,
    text,
    html
  });
  return { delivered: true };
};

sendEmail.outbox = outbox;

module.exports = sendEmail;
