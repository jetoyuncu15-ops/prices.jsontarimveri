import { useMemo, useState } from 'react';
import {
  Beef, Drumstick, MapPin, TrendingUp, TrendingDown, Calculator,
  Wallet, Scale, Info, ArrowRight, Search, Award, AlertCircle,
} from 'lucide-react';
import { livestockPrices, turkeyAverage, priceExtremes } from '@/lib/livestockData';
import { formatTRY, formatPct, sparkPath } from '@/lib/format';
import { cn } from '@/lib/cn';

type AnimalType = 'cattle' | 'sheep';

const animalMeta: Record<AnimalType, { label: string; icon: typeof Beef; color: string; bg: string; ring: string }> = {
  cattle: { label: 'Dana Karkas', icon: Beef, color: 'text-rose-400', bg: 'bg-rose-500/10', ring: 'ring-rose-500/30' },
  sheep:  { label: 'Kuzu Karkas', icon: Drumstick, color: 'text-amber-400', bg: 'bg-amber-500/10', ring: 'ring-amber-500/30' },
};

export function LivestockPage() {
  const [selectedCity, setSelectedCity] = useState('Konya');
  const [animal, setAnimal] = useState<AnimalType>('cattle');
  const [search, setSearch] = useState('');

  const current = useMemo(
    () => livestockPrices.find((p) => p.city === selectedCity) ?? livestockPrices[0],
    [selectedCity],
  );

  const filteredCities = useMemo(() => {
    if (!search.trim()) return livestockPrices;
    const q = search.toLowerCase();
    return livestockPrices.filter((p) => p.city.toLowerCase().includes(q) || p.zone.toLowerCase().includes(q));
  }, [search]);

  const price = animal === 'cattle' ? current.cattlePrice : current.sheepPrice;
  const change = animal === 'cattle' ? current.cattleChange : current.sheepChange;
  const history = animal === 'cattle' ? current.cattleHistory : current.sheepHistory;
  const avg = animal === 'cattle' ? turkeyAverage.cattle : turkeyAverage.sheep;
  const diffFromAvg = ((price - avg) / avg) * 100;

  return (
    <div className="space-y-5">
      {/* Üst bilgi şeridi */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <SummaryTile label="Türkiye Ort. Dana" value={`${turkeyAverage.cattle.toFixed(1)} ₺/kg`} sub="karkas" icon={Beef} accent="rose" />
        <SummaryTile label="Türkiye Ort. Kuzu" value={`${turkeyAverage.sheep.toFixed(1)} ₺/kg`} sub="karkas" icon={Drumstick} accent="amber" />
        <SummaryTile
          label="En Yüksek Dana"
          value={`${priceExtremes.cattleHighest.cattlePrice.toFixed(1)} ₺`}
          sub={priceExtremes.cattleHighest.city}
          icon={Award}
          accent="emerald"
        />
        <SummaryTile
          label="En Düşük Dana"
          value={`${priceExtremes.cattleLowest.cattlePrice.toFixed(1)} ₺`}
          sub={priceExtremes.cattleLowest.city}
          icon={AlertCircle}
          accent="slate"
        />
      </div>

      {/* İl/Bölge seçici + dinamik fiyat kartı */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
        {/* İl seçici */}
        <div className="card overflow-visible p-4 lg:col-span-2">
          <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-white">
            <MapPin className="h-4 w-4 text-emerald-400" />
            İl / Bölge Seç
          </h3>

          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-600" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="İl veya bölge ara..."
              className="ring-focus w-full rounded-lg border border-ink-700 bg-ink-850 py-2 pl-9 pr-3 text-sm text-slate-200 placeholder:text-slate-600"
            />
          </div>

          <div className="max-h-[280px] space-y-0.5 overflow-y-auto pr-1">
            {filteredCities.map((p) => {
              const isActive = p.city === selectedCity;
              return (
                <button
                  key={p.city}
                  onClick={() => setSelectedCity(p.city)}
                  className={cn(
                    'flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition-colors',
                    isActive ? 'bg-emerald-500/10 text-emerald-200 ring-1 ring-emerald-500/30' : 'text-slate-300 hover:bg-ink-800/50',
                  )}
                >
                  <div className="min-w-0">
                    <div className="truncate font-medium">{p.city}</div>
                    <div className="text-[10px] text-slate-600">{p.zone}</div>
                  </div>
                  <div className="flex shrink-0 items-center gap-3 text-right">
                    <div className="tabular text-xs">
                      <span className="text-rose-400">{p.cattlePrice.toFixed(0)}</span>
                      <span className="text-slate-600"> / </span>
                      <span className="text-amber-400">{p.sheepPrice.toFixed(0)}</span>
                    </div>
                    {isActive && <div className="h-2 w-2 rounded-full bg-emerald-400" />}
                  </div>
                </button>
              );
            })}
          </div>
          <div className="mt-2 text-[10px] text-slate-600">
            <span className="text-rose-400">●</span> Dana ₺/kg
            <span className="ml-2 text-amber-400">●</span> Kuzu ₺/kg
          </div>
        </div>

        {/* Dinamik fiyat kartı */}
        <div className="lg:col-span-3">
          <PriceCard
            current={current}
            animal={animal}
            setAnimal={setAnimal}
            price={price}
            change={change}
            history={history}
            avg={avg}
            diffFromAvg={diffFromAvg}
          />
        </div>
      </div>

      {/* Kâr / Maliyet Simülatörü */}
      <ProfitSimulator current={current} animal={animal} setAnimal={setAnimal} />

      {/* Bilgi notu */}
      <div className="flex items-start gap-2 rounded-lg border border-ink-700/50 bg-ink-850/40 px-4 py-3 text-xs text-slate-500">
        <Info className="h-4 w-4 shrink-0 text-slate-600" />
        <span>
          Fiyatlar tanıtım amaçlı mock simülasyon verisidir ve gerçek kesimhaneyefiyatlarını içermez.
          Karkas randımanı; canlı ağırlığın kesim sonrası karkas ağırlığına oranını ifade eder
          (Dana için tipik aralık %50–58, Kuzu için %44–52). Gerçek randıman ırk, yaş, cinsiyet ve besi süresine göre değişir.
        </span>
      </div>
    </div>
  );
}

// ── Dinamik Fiyat Kartı ──────────────────────────────────────
function PriceCard({
  current, animal, setAnimal, price, change, history, avg, diffFromAvg,
}: {
  current: typeof livestockPrices[0];
  animal: AnimalType;
  setAnimal: (a: AnimalType) => void;
  price: number;
  change: number;
  history: number[];
  avg: number;
  diffFromAvg: number;
}) {
  const meta = animalMeta[animal];
  const Icon = meta.icon;
  const sparkD = sparkPath(history, 200, 48, 4);
  const isUp = change >= 0;

  return (
    <div className="card h-full p-5">
      {/* Şehir başlığı */}
      <div className="mb-4 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-emerald-400" />
            <h3 className="text-lg font-bold text-white">{current.city}</h3>
          </div>
          <p className="mt-0.5 text-xs text-slate-500">{current.zone} bölgesi · güncel karkas fiyatları</p>
        </div>
        <div className="flex gap-1.5">
          {(['cattle', 'sheep'] as AnimalType[]).map((a) => {
            const M = animalMeta[a];
            const AIcon = M.icon;
            return (
              <button
                key={a}
                onClick={() => setAnimal(a)}
                className={cn(
                  'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all',
                  animal === a ? cn(M.bg, M.color, 'ring-1', M.ring) : 'bg-ink-850 text-slate-400 hover:text-slate-200',
                )}
              >
                <AIcon className="h-3.5 w-3.5" /> {M.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Ana fiyat + sparkline */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className={cn('rounded-xl border p-4', meta.ring, meta.bg)}>
          <div className="flex items-center gap-2">
            <Icon className={cn('h-5 w-5', meta.color)} />
            <span className="stat-label">{meta.label}</span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className={cn('tabular text-4xl font-bold', meta.color)}>
              {price.toFixed(1)}
            </span>
            <span className="text-sm text-slate-500">₺/kg</span>
          </div>
          <div className="mt-2 flex items-center gap-3 text-xs">
            <span className={cn('flex items-center gap-1 font-medium', isUp ? 'text-emerald-400' : 'text-rose-400')}>
              {isUp ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
              {formatPct(change)}
            </span>
            <span className="text-slate-600">günlük</span>
          </div>
        </div>

        <div className="rounded-xl border border-ink-700/50 bg-ink-850/50 p-4">
          <div className="stat-label">12 Aylık Eğilim</div>
          <svg viewBox="0 0 200 56" className="mt-2 h-14 w-full" preserveAspectRatio="none">
            <path d={sparkD} fill="none" stroke={isUp ? '#10b981' : '#f43f5e'} strokeWidth="2" strokeLinejoin="round" />
            <path d={`${sparkD} L200,56 L0,56 Z`} fill={isUp ? '#10b981' : '#f43f5e'} fillOpacity="0.08" />
          </svg>
          <div className="mt-2 flex items-center justify-between text-[10px] text-slate-600">
            <span>12 ay önce</span>
            <span>bugün</span>
          </div>
        </div>
      </div>

      {/* Türkiye ortalaması ile karşılaştırma */}
      <div className="mt-4 flex items-center justify-between rounded-lg border border-ink-700/50 bg-ink-850/30 px-4 py-2.5">
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <Scale className="h-3.5 w-3.5 text-slate-500" />
          Türkiye ortalaması: <span className="tabular font-medium text-slate-300">{avg.toFixed(1)} ₺/kg</span>
        </div>
        <div className={cn(
          'flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium',
          diffFromAvg >= 0 ? 'bg-emerald-500/10 text-emerald-300' : 'bg-rose-500/10 text-rose-300',
        )}>
          {diffFromAvg >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
          {diffFromAvg >= 0 ? '+' : ''}{diffFromAvg.toFixed(1)}% fark
        </div>
      </div>
    </div>
  );
}

// ── Kâr / Maliyet Simülatörü ──────────────────────────────────
function ProfitSimulator({
  current, animal, setAnimal,
}: {
  current: typeof livestockPrices[0];
  animal: AnimalType;
  setAnimal: (a: AnimalType) => void;
}) {
  const [liveWeight, setLiveWeight] = useState(500);   // canlı ağırlık kg
  const [yieldPct, setYieldPct] = useState(54);         // karkas randımanı %
  const [feedCost, setFeedCost] = useState(28000);      // yem/bakım masrafı ₺
  const [purchaseCost, setPurchaseCost] = useState(22000); // alım maliyeti ₺
  const [otherCost, setOtherCost] = useState(3500);     // nakliye, veteriner vb.

  const price = animal === 'cattle' ? current.cattlePrice : current.sheepPrice;
  const meta = animalMeta[animal];

  const carcassWeight = (liveWeight * yieldPct) / 100;
  const grossRevenue = carcassWeight * price;
  const totalCost = feedCost + purchaseCost + otherCost;
  const netProfit = grossRevenue - totalCost;
  const margin = grossRevenue > 0 ? (netProfit / grossRevenue) * 100 : 0;
  const roi = totalCost > 0 ? (netProfit / totalCost) * 100 : 0;
  const breakEvenPrice = carcassWeight > 0 ? totalCost / carcassWeight : 0;

  const presets: { label: string; weight: number; yieldPct: number }[] = animal === 'cattle'
    ? [
        { label: 'Dana (Besi)', weight: 550, yieldPct: 55 },
        { label: 'İnek (Kesim)', weight: 480, yieldPct: 52 },
        { label: 'Dana (Genç)', weight: 350, yieldPct: 58 },
      ]
    : [
        { label: 'Kuzu (Besi)', weight: 45, yieldPct: 48 },
        { label: 'Koyun (Kesim)', weight: 60, yieldPct: 46 },
        { label: 'Koç (Kesim)', weight: 75, yieldPct: 50 },
      ];

  return (
    <div className="card p-5">
      <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-white">
        <Calculator className="h-4 w-4 text-emerald-400" />
        Kâr / Maliyet Simülatörü
        <span className="ml-1 text-xs font-normal text-slate-500">
          ({current.city} · {meta.label} · {price.toFixed(1)} ₺/kg)
        </span>
      </h3>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {/* Form */}
        <div className="space-y-4">
          {/* Hayvan türü seçimi */}
          <div>
            <div className="mb-1.5 stat-label">Hayvan Türü</div>
            <div className="flex gap-1.5">
              {(['cattle', 'sheep'] as AnimalType[]).map((a) => {
                const M = animalMeta[a];
                const AIcon = M.icon;
                return (
                  <button
                    key={a}
                    onClick={() => setAnimal(a)}
                    className={cn(
                      'flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-all',
                      animal === a ? cn(M.bg, M.color, 'ring-1', M.ring) : 'bg-ink-850 text-slate-400 hover:text-slate-200',
                    )}
                  >
                    <AIcon className="h-4 w-4" /> {M.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Hızlı seçim presetleri */}
          <div>
            <div className="mb-1.5 stat-label">Hızlı Seçim</div>
            <div className="flex flex-wrap gap-1.5">
              {presets.map((p) => (
                <button
                  key={p.label}
                  onClick={() => { setLiveWeight(p.weight); setYieldPct(p.yieldPct); }}
                  className="rounded-md border border-ink-700 bg-ink-850 px-2.5 py-1.5 text-xs text-slate-400 transition-colors hover:border-emerald-500/30 hover:text-emerald-300"
                >
                  {p.label} · {p.weight} kg
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Canlı Ağırlık (kg)">
              <NumberInput value={liveWeight} onChange={setLiveWeight} step={5} />
            </Field>
            <Field label="Karkas Randıman (%)">
              <NumberInput value={yieldPct} onChange={setYieldPct} step={1} />
            </Field>
            <Field label="Alım Maliyeti (₺)">
              <NumberInput value={purchaseCost} onChange={setPurchaseCost} step={1000} />
            </Field>
            <Field label="Yem / Bakım (₺)">
              <NumberInput value={feedCost} onChange={setFeedCost} step={1000} />
            </Field>
            <div className="col-span-2">
              <Field label="Diğer Masraflar — nakliye, veteriner vb. (₺)">
                <NumberInput value={otherCost} onChange={setOtherCost} step={500} />
              </Field>
            </div>
          </div>
        </div>

        {/* Sonuç */}
        <div className="space-y-3">
          {/* Ara hesaplamalar */}
          <div className="grid grid-cols-2 gap-3">
            <ResultTile label="Karkas Ağırlığı" value={`${carcassWeight.toFixed(1)} kg`} icon={<Scale className="h-4 w-4" />} accent="slate" />
            <ResultTile label="Brüt Hasılat" value={formatTRY(grossRevenue)} icon={<Wallet className="h-4 w-4" />} accent="emerald" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <ResultTile label="Toplam Maliyet" value={formatTRY(totalCost)} icon={<Calculator className="h-4 w-4" />} accent="amber" />
            <ResultTile
              label="Başabaş Fiyatı"
              value={`${breakEvenPrice.toFixed(1)} ₺/kg`}
              icon={<Info className="h-4 w-4" />}
              accent="slate"
              sub="Kâr için min. fiyat"
            />
          </div>

          {/* Net kâr — ana sonuç */}
          <div className={cn(
            'rounded-xl border p-4',
            netProfit >= 0
              ? 'border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 to-emerald-500/5'
              : 'border-rose-500/30 bg-gradient-to-br from-rose-500/10 to-rose-500/5',
          )}>
            <div className={cn('stat-label', netProfit >= 0 ? 'text-emerald-300/80' : 'text-rose-300/80')}>
              Tahmini Net Kâr
            </div>
            <div className={cn('mt-1 tabular text-3xl font-bold', netProfit >= 0 ? 'text-emerald-400' : 'text-rose-400')}>
              {formatTRY(netProfit)}
            </div>
            <div className="mt-3 flex gap-4 text-xs">
              <div>
                <span className="text-slate-400">Kâr Marjı </span>
                <span className={cn('tabular font-semibold', margin >= 0 ? 'text-emerald-400' : 'text-rose-400')}>
                  {margin.toFixed(1)}%
                </span>
              </div>
              <div>
                <span className="text-slate-400">Yatırım Getirisi </span>
                <span className={cn('tabular font-semibold', roi >= 0 ? 'text-emerald-400' : 'text-rose-400')}>
                  {roi.toFixed(1)}%
                </span>
              </div>
            </div>
          </div>

          {/* Başabaş uyarısı */}
          {price < breakEvenPrice && (
            <div className="flex items-center gap-2 rounded-lg border border-rose-500/20 bg-rose-500/5 px-3 py-2 text-xs text-rose-300">
              <AlertCircle className="h-4 w-4 shrink-0" />
              Seçili ildeki güncel fiyat ({price.toFixed(1)} ₺/kg), başabaş fiyatının altında.
              Kâr etmek için ya maliyetleri düşürün ya da daha yüksek fiyatlı ile kesim yapın.
            </div>
          )}
          {price >= breakEvenPrice && netProfit > 0 && (
            <div className="flex items-center gap-2 rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-3 py-2 text-xs text-emerald-300">
              <TrendingUp className="h-4 w-4 shrink-0" />
              Güncel fiyat başabaşın {((price / breakEvenPrice - 1) * 100).toFixed(0)}% üzerinde — kârlı kesim.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Yardımcı bileşenler ──────────────────────────────────────
function SummaryTile({
  label, value, sub, icon: Icon, accent,
}: {
  label: string;
  value: string;
  sub?: string;
  icon: typeof Beef;
  accent: 'emerald' | 'amber' | 'rose' | 'slate';
}) {
  const colors = {
    emerald: 'text-emerald-400',
    amber: 'text-amber-400',
    rose: 'text-rose-400',
    slate: 'text-slate-200',
  };
  return (
    <div className="card p-3">
      <div className="flex items-center gap-2">
        <Icon className={cn('h-4 w-4', colors[accent])} />
        <div className="stat-label">{label}</div>
      </div>
      <div className="mt-1.5 flex items-baseline gap-1">
        <span className={cn('tabular text-lg font-bold', colors[accent])}>{value}</span>
        {sub && <span className="text-[10px] text-slate-600">{sub}</span>}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-1.5 stat-label">{label}</div>
      {children}
    </div>
  );
}

function NumberInput({
  value, onChange, step = 1,
}: {
  value: number;
  onChange: (v: number) => void;
  step?: number;
}) {
  return (
    <div className="relative">
      <input
        type="number"
        value={value}
        step={step}
        onChange={(e) => onChange(Number(e.target.value))}
        className="ring-focus tabular w-full rounded-lg border border-ink-700 bg-ink-850 px-3 py-2.5 text-sm text-white"
      />
      <div className="absolute right-3 top-1/2 flex -translate-y-1/2 flex-col">
        <button
          onClick={() => onChange(value + step)}
          className="text-slate-600 hover:text-emerald-400"
          aria-label="Artır"
        >
          <ArrowRight className="h-3 w-3 -rotate-90" />
        </button>
        <button
          onClick={() => onChange(Math.max(0, value - step))}
          className="text-slate-600 hover:text-emerald-400"
          aria-label="Azalt"
        >
          <ArrowRight className="h-3 w-3 rotate-90" />
        </button>
      </div>
    </div>
  );
}

function ResultTile({
  label, value, icon, accent, sub,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  accent: 'emerald' | 'amber' | 'rose' | 'slate';
  sub?: string;
}) {
  const colors = {
    emerald: 'text-emerald-400',
    amber: 'text-amber-400',
    rose: 'text-rose-400',
    slate: 'text-slate-200',
  };
  return (
    <div className="rounded-xl border border-ink-700/50 bg-ink-850/50 p-3">
      <div className="flex items-center gap-1.5 text-slate-500">
        {icon}
        <span className="stat-label">{label}</span>
      </div>
      <div className={cn('mt-1 tabular text-base font-bold', colors[accent])}>{value}</div>
      {sub && <div className="text-[10px] text-slate-600">{sub}</div>}
    </div>
  );
}
