// İklim Risk Sigortası & NDVI — mock veri ve hesaplama yardımcıları

import { provinces81 } from '@/lib/provinces';

// ── İklim verisi (mock) ──────────────────────────────────────
export interface ClimateData {
  city: string;
  avgTemp: number;       // °C — son 30 gün ort.
  maxTemp: number;       // °C — son 30 gün en yüksek
  minTemp: number;       // °C — son 30 gün en düşük
  rainfall: number;       // mm — son 30 gün toplam
  humidity: number;       // % — ortalama nem
  droughtIndex: number;   // 0-100 (yüksek = kurak)
  frostRiskDays: number;  // don riskli gün sayısı
  windSpeed: number;      // km/s — ortalama rüzgâr
}

function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

export const climateData: ClimateData[] = provinces81.map((p) => {
  const h = hash(p.city);
  const baseTemp = 12 + ((h % 120) / 10) - 6;
  return {
    city: p.city,
    avgTemp: Math.round(baseTemp * 10) / 10,
    maxTemp: Math.round((baseTemp + 8 + ((h % 50) / 10)) * 10) / 10,
    minTemp: Math.round((baseTemp - 8 - ((h % 40) / 10)) * 10) / 10,
    rainfall: Math.round(5 + (h % 120)),
    humidity: 35 + (h % 50),
    droughtIndex: 20 + (h % 70),
    frostRiskDays: h % 15,
    windSpeed: 8 + (h % 25),
  };
});

// ── TARSİM sigorta hesaplama ────────────────────────────────
export interface InsuranceInput {
  crop: string;
  city: string;
  area: number;          // dekar
  yieldPerDekar: number;  // kg/dekar
  unitPrice: number;      // ₺/kg
  coverageLevel: number;  // % teminat oranı (60-100)
}

export const defaultInsuranceInput: InsuranceInput = {
  crop: 'Buğday',
  city: 'Konya',
  area: 1000,
  yieldPerDekar: 450,
  unitPrice: 13.5,
  coverageLevel: 80,
};

export interface InsuranceResult {
  totalValue: number;      // toplam ürün değeri ₺
  coverageAmount: number;  // teminat bedeli ₺
  basePremium: number;     // taban prim ₺
  droughtPremium: number;  // kuraklık prim eki ₺
  frostPremium: number;    // don prim eki ₺
  totalPremium: number;    // toplam prim ₺
  premiumRate: number;     // % prim oranı
  payoutDrought: number;   // kuraklık tazminatı ₺
  payoutFrost: number;     // don tazminatı ₺
  payoutHail: number;       // dolu tazminatı ₺
  riskScore: number;       // 0-100 risk skoru
  riskLevel: 'low' | 'medium' | 'high' | 'extreme';
}

export function calcInsurance(input: InsuranceInput): InsuranceResult {
  const climate = climateData.find((c) => c.city === input.city);
  if (!climate) {
    return { totalValue: 0, coverageAmount: 0, basePremium: 0, droughtPremium: 0, frostPremium: 0, totalPremium: 0, premiumRate: 0, payoutDrought: 0, payoutFrost: 0, payoutHail: 0, riskScore: 0, riskLevel: 'low' };
  }

  const totalValue = input.area * input.yieldPerDekar * input.unitPrice;
  const coverageAmount = totalValue * (input.coverageLevel / 100);

  // Taban prim — ürün değerine göre %1.5-3
  const baseRate = 0.015 + ((hash(input.crop) % 15) / 1000);
  const basePremium = coverageAmount * baseRate;

  // Kuraklık ek primi — droughtIndex'e göre
  const droughtFactor = climate.droughtIndex / 100;
  const droughtPremium = coverageAmount * 0.008 * droughtFactor;

  // Don ek primi — frostRiskDays'e göre
  const frostFactor = Math.min(1, climate.frostRiskDays / 15);
  const frostPremium = coverageAmount * 0.006 * frostFactor;

  const totalPremium = basePremium + droughtPremium + frostPremium;
  const premiumRate = totalValue > 0 ? (totalPremium / totalValue) * 100 : 0;

  // Tazminat oranları — afet durumunda
  const payoutDrought = Math.round(coverageAmount * 0.75 * droughtFactor);
  const payoutFrost = Math.round(coverageAmount * 0.65 * frostFactor);
  const payoutHail = Math.round(coverageAmount * 0.80);

  // Risk skoru
  const riskScore = Math.min(100, Math.round(
    climate.droughtIndex * 0.4 +
    climate.frostRiskDays * 3 +
    (100 - climate.rainfall) * 0.15 +
    climate.windSpeed * 0.3,
  ));

  const riskLevel: InsuranceResult['riskLevel'] =
    riskScore >= 75 ? 'extreme' :
    riskScore >= 55 ? 'high' :
    riskScore >= 35 ? 'medium' : 'low';

  return {
    totalValue: Math.round(totalValue),
    coverageAmount: Math.round(coverageAmount),
    basePremium: Math.round(basePremium),
    droughtPremium: Math.round(droughtPremium),
    frostPremium: Math.round(frostPremium),
    totalPremium: Math.round(totalPremium),
    premiumRate: Math.round(premiumRate * 100) / 100,
    payoutDrought,
    payoutFrost,
    payoutHail,
    riskScore,
    riskLevel,
  };
}

// ── NDVI (Uydu Tabanlı Tarla Sağlık Skoru) ───────────────────
export interface NdviCell {
  row: number;
  col: number;
  ndvi: number;  // -1 ile 1 arası (bizde 0-1)
  health: 'stressed' | 'moderate' | 'healthy' | 'vigorous';
}

export interface NdviField {
  city: string;
  fieldName: string;
  gridSize: number;  // NxN grid
  cells: NdviCell[];
  avgNdvi: number;
  healthScore: number;  // 0-100
  stressedPct: number;
  vigorousPct: number;
  trend: number[];  // 12 haftalık NDVI trendi
}

function ndviToHealth(v: number): NdviCell['health'] {
  if (v < 0.2) return 'stressed';
  if (v < 0.4) return 'moderate';
  if (v < 0.6) return 'healthy';
  return 'vigorous';
}

export const ndviColorMap: Record<NdviCell['health'], string> = {
  stressed: '#dc2626',   // kırmızı
  moderate: '#f59e0b',   // amber
  healthy: '#84cc16',    // lime
  vigorous: '#10b981',   // emerald
};

export function generateNdviField(city: string, fieldName: string, seed: number): NdviField {
  const h = hash(city + fieldName + seed);
  const gridSize = 12;
  const cells: NdviCell[] = [];
  let sum = 0;

  // Merkez daha verimli, kenarlar daha stresli
  for (let row = 0; row < gridSize; row++) {
    for (let col = 0; col < gridSize; col++) {
      const distFromCenter = Math.abs(row - gridSize / 2) + Math.abs(col - gridSize / 2);
      const centerBoost = 1 - distFromCenter / gridSize;
      const noise = ((hash(`${row}-${col}-${h}`) % 100) / 100 - 0.5) * 0.3;
      const baseNdvi = 0.35 + centerBoost * 0.35 + noise;
      const ndvi = Math.max(0.05, Math.min(0.92, Math.round(baseNdvi * 100) / 100));
      sum += ndvi;
      cells.push({ row, col, ndvi, health: ndviToHealth(ndvi) });
    }
  }

  const avgNdvi = Math.round((sum / cells.length) * 100) / 100;
  const healthScore = Math.round(avgNdvi * 100);
  const stressedPct = Math.round((cells.filter((c) => c.health === 'stressed').length / cells.length) * 100);
  const vigorousPct = Math.round((cells.filter((c) => c.health === 'vigorous').length / cells.length) * 100);

  // 12 haftalık trend
  const trend = Array.from({ length: 12 }).map((_, i) => {
    const t = avgNdvi * (0.7 + (i / 12) * 0.3 + (Math.sin(i + h) * 0.05));
    return Math.round(t * 100) / 100;
  });

  return { city, fieldName, gridSize, cells, avgNdvi, healthScore, stressedPct, vigorousPct, trend };
}

export const ndviFields: NdviField[] = [
  generateNdviField('Konya', 'Çumra Tarla 1', 1),
  generateNdviField('Konya', 'Karatay Tarla 2', 2),
  generateNdviField('İzmir', 'Torbalı Bağ 1', 3),
  generateNdviField('Antalya', 'Serik Seracılık', 4),
  generateNdviField('Adana', 'Yüreğir Pamuk Tarlası', 5),
  generateNdviField('Tekirdağ', 'Marmara Ayçiçeği', 6),
];

// ── İl listesi ──────────────────────────────────────────────
export const cityList: string[] = provinces81.map((p) => p.city);

// ── Ürün listesi ─────────────────────────────────────────────
export const cropList: { name: string; defaultYield: number; defaultPrice: number }[] = [
  { name: 'Buğday', defaultYield: 450, defaultPrice: 13.5 },
  { name: 'Arpa', defaultYield: 400, defaultPrice: 11.0 },
  { name: 'Mısır', defaultYield: 1100, defaultPrice: 8.5 },
  { name: 'Ayçiçeği', defaultYield: 280, defaultPrice: 27.0 },
  { name: 'Pamuk', defaultYield: 450, defaultPrice: 22.0 },
  { name: 'Şeker Pancarı', defaultYield: 5500, defaultPrice: 3.2 },
  { name: 'Patates', defaultYield: 3000, defaultPrice: 7.5 },
  { name: 'Domates', defaultYield: 5000, defaultPrice: 12.0 },
  { name: 'Antep Fıstığı', defaultYield: 120, defaultPrice: 180.0 },
  { name: 'Kayısı', defaultYield: 800, defaultPrice: 35.0 },
];
