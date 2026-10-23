# Security & Performance Findings

> **Assessment Task:** Backend Developer Intern — Technical Assessment  
> **Audited Entity:** Cynbit Technologies ([cynbit.in](https://www.cynbit.in))  
> **Testing Scope:** Strictly Passive & Authorized Observational Analysis  
> **Date:** October 2026  
> **Author:** Umlesh Yadav (Backend Developer Intern Applicant)

---

## 1. Summary of Findings

| ID | Category | Severity | Title | Impact |
| :--- | :--- | :--- | :--- | :--- |
| **SEC-01** | Security | Medium | Global CORS Wildcard (`*`) on Static & HTML Routes | Unrestricted cross-origin reading of public assets and potential state reflection. |
| **SEC-02** | Security | Medium | Missing Defense-in-Depth HTTP Security Headers | Susceptibility to clickjacking, MIME-sniffing, and cross-site scripting (XSS). |
| **SEC-03** | Security / Auth | Medium-High | Capability URL Token Model & Referrer Leakage | Candidate tokens exposed in browser history, logs, and potential outbound Referer headers. |
| **SEC-04** | Architecture / Fin | Medium-High | Client-Side Orchestrated Payment Verification | Potential race conditions, dropped transactions, and order verification timing issues. |
| **SEC-05** | Security / DoS | Medium | Unthrottled Server Actions (Lack of Rate Limiting) | Risk of automated bot submissions, email spamming, and database connection pool exhaustion. |
| **PERF-01** | Performance | Low-Medium | Dynamic SSR on `/careers` (Vercel Cache MISS) | High TTFB (~200ms) on static job board content compared to edge-cached routes (<20ms). |
| **PERF-02** | Performance | Low-Medium | Monolithic Candidate Portal Client Bundle (134.5 KB) | Increased initial JavaScript parse/evaluation overhead without dynamic code splitting. |
| **DATA-01** | Data Handling | Medium | Client-Side Validation Reliance on Multipart Forms | Potential runtime crashes or malformed records if invalid JSON or payloads are sent directly to Server Actions. |

---

## 2. In-Depth Security & Authentication Findings

### SEC-01: Global CORS Wildcard (`Access-Control-Allow-Origin: *`) on Root & Prerendered HTML
- **Observation:** HTTP response inspection on `https://www.cynbit.in/` and `/services` returned:
  ```http
  Access-Control-Allow-Origin: *
  ```
- **Technical Analysis:** While a wildcard CORS header is common for public REST APIs or CDN fonts, emitting `Access-Control-Allow-Origin: *` indiscriminately on top-level HTML documents and Server Action routing trees (`Vary: rsc, next-router-state-tree`) permits any third-party domain executing client scripts to read the complete HTML document and RSC state tree of authenticated or user-personalized sessions via `fetch()`.
- **Recommendation:** Restrict `Access-Control-Allow-Origin` to trusted Cynbit origins (`https://cynbit.in`, `https://www.cynbit.in`) or omit CORS headers entirely on HTML document routes.

---

### SEC-02: Missing Defense-in-Depth HTTP Security Headers
- **Observation:** Passive header analysis across all core routes revealed that while `Strict-Transport-Security` (HSTS) is configured (`max-age=63072000`), the following critical defense-in-depth headers are completely absent:

| Header | Status | Risk / Exploit Vector |
| :--- | :--- | :--- |
| `Content-Security-Policy` (CSP) | **Missing** | Absence of CSP allows malicious scripts injected via third-party dependencies or XSS vectors to execute unrestricted and exfiltrate data. |
| `X-Frame-Options` | **Missing** | Leaves the site susceptible to **Clickjacking**; third-party malicious sites can iframe `cynbit.in` or the candidate portal and trick users into clicking buttons. |
| `X-Content-Type-Options: nosniff` | **Missing** | Vulnerable to MIME-type sniffing where browsers execute non-script content as executable JavaScript. |
| `Referrer-Policy` | **Missing** | Browsers default to sending the full URL (including query parameters or path tokens) in the `Referer` header when following external outbound links. |
| `Permissions-Policy` | **Missing** | Browser features (camera, microphone, geolocation) are not explicitly restricted. |

---

### SEC-03: Capability URL / Token Exposure in Path (`/candidate/[token]`)
- **Observation:** The candidate portal route matches `https://www.cynbit.in/candidate/cmsqg4pyr000004l0ua8myhsu`.
  - The parameter `cmsqg4pyr000004l0ua8myhsu` is a raw CUID token that serves as the single factor for authentication, authorization, task submission, NDA execution, and payment status checks.
- **Vulnerability Vector:**
  1. **Referer Leakage:** Because `Referrer-Policy: strict-origin-when-cross-origin` or `no-referrer` is not explicitly set, clicking any external link (e.g., links in the footer, third-party support links, or Google Maps) can pass the complete URL—including the candidate token—to external servers in the HTTP `Referer` header.
  2. **Proxy / CDN Access Logging:** Full URLs are logged in cleartext across intermediary ISP caches, corporate firewalls, proxy logs, and browser history.
  3. **No Session Expiry:** CUID tokens stored statically in database records do not carry embedded expiration timestamps (unlike JWTs or HMAC sessions) unless an explicit `expiresAt` column is checked on every query.
- **Recommendation:** Implement an encrypted, HMAC-signed session cookie or exchange the path token for an HttpOnly, SameSite session token upon initial visit.

---

### SEC-04: Client-Side Orchestrated Payment Verification in Cashfree Flow
- **Observation:** In `page_candidate_token.js`, transaction completion for Cashfree payments relies on client-side polling and dispatch:
  ```javascript
  // Discovered in client chunk decompilation
  let n = await d(y, s); // d is verifyCashfreePaymentStatus(token, orderId)
  if (n.success) {
    localStorage.removeItem(t);
    M(!0); // setPaymentSuccess(true)
    j(await r(y)); // fetchCandidateByCandidateToken
  } else if (e >= 180) {
    z("Payment verification timed out. If money was debited... Cashfree will process via webhook");
  }
  ```
- **Architectural Risk:**
  1. **Network Disconnection / Tab Closure:** If a candidate completes the payment modal on mobile and closes the browser immediately, the client-side `verifyCashfreePaymentStatus` action will never fire.
  2. **Race Conditions:** If both the client-side call and an asynchronous webhook arrive simultaneously, lack of database idempotency keys or distributed locking can cause duplicate processing, double invoicing, or inconsistent state transitions.
  3. **Untrusted Client Trigger:** While the backend likely checks the order with Cashfree, relying on the client to initiate the verification lifecycle makes the system vulnerable to timing anomalies and unnecessary serverless compute consumption.
- **Recommendation:** Make payment verification strictly **Webhook-First**. The client should only listen for status changes via lightweight polling or SSE, while the authoritative order reconciliation occurs in a cryptographically signed webhook endpoint (`/api/webhooks/cashfree`).

---

### SEC-05: Missing Rate Limiting and Abuse Prevention on Server Actions
- **Observation:** The discovered Server Actions (`submitInquiry`, `submitCandidateApplication`, `submitBitelevateApplication`, `subscribeToNewsletter`) are accessible via standard HTTP POST requests with a `Next-Action` header.
- **Risk Analysis:**
  - There is no observable client-side CAPTCHA (e.g. Cloudflare Turnstile, reCAPTCHA Enterprise) integrated before form submission.
  - If backend rate limiting (e.g., Upstash Redis token bucket per IP/fingerprint) is not configured in Next.js middleware or inside the Server Action wrapper, attackers can automate thousands of submissions per minute.
  - Consequences include spamming internal email notification channels, exhausting database connection pools, and bloating database storage with fake applicant records.
- **Recommendation:** Implement an IP-based sliding-window rate limiter in a centralized Server Action wrapper and evaluate Cloudflare Turnstile for public-facing forms.

---

## 3. In-Depth Performance & Edge Caching Findings

### PERF-01: Dynamic SSR Cache Invalidation Overhead on `/careers`
- **Observation:** Inspecting HTTP headers across pages revealed a stark contrast:
  - `/`: `X-Vercel-Cache: HIT`, `Age: 1563331` (Served from Edge CDN in <15ms)
  - `/services`: `X-Vercel-Cache: HIT`, `Age: 1542923`
  - `/careers`: `X-Vercel-Cache: MISS`, `Cache-Control: private, no-cache, no-store, max-age=0, must-revalidate`
- **Performance Impact:**
  - Every single user visiting `/careers` triggers a fresh serverless function execution on Vercel.
  - TTFB (Time To First Byte) measured during audit: **~210ms** on `/careers` compared to **~28ms** on `/services`.
  - Because job vacancies change infrequently (hours/days), dynamically re-rendering the page on every incoming HTTP request generates unnecessary serverless compute costs and slows down candidate discovery.
- **Recommendation:** Migrate `/careers` to **Incremental Static Regeneration (ISR)** using `export const revalidate = 300` (5 minutes) or on-demand revalidation via `revalidateTag('careers')`.

---

### PERF-02: Monolithic Candidate Portal Client Bundle (134.5 KB)
- **Observation:** The candidate portal client script (`page-4b2156363d70f2cc.js`) measures **134,549 bytes (~134.5 KB)** uncompressed.
- **Bundle Composition:**
  Decompilation revealed that this single chunk contains:
  1. Main candidate dashboard UI
  2. Cashfree Web SDK integration and payment modal controllers
  3. NDA and Offer Letter digital signature workflow
  4. Candidate support ticket modal and error dispatchers
  5. Technical assessment submission form
- **Performance Impact:**
  - All users must download, parse, and compile payment and NDA signature code even when simply viewing task details or submission statuses.
  - On mobile networks in India (3G/4G), this adds 300ms–800ms of main-thread execution latency before the page becomes interactive (FID / TBT).
- **Recommendation:** Employ `next/dynamic` to dynamically import the Cashfree payment modal, onboarding signing canvas, and support ticket modal on-demand.

---

## 4. In-Depth Data Handling & Error Handling Findings

### DATA-01: Form Field Sanitization & Ingestion Integrity
- **Observation:** On `/careers/[slug]`, the client constructs `FormData` and serializes educational records into raw JSON strings:
  ```javascript
  let r = new FormData(e.currentTarget);
  r.append("educationData", JSON.stringify(y));
  let s = await o(r); // submitCandidateApplication
  ```
- **Risk:**
  - If `educationData` contains malformed or oversized nested JSON structures, an unhandled `JSON.parse()` exception on the server could cause a 500 internal server error.
  - Relying on client-side input attributes (`required=""`, `type="email"`) is insufficient, as raw HTTP POST requests can bypass browser HTML5 validation entirely.
- **Recommendation:** Validate incoming `FormData` using **Zod** schemas inside every Server Action, validating types, lengths, string formats, and JSON structures before database queries.

---

### DATA-02: Error Handling & User Feedback
- **Observation:** In both `/contact` and `/candidate/[token]`, error feedback relies on generic strings:
  ```javascript
  alert(t.error || "Failed to submit work.");
  // or
  n("Something went wrong. Please check all required fields and try again.");
  ```
- **Impact:**
  - Browser native `alert()` halts JavaScript execution and provides poor UX on mobile devices.
  - Lacks granular field-level validation mapping (e.g. "GitHub URL must be a valid public repository" vs. generic failure).
- **Recommendation:** Implement a structured error response standard with typed error codes (`INVALID_GITHUB_URL`, `TOKEN_EXPIRED`, `RATE_LIMITED`) and inline field error highlights.
