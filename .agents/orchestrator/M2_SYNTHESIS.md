# Milestone 2 Synthesis Report — Core Auction & Escrow Protection

## Overview
Explorers M2-1 (Dual Bidding & USD Standardization), M2-2 (Anti-Snipe Extensions), and M2-3 (Escrow Checkout Workflow) have completed their deep-dive investigations. A unified implementation blueprint has been synthesized.

## Core Architectural Requirements

### 1. Dual Bidding & Instant Buyout Workflows ($ USD Standardization)
- **USD Currency Standardization**:
  - Update `src/utils/translations.ts` `formatPrice`: set USD base conversion factor to 1:1 (`amount` directly for USD). Standardize primary symbol to `$ USD` across all historical document auctions and active listings.
  - Update `src/types.ts`: Expand `Auction.status` union to include `'active' | 'pending_payment' | 'completed' | 'cancelled' | 'buyout_claimed' | 'ended'`.
- **Dual Bidding UI & Instant Buyout**:
  - In `AuctionDetails.tsx` and `server.ts`:
    - Enforce progressive minimum bid increments consistently (`currentPrice + minIncrement`).
    - Instant Buyout: When a user clicks "Instant Buyout" ($ Buyout Price), validate buyout amount, immediately transition auction status to `buyout_claimed`, lock out further bids, automatically create an `EscrowTransaction` record in `$ USD` (`status: 'held'`), and notify buyer and seller.

### 2. Anti-Snipe Auto-Extension Mechanism
- **Timer Extension Logic**:
  - When a bid is placed within `softCloseMinutes` (default 5 minutes) before `endTime`, automatically extend `endTime` by `softCloseMinutes` from current time (`now + softCloseMinutes * 60 * 1000`).
  - Update `antiSnipeTriggeredCount` and `lastExtendedAt` on the auction document.
- **Firestore Rules Update**:
  - In `firestore.rules`: Add `endTime`, `antiSnipeTriggeredCount`, and `lastExtendedAt` to the allowed update field list for bids on `/auctions/{auctionId}` so non-seller bidders can trigger anti-snipe extensions without permission error.
- **UI Notifications**:
  - Display toast notification `"Anti-Snipe Extended! +5 min"` whenever `endTime` is extended.

### 3. Verified Buyer & Seller Escrow Checkout Workflow
- **Escrow State Machine**:
  - States: `pending` (buyout/win) -> `held` (funds deposited) -> `dispatched` (seller shipped & tracking added) -> `delivered` (buyer confirmed receipt) -> `released` (seller paid) / `disputed` -> `refunded`.
- **Checkout Component & API**:
  - Create/enhance `EscrowCheckout.tsx` with identity verification indicators, shipping address confirmation, tracking entry form for seller, receipt confirmation for buyer, and fund release trigger.
  - Implement/update `/api/escrows` endpoints in `server.ts` and `src/utils/firebase.ts` with proper authorization checks and PDF/formatted invoice rendering in `$ USD`.

## Implementation Assignment for Worker M2
Worker M2 will implement all Milestone 2 features across `src/`, `server.ts`, `firestore.rules`, and `firebase-blueprint.json`, run build/typecheck verification, and document changes in `changes.md` and `handoff.md`.
