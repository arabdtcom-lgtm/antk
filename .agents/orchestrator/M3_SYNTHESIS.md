# Milestone 3 Synthesis & Implementation Plan

## Overview
Synthesized analysis from Explorer 1 (`52f8972c-0a8c-4f40-acf0-4667f7aa434e`), Explorer 2 (`a01ea66e-9985-4852-9986-13e5d0c3b511`), Explorer 3 (`b70ba834-9f09-4808-9cfa-f999cefeaf35`), and Challenger M2-1 edge case feedback.

---

## 1. Sub-Task Breakdown for Worker

### Sub-Task A: Auto-Bidding & Proxy Bidding Engine
1. **Bind `<AutoBid>` in `AuctionDetails.tsx`**: Pass `onAutoBid` handler and `highBidder={auction.highBidder}`. Prevent high bidder from outbidding themselves.
2. **Firestore Real-time Proxy Bidding Logic**: Implement `placeAutoBid` helper in `src/utils/firebase.ts` and server proxy bidding re-eval in `server/db.ts` / `server.ts`. Store autobids in Firestore `/autobids` or `auctions/{id}` document metadata.
3. **Dynamic Increment & Currency**: Use `auction.minIncrement || 10` for outbid calculation instead of hardcoded `100`. Standardize all labels to `$ USD`.
4. **Outbid Notifications**: Trigger toasts `"⚠️ You have been outbid!"` when snapshot updates show another high bidder.

### Sub-Task B: Seller/Buyer Q&A Comments & Real-Time Messaging Hub
1. **Firestore Integration for Q&A**: Refactor `AuctionComments.tsx` to read/write real-time Firestore collection `qa`. Add seller reply form and `isPrivate` question toggle.
2. **Firestore Integration for Messaging**: Refactor `Messages.tsx` to use real-time Firestore collection `messages` (or backend SSE endpoint). Add unread message badge to `Navbar.tsx` and "Contact Seller" button to `AuctionDetails.tsx`.
3. **Firestore Security Rules Fixes**: Update `firestore.rules` for `/messages/{id}` (allow recipient to update `read: true`) and `/qa/{id}` (allow seller/admin to update `answer` / `answeredAt`).

### Sub-Task C: User Statistics Dashboard & Web Audio Utility
1. **Enhance `UserStats.tsx`**: Add bidding history log (active, won, lost bids with timestamps), seller total earnings calculation, active escrow transaction tracking status, case-insensitive email matching (`user.email?.toLowerCase()`), and visual Recharts integration (Won vs Active vs Escrow). Standardize all currency formatting to `$ USD`.
2. **Web Audio Utility (`src/utils/audio.ts`)**: Implement Web Audio API synth generator providing sound effects for bid placed (soft ping), outbid alert (warning chime), and auction win (victory fanfare) with graceful autoplay fallbacks.

### Sub-Task D: Standalone Full-Screen Live Auction Mode (`LiveAuctionMode.tsx`)
1. **Create `src/components/LiveAuctionMode.tsx`**: Immersive full-screen overlay component with:
   - Real-time scrolling bid feed with animations.
   - Live countdown timer with pulse animations when < 1 min.
   - Quick-bid buttons (`+$25`, `+$50`, `+$100`, `+$500`, custom amount).
   - Audio-visual sound triggers on incoming bids using `src/utils/audio.ts`.
   - Browser Fullscreen API toggle (`document.documentElement.requestFullscreen()`).
   - Integrated Q&A drawer and "Contact Seller" quick modal.
2. **Mount in `AuctionDetails.tsx`**: Wire "Enter Live Mode" button to open `<LiveAuctionMode>`.

### Sub-Task E: Challenger M2-1 Edge Case Hardening
1. **Buyout Guard**: Disable instant buyout button if `currentPrice >= buyoutPrice`.
2. **Escrow Release Guard**: Require escrow state `delivered` before buyer/seller release, or admin override.
3. **Timer Boundary**: Ensure boundary check for exact `endTime` matches.

---

## 2. Target Files for Worker Implementation
- `src/components/AutoBid.tsx`
- `src/components/AuctionComments.tsx`
- `src/components/Messages.tsx`
- `src/components/UserStats.tsx`
- `src/components/LiveAuctionMode.tsx` (NEW file)
- `src/components/AuctionDetails.tsx`
- `src/components/Navbar.tsx`
- `src/components/EscrowCheckout.tsx`
- `src/utils/audio.ts` (NEW file)
- `src/utils/firebase.ts`
- `server/db.ts` & `server.ts`
- `firestore.rules`

---

## 3. Verification Criteria
- `npx tsc --noEmit` returns 0 compilation errors.
- `npm run build` succeeds cleanly.
- Auto-bidding outbids competing bids up to max limit without self-outbidding.
- Q&A allows asking questions and seller replying in real-time.
- Messaging hub allows real-time messages and updates unread badge.
- UserStats displays complete history, earnings, escrow status, and charts in `$ USD`.
- LiveAuctionMode opens full-screen with bid feed, sound effects, quick-bids, and countdown.
