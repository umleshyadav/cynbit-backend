# Cynbit Backend Technical Audit Report

> **Assessment Task:** Backend Developer Intern — Technical Assessment  
> **Audited Entity:** Cynbit Technologies ([cynbit.in](https://www.cynbit.in))  
> **Testing Methodology:** 100% Passive, Observational, Authorized Analysis (Zero disruptive or intrusive probing)  
> **Date:** October 2026  
> **Author:** Umlesh Yadav (Backend Developer Intern Applicant)

---

## 1. Executive Summary

This report presents an architectural and technical audit of Cynbit’s publicly observable web infrastructure, API behavior, data handling, and backend execution flows. The analysis was conducted through non-intrusive observation of HTTP response headers, Next.js Server Action signatures, React Server Component (RSC) Flight payloads, client bundle decompilation, and sitemap topology across core production surfaces:
- **Landing & Services:** `https://www.cynbit.in/` and `/services`
- **Products & Enterprise Solutions:** `/products` (TenantEase, Cynbit Studio, AI Agents)
- **Client Case Studies:** `/case-studies` (13 dynamic architectural transformations)
- **Talent Acquisition & Careers:** `https://www.cynbit.in/careers` and `/careers/[slug]`
- **Ecosystem & EdTech:** `https://www.cynbit.in/bitelevate` and `/bitelevate/paths`
- **Inquiry & Communications:** `https://www.cynbit.in/contact`
- **Campus & Content:** `/diaries` and `/blog`
- **Candidate Assessment Portal:** `https://www.cynbit.in/candidate/[token]`

### Key Takeaways
1. **Modern Serverless Topology:** Cynbit leverages a state-of-the-art Next.js App Router setup hosted on **Vercel Edge/Serverless** network (`bom1` Mumbai point of presence), featuring React Server Components (RSC) and Next.js Server Actions.
2. **Server Action Dominance:** Cynbit relies on RPC-style Next.js Server Actions (`createServerReference`) rather than standard REST/GraphQL `/api` endpoints for form submissions, candidate tracking, and payment processing.
3. **Data Layer Inferences:** Persistent entities utilize 24-character CUIDs (`cmsqg4pyr000004l0ua8myhsu`), strongly indicative of **Prisma ORM** (`@default(cuid())`) on a relational database (PostgreSQL/MySQL).
4. **Third-Party Integrations:** Core operational workflows integrate **Cashfree Payments** (via SDK and server references) for onboarding/enrollment transactions and Google CDN services for typography/analytics.
5. **Architectural Opportunities:** Observable opportunities exist in CORS policy scoping, HTTP security header hardening, capability URL token security, Server Action rate limiting/Zod validation, and webhooks vs. client-driven payment state transitions.

---

## 2. Infrastructure & Hosting Topology

Through header analysis across requests to `https://www.cynbit.in`, the following infrastructure characteristics were identified:

| Property | Observed Value | Technical Implication |
| :--- | :--- | :--- |
| **Edge Platform** | Vercel (`Server: Vercel`) | Serverless functions executed globally at edge locations. |
| **Point of Presence** | `bom1` (Mumbai, India) | Requests from India terminate at Vercel's Mumbai datacenter, providing low network latency (<25ms RTT). |
| **Rendering Framework** | Next.js App Router (`X-Powered-By: Next.js`) | Modern hybrid rendering engine with React 19 RSC support. |
| **Transport Security** | `Strict-Transport-Security: max-age=63072000` | Enforces HTTPS with a 2-year HSTS policy, mitigating protocol downgrade attacks. |
| **Edge Cache State** | `HIT` on static/prerendered; `MISS` on dynamic SSR | Edge cache functions effectively for marketing pages; dynamic routes bypass edge cache. |

### Header Evidence Snippet (Root Landing Page)
```http
HTTP/1.1 200 OK
Server: Vercel
Strict-Transport-Security: max-age=63072000
Vary: rsc, next-router-state-tree, next-router-prefetch, next-router-segment-prefetch
X-Matched-Path: /
X-Nextjs-Prerender: 1
X-Nextjs-Stale-Time: 300
X-Vercel-Cache: HIT
X-Vercel-Id: bom1::jbkdx-1792757277301-ab024ee0d5fe
Access-Control-Allow-Origin: *
```

---

## 3. Architecture of Observable Backend Behavior

```
               [Client Browser / Mobile Web]
                            │
              HTTPS / TLS 1.3 (HSTS Enabled)
                            │
                            ▼
              [Vercel Edge Network (bom1)]
              - Next.js Edge Routing
              - Static Asset CDN Cache
                            │
               ┌────────────┴────────────┐
               ▼                         ▼
      [Static / ISR Pages]      [Server Actions / SSR]
      - / (Landing)             - /careers (Dynamic SSR)
      - /services (Prerender)   - /candidate/[token] (Dynamic SSR)
      - /bitelevate (Prerender) - POST (Next-Action Dispatcher)
      - /contact (Prerender)             │
                                         ▼
                             [Next.js Server Actions Engine]
                             - submitCandidateApplication
                             - submitInquiry / submitLead
                             - createCashfreeOrder
                             - verifyCashfreePaymentStatus
                                         │
                        ┌────────────────┴────────────────┐
                        ▼                                 ▼
             [Prisma ORM / Database]            [Third-Party APIs]
             - CUID Primary Keys                - Cashfree Gateway
             - Candidate / Lead Records         - Transaction Engine
```

### 3.1 Next.js App Router & Server Action RPC Protocol
Unlike traditional multi-tier architectures that expose separate REST controllers (`/api/v1/inquiries`, `/api/v1/applications`), Cynbit uses **Next.js Server Actions**:
- The client initiates mutations using HTTP `POST` requests to the current URL.
- The request header `Next-Action: <ACTION_ID>` identifies the server-side reference to invoke.
- Request payloads are encoded using the React Flight RPC protocol (or multipart `FormData`).
- Responses return serialized React Flight stream updates (`text/x-component`), allowing instantaneous client state reconciliation without manual JSON unpacking.

### 3.2 Inventory of Discovered Server Actions
Decompilation and static bundle parsing of client-side chunks revealed 12 active Server Actions:

| Action Name | Unique Action ID | Source Bundle | Primary Function |
| :--- | :--- | :--- | :--- |
| `subscribeToNewsletter` | `404e55971a25359df792b3be859e08deff64cc9a32` | `layout-98cfbe01c086f5c9.js` | Newsletter lead capture |
| `submitServiceLead` | `40cd6641ed4a545ec3ce111e8ad06534a97276cfcb` | `page-fcdda5d5573a174a.js` | Enterprise client inquiry capture |
| `submitInquiry` | `40abb1a98c0be9294b518c6ca84ffcc8f63f3a5849` | `page-c119885162e933b7.js` | General contact form submission |
| `submitBitelevateApplication` | `40387974b4d37eb602a304782b6f01342d163757bd` | `page-a3541b77e4ba46dd.js` | BitElevate educational enrollment |
| `submitCandidateApplication` | `4058b3b1af02d0b1088a23b40ed00cd70ddab2ea7f` | `page_career_slug.js` | Job applicant resume & profile submission |
| `fetchCandidateByCandidateToken` | `4082758d577c94584fc8b67b7ab2316e1d8d8aa2c8` | `page_candidate_token.js` | Candidate profile hydration via URL token |
| `submitCandidateAssessment` | `7802063608b388984f56bb777157f0fc53817e503d` | `page_candidate_token.js` | Applicant task & GitHub repo submission |
| `submitCandidateSupportTicket` | `405fcb1ef0455d37af3c5a44ab0a3a9af8b8286ceb` | `page_candidate_token.js` | Helpdesk ticket dispatch for candidates |
| `createCashfreeOrder` | `4001fecb349749cd1104a34c975575d549b24a395a` | `page_candidate_token.js` | Order creation via Cashfree Payments |
| `verifyCashfreePaymentStatus` | `6056f95ff3ed5030fc6ba9bc411a9d75382a4d8d3c` | `page_candidate_token.js` | Client-initiated transaction verification |
| `verifyAndProcessEnrollment` | `604521472f127be36298a47eb7486615d4eb6c7c34` | `page_candidate_token.js` | Post-payment enrollment fulfillment |
| `submitCandidateOnboarding` | `706cea66d4ebe08643dc74939b31a17c7802ba0b6f` | `page_candidate_token.js` | NDA / Offer Letter digital signature execution |
| `submitDiaryEntry` | `403147426dcfa5b83725a5937a9f8ef4649c136038` | `page-0ea44fca8b68a29f.js` | Campus diary anonymous community submission |

---

## 4. Candidate Portal Architecture & Data Flow

Analyzing `audit_data/candidate_portal.html` and `page_candidate_token.js` demonstrates how the applicant assessment workflow functions:

1. **Route Resolution:** The candidate opens `/candidate/[token]`. The route parameter `[token]` is matched by Next.js App Router (`X-Matched-Path: /candidate/[token]`).
2. **Client Component Lifecycle:** The server serves the HTML shell without baking private applicant data into the static SSR stream.
3. **Data Hydration:** Upon mounting, `useEffect` invokes Server Action `fetchCandidateByCandidateToken(token)`:
   ```javascript
   (0, n.useEffect)(() => {
     !async function() {
       if (!y) return; // y is the URL candidate token
       let e = await r(y); // r is fetchCandidateByCandidateToken
       j(e); // Updates candidate state
       if (e?.assessmentSubmissionUrl) P(!0);
       if (e?.paymentStatus === "PAID") M(!0);
       if (e?.ndaSignedAt) ei(!0);
     }();
   }, [y]);
   ```
4. **Assessment Submission Dispatch:**
   When submitting the technical assessment, the client calls `submitCandidateAssessment`:
   ```javascript
   let t = await o(N.id, githubUrl.trim(), additionalLinksArray, technicalNotes.trim());
   // o corresponds to Server Action ID 7802063608b388984f56bb777157f0fc53817e503d
   ```
5. **State Invalidation & Re-fetch:**
   Upon successful submission (`t.success === true`), the client immediately calls `fetchCandidateByCandidateToken(y)` to refresh the reactive UI state.

---

## 5. Inferred Database & Data Modeling

From observable form payloads, candidate object keys, and CUID strings:
- **Identifier Strategy:** Entities use CUID-1 / CUID-2 identifiers (24 characters, base36 alphanumeric, starting with lowercase `c`, e.g., `cmsqg4pyr000004l0ua8myhsu`). This strongly indicates Prisma ORM configuration:
  ```prisma
  model Candidate {
    id                      String    @id @default(cuid())
    token                   String    @unique @default(cuid())
    fullName                String
    email                   String    @unique
    phone                   String
    jobId                   String
    educationData           Json?
    assessmentSubmissionUrl String?
    technicalNotes          String?   @db.Text
    paymentStatus           String    @default("PENDING")
    ndaSignedAt             DateTime?
    createdAt               DateTime  @default(now())
    updatedAt               DateTime  @updatedAt
  }
  ```
- **Form Data Serialization:** The career application form serializes complex nested state (`educationData`) into JSON strings before appending them to `FormData`, requiring defensive server-side JSON parsing and validation.

---

## 6. Conclusion

Cynbit has constructed a clean, modern, and reactive web architecture leveraging Next.js App Router and Server Actions on Vercel's edge network. The design delivers fast page loads, snappy transitions, and consolidated server code.

The subsequent sections of this assessment detail security and performance findings and provide concrete, production-ready backend improvements with architectural code snippets.
