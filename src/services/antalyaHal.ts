import type { HalFiyat, HalFiyatResponse } from '@/services/konyaHal';

// ─────────────────────────────────────────────────────────────
// ANTALYA HAL — GitHub JSON'dan Antalya Toptancı Hal fiyatları
//
// Kullanıcı GitHub'daki antalya-hal.json dosyasını günceller.
// Bu servis dosyayı çekip HalFiyat formatına dönüştürür.
// ─────────────────────────────────────────────────────────────

const REMOTE_URL = 'https://raw.githubusercontent.com/jetoyuncu15-ops/prices.jsontarimveri/refs/heads/main/public/antalya-hal.json';
const LOCAL_FALLBACK_URL = '/antalya-hal.json';

const CACHE_KEY = 'antalya_hal_cache_v1';
const CACHE_TTL_MS = 1000 * 60 * 30;

interface AntalyaHalItem {
  product: string;
  unit: string;
  minPrice: string;
  maxPrice: string;
}

interface AntalyaHalCategory {
  category: string;
  market: string;
  date: string;
  items: AntalyaHalItem[];
}

function parseTrNumber(value: string): number {
  const cleaned = value.replace(/\./g, '').replace(',', '.').replace(/[^0-9.\-]/g, '');
  const n = parseFloat(cleaned);
  return isNaN(n) ? 0 : n;
}

function mapToHalFiyat(entry: AntalyaHalCategory): HalFiyat[] {
  const isMeyve = entry.category.toLowerCase().includes('meyve') || entry.category.toLowerCase().includes('ithal');
  return entry.items.map((item) => {
    const min = parseTrNumber(item.minPrice);
    const max = parseTrNumber(item.maxPrice);
    const ort = min && max ? Number(((min + max) / 2).toFixed(2)) : 0;
    return {
      tarih: entry.date,
      urunAd: item.product,
      birim: item.unit.toLowerCase() === 'kg' ? 'kg' : item.unit.toLowerCase(),
      tur: isMeyve ? 1 : 0,
      turLabel: isMeyve ? 'Meyve' : 'Sebze',
      enDusukFiyat: min,
      enYuksekFiyat: max,
      ortalamaFiyat: ort,
    };
  });
}

function readCache(): HalFiyatResponse | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as HalFiyatResponse;
    if (!parsed.prices) return null;
    return parsed;
  } catch {
    return null;
  }
}

function writeCache(data: HalFiyatResponse): void {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(data));
  } catch {
    // yoksay
  }
}

export async function fetchAntalyaHalFiyatlari(): Promise<HalFiyatResponse> {
  const cached = readCache();
  if (cached) {
    const age = Date.now() - new Date(cached.timestamp).getTime();
    if (age < CACHE_TTL_MS) return cached;
  }

  const errors: string[] = [];

  for (const [name, url] of [
    ['github', REMOTE_URL],
    ['local', LOCAL_FALLBACK_URL],
  ] as const) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8000);

      const res = await fetch(url, {
        signal: controller.signal,
        headers: { 'Content-Type': 'application/json' },
      });
      clearTimeout(timeout);

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data: AntalyaHalCategory[] = await res.json();

      if (!Array.isArray(data)) throw new Error('Geçersiz format: dizi bekleniyor');

      const prices = data.flatMap(mapToHalFiyat);
      const isReal = name === 'github';

      const response: HalFiyatResponse = {
        prices,
        total: prices.length,
        timestamp: new Date().toISOString(),
        source: isReal ? 'Antalya Toptancı Hal (GitHub JSON — canlı)' : 'Antalya Toptancı Hal (yerel dosya)',
        isReal,
      };

      writeCache(response);
      return response;
    } catch (error) {
      errors.push(`${name}: ${(error as Error).message}`);
    }
  }

  if (cached) return { ...cached, error: errors.join(' | ') };

  return {
    prices: [],
    total: 0,
    timestamp: new Date().toISOString(),
    source: 'Antalya Toptancı Hal',
    isReal: false,
    error: errors.join(' | '),
  };
}
