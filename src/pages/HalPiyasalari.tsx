import { useEffect, useState, useMemo } from 'react';
import { Store, RefreshCw, AlertCircle, TrendingUp, TrendingDown, Calendar, MapPin, ChevronDown, Search, ArrowRight } from 'lucide-react';
import { fetchKonyaHalFiyatlari, type HalFiyat } from '@/services/konyaHal';
import { matchCommodityId } from '@/lib/mockData';
import { useNav } from '@/App';
import { cn } from '@/lib/cn';

interface MarketSource {
  id: string;
  name: string;
  city: string;
  type: 'ckan' | 'mock';
  description: string;
}

const MARKETS: MarketSource[] = [
  { id: 'konya', name: 'Konya Toptancı Hal', city: 'Konya', type: 'ckan', description: 'Konya Büyükşehir Açık Veri Portalı (canlı)' },
  { id: 'izmir', name: 'İzmir Toptancı Hal', city: 'İzmir', type: 'mock', description: 'İzmir Hal Bülteni (örnek veri)' },
  { id: 'istanbul', name: 'İstanbul Toptancı Hal', city: 'İstanbul', type: 'mock', description: 'İstanbul Hal Bülteni (örnek veri)' },
  { id: 'antalya', name: 'Antalya Toptancı Hal', city: 'Antalya', type: 'mock', description: 'Antalya Hal Bülteni (örnek veri)' },
];

const MOCK_MARKET_DATA: Record<string, HalFiyat[]> = {
  izmir: [
    { tarih: '2026-08-24', urunAd: 'Domates', birim: 'kg', tur: 0, turLabel: 'Sebze', enDusukFiyat: 28, enYuksekFiyat: 35, ortalamaFiyat: 31.5 },
    { tarih: '2026-08-24', urunAd: 'Salatalık', birim: 'kg', tur: 0, turLabel: 'Sebze', enDusukFiyat: 18, enYuksekFiyat: 22, ortalamaFiyat: 20 },
    { tarih: '2026-08-24', urunAd: 'Biber (Sivri)', birim: 'kg', tur: 0, turLabel: 'Sebze', enDusukFiyat: 32, enYuksekFiyat: 40, ortalamaFiyat: 36 },
    { tarih: '2026-08-24', urunAd: 'Patates', birim: 'kg', tur: 0, turLabel: 'Sebze', enDusukFiyat: 26, enYuksekFiyat: 32, ortalamaFiyat: 29 },
    { tarih: '2026-08-24', urunAd: 'Soğan (Kuru)', birim: 'kg', tur: 0, turLabel: 'Sebze', enDusukFiyat: 30, enYuksekFiyat: 38, ortalamaFiyat: 34 },
    { tarih: '2026-08-24', urunAd: 'Üzüm (Sultani)', birim: 'kg', tur: 1, turLabel: 'Meyve', enDusukFiyat: 45, enYuksekFiyat: 55, ortalamaFiyat: 50 },
    { tarih: '2026-08-24', urunAd: 'İncir', birim: 'kg', tur: 1, turLabel: 'Meyve', enDusukFiyat: 110, enYuksekFiyat: 130, ortalamaFiyat: 120 },
    { tarih: '2026-08-24', urunAd: 'Şeftali', birim: 'kg', tur: 1, turLabel: 'Meyve', enDusukFiyat: 38, enYuksekFiyat: 48, ortalamaFiyat: 43 },
  ],
  istanbul: [
    { tarih: '2026-08-24', urunAd: 'Domates', birim: 'kg', tur: 0, turLabel: 'Sebze', enDusukFiyat: 30, enYuksekFiyat: 38, ortalamaFiyat: 34 },
    { tarih: '2026-08-24', urunAd: 'Patates', birim: 'kg', tur: 0, turLabel: 'Sebze', enDusukFiyat: 28, enYuksekFiyat: 34, ortalamaFiyat: 31 },
    { tarih: '2026-08-24', urunAd: 'Soğan (Kuru)', birim: 'kg', tur: 0, turLabel: 'Sebze', enDusukFiyat: 32, enYuksekFiyat: 40, ortalamaFiyat: 36 },
    { tarih: '2026-08-24', urunAd: 'Limon', birim: 'kg', tur: 1, turLabel: 'Meyve', enDusukFiyat: 40, enYuksekFiyat: 50, ortalamaFiyat: 45 },
    { tarih: '2026-08-24', urunAd: 'Muz', birim: 'kg', tur: 1, turLabel: 'Meyve', enDusukFiyat: 55, enYuksekFiyat: 65, ortalamaFiyat: 60 },
    { tarih: '2026-08-24', urunAd: 'Portakal', birim: 'kg', tur: 1, turLabel: 'Meyve', enDusukFiyat: 30, enYuksekFiyat: 38, ortalamaFiyat: 34 },
  ],
  antalya: [
    { tarih: '2026-08-24', urunAd: 'Domates', birim: 'kg', tur: 0, turLabel: 'Sebze', enDusukFiyat: 25, enYuksekFiyat: 32, ortalamaFiyat: 28.5 },
    { tarih: '2026-08-24', urunAd: 'Salatalık', birim: 'kg', tur: 0, turLabel: 'Sebze', enDusukFiyat: 16, enYuksekFiyat: 20, ortalamaFiyat: 18 },
    { tarih: '2026-08-24', urunAd: 'Biber (Dolma)', birim: 'kg', tur: 0, turLabel: 'Sebze', enDusukFiyat: 35, enYuksekFiyat: 44, ortalamaFiyat: 39.5 },
    { tarih: '2026-08-24', urunAd: 'Patlıcan', birim: 'kg', tur: 0, turLabel: 'Sebze', enDusukFiyat: 22, enYuksekFiyat: 28, ortalamaFiyat: 25 },
    { tarih: '2026-08-24', urunAd: 'Karpuz', birim: 'kg', tur: 1, turLabel: 'Meyve', enDusukFiyat: 8, enYuksekFiyat: 12, ortalamaFiyat: 10 },
    { tarih: '2026-08-24', urunAd: 'Kavun', birim: 'kg', tur: 1, turLabel: 'Meyve', enDusukFiyat: 18, enYuksekFiyat: 24, ortalamaFiyat: 21 },
    { tarih: '2026-08-24', urunAd: 'Çilek', birim: 'kg', tur: 1, turLabel: 'Meyve', enDusukFiyat: 90, enYuksekFiyat: 110, ortalamaFiyat: 100 },
  ],
};

type Filter = 'all' | 'sebze' | 'meyve';

export function HalPiyasalari() {
  const { goTechnical } = useNav();
  const [selectedMarketId, setSelectedMarketId] = useState('konya');
  const [marketDropdownOpen, setMarketDropdownOpen] = useState(false);
  const [data, setData] = useState<HalFiyat[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isReal, setIsReal] = useState(false);
  const [source, setSource] = useState('');
  const [timestamp, setTimestamp] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const [query, setQuery] = useState('');

  const selectedMarket = useMemo(
    () => MARKETS.find((m) => m.id === selectedMarketId) ?? MARKETS[0],
    [selectedMarketId],
  );

  async function loadMarket(marketId: string) {
    const market = MARKETS.find((m) => m.id === marketId) ?? MARKETS[0];
    setLoading(true);
    setError(null);

    if (market.type === 'mock') {
      const mockData = MOCK_MARKET_DATA[marketId] ?? [];
      setData(mockData);
      setIsReal(false);
      setSource(`${market.name} — örnek veri`);
      setTimestamp(new Date().toISOString());
      setLoading(false);
      return;
    }

    const res = await fetchKonyaHalFiyatlari(100);
    setData(res.prices);
    setIsReal(res.isReal);
    setSource(res.source);
    setTimestamp(res.timestamp);
    if (res.error && !res.isReal) setError(res.error);
    setLoading(false);
  }

  useEffect(() => {
    loadMarket(selectedMarketId);
  }, [selectedMarketId]);

  const filtered = data.filter((p) => {
    if (filter === 'sebze' && p.tur !== 0) return false;
    if (filter === 'meyve' && p.tur !== 1) return false;
    if (query && !p.urunAd.toLowerCase().includes(query.toLowerCase())) return false;
    return true;
  });

  const sebzeCount = data.filter((p) => p.tur === 0).length;
  const meyveCount = data.filter((p) => p.tur === 1).length;

  return (
    <div className="space-y-5">
      {/* Piyasa seçici */}
      <div className="card overflow-visible p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400 ring-1 ring-amber-500/20">
              <Store className="h-7 w-7" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">{selectedMarket.name}</h2>
              <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-slate-500">
                <span className="flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" /> {selectedMarket.city}
                </span>
                <span className="h-3 w-px bg-ink-600" />
                <span>{selectedMarket.description}</span>
                {isReal && (
                  <span className="flex items-center gap-1 rounded-md bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-300 ring-1 ring-emerald-500/20">
                    <span className="h-1.5 w-1.5 animate-pulse-dot rounded-full bg-emerald-400" /> Canlı
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Hal değiştir dropdown */}
          <div className="relative">
            <button
              onClick={() => setMarketDropdownOpen((o) => !o)}
              className="ring-focus flex items-center gap-2 rounded-lg border border-ink-700 bg-ink-850 px-4 py-2.5 text-sm font-medium text-slate-200 hover:border-ink-600"
            >
              <Store className="h-4 w-4 text-amber-400" />
              Hal Değiştir
              <ChevronDown className={cn('h-4 w-4 text-slate-500 transition-transform', marketDropdownOpen && 'rotate-180')} />
            </button>
            {marketDropdownOpen && (
              <>
                <div className="fixed inset-0 z-[99998]" onClick={() => setMarketDropdownOpen(false)} />
                <div className="absolute right-0 top-full z-[99999] mt-2 w-80 overflow-y-auto rounded-lg border border-ink-700 bg-ink-900 shadow-2xl pointer-events-auto">
                  <div className="sticky top-0 bg-ink-900 px-3 py-2 text-[10px] font-medium uppercase tracking-wider text-slate-600">
                    Hal Piyasaları
                  </div>
                  {MARKETS.map((m) => (
                    <button
                      key={m.id}
                      onClick={() => {
                        setSelectedMarketId(m.id);
                        setMarketDropdownOpen(false);
                      }}
                      className={cn(
                        'flex w-full items-center justify-between px-3 py-2.5 text-left text-sm transition-colors hover:bg-ink-800',
                        m.id === selectedMarketId ? 'text-amber-300' : 'text-slate-300',
                      )}
                    >
                      <div>
                        <div className="font-medium">{m.name}</div>
                        <div className="text-[11px] text-slate-600">{m.city} · {m.type === 'ckan' ? 'Canlı veri' : 'Örnek veri'}</div>
                      </div>
                      {m.id === selectedMarketId && <TrendingUp className="h-4 w-4" />}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Filtre çubuğu */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => loadMarket(selectedMarketId)}
            disabled={loading}
            className="inline-flex items-center gap-1.5 rounded-lg border border-ink-700 bg-ink-850 px-3 py-1.5 text-xs font-medium text-slate-300 transition-colors hover:bg-ink-800 hover:text-white disabled:opacity-50"
          >
            <RefreshCw className={cn('h-3.5 w-3.5', loading && 'animate-spin')} />
            Yenile
          </button>
          <span className="rounded-md bg-amber-500/10 px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-amber-300 ring-1 ring-amber-500/20">
            {data.length} ürün
          </span>
          {([
            { id: 'all', label: `Tümü (${data.length})` },
            { id: 'sebze', label: `Sebzeler (${sebzeCount})` },
            { id: 'meyve', label: `Meyveler (${meyveCount})` },
          ] as const).map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={cn(
                'rounded-lg px-3 py-1.5 text-xs font-medium transition-colors',
                filter === f.id
                  ? 'bg-amber-500/15 text-amber-300 ring-1 ring-amber-500/30'
                  : 'bg-ink-850 text-slate-400 hover:bg-ink-800 hover:text-slate-200',
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="relative max-w-xs flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ürün ara..."
            className="ring-focus w-full rounded-lg border border-ink-700 bg-ink-850 py-2 pl-9 pr-3 text-sm text-slate-200 placeholder:text-slate-600"
          />
        </div>
      </div>

      {/* İçerik */}
      {loading ? (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="card animate-pulse p-4">
              <div className="h-4 w-24 rounded bg-ink-800" />
              <div className="mt-3 h-8 w-16 rounded bg-ink-800" />
              <div className="mt-3 h-3 w-full rounded bg-ink-800" />
            </div>
          ))}
        </div>
      ) : error && data.length === 0 ? (
        <div className="card flex items-center gap-3 p-6 text-sm text-amber-300">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <div>
            <p className="font-medium">Hal fiyatlarına ulaşılamadı</p>
            <p className="mt-0.5 text-xs text-slate-500">{error}</p>
          </div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="card p-8 text-center text-sm text-slate-500">Bu filtreyle eşleşen ürün bulunamadı.</div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
            {filtered.map((p, i) => {
              const spread = p.enYuksekFiyat - p.enDusukFiyat;
              const spreadPct = p.ortalamaFiyat > 0 ? (spread / p.ortalamaFiyat) * 100 : 0;
              const commodityId = matchCommodityId(p.urunAd);
              return (
                <div key={`${p.urunAd}-${i}`} className={cn('card p-4', commodityId ? 'card-hover group cursor-pointer' : '')} onClick={() => commodityId && goTechnical(commodityId)}>
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="text-sm font-semibold text-white">{p.urunAd}</div>
                      <div className="mt-0.5 flex items-center gap-1.5">
                        <span
                          className={cn(
                            'rounded px-1.5 py-0.5 text-[10px] font-medium',
                            p.tur === 1
                              ? 'bg-rose-500/10 text-rose-300 ring-1 ring-rose-500/20'
                              : 'bg-emerald-500/10 text-emerald-300 ring-1 ring-emerald-500/20',
                          )}
                        >
                          {p.turLabel}
                        </span>
                        <span className="text-[10px] text-slate-600">{p.birim}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="tabular text-lg font-bold text-white">
                        {p.ortalamaFiyat.toLocaleString('tr-TR')}
                      </div>
                      <div className="text-[10px] text-slate-500">{p.birim}</div>
                    </div>
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <div className="rounded-md bg-ink-850/60 py-1.5 text-center">
                      <div className="flex items-center justify-center gap-1 text-[10px] uppercase text-slate-600">
                        <TrendingDown className="h-2.5 w-2.5" /> En Düşük
                      </div>
                      <div className="tabular text-xs font-medium text-rose-400">
                        {p.enDusukFiyat.toLocaleString('tr-TR')}
                      </div>
                    </div>
                    <div className="rounded-md bg-ink-850/60 py-1.5 text-center">
                      <div className="flex items-center justify-center gap-1 text-[10px] uppercase text-slate-600">
                        <TrendingUp className="h-2.5 w-2.5" /> En Yüksek
                      </div>
                      <div className="tabular text-xs font-medium text-emerald-400">
                        {p.enYuksekFiyat.toLocaleString('tr-TR')}
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 flex items-center justify-between border-t border-ink-700/50 pt-2 text-[10px] text-slate-500">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-2.5 w-2.5" />
                      {p.tarih ? new Date(p.tarih).toLocaleDateString('tr-TR') : '—'}
                    </span>
                    {commodityId ? (
                      <span className="flex items-center gap-1 font-medium text-emerald-400 transition-transform group-hover:translate-x-0.5">
                        Teknik Analiz <ArrowRight className="h-3 w-3" />
                      </span>
                    ) : (
                      <span>Spread: %{spreadPct.toFixed(1)}</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {timestamp && (
            <div className="text-right text-[10px] text-slate-600">
              {source} · Son güncelleme: {new Date(timestamp).toLocaleString('tr-TR')}
            </div>
          )}
        </>
      )}
    </div>
  );
}
