const { OAuth2Client } = require('google-auth-library');
const env = require('../config/env');

let client = null;

/**
 * Verifies a Google Identity Services ID token (the `credential` from the sign-in button)
 * against GOOGLE_CLIENT_ID and returns its payload (email, email_verified, name, picture, sub).
 * Throws if the token is invalid, expired or issued for another client.
 * Kept on this module object so tests can replace it with a mock.
 */
const googleAuth = {
  isConfigured: () => Boolean(env.googleClientId),
  verifyIdToken: async (idToken) => {
    if (!client) client = new OAuth2Client(env.googleClientId);
    const ticket = await client.verifyIdToken({ idToken, audience: env.googleClientId });
    return ticket.getPayload();
  }
};

module.exports = googleAuth;
