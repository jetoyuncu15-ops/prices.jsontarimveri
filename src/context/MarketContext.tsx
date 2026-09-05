import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { loadMarketSnapshot, syncMarketCache, type MarketSnapshot } from '@/services/apiBridge';
import { marketPrices } from '@/config/marketPrices';
import type { MappedRemotePrice } from '@/services/remotePrices';

// ─────────────────────────────────────────────────────────────
// MARKET CONTEXT — Merkezi veri sağlayıcı
//
// Arayüzdeki tüm komponentler (Gösterge Paneli, Emtia Analizi,
// Teknik Analiz, Karşılaştırma) veriyi sadece buradan tüketir.
// Hiçbir komponent verinin nereden geldiğini (GitHub/local/cache)
// bilmez. GitHub'daki prices.json güncellendiğinde sadece
// apiBridge.ts içindeki fetchRemote değişir; arayüzdeki tek
// satır kod değişmez.
//
// Girdi Maliyet Endeksi = 5 alt endeksin (gübre + mazot + tohum
// + sulama + işçilik) aritmetik ortalaması — saniyelik dalgalanmayla
// gerçek zamanlı hesaplanır.
// ─────────────────────────────────────────────────────────────

export interface IndexState {
  endIndex: number;
  changePct: number;
  timestamp: string;
}

export interface SulamaState extends IndexState {
  ptfPrice: number;
  isReal: boolean;
  source: string;
}

export interface IscilikState extends IndexState {
  mevsimlikGunluk: number;
  surekliAylik: number;
}

export interface MarketData {
  gubre: IndexState;
  mazot: IndexState;
  tohum: IndexState;
  sulama: SulamaState;
  iscilik: IscilikState;
  girdiMaliyet: IndexState;
  snapshot: MarketSnapshot;
  remotePrices: MappedRemotePrice[];
  dataSource: 'local' | 'remote' | 'cache';
}

interface MarketContextValue {
  data: MarketData;
  loading: boolean;
}

const initialSnapshot: MarketSnapshot = {
  indices: { ...marketPrices.indices },
  commodities: { ...marketPrices.commodities },
  iscilik: { ...marketPrices.iscilik },
  timestamp: new Date().toISOString(),
  source: 'local',
};

function makeIndex(base: number): IndexState {
  return { endIndex: base, changePct: 0, timestamp: new Date().toISOString() };
}

const initialData: MarketData = {
  gubre: makeIndex(marketPrices.indices.gubre),
  mazot: makeIndex(marketPrices.indices.mazot),
  tohum: makeIndex(marketPrices.indices.tohum),
  sulama: {
    ...makeIndex(marketPrices.indices.sulama),
    ptfPrice: marketPrices.indices.sulama / 504,
    isReal: false,
    source: 'Güvenli varsayılan değer',
  },
  iscilik: {
    ...makeIndex(marketPrices.indices.iscilik),
    mevsimlikGunluk: marketPrices.iscilik.mevsimlikGunluk,
    surekliAylik: marketPrices.iscilik.surekliAylik,
  },
  girdiMaliyet: makeIndex(marketPrices.indices.girdiMaliyet),
  snapshot: initialSnapshot,
  remotePrices: [],
  dataSource: 'local',
};

const MarketContext = createContext<MarketContextValue>({
  data: initialData,
  loading: true,
});

export function useMarket() {
  return useContext(MarketContext);
}

// ±% dalgalanma üret (simülasyon)
function fluctuate(value: number, pct: number): number {
  const f = (Math.random() - 0.5) * pct;
  return Number((value * (1 + f / 100)).toFixed(2));
}

export function MarketProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<MarketData>(initialData);
  const [loading, setLoading] = useState(true);

  // İlk açılışta snapshot yükle (remote → cache → local)
  useEffect(() => {
    let active = true;
    loadMarketSnapshot().then((snap) => {
      if (!active) return;
      setData((prev) => ({
        ...prev,
        gubre: { ...prev.gubre, endIndex: snap.indices.gubre ?? prev.gubre.endIndex },
        mazot: { ...prev.mazot, endIndex: snap.indices.mazot ?? prev.mazot.endIndex },
        tohum: { ...prev.tohum, endIndex: snap.indices.tohum ?? prev.tohum.endIndex },
        sulama: {
          ...prev.sulama,
          endIndex: snap.indices.sulama ?? prev.sulama.endIndex,
          source: snap.source === 'remote' ? 'Canlı API' : prev.sulama.source,
          isReal: snap.source === 'remote',
        },
        iscilik: {
          ...prev.iscilik,
          endIndex: snap.indices.iscilik ?? prev.iscilik.endIndex,
          mevsimlikGunluk: snap.iscilik.mevsimlikGunluk ?? prev.iscilik.mevsimlikGunluk,
          surekliAylik: snap.iscilik.surekliAylik ?? prev.iscilik.surekliAylik,
        },
        snapshot: snap,
        remotePrices: snap.remotePrices ?? [],
        dataSource: snap.source,
      }));
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, []);

  // Online event'te sessiz arka plan yenileme
  useEffect(() => {
    const onOnline = () => syncMarketCache();
    window.addEventListener('online', onOnline);
    return () => window.removeEventListener('online', onOnline);
  }, []);

  // 5 dakikada bir remote veriyi sessizce yenile
  useEffect(() => {
    const interval = setInterval(() => {
      loadMarketSnapshot().then((snap) => {
        setData((prev) => ({
          ...prev,
          snapshot: snap,
          remotePrices: snap.remotePrices ?? [],
          dataSource: snap.source,
        }));
      });
    }, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // Saniyelik canlı dalgalanma — 5 endeks + girdi maliyet ortalaması
  useEffect(() => {
    const interval = setInterval(() => {
      setData((prev) => {
        const gubre = {
          ...prev.gubre,
          endIndex: fluctuate(prev.gubre.endIndex, 0.04),
          changePct: Number(((prev.gubre.endIndex - marketPrices.indices.gubre) / marketPrices.indices.gubre * 100).toFixed(3)),
          timestamp: new Date().toISOString(),
        };
        const mazot = {
          ...prev.mazot,
          endIndex: fluctuate(prev.mazot.endIndex, 0.04),
          changePct: Number(((prev.mazot.endIndex - marketPrices.indices.mazot) / marketPrices.indices.mazot * 100).toFixed(3)),
          timestamp: new Date().toISOString(),
        };
        const tohum = {
          ...prev.tohum,
          endIndex: fluctuate(prev.tohum.endIndex, 0.06),
          changePct: Number(((prev.tohum.endIndex - marketPrices.indices.tohum) / marketPrices.indices.tohum * 100).toFixed(3)),
          timestamp: new Date().toISOString(),
        };
        const sulama = {
          ...prev.sulama,
          endIndex: fluctuate(prev.sulama.endIndex, 0.04),
          changePct: Number(((prev.sulama.endIndex - marketPrices.indices.sulama) / marketPrices.indices.sulama * 100).toFixed(3)),
          timestamp: new Date().toISOString(),
        };
        const iscilik = {
          ...prev.iscilik,
          endIndex: fluctuate(prev.iscilik.endIndex, 0.04),
          changePct: Number(((prev.iscilik.endIndex - marketPrices.indices.iscilik) / marketPrices.indices.iscilik * 100).toFixed(3)),
          mevsimlikGunluk: Math.round(marketPrices.iscilik.mevsimlikGunluk * (1 + ((Math.random() - 0.5) * 0.04) / 100)),
          surekliAylik: Math.round(marketPrices.iscilik.surekliAylik * (1 + ((Math.random() - 0.5) * 0.04) / 100)),
          timestamp: new Date().toISOString(),
        };

        // Girdi Maliyet Endeksi = 5 alt endeksin aritmetik ortalaması
        const avgIndex = Number(
          ((gubre.endIndex + mazot.endIndex + tohum.endIndex + sulama.endIndex + iscilik.endIndex) / 5).toFixed(2),
        );
        const avgChange = Number(
          ((gubre.changePct + mazot.changePct + tohum.changePct + sulama.changePct + iscilik.changePct) / 5).toFixed(3),
        );
        const girdiMaliyet: IndexState = {
          endIndex: avgIndex,
          changePct: avgChange,
          timestamp: new Date().toISOString(),
        };

        return { ...prev, gubre, mazot, tohum, sulama, iscilik, girdiMaliyet };
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const value = useMemo(() => ({ data, loading }), [data, loading]);

  return <MarketContext.Provider value={value}>{children}</MarketContext.Provider>;
}
