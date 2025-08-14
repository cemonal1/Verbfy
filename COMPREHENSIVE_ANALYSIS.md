## Verbfy Comprehensive Project Analysis (Current State)

### Executive Summary
Verbfy is a premium online English learning platform with a full-stack architecture: Next.js (Pages Router, TypeScript, Tailwind) for the frontend and Node.js/Express with MongoDB (Mongoose) for the backend. It implements secure authentication with JWT and refresh tokens, OAuth (Google/Microsoft/Apple scaffolding via OpenID Connect), role-based access control (Student, Teacher, Admin), email verification, password reset, rate limiting, security headers, Stripe payments, Socket.IO-based realtime communications, and LiveKit-based audio/video. The project follows an MVVM-inspired frontend structure (feature-based view + viewmodel) and an organized backend with controllers/routes/services/middlewares/models.

This document describes the codebase in detail: architecture, directory structure, core flows, security posture, observability, deployment, and a prioritized list of improvements/risks. It reflects all recent changes, including teacher-side schedule/materials enhancements, admin bulk approval/rejection, i18n expansion, Sentry integration, cookie-based auth compatibility, and new student-facing pages.

---

## High-Level Architecture
- Frontend: `verbfy-app`
  - Next.js 14 Pages Router, TypeScript, TailwindCSS
  - Feature-based organization with MVVM style (`features/.../view`, `.../viewmodel`)
  - Contexts for Auth/Chat/Notifications
  - Axios-based `src/lib/api.ts` with a unified `NEXT_PUBLIC_API_BASE_URL`, `withCredentials: true`, request/response interceptors, and secure token handling via `tokenStorage`
  - Sentry client/server init, language i18n provider (en/tr)
  - LiveKit integration (dynamic import), Socket.IO usage in contexts

- Backend: `backend`
  - Express + Mongoose (MongoDB)
  - Controllers/Routes/Services/Middlewares/Models organized under `src`
  - Security: `helmet` with CSP, `express-rate-limit` (auth/api), cookie-based token fallback in auth middleware, `cors` with credentials enabled
  - Sentry initialization, Pino structured logging (pino-http)
  - Stripe integration, Nodemailer for SMTP
  - Socket.IO w/ JWT auth middleware, LiveKit config
  - Email verification/password reset flows, teacher approval workflow stubs

- Shared/Operational
  - Docker, docker-compose, Nginx reverse proxy, deployment scripts
  - Environment sample files (frontend and backend)
  - Extensive docs for stages and implementations

---

## Repository Structure and Roles

### Root
- Deployment resources: `docker-compose*.yml`, `nginx/nginx.conf`, `deploy-*.sh`, Windows `.bat` scripts
- Documentation: numerous project phase reports and implementation guides
- Top-level scripts: `start-dev.*`, `start-livekit.*`

### Backend (`backend/`)
- `src/index.ts`: main server entry; sets up Express, CORS (with credentials), Helmet (CSP allowing LiveKit/dev), Sentry request/error handlers, Pino logging, rate limiters (auth/api), routes, static files; attaches Socket.IO and its JWT auth middleware (verifies tokens on connection)
- `src/config`: MongoDB connect (`db.ts`), production env (`production.ts`), LiveKit config (`livekit.ts`)
- `src/controllers`: REST controllers including auth, users, materials, payments, reservations, chat, AI learning/content, analytics, notifications, organizations, admin, teacher analytics, LiveKit, CEFR tests, etc.
  - Auth controller: register/login/logout/me/refresh + email verification (request/confirm) + password reset (forgot/reset)
  - OAuth controller (standardized refresh cookie set)
  - User controller: profile ops + S3 presigned PUT URLs for upload
  - Admin controller: audit logging (fixed `createLog` → `create`), user/material moderation endpoints
  - Many domain controllers (materials, verbfy lessons/talk, etc.)
- `src/routes`: route files mapping controllers to REST endpoints. Notable: `auth.ts` adds `/verify-email/request`, `/verify-email/confirm`, `/password/forgot`, `/password/reset`, `GET /refresh`. User routes include `/uploads/presign`.
- `src/middleware`: `auth.ts` supports `Authorization` header or `req.cookies.accessToken` (for `httpOnly` cookie token), `errorHandler.ts` central error handling
- `src/models`: Mongoose schemas (User includes `emailVerified`, `emailVerificationToken`, `...Expires`, `passwordReset...`, indices)
- `src/services`: e.g., availability/reservation/livekit logic
- `src/lib/stripe.ts`: stripe init
- `src/socketServer.ts`: Socket.IO server helpers
- Testing: `src/__tests__` incl. auth email test cases, plus integration tests

### Frontend (`verbfy-app/`)
- Pages (Pages Router) with role-based routes for student/teacher/admin; new student flows and teacher/admin enhancements implemented
- `src/components`: shared/layout/livekit/materials/payment/notification/admin UI components, etc.
- `src/features`: MVVM-style features; e.g., `auth/view` + `auth/viewmodel`, chat viewmodel, lesson rooms, AI features, CEFR testing, etc.
- `src/context`: `AuthContext` (cookie token tolerant + `emailVerified`), `ChatContext`, `NotificationContext` (Socket.IO with tokenStorage), Admin context, etc.
- `src/lib/api.ts`: Axios instance with `baseURL = NEXT_PUBLIC_API_BASE_URL`, `withCredentials: true`, request auth header via secure storage, typed convenience APIs for materials, users, reservations, availability, notifications, messages, analytics, payments, admin, VerbfyTalk, free materials, lessons, CEFR tests, curriculum, achievements, study groups, AI learning, adaptive learning, teacher analytics
- `src/lib/i18n.tsx`: lightweight i18n with `I18nProvider` and `useI18n`, persistent `locale` to localStorage; dictionaries with EN/TR expanded for landing/auth/home/nav/dashboard/teachers/materials/talk + new admin/teacher keys
- Sentry: `sentry.client.config.ts`, `sentry.server.config.ts`, `next.config.js` wrapped by `withSentryConfig` (warning: add `sentry.edge.config.ts` for Edge features, set `hideSourceMaps` for prod privacy)
- Tailwind config, global styles, tests (`src/__tests__`) units/integration for auth flows, error boundaries, performance

---

## Core Backend Flows and Details

### Authentication & Authorization
- Registration: sets `emailVerified: false`; sends verification email (Nodemailer). Password policy enforces at least 8 characters (validated in controller/route-level logic).
- Login: issues access token and refresh token; production encourages `httpOnly` cookies (backend supports cookie in auth middleware). `GET /api/auth/me` returns user with `emailVerified`.
- Refresh: endpoint alias `GET /api/auth/refresh` plus default `POST /refresh` supported in routes.
- Email Verification: `POST /api/auth/verify-email/request`, `POST /api/auth/verify-email/confirm` consumes token; user model includes tokens+expiry and indices.
- Password Reset: `POST /api/auth/password/forgot` and `POST /api/auth/password/reset` with token; expires managed in model.
- OAuth: `openid-client` integration scaffolding; controller sets refresh token cookie consistently.
- RBAC: `auth` middleware checks token (header or cookie) then role-check guards on routes.
- Rate Limiting: `authLimiter` for auth-sensitive routes, `apiLimiter` for general; health endpoint excluded.
- Security Headers: `helmet` with environment-controlled CSP; includes LiveKit domains and dev relaxations when needed.
- CORS: credentialed requests allowed; `Access-Control-Allow-Credentials` used; exposes `set-cookie` when relevant.

### Realtime & Media
- Socket.IO: server attached in `index.ts`, JWT verified in `io.use` middleware. Contexts on FE connect with token from secure storage.
- LiveKit: `config/livekit.ts` + server controller; frontend uses `components/livekit/LiveKitRoom` via dynamic import; join endpoints return token/url to FE (type-narrowed in usage to handle variants).

### Payments (Stripe)
- `src/lib/stripe.ts` standardizes initialization. Controllers/routes handle session creation, payment history, products, stats, webhook handling (verify presence and ensure signing secrets on server). Admin payments page can refund a payment via admin API.

### Materials & Uploads
- Free materials endpoints for listing/filtering, featured, categories/levels, CRUD with multipart uploads; ratings; download endpoints return Blob.
- S3 presigned uploads: `users/uploads/presign` issues PUT URLs; teacher onboarding material uploads (CV/intro video) possible via presigned flow.

### Analytics & AI Features
- Teacher analytics, admin analytics, performance dashboards; AI learning sessions and tutoring/messages; content generation/review flows exist with controller scaffolding and APIs.

### Error Handling & Logging
- Global error handler middleware; uniform JSON error structure.
- Pino/pino-http adds structured request logs; ensure rotating/centralized logs in production.

### Testing (Backend)
- Unit tests for auth email flows (`auth-email.test.ts`); integration tests for API endpoints. Extend coverage for OAuth, Stripe webhooks, reservations, availability, and RBAC-edge cases.

---

## Core Frontend Flows and Details

### Authentication (FE)
- `AuthContext` handles login/register/logout; tolerant of `httpOnly` cookies (no local token writes in prod). `emailVerified` state displayed in `profile` with resend button. Forgot/Reset/Verify pages implemented and tested.
- Social buttons present in login/register UIs; backend OAuth flows wired; ensure redirect URIs and provider secrets in env.

### Navigation & Role-Based Pages
- Student: `home`, `teachers` (list), `teachers/[id]` (detail + availability grid + booking via `reservationAPI`), `reservations`, `free-materials` (list/detail), `verbfy-talk` (lobby/detail)
- Teacher: `teacher/schedule` (add/edit/delete availability), `teacher/students` (list), `teacher/materials` (list + upload + edit modal + preview + delete), `teacher/earnings`
- Admin: `admin/users` (pending teacher approvals + all users with role/status change + bulk approve/reject), `admin/materials` (search/filter, approve/unapprove, delete), `admin/payments` (status filters, refund), `admin/logs` (search/pagination with metadata preview)

### Feature Layering (MVVM)
- Views under `features/*/view` are presentational; `viewmodel` encapsulates state and business logic bridging API → view.
- Shared `components` (e.g., `layout/DashboardLayout`, materials UI, notifications) maintain reusable patterns.

### API Client
- `src/lib/api.ts` centralizes all HTTP calls with typed method clusters (materials, auth, user, reservation, availability, notifications, messages, analytics, payments, admin, verbfy talk, free materials, lessons, cefr, curriculum, achievements, study groups, AI learning, adaptive learning, teacher analytics). All use `NEXT_PUBLIC_API_BASE_URL` and `withCredentials: true`. Interceptors add Bearer when available and redirect to `/login` on 401.

### i18n
- `I18nProvider` with `useI18n()` and message dictionaries for EN/TR; persistent locale; auto-TR for `navigator.language=tr-*`. Dictionaries expanded for all newly added pages and admin actions.

### Realtime & AV
- Socket.IO in `NotificationContext`/`ChatContext` authenticates via secure token storage; LiveKit room UI loaded dynamically to avoid SSR constraints; room join obtains token/url then renders `LiveKitRoom`.

### Testing (Frontend)
- Tests for verify-email, forgot-password, reset-password flows; error boundary; performance/perf dashboards; login viewmodel tests.

---

## Security Posture
- Strong auth patterns: JWT access + refresh; support for `httpOnly` cookies in production; `auth` middleware reads cookie if header missing.
- Rate limiting (`express-rate-limit`) applied to auth/api; consider per-ip and per-endpoint customizations.
- Helmet with CSP; dev relaxations (`unsafe-eval`) only in development; connectSrc includes LiveKit.
- CORS with credentials and explicit allowed origin; expose `set-cookie` header; verify allowed origins in production.
- Email verification/password reset tokens stored with expiry; indices present on token fields.
- Stripe webhooks should be verified (ensure signing secrets and raw body middleware in production).
- Potential hardening: CSRF tokens for state-changing requests in cookie-auth mode; consistent 2FA option in future; secrets from vault/KMS; enhanced content-security policy for analytics/scripts; 

---

## Observability & Logging
- Sentry integrated (client/server); warning suggests adding `sentry.edge.config.ts` for Edge runtime usage and `hideSourceMaps: true` to avoid exposing source maps.
- Pino structured logging on backend; consider adding correlation IDs/tracing; set proper log levels per environment.

---

## Deployment & Environments
- Dockerfiles and docker-compose for staging/production variants; Nginx reverse proxy present.
- Scripts: `deploy-*.sh` and Windows batch equivalents.
- Environment variables across FE/BE include (non-exhaustive):
  - Backend: `PORT`, `MONGO_URI`, `JWT_SECRET`, `JWT_REFRESH_SECRET`, `SMTP_*`, `OAUTH_*` (Google/Microsoft/Apple), `STRIPE_*`, `SENTRY_DSN`, `LIVEKIT_*`, `S3_*` (bucket/region/keys), CORS origin(s), rate limits
  - Frontend: `NEXT_PUBLIC_API_BASE_URL`, `NEXT_PUBLIC_LIVEKIT_*`, `SENTRY_*`
- Post-deploy: enable HTTPS (LetsEncrypt/Certbot), set `Secure` and `SameSite` cookie attributes appropriately, ensure `hideSourceMaps: true` in Sentry config, and configure health checks.

---

## Gaps, Risks, and Recommendations (Prioritized)
1) OAuth Providers (Google/Outlook/Apple)
   - Verify provider configs, redirect URIs, scopes, and token exchange. Add UI fallback/edge cases (denied consent, account linking).
2) CSRF Protection for Cookie-Based Auth
   - Add CSRF tokens or SameSite=strict plus double submit for non-GET requests in production; document CORS implications.
3) Stripe Webhooks
   - Ensure raw-body middleware, robust signature verification, idempotency keys, and clear subscription state transitions.
4) Sentry Edge Runtime
   - Add `sentry.edge.config.ts` and set `hideSourceMaps: true` in `next.config.js` sentry options.
5) Input Validation & Schema Enforcement
   - Use `joi`/Zod at endpoints to validate request bodies/params, especially for auth, payments, uploads, VerbfyTalk room creation, reservations.
6) Consistent API Response Shapes
   - Normalize `{ success, data, pagination }` across endpoints. Some FE code already guards `res.data` vs direct data; aim for one consistent shape.
7) Tests Coverage
   - Expand FE/BE tests for OAuth, Stripe flows, reservation edge cases, availability conflicts, RBAC-guarded routes, Socket.IO flows.
8) Rate Limiting & Abuse Prevention
   - Add route-specific limits (login, password reset, email verify), and add captcha after repeated failures (defense-in-depth).
9) Media & File Handling
   - Enforce MIME checks, size limits, antivirus scanning (if required), and signed URL expiry; use separate buckets/prefixes per type.
10) DB Indexes & Performance
   - Review Mongoose models for missing indexes (e.g., frequently queried fields: email, role, status, createdAt); add TTL indexes for short-lived tokens.
11) Logging & Auditing
   - Expand audit logs for critical admin/teacher actions and attach user/session metadata; centralize logs via ELK/Cloud logging.
12) UX & Accessibility
   - Ensure accessible forms (labels/ids); skeleton/loading states; error toasts; consistent language switching; RTL readiness (if needed).
13) CORS/Origin Policy
   - Lock down allowed origins per environment; avoid wildcards; ensure preflight caching.
14) Secrets Management
   - Move env secrets to secure vault/KMS; avoid committing `.env.*` with real secrets; rotate keys periodically.
15) Task Queue / Emails
   - For reliability, offload email sending and webhook processing to a queue (BullMQ/Redis) to avoid request latency spikes.

---

## Current Feature Coverage Snapshot
- Students: discover teachers, view details/availability, book lessons, see upcoming reservations, access free materials, join VerbfyTalk.
- Teachers: manage schedule (add/edit/delete slots), manage materials (upload/edit/preview/delete), view students, earnings stats.
- Admin: approve/reject teacher applications (bulk), manage users (roles/status), moderate materials, manage/refund payments, view audit logs.
- Auth: register/login, email verification, password reset, OAuth scaffolding; secure cookie support.
- Realtime & AV: Socket-based notifications/chat, LiveKit rooms.
- Observability: Sentry client/server; structured logs.
- Security: rate limiting, helmet CSP, CORS with credentials, token expiry/rotation.

---

## Environment Checklist (Condensed)
- Backend
  - `PORT`, `MONGO_URI`
  - `JWT_SECRET`, `JWT_REFRESH_SECRET`
  - `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`
  - `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI`
  - `MICROSOFT_CLIENT_ID`, `MICROSOFT_CLIENT_SECRET`, `MICROSOFT_REDIRECT_URI`
  - `APPLE_CLIENT_ID`, `APPLE_TEAM_ID`, `APPLE_KEY_ID`, `APPLE_PRIVATE_KEY`, `APPLE_REDIRECT_URI`
  - `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`
  - `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`, `S3_REGION`, `S3_BUCKET`
  - `LIVEKIT_URL`, `LIVEKIT_API_KEY`, `LIVEKIT_API_SECRET`
  - `SENTRY_DSN`, `SENTRY_ENV`
  - `CORS_ORIGIN`
- Frontend
  - `NEXT_PUBLIC_API_BASE_URL`
  - `NEXT_PUBLIC_LIVEKIT_URL`
  - `SENTRY_DSN`, `SENTRY_ENV`, `SENTRY_ORG`, `SENTRY_PROJECT` (build-time)

---

## Actionable Next Steps
1) Implement CSRF strategy and lock down CORS in production; test cookie flows thoroughly.
2) Finalize OAuth provider configs and FE redirects; add tests.
3) Harden Stripe webhook processing and subscription lifecycle; add e2e tests.
4) Normalize API response envelopes and update FE guards accordingly.
5) Add `sentry.edge.config.ts` and `hideSourceMaps`.
6) Expand input validation at controllers; centralize schemas.
7) Increase test coverage (FE/BE) for newly added teacher/admin flows and VerbfyTalk flows.
8) Add queueing for emails/webhooks and improve audit logging granularity.
9) Review DB indexes and add TTL for tokens; run performance smoke tests.
10) Complete i18n coverage for all pages and admin tooling; add locale toggle globally where missing.

---

## Additional Deep-Dive Sections (New)

### Role & Permissions Matrix
- Roles: Student, Teacher, Admin
- High-level permissions:
  - Student: browse teachers/materials, create reservations, join rooms, take tests, view/pay subscriptions
  - Teacher: manage availability, manage own materials, view assigned students, view earnings
  - Admin: user management (roles/approval), material moderation, payment management/refunds, audit logs, analytics
- Recommendation: codify permissions centrally (enum/constant) and enforce via middleware/guards on each controller route. Add unit tests per protected route.

### Data Model Overview (Selected)
- User: name, email, role, passwordHash (bcrypt), emailVerified, verification/reset tokens (with TTL), profile fields (bio, avatar), teacher application fields (cv, certifications, introVideo)
- Material/FreeMaterial: title, description, category, level, tags, featured, rating stats, file metadata, uploader
- Reservation: studentId, teacherId, startTime, duration, status, price, createdAt
- Availability: teacherId, start, duration, status; enforce non-overlap by compound index and server-side validation
- AuditLog: action, actor, target, metadata, createdAt; add indexes on actor/action/createdAt
- Payment: amount, currency, status, stripePaymentId/intent/subscriptionId, userId, createdAt
- VerbfyTalk Room: name, description, isPrivate, password (hashed), topic, level, maxParticipants, createdBy, participants[]

### Performance & Scalability
- Frontend
  - Enable Next/Image for images and avatars; leverage CDN caching headers via Nginx
  - Code-splitting already present (dynamic import for LiveKit). Consider bundle analysis and vendor chunk trimming
  - Consider ISR/SSG for public pages (landing, free-materials listing) with revalidation
- Backend
  - Connection pooling (Mongoose) set; review poolSize/timeout per environment
  - Add Redis for: rate-limit store, session/blacklist store, queueing (emails/webhooks), cache (teacher lists/materials)
  - Add read-only replicas if read-heavy; ensure Mongoose lean() for read endpoints
- Database
  - Add compound indexes on frequent queries: User(role,status,createdAt), Material(category,level,createdAt), Availability(teacherId,start)
  - Archive policy for logs/payments

### Security Controls (Expanded)
- Passwords: bcrypt with appropriate salt rounds; consider zxcvbn-based strength meter on FE; enforce complexity policy and password history if needed
- Session & Tokens: refresh token rotation; logout-all endpoints; device/session listing in profile
- Cookies: Set `Secure`, `HttpOnly`, `SameSite=Lax/Strict` in production; domain scoping
- CSRF: add CSRF tokens for cookie-auth; exclude pure JSON APIs with appropriate preflight if using double submit
- Nginx: HSTS (includeSubDomains, preload), HTTP/2, gzip/brotli compression, request size limits, upload size caps
- CSP: enumerate scriptSrc/styleSrc/connectSrc; ensure LiveKit, Sentry, Stripe, socket endpoints are included; remove `unsafe-eval` in prod
- CORS: restrict to exact origins per environment; cache preflight
- Webhooks: raw-body verification, idempotency keys, logging + replay protection
- Brute force: incremental backoff/captcha on repeated login/reset attempts

### Realtime & LiveKit Notes
- Socket.IO: configure reconnection/backoff, heartbeat timeouts, room-level auth checks server-side
- LiveKit: ensure TURN servers for NAT traversal in production; token TTL and room ACLs; disallow joining without valid reservation when applicable

### SEO & Accessibility
- Add meta tags/OpenGraph/Twitter cards for landing; sitemap/robots
- Ensure semantic headings, label-for associations (addressed in new forms), focus states, keyboard nav
- Language switch persists; consider `html lang` updates on toggle

### CI/CD & Code Quality
- Add CI pipeline: lint, typecheck, test (FE/BE), build; block on failures
- Add Prettier/ESLint configs; enforce TypeScript strict mode where feasible
- Add commit hooks (lint-staged, husky)

### Privacy, Compliance, and Data Retention
- PII minimization: avoid logging PII, redact emails in logs, structured logging fields
- GDPR: account deletion (erasure) endpoints; export data (portability) upon request
- Data retention: token TTL, log retention periods, backups encryption
- Cookie & privacy policy pages present (terms/privacy), keep updated

### Ops & SRE Checklist
- Health/readiness endpoints: `/api/health` present; add readiness (DB/connectivity) if behind orchestrator
- Monitoring/metrics: add Prometheus metrics (HTTP latency, error rates) or hosted APM; dashboards + alerts (SLOs)
- Backups: automate Mongo backups; test restore procedures
- Disaster Recovery: document RPO/RTO, failover steps
- Rate limit & WAF at edge (e.g., Cloudflare) in addition to app-level

---

## Appendix A: Notable Files (Non-Exhaustive)
- Backend:
  - `src/index.ts`, `src/middleware/auth.ts`, `src/controllers/authController.ts`, `src/controllers/userController.ts`, `src/controllers/adminController.ts`, `src/lib/stripe.ts`, `src/routes/auth.ts`, `src/routes/userRoutes.ts`, `src/config/db.ts`, `src/config/livekit.ts`
- Frontend:
  - `pages/*` (home/teachers/reservations/free-materials/verbfy-talk/teacher/*/admin/*)
  - `src/lib/api.ts` (all client API clusters), `src/lib/i18n.tsx`, `src/context/*`, `components/layout/DashboardLayout.tsx`, `components/livekit/LiveKitRoom.tsx`

This analysis should serve as a living reference. As new features are implemented (e.g., richer admin dashboards, CEFR test flows, payments lifecycle details), update this document alongside code changes.


