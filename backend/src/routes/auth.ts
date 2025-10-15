import { Router } from 'express';
import { register, login, getTeachers, refreshToken, logout, me, requestEmailVerification, verifyEmail, forgotPassword, resetPassword } from '../controllers/authController';
import { passwordResetLimiter, authLimiter } from '../middleware/rateLimit';
import { oauthInit, oauthCallback } from '../controllers/oauthController';
import { createTempAdmin } from '../controllers/adminController';
import { Request, Response } from 'express';
import * as path from 'path';
import * as fs from 'fs';

const router = Router();

// Serve a tiny same-origin JS file used by the OAuth callback page to avoid inline scripts
// IMPORTANT: This must be declared BEFORE the parameterized "/oauth/:provider" route,
// otherwise "/oauth/relay.js" would match as provider="relay.js" and return 501.
router.get('/oauth/relay.js', (req, res) => {
  try { res.removeHeader('Content-Security-Policy'); } catch (_) {}
  res.set('Content-Type', 'application/javascript; charset=utf-8');
  const js = `(() => {
    try {
      var el = document.getElementById('payload');
      var json = el ? el.getAttribute('data-json') : null;
      var data = {};
      try { data = json ? JSON.parse(json) : {}; } catch (e) {}
      if (window.opener) {
        window.opener.postMessage(data, '*');
      }
    } catch (e) {}
    try { window.close(); } catch (e) {}
  })();`;
  res.send(js);
});

router.post('/register', register);
router.post('/login', login);
router.post('/create-temp-admin', createTempAdmin);
router.post('/refresh-token', refreshToken);
router.post('/refresh', refreshToken); // alias for clients expecting /refresh
router.post('/logout', logout);
router.get('/me', me);
router.get('/profile', me);
router.get('/teachers', getTeachers);
// OAuth providers
router.get('/oauth/:provider', oauthInit);
router.get('/oauth/:provider/callback', oauthCallback);

// Email verification
router.post('/verify-email/request', authLimiter, requestEmailVerification);
router.get('/verify-email/confirm', verifyEmail);

// Password reset
router.post('/password/forgot', passwordResetLimiter, forgotPassword);
router.post('/password/reset', passwordResetLimiter, resetPassword);

export default router;