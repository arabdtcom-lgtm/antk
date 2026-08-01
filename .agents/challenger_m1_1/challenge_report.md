# Challenge Report — Milestone 1 Stress-Testing & Verification

**Target Workspace**: `c:/Users/hp/OneDrive/Arbvps/antkawy`
**Agent Role**: EMPIRICAL CHALLENGER (`teamwork_preview_challenger_m1_1`)
**Date**: 2026-07-28

---

## Challenge Summary

**Overall risk assessment**: **MEDIUM**

Milestone 1 introduced core UI stability improvements, CSV export formula injection defenses, and self-outbidding prevention in AutoBid. The implementations function correctly under baseline usage. However, rigorous adversarial stress-testing identified two edge-case vulnerabilities in CSV sanitization/export encoding and two failure modes in AutoBid identity matching.

---

## Challenges & Vulnerabilities

### [Medium] Challenge 1: CSV Sanitization Bypass via Leading Whitespace / Newlines
- **Assumption challenged**: The regex `/^[=+\-@\t\r]/` in `AdminPanel.tsx` assumes malicious CSV formulas will always begin at position 0 (`str[0]`).
- **Attack scenario**: A malicious or user-submitted metric string begins with a space or newline character before the formula symbol, e.g. `" =CMD|' /C calc'!A0"` or `"\n=SUM(1,2)"`.
- **Blast radius**: The regex `/^[=+\-@\t\r]/.test(str)` evaluates to `false`. Prepending `'` is skipped, outputting `" =CMD|' /C calc'!A0"`. In spreadsheet software that trims leading whitespace on cell ingestion (such as LibreOffice Calc or older Excel versions), formula execution is triggered.
- **Mitigation**: Update regex in `AdminPanel.tsx` to trim or account for leading whitespace before testing formula prefix triggers:
  ```ts
  if (/^\s*[=+\-@\t\r]/.test(str)) {
    str = "'" + str;
  }
  ```

### [Low] Challenge 2: CSV Data URL Truncation via `encodeURI`
- **Assumption challenged**: `encodeURI(csvContent)` in `AdminPanel.tsx` is sufficient to prepare `data:text/csv` href links.
- **Attack scenario**: Metric data or user titles contain a `#` (hash) or `%` character (e.g. `"Active Auctions #1"`).
- **Blast radius**: `encodeURI` does not escape `#`. The browser treats `#` as a URI fragment identifier, truncating the CSV download payload at `#` and corrupting exported files.
- **Mitigation**: Replace `encodeURI` with `encodeURIComponent` for the CSV body:
  ```ts
  const encodedUri = "data:text/csv;charset=utf-8," + encodeURIComponent(csvBody);
  ```

### [Medium] Challenge 3: AutoBid Self-Outbidding Failure via Untrimmed String Comparisons
- **Assumption challenged**: `highBidder.toLowerCase() === user.email.toLowerCase()` in `AutoBid.tsx` assumes clean strings without leading/trailing whitespace.
- **Attack scenario**: Firestore or backend returns `highBidder` with whitespace (e.g. `" user@example.com "` or `"user@example.com\n"`).
- **Blast radius**: String equality fails (`false`). `isUserAlreadyHighBidder` evaluates to `false`, causing `AutoBid` to outbid the user against themselves (+100 SAR increments).
- **Mitigation**: Normalize strings using `.trim()` prior to comparison:
  ```ts
  const isUserAlreadyHighBidder = Boolean(
    user?.email && highBidder && highBidder.trim().toLowerCase() === user.email.trim().toLowerCase()
  );
  ```

### [Low] Challenge 4: AutoBid Identity Mismatch when Email Property is Missing
- **Assumption challenged**: `user.email` is always available and used as the unique identifier for `highBidder`.
- **Attack scenario**: User logs in via phone/guest auth where `user.email` is `undefined`, but `user.id` or `user.name` matches `highBidder`.
- **Blast radius**: `user?.email` evaluates to falsy, bypassing `isUserAlreadyHighBidder`. AutoBid will trigger unwanted self-bids.
- **Mitigation**: Fall back to matching `user.id` or `user.name` when `user.email` is absent.

---

## Stress Test Results

| # | Test Scenario | Target Component | Expected Behavior | Observed/Predicted Result | Status |
|---|---|---|---|---|---|
| 1 | Runtime exception throw in active tab component | `ErrorBoundary.tsx` / `App.tsx` | Catch exception, render fallback card, prevent app DOM collapse | Exception trapped by `<ErrorBoundary>`, top Navbar & Footer remain responsive | **PASS** |
| 2 | "Try Again" reset button click | `ErrorBoundary.tsx` | Reset `hasError: false` and trigger `onReset()` callback | State reset successfully, calls `onReset()` | **PASS** |
| 3 | Formula payload `=CMD|' /C calc'!A0` | `AdminPanel.tsx` | Escape with leading single quote `'` | Returned `"'=CMD|' /C calc'!A0"` | **PASS** |
| 4 | Formula payload `@SUM(...)` | `AdminPanel.tsx` | Escape with leading single quote `'` | Returned `"'@SUM(...)"` | **PASS** |
| 5 | Formula payload `+100` | `AdminPanel.tsx` | Escape with leading single quote `'` | Returned `"'+100"` | **PASS** |
| 6 | Formula payload `-50` | `AdminPanel.tsx` | Escape with leading single quote `'` | Returned `"'-50"` | **PASS** |
| 7 | Double quote escaping `Item "1"` | `AdminPanel.tsx` | Replace `"` with `""` and wrap in quotes | Returned `"Item ""1"""` | **PASS** |
| 8 | **Adversarial**: Leading space formula `" =CMD..."` | `AdminPanel.tsx` | Detect formula symbol after space and escape | Prepending `'` skipped (`" =CMD..."`) | **FAIL** |
| 9 | **Adversarial**: Data contains `#` hash char | `AdminPanel.tsx` | Percent-encode `#` in Data URI | `encodeURI` leaves `#` unencoded | **FAIL** |
| 10 | Exact email match (`user@domain.com`) | `AutoBid.tsx` | `isUserAlreadyHighBidder = true`, suppress bid | `onAutoBid` NOT called | **PASS** |
| 11 | Case-insensitive match (`USER@DOMAIN.COM`) | `AutoBid.tsx` | `isUserAlreadyHighBidder = true`, suppress bid | `onAutoBid` NOT called | **PASS** |
| 12 | Different high bidder (`other@domain.com`) | `AutoBid.tsx` | Trigger outbid (+100) if price < maxBid | `onAutoBid(1100)` called | **PASS** |
| 13 | **Adversarial**: `highBidder` with whitespace | `AutoBid.tsx` | Trim whitespace and suppress bid | Equality check fails without trim | **FAIL** |

---

## Unchallenged Areas

- **Backend Escrow / Firestore Security Rules**: Beyond frontend scope; not tested.
- **WebSocket / EventSource real-time feed server**: Network dependencies out of local unit test scope.
