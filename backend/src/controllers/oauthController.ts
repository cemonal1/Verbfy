import { Request, Response } from 'express';
import User from '../models/User';
import { signAccessToken, signRefreshToken } from '../utils/jwt';

// Local helper: set refresh cookie (copy from authController)
const setRefreshTokenCookie = (res: Response, token: string) => {
  const cookieDomain = process.env.COOKIE_DOMAIN || undefined;
  res.cookie('refreshToken', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'none',
    path: '/api/auth',
    domain: cookieDomain,
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
};

type Provider = 'google' | 'outlook' | 'apple';

function getProviderConfig(provider: Provider) {
  switch (provider) {
    case 'google':
      return {
        issuer: 'https://accounts.google.com',
        clientId: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        scope: 'openid email profile',
      };
    case 'outlook':
      return {
        issuer: 'https://login.microsoftonline.com/common/v2.0',
        clientId: process.env.MS_CLIENT_ID || process.env.AZURE_AD_CLIENT_ID,
        clientSecret: process.env.MS_CLIENT_SECRET || process.env.AZURE_AD_CLIENT_SECRET,
        scope: 'openid email profile offline_access',
      };
    case 'apple':
      return {
        issuer: 'https://appleid.apple.com',
        clientId: process.env.APPLE_CLIENT_ID,
        clientSecret: process.env.APPLE_CLIENT_SECRET, // expected to be pre-generated JWT
        scope: 'openid email name',
      };
    default:
      return null;
  }
}

function getBaseUrl(req: Request): string {
  // Prefer configured backend URL; fallback to request headers
  const fromEnv = process.env.BACKEND_URL || process.env.API_BASE_URL || '';
  if (fromEnv) return fromEnv.replace(/\/$/, '');
  const proto = (req.headers['x-forwarded-proto'] as string) || req.protocol;
  const host = req.get('host');
  return `${proto}://${host}`;
}

export const oauthInit = async (req: Request, res: Response): Promise<void> => {
  try {
    const provider = (req.params.provider || 'google') as Provider;
    const cfg = getProviderConfig(provider);
    if (!cfg || !cfg.clientId || !cfg.clientSecret) {
      res.status(501).json({ success: false, message: 'OAuth not configured in this environment' });
      return;
    }

    const { Issuer, generators } = require('openid-client');
    const issuer = await Issuer.discover(cfg.issuer);
    const client = new issuer.Client({
      client_id: cfg.clientId,
      client_secret: cfg.clientSecret,
      redirect_uris: [`${getBaseUrl(req)}/api/auth/oauth/${provider}/callback`],
      response_types: ['code'],
    });

    const state = generators.state();
    const nonce = generators.nonce();
    res.cookie(`oauth_state_${provider}`, state, { httpOnly: true, sameSite: 'lax', maxAge: 10 * 60 * 1000 });
    res.cookie(`oauth_nonce_${provider}`, nonce, { httpOnly: true, sameSite: 'lax', maxAge: 10 * 60 * 1000 });

    const authUrl = client.authorizationUrl({
      scope: cfg.scope,
      state,
      nonce,
      prompt: 'select_account',
    });

    return res.redirect(authUrl);
  } catch (err) {
    console.error('OAuth init error:', err);
    res.status(500).json({ success: false, message: 'OAuth init failed' });
      return;
  }
};

export const oauthCallback = async (req: Request, res: Response): Promise<void> => {
  try {
    const provider = (req.params.provider || 'google') as Provider;
    const cfg = getProviderConfig(provider);
    if (!cfg || !cfg.clientId || !cfg.clientSecret) {
      res.status(501).send('<script>window.close()</script>');
      return;
    }

    const { Issuer } = require('openid-client');
    const issuer = await Issuer.discover(cfg.issuer);
    const client = new issuer.Client({
      client_id: cfg.clientId,
      client_secret: cfg.clientSecret,
      redirect_uris: [`${getBaseUrl(req)}/api/auth/oauth/${provider}/callback`],
      response_types: ['code'],
    });

    const stateCookie = req.cookies?.[`oauth_state_${provider}`];
    if (!stateCookie || stateCookie !== req.query.state) {
      res.status(400).send('Invalid state');
      return;
    }

    const params = client.callbackParams(req);
    const tokenSet = await client.callback(`${getBaseUrl(req)}/api/auth/oauth/${provider}/callback`, params, {
      state: stateCookie,
      nonce: req.cookies?.[`oauth_nonce_${provider}`],
    });

    const userinfo = await client.userinfo(tokenSet);
    const email: string | undefined = userinfo.email;
    const name: string = (userinfo.name as string) || (userinfo.given_name ? `${userinfo.given_name} ${userinfo.family_name || ''}`.trim() : 'User');

    if (!email) {
      res.status(400).send('Email permission is required');
      return;
    }

    // Find or create user
    let user = await User.findOne({ email });
    if (!user) {
      // OAuth signup defaults to student; teacher upgrade requires admin approval via separate flow
      user = await User.create({ name, email, password: 'oauth__placeholder', role: 'student', isApproved: true, approvalStatus: 'approved' });
    }

    const accessToken = signAccessToken({ id: user._id, name: user.name, email: user.email, role: user.role });
    const refreshToken = signRefreshToken({ id: user._id, version: user.refreshTokenVersion });
    setRefreshTokenCookie(res, refreshToken);
    const cookieDomain = process.env.COOKIE_DOMAIN || undefined;
    res.cookie('accessToken', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'none',
      path: '/',
      domain: cookieDomain,
      maxAge: 60 * 60 * 1000,
    });

    // Send data back to the opener window and close popup
    const origin = (process.env.FRONTEND_URL || '').replace(/\/$/, '');
    const extraOrigins = (process.env.CORS_EXTRA_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean);
    const allowedOrigins = [origin, ...extraOrigins].filter(Boolean);
    
    const payload = {
      type: 'oauth-success',
      token: accessToken,
      user: { id: user._id, _id: user._id, name: user.name, email: user.email, role: user.role },
    };
    
    // Serve minimal HTML with nonce-based CSP
    const nonce = res.locals.cspNonce || '';
    try { res.removeHeader('Content-Security-Policy'); } catch (_) {}
    res.set('Content-Type', 'text/html');
    res.set('Content-Security-Policy', `default-src 'self'; script-src 'self' 'nonce-${nonce}'; style-src 'self'; frame-ancestors 'self'; object-src 'none';`);

    const html = `<!DOCTYPE html>
      <html><head><meta charset="utf-8"/></head>
      <body>
        <script nonce="${nonce}">
          try {
            const payload = ${JSON.stringify(payload)};
            const allowedOrigins = ${JSON.stringify(allowedOrigins)};
            if (window.opener) {
              // Validate origin before sending message
              const targetOrigin = window.opener.location.origin;
              if (allowedOrigins.includes(targetOrigin)) {
                window.opener.postMessage(payload, targetOrigin);
              } else {
                console.warn('OAuth callback: Invalid target origin:', targetOrigin);
              }
            }
            window.close();
          } catch (e) {
            console.error('OAuth callback error:', e);
            window.close();
          }
        </script>
      </body></html>`;
    res.send(html);
      return;
  } catch (err) {
    console.error('OAuth callback error:', err);
    try { res.removeHeader('Content-Security-Policy'); } catch (_) {}
    res.set('Content-Type', 'text/html');
    const payload = { type: 'oauth-error', message: 'OAuth callback failed' };
    const html = `<!DOCTYPE html>
      <html><head><meta charset="utf-8"/></head>
      <body>
        <div id="payload" data-json='${JSON.stringify(payload).replace(/'/g, '&#39;')}'></div>
        <script src="/api/auth/oauth/relay.js"></script>
      </body></html>`;
    res.status(500).send(html);
      return;
  }
};


