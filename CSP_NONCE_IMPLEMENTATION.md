# Content Security Policy (CSP) Nonce-Based Implementation

## Overview

This document describes the implementation of nonce-based Content Security Policy (CSP) to replace the insecure `'unsafe-inline'` directive across the Verbfy platform.

## What Changed

### Security Improvement

**Before**: CSP used `'unsafe-inline'` for both `script-src` and `style-src` directives, which weakens XSS protection.

**After**: CSP uses cryptographically secure nonces for inline scripts and styles, providing strong XSS protection while maintaining functionality.

## Implementation Details

### Backend (Express API)

#### 1. CSP Nonce Middleware (`backend/src/middleware/cspNonce.ts`)

**Purpose**: Generate and attach CSP nonces to each request

**Key Features**:
- Generates cryptographically secure 16-byte nonces using `crypto.randomBytes()`
- Attaches nonce to `res.locals.cspNonce` for use in views/templates
- Exposes nonce via `X-CSP-Nonce` header for client-side access
- Provides `buildCSPWithNonce()` function to generate CSP strings

**Usage**:
```typescript
import { cspNonceMiddleware, buildCSPWithNonce } from './middleware/cspNonce';

// Apply middleware before helmet
app.use(cspNonceMiddleware);

// In routes/controllers
const nonce = res.locals.cspNonce;
const cspString = buildCSPWithNonce(nonce);
```

#### 2. Updated Files

**`backend/src/index.ts`**:
- Added `cspNonceMiddleware` before helmet
- Removed `'unsafe-inline'` from CSP directives
- Updated OAuth route to use nonce-based CSP

**`backend/src/config/security.ts`**:
- Removed `'unsafe-inline'` from `scriptSrc` and `styleSrc`
- Added comments explaining nonce-based approach
- Added `'unsafe-eval'` only for development mode

**`backend/src/config/production.ts`**:
- Removed `'unsafe-inline'` from production CSP configuration
- Added additional security directives (`baseUri`, `frameAncestors`)

**`backend/src/controllers/oauthController.ts`**:
- Updated OAuth callback HTML to use nonce attribute: `<script nonce="${nonce}">`
- Updated CSP header to use `'nonce-${nonce}'` instead of `'unsafe-inline'`

### Frontend (Next.js)

#### 1. Next.js Middleware (`verbfy-app/middleware.ts`)

**Purpose**: Generate CSP nonces for SSR mode

**Key Features**:
- Generates nonces for each SSR request
- Builds CSP header with nonce support
- Uses CSP Report-Only mode in development for testing
- Skips static assets and API routes

**CSP Directives**:
- `script-src`: `'self'`, `'nonce-{nonce}'`, trusted CDNs
- `style-src`: `'self'`, `'nonce-{nonce}'`, trusted CDNs
- Development: Includes `'unsafe-eval'` for hot reload
- Production: Strict CSP enforcement

#### 2. Updated Document (`verbfy-app/pages/_document.tsx`)

**Changes**:
- Extended `Document` class to support `getInitialProps`
- Retrieves nonce from `X-CSP-Nonce` header
- Passes nonce to `<Head>` and `<NextScript>` components
- Supports both SSR mode (with nonces) and static export mode (without nonces)

**Usage**:
```tsx
<Head nonce={nonce}>
  {/* Head content */}
</Head>
<body>
  <Main />
  <NextScript nonce={nonce} />
</body>
```

## Deployment Modes

### 1. SSR Mode (Recommended for Production)

- **Environment**: `NODE_ENV=production` (without `NEXT_STATIC_EXPORT=true`)
- **CSP**: Nonce-based (strong protection)
- **How it works**: Middleware generates nonces for each request
- **Benefit**: Full XSS protection

### 2. Static Export Mode

- **Environment**: `NEXT_STATIC_EXPORT=true`
- **CSP**: External stylesheets only (Tailwind CSS)
- **How it works**: No inline styles, all CSS in static files
- **Limitation**: No nonces (static HTML can't have unique nonces)
- **Benefit**: Can be deployed to CDN/static hosting

## Security Benefits

1. **XSS Protection**: Nonces prevent execution of unauthorized inline scripts/styles
2. **No Inline Scripts**: All inline scripts must have the correct nonce
3. **Unique Per Request**: Each nonce is cryptographically unique and one-time use
4. **Defense in Depth**: Even if an attacker injects content, it won't execute without the nonce

## Testing

### Backend Tests

```bash
cd backend
npm test -- src/__tests__/security/
```

### Frontend Tests

```bash
cd verbfy-app
# Test SSR mode
npm run build
npm start

# Test static export mode
NEXT_STATIC_EXPORT=true npm run build
```

### Manual CSP Validation

1. **Check CSP Headers**:
```bash
curl -I https://verbfy.com
# Look for Content-Security-Policy header
```

2. **Browser Developer Tools**:
- Open DevTools → Console
- Look for CSP violations (should be none)
- Check Network tab → Response Headers → Content-Security-Policy

3. **CSP Evaluator**:
- Visit: https://csp-evaluator.withgoogle.com/
- Paste your CSP header
- Verify no warnings about `'unsafe-inline'`

## Rollback Plan

If CSP nonce implementation causes issues:

1. **Quick Rollback** (not recommended):
```typescript
// In backend/src/index.ts
const cspDirectives = {
  scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
  styleSrc: ["'self'", "'unsafe-inline'"],
  // ... rest
};
```

2. **Proper Fix**: Identify and fix the specific inline script/style causing issues

## Monitoring

Monitor CSP violations using:

1. **Browser Console**: Check for CSP violation errors
2. **Sentry**: Automatically captures CSP violations in production
3. **Server Logs**: Check Pino logs for CSP-related errors

## References

- [MDN: Content Security Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP)
- [CSP: script-src](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Security-Policy/script-src)
- [CSP Nonces](https://content-security-policy.com/nonce/)
- [OWASP: XSS Prevention](https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html)

## Files Modified

### Backend
- ✅ `backend/src/middleware/cspNonce.ts` (new)
- ✅ `backend/src/index.ts`
- ✅ `backend/src/config/security.ts`
- ✅ `backend/src/config/production.ts`
- ✅ `backend/src/controllers/oauthController.ts`

### Frontend
- ✅ `verbfy-app/middleware.ts` (new)
- ✅ `verbfy-app/pages/_document.tsx`

### Documentation
- ✅ `CSP_NONCE_IMPLEMENTATION.md` (this file)

## Verification Checklist

- [x] All `'unsafe-inline'` removed from backend CSP
- [x] All `'unsafe-inline'` removed from frontend CSP
- [x] Nonce middleware generates cryptographically secure nonces
- [x] OAuth callback uses nonce for inline scripts
- [x] Next.js middleware generates nonces for SSR
- [x] _document.tsx passes nonces to components
- [x] Development mode allows `'unsafe-eval'` for hot reload
- [x] Production mode enforces strict CSP
- [x] Documentation complete

## Support

For questions or issues:
1. Check browser console for CSP violations
2. Review server logs for CSP-related errors
3. Test with CSP Report-Only mode first
4. Contact security team if issues persist
