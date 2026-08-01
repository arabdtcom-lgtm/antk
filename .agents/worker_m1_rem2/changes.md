# Summary of Code Changes — Security Remediation (m1_rem2)

## 1. `server.ts`
- **`PUT /api/auth/profile`**:
  - Removed `balance` property mutation from user body input to prevent self-inflation of balance.
- **`POST /api/shipments/update-tracking`**:
  - Added `requireAuth` middleware.
  - Added caller verification ensuring only the auction seller or an admin can update tracking details. Returns 403 Forbidden otherwise.
- **`GET /api/support/tickets`**:
  - Added `requireAuth` middleware.
  - Added user isolation logic: admins see all tickets, while standard users only see tickets matching `currentUser.email`.
- **`POST /api/support/tickets/:id/reply`**:
  - Added `requireAdmin` middleware to prevent unauthorized users from replying to tickets.
- **CRM AI Endpoints (`/api/crm/ai-chat`, `/api/crm/analyze-image`, `/api/crm/transcribe-audio`, `/api/crm/ai-campaign`)**:
  - Added `requireAdmin` middleware to all four endpoints to prevent public quota depletion.

## 2. `firestore.rules`
- **`/auctions/{auctionId}`**:
  - Extended update check to support seller email stored at either `resource.data.sellerEmail` or `resource.data.seller.email`.
  - Added `trackingNumber` and `status` to allowable update keys during buyer checkout.
- **`/shipments/{shipmentId}`**:
  - Granted read permission to `buyerEmail`, `sellerEmail`, or `isAdmin()`.
  - Enforced restricted update permissions for seller, buyer, and admin.
- **`/autobids/{autobidId}`**:
  - Safely structured rules to handle `resource == null` during document creation (`read`, `create`, `update, delete`), preventing security rule evaluation exceptions.

## 3. `src/components/ErrorBoundary.tsx`
- Explicitly inherited from `React.Component<Props, State>` with super constructor initialization to resolve TypeScript class component type checking.

## 4. Build & Verification
- `npm run build`: Exit code 0 (Vite frontend build + esbuild server bundle `dist-server/server.cjs` completed successfully).
