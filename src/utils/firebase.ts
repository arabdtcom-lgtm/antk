/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { initializeApp, getApps } from 'firebase/app';
import {
  getFirestore,
  collection,
  getDocs,
  doc,
  setDoc,
  getDoc,
  query,
  orderBy,
  limit,
  onSnapshot,
  Firestore
} from 'firebase/firestore';
import { Auction, User, Bid, SupportTicket, Shipment, EscrowTransaction } from '../types';

const firebaseConfig = {
  projectId: 'arbvps-ai-logic',
  appId: '1:42737781024:web:b3efc6913e9038a2566f45',
  apiKey: 'AIzaSyDiA0tWCduL9q4XRB4-xfs67Blqu8kmC2g',
  authDomain: 'arbvps-ai-logic.firebaseapp.com',
  storageBucket: 'arbvps-ai-logic.firebasestorage.app',
  messagingSenderId: '42737781024',
};

const DB_ID = 'ai-studio-0a9e8887-0ab3-49ff-be6c-937823e87a6f';

const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
export const db: Firestore = getFirestore(app, DB_ID);

export function cleanUndefined<T>(obj: T): T {
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

// ─── SEED USERS (demo accounts) ──────────────────────────────────────
export const DEMO_USERS: User[] = [
  {
    id: 'u1',
    name: 'أنتيكاوي',
    email: 'arabdt.com@gmail.com',
    role: 'admin',
    tier: 'admin',
    status: 'active',
    verified: true,
    trustScore: 98,
    completedTransactions: 18,
    balance: 250000,
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
    phone: '+966501234567',
    preferredCurrency: 'USD',
    preferredLanguage: 'ar',
    address: 'شارع قصر النيل، القاهرة',
    city: 'القاهرة',
    country: 'مصر',
    transactions: [
      {
        id: 'tx_init_1',
        userId: 'u1',
        type: 'deposit',
        amount: 250000,
        currency: 'USD',
        status: 'completed',
        method: 'Bank Transfer / Admin Grant',
        timestamp: new Date().toISOString(),
        description: 'رصيد الإدارة الافتراضي'
      }
    ]
  },
  {
    id: 'u2',
    name: 'سارة الشمري',
    email: 'sara.buyer@gmail.com',
    role: 'user',
    tier: 'vip',
    status: 'active',
    verified: true,
    trustScore: 95,
    completedTransactions: 14,
    balance: 75000,
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
    phone: '+966507654321',
    preferredCurrency: 'SAR',
    preferredLanguage: 'ar',
    address: 'طريق الملك فهد، الرياض',
    city: 'الرياض',
    country: 'السعودية',
    transactions: [
      {
        id: 'tx_init_2',
        userId: 'u2',
        type: 'deposit',
        amount: 75000,
        currency: 'SAR',
        status: 'completed',
        method: 'Mada / Visa',
        timestamp: new Date().toISOString(),
        description: 'إيداع محفظة كبار الشخصيات'
      }
    ]
  },
  {
    id: 'u3',
    name: 'John Miller',
    email: 'john.miller@gmail.com',
    role: 'user',
    tier: 'verified_seller',
    status: 'active',
    verified: true,
    trustScore: 92,
    completedTransactions: 10,
    balance: 50000,
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
    phone: '+14155552671',
    preferredCurrency: 'USD',
    preferredLanguage: 'en',
    address: '500 Market St',
    city: 'San Francisco',
    country: 'USA',
    transactions: [
      {
        id: 'tx_init_3',
        userId: 'u3',
        type: 'deposit',
        amount: 50000,
        currency: 'USD',
        status: 'completed',
        method: 'Apple Pay',
        timestamp: new Date().toISOString(),
        description: 'Seller Wallet Deposit'
      }
    ]
  }
];

// ─── SESSION (localStorage) ───────────────────────────────────────────
const SESSION_KEY = 'antkawy_session_user';

export function getSessionUser(): User | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const u: User = JSON.parse(raw);
    if (u.email === 'arabdt.com@gmail.com' || u.role === 'admin') {
      u.name = 'أنتيكاوي';
    }
    return u;
  } catch {
    return null;
  }
}

export function saveSessionUser(user: User) {
  try {
    localStorage.setItem(SESSION_KEY, JSON.stringify(user));
  } catch { }
}

export function clearSessionUser() {
  try {
    localStorage.removeItem(SESSION_KEY);
  } catch { }
}

// ─── AUTH ─────────────────────────────────────────────────────────────
export async function loginUser(email: string, provider?: string): Promise<User | null> {
  // 1. Check demo users list
  let matched = DEMO_USERS.find(u => u.email.toLowerCase() === email.toLowerCase());

  if (!matched && provider) {
    // Social login: find or auto-create
    try {
      const snap = await getDocs(collection(db, 'users'));
      const allUsers = snap.docs.map(d => d.data() as User);
      matched = allUsers.find(u => u.email.toLowerCase() === email.toLowerCase());
    } catch { }

    if (!matched) {
      matched = {
        id: `u_${Date.now()}`,
        name: email.split('@')[0],
        email,
        role: 'user',
        balance: 20000,
        avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
        preferredCurrency: 'SAR',
        preferredLanguage: 'ar'
      };
      try {
        await setDoc(doc(db, 'users', matched.id), matched);
      } catch { }
    }
  }

  if (!matched) {
    // Try Firestore lookup
    try {
      const snap = await getDocs(collection(db, 'users'));
      const allUsers = snap.docs.map(d => d.data() as User);
      matched = allUsers.find(u => u.email.toLowerCase() === email.toLowerCase());
    } catch { }
  }

  if (matched) {
    saveSessionUser(matched);
    return matched;
  }
  return null;
}

export function logoutUser() {
  clearSessionUser();
}

export async function updateUserProfile(current: User, details: Partial<User>): Promise<User> {
  const updated = { ...current, ...details };
  saveSessionUser(updated);
  try {
    await setDoc(doc(db, 'users', updated.id), updated);
  } catch { }
  return updated;
}

export const SUEZ_BOND_AUCTION: Auction = {
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
  endTime: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
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
  createdDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  softCloseMinutes: 2
};

export const UMM_KULTHUM_RECEIPT_AUCTION: Auction = {
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
  endTime: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000).toISOString(),
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
  createdDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
  softCloseMinutes: 2
};

export const SAKAKINI_POLICY_AUCTION: Auction = {
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
  endTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
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
  createdDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
  softCloseMinutes: 2
};

export const KHEDIVE_ADVISER_AUCTION: Auction = {
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
  endTime: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000).toISOString(),
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
  createdDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
  softCloseMinutes: 2
};

export const ANTONIADIS_LETTER_AUCTION: Auction = {
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
  endTime: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
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
  createdDate: new Date(Date.now() - 0.5 * 24 * 60 * 60 * 1000).toISOString(),
  softCloseMinutes: 2
};

export const FAROUK_MEDAL_AUCTION: Auction = {
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
  endTime: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000).toISOString(),
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
  createdDate: new Date(Date.now() - 0.3 * 24 * 60 * 60 * 1000).toISOString(),
  softCloseMinutes: 2
};

// ─── AUCTIONS ─────────────────────────────────────────────────────────
export async function fetchAuctionsFromFirestore(): Promise<Auction[]> {
  try {
    // Always force update Firestore docs for featured items
    try {
      await setDoc(doc(db, 'auctions', SUEZ_BOND_AUCTION.id), SUEZ_BOND_AUCTION);
      await setDoc(doc(db, 'auctions', UMM_KULTHUM_RECEIPT_AUCTION.id), UMM_KULTHUM_RECEIPT_AUCTION);
      await setDoc(doc(db, 'auctions', SAKAKINI_POLICY_AUCTION.id), SAKAKINI_POLICY_AUCTION);
      await setDoc(doc(db, 'auctions', KHEDIVE_ADVISER_AUCTION.id), KHEDIVE_ADVISER_AUCTION);
      await setDoc(doc(db, 'auctions', ANTONIADIS_LETTER_AUCTION.id), ANTONIADIS_LETTER_AUCTION);
      await setDoc(doc(db, 'auctions', FAROUK_MEDAL_AUCTION.id), FAROUK_MEDAL_AUCTION);
    } catch { }

    const snap = await getDocs(collection(db, 'auctions'));
    let list = snap.docs.map(d => d.data() as Auction);

    // Ensure featured items are at top
    const faroukIdx = list.findIndex(a => a.id === 'a_farouk_medal_1951');
    if (faroukIdx !== -1) list[faroukIdx] = FAROUK_MEDAL_AUCTION;
    else list = [FAROUK_MEDAL_AUCTION, ...list];

    const antoniadisIdx = list.findIndex(a => a.id === 'a_antoniadis_1857');
    if (antoniadisIdx !== -1) list[antoniadisIdx] = ANTONIADIS_LETTER_AUCTION;
    else list = [ANTONIADIS_LETTER_AUCTION, ...list];

    const khediveIdx = list.findIndex(a => a.id === 'a_khedive_adviser_1895');
    if (khediveIdx !== -1) list[khediveIdx] = KHEDIVE_ADVISER_AUCTION;
    else list = [KHEDIVE_ADVISER_AUCTION, ...list];

    const sakakiniIdx = list.findIndex(a => a.id === 'a_sakakini_policy');
    if (sakakiniIdx !== -1) list[sakakiniIdx] = SAKAKINI_POLICY_AUCTION;
    else list = [SAKAKINI_POLICY_AUCTION, ...list];

    const ummIdx = list.findIndex(a => a.id === 'a_umm_kulthum_receipt');
    if (ummIdx !== -1) list[ummIdx] = UMM_KULTHUM_RECEIPT_AUCTION;
    else list = [UMM_KULTHUM_RECEIPT_AUCTION, ...list];

    const suezIdx = list.findIndex(a => a.id === 'a_suez_bond');
    if (suezIdx !== -1) list[suezIdx] = SUEZ_BOND_AUCTION;
    else list = [SUEZ_BOND_AUCTION, ...list];

    return list;
  } catch (e) {
    console.warn('Firestore auctions fetch failed:', e);
    return [FAROUK_MEDAL_AUCTION, ANTONIADIS_LETTER_AUCTION, KHEDIVE_ADVISER_AUCTION, SAKAKINI_POLICY_AUCTION, UMM_KULTHUM_RECEIPT_AUCTION, SUEZ_BOND_AUCTION];
  }
}

// ─── GET SINGLE AUCTION ───────────────────────────────────────────────
export async function getAuctionByIdFromFirestore(auctionId: string): Promise<Auction | null> {
  if (auctionId === 'a_suez_bond') return SUEZ_BOND_AUCTION;
  if (auctionId === 'a_umm_kulthum_receipt') return UMM_KULTHUM_RECEIPT_AUCTION;
  if (auctionId === 'a_sakakini_policy') return SAKAKINI_POLICY_AUCTION;
  if (auctionId === 'a_khedive_adviser_1895') return KHEDIVE_ADVISER_AUCTION;
  if (auctionId === 'a_antoniadis_1857') return ANTONIADIS_LETTER_AUCTION;
  if (auctionId === 'a_farouk_medal_1951') return FAROUK_MEDAL_AUCTION;
  try {
    const snap = await getDoc(doc(db, 'auctions', auctionId));
    return snap.exists() ? (snap.data() as Auction) : null;
  } catch {
    return null;
  }
}

// ─── BIDS ─────────────────────────────────────────────────────────────
export async function fetchBidsForAuction(auctionId: string): Promise<Bid[]> {
  try {
    const snap = await getDocs(collection(db, 'bids'));
    return snap.docs
      .map(d => d.data() as Bid)
      .filter(b => b.auctionId === auctionId)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  } catch {
    return [];
  }
}

// ─── SHIPMENTS ────────────────────────────────────────────────────────
export async function fetchShipmentsFromFirestore(): Promise<Shipment[]> {
  try {
    const snap = await getDocs(collection(db, 'shipments'));
    return snap.docs.map(d => d.data() as Shipment);
  } catch {
    return [];
  }
}

// ─── SUPPORT TICKETS ──────────────────────────────────────────────────
export async function fetchTicketsFromFirestore(): Promise<SupportTicket[]> {
  try {
    const snap = await getDocs(collection(db, 'tickets'));
    return snap.docs.map(d => d.data() as SupportTicket);
  } catch {
    return [];
  }
}


// ─── REALTIME AUCTION SUBSCRIPTION ────────────────────────────────────
export function subscribeToAuction(
  auctionId: string,
  onUpdate: (auction: Auction) => void
): () => void {
  const auctionRef = doc(db, 'auctions', auctionId);
  return onSnapshot(auctionRef, (snapshot) => {
    if (snapshot.exists()) {
      onUpdate(snapshot.data() as Auction);
    }
  }, (error) => {
    console.warn('Firestore real-time subscription error:', error);
  });
}

export const placeBidInFirestore = submitBidInFirestore;

// ─── SUBMIT BID WITH ANTI-SNIPE AUTO-EXTENSION ───────────────────────
export async function submitBidInFirestore(
  auctionId: string,
  amount: number,
  user: User
): Promise<{
  success: boolean;
  messageAr: string;
  messageEn: string;
  auction?: Auction;
  isExtended?: boolean;
  extendedByMinutes?: number
}> {
  try {
    const auctionRef = doc(db, 'auctions', auctionId);
    const snap = await getDoc(auctionRef);
    let currentAuction: Auction;

    if (!snap.exists()) {
      // Fallback: search in local list if not saved to Firestore yet
      const all = await fetchAuctionsFromFirestore();
      const found = all.find(a => a.id === auctionId);
      if (!found) {
        return { success: false, messageAr: 'المزاد غير موجود', messageEn: 'Auction not found' };
      }
      currentAuction = found;
    } else {
      currentAuction = snap.data() as Auction;
    }

    if (currentAuction.status !== 'active') {
      return { success: false, messageAr: 'المزاد مغلق بالفعل', messageEn: 'Auction is already closed' };
    }

    if (amount <= currentAuction.currentPrice) {
      return { success: false, messageAr: 'المبلغ يجب أن يكون أعلى من السعر الحالي', messageEn: 'Amount must be higher than current price' };
    }

    const newBid: Bid = {
      id: `b_${Date.now()}`,
      auctionId,
      bidderEmail: user.email,
      bidderName: user.name,
      amount,
      timestamp: new Date().toISOString()
    };

    // Anti-snipe extension: if bid is within softCloseMinutes (default 5 min) of endTime
    const softCloseMinutes = currentAuction.softCloseMinutes || 5;
    const softCloseMs = softCloseMinutes * 60 * 1000;
    let newEndTime = currentAuction.endTime;
    const now = Date.now();
    const endMs = new Date(currentAuction.endTime).getTime();
    let isExtended = false;

    if (endMs - now > 0 && endMs - now <= softCloseMs) {
      newEndTime = new Date(now + softCloseMs).toISOString();
      isExtended = true;
    }

    const updatedAuction: Auction = {
      ...currentAuction,
      currentPrice: amount,
      highBidder: user.email,
      highBidderName: user.name,
      bidsCount: (currentAuction.bidsCount || 0) + 1,
      endTime: newEndTime,
      antiSnipeTriggeredCount: (currentAuction.antiSnipeTriggeredCount || 0) + (isExtended ? 1 : 0),
      lastExtendedAt: isExtended ? new Date().toISOString() : currentAuction.lastExtendedAt
    };

    try {
      await setDoc(doc(db, 'bids', newBid.id), cleanUndefined(newBid));
      await setDoc(auctionRef, cleanUndefined(updatedAuction));
    } catch (e) {
      console.warn('Firestore write warning:', e);
    }

    return {
      success: true,
      messageAr: isExtended
        ? `⚡ تم تمديد الحراج بمقدار ${softCloseMinutes} دقائق لمكافحة القنص! وتقديم مزايدتك بنجاح بقيمة $ USD ${amount}`
        : `تم تقديم مزايدتك بنجاح بقيمة $ USD ${amount}`,
      messageEn: isExtended
        ? `⚡ Anti-Snipe Extended! +${softCloseMinutes} min and bid submitted successfully for $ USD ${amount}`
        : `Bid submitted successfully for $ USD ${amount}`,
      auction: updatedAuction,
      isExtended,
      extendedByMinutes: softCloseMinutes
    };
  } catch (err: any) {
    console.error('Error submitting bid:', err);
    return {
      success: false,
      messageAr: 'حدث خطأ أثناء تقديم المزايدة، يرجى المحاولة لاحقاً',
      messageEn: 'Error submitting bid, please try again'
    };
  }
}

// ─── BUYOUT AUCTION WITH INSTANT ESCROW CREATION ─────────────────────
export async function buyoutAuctionInFirestore(
  auctionId: string,
  user: User
): Promise<{ success: boolean; messageAr: string; messageEn: string; auction?: Auction; escrow?: EscrowTransaction }> {
  try {
    const auctionRef = doc(db, 'auctions', auctionId);
    const snap = await getDoc(auctionRef);
    if (!snap.exists()) {
      return { success: false, messageAr: 'المزاد غير موجود', messageEn: 'Auction not found' };
    }
    const currentAuction = snap.data() as Auction;
    const buyoutPrice = currentAuction.buyoutPrice || currentAuction.currentPrice;

    // Transition status to buyout_claimed and lock bidding
    const updatedAuction: Auction = {
      ...currentAuction,
      currentPrice: buyoutPrice,
      highBidder: user.email,
      highBidderName: user.name,
      status: 'buyout_claimed'
    };

    // Immediately create an EscrowTransaction record in $ USD with status 'held'
    const escrowId = `es_${Date.now()}`;
    const newEscrow: EscrowTransaction = {
      id: escrowId,
      auctionId,
      auctionTitleAr: currentAuction.titleAr,
      auctionTitleEn: currentAuction.titleEn,
      amount: buyoutPrice,
      amountUSD: buyoutPrice,
      currency: 'USD',
      buyerEmail: user.email,
      buyerName: user.name,
      sellerName: currentAuction.seller?.name || 'أنتيكاوي',
      sellerEmail: currentAuction.sellerEmail || 'arabdt.com@gmail.com',
      sellerVerified: currentAuction.seller?.verified ?? true,
      status: 'held',
      createdAt: new Date().toISOString(),
      paymentMethod: 'Instant Buyout Escrow',
      invoiceNumber: `INV-${Date.now()}`
    };

    try {
      await setDoc(auctionRef, cleanUndefined(updatedAuction));
      await setDoc(doc(db, 'escrows', escrowId), cleanUndefined(newEscrow));
    } catch (e) {
      console.warn('Firestore write warning during buyout:', e);
    }

    return {
      success: true,
      messageAr: `تم تفعيل خيار الشراء الفوري واقتناء السلعة بنجاح! تم إنشاء سجل الضمان المالي بقيمة ${buyoutPrice} $ USD.`,
      messageEn: `Buyout claimed successfully! Escrow vault created for $ USD ${buyoutPrice}.`,
      auction: updatedAuction,
      escrow: newEscrow
    };
  } catch (err) {
    return {
      success: false,
      messageAr: 'حدث خطأ أثناء تنفيذ الشراء الفوري',
      messageEn: 'Error processing buyout'
    };
  }
}

// ─── CREATE AUCTION ───────────────────────────────────────────────────
export async function createAuctionInFirestore(
  data: Partial<Auction>,
  user: User
): Promise<{ success: boolean; auction?: Auction }> {
  try {
    const id = `a_${Date.now()}`;
    const newAuction: Auction = {
      id,
      titleAr: data.titleAr || 'مزاد جديد',
      titleEn: data.titleEn || 'New Auction',
      descAr: data.descAr || '',
      descEn: data.descEn || '',
      category: data.category || 'أخرى',
      image: data.image || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800',
      startPrice: Number(data.startPrice) || 100,
      currentPrice: Number(data.startPrice) || 100,
      minIncrement: Number(data.minIncrement) || 50,
      buyoutPrice: data.buyoutPrice ? Number(data.buyoutPrice) : undefined,
      endTime: data.endTime || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'active',
      bidsCount: 0,
      viewsCount: 1,
      sellerEmail: user?.email || 'arabdt.com@gmail.com',
      seller: {
        name: user?.name || 'أنتيكاوي',
        rating: 4.9,
        verified: true
      },
      itemCondition: data.itemCondition || 'new',
      currency: data.currency || 'USD',
      createdDate: new Date().toISOString(),
      softCloseMinutes: Number(data.softCloseMinutes) || 5
    };

    await setDoc(doc(db, 'auctions', id), cleanUndefined(newAuction));
    return { success: true, auction: newAuction };
  } catch (e) {
    console.error('Error creating auction:', e);
    return { success: false };
  }
}

// ─── CHECKOUT & ESCROW HELPERS ───────────────────────────────────────
export async function checkoutEscrowInFirestore(
  auctionId: string,
  user: User,
  amount: number,
  paymentMethod: string
): Promise<{ success: boolean; shipment?: Shipment; escrow?: EscrowTransaction }> {
  try {
    const num = Math.floor(10000000 + Math.random() * 90000000);
    const auctionRef = doc(db, 'auctions', auctionId);
    const snap = await getDoc(auctionRef);
    const auctionData = snap.exists() ? (snap.data() as Auction) : null;

    const escrowId = `es_${Date.now()}`;
    const escrow: EscrowTransaction = {
      id: escrowId,
      auctionId,
      auctionTitleAr: auctionData?.titleAr || 'مزاد antkawy',
      auctionTitleEn: auctionData?.titleEn || 'Antkawy Auction',
      amount,
      amountUSD: amount,
      currency: 'USD',
      buyerEmail: user.email,
      buyerName: user.name,
      sellerName: auctionData?.seller?.name || 'أنتيكاوي',
      sellerEmail: auctionData?.sellerEmail || 'arabdt.com@gmail.com',
      sellerVerified: auctionData?.seller?.verified ?? true,
      status: 'held',
      createdAt: new Date().toISOString(),
      paymentMethod,
      invoiceNumber: `INV-${Date.now()}`
    };

    const shipment: Shipment = {
      id: `ship_${Date.now()}`,
      auctionId,
      auctionTitleAr: auctionData?.titleAr || 'مزاد antkawy',
      auctionTitleEn: auctionData?.titleEn || 'Antkawy Auction',
      buyerEmail: user.email,
      carrier: 'Aramex Express',
      trackingNumber: `AMX-${num}-SA`,
      status: 'payment_confirmed',
      estimatedDelivery: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      history: [
        {
          status: 'payment_confirmed',
          statusAr: `تم تفعيل حماية الضمان (Escrow) بقيمة $ USD ${amount} عبر ${paymentMethod}`,
          city: 'Riyadh',
          cityAr: 'الرياض',
          timestamp: new Date().toISOString()
        }
      ]
    };

    try {
      await setDoc(doc(db, 'escrows', escrow.id), escrow);
      await setDoc(doc(db, 'shipments', shipment.id), shipment);
      if (snap.exists()) {
        await setDoc(auctionRef, { ...snap.data(), trackingNumber: shipment.trackingNumber, status: 'completed' }, { merge: true });
      }
    } catch (e) {
      console.warn('Firestore write warning:', e);
    }

    return { success: true, shipment, escrow };
  } catch (err) {
    return { success: false };
  }
}

export async function releaseEscrowInFirestore(
  escrowId: string,
  user: User
): Promise<{ success: boolean; messageAr: string; messageEn: string }> {
  try {
    const escrowRef = doc(db, 'escrows', escrowId);
    const snap = await getDoc(escrowRef);
    if (!snap.exists()) {
      return { success: false, messageAr: 'سجل الضمان غير موجود', messageEn: 'Escrow record not found' };
    }
    const escrow = snap.data() as EscrowTransaction;
    const updatedEscrow: EscrowTransaction = {
      ...escrow,
      status: 'released',
      releasedAt: new Date().toISOString()
    };

    await setDoc(escrowRef, updatedEscrow);
    return {
      success: true,
      messageAr: 'تم تأكيد الاستلام والإفراج عن أموال الضمان للبائع بنجاح!',
      messageEn: 'Escrow funds successfully released to seller!'
    };
  } catch (err) {
    return {
      success: false,
      messageAr: 'حدث خطأ أثناء تحرير الضمان',
      messageEn: 'Error releasing escrow'
    };
  }
}

export async function disputeEscrowInFirestore(
  escrowId: string,
  user: User,
  reason: string
): Promise<{ success: boolean; messageAr: string; messageEn: string }> {
  try {
    const escrowRef = doc(db, 'escrows', escrowId);
    const snap = await getDoc(escrowRef);
    if (!snap.exists()) {
      return { success: false, messageAr: 'سجل الضمان غير موجود', messageEn: 'Escrow record not found' };
    }
    const escrow = snap.data() as EscrowTransaction;
    const updatedEscrow: EscrowTransaction = {
      ...escrow,
      status: 'disputed',
      disputedAt: new Date().toISOString(),
      disputeReason: reason
    };

    await setDoc(escrowRef, updatedEscrow);
    return {
      success: true,
      messageAr: 'تم فتح نزاع رسمي وتجميد مبالغ الضمان لحين مراجعة الإدارة.',
      messageEn: 'Dispute filed successfully. Escrow funds frozen pending admin review.'
    };
  } catch (err) {
    return {
      success: false,
      messageAr: 'حدث خطأ أثناء تقديم طلب الاعتراض',
      messageEn: 'Error filing dispute'
    };
  }
}

export async function updateTrackingInFirestore(
  auctionId: string,
  carrier: string,
  trackingNumber: string,
  user: User
): Promise<{ success: boolean; messageAr: string; messageEn: string }> {
  try {
    const auctionRef = doc(db, 'auctions', auctionId);
    await setDoc(auctionRef, { trackingNumber, carrier }, { merge: true });
    return {
      success: true,
      messageAr: `تم تحديث بيانات الشحن برقم التتبع: ${trackingNumber}`,
      messageEn: `Shipment tracking updated with number: ${trackingNumber}`
    };
  } catch (err) {
    return {
      success: false,
      messageAr: 'حدث خطأ أثناء تحديث بيانات التتبع',
      messageEn: 'Error updating tracking number'
    };
  }
}

export async function fetchEscrowByAuctionIdFromFirestore(auctionId: string): Promise<EscrowTransaction | null> {
  try {
    const snap = await getDocs(collection(db, 'escrows'));
    const all = snap.docs.map(d => d.data() as EscrowTransaction);
    return all.find(e => e.auctionId === auctionId) || null;
  } catch {
    return null;
  }
}

