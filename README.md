# Cynbit Backend Technical Audit & Architectural Enhancement

> **Role:** Backend Developer Intern  
> **Applicant:** Umlesh Yadav  
> **Company:** Cynbit Technologies ([cynbit.in](https://www.cynbit.in))  
> **Submission Deadline:** Sat, Oct 24, 01:31 PM  
> **Testing Scope:** Strictly Passive & Authorized Observational Analysis (Zero intrusive/disruptive probing)

---

## 📌 Executive Overview

This repository contains the complete technical assessment for the **Backend Developer Intern** application at Cynbit. 

The submission provides an end-to-end backend analysis of Cynbit's production infrastructure, Next.js Server Actions, edge network behavior, data contracts, and third-party integrations (Cashfree Payments, Prisma ORM, Vercel Edge). Along with in-depth technical documentation, it includes:
1. **Automated Passive Audit Suite (`audit-tools/`):** Python-based observational CLI tool that passively inspects headers, Next.js chunks, RSC flight payloads, and Server Actions without intrusive scanning.
2. **Production-Grade POC Improvements (`poc-improvements/`):** Working TypeScript reference implementations featuring edge security middleware, sliding-window rate limiters, Zod-backed type-safe Server Action wrappers, HMAC-signed candidate session tokens, and authoritative Cashfree webhook handlers.
3. **Automated Test Suite:** Built-in unit tests verifying rate-limiting thresholds, cryptographic tamper-resistance, and schema validation.

---

## 🗂️ Required Deliverables Directory

| Deliverable | Description | File Link |
| :--- | :--- | :--- |
| **Deliverable 1** | **Backend Technical Audit Report:** Architectural analysis of observable backend behaviour, Next.js Server Action RPC protocol, hosting topology, data hydration, and Prisma CUID modeling. | [`docs/BACKEND_TECHNICAL_AUDIT_REPORT.md`](docs/BACKEND_TECHNICAL_AUDIT_REPORT.md) |
| **Deliverable 2** | **Security & Performance Findings:** Categorized vulnerability and efficiency findings across CORS scoping, defense-in-depth headers, capability URL tokens, Cashfree payment race conditions, and dynamic SSR vs. ISR overhead. | [`docs/SECURITY_AND_PERFORMANCE_FINDINGS.md`](docs/SECURITY_AND_PERFORMANCE_FINDINGS.md) |
| **Deliverable 3** | **Recommended Improvements & Architecture:** Architectural code blueprints and production-ready snippets explaining mitigation strategies, idempotent webhook workflows, and dynamic import code splitting. | [`docs/RECOMMENDED_IMPROVEMENTS_AND_ARCHITECTURE.md`](docs/RECOMMENDED_IMPROVEMENTS_AND_ARCHITECTURE.md) |

---

## 🛠️ Repository Architecture & File Structure

```
cynbit/
├── README.md                                  # Executive summary & navigation guide
├── .gitignore                                 # Git ignore rules
│
├── docs/                                      # Required Core Deliverables
│   ├── BACKEND_TECHNICAL_AUDIT_REPORT.md      # Deliverable 1: In-depth technical audit
│   ├── SECURITY_AND_PERFORMANCE_FINDINGS.md   # Deliverable 2: Categorized findings
│   └── RECOMMENDED_IMPROVEMENTS_AND_ARCHITECTURE.md # Deliverable 3: Architectural blueprints
│
├── audit-tools/                               # Passive Observational Audit Suite
│   ├── passive_audit.py                       # CLI script to passively audit headers & actions
│   └── audit_report_data/                     # Raw observational outputs and JSON logs
│       ├── audit_summary.json                 # Parsed route metadata and Server Action catalog
│       └── js_chunks/                         # Analyzed Next.js static bundles
│
└── poc-improvements/                          # Production Reference Implementations
    ├── package.json                           # Dependencies (Zod, TypeScript, Node)
    ├── tsconfig.json                          # TypeScript configuration
    ├── src/
    │   ├── middleware.ts                      # Edge Security Middleware (CSP, CORS, Headers)
    │   ├── lib/
    │   │   ├── rateLimit.ts                   # Sliding window rate limiter
    │   │   ├── actionWrapper.ts               # Type-safe Server Action wrapper
    │   │   └── authTokens.ts                  # HMAC-SHA256 signed candidate session tokens
    │   ├── actions/
    │   │   ├── contactAction.ts               # Hardened submitInquiry Server Action
    │   │   └── candidateAssessmentAction.ts   # Hardened submitCandidateAssessment Server Action
    │   └── api/
    │       ├── cashfree-webhook/route.ts      # Cryptographically verified Cashfree webhook
    │       └── careers/revalidate/route.ts    # On-demand ISR cache invalidation endpoint
    └── test/
        └── suite.test.mjs                     # Test suite (Rate limiting, auth tokens, validation)
```

---

## 🚀 Quickstart & Verification

### 1. Run the Passive Audit Tool
Re-run the non-intrusive audit against Cynbit's public infrastructure:
```bash
python audit-tools/passive_audit.py
```
Outputs live status codes, Vercel edge cache status, HSTS headers, and decompiled Next.js Server Action references.

### 2. Run the POC Test Suite
Execute the automated unit tests for the proposed backend architecture:
```bash
npm --prefix poc-improvements test
```
**Test Results:**
- `✔ 1. Rate Limiter - Sliding Window Enforcement`: Verifies request throttling after configurable limit.
- `✔ 2. Candidate Session Token - Generation, Verification & Tamper Resistance`: Verifies constant-time signature validation, rejection of tampered tokens, and expiry checks.
- `✔ 3. Server Action Wrapper - Schema Validation Contract`: Verifies Zod validation on malformed inputs and successful dispatch on valid payloads.

---

## 🏛️ System Design & Implementation Highlights

This repository demonstrates production-grade engineering principles designed for scalable serverless architectures:

1. **Edge-First Security Architecture:**
   - Next.js Edge Middleware (`src/middleware.ts`) enforcing strict origin-scoped CORS (no wildcards), Content-Security-Policy (CSP), `X-Frame-Options: DENY`, and `X-Content-Type-Options: nosniff`.
   - Strips capability tokens from address bars, converting raw URL access into secure, ephemeral session states.

2. **High-Assurance Server Action Wrapper:**
   - Encapsulates mutations with sliding-window IP rate limiting (`src/lib/rateLimit.ts`) and Zod schema parsing (`src/lib/actionWrapper.ts`).
   - Standardizes response envelopes to `{ success: true, data: T }` or `{ success: false, error: string, fieldErrors?: Record<string, string[]> }`.

3. **Cryptographically Secure State Transitions:**
   - Stateless HMAC-SHA256 candidate tokens (`src/lib/authTokens.ts`) replacing vulnerable cleartext database CUIDs in URLs.
   - Authoritative, idempotent Cashfree webhook handler (`src/api/cashfree-webhook/route.ts`) validating `x-webhook-signature` using constant-time buffer comparison.

4. **Edge Caching Optimization (ISR):**
   - On-demand cache invalidation route (`src/api/careers/revalidate/route.ts`) enabling static ISR for `/careers`, slashing TTFB from ~200ms to <20ms while preserving real-time job posting updates.

---

## ⚖️ Ethics & Responsible Disclosure

All testing conducted during this assessment complied strictly with Cynbit's guidelines:
- **Zero Disruptive Testing:** No denial-of-service, fuzzing, or load testing was performed.
- **Passive Observation:** All analysis utilized standard HTTP GET/HEAD requests and public client-side JavaScript chunk parsing.
- **Privacy First:** No personal applicant data was leaked or stored.
