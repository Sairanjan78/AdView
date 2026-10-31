const env = require('../config/env');

/**
 * Dispatches an email notification.
 * In development, prints clearly to console so local testing needs no external SMTP credentials.
 */
const sendEmail = async ({ to, subject, html, text }) => {
  if (env.nodeEnv !== 'production') {
    console.log('\n================== [DEV EMAIL DISPATCHER] ==================');
    console.log(`To: ${to}`);
    console.log(`From: ${env.fromName} <${env.fromEmail}>`);
    console.log(`Subject: ${subject}`);
    console.log('------------------------------------------------------------');
    console.log(text || html);
    console.log('============================================================\n');
    return { mock: true, delivered: true };
  }

  // Production SMTP dispatcher placeholder
  return { delivered: true };
};

module.exports = sendEmail;
