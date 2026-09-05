import { useEffect, useState } from 'react';
import { Store, RefreshCw, AlertCircle, TrendingUp, TrendingDown, Calendar } from 'lucide-react';
import { fetchKonyaHalFiyatlari, type HalFiyat } from '@/services/konyaHal';
import { cn } from '@/lib/cn';

type Filter = 'all' | 'sebze' | 'meyve';

export function HalFiyatKartlari() {
  const [data, setData] = useState<HalFiyat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isReal, setIsReal] = useState(false);
  const [source, setSource] = useState('');
  const [timestamp, setTimestamp] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const [query, setQuery] = useState('');

  async function load() {
    setLoading(true);
    setError(null);
    const res = await fetchKonyaHalFiyatlari(100);
    setData(res.prices);
    setIsReal(res.isReal);
    setSource(res.source);
    setTimestamp(res.timestamp);
    if (res.error && !res.isReal) setError(res.error);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  const filtered = data.filter((p) => {
    if (filter === 'sebze' && p.tur !== 0) return false;
    if (filter === 'meyve' && p.tur !== 1) return false;
    if (query && !p.urunAd.toLowerCase().includes(query.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="space-y-4">
      {/* Başlık ve durum */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10 text-amber-400 ring-1 ring-amber-500/20">
            <Store className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">Yerel Hal Piyasası</h3>
            <p className="text-xs text-slate-500">Konya Büyükşehir Belediyesi Açık Veri Portalı</p>
          </div>
          {isReal && (
            <span className="flex items-center gap-1 rounded-md bg-emerald-500/10 px-2 py-1 text-[10px] font-semibold text-emerald-300 ring-1 ring-emerald-500/20">
              <span className="h-1.5 w-1.5 animate-pulse-dot rounded-full bg-emerald-400" /> Canlı
            </span>
          )}
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="inline-flex items-center gap-1.5 rounded-lg border border-ink-700 bg-ink-850 px-3 py-1.5 text-xs font-medium text-slate-300 transition-colors hover:bg-ink-800 hover:text-white disabled:opacity-50"
        >
          <RefreshCw className={cn('h-3.5 w-3.5', loading && 'animate-spin')} />
          Yenile
        </button>
      </div>

      {/* Filtre çubuğu */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-1.5">
          {([
            { id: 'all', label: 'Tümü' },
            { id: 'sebze', label: 'Sebzeler' },
            { id: 'meyve', label: 'Meyveler' },
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
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Ürün ara..."
          className="ring-focus w-full max-w-xs rounded-lg border border-ink-700 bg-ink-850 px-3 py-1.5 text-sm text-slate-200 placeholder:text-slate-600"
        />
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
              return (
                <div key={`${p.urunAd}-${i}`} className="card card-hover p-4">
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
                    <span>Spread: %{spreadPct.toFixed(1)}</span>
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
