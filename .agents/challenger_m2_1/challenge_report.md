# Milestone 2 Bidding, Anti-Snipe, and Escrow Challenge Report

## Challenge Summary

**Overall risk assessment**: **HIGH**

This report presents static and logical stress-testing of Milestone 2 bidding, anti-snipe extension, buyout edge cases, and escrow state transitions across `server/db.ts`, `server.ts`, `src/utils/firebase.ts`, and `firestore.rules`. 

Three major categories of vulnerabilities and failure modes were uncovered:
1. **Financial Undercut Vulnerability in Buyout**: Buyout logic does not check if `currentPrice >= buyoutPrice`, allowing buyers to execute buyout and lower the price when active bidding has already exceeded the buyout price.
2. **Unauthorized Escrow State Transitions & Missing Authorization**: Escrow can be released prior to shipment dispatch/delivery, can bypass active dispute states, and `/api/escrows/:id/release` lacks buyer/admin authorization checks (compounded by overly permissive Firestore rules `allow update: if isSignedIn()`).
3. **Snipe Window at Exact Expiration**: A bid submitted at exact expiration timestamp (`now === endTime`) is accepted but skips anti-snipe extension because `timeLeftMs = 0`. Additionally, client-side Firestore writes for bidding/buyout lack transaction locks (`runTransaction`), creating race condition overwrites.

---

## Challenges

### [High] Challenge 1: Price Regression & Seller Fraud via Buyout when `currentPrice >= buyoutPrice`

- **Assumption challenged**: Assumed that buyout is only available when current bidding is strictly below the buyout price.
- **Attack scenario**:
  1. An auction is created with `startPrice = $100` and `buyoutPrice = $500`.
  2. Bidders actively bid the price up to `$600` (`currentPrice = $600`).
  3. User B calls `buyoutAuction(auctionId)` or clicks Buyout.
  4. In `server/db.ts` (lines 1089-1097) and `src/utils/firebase.ts` (lines 514-523), the code checks `status !== 'active'` and `!buyoutPrice`, but **does NOT check `currentPrice >= buyoutPrice`**.
  5. Line 1097 executes: `auction.currentPrice = auction.buyoutPrice` (reducing currentPrice from $600 down to $500).
  6. An escrow transaction is created for $500.
- **Blast radius**: High. Sellers are financially defrauded by losing the higher legitimate bid ($600) and having the item sold at a lower price ($500). High bidders lose their winning position to a price-lowering buyout exploit.
- **Mitigation**: Add validation in `buyoutAuction`:
  ```typescript
  if (auction.currentPrice >= auction.buyoutPrice) {
    return { success: false, messageAr: 'تم تجاوز سعر الشراء الفوري بواسطة المزايدات الحالية' };
  }
  ```

### [High] Challenge 2: Escrow Release Without Dispatch/Delivery Verification and Missing Authorization

- **Assumption challenged**: Assumed that escrow release requires item dispatch/delivery and can only be executed by the authorized buyer or admin.
- **Attack scenario**:
  1. Buyer pays for an item (`shipment.status = 'payment_confirmed'`, `escrow.status = 'held'`). Seller has not shipped or provided tracking.
  2. Any authenticated user (including the seller or an unauthenticated session caller) sends a POST request to `/api/escrows/:id/release`.
  3. In `server.ts` (lines 268-283), `requireAuth` is checked, but the endpoint does **NOT verify** whether `req.user.email === escrow.buyerEmail` or `req.user.role === 'admin'`.
  4. `DB.releaseEscrow` (lines 1230-1265) is called. It does **NOT check** if `shipment.status` is `'dispatched'` or `'delivered'`.
  5. Shipment status becomes `'received'` and Escrow status becomes `'released'`. Funds are released to seller before shipping.
  6. Additionally, `firestore.rules` line 102 (`allow update: if isSignedIn()`) allows any signed-in user to directly mutate any escrow document in Firestore to `'released'`.
- **Blast radius**: High. Loss of buyer protection funds, premature fund release, unauthorized release by third parties or sellers, and bypass of dispute resolution.
- **Mitigation**:
  1. Enforce shipment status check in `releaseEscrow`: require `shipment.status === 'dispatched'` or `'delivered'`.
  2. Add RBAC check in `/api/escrows/:id/release`: ensure `req.user.email === escrow.buyerEmail || req.user.role === 'admin'`.
  3. Update `firestore.rules` for `/escrows/{escrowId}` to restrict updates:
     `allow update: if isAdmin() || (isSignedIn() && request.auth.token.email == resource.data.buyerEmail);`

### [Medium] Challenge 3: Unhandled Expiry Boundary Snipe Window (`now === endTime`)

- **Assumption challenged**: Assumed that bids at or after `endTime` are either rejected or consistently extend the auction.
- **Attack scenario**:
  1. An auction has `endTime = T`.
  2. A bid is placed at exact timestamp `now = T`.
  3. In `server/db.ts` line 993: `if (now.getTime() > endTime.getTime())` evaluates to `false` (`T > T` is false). The bid is accepted!
  4. In `server/db.ts` line 1036-1041: `timeLeftMs = endTime.getTime() - now.getTime() = 0`.
  5. Line 1041: `if (timeLeftMs > 0 && timeLeftMs <= softCloseThresholdMs)` evaluates to `false` (`0 > 0` is false). Anti-snipe does **NOT** trigger.
  6. The bid updates `currentPrice` and `highBidder` at `T`, but `endTime` remains `T`. The auction closes instantly with no anti-snipe extension.
- **Blast radius**: Medium. Allows zero-second snipes right at the boundary timestamp without extending the soft-close window.
- **Mitigation**: Update expiry check to `now.getTime() >= endTime.getTime()`, or if bids at `now === endTime` are allowed, include `timeLeftMs >= 0` in anti-snipe extension condition.

### [Medium] Challenge 4: Client-Side Firestore Race Conditions in `submitBidInFirestore` and `buyoutAuctionInFirestore`

- **Assumption challenged**: Assumed that concurrent bids and buyouts in client-side Firestore are atomic and state-consistent.
- **Attack scenario**:
  1. User A clicks Buyout while User B submits a Bid simultaneously.
  2. Both `buyoutAuctionInFirestore` and `submitBidInFirestore` issue non-atomic `getDoc` calls followed by independent `setDoc` calls (`src/utils/firebase.ts` lines 415-475 and 507-550).
  3. User A's buyout writes `status: 'buyout_claimed'` and creates an escrow record.
  4. User B's bid write arrives slightly later, overwriting `auctionRef` with `status: 'active'` and new `currentPrice`.
  5. State corruption: Escrow document exists for User A's buyout, while Auction document shows User B as leading high bidder in an active auction.
- **Blast radius**: Medium. Database state inconsistency between `auctions` and `escrows` collections.
- **Mitigation**: Wrap client-side Firestore bidding and buyout operations inside `runTransaction(db, async (transaction) => { ... })`.

---

## Stress Test Results

| Scenario | Expected Behavior | Actual Behavior | Pass/Fail |
|---|---|---|---|
| Bid at `endMs - 300000ms` (5 min boundary) | Anti-snipe triggers (extension applied) | `timeLeftMs = 300000ms <= 300000ms` -> Triggered | **PASS** |
| Bid at `endMs - 300001ms` (5 min + 1ms) | Anti-snipe does NOT trigger | `timeLeftMs = 300001ms > 300000ms` -> Not triggered | **PASS** |
| Bid at `endMs - 299999ms` (4m59s999ms) | Anti-snipe triggers | `timeLeftMs = 299999ms <= 300000ms` -> Triggered | **PASS** |
| Bid at exact `now === endTime` (`timeLeftMs = 0`) | Bid rejected as closed OR anti-snipe extends | `now > endTime` is False (Bid accepted); `timeLeftMs > 0` is False (Anti-snipe skipped) | **FAIL** (Bug) |
| Buyout when `currentPrice < buyoutPrice` | Auction status `buyout_claimed`, price set to `buyoutPrice`, escrow created | Status `buyout_claimed`, price = `buyoutPrice`, escrow created | **PASS** |
| Buyout when `currentPrice >= buyoutPrice` (e.g. current=$600, buyout=$500) | Buyout rejected (bidding exceeded buyout) | Buyout accepted; `currentPrice` **reduced** from $600 to $500 | **FAIL** (Bug) |
| Buyout on expired auction (`now > endTime`, status='active') | Buyout rejected (auction expired) | Buyout accepted; status set to `buyout_claimed` | **FAIL** (Bug) |
| Bid submitted after Buyout on server | Bid rejected (`status !== 'active'`) | Bid rejected with 'Auction is not active' | **PASS** |
| Concurrent Bid & Buyout in Firestore (`src/utils/firebase.ts`) | Atomic transaction isolates state | Non-atomic `setDoc` causes bid to overwrite buyout status | **FAIL** (Bug) |
| Release Escrow when shipment is `payment_confirmed` (before dispatch) | Release rejected (shipment not dispatched/delivered) | Release succeeds; status set to `received` & escrow `released` | **FAIL** (Bug) |
| Release Escrow when escrow is in `disputed` state | Release rejected (active dispute) | Release succeeds; escrow status overwritten to `released` | **FAIL** (Bug) |
| Non-buyer / non-admin user calling `/api/escrows/:id/release` | Request forbidden (403 Unauthorized) | Request succeeds (200 OK); escrow released | **FAIL** (Bug) |
| Direct Firestore write to `/escrows/{escrowId}` by arbitrary signed-in user | Write forbidden by security rules | `allow update: if isSignedIn()` allows direct write | **FAIL** (Bug) |

---

## Unchallenged Areas

- **Payment gateway processing**: Third-party payment gateways (Stripe, HyperPay, etc.) were out of scope as payments are simulated via internal Escrow data structures.
