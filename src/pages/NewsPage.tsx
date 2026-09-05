import { useMemo, useState } from 'react';
import {
  Newspaper,
  Search,
  Globe,
  Clock,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Minus,
  Languages,
  CalendarDays,
  ShieldAlert,
  Flame,
  Snowflake,
  Droplets,
  ArrowRight,
  ChevronRight,
  Zap,
} from 'lucide-react';
import {
  newsItems,
  newsCategories,
  newsRegions,
  calendarEvents,
  riskBullets,
  type NewsCategory,
  type ImpactSignal,
  type NewsItem,
  type RiskBullet,
} from '@/lib/newsData';
import { formatPct } from '@/lib/format';
import { cn } from '@/lib/cn';

type CategoryFilter = NewsCategory | 'all';

export function NewsPage() {
  const [category, setCategory] = useState<CategoryFilter>('all');
  const [region, setRegion] = useState<string>('Global');
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    return newsItems.filter((n) => {
      if (category !== 'all' && n.category !== category) return false;
      if (region !== 'Global' && n.region !== region) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        if (
          !n.title.toLowerCase().includes(q) &&
          !n.summary.toLowerCase().includes(q) &&
          !n.tags.some((t) => t.toLowerCase().includes(q))
        )
          return false;
      }
      return true;
    });
  }, [category, region, search]);

  const hero = filtered.find((n) => n.isHero) ?? filtered[0] ?? null;
  const feed = filtered.filter((n) => n.id !== hero?.id);

  return (
    <div className="space-y-5">
      {/* Filtre & arama barı */}
      <div className="card p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap gap-1.5">
            {newsCategories.map((c) => (
              <button
                key={c.key}
                onClick={() => setCategory(c.key)}
                className={cn(
                  'rounded-lg px-3 py-1.5 text-xs font-medium transition-all',
                  category === c.key
                    ? 'bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-500/30'
                    : 'bg-ink-850 text-slate-400 hover:bg-ink-800 hover:text-slate-200',
                )}
              >
                {c.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Haberlerde ara..."
                className="ring-focus w-full rounded-lg border border-ink-700 bg-ink-850 py-1.5 pl-8 pr-3 text-xs text-slate-200 placeholder:text-slate-600 lg:w-56"
              />
            </div>
            <div className="relative">
              <Globe className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
              <select
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                className="ring-focus rounded-lg border border-ink-700 bg-ink-850 py-1.5 pl-8 pr-3 text-xs font-medium text-slate-200"
              >
                {newsRegions.map((r) => (
                  <option key={r} value={r} className="bg-ink-900">
                    {r}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1fr_340px]">
        {/* Sol kolon — manşet + akış */}
        <div className="space-y-4">
          {hero && <HeroNews item={hero} />}

          {feed.length > 0 ? (
            <div className="space-y-3">
              {feed.map((item) => (
                <NewsCard key={item.id} item={item} />
              ))}
            </div>
          ) : (
            !hero && (
              <div className="card p-8 text-center">
                <Newspaper className="mx-auto mb-3 h-8 w-8 text-slate-600" />
                <p className="text-sm text-slate-500">
                  Seçili filtrelere uygun haber bulunamadı.
                </p>
              </div>
            )
          )}
        </div>

        {/* Sağ kolon — Market Intelligence */}
        <div className="space-y-4">
          <EconomicCalendar />
          <RiskMapSummary />
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// MANŞET / HERO
// ════════════════════════════════════════════════════════════
function HeroNews({ item }: { item: NewsItem }) {
  return (
    <div className="card card-hover relative overflow-hidden p-0">
      {/* Arka plan gradyanı */}
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 via-ink-850/40 to-rose-500/10" />
      <div className="absolute right-0 top-0 h-40 w-40 rounded-full bg-emerald-500/5 blur-3xl" />

      <div className="relative p-5">
        <div className="mb-3 flex items-center gap-2">
          <span className="flex items-center gap-1 rounded-md bg-rose-500/15 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-rose-300 ring-1 ring-rose-500/30">
            <Zap className="h-3 w-3" /> Manşet
          </span>
          <span className="rounded-md bg-ink-800 px-2 py-1 text-[10px] font-medium text-slate-400">
            {item.region}
          </span>
          <SourceBadge source={item.source} logo={item.sourceLogo} />
          <span className="flex items-center gap-1 text-[11px] text-slate-500">
            <Clock className="h-3 w-3" /> {timeAgo(item.publishedMinAgo)}
          </span>
        </div>

        <h2 className="mb-2 text-xl font-bold leading-snug text-white lg:text-2xl">
          {item.title}
        </h2>
        <p className="mb-4 text-sm leading-relaxed text-slate-400">
          {item.summary}
        </p>

        <div className="flex flex-wrap items-center gap-3">
          {/* Etkilenen emtia fiyatı */}
          <div className="flex items-center gap-2 rounded-lg border border-ink-700/60 bg-ink-900/60 px-3 py-2">
            <span className="text-xs font-medium text-slate-400">
              {item.commodityTag}
            </span>
            <span className="tabular text-base font-bold text-white">
              {item.commodityPrice.toLocaleString('tr-TR')}
            </span>
            <span className="text-[11px] text-slate-500">{item.commodityUnit}</span>
            <span
              className={cn(
                'flex items-center gap-0.5 text-xs font-semibold',
                item.commodityChangePct >= 0 ? 'text-emerald-400' : 'text-rose-400',
              )}
            >
              {item.commodityChangePct >= 0 ? (
                <TrendingUp className="h-3 w-3" />
              ) : (
                <TrendingDown className="h-3 w-3" />
              )}
              {formatPct(item.commodityChangePct)}
            </span>
          </div>

          {/* Piyasa etkisi */}
          <ImpactBadge item={item} size="md" />

          {/* Etiketler */}
          <div className="flex flex-wrap gap-1.5">
            {item.tags.map((t) => (
              <span
                key={t}
                className="rounded-md bg-sky-500/10 px-2 py-1 text-[10px] font-medium text-sky-300/80"
              >
                {t}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// HABER KARTI
// ════════════════════════════════════════════════════════════
function NewsCard({ item }: { item: NewsItem }) {
  return (
    <div className="card card-hover p-4">
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          {/* Üst satır — kaynak + saat */}
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <SourceBadge source={item.source} logo={item.sourceLogo} />
            <span className="flex items-center gap-1 text-[11px] text-slate-500">
              <Clock className="h-3 w-3" /> {timeAgo(item.publishedMinAgo)}
            </span>
            <span className="rounded bg-ink-800 px-1.5 py-0.5 text-[10px] text-slate-500">
              {item.region}
            </span>
          </div>

          {/* Başlık */}
          <h3 className="mb-1.5 text-sm font-semibold leading-snug text-white">
            {item.title}
          </h3>

          {/* Özet */}
          <p className="mb-3 line-clamp-2 text-xs leading-relaxed text-slate-500">
            {item.summary}
          </p>

          {/* Etiketler */}
          <div className="mb-3 flex flex-wrap gap-1.5">
            {item.tags.map((t) => (
              <span
                key={t}
                className="rounded-md bg-sky-500/10 px-1.5 py-0.5 text-[10px] font-medium text-sky-300/80"
              >
                {t}
              </span>
            ))}
          </div>

          {/* Alt satır — etki + emtia + çeviri */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <ImpactBadge item={item} size="sm" />

            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1 text-[11px] text-slate-400">
                <span className="font-medium text-slate-300">{item.commodityTag}</span>
                <span className="tabular font-semibold text-white">
                  {item.commodityPrice.toLocaleString('tr-TR')}
                </span>
                <span className="text-slate-600">{item.commodityUnit}</span>
                <span
                  className={cn(
                    'tabular text-[11px] font-semibold',
                    item.commodityChangePct >= 0 ? 'text-emerald-400' : 'text-rose-400',
                  )}
                >
                  {item.commodityChangePct >= 0 ? '+' : ''}
                  {item.commodityChangePct.toFixed(2)}%
                </span>
              </span>
              <button
                className="flex items-center gap-1 rounded-md bg-ink-800 px-2 py-1 text-[10px] text-slate-400 transition-colors hover:bg-ink-700 hover:text-slate-200"
                title="Çeviri ve özet"
              >
                <Languages className="h-3 w-3" /> Çevir
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// PİYASA ETKİ ROZETİ
// ════════════════════════════════════════════════════════════
function ImpactBadge({ item, size = 'sm' }: { item: NewsItem; size?: 'sm' | 'md' }) {
  const config: Record<
    ImpactSignal,
    { bg: string; text: string; ring: string; icon: typeof TrendingUp }
  > = {
    bullish: { bg: 'bg-emerald-500/10', text: 'text-emerald-300', ring: 'ring-emerald-500/30', icon: TrendingUp },
    bearish: { bg: 'bg-rose-500/10', text: 'text-rose-300', ring: 'ring-rose-500/30', icon: TrendingDown },
    warning: { bg: 'bg-amber-500/10', text: 'text-amber-300', ring: 'ring-amber-500/30', icon: AlertTriangle },
    neutral: { bg: 'bg-slate-500/10', text: 'text-slate-300', ring: 'ring-slate-500/30', icon: Minus },
  };
  const c = config[item.impact];
  const Icon = c.icon;

  return (
    <div
      className={cn(
        'flex items-center gap-1.5 rounded-lg ring-1',
        c.bg,
        c.text,
        c.ring,
        size === 'md' ? 'px-3 py-2' : 'px-2 py-1',
      )}
      title={item.impactDesc}
    >
      <Icon className={size === 'md' ? 'h-4 w-4' : 'h-3 w-3'} />
      <div className="min-w-0">
        <div className={cn('font-semibold leading-tight', size === 'md' ? 'text-xs' : 'text-[10px]')}>
          {item.impactLabel}
        </div>
        {size === 'md' && (
          <div className="truncate text-[10px] text-slate-500">{item.impactDesc}</div>
        )}
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// KAYNAK ROZETİ
// ════════════════════════════════════════════════════════════
function SourceBadge({ source, logo }: { source: string; logo: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className="flex h-5 w-7 items-center justify-center rounded bg-ink-800 text-[8px] font-bold tracking-tight text-slate-400">
        {logo}
      </span>
      <span className="text-[11px] font-medium text-slate-400">{source}</span>
    </span>
  );
}

// ════════════════════════════════════════════════════════════
// MAKROEKONOMİK VERİ TAKVİMİ
// ════════════════════════════════════════════════════════════
function EconomicCalendar() {
  return (
    <div className="card p-4">
      <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-white">
        <CalendarDays className="h-4 w-4 text-emerald-400" />
        Tarım Ekonomisi Takvimi
      </h3>
      <div className="space-y-2">
        {calendarEvents.map((ev) => (
          <div
            key={ev.id}
            className="flex items-center gap-3 rounded-lg border border-ink-700/50 bg-ink-850/40 p-2.5"
          >
            <div className="flex flex-col items-center">
              <span className="tabular text-xs font-bold text-slate-200">{ev.time}</span>
              <span className="text-[9px] text-slate-600">{ev.source}</span>
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-xs font-medium text-slate-300">{ev.title}</div>
              <div className="flex items-center gap-1 text-[10px] text-slate-500">
                <Clock className="h-2.5 w-2.5" />
                {ev.countdownMin < 60
                  ? `${ev.countdownMin} dk sonra`
                  : `${Math.floor(ev.countdownMin / 60)} sa ${ev.countdownMin % 60} dk sonra`}
              </div>
            </div>
            <span
              className={cn(
                'h-2 w-2 shrink-0 rounded-full',
                ev.importance === 'high'
                  ? 'bg-rose-500 ring-2 ring-rose-500/30'
                  : ev.importance === 'medium'
                    ? 'bg-amber-500'
                    : 'bg-slate-600',
              )}
              title={`${ev.importance} öncelik`}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// GÜNÜN KRİTİK RİSK HARİTASI ÖZETİ
// ════════════════════════════════════════════════════════════
function RiskMapSummary() {
  const levelConfig: Record<
    RiskBullet['level'],
    { text: string; bg: string; ring: string; icon: typeof Flame; label: string }
  > = {
    critical: { text: 'text-rose-300', bg: 'bg-rose-500/10', ring: 'ring-rose-500/30', icon: Flame, label: 'Kritik' },
    high: { text: 'text-amber-300', bg: 'bg-amber-500/10', ring: 'ring-amber-500/30', icon: AlertTriangle, label: 'Yüksek' },
    moderate: { text: 'text-sky-300', bg: 'bg-sky-500/10', ring: 'ring-sky-500/30', icon: Droplets, label: 'Orta' },
  };

  return (
    <div className="card p-4">
      <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-white">
        <ShieldAlert className="h-4 w-4 text-amber-400" />
        Günün Kritik Risk Haritası
      </h3>
      <div className="space-y-2">
        {riskBullets.map((r) => {
          const c = levelConfig[r.level];
          const Icon = c.icon;
          return (
            <div
              key={r.id}
              className={cn('flex items-start gap-2.5 rounded-lg border p-2.5 ring-1', c.bg, c.ring)}
            >
              <Icon className={cn('mt-0.5 h-4 w-4 shrink-0', c.text)} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className={cn('text-xs font-bold', c.text)}>{r.region}</span>
                  <span className={cn('rounded px-1.5 py-0.5 text-[9px] font-semibold', c.bg, c.text)}>
                    {c.label}
                  </span>
                </div>
                <p className="mt-0.5 text-[11px] leading-snug text-slate-400">{r.risk}</p>
                <div className="mt-1 flex items-center gap-1 text-[10px] text-slate-500">
                  <ArrowRight className="h-2.5 w-2.5" />
                  {r.commodity}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// YARDIMCI
// ════════════════════════════════════════════════════════════
function timeAgo(min: number): string {
  if (min < 60) return `${min} dk önce`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (h < 24) return `${h} sa ${m} dk önce`;
  const d = Math.floor(h / 24);
  return `${d} gün önce`;
}
