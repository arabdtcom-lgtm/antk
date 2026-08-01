# Changes Introduced in Milestone 2

## Summary
Full feature enhancements for Milestone 2 implemented covering USD Currency Standardization, Dual Bidding / Instant Buyout Workflows, Anti-Snipe Auto-Extension, and Verified Buyer/Seller Escrow Checkout Workflow.

## Files Modified & Created

### 1. `src/utils/translations.ts`
- Updated `formatPrice` so when currency is `'USD'` (or default), amount is formatted directly as `$ USD ${rounded}` (English) or `${rounded} $ USD` (Arabic) without dividing by conversion factor (3.75).
- Added dictionary translations for `buyout_claimed` ("تم الشراء الفوري" / "Buyout Claimed") and `ended` ("منتهي" / "Ended").

### 2. `src/types.ts`
- Updated `AuctionStatus` union to `'active' | 'pending_payment' | 'completed' | 'cancelled' | 'buyout_claimed' | 'ended'`.
- Added `antiSnipeTriggeredCount?: number;` and `lastExtendedAt?: string;` to `Auction`.
- Updated `EscrowStatus` union to `'pending' | 'held' | 'dispatched' | 'delivered' | 'released' | 'disputed' | 'refunded'`.
- Expanded `EscrowTransaction` with `$ USD` accounting (`amountUSD`), seller verification (`sellerEmail`, `sellerVerified`), logistics tracking (`trackingNumber`, `carrier`), dispute/refund audit fields (`disputedAt`, `disputeReason`, `refundedAt`, `refundReason`), and `invoiceNumber`.

### 3. `firestore.rules`
- Added `'endTime'`, `'antiSnipeTriggeredCount'`, and `'lastExtendedAt'` to allowed update keys in `/auctions/{auctionId}` rules.
- Added `/escrows/{escrowId}` collection rules allowing `create` and `update` for authenticated users.

### 4. `src/components/EscrowCheckout.tsx` (New Component)
- Implemented full Escrow state machine: `pending` -> `held` -> `dispatched` -> `delivered` -> `released` / `disputed` -> `refunded`.
- Added Verified Seller badge rendering.
- Added seller tracking number and carrier submission form.
- Added buyer receipt confirmation & escrow fund release trigger.
- Added buyer dispute submission form with escrow freezing.
- Added printable `$ USD` Invoice modal with QR code generation, itemized hammer price, 2.5% escrow fee, $25 express shipping fee, total USD, and print functionality.

### 5. `src/utils/firebase.ts`
- Added `subscribeToAuction(auctionId, callback)` using Firestore `onSnapshot`.
- Updated `submitBidInFirestore`: soft-close check against `softCloseMinutes` (default 5 min), extends `endTime = new Date(now + softCloseMs).toISOString()`, updates `antiSnipeTriggeredCount` and `lastExtendedAt`, returns `isExtended` and `extendedByMinutes`.
- Updated `buyoutAuctionInFirestore`: immediately sets status to `'buyout_claimed'`, locks bidding, creates an `EscrowTransaction` record in `$ USD` with status `'held'`, and writes to Firestore `escrows` collection.
- Updated `checkoutEscrowInFirestore`: creates/updates `$ USD` escrow transaction with status `'held'`.
- Added `releaseEscrowInFirestore`, `disputeEscrowInFirestore`, `updateTrackingInFirestore`, and `fetchEscrowByAuctionIdFromFirestore`.

### 6. `server/db.ts` & `server.ts`
- In `server/db.ts`: updated `submitBid` to update `antiSnipeTriggeredCount` and `lastExtendedAt`. Updated `buyoutAuction` to transition status to `'buyout_claimed'` and create `$ USD` `EscrowTransaction`. Updated `checkoutEscrow` to handle `$ USD` escrow fields.
- In `server.ts`: added `/api/escrows/checkout`, `/api/escrows/:id/release`, `/api/escrows/:id/dispute`, `/api/escrows/:id/refund`, and `/api/escrows/:id/invoice` API endpoints.

### 7. `src/components/AuctionDetails.tsx`
- Integrated real-time Firestore subscription via `subscribeToAuction`.
- Added UI toast notification banner `"⚡ Anti-Snipe Extended! +5 min"` (dynamic based on `softCloseMinutes`).
- Integrated `<EscrowCheckout />` component for won, completed, buyout_claimed, or escrow-active auctions.

### 8. `src/App.tsx`
- Updated completed status filter logic to include `'completed'`, `'buyout_claimed'`, and `'ended'`.
