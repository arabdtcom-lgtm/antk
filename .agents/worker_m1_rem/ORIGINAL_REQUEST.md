## 2026-07-28T06:43:54Z
You are teamwork_preview_worker_m1_rem. Working directory: c:/Users/hp/OneDrive/Arbvps/antkawy/.agents/worker_m1_rem.
MANDATORY INTEGRITY WARNING: DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A Forensic Auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Task: Execute the exact Milestone 1 remediation blueprint specified in `c:/Users/hp/OneDrive/Arbvps/antkawy/.agents/explorer_m1_remediation/analysis.md` and `handoff.md`.

Objectives:
1. **Dependencies (`package.json`)**: Add `@types/react` (`^19.0.10`) and `@types/react-dom` (`^19.0.4`) to `devDependencies`.
2. **Server (`server.ts`)**:
   - Add `const currentUser = getUserFromReq(req);` at line 495 in `POST /api/support/tickets`.
   - Remove duplicate unauthenticated CRM routes (lines 564 and 637) that precede `requireAdmin` protected CRM routes.
   - Fix fallback in `getUserFromReq` so unauthenticated requests return `null`/401, not default admin `DB.users[0]`.
   - Protect `/api/escrows/:id/release` and `/api/shipments/:id/update` with `requireAuth` / `requireAdmin`.
3. **Frontend Components**:
   - In `AuctionDetails.tsx`: Declare `const t = translations[lang]`, import `checkoutEscrowInFirestore`, and alias `const countdown = timeLeft`.
   - In `UserStats.tsx`: Change import of `Currency` from `../types` to `../utils/translations`.
   - In `AdminPanel.tsx`: Harden CSV formula sanitization (`/^\s*[=+\-@\t\r]/` and encode `#` in data URI).
   - In `AutoBid.tsx`: Trim emails before comparing `highBidder` and `user.email`.
4. **Firestore Rules (`firestore.rules`)**:
   - Restrict `/auctions/{auctionId}` updates to `isOwner(resource.data.sellerEmail) || isAdmin()` or valid bid placement.
   - Restrict `/shipments/{shipmentId}` updates to `isAdmin() || isOwner(resource.data.buyerEmail)`.
   - Restrict `/autobids/{autobidId}` read/write to `isOwner(resource.data.userEmail)`.
5. **Firebase Utilities (`src/utils/firebase.ts`)**:
   - Supply `softCloseMinutes: Number(data.softCloseMinutes) || 5` in `createAuctionInFirestore`.
   - Change status `'shipped'` to `'dispatched'` and populate required fields in `checkoutEscrowInFirestore`.
6. **Verification**:
   - Execute `npx tsc --noEmit` and confirm 0 TypeScript errors.
   - Execute `npm run build` and confirm successful build.
   - Document all fixes and test outputs in `c:/Users/hp/OneDrive/Arbvps/antkawy/.agents/worker_m1_rem/changes.md` and `handoff.md`.
   - Report back to the Project Orchestrator via send_message when complete.
