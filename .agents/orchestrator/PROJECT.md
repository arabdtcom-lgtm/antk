# Project: Antkawy Digital Luxury Auction Platform

## Architecture
- **Frontend**: React + Vite + TypeScript (Tailwind CSS, Lucide icons, full-screen live auction mode)
- **Backend / Edge**: Cloudflare Workers / Pages (`server.ts`, `wrangler.jsonc`)
- **Database / Auth**: Firebase / Firestore (`firestore.rules`, `firebase-blueprint.json`)
- **Primary Currency**: USD ($)

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| 1 | M1: Code & Security Audit & Error Boundaries | Full-stack audit, React error boundaries, Firestore rules check, Cloudflare integration | none | DONE |
| 2 | M2: Core Auction & Escrow Protection | Dual bidding ($ USD), instant buyout, anti-snipe auto-extension, escrow checkout workflow | M1 | DONE |
| 3 | M3: Advanced Interactive Features | Auto-bidding, Q&A comments, stats dashboard, messaging hub, full-screen live auction mode | M2 | IN_PROGRESS |
| 4 | M4: E2E Build & Deployment Verification | Vite build, Cloudflare Workers/Pages deployment check, historical data validation, final audit | M3 | PLANNED |

## Interface Contracts
### Bidding & Escrow Engine ↔ UI Components
- Bidding signature: `placeBid(auctionId: string, amount: number, isAutoBid?: boolean, maxAutoBid?: number)`
- Buyout signature: `instantBuyout(auctionId: string, buyoutPrice: number)`
- Escrow signature: `initiateEscrow(auctionId: string, amount: number, buyerId: string, sellerId: string)`
- Anti-snipe extension trigger: `checkAndExtendAuction(auctionId: string, remainingSeconds: number)`

## Code Layout
- `src/`: React frontend source files (components, context, hooks, pages, types, utils)
- `server.ts` & `server/`: Edge server backend endpoints and API routes
- `firestore.rules`: Security rules for Firestore collections (auctions, bids, escrows, messages, qa, users)
- `firebase-blueprint.json`: Data models and schema definitions
- `dist/`: Build output folder for Cloudflare Pages / Static deployment
