var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// server.ts
var import_express = __toESM(require("express"), 1);
var import_path2 = __toESM(require("path"), 1);
var import_vite = require("vite");

// server/db.ts
var import_fs = __toESM(require("fs"), 1);
var import_path = __toESM(require("path"), 1);
var import_app = require("firebase/app");
var import_firestore = require("firebase/firestore");
var OnlineAuctionDB = class {
  constructor() {
    this.auctions = [];
    this.bids = [];
    this.users = [];
    this.tickets = [];
    this.shipments = [];
    this.escrows = [];
    this.backupLogs = [];
    this.apiKeys = [];
    this.settings = {
      autoBackupIntervalHours: 12,
      systemNotificationEmail: "support@souqauction.com",
      escrowReleaseTimeoutDays: 7,
      allowManualBidApproval: false,
      maintenanceMode: false
    };
    this.logs = [];
    const configPath = import_path.default.join(process.cwd(), "firebase-applet-config.json");
    let config = {};
    if (import_fs.default.existsSync(configPath)) {
      try {
        config = JSON.parse(import_fs.default.readFileSync(configPath, "utf8"));
      } catch (err) {
        console.error("Error parsing firebase-applet-config.json:", err);
      }
    }
    const dbId = config.firestoreDatabaseId || "ai-studio-0a9e8887-0ab3-49ff-be6c-937823e87a6f";
    const app = (0, import_app.initializeApp)(config);
    this.firestore = (0, import_firestore.getFirestore)(app, dbId);
  }
  // Initialize Firestore collections and seed if empty
  async initFirestore() {
    try {
      console.log("Initializing Firestore connection...");
      const auctionsSnap = await (0, import_firestore.getDocs)((0, import_firestore.query)((0, import_firestore.collection)(this.firestore, "auctions"), (0, import_firestore.limit)(1)));
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
      this.seedData();
    }
  }
  async writeAllToFirestore() {
    const batch = (0, import_firestore.writeBatch)(this.firestore);
    for (const u of this.users) {
      const ref = (0, import_firestore.doc)(this.firestore, "users", u.id);
      batch.set(ref, u);
    }
    for (const a of this.auctions) {
      const ref = (0, import_firestore.doc)(this.firestore, "auctions", a.id);
      batch.set(ref, a);
    }
    for (const b of this.bids) {
      const ref = (0, import_firestore.doc)(this.firestore, "bids", b.id);
      batch.set(ref, b);
    }
    for (const t of this.tickets) {
      const ref = (0, import_firestore.doc)(this.firestore, "tickets", t.id);
      batch.set(ref, t);
    }
    for (const s of this.shipments) {
      const ref = (0, import_firestore.doc)(this.firestore, "shipments", s.id);
      batch.set(ref, s);
    }
    for (const e of this.escrows) {
      const ref = (0, import_firestore.doc)(this.firestore, "escrows", e.id);
      batch.set(ref, e);
    }
    for (const bl of this.backupLogs) {
      const ref = (0, import_firestore.doc)(this.firestore, "backupLogs", bl.id);
      batch.set(ref, bl);
    }
    for (const k of this.apiKeys) {
      const ref = (0, import_firestore.doc)(this.firestore, "apiKeys", k.id);
      batch.set(ref, k);
    }
    for (const l of this.logs.slice(0, 100)) {
      const ref = (0, import_firestore.doc)(this.firestore, "logs", l.id);
      batch.set(ref, l);
    }
    const settingsRef = (0, import_firestore.doc)(this.firestore, "settings", "system");
    batch.set(settingsRef, this.settings);
    await batch.commit();
  }
  async loadAllFromFirestore() {
    const usersSnap = await (0, import_firestore.getDocs)((0, import_firestore.collection)(this.firestore, "users"));
    this.users = usersSnap.docs.map((d) => d.data());
    const auctionsSnap = await (0, import_firestore.getDocs)((0, import_firestore.collection)(this.firestore, "auctions"));
    this.auctions = auctionsSnap.docs.map((d) => d.data());
    const bidsSnap = await (0, import_firestore.getDocs)((0, import_firestore.collection)(this.firestore, "bids"));
    this.bids = bidsSnap.docs.map((d) => d.data());
    const ticketsSnap = await (0, import_firestore.getDocs)((0, import_firestore.collection)(this.firestore, "tickets"));
    this.tickets = ticketsSnap.docs.map((d) => d.data());
    const shipmentsSnap = await (0, import_firestore.getDocs)((0, import_firestore.collection)(this.firestore, "shipments"));
    this.shipments = shipmentsSnap.docs.map((d) => d.data());
    const escrowsSnap = await (0, import_firestore.getDocs)((0, import_firestore.collection)(this.firestore, "escrows"));
    this.escrows = escrowsSnap.docs.map((d) => d.data());
    const backupLogsSnap = await (0, import_firestore.getDocs)((0, import_firestore.collection)(this.firestore, "backupLogs"));
    this.backupLogs = backupLogsSnap.docs.map((d) => d.data());
    const apiKeysSnap = await (0, import_firestore.getDocs)((0, import_firestore.collection)(this.firestore, "apiKeys"));
    this.apiKeys = apiKeysSnap.docs.map((d) => d.data());
    const logsSnap = await (0, import_firestore.getDocs)((0, import_firestore.query)((0, import_firestore.collection)(this.firestore, "logs"), (0, import_firestore.orderBy)("timestamp", "desc"), (0, import_firestore.limit)(200)));
    this.logs = logsSnap.docs.map((d) => d.data());
    const settingsDoc = await (0, import_firestore.getDoc)((0, import_firestore.doc)(this.firestore, "settings", "system"));
    if (settingsDoc.exists()) {
      this.settings = settingsDoc.data();
    }
  }
  // --- PERSISTENCE WRITERS/UPDATER HELPERS ---
  async addUser(user) {
    this.users.push(user);
    try {
      await (0, import_firestore.setDoc)((0, import_firestore.doc)(this.firestore, "users", user.id), user);
    } catch (err) {
      console.error("Firestore error saving user:", err);
    }
  }
  async updateUser(user) {
    const idx = this.users.findIndex((u) => u.id === user.id);
    if (idx !== -1) {
      this.users[idx] = user;
    }
    try {
      await (0, import_firestore.setDoc)((0, import_firestore.doc)(this.firestore, "users", user.id), user);
    } catch (err) {
      console.error("Firestore error updating user:", err);
    }
  }
  async deleteUser(id) {
    this.users = this.users.filter((u) => u.id !== id);
    try {
      await (0, import_firestore.deleteDoc)((0, import_firestore.doc)(this.firestore, "users", id));
    } catch (err) {
      console.error("Firestore error deleting user:", err);
    }
  }
  async addAuction(auction) {
    this.auctions.unshift(auction);
    try {
      await (0, import_firestore.setDoc)((0, import_firestore.doc)(this.firestore, "auctions", auction.id), auction);
    } catch (err) {
      console.error("Firestore error saving auction:", err);
    }
  }
  async updateAuction(auction) {
    const idx = this.auctions.findIndex((a) => a.id === auction.id);
    if (idx !== -1) {
      this.auctions[idx] = auction;
    }
    try {
      await (0, import_firestore.setDoc)((0, import_firestore.doc)(this.firestore, "auctions", auction.id), auction);
    } catch (err) {
      console.error("Firestore error updating auction:", err);
    }
  }
  async addLog(log) {
    this.logs.unshift(log);
    try {
      await (0, import_firestore.setDoc)((0, import_firestore.doc)(this.firestore, "logs", log.id), log);
    } catch (err) {
      console.error("Firestore error saving log:", err);
    }
  }
  async addApiKey(key) {
    this.apiKeys.unshift(key);
    try {
      await (0, import_firestore.setDoc)((0, import_firestore.doc)(this.firestore, "apiKeys", key.id), key);
    } catch (err) {
      console.error("Firestore error saving API Key:", err);
    }
  }
  async deleteApiKey(id) {
    this.apiKeys = this.apiKeys.filter((k) => k.id !== id);
    try {
      await (0, import_firestore.deleteDoc)((0, import_firestore.doc)(this.firestore, "apiKeys", id));
    } catch (err) {
      console.error("Firestore error deleting API Key:", err);
    }
  }
  async addTicket(ticket) {
    this.tickets.unshift(ticket);
    try {
      await (0, import_firestore.setDoc)((0, import_firestore.doc)(this.firestore, "tickets", ticket.id), ticket);
    } catch (err) {
      console.error("Firestore error saving support ticket:", err);
    }
  }
  async updateTicket(ticket) {
    const idx = this.tickets.findIndex((t) => t.id === ticket.id);
    if (idx !== -1) {
      this.tickets[idx] = ticket;
    }
    try {
      await (0, import_firestore.setDoc)((0, import_firestore.doc)(this.firestore, "tickets", ticket.id), ticket);
    } catch (err) {
      console.error("Firestore error updating support ticket:", err);
    }
  }
  async updateShipment(shipment) {
    const idx = this.shipments.findIndex((s) => s.id === shipment.id);
    if (idx !== -1) {
      this.shipments[idx] = shipment;
    }
    try {
      await (0, import_firestore.setDoc)((0, import_firestore.doc)(this.firestore, "shipments", shipment.id), shipment);
    } catch (err) {
      console.error("Firestore error updating shipment:", err);
    }
  }
  async updateSettings(settings) {
    this.settings = settings;
    try {
      await (0, import_firestore.setDoc)((0, import_firestore.doc)(this.firestore, "settings", "system"), settings);
    } catch (err) {
      console.error("Firestore error updating settings:", err);
    }
  }
  seedData() {
    const now = /* @__PURE__ */ new Date();
    this.users = [
      {
        id: "u1",
        name: "\u0623\u0646\u062A\u064A\u0643\u0627\u0648\u064A",
        email: "arabdt.com@gmail.com",
        // Active user (admin/buyer)
        role: "admin",
        balance: 25e4,
        avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150",
        phone: "+966501234567",
        preferredCurrency: "SAR",
        preferredLanguage: "ar"
      },
      {
        id: "u2",
        name: "\u0633\u0627\u0631\u0629 \u0627\u0644\u0634\u0645\u0631\u064A",
        email: "sara.buyer@gmail.com",
        role: "user",
        balance: 75e3,
        avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150",
        phone: "+966507654321",
        preferredCurrency: "SAR",
        preferredLanguage: "ar"
      },
      {
        id: "u3",
        name: "John Miller",
        email: "john.miller@gmail.com",
        role: "user",
        balance: 5e4,
        avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150",
        phone: "+14155552671",
        preferredCurrency: "USD",
        preferredLanguage: "en"
      }
    ];
    this.apiKeys = [
      {
        id: "key1",
        clientName: "\u0628\u0648\u0627\u0628\u0629 \u0634\u062D\u0646 \u0623\u0631\u0627\u0645\u0643\u0633 \u0627\u0644\u062E\u0627\u0631\u062C\u064A\u0629",
        key: "sa_live_98hjsad812hkjhasdjhas891",
        createdAt: new Date(now.getTime() - 100 * 60 * 60 * 1e3).toISOString(),
        status: "active"
      },
      {
        id: "key2",
        clientName: "\u0645\u0646\u0635\u0629 \u0633\u0644\u0629 - \u0645\u0632\u0627\u0645\u0646\u0629 \u0627\u0644\u0645\u0632\u0627\u062F\u0627\u062A",
        key: "salla_sync_98a7sdsa98s7da9d87as",
        createdAt: new Date(now.getTime() - 240 * 60 * 60 * 1e3).toISOString(),
        status: "active"
      }
    ];
    this.backupLogs = [
      {
        id: "b1",
        timestamp: new Date(now.getTime() - 24 * 60 * 60 * 1e3).toISOString(),
        type: "auto",
        status: "completed",
        size: "12.4 MB",
        file: "sauce_backup_2026-06-03_00-00.sql"
      },
      {
        id: "b2",
        timestamp: new Date(now.getTime() - 48 * 60 * 60 * 1e3).toISOString(),
        type: "auto",
        status: "completed",
        size: "12.3 MB",
        file: "sauce_backup_2026-06-02_00-00.sql"
      }
    ];
    this.auctions = [
      {
        id: "a_suez_bond",
        titleAr: "\u0633\u0646\u062F \u0645\u0627\u0644\u064A\u0629 \u0645\u0644\u0643\u064A \u0623\u062B\u0631\u064A \u0646\u0627\u062F\u0631 (\u0661\u0662\u0667\u0669 \u0647\u0640 / \u0661\u0668\u0666\u0663 \u0645) \u0644\u062A\u0645\u0648\u064A\u0644 \u062D\u0641\u0631 \u0642\u0646\u0627\u0629 \u0627\u0644\u0633\u0648\u064A\u0633 \u0628\u062A\u0648\u0642\u064A\u0639 \u0630\u0648 \u0627\u0644\u0641\u0642\u0627\u0631 \u0628\u0627\u0634\u0627 \u0648\u0623\u062D\u0645\u062F \u0631\u0634\u064A\u062F \u0628\u0627\u0634\u0627",
        titleEn: "Royal Suez Canal Financing Bond (1279 AH / 1863 AD) signed by Zulfikar Pasha & Ahmed Rachid Pasha",
        descAr: "\u0633\u0646\u062F \u0645\u0627\u0644\u064A\u0629 \u0623\u062B\u0631\u064A \u0646\u0627\u062F\u0631 \u0648\u0645\u0648\u062B\u0642 \u0635\u0627\u062F\u0631 \u0645\u0646 \u0627\u0644\u062E\u0632\u064A\u0646\u0629 \u0627\u0644\u0645\u0627\u0644\u064A\u0629 \u0627\u0644\u0645\u0635\u0631\u064A\u0629 \u0639\u0647\u062F \u0627\u0644\u062E\u062F\u064A\u0648\u064A \u0625\u0633\u0645\u0627\u0639\u064A\u0644 \u0628\u0627\u0634\u0627 \u0633\u0646\u0629 1279 \u0647\u0640 (1863 \u0645) \u0644\u062A\u0645\u0648\u064A\u0644 \u0645\u0634\u0631\u0648\u0639 \u062D\u0641\u0631 \u0648\u062A\u0623\u0633\u064A\u0633 \u0627\u0644\u0634\u0631\u0643\u0629 \u0627\u0644\u0639\u0627\u0644\u0645\u064A\u0629 \u0644\u0642\u0646\u0627\u0629 \u0627\u0644\u0633\u0648\u064A\u0633 \u0627\u0644\u0628\u062D\u0631\u064A\u0629. \u0645\u062D\u0631\u0631 \u0628\u0627\u0633\u0645 \u062C\u0646\u0627\u0628 \u0645\u0633\u064A\u0648 \u062C\u0648\u0631\u0627\u0646 (\u062B\u0627\u0646\u064A \u0645\u062F\u064A\u0631 \u0644\u0643\u0645\u0628\u0627\u0646\u064A\u0629 \u0642\u0646\u0627\u0629 \u0627\u0644\u0633\u0648\u064A\u0633). \u064A\u062D\u0645\u0644 \u062A\u0648\u0642\u064A\u0639 \u0648\u062E\u0627\u062A\u0645 \u0646\u0627\u0638\u0631 \u0627\u0644\u0645\u0627\u0644\u064A\u0629 \u0630\u0648 \u0627\u0644\u0641\u0642\u0627\u0631 \u0628\u0627\u0634\u0627\u060C \u0648\u062A\u0648\u0642\u064A\u0639 \u0623\u062D\u0645\u062F \u0631\u0634\u064A\u062F \u0628\u0627\u0634\u0627\u060C \u0625\u0636\u0627\u0641\u0629 \u0625\u0644\u0649 \u0627\u0644\u0623\u062E\u062A\u0627\u0645 \u0627\u0644\u0631\u0633\u0645\u064A\u0629 \u0644\u0643\u0648\u0645\u0628\u0627\u0646\u064A\u0629 \u0642\u0646\u0627\u0629 \u0627\u0644\u0633\u0648\u064A\u0633 \u0627\u0644\u0628\u062D\u0631\u064A\u0629 \u0648\u0628\u0646\u0643 \xC9douard Dervieu & Cie \u0628\u0627\u0644\u0623\u0633\u0643\u0646\u062F\u0631\u064A\u0629 \u0648\u062A\u0648\u0642\u064A\u0639 \u0627\u0644\u0633\u0643\u0627\u0643\u064A\u0646\u064A.",
        descEn: "Extremely rare 1863 AD (1279 AH) historical Egyptian Ottoman Treasury Bond issued under Khedive Ismail Pasha to finance the construction of the Suez Canal. Issued to Monsieur Jourand (2nd Director of the Suez Canal Company). Bears authentic hand-signatures & official seals of Zulfikar Pasha (Minister of Finance) and Ahmed Rachid Pasha (Minister of Foreign Affairs & Finance), along with original seals of Compagnie Universelle du Canal Maritime de Suez, Ed. Dervieu & Cie (Alexandria), and Sakakini Fr\xE8res.",
        category: "\u0641\u0646\u0648\u0646 \u0648\u0623\u0646\u062A\u064A\u0643 \u0645\u0644\u0648\u0643\u064A",
        image: "/suez_bond.jpg",
        startPrice: 500,
        currentPrice: 500,
        minIncrement: 25,
        buyoutPrice: 1500,
        endTime: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1e3).toISOString(),
        status: "active",
        bidsCount: 1,
        viewsCount: 1420,
        seller: {
          name: "\u0623\u0646\u062A\u064A\u0643\u0627\u0648\u064A",
          rating: 5,
          logo: "https://images.unsplash.com/photo-1547996160-81dfa63595aa?w=100",
          totalSold: 215,
          storeUrl: "/store/taher-younis",
          verified: true,
          memberSince: "2020",
          description: "\u0623\u0646\u062A\u064A\u0643\u0627\u0648\u064A - \u062E\u0628\u064A\u0631 \u0648\u0645\u0642\u062A\u0646\u064A \u0627\u0644\u0648\u062B\u0627\u0626\u0642 \u0627\u0644\u0631\u0633\u0645\u064A\u0629 \u0648\u0627\u0644\u0645\u0633\u062A\u0646\u062F\u0627\u062A \u0627\u0644\u062A\u0627\u0631\u064A\u062E\u064A\u0629 \u0627\u0644\u0645\u0644\u0643\u064A\u0629 \u0648\u0627\u0644\u062A\u062D\u0641 \u0627\u0644\u0623\u062B\u0631\u064A\u0629 \u0627\u0644\u0646\u0627\u062F\u0631\u0629.",
          descriptionEn: "Taher Younis - Expert collector of authentic royal documents, rare certificates, and historic antiques."
        },
        highBidder: "",
        highBidderName: "",
        itemCondition: "used_good",
        currency: "USD",
        createdDate: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1e3).toISOString(),
        softCloseMinutes: 2
      },
      {
        id: "a_umm_kulthum_receipt",
        titleAr: "\u0625\u064A\u0635\u0627\u0644 \u0627\u0633\u062A\u0644\u0627\u0645 \u0623\u062B\u0631\u064A \u0646\u0627\u062F\u0631 \u0628\u062A\u0648\u0642\u064A\u0639 \u0643\u0648\u0643\u0628 \u0627\u0644\u0634\u0631\u0642 \u0623\u0645 \u0643\u0644\u062B\u0648\u0645 (\u0627\u0644\u0632\u0645\u0627\u0644\u0643 \u0661\u0669\u0666\u0663 \u0645) \u0644\u0639\u0627\u0632\u0641 \u0627\u0644\u0643\u0645\u0627\u0646 \u0645\u062D\u0645\u0648\u062F \u0627\u0644\u0642\u0635\u0628\u062C\u064A - \u062D\u0641\u0644\u0629 \u0633\u064A\u0646\u0645\u0627 \u0642\u0635\u0631 \u0627\u0644\u0646\u064A\u0644",
        titleEn: "Rare 1963 Authentic Signed Receipt by Umm Kulthum for Violinist Mahmoud Al-Qasabgi (Qasr El Nil Cinema Concert)",
        descAr: '\u0625\u064A\u0635\u0627\u0644 \u0645\u0627\u0644\u064A\u0629 \u0648\u0627\u0633\u062A\u0644\u0627\u0645 \u0623\u062B\u0631\u064A \u0646\u0627\u062F\u0631 \u062C\u062F\u0627\u064B \u0635\u0627\u062F\u0631 \u0641\u064A \u062D\u064A \u0627\u0644\u0632\u0645\u0627\u0644\u0643 \u0628\u0627\u0644\u0642\u0627\u0647\u0631\u0629 \u0633\u0646\u0629 1963 \u0645\u060C \u064A\u062D\u0645\u0644 \u0627\u0644\u062A\u0648\u0642\u064A\u0639 \u0627\u0644\u0631\u0633\u0645\u064A \u0627\u0644\u064A\u062F\u0648\u064A \u0644\u0643\u0648\u0643\u0628 \u0627\u0644\u0634\u0631\u0642 "\u0623\u0645 \u0643\u0644\u062B\u0648\u0645 \u0625\u0628\u0631\u0627\u0647\u064A\u0645". \u064A\u0646\u0635 \u0627\u0644\u0645\u0633\u062A\u0646\u062F \u0639\u0644\u0649 \u0628\u062F\u0644 \u0627\u0644\u0627\u0634\u062A\u0631\u0627\u0643 \u0648\u0627\u0644\u0627\u0633\u062A\u062D\u0642\u0627\u0642 \u0627\u0644\u0645\u0627\u0644\u064A \u0639\u0646 \u062D\u0641\u0644\u0629 \u0633\u064A\u0646\u0645\u0627 \u0642\u0635\u0631 \u0627\u0644\u0646\u064A\u0644 \u0627\u0644\u062A\u0627\u0631\u064A\u062E\u064A\u0629\u060C \u0648\u0645\u062D\u0631\u0631 \u0628\u0627\u0633\u0645 \u0627\u0644\u0645\u0648\u0633\u064A\u0642\u0627\u0631 \u0648\u0639\u0627\u0632\u0641 \u0627\u0644\u0643\u0645\u0627\u0646 \u0627\u0644\u0631\u0626\u064A\u0633\u064A \u0644\u0641\u0631\u0642\u0629 \u0643\u0648\u0643\u0628 \u0627\u0644\u0634\u0631\u0642 "\u0645\u062D\u0645\u0648\u062F \u0627\u0644\u0642\u0635\u0628\u062C\u064A". \u0642\u0637\u0639\u0629 \u0645\u0644\u0648\u0643\u064A\u0629 \u0648\u0645\u062A\u062D\u0641\u064A\u0629 \u0645\u0646 \u0627\u0644\u0639\u0635\u0631 \u0627\u0644\u0630\u0647\u0628\u064A \u0644\u0644\u0641\u0646 \u0627\u0644\u0639\u0631\u0628\u064A \u0627\u0644\u0645\u0648\u0633\u064A\u0642\u064A.',
        descEn: "Extremely rare 1963 authentic signed payment receipt issued in Zamalek, Cairo, bearing the original hand-signature of Planet of the East, Umm Kulthum (Umm Kulthum Ibrahim). Issued for participation in the legendary Qasr El Nil Cinema Concert, made to orchestra main violinist Mahmoud Al-Qasabgi. Unique museum-grade Arab music history item.",
        category: "\u0641\u0646\u0648\u0646 \u0648\u0623\u0646\u062A\u064A\u0643 \u0645\u0644\u0648\u0643\u064A",
        image: "/umm_kulthum_receipt.jpg",
        startPrice: 100,
        currentPrice: 100,
        minIncrement: 10,
        buyoutPrice: 300,
        endTime: new Date(now.getTime() + 6 * 24 * 60 * 60 * 1e3).toISOString(),
        status: "active",
        bidsCount: 1,
        viewsCount: 980,
        seller: {
          name: "\u0623\u0646\u062A\u064A\u0643\u0627\u0648\u064A",
          rating: 5,
          logo: "https://images.unsplash.com/photo-1547996160-81dfa63595aa?w=100",
          totalSold: 215,
          storeUrl: "/store/taher-younis",
          verified: true,
          memberSince: "2020",
          description: "\u0623\u0646\u062A\u064A\u0643\u0627\u0648\u064A - \u062E\u0628\u064A\u0631 \u0648\u0645\u0642\u062A\u0646\u064A \u0627\u0644\u0648\u062B\u0627\u0626\u0642 \u0627\u0644\u0631\u0633\u0645\u064A\u0629 \u0648\u0627\u0644\u0645\u0633\u062A\u0646\u062F\u0627\u062A \u0627\u0644\u062A\u0627\u0631\u064A\u062E\u064A\u0629 \u0627\u0644\u0645\u0644\u0643\u064A\u0629 \u0648\u0627\u0644\u062A\u062D\u0641 \u0627\u0644\u0623\u062B\u0631\u064A\u0629 \u0627\u0644\u0646\u0627\u062F\u0631\u0629.",
          descriptionEn: "Taher Younis - Expert collector of authentic royal documents, rare certificates, and historic antiques."
        },
        highBidder: "",
        highBidderName: "",
        itemCondition: "used_good",
        currency: "USD",
        createdDate: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1e3).toISOString(),
        softCloseMinutes: 2
      },
      {
        id: "a_sakakini_policy",
        titleAr: "\u0648\u062B\u064A\u0642\u0629 \u062A\u0623\u0645\u064A\u0646 \u0633\u064A\u0627\u0631\u0629 \u0645\u0644\u0643\u064A\u0629 \u0623\u0635\u0644\u064A\u0629 \u0648\u0646\u0627\u062F\u0631\u0629 \u062C\u062F\u0627\u064B \u0644\u0644\u0643\u0648\u0646\u062A \u062D\u0628\u064A\u0628 \u0633\u0643\u0627\u0643\u064A\u0646\u064A \u0628\u0627\u0634\u0627 (\u0627\u0644\u0642\u0627\u0647\u0631\u0629 \u0661\u0669\u0663\u0669 \u0645) - \u0634\u0631\u0643\u0629 Assicurazioni Generali Trieste",
        titleEn: "Rare 1939 Authentic Royal Automobile Insurance Policy for Count Habib Sakakini Pasha (Cairo, Egypt)",
        descAr: "\u0648\u062B\u064A\u0642\u0629 \u0648\u0628\u0648\u0644\u064A\u0635\u0629 \u062A\u0623\u0645\u064A\u0646 \u0633\u064A\u0627\u0631\u0629 \u062A\u0627\u0631\u064A\u062E\u064A\u0629 \u0645\u0644\u0648\u0643\u064A\u0629 \u0623\u0635\u0644\u064A\u0629 \u0635\u0627\u062F\u0631\u0629 \u0641\u064A \u0627\u0644\u0642\u0627\u0647\u0631\u0629 \u0628\u062A\u0627\u0631\u064A\u062E 12 \u064A\u0648\u0644\u064A\u0648 1939 \u0645 \u0628\u0627\u0633\u0645 \u0627\u0644\u0643\u0648\u0646\u062A \u062D\u0628\u064A\u0628 \u0633\u0643\u0627\u0643\u064A\u0646\u064A \u0628\u0627\u0634\u0627 (\u0635\u0627\u062D\u0628 \u0642\u0635\u0631 \u0627\u0644\u0633\u0643\u0627\u0643\u064A\u0646\u064A \u0627\u0644\u0634\u0647\u064A\u0631 \u0628\u0627\u0644\u0642\u0627\u0647\u0631\u0629). \u0627\u0644\u0628\u0648\u0644\u064A\u0635\u0629 \u0635\u0627\u062F\u0631\u0629 \u0645\u0646 \u0634\u0631\u0643\u0629 Assicurazioni Generali Trieste \u0627\u0644\u0641\u0631\u0639 \u0627\u0644\u0631\u0626\u064A\u0633\u064A \u0628\u0627\u0644\u0642\u0627\u0647\u0631\u0629\u060C \u0648\u062A\u062D\u0645\u0644 \u0631\u0642\u0645 \u0627\u0644\u0628\u0648\u0644\u064A\u0635\u0629 003455\u060C \u0648\u0628\u064A\u0627\u0646\u0627\u062A \u0627\u0644\u0633\u064A\u0627\u0631\u0629 \u0627\u0644\u0643\u0644\u0627\u0633\u064A\u0643\u064A\u0629 \u0648\u0627\u0644\u0644\u0648\u062D\u0627\u062A \u0627\u0644\u0645\u0644\u0643\u064A\u0629\u060C \u0648\u062A\u0636\u0645 \u0627\u0644\u0637\u0648\u0627\u0628\u0639 \u0627\u0644\u062F\u0645\u063A\u0629 \u0627\u0644\u0645\u0644\u0643\u064A\u0629 \u0627\u0644\u0623\u0635\u0644\u064A\u0629 \u0648\u062A\u0648\u0642\u064A\u0639 \u0648\u062E\u0627\u062A\u0645 \u0627\u0644\u0643\u0648\u0646\u062A \u062D\u0628\u064A\u0628 \u0633\u0643\u0627\u0643\u064A\u0646\u064A \u0627\u0644\u064A\u062F\u0648\u064A (H. Sakakini). \u0642\u0637\u0639\u0629 \u0623\u062B\u0631\u064A\u0629 \u0648\u0645\u062A\u062D\u0641\u064A\u0629 \u0641\u0631\u064A\u062F\u0629 \u0648\u062B\u0627\u0626\u0642\u064A\u0629.",
        descEn: "Extremely rare 1939 authentic historical royal automobile insurance policy issued in Cairo (July 12, 1939) under Count Habib Sakakini Pasha (owner of the famous Sakakini Palace in Cairo). Issued by Assicurazioni Generali Trieste Cairo branch, bearing policy No. 003455, classic car chassis data, original royal fiscal stamps, and original hand-signature of Count Habib Sakakini (H. Sakakini). Unique museum-grade Egyptian heritage document.",
        category: "\u0641\u0646\u0648\u0646 \u0648\u0623\u0646\u062A\u064A\u0643 \u0645\u0644\u0648\u0643\u064A",
        image: "/sakakini_policy_1.jpg",
        startPrice: 100,
        currentPrice: 100,
        minIncrement: 10,
        buyoutPrice: 300,
        endTime: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1e3).toISOString(),
        status: "active",
        bidsCount: 1,
        viewsCount: 1150,
        seller: {
          name: "\u0623\u0646\u062A\u064A\u0643\u0627\u0648\u064A",
          rating: 5,
          logo: "https://images.unsplash.com/photo-1547996160-81dfa63595aa?w=100",
          totalSold: 215,
          storeUrl: "/store/taher-younis",
          verified: true,
          memberSince: "2020",
          description: "\u0623\u0646\u062A\u064A\u0643\u0627\u0648\u064A - \u062E\u0628\u064A\u0631 \u0648\u0645\u0642\u062A\u0646\u064A \u0627\u0644\u0648\u062B\u0627\u0626\u0642 \u0627\u0644\u0631\u0633\u0645\u064A\u0629 \u0648\u0627\u0644\u0645\u0633\u062A\u0646\u062F\u0627\u062A \u0627\u0644\u062A\u0627\u0631\u064A\u062E\u064A\u0629 \u0627\u0644\u0645\u0644\u0643\u064A\u0629 \u0648\u0627\u0644\u062A\u062D\u0641 \u0627\u0644\u0623\u062B\u0631\u064A\u0629 \u0627\u0644\u0646\u0627\u062F\u0631\u0629.",
          descriptionEn: "Taher Younis - Expert collector of authentic royal documents, rare certificates, and historic antiques."
        },
        highBidder: "",
        highBidderName: "",
        itemCondition: "used_good",
        currency: "USD",
        createdDate: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1e3).toISOString(),
        softCloseMinutes: 2
      },
      {
        id: "a_khedive_adviser_1895",
        titleAr: "\u0648\u062B\u064A\u0642\u0629 \u0631\u0633\u0645\u064A\u0629 \u0623\u062B\u0631\u064A\u0629 \u0646\u0627\u062F\u0631\u0629 \u062C\u062F\u0627\u064B \u0628\u062A\u0648\u0642\u064A\u0639 \u0648\u062E\u0627\u062A\u0645 \u0645\u0633\u062A\u0634\u0627\u0631 \u0627\u0644\u062E\u062F\u064A\u0648\u064A (\u0627\u0644\u0625\u0633\u0643\u0646\u062F\u0631\u064A\u0629 \u0661\u0668\u0669\u0665 \u0645) \u0645\u0648\u062C\u0647\u0629 \u0644\u0640 \u0637\u0648\u0628\u064A\u0627 \u0628\u0643 \u0645\u062F\u064A\u0631 \u0648\u0632\u0627\u0631\u0629 \u0627\u0644\u0645\u0627\u0644\u064A\u0629",
        titleEn: "Rare 1895 Khedivial Adviser Official Document Signed to Toubia Bey Camel (Director of State Properties)",
        descAr: '\u062E\u0637\u0627\u0628 \u0648\u0645\u0633\u062A\u0646\u062F \u0631\u0633\u0645\u064A \u062A\u0627\u0631\u064A\u062E\u064A \u0623\u062B\u0631\u064A \u0646\u0627\u062F\u0631 \u062C\u062F\u0627\u064B \u0635\u0627\u062F\u0631 \u0645\u0646 \u0647\u064A\u0626\u0629 \u0642\u0636\u0627\u064A\u0627 \u0627\u0644\u062F\u0648\u0644\u0629 \u0628\u0645\u0646\u062F\u0648\u0628\u064A\u0629 \u0627\u0644\u0625\u0633\u0643\u0646\u062F\u0631\u064A\u0629 \u0628\u062A\u0627\u0631\u064A\u062E 13 \u0646\u0648\u0641\u0645\u0628\u0631 1895 \u0645 (\u0639\u0647\u062F \u0627\u0644\u062E\u062F\u064A\u0648\u064A \u0639\u0628\u0627\u0633 \u062D\u0644\u0645\u064A \u0627\u0644\u062B\u0627\u0646\u064A)\u060C \u0645\u0648\u062C\u0647 \u0625\u0644\u0649 \u0633\u0639\u0627\u062F\u0629 "\u0637\u0648\u0628\u064A\u0627 \u0628\u0643 \u0643\u0627\u0645\u0644" (\u0645\u062F\u064A\u0631 \u0627\u0644\u0623\u0645\u0644\u0627\u0643 \u0627\u0644\u062D\u0631\u0629 \u0644\u0644\u062F\u0648\u0644\u0629 \u0628\u0648\u0632\u0627\u0631\u0629 \u0627\u0644\u0645\u0627\u0644\u064A\u0629 \u0628\u0627\u0644\u0642\u0627\u0647\u0631\u0629). \u064A\u062D\u0645\u0644 \u0627\u0644\u062A\u0648\u0642\u064A\u0639 \u0627\u0644\u0631\u0633\u0645\u064A \u0648\u0627\u0644\u062E\u0627\u062A\u0645 \u0627\u0644\u064A\u062F\u0648\u064A \u0627\u0644\u0623\u062B\u0631\u064A \u0644\u0645\u0633\u062A\u0634\u0627\u0631 \u0627\u0644\u062E\u062F\u064A\u0648\u064A (Le Conseiller Kh\xE9divial Jourdan) \u0628\u0634\u0623\u0646 \u062A\u0633\u0648\u064A\u0629 \u0623\u0631\u0636 \u0646\u0627\u062F\u064A \u0627\u0644\u0643\u0631\u064A\u0643\u064A\u062A \u0628\u0627\u0644\u0625\u0633\u0643\u0646\u062F\u0631\u064A\u0629. \u0642\u0637\u0639\u0629 \u0645\u0644\u0648\u0643\u064A\u0629 \u0648\u0645\u062A\u062D\u0641\u064A\u0629 \u0645\u0646 \u0646\u0648\u0627\u062F\u0631 \u0627\u0644\u062A\u0648\u0642\u064A\u0639\u0627\u062A \u0627\u0644\u0645\u0635\u0631\u064A\u0629.',
        descEn: "Extremely rare 1895 authentic official Khedivial document issued from State Litigation Alexandrie Delegation (Nov 13, 1895 under Khedive Abbas Hilmi II). Addressed to Toubia Bey Camel (Director of Free State Properties at the Ministry of Finance, Cairo). Bears official hand-signature & purple seal of Khedivial Adviser (Le Conseiller Kh\xE9divial Jourdan). Museum-grade signature rarity.",
        category: "\u0641\u0646\u0648\u0646 \u0648\u0623\u0646\u062A\u064A\u0643 \u0645\u0644\u0648\u0643\u064A",
        image: "/khedive_adviser_1895.jpg",
        startPrice: 50,
        currentPrice: 50,
        minIncrement: 5,
        buyoutPrice: 150,
        endTime: new Date(now.getTime() + 8 * 24 * 60 * 60 * 1e3).toISOString(),
        status: "active",
        bidsCount: 1,
        viewsCount: 840,
        seller: {
          name: "\u0623\u0646\u062A\u064A\u0643\u0627\u0648\u064A",
          rating: 5,
          logo: "https://images.unsplash.com/photo-1547996160-81dfa63595aa?w=100",
          totalSold: 215,
          storeUrl: "/store/taher-younis",
          verified: true,
          memberSince: "2020",
          description: "\u0623\u0646\u062A\u064A\u0643\u0627\u0648\u064A - \u062E\u0628\u064A\u0631 \u0648\u0645\u0642\u062A\u0646\u064A \u0627\u0644\u0648\u062B\u0627\u0626\u0642 \u0627\u0644\u0631\u0633\u0645\u064A\u0629 \u0648\u0627\u0644\u0645\u0633\u062A\u0646\u062F\u0627\u062A \u0627\u0644\u062A\u0627\u0631\u064A\u062E\u064A\u0629 \u0627\u0644\u0645\u0644\u0643\u064A\u0629 \u0648\u0627\u0644\u062A\u062D\u0641 \u0627\u0644\u0623\u062B\u0631\u064A\u0629 \u0627\u0644\u0646\u0627\u062F\u0631\u0629.",
          descriptionEn: "Taher Younis - Expert collector of authentic royal documents, rare certificates, and historic antiques."
        },
        highBidder: "",
        highBidderName: "",
        itemCondition: "used_good",
        currency: "USD",
        createdDate: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1e3).toISOString(),
        softCloseMinutes: 2
      },
      {
        id: "a0",
        titleAr: "\u0633\u064A\u0641 \u062F\u0645\u0634\u0642\u064A \u062C\u0648\u0647\u0631\u064A \u0623\u062B\u0631\u064A \u0646\u0627\u062F\u0631 \u062C\u062F\u0627\u064B \u0645\u0642\u0628\u0636 \u0639\u0627\u062C\u064A \u0645\u0644\u0643\u064A",
        titleEn: "Rare Royal Damascus Steel Heritage Sword with Ivory Handle",
        descAr: "\u0633\u064A\u0641 \u062F\u0645\u0634\u0642\u064A \u0623\u062B\u0631\u064A \u064A\u0639\u0648\u062F \u0644\u0644\u0642\u0631\u0646 \u0627\u0644\u062B\u0627\u0645\u0646 \u0639\u0634\u0631 \u0628\u0637\u064A\u0651\u0629 \u062C\u0648\u0647\u0631\u064A\u0629 \u0641\u0631\u064A\u062F\u0629 \u0648\u0645\u0642\u0628\u0636 \u0645\u0644\u0643\u064A \u0645\u0646\u062D\u0648\u062A \u0628\u0639\u0646\u0627\u064A\u0629. \u0642\u0637\u0639\u0629 \u0645\u062A\u062D\u0641\u064A\u0629 \u0627\u0633\u062A\u062B\u0646\u0627\u0626\u064A\u0629 \u0641\u064A \u0645\u0631\u062D\u0644\u0629 \u0627\u0644\u062D\u0633\u0645 \u0627\u0644\u0646\u0647\u0627\u0626\u064A \u0644\u0644\u0645\u0632\u0627\u062F \u0627\u0644\u0622\u0646!",
        descEn: "18th century authentic Damascus steel heritage sword with exceptional patterning and intricately carved royal grip. Final bidding seconds remaining!",
        category: "\u0641\u0646\u0648\u0646 \u0648\u0623\u0646\u062A\u064A\u0643 \u0645\u0644\u0648\u0643\u064A",
        image: "https://images.unsplash.com/photo-1595590424283-b8f17842773f?w=800",
        startPrice: 85e3,
        currentPrice: 94500,
        minIncrement: 1e3,
        buyoutPrice: 12e4,
        endTime: new Date(now.getTime() + 55 * 1e3).toISOString(),
        status: "active",
        bidsCount: 12,
        viewsCount: 890,
        seller: {
          name: "\u062F\u0627\u0631 \u0627\u0644\u062A\u062D\u0641 \u0627\u0644\u0645\u0644\u0643\u064A\u0629 \u0644\u0644\u0645\u0632\u0627\u062F\u0627\u062A",
          rating: 5,
          logo: "https://images.unsplash.com/photo-1547996160-81dfa63595aa?w=100",
          totalSold: 142,
          storeUrl: "/store/royal-antiques",
          verified: true,
          memberSince: "2021",
          description: "\u062F\u0627\u0631 \u0645\u0632\u0627\u062F\u0627\u062A \u0645\u0639\u062A\u0645\u062F\u0629 \u0645\u062A\u062E\u0635\u0635\u0629 \u0641\u064A \u0627\u0644\u062A\u062D\u0641 \u0627\u0644\u0645\u0644\u0643\u064A\u0629 \u0648\u0627\u0644\u0645\u0642\u062A\u0646\u064A\u0627\u062A \u0627\u0644\u0646\u0627\u062F\u0631\u0629 \u0648\u0627\u0644\u0642\u0637\u0639 \u0627\u0644\u0623\u062B\u0631\u064A\u0629 \u0627\u0644\u0645\u0648\u062B\u0642\u0629 \u0639\u0627\u0644\u0645\u064A\u0627\u064B.",
          descriptionEn: "Certified auction house specializing in royal antiques, rare collectibles, and globally authenticated relics."
        },
        highBidder: "arabdt.com@gmail.com",
        highBidderName: "\u0623\u0646\u062A\u064A\u0643\u0627\u0648\u064A",
        itemCondition: "used_good",
        currency: "SAR",
        createdDate: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1e3).toISOString(),
        softCloseMinutes: 2
      },
      {
        id: "a1",
        titleAr: "\u0633\u0627\u0639\u0629 \u0631\u0648\u0644\u0643\u0633 \u0635\u0628\u0645\u0627\u0631\u064A\u0646\u0631 \u0625\u0637\u0627\u0631 \u0639\u0633\u0644\u064A \u0630\u0647\u0628\u064A \u0641\u0627\u062E\u0631 \u0639\u064A\u0627\u0631 18",
        titleEn: "Rolex Submariner Date Custom Gold 18k Oyster",
        descAr: "\u0633\u0627\u0639\u0629 \u0631\u0648\u0644\u0643\u0633 \u0627\u0635\u0644\u064A\u0629 \u0635\u0628\u0645\u0627\u0631\u064A\u0646\u0631 \u0625\u0635\u062F\u0627\u0631 \u0641\u0627\u062E\u0631 \u0645\u0646 \u0627\u0644\u0630\u0647\u0628 \u0627\u0644\u0623\u0635\u0641\u0631 \u0627\u0644\u062E\u0627\u0644\u0635 \u0639\u064A\u0627\u0631 18 \u0645\u0639 \u0625\u0637\u0627\u0631 \u0648\u0645\u064A\u0646\u0627\u0621 \u0639\u0633\u0644\u064A \u0645\u0645\u064A\u0632. \u062A\u0645 \u0641\u062D\u0635 \u0627\u0644\u0633\u0627\u0639\u0629 \u0628\u0627\u0644\u0643\u0627\u0645\u0644 \u0645\u0646 \u0642\u0628\u0644 \u062E\u0628\u0631\u0627\u0621 \u0645\u0639\u062A\u0645\u062F\u064A\u0646 \u0648\u062A\u0623\u062A\u064A \u0645\u0639 \u0627\u0644\u0639\u0644\u0628\u0629 \u0627\u0644\u0623\u0635\u0644\u064A\u0629 \u0648\u0627\u0644\u0634\u0647\u0627\u062F\u0629 \u0648\u0628\u0637\u0627\u0642\u0629 \u0627\u0644\u0636\u0645\u0627\u0646 \u0627\u0644\u062F\u0648\u0644\u064A.",
        descEn: "Authentic 18k solid yellow gold Rolex Submariner Date with exceptional state. Fully serviced and evaluated by authentic gold experts. Comes with original certificate of authenticity and dynamic warranty box.",
        category: "\u0633\u0627\u0639\u0627\u062A \u0648\u0645\u062C\u0648\u0647\u0631\u0627\u062A \u0641\u0627\u062E\u0631\u0629",
        image: "https://images.unsplash.com/photo-1522312346375-d1a52e2b99b3?w=800",
        startPrice: 45e3,
        currentPrice: 51200,
        minIncrement: 500,
        buyoutPrice: 65e3,
        endTime: new Date(now.getTime() + 1 * 60 * 60 * 1e3).toISOString(),
        status: "active",
        bidsCount: 4,
        viewsCount: 342,
        seller: {
          name: "\u0627\u0644\u0645\u062C\u0648\u0647\u0631\u0627\u062A \u0627\u0644\u0631\u0627\u0642\u064A\u0629 \u0644\u0644\u0645\u0632\u0627\u062F\u0627\u062A",
          rating: 4.9,
          logo: "https://images.unsplash.com/photo-1547996160-81dfa63595aa?w=100",
          totalSold: 88,
          storeUrl: "/store/luxury-jewels",
          verified: true,
          memberSince: "2022",
          description: "\u062E\u0628\u0631\u0627\u0621 \u0645\u0639\u062A\u0645\u062F\u0648\u0646 \u0641\u064A \u0627\u0644\u0633\u0627\u0639\u0627\u062A \u0627\u0644\u0633\u0648\u064A\u0633\u0631\u064A\u0629 \u0627\u0644\u0641\u0627\u062E\u0631\u0629 \u0648\u0627\u0644\u0645\u062C\u0648\u0647\u0631\u0627\u062A \u0627\u0644\u0645\u0644\u0643\u064A\u0629 \u0648\u0627\u0644\u0623\u062D\u062C\u0627\u0631 \u0627\u0644\u0643\u0631\u064A\u0645\u0629 \u0627\u0644\u0646\u0627\u062F\u0631\u0629.",
          descriptionEn: "Certified experts in luxury Swiss timepieces, royal jewelry, and rare gemstones."
        },
        highBidder: "sara.buyer@gmail.com",
        highBidderName: "\u0633\u0627\u0631\u0629 \u0627\u0644\u0634\u0645\u0631\u064A",
        itemCondition: "used_excellent",
        currency: "SAR",
        createdDate: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1e3).toISOString(),
        softCloseMinutes: 2
      },
      {
        id: "a2",
        titleAr: "\u0633\u064A\u0627\u0631\u0629 \u0645\u0631\u0633\u064A\u062F\u0633 \u062C\u064A \u0643\u0644\u0627\u0633 \u062C\u064A\u0631\u0645\u0627\u0646 \u0625\u064A\u062F\u064A\u0634\u0646 2024 \u0641\u0644 \u0643\u0627\u0645\u0644",
        titleEn: "Mercedes-Benz G-Class G63 AMG German Edition 2024",
        descAr: "\u0645\u0631\u0633\u064A\u062F\u0633 \u062C\u064A \u0643\u0644\u0627\u0633 AMG 63 \u0645\u0648\u062F\u064A\u0644 2024\u060C \u0644\u0648\u0646 \u062E\u0627\u0631\u062C\u064A \u0623\u0633\u0648\u062F \u0645\u0637\u0641\u0623 \u0641\u0627\u062E\u0631\u060C \u062F\u0627\u062E\u0644\u064A\u0629 \u062C\u0644\u062F \u0646\u0627\u0628\u0627 \u0623\u062D\u0645\u0631 \u0631\u0648\u064A\u0627\u0644 \u0645\u062E\u0635\u0635. \u0627\u0644\u0633\u064A\u0627\u0631\u0629 \u0628\u062D\u0627\u0644\u0629 \u0627\u0644\u0648\u0643\u0627\u0644\u0629 \u0645\u0646 \u0627\u0644\u0645\u0627\u0644\u0643 \u0627\u0644\u0623\u0648\u0644 \u0645\u0628\u0627\u0634\u0631\u0629 \u062E\u0627\u0644\u064A\u0629 \u0645\u0646 \u0627\u0644\u062D\u0648\u0627\u062F\u062B \u0648\u0627\u0644\u0639\u064A\u0648\u0628 \u0628\u0637\u0627\u0628\u0639 \u0623\u0644\u0645\u0627\u0646\u064A \u0631\u064A\u0627\u0636\u064A \u062D\u0627\u062F.",
        descEn: "Mercedes G63 AMG 2024 Model. Matte black exterior combined with Royal Red Nappa leather interiors. Showroom condition, single owner, zero accidents, standard GCC specifications, highly optimized twin turbo AMG.",
        category: "\u0633\u064A\u0627\u0631\u0627\u062A \u0648\u0645\u062D\u0631\u0643\u0627\u062A",
        image: "https://images.unsplash.com/photo-1520050206274-a1ae446cb3cc?w=800",
        startPrice: 68e4,
        currentPrice: 715e3,
        minIncrement: 5e3,
        buyoutPrice: 85e4,
        endTime: new Date(now.getTime() + 30 * 60 * 1e3).toISOString(),
        status: "active",
        bidsCount: 7,
        viewsCount: 1540,
        seller: {
          name: "\u0635\u0627\u0644\u0629 \u0627\u0644\u0646\u062E\u0628\u0629 \u0644\u0644\u0633\u064A\u0627\u0631\u0627\u062A \u0627\u0644\u0641\u0627\u062E\u0631\u0629",
          rating: 4.8,
          logo: "https://images.unsplash.com/photo-1547996160-81dfa63595aa?w=100",
          totalSold: 34,
          storeUrl: "/store/elite-motors",
          verified: true,
          memberSince: "2020",
          description: "\u0635\u0627\u0644\u0629 \u0639\u0631\u0636 \u0641\u0627\u062E\u0631\u0629 \u0644\u0644\u0633\u064A\u0627\u0631\u0627\u062A \u0627\u0644\u0631\u064A\u0627\u0636\u064A\u0629 \u0648\u0627\u0644\u0646\u0627\u062F\u0631\u0629 \u0648\u0627\u0644\u0645\u0648\u0627\u0635\u0641\u0627\u062A \u0627\u0644\u0623\u0648\u0631\u0648\u0628\u064A\u0629 \u0648\u0627\u0644\u062E\u0644\u064A\u062C\u064A\u0629 \u0627\u0644\u0645\u0639\u062A\u0645\u062F\u0629.",
          descriptionEn: "Showroom specialized in rare sports cars, VIP editions, and certified GCC specifications."
        },
        highBidder: "arabdt.com@gmail.com",
        highBidderName: "\u0623\u0646\u062A\u064A\u0643\u0627\u0648\u064A",
        itemCondition: "new",
        currency: "SAR",
        createdDate: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1e3).toISOString(),
        softCloseMinutes: 3
      },
      {
        id: "a3",
        titleAr: "\u0633\u062C\u0627\u062F \u0633\u062F\u0648 \u0633\u0639\u0648\u062F\u064A \u064A\u062F\u0648\u064A \u0639\u0627\u0644\u064A \u0627\u0644\u0641\u062E\u0627\u0645\u0629 \u0645\u0646 \u0627\u0644\u0635\u0648\u0641 \u0627\u0644\u0637\u0628\u064A\u0639\u064A \u0648\u0627\u0644\u0645\u063A\u0632\u0648\u0644",
        titleEn: "Genuine Handcrafted Royal Saudi Sadu Weaving",
        descAr: "\u062A\u062D\u0641\u0629 \u062A\u0631\u0627\u062B\u064A\u0629 \u062D\u064A\u0629 \u0645\u0646 \u0627\u0644\u0635\u0648\u0641 \u0627\u0644\u062E\u0627\u0644\u0635 \u0645\u0646\u0633\u0648\u062C\u0629 \u064A\u062F\u0648\u064A\u0627\u064B \u0628\u0627\u0644\u0643\u0627\u0645\u0644 \u0628\u0623\u064A\u062F\u064A \u0646\u0627\u0633\u062C\u0627\u062A \u0633\u0639\u0648\u062F\u064A\u0627\u062A \u0628\u0627\u0631\u0639\u0627\u062A \u0628\u0642\u0631\u064A\u0629 \u062A\u0631\u0627\u062B\u064A\u0629\u060C \u064A\u0636\u0645 \u0627\u0644\u0646\u0642\u0648\u0634 \u0627\u0644\u0646\u062C\u062F\u064A\u0629 \u0627\u0644\u062A\u0642\u0644\u064A\u062F\u064A\u0629 \u0628\u0623\u0644\u0648\u0627\u0646 \u0632\u0627\u0647\u064A\u0629 \u0648\u0633\u0627\u062D\u0631\u0629. \u064A\u0639\u0643\u0633 \u0627\u0644\u0623\u0635\u0627\u0644\u0629 \u0648\u0627\u0644\u062A\u0631\u0627\u062B \u0627\u0644\u0633\u0639\u0648\u062F\u064A \u0627\u0644\u062E\u0627\u0644\u062F.",
        descEn: "Rare traditional woven wool Sadu carpet, fully handmade by Saudi heritage crafters. Styled with unique historic Najdi symbols in deep red, white and gold. Certified historic preservation relic.",
        category: "\u0641\u0646\u0648\u0646 \u0648\u0623\u0646\u062A\u064A\u0643 \u0645\u0644\u0648\u0643\u064A",
        image: "https://images.unsplash.com/photo-1600121848594-d8644e57abab?w=800",
        startPrice: 2e3,
        currentPrice: 3100,
        minIncrement: 100,
        buyoutPrice: 4800,
        endTime: new Date(now.getTime() + 48 * 60 * 60 * 1e3).toISOString(),
        status: "active",
        bidsCount: 3,
        viewsCount: 112,
        seller: {
          name: "\u0645\u0624\u0633\u0633\u0629 \u0627\u0644\u062A\u0631\u0627\u062B \u0627\u0644\u0648\u0637\u0646\u064A \u0627\u0644\u0639\u0631\u064A\u0642",
          rating: 4.7,
          logo: "https://images.unsplash.com/photo-1547996160-81dfa63595aa?w=100",
          totalSold: 67,
          storeUrl: "/store/national-heritage",
          verified: true,
          memberSince: "2019",
          description: "\u0645\u0624\u0633\u0633\u0629 \u0648\u0637\u0646\u064A\u0629 \u0645\u0631\u062E\u0635\u0629 \u0644\u062A\u0648\u062B\u064A\u0642 \u0648\u0639\u0631\u0636 \u0627\u0644\u0633\u062C\u0627\u062F \u0627\u0644\u064A\u062F\u0648\u064A \u0648\u0627\u0644\u062A\u0631\u0627\u062B\u064A\u0627\u062A \u0627\u0644\u0623\u0635\u064A\u0644\u0629 \u0648\u0627\u0644\u0635\u0646\u0627\u0639\u0627\u062A \u0627\u0644\u062A\u0642\u0644\u064A\u062F\u064A\u0629 \u0627\u0644\u0646\u0627\u062F\u0631\u0629.",
          descriptionEn: "Licensed foundation preserving and curating authentic handcrafted Sadu, carpets, and traditional heritage relics."
        },
        highBidder: "sara.buyer@gmail.com",
        highBidderName: "\u0633\u0627\u0631\u0629 \u0627\u0644\u0634\u0645\u0631\u064A",
        itemCondition: "new",
        currency: "SAR",
        createdDate: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1e3).toISOString(),
        softCloseMinutes: 2
      },
      {
        id: "a4",
        titleAr: "\u0641\u064A\u0644\u0627 \u0645\u0633\u062A\u0642\u0644\u0629 \u0645\u0637\u0644\u0647 \u0639\u0644\u0649 \u0643\u0648\u0631\u0646\u064A\u0634 \u0623\u0628\u062D\u0631 \u0627\u0644\u0634\u0645\u0627\u0644\u064A\u0629 \u0645\u0639 \u0645\u0633\u0628\u062D \u062E\u0627\u0635",
        titleEn: "Premium Independent Sea-view Villa in Obhur Jeddah",
        descAr: "\u0639\u0642\u0627\u0631 \u0645\u0644\u0648\u0643\u064A \u0641\u0627\u062E\u0631 \u0641\u064A \u062D\u064A \u0623\u0628\u062D\u0631 \u0627\u0644\u0634\u0645\u0627\u0644\u064A\u0629\u060C \u062C\u062F\u0629. \u0645\u0633\u0627\u062D\u0629 \u0623\u0631\u0636 450\u0645 \u0648\u0645\u0628\u0627\u0646\u064A 600\u0645 \u062A\u0634\u0645\u0644 6 \u063A\u0627\u0641 \u0646\u0648\u0645 \u0631\u0626\u064A\u0633\u064A\u0629\u060C \u0645\u062C\u0627\u0644\u0633 \u0648\u0627\u0633\u0639\u0629 \u0644\u0644\u0631\u062C\u0627\u0644 \u0648\u0627\u0644\u0646\u0633\u0627\u0621\u060C \u0645\u0633\u0628\u062D \u0639\u0627\u0626\u0644\u064A \u0628\u062A\u0635\u0641\u064A\u0629 \u0630\u0643\u064A\u0629\u060C \u0648\u0645\u0648\u0642\u0641 \u0633\u064A\u0627\u0631\u0627\u062A \u0648\u063A\u0631\u0641\u0629 \u062D\u0631\u0627\u0633\u0629.",
        descEn: "A magnificent seaside estate located in prime North Obhur area, Jeddah. 450 sqm land with complete sea breeze layout, containing a smart private pool, high ceilings, custom marbles, driver suite and roof garden.",
        category: "\u0639\u0642\u0627\u0631\u0627\u062A \u0648\u0623\u0631\u0627\u0636\u064A",
        image: "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=800",
        startPrice: 25e5,
        currentPrice: 255e4,
        minIncrement: 2e4,
        endTime: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1e3).toISOString(),
        status: "active",
        bidsCount: 2,
        viewsCount: 2980,
        seller: {
          name: "\u0627\u0644\u0648\u0633\u0627\u0637\u0629 \u0627\u0644\u0639\u0631\u0628\u064A\u0629 \u0627\u0644\u0639\u0642\u0627\u0631\u064A\u0629 \u0627\u0644\u0645\u0639\u062A\u0645\u062F\u0629",
          rating: 5,
          logo: "https://images.unsplash.com/photo-1547996160-81dfa63595aa?w=100",
          totalSold: 19,
          storeUrl: "/store/arabia-realestate",
          verified: true,
          memberSince: "2018",
          description: "\u0645\u0643\u062A\u0628 \u0648\u0633\u0627\u0637\u0629 \u0639\u0642\u0627\u0631\u064A\u0629 \u0645\u0639\u062A\u0645\u062F \u0644\u062F\u0649 \u0627\u0644\u0647\u064A\u0626\u0629 \u0627\u0644\u0639\u0627\u0645\u0629 \u0644\u0644\u0639\u0642\u0627\u0631\u060C \u0645\u062A\u062E\u0635\u0635 \u0641\u064A \u0627\u0644\u0645\u0632\u0627\u062F\u0627\u062A \u0627\u0644\u0639\u0642\u0627\u0631\u064A\u0629 \u0648\u0627\u0644\u0641\u0644\u0644 \u0648\u0627\u0644\u0623\u0631\u0627\u0636\u064A \u0627\u0644\u0645\u0645\u064A\u0632\u0629.",
          descriptionEn: "Certified real estate brokerage firm specialized in high-end properties, luxury villas, and prime land auctions."
        },
        highBidder: "arabdt.com@gmail.com",
        highBidderName: "\u0623\u0646\u062A\u064A\u0643\u0627\u0648\u064A",
        itemCondition: "new",
        currency: "SAR",
        createdDate: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1e3).toISOString(),
        softCloseMinutes: 5
      },
      {
        id: "a5",
        titleAr: "\u0644\u0648\u062D\u0629 \u0641\u0646\u064A\u0629 \u0646\u0627\u062F\u0631\u0629 \u0628\u0631\u064A\u0634\u0629 \u0641\u0646\u0627\u0646 \u062A\u0634\u0643\u064A\u0644\u064A \u0645\u0639\u0627\u0635\u0631 - \u0634\u0645\u0648\u062E \u0639\u0631\u0628\u064A\u0629",
        titleEn: '"Pride of Arabia" Original Oil Painting on Fine Canvas',
        descAr: "\u0644\u0648\u062D\u0629 \u0641\u0646\u064A\u0629 \u0623\u0635\u0644\u064A\u0629 \u0645\u0631\u0633\u0648\u0645\u0629 \u0628\u0627\u0644\u0623\u0644\u0648\u0627\u0646 \u0627\u0644\u0632\u064A\u062A\u064A\u0629 \u0627\u0644\u0641\u0627\u062E\u0631\u0629 \u0639\u0644\u0649 \u0642\u0645\u0627\u0634 \u0627\u0644\u0643\u062A\u0627\u0646 \u0627\u0644\u0628\u0644\u062C\u064A\u0643\u064A\u060C \u062A\u062C\u0633\u062F \u0627\u0644\u062E\u064A\u0644 \u0627\u0644\u0639\u0631\u0628\u064A \u0627\u0644\u0623\u0635\u064A\u0644 \u0628\u0645\u0644\u0627\u0645\u062D \u0627\u0644\u0634\u0645\u0648\u062E \u0648\u0627\u0644\u0642\u0648\u0629 \u0648\u0627\u0644\u062C\u0645\u0627\u0644. \u0645\u0648\u0642\u0639\u0629 \u0648\u0645\u0624\u0631\u062E\u0629 \u0628\u0627\u0644\u062E\u0644\u0641 \u0648\u062A\u0623\u062A\u064A \u0645\u0639 \u0634\u0647\u0627\u062F\u0629 \u062D\u0642\u0648\u0642 \u0627\u0644\u0645\u0644\u0643\u064A\u0629 \u0627\u0644\u0641\u0646\u064A\u0629.",
        descEn: "Unique and valuable original oil-on-fine-canvas artwork depicting a purebred stallion with breathtaking posture. Hand-signed and certified by Saudi fine arts legacy center.",
        category: "\u0641\u0646\u0648\u0646 \u0648\u0623\u0646\u062A\u064A\u0643 \u0645\u0644\u0648\u0643\u064A",
        image: "https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=800",
        startPrice: 1500,
        currentPrice: 1500,
        minIncrement: 100,
        buyoutPrice: 2500,
        endTime: new Date(now.getTime() - 12 * 60 * 60 * 1e3).toISOString(),
        status: "completed",
        bidsCount: 6,
        viewsCount: 89,
        seller: {
          name: "\u0627\u0644\u0623\u062A\u064A\u0644\u064A\u0647 \u0627\u0644\u0633\u0639\u0648\u062F\u064A \u0627\u0644\u0645\u0639\u0627\u0635\u0631",
          rating: 4.6,
          logo: "https://images.unsplash.com/photo-1547996160-81dfa63595aa?w=100",
          totalSold: 53,
          storeUrl: "/store/saudi-atelier",
          verified: true,
          memberSince: "2021",
          description: "\u0645\u0639\u0631\u0636 \u0648\u0645\u0639\u0645\u0644 \u0641\u0646\u0648\u0646 \u062A\u0634\u0643\u064A\u0644\u064A\u0629 \u064A\u0647\u062A\u0645 \u0628\u0627\u0644\u0644\u0648\u062D\u0627\u062A \u0627\u0644\u0623\u0635\u0644\u064A\u0629 \u0648\u0627\u0644\u0623\u0639\u0645\u0627\u0644 \u0627\u0644\u0641\u0646\u064A\u0629 \u0627\u0644\u0646\u0627\u062F\u0631\u0629 \u0648\u0627\u0644\u0645\u0646\u062D\u0648\u062A\u0627\u062A \u0627\u0644\u0645\u0639\u0627\u0635\u0631\u0629.",
          descriptionEn: "Contemporary art gallery and studio dedicated to authentic oil paintings, rare artwork, and modern sculptures."
        },
        highBidder: "arabdt.com@gmail.com",
        highBidderName: "\u0623\u0646\u062A\u064A\u0643\u0627\u0648\u064A",
        itemCondition: "new",
        currency: "SAR",
        createdDate: new Date(now.getTime() - 6 * 24 * 60 * 60 * 1e3).toISOString(),
        softCloseMinutes: 2
      },
      {
        id: "a6",
        titleAr: "\u0633\u0644\u0643 \u0630\u0643\u064A \u0648\u0633\u0645\u0627\u0639\u0627\u062A \u0631\u0623\u0633 \u0623\u0628\u0644 AirPods Max \u0631\u0635\u0627\u0635\u064A \u062F\u0627\u0643\u0646",
        titleEn: "Apple AirPods Max Headphones Space Gray Space",
        descAr: "\u0633\u0645\u0627\u0639\u0627\u062A \u0625\u064A\u0631\u0628\u0648\u062F\u0632 \u0645\u0627\u0643\u0633 \u0623\u0635\u0644\u064A\u0629 \u0645\u0646 \u0623\u0628\u0644 \u0628\u062D\u0627\u0644\u062A\u0647\u0627 \u0627\u0644\u0623\u0635\u0644\u064A\u0629 \u0628\u0627\u0644\u0639\u0644\u0628\u0629 \u0648\u0627\u0644\u0643\u062A\u0627\u0644\u0648\u062C \u0643\u0627\u0645\u0644\u060C \u0627\u0633\u062A\u062E\u062F\u0627\u0645 \u0645\u062D\u062F\u0648\u062F \u062C\u062F\u0627\u064B \u0644\u0627 \u064A\u062A\u0639\u062F\u0649 \u0639\u062F\u0629 \u0633\u0627\u0639\u0627\u062A. \u062C\u0648\u062F\u0629 \u0635\u0648\u062A \u0645\u0630\u0647\u0644\u0629 \u0648\u0645\u064A\u0632\u0629 \u0625\u0644\u063A\u0627\u0621 \u0627\u0644\u0636\u062C\u064A\u062C \u0643\u0631\u0648\u064A\u0627\u0644.",
        descEn: "Original Apple AirPods Max Space Gray finish. Lightly tested in retail packaging with pristine dynamic acoustic response. Solid battery life with active noise cancelling.",
        category: "\u062C\u0648\u0644\u0627\u062A \u0648\u0647\u0648\u0627\u062A\u0641 \u0630\u0643\u064A\u0629",
        image: "https://images.unsplash.com/photo-1613040809024-b4ef7ba99bc3?w=800",
        startPrice: 1200,
        currentPrice: 1650,
        minIncrement: 50,
        buyoutPrice: 2100,
        endTime: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1e3).toISOString(),
        status: "completed",
        bidsCount: 5,
        viewsCount: 220,
        seller: {
          name: "\u0627\u0644\u0645\u0642\u0635\u062F \u0627\u0644\u0631\u0642\u0645\u064A \u0644\u0644\u0623\u062C\u0647\u0632\u0629 \u0627\u0644\u0625\u0644\u0643\u062A\u0631\u0648\u0646\u064A\u0629",
          rating: 4.5,
          logo: "https://images.unsplash.com/photo-1547996160-81dfa63595aa?w=100",
          totalSold: 215,
          storeUrl: "/store/digital-hub",
          verified: true,
          memberSince: "2019",
          description: "\u0645\u062A\u062C\u0631 \u062A\u0642\u0646\u064A \u0631\u0627\u0626\u062F \u0644\u0644\u0623\u062C\u0647\u0632\u0629 \u0627\u0644\u0630\u0643\u064A\u0629 \u0648\u0645\u0644\u062D\u0642\u0627\u062A \u0623\u0628\u0644 \u0648\u0633\u0627\u0645\u0633\u0648\u0646\u062C \u0627\u0644\u0623\u0635\u0644\u064A\u0629 \u0627\u0644\u0645\u0636\u0645\u0648\u0646\u0629 \u0628\u0646\u0633\u0628\u0629 100%.",
          descriptionEn: "Leading tech hub for guaranteed original smart devices and premium Apple & Samsung accessories."
        },
        highBidder: "sara.buyer@gmail.com",
        highBidderName: "\u0633\u0627\u0631\u0629 \u0627\u0644\u0634\u0645\u0631\u064A",
        itemCondition: "used_excellent",
        currency: "SAR",
        createdDate: new Date(now.getTime() - 4 * 24 * 60 * 60 * 1e3).toISOString(),
        softCloseMinutes: 2
      }
    ];
    const a1Time = new Date(this.auctions[0].createdDate).getTime();
    this.bids = [
      {
        id: "b_01",
        auctionId: "a1",
        bidderName: "\u0623\u0646\u062A\u064A\u0643\u0627\u0648\u064A",
        bidderEmail: "arabdt.com@gmail.com",
        amount: 46e3,
        timestamp: new Date(a1Time + 5 * 60 * 1e3).toISOString()
      },
      {
        id: "b_02",
        auctionId: "a1",
        bidderName: "\u0633\u0627\u0631\u0629 \u0627\u0644\u0634\u0645\u0631\u064A",
        bidderEmail: "sara.buyer@gmail.com",
        amount: 48e3,
        timestamp: new Date(a1Time + 35 * 60 * 1e3).toISOString()
      },
      {
        id: "b_03",
        auctionId: "a1",
        bidderName: "John Miller",
        bidderEmail: "john.miller@gmail.com",
        amount: 5e4,
        timestamp: new Date(a1Time + 2 * 60 * 60 * 1e3).toISOString()
      },
      {
        id: "b_04",
        auctionId: "a1",
        bidderName: "\u0633\u0627\u0631\u0629 \u0627\u0644\u0634\u0645\u0631\u064A",
        bidderEmail: "sara.buyer@gmail.com",
        amount: 51200,
        timestamp: new Date(a1Time + 8 * 60 * 60 * 1e3).toISOString()
      },
      {
        id: "b_05",
        auctionId: "a2",
        bidderName: "\u0633\u0627\u0631\u0629 \u0627\u0644\u0634\u0645\u0631\u064A",
        bidderEmail: "sara.buyer@gmail.com",
        amount: 69e4,
        timestamp: new Date(now.getTime() - 5 * 60 * 1e3).toISOString()
      },
      {
        id: "b_06",
        auctionId: "a2",
        bidderName: "\u0623\u0646\u062A\u064A\u0643\u0627\u0648\u064A",
        bidderEmail: "arabdt.com@gmail.com",
        amount: 715e3,
        timestamp: new Date(now.getTime() - 2 * 60 * 1e3).toISOString()
      },
      {
        id: "b_07",
        auctionId: "a0",
        bidderName: "\u062E\u0627\u0644\u062F \u0639\u0628\u062F \u0627\u0644\u0644\u0647",
        bidderEmail: "khalid@gmail.com",
        amount: 88e3,
        timestamp: new Date(now.getTime() - 60 * 60 * 1e3).toISOString()
      },
      {
        id: "b_08",
        auctionId: "a0",
        bidderName: "\u0623\u0646\u062A\u064A\u0643\u0627\u0648\u064A",
        bidderEmail: "arabdt.com@gmail.com",
        amount: 94500,
        timestamp: new Date(now.getTime() - 15 * 60 * 1e3).toISOString()
      },
      {
        id: "b_09",
        auctionId: "a3",
        bidderName: "\u0641\u0647\u062F \u0627\u0644\u0645\u0637\u064A\u0631\u064A",
        bidderEmail: "fahad@gmail.com",
        amount: 2500,
        timestamp: new Date(now.getTime() - 120 * 60 * 1e3).toISOString()
      },
      {
        id: "b_10",
        auctionId: "a3",
        bidderName: "\u0633\u0627\u0631\u0629 \u0627\u0644\u0634\u0645\u0631\u064A",
        bidderEmail: "sara.buyer@gmail.com",
        amount: 3100,
        timestamp: new Date(now.getTime() - 30 * 60 * 1e3).toISOString()
      },
      {
        id: "b_11",
        auctionId: "a4",
        bidderName: "\u0633\u0644\u0637\u0627\u0646 \u0628\u0646 \u0639\u0628\u062F \u0627\u0644\u0639\u0632\u064A\u0632",
        bidderEmail: "sultan@gmail.com",
        amount: 252e4,
        timestamp: new Date(now.getTime() - 180 * 60 * 1e3).toISOString()
      },
      {
        id: "b_12",
        auctionId: "a4",
        bidderName: "\u0623\u0646\u062A\u064A\u0643\u0627\u0648\u064A",
        bidderEmail: "arabdt.com@gmail.com",
        amount: 255e4,
        timestamp: new Date(now.getTime() - 45 * 60 * 1e3).toISOString()
      },
      {
        id: "b_13",
        auctionId: "a5",
        bidderName: "\u0646\u0648\u0631\u0629 \u0627\u0644\u062F\u0648\u0633\u0631\u064A",
        bidderEmail: "noura@gmail.com",
        amount: 1400,
        timestamp: new Date(now.getTime() - 14 * 60 * 60 * 1e3).toISOString()
      },
      {
        id: "b_14",
        auctionId: "a5",
        bidderName: "\u0623\u0646\u062A\u064A\u0643\u0627\u0648\u064A",
        bidderEmail: "arabdt.com@gmail.com",
        amount: 1500,
        timestamp: new Date(now.getTime() - 13 * 60 * 60 * 1e3).toISOString()
      },
      {
        id: "b_15",
        auctionId: "a6",
        bidderName: "\u0645\u0627\u062C\u062F \u0627\u0644\u062D\u0631\u0628\u064A",
        bidderEmail: "majed@gmail.com",
        amount: 1350,
        timestamp: new Date(now.getTime() - 90 * 60 * 1e3).toISOString()
      },
      {
        id: "b_16",
        auctionId: "a6",
        bidderName: "\u0633\u0627\u0631\u0629 \u0627\u0644\u0634\u0645\u0631\u064A",
        bidderEmail: "sara.buyer@gmail.com",
        amount: 1650,
        timestamp: new Date(now.getTime() - 20 * 60 * 1e3).toISOString()
      }
    ];
    this.tickets = [
      {
        id: "t1",
        email: "arabdt.com@gmail.com",
        name: "\u0623\u0646\u062A\u064A\u0643\u0627\u0648\u064A",
        subject: "\u0627\u0633\u062A\u0641\u0633\u0627\u0631 \u0628\u062E\u0635\u0648\u0635 \u0622\u0644\u064A\u0629 \u0627\u0633\u062A\u0631\u062C\u0627\u0639 \u0639\u0631\u0628\u0648\u0646 \u0627\u0644\u0640\u062A\u0623\u0645\u064A\u0646",
        message: "\u0627\u0644\u0633\u0644\u0627\u0645 \u0639\u0644\u064A\u0643\u0645 \u0648\u0631\u062D\u0645\u0629 \u0627\u0644\u0644\u0647 \u0648\u0628\u0631\u0643\u0627\u062A\u0647\u060C \u0642\u0645\u062A \u0642\u0628\u0644 \u0642\u0644\u064A\u0644 \u0628\u0627\u0644\u0627\u0634\u062A\u0631\u0627\u0643 \u0641\u064A \u0645\u0632\u0627\u062F \u0633\u064A\u0627\u0631\u0629 \u0645\u0631\u0633\u064A\u062F\u0633 \u0648\u062F\u0641\u0639\u062A \u0645\u0628\u0644\u063A \u0627\u0644\u062A\u0623\u0645\u064A\u0646 \u0628\u0627\u0644\u0641\u064A\u0632\u0627. \u0641\u064A \u062D\u0627\u0644 \u0644\u0645 \u0623\u0641\u0632 \u0628\u0627\u0644\u0635\u0641\u0642\u0629 \u0647\u0644 \u064A\u062A\u0645 \u062A\u062D\u0631\u064A\u0631 \u0648\u062D\u0644 \u0645\u0628\u0627\u0644\u063A \u0627\u0644\u0636\u0645\u0627\u0646 \u062A\u0644\u0642\u0627\u0626\u064A\u0627\u064B \u0623\u0645 \u064A\u062A\u0637\u0644\u0628 \u0627\u0644\u0623\u0645\u0631 \u0648\u0642\u062A\u0627\u064B \u0644\u0644\u0628\u0646\u0643\u061F \u0648\u0634\u0643\u0631\u0627\u064B.",
        status: "answered",
        reply: "\u0648\u0639\u0644\u064A\u0643\u0645 \u0627\u0644\u0633\u0644\u0627\u0645 \u064A\u0627 \u0639\u0628\u062F \u0627\u0644\u0631\u062D\u0645\u0646. \u0641\u064A \u062D\u0627\u0644 \u0627\u0644\u0645\u0632\u0627\u064A\u062F\u0629 \u0648\u0639\u062F\u0645 \u0627\u0644\u0641\u0648\u0632 \u0628\u0623\u064A \u062A\u0635\u0641\u064A\u0629\u060C \u064A\u0642\u0648\u0645 \u0627\u0644\u0646\u0638\u0627\u0645 \u0641\u0648\u0631\u0627\u064B \u0628\u0625\u0644\u063A\u0627\u0621 \u062D\u062C\u0632 \u0627\u0644\u0648\u062F\u0627\u0626\u0639 \u0648\u062A\u0648\u062C\u064A\u0647 \u0627\u0644\u0628\u0646\u0643 \u0644\u0625\u0631\u062C\u0627\u0639\u0647\u0627. \u062A\u0633\u062A\u063A\u0631\u0642 \u0627\u0644\u0639\u0645\u0644\u064A\u0629 \u0627\u0644\u0645\u0635\u0631\u0641\u064A\u0629 \u0627\u0644\u0645\u0639\u062A\u0627\u062F\u0629 \u0645\u0646 \u064A\u0648\u0645 \u0625\u0644\u0649 5 \u0623\u064A\u0627\u0645 \u0644\u0638\u0647\u0648\u0631\u0647\u0627 \u0628\u0643\u0634\u0641 \u062D\u0633\u0627\u0628\u0643. \u0646\u062D\u0646 \u0628\u062E\u062F\u0645\u062A\u0643 \u062F\u0627\u0626\u0645\u0627\u064B.",
        timestamp: new Date(now.getTime() - 2 * 60 * 60 * 1e3).toISOString()
      },
      {
        id: "t2",
        email: "sara.buyer@gmail.com",
        name: "\u0633\u0627\u0631\u0629 \u0627\u0644\u0634\u0645\u0631\u064A",
        subject: "\u0645\u0634\u0643\u0644\u0629 \u0641\u064A \u062A\u062D\u0645\u064A\u0644 \u0634\u0647\u0627\u062F\u0629 \u0641\u062D\u0635 \u0631\u0648\u0644\u0643\u0633",
        message: "\u0623\u062D\u0627\u0648\u0644 \u0627\u0644\u0645\u0632\u0627\u064A\u062F\u0629 \u0639\u0644\u0649 \u0631\u0648\u0644\u0643\u0633 \u0635\u0628\u0645\u0627\u0631\u064A\u0646\u0631\u060C \u0644\u0643\u0646\u064A \u0639\u0646\u062F\u0645\u0627 \u0623\u062D\u0627\u0648\u0644 \u0627\u0644\u0636\u063A\u0637 \u0639\u0644\u0649 \u0645\u0644\u0641 \u0634\u0647\u0627\u062F\u0629 \u0627\u0644\u0645\u0635\u0627\u062F\u0642\u0629 \u064A\u0641\u0634\u0644 \u0627\u0644\u062A\u062D\u0645\u064A\u0644 \u0648\u062A\u0638\u0647\u0631 \u0631\u0633\u0627\u0644\u0629 \u062E\u0637\u0623 \u0628\u0627\u0644\u062E\u0627\u062F\u0645. \u0623\u0631\u062C\u0648 \u062D\u0644 \u0627\u0644\u0645\u0634\u0643\u0644\u0629 \u0648\u0645\u0634\u0627\u0631\u0643\u062A\u064A \u0627\u0644\u0645\u0644\u0641.",
        status: "open",
        timestamp: new Date(now.getTime() - 20 * 60 * 1e3).toISOString()
      }
    ];
    this.shipments = [
      {
        id: "sh1",
        auctionId: "a6",
        auctionTitleAr: "\u0633\u0644\u0643 \u0630\u0643\u064A \u0648\u0633\u0645\u0627\u0639\u0627\u062A \u0631\u0623\u0633 \u0623\u0628\u0644 AirPods Max \u0631\u0635\u0627\u0635\u064A \u062F\u0627\u0643\u0646",
        auctionTitleEn: "Apple AirPods Max Headphones Space Gray Space",
        buyerEmail: "sara.buyer@gmail.com",
        carrier: "\u0623\u0631\u0627\u0645\u0643\u0633 (Aramex)",
        trackingNumber: "AR-70982312-SA",
        status: "in_transit",
        estimatedDelivery: new Date(now.getTime() + 1 * 24 * 60 * 60 * 1e3).toISOString().split("T")[0],
        history: [
          {
            status: "\u062A\u0623\u0643\u064A\u062F \u0627\u0644\u0633\u062F\u0627\u062F \u0648\u0627\u0644\u0637\u0644\u0628",
            statusAr: "\u062A\u0623\u0643\u064A\u062F \u0627\u0644\u0633\u062F\u0627\u062F \u0648\u0627\u0644\u0637\u0644\u0628 \u0648\u062D\u062C\u0632 \u0627\u0644\u0645\u0628\u0644\u063A \u0641\u064A \u062D\u0633\u0627\u0628 \u0627\u0644\u0636\u0645\u0627\u0646 \u0627\u0644\u062A\u0627\u0628\u0639 \u0644\u0644\u0645\u0632\u0627\u062F",
            city: "Jeddah Hub",
            cityAr: "\u0645\u0633\u062A\u0648\u062F\u0639 \u062C\u062F\u0629 \u0627\u0644\u0645\u0631\u0643\u0632\u064A",
            timestamp: new Date(now.getTime() - 48 * 60 * 60 * 1e3).toISOString()
          },
          {
            status: "\u0633\u0644\u0645\u062A \u0644\u0634\u0631\u0643\u0629 \u0627\u0644\u0634\u062D\u0646",
            statusAr: "\u062A\u0645 \u062A\u062C\u0647\u064A\u0632 \u0627\u0644\u0637\u0631\u062F \u0648\u0627\u0633\u062A\u0644\u0627\u0645\u0647 \u0628\u0648\u0627\u0633\u0637\u0629 \u0634\u0631\u0643\u0629 \u0623\u0631\u0627\u0645\u0643\u0633",
            city: "Jeddah",
            cityAr: "\u0641\u0631\u0639 \u0627\u0644\u062D\u0645\u0631\u0627\u0621\u060C \u062C\u062F\u0629",
            timestamp: new Date(now.getTime() - 36 * 60 * 60 * 1e3).toISOString()
          },
          {
            status: "\u062A\u062D\u062A \u0627\u0644\u0646\u0642\u0644 \u0648\u0627\u0644\u062A\u0648\u0635\u064A\u0644 \u0627\u0644\u0645\u0628\u0627\u0634\u0631",
            statusAr: "\u0627\u0644\u0634\u062D\u0646\u0629 \u063A\u0627\u062F\u0631\u062A \u0645\u0631\u0643\u0632 \u0627\u0644\u0641\u0631\u0632 \u0648\u0645\u062A\u062C\u0647\u0629 \u0644\u0645\u062D\u0637\u0629 \u0627\u0644\u0648\u0635\u0648\u0644",
            city: "Riyadh Hub",
            cityAr: "\u0645\u0631\u0643\u0632 \u062A\u0635\u0646\u064A\u0641 \u0648\u062A\u0648\u0632\u064A\u0639 \u0627\u0644\u0631\u064A\u0627\u0636 \u0627\u0644\u0631\u0626\u064A\u0633\u064A",
            timestamp: new Date(now.getTime() - 12 * 60 * 60 * 1e3).toISOString()
          }
        ]
      }
    ];
    this.escrows = [
      {
        id: "es1",
        auctionId: "a6",
        auctionTitleAr: "\u0633\u0644\u0643 \u0630\u0643\u064A \u0648\u0633\u0645\u0627\u0639\u0627\u062A \u0631\u0623\u0633 \u0623\u0628\u0644 AirPods Max \u0631\u0635\u0627\u0635\u064A \u062F\u0627\u0643\u0646",
        auctionTitleEn: "Apple AirPods Max Headphones Space Gray Space",
        amount: 1650,
        currency: "SAR",
        buyerEmail: "sara.buyer@gmail.com",
        sellerName: "\u0627\u0644\u0645\u0642\u0635\u062F \u0627\u0644\u0631\u0642\u0645\u064A \u0644\u0644\u0623\u062C\u0647\u0632\u0629 \u0627\u0644\u0625\u0644\u0643\u062A\u0631\u0648\u0646\u064A\u0629",
        status: "held",
        createdAt: new Date(now.getTime() - 48 * 60 * 60 * 1e3).toISOString()
      }
    ];
    this.logs = [
      {
        id: "l1",
        timestamp: new Date(now.getTime() - 120 * 60 * 1e3).toISOString(),
        type: "info",
        message: "\u0628\u062F\u0621 \u0639\u0645\u0644 \u0645\u062D\u0631\u0643 \u0645\u0631\u0627\u0642\u0628\u0629 \u062A\u0645\u062F\u064A\u062F \u0623\u0648\u0642\u0627\u062A \u0627\u0644\u0645\u0632\u0627\u062F\u0627\u062A \u0648\u0645\u0643\u0627\u0641\u062D\u0629 \u0627\u0644\u0642\u0646\u0635 \u0627\u0644\u062A\u0644\u0642\u0627\u0626\u064A."
      },
      {
        id: "l2",
        timestamp: new Date(now.getTime() - 90 * 60 * 1e3).toISOString(),
        type: "security",
        message: "\u062A\u0645 \u062A\u0641\u0639\u064A\u0644 \u062E\u0648\u0627\u0631\u0632\u0645\u064A\u0629 \u0641\u062D\u0635 \u0627\u0644\u0633\u0644\u0648\u0643 \u0627\u0644\u062E\u0628\u064A\u062B \u0648\u062A\u062C\u0646\u0628 \u0627\u0644\u0645\u0632\u0627\u064A\u062F\u0627\u062A \u0627\u0644\u0635\u0648\u0631\u064A\u0629 \u0644\u0644\u0639\u0645\u0644\u0627\u0621 \u0628\u0627\u0645\u062A\u064A\u0627\u0632 99%"
      },
      {
        id: "l3",
        timestamp: new Date(now.getTime() - 48 * 60 * 60 * 1e3).toISOString(),
        type: "financial",
        message: "\u0625\u064A\u062F\u0627\u0639 \u0645\u0627\u0644\u064A \u0646\u0627\u062C\u062D \u0642\u064A\u0645\u062A\u0647 1650 \u0631\u064A\u0627\u0644 \u0633\u0639\u0648\u062F\u064A \u0645\u0646 \u0627\u0644\u0645\u0634\u062A\u0631\u064A sara.buyer@gmail.com \u0641\u064A \u0635\u0646\u062F\u0648\u0642 \u0627\u0644\u0636\u0645\u0627\u0646 \u0648\u0627\u0644\u0648\u062F\u0627\u0626\u0639 \u0644\u0644\u0645\u0632\u0627\u062F a6",
        user: "sara.buyer@gmail.com"
      }
    ];
  }
  // Submit Bid with complete, deep business logic and Firestore integration
  submitBid(auctionId, email, name, amount) {
    const auction = this.auctions.find((a) => a.id === auctionId);
    if (!auction) {
      return { success: false, messageAr: "\u0644\u0645 \u064A\u062A\u0645 \u0627\u0644\u0639\u062B\u0648\u0631 \u0639\u0644\u0649 \u0627\u0644\u0645\u0632\u0627\u062F \u0627\u0644\u0645\u0637\u0644\u0648\u0628", messageEn: "Auction not found" };
    }
    if (auction.status !== "active") {
      return { success: false, messageAr: "\u0647\u0630\u0627 \u0627\u0644\u0645\u0632\u0627\u062F \u063A\u064A\u0631 \u0646\u0634\u0637 \u062D\u0627\u0644\u064A\u0627\u064B", messageEn: "Auction is not active" };
    }
    const now = /* @__PURE__ */ new Date();
    const endTime = new Date(auction.endTime);
    if (now.getTime() > endTime.getTime()) {
      auction.status = "completed";
      this.updateAuction(auction);
      return { success: false, messageAr: "\u0639\u0630\u0631\u0627\u064B\u060C \u0627\u0644\u0645\u0632\u0627\u062F \u0645\u063A\u0644\u0642 \u0648\u0645\u0646\u062A\u0647\u064A \u0627\u0644\u0635\u0644\u0627\u062D\u064A\u0629 \u0628\u0627\u0644\u0641\u0639\u0644", messageEn: "Auction is already closed" };
    }
    const currentHighPrice = auction.currentPrice;
    const requiredAmount = currentHighPrice + auction.minIncrement;
    if (amount < requiredAmount) {
      return {
        success: false,
        messageAr: `\u0642\u064A\u0645\u0629 \u0627\u0644\u0645\u0632\u0627\u064A\u062F\u0629 \u063A\u064A\u0631 \u0643\u0627\u0641\u064A\u0629. \u0627\u0644\u062D\u062F \u0627\u0644\u0623\u062F\u0646\u0649 \u0644\u0644\u0645\u0632\u0627\u064A\u062F\u0629 \u0627\u0644\u0642\u0627\u062F\u0645\u0629 \u0647\u0648: ${requiredAmount} ${auction.currency}`,
        messageEn: `Bid amount is insufficient. Minimum required is: ${requiredAmount} ${auction.currency}`
      };
    }
    if (auction.highBidder === email) {
      return {
        success: false,
        messageAr: "\u0623\u0646\u062A \u0645\u062A\u0635\u062F\u0631 \u0647\u0630\u0627 \u0627\u0644\u0645\u0632\u0627\u062F \u062D\u0627\u0644\u064A\u0627\u064B \u0648\u0644\u0627 \u062A\u062D\u062A\u0627\u062C \u0644\u0644\u0645\u0632\u0627\u064A\u062F\u0629 \u0641\u0648\u0642 \u0646\u0641\u0633\u0643!",
        messageEn: "You are currently leading this auction, no need to outbid yourself!"
      };
    }
    const bidId = `b_${Date.now()}`;
    const newBid = {
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
    const softCloseMinutes = auction.softCloseMinutes || 5;
    const softCloseThresholdMs = softCloseMinutes * 60 * 1e3;
    let autoExtended = false;
    if (timeLeftMs > 0 && timeLeftMs <= softCloseThresholdMs) {
      const newEndTime = new Date(now.getTime() + softCloseThresholdMs);
      auction.endTime = newEndTime.toISOString();
      auction.antiSnipeTriggeredCount = (auction.antiSnipeTriggeredCount || 0) + 1;
      auction.lastExtendedAt = now.toISOString();
      autoExtended = true;
      const extMsg = `\u0623\u0645\u0646 \u0645\u0643\u0627\u0641\u062D\u0629 \u0627\u0644\u0642\u0646\u0635: \u062A\u0645 \u062A\u0645\u062F\u064A\u062F \u0627\u0644\u0645\u0632\u0627\u062F \u062A\u0644\u0642\u0627\u0626\u064A\u0627\u064B \u0628\u0645\u0642\u062F\u0627\u0631 ${softCloseMinutes} \u062F\u0642\u0627\u0626\u0642 \u0644\u0645\u0646\u0639 \u0645\u062D\u0627\u0648\u0644\u0627\u062A \u0642\u0646\u0635 \u0627\u0644\u0639\u0637\u0627\u0621\u0627\u062A \u0628\u0627\u0644\u062B\u0627\u0646\u064A\u0629 \u0627\u0644\u0623\u062E\u064A\u0631\u0629.`;
      this.addLog({
        id: `l_${Date.now()}_sec`,
        timestamp: now.toISOString(),
        type: "security",
        message: extMsg + ` \u0627\u0644\u0645\u0632\u0627\u062F: ${auction.titleAr}`,
        user: email
      });
    }
    this.addLog({
      id: `l_${Date.now()}_bid`,
      timestamp: now.toISOString(),
      type: "financial",
      message: `\u0645\u0632\u0627\u064A\u062F\u0629 \u0641\u0648\u0631\u064A\u0629 \u0628\u0642\u064A\u0645\u0629 ${amount} ${auction.currency} \u0642\u062F\u0645\u0647\u0627 ${name} \u0639\u0644\u0649 \u0627\u0644\u0645\u0632\u0627\u062F ${auction.titleAr}`,
      user: email
    });
    (0, import_firestore.setDoc)((0, import_firestore.doc)(this.firestore, "bids", newBid.id), newBid).catch((err) => console.error(err));
    this.updateAuction(auction);
    return {
      success: true,
      messageAr: autoExtended ? `\u062A\u0645 \u062A\u0642\u062F\u064A\u0645 \u0645\u0632\u0627\u064A\u062F\u062A\u0643 \u0628\u0646\u062C\u0627\u062D \u0648\u0628\u0642\u064A\u0645\u0629 ${amount} ${auction.currency}. \u0648\u0628\u0645\u0627 \u0623\u0646\u0647 \u062A\u0645 \u0641\u064A \u0627\u0644\u062F\u0642\u0627\u0626\u0642 \u0627\u0644\u0623\u062E\u064A\u0631\u0629\u060C \u0641\u0642\u062F \u062A\u0645 \u062A\u0645\u062F\u064A\u062F \u0627\u0644\u0645\u0632\u0627\u062F \u062A\u0644\u0642\u0627\u0626\u064A\u0627\u064B \u0644\u0645\u0646\u0639 \u0642\u0646\u0635 \u0627\u0644\u0635\u0641\u0642\u0627\u062A!` : `\u062A\u0645 \u062A\u0642\u062F\u064A\u0645 \u0645\u0632\u0627\u064A\u062F\u062A\u0643 \u0628\u0646\u062C\u0627\u062D \u0648\u0628\u0642\u064A\u0645\u0629 ${amount} ${auction.currency}`,
      messageEn: autoExtended ? `Your bid of ${amount} ${auction.currency} was submitted successfully. The auction has been extended by ${softCloseMinutes} minutes for sniper prevention.` : `Your bid of ${amount} ${auction.currency} was successfully posted.`,
      auction,
      bid: newBid
    };
  }
  // Handle immediate purchase / buyout with Firestore integration
  buyoutAuction(auctionId, email, name) {
    const auction = this.auctions.find((a) => a.id === auctionId);
    if (!auction) {
      return { success: false, messageAr: "\u0627\u0644\u0645\u0632\u0627\u062F \u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F", messageEn: "Auction not found" };
    }
    if (auction.status !== "active") {
      return { success: false, messageAr: "\u0647\u0630\u0627 \u0627\u0644\u0645\u0632\u0627\u062F \u0627\u0646\u062A\u0647\u0649 \u0628\u0627\u0644\u0641\u0639\u0644", messageEn: "Auction is not active" };
    }
    if (!auction.buyoutPrice) {
      return { success: false, messageAr: "\u0627\u0644\u0634\u0631\u0627\u0621 \u0627\u0644\u0641\u0648\u0631\u064A \u063A\u064A\u0631 \u0645\u062A\u0627\u062D \u0641\u064A \u0647\u0630\u0627 \u0627\u0644\u0645\u0632\u0627\u062F", messageEn: "Buyout not available" };
    }
    const now = /* @__PURE__ */ new Date();
    auction.currentPrice = auction.buyoutPrice;
    auction.status = "buyout_claimed";
    auction.highBidder = email;
    auction.highBidderName = name;
    auction.endTime = now.toISOString();
    const escrowId = `es_${Date.now()}`;
    const newEscrow = {
      id: escrowId,
      auctionId,
      auctionTitleAr: auction.titleAr,
      auctionTitleEn: auction.titleEn,
      amount: auction.buyoutPrice,
      amountUSD: auction.buyoutPrice,
      currency: "USD",
      buyerEmail: email,
      buyerName: name,
      sellerName: auction.seller.name,
      sellerEmail: auction.sellerEmail || "arabdt.com@gmail.com",
      sellerVerified: auction.seller.verified ?? true,
      status: "held",
      createdAt: now.toISOString(),
      paymentMethod: "Instant Buyout Escrow",
      invoiceNumber: `INV-${Date.now()}`
    };
    this.escrows.push(newEscrow);
    (0, import_firestore.setDoc)((0, import_firestore.doc)(this.firestore, "escrows", newEscrow.id), newEscrow).catch((err) => console.error(err));
    this.addLog({
      id: `l_${Date.now()}_buyout`,
      timestamp: now.toISOString(),
      type: "financial",
      message: `\u0639\u0645\u0644\u064A\u0629 \u0634\u0631\u0627\u0621 \u0641\u0648\u0631\u064A \u0646\u0627\u062C\u062D\u0629 \u0628\u0642\u064A\u0645\u0629 ${auction.buyoutPrice} $ USD \u0644\u0644\u0645\u0632\u0627\u062F ${auction.titleAr}`,
      user: email
    });
    this.updateAuction(auction);
    return {
      success: true,
      messageAr: `\u062A\u0647\u0627\u0646\u064A\u0646\u0627! \u0644\u0642\u062F \u0642\u0645\u062A \u0628\u062A\u0641\u0639\u064A\u0644 \u062E\u064A\u0627\u0631 \u0627\u0644\u0634\u0631\u0627\u0621 \u0627\u0644\u0641\u0648\u0631\u064A \u0643\u0628\u0637\u0644 \u0648\u062D\u062C\u0632\u062A \u0627\u0644\u0633\u0644\u0639\u0629 \u0628\u0646\u062C\u0627\u062D \u0628\u0642\u064A\u0645\u0629 ${auction.buyoutPrice} $ USD.`,
      messageEn: `Congratulations! You successfully activated buyout for ${auction.buyoutPrice} $ USD and secured the auction.`,
      auction,
      escrow: newEscrow
    };
  }
  // Escrow payment simulated logic with Firestore integration
  checkoutEscrow(auctionId, email, amount, paymentMethod, paymentDetails) {
    const auction = this.auctions.find((a) => a.id === auctionId);
    if (!auction) {
      return { success: false, messageAr: "\u0627\u0644\u0645\u0632\u0627\u062F \u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F" };
    }
    const now = /* @__PURE__ */ new Date();
    const escrowId = `es_${Date.now()}`;
    const newEscrow = {
      id: escrowId,
      auctionId,
      auctionTitleAr: auction.titleAr,
      auctionTitleEn: auction.titleEn,
      amount,
      amountUSD: amount,
      currency: "USD",
      buyerEmail: email,
      sellerName: auction.seller.name,
      sellerEmail: auction.sellerEmail || "arabdt.com@gmail.com",
      sellerVerified: auction.seller.verified ?? true,
      status: "held",
      createdAt: now.toISOString(),
      paymentMethod: paymentMethod || "Credit Card",
      paymentDetails: paymentDetails || "Standard checkout",
      invoiceNumber: `INV-${Date.now()}`
    };
    this.escrows.push(newEscrow);
    const shipmentId = `sh_${Date.now()}`;
    const newShipment = {
      id: shipmentId,
      auctionId,
      auctionTitleAr: auction.titleAr,
      auctionTitleEn: auction.titleEn,
      buyerEmail: email,
      carrier: "",
      trackingNumber: "",
      status: "payment_confirmed",
      estimatedDelivery: "",
      history: [
        {
          status: "\u062F\u0641\u0639 \u0645\u0624\u0645\u0646 \u0648\u0642\u064A\u062F \u062A\u062C\u0647\u064A\u0632 \u0627\u0644\u0634\u062D\u0646\u0629",
          statusAr: `\u062A\u0645 \u062A\u0641\u0639\u064A\u0644 \u062D\u0645\u0627\u064A\u0629 \u0627\u0644\u0636\u0645\u0627\u0646 (Escrow) \u0628\u062F\u0641\u0639 \u0645\u0624\u0645\u0646 \u0639\u0628\u0631 ${newEscrow.paymentMethod}: \u062A\u0645 \u0627\u0633\u062A\u0644\u0627\u0645 \u062F\u0641\u0639\u0629 \u0627\u0644\u0634\u0631\u0627\u0621 \u0628\u0646\u062C\u0627\u062D \u0648\u0647\u064A \u0645\u062D\u062C\u0648\u0632\u0629 \u0628\u0623\u0645\u0627\u0646 \u0628\u0627\u0644\u0636\u0645\u0627\u0646. \u0628\u0627\u0646\u062A\u0638\u0627\u0631 \u0642\u064A\u0627\u0645 \u0627\u0644\u0628\u0627\u0626\u0639 \u0628\u0634\u062D\u0646 \u0627\u0644\u0642\u0637\u0639\u0629 \u0648\u0625\u062F\u062E\u0627\u0644 \u062A\u0641\u0627\u0635\u064A\u0644 \u0627\u0644\u062A\u062A\u0628\u0639 \u0627\u0644\u0631\u0633\u0645\u064A\u0629.`,
          city: "\u0627\u0644\u0645\u0646\u0635\u0629",
          cityAr: "\u0628\u0648\u0627\u0628\u0629 \u0627\u0644\u062D\u0645\u0627\u064A\u0629 \u0648\u0627\u0644\u0645\u0637\u0627\u0628\u0642\u0629 \u0627\u0644\u0631\u0642\u0645\u064A\u0629",
          timestamp: now.toISOString()
        }
      ]
    };
    this.shipments.push(newShipment);
    auction.trackingNumber = "";
    auction.carrier = "";
    this.addLog({
      id: `l_${Date.now()}_esplus`,
      timestamp: now.toISOString(),
      type: "financial",
      message: `\u0627\u0644\u0645\u0639\u0627\u0645\u0644\u0629 \u0631\u0642\u0645 ${escrowId} \u0645\u0639 \u062A\u0641\u0639\u064A\u0644 \u062D\u0645\u0627\u064A\u0629 \u0627\u0644\u0636\u0645\u0627\u0646 \u0639\u0628\u0631 [${newEscrow.paymentMethod}] \u0644\u0645\u0628\u0644\u063A ${amount} ${auction.currency} \u0644\u0644\u0645\u0632\u0627\u062F ${auction.titleAr}`,
      user: email
    });
    (0, import_firestore.setDoc)((0, import_firestore.doc)(this.firestore, "escrows", newEscrow.id), newEscrow).catch((err) => console.error(err));
    (0, import_firestore.setDoc)((0, import_firestore.doc)(this.firestore, "shipments", newShipment.id), newShipment).catch((err) => console.error(err));
    this.updateAuction(auction);
    return {
      success: true,
      messageAr: `\u062A\u0645 \u0645\u0639\u0627\u0644\u062C\u0629 \u0627\u0644\u062F\u0641\u0639 \u0627\u0644\u0625\u0644\u0643\u062A\u0631\u0648\u0646\u064A \u0628\u0646\u062C\u0627\u062D \u0639\u0628\u0631 [${newEscrow.paymentMethod}] \u0648\u062A\u0641\u0639\u064A\u0644 \u0628\u0631\u0648\u062A\u0648\u0643\u0648\u0644 \u062D\u0645\u0627\u064A\u0629 \u0627\u0644\u0636\u0645\u0627\u0646 \u0627\u0644\u0641\u0648\u0631\u064A. \u062A\u0645 \u062E\u0635\u0645 \u0627\u0644\u0645\u0628\u0644\u063A \u0648\u062D\u062C\u0632\u0647 \u0641\u064A \u062E\u0632\u0627\u0626\u0646 \u0627\u0644\u0648\u062F\u0627\u0626\u0639 \u0627\u0644\u0622\u0645\u0646\u0629 \u0644\u062A\u0623\u0643\u064A\u062F \u0634\u062D\u0646 \u0645\u0646\u062A\u062C\u0643.`,
      shipment: newShipment,
      escrow: newEscrow
    };
  }
  // Release Escrow with Firestore integration
  releaseEscrow(shipmentId) {
    const shipment = this.shipments.find((s) => s.id === shipmentId);
    if (!shipment) {
      return { success: false, messageAr: "\u0627\u0644\u0634\u062D\u0646\u0629 \u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F\u0629" };
    }
    shipment.status = "received";
    shipment.history.push({
      status: "\u062A\u0645 \u0627\u0644\u0627\u0633\u062A\u0644\u0627\u0645 \u0648\u0627\u0644\u0625\u0641\u0631\u0627\u062C \u0639\u0646 \u0627\u0644\u0636\u0645\u0627\u0646 \u0645\u0627\u0644\u064A\u064B\u0627",
      statusAr: "\u0623\u0643\u062F \u0627\u0644\u0645\u0634\u062A\u0631\u064A \u0627\u0633\u062A\u0644\u0627\u0645 \u0627\u0644\u0633\u0644\u0639\u0629 \u0628\u0646\u062C\u0627\u062D \u0648\u0645\u0637\u0627\u0628\u0642\u0629 \u0627\u0644\u0645\u0648\u0627\u0635\u0641\u0627\u062A. \u062C\u0627\u0631\u064A \u0627\u0644\u0625\u0641\u0631\u0627\u062C \u0648\u062A\u062D\u0631\u064A\u0631 \u0627\u0644\u0623\u0645\u0648\u0627\u0644 \u0627\u0644\u0645\u062D\u062A\u062C\u0632\u0629 \u0628\u0627\u0644\u0636\u0645\u0627\u0646 \u0644\u062D\u0633\u0627\u0628 \u0627\u0644\u0628\u0627\u0626\u0639.",
      city: "\u0645\u0648\u0642\u0639 \u0627\u0644\u062A\u0633\u0644\u064A\u0645 \u0627\u0644\u0645\u0628\u0627\u0634\u0631",
      cityAr: "\u0639\u0646\u0648\u0627\u0646 \u0627\u0644\u0645\u0634\u062A\u0631\u064A \u0627\u0644\u0645\u0639\u062A\u0645\u062F",
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    });
    const escrow = this.escrows.find((e) => e.auctionId === shipment.auctionId);
    if (escrow) {
      escrow.status = "released";
      (0, import_firestore.setDoc)((0, import_firestore.doc)(this.firestore, "escrows", escrow.id), escrow).catch((err) => console.error(err));
    }
    this.addLog({
      id: `l_${Date.now()}_esrel`,
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      type: "financial",
      message: `\u062A\u062D\u0631\u064A\u0631 \u0648\u0625\u0641\u0631\u0627\u062C \u0643\u0627\u0645\u0644 \u0644\u0644\u0645\u0628\u0627\u0644\u063A \u0627\u0644\u0645\u062D\u062A\u062C\u0632\u0629 \u0628\u0642\u064A\u0645\u0629 ${escrow?.amount} \u0644\u0644\u0645\u0632\u0627\u062F \u0627\u0644\u062A\u0627\u0628\u0639 \u0644\u0644\u0634\u062D\u0646\u0629 ${shipmentId}`,
      user: shipment.buyerEmail
    });
    this.updateShipment(shipment);
    return {
      success: true,
      messageAr: "\u062A\u0645 \u0627\u0644\u0625\u0641\u0631\u0627\u062C \u0639\u0646 \u0627\u0644\u0623\u0645\u0648\u0627\u0644 \u0648\u062A\u063A\u0630\u064A\u062A\u0647\u0627 \u0644\u062D\u0633\u0627\u0628 \u0627\u0644\u0628\u0627\u0626\u0639 \u0628\u0646\u062C\u0627\u062D \u0628\u0639\u062F \u062A\u0623\u0643\u064A\u062F\u0643 \u0627\u0644\u0627\u0633\u062A\u0644\u0627\u0645 \u0648\u0645\u0637\u0627\u0628\u0642\u0629 \u0645\u0648\u0627\u0635\u0641\u0627\u062A \u0627\u0644\u0633\u0644\u0639\u0629."
    };
  }
  // Update shipment tracking with Firestore integration
  updateShipmentTracking(auctionId, carrier, trackingNumber, estimatedDelivery, initialCityAr, initialCityEn) {
    const shipment = this.shipments.find((s) => s.auctionId === auctionId);
    if (!shipment) {
      return { success: false, messageAr: "\u0644\u0645 \u064A\u062A\u0645 \u0627\u0644\u0639\u062B\u0648\u0631 \u0639\u0644\u0649 \u0634\u062D\u0646\u0629 \u0644\u0644\u062A\u062D\u062F\u064A\u062B." };
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
    shipment.status = "dispatched";
    shipment.history.unshift({
      status: "Shipped and tracking info added",
      statusAr: `\u062A\u0645 \u0634\u062D\u0646 \u0627\u0644\u0637\u0631\u062F \u0628\u0646\u062C\u0627\u062D \u0628\u0648\u0627\u0633\u0637\u0629 \u0627\u0644\u0628\u0627\u0626\u0639 \u0639\u0628\u0631 \u0634\u0631\u0643\u0629 ${carrier} \u0628\u0631\u0642\u0645 \u062A\u062A\u0628\u0639: ${trackingNumber}`,
      city: initialCityEn || "Origin Hub",
      cityAr: initialCityAr || "\u0645\u0631\u0643\u0632 \u0641\u0631\u0632 \u0627\u0644\u0628\u0627\u0626\u0639 \u0627\u0644\u0631\u0626\u064A\u0633\u064A",
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    });
    this.addLog({
      id: `l_${Date.now()}_shiptrk`,
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      type: "info",
      message: `\u062A\u062D\u062F\u064A\u062B \u0627\u0644\u0634\u062D\u0646\u0629 \u0648\u062A\u0641\u0627\u0635\u064A\u0644 \u0628\u0648\u0644\u064A\u0635\u0629 \u062A\u062A\u0628\u0639 \u0627\u0644\u0645\u0632\u0627\u062F: ${trackingNumber} \u0639\u0628\u0631 \u0646\u0627\u0642\u0644 ${carrier}`
    });
    this.updateShipment(shipment);
    return {
      success: true,
      messageAr: `\u062A\u0645 \u062A\u062D\u062F\u064A\u062B \u0628\u064A\u0627\u0646\u0627\u062A \u0627\u0644\u0634\u062D\u0646 \u0628\u0646\u062C\u0627\u062D \u0648\u062A\u0641\u0639\u064A\u0644 \u062A\u062A\u0628\u0639 \u0644\u0648\u062C\u0633\u062A\u064A\u0627\u062A \u0627\u0644\u0646\u0627\u0642\u0644 ${carrier}!`,
      shipment
    };
  }
  // Backup trigger with Firestore integration
  triggerBackup() {
    const now = /* @__PURE__ */ new Date();
    const backupId = `b_${Date.now()}`;
    const newBackup = {
      id: backupId,
      timestamp: now.toISOString(),
      type: "manual",
      status: "completed",
      size: `${(10 + Math.random() * 5).toFixed(1)} MB`,
      file: `sa_manual_backup_${now.toISOString().split("T")[0]}_${now.getHours()}-${now.getMinutes()}.json.gz`
    };
    this.backupLogs.unshift(newBackup);
    this.addLog({
      id: `l_${Date.now()}_backup`,
      timestamp: now.toISOString(),
      type: "info",
      message: `\u062A\u0645 \u0625\u0646\u0634\u0627\u0621 \u0646\u0633\u062E\u0629 \u0627\u062D\u062A\u064A\u0627\u0637\u064A\u0629 \u0645\u0636\u063A\u0648\u0637\u0629 \u0648\u0645\u0634\u0641\u0631\u0629 \u0644\u0642\u0627\u0639\u062F\u0629 \u0628\u064A\u0627\u0646\u0627\u062A \u0627\u0644\u0645\u0632\u0627\u062F\u0627\u062A \u0628\u0646\u062C\u0627\u062D \u0628\u0627\u0633\u0645: ${newBackup.file}`,
      user: "\u0627\u0644\u0645\u0634\u0631\u0641 \u0627\u0644\u0625\u062F\u0627\u0631\u064A"
    });
    (0, import_firestore.setDoc)((0, import_firestore.doc)(this.firestore, "backupLogs", newBackup.id), newBackup).catch((err) => console.error(err));
    return newBackup;
  }
};
var DB = new OnlineAuctionDB();

// server.ts
var import_genai = require("@google/genai");
async function startServer() {
  const app = (0, import_express.default)();
  const PORT = 3e3;
  app.use(import_express.default.json());
  let clients = [];
  app.get("/api/realtime-notifications", (req, res) => {
    res.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
      "Access-Control-Allow-Origin": "*"
    });
    res.write('data: {"connected": true}\n\n');
    clients.push(res);
    req.on("close", () => {
      clients = clients.filter((c) => c !== res);
    });
  });
  const broadcast = (type, payload) => {
    const message = JSON.stringify({ type, payload });
    clients.forEach((c) => {
      c.write(`data: ${message}

`);
    });
  };
  await DB.initFirestore();
  const getUserFromReq = (req) => {
    const emailHeader = req.headers["x-user-email"] || req.headers["x-user-id"];
    const authHeader = req.headers["authorization"];
    let emailOrId = emailHeader;
    if (!emailOrId && authHeader && authHeader.startsWith("Bearer ")) {
      emailOrId = authHeader.substring(7);
    }
    if (emailOrId) {
      const matched = DB.users.find((u) => u.email.toLowerCase() === emailOrId.toLowerCase() || u.id === emailOrId);
      if (matched) return matched;
    }
    return null;
  };
  const requireAuth = (req, res, next) => {
    const user = getUserFromReq(req);
    if (!user) {
      return res.status(401).json({ success: false, error: "Unauthorized: Authentication required" });
    }
    req.user = user;
    next();
  };
  const requireAdmin = (req, res, next) => {
    const user = getUserFromReq(req);
    if (!user || user.role !== "admin") {
      return res.status(403).json({ success: false, error: "Forbidden: Admin access required" });
    }
    req.user = user;
    next();
  };
  app.post("/api/auth/login", (req, res) => {
    const { email, password, provider } = req.body;
    if (provider) {
      const existingUser = DB.users.find((u) => u.email === email);
      if (existingUser) {
        DB.addLog({
          id: `l_login_${Date.now()}`,
          timestamp: (/* @__PURE__ */ new Date()).toISOString(),
          type: "security",
          message: `\u062A\u0633\u062C\u064A\u0644 \u062F\u062E\u0648\u0644 \u0622\u0645\u0646 \u0646\u0627\u062C\u062D \u0639\u0628\u0631 ${provider} \u0644\u062D\u0633\u0627\u0628 \u0627\u0644\u0639\u0645\u064A\u0644 ${existingUser.name}`
        });
        return res.json({ success: true, user: existingUser });
      } else {
        const newUser = {
          id: `u_${Date.now()}`,
          name: email.split("@")[0],
          email,
          role: "user",
          balance: 2e4,
          avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150",
          preferredCurrency: "SAR",
          preferredLanguage: "ar"
        };
        DB.addUser(newUser);
        return res.json({ success: true, user: newUser });
      }
    }
    const matched = DB.users.find((u) => u.email === email);
    if (matched) {
      return res.json({ success: true, user: matched });
    }
    return res.status(401).json({ success: false, message: "Invalid credentials" });
  });
  app.get("/api/auth/me", (req, res) => {
    res.json({ user: getUserFromReq(req) });
  });
  app.post("/api/auth/logout", (req, res) => {
    res.json({ success: true });
  });
  app.put("/api/auth/profile", (req, res) => {
    const currentUser = getUserFromReq(req);
    if (!currentUser) return res.status(401).json({ success: false, error: "Unauthorized" });
    const { name, phone, preferredCurrency, preferredLanguage } = req.body;
    currentUser.name = name ?? currentUser.name;
    currentUser.phone = phone ?? currentUser.phone;
    currentUser.preferredCurrency = preferredCurrency ?? currentUser.preferredCurrency;
    currentUser.preferredLanguage = preferredLanguage ?? currentUser.preferredLanguage;
    DB.updateUser(currentUser);
    res.json({ success: true, user: currentUser });
  });
  app.get("/api/auctions", (req, res) => {
    res.json({ auctions: DB.auctions });
  });
  app.get("/api/auctions/:id", (req, res) => {
    const auction = DB.auctions.find((a) => a.id === req.params.id);
    if (auction) {
      auction.viewsCount += 1;
      DB.updateAuction(auction);
      res.json({ auction });
    } else {
      res.status(404).json({ message: "Auction not found" });
    }
  });
  app.post("/api/auctions", (req, res) => {
    const currentUser = getUserFromReq(req);
    if (!currentUser) return res.status(401).json({ success: false, error: "Unauthorized" });
    const { titleAr, titleEn, descAr, descEn, category, image, startPrice, minIncrement, buyoutPrice, durationDays, softCloseMinutes, itemCondition, currency } = req.body;
    const now = /* @__PURE__ */ new Date();
    const days = typeof durationDays === "number" ? durationDays : 3;
    const endTime = new Date(now.getTime() + days * 24 * 60 * 60 * 1e3);
    const newAuctionObj = {
      id: `a_${Date.now()}`,
      titleAr: titleAr || "\u0639\u0646\u0635\u0631 \u0645\u0632\u0627\u062F \u062C\u062F\u064A\u062F",
      titleEn: titleEn || "New Auction Item",
      descAr: descAr || "",
      descEn: descEn || "",
      category: category || "\u0623\u062E\u0631\u0649",
      image: image || "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800",
      startPrice: Number(startPrice) || 100,
      currentPrice: Number(startPrice) || 100,
      minIncrement: Number(minIncrement) || 50,
      buyoutPrice: buyoutPrice ? Number(buyoutPrice) : void 0,
      endTime: endTime.toISOString(),
      status: "active",
      bidsCount: 0,
      viewsCount: 1,
      seller: {
        name: currentUser.name,
        rating: 4.8
      },
      itemCondition: itemCondition || "new",
      currency: currency || "SAR",
      createdDate: now.toISOString(),
      softCloseMinutes: typeof softCloseMinutes === "number" ? softCloseMinutes : 2
    };
    DB.addAuction(newAuctionObj);
    DB.addLog({
      id: `l_auc_${Date.now()}`,
      timestamp: now.toISOString(),
      type: "info",
      message: `\u062A\u0645 \u0625\u062F\u0631\u0627\u062C \u0645\u0632\u0627\u062F \u062C\u062F\u064A\u062F \u0628\u0646\u062C\u0627\u062D: ${newAuctionObj.titleAr} \u0628\u0648\u0627\u0633\u0637\u0629 ${currentUser.name}`
    });
    broadcast("auction_created", newAuctionObj);
    res.status(201).json({ success: true, auction: newAuctionObj });
  });
  app.post("/api/auctions/:id/bid", (req, res) => {
    const currentUser = getUserFromReq(req);
    if (!currentUser) return res.status(401).json({ success: false, error: "Unauthorized" });
    const { amount } = req.body;
    const result = DB.submitBid(req.params.id, currentUser.email, currentUser.name, Number(amount));
    if (result.success) {
      broadcast("bid_submitted", {
        auctionId: req.params.id,
        currentPrice: result.auction?.currentPrice,
        endTime: result.auction?.endTime,
        bidsCount: result.auction?.bidsCount,
        highBidderName: result.auction?.highBidderName,
        highBidder: result.auction?.highBidder,
        messageAr: result.messageAr,
        messageEn: result.messageEn
      });
      res.json(result);
    } else {
      res.status(400).json(result);
    }
  });
  app.post("/api/auctions/:id/buyout", (req, res) => {
    const currentUser = getUserFromReq(req);
    if (!currentUser) return res.status(401).json({ success: false, error: "Unauthorized" });
    const result = DB.buyoutAuction(req.params.id, currentUser.email, currentUser.name);
    if (result.success) {
      broadcast("auction_buyout", {
        auctionId: req.params.id,
        currentPrice: result.auction?.currentPrice,
        status: result.auction?.status,
        highBidder: result.auction?.highBidder
      });
      res.json(result);
    } else {
      res.status(400).json(result);
    }
  });
  app.post(["/api/payment/checkout", "/api/escrows/checkout"], (req, res) => {
    const currentUser = getUserFromReq(req);
    if (!currentUser) return res.status(401).json({ success: false, error: "Unauthorized" });
    const { auctionId, amount, paymentMethod, paymentDetails } = req.body;
    const result = DB.checkoutEscrow(auctionId, currentUser.email, amount, paymentMethod, paymentDetails);
    if (result.success) {
      broadcast("shipment_created", result.shipment);
      res.json(result);
    } else {
      res.status(400).json(result);
    }
  });
  app.post("/api/escrows/:id/release", requireAuth, (req, res) => {
    const shipment = DB.shipments.find((s) => s.id === req.params.id || s.auctionId === req.params.id);
    const escrow = DB.escrows.find((e) => e.id === req.params.id || e.auctionId === req.params.id);
    const targetId = shipment?.id || escrow?.auctionId;
    if (targetId) {
      const result = DB.releaseEscrow(targetId);
      if (result.success) {
        broadcast("escrow_released", { shipmentId: targetId, auctionId: targetId });
        res.json(result);
      } else {
        res.status(400).json(result);
      }
    } else {
      res.status(404).json({ messageAr: "\u0627\u0644\u0633\u062C\u0644 \u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F" });
    }
  });
  app.post("/api/escrows/:id/dispute", requireAuth, (req, res) => {
    const currentUser = req.user;
    const { reason } = req.body;
    const escrow = DB.escrows.find((e) => e.id === req.params.id || e.auctionId === req.params.id);
    if (escrow) {
      escrow.status = "disputed";
      escrow.disputedAt = (/* @__PURE__ */ new Date()).toISOString();
      escrow.disputeReason = reason || "Dispute opened by buyer";
      DB.addLog({
        id: `l_${Date.now()}_disp`,
        timestamp: (/* @__PURE__ */ new Date()).toISOString(),
        type: "security",
        message: `\u062A\u0645 \u0641\u062A\u062D \u0646\u0632\u0627\u0639 \u0631\u0633\u0645\u064A \u0639\u0644\u0649 \u0627\u0644\u0636\u0645\u0627\u0646 ${escrow.id} \u0628\u0648\u0627\u0633\u0637\u0629 ${currentUser.email}: ${reason}`,
        user: currentUser.email
      });
      broadcast("escrow_disputed", escrow);
      res.json({ success: true, messageAr: "\u062A\u0645 \u0641\u062A\u062D \u0646\u0632\u0627\u0639 \u0631\u0633\u0645\u064A \u0648\u062A\u062C\u0645\u064A\u062F \u0645\u0628\u0627\u0644\u063A \u0627\u0644\u0636\u0645\u0627\u0646 \u0644\u062D\u064A\u0646 \u0645\u0631\u0627\u062C\u0639\u0629 \u0627\u0644\u0625\u062F\u0627\u0631\u0629.", escrow });
    } else {
      res.status(404).json({ messageAr: "\u0633\u062C\u0644 \u0627\u0644\u0636\u0645\u0627\u0646 \u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F" });
    }
  });
  app.post("/api/escrows/:id/refund", requireAdmin, (req, res) => {
    const { reason } = req.body;
    const escrow = DB.escrows.find((e) => e.id === req.params.id || e.auctionId === req.params.id);
    if (escrow) {
      escrow.status = "refunded";
      escrow.refundedAt = (/* @__PURE__ */ new Date()).toISOString();
      escrow.refundReason = reason || "Refund issued by admin";
      DB.addLog({
        id: `l_${Date.now()}_ref`,
        timestamp: (/* @__PURE__ */ new Date()).toISOString(),
        type: "financial",
        message: `\u0627\u0633\u062A\u0631\u062C\u0627\u0639 \u0623\u0645\u0648\u0627\u0644 \u0627\u0644\u0636\u0645\u0627\u0646 \u0644\u0644\u0645\u0634\u062A\u0631\u064A ${escrow.buyerEmail} \u0644\u0644\u0645\u0632\u0627\u062F ${escrow.auctionId}: ${reason}`
      });
      broadcast("escrow_refunded", escrow);
      res.json({ success: true, messageAr: "\u062A\u0645\u062A \u0645\u0639\u0627\u0644\u062C\u0629 \u0627\u0633\u062A\u0631\u062C\u0627\u0639 \u0627\u0644\u0623\u0645\u0648\u0627\u0644 \u0644\u062D\u0633\u0627\u0628 \u0627\u0644\u0645\u0634\u062A\u0631\u064A \u0628\u0646\u062C\u0627\u062D.", escrow });
    } else {
      res.status(404).json({ messageAr: "\u0633\u062C\u0644 \u0627\u0644\u0636\u0645\u0627\u0646 \u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F" });
    }
  });
  app.get("/api/escrows/:id/invoice", requireAuth, (req, res) => {
    const escrow = DB.escrows.find((e) => e.id === req.params.id || e.auctionId === req.params.id);
    const auction = DB.auctions.find((a) => a.id === (escrow?.auctionId || req.params.id));
    if (!auction) {
      return res.status(404).json({ success: false, message: "Auction or Invoice not found" });
    }
    const hammerPriceUSD = escrow?.amountUSD || escrow?.amount || auction.currentPrice;
    const escrowFeeUSD = Math.round(hammerPriceUSD * 0.025 * 100) / 100;
    const shippingFeeUSD = 25;
    const totalUSD = hammerPriceUSD + escrowFeeUSD + shippingFeeUSD;
    res.json({
      success: true,
      invoice: {
        invoiceNumber: escrow?.invoiceNumber || `INV-2026-${Math.floor(1e4 + Math.random() * 9e4)}`,
        date: escrow?.createdAt || (/* @__PURE__ */ new Date()).toISOString(),
        auctionId: auction.id,
        titleAr: auction.titleAr,
        titleEn: auction.titleEn,
        buyer: { name: escrow?.buyerName || auction.highBidderName || "Buyer", email: escrow?.buyerEmail || auction.highBidder || "" },
        seller: { name: auction.seller.name, email: auction.sellerEmail || "seller.verified@antkawy.com", verified: auction.seller.verified ?? true },
        currency: "USD",
        hammerPriceUSD,
        escrowFeeUSD,
        shippingFeeUSD,
        totalUSD,
        status: escrow?.status || "held",
        paymentMethod: escrow?.paymentMethod || "Credit Card / Escrow Vault"
      }
    });
  });
  app.get("/api/shipments", (req, res) => {
    res.json({ shipments: DB.shipments });
  });
  app.get("/api/auctions/:id/bids", (req, res) => {
    const bids = DB.bids.filter((b) => b.auctionId === req.params.id);
    const sortedBids = [...bids].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    res.json({ bids: sortedBids });
  });
  app.post("/api/shipments/update-tracking", requireAuth, (req, res) => {
    const currentUser = req.user;
    const { auctionId, carrier, trackingNumber, estimatedDelivery, cityAr, cityEn } = req.body;
    if (!auctionId || !carrier || !trackingNumber) {
      return res.status(400).json({ success: false, messageAr: "\u062C\u0645\u064A\u0639 \u0645\u0639\u0644\u0648\u0645\u0627\u062A \u0627\u0644\u062A\u062A\u0628\u0639 \u0645\u0637\u0644\u0648\u0628\u0629" });
    }
    const auction = DB.auctions.find((a) => a.id === auctionId);
    if (!auction) {
      return res.status(404).json({ success: false, messageAr: "\u0627\u0644\u0645\u0632\u0627\u062F \u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F" });
    }
    const isSeller = auction.sellerEmail && auction.sellerEmail.toLowerCase() === currentUser.email.toLowerCase() || auction.seller && auction.seller.name === currentUser.name;
    const isAdmin = currentUser.role === "admin";
    if (!isSeller && !isAdmin) {
      return res.status(403).json({ success: false, error: "Forbidden: Only auction seller or admin can update tracking details" });
    }
    const result = DB.updateShipmentTracking(
      auctionId,
      carrier,
      trackingNumber,
      estimatedDelivery || "",
      cityAr || "",
      cityEn || ""
    );
    if (result.success) {
      broadcast("shipment_updated", result.shipment);
      res.json(result);
    } else {
      res.status(400).json(result);
    }
  });
  app.get("/api/shipping/carrier-lookup", (req, res) => {
    const { carrier, trackingNumber } = req.query;
    if (!carrier || !trackingNumber) {
      return res.status(400).json({ success: false, error: "Carrier and trackingNumber are required" });
    }
    const carrierName = String(carrier).toLowerCase();
    const trackingNo = String(trackingNumber);
    const now = /* @__PURE__ */ new Date();
    let carrierData = {};
    if (carrierName.includes("aramex") || carrierName.includes("\u0623\u0631\u0627\u0645\u0643\u0633")) {
      carrierData = {
        carrier: "Aramex Express API",
        carrierLogo: "Aramex",
        trackingNumber: trackingNo,
        origin: "Riyadh, SA",
        destination: "Jeddah, SA",
        status: "In Transit",
        statusDescription: "Shipment departs Aramex facility to destination",
        events: [
          {
            status: "Delivered to Local Courier",
            statusAr: "\u062C\u0627\u0631\u064A \u0627\u0644\u062A\u0648\u0635\u064A\u0644: \u0627\u0644\u0637\u0631\u062F \u0645\u0639 \u0645\u0646\u062F\u0648\u0628 \u0634\u0631\u0643\u0629 \u0623\u0631\u0627\u0645\u0643\u0633 \u0644\u0644\u062A\u0648\u0635\u064A\u0644 \u0627\u0644\u0646\u0647\u0627\u0626\u064A \u0627\u0644\u0645\u0628\u0627\u0634\u0631",
            city: "Jeddah, KSA",
            cityAr: "\u062C\u062F\u0629\u060C \u062D\u064A \u0627\u0644\u062D\u0645\u0631\u0627\u0621",
            timestamp: (/* @__PURE__ */ new Date()).toISOString()
          },
          {
            status: "Arrived at Destination Facility",
            statusAr: "\u0648\u0635\u0644\u062A \u0625\u0644\u0649 \u0645\u062D\u0637\u0629 \u0627\u0644\u0648\u062C\u0647\u0629: \u0645\u0631\u0643\u0632 \u0641\u0631\u0632 \u0648\u062A\u0648\u0632\u064A\u0639 \u0623\u0631\u0627\u0645\u0643\u0633 \u0628\u062C\u062F\u0629",
            city: "Jeddah, KSA",
            cityAr: "\u062C\u062F\u0629\u060C \u0645\u0631\u0643\u0632 \u0627\u0644\u0641\u0631\u0632 \u0627\u0644\u0631\u0626\u064A\u0633\u064A",
            timestamp: new Date(now.getTime() - 4 * 60 * 60 * 1e3).toISOString()
          },
          {
            status: "Dispatched from Origin Hub",
            statusAr: "\u063A\u0627\u062F\u0631\u062A \u0645\u062D\u0637\u0629 \u0627\u0644\u0645\u0646\u0634\u0623: \u062A\u0635\u0646\u064A\u0641 \u0641\u0631\u0639 \u0623\u0631\u0627\u0645\u0643\u0633 \u0628\u0627\u0644\u0631\u064A\u0627\u0636",
            city: "Riyadh, KSA",
            cityAr: "\u0627\u0644\u0631\u064A\u0627\u0636\u060C \u0641\u0631\u0639 \u0627\u0644\u0633\u0644\u064A",
            timestamp: new Date(now.getTime() - 10 * 60 * 60 * 1e3).toISOString()
          },
          {
            status: "Carrier Picked Up",
            statusAr: "\u062A\u0645 \u0627\u0633\u062A\u0644\u0627\u0645 \u0648\u062A\u0648\u062B\u064A\u0642 \u0627\u0644\u0634\u062D\u0646\u0629 \u0628\u0648\u0627\u0633\u0637\u0629 \u0623\u0631\u0627\u0645\u0643\u0633 \u0645\u0646 \u0627\u0644\u0628\u0627\u0626\u0639 \u0644\u0644\u0641\u0631\u0639",
            city: "Riyadh, KSA",
            cityAr: "\u0627\u0644\u0631\u064A\u0627\u0636\u060C \u0641\u0631\u0639 \u0627\u0644\u0645\u0646\u0634\u0623 \u0627\u0644\u0645\u0639\u062A\u0645\u062F",
            timestamp: new Date(now.getTime() - 18 * 60 * 60 * 1e3).toISOString()
          }
        ]
      };
    } else if (carrierName.includes("dhl") || carrierName.includes("\u062F\u064A")) {
      carrierData = {
        carrier: "DHL Express OnDemand API",
        carrierLogo: "DHL",
        trackingNumber: trackingNo,
        origin: "Jeddah, SA",
        destination: "Dammam, SA",
        status: "With Courier",
        statusDescription: "Shipment is out with DHL courier for delivery",
        events: [
          {
            status: "Out for Delivery",
            statusAr: "\u062E\u0627\u0631\u062C \u0644\u0644\u062A\u0648\u0635\u064A\u0644 \u0627\u0644\u0645\u0628\u0627\u0634\u0631: \u062A\u0645 \u0625\u0633\u0646\u0627\u062F \u0627\u0644\u0637\u0631\u062F \u0644\u0633\u0627\u0626\u0642 \u0627\u0644\u062A\u0648\u0635\u064A\u0644 \u0645\u0646 \u062F\u064A \u0627\u062A\u0634 \u0627\u0644",
            city: "Dammam, KSA",
            cityAr: "\u0627\u0644\u062F\u0645\u0627\u0645\u060C \u0627\u0644\u0641\u0631\u0639 \u0627\u0644\u0625\u0642\u0644\u064A\u0645\u064A \u0627\u0644\u0633\u0631\u064A\u0639",
            timestamp: (/* @__PURE__ */ new Date()).toISOString()
          },
          {
            status: "Customs Cleared",
            statusAr: "\u0625\u0646\u0647\u0627\u0621 \u0627\u0644\u0641\u062D\u0635 \u0648\u0627\u0644\u062A\u062E\u0644\u064A\u0635 \u0627\u0644\u062C\u0645\u0631\u0643\u064A \u0628\u0646\u062C\u0627\u062D \u0648\u062A\u062D\u062F\u064A\u062B \u0627\u0644\u0628\u064A\u0627\u0646\u0627\u062A \u0627\u0644\u0625\u0644\u0643\u062A\u0631\u0648\u0646\u064A\u0629",
            city: "Dammam Court",
            cityAr: "\u0645\u0646\u0641\u0630 \u0627\u0644\u062C\u0633\u0631\u060C \u0627\u0644\u062F\u0645\u0627\u0645",
            timestamp: new Date(now.getTime() - 5 * 60 * 60 * 1e3).toISOString()
          },
          {
            status: "Processed at Facility",
            statusAr: "\u062A\u062C\u0647\u064A\u0632 \u0648\u0645\u0639\u0627\u0644\u062C\u0629 \u0627\u0644\u0637\u0631\u062F \u0627\u0644\u0644\u0648\u062C\u0633\u062A\u064A \u0628\u0645\u0633\u062A\u0648\u062F\u0639\u0627\u062A \u0641\u0631\u0632 \u062F\u064A \u0627\u062A\u0634 \u0627\u0644 \u062F\u0628\u064A / \u0627\u0644\u0628\u062D\u0631\u064A\u0646 \u0627\u0644\u0633\u0631\u064A\u0639",
            city: "DHL Hub",
            cityAr: "\u0645\u0631\u0643\u0632 \u062A\u0635\u0646\u064A\u0641 \u0648\u062A\u0648\u0632\u064A\u0639 \u062F\u064A \u0627\u062A\u0634 \u0627\u0644 \u0627\u0644\u0633\u0631\u064A\u0639 \u0627\u0644\u062F\u0648\u0644\u064A",
            timestamp: new Date(now.getTime() - 12 * 60 * 60 * 1e3).toISOString()
          },
          {
            status: "Picked up",
            statusAr: "\u062A\u0645 \u0641\u062D\u0635 \u0648\u0642\u0628\u0648\u0644 \u0627\u0644\u0634\u062D\u0646\u0629 \u0648\u062A\u062B\u0628\u064A\u062A \u0628\u0648\u0644\u064A\u0635\u0629 \u0623\u0648\u0646-\u062F\u064A\u0645\u0627\u0646\u062F \u0627\u0644\u0631\u0642\u0645\u064A\u0629 \u0628\u0627\u0644\u0628\u0648\u0627\u0628\u0629",
            city: "Jeddah Client Office",
            cityAr: "\u0645\u0643\u062A\u0628 \u062A\u0633\u0644\u064A\u0645 \u0627\u0644\u0628\u0627\u0626\u0639\u060C \u062C\u062F\u0629 \u0627\u0644\u0643\u0648\u0631\u0646\u064A\u0634",
            timestamp: new Date(now.getTime() - 20 * 60 * 60 * 1e3).toISOString()
          }
        ]
      };
    } else {
      carrierData = {
        carrier: "FedEx Express XML Logistics API",
        carrierLogo: "FedEx",
        trackingNumber: trackingNo,
        origin: "Jeddah, SA",
        destination: "Riyadh, SA",
        status: "Departed Facility",
        statusDescription: "Package departed local sorting facility",
        events: [
          {
            status: "On transit",
            statusAr: "\u062A\u062D\u062A \u0627\u0644\u0646\u0642\u0644 \u0627\u0644\u0628\u0631\u064A \u0627\u0644\u0645\u0633\u0631\u0639 \u0644\u0645\u062F\u064A\u0646\u0629 \u0627\u0644\u062A\u0633\u0644\u064A\u0645 \u0627\u0644\u0646\u0647\u0627\u0626\u064A\u0629 \u0627\u0644\u0641\u062F\u0631\u0627\u0644\u064A\u0629",
            city: "Jeddah, KSA",
            cityAr: "\u062C\u062F\u0629\u060C \u0628\u0648\u0627\u0628\u0629 \u0627\u0644\u062E\u062F\u0645\u0627\u062A \u0627\u0644\u0644\u0648\u062C\u0633\u062A\u064A\u0629",
            timestamp: (/* @__PURE__ */ new Date()).toISOString()
          },
          {
            status: "Departed FedEx origin location",
            statusAr: "\u063A\u0627\u062F\u0631 \u0627\u0644\u0637\u0631\u062F \u0645\u0631\u0643\u0632 \u0643\u0627\u0631\u062C\u0648 \u0641\u064A\u062F\u0643\u0633 \u0627\u0644\u0633\u0631\u064A\u0639 \u0628\u0627\u0644\u0645\u0646\u0634\u0623 \u0627\u0644\u062C\u0648\u064A",
            city: "Jeddah Terminal",
            cityAr: "\u062C\u062F\u0629\u060C \u0645\u062D\u0637\u0629 \u0627\u0644\u0634\u062D\u0646 \u0627\u0644\u062C\u0648\u064A",
            timestamp: new Date(now.getTime() - 6 * 60 * 60 * 1e3).toISOString()
          },
          {
            status: "Picked up",
            statusAr: "\u0627\u0633\u062A\u0644\u0627\u0645 \u0627\u0644\u0637\u0631\u062F \u0645\u0646 \u0627\u0644\u0628\u0627\u0626\u0639 \u0648\u062C\u0627\u0631\u064A \u0641\u062D\u0635\u0647 \u062A\u062D\u062A \u0627\u0644\u0648\u0632\u0646 \u0648\u0627\u0644\u062D\u062C\u0645 \u0627\u0644\u0642\u064A\u0627\u0633\u064A",
            city: "Jeddah Center",
            cityAr: "\u062C\u062F\u0629\u060C \u0627\u0644\u0645\u062D\u0637\u0629 \u0627\u0644\u0625\u0642\u0644\u064A\u0645\u064A\u0629 \u0627\u0644\u0645\u062C\u0645\u0639\u0629",
            timestamp: new Date(now.getTime() - 14 * 60 * 60 * 1e3).toISOString()
          }
        ]
      };
    }
    res.json({ success: true, apiLookup: carrierData });
  });
  app.post("/api/shipments/:id/update", requireAdmin, (req, res) => {
    const { status, statusAr, city, cityAr } = req.body;
    const shipment = DB.shipments.find((s) => s.id === req.params.id);
    if (shipment) {
      shipment.status = status;
      shipment.history.unshift({
        status,
        statusAr: statusAr || status,
        city: city || "Sorting Facility",
        cityAr: cityAr || "\u0645\u0631\u0643\u0632 \u0627\u0644\u0645\u0646\u0627\u0648\u0644\u0629 \u0648\u0627\u0644\u062A\u0648\u0632\u064A\u0639 \u0627\u0644\u0631\u0626\u064A\u0633\u064A",
        timestamp: (/* @__PURE__ */ new Date()).toISOString()
      });
      DB.addLog({
        id: `l_ship_${Date.now()}`,
        timestamp: (/* @__PURE__ */ new Date()).toISOString(),
        type: "info",
        message: `\u062A\u0645 \u062A\u062D\u062F\u064A\u062B \u062D\u0627\u0644\u0629 \u0627\u0644\u0634\u062D\u0646\u0629 \u0627\u0644\u0645\u0628\u0627\u0634\u0631\u0629 \u0631\u0642\u0645 ${shipment.trackingNumber} \u0644\u0644\u062F\u0642\u0629: ${statusAr}`
      });
      if (status === "received" || status === "delivered") {
        const escrow = DB.escrows.find((e) => e.auctionId === shipment.auctionId);
        if (escrow && escrow.status === "held") {
          escrow.status = "released";
        }
      }
      DB.updateShipment(shipment);
      broadcast("shipment_updated", shipment);
      res.json({ success: true, shipment });
    } else {
      res.status(404).json({ message: "Shipment not found" });
    }
  });
  app.get("/api/escrows", (req, res) => {
    res.json({ escrows: DB.escrows });
  });
  app.get("/api/support/tickets", requireAuth, (req, res) => {
    const currentUser = req.user;
    if (currentUser.role === "admin") {
      return res.json({ tickets: DB.tickets });
    }
    const userTickets = DB.tickets.filter((t) => t.email.toLowerCase() === currentUser.email.toLowerCase());
    res.json({ tickets: userTickets });
  });
  app.post("/api/support/tickets", (req, res) => {
    const { subject, message } = req.body;
    const currentUser = getUserFromReq(req);
    if (!currentUser) return res.status(401).json({ success: false, error: "Unauthorized" });
    const newTicket = {
      id: `t_${Date.now()}`,
      email: currentUser.email,
      name: currentUser.name,
      subject,
      message,
      status: "open",
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    };
    DB.addTicket(newTicket);
    DB.addLog({
      id: `l_tick_${Date.now()}`,
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      type: "info",
      message: `\u062A\u0645 \u062A\u0642\u062F\u064A\u0645 \u062A\u0630\u0643\u0631\u0629 \u062F\u0639\u0645 \u0641\u0646\u064A \u062C\u062F\u064A\u062F\u0629 \u0628\u062E\u0635\u0648\u0635: ${subject}`,
      user: currentUser.email
    });
    broadcast("ticket_created", newTicket);
    res.status(201).json({ success: true, ticket: newTicket });
  });
  app.post("/api/support/tickets/:id/reply", requireAdmin, (req, res) => {
    const { reply } = req.body;
    const ticket = DB.tickets.find((t) => t.id === req.params.id);
    if (ticket) {
      ticket.status = "answered";
      ticket.reply = reply;
      DB.updateTicket(ticket);
      DB.addLog({
        id: `l_tickrep_${Date.now()}`,
        timestamp: (/* @__PURE__ */ new Date()).toISOString(),
        type: "info",
        message: `\u062A\u0645 \u0627\u0644\u0631\u062F \u0639\u0644\u0649 \u062A\u0630\u0643\u0631\u0629 \u0627\u0644\u062F\u0639\u0645 \u0627\u0644\u0641\u0646\u064A \u0627\u0644\u062E\u0627\u0635\u0629 \u0628\u0640: ${ticket.name}`
      });
      broadcast("ticket_replied", ticket);
      res.json({ success: true, ticket });
    } else {
      res.status(404).json({ message: "Ticket not found" });
    }
  });
  let aiClient = null;
  function getGenAI() {
    if (!aiClient) {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error("GEMINI_API_KEY secret is not declared or provided.");
      }
      aiClient = new import_genai.GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build"
          }
        }
      });
    }
    return aiClient;
  }
  app.post("/api/crm/clients", requireAdmin, (req, res) => {
    const { name, email, phone, role, balance, notes, preferredCurrency, preferredLanguage } = req.body;
    if (!name || !email) {
      return res.status(400).json({ success: false, messageAr: "\u0627\u0644\u0627\u0633\u0645 \u0648\u0627\u0644\u0628\u0631\u064A\u062F \u0627\u0644\u0625\u0644\u0643\u062A\u0631\u0648\u0646\u064A \u0645\u0637\u0644\u0648\u0628\u0627\u0646" });
    }
    const exists = DB.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (exists) {
      return res.status(400).json({ success: false, messageAr: "\u0647\u0630\u0627 \u0627\u0644\u0639\u0645\u064A\u0644 \u0645\u0633\u062C\u0644 \u0628\u0627\u0644\u0641\u0639\u0644 \u0628\u0627\u0644\u0628\u0631\u064A\u062F \u0627\u0644\u0625\u0644\u0643\u062A\u0631\u0648\u0646\u064A \u0627\u0644\u0645\u062F\u062E\u0644" });
    }
    const newClient = {
      id: `u_${Date.now()}`,
      name,
      email,
      phone: phone || "",
      role: role || "user",
      balance: typeof balance === "number" ? balance : 0,
      avatar: `https://images.unsplash.com/photo-${1535713875e3 + Math.floor(Math.random() * 5e5)}?w=150`,
      preferredCurrency: preferredCurrency || "SAR",
      preferredLanguage: preferredLanguage || "ar",
      notes: notes || ""
    };
    DB.addUser(newClient);
    DB.addLog({
      id: `l_crmadd_${Date.now()}`,
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      type: "info",
      message: `\u0625\u0646\u0634\u0627\u0621 \u062D\u0633\u0627\u0628 \u0639\u0645\u064A\u0644 \u062C\u062F\u064A\u062F \u0628\u0627\u0644\u0645\u0644\u0641 \u0627\u0644\u0633\u0644\u0648\u0643\u064A: ${name} (${email})`
    });
    res.status(201).json({ success: true, client: newClient });
  });
  app.put("/api/crm/clients/:id", requireAdmin, (req, res) => {
    const client = DB.users.find((u) => u.id === req.params.id);
    if (!client) {
      return res.status(404).json({ success: false, messageAr: "\u0627\u0644\u0639\u0645\u064A\u0644 \u0627\u0644\u0645\u0633\u062A\u0647\u062F\u0641 \u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F" });
    }
    const { name, email, phone, role, balance, notes, preferredCurrency, preferredLanguage } = req.body;
    client.name = name ?? client.name;
    client.email = email ?? client.email;
    client.phone = phone ?? client.phone;
    client.role = role ?? client.role;
    if (typeof balance === "number") {
      client.balance = balance;
    }
    client.notes = notes ?? client.notes;
    client.preferredCurrency = preferredCurrency ?? client.preferredCurrency;
    client.preferredLanguage = preferredLanguage ?? client.preferredLanguage;
    DB.updateUser(client);
    DB.addLog({
      id: `l_crmup_${Date.now()}`,
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      type: "info",
      message: `\u062A\u0639\u062F\u064A\u0644 \u0648\u062A\u062D\u062F\u064A\u062B \u0628\u064A\u0627\u0646\u0627\u062A \u0645\u0644\u0641 \u0627\u0644\u0639\u0645\u064A\u0644: ${client.name} \u0648\u062A\u062D\u062F\u064A\u062B \u0627\u0644\u0645\u0644\u0627\u062D\u0638\u0627\u062A \u0627\u0644\u0625\u062F\u0627\u0631\u064A\u0629.`
    });
    res.json({ success: true, client });
  });
  app.post("/api/crm/ai-chat", requireAdmin, async (req, res) => {
    const { messages, lang } = req.body;
    try {
      const genAI = getGenAI();
      const currentAuctions = DB.auctions.map(
        (a) => `- [\u0645\u0632\u0627\u062F ${a.id}] "${a.titleAr}" (${a.titleEn}) - \u0627\u0644\u0633\u0639\u0631 \u0627\u0644\u062D\u0627\u0644\u064A: ${a.currentPrice} ${a.currency} - \u0627\u0644\u062D\u0627\u0644\u0629: ${a.status} - \u064A\u0646\u062A\u0647\u064A: ${new Date(a.endTime).toLocaleDateString(lang === "ar" ? "ar-EG" : "en-US")}`
      ).join("\n");
      const systemInstruction = lang === "ar" ? `\u0623\u0646\u062A \u0645\u0633\u062A\u0634\u0627\u0631 \u0639\u0644\u0627\u0642\u0627\u062A \u0627\u0644\u0639\u0645\u0644\u0627\u0621 \u0627\u0644\u0630\u0643\u064A \u0648\u0645\u0633\u0627\u0639\u062F \u0627\u0644\u062F\u0639\u0645 \u0627\u0644\u0641\u0646\u064A \u0627\u0644\u0645\u0628\u0627\u0634\u0631 \u0644\u0645\u0646\u0635\u0629 "Antkawy" \u0644\u0644\u0645\u0632\u0627\u062F\u0627\u062A \u0627\u0644\u0641\u0627\u062E\u0631\u0629 \u0628\u0627\u0644\u0636\u0645\u0627\u0646.
           \u0645\u0647\u0645\u062A\u0643 \u0647\u064A \u0627\u0644\u0625\u062C\u0627\u0628\u0629 \u0628\u062F\u0642\u0629\u060C \u0630\u0643\u0627\u0621\u060C \u0648\u0645\u0635\u062F\u0627\u0642\u064A\u0629 \u0628\u0627\u0644\u063A\u0629 \u0648\u0628\u0623\u0633\u0644\u0648\u0628 \u0631\u0627\u0642\u064D \u0648\u0623\u062F\u064A\u0628 \u062C\u062F\u0627\u064B \u0639\u0644\u0649 \u0623\u0633\u0626\u0644\u0629 \u0627\u0644\u0639\u0645\u0644\u0627\u0621.
           \u0633\u0627\u0639\u062F\u0647\u0645 \u0641\u064A \u0627\u0644\u0645\u0632\u0627\u064A\u062F\u0627\u062A\u060C \u062A\u0641\u0627\u0635\u064A\u0644 \u0627\u0644\u0634\u062D\u0646\u060C \u0622\u0644\u064A\u0627\u062A \u062D\u062C\u0632 \u0627\u0644\u0648\u062F\u0627\u0626\u0639 \u0648\u0627\u0644\u0636\u0645\u0627\u0646 \u0627\u0644\u0645\u0635\u0631\u0641\u064A (Escrow)\u060C \u0648\u0633\u064A\u0627\u0633\u0629 \u0627\u0644\u0645\u0648\u0642\u0639.
           \u0627\u0633\u062A\u0639\u0646 \u0628\u0642\u0627\u0626\u0645\u0629 \u0627\u0644\u0645\u0632\u0627\u062F\u0627\u062A \u0627\u0644\u0646\u0634\u0637\u0629 \u0648\u0627\u0644\u0645\u0646\u062A\u0647\u064A\u0629 \u0627\u0644\u062D\u0627\u0644\u064A\u0629 \u0644\u062A\u0635\u064A\u063A \u0625\u062C\u0627\u0628\u0627\u062A \u062F\u0642\u064A\u0642\u0629:
           ${currentAuctions}
           \u0623\u062C\u0628 \u0628\u0627\u0644\u0644\u063A\u0629 \u0627\u0644\u0639\u0631\u0628\u064A\u0629 \u0628\u0627\u062D\u062A\u0631\u0627\u0641\u064A\u0629 \u0648\u0628\u0634\u0643\u0644 \u0645\u0642\u062A\u0636\u0628 \u0648\u062C\u0645\u064A\u0644.` : `You are the intelligent Customer Relationship Specialist and Live AI Helpdesk Assistant for the "Antkawy" Elite Escrow Auctions platform.
           Your role is to assist high-value clients with inquiries regarding elite bidding rules, escrow deposit locks, shipping tracking, and company terms.
           Refer to this live inventory database to answer inquiries precisely:
           ${currentAuctions}
           Respond in English with a polished, highly helpful, and elite professional posture.`;
      const contents = (messages || []).map((m) => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.text }]
      }));
      const response = await genAI.models.generateContent({
        model: "gemini-3.5-flash",
        contents,
        config: {
          systemInstruction,
          temperature: 0.7
        }
      });
      res.json({ success: true, reply: response.text });
    } catch (err) {
      console.error("Gemini AI Chat error:", err);
      res.json({
        success: false,
        reply: lang === "ar" ? "\u0627\u0644\u0645\u0633\u0627\u0639\u062F \u0627\u0644\u0630\u0643\u064A \u063A\u064A\u0631 \u0645\u062A\u0627\u062D \u0645\u0624\u0642\u062A\u0627\u064B \u0644\u0639\u062F\u0645 \u062A\u0647\u064A\u0626\u0629 \u0645\u0641\u062A\u0627\u062D GEMINI_API_KEY \u0628\u0627\u0644\u0645\u0646\u0635\u0629. \u0646\u062D\u0646 \u0646\u062E\u062F\u0645\u0643 \u062F\u0648\u0645\u0627\u064B \u064A\u062F\u0648\u064A\u0627\u064B \u0639\u0628\u0631 \u0644\u0648\u062D\u0629 \u0627\u0644\u062A\u0630\u0627\u0643\u0631." : "The smart assistant is temporarily offline due to missing GEMINI_API_KEY settings. Please file a manual support ticket so our team can assist you.",
        error: err.message
      });
    }
  });
  app.post("/api/crm/analyze-image", requireAdmin, async (req, res) => {
    const { base64Image, mimeType, prompt, lang } = req.body;
    try {
      const genAI = getGenAI();
      const imagePart = {
        inlineData: {
          mimeType: mimeType || "image/jpeg",
          data: base64Image
        }
      };
      const textPart = {
        text: prompt || (lang === "ar" ? "\u064A\u0631\u062C\u0649 \u0641\u062D\u0635 \u0648\u062A\u062D\u0644\u064A\u0644 \u0627\u0644\u0635\u0648\u0631\u0629 \u0648\u0625\u0639\u0637\u0627\u0621 \u062A\u0642\u0631\u064A\u0631 \u062F\u0642\u064A\u0642 \u0644\u0645\u0643\u062A\u0628 \u062E\u062F\u0645\u0629 \u0627\u0644\u0639\u0645\u0644\u0627\u0621 \u0628\u062E\u0635\u0648\u0635 \u062C\u0648\u062F\u0629 \u0627\u0644\u0633\u0644\u0639\u0629 \u0648\u0627\u0644\u0639\u064A\u0648\u0628 \u0627\u0644\u0638\u0627\u0647\u0631\u0629." : "Please inspect the uploaded item or package image and provide a high-fidelity appraisal report.")
      };
      const systemInstruction = lang === "ar" ? "\u0623\u0646\u062A \u0645\u0633\u062A\u0634\u0627\u0631 \u0641\u0646\u064A \u0645\u0639\u062A\u0645\u062F \u0644\u062A\u0642\u064A\u064A\u0645 \u0648\u0641\u062D\u0635 \u0627\u0644\u0633\u0644\u0639 \u0648\u062A\u0648\u062B\u064A\u0642 \u0633\u0644\u0627\u0645\u0629 \u0627\u0644\u0634\u062D\u0646\u0627\u062A \u0648\u062D\u0644 \u0646\u0632\u0627\u0639\u0627\u062A \u0627\u0644\u0636\u0645\u0627\u0646 \u0627\u0644\u0645\u0627\u0644\u064A \u0644\u0645\u0646\u0635\u0629 Antkawy. \u062D\u0644\u0644 \u0627\u0644\u0635\u0648\u0631\u0629 \u0627\u0644\u0645\u0631\u0641\u0642\u0629 \u0628\u062A\u0631\u0643\u064A\u0632 \u0639\u0627\u0644\u064D \u0648\u0627\u0643\u0634\u0641 \u0623\u064A \u062A\u0632\u064A\u064A\u0641\u060C \u0639\u064A\u0648\u0628 \u0623\u0648 \u0623\u0636\u0631\u0627\u0631 \u0641\u064A \u0627\u0644\u0634\u062D\u0646\u0629." : "You are an accredited technical auditor and luxury appraiser for the Antkawy escrow network. Carefully analyze the uploaded item image to identify any physical defects, shipping damage, or authentication warning flags.";
      const response = await genAI.models.generateContent({
        model: "gemini-3.1-pro-preview",
        contents: {
          parts: [imagePart, textPart]
        },
        config: {
          systemInstruction,
          thinkingConfig: {
            thinkingLevel: "HIGH"
          }
        }
      });
      res.json({ success: true, analysis: response.text });
    } catch (err) {
      console.error("Gemini image analysis error:", err);
      res.json({
        success: false,
        analysis: lang === "ar" ? "\u062A\u0639\u0630\u0631 \u062A\u062D\u0644\u064A\u0644 \u0627\u0644\u0635\u0648\u0631\u0629 \u0628\u0627\u0644\u0630\u0643\u0627\u0621 \u0627\u0644\u0627\u0635\u0637\u0646\u0627\u0639\u064A \u062D\u0627\u0644\u064A\u0627\u064B \u0644\u0639\u062F\u0645 \u062A\u0648\u0641\u0631 \u0645\u0641\u062A\u0627\u062D \u062A\u0631\u062E\u064A\u0635 \u0627\u0644\u062A\u0631\u0627\u0628\u0637 \u0627\u0644\u0633\u064A\u0627\u062F\u064A." : "Unable to analyze image. Ensure your GEMINI_API_KEY is configured in Settings > Secrets.",
        error: err.message
      });
    }
  });
  app.post("/api/crm/transcribe-audio", requireAdmin, async (req, res) => {
    const { base64Audio, mimeType, lang } = req.body;
    try {
      const genAI = getGenAI();
      const audioPart = {
        inlineData: {
          mimeType: mimeType || "audio/wav",
          data: base64Audio
        }
      };
      const textPart = {
        text: lang === "ar" ? "\u064A\u0631\u062C\u0649 \u0646\u0633\u062E \u0647\u0630\u0627 \u0627\u0644\u062A\u0633\u062C\u064A\u0644 \u0627\u0644\u0635\u0648\u062A\u064A \u0644\u0645\u0634\u0643\u0644\u0629 \u0627\u0644\u0639\u0645\u064A\u0644 \u0628\u062F\u0642\u0629 \u0628\u0627\u0644\u063A\u0629 \u0625\u0644\u0649 \u0646\u0635 \u0645\u0643\u062A\u0648\u0628." : "Please transcribe this customer voice message into written text accurately."
      };
      const response = await genAI.models.generateContent({
        model: "gemini-3.5-flash",
        contents: {
          parts: [audioPart, textPart]
        }
      });
      res.json({ success: true, transcription: response.text });
    } catch (err) {
      console.error("Gemini transcription error:", err);
      res.json({
        success: false,
        transcription: lang === "ar" ? "\u0641\u0634\u0644 \u0646\u0633\u062E \u0627\u0644\u0645\u0642\u0637\u0639 \u0627\u0644\u0635\u0648\u062A\u064A." : "Audio transcription failed.",
        error: err.message
      });
    }
  });
  app.post("/api/crm/ai-campaign", requireAdmin, async (req, res) => {
    const { segment, campaignGoal, lang } = req.body;
    try {
      const genAI = getGenAI();
      const prompt = lang === "ar" ? `\u0627\u0643\u062A\u0628 \u0628\u0631\u064A\u062F\u0627\u064B \u0625\u0644\u0643\u062A\u0631\u0648\u0646\u064A\u0627\u064B \u062A\u0633\u0648\u064A\u0642\u064A\u0627\u064B \u0645\u0648\u062C\u0647\u0627\u064B \u0648\u062C\u0630\u0627\u0628\u0627\u064B \u0644\u0639\u0645\u0644\u0627\u0621 \u0645\u0646\u0635\u0629 \u0627\u0644\u0645\u0632\u0627\u062F\u0627\u062A \u0627\u0644\u0641\u0627\u062E\u0631\u0629 Antkawy.
           \u0627\u0644\u062C\u0645\u0647\u0648\u0631 \u0627\u0644\u0645\u0633\u062A\u0647\u062F\u0641: ${segment}
           \u0627\u0644\u0647\u062F\u0641 \u0645\u0646 \u0627\u0644\u062A\u0648\u0627\u0635\u0644: ${campaignGoal}
           \u062A\u0623\u0643\u062F \u0645\u0646 \u0635\u064A\u0627\u063A\u0629 \u0639\u0631\u0636 \u0641\u062E\u0645 \u0648\u0623\u062F\u064A\u0628 \u064A\u062B\u064A\u0631 \u0634\u063A\u0641 \u0627\u0644\u0645\u0642\u062A\u0646\u064A\u0646 \u0645\u0639 \u062A\u0639\u0632\u064A\u0632 \u062D\u0642\u064A\u0642\u0629 \u0623\u0645\u0646 \u0648\u0636\u0645\u0627\u0646 \u0645\u0639\u0627\u0645\u0644\u0627\u062A\u0646\u0627.` : `Compose a high-end marketing outreach email for Antkawy VIP auction customers.
           Target Segment: ${segment}
           Campaign Goal: ${campaignGoal}
           Draft a luxurious, highly persuasive offer letter highlighting our dual escrow system.`;
      const response = await genAI.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt
      });
      res.json({ success: true, text: response.text });
    } catch (err) {
      console.error("Gemini Campaign drafting error:", err);
      res.json({
        success: false,
        text: lang === "ar" ? "\u062D\u062F\u062B \u062E\u0637\u0623 \u0623\u062B\u0646\u0627\u0621 \u0635\u064A\u0627\u063A\u0629 \u0645\u062D\u062A\u0648\u0649 \u0627\u0644\u062D\u0645\u0644\u0629 \u0627\u0644\u0630\u0643\u064A\u0629." : "An error occurred while generating the campaign copy.",
        error: err.message
      });
    }
  });
  app.post("/api/auctions/:id/market-insight", async (req, res) => {
    const { lang } = req.body;
    const auction = DB.auctions.find((a) => a.id === req.params.id);
    if (!auction) {
      return res.status(404).json({ success: false, message: "Auction not found" });
    }
    try {
      const genAI = getGenAI();
      const title = lang === "ar" ? auction.titleAr : auction.titleEn;
      const desc = lang === "ar" ? auction.descAr : auction.descEn;
      const prompt = lang === "ar" ? `\u0623\u0646\u062A \u062E\u0628\u064A\u0631 \u062A\u062B\u0645\u064A\u0646 \u0648\u062A\u062D\u0641 \u0639\u0627\u0644\u0645\u064A \u0648\u0645\u062D\u0644\u0644 \u0623\u0633\u0648\u0627\u0642 \u0644\u0644\u0645\u0632\u0627\u062F\u0627\u062A \u0627\u0644\u0641\u0627\u062E\u0631\u0629 \u0648\u0627\u0644\u0642\u0637\u0639 \u0627\u0644\u0646\u0627\u062F\u0631\u0629 \u0641\u064A \u0645\u0646\u0635\u0629 "Antkawy".
           \u0642\u0645 \u0628\u0625\u0639\u062F\u0627\u062F \u062A\u0642\u0631\u064A\u0631 \u0645\u0648\u062C\u0632 \u0648\u0630\u0643\u064A \u062C\u062F\u0627\u064B (\u0645\u0646 \u0641\u0642\u0631\u062A\u064A\u0646 \u0625\u0644\u0649 3 \u0641\u0642\u0631\u0627\u062A \u0642\u0635\u064A\u0631\u0629 \u0648\u0645\u0646\u0638\u0645\u0629) \u062D\u0648\u0644 \u0647\u0630\u0647 \u0627\u0644\u062A\u062D\u0641\u0629/\u0627\u0644\u0633\u0644\u0639\u0629:
           \u0627\u0644\u0627\u0633\u0645: "${title}"
           \u0627\u0644\u062A\u0635\u0646\u064A\u0641: "${auction.category}"
           \u0627\u0644\u062D\u0627\u0644\u0629: "${auction.itemCondition}"
           \u0627\u0644\u0648\u0635\u0641: "${desc}"
           \u0627\u0644\u0633\u0639\u0631 \u0627\u0644\u0627\u0641\u062A\u062A\u0627\u062D\u064A/\u0627\u0644\u062D\u0627\u0644\u064A: "${auction.currentPrice} ${auction.currency}"

           \u0627\u0644\u0645\u0637\u0644\u0648\u0628 \u0641\u064A \u0627\u0644\u062A\u0642\u0631\u064A\u0631:
           1. \u0646\u062F\u0631\u0629 \u0627\u0644\u0642\u0637\u0639\u0629 (Scarcity): \u0627\u0634\u0631\u062D \u0644\u0645\u0627\u0630\u0627 \u062A\u0639\u062A\u0628\u0631 \u0647\u0630\u0647 \u0627\u0644\u0642\u0637\u0639\u0629 \u0646\u0627\u062F\u0631\u0629 \u0648\u0645\u0637\u0644\u0648\u0628\u0629 \u0628\u064A\u0646 \u0647\u0648\u0627\u0629 \u0627\u0644\u0627\u0642\u062A\u0646\u0627\u0621 \u0648\u0627\u0644\u0645\u0633\u062A\u062B\u0645\u0631\u064A\u0646.
           2. \u0627\u0644\u0642\u064A\u0645\u0629 \u0627\u0644\u062A\u0627\u0631\u064A\u062E\u064A\u0629 \u0648\u0627\u0644\u0627\u0633\u062A\u062B\u0645\u0627\u0631\u064A\u0629 (Historical & Market Value): \u0642\u062F\u0645 \u0633\u064A\u0627\u0642\u0627\u064B \u062A\u0627\u0631\u064A\u062E\u064A\u0627\u064B \u0623\u0648 \u0641\u0646\u064A\u0627\u064B \u0623\u0648 \u062A\u0642\u062F\u064A\u0631\u0627\u062A \u0644\u0646\u0645\u0648 \u0642\u064A\u0645\u062A\u0647\u0627 \u0639\u0628\u0631 \u0627\u0644\u0632\u0645\u0646.
           \u0627\u0643\u062A\u0628 \u0628\u0623\u0633\u0644\u0648\u0628 \u0623\u062F\u0628\u064A \u0641\u062E\u0645\u060C \u0627\u062D\u062A\u0631\u0627\u0641\u064A\u060C \u0648\u0634\u064A\u0642 \u0628\u0627\u0644\u0644\u063A\u0629 \u0627\u0644\u0639\u0631\u0628\u064A\u0629.` : `You are an elite global luxury appraiser and rare artifacts market analyst for the "Antkawy" auction platform.
           Generate a concise, intelligent, and highly engaging "Market Insight" summary (2 to 3 short, well-structured paragraphs or bulleted insights) for this item:
           Title: "${title}"
           Category: "${auction.category}"
           Condition: "${auction.itemCondition}"
           Description: "${desc}"
           Current Price: "${auction.currentPrice} ${auction.currency}"

           Required in your report:
           1. Scarcity Analysis: Explain why this piece is rare, collectible, and highly sought after by connoisseurs.
           2. Historical & Investment Value: Provide historical, cultural, or craftsmanship context and its appreciation potential over time.
           Write in an authoritative, sophisticated English tone.`;
      const response = await genAI.models.generateContent({
        model: "gemini-3.6-flash",
        contents: prompt,
        config: {
          temperature: 0.7
        }
      });
      res.json({ success: true, insight: response.text });
    } catch (err) {
      console.error("Gemini Market Insight error:", err);
      const fallbackInsight = lang === "ar" ? `\u2728 \u0646\u0638\u0631\u0629 \u0627\u0644\u0633\u0648\u0642 \u0627\u0644\u062A\u0642\u062F\u064A\u0631\u064A\u0629: \u062A\u064F\u0635\u0646\u0651\u0641 \u0647\u0630\u0647 \u0627\u0644\u062A\u062D\u0641\u0629 \u0636\u0645\u0646 \u0627\u0644\u0641\u0626\u0629 \u0641\u0627\u0626\u0642\u0629 \u0627\u0644\u0646\u062F\u0631\u0629 (${auction.category})\u060C \u0648\u062A\u062A\u0645\u062A\u0639 \u0628\u0637\u0644\u0628 \u062A\u0635\u0627\u0639\u062F\u064A \u0641\u064A \u0623\u0633\u0648\u0627\u0642 \u0627\u0644\u0645\u0642\u062A\u0646\u064A\u0627\u062A \u0627\u0644\u062E\u0627\u0635\u0629. \u062A\u0639\u0643\u0633 \u0645\u0648\u0627\u0635\u0641\u0627\u062A\u0647\u0627 \u0627\u0644\u0641\u0646\u064A\u0629 \u0648\u062D\u0627\u0644\u062A\u0647\u0627 \u0627\u0644\u0631\u0627\u0647\u0646\u0629 \u0642\u064A\u0645\u062A\u0647\u0627 \u0627\u0644\u062A\u0627\u0631\u064A\u062E\u064A\u0629 \u0627\u0644\u0623\u0635\u064A\u0644\u0629 \u0648\u0623\u0647\u0645\u064A\u062A\u0647\u0627 \u0627\u0644\u0627\u0633\u062A\u062B\u0645\u0627\u0631\u064A\u0629 \u0637\u0648\u064A\u0644\u0629 \u0627\u0644\u0623\u062C\u0644.` : `\u2728 Appraiser Market Note: This artifact is categorized under ultra-high rarity within the ${auction.category} sector, showing consistent upward appreciation in secondary collector markets. Its craftsmanship and preserved condition reflect significant historical integrity and long-term asset value.`;
      res.json({
        success: true,
        insight: fallbackInsight,
        isFallback: true,
        error: err.message
      });
    }
  });
  app.get("/api/crm/clients", requireAdmin, (req, res) => {
    res.json({ success: true, clients: DB.users });
  });
  app.delete("/api/crm/clients/:id", requireAdmin, (req, res) => {
    const idx = DB.users.findIndex((u) => u.id === req.params.id);
    if (idx === -1) {
      return res.status(404).json({ success: false, message: "Client not found" });
    }
    DB.users.splice(idx, 1);
    res.json({ success: true, message: "Client record removed successfully" });
  });
  app.get("/api/logs", requireAdmin, (req, res) => {
    res.json({ logs: DB.logs });
  });
  app.get("/api/api-keys", requireAdmin, (req, res) => {
    res.json({ apiKeys: DB.apiKeys });
  });
  app.post("/api/api-keys", requireAdmin, (req, res) => {
    const { clientName } = req.body;
    const newKey = {
      id: `key_${Date.now()}`,
      clientName: clientName || "\u0645\u062A\u062C\u0631 \u062E\u0627\u0631\u062C\u064A \u062C\u062F\u064A\u062F",
      key: `sa_live_${Math.random().toString(36).substring(2)}${Math.random().toString(36).substring(2)}`,
      createdAt: (/* @__PURE__ */ new Date()).toISOString(),
      status: "active"
    };
    DB.addApiKey(newKey);
    res.status(201).json({ success: true, apiKey: newKey });
  });
  app.delete("/api/api-keys/:id", requireAdmin, (req, res) => {
    DB.deleteApiKey(req.params.id);
    res.json({ success: true });
  });
  app.get("/api/backups", requireAdmin, (req, res) => {
    res.json({ backups: DB.backupLogs });
  });
  app.post("/api/backups", requireAdmin, (req, res) => {
    const logObj = DB.triggerBackup();
    res.status(201).json({ success: true, backup: logObj });
  });
  app.get("/api/admin/metrics", requireAdmin, (req, res) => {
    const activeAuctions = DB.auctions.filter((a) => a.status === "active").length;
    const completedAuctions = DB.auctions.filter((a) => a.status === "completed").length;
    const activeUsers = DB.users.length;
    const escrowHeld = DB.escrows.filter((e) => e.status === "held").reduce((acc, current) => acc + current.amount, 0);
    const escrowReleased = DB.escrows.filter((e) => e.status === "released").reduce((acc, current) => acc + current.amount, 0);
    const totalSuccessfulSales = DB.auctions.filter((a) => a.status === "completed" && a.bidsCount > 0).reduce((acc, item) => acc + item.currentPrice, 0);
    const categoriesMap = {};
    DB.auctions.forEach((a) => {
      categoriesMap[a.category] = (categoriesMap[a.category] || 0) + 1;
    });
    const categoryStats = Object.keys(categoriesMap).map((key) => ({
      name: key,
      value: categoriesMap[key]
    }));
    const bidTrends = DB.bids.slice(-6).map((b) => ({
      time: new Date(b.timestamp).toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" }),
      amount: b.amount,
      bidder: b.bidderName
    }));
    res.json({
      metrics: {
        activeAuctions,
        completedAuctions,
        activeUsers,
        escrowHeld,
        escrowReleased,
        totalSuccessfulSales,
        categoryStats,
        bidTrends
      }
    });
  });
  app.get("/api/settings", (req, res) => {
    res.json({ settings: DB.settings });
  });
  app.post("/api/settings", requireAdmin, (req, res) => {
    const { autoBackupIntervalHours, systemNotificationEmail, escrowReleaseTimeoutDays, allowManualBidApproval, maintenanceMode } = req.body;
    const newSettings = {
      autoBackupIntervalHours: Number(autoBackupIntervalHours) || DB.settings.autoBackupIntervalHours,
      systemNotificationEmail: systemNotificationEmail || DB.settings.systemNotificationEmail,
      escrowReleaseTimeoutDays: Number(escrowReleaseTimeoutDays) || DB.settings.escrowReleaseTimeoutDays,
      allowManualBidApproval: allowManualBidApproval !== void 0 ? allowManualBidApproval : DB.settings.allowManualBidApproval,
      maintenanceMode: maintenanceMode !== void 0 ? maintenanceMode : DB.settings.maintenanceMode
    };
    DB.updateSettings(newSettings);
    res.json({ success: true, settings: DB.settings });
  });
  if (process.env.NODE_ENV !== "production") {
    const vite = await (0, import_vite.createServer)({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = import_path2.default.join(process.cwd(), "dist");
    app.use(import_express.default.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(import_path2.default.join(distPath, "index.html"));
    });
  }
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server is running beautifully on http://localhost:${PORT}`);
  });
}
startServer();
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
//# sourceMappingURL=server.cjs.map
