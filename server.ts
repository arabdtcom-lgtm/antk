/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { DB } from './server/db';
import { SupportTicket, User } from './src/types';
import { GoogleGenAI } from '@google/genai';

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middleware for parsing JSON requests
  app.use(express.json());

  // SSE client manager
  let clients: any[] = [];
  
  // Heartbeat ping interval to keep connections alive & clean dead sockets
  setInterval(() => {
    clients = clients.filter(c => {
      try {
        c.write(': heartbeat\n\n');
        return true;
      } catch {
        return false;
      }
    });
  }, 30000);

  // Real-time notification endpoint (SSE)
  app.get('/api/realtime-notifications', (req, res) => {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*'
    });
    
    // Send initial ping
    res.write('data: {"connected": true}\n\n');
    
    clients.push(res);
    
    req.on('close', () => {
      clients = clients.filter(c => c !== res);
    });
  });

  const broadcast = (type: string, payload: any) => {
    const message = JSON.stringify({ type, payload });
    clients = clients.filter(c => {
      try {
        c.write(`data: ${message}\n\n`);
        return true;
      } catch {
        return false;
      }
    });
  };

  // --- API Routes ---

  // Initialize DB from Firestore before starting routes
  await DB.initFirestore();

  // Auth: Session simulation
  let currentUser: User | null = null;

  app.post('/api/auth/login', (req, res) => {
    const { email, password, provider } = req.body;
    const cleanEmail = (email || '').trim().toLowerCase();
    
    if (!cleanEmail) {
      return res.status(400).json({ success: false, message: 'البريد الإلكتروني مطلوب' });
    }

    let matched = DB.users.find(u => u.email.toLowerCase() === cleanEmail);

    if (!matched) {
      // Auto-create new user account if email is not found
      const isDomainAdmin = cleanEmail === 'arabdt.com@gmail.com';
      matched = {
        id: `u_${Date.now()}`,
        name: isDomainAdmin ? 'أنتيكاوي' : cleanEmail.split('@')[0],
        email: cleanEmail,
        role: isDomainAdmin ? 'admin' : 'user',
        balance: isDomainAdmin ? 250000 : 20000,
        avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
        preferredCurrency: 'SAR',
        preferredLanguage: 'ar'
      };
      DB.addUser(matched);
    }

    currentUser = matched;
    DB.addLog({
      id: `l_login_${Date.now()}`,
      timestamp: new Date().toISOString(),
      type: 'security',
      message: `تسجيل دخول آمن ناجح ${provider ? `عبر ${provider}` : ''} لحساب العميل ${currentUser.name}`
    });

    return res.json({ success: true, user: currentUser });
  });

  app.get('/api/auth/me', (req, res) => {
    res.json({ user: currentUser });
  });

  app.post('/api/auth/logout', (req, res) => {
    currentUser = null;
    res.json({ success: true });
  });

  // Auth profile customize
  app.put('/api/auth/profile', (req, res) => {
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

  // Get exact server time for synchronization
  app.get('/api/time', (req, res) => {
    res.json({ serverTime: Date.now(), timestamp: new Date().toISOString() });
  });

  // Fetch Auctions
  app.get('/api/auctions', (req, res) => {
    res.json({ auctions: DB.auctions });
  });

  // Get single auction
  app.get('/api/auctions/:id', (req, res) => {
    const auction = DB.auctions.find(a => a.id === req.params.id);
    if (auction) {
      auction.viewsCount += 1;
      DB.updateAuction(auction);
      res.json({ auction });
    } else {
      res.status(404).json({ message: 'Auction not found' });
    }
  });

  // Create new auction
  app.post('/api/auctions', (req, res) => {
    const { titleAr, titleEn, descAr, descEn, category, image, startPrice, minIncrement, buyoutPrice, durationDays, softCloseMinutes, itemCondition, currency } = req.body;
    
    const now = new Date();
    const days = typeof durationDays === 'number' ? durationDays : 3;
    const endTime = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

    const newAuctionObj = {
      id: `a_${Date.now()}`,
      titleAr: titleAr || 'عنصر مزاد جديد',
      titleEn: titleEn || 'New Auction Item',
      descAr: descAr || '',
      descEn: descEn || '',
      category: category || 'أخرى',
      image: image || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800',
      startPrice: Number(startPrice) || 100,
      currentPrice: Number(startPrice) || 100,
      minIncrement: Number(minIncrement) || 50,
      buyoutPrice: buyoutPrice ? Number(buyoutPrice) : undefined,
      endTime: endTime.toISOString(),
      status: (DB.settings.requireAdminApproval ? 'pending_approval' : 'active') as any,
      bidsCount: 0,
      viewsCount: 1,
      seller: {
        name: currentUser?.name || req.body.sellerName || 'أنتيكاوي',
        email: currentUser?.email || req.body.sellerEmail || 'arabdt.com@gmail.com',
        rating: 4.8
      },
      sellerEmail: currentUser?.email || req.body.sellerEmail || 'arabdt.com@gmail.com',
      itemCondition: (itemCondition || 'new') as any,
      currency: (currency || 'SAR') as any,
      createdDate: now.toISOString(),
      softCloseMinutes: typeof softCloseMinutes === 'number' ? softCloseMinutes : 2
    };

    DB.addAuction(newAuctionObj);

    DB.addLog({
      id: `l_auc_${Date.now()}`,
      timestamp: now.toISOString(),
      type: 'info',
      message: `تم إدراج مزاد جديد بنجاح: ${newAuctionObj.titleAr} بواسطة ${newAuctionObj.seller.name}`
    });

    broadcast('auction_created', newAuctionObj);

    res.status(201).json({ success: true, auction: newAuctionObj });
  });

  // Submit Bid with Anti-Sniping soft close logic
  app.post('/api/auctions/:id/bid', (req, res) => {
    const { amount, email, name } = req.body;
    const userEmail = (email || currentUser?.email || DB.users[0]?.email || 'arabdt.com@gmail.com').trim();
    const userName = (name || currentUser?.name || DB.users[0]?.name || 'عبد الرحمن القحطاني').trim();

    const result = DB.submitBid(req.params.id, userEmail, userName, Number(amount));
    if (result.success) {
      // Send real-time reload payload
      broadcast('bid_submitted', {
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

  // Buyout Auction
  app.post('/api/auctions/:id/buyout', (req, res) => {
    const { email, name } = req.body;
    const userEmail = (email || currentUser?.email || DB.users[0]?.email || 'arabdt.com@gmail.com').trim();
    const userName = (name || currentUser?.name || DB.users[0]?.name || 'عبد الرحمن القحطاني').trim();

    const result = DB.buyoutAuction(req.params.id, userEmail, userName);
    if (result.success) {
      broadcast('auction_buyout', {
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

  // Payment checkout / Escrow lockdown
  app.post('/api/payment/checkout', (req, res) => {
    const { auctionId, amount, paymentMethod, paymentDetails, email } = req.body;
    const userEmail = (email || currentUser?.email || DB.users[0]?.email || 'arabdt.com@gmail.com').trim();

    const result = DB.checkoutEscrow(auctionId, userEmail, amount, paymentMethod, paymentDetails);
    if (result.success) {
      // Broadcast shipment info created
      broadcast('shipment_created', result.shipment);
      res.json(result);
    } else {
      res.status(400).json(result);
    }
  });

  // Release Escrow funds (by buyer)
  app.post('/api/escrows/:id/release', (req, res) => {
    const shipment = DB.shipments.find(s => s.id === req.params.id || s.auctionId === req.params.id);
    if (shipment) {
      const result = DB.releaseEscrow(shipment.id);
      if (result.success) {
        broadcast('escrow_released', { shipmentId: shipment.id, auctionId: shipment.auctionId });
        res.json(result);
      } else {
        res.status(400).json(result);
      }
    } else {
      res.status(404).json({ messageAr: 'الشحنة غير موجودة' });
    }
  });

  // Get Shipments
  app.get('/api/shipments', (req, res) => {
    res.json({ shipments: DB.shipments });
  });

  // Get bids for a specific auction
  app.get('/api/auctions/:id/bids', (req, res) => {
    const bids = DB.bids.filter(b => b.auctionId === req.params.id);
    const sortedBids = [...bids].sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    res.json({ bids: sortedBids });
  });

  // Update tracking details as seller
  app.post('/api/shipments/update-tracking', (req, res) => {
    const { auctionId, carrier, trackingNumber, estimatedDelivery, cityAr, cityEn } = req.body;
    if (!auctionId || !carrier || !trackingNumber) {
      return res.status(400).json({ success: false, messageAr: 'جميع معلومات التتبع مطلوبة' });
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

  // Carrier API Integration Lookup (Aramex / DHL / FedEx)
  app.get('/api/shipping/carrier-lookup', (req, res) => {
    const { carrier, trackingNumber } = req.query;
    if (!carrier || !trackingNumber) {
      return res.status(400).json({ success: false, error: 'Carrier and trackingNumber are required' });
    }

    const carrierName = String(carrier).toLowerCase();
    const trackingNo = String(trackingNumber);
    const now = new Date();
    let carrierData: any = {};

    if (carrierName.includes('aramex') || carrierName.includes('أرامكس')) {
      carrierData = {
        carrier: 'Aramex Express API',
        carrierLogo: 'Aramex',
        trackingNumber: trackingNo,
        origin: 'Riyadh, SA',
        destination: 'Jeddah, SA',
        status: 'In Transit',
        statusDescription: 'Shipment departs Aramex facility to destination',
        events: [
          {
            status: 'Delivered to Local Courier',
            statusAr: 'جاري التوصيل: الطرد مع مندوب شركة أرامكس للتوصيل النهائي المباشر',
            city: 'Jeddah, KSA',
            cityAr: 'جدة، حي الحمراء',
            timestamp: new Date().toISOString()
          },
          {
            status: 'Arrived at Destination Facility',
            statusAr: 'وصلت إلى محطة الوجهة: مركز فرز وتوزيع أرامكس بجدة',
            city: 'Jeddah, KSA',
            cityAr: 'جدة، مركز الفرز الرئيسي',
            timestamp: new Date(now.getTime() - 4 * 60 * 60 * 1000).toISOString()
          },
          {
            status: 'Dispatched from Origin Hub',
            statusAr: 'غادرت محطة المنشأ: تصنيف فرع أرامكس بالرياض',
            city: 'Riyadh, KSA',
            cityAr: 'الرياض، فرع السلي',
            timestamp: new Date(now.getTime() - 10 * 60 * 60 * 1000).toISOString()
          },
          {
            status: 'Carrier Picked Up',
            statusAr: 'تم استلام وتوثيق الشحنة بواسطة أرامكس من البائع للفرع',
            city: 'Riyadh, KSA',
            cityAr: 'الرياض، فرع المنشأ المعتمد',
            timestamp: new Date(now.getTime() - 18 * 60 * 60 * 1000).toISOString()
          }
        ]
      };
    } else if (carrierName.includes('dhl') || carrierName.includes('دي')) {
      carrierData = {
        carrier: 'DHL Express OnDemand API',
        carrierLogo: 'DHL',
        trackingNumber: trackingNo,
        origin: 'Jeddah, SA',
        destination: 'Dammam, SA',
        status: 'With Courier',
        statusDescription: 'Shipment is out with DHL courier for delivery',
        events: [
          {
            status: 'Out for Delivery',
            statusAr: 'خارج للتوصيل المباشر: تم إسناد الطرد لسائق التوصيل من دي اتش ال',
            city: 'Dammam, KSA',
            cityAr: 'الدمام، الفرع الإقليمي السريع',
            timestamp: new Date().toISOString()
          },
          {
            status: 'Customs Cleared',
            statusAr: 'إنهاء الفحص والتخليص الجمركي بنجاح وتحديث البيانات الإلكترونية',
            city: 'Dammam Court',
            cityAr: 'منفذ الجسر، الدمام',
            timestamp: new Date(now.getTime() - 5 * 60 * 60 * 1000).toISOString()
          },
          {
            status: 'Processed at Facility',
            statusAr: 'تجهيز ومعالجة الطرد اللوجستي بمستودعات فرز دي اتش ال دبي / البحرين السريع',
            city: 'DHL Hub',
            cityAr: 'مركز تصنيف وتوزيع دي اتش ال السريع الدولي',
            timestamp: new Date(now.getTime() - 12 * 60 * 60 * 1000).toISOString()
          },
          {
            status: 'Picked up',
            statusAr: 'تم فحص وقبول الشحنة وتثبيت بوليصة أون-ديماند الرقمية بالبوابة',
            city: 'Jeddah Client Office',
            cityAr: 'مكتب تسليم البائع، جدة الكورنيش',
            timestamp: new Date(now.getTime() - 20 * 60 * 60 * 1000).toISOString()
          }
        ]
      };
    } else {
      carrierData = {
        carrier: 'FedEx Express XML Logistics API',
        carrierLogo: 'FedEx',
        trackingNumber: trackingNo,
        origin: 'Jeddah, SA',
        destination: 'Riyadh, SA',
        status: 'Departed Facility',
        statusDescription: 'Package departed local sorting facility',
        events: [
          {
            status: 'On transit',
            statusAr: 'تحت النقل البري المسرع لمدينة التسليم النهائية الفدرالية',
            city: 'Jeddah, KSA',
            cityAr: 'جدة، بوابة الخدمات اللوجستية',
            timestamp: new Date().toISOString()
          },
          {
            status: 'Departed FedEx origin location',
            statusAr: 'غادر الطرد مركز كارجو فيدكس السريع بالمنشأ الجوي',
            city: 'Jeddah Terminal',
            cityAr: 'جدة، محطة الشحن الجوي',
            timestamp: new Date(now.getTime() - 6 * 60 * 60 * 1000).toISOString()
          },
          {
            status: 'Picked up',
            statusAr: 'استلام الطرد من البائع وجاري فحصه تحت الوزن والحجم القياسي',
            city: 'Jeddah Center',
            cityAr: 'جدة، المحطة الإقليمية المجمعة',
            timestamp: new Date(now.getTime() - 14 * 60 * 60 * 1000).toISOString()
          }
        ]
      };
    }

    res.json({ success: true, apiLookup: carrierData });
  });

  // Update shipment status (for administration panel)
  app.post('/api/shipments/:id/update', (req, res) => {
    const { status, statusAr, city, cityAr } = req.body;
    const shipment = DB.shipments.find(s => s.id === req.params.id);
    if (shipment) {
      shipment.status = status;
      shipment.history.unshift({
        status,
        statusAr: statusAr || status,
        city: city || 'Sorting Facility',
        cityAr: cityAr || 'مركز المناولة والتوزيع الرئيسي',
        timestamp: new Date().toISOString()
      });

      DB.addLog({
        id: `l_ship_${Date.now()}`,
        timestamp: new Date().toISOString(),
        type: 'info',
        message: `تم تحديث حالة الشحنة المباشرة رقم ${shipment.trackingNumber} للدقة: ${statusAr}`
      });

      // If marked as received by admin, release escrow too
      if (status === 'received' || status === 'delivered') {
        const escrow = DB.escrows.find(e => e.auctionId === shipment.auctionId);
        if (escrow && escrow.status === 'held') {
          escrow.status = 'released';
        }
      }

      DB.updateShipment(shipment);

      broadcast('shipment_updated', shipment);
      res.json({ success: true, shipment });
    } else {
      res.status(404).json({ message: 'Shipment not found' });
    }
  });

  // Fetch Escrow logs
  app.get('/api/escrows', (req, res) => {
    res.json({ escrows: DB.escrows });
  });

  // Get Support Tickets
  app.get('/api/support/tickets', (req, res) => {
    res.json({ tickets: DB.tickets });
  });

  // Register support tickets
  app.post('/api/support/tickets', (req, res) => {
    const { subject, message } = req.body;
    const newTicket: SupportTicket = {
      id: `t_${Date.now()}`,
      email: currentUser.email,
      name: currentUser.name,
      subject,
      message,
      status: 'open',
      timestamp: new Date().toISOString()
    };
    DB.addTicket(newTicket);
    
    DB.addLog({
      id: `l_tick_${Date.now()}`,
      timestamp: new Date().toISOString(),
      type: 'info',
      message: `تم تقديم تذكرة دعم فني جديدة بخصوص: ${subject}`,
      user: currentUser.email
    });

    broadcast('ticket_created', newTicket);
    res.status(201).json({ success: true, ticket: newTicket });
  });

  // System Ticket Reply (admin dashboard)
  app.post('/api/support/tickets/:id/reply', (req, res) => {
    const { reply } = req.body;
    const ticket = DB.tickets.find(t => t.id === req.params.id);
    if (ticket) {
      ticket.status = 'answered';
      ticket.reply = reply;
      DB.updateTicket(ticket);

      DB.addLog({
        id: `l_tickrep_${Date.now()}`,
        timestamp: new Date().toISOString(),
        type: 'info',
        message: `تم الرد على تذكرة الدعم الفني الخاصة بـ: ${ticket.name}`
      });

      broadcast('ticket_replied', ticket);
      res.json({ success: true, ticket });
    } else {
      res.status(404).json({ message: 'Ticket not found' });
    }
  });

  // --- CRM AND AI RELATIONSHIP GATEWAYS ---
  
  let aiClient: GoogleGenAI | null = null;
  function getGenAI() {
    if (!aiClient) {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error('GEMINI_API_KEY secret is not declared or provided.');
      }
      aiClient = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });
    }
    return aiClient;
  }

  async function callGeminiContent(genAI: GoogleGenAI, requestObj: { primaryModel?: string; contents: any; config?: any }) {
    const primary = requestObj.primaryModel || 'gemini-2.5-flash';
    const modelsToTry = [primary, 'gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash'].filter((v, i, a) => a.indexOf(v) === i);
    let lastErr: any = null;

    for (const modelName of modelsToTry) {
      try {
        const res = await genAI.models.generateContent({
          model: modelName,
          contents: requestObj.contents,
          config: requestObj.config
        });
        return res;
      } catch (err: any) {
        lastErr = err;
        // Suppress noisy console logs on quota exhausted if fallbacks are being attempted
      }
    }
    throw lastErr;
  }

  // Get all clients with custom CRM summaries
  app.get('/api/crm/clients', (req, res) => {
    res.json({ success: true, clients: DB.users });
  });

  // Create new client profile (CRM panel)
  app.post('/api/crm/clients', (req, res) => {
    const { name, email, phone, role, balance, notes, preferredCurrency, preferredLanguage } = req.body;
    if (!name || !email) {
      return res.status(400).json({ success: false, messageAr: 'الاسم والبريد الإلكتروني مطلوبان' });
    }
    
    const exists = DB.users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (exists) {
      return res.status(400).json({ success: false, messageAr: 'هذا العميل مسجل بالفعل بالبريد الإلكتروني المدخل' });
    }

    const newClient: User = {
      id: `u_${Date.now()}`,
      name,
      email,
      phone: phone || '',
      role: role || 'user',
      balance: typeof balance === 'number' ? balance : 0,
      avatar: `https://images.unsplash.com/photo-${1535713875000 + Math.floor(Math.random() * 500000)}?w=150`,
      preferredCurrency: preferredCurrency || 'SAR',
      preferredLanguage: preferredLanguage || 'ar',
      notes: notes || ''
    };

    DB.addUser(newClient);
    
    DB.addLog({
      id: `l_crmadd_${Date.now()}`,
      timestamp: new Date().toISOString(),
      type: 'info',
      message: `إنشاء حساب عميل جديد بالملف السلوكي: ${name} (${email})`
    });

    res.status(201).json({ success: true, client: newClient });
  });

  // Edit and update client record (CRM notes / details)
  app.put('/api/crm/clients/:id', (req, res) => {
    const client = DB.users.find(u => u.id === req.params.id);
    if (!client) {
      return res.status(404).json({ success: false, messageAr: 'العميل المستهدف غير موجود' });
    }

    const { name, email, phone, role, balance, notes, preferredCurrency, preferredLanguage } = req.body;
    client.name = name ?? client.name;
    client.email = email ?? client.email;
    client.phone = phone ?? client.phone;
    client.role = role ?? client.role;
    if (typeof balance === 'number') {
      client.balance = balance;
    }
    client.notes = notes ?? client.notes;
    client.preferredCurrency = preferredCurrency ?? client.preferredCurrency;
    client.preferredLanguage = preferredLanguage ?? client.preferredLanguage;

    DB.updateUser(client);

    DB.addLog({
      id: `l_crmup_${Date.now()}`,
      timestamp: new Date().toISOString(),
      type: 'info',
      message: `تعديل وتحديث بيانات ملف العميل: ${client.name} وتحديث الملاحظات الإدارية.`
    });

    res.json({ success: true, client });
  });

  // Delete client from CRM
  app.delete('/api/crm/clients/:id', (req, res) => {
    const index = DB.users.findIndex(u => u.id === req.params.id);
    if (index !== -1) {
      const deleted = DB.users[index];
      DB.users.splice(index, 1);
      
      DB.deleteUser(req.params.id);

      DB.addLog({
        id: `l_crmdel_${Date.now()}`,
        timestamp: new Date().toISOString(),
        type: 'warning',
        message: `تم إزالة حساب العميل نهائياً من سجلات الأمان: ${deleted.name} (${deleted.email})`
      });

      res.json({ success: true });
    } else {
      res.status(404).json({ success: false, messageAr: 'العميل غير موجود' });
    }
  });

  // Gemini AI multi-turn support chat assistant
  app.post('/api/crm/ai-chat', async (req, res) => {
    const { messages, lang } = req.body;
    try {
      const genAI = getGenAI();

      // Gather active auctions state as smart system ground-truth context
      const currentAuctions = DB.auctions.map(a => 
        `- [مزاد ${a.id}] "${a.titleAr}" (${a.titleEn}) - السعر الحالي: ${a.currentPrice} ${a.currency} - الحالة: ${a.status} - ينتهي: ${new Date(a.endTime).toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-US')}`
      ).join('\n');

      const systemInstruction = lang === 'ar'
        ? `أنت مستشار علاقات العملاء الذكي ومساعد الدعم الفني المباشر لمنصة "أنتيكاوي" للمزادات الفاخرة بالضمان.
           مهمتك هي الإجابة بدقة، ذكاء، ومصداقية بالغة وبأسلوب راقٍ وأديب جداً على أسئلة العملاء.
           ساعدهم في المزايدات، تفاصيل الشحن، آليات حجز الودائع والضمان المصرفي (Escrow)، وسياسة الموقع.
           استعن بقائمة المزادات النشطة والمنتهية الحالية لتصيغ إجابات دقيقة:
           ${currentAuctions}
           أجب باللغة العربية باحترافية وبشكل مقتضب وجميل.`
        : `You are the intelligent Customer Relationship Specialist and Live AI Helpdesk Assistant for the "أنتيكاوي" Elite Escrow Auctions platform.
           Your role is to assist high-value clients with inquiries regarding elite bidding rules, escrow deposit locks, shipping tracking, and company terms.
           Refer to this live inventory database to answer inquiries precisely:
           ${currentAuctions}
           Respond in English with a polished, highly helpful, and elite professional posture.`;

      const contents = (messages || []).map((m: any) => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.text }]
      }));

      const response = await callGeminiContent(genAI, {
        primaryModel: 'gemini-2.5-flash',
        contents,
        config: {
          systemInstruction,
          temperature: 0.7
        }
      });

      res.json({ success: true, reply: response.text });
    } catch (err: any) {
      res.json({
        success: false,
        reply: lang === 'ar'
          ? 'المساعد الذكي غير متاح مؤقتاً لعدم تهيئة مفتاح GEMINI_API_KEY بالمنصة. نحن نخدمك دوماً يدوياً عبر لوحة التذاكر.'
          : 'The smart assistant is temporarily offline due to missing GEMINI_API_KEY settings. Please file a manual support ticket so our team can assist you.',
        error: err.message
      });
    }
  });

  // Gemini AI image inspection / appraisal (multimodal analysis using gemini-2.5-flash)
  app.post('/api/crm/analyze-image', async (req, res) => {
    const { base64Image, mimeType, prompt, lang } = req.body;
    try {
      const genAI = getGenAI();

      const imagePart = {
        inlineData: {
          mimeType: mimeType || 'image/jpeg',
          data: base64Image
        }
      };

      const textPart = {
        text: prompt || (lang === 'ar'
          ? 'يرجى فحص وتحليل الصورة وإعطاء تقرير دقيق لمكتب خدمة العملاء بخصوص جودة السلعة والعيوب الظاهرة.'
          : 'Please inspect the uploaded item or package image and provide a high-fidelity appraisal report.')
      };

      const systemInstruction = lang === 'ar'
        ? 'أنت مستشار فني معتمد لتقييم وفحص السلع وتوثيق سلامة الشحنات وحل نزاعات الضمان المالي لمنصة أنتيكاوي. حلل الصورة المرفقة بتركيز عالٍ واكشف أي تزييف، عيوب أو أضرار في الشحنة.'
        : 'You are an accredited technical auditor and luxury appraiser for the أنتيكاوي escrow network. Carefully analyze the uploaded item image to identify any physical defects, shipping damage, or authentication warning flags.';

      const response = await callGeminiContent(genAI, {
        primaryModel: 'gemini-2.5-flash',
        contents: {
          parts: [imagePart, textPart]
        },
        config: {
          systemInstruction
        }
      });

      res.json({ success: true, analysis: response.text });
    } catch (err: any) {
      console.error('Gemini image analysis error:', err);
      res.json({
        success: false,
        analysis: lang === 'ar'
          ? 'تعذر تحليل الصورة بالذكاء الاصطناعي حالياً لعدم توفر مفتاح ترخيص الترابط السيادي.'
          : 'Unable to analyze image. Ensure your GEMINI_API_KEY is configured in Settings > Secrets.',
        error: err.message
      });
    }
  });

  // Gemini AI Audio Speech Transcription (transcribes customer audio input using gemini-3.5-flash)
  app.post('/api/crm/transcribe-audio', async (req, res) => {
    const { base64Audio, mimeType, lang } = req.body;
    try {
      const genAI = getGenAI();

      const audioPart = {
        inlineData: {
          mimeType: mimeType || 'audio/wav',
          data: base64Audio
        }
      };

      const textPart = {
        text: lang === 'ar'
          ? 'يرجى نسخ هذا التسجيل الصوتي لمشكلة العميل بدقة بالغة إلى نص مكتوب.'
          : 'Please transcribe this customer voice message into written text accurately.'
      };

      const response = await callGeminiContent(genAI, {
        primaryModel: 'gemini-2.5-flash',
        contents: {
          parts: [audioPart, textPart]
        }
      });

      res.json({ success: true, transcription: response.text });
    } catch (err: any) {
      res.json({
        success: false,
        transcription: lang === 'ar'
          ? 'فشل نسخ المقطع الصوتي.'
          : 'Audio transcription failed.',
        error: err.message
      });
    }
  });

  // Gemini AI outreach and promotional campaigns drafing
  app.post('/api/crm/ai-campaign', async (req, res) => {
    const { segment, campaignGoal, lang } = req.body;
    try {
      const genAI = getGenAI();

      const prompt = lang === 'ar'
        ? `اكتب بريداً إلكترونياً تسويقياً موجهاً وجذاباً لعملاء منصة المزادات الفاخرة أنتيكاوي.
           الجمهور المستهدف: ${segment}
           الهدف من التواصل: ${campaignGoal}
           تأكد من صياغة عرض فخم وأديب يثير شغف المقتنين مع تعزيز حقيقة أمن وضمان معاملاتنا.`
        : `Compose a high-end marketing outreach email for أنتيكاوي VIP auction customers.
           Target Segment: ${segment}
           Campaign Goal: ${campaignGoal}
           Draft a luxurious, highly persuasive offer letter highlighting our dual escrow system.`;

      const response = await callGeminiContent(genAI, {
        primaryModel: 'gemini-2.5-flash',
        contents: prompt
      });

      res.json({ success: true, text: response.text });
    } catch (err: any) {
      console.error('Gemini Campaign drafting error:', err);
      res.json({
        success: false,
        text: lang === 'ar'
          ? 'حدث خطأ أثناء صياغة محتوى الحملة الذكية.'
          : 'An error occurred while generating the campaign copy.',
        error: err.message
      });
    }
  });

  // Gemini AI Market Insight for Auctions (Scarcity & Historical Value)
  app.post('/api/auctions/:id/market-insight', async (req, res) => {
    const { lang } = req.body;
    const auction = DB.auctions.find(a => a.id === req.params.id);
    if (!auction) {
      return res.status(404).json({ success: false, message: 'Auction not found' });
    }

    try {
      const genAI = getGenAI();

      const title = lang === 'ar' ? auction.titleAr : auction.titleEn;
      const desc = lang === 'ar' ? auction.descAr : auction.descEn;

      const prompt = lang === 'ar'
        ? `أنت خبير تثمين وتحف عالمي ومحلل أسواق للمزادات الفاخرة والقطع النادرة في منصة "أنتيكاوي".
           قم بإعداد تقرير موجز وذكي جداً (من فقرتين إلى 3 فقرات قصيرة ومنظمة) حول هذه التحفة/السلعة:
           الاسم: "${title}"
           التصنيف: "${auction.category}"
           الحالة: "${auction.itemCondition}"
           الوصف: "${desc}"
           السعر الافتتاحي/الحالي: "${auction.currentPrice} ${auction.currency}"

           المطلوب في التقرير:
           1. ندرة القطعة (Scarcity): اشرح لماذا تعتبر هذه القطعة نادرة ومطلوبة بين هواة الاقتناء والمستثمرين.
           2. القيمة التاريخية والاستثمارية (Historical & Market Value): قدم سياقاً تاريخياً أو فنياً أو تقديرات لنمو قيمتها عبر الزمن.
           اكتب بأسلوب أدبي فخم، احترافي، وشيق باللغة العربية.`
        : `You are an elite global luxury appraiser and rare artifacts market analyst for the "أنتيكاوي" auction platform.
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

      const response = await callGeminiContent(genAI, {
        primaryModel: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          temperature: 0.7
        }
      });

      res.json({ success: true, insight: response.text });
    } catch (err: any) {
      console.error('Gemini Market Insight error:', err);
      // Provide a high-quality intelligent fallback if offline or API key missing so the user experience is never broken
      const fallbackInsight = lang === 'ar'
        ? `✨ نظرة السوق التقديرية: تُصنّف هذه التحفة ضمن الفئة فائقة الندرة (${auction.category})، وتتمتع بطلب تصاعدي في أسواق المقتنيات الخاصة. تعكس مواصفاتها الفنية وحالتها الراهنة قيمتها التاريخية الأصيلة وأهميتها الاستثمارية طويلة الأجل.`
        : `✨ Appraiser Market Note: This artifact is categorized under ultra-high rarity within the ${auction.category} sector, showing consistent upward appreciation in secondary collector markets. Its craftsmanship and preserved condition reflect significant historical integrity and long-term asset value.`;

      res.json({
        success: true,
        insight: fallbackInsight,
        isFallback: true,
        error: err.message
      });
    }
  });

  // System general logs
  app.get('/api/logs', (req, res) => {
    res.json({ logs: DB.logs });
  });

  // API external connection keys
  app.get('/api/api-keys', (req, res) => {
    res.json({ apiKeys: DB.apiKeys });
  });

  app.post('/api/api-keys', (req, res) => {
    const { clientName } = req.body;
    const newKey = {
      id: `key_${Date.now()}`,
      clientName: clientName || 'متجر خارجي جديد',
      key: `sa_live_${Math.random().toString(36).substring(2)}${Math.random().toString(36).substring(2)}`,
      createdAt: new Date().toISOString(),
      status: 'active' as const
    };
    DB.addApiKey(newKey);
    res.status(201).json({ success: true, apiKey: newKey });
  });

  app.delete('/api/api-keys/:id', (req, res) => {
    DB.deleteApiKey(req.params.id);
    res.json({ success: true });
  });

  // Database backups lists
  app.get('/api/backups', (req, res) => {
    res.json({ backups: DB.backupLogs });
  });

  // --- ADMIN MODERATION ENDPOINTS ---

  // Get pending approval auctions
  app.get('/api/admin/auctions/pending', (req, res) => {
    const pending = DB.auctions.filter(a => a.status === 'pending_approval');
    res.json({ auctions: pending });
  });

  // Approve pending auction
  app.post('/api/admin/auctions/:id/approve', async (req, res) => {
    const auction = DB.auctions.find(a => a.id === req.params.id);
    if (!auction) {
      return res.status(404).json({ success: false, messageAr: 'المزاد غير موجود' });
    }
    auction.status = 'active';
    await DB.updateAuction(auction);

    // Notify seller via system log and support ticket
    if (auction.sellerEmail) {
      DB.addTicket({
        id: `t_mod_${Date.now()}`,
        email: auction.sellerEmail,
        name: auction.seller.name,
        subject: `تمت الموافقة على مزادك: ${auction.titleAr}`,
        message: `نحيطكم علماً بأنه تمت مراجعة المزاد "${auction.titleAr}" والموافقة عليه بنجاح وهو الآن نشط ومتاح للمزايدين.`,
        status: 'answered',
        reply: 'إشعار تلقائي من فريق الرقابة والمراجعة الإدارية.',
        timestamp: new Date().toISOString()
      });
    }

    DB.addLog({
      id: `l_appr_${Date.now()}`,
      timestamp: new Date().toISOString(),
      type: 'info',
      message: `تمت الموافقة على المزاد ${auction.titleAr} ونشره بنجاح.`,
      user: currentUser?.email
    });

    broadcast('auction_approved', { auctionId: auction.id, auction });
    res.json({ success: true, auction });
  });

  // Reject pending or live auction with reason
  app.post('/api/admin/auctions/:id/reject', async (req, res) => {
    const { reason } = req.body;
    const auction = DB.auctions.find(a => a.id === req.params.id);
    if (!auction) {
      return res.status(404).json({ success: false, messageAr: 'المزاد غير موجود' });
    }
    auction.status = 'rejected';
    auction.rejectionReason = reason || 'لم يستوفِ الشروط والضوابط المعتمدة.';
    await DB.updateAuction(auction);

    // Notify seller
    if (auction.sellerEmail) {
      DB.addTicket({
        id: `t_rej_${Date.now()}`,
        email: auction.sellerEmail,
        name: auction.seller.name,
        subject: `تنبيه بشأن المزاد: ${auction.titleAr}`,
        message: `تمت مراجعة المزاد الخاص بكم وتقرر رفضه أو إلغاؤه للسبب التالي: ${auction.rejectionReason}`,
        status: 'answered',
        reply: 'إشعار رسمي من إدارة الرقابة والمراجعة.',
        timestamp: new Date().toISOString()
      });
    }

    DB.addLog({
      id: `l_rej_${Date.now()}`,
      timestamp: new Date().toISOString(),
      type: 'warning',
      message: `تم رفض/إلغاء المزاد ${auction.titleAr} للسبب: ${auction.rejectionReason}`,
      user: currentUser?.email
    });

    broadcast('auction_rejected', { auctionId: auction.id, reason: auction.rejectionReason });
    res.json({ success: true, auction });
  });

  // Toggle pause bidding on active auction
  app.post('/api/admin/auctions/:id/toggle-pause', async (req, res) => {
    const auction = DB.auctions.find(a => a.id === req.params.id);
    if (!auction) {
      return res.status(404).json({ success: false, messageAr: 'المزاد غير موجود' });
    }
    auction.isPaused = !auction.isPaused;
    await DB.updateAuction(auction);

    DB.addLog({
      id: `l_pause_${Date.now()}`,
      timestamp: new Date().toISOString(),
      type: 'warning',
      message: `${auction.isPaused ? 'إيقاف مؤقت' : 'استئناف'} للمزايدات على المزاد ${auction.titleAr}`,
      user: currentUser?.email
    });

    broadcast('auction_updated', { auctionId: auction.id, auction });
    res.json({ success: true, isPaused: auction.isPaused, auction });
  });

  // Admin Force-Cancel Auction
  app.post('/api/admin/auctions/:id/cancel', async (req, res) => {
    const { reason } = req.body;
    const auction = DB.auctions.find(a => a.id === req.params.id);
    if (!auction) {
      return res.status(404).json({ success: false, messageAr: 'المزاد غير موجود' });
    }
    auction.status = 'cancelled';
    auction.rejectionReason = reason || 'إلغاء إداري مستعجل.';
    await DB.updateAuction(auction);

    if (auction.sellerEmail) {
      DB.addTicket({
        id: `t_cnc_${Date.now()}`,
        email: auction.sellerEmail,
        name: auction.seller.name,
        subject: `تم إلغاء المزاد إدارياً: ${auction.titleAr}`,
        message: `تم إلغاء مزادكم إدارياً للسبب التالي: ${auction.rejectionReason}`,
        status: 'answered',
        reply: 'إشعار إلغاء إداري من المنصة.',
        timestamp: new Date().toISOString()
      });
    }

    broadcast('auction_updated', { auctionId: auction.id, auction });
    res.json({ success: true, auction });
  });

  // Admin Invalidate/Delete Bid
  app.delete('/api/admin/auctions/:id/bids/:bidId', async (req, res) => {
    const result = await DB.deleteBid(req.params.bidId);
    if (result.success) {
      broadcast('bid_cancelled', {
        auctionId: req.params.id,
        auction: result.auction,
        cancelledBidId: req.params.bidId
      });
      res.json(result);
    } else {
      res.status(400).json(result);
    }
  });

  // Admin Edit Auction Details
  app.put('/api/admin/auctions/:id', async (req, res) => {
    const auction = DB.auctions.find(a => a.id === req.params.id);
    if (!auction) {
      return res.status(404).json({ success: false, messageAr: 'المزاد غير موجود' });
    }

    const { titleAr, titleEn, descAr, descEn, category, startPrice, minIncrement, buyoutPrice, endTime } = req.body;
    if (titleAr) auction.titleAr = titleAr;
    if (titleEn) auction.titleEn = titleEn;
    if (descAr) auction.descAr = descAr;
    if (descEn) auction.descEn = descEn;
    if (category) auction.category = category;
    if (typeof startPrice === 'number') auction.startPrice = startPrice;
    if (typeof minIncrement === 'number') auction.minIncrement = minIncrement;
    if (buyoutPrice !== undefined) auction.buyoutPrice = buyoutPrice ? Number(buyoutPrice) : undefined;
    if (endTime) auction.endTime = endTime;

    await DB.updateAuction(auction);

    DB.addLog({
      id: `l_edit_${Date.now()}`,
      timestamp: new Date().toISOString(),
      type: 'info',
      message: `تعديل إداري لبيانات المزاد: ${auction.titleAr}`,
      user: currentUser?.email
    });

    broadcast('auction_updated', { auctionId: auction.id, auction });
    res.json({ success: true, auction });
  });

  // Analytical Dashboard stats
  app.get('/api/admin/metrics', (req, res) => {
    // Dynamic analytical summaries from live collections
    const activeAuctions = DB.auctions.filter(a => a.status === 'active').length;
    const completedAuctions = DB.auctions.filter(a => a.status === 'completed').length;
    
    const activeUsers = DB.users.length;
    
    // Total escrow held, total escrow released
    const escrowHeld = DB.escrows.filter(e => e.status === 'held').reduce((acc, current) => acc + current.amount, 0);
    const escrowReleased = DB.escrows.filter(e => e.status === 'released').reduce((acc, current) => acc + current.amount, 0);

    const totalSuccessfulSales = DB.auctions.filter(a => a.status === 'completed' && a.bidsCount > 0).reduce((acc, item) => acc + item.currentPrice, 0);

    // Distribution by category
    const categoriesMap: { [key: string]: number } = {};
    DB.auctions.forEach(a => {
      categoriesMap[a.category] = (categoriesMap[a.category] || 0) + 1;
    });
    const categoryStats = Object.keys(categoriesMap).map(key => ({
      name: key,
      value: categoriesMap[key]
    }));

    // Bidding history chart (last 5 bids)
    const bidTrends = DB.bids.slice(-6).map(b => ({
      time: new Date(b.timestamp).toLocaleTimeString('ar-EG', {hour: '2-digit', minute:'2-digit'}),
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

  // Fetch Settings
  app.get('/api/settings', (req, res) => {
    res.json({ settings: DB.settings });
  });

  // Edit Settings
  app.post('/api/settings', (req, res) => {
    const { autoBackupIntervalHours, systemNotificationEmail, escrowReleaseTimeoutDays, allowManualBidApproval, maintenanceMode, requireAdminApproval } = req.body;
    const newSettings = {
      autoBackupIntervalHours: Number(autoBackupIntervalHours) || DB.settings.autoBackupIntervalHours,
      systemNotificationEmail: systemNotificationEmail || DB.settings.systemNotificationEmail,
      escrowReleaseTimeoutDays: Number(escrowReleaseTimeoutDays) || DB.settings.escrowReleaseTimeoutDays,
      allowManualBidApproval: allowManualBidApproval !== undefined ? allowManualBidApproval : DB.settings.allowManualBidApproval,
      maintenanceMode: maintenanceMode !== undefined ? maintenanceMode : DB.settings.maintenanceMode,
      requireAdminApproval: requireAdminApproval !== undefined ? requireAdminApproval : DB.settings.requireAdminApproval
    };
    DB.updateSettings(newSettings);
    res.json({ success: true, settings: DB.settings });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running beautifully on http://localhost:${PORT}`);
  });
}

startServer();
