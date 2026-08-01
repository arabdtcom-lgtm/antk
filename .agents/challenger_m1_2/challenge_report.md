# Defensive Security Code Review Report

## Challenge Summary

**Overall risk assessment**: CRITICAL
**Verdict**: VETO

Static code review of `server.ts` and `firestore.rules` identified multiple critical security vulnerabilities, broken authentication boundaries, route handling defects causing runtime crashes, and insecure resource authorization logic.

---

## Challenges

### [Critical] Challenge 1: Default Fallback to Admin Identity in `getUserFromReq` (`server.ts`)

- **Assumption challenged**: Request authentication defaults to an unauthenticated/anonymous state when headers/tokens are missing.
- **Attack scenario / Finding**:
  In `server.ts` lines 55–69:
  ```typescript
  const getUserFromReq = (req: express.Request): User => {
    const emailHeader = (req.headers['x-user-email'] as string) || (req.headers['x-user-id'] as string);
    const authHeader = req.headers['authorization'];
    let emailOrId = emailHeader;
    if (!emailOrId && authHeader && authHeader.startsWith('Bearer ')) {
      emailOrId = authHeader.substring(7);
    }

    if (emailOrId) {
      const matched = DB.users.find(u => u.email.toLowerCase() === emailOrId.toLowerCase() || u.id === emailOrId);
      if (matched) return matched;
    }

    return DB.users[0]; // <--- FALLBACK TO ADMIN USER
  };
  ```
  `DB.users[0]` corresponds to the seeded administrator account (`u1`, `arabdt.com@gmail.com`, `role: 'admin'`). Any request lacking authorization headers is automatically assigned the Admin identity.
- **Blast radius**:
  - `requireAuth` (`if (!user)`) never triggers a 401 response because `user` is never null/undefined.
  - `requireAdmin` (`if (!user || user.role !== 'admin')`) evaluates to `true` for unauthenticated requests, allowing complete privilege escalation to administrator endpoints (`/api/backups`, `/api/settings`, `/api/admin/metrics`, `/api/logs`, `/api/api-keys`).
  - Total session bleed: All unauthenticated visitors share the session identity and privileges of User 0 (Admin).
- **Mitigation**:
  Change `getUserFromReq` to return `User | null`. Return `null` if no valid header or token is provided or if no matching user is found. Update `requireAuth` and `requireAdmin` to handle `null`.

---

### [Critical] Challenge 2: Duplicate Express Route Registration Bypassing RBAC (`server.ts`)

- **Assumption challenged**: Middleware added on a second route registration protects earlier registrations of the same path.
- **Attack scenario / Finding**:
  `server.ts` defines `/api/crm/clients` twice:
  - Line 564 (Unauthenticated):
    ```typescript
    app.get('/api/crm/clients', (req, res) => {
      res.json({ success: true, clients: DB.users });
    });
    ```
  - Line 897 (Protected with `requireAdmin`):
    ```typescript
    app.get('/api/crm/clients', requireAdmin, (req, res) => {
      res.json({ success: true, clients: DB.users });
    });
    ```
  Express processes routes in the order they are defined. The unauthenticated handler on line 564 captures all `GET /api/crm/clients` requests first, rendering `requireAdmin` on line 897 completely unreachable and ineffective.
  Similarly, `DELETE /api/crm/clients/:id` is registered first at line 637 without middleware and at line 901 with `requireAdmin`.
- **Blast radius**: Full dump and deletion of CRM client data by unauthenticated callers.
- **Mitigation**: Remove the duplicate unauthenticated route definitions at lines 564 and 637, retaining only the protected routes with `requireAdmin`.

---

### [High] Challenge 3: Runtime Crash Bug in `POST /api/support/tickets` (`server.ts`)

- **Assumption challenged**: All variables referenced inside endpoint handlers are properly defined or extracted from context.
- **Attack scenario / Finding**:
  In `server.ts` lines 494–518:
  ```typescript
  app.post('/api/support/tickets', (req, res) => {
    const { subject, message } = req.body;
    const newTicket: SupportTicket = {
      id: `t_${Date.now()}`,
      email: currentUser.email, // ReferenceError: currentUser is not defined
      name: currentUser.name,
      ...
  ```
  `currentUser` is referenced without invoking `const currentUser = getUserFromReq(req);`.
- **Blast radius**: Submitting a ticket triggers an uncaught `ReferenceError: currentUser is not defined`, crashing request handling or causing HTTP 500 errors.
- **Mitigation**: Extract `currentUser` at the top of the handler: `const currentUser = getUserFromReq(req);` (and ensure authentication checks pass).

---

### [High] Challenge 4: Unprotected Financial & Logistical Endpoints (`server.ts`)

- **Assumption challenged**: Escrow release and shipment tracking updates are constrained to authorized users.
- **Attack scenario / Finding**:
  - `POST /api/escrows/:id/release` (line 266): Lacks `requireAuth` or ownership/admin check. Any network client can trigger fund release for arbitrary escrow records.
  - `POST /api/shipments/:id/update` (line 446): Allows unauthenticated callers to modify shipment status and force escrow status to `'released'`.
- **Blast radius**: Unauthorized payout triggering and manipulation of active transaction escrows.
- **Mitigation**: Apply authorization middleware and verify that only the designated buyer or an admin can trigger escrow release and shipment status updates.

---

### [Critical] Challenge 5: Insecure Rules and Overly Permissive Access in `firestore.rules`

- **Assumption challenged**: Firestore security rules restrict write operations and enforce user isolation.
- **Attack scenario / Finding**:
  1. **Unauthenticated User Creation & Cross-User Updates (`users` collection, lines 27–32)**:
     ```rules
     allow create: if isSignedIn() || request.resource.data.role == 'user';
     allow update: if isOwner(userId) || isAdmin() || (isSignedIn() && !request.resource.data.diff(resource.data).affectedKeys().hasAny(['role', 'balance']));
     ```
     - `allow create`: Allows unauthenticated clients (`isSignedIn() == false`) to write new user documents if `role == 'user'`.
     - `allow update`: Any authenticated user can modify fields of *other* users' documents as long as `role` and `balance` are not modified.
  2. **Unrestricted Auction Modification (`auctions` collection, lines 35–40)**:
     ```rules
     allow update: if isSignedIn() || isAdmin();
     ```
     - Any authenticated user can overwrite details of any auction document (price, title, seller ID, ending timestamp), regardless of ownership.
  3. **Privacy Leakage Across Collections (`tickets`, `shipments`, `escrows`, `autobids`)**:
     - `tickets` (line 69): `allow read: if isSignedIn();` — Allows any logged-in user to read all support tickets across all users.
     - `shipments` (line 76) & `escrows` (line 83): `allow read: if isSignedIn();` — Exposes all customer shipping addresses and financial escrow transactions to any authenticated user.
     - `autobids` (line 89): `allow read, write: if isSignedIn();` — Allows any signed-in user to view or modify all auto-bid parameters system-wide.
- **Blast radius**: Complete breakdown of data isolation, unauthorized manipulation of auctions and user profiles, and exposure of sensitive user financial/logistical PII in Firestore.
- **Mitigation**:
  - Restrict document creation to authenticated users.
  - Enforce ownership checks (`isOwner(userId)` or resource author matching) on update/read rules.
  - Scope `read` access on `tickets`, `shipments`, and `escrows` to authorized owners (`resource.data.userId == request.auth.uid`) or admins.

---

## Static Code Quality Verification Summary

| Component | Audit Scope | Issues Found | Status |
| :--- | :--- | :--- | :--- |
| `server.ts` | Session Isolation & `getUserFromReq` | Fallback to `DB.users[0]` (Admin), total auth bypass | **FAIL** |
| `server.ts` | Endpoint RBAC Enforcement | Duplicate route precedence, missing middleware on sensitive handlers | **FAIL** |
| `server.ts` | Variable Scope & Execution | Uncaught `ReferenceError` on `currentUser` in support tickets | **FAIL** |
| `firestore.rules` | Database Authorization Rules | Permissive updates, unauthenticated user creation, PII read leaks | **FAIL** |

## Conclusion & Verdict

**VERDICT: VETO**

The code in `server.ts` and `firestore.rules` fails baseline defensive security and code quality standards. Immediate remediation is required before deployment.
