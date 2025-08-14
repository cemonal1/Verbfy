import { Request, Response } from 'express';
import User from '../models/User';
import { signAccessToken, signRefreshToken } from '../utils/jwt';

// Local helper: set refresh cookie (copy from authController)
const setRefreshTokenCookie = (res: Response, token: string) => {
  res.cookie('refreshToken', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/api/auth',
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

export const oauthInit = async (req: Request, res: Response) => {
  try {
    const provider = (req.params.provider || 'google') as Provider;
    const cfg = getProviderConfig(provider);
    if (!cfg || !cfg.clientId || !cfg.clientSecret) {
      return res.status(501).json({ success: false, message: 'OAuth not configured in this environment' });
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
    return res.status(500).json({ success: false, message: 'OAuth init failed' });
  }
};

export const oauthCallback = async (req: Request, res: Response) => {
  try {
    const provider = (req.params.provider || 'google') as Provider;
    const cfg = getProviderConfig(provider);
    if (!cfg || !cfg.clientId || !cfg.clientSecret) {
      return res.status(501).send('<script>window.close()</script>');
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
      return res.status(400).send('Invalid state');
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
      return res.status(400).send('Email permission is required');
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
    res.cookie('accessToken', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: 60 * 60 * 1000,
    });

    // Send data back to the opener window and close popup
    const origin = (process.env.FRONTEND_URL || '').replace(/\/$/, '');
    const payload = {
      type: 'oauth-success',
      token: accessToken,
      user: { id: user._id, _id: user._id, name: user.name, email: user.email, role: user.role },
    };
    const script = `
      (function(){
        try {
          if (window.opener) {
            window.opener.postMessage(${JSON.stringify(payload)}, '*');
          }
        } catch(e) {}
        window.close();
      })();
    `;
    res.set('Content-Type', 'text/html');
    return res.send(`<html><body><script>${script}</script></body></html>`);
  } catch (err) {
    console.error('OAuth callback error:', err);
    return res.status(500).send('<script>window.close()</script>');
  }
};


