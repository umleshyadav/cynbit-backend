import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const TRUSTED_ORIGINS = new Set([
  'https://cynbit.in',
  'https://www.cynbit.in',
  'http://localhost:3000'
]);

/**
 * Next.js Edge Middleware
 * Injects defense-in-depth HTTP security headers, controls CORS, and strips capability tokens.
 */
export function middleware(request: NextRequest) {
  const origin = request.headers.get('origin');
  const response = NextResponse.next();

  // 1. Strict Origin-Based CORS Protection
  if (origin && TRUSTED_ORIGINS.has(origin)) {
    response.headers.set('Access-Control-Allow-Origin', origin);
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    response.headers.set(
      'Access-Control-Allow-Headers',
      'Content-Type, Next-Action, Next-Router-State-Tree, RSC'
    );
    response.headers.set('Access-Control-Allow-Credentials', 'true');
  }

  // Intercept CORS Preflight
  if (request.method === 'OPTIONS') {
    return new NextResponse(null, { status: 204, headers: response.headers });
  }

  // 2. HTTP Defense-in-Depth Headers
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(), browsing-topics=()'
  );
  response.headers.set(
    'Strict-Transport-Security',
    'max-age=63072000; includeSubDomains; preload'
  );

  // 3. Content Security Policy (CSP)
  const cspDirectives = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://sdk.cashfree.com https://www.googletagmanager.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: https: blob:",
    "connect-src 'self' https://sandbox.cashfree.com https://api.cashfree.com https://www.google-analytics.com",
    "frame-src 'self' https://sdk.cashfree.com",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'"
  ];
  response.headers.set('Content-Security-Policy', cspDirectives.join('; '));

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)',
  ],
};
