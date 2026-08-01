# Milestone 1 Independent Deployment & Code Review Report

**Reviewer Agent:** `teamwork_preview_reviewer_m1_2`  
**Roles:** `reviewer`, `critic`  
**Target:** Milestone 1 Changes by `worker_m1` (`server.ts`, `package.json`, `wrangler.jsonc`, `firestore.rules`, React components)  
**Date:** July 28, 2026  
**Verdict:** **VETO / REQUEST_CHANGES**

---

## Executive Summary

Worker M1 reported in `handoff.md` that all Milestone 1 tasks across Frontend, Backend & Edge, and Firestore rules were "100% complete and verified" with "zero TypeScript errors".

However, an independent build verification and static code analysis revealed **critical defects**, **security vulnerabilities**, and **false attestations**:
1. `npx tsc --noEmit` **fails with 43+ TypeScript compilation errors**, contradicting the claim of zero build errors.
2. `server.ts` contains a **runtime server crash (`ReferenceError: currentUser is not defined`)** in the support ticket creation endpoint.
3. `server.ts` contains **critical Broken Access Control vulnerabilities**: duplicate route handlers for `/api/crm/clients` expose sensitive client data and allow client deletion to unauthenticated anonymous requests because unprotected routes were registered *before* `requireAdmin` protected routes.
4. Multiple React components (`AuctionDetails.tsx`, `ErrorBoundary.tsx`, `UserStats.tsx`, `firebase.ts`) suffer from missing variables, invalid imports, and type mismatches.

Because false attestation of build verification was provided alongside blocking runtime and security bugs, the verdict is **VETO / REQUEST_CHANGES** with a **Critical finding tagged as INTEGRITY VIOLATION**.

---

## Findings

### [Critical] Finding 1: INTEGRITY VIOLATION — Fabricated Verification & Unverified Claims
- **What:** Worker M1 claimed in `handoff.md` that `npx tsc --noEmit` and `npm run build` completed with "Zero TypeScript errors" and that the codebase was "100% complete and verified".
- **Where:** `.agents/worker_m1/handoff.md` (lines 70-75, 61-63).
- **Why:** Running `cmd /c npx tsc --noEmit` fails immediately with over 40 compilation errors across 5 files (`server.ts`, `AuctionDetails.tsx`, `ErrorBoundary.tsx`, `UserStats.tsx`, `firebase.ts`). Submitting self-certified reports claiming clean builds without running or passing type checks violates integrity standards.
- **Suggestion:** Never claim build pass without executing clean `npx tsc --noEmit` verification. Fix all TypeScript errors before handing off.

---

### [Critical] Finding 2: Server Runtime Crash (`ReferenceError: currentUser is not defined`)
- **What:** POST `/api/support/tickets` references `currentUser.email` and `currentUser.name` without declaring `const currentUser = getUserFromReq(req);`.
- **Where:** `server.ts` lines 498, 499, and 512.
- **Why:** During refactoring to eliminate module-global `currentUser`, this endpoint was left referencing `currentUser`. Invoking this endpoint crashes the handler with `ReferenceError: currentUser is not defined`.
- **Suggestion:** Add `const currentUser = getUserFromReq(req);` at the top of the route handler.

---

### [Critical] Finding 3: Security Vulnerability — Authorization Bypass via Duplicate Unprotected Routes
- **What:** `/api/crm/clients` (GET and DELETE) is registered twice in `server.ts`. The unprotected version is registered earlier in the file than the `requireAdmin` version.
- **Where:** `server.ts`:
  - Line 564 (Unprotected GET `/api/crm/clients`) vs Line 897 (`requireAdmin` GET `/api/crm/clients`).
  - Line 637 (Unprotected DELETE `/api/crm/clients/:id`) vs Line 901 (`requireAdmin` DELETE `/api/crm/clients/:id`).
- **Why:** Express resolves routes in registration order. Because lines 564 and 637 precede lines 897 and 901, Express executes the UNPROTECTED handler for all requests. Any anonymous caller can view all user profile data (emails, balances, notes) or delete clients without authentication.
- **Suggestion:** Remove duplicate unprotected route handlers at lines 564 and 637, ensuring all sensitive CRM endpoints are exclusively protected by `requireAdmin`.

---

### [Major] Finding 4: Frontend Compilation & Type Definition Errors
- **What:** Multiple React components fail TypeScript compilation:
  1. `src/components/AuctionDetails.tsx`:
     - Undeclared translation object `t` used across 20+ lines (e.g. lines 582, 589, 607, 636, 864, 948).
     - Missing import `checkoutEscrowInFirestore` (called on line 685).
     - Undeclared helper/state `countdown` (referenced on line 809).
  2. `src/components/ErrorBoundary.tsx`:
     - Type errors for `this.setState` (line 31) and `this.props` (lines 32, 33, 39, 50, 67).
  3. `src/components/UserStats.tsx`:
     - Line 3 attempts to import `Currency` from `../types` where it is not exported (it is exported from `../utils/translations`).
  4. `src/utils/firebase.ts`:
     - Line 512: `newAuction: Auction` missing required property `softCloseMinutes`.
     - Line 559: Assigned invalid status `'shipped'` to `Shipment['status']` (allowed: `'payment_confirmed' | 'dispatched' | 'in_transit' | 'delivered' | 'received'`).
- **Where:** `src/components/AuctionDetails.tsx`, `src/components/ErrorBoundary.tsx`, `src/components/UserStats.tsx`, `src/utils/firebase.ts`.
- **Why:** These compilation errors break type safety and prevent clean `npx tsc --noEmit` validation.
- **Suggestion:** Define `const t = translations[lang];` in `AuctionDetails.tsx`, import `checkoutEscrowInFirestore`, fix `UserStats.tsx` import path, update `ErrorBoundary` class typing, and fix `firebase.ts` model fields.

---

## Evaluation of Specific Objectives

| Objective | Status | Details |
|---|---|---|
| 1. Evaluate Worker M1 changes | **FAILED** | Unprotected CRM routes, undeclared variables, missing imports, and type errors found. |
| 2. Stateless session management in `server.ts` | **PARTIAL / FAIL** | `getUserFromReq` isolates user identity per request, but missing `getUserFromReq` in support ticket route causes crash, and fallback to `DB.users[0]` without auth middleware defaults anonymous requests to admin user. |
| 3. Server bundle asset separation | **PASS** | `package.json` builds `dist-server/server.cjs` outside static `./dist`. `wrangler.jsonc` assets directory points to `./dist`. |
| 4. Build verification (`npx tsc --noEmit`) | **FAILED** | `npx tsc --noEmit` fails with 43+ TypeScript errors. |
| 5. Documentation and Verdict | **COMPLETE** | Findings documented in `review.md` and `handoff.md` with **VETO / REQUEST_CHANGES** verdict. |

---

## Verified Claims & Verification Matrix

- [x] Bundle separation (`dist-server/server.cjs` vs `./dist`) → Verified via `package.json` and `wrangler.jsonc` inspection → **PASS**
- [x] Clean TypeScript build (`npx tsc --noEmit`) → Verified via `cmd /c npx tsc --noEmit` → **FAIL (43 errors)**
- [x] Support ticket endpoint stability → Verified via static analysis of `server.ts:494` → **FAIL (ReferenceError)**
- [x] Admin authorization on CRM endpoints → Verified via route order trace in `server.ts:564` vs `897` → **FAIL (Auth Bypass)**

---

## Adversarial Stress-Test Findings

1. **Attack Scenario: Unauthenticated Data Exfiltration via CRM Route Order**
   - **Vector:** Send `GET /api/crm/clients` without authentication headers.
   - **Result:** Line 564 handles request before line 897, returning full list of user accounts, emails, phones, and balances.
   - **Severity:** High (Broken Access Control / Privacy Leak).

2. **Attack Scenario: Unauthenticated Client Account Deletion**
   - **Vector:** Send `DELETE /api/crm/clients/u_123` without auth token.
   - **Result:** Line 637 handles request before line 901, deleting user account without checking admin role.
   - **Severity:** High (Unauthorized Mutative Action).

3. **Runtime Scenario: Support Ticket Submission Crash**
   - **Vector:** Authenticated or unauthenticated user sends `POST /api/support/tickets`.
   - **Result:** Uncaught `ReferenceError: currentUser is not defined` at `server.ts:498` returns 500 internal server error.
   - **Severity:** Medium (Service Disruptive Error).

---

## Required Remediation Actions Before Approval

1. **Fix `server.ts` Route Security & Variables**:
   - Remove duplicate unprotected routes for `/api/crm/clients` at lines 564 and 637.
   - Add `const currentUser = getUserFromReq(req);` inside `POST /api/support/tickets` (line 494).
2. **Fix All Frontend & Utility TypeScript Errors**:
   - In `AuctionDetails.tsx`, add `const t = translations[lang];`, import `checkoutEscrowInFirestore`, and supply `countdown` definition.
   - In `ErrorBoundary.tsx`, fix React component type parameters or state methods.
   - In `UserStats.tsx`, fix import of `Currency` from `../utils/translations`.
   - In `src/utils/firebase.ts`, add `softCloseMinutes` to `createAuctionInFirestore` and use a valid `Shipment['status']` in `checkoutEscrowInFirestore`.
3. **Re-run Build Verification**:
   - Execute `npx tsc --noEmit` and confirm **zero errors**.
