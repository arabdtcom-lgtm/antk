import { DB } from '../../server/db';
import { Auction, User, EscrowTransaction, Shipment } from '../../src/types';

console.log("=================================================");
console.log("MILESTONE 2 EMPIRICAL TEST HARNESS RUN");
console.log("=================================================");

async function runTests() {
  const results: { test: string; status: 'PASS' | 'FAIL' | 'BUG'; detail: string }[] = [];

  // Prepare clean test auction
  const baseTime = Date.now();
  const testAuctionId = 'test_auc_001';
  
  function resetTestAuction(overrides: Partial<Auction> = {}): Auction {
    const auction: Auction = {
      id: testAuctionId,
      titleAr: 'اختبار مزاد',
      titleEn: 'Test Auction',
      descAr: 'وصف',
      descEn: 'Desc',
      category: 'فنون',
      image: '',
      startPrice: 100,
      currentPrice: 100,
      minIncrement: 10,
      buyoutPrice: 300,
      endTime: new Date(Date.now() + 600000).toISOString(), // 10 mins from now
      status: 'active',
      bidsCount: 0,
      viewsCount: 0,
      seller: { name: 'Seller', rating: 5 },
      itemCondition: 'new',
      currency: 'USD',
      createdDate: new Date().toISOString(),
      softCloseMinutes: 5 // 5 minutes = 300,000 ms
    };
    Object.assign(auction, overrides);
    
    // Replace or insert into DB.auctions
    const idx = DB.auctions.findIndex(a => a.id === testAuctionId);
    if (idx !== -1) {
      DB.auctions[idx] = auction;
    } else {
      DB.auctions.push(auction);
    }
    return auction;
  }

  // -------------------------------------------------------------------
  // TEST SUITE 1: ANTI-SNIPE EXTENSION BOUNDARIES
  // -------------------------------------------------------------------
  console.log("\n--- TEST SUITE 1: ANTI-SNIPE EXTENSION BOUNDARIES ---");
  
  // 1.1: Bid placed exactly at endMs - 300,000 ms (5 mins before end)
  {
    const nowMs = Date.now();
    const endMs = nowMs + 300000; // exact boundary
    const auc = resetTestAuction({ endTime: new Date(endMs).toISOString() });
    
    const res = DB.submitBid(testAuctionId, 'bidder1@test.com', 'Bidder 1', 120);
    const updated = DB.auctions.find(a => a.id === testAuctionId);
    const isExtended = updated?.endTime !== new Date(endMs).toISOString();
    
    console.log(`[1.1] Bid at endMs - 300000ms: success=${res.success}, autoExtended=${isExtended}, newEndTime=${updated?.endTime}`);
    results.push({
      test: '1.1 Anti-snipe at endMs - 300000ms',
      status: isExtended ? 'PASS' : 'FAIL',
      detail: `timeLeftMs = 300000ms. Triggered=${isExtended}. EndTime changed from ${new Date(endMs).toISOString()} to ${updated?.endTime}`
    });
  }

  // 1.2: Bid placed at endMs - 300,001 ms (1ms outside 5 min threshold)
  {
    const nowMs = Date.now();
    const endMs = nowMs + 300001; // 1ms outside boundary
    const auc = resetTestAuction({ endTime: new Date(endMs).toISOString() });
    
    const res = DB.submitBid(testAuctionId, 'bidder2@test.com', 'Bidder 2', 130);
    const updated = DB.auctions.find(a => a.id === testAuctionId);
    const isExtended = updated?.endTime !== new Date(endMs).toISOString();
    
    console.log(`[1.2] Bid at endMs - 300001ms: success=${res.success}, autoExtended=${isExtended}, endTime=${updated?.endTime}`);
    results.push({
      test: '1.2 Anti-snipe at endMs - 300001ms',
      status: !isExtended ? 'PASS' : 'FAIL',
      detail: `timeLeftMs = 300001ms. Triggered=${isExtended}. Expected FALSE.`
    });
  }

  // 1.3: Bid placed at endMs - 299,999 ms (1ms inside 5 min threshold)
  {
    const nowMs = Date.now();
    const endMs = nowMs + 299999; // 1ms inside boundary
    const auc = resetTestAuction({ endTime: new Date(endMs).toISOString() });
    
    const res = DB.submitBid(testAuctionId, 'bidder3@test.com', 'Bidder 3', 140);
    const updated = DB.auctions.find(a => a.id === testAuctionId);
    const isExtended = updated?.endTime !== new Date(endMs).toISOString();
    
    console.log(`[1.3] Bid at endMs - 299999ms: success=${res.success}, autoExtended=${isExtended}, endTime=${updated?.endTime}`);
    results.push({
      test: '1.3 Anti-snipe at endMs - 299999ms',
      status: isExtended ? 'PASS' : 'FAIL',
      detail: `timeLeftMs = 299999ms. Triggered=${isExtended}. Expected TRUE.`
    });
  }

  // 1.4: Bid placed at exact endMs (timeLeftMs = 0)
  {
    const nowMs = Date.now();
    const endMs = nowMs; // exact expiry moment
    const auc = resetTestAuction({ endTime: new Date(endMs).toISOString() });
    
    const res = DB.submitBid(testAuctionId, 'bidder4@test.com', 'Bidder 4', 150);
    const updated = DB.auctions.find(a => a.id === testAuctionId);
    
    console.log(`[1.4] Bid at exact endMs (timeLeftMs = 0): success=${res.success}, status=${updated?.status}, highBidder=${updated?.highBidder}`);
    results.push({
      test: '1.4 Bid at exact endMs (timeLeftMs = 0)',
      status: res.success ? 'BUG' : 'PASS',
      detail: `Bid at endMs returned success=${res.success}. Message: ${res.messageEn}`
    });
  }

  // -------------------------------------------------------------------
  // TEST SUITE 2: BUYOUT EDGE CASES
  // -------------------------------------------------------------------
  console.log("\n--- TEST SUITE 2: BUYOUT EDGE CASES ---");

  // 2.1: Normal buyout when currentPrice < buyoutPrice
  {
    const auc = resetTestAuction({ currentPrice: 200, buyoutPrice: 300 });
    const res = DB.buyoutAuction(testAuctionId, 'buyer1@test.com', 'Buyer 1');
    const updated = DB.auctions.find(a => a.id === testAuctionId);
    
    console.log(`[2.1] Normal Buyout (200 -> 300): success=${res.success}, newPrice=${updated?.currentPrice}, status=${updated?.status}`);
    results.push({
      test: '2.1 Normal Buyout when currentPrice < buyoutPrice',
      status: (res.success && updated?.currentPrice === 300 && updated?.status === 'buyout_claimed') ? 'PASS' : 'FAIL',
      detail: `success=${res.success}, price=${updated?.currentPrice}, status=${updated?.status}`
    });
  }

  // 2.2: Buyout when currentPrice >= buyoutPrice (currentPrice = 350, buyoutPrice = 300)
  {
    const auc = resetTestAuction({ currentPrice: 350, buyoutPrice: 300 });
    const res = DB.buyoutAuction(testAuctionId, 'bargain_hunter@test.com', 'Bargain Hunter');
    const updated = DB.auctions.find(a => a.id === testAuctionId);
    
    console.log(`[2.2] Buyout when currentPrice (350) >= buyoutPrice (300): success=${res.success}, newPrice=${updated?.currentPrice}`);
    results.push({
      test: '2.2 Buyout when currentPrice >= buyoutPrice',
      status: (res.success && updated?.currentPrice === 300) ? 'BUG' : 'PASS',
      detail: `Allowed buyout when currentPrice (350) >= buyoutPrice (300)! Price reduced to ${updated?.currentPrice}.`
    });
  }

  // 2.3: Buyout on expired auction (endTime in past, but status still 'active')
  {
    const auc = resetTestAuction({ endTime: new Date(Date.now() - 10000).toISOString(), status: 'active', buyoutPrice: 300 });
    const res = DB.buyoutAuction(testAuctionId, 'late_buyer@test.com', 'Late Buyer');
    const updated = DB.auctions.find(a => a.id === testAuctionId);
    
    console.log(`[2.3] Buyout on expired auction: success=${res.success}, status=${updated?.status}`);
    results.push({
      test: '2.3 Buyout on expired auction',
      status: res.success ? 'BUG' : 'PASS',
      detail: `Buyout on expired auction returned success=${res.success}. Status set to ${updated?.status}`
    });
  }

  // 2.4: Concurrent Bid vs Buyout race condition handling
  {
    const auc = resetTestAuction({ currentPrice: 100, buyoutPrice: 500, status: 'active' });
    
    // Simulate buyout first
    const buyoutRes = DB.buyoutAuction(testAuctionId, 'buyer@test.com', 'Buyer');
    // Then attempt bid right after
    const bidRes = DB.submitBid(testAuctionId, 'bidder@test.com', 'Bidder', 200);
    
    console.log(`[2.4] Bid after Buyout: buyoutSuccess=${buyoutRes.success}, bidSuccess=${bidRes.success}`);
    results.push({
      test: '2.4 Bid after Buyout race handling',
      status: (!bidRes.success) ? 'PASS' : 'FAIL',
      detail: `Bid after buyout claimed returned success=${bidRes.success}. Message: ${bidRes.messageEn}`
    });
  }

  // -------------------------------------------------------------------
  // TEST SUITE 3: ESCROW STATE TRANSITIONS & AUTHORIZATION
  // -------------------------------------------------------------------
  console.log("\n--- TEST SUITE 3: ESCROW STATE TRANSITIONS ---");

  // 3.1: Release escrow before dispatch/delivery (when shipment status is 'payment_confirmed')
  {
    const auc = resetTestAuction({ id: 'auc_escrow_1' });
    const checkoutRes = DB.checkoutEscrow('auc_escrow_1', 'buyer_e1@test.com', 500, 'Credit Card');
    const shipmentId = checkoutRes.shipment!.id;
    
    console.log(`[3.1 initial] Shipment status: ${checkoutRes.shipment?.status}, Escrow status: ${checkoutRes.escrow?.status}`);
    
    // Attempt release immediately without dispatching/delivering
    const releaseRes = DB.releaseEscrow(shipmentId);
    const escrowAfter = DB.escrows.find(e => e.id === checkoutRes.escrow?.id);
    const shipmentAfter = DB.shipments.find(s => s.id === shipmentId);

    console.log(`[3.1 release] Release success=${releaseRes.success}, Shipment status=${shipmentAfter?.status}, Escrow status=${escrowAfter?.status}`);
    results.push({
      test: '3.1 Release Escrow before dispatch/delivery',
      status: releaseRes.success ? 'BUG' : 'PASS',
      detail: `Escrow released while shipment was in '${checkoutRes.shipment?.status}' state! New escrow status=${escrowAfter?.status}`
    });
  }

  // 3.2: Release escrow when escrow status is 'disputed'
  {
    const auc = resetTestAuction({ id: 'auc_escrow_2' });
    const checkoutRes = DB.checkoutEscrow('auc_escrow_2', 'buyer_e2@test.com', 600, 'Credit Card');
    const escrow = DB.escrows.find(e => e.id === checkoutRes.escrow?.id)!;
    
    // Mark disputed
    escrow.status = 'disputed';
    escrow.disputeReason = 'Item damaged';

    // Attempt release while disputed
    const releaseRes = DB.releaseEscrow(checkoutRes.shipment!.id);
    const escrowAfter = DB.escrows.find(e => e.id === escrow.id);

    console.log(`[3.2 release disputed] Release success=${releaseRes.success}, Escrow status after=${escrowAfter?.status}`);
    results.push({
      test: '3.2 Release Escrow while status is disputed',
      status: (releaseRes.success && escrowAfter?.status === 'released') ? 'BUG' : 'PASS',
      detail: `Escrow release allowed on disputed escrow! Status changed from 'disputed' to '${escrowAfter?.status}'`
    });
  }

  // 3.3: Double release of escrow (re-releasing already released escrow)
  {
    const auc = resetTestAuction({ id: 'auc_escrow_3' });
    const checkoutRes = DB.checkoutEscrow('auc_escrow_3', 'buyer_e3@test.com', 700, 'Credit Card');
    const shipmentId = checkoutRes.shipment!.id;

    // First release
    DB.releaseEscrow(shipmentId);
    // Second release
    const doubleReleaseRes = DB.releaseEscrow(shipmentId);

    console.log(`[3.3 double release] Second release success=${doubleReleaseRes.success}`);
    results.push({
      test: '3.3 Double release of escrow',
      status: doubleReleaseRes.success ? 'BUG' : 'PASS',
      detail: `Double release allowed! Message: ${doubleReleaseRes.messageAr}`
    });
  }

  // Print Summary
  console.log("\n=================================================");
  console.log("SUMMARY OF EMPIRICAL VERIFICATION RESULTS");
  console.log("=================================================");
  for (const r of results) {
    console.log(`[${r.status}] ${r.test}: ${r.detail}`);
  }
}

runTests().catch(err => console.error("Test harness execution error:", err));
