import { useMemo, useState } from 'react';
import { Building2, ChevronDown, TrendingUp, ArrowRight, MapPin, BarChart3 } from 'lucide-react';
import { exchangeMarkets, matchCommodityId } from '@/lib/mockData';
import { ChangeBadge } from '@/components/ui/ChangeBadge';
import { useNav } from '@/App';
import { formatNumber } from '@/lib/format';
import { cn } from '@/lib/cn';

export function ExchangeDetail() {
  const { exchangeId, goExchange, goTechnical } = useNav();
  const markets = exchangeMarkets;
  const [currentId, setCurrentId] = useState<string>(
    exchangeId ?? markets[0].name,
  );
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const market = useMemo(
    () => markets.find((m) => m.name === currentId) ?? markets[0],
    [currentId, markets],
  );

  const switchExchange = (name: string) => {
    setCurrentId(name);
    setDropdownOpen(false);
    goExchange(name);
  };

  return (
    <div className="space-y-5">
      {/* Başlık + dropdown */}
      <div className="card overflow-visible p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/20">
              <Building2 className="h-7 w-7" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">{market.name}</h2>
              <div className="mt-1 flex items-center gap-3 text-sm text-slate-500">
                <span className="flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" /> {market.city}
                </span>
                <span className="h-3 w-px bg-ink-600" />
                <span className="tabular">
                  Toplam Hacim: <span className="text-slate-300">{formatNumber(market.totalVolume)}</span>{' '}
                  <span className="text-xs text-slate-600">ton</span>
                </span>
                <span className="h-3 w-px bg-ink-600" />
                <span>{market.quotes.length} ürün</span>
              </div>
            </div>
          </div>

          {/* Borsa değiştir dropdown */}
          <div className="relative">
            <button
              onClick={() => setDropdownOpen((o) => !o)}
              className="ring-focus flex items-center gap-2 rounded-lg border border-ink-700 bg-ink-850 px-4 py-2.5 text-sm font-medium text-slate-200 hover:border-ink-600"
            >
              <Building2 className="h-4 w-4 text-emerald-400" />
              Borsa Değiştir
              <ChevronDown className={cn('h-4 w-4 text-slate-500 transition-transform', dropdownOpen && 'rotate-180')} />
            </button>
            {dropdownOpen && (
              <>
                <div className="fixed inset-0 z-[99998]" onClick={() => setDropdownOpen(false)} />
                <div className="absolute right-0 top-full z-[99999] mt-2 max-h-[400px] w-80 overflow-y-auto rounded-lg border border-ink-700 bg-ink-900 shadow-2xl pointer-events-auto">
                  <div className="sticky top-0 z-[10000] bg-ink-900 px-3 py-2 text-[10px] font-medium uppercase tracking-wider text-slate-600">
                    Tüm Borsalar ({markets.length})
                  </div>
                {markets.map((m) => (
                  <button
                    key={m.name}
                    onClick={() => switchExchange(m.name)}
                    className={cn(
                      'flex w-full items-center justify-between px-3 py-2.5 text-left text-sm transition-colors hover:bg-ink-800',
                      m.name === currentId ? 'text-emerald-300' : 'text-slate-300',
                    )}
                  >
                    <div>
                      <div className="font-medium">{m.name}</div>
                      <div className="text-[11px] text-slate-600">{m.city} · {m.quotes.length} ürün</div>
                    </div>
                    {m.name === currentId && <TrendingUp className="h-4 w-4" />}
                  </button>
                ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Ürün listesi */}
      <div>
        <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-white">
          <BarChart3 className="h-4 w-4 text-emerald-400" />
          Borsada İşlem Gören Ürünler
        </h3>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {market.quotes.map((q) => {
            const commodityId = matchCommodityId(q.product);
            const hasAnalysis = commodityId !== null;
            return (
              <button
                key={q.symbol}
                disabled={!hasAnalysis}
                onClick={() => hasAnalysis && goTechnical(commodityId!)}
                className={cn(
                  'card group p-4 text-left transition-all',
                  hasAnalysis
                    ? 'card-hover hover:ring-1 hover:ring-emerald-500/30'
                    : 'cursor-not-allowed opacity-60',
                )}
              >
                <div className="flex items-start justify-between">
                  <div className="min-w-0">
                    <div className="truncate text-base font-semibold text-white">{q.product}</div>
                    <div className="tabular mt-0.5 text-[10px] text-slate-600">{q.symbol}</div>
                  </div>
                  <ChangeBadge value={q.changePct} />
                </div>

                <div className="mt-4 flex items-baseline gap-2">
                  <span className="tabular text-2xl font-bold text-white">
                    {q.last.toLocaleString('tr-TR')}
                  </span>
                  <span className="text-xs text-slate-500">{q.unit}</span>
                </div>

                <div className="mt-3 flex items-center justify-between border-t border-ink-700/50 pt-3 text-xs">
                  <span className="tabular text-slate-500">
                    Hacim: <span className="text-slate-300">{formatNumber(q.volume)}</span>{' '}
                    <span className="text-slate-600">ton</span>
                  </span>
                  {hasAnalysis ? (
                    <span className="flex items-center gap-1 font-medium text-emerald-400 transition-transform group-hover:translate-x-0.5">
                      Teknik Analiz <ArrowRight className="h-3.5 w-3.5" />
                    </span>
                  ) : (
                    <span className="text-slate-600">Analiz yok</span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <p className="text-center text-[11px] text-slate-600">
        Bir ürün kartına tıklayarak doğrudan o ürünün teknik analiz ekranına geçebilirsiniz.
      </p>
    </div>
  );
}
