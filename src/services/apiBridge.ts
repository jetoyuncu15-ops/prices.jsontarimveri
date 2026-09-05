import { marketPrices } from '@/config/marketPrices';
import { fetchAllRemotePrices, matchProductToCommodityId, type MappedRemotePrice } from '@/services/remotePrices';

// ─────────────────────────────────────────────────────────────
// API BRIDGE — Offline-First veri köprüsü
//
// LIVE_DATA_MODE = true → GitHub'daki prices.json dosyasından
//                         ürün fiyatlarını çeker ve mevcut verilerle
//                         birleştirir.
// LIVE_DATA_MODE = false → sadece yerel marketPrices.ts'den okur
//
// İnternet koptuğunda veya GitHub erişilemediğinde sistem asla
// hata vermez; localStorage içindeki en son kaydedilmiş veriyi
// kullanır ve yerel fallback'e düşer.
// ─────────────────────────────────────────────────────────────

export const LIVE_DATA_MODE = true;

const CACHE_KEY = 'tarim_piyasa_cache_v2';
const CACHE_TTL_MS = 1000 * 60 * 60; // 1 saat

// ── Uzak API'den dönecek jenerik veri yapısı ──────────────────
export interface RemoteMarketPayload {
  indices: Record<string, number>;
  commodities: Record<string, { price: number; unit: string }>;
  iscilik?: { mevsimlikGunluk: number; surekliAylik: number };
  timestamp: string;
}

export interface MarketSnapshot {
  indices: Record<string, number>;
  commodities: Record<string, { price: number; unit: string }>;
  iscilik: { mevsimlikGunluk: number; surekliAylik: number };
  timestamp: string;
  source: 'local' | 'remote' | 'cache';
  remotePrices?: MappedRemotePrice[];
}

// ── Yerel fallback anlık görüntüsü ────────────────────────────
function localSnapshot(): MarketSnapshot {
  return {
    indices: { ...marketPrices.indices },
    commodities: { ...marketPrices.commodities },
    iscilik: { ...marketPrices.iscilik },
    timestamp: new Date().toISOString(),
    source: 'local',
  };
}

// ── localStorage cache oku ────────────────────────────────────
function readCache(): MarketSnapshot | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as MarketSnapshot;
    if (!parsed.indices || !parsed.commodities) return null;
    return parsed;
  } catch {
    return null;
  }
}

// ── localStorage cache yaz ────────────────────────────────────
function writeCache(snapshot: MarketSnapshot): void {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(snapshot));
  } catch {
    // localStorage dolu veya erişilemez — sessizce yoksay
  }
}

// ── GitHub JSON'den veri çek + mevcut commodities ile birleştir ─
async function fetchRemote(): Promise<MarketSnapshot | null> {
  if (!LIVE_DATA_MODE) return null;

  try {
    const { prices: remotePrices, source } = await fetchAllRemotePrices();

    if (source === 'local' || remotePrices.length === 0) return null;

    // Remote fiyatları mevcut commodity ID'leriyle eşleştir
    const mergedCommodities = { ...marketPrices.commodities };
    for (const rp of remotePrices) {
      const commodityId = matchProductToCommodityId(rp.product);
      if (commodityId && mergedCommodities[commodityId as keyof typeof mergedCommodities]) {
        mergedCommodities[commodityId as keyof typeof mergedCommodities] = {
          price: rp.price,
          unit: rp.unit,
        };
      }
    }

    const snapshot: MarketSnapshot = {
      indices: { ...marketPrices.indices },
      commodities: mergedCommodities,
      iscilik: { ...marketPrices.iscilik },
      timestamp: new Date().toISOString(),
      source: 'remote',
      remotePrices,
    };

    writeCache(snapshot);
    return snapshot;
  } catch {
    return null; // hata fırlatma — sessizce cache'e düş
  }
}

// ── Ana erişim fonksiyonu: remote → cache → local ──────────────
export async function loadMarketSnapshot(): Promise<MarketSnapshot> {
  // 1) Uzak API (eğer açıksa)
  const remote = await fetchRemote();
  if (remote) return remote;

  // 2) localStorage cache (TTL içindeyse)
  const cached = readCache();
  if (cached) {
    const age = Date.now() - new Date(cached.timestamp).getTime();
    if (age < CACHE_TTL_MS) return { ...cached, source: 'cache' };
  }

  // 3) Yerel fallback
  return localSnapshot();
}

// ── Arka plan sessiz yenileme (online event tetiklediğinde) ────
export function syncMarketCache(): void {
  if (!LIVE_DATA_MODE) return;
  fetchRemote().then((snap) => {
    if (snap) writeCache(snap);
  });
}

// ── Cache'i temizle (ayarlar / debug) ──────────────────────────
export function clearMarketCache(): void {
  try {
    localStorage.removeItem(CACHE_KEY);
  } catch {
    // yoksay
  }
}
