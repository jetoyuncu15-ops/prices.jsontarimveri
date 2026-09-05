// ─────────────────────────────────────────────────────────────
// REMOTE PRICES — GitHub JSON'dan tarım fiyatlarını çeker
//
// Kullanıcı GitHub'daki prices.json dosyasını her gün günceller.
// Bu servis dosyayı çekip parse eder, uygulamanın kullanduğu
// Commodity / TickerItem / ExchangeQuote tiplerine dönüştürür.
//
// Aynı formatta ek JSON dosyaları (ör: livestock.json, hal.json)
// eklendiğinde DATA_SOURCES listesine yeni bir kayıt girilmesi
// yeterlidir — geri kalan kod otomatik çalışır.
// ─────────────────────────────────────────────────────────────

export interface RemotePriceEntry {
  product: string;
  price: string;
  unit: string;
  change: string;
  trend: 'up' | 'down';
  low: string;
  high: string;
  market: string;
  category: string;
}

export interface RemotePricesFile {
  meta?: {
    source?: string;
    lastUpdated?: string;
    currency?: string;
    note?: string;
  };
  regions?: string[];
  prices: RemotePriceEntry[];
}

export interface MappedRemotePrice {
  product: string;
  price: number;
  unit: string;
  changePct: number;
  changeAbs: number;
  low: number;
  high: number;
  market: string;
  category: string;
  trend: 'up' | 'down';
}

// ── Veri kaynakları listesi ────────────────────────────────────
// Yeni bir GitHub JSON dosyası eklendiğinde buraya bir satır ekleyin.
// fetchAllRemotePrices() hepsini paralel çekip birleştirir.
export const DATA_SOURCES = {
  prices: {
    url: 'https://raw.githubusercontent.com/jetoyuncu15-ops/prices.jsontarimveri/refs/heads/main/public/prices.json',
    enabled: true,
  },
} as const;

// ── Türkçe sayı formatını parse et ("17,21" → 17.21) ───────────
function parseTrNumber(value: string): number {
  const cleaned = value.replace(/\./g, '').replace(',', '.').replace(/[^0-9.\-]/g, '');
  const n = parseFloat(cleaned);
  return isNaN(n) ? 0 : n;
}

// ── Değişim yüzdesini çıkar ("+0,94 TL" → 0.94 mutlak, yüzdesini hesapla) ──
function parseChange(changeStr: string, currentPrice: number): { changeAbs: number; changePct: number } {
  const abs = parseTrNumber(changeStr);
  if (currentPrice > 0 && abs !== 0) {
    return { changeAbs: abs, changePct: (abs / (currentPrice - abs)) * 100 };
  }
  return { changeAbs: abs, changePct: 0 };
}

// ── Tek bir GitHub JSON dosyasını çek ve map et ────────────────
export async function fetchRemotePrices(
  url: string,
): Promise<MappedRemotePrice[]> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    const res = await fetch(url, {
      signal: controller.signal,
      headers: { 'Content-Type': 'application/json' },
    });
    clearTimeout(timeout);

    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const data: RemotePricesFile = await res.json();

    if (!data.prices || !Array.isArray(data.prices)) {
      throw new Error('Geçersiz JSON formatı: prices dizisi bulunamadı');
    }

    return data.prices.map((entry) => {
      const price = parseTrNumber(entry.price);
      const { changeAbs, changePct } = parseChange(entry.change, price);
      return {
        product: entry.product,
        price,
        unit: entry.unit.replace('TL / KG', '₺/kg').replace('TL / LT', '₺/lt'),
        changePct: Number(changePct.toFixed(2)),
        changeAbs,
        low: parseTrNumber(entry.low),
        high: parseTrNumber(entry.high),
        market: entry.market,
        category: entry.category,
        trend: entry.trend,
      };
    });
  } catch (error) {
    console.warn(`[RemotePrices] ${url} çekilemedi:`, error);
    return [];
  }
}

// ── Tüm aktif kaynakları paralel çek ───────────────────────────
export async function fetchAllRemotePrices(): Promise<{
  prices: MappedRemotePrice[];
  timestamp: string;
  source: 'remote' | 'local';
}> {
  const activeSources = Object.values(DATA_SOURCES).filter((s) => s.enabled);

  const results = await Promise.all(
    activeSources.map((s) => fetchRemotePrices(s.url)),
  );

  const allPrices = results.flat();

  if (allPrices.length === 0) {
    return { prices: [], timestamp: new Date().toISOString(), source: 'local' };
  }

  return {
    prices: allPrices,
    timestamp: new Date().toISOString(),
    source: 'remote',
  };
}

// ── Commodity ID'ye ürün adı eşleştir ─────────────────────────
// "Buğday" → "bugday", "Mercimek" → "mercimek" gibi
const PRODUCT_ALIASES: Record<string, string> = {
  'buğday': 'bugday',
  'mısır': 'misir',
  'arpa': 'arpa',
  'mercimek': 'mercimek',
  'nohut': 'nohut',
  'kuru fasulye': 'fasulye',
  'pamuk': 'pamuk',
  'ayçiçeği': 'aycicegi',
  'süt': 'sut',
};

export function matchProductToCommodityId(productName: string): string | null {
  const lower = productName.toLowerCase();

  // Önce tam eşleşme
  for (const [alias, id] of Object.entries(PRODUCT_ALIASES)) {
    if (lower === alias || lower.includes(alias)) return id;
  }

  // Grup bazlı eşleşme (ör: "1. Grup Makarnalık Buğday" → "bugday")
  if (lower.includes('buğday') || lower.includes('makarnalık')) return 'bugday';
  if (lower.includes('mısır')) return 'misir';
  if (lower.includes('arpa')) return 'arpa';
  if (lower.includes('mercimek')) return 'mercimek';
  if (lower.includes('nohut')) return 'nohut';
  if (lower.includes('fasulye')) return 'fasulye';
  if (lower.includes('pamuk')) return 'pamuk';
  if (lower.includes('ayçiçe') || lower.includes('aycice')) return 'aycicegi';
  if (lower.includes('süt') || lower.includes('sut')) return 'sut';

  return null;
}
