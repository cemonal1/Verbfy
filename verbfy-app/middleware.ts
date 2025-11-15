import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import crypto from 'crypto';

/**
 * Next.js middleware for CSP nonce generation
 *
 * This middleware runs before SSR and generates a cryptographically
 * secure nonce for Content Security Policy headers.
 *
 * Note: This only works in SSR mode. For static export, the app
 * falls back to external CSS files which don't require unsafe-inline.
 */
export function middleware(request: NextRequest) {
  // Skip middleware for static assets and API routes
  if (
    request.nextUrl.pathname.startsWith('/_next') ||
    request.nextUrl.pathname.startsWith('/api') ||
    request.nextUrl.pathname.match(/\.(jpg|jpeg|png|gif|svg|ico|webp|woff|woff2|ttf|eot)$/i)
  ) {
    return NextResponse.next();
  }

  // Generate cryptographically secure nonce
  const nonce = crypto.randomBytes(16).toString('base64');

  // Clone the request headers
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('X-CSP-Nonce', nonce);

  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  // Build CSP header with nonce
  const isDev = process.env.NODE_ENV !== 'production';

  const cspDirectives = [
    "default-src 'self'",
    `script-src 'self' ${isDev ? "'unsafe-eval'" : ''} 'nonce-${nonce}' https://*.sentry-cdn.com https://cdn.jsdelivr.net https://unpkg.com https://*.google.com https://*.googleapis.com https://*.gstatic.com https://*.facebook.net https://*.facebook.com`,
    `style-src 'self' 'nonce-${nonce}' https://fonts.googleapis.com https://cdn.jsdelivr.net https://unpkg.com https://cdnjs.cloudflare.com`,
    "font-src 'self' https://fonts.gstatic.com https://cdnjs.cloudflare.com data:",
    `img-src 'self' data: blob: https: ${isDev ? 'http:' : ''}`,
    `connect-src 'self' https://api.verbfy.com https://livekit.verbfy.com wss://livekit.verbfy.com https://o4507902343495680.ingest.sentry.io ${isDev ? 'http://localhost:* ws://localhost:* wss://localhost:*' : ''}`,
    "frame-src 'self' https://accounts.google.com https://www.facebook.com",
    "object-src 'none'",
    "media-src 'self' blob: https:",
    "worker-src 'self' blob:",
    "child-src 'self' blob:",
    "form-action 'self' https://accounts.google.com https://www.facebook.com",
    "base-uri 'self'",
    "frame-ancestors 'none'",
  ].filter(Boolean).join('; ');

  // Set CSP header (report-only in development, enforce in production)
  if (isDev) {
    response.headers.set('Content-Security-Policy-Report-Only', cspDirectives);
  } else {
    response.headers.set('Content-Security-Policy', cspDirectives);
  }

  // Pass nonce to the response for use in _document.tsx
  response.headers.set('X-CSP-Nonce', nonce);

  return response;
}

// Apply middleware to all routes except static files
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files
     */
    '/((?!_next/static|_next/image|favicon.ico|icons|manifest.json|.*\\.(?:jpg|jpeg|png|gif|svg|ico|webp|woff|woff2|ttf|eot)).*)',
  ],
};
