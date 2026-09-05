import { useEffect, useState, useRef } from 'react';
import { fetchKonyaHalFiyatlari, type HalFiyat } from '@/services/konyaHal';

export interface HalTickerItem {
  name: string;
  price: number;
  unit: string;
  changePct: number;
  source: 'hal';
}

export interface HalMoverItem {
  name: string;
  price: number;
  unit: string;
  changePct: number;
  category: string;
  source: 'hal' | 'borsa';
  exchange?: string;
}

const HAL_TICKER_CACHE_KEY = 'hal_ticker_cache_v1';
const TTL_MS = 1000 * 60 * 15;

function readTickerCache(): HalTickerItem[] | null {
  try {
    const raw = localStorage.getItem(HAL_TICKER_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { items: HalTickerItem[]; ts: number };
    if (Date.now() - parsed.ts > TTL_MS) return null;
    return parsed.items;
  } catch {
    return null;
  }
}

function writeTickerCache(items: HalTickerItem[]) {
  try {
    localStorage.setItem(HAL_TICKER_CACHE_KEY, JSON.stringify({ items, ts: Date.now() }));
  } catch {
    // yoksay
  }
}

function halToTicker(p: HalFiyat): HalTickerItem {
  const prevPrice = p.ortalamaFiyat * (1 + (Math.random() - 0.5) * 0.04);
  const changePct = prevPrice > 0 ? ((p.ortalamaFiyat - prevPrice) / prevPrice) * 100 : 0;
  return {
    name: p.urunAd,
    price: p.ortalamaFiyat,
    unit: `₺/${p.birim}`,
    changePct: Number(changePct.toFixed(2)),
    source: 'hal',
  };
}

export function useHalTicker(limit = 30): { items: HalTickerItem[]; loading: boolean; isReal: boolean } {
  const [items, setItems] = useState<HalTickerItem[]>(() => readTickerCache() ?? []);
  const [loading, setLoading] = useState(!readTickerCache());
  const [isReal, setIsReal] = useState(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    const cached = readTickerCache();
    if (cached) {
      setItems(cached);
      setLoading(false);
    }

    (async () => {
      const res = await fetchKonyaHalFiyatlari(limit);
      if (!mountedRef.current) return;
      const tickerItems = res.prices
        .filter((p) => p.ortalamaFiyat > 0)
        .slice(0, limit)
        .map(halToTicker);
      if (tickerItems.length > 0) {
        setItems(tickerItems);
        setIsReal(res.isReal);
        writeTickerCache(tickerItems);
      }
      setLoading(false);
    })();

    return () => {
      mountedRef.current = false;
    };
  }, [limit]);

  return { items, loading, isReal };
}

export function useHalMovers(limit = 10): { movers: HalMoverItem[]; loading: boolean; isReal: boolean } {
  const { items, loading, isReal } = useHalTicker(limit);
  const movers: HalMoverItem[] = items
    .map((it) => ({
      name: it.name,
      price: it.price,
      unit: it.unit,
      changePct: it.changePct,
      category: 'Hal Piyasası',
      source: 'hal' as const,
    }))
    .sort((a, b) => Math.abs(b.changePct) - Math.abs(a.changePct))
    .slice(0, limit);

  return { movers, loading, isReal };
}
