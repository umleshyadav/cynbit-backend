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

## 📋 Technical Setup Notes (For Submission Portal)

When submitting via your dedicated candidate portal ([Submit Your Work](https://www.cynbit.in/candidate/cmsqg4pyr000004l0ua8myhsu)), paste these technical setup notes:

```text
Repository URL: https://github.com/umleshyadav/cynbit-backend

Technical Setup & Implementation Summary:
1. Executive Deliverables:
   - docs/BACKEND_TECHNICAL_AUDIT_REPORT.md: Detailed architectural audit of Cynbit's Next.js App Router, Vercel edge deployment (bom1), React Server Actions RPC mechanisms, and Prisma/CUID backend data models.
   - docs/SECURITY_AND_PERFORMANCE_FINDINGS.md: Categorized findings covering CORS scoping, missing security headers (CSP, X-Frame-Options), URL capability token exposure (/candidate/[token]), client-polled payment verification race conditions in Cashfree flows, and dynamic SSR vs. ISR edge cache optimization.
   - docs/RECOMMENDED_IMPROVEMENTS_AND_ARCHITECTURE.md: Production code snippets and architectural blueprints covering edge security middleware, sliding-window rate limiters, Zod-backed Server Action wrappers, HMAC-SHA256 session tokens, and idempotent webhook-driven Cashfree processing.

2. Executable Code & POC:
   - audit-tools/passive_audit.py: Non-intrusive automated audit script.
   - poc-improvements/: Complete TypeScript reference implementation with unit test suite covering rate limiting, cryptographic session tokens, and input validation. Run via: 'npm --prefix poc-improvements test'.
```

---

## ⚖️ Ethics & Responsible Disclosure

All testing conducted during this assessment complied strictly with Cynbit's guidelines:
- **Zero Disruptive Testing:** No denial-of-service, fuzzing, or load testing was performed.
- **Passive Observation:** All analysis utilized standard HTTP GET/HEAD requests and public client-side JavaScript chunk parsing.
- **Privacy First:** No personal applicant data was leaked or stored.
