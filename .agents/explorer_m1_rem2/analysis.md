# Forensic Audit Remediation Blueprint — Milestone 1 Re-Audit

## Executive Summary
This document provides a line-level remediation blueprint for security vulnerabilities and rule defects identified in `server.ts` and `firestore.rules` during the second empirical forensic audit. All findings have been verified line-by-line against the codebase.

---

## 1. `server.ts` Endpoint Vulnerability Analysis & Blueprint

### 1.1 `POST /api/support/tickets/:id/reply`
- **Location**: `server.ts:527`
- **Current State**:
  ```ts
  app.post('/api/support/tickets/:id/reply', (req, res) => {
  ```
- **Vulnerability**: Lacks authorization middleware (`requireAdmin`). Unauthenticated public clients can respond to ticket IDs.
- **Required Remediation**: Add `requireAdmin` middleware.
  ```ts
  app.post('/api/support/tickets/:id/reply', requireAdmin, (req, res) => {
  ```

### 1.2 `GET /api/support/tickets`
- **Location**: `server.ts:494-496`
- **Current State**:
  ```ts
  app.get('/api/support/tickets', (req, res) => {
    res.json({ tickets: DB.tickets });
  });
  ```
- **Vulnerability**: Completely unauthenticated and unpartitioned, returning all tickets to any caller.
- **Required Remediation**: Add `requireAuth` middleware. If caller is `admin`, return `DB.tickets`; otherwise, return tickets filtered by `currentUser.email` (`DB.tickets.filter(t => t.email.toLowerCase() === currentUser.email.toLowerCase())`).
  ```ts
  app.get('/api/support/tickets', requireAuth, (req, res) => {
    const currentUser = (req as any).user as User;
    if (currentUser.role === 'admin') {
      return res.json({ tickets: DB.tickets });
    }
    const userTickets = DB.tickets.filter(t => t.email.toLowerCase() === currentUser.email.toLowerCase());
    res.json({ tickets: userTickets });
  });
  ```

### 1.3 `PUT /api/auth/profile`
- **Location**: `server.ts:133-146`
- **Current State**:
  ```ts
  app.put('/api/auth/profile', (req, res) => {
    const currentUser = getUserFromReq(req);
    if (!currentUser) return res.status(401).json({ success: false, error: 'Unauthorized' });
    const { name, phone, preferredCurrency, preferredLanguage, balance } = req.body;
    currentUser.name = name ?? currentUser.name;
    currentUser.phone = phone ?? currentUser.phone;
    currentUser.preferredCurrency = preferredCurrency ?? currentUser.preferredCurrency;
    currentUser.preferredLanguage = preferredLanguage ?? currentUser.preferredLanguage;
    if (typeof balance === 'number') {
      currentUser.balance = balance;
    }
    DB.updateUser(currentUser);
    res.json({ success: true, user: currentUser });
  });
  ```
- **Vulnerability**: Accepts `balance` in request body and mutates `currentUser.balance` directly, permitting arbitrary balance escalation by any user.
- **Required Remediation**: Remove `balance` mutation from `PUT /api/auth/profile` altogether so regular users cannot mutate their balance via profile edits. (Balance modifications remain restricted to verified payment/escrow flows or admin CRM endpoints).
  ```ts
  app.put('/api/auth/profile', (req, res) => {
    const currentUser = getUserFromReq(req);
    if (!currentUser) return res.status(401).json({ success: false, error: 'Unauthorized' });
    const { name, phone, preferredCurrency, preferredLanguage } = req.body;
    currentUser.name = name ?? currentUser.name;
    currentUser.phone = phone ?? currentUser.phone;
    currentUser.preferredCurrency = preferredCurrency ?? currentUser.preferredCurrency;
    currentUser.preferredLanguage = preferredLanguage ?? currentUser.preferredLanguage;
    DB.updateUser(currentUser);
    res.json({ success: true, user: currentUser });
  });
  ```

### 1.4 `POST /api/shipments/update-tracking`
- **Location**: `server.ts:299-318`
- **Current State**:
  ```ts
  app.post('/api/shipments/update-tracking', (req, res) => {
    const { auctionId, carrier, trackingNumber, estimatedDelivery, cityAr, cityEn } = req.body;
  ```
- **Vulnerability**: No `requireAuth` or seller/admin authorization check. Anyone can overwrite tracking information for any shipment.
- **Required Remediation**: Protect with `requireAuth`. Verify caller is admin OR seller of the associated auction.
  ```ts
  app.post('/api/shipments/update-tracking', requireAuth, (req, res) => {
    const currentUser = (req as any).user as User;
    const { auctionId, carrier, trackingNumber, estimatedDelivery, cityAr, cityEn } = req.body;
    if (!auctionId || !carrier || !trackingNumber) {
      return res.status(400).json({ success: false, messageAr: 'جميع معلومات التتبع مطلوبة' });
    }
    const auction = DB.auctions.find(a => a.id === auctionId);
    if (!auction) {
      return res.status(404).json({ success: false, messageAr: 'المزاد غير موجود' });
    }
    const isSeller = (auction.sellerEmail && auction.sellerEmail.toLowerCase() === currentUser.email.toLowerCase()) || (auction.seller && auction.seller.name === currentUser.name);
    const isAdmin = currentUser.role === 'admin';
    if (!isSeller && !isAdmin) {
      return res.status(403).json({ success: false, error: 'Forbidden: Only auction seller or admin can update tracking details' });
    }
    const result = DB.updateShipmentTracking(
      auctionId,
      carrier,
      trackingNumber,
      estimatedDelivery || '',
      cityAr || '',
      cityEn || ''
    );
    if (result.success) {
      broadcast('shipment_updated', result.shipment);
      res.json(result);
    } else {
      res.status(400).json(result);
    }
  });
  ```

### 1.5 CRM AI Endpoints Protection
- **Location**:
  - `server.ts:639` (`/api/crm/ai-chat`)
  - `server.ts:690` (`/api/crm/analyze-image`)
  - `server.ts:739` (`/api/crm/transcribe-audio`)
  - `server.ts:778` (`/api/crm/ai-campaign`)
- **Current State**: Handlers are defined without middleware (`app.post('/api/crm/ai-chat', async (req, res) => ...)`).
- **Vulnerability**: Exposes Gemini AI API quota to unauthenticated public access.
- **Required Remediation**: Add `requireAdmin` to all `/api/crm/*` AI endpoints (`/api/crm/ai-chat`, `/api/crm/analyze-image`, `/api/crm/transcribe-audio`, `/api/crm/ai-campaign`).
  ```ts
  app.post('/api/crm/ai-chat', requireAdmin, async (req, res) => { ... });
  app.post('/api/crm/analyze-image', requireAdmin, async (req, res) => { ... });
  app.post('/api/crm/transcribe-audio', requireAdmin, async (req, res) => { ... });
  app.post('/api/crm/ai-campaign', requireAdmin, async (req, res) => { ... });
  ```

---

## 2. `firestore.rules` Defect Analysis & Blueprint

### 2.1 `/auctions/{auctionId}` Seller Email Resolution & Allowed Updates
- **Location**: `firestore.rules:38-46`
- **Current State**:
  ```rules
  match /auctions/{auctionId} {
    allow read: if true;
    allow create: if isSignedIn();
    allow update: if isAdmin() || (isSignedIn() && (
      isOwner(resource.data.sellerEmail) ||
      request.resource.data.diff(resource.data).affectedKeys().hasOnly(['currentPrice', 'bidsCount', 'highBidder', 'highBidderName', 'viewsCount'])
    ));
    allow delete: if isAdmin();
  }
  ```
- **Defects**:
  1. `isOwner(resource.data.sellerEmail)` evaluates to `false` when `sellerEmail` is undefined or located at `resource.data.seller.email`.
  2. Frontend checkout attempts to set `trackingNumber` and `status` on auction documents when checkout completes, which fails for non-admin buyers unless included in affectedKeys or updated by seller/admin.
- **Required Remediation**:
  Update update condition to check `resource.data.sellerEmail` OR `(resource.data.seller != null && resource.data.seller.email != null && isOwner(resource.data.seller.email))`, and include `trackingNumber` and `status` in allowable update keys during buyer checkout.
  ```rules
  match /auctions/{auctionId} {
    allow read: if true;
    allow create: if isSignedIn();
    allow update: if isAdmin() || (isSignedIn() && (
      isOwner(resource.data.sellerEmail) ||
      (resource.data.seller != null && isOwner(resource.data.seller.email)) ||
      request.resource.data.diff(resource.data).affectedKeys().hasOnly(['currentPrice', 'bidsCount', 'highBidder', 'highBidderName', 'viewsCount', 'trackingNumber', 'status'])
    ));
    allow delete: if isAdmin();
  }
  ```

### 2.2 `/shipments/{shipmentId}` Read/Update Rules Fix
- **Location**: `firestore.rules:80-90`
- **Current State**:
  ```rules
  match /shipments/{shipmentId} {
    allow read: if isSignedIn() && (
      isOwner(resource.data.buyerEmail) || 
      isAdmin()
    );
    allow create, update: if isAdmin() || (
      isSignedIn() && isOwner(request.resource.data.buyerEmail)
    );
    allow delete: if isAdmin();
  }
  ```
- **Defects**:
  1. Sellers cannot read shipments for items they sold because `allow read` only checks `buyerEmail`.
  2. Buyers can arbitrarily mutate shipment status.
- **Required Remediation**:
  Allow read for buyer, seller (`resource.data.sellerEmail`), or admin.
  Restrict update permissions to seller, admin, or buyer (when creating/releasing escrow).
  ```rules
  match /shipments/{shipmentId} {
    allow read: if isSignedIn() && (
      isOwner(resource.data.buyerEmail) ||
      (resource.data.sellerEmail != null && isOwner(resource.data.sellerEmail)) ||
      isAdmin()
    );
    allow create: if isSignedIn();
    allow update: if isAdmin() || (
      isSignedIn() && (
        (resource.data.sellerEmail != null && isOwner(resource.data.sellerEmail)) ||
        isOwner(resource.data.buyerEmail)
      )
    );
    allow delete: if isAdmin();
  }
  ```

### 2.3 `/autobids/{autobidId}` Null Resource Check Fix
- **Location**: `firestore.rules:99-105`
- **Current State**:
  ```rules
  match /autobids/{autobidId} {
    allow read, write: if isSignedIn() && (
      isOwner(resource.data.userEmail) ||
      isOwner(request.resource.data.userEmail) ||
      isAdmin()
    );
  }
  ```
- **Defect**: Accessing `resource.data.userEmail` when `resource` is `null` on document creation causes Firestore security rule runtime errors.
- **Required Remediation**:
  Check `resource != null` before reading `resource.data`.
  ```rules
  match /autobids/{autobidId} {
    allow read: if isSignedIn() && (resource == null || isOwner(resource.data.userEmail) || isAdmin());
    allow create: if isSignedIn() && isOwner(request.resource.data.userEmail);
    allow update, delete: if isSignedIn() && ((resource != null && isOwner(resource.data.userEmail)) || isAdmin());
  }
  ```

---

## 3. Verification Commands for Implementer

1. TypeScript Check: `npx tsc --noEmit`
2. Build Check: `npm run build`
