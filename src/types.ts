/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type MemberTier = 'standard' | 'vip' | 'verified_seller' | 'admin';
export type MemberStatus = 'active' | 'suspended' | 'pending';

export interface WalletTransaction {
  id: string;
  userId: string;
  type: 'deposit' | 'withdrawal' | 'bid_hold' | 'refund' | 'payout';
  amount: number;
  currency: 'SAR' | 'USD' | 'EGP';
  status: 'completed' | 'pending' | 'rejected';
  method?: string;
  timestamp: string;
  description?: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'user';
  tier?: MemberTier;
  status?: MemberStatus;
  verified?: boolean;
  trustScore?: number;
  completedTransactions?: number;
  balance: number;
  avatar?: string;
  phone?: string;
  preferredCurrency: 'SAR' | 'USD' | 'EGP';
  preferredLanguage: 'ar' | 'en';
  notes?: string;
  address?: string;
  city?: string;
  country?: string;
  transactions?: WalletTransaction[];
}

export type ItemCondition = 'new' | 'used_excellent' | 'used_good';

export interface Auction {
  id: string;
  titleAr: string;
  titleEn: string;
  descAr: string;
  descEn: string;
  category: string;
  image: string;
  startPrice: number;
  currentPrice: number;
  minIncrement: number;
  buyoutPrice?: number;
  endTime: string; // ISO String
  status: 'active' | 'pending_approval' | 'rejected' | 'pending_payment' | 'completed' | 'cancelled' | 'buyout_claimed';
  bidsCount: number;
  viewsCount: number;
  seller: {
    name: string;
    rating: number;
    logo?: string;
    totalSold?: number;
    storeUrl?: string;
    verified?: boolean;
    memberSince?: string;
    description?: string;
    descriptionEn?: string;
  };
  sellerEmail?: string;
  highBidder?: string; // email of current high bidder
  highBidderName?: string;
  itemCondition: ItemCondition;
  currency: 'SAR' | 'USD' | 'EGP';
  createdDate: string; // ISO String
  softCloseMinutes: number;
  trackingNumber?: string;
  carrier?: string;
  antiSnipeTriggeredCount?: number;
  lastExtendedAt?: string;
  rejectionReason?: string;
  isPaused?: boolean;
}

export interface Bid {
  id: string;
  auctionId: string;
  bidderName: string;
  bidderEmail: string;
  amount: number;
  timestamp: string; // ISO String
  isAutomatic?: boolean;
}

export interface SupportTicket {
  id: string;
  email: string;
  name: string;
  subject: string;
  message: string;
  status: 'open' | 'answered' | 'closed';
  reply?: string;
  timestamp: string;
}

export interface ShipmentHistory {
  status: string;
  statusAr: string;
  city: string;
  cityAr: string;
  timestamp: string;
}

export interface Shipment {
  id: string;
  auctionId: string;
  auctionTitleAr: string;
  auctionTitleEn: string;
  buyerEmail: string;
  carrier: string;
  trackingNumber: string;
  status: 'payment_confirmed' | 'dispatched' | 'in_transit' | 'delivered' | 'received';
  estimatedDelivery: string;
  history: ShipmentHistory[];
}

export interface EscrowTransaction {
  id: string;
  auctionId: string;
  auctionTitleAr: string;
  auctionTitleEn: string;
  amount: number;
  amountUSD?: number;
  currency: 'SAR' | 'USD' | 'EGP';
  buyerEmail: string;
  buyerName?: string;
  sellerName: string;
  sellerEmail?: string;
  sellerVerified?: boolean;
  status: 'held' | 'released' | 'disputed' | 'refunded';
  createdAt: string;
  releasedAt?: string;
  disputedAt?: string;
  disputeReason?: string;
  paymentMethod?: string;
  paymentDetails?: string;
  invoiceNumber?: string;
}

export interface BackupLog {
  id: string;
  timestamp: string;
  type: 'auto' | 'manual';
  status: 'completed' | 'failed';
  size: string;
  file: string;
}

export interface ApiKey {
  id: string;
  clientName: string;
  key: string;
  createdAt: string;
  status: 'active' | 'revoked';
}

export interface SystemSettings {
  autoBackupIntervalHours: number;
  systemNotificationEmail: string;
  escrowReleaseTimeoutDays: number;
  allowManualBidApproval: boolean;
  maintenanceMode: boolean;
  requireAdminApproval: boolean;
}

export interface SystemLog {
  id: string;
  timestamp: string;
  type: 'info' | 'warning' | 'security' | 'financial';
  message: string;
  user?: string;
}
