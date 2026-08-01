# Handoff Report: Anti-Snipe Auto-Extensions Mechanism Analysis

**Agent**: `teamwork_preview_explorer_m2_2`  
**Working Directory**: `c:/Users/hp/OneDrive/Arbvps/antkawy/.agents/explorer_m2_2`  
**Recipient**: Project Orchestrator (`73f159c2-7783-4b19-9327-143857375fb7`)  
**Date**: 2026-07-28  

---

## 1. Observation

Direct code observations from inspecting the codebase:

1. **`src/types.ts` (lines 21-57)**:
   - `Auction` interface contains `endTime: string;` and `softCloseMinutes: number;`.
   - Lacks explicit optional audit fields `antiSnipeTriggeredCount?: number;` and `lastExtendedAt?: string;`.

2. **`src/utils/firebase.ts` (lines 427-434)**:
   - `submitBidInFirestore` contains:
     ```typescript
     let newEndTime = currentAuction.endTime;
     const now = Date.now();
     const endMs = new Date(currentAuction.endTime).getTime();
     if (endMs - now < 2 * 60 * 1000) {
       newEndTime = new Date(now + 2 * 60 * 1000).toISOString();
     }
     ```
   - **Flaw**: Hardcodes 2 minutes (`2 * 60 * 1000`) instead of `softCloseMinutes` (default 5 minutes).
   - Does not update `antiSnipeTriggeredCount` or `lastExtendedAt`.
   - Does not return anti-snipe trigger flags (`isExtended`, `extendedByMinutes`) to trigger toasts.

3. **`server/db.ts` (lines 1036-1053)** & **`server.ts` (line 219)**:
   - `DB.submitBid` reads `auction.softCloseMinutes * 60 * 1000` and extends `endTime` if `timeLeftMs < softCloseThresholdMs`.
   - Broadcasts SSE `bid_submitted` event, but client frontend currently relies on 5-second polling instead of SSE/Firestore real-time snapshot listeners.
   - Seed auctions in `server/db.ts` specify `softCloseMinutes: 2`, whereas `CreateAuction.tsx` uses 5 minutes as default.

4. **`src/components/AuctionDetails.tsx` (lines 568-579)**:
   - `AuctionDetails` polls Firestore every 5,000ms (`setInterval(..., 5000)`).
   - Does NOT have an active Firestore `onSnapshot` listener attached for single auction changes.
   - Does NOT display a visual notification toast ("Anti-Snipe Extended! +5 min") when timer extensions occur.

5. **`firestore.rules` (lines 41-45)**:
   - Security rule restricts non-owner/non-admin auction updates via `hasOnly(['currentPrice', 'bidsCount', 'highBidder', 'highBidderName', 'viewsCount', 'trackingNumber', 'status'])`.
   - **CRITICAL**: `endTime`, `antiSnipeTriggeredCount`, and `lastExtendedAt` are missing from `hasOnly(...)`, which will cause client-side Firestore bid updates that extend `endTime` to fail with a `Permission Denied` error.

---

## 2. Logic Chain

1. **Premise**: Anti-snipe auto-extension requires that any bid placed within `softCloseMinutes` (default 5 minutes) before `endTime` automatically extends `endTime` by `softCloseMinutes`.
2. **Observation**: `submitBidInFirestore` in `src/utils/firebase.ts` uses a hardcoded 2-minute check (`2 * 60 * 1000`), ignoring `softCloseMinutes`.
3. **Deduction**: `submitBidInFirestore` must be updated to dynamically check `endMs - now <= (currentAuction.softCloseMinutes || 5) * 60 * 1000` and extend `endTime` to `new Date(now + softCloseMs).toISOString()`.
4. **Premise**: Real-time synchronization requires all active clients to see timer extensions immediately without waiting for 5-second polling intervals.
5. **Observation**: `AuctionDetails.tsx` relies on 5-second polling `setInterval(..., 5000)` and lacks an `onSnapshot` listener.
6. **Deduction**: A real-time helper `subscribeToAuction(auctionId, callback)` must be added to `src/utils/firebase.ts` and attached in `AuctionDetails.tsx`.
7. **Premise**: Observers and bidders must receive visual notification toasts when an extension happens.
8. **Observation**: `Toast.tsx` provides `useToast()` hook with `info(msg)`, but it is not currently called when `endTime` changes.
9. **Deduction**: When `submitBidInFirestore` or `onSnapshot` detects an increase in `endTime`, calling `toast.info("Anti-Snipe Extended! +5 min")` will display the visual notification.
10. **Premise**: Firestore updates must comply with security rules.
11. **Observation**: `firestore.rules` line 44 limits update fields to `['currentPrice', 'bidsCount', 'highBidder', 'highBidderName', 'viewsCount', 'trackingNumber', 'status']`.
12. **Deduction**: `firestore.rules` must be updated to include `'endTime'`, `'antiSnipeTriggeredCount'`, `'lastExtendedAt'`, and `'softCloseMinutes'` in the allowed update list.

---

## 3. Caveats

1. **Network Mode Constraint**: Investigation was conducted in CODE_ONLY read-only mode without executing external network requests or mutating code files.
2. **Client Clock Skew**: Client-side timestamp evaluation (`Date.now()`) depends on the device system time. Server-side validation in `server/db.ts` remains the ultimate authority for time checks.
3. **Firestore Transaction Support**: Client-side `setDoc` updates can be susceptible to race conditions under heavy concurrent bidding. Refactoring `submitBidInFirestore` to use `runTransaction` is recommended for production deployment.

---

## 4. Conclusion

The Anti-Snipe Auto-Extension architecture is thoroughly analyzed and designed. Implementation requires five concrete updates:
1. Add `antiSnipeTriggeredCount?: number` and `lastExtendedAt?: string` to `Auction` interface in `src/types.ts`.
2. Allow `endTime`, `antiSnipeTriggeredCount`, `lastExtendedAt`, `softCloseMinutes` in `firestore.rules`.
3. Refactor `submitBidInFirestore` in `src/utils/firebase.ts` to use `softCloseMinutes` (default 5 min) and calculate `newEndTime = now + softCloseMs`.
4. Implement `subscribeToAuction` Firestore `onSnapshot` listener in `src/utils/firebase.ts` and connect it in `AuctionDetails.tsx` to replace 5s polling latency.
5. Trigger visual notification toasts (`toast.info("Anti-Snipe Extended! +5 min")`) when timer extensions occur.

Detailed analysis report is available in `c:/Users/hp/OneDrive/Arbvps/antkawy/.agents/explorer_m2_2/analysis.md`.

---

## 5. Verification Method

To verify the design and future implementation:

1. **Inspect Report Files**:
   - `c:/Users/hp/OneDrive/Arbvps/antkawy/.agents/explorer_m2_2/analysis.md`
   - `c:/Users/hp/OneDrive/Arbvps/antkawy/.agents/explorer_m2_2/handoff.md`

2. **Code Verification Steps (Post-Implementation)**:
   - Check `src/types.ts` for `antiSnipeTriggeredCount` and `lastExtendedAt`.
   - Check `firestore.rules` line 44 for `'endTime'`.
   - Place a bid when `timeLeft < 5 minutes` on an auction detail page.
   - Confirm `endTime` updates in Firestore doc.
   - Confirm visual toast `"Anti-Snipe Extended! +5 min"` appears.
   - Open auction on a second browser/tab and confirm real-time timer update fires via `onSnapshot` without manual refresh.
