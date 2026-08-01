# Comprehensive Audit of Firebase / Firestore Security Rules, Schema Design, and Database Queries

**Workspace**: `c:/Users/hp/OneDrive/Arbvps/antkawy`  
**Auditor**: explorer_m1_3  
**Date**: 2026-07-28  

---

## Executive Summary

A comprehensive security, architectural, and data layer audit was performed on the Firestore security rules (`firestore.rules`), JSON schema blueprint (`firebase-blueprint.json`), TypeScript interface definitions (`src/types.ts`), and data utility layer (`src/utils/firebase.ts`).

### Key Critical Risk
**Critical Security Flaw**: All primary Firestore collection paths (`/users/{userId}`, `/auctions/{auctionId}`, `/bids/{bidId}`, `/tickets/{ticketId}`, `/shipments/{shipmentId}`, `/escrows/{escrowId}`, `/logs/{logId}`, `/backupLogs/{backupLogId}`, `/apiKeys/{apiKeyId}`, `/settings/system`) in `firestore.rules` are currently configured with unrestricted public read/write permission (`allow read, write: if true;`). Additionally, key collections (`messages`, `qa`, `stats`, `autobids`) missing from security rules default to `allow read, write: if false;`, causing standard application queries for unrepresented features to fail in production.

---

## 1. Audit of Security Rules (`firestore.rules`)

### 1.1 Current Configuration & Vulnerability Assessment
The active `firestore.rules` file defines a global safety net (`match /{document=**} { allow read, write: if false; }`) followed by top-level block definitions for specific collections. However, every defined block uses completely unrestricted rules:

```firestore-rules
match /users/{userId} { allow read, write: if true; }
match /auctions/{auctionId} { allow read, write: if true; }
match /bids/{bidId} { allow read, write: if true; }
match /tickets/{ticketId} { allow read, write: if true; }
match /shipments/{shipmentId} { allow read, write: if true; }
match /escrows/{escrowId} { allow read, write: if true; }
match /logs/{logId} { allow read, write: if true; }
match /backupLogs/{backupLogId} { allow read, write: if true; }
match /apiKeys/{apiKeyId} { allow read, write: if true; }
match /settings/system { allow read, write: if true; }
```

#### Security Flaws Identified:
1. **Unrestricted Write Access (Financial & Data Tampering Risk)**:
   - Any unauthenticated client can modify any user profile (changing balances, roles to `admin`, email addresses).
   - Any client can edit active auction prices, high bidders, buyout prices, or set status to `completed` without making a payment.
   - Bids can be forged or backdated by inserting documents directly into `/bids`.
   - Escrow records can be altered (`status: "released"`), hijacking transaction status.
   - System API keys and backup logs can be read or modified by malicious parties.

2. **Unrestricted Read Access (PII & Data Leakage)**:
   - Sensitive user information (phone numbers, balances, roles) in `/users` is publicly exposed.
   - Financial escrow transaction details in `/escrows` and customer support tickets in `/tickets` are exposed.
   - Internal audit logs in `/logs` and administrative settings in `/settings/system` are public.

3. **Missing Collection Security Rules**:
   - `messages`: Private messaging (e.g. buyer/seller chat) currently stores messages in `localStorage` (`antkawy_messages`), but if extended to Firestore, has no rule entry and will be blocked by the global safety net.
   - `qa`: Questions and answers on auctions are not defined in rules.
   - `stats`: System/user statistics metrics lack rules.
   - `autobids`: Auto-bid preferences (currently in `localStorage` (`antkawy_autobids`)) lack Firestore rules.

---

## 2. Audit of Schema Definitions (`firebase-blueprint.json` & `types.ts`)

`firebase-blueprint.json` defines JSON schemas for 10 entities (`User`, `Auction`, `Bid`, `SupportTicket`, `Shipment`, `EscrowTransaction`, `BackupLog`, `ApiKey`, `SystemLog`, `SystemSettings`).

### 2.1 Dual Bidding & Auto-Bidding
- **Current State**:
  - `Bid` entity in `firebase-blueprint.json` has `id`, `auctionId`, `bidderName`, `bidderEmail`, `amount`, `timestamp`.
  - In `src/types.ts`, `Bid` includes an optional field `isAutomatic?: boolean`.
  - Auto-bidding state is managed entirely client-side via `localStorage` (`antkawy_autobids`) in `AutoBid.tsx` using `setInterval` checks.
- **Flaws & Gap Analysis**:
  - `firebase-blueprint.json` lacks definitions for `isAutomatic` or proxy bid limits (`maxBid`).
  - Client-side auto-bidding in `AutoBid.tsx` is unreliable (stops when user closes browser) and susceptible to race conditions when concurrent users bid.
  - Dual bidding (manual bid vs auto-bid ceiling) requires server-side validation or transactional processing to ensure bid increments adhere to `minIncrement`.

### 2.2 Instant Buyout
- **Current State**:
  - `Auction` entity includes `buyoutPrice?: number`.
  - `buyoutAuctionInFirestore` in `src/utils/firebase.ts` sets `status = 'completed'` and `currentPrice = buyoutPrice`.
- **Flaws & Gap Analysis**:
  - `firebase-blueprint.json` required fields for `Auction` are: `["id", "titleAr", "titleEn", "category", "startPrice", "currentPrice", "endTime", "status"]`. `buyoutPrice` is optional.
  - No schema constraint ensures `buyoutPrice > startPrice` or `buyoutPrice >= currentPrice`.
  - No atomic state transaction prevents two users from attempting instant buyout simultaneously.

### 2.3 USD Currency Standardization
- **Current State**:
  - `Auction` in `firebase-blueprint.json` has `currency?: string`.
  - `Auction` in `src/types.ts` has `currency: 'SAR' | 'USD' | 'EGP'`.
  - Seed auctions in `src/utils/firebase.ts` (e.g. `SUEZ_BOND_AUCTION`, `UMM_KULTHUM_RECEIPT_AUCTION`, `SAKAKINI_POLICY_AUCTION`, `KHEDIVE_ADVISER_AUCTION`) are set to `USD`.
  - However, `submitBidInFirestore` formats response messages in Arabic as `"ر.س"` (SAR) hardcoded (line 453), creating currency display mismatch when auctions are in `USD`.
- **Flaws & Gap Analysis**:
  - Missing field `currency` in required property array of `Auction` in `firebase-blueprint.json`.
  - Standardized monetary transactions require multi-currency storage with a normalized USD equivalent field (e.g. `amountUSD`, `currency: "USD"` as base currency).

### 2.4 Anti-Snipe Data Fields
- **Current State**:
  - `Auction` entity has `softCloseMinutes: number` in `firebase-blueprint.json` and `src/types.ts`.
  - In `src/utils/firebase.ts`, `submitBidInFirestore` checks if `endMs - now < 2 * 60 * 1000`, and extends `endTime` by 2 minutes if true.
- **Flaws & Gap Analysis**:
  - Hardcoded 2-minute soft-close window in `submitBidInFirestore` ignores the document's own `softCloseMinutes` field.
  - Schema lacks explicit tracking fields such as `antiSnipeTriggeredCount` or `lastExtendedAt` to audit soft-close extensions.

### 2.5 Escrow State Tracking
- **Current State**:
  - `EscrowTransaction` entity in `firebase-blueprint.json` has status enum `["held", "released"]`.
  - `EscrowTransaction` in `src/types.ts` has extended status enum `['held', 'released', 'disputed', 'refunded']`.
- **Flaws & Gap Analysis**:
  - Mismatch between `firebase-blueprint.json` (`held`, `released`) and `types.ts` (`held`, `released`, `disputed`, `refunded`).
  - Lacks timestamps for stage transitions (`releasedAt`, `disputedAt`, `refundedAt`).
  - Lacks explicit party bindings (`buyerId`, `sellerId`) referencing user document IDs rather than relying solely on strings (`buyerEmail`, `sellerName`).

---

## 3. Database Queries & Index Requirements Audit

### 3.1 Query Pattern Analysis
Examination of `src/utils/firebase.ts` reveals:
1. `fetchAuctionsFromFirestore()`: Performs `getDocs(collection(db, 'auctions'))` - reads all documents into memory.
2. `fetchBidsForAuction(auctionId)`: Performs `getDocs(collection(db, 'bids'))` and filters client-side:
   ```ts
   snap.docs.map(d => d.data() as Bid).filter(b => b.auctionId === auctionId).sort(...)
   ```
3. `loginUser(email)`: Performs `getDocs(collection(db, 'users'))` and filters client-side via `Array.prototype.find()`.
4. `fetchShipmentsFromFirestore()` & `fetchTicketsFromFirestore()`: Load entire collections into memory.

### 3.2 Index & Query Flaws
- **Missing Server-Side Filtering (`where`)**: Loading full collections into client memory causes severe network overhead and security risks as database size grows.
- **Missing Compound Query Indexes**:
  - Querying `bids` by `auctionId` sorted by `timestamp desc` (`query(collection(db, 'bids'), where('auctionId', '==', auctionId), orderBy('timestamp', 'desc'))`) requires a composite index on `bids`: `(auctionId ASC, timestamp DESC)`.
  - Querying active auctions sorted by `endTime` (`query(collection(db, 'auctions'), where('status', '==', 'active'), orderBy('endTime', 'asc'))`) requires a composite index on `auctions`: `(status ASC, endTime ASC)`.

---

## 4. Recommended Fixes & Implementation Plan

### 4.1 Recommended `firestore.rules` Implementation
```firestore-rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Helper functions
    function isSignedIn() {
      return request.auth != null;
    }
    
    function isOwner(userId) {
      return isSignedIn() && request.auth.uid == userId;
    }

    function isAdmin() {
      return isSignedIn() && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }

    // Global Safety Net
    match /{document=**} {
      allow read, write: if false;
    }

    // --- Users Collection ---
    match /users/{userId} {
      allow read: if isSignedIn();
      allow create: if isSignedIn() && request.auth.uid == userId;
      allow update: if isOwner(userId) && !request.resource.data.diff(resource.data).affectedKeys().hasAny(['role', 'balance']) || isAdmin();
      allow delete: if isAdmin();
    }

    // --- Auctions Collection ---
    match /auctions/{auctionId} {
      allow read: if true;
      allow create: if isSignedIn();
      allow update: if isSignedIn() && (
        // Seller updating listing details before bids exist
        (resource.data.seller.email == request.auth.token.email && resource.data.bidsCount == 0) ||
        // Bidder updating auction currentPrice / highBidder / bidsCount via valid bid logic
        (request.resource.data.diff(resource.data).affectedKeys().hasOnly(['currentPrice', 'highBidder', 'highBidderName', 'bidsCount', 'endTime', 'status', 'trackingNumber'])) ||
        isAdmin()
      );
      allow delete: if isAdmin();
    }

    // --- Bids Collection ---
    match /bids/{bidId} {
      allow read: if true;
      allow create: if isSignedIn() && request.resource.data.bidderEmail == request.auth.token.email;
      allow update, delete: if isAdmin();
    }

    // --- Messages Collection ---
    match /messages/{messageId} {
      allow read: if isSignedIn() && (resource.data.fromEmail == request.auth.token.email || resource.data.toEmail == request.auth.token.email);
      allow create: if isSignedIn() && request.resource.data.fromEmail == request.auth.token.email;
      allow update, delete: if isAdmin();
    }

    // --- QA Collection ---
    match /qa/{qaId} {
      allow read: if true;
      allow create: if isSignedIn();
      allow update, delete: if isAdmin() || (isSignedIn() && resource.data.authorEmail == request.auth.token.email);
    }

    // --- Support Tickets Collection ---
    match /tickets/{ticketId} {
      allow read: if isSignedIn() && (resource.data.email == request.auth.token.email || isAdmin());
      allow create: if isSignedIn();
      allow update: if isAdmin();
    }

    // --- Shipments Collection ---
    match /shipments/{shipmentId} {
      allow read: if isSignedIn() && (resource.data.buyerEmail == request.auth.token.email || isAdmin());
      allow create, update: if isAdmin();
    }

    // --- Escrow Transactions Collection ---
    match /escrows/{escrowId} {
      allow read: if isSignedIn() && (resource.data.buyerEmail == request.auth.token.email || resource.data.sellerEmail == request.auth.token.email || isAdmin());
      allow create, update: if isAdmin();
    }

    // --- System Logs & Admin Collections ---
    match /logs/{logId} {
      allow read, write: if isAdmin();
    }

    match /backupLogs/{backupLogId} {
      allow read, write: if isAdmin();
    }

    match /apiKeys/{apiKeyId} {
      allow read, write: if isAdmin();
    }

    match /settings/system {
      allow read: if isSignedIn();
      allow write: if isAdmin();
    }

    // --- Stats Collection ---
    match /stats/{statId} {
      allow read: if true;
      allow write: if isAdmin();
    }
  }
}
```

### 4.2 Recommended Schema Updates (`firebase-blueprint.json`)
1. **Sync `EscrowTransaction` status enum**: Update enum to `["held", "released", "disputed", "refunded"]` and add timestamps (`releasedAt`, `disputedAt`).
2. **Add USD base currency field**: Ensure `currency` is required, and include `amountUSD` on `Auction`, `Bid`, and `EscrowTransaction`.
3. **Add Anti-Snipe and Buyout constraints**: Add `antiSnipeTriggeredCount` (`number`) to `Auction` schema.
4. **Add `isAutomatic` to `Bid` entity schema**:
   ```json
   "isAutomatic": { "type": "boolean" },
   "maxBidCeiling": { "type": "number" }
   ```
5. **Add `Message` entity schema to `firebase-blueprint.json`**:
   ```json
   "Message": {
     "title": "Message",
     "description": "Private user-to-user message",
     "type": "object",
     "properties": {
       "id": { "type": "string" },
       "auctionId": { "type": "string" },
       "fromEmail": { "type": "string" },
       "toEmail": { "type": "string" },
       "content": { "type": "string" },
       "timestamp": { "type": "string" },
       "read": { "type": "boolean" }
     },
     "required": ["id", "fromEmail", "toEmail", "content", "timestamp"]
   }
   ```

### 4.3 Recommended Firestore Index Configurations (`firestore.indexes.json`)
```json
{
  "indexes": [
    {
      "collectionGroup": "bids",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "auctionId", "order": "ASCENDING" },
        { "fieldPath": "timestamp", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "auctions",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "status", "order": "ASCENDING" },
        { "fieldPath": "endTime", "order": "ASCENDING" }
      ]
    },
    {
      "collectionGroup": "messages",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "toEmail", "order": "ASCENDING" },
        { "fieldPath": "timestamp", "order": "DESCENDING" }
      ]
    }
  ],
  "fieldOverrides": []
}
```

---
*Report compiled by explorer_m1_3 for Project Orchestrator.*
