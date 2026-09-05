export interface HalFiyat {
  tarih: string;
  urunAd: string;
  birim: string;
  tur: number;
  turLabel: string;
  enDusukFiyat: number;
  enYuksekFiyat: number;
  ortalamaFiyat: number;
}

export interface HalFiyatResponse {
  prices: HalFiyat[];
  total: number;
  timestamp: string;
  source: string;
  isReal: boolean;
  error?: string;
}

const CACHE_KEY = 'konya_hal_cache_v1';
const CACHE_TTL_MS = 1000 * 60 * 30;

const RESOURCE_ID = '532c336b-b3b4-42f9-ae46-44d0597e3ff9';
const CKAN_BASE = 'https://acikveri.konya.bel.tr/api/3/action/datastore_search';

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

interface CkanRecord {
  tarih?: string;
  urun_ad?: string;
  birim?: string;
  tur?: number;
  en_dusuk_fiyat?: number;
  en_yuksek_fiyat?: number;
}

interface CkanResponse {
  success?: boolean;
  result?: {
    records?: CkanRecord[];
    total?: number;
  };
}

function mapRecords(records: CkanRecord[]): HalFiyat[] {
  return records.map((r) => {
    const dusuk = Number(r.en_dusuk_fiyat ?? 0);
    const yuksek = Number(r.en_yuksek_fiyat ?? 0);
    return {
      tarih: String(r.tarih ?? ''),
      urunAd: String(r.urun_ad ?? ''),
      birim: String(r.birim ?? 'kg'),
      tur: Number(r.tur ?? 0),
      turLabel: Number(r.tur) === 1 ? 'Meyve' : 'Sebze',
      enDusukFiyat: dusuk,
      enYuksekFiyat: yuksek,
      ortalamaFiyat: dusuk && yuksek ? Number(((dusuk + yuksek) / 2).toFixed(2)) : 0,
    };
  });
}

function buildResponse(records: CkanRecord[], total: number): HalFiyatResponse {
  return {
    prices: mapRecords(records),
    total,
    timestamp: new Date().toISOString(),
    source: 'Konya Büyükşehir Belediyesi Açık Veri Portalı',
    isReal: true,
  };
}

async function tryCorsproxy(limit: number): Promise<HalFiyatResponse> {
  const targetUrl = `${CKAN_BASE}?resource_id=${RESOURCE_ID}&limit=${limit}`;
  const proxyUrl = `https://corsproxy.io/?url=${encodeURIComponent(targetUrl)}`;

  const response = await fetch(proxyUrl);
  if (!response.ok) throw new Error(`corsproxy HTTP ${response.status}`);

  const data: CkanResponse = await response.json();
  if (!data.success || !data.result?.records) {
    throw new Error('corsproxy: geçersiz CKAN yanıtı');
  }

  return buildResponse(data.result.records, data.result.total ?? data.result.records.length);
}

async function tryEdgeFunction(limit: number): Promise<HalFiyatResponse> {
  const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/konya-hal?limit=${limit}`;
  const response = await fetch(apiUrl, {
    headers: {
      Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({ error: `HTTP ${response.status}` }));
    throw new Error(errorBody.error || `Edge Function HTTP ${response.status}`);
  }

  const data = (await response.json()) as HalFiyatResponse;
  if (!data.prices || !Array.isArray(data.prices)) {
    throw new Error('Edge Function: geçersiz yanıt');
  }

  return data;
}

export async function fetchKonyaHalFiyatlari(limit = 50): Promise<HalFiyatResponse> {
  const cached = readCache();
  if (cached) {
    const age = Date.now() - new Date(cached.timestamp).getTime();
    if (age < CACHE_TTL_MS) return cached;
  }

  const errors: string[] = [];

  for (const [name, fn] of [
    ['corsproxy.io', tryCorsproxy],
    ['edge-function', tryEdgeFunction],
  ] as const) {
    try {
      const result = await fn(limit);
      writeCache(result);
      return result;
    } catch (error) {
      errors.push(`${name}: ${(error as Error).message}`);
    }
  }

  if (cached) return { ...cached, error: errors.join(' | ') };
  return {
    prices: [],
    total: 0,
    timestamp: new Date().toISOString(),
    source: 'Konya Büyükşehir Belediyesi Açık Veri Portalı',
    isReal: false,
    error: errors.join(' | '),
  };
}
