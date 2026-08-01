# Verified Buyer/Seller Escrow Checkout Workflow: Architectural Analysis & Design Specification

**Agent**: `teamwork_preview_explorer_m2_3`  
**Milestone**: M2.3 — Core Auction & Escrow Protection Enhancements  
**Target Scope**: Verified Buyer/Seller Escrow Checkout Workflow  
**Date**: July 28, 2026  

---

## 1. Executive Summary & Audit Findings

An architectural audit was performed on the existing Antkawy codebase to assess the current implementation of the Escrow Checkout Workflow and design an enterprise-grade, dual-verified (Buyer/Seller) Escrow state machine with standardized **$ USD** financial accounting.

### Key Codebase Observations:

1. **`src/components/EscrowCheckout.tsx`**:
   - **Finding**: File **does not exist** as a standalone module.
   - **Current State**: Escrow payment UI is embedded directly inside `src/components/AuctionDetails.tsx` (lines 2011–2360) as an inline gateway simulator supporting Card, PayPal, Apple Pay, STC Pay, and Crypto payment methods.
   - **Architectural Need**: Extract and expand into a dedicated `src/components/EscrowCheckout.tsx` component and companion `src/components/EscrowInvoice.tsx` component for modularity, reusable rendering, and clean state separation.

2. **`server.ts` & `server/db.ts` Escrow Endpoints**:
   - **Finding**: Basic escrow endpoints exist, but lack granular lifecycle coverage and verification gates:
     - `POST /api/payment/checkout` (`server.ts`: line 254) -> invokes `DB.checkoutEscrow()`, initializes shipment in `'payment_confirmed'` and escrow in `'held'` state immediately.
     - `POST /api/escrows/:id/release` (`server.ts`: line 268) -> releases held funds directly via `DB.releaseEscrow()`.
     - `POST /api/shipments/update-tracking` (`server.ts`: line 296) -> allows seller to add carrier and tracking number.
     - `GET /api/escrows` (`server.ts`: line 496) -> dumps raw array `DB.escrows`.
   - **Gaps Identified**:
     - No explicit `'pending'` payment verification state before funds transition to `'held'`.
     - No seller identity verification check (`seller.verified === true`) before allowing tracking submission.
     - Missing dispute (`POST /api/escrows/:id/dispute`) and refund (`POST /api/escrows/:id/refund`) endpoints.
     - No automated invoice/receipt generator endpoint in $ USD (`GET /api/escrows/:id/invoice`).

3. **`src/utils/firebase.ts`**:
   - **Finding**: Contains `checkoutEscrowInFirestore()` (line 547), `fetchShipmentsFromFirestore()` (line 367), and `fetchAuctionsFromFirestore()` (line 302).
   - **Gaps Identified**:
     - `checkoutEscrowInFirestore` directly writes to `shipments` collection and updates `auctions` doc, but does **not** create a document in the `escrows` collection because client-side Firestore security rules restrict `escrows` writes to `isAdmin()`.
     - Missing helper functions: `releaseEscrowInFirestore`, `updateTrackingInFirestore`, `disputeEscrowInFirestore`, `refundEscrowInFirestore`, and `fetchEscrowByIdFromFirestore`.

4. **`firestore.rules`**:
   - **Finding**: Security rules for `escrows` (`firestore.rules`: lines 99–102) state:
     ```firestore
     match /escrows/{escrowId} {
       allow read: if isSignedIn();
       allow create, update, delete: if isAdmin();
     }
     ```
   - **Gaps Identified**:
     - `allow read: if isSignedIn();` allows any authenticated user to view all escrow records in the system (privacy concern).
     - Buyers and Sellers cannot directly trigger state updates in Firestore without server authority or admin privilege.

5. **`src/types.ts`**:
   - **Finding**: `EscrowTransaction` interface (lines 101–114) currently defines:
     ```typescript
     export interface EscrowTransaction {
       id: string;
       auctionId: string;
       auctionTitleAr: string;
       auctionTitleEn: string;
       amount: number;
       currency: 'SAR' | 'USD' | 'EGP';
       buyerEmail: string;
       sellerName: string;
       status: 'held' | 'released' | 'disputed' | 'refunded';
       createdAt: string;
       paymentMethod?: string;
       paymentDetails?: string;
     }
     ```
   - **Gaps Identified**: Status enum is missing `pending`, `dispatched`, and `delivered`. Missing fields: `amountUSD`, `sellerEmail`, `sellerVerified`, `trackingNumber`, `carrier`, `disputedAt`, `disputeReason`, `releasedAt`, `refundedAt`, `invoiceNumber`.

---

## 2. Verified Buyer/Seller Escrow State Machine Design

### 2.1 State Lifecycle Diagram

```
                 [ BUYER INITIATES CHECKOUT ]
                              │
                              ▼
                         ( pending )  ◄── Payment Initiated (Card / PayPal / Crypto / STC Pay)
                              │
              ┌───────────────┴───────────────┐
              │ Payment Verification Success  │ Payment Failed / Cancelled
              ▼                               ▼
           ( held )                       ( refunded )
              │
              │ Seller Verified (seller.verified == true)
              │ & Tracking Entry (Carrier + Tracking No)
              ▼
        ( dispatched ) ◄── Shipping Label Active (Aramex/DHL/FedEx)
              │
              │ Carrier Telemetry / Delivery Confirmed
              ▼
         ( delivered ) ◄── Package Handed to Buyer (Inspection Window 72h Starts)
              │
      ┌───────┴───────────────────────────────┬───────────────────────────────┐
      │ Buyer Confirms / Timeout (72h)        │ Buyer Files Dispute           │ Cancel / Admin Order Issue
      ▼                                       ▼                               ▼
  ( released )                          ( disputed )                     ( refunded )
  [Funds Payout to Seller]                     │                              [Funds Returned to Buyer]
                                               ├──────────────────────────────┘
                                               │ Admin Resolves Dispute
                                               ▼
                                      ( released / refunded )
```

### 2.2 Detailed State Definitions & Transition Matrix

| Current State | Target State | Trigger / Action | Allowed Roles | Verification & Invalidation Conditions |
|---|---|---|---|---|
| **N/A** | `pending` | Buyer clicks checkout & submits payment credentials | Buyer | Buyer must be authenticated; auction must be in `completed` status with buyer as `highBidder`. |
| `pending` | `held` | Payment Gateway Webhook / Balance lock confirmation | System / Gateway | Payment details validated; funds deducted/authorized in $ USD; escrow vault locked. |
| `pending` | `refunded` | Payment authorization failed or buyer cancels before clearance | System / Buyer | Card declined or transaction gateway timeout. |
| `held` | `dispatched` | Seller submits valid tracking number & selects shipping carrier | Verified Seller / Admin | Seller account `verified: true`; valid non-empty `trackingNumber` & recognized `carrier`. |
| `dispatched` | `delivered` | Carrier webhook update / Admin status update / Buyer receipt flag | Carrier API / Admin / Buyer | Carrier API reports delivery OR tracking status equals `delivered` / `received`. |
| `delivered` | `released` | Buyer confirms satisfaction OR 72-hour inspection window expires | Buyer / System Cron | Buyer explicitly approves release OR 72h auto-release timer fires with no active dispute. |
| `held` / `dispatched` / `delivered` | `disputed` | Buyer files formal ticket reporting damaged/missing item | Buyer | `buyerEmail` matches transaction buyer; dispute window active; reason provided. |
| `disputed` | `released` | Admin resolves dispute in seller's favor | Admin | Manual admin audit of proof of delivery / item condition. |
| `disputed` | `refunded` | Admin resolves dispute in buyer's favor | Admin | Manual admin audit confirming item defective/lost; funds returned in $ USD. |

---

## 3. Core Functional Modules Design

### 3.1 Buyer Payment Verification Module
- **Currency Standardization**: Primary accounting performed in **$ USD**. Local currencies (SAR / EGP) converted using standard platform rates ($1 USD = 3.75 SAR = 50 EGP).
- **Verification Gates**:
  1. Authenticated session check (`req.user.email`).
  2. Auction ownership / high bidder verification (`auction.highBidder === req.user.email`).
  3. Balance / Card authorization check via payment provider simulation.
- **State Output**: Transition escrow from `pending` -> `held`.

### 3.2 Seller Identity Verification Module
- **Verification Requirement**: Payout and shipping tracking submission are gated by Seller Verification.
- **Seller Identity Checks**:
  1. `auction.sellerEmail` or `auction.seller.name` must match the authenticated caller (`req.user.email` / `req.user.name`).
  2. `seller.verified` property must evaluate to `true` (or verified via admin approval). If unverified, system prompts seller to complete KYC before dispatching high-value items ($ USD).

### 3.3 Tracking Number Entry & Carrier Integration
- **Carrier Options**: Aramex Express, DHL Express, FedEx, SMSA Express, Local Courier.
- **Payload Validation**:
  - `carrier`: Required enum string.
  - `trackingNumber`: Minimum 6 alphanumeric characters.
  - `estimatedDelivery`: Valid ISO date string.
- **Live Carrier Lookup**: Integration with `/api/shipping/carrier-lookup` to poll real-time tracking checkpoints and auto-advance shipment status from `dispatched` to `delivered`.

### 3.4 Fund Release & Disbursement Confirmation
- **Direct Payout Execution**:
  - When status changes to `released`, seller balance (`user.balance`) is credited with `amountUSD` minus platform escrow commission fee (e.g., 2 font-serif commission).
  - System logs financial event in `logs` collection.
- **Automated Timeout Release**: 72-hour background timer (configured via `SystemSettings.escrowReleaseTimeoutDays`) automatically releases funds if no dispute is opened.

### 3.5 Dispute & Refund Resolution Module
- **Filing a Dispute**: Buyer can initiate dispute during `held`, `dispatched`, or `delivered` phases before release.
- **Escrow Freeze**: Freezes state as `disputed`, preventing manual or automated fund release.
- **Admin Settlement**: Admin panel presents side-by-side evidence review (dispute notes, carrier telemetry, images) to trigger either `POST /api/escrows/:id/release` or `POST /api/escrows/:id/refund`.

### 3.6 Automated Invoice / Receipt Generator ($ USD)
- **Component**: `src/components/EscrowInvoice.tsx`.
- **Rendered Output**:
  - Official Antkawy Escrow Receipt Header with QR Code verification.
  - Seller & Buyer Verified Profiles (Name, Email, Verification Badges).
  - Itemized Financial Table in **$ USD**:
    - Item Final Hammer Price ($ USD)
    - Escrow Protection Fee (2.5%): $ USD
    - Insured Express Shipping: $ USD
    - **Total Paid in Escrow Vault**: **$ USD**
  - Transaction Audit Trail: Timestamped log of state transitions (`pending` -> `held` -> `dispatched` -> `delivered` -> `released`).
  - Print & PDF download handler (`window.print()`).

---

## 4. API Endpoint Contracts

### 4.1 Initiate Escrow Checkout
- **Endpoint**: `POST /api/escrows/checkout`
- **Auth Required**: Yes (`requireAuth`)
- **Request Body**:
  ```json
  {
    "auctionId": "a_suez_bond",
    "paymentMethod": "card", // "card" | "paypal" | "applepay" | "stcpay" | "crypto"
    "paymentDetails": {
      "cardNumber": "**** **** **** 9010",
      "currency": "USD"
    }
  }
  ```
- **Response** (`200 OK`):
  ```json
  {
    "success": true,
    "escrow": {
      "id": "es_1772093000000",
      "auctionId": "a_suez_bond",
      "auctionTitleAr": "سند مالية ملكي أثري نادر",
      "auctionTitleEn": "Royal Suez Canal Financing Bond",
      "amountUSD": 1500.00,
      "amount": 1500.00,
      "currency": "USD",
      "buyerEmail": "john.miller@gmail.com",
      "sellerName": "أنتيكاوي",
      "sellerEmail": "arabdt.com@gmail.com",
      "sellerVerified": true,
      "status": "held",
      "createdAt": "2026-07-28T10:00:00.000Z",
      "paymentMethod": "Credit Card",
      "invoiceNumber": "INV-2026-98124"
    },
    "shipment": {
      "id": "sh_1772093000000",
      "auctionId": "a_suez_bond",
      "buyerEmail": "john.miller@gmail.com",
      "status": "payment_confirmed",
      "carrier": "",
      "trackingNumber": ""
    }
  }
  ```

### 4.2 Submit Seller Tracking Details
- **Endpoint**: `POST /api/escrows/:id/tracking`
- **Auth Required**: Yes (`requireAuth` + Seller identity check)
- **Request Body**:
  ```json
  {
    "carrier": "Aramex Express",
    "trackingNumber": "AMX-998123-SA",
    "estimatedDelivery": "2026-07-31",
    "originCityAr": "الرياض",
    "originCityEn": "Riyadh"
  }
  ```
- **Response** (`200 OK`):
  ```json
  {
    "success": true,
    "escrowStatus": "dispatched",
    "shipment": {
      "id": "sh_1772093000000",
      "carrier": "Aramex Express",
      "trackingNumber": "AMX-998123-SA",
      "status": "dispatched"
    }
  }
  ```

### 4.3 Release Escrow Funds (Buyer or Admin)
- **Endpoint**: `POST /api/escrows/:id/release`
- **Auth Required**: Yes (`requireAuth` + Buyer or Admin check)
- **Request Body**: `{}`
- **Response** (`200 OK`):
  ```json
  {
    "success": true,
    "messageAr": "تم الإفراج عن الأموال وتغذيتها لحساب البائع بنجاح.",
    "messageEn": "Escrow funds successfully released to seller balance.",
    "escrow": {
      "id": "es_1772093000000",
      "status": "released",
      "releasedAt": "2026-07-28T10:30:00.000Z"
    }
  }
  ```

### 4.4 File Escrow Dispute (Buyer)
- **Endpoint**: `POST /api/escrows/:id/dispute`
- **Auth Required**: Yes (`requireAuth` + Buyer check)
- **Request Body**:
  ```json
  {
    "reason": "Item arrived with damaged packaging and missing certificate of authenticity."
  }
  ```
- **Response** (`200 OK`):
  ```json
  {
    "success": true,
    "messageAr": "تم فتح نزاع رسمي وتجميد مبالغ الضمان لحين مراجعة الإدارة.",
    "escrow": {
      "id": "es_1772093000000",
      "status": "disputed",
      "disputedAt": "2026-07-28T10:35:00.000Z",
      "disputeReason": "Item arrived with damaged packaging..."
    }
  }
  ```

### 4.5 Refund Escrow Funds (Admin Only)
- **Endpoint**: `POST /api/escrows/:id/refund`
- **Auth Required**: Yes (`requireAdmin`)
- **Request Body**:
  ```json
  {
    "reason": "Dispute approved. Item returned to seller."
  }
  ```
- **Response** (`200 OK`):
  ```json
  {
    "success": true,
    "messageAr": "تمت معالجة استرجاع الأموال لحساب المشتري بنجاح.",
    "escrow": {
      "id": "es_1772093000000",
      "status": "refunded",
      "refundedAt": "2026-07-28T10:40:00.000Z"
    }
  }
  ```

### 4.6 Fetch Invoice / Receipt Data
- **Endpoint**: `GET /api/escrows/:id/invoice`
- **Auth Required**: Yes (`requireAuth` — Buyer, Seller, or Admin)
- **Response** (`200 OK`):
  ```json
  {
    "success": true,
    "invoice": {
      "invoiceNumber": "INV-2026-98124",
      "date": "2026-07-28T10:00:00.000Z",
      "auctionId": "a_suez_bond",
      "title": "Royal Suez Canal Financing Bond (1863 AD)",
      "buyer": { "name": "John Miller", "email": "john.miller@gmail.com" },
      "seller": { "name": "أنتيكاوي", "email": "arabdt.com@gmail.com", "verified": true },
      "currency": "USD",
      "hammerPriceUSD": 1500.00,
      "escrowFeeUSD": 37.50,
      "shippingFeeUSD": 25.00,
      "totalUSD": 1562.50,
      "status": "held",
      "paymentMethod": "Credit Card"
    }
  }
  ```

---

## 5. Schema & Security Rules Adjustments

### 5.1 Updated TypeScript Interface (`src/types.ts`)

```typescript
export type EscrowStatus = 'pending' | 'held' | 'dispatched' | 'delivered' | 'released' | 'disputed' | 'refunded';

export interface EscrowTransaction {
  id: string;
  auctionId: string;
  auctionTitleAr: string;
  auctionTitleEn: string;
  amount: number;
  amountUSD: number;
  currency: 'SAR' | 'USD' | 'EGP';
  buyerEmail: string;
  buyerName?: string;
  sellerName: string;
  sellerEmail?: string;
  sellerVerified?: boolean;
  trackingNumber?: string;
  carrier?: string;
  status: EscrowStatus;
  createdAt: string;
  releasedAt?: string;
  disputedAt?: string;
  disputeReason?: string;
  refundedAt?: string;
  refundReason?: string;
  paymentMethod?: string;
  paymentDetails?: string;
  invoiceNumber?: string;
}
```

### 5.2 Granular Firestore Security Rules (`firestore.rules`)

```firestore
// --- Escrow Transactions Collection ---
match /escrows/{escrowId} {
  allow read: if isSignedIn() && (
    isOwner(resource.data.buyerEmail) ||
    (resource.data.sellerEmail != null && isOwner(resource.data.sellerEmail)) ||
    isAdmin()
  );
  allow create: if isSignedIn();
  allow update: if isAdmin() || (
    isSignedIn() && (
      (isOwner(resource.data.buyerEmail) && request.resource.data.diff(resource.data).affectedKeys().hasOnly(['status', 'releasedAt', 'disputedAt', 'disputeReason'])) ||
      (resource.data.sellerEmail != null && isOwner(resource.data.sellerEmail) && request.resource.data.diff(resource.data).affectedKeys().hasOnly(['status', 'trackingNumber', 'carrier']))
    )
  );
  allow delete: if isAdmin();
}
```

---

## 6. Implementation Roadmap for Implementer

1. **Step 1: Type & Schema Update** (`src/types.ts`, `firebase-blueprint.json`)
   - Update `EscrowStatus` type to include `'pending' | 'held' | 'dispatched' | 'delivered' | 'released' | 'disputed' | 'refunded'`.
   - Add `amountUSD`, `sellerEmail`, `sellerVerified`, `trackingNumber`, `carrier`, timestamps, and dispute fields to `EscrowTransaction`.

2. **Step 2: Server DB & API Endpoints** (`server/db.ts`, `server.ts`)
   - Update `DB.checkoutEscrow()` and `DB.releaseEscrow()`.
   - Add backend methods: `DB.disputeEscrow()`, `DB.refundEscrow()`, `DB.verifySeller()`.
   - Implement routes: `POST /api/escrows/checkout`, `POST /api/escrows/:id/tracking`, `POST /api/escrows/:id/release`, `POST /api/escrows/:id/dispute`, `POST /api/escrows/:id/refund`, `GET /api/escrows/:id/invoice`.

3. **Step 3: Firebase Helpers & Security Rules** (`src/utils/firebase.ts`, `firestore.rules`)
   - Update `firestore.rules` with scoped read/update permissions for buyer/seller.
   - Implement client helper functions: `releaseEscrowInFirestore`, `disputeEscrowInFirestore`, `refundEscrowInFirestore`, `fetchEscrowByIdFromFirestore`.

4. **Step 4: Standalone React Components**
   - Create `src/components/EscrowCheckout.tsx`: Modular checkout flow supporting payment method selection, seller identity verification check, tracking display, state progression timeline, dispute trigger, and release confirmation.
   - Create `src/components/EscrowInvoice.tsx`: Professional printable $ USD receipt and tax invoice.

5. **Step 5: UI Wire-up in `AuctionDetails.tsx` & `AdminPanel.tsx`**
   - Replace inline checkout code in `AuctionDetails.tsx` with `<EscrowCheckout />` and invoice modal button.
   - Add Escrow Dispute/Refund controls in `AdminPanel.tsx`.

---
