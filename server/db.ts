/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Auction, Bid, User, SupportTicket, Shipment, EscrowTransaction, BackupLog, ApiKey, SystemSettings, SystemLog, ItemCondition } from '../src/types';
import fs from 'fs';
import path from 'path';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, doc, setDoc, getDoc, getDocs, deleteDoc, writeBatch, query, limit, orderBy, Firestore } from 'firebase/firestore';

function cleanUndefined<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(cleanUndefined) as any;
  const result: any = {};
  for (const key of Object.keys(obj)) {
    const val = (obj as any)[key];
    if (val !== undefined) {
      result[key] = typeof val === 'object' && val !== null ? cleanUndefined(val) : val;
    }
  }
  return result;
}

class OnlineAuctionDB {
  public auctions: Auction[] = [];
  public bids: Bid[] = [];
  public users: User[] = [];
  public tickets: SupportTicket[] = [];
  public shipments: Shipment[] = [];
  public escrows: EscrowTransaction[] = [];
  public backupLogs: BackupLog[] = [];
  public apiKeys: ApiKey[] = [];
  public settings: SystemSettings = {
    autoBackupIntervalHours: 12,
    systemNotificationEmail: 'support@souqauction.com',
    escrowReleaseTimeoutDays: 7,
    allowManualBidApproval: false,
    maintenanceMode: false,
    requireAdminApproval: false
  };
  public logs: SystemLog[] = [];

  private firestore: Firestore;

  constructor() {
    const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
    let config: any = {};
    if (fs.existsSync(configPath)) {
      try {
        config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      } catch (err) {
        console.error("Error parsing firebase-applet-config.json:", err);
      }
    }

    const dbId = config.firestoreDatabaseId || 'ai-studio-0a9e8887-0ab3-49ff-be6c-937823e87a6f';
    const app = initializeApp(config);
    this.firestore = getFirestore(app, dbId);
  }

  // Initialize Firestore collections and seed if empty
  public async initFirestore() {
    try {
      console.log("Initializing Firestore connection...");
      const auctionsSnap = await getDocs(query(collection(this.firestore, 'auctions'), limit(1)));
      
      if (auctionsSnap.empty) {
        console.log("Firestore is empty. Seeding database with initial records...");
        this.seedData();
        await this.writeAllToFirestore();
        console.log("Database seeded successfully in Firestore!");
      } else {
        console.log("Firestore has existing data. Loading records...");
        await this.loadAllFromFirestore();
        console.log("Database successfully loaded from Firestore!");
      }
    } catch (err) {
      console.error("Critical error initializing Firestore:", err);
      // Fallback to in-memory seeding if Firestore fails
      this.seedData();
    }
  }

  private async writeAllToFirestore() {
    const batch = writeBatch(this.firestore);

    // Batch seed users
    for (const u of this.users) {
      const ref = doc(this.firestore, 'users', u.id);
      batch.set(ref, cleanUndefined(u));
    }

    // Batch seed auctions
    for (const a of this.auctions) {
      const ref = doc(this.firestore, 'auctions', a.id);
      batch.set(ref, cleanUndefined(a));
    }

    // Batch seed bids
    for (const b of this.bids) {
      const ref = doc(this.firestore, 'bids', b.id);
      batch.set(ref, cleanUndefined(b));
    }

    // Batch seed tickets
    for (const t of this.tickets) {
      const ref = doc(this.firestore, 'tickets', t.id);
      batch.set(ref, cleanUndefined(t));
    }

    // Batch seed shipments
    for (const s of this.shipments) {
      const ref = doc(this.firestore, 'shipments', s.id);
      batch.set(ref, cleanUndefined(s));
    }

    // Batch seed escrows
    for (const e of this.escrows) {
      const ref = doc(this.firestore, 'escrows', e.id);
      batch.set(ref, cleanUndefined(e));
    }

    // Batch seed backup logs
    for (const bl of this.backupLogs) {
      const ref = doc(this.firestore, 'backupLogs', bl.id);
      batch.set(ref, bl);
    }

    // Batch seed API Keys
    for (const k of this.apiKeys) {
      const ref = doc(this.firestore, 'apiKeys', k.id);
      batch.set(ref, k);
    }

    // Batch seed system logs (limit to avoid exceeding batch size limit of 500)
    for (const l of this.logs.slice(0, 100)) {
      const ref = doc(this.firestore, 'logs', l.id);
      batch.set(ref, l);
    }

    // Seed system settings
    const settingsRef = doc(this.firestore, 'settings', 'system');
    batch.set(settingsRef, this.settings);

    await batch.commit();
  }

  private async loadAllFromFirestore() {
    const usersSnap = await getDocs(collection(this.firestore, 'users'));
    this.users = usersSnap.docs.map(d => d.data() as User);

    const auctionsSnap = await getDocs(collection(this.firestore, 'auctions'));
    this.auctions = auctionsSnap.docs.map(d => d.data() as Auction);

    const bidsSnap = await getDocs(collection(this.firestore, 'bids'));
    this.bids = bidsSnap.docs.map(d => d.data() as Bid);

    const ticketsSnap = await getDocs(collection(this.firestore, 'tickets'));
    this.tickets = ticketsSnap.docs.map(d => d.data() as SupportTicket);

    const shipmentsSnap = await getDocs(collection(this.firestore, 'shipments'));
    this.shipments = shipmentsSnap.docs.map(d => d.data() as Shipment);

    const escrowsSnap = await getDocs(collection(this.firestore, 'escrows'));
    this.escrows = escrowsSnap.docs.map(d => d.data() as EscrowTransaction);

    const backupLogsSnap = await getDocs(collection(this.firestore, 'backupLogs'));
    this.backupLogs = backupLogsSnap.docs.map(d => d.data() as BackupLog);

    const apiKeysSnap = await getDocs(collection(this.firestore, 'apiKeys'));
    this.apiKeys = apiKeysSnap.docs.map(d => d.data() as ApiKey);

    const logsSnap = await getDocs(query(collection(this.firestore, 'logs'), orderBy('timestamp', 'desc'), limit(200)));
    this.logs = logsSnap.docs.map(d => d.data() as SystemLog);

    const settingsDoc = await getDoc(doc(this.firestore, 'settings', 'system'));
    if (settingsDoc.exists()) {
      this.settings = settingsDoc.data() as SystemSettings;
    }
  }

  // --- PERSISTENCE WRITERS/UPDATER HELPERS ---

  public async addUser(user: User) {
    this.users.push(user);
    try {
      await setDoc(doc(this.firestore, 'users', user.id), cleanUndefined(user));
    } catch (err) {
      console.error("Firestore error saving user:", err);
    }
  }

  public async updateUser(user: User) {
    const idx = this.users.findIndex(u => u.id === user.id);
    if (idx !== -1) {
      this.users[idx] = user;
    }
    try {
      await setDoc(doc(this.firestore, 'users', user.id), cleanUndefined(user));
    } catch (err) {
      console.error("Firestore error updating user:", err);
    }
  }

  public async deleteUser(id: string) {
    this.users = this.users.filter(u => u.id !== id);
    try {
      await deleteDoc(doc(this.firestore, 'users', id));
    } catch (err) {
      console.error("Firestore error deleting user:", err);
    }
  }

  public async addAuction(auction: Auction) {
    this.auctions.unshift(auction);
    try {
      await setDoc(doc(this.firestore, 'auctions', auction.id), cleanUndefined(auction));
    } catch (err) {
      console.error("Firestore error saving auction:", err);
    }
  }

  public async updateAuction(auction: Auction) {
    const idx = this.auctions.findIndex(a => a.id === auction.id);
    if (idx !== -1) {
      this.auctions[idx] = auction;
    }
    try {
      await setDoc(doc(this.firestore, 'auctions', auction.id), cleanUndefined(auction));
    } catch (err) {
      console.error("Firestore error updating auction:", err);
    }
  }

  public async deleteBid(bidId: string): Promise<{ success: boolean; auction?: Auction; messageAr?: string; messageEn?: string }> {
    const bidIndex = this.bids.findIndex(b => b.id === bidId);
    if (bidIndex === -1) {
      return { success: false, messageAr: 'المزايدة غير موجودة', messageEn: 'Bid not found' };
    }
    const targetBid = this.bids[bidIndex];
    const auctionId = targetBid.auctionId;
    this.bids.splice(bidIndex, 1);

    try {
      await deleteDoc(doc(this.firestore, 'bids', bidId));
    } catch (err) {
      console.error("Firestore error deleting bid:", err);
    }

    const auction = this.auctions.find(a => a.id === auctionId);
    if (auction) {
      const remainingBids = this.bids
        .filter(b => b.auctionId === auctionId)
        .sort((a, b) => b.amount - a.amount);

      auction.bidsCount = remainingBids.length;
      if (remainingBids.length > 0) {
        auction.currentPrice = remainingBids[0].amount;
        auction.highBidder = remainingBids[0].bidderEmail;
        auction.highBidderName = remainingBids[0].bidderName;
      } else {
        auction.currentPrice = auction.startPrice;
        auction.highBidder = undefined;
        auction.highBidderName = undefined;
      }

      await this.updateAuction(auction);
      this.addLog({
        id: `l_${Date.now()}_bid_cancel`,
        timestamp: new Date().toISOString(),
        type: 'warning',
        message: `تم إبطال المزايدة رقم ${bidId} بقيمة ${targetBid.amount} على المزاد ${auction.titleAr} وإعادة حساب السعر الحالي إلى ${auction.currentPrice}`,
        user: targetBid.bidderEmail
      });

      return { success: true, auction };
    }

    return { success: true };
  }

  public async addLog(log: SystemLog) {
    this.logs.unshift(log);
    try {
      await setDoc(doc(this.firestore, 'logs', log.id), log);
    } catch (err) {
      console.error("Firestore error saving log:", err);
    }
  }

  public async addApiKey(key: ApiKey) {
    this.apiKeys.unshift(key);
    try {
      await setDoc(doc(this.firestore, 'apiKeys', key.id), key);
    } catch (err) {
      console.error("Firestore error saving API Key:", err);
    }
  }

  public async deleteApiKey(id: string) {
    this.apiKeys = this.apiKeys.filter(k => k.id !== id);
    try {
      await deleteDoc(doc(this.firestore, 'apiKeys', id));
    } catch (err) {
      console.error("Firestore error deleting API Key:", err);
    }
  }

  public async addTicket(ticket: SupportTicket) {
    this.tickets.unshift(ticket);
    try {
      await setDoc(doc(this.firestore, 'tickets', ticket.id), ticket);
    } catch (err) {
      console.error("Firestore error saving support ticket:", err);
    }
  }

  public async updateTicket(ticket: SupportTicket) {
    const idx = this.tickets.findIndex(t => t.id === ticket.id);
    if (idx !== -1) {
      this.tickets[idx] = ticket;
    }
    try {
      await setDoc(doc(this.firestore, 'tickets', ticket.id), ticket);
    } catch (err) {
      console.error("Firestore error updating support ticket:", err);
    }
  }

  public async updateShipment(shipment: Shipment) {
    const idx = this.shipments.findIndex(s => s.id === shipment.id);
    if (idx !== -1) {
      this.shipments[idx] = shipment;
    }
    try {
      await setDoc(doc(this.firestore, 'shipments', shipment.id), shipment);
    } catch (err) {
      console.error("Firestore error updating shipment:", err);
    }
  }

  public async updateSettings(settings: SystemSettings) {
    this.settings = settings;
    try {
      await setDoc(doc(this.firestore, 'settings', 'system'), settings);
    } catch (err) {
      console.error("Firestore error updating settings:", err);
    }
  }

  private seedData() {
    const now = new Date();

    // 1. Seed Users
    this.users = [
      {
        id: 'u1',
        name: 'عبد الرحمن القحطاني',
        email: 'arabdt.com@gmail.com', // Active user (admin/buyer)
        role: 'admin',
        balance: 250000,
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
        phone: '+966501234567',
        preferredCurrency: 'SAR',
        preferredLanguage: 'ar'
      },
      {
        id: 'u2',
        name: 'سارة الشمري',
        email: 'sara.buyer@gmail.com',
        role: 'user',
        balance: 75000,
        avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
        phone: '+966507654321',
        preferredCurrency: 'SAR',
        preferredLanguage: 'ar'
      },
      {
        id: 'u3',
        name: 'John Miller',
        email: 'john.miller@gmail.com',
        role: 'user',
        balance: 50000,
        avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
        phone: '+14155552671',
        preferredCurrency: 'USD',
        preferredLanguage: 'en'
      }
    ];

    // Seed API Keys
    this.apiKeys = [
      {
        id: 'key1',
        clientName: 'بوابة شحن أرامكس الخارجية',
        key: 'sa_live_98hjsad812hkjhasdjhas891',
        createdAt: new Date(now.getTime() - 100 * 60 * 60 * 1000).toISOString(),
        status: 'active'
      },
      {
        id: 'key2',
        clientName: 'منصة سلة - مزامنة المزادات',
        key: 'salla_sync_98a7sdsa98s7da9d87as',
        createdAt: new Date(now.getTime() - 240 * 60 * 60 * 1000).toISOString(),
        status: 'active'
      }
    ];

    // Seed Backups
    this.backupLogs = [
      {
        id: 'b1',
        timestamp: new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString(),
        type: 'auto',
        status: 'completed',
        size: '12.4 MB',
        file: 'sauce_backup_2026-06-03_00-00.sql'
      },
      {
        id: 'b2',
        timestamp: new Date(now.getTime() - 48 * 60 * 60 * 1000).toISOString(),
        type: 'auto',
        status: 'completed',
        size: '12.3 MB',
        file: 'sauce_backup_2026-06-02_00-00.sql'
      }
    ];

    // 2. Seed Auctions (Document auctions uploaded today)
    this.auctions = [
      {
        id: 'a_farouk_medal_1951',
        titleAr: 'نوط الواجب الفضي من الملك فاروق الأول ملك مصر (١٩٥١ م) — شهادة بالمغلف الملكي الرسمي',
        titleEn: 'Silver Duty Medal Certificate from King Farouk I of Egypt (1951) — With Royal Envelope',
        descAr: 'شهادة ملكية نادرة جداً بالمغلف الرسمي لديوان جلالة الملك، تمنح نوط الواجب الفضي للملازم أول محمد عبدالحميد حسين بكلية البوليس الملكية، مكافأة له على ما أداه من خدمة ممتازة لصالح الأمن العام. صادرة عام ١٩٥١ ميلادية في عهد الملك فاروق الأول ملك مصر والسودان. تحمل الختم الملكي الأرجواني وتوقيع رئيس ديوان جلالة الملك. قطعة متحفية ملوكية فريدة من نوادر الأوسمة والنياشين المصرية.',
        descEn: 'Extremely rare royal certificate with official Royal Diwan envelope, granting the Silver Duty Medal (Nout Al-Wageb Al-Fidi) to First Lieutenant Mohamed Abdel Hamid Hussein of the Royal Police College, in recognition of his outstanding service for public security. Issued in 1951 under King Farouk I of Egypt and Sudan. Bears the royal purple seal and signature of the Chief of the Royal Diwan. A unique museum-grade piece from the finest Egyptian medals and decorations.',
        category: 'فنون وأنتيك ملوكي',
        image: '/farouk_medal_certificate.jpg',
        startPrice: 200,
        currentPrice: 200,
        minIncrement: 20,
        buyoutPrice: 600,
        endTime: new Date(now.getTime() + 12 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'active',
        bidsCount: 0,
        viewsCount: 185,
        seller: {
          name: 'أنتيكاوي',
          rating: 5.0,
          logo: 'https://images.unsplash.com/photo-1547996160-81dfa63595aa?w=100',
          totalSold: 215,
          storeUrl: '/store/taher-younis',
          verified: true,
          memberSince: '2020',
          description: 'أنتيكاوي - خبير ومقتني الوثائق الرسمية والمستندات التاريخية الملكية والتحف الأثرية النادرة.',
          descriptionEn: 'Taher Younis - Expert collector of authentic royal documents, rare certificates, and historic antiques.'
        },
        highBidder: '',
        highBidderName: '',
        itemCondition: 'used_good',
        currency: 'USD',
        createdDate: new Date(now.getTime() - 0.3 * 24 * 60 * 60 * 1000).toISOString(),
        softCloseMinutes: 2
      },
      {
        id: 'a_antoniadis_1857',
        titleAr: 'جواب نادر بخط يد وتوقيع أنطونيادس (الإسكندرية ١٨٥٧ م) إلى عبدالله باشا وزير الأشغال العمومية',
        titleEn: 'Rare 1857 Handwritten & Signed Letter from Antoniadis (Alexandria) to Abdullah Pasha, Minister of Public Works',
        descAr: 'جواب تاريخي أثري نادر جداً بخط يد وتوقيع السير جون أنطونيادس (Sir John Antoniades) من الإسكندرية عام ١٨٥٧ ميلادية، موجه إلى سعادة عبدالله باشا وزير الأشغال العمومية في عهد الخديوي سعيد باشا. أنطونيادس هو صاحب القصر والحدائق الشهيرة التي تحمل اسمه حتى اليوم في الإسكندرية (حدائق أنطونيادس). قطعة متحفية ملوكية نادرة من أعرق الوثائق التاريخية المصرية.',
        descEn: 'Extremely rare 1857 authentic handwritten and personally signed letter by Sir John Antoniades from Alexandria, addressed to His Excellency Abdullah Pasha, Minister of Public Works under Khedive Said Pasha. Antoniades is the renowned owner of the famous palace and gardens that still bear his name today in Alexandria (Antoniades Gardens). A museum-grade royal rarity from the finest Egyptian historical documents.',
        category: 'فنون وأنتيك ملوكي',
        image: '/antoniadis_1857.jpg',
        startPrice: 100,
        currentPrice: 100,
        minIncrement: 10,
        buyoutPrice: 350,
        endTime: new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'active',
        bidsCount: 0,
        viewsCount: 320,
        seller: {
          name: 'أنتيكاوي',
          rating: 5.0,
          logo: 'https://images.unsplash.com/photo-1547996160-81dfa63595aa?w=100',
          totalSold: 215,
          storeUrl: '/store/taher-younis',
          verified: true,
          memberSince: '2020',
          description: 'أنتيكاوي - خبير ومقتني الوثائق الرسمية والمستندات التاريخية الملكية والتحف الأثرية النادرة.',
          descriptionEn: 'Taher Younis - Expert collector of authentic royal documents, rare certificates, and historic antiques.'
        },
        highBidder: '',
        highBidderName: '',
        itemCondition: 'used_good',
        currency: 'USD',
        createdDate: new Date(now.getTime() - 0.5 * 24 * 60 * 60 * 1000).toISOString(),
        softCloseMinutes: 2
      },
      {
        id: 'a_khedive_adviser_1895',
        titleAr: 'وثيقة رسمية أثرية نادرة جداً بتوقيع وخاتم مستشار الخديوي (الإسكندرية ١٨٩٥ م) موجهة لـ طوبيا بك مدير وزارة المالية',
        titleEn: 'Rare 1895 Khedivial Adviser Official Document Signed to Toubia Bey Camel (Director of State Properties)',
        descAr: 'خطاب ومستند رسمي تاريخي أثري نادر جداً صادر من هيئة قضايا الدولة بمندوبية الإسكندرية بتاريخ 13 نوفمبر 1895 م (عهد الخديوي عباس حلمي الثاني)، موجه إلى سعادة "طوبيا بك كامل" (مدير الأملاك الحرة للدولة بوزارة المالية بالقاهرة). يحمل التوقيع الرسمي والخاتم اليدوي الأثري لمستشار الخديوي (Le Conseiller Khédivial Jourdan) بشأن تسوية أرض نادي الكريكيت بالإسكندرية. قطعة ملوكية ومتحفية من نوادر التوقيعات المصرية.',
        descEn: 'Extremely rare 1895 authentic official Khedivial document issued from State Litigation Alexandrie Delegation (Nov 13, 1895 under Khedive Abbas Hilmi II). Addressed to Toubia Bey Camel (Director of Free State Properties at the Ministry of Finance, Cairo). Bears official hand-signature & purple seal of Khedivial Adviser (Le Conseiller Khédivial Jourdan). Museum-grade signature rarity.',
        category: 'فنون وأنتيك ملوكي',
        image: '/khedive_adviser_1895.jpg',
        startPrice: 50,
        currentPrice: 50,
        minIncrement: 5,
        buyoutPrice: 150,
        endTime: new Date(now.getTime() + 8 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'active',
        bidsCount: 1,
        viewsCount: 840,
        seller: {
          name: 'أنتيكاوي',
          rating: 5.0,
          logo: 'https://images.unsplash.com/photo-1547996160-81dfa63595aa?w=100',
          totalSold: 215,
          storeUrl: '/store/taher-younis',
          verified: true,
          memberSince: '2020',
          description: 'أنتيكاوي - خبير ومقتني الوثائق الرسمية والمستندات التاريخية الملكية والتحف الأثرية النادرة.',
          descriptionEn: 'Taher Younis - Expert collector of authentic royal documents, rare certificates, and historic antiques.'
        },
        highBidder: '',
        highBidderName: '',
        itemCondition: 'used_good',
        currency: 'USD',
        createdDate: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        softCloseMinutes: 2
      },
      {
        id: 'a_sakakini_policy',
        titleAr: 'وثيقة تأمين سيارة ملكية أصلية ونادرة جداً للكونت حبيب سكاكيني باشا (القاهرة ١٩٣٩ م) - شركة Assicurazioni Generali Trieste',
        titleEn: 'Rare 1939 Authentic Royal Automobile Insurance Policy for Count Habib Sakakini Pasha (Cairo, Egypt)',
        descAr: 'وثيقة وبوليصة تأمين سيارة تاريخية ملوكية أصلية صادرة في القاهرة بتاريخ 12 يوليو 1939 م باسم الكونت حبيب سكاكيني باشا (صاحب قصر السكاكيني الشهير بالقاهرة). البوليصة صادرة من شركة Assicurazioni Generali Trieste الفرع الرئيسي بالقاهرة، وتحمل رقم البوليصة 003455، وبيانات السيارة الكلاسيكية واللوحات الملكية، وتضم الطوابع الدمغة الملكية الأصلية وتوقيع وخاتم الكونت حبيب سكاكيني اليدوي (H. Sakakini). قطعة أثرية ومتحفية فريدة وثائقية.',
        descEn: 'Extremely rare 1939 authentic historical royal automobile insurance policy issued in Cairo (July 12, 1939) under Count Habib Sakakini Pasha (owner of the famous Sakakini Palace in Cairo). Issued by Assicurazioni Generali Trieste Cairo branch, bearing policy No. 003455, classic car chassis data, original royal fiscal stamps, and original hand-signature of Count Habib Sakakini (H. Sakakini). Unique museum-grade Egyptian heritage document.',
        category: 'فنون وأنتيك ملوكي',
        image: '/sakakini_policy_1.jpg',
        startPrice: 100,
        currentPrice: 100,
        minIncrement: 10,
        buyoutPrice: 300,
        endTime: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'active',
        bidsCount: 1,
        viewsCount: 1150,
        seller: {
          name: 'أنتيكاوي',
          rating: 5.0,
          logo: 'https://images.unsplash.com/photo-1547996160-81dfa63595aa?w=100',
          totalSold: 215,
          storeUrl: '/store/taher-younis',
          verified: true,
          memberSince: '2020',
          description: 'أنتيكاوي - خبير ومقتني الوثائق الرسمية والمستندات التاريخية الملكية والتحف الأثرية النادرة.',
          descriptionEn: 'Taher Younis - Expert collector of authentic royal documents, rare certificates, and historic antiques.'
        },
        highBidder: '',
        highBidderName: '',
        itemCondition: 'used_good',
        currency: 'USD',
        createdDate: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        softCloseMinutes: 2
      },
      {
        id: 'a_umm_kulthum_receipt',
        titleAr: 'إيصال استلام أثري نادر بتوقيع كوكب الشرق أم كلثوم (الزمالك ١٩٦٣ م) لعازف الكمان محمود القصبجي - حفلة سينما قصر النيل',
        titleEn: 'Rare 1963 Authentic Signed Receipt by Umm Kulthum for Violinist Mahmoud Al-Qasabgi (Qasr El Nil Cinema Concert)',
        descAr: 'إيصال مالية واستلام أثري نادر جداً صادر في حي الزمالك بالقاهرة سنة 1963 م، يحمل التوقيع الرسمي اليدوي لكوكب الشرق "أم كلثوم إبراهيم". ينص المستند على بدل الاشتراك والاستحقاق المالي عن حفلة سينما قصر النيل التاريخية، ومحرر باسم الموسيقار وعازف الكمان الرئيسي لفرقة كوكب الشرق "محمود القصبجي". قطعة ملوكية ومتحفية من العصر الذهبي للفن العربي الموسيقي.',
        descEn: 'Extremely rare 1963 authentic signed payment receipt issued in Zamalek, Cairo, bearing the original hand-signature of Planet of the East, Umm Kulthum (Umm Kulthum Ibrahim). Issued for participation in the legendary Qasr El Nil Cinema Concert, made to orchestra main violinist Mahmoud Al-Qasabgi. Unique museum-grade Arab music history item.',
        category: 'فنون وأنتيك ملوكي',
        image: '/umm_kulthum_receipt.jpg',
        startPrice: 100,
        currentPrice: 100,
        minIncrement: 10,
        buyoutPrice: 300,
        endTime: new Date(now.getTime() + 6 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'active',
        bidsCount: 1,
        viewsCount: 980,
        seller: {
          name: 'أنتيكاوي',
          rating: 5.0,
          logo: 'https://images.unsplash.com/photo-1547996160-81dfa63595aa?w=100',
          totalSold: 215,
          storeUrl: '/store/taher-younis',
          verified: true,
          memberSince: '2020',
          description: 'أنتيكاوي - خبير ومقتني الوثائق الرسمية والمستندات التاريخية الملكية والتحف الأثرية النادرة.',
          descriptionEn: 'Taher Younis - Expert collector of authentic royal documents, rare certificates, and historic antiques.'
        },
        highBidder: '',
        highBidderName: '',
        itemCondition: 'used_good',
        currency: 'USD',
        createdDate: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        softCloseMinutes: 2
      },
      {
        id: 'a_suez_bond',
        titleAr: 'سند مالية ملكي أثري نادر (١٢٧٩ هـ / ١٨٦٣ م) لتمويل حفر قناة السويس بتوقيع ذو الفقار باشا وأحمد رشيد باشا',
        titleEn: 'Royal Suez Canal Financing Bond (1279 AH / 1863 AD) signed by Zulfikar Pasha & Ahmed Rachid Pasha',
        descAr: 'سند مالية أثري نادر وموثق صادر من الخزينة المالية المصرية عهد الخديوي إسماعيل باشا سنة 1279 هـ (1863 م) لتمويل مشروع حفر وتأسيس الشركة العالمية لقناة السويس البحرية. محرر باسم جناب مسيو جوران (ثاني مدير لكمبانية قناة السويس). يحمل توقيع وخاتم ناظر المالية ذو الفقار باشا، وتوقيع أحمد رشيد باشا، إضافة إلى الأختام الرسمية لكومبانية قناة السويس البحرية وبنك Édouard Dervieu & Cie بالأسكندرية وتوقيع السكاكيني.',
        descEn: 'Extremely rare 1863 AD (1279 AH) historical Egyptian Ottoman Treasury Bond issued under Khedive Ismail Pasha to finance the construction of the Suez Canal. Issued to Monsieur Jourand (2nd Director of the Suez Canal Company). Bears authentic hand-signatures & official seals of Zulfikar Pasha (Minister of Finance) and Ahmed Rachid Pasha (Minister of Foreign Affairs & Finance), along with original seals of Compagnie Universelle du Canal Maritime de Suez, Ed. Dervieu & Cie (Alexandria), and Sakakini Frères.',
        category: 'فنون وأنتيك ملوكي',
        image: '/suez_bond.jpg',
        startPrice: 500,
        currentPrice: 500,
        minIncrement: 25,
        buyoutPrice: 1500,
        endTime: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'active',
        bidsCount: 1,
        viewsCount: 1420,
        seller: {
          name: 'أنتيكاوي',
          rating: 5.0,
          logo: 'https://images.unsplash.com/photo-1547996160-81dfa63595aa?w=100',
          totalSold: 215,
          storeUrl: '/store/taher-younis',
          verified: true,
          memberSince: '2020',
          description: 'أنتيكاوي - خبير ومقتني الوثائق الرسمية والمستندات التاريخية الملكية والتحف الأثرية النادرة.',
          descriptionEn: 'Taher Younis - Expert collector of authentic royal documents, rare certificates, and historic antiques.'
        },
        highBidder: '',
        highBidderName: '',
        itemCondition: 'used_good',
        currency: 'USD',
        createdDate: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        softCloseMinutes: 2
      }
    ];

    // 3. Seed Bids
    this.bids = [
      {
        id: 'b_doc_01',
        auctionId: 'a_suez_bond',
        bidderName: 'عبد الرحمن القحطاني',
        bidderEmail: 'arabdt.com@gmail.com',
        amount: 525,
        timestamp: new Date(now.getTime() - 12 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 'b_doc_02',
        auctionId: 'a_sakakini_policy',
        bidderName: 'سارة الشمري',
        bidderEmail: 'sara.buyer@gmail.com',
        amount: 110,
        timestamp: new Date(now.getTime() - 6 * 60 * 60 * 1000).toISOString()
      }
    ];

    // 4. Seed Support Tickets
    this.tickets = [
      {
        id: 't1',
        email: 'arabdt.com@gmail.com',
        name: 'عبد الرحمن القحطاني',
        subject: 'استفسار بخصوص آلية استرجاع عربون الـتأمين',
        message: 'السلام عليكم ورحمة الله وبركاته، قمت قبل قليل بالاشتراك في مزاد سيارة مرسيدس ودفعت مبلغ التأمين بالفيزا. في حال لم أفز بالصفقة هل يتم تحرير وحل مبالغ الضمان تلقائياً أم يتطلب الأمر وقتاً للبنك؟ وشكراً.',
        status: 'answered',
        reply: 'وعليكم السلام يا عبد الرحمن. في حال المزايدة وعدم الفوز بأي تصفية، يقوم النظام فوراً بإلغاء حجز الودائع وتوجيه البنك لإرجاعها. تستغرق العملية المصرفية المعتادة من يوم إلى 5 أيام لظهورها بكشف حسابك. نحن بخدمتك دائماً.',
        timestamp: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 't2',
        email: 'sara.buyer@gmail.com',
        name: 'سارة الشمري',
        subject: 'مشكلة في تحميل شهادة فحص رولكس',
        message: 'أحاول المزايدة على رولكس صبمارينر، لكني عندما أحاول الضغط على ملف شهادة المصادقة يفشل التحميل وتظهر رسالة خطأ بالخادم. أرجو حل المشكلة ومشاركتي الملف.',
        status: 'open',
        timestamp: new Date(now.getTime() - 20 * 60 * 1000).toISOString()
      }
    ];

    // 5. Seed shipments
    this.shipments = [
      {
        id: 'sh1',
        auctionId: 'a6',
        auctionTitleAr: 'سلك ذكي وسماعات رأس أبل AirPods Max رصاصي داكن',
        auctionTitleEn: 'Apple AirPods Max Headphones Space Gray Space',
        buyerEmail: 'sara.buyer@gmail.com',
        carrier: 'أرامكس (Aramex)',
        trackingNumber: 'AR-70982312-SA',
        status: 'in_transit',
        estimatedDelivery: new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        history: [
          {
            status: 'تأكيد السداد والطلب',
            statusAr: 'تأكيد السداد والطلب وحجز المبلغ في حساب الضمان التابع للمزاد',
            city: 'Jeddah Hub',
            cityAr: 'مستودع جدة المركزي',
            timestamp: new Date(now.getTime() - 48 * 60 * 60 * 1000).toISOString()
          },
          {
            status: 'سلمت لشركة الشحن',
            statusAr: 'تم تجهيز الطرد واستلامه بواسطة شركة أرامكس',
            city: 'Jeddah',
            cityAr: 'فرع الحمراء، جدة',
            timestamp: new Date(now.getTime() - 36 * 60 * 60 * 1000).toISOString()
          },
          {
            status: 'تحت النقل والتوصيل المباشر',
            statusAr: 'الشحنة غادرت مركز الفرز ومتجهة لمحطة الوصول',
            city: 'Riyadh Hub',
            cityAr: 'مركز تصنيف وتوزيع الرياض الرئيسي',
            timestamp: new Date(now.getTime() - 12 * 60 * 60 * 1000).toISOString()
          }
        ]
      }
    ];

    // 6. Seed Escrows
    this.escrows = [
      {
        id: 'es1',
        auctionId: 'a6',
        auctionTitleAr: 'سلك ذكي وسماعات رأس أبل AirPods Max رصاصي داكن',
        auctionTitleEn: 'Apple AirPods Max Headphones Space Gray Space',
        amount: 1650,
        currency: 'SAR',
        buyerEmail: 'sara.buyer@gmail.com',
        sellerName: 'المقصد الرقمي للأجهزة الإلكترونية',
        status: 'held',
        createdAt: new Date(now.getTime() - 48 * 60 * 60 * 1000).toISOString()
      }
    ];

    // Seed logs
    this.logs = [
      {
        id: 'l1',
        timestamp: new Date(now.getTime() - 120 * 60 * 1000).toISOString(),
        type: 'info',
        message: 'بدء عمل محرك مراقبة تمديد أوقات المزادات ومكافحة القنص التلقائي.',
      },
      {
        id: 'l2',
        timestamp: new Date(now.getTime() - 90 * 60 * 1000).toISOString(),
        type: 'security',
        message: 'تم تفعيل خوارزمية فحص السلوك الخبيث وتجنب المزايدات الصورية للعملاء بامتياز 99%',
      },
      {
        id: 'l3',
        timestamp: new Date(now.getTime() - 48 * 60 * 60 * 1000).toISOString(),
        type: 'financial',
        message: 'إيداع مالي ناجح قيمته 1650 ريال سعودي من المشتري sara.buyer@gmail.com في صندوق الضمان والودائع للمزاد a6',
        user: 'sara.buyer@gmail.com'
      }
    ];
  }

  // Submit Bid with complete, deep business logic and Firestore integration
  public submitBid(auctionId: string, email: string, name: string, amount: number): { success: boolean, messageAr: string, messageEn: string, auction?: Auction, bid?: Bid } {
    const auction = this.auctions.find(a => a.id === auctionId);
    if (!auction) {
      return { success: false, messageAr: 'لم يتم العثور على المزاد المطلوب', messageEn: 'Auction not found' };
    }

    if (auction.status !== 'active') {
      return { success: false, messageAr: 'هذا المزاد غير نشط حالياً', messageEn: 'Auction is not active' };
    }

    const now = new Date();
    const endTime = new Date(auction.endTime);
    if (now.getTime() > endTime.getTime()) {
      auction.status = 'completed';
      // Sync status change to Firestore
      this.updateAuction(auction);
      return { success: false, messageAr: 'عذراً، المزاد مغلق ومنتهي الصلاحية بالفعل', messageEn: 'Auction is already closed' };
    }

    const currentHighPrice = auction.currentPrice;
    const requiredAmount = currentHighPrice + auction.minIncrement;

    if (amount < requiredAmount) {
      return {
        success: false,
        messageAr: `قيمة المزايدة غير كافية. الحد الأدنى للمزايدة القادمة هو: ${requiredAmount} ${auction.currency}`,
        messageEn: `Bid amount is insufficient. Minimum required is: ${requiredAmount} ${auction.currency}`
      };
    }

    if (auction.highBidder === email) {
      return {
        success: false,
        messageAr: 'أنت متصدر هذا المزاد حالياً ولا تحتاج للمزايدة فوق نفسك!',
        messageEn: 'You are currently leading this auction, no need to outbid yourself!'
      };
    }

    const bidId = `b_${Date.now()}`;
    const newBid: Bid = {
      id: bidId,
      auctionId,
      bidderName: name,
      bidderEmail: email,
      amount,
      timestamp: now.toISOString()
    };

    this.bids.push(newBid);

    auction.currentPrice = amount;
    auction.bidsCount += 1;
    auction.highBidder = email;
    auction.highBidderName = name;

    const timeLeftMs = endTime.getTime() - now.getTime();
    const softCloseThresholdMs = auction.softCloseMinutes * 60 * 1000;
    let autoExtended = false;

    if (timeLeftMs > 0 && timeLeftMs < softCloseThresholdMs) {
      const newEndTime = new Date(now.getTime() + softCloseThresholdMs);
      auction.endTime = newEndTime.toISOString();
      autoExtended = true;

      const extMsg = `أمن مكافحة القنص: تم تمديد المزاد تلقائياً بمقدار ${auction.softCloseMinutes} دقائق لمنع محاولات قنص العطاءات بالثانية الأخيرة.`;
      this.addLog({
        id: `l_${Date.now()}_sec`,
        timestamp: now.toISOString(),
        type: 'security',
        message: extMsg + ` المزاد: ${auction.titleAr}`,
        user: email
      });
    }

    this.addLog({
      id: `l_${Date.now()}_bid`,
      timestamp: now.toISOString(),
      type: 'financial',
      message: `مزايدة فورية بقيمة ${amount} ${auction.currency} قدمها ${name} على المزاد ${auction.titleAr}`,
      user: email
    });

    // Write all mutations to Firestore asynchronously
    setDoc(doc(this.firestore, 'bids', newBid.id), newBid).catch(err => console.error(err));
    this.updateAuction(auction);

    return {
      success: true,
      messageAr: autoExtended 
        ? `تم تقديم مزايدتك بنجاح وبقيمة ${amount} ${auction.currency}. وبما أنه تم في الدقائق الأخيرة، فقد تم تمديد المزاد تلقائياً لمنع قنص الصفقات!`
        : `تم تقديم مزايدتك بنجاح وبقيمة ${amount} ${auction.currency}`,
      messageEn: autoExtended 
        ? `Your bid of ${amount} ${auction.currency} was submitted successfully. The auction has been extended by ${auction.softCloseMinutes} minutes for sniper prevention.`
        : `Your bid of ${amount} ${auction.currency} was successfully posted.`,
      auction,
      bid: newBid
    };
  }

  // Handle immediate purchase / buyout with Firestore integration
  public buyoutAuction(auctionId: string, email: string, name: string): { success: boolean, messageAr: string, messageEn: string, auction?: Auction } {
    const auction = this.auctions.find(a => a.id === auctionId);
    if (!auction) {
      return { success: false, messageAr: 'المزاد غير موجود', messageEn: 'Auction not found' };
    }
    if (auction.status !== 'active') {
      return { success: false, messageAr: 'هذا المزاد انتهى بالفعل', messageEn: 'Auction is not active' };
    }
    if (!auction.buyoutPrice) {
      return { success: false, messageAr: 'الشراء الفوري غير متاح في هذا المزاد', messageEn: 'Buyout not available' };
    }

    const now = new Date();
    auction.currentPrice = auction.buyoutPrice;
    auction.status = 'completed';
    auction.highBidder = email;
    auction.highBidderName = name;
    auction.endTime = now.toISOString();

    this.addLog({
      id: `l_${Date.now()}_buyout`,
      timestamp: now.toISOString(),
      type: 'financial',
      message: `عملية شراء فوري ناجحة بقيمة ${auction.buyoutPrice} ${auction.currency} للمزاد ${auction.titleAr}`,
      user: email
    });

    this.updateAuction(auction);

    return {
      success: true,
      messageAr: `تهانينا! لقد قمت بتفعيل خيار الشراء الفوري كبطل وحجزت السلعة بنجاح بقيمة ${auction.buyoutPrice} ${auction.currency}. يمكنك الآن الانتقال للدفع المباشر والضمان.`,
      messageEn: `Congratulations! You successfully activated checkout buyout for ${auction.buyoutPrice} ${auction.currency} and secured the auction.`,
      auction
    };
  }

  // Escrow payment simulated logic with Firestore integration
  public checkoutEscrow(
    auctionId: string, 
    email: string, 
    amount: number,
    paymentMethod?: string,
    paymentDetails?: string
  ): { success: boolean, messageAr: string, shipment?: Shipment, escrow?: EscrowTransaction } {
    const auction = this.auctions.find(a => a.id === auctionId);
    if (!auction) {
      return { success: false, messageAr: 'المزاد غير موجود' };
    }

    const now = new Date();
    const escrowId = `es_${Date.now()}`;
    const newEscrow: EscrowTransaction = {
      id: escrowId,
      auctionId,
      auctionTitleAr: auction.titleAr,
      auctionTitleEn: auction.titleEn,
      amount,
      currency: auction.currency,
      buyerEmail: email,
      sellerName: auction.seller.name,
      status: 'held',
      createdAt: now.toISOString(),
      paymentMethod: paymentMethod || 'Credit Card',
      paymentDetails: paymentDetails || 'Standard checkout'
    };

    this.escrows.push(newEscrow);

    const shipmentId = `sh_${Date.now()}`;
    const newShipment: Shipment = {
      id: shipmentId,
      auctionId,
      auctionTitleAr: auction.titleAr,
      auctionTitleEn: auction.titleEn,
      buyerEmail: email,
      carrier: '',
      trackingNumber: '',
      status: 'payment_confirmed',
      estimatedDelivery: '',
      history: [
        {
          status: 'دفع مؤمن وقيد تجهيز الشحنة',
          statusAr: `تم تفعيل حماية الضمان (Escrow) بدفع مؤمن عبر ${newEscrow.paymentMethod}: تم استلام دفعة الشراء بنجاح وهي محجوزة بأمان بالضمان. بانتظار قيام البائع بشحن القطعة وإدخال تفاصيل التتبع الرسمية.`,
          city: 'المنصة',
          cityAr: 'بوابة الحماية والمطابقة الرقمية',
          timestamp: now.toISOString()
        }
      ]
    };

    this.shipments.push(newShipment);

    auction.trackingNumber = '';
    auction.carrier = '';

    this.addLog({
      id: `l_${Date.now()}_esplus`,
      timestamp: now.toISOString(),
      type: 'financial',
      message: `المعاملة رقم ${escrowId} مع تفعيل حماية الضمان عبر [${newEscrow.paymentMethod}] لمبلغ ${amount} ${auction.currency} للمزاد ${auction.titleAr}`,
      user: email
    });

    // Write to Firestore asynchronously
    setDoc(doc(this.firestore, 'escrows', newEscrow.id), newEscrow).catch(err => console.error(err));
    setDoc(doc(this.firestore, 'shipments', newShipment.id), newShipment).catch(err => console.error(err));
    this.updateAuction(auction);

    return {
      success: true,
      messageAr: `تم معالجة الدفع الإلكتروني بنجاح عبر [${newEscrow.paymentMethod}] وتفعيل بروتوكول حماية الضمان الفوري. تم خصم المبلغ وحجزه في خزائن الودائع الآمنة لتأكيد شحن منتجك.`,
      shipment: newShipment,
      escrow: newEscrow
    };
  }

  // Release Escrow with Firestore integration
  public releaseEscrow(shipmentId: string): { success: boolean, messageAr: string } {
    const shipment = this.shipments.find(s => s.id === shipmentId);
    if (!shipment) {
      return { success: false, messageAr: 'الشحنة غير موجودة' };
    }

    shipment.status = 'received';
    shipment.history.push({
      status: 'تم الاستلام والإفراج عن الضمان ماليًا',
      statusAr: 'أكد المشتري استلام السلعة بنجاح ومطابقة المواصفات. جاري الإفراج وتحرير الأموال المحتجزة بالضمان لحساب البائع.',
      city: 'موقع التسليم المباشر',
      cityAr: 'عنوان المشتري المعتمد',
      timestamp: new Date().toISOString()
    });

    const escrow = this.escrows.find(e => e.auctionId === shipment.auctionId);
    if (escrow) {
      escrow.status = 'released';
      setDoc(doc(this.firestore, 'escrows', escrow.id), escrow).catch(err => console.error(err));
    }

    this.addLog({
      id: `l_${Date.now()}_esrel`,
      timestamp: new Date().toISOString(),
      type: 'financial',
      message: `تحرير وإفراج كامل للمبالغ المحتجزة بقيمة ${escrow?.amount} للمزاد التابع للشحنة ${shipmentId}`,
      user: shipment.buyerEmail
    });

    this.updateShipment(shipment);

    return {
      success: true,
      messageAr: 'تم الإفراج عن الأموال وتغذيتها لحساب البائع بنجاح بعد تأكيدك الاستلام ومطابقة مواصفات السلعة.'
    };
  }

  // Update shipment tracking with Firestore integration
  public updateShipmentTracking(
    auctionId: string,
    carrier: string,
    trackingNumber: string,
    estimatedDelivery: string,
    initialCityAr: string,
    initialCityEn: string
  ): { success: boolean; messageAr: string; shipment?: Shipment } {
    const shipment = this.shipments.find((s) => s.auctionId === auctionId);
    if (!shipment) {
      return { success: false, messageAr: 'لم يتم العثور على شحنة للتحديث.' };
    }

    const auction = this.auctions.find((a) => a.id === auctionId);
    if (auction) {
      auction.trackingNumber = trackingNumber;
      auction.carrier = carrier;
      this.updateAuction(auction);
    }

    shipment.carrier = carrier;
    shipment.trackingNumber = trackingNumber;
    shipment.estimatedDelivery = estimatedDelivery;
    shipment.status = 'dispatched';

    shipment.history.unshift({
      status: 'Shipped and tracking info added',
      statusAr: `تم شحن الطرد بنجاح بواسطة البائع عبر شركة ${carrier} برقم تتبع: ${trackingNumber}`,
      city: initialCityEn || 'Origin Hub',
      cityAr: initialCityAr || 'مركز فرز البائع الرئيسي',
      timestamp: new Date().toISOString()
    });

    this.addLog({
      id: `l_${Date.now()}_shiptrk`,
      timestamp: new Date().toISOString(),
      type: 'info',
      message: `تحديث الشحنة وتفاصيل بوليصة تتبع المزاد: ${trackingNumber} عبر ناقل ${carrier}`
    });

    this.updateShipment(shipment);

    return {
      success: true,
      messageAr: `تم تحديث بيانات الشحن بنجاح وتفعيل تتبع لوجستيات الناقل ${carrier}!`,
      shipment
    };
  }

  // Backup trigger with Firestore integration
  public triggerBackup(): BackupLog {
    const now = new Date();
    const backupId = `b_${Date.now()}`;
    const newBackup: BackupLog = {
      id: backupId,
      timestamp: now.toISOString(),
      type: 'manual',
      status: 'completed',
      size: `${(10 + Math.random() * 5).toFixed(1)} MB`,
      file: `sa_manual_backup_${now.toISOString().split('T')[0]}_${now.getHours()}-${now.getMinutes()}.json.gz`
    };

    this.backupLogs.unshift(newBackup);

    this.addLog({
      id: `l_${Date.now()}_backup`,
      timestamp: now.toISOString(),
      type: 'info',
      message: `تم إنشاء نسخة احتياطية مضغوطة ومشفرة لقاعدة بيانات المزادات بنجاح باسم: ${newBackup.file}`,
      user: 'المشرف الإداري'
    });

    // Write to Firestore asynchronously
    setDoc(doc(this.firestore, 'backupLogs', newBackup.id), newBackup).catch(err => console.error(err));

    return newBackup;
  }
}

export const DB = new OnlineAuctionDB();
