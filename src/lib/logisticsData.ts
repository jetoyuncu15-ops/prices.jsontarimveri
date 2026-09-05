// Akıllı Lojistik & ELÜS — mock veri ve hesaplama yardımcıları

import { commodities } from '@/lib/mockData';
import { provinces81 } from '@/lib/provinces';

// ── ELÜS (Elektronik Ürün Senedi) tipi ──────────────────────
export interface ElusWarrant {
  id: string;
  product: string;
  productId: string;
  warehouse: string;       // Lisanslı depo adı
  city: string;
  quantity: number;        // ton
  issueDate: string;        // ihraç tarihi
  expiryDate: string;       // vade
  marketPrice: number;      // güncel borsa fiyatı ₺/ton
  referencePrice: number;   // referans fiyat
  changePct: number;        // günlük değişim
  status: 'active' | 'listed' | 'expired';
  offers: { buyer: string; price: number; volume: number; date: string }[];
}

// Lisanslı depolar — ana depoculuk merkezleri
const warehouses: { name: string; city: string; products: string[] }[] = [
  { name: 'Konya Lisanslı Depo', city: 'Konya', products: ['Buğday', 'Arpa', 'Mısır'] },
  { name: 'Polatlı Hububat Deposu', city: 'Ankara', products: ['Buğday', 'Arpa'] },
  { name: 'Gaziantep Tarım Deposu', city: 'Gaziantep', products: ['Antep Fıstığı', 'Mercimek'] },
  { name: 'İzmir Liman Deposu', city: 'İzmir', products: ['Pamuk', 'Üzüm'] },
  { name: 'Adana Çukurova Deposu', city: 'Adana', products: ['Pamuk', 'Mısır'] },
  { name: 'Tekirdağ Trakya Deposu', city: 'Tekirdağ', products: ['Ayçiçeği', 'Buğday'] },
  { name: 'Samsun Karadeniz Deposu', city: 'Samsun', products: ['Fındık', 'Çay'] },
  { name: 'Malatya Kayısı Deposu', city: 'Malatya', products: ['Kayısı'] },
  { name: 'Nevşehir Patates Deposu', city: 'Nevşehir', products: ['Patates', 'Soğan'] },
  { name: 'Antalya Akdeniz Deposu', city: 'Antalya', products: ['Narenciye', 'Domates'] },
];

function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function genOffers(product: string, basePrice: number, seed: number): ElusWarrant['offers'] {
  const buyers = ['Anadolu Un', 'Güney Tarım', 'Marmara Gıda', 'Ege İhracat', 'Çukurova Ticaret'];
  const count = 2 + (seed % 3);
  return Array.from({ length: count }).map((_, i) => {
    const h = hash(product + seed + i);
    const variance = ((h % 100) - 50) / 1000;
    return {
      buyer: buyers[h % buyers.length],
      price: Math.round(basePrice * (1 + variance) * 10) / 10,
      volume: 20 + (h % 80),
      date: new Date(2026, 7, 1 + (h % 13)).toLocaleDateString('tr-TR'),
    };
  });
}

export const elusWarrants: ElusWarrant[] = warehouses.flatMap((wh, wi) => {
  return wh.products.map((prod, pi) => {
    const h = hash(wh.name + prod);
    const commodity = commodities.find((c) => c.name === prod);
    const basePrice = commodity ? commodity.price * 10 : 4500;
    const refPrice = Math.round(basePrice * (0.92 + ((h % 16) / 100)) * 10) / 10;
    const marketPrice = Math.round(basePrice * (0.95 + ((h % 10) / 100)) * 10) / 10;
    const change = Math.round((((h % 80) - 40) / 10) * 100) / 100;
    const qty = 50 + (h % 200);
    const issueDay = 1 + (h % 28);
    const statuses: ElusWarrant['status'][] = ['active', 'listed', 'active', 'listed'];
    return {
      id: `ELUS-${wh.city.slice(0, 3).toUpperCase()}-${wi}${pi}-${h % 1000}`,
      product: prod,
      productId: commodity?.id ?? prod.toLowerCase(),
      warehouse: wh.name,
      city: wh.city,
      quantity: qty,
      issueDate: new Date(2026, 6, issueDay).toLocaleDateString('tr-TR'),
      expiryDate: new Date(2026, 11, issueDay).toLocaleDateString('tr-TR'),
      marketPrice,
      referencePrice: refPrice,
      changePct: change,
      status: statuses[h % 4],
      offers: genOffers(prod, marketPrice, h),
    };
  });
});

// ── Navlun / Lojistik hesaplama ──────────────────────────────

// Haversine formülü — iki il arası km
export function haversineKm(
  lat1: number, lng1: number,
  lat2: number, lng2: number,
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

export interface FreightResult {
  distanceKm: number;
  fuelCost: number;
  driverCost: number;
  tollCost: number;
  loadingCost: number;
  totalFreight: number;
  perTonCost: number;
  perDekarCost: number;
}

export interface FreightInput {
  fromCity: string;
  toCity: string;
  tonnage: number;
  dieselPrice: number;     // ₺/lt
  fuelConsumption: number; // lt/100km
  truckCapacity: number;   // ton
  driverDailyWage: number;  // ₺/gün
  avgSpeed: number;         // km/saat
  loadingUnloadCost: number; // ₺
  dekarArea: number;        // dekar
  yieldPerDekar: number;    // ton/dekar
}

export const defaultFreightInput: FreightInput = {
  fromCity: 'Konya',
  toCity: 'İzmir',
  tonnage: 50,
  dieselPrice: 44.5,
  fuelConsumption: 32,
  truckCapacity: 20,
  driverDailyWage: 3500,
  avgSpeed: 65,
  loadingUnloadCost: 8000,
  dekarArea: 1000,
  yieldPerDekar: 0.5,
};

export function calcFreight(input: FreightInput): FreightResult {
  const from = provinces81.find((p) => p.city === input.fromCity);
  const to = provinces81.find((p) => p.city === input.toCity);
  if (!from || !to) {
    return { distanceKm: 0, fuelCost: 0, driverCost: 0, tollCost: 0, loadingCost: 0, totalFreight: 0, perTonCost: 0, perDekarCost: 0 };
  }

  const distance = haversineKm(from.lat, from.lng, to.lat, to.lng);
  const trips = Math.ceil(input.tonnage / input.truckCapacity);
  const totalKm = distance * trips * 2; // gidiş-dönüş

  // Yakıt
  const totalFuelLt = (totalKm * input.fuelConsumption) / 100;
  const fuelCost = totalFuelLt * input.dieselPrice;

  // Şoför — gidiş-dönüş süresi
  const hoursPerTrip = (distance * 2) / input.avgSpeed;
  const totalHours = hoursPerTrip * trips;
  const totalDays = Math.ceil(totalHours / 8);
  const driverCost = totalDays * input.driverDailyWage;

  // Otoyol ücreti — km başına ~0.15₺ (tek yön, tır)
  const tollCost = Math.round(distance * trips * 0.15 * 2);

  // Yükleme/boşaltma
  const loadingCost = input.loadingUnloadCost * trips;

  const totalFreight = fuelCost + driverCost + tollCost + loadingCost;
  const perTonCost = input.tonnage > 0 ? totalFreight / input.tonnage : 0;
  const totalHarvest = input.dekarArea * input.yieldPerDekar;
  const perDekarCost = totalHarvest > 0 ? (totalFreight * (input.tonnage / totalHarvest)) / input.dekarArea : 0;

  return {
    distanceKm: distance,
    fuelCost: Math.round(fuelCost),
    driverCost,
    tollCost,
    loadingCost,
    totalFreight: Math.round(totalFreight),
    perTonCost: Math.round(perTonCost),
    perDekarCost: Math.round(perDekarCost),
  };
}

// İl listesi (provinces81'den)
export const cityList: string[] = provinces81.map((p) => p.city);
