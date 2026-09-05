import { useEffect, useMemo, useState, useCallback } from 'react';
import {
  CandlestickChart as CandleIcon,
  Minus,
  TrendingUp,
  GitCompare,
  ArrowDownWideNarrow,
  PenLine,
  Eraser,
  Activity,
  Waves,
  BarChart3,
  LineChart as LineIcon,
  Hash,
  Save,
  FolderOpen,
  CheckCircle2,
  Maximize2,
  Minimize2,
  Zap,
  FileText,
} from 'lucide-react';
import { CandlestickChart as CandleChart, type ChartType, type Drawing } from '@/components/charts/CandlestickChart';
import { DrawingToolbar } from '@/components/DrawingToolbar';
import { RsiChart, MacdChart } from '@/components/charts/IndicatorCharts';
import { ProductDetailPanels } from '@/components/ProductDetailPanels';
import { taSymbols, commodities } from '@/lib/mockData';
import { closesOf } from '@/lib/indicators';
import { formatPct } from '@/lib/format';
import { useNav } from '@/App';
import { useMarket } from '@/context/MarketContext';
import { cn } from '@/lib/cn';
import { ReportModal, type ReportData } from '@/components/ReportModal';

const chartTypes: { key: ChartType; label: string; icon: typeof CandleIcon }[] = [
  { key: 'candle', label: 'Mum', icon: CandleIcon },
  { key: 'line', label: 'Çizgi', icon: LineIcon },
  { key: 'bar', label: 'Bar', icon: BarChart3 },
];

const rangeLabels = [
  { key: '1A', label: '1A', days: 30 },
  { key: '3A', label: '3A', days: 90 },
  { key: '6A', label: '6A', days: 180 },
] as const;

const STORAGE_PREFIX = 'tarimfinans_drawings_';

export function TechnicalAnalysis() {
  const { technicalSymbolId } = useNav();
  const { data } = useMarket();
  const { sulama: sulamaVeri, iscilik: iscilikVeri, tohum: tohumVeri, gubre: gubreVeri, mazot: mazotVeri } = data;
  const [symbolId, setSymbolId] = useState(technicalSymbolId ?? taSymbols[0].id);
  const [chartType, setChartType] = useState<ChartType>('candle');
  const [tool, setTool] = useState<string>('none');
  const [drawings, setDrawings] = useState<Drawing[]>([]);
  const [rangeKey, setRangeKey] = useState<(typeof rangeLabels)[number]['key']>('3A');
  const [showSMA, setShowSMA] = useState(true);
  const [showEMA, setShowEMA] = useState(false);
  const [showBollinger, setShowBollinger] = useState(false);
  const [showRSI, setShowRSI] = useState(true);
  const [showMACD, setShowMACD] = useState(true);
  const [smaPeriod, setSmaPeriod] = useState(20);
  const [emaPeriod, setEmaPeriod] = useState(12);
  const [rsiPeriod, setRsiPeriod] = useState(14);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saved'>('idle');
  const [savedCount, setSavedCount] = useState(0);
  const [focusMode, setFocusMode] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);

  const toggleFocus = useCallback(() => setFocusMode((v) => !v), []);

  // Escape tuşuyla odak modundan çık
  useEffect(() => {
    if (!focusMode) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setFocusMode(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [focusMode]);

  const symbol = useMemo(() => taSymbols.find((s) => s.id === symbolId)!, [symbolId]);
  const commodity = useMemo(() => commodities.find((c) => c.id === symbolId) ?? null, [symbolId]);

  // Borsa detaydan veya Dashboard'dan gelen sembol değişimiyle senkronize et
  useEffect(() => {
    if (technicalSymbolId && technicalSymbolId !== symbolId) {
      setSymbolId(technicalSymbolId);
      setDrawings([]);
      setSaveStatus('idle');
    }
  }, [technicalSymbolId, symbolId]);

  // Sembol değişince kayıtlı çizim sayısını güncelle
  useEffect(() => {
    const key = STORAGE_PREFIX + symbolId;
    try {
      const raw = localStorage.getItem(key);
      setSavedCount(raw ? JSON.parse(raw).length : 0);
    } catch {
      setSavedCount(0);
    }
  }, [symbolId]);

  const candles = useMemo(() => {
    const days = rangeLabels.find((r) => r.key === rangeKey)!.days;
    const baseCandles = symbol.candles.slice(Math.max(0, symbol.candles.length - days));

    // Sulama Elektrik Endeksi seçildiğinde canlı veriyle son mumu güncelle
    if (symbolId === 'elektrik') {
      const carpan = sulamaVeri.endIndex / 1512.8;
      return baseCandles.map((c, i) =>
        i === baseCandles.length - 1
          ? {
              ...c,
              close: Number((c.close * carpan).toFixed(2)),
              high: Math.max(c.high * carpan, c.close * carpan),
              low: Math.min(c.low * carpan, c.close * carpan),
            }
          : c,
      );
    }

    // Tarım İşçiliği Endeksi seçildiğinde canlı veriyle son mumu güncelle
    if (symbolId === 'iscilik') {
      const carpan = iscilikVeri.endIndex / 1398.4;
      return baseCandles.map((c, i) =>
        i === baseCandles.length - 1
          ? {
              ...c,
              close: Number((c.close * carpan).toFixed(2)),
              high: Math.max(c.high * carpan, c.close * carpan),
              low: Math.min(c.low * carpan, c.close * carpan),
            }
          : c,
      );
    }

    // Tohum Maliyet Endeksi seçildiğinde canlı veriyle son mumu güncelle
    if (symbolId === 'tohum') {
      const carpan = tohumVeri.endIndex / 1298.8;
      return baseCandles.map((c, i) =>
        i === baseCandles.length - 1
          ? {
              ...c,
              close: Number((c.close * carpan).toFixed(2)),
              high: Math.max(c.high * carpan, c.close * carpan),
              low: Math.min(c.low * carpan, c.close * carpan),
            }
          : c,
      );
    }

    // Gübre Fiyat Endeksi seçildiğinde canlı veriyle son mumu güncelle
    if (symbolId === 'gubre') {
      const carpan = gubreVeri.endIndex / 2234.1;
      return baseCandles.map((c, i) =>
        i === baseCandles.length - 1
          ? {
              ...c,
              close: Number((c.close * carpan).toFixed(2)),
              high: Math.max(c.high * carpan, c.close * carpan),
              low: Math.min(c.low * carpan, c.close * carpan),
            }
          : c,
      );
    }

    // Mazot Fiyat Endeksi seçildiğinde canlı veriyle son mumu güncelle
    if (symbolId === 'mazot') {
      const carpan = mazotVeri.endIndex / 1641.3;
      return baseCandles.map((c, i) =>
        i === baseCandles.length - 1
          ? {
              ...c,
              close: Number((c.close * carpan).toFixed(2)),
              high: Math.max(c.high * carpan, c.close * carpan),
              low: Math.min(c.low * carpan, c.close * carpan),
            }
          : c,
      );
    }

    return baseCandles;
  }, [symbol, rangeKey, symbolId, sulamaVeri, iscilikVeri, tohumVeri, gubreVeri, mazotVeri]);

  const stats = useMemo(() => {
    const closes = closesOf(candles);
    const last = closes[closes.length - 1] ?? 0;
    const first = closes[0] ?? 0;
    const change = first > 0 ? ((last - first) / first) * 100 : 0;
    const high = Math.max(...candles.map((c) => c.high));
    const low = Math.min(...candles.map((c) => c.low));
    return { last, change, high, low };
  }, [candles]);

  const addDrawing = (d: Drawing) => setDrawings((prev) => [...prev, d]);
  const clearDrawings = () => setDrawings([]);

  const switchSymbol = (id: string) => {
    setSymbolId(id);
    setDrawings([]);
    setSaveStatus('idle');
  };

  const handleSave = () => {
    if (drawings.length === 0) return;
    const key = STORAGE_PREFIX + symbolId;
    try {
      localStorage.setItem(key, JSON.stringify(drawings));
      setSavedCount(drawings.length);
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch {
      // localStorage dolu veya erişilemez — sessizce yoksay
    }
  };

  const handleLoadSaved = () => {
    const key = STORAGE_PREFIX + symbolId;
    try {
      const raw = localStorage.getItem(key);
      if (raw) {
        const parsed = JSON.parse(raw) as Drawing[];
        if (Array.isArray(parsed) && parsed.length > 0) {
          setDrawings(parsed);
        }
      }
    } catch {
      // bozuk veri — yoksay
    }
  };

  return (
    <div className="space-y-4">
      {/* Sembol seçici + özet */}
      <div className="card p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/20">
              <Activity className="h-5 w-5" />
            </div>
            <div>
              <select
                value={symbolId}
                onChange={(e) => switchSymbol(e.target.value)}
                className="ring-focus rounded-lg border border-ink-700 bg-ink-850 px-3 py-1.5 text-base font-semibold text-white"
              >
                <optgroup label="Tarım Ürünleri">
                  {taSymbols.filter((s) => s.category !== 'Endeks').map((s) => (
                    <option key={s.id} value={s.id} className="bg-ink-900">{s.name}</option>
                  ))}
                </optgroup>
                <optgroup label="Tarım Endeksleri">
                  {taSymbols.filter((s) => s.category === 'Endeks').map((s) => (
                    <option key={s.id} value={s.id} className="bg-ink-900">{s.name}</option>
                  ))}
                </optgroup>
              </select>
              <div className="mt-0.5 text-xs text-slate-500">
                {symbol.category} · {symbol.unit}
                {symbolId === 'elektrik' && sulamaVeri?.isReal && (
                  <span className="ml-2 inline-flex items-center gap-0.5 rounded bg-emerald-500/15 px-1.5 py-0.5 text-[9px] font-medium text-emerald-300 ring-1 ring-emerald-500/20">
                    <Zap className="h-2.5 w-2.5" /> EPİAŞ Canlı
                  </span>
                )}
                {symbolId === 'iscilik' && (
                  <span className="ml-2 inline-flex items-center gap-0.5 rounded bg-violet-500/15 px-1.5 py-0.5 text-[9px] font-medium text-violet-300 ring-1 ring-violet-500/20">
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-violet-400" /> Canlı
                  </span>
                )}
                {symbolId === 'tohum' && (
                  <span className="ml-2 inline-flex items-center gap-0.5 rounded bg-amber-500/15 px-1.5 py-0.5 text-[9px] font-medium text-amber-300 ring-1 ring-amber-500/20">
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-amber-400" /> Canlı
                  </span>
                )}
                {symbolId === 'gubre' && (
                  <span className="ml-2 inline-flex items-center gap-0.5 rounded bg-amber-500/15 px-1.5 py-0.5 text-[9px] font-medium text-amber-300 ring-1 ring-amber-500/20">
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-amber-400" /> Canlı
                  </span>
                )}
                {symbolId === 'mazot' && (
                  <span className="ml-2 inline-flex items-center gap-0.5 rounded bg-amber-500/15 px-1.5 py-0.5 text-[9px] font-medium text-amber-300 ring-1 ring-amber-500/20">
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-amber-400" /> Canlı
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:flex lg:items-center">
            <Stat label="Son Fiyat" value={stats.last.toFixed(2)} accent={stats.change >= 0 ? 'emerald' : 'rose'} />
            <Stat label="Dönem Değişim" value={formatPct(stats.change)} accent={stats.change >= 0 ? 'emerald' : 'rose'} />
            <Stat label="En Yüksek" value={stats.high.toFixed(2)} />
            <Stat label="En Düşük" value={stats.low.toFixed(2)} />
          </div>
        </div>
      </div>

      {/* Araç çubuğu — grafik türü + zaman aralığı */}
      <div className="card flex flex-col gap-3 p-3 lg:flex-row lg:items-center lg:justify-between">
        {/* Grafik türü */}
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1 text-[11px] font-medium uppercase tracking-wider text-slate-500">
            <BarChart3 className="h-3.5 w-3.5" /> Grafik
          </span>
          <div className="flex gap-1">
            {chartTypes.map((ct) => {
              const Icon = ct.icon;
              return (
                <button
                  key={ct.key}
                  onClick={() => setChartType(ct.key)}
                  className={cn(
                    'flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors',
                    chartType === ct.key ? 'bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-500/30' : 'bg-ink-850 text-slate-400 hover:bg-ink-800 hover:text-slate-200',
                  )}
                >
                  <Icon className="h-3.5 w-3.5" /> {ct.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Zaman aralığı */}
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1 text-[11px] font-medium uppercase tracking-wider text-slate-500">
            <Hash className="h-3.5 w-3.5" /> Aralık
          </span>
          <div className="flex gap-1">
            {rangeLabels.map((r) => (
              <button
                key={r.key}
                onClick={() => setRangeKey(r.key)}
                className={cn(
                  'rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors',
                  rangeKey === r.key ? 'bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-500/30' : 'bg-ink-850 text-slate-400 hover:bg-ink-800 hover:text-slate-200',
                )}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>

        {/* Kayıtlı çizimleri yükle */}
        {savedCount > 0 && (
          <button
            onClick={handleLoadSaved}
            className="flex items-center gap-1.5 rounded-md bg-ink-850 px-2.5 py-1.5 text-xs font-medium text-sky-300/80 hover:bg-sky-500/10 hover:text-sky-300"
            title="Bu sembol için kaydedilmiş çizimleri yükle"
          >
            <FolderOpen className="h-3.5 w-3.5" /> Kayıtlı Çizimleri Yükle ({savedCount})
          </button>
        )}

      </div>

      {/* Gelişmiş Çizim Araç Çubuğu — odak modunda gizli */}
      {!focusMode && (
        <DrawingToolbar
          activeTool={tool}
          onSelectTool={setTool}
          onSave={handleSave}
          onClear={clearDrawings}
          drawingCount={drawings.length}
          savedCount={savedCount}
        />
      )}

      {/* Kaydetme durumu bildirimi — odak modunda gizli */}
      {!focusMode && saveStatus === 'saved' && (
        <div className="flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-sm text-emerald-300">
          <CheckCircle2 className="h-4 w-4" />
          Çizimler tarayıcı belleğine kaydedildi. Bu sembole geri döndüğünüzde "Kayıtlı Çizimleri Yükle" butonuyla geri çağırabilirsiniz.
        </div>
      )}

      {/* İndikatör paneli — odak modunda gizli */}
      {!focusMode && (
        <div className="card flex flex-wrap items-center gap-x-5 gap-y-2 p-3">
          <span className="flex items-center gap-1 text-[11px] font-medium uppercase tracking-wider text-slate-500">
            <Waves className="h-3.5 w-3.5" /> İndikatörler
          </span>
          <Toggle label="SMA" active={showSMA} onClick={() => setShowSMA((v) => !v)} color="sky" />
          {showSMA && <NumStepper value={smaPeriod} onChange={setSmaPeriod} min={5} max={50} step={1} />}
          <Toggle label="EMA" active={showEMA} onClick={() => setShowEMA((v) => !v)} color="amber" />
          {showEMA && <NumStepper value={emaPeriod} onChange={setEmaPeriod} min={5} max={50} step={1} />}
          <Toggle label="Bollinger" active={showBollinger} onClick={() => setShowBollinger((v) => !v)} color="slate" />
          <span className="mx-1 h-4 w-px bg-ink-700" />
          <Toggle label="RSI" active={showRSI} onClick={() => setShowRSI((v) => !v)} color="violet" />
          {showRSI && <NumStepper value={rsiPeriod} onChange={setRsiPeriod} min={7} max={28} step={1} />}
          <Toggle label="MACD" active={showMACD} onClick={() => setShowMACD((v) => !v)} color="sky" />
        </div>
      )}

      {/* Ana grafik kartı — odak modunda tam ekran overlay'a dönüşür */}
      <div
        className={cn(
          'card transition-all duration-300 ease-in-out',
          focusMode
            ? 'fixed inset-0 z-50 flex flex-col overflow-y-auto rounded-none border-0 bg-ink-950/98 p-0 backdrop-blur-sm animate-fade-in'
            : 'relative p-4',
        )}
      >
        {/* Odak modu — üst kontrol barı */}
        {focusMode && (
          <div className="flex items-center justify-between border-b border-ink-700/50 bg-ink-900/80 px-4 py-2.5">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/20">
                <Activity className="h-4 w-4" />
              </div>
              <select
                value={symbolId}
                onChange={(e) => switchSymbol(e.target.value)}
                className="ring-focus rounded-lg border border-ink-700 bg-ink-850 px-3 py-1.5 text-sm font-semibold text-white"
              >
                <optgroup label="Tarım Ürünleri">
                  {taSymbols.filter((s) => s.category !== 'Endeks').map((s) => (
                    <option key={s.id} value={s.id} className="bg-ink-900">{s.name}</option>
                  ))}
                </optgroup>
                <optgroup label="Tarım Endeksleri">
                  {taSymbols.filter((s) => s.category === 'Endeks').map((s) => (
                    <option key={s.id} value={s.id} className="bg-ink-900">{s.name}</option>
                  ))}
                </optgroup>
              </select>
              <div className="hidden items-center gap-2 sm:flex">
                <Stat label="Son" value={stats.last.toFixed(2)} accent={stats.change >= 0 ? 'emerald' : 'rose'} />
                <Stat label="Değişim" value={formatPct(stats.change)} accent={stats.change >= 0 ? 'emerald' : 'rose'} />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="hidden items-center gap-1 sm:flex">
                {chartTypes.map((ct) => {
                  const Icon = ct.icon;
                  return (
                    <button
                      key={ct.key}
                      onClick={() => setChartType(ct.key)}
                      className={cn(
                        'flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium transition-colors',
                        chartType === ct.key ? 'bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-500/30' : 'bg-ink-850 text-slate-400 hover:text-slate-200',
                      )}
                    >
                      <Icon className="h-3.5 w-3.5" />
                    </button>
                  );
                })}
              </div>
              <div className="flex items-center gap-1">
                {rangeLabels.map((r) => (
                  <button
                    key={r.key}
                    onClick={() => setRangeKey(r.key)}
                    className={cn(
                      'rounded-md px-2 py-1 text-xs font-medium transition-colors',
                      rangeKey === r.key ? 'bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-500/30' : 'bg-ink-850 text-slate-400 hover:text-slate-200',
                    )}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
              <span className="mx-1 h-5 w-px bg-ink-700" />
              <button
                onClick={toggleFocus}
                className="flex items-center gap-1.5 rounded-md bg-rose-500/10 px-2.5 py-1.5 text-xs font-medium text-rose-300 ring-1 ring-rose-500/20 transition-all hover:bg-rose-500/20 hover:ring-rose-500/40"
                title="Odak modundan çık (Esc)"
              >
                <Minimize2 className="h-3.5 w-3.5" /> Kapat
                <kbd className="ml-1 hidden rounded bg-ink-800 px-1 py-0.5 text-[9px] text-slate-500 sm:inline">Esc</kbd>
              </button>
            </div>
          </div>
        )}

        {/* Odak modu — çizim araç çubuğu */}
        {focusMode && (
          <div className="border-b border-ink-700/50 bg-ink-900/50 px-4 py-1.5">
            <DrawingToolbar
              activeTool={tool}
              onSelectTool={setTool}
              onSave={handleSave}
              onClear={clearDrawings}
              drawingCount={drawings.length}
              savedCount={savedCount}
            />
          </div>
        )}

        {/* Odak modu — indikatör toggles */}
        {focusMode && (
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 border-b border-ink-700/50 bg-ink-900/50 px-4 py-2">
            <span className="flex items-center gap-1 text-[11px] font-medium uppercase tracking-wider text-slate-500">
              <Waves className="h-3.5 w-3.5" /> İndikatörler
            </span>
            <Toggle label="SMA" active={showSMA} onClick={() => setShowSMA((v) => !v)} color="sky" />
            {showSMA && <NumStepper value={smaPeriod} onChange={setSmaPeriod} min={5} max={50} step={1} />}
            <Toggle label="EMA" active={showEMA} onClick={() => setShowEMA((v) => !v)} color="amber" />
            {showEMA && <NumStepper value={emaPeriod} onChange={setEmaPeriod} min={5} max={50} step={1} />}
            <Toggle label="Bollinger" active={showBollinger} onClick={() => setShowBollinger((v) => !v)} color="slate" />
            <span className="mx-1 h-4 w-px bg-ink-700" />
            <Toggle label="RSI" active={showRSI} onClick={() => setShowRSI((v) => !v)} color="violet" />
            {showRSI && <NumStepper value={rsiPeriod} onChange={setRsiPeriod} min={7} max={28} step={1} />}
            <Toggle label="MACD" active={showMACD} onClick={() => setShowMACD((v) => !v)} color="sky" />
          </div>
        )}

        {/* Normal mod — sağ üst köşede Tam Ekran butonu */}
        {!focusMode && (
          <button
            onClick={toggleFocus}
            className="absolute right-3 top-3 z-10 flex items-center gap-1.5 rounded-lg bg-emerald-500/10 px-2.5 py-1.5 text-xs font-medium text-emerald-300 ring-1 ring-emerald-500/20 transition-all duration-200 hover:bg-emerald-500/20 hover:ring-emerald-500/40"
            title="Tam ekran odak moduna geç (Esc ile çık)"
          >
            <Maximize2 className="h-3.5 w-3.5" /> Tam Ekran
          </button>
        )}

        {/* Grafik alanı — odak modunda akıcı yükseklik, kaydırılabilir */}
        <div className={cn(focusMode ? 'min-h-screen px-4 py-3' : '')}>
          <div className={cn(focusMode ? 'flex flex-col gap-3' : '')}>
            <div className={cn(focusMode ? 'h-[70vh] rounded-lg border border-ink-700/50 bg-ink-900/50 p-3' : '')}>
              <CandleChart
                candles={candles}
                unit={symbol.unit}
                chartType={chartType}
                showSMA={showSMA}
                showEMA={showEMA}
                showBollinger={showBollinger}
                smaPeriod={smaPeriod}
                emaPeriod={emaPeriod}
                tool={tool}
                drawings={drawings}
                onAddDrawing={addDrawing}
                onClearDrawings={clearDrawings}
              />
            </div>
            {focusMode && (showRSI || showMACD) && (
              <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                {showRSI && (
                  <div className="rounded-lg border border-ink-700/50 bg-ink-900/50 p-3">
                    <RsiChart candles={candles} period={rsiPeriod} />
                  </div>
                )}
                {showMACD && (
                  <div className="rounded-lg border border-ink-700/50 bg-ink-900/50 p-3">
                    <MacdChart candles={candles} />
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Alt göstergeler — odak modunda gizli */}
      {!focusMode && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {showRSI && (
            <div className="card p-4">
              <RsiChart candles={candles} period={rsiPeriod} />
            </div>
          )}
          {showMACD && (
            <div className="card p-4">
              <MacdChart candles={candles} />
            </div>
          )}
        </div>
      )}

      {/* Bilgi kartları — odak modunda gizli */}
      {!focusMode && (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <InfoCard icon={PenLine} title="Gelişmiş Çizim Araçları" desc="40+ teknik analiz aracı: trend çizgileri, kanallar, üçgenler, bayraklar, Fibonacci, Elliott dalga, harmonik formasyonlar, Gann fanı ve SMC (Smart Money Concepts) araçları. Araç seçip grafiğe tıklayarak çizin." />
          <InfoCard icon={Save} title="Grafiği Kaydet" desc="Çizimlerinizi tarayıcı belleğine (localStorage) kaydedin. Aynı sembole geri döndüğünüzde kayıtlı çizimleri tek tıkla geri yükleyin." />
          <InfoCard icon={Waves} title="İndikatörler" desc="RSI, MACD, SMA, EMA ve Bollinger Bantları — mum hareketlerinden otomatik hesaplanan matematiksel göstergeler." />
        </div>
      )}

      {/* Rapor butonu — odak modunda gizli */}
      {!focusMode && commodity && (
        <div className="flex justify-center">
          <button
            onClick={() => setReportOpen(true)}
            className="ring-focus flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-emerald-500 to-emerald-600 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-emerald-500/20 transition-all hover:from-emerald-400 hover:to-emerald-500"
          >
            <FileText className="h-4 w-4" />
            Kapsamlı Ürün Raporu İndir (PDF)
          </button>
        </div>
      )}

      {/* Ürün detay alt modülleri — maliyet, kârlılık, bölgesel arz — odak modunda gizli */}
      {!focusMode && commodity && <ProductDetailPanels commodity={commodity} />}

      {commodity && (
        <ReportModal
          open={reportOpen}
          onClose={() => setReportOpen(false)}
          data={{
            commodity,
            costBreakdown: commodity.costBreakdown,
            totalCost: commodity.costBreakdown.reduce((s, c) => s + c.amount, 0),
            revenuePerDekar: commodity.yieldPerDekar > 0 ? commodity.yieldPerDekar * commodity.price : 0,
            profitPerDekar: commodity.yieldPerDekar > 0 ? commodity.yieldPerDekar * commodity.price - commodity.costBreakdown.reduce((s, c) => s + c.amount, 0) : 0,
            margin: commodity.yieldPerDekar > 0
              ? ((commodity.yieldPerDekar * commodity.price - commodity.costBreakdown.reduce((s, c) => s + c.amount, 0)) / (commodity.yieldPerDekar * commodity.price)) * 100
              : 0,
          } satisfies ReportData}
        />
      )}
    </div>
  );
}

function Stat({ label, value, accent = 'slate' }: { label: string; value: string; accent?: 'emerald' | 'rose' | 'slate' }) {
  const c = accent === 'emerald' ? 'text-emerald-400' : accent === 'rose' ? 'text-rose-400' : 'text-slate-200';
  return (
    <div className="rounded-lg border border-ink-700/50 bg-ink-850/50 px-3 py-1.5">
      <div className="stat-label">{label}</div>
      <div className={cn('tabular text-sm font-semibold', c)}>{value}</div>
    </div>
  );
}

function Toggle({ label, active, onClick, color }: { label: string; active: boolean; onClick: () => void; color: 'sky' | 'amber' | 'slate' | 'violet' }) {
  const colors = {
    sky: 'bg-sky-500/15 text-sky-300 ring-sky-500/30',
    amber: 'bg-amber-500/15 text-amber-300 ring-amber-500/30',
    slate: 'bg-slate-500/15 text-slate-300 ring-slate-500/30',
    violet: 'bg-violet-500/15 text-violet-300 ring-violet-500/30',
  };
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-all',
        active ? cn(colors[color], 'ring-1') : 'bg-ink-850 text-slate-500 hover:text-slate-300',
      )}
    >
      <span className={cn('h-1.5 w-1.5 rounded-full', active ? 'bg-current' : 'bg-slate-600')} />
      {label}
    </button>
  );
}

function NumStepper({ value, onChange, min, max, step }: { value: number; onChange: (v: number) => void; min: number; max: number; step: number }) {
  return (
    <div className="flex items-center gap-1">
      <button onClick={() => onChange(Math.max(min, value - step))} className="rounded text-slate-500 hover:text-emerald-400">−</button>
      <span className="tabular w-6 text-center text-xs text-slate-300">{value}</span>
      <button onClick={() => onChange(Math.min(max, value + step))} className="rounded text-slate-500 hover:text-emerald-400">+</button>
    </div>
  );
}

function InfoCard({ icon: Icon, title, desc }: { icon: typeof PenLine; title: string; desc: string }) {
  return (
    <div className="card card-hover p-4">
      <div className="mb-2 flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400">
          <Icon className="h-4 w-4" />
        </div>
        <h4 className="text-sm font-semibold text-white">{title}</h4>
      </div>
      <p className="text-xs leading-relaxed text-slate-500">{desc}</p>
    </div>
  );
}
