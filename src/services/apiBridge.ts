import { marketPrices } from '@/config/marketPrices';

// ─────────────────────────────────────────────────────────────
// API BRIDGE — Offline-First veri köprüsü
//
// LIVE_DATA_MODE = false → yerel marketPrices.ts dosyasından okur
// LIVE_DATA_MODE = true  → uzak API/JSON endpoint'inden çekmeye çalışır
//                          (gelecekte Supabase veya GitHub JSON bağlanacak)
//
// İnternet koptuğunda veya API çöktüğünde sistem asla hata vermez;
// localStorage içindeki en son kaydedilmiş (cached) veriyi kullanır.
// ─────────────────────────────────────────────────────────────

export const LIVE_DATA_MODE = false;

// Gelecekte canlı API adresi buraya yazılacak
const REMOTE_API_URL = '';

const CACHE_KEY = 'tarim_piyasa_cache_v1';
const CACHE_TTL_MS = 1000 * 60 * 60; // 1 saat

// ── Uzak API'den dönecek jenerik veri yapısı ──────────────────
// İleride lisanslı borsa API'si entegre edildiğinde, bu interface'in
// yapısını değiştirmeden sadece mapRemotePayload fonksiyonunu güncellemek
// yeterli olacak. Arayüzdeki hiçbir komponent değişmeyecek.
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

// ── Uzak API'den veri çek + jenerik map ───────────────────────
// Gelecekte farklı borsa API'lerinden dönen farklı formatları
// bu fonksiyon içinde RemoteMarketPayload'a dönüştürürüz.
// Arayüz katmanı sadece MarketSnapshot tipini görür.
async function fetchRemote(): Promise<MarketSnapshot | null> {
  if (!LIVE_DATA_MODE || !REMOTE_API_URL) return null;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    const res = await fetch(REMOTE_API_URL, {
      signal: controller.signal,
      headers: { 'Content-Type': 'application/json' },
    });
    clearTimeout(timeout);

    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const payload = (await res.json()) as RemoteMarketPayload;
    const snapshot: MarketSnapshot = {
      indices: payload.indices ?? { ...marketPrices.indices },
      commodities: payload.commodities ?? { ...marketPrices.commodities },
      iscilik: payload.iscilik ?? { ...marketPrices.iscilik },
      timestamp: payload.timestamp ?? new Date().toISOString(),
      source: 'remote',
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
