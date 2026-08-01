# Handoff Report — Explorer M2.1

## 1. Observation

### Exact File Paths, Line Numbers, and Findings

1. **Missing Standalone Bidding Component**:
   - **Path**: `src/components/BiddingComponent.tsx`
   - **Observation**: File search across workspace confirms `src/components/BiddingComponent.tsx` **does not exist**.
   - **Line Reference**: Bidding UI form is embedded inside `src/components/AuctionDetails.tsx` (lines 1816–1995) and `src/components/AutoBid.tsx`.

2. **Currency Division Bug & USD Misconfiguration**:
   - **Path**: `src/utils/translations.ts`
   - **Lines 266–290**:
     ```typescript
     export function formatPrice(amount: number, currency: Currency, lang: Language): string {
       let converted = amount;
       let symbol = 'ر.س';
       if (currency === 'USD') {
         converted = amount / 3.75;
         symbol = '$';
       ...
     ```
   - **Observation**: `formatPrice` divides `amount` by 3.75 when `currency === 'USD'`. For `SUEZ_BOND_AUCTION` (`src/utils/firebase.ts` line 161, `startPrice: 500`, `currency: 'USD'`), formatting outputs **$133** instead of **$500** because $500 / 3.75 = 133.33.
   - **Path**: `src/utils/firebase.ts`
     - **Line 453**: `messageAr: 'تم تقديم مزايدتك بنجاح بقيمة ${amount} ر.س'` hardcodes SAR (`ر.س`).
     - **Line 533**: `currency: data.currency || 'SAR'` defaults to SAR.
   - **Path**: `src/components/AutoBid.tsx`
     - **Line 122**: Hardcoded UI string: `{lang === 'ar' ? 'الحد الأقصى (ر.س)' : 'Maximum Bid (SAR)'}`.
     - **Line 164**: Hardcoded SAR message strings.
   - **Path**: `src/components/CreateAuction.tsx`
     - **Line 35**: `const [currency, setCurrency] = useState<Currency>('SAR');` defaults to SAR.
     - **Line 252**: Form label: `السعر الافتتاحي المبدئي (SAR)`.

3. **Status State Machine & Buyout Deficiencies**:
   - **Path**: `src/types.ts`
     - **Line 34**: `status: 'active' | 'pending_payment' | 'completed' | 'cancelled'`. Missing `'ended'` and `'buyout_claimed'`.
   - **Path**: `src/utils/firebase.ts` (`buyoutAuctionInFirestore`)
     - **Lines 481–487**:
       ```typescript
       const updatedAuction: Auction = {
         ...currentAuction,
         currentPrice: buyoutPrice,
         highBidder: user.email,
         highBidderName: user.name,
         status: 'completed'
       };
       ```
     - **Observation**: Status transitions to `'completed'`, not `'ended'` / `'buyout_claimed'`. No `EscrowTransaction` is created in Firestore `escrows` collection on buyout. No buyer/seller notifications are triggered.
   - **Path**: `server/db.ts` (`buyoutAuction`)
     - **Lines 1095–1108**: Sets `auction.status = 'completed'`. Does not insert into `this.escrows` or Firestore `escrows`. Does not send direct buyer/seller inbox messages.

4. **Minimum Bid Increment Inconsistencies**:
   - **Path**: `src/components/AuctionDetails.tsx` (lines 207–216): Calculates progressive dynamic increments (+10 to +2500).
   - **Path**: `server/db.ts` (line 1001): Validates against fixed `auction.minIncrement`.
   - **Path**: `src/utils/firebase.ts` (line 414): Validates `amount <= currentAuction.currentPrice` without enforcing increment threshold.
   - **Path**: `src/components/AutoBid.tsx` (line 54): Hardcodes `const nextBid = currentPrice + 100;`.

---

## 2. Logic Chain

1. **From Observation 1**: Objective 1 requests inspection of `BiddingComponent.tsx`. Since `find_by_name` returned 0 results for `BiddingComponent.tsx`, the bidding UI is currently embedded in `AuctionDetails.tsx`. Creating `src/components/BiddingComponent.tsx` as a standalone component will restore layout modularity.
2. **From Observation 2**: Objective 2 mandates `$ USD` currency standardization. Because `formatPrice` divides USD prices by 3.75 (treating inputs as SAR), items stored natively in USD (e.g. Suez Canal Bond at $500) render as $133 USD. Removing the `/ 3.75` calculation and standardizing backend schemas, default form states, and message strings to `$ USD` will resolve all currency formatting bugs.
3. **From Observation 3**: Objective 3 requires instant buyout to transition auction status to `ended` / `buyout_claimed`, lock out bidding, create an escrow record in `$ USD`, and notify buyer and seller. Because `Auction.status` type union is `'active' | 'pending_payment' | 'completed' | 'cancelled'`, buyout currently sets status to `'completed'` without generating an `EscrowTransaction` or sending buyer/seller notifications. Updating `Auction.status`, creating an escrow document upon buyout execution, and writing inbox messages for buyer and seller fulfills Objective 3.
4. **From Observation 4**: Objective 2 mandates inspecting minimum bid increments. Aligning client Firestore submission, server backend validation, and AutoBid logic with `calculateProgressiveIncrement` ensures consistent minimum bid enforcement system-wide.

---

## 3. Caveats

- **Network Mode**: Investigation operated under `CODE_ONLY` network mode. No external HTTP API calls were executed.
- **Read-Only Constraint**: No source code modifications were made. Implementation details are documented for implementer agents.
- **Alternative Interpretations**: `checkoutEscrowInFirestore` creates a shipment and sets status to `'completed'`. However, Objective 3 specifically requires instant buyout itself to immediately create an Escrow record and transition status to `ended` / `buyout_claimed`.

---

## 4. Conclusion

The Antkawy codebase contains established bidding and anti-sniping features. To fully meet Milestone 2.1 objectives, implementer agents must:
1. Create `src/components/BiddingComponent.tsx` or modularize the bidding controls from `AuctionDetails.tsx`.
2. Update `formatPrice` in `src/utils/translations.ts` to format USD amounts directly without `/ 3.75` division, and standardize all UI labels, form defaults, and Firestore initializers to `$ USD`.
3. Expand `Auction.status` type union in `src/types.ts` to include `'ended'` and `'buyout_claimed'`.
4. Update `buyoutAuctionInFirestore` (`firebase.ts`) and `buyoutAuction` (`server/db.ts`) to transition status to `'buyout_claimed'`, immediately persist an `EscrowTransaction` in `$ USD`, and dispatch buyer and seller notifications.
5. Standardize minimum bid increment validation across `firebase.ts`, `server/db.ts`, and `AutoBid.tsx`.

---

## 5. Verification Method

To independently verify these findings:

1. **File Inspection**:
   ```bash
   # Confirm missing BiddingComponent.tsx
   ls src/components/BiddingComponent.tsx
   ```
   *Expected Result*: File not found.

2. **Currency Division Bug Verification**:
   Inspect `src/utils/translations.ts` lines 266–290 using `view_file`.
   *Invalidation Condition*: If `formatPrice` returns `$500` for an input amount of `500` and `currency = 'USD'`. Currently it returns `$133`.

3. **Status Type Verification**:
   Inspect `src/types.ts` line 34 using `view_file`.
   *Invalidation Condition*: If `Auction.status` contains `'ended'` or `'buyout_claimed'`. Currently it only contains `'active' | 'pending_payment' | 'completed' | 'cancelled'`.

4. **Buyout Escrow & Notification Verification**:
   Inspect `src/utils/firebase.ts` lines 468–503 using `view_file`.
   *Invalidation Condition*: If `buyoutAuctionInFirestore` calls `setDoc` for `escrows` collection or creates inbox messages. Currently it only updates `auctions` document status to `'completed'`.
