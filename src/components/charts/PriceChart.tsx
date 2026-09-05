import { useMemo, useState } from 'react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Brush,
  ReferenceLine,
} from 'recharts';
import type { PricePoint } from '@/types';
import { formatTRY, trendColor } from '@/lib/format';
import { cn } from '@/lib/cn';

type RangeKey = '1A' | '3A' | '6A' | '1Y' | 'TÜM';

const ranges: { key: RangeKey; label: string; days: number }[] = [
  { key: '1A', label: '1 Ay', days: 30 },
  { key: '3A', label: '3 Ay', days: 90 },
  { key: '6A', label: '6 Ay', days: 180 },
  { key: '1Y', label: '1 Yıl', days: 365 },
  { key: 'TÜM', label: 'Tümü', days: 9999 },
];

interface PriceChartProps {
  data: PricePoint[];
  unit: string;
  color?: string;
  height?: number;
  defaultRange?: RangeKey;
  showBrush?: boolean;
  showVolume?: boolean;
}

const chartTheme = {
  grid: '#1b2636',
  axis: '#64748b',
  tooltipBg: '#0d131b',
  tooltipBorder: '#283445',
};

function CustomTooltip({ active, payload, unit }: { active?: boolean; payload?: { value: number; payload: PricePoint }[]; unit: string }) {
  if (!active || !payload || !payload.length) return null;
  const entry = payload[0];
  const p = entry.payload as PricePoint;
  const value = entry.value as number;
  return (
    <div className="rounded-lg border border-ink-600 bg-ink-900/95 px-3 py-2 shadow-xl backdrop-blur">
      <div className="tabular text-[10px] text-slate-500">{formatDate(p.date)}</div>
      <div className="tabular mt-0.5 text-sm font-semibold text-white">
        {formatTRY(value)} <span className="text-xs text-slate-500">{unit}</span>
      </div>
      <div className="tabular mt-0.5 text-[10px] text-slate-500">Hacim: {p.volume.toLocaleString('tr-TR')} t</div>
    </div>
  );
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('tr-TR', { day: '2-digit', month: 'short', year: 'numeric' });
}

function formatMonth(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('tr-TR', { month: 'short' });
}

export function PriceChart({
  data,
  unit,
  color = '#10b981',
  height = 280,
  defaultRange = '3A',
  showBrush = true,
  showVolume = true,
}: PriceChartProps) {
  const [range, setRange] = useState<RangeKey>(defaultRange);

  const sliced = useMemo(() => {
    const days = ranges.find((r) => r.key === range)!.days;
    return data.slice(Math.max(0, data.length - days));
  }, [data, range]);

  const { min, max, startPrice, endPrice, periodChange } = useMemo(() => {
    const prices = sliced.map((p) => p.price);
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    const startPrice = sliced[0]?.price ?? 0;
    const endPrice = sliced[sliced.length - 1]?.price ?? 0;
    const periodChange = startPrice > 0 ? ((endPrice - startPrice) / startPrice) * 100 : 0;
    return { min, max, startPrice, endPrice, periodChange };
  }, [sliced]);

  const yPad = (max - min) * 0.12 || 1;
  const yDomain: [number, number] = [Number((min - yPad).toFixed(2)), Number((max + yPad).toFixed(2))];
  const gradId = `price-grad-${color.replace('#', '')}`;
  const volGradId = `vol-grad-${color.replace('#', '')}`;
  const up = periodChange >= 0;
  const lineColor = up ? color : '#f43f5e';

  return (
    <div>
      {/* Üst bar: aralık seçici + özet */}
      <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <span className="tabular text-lg font-bold text-white">
            {formatTRY(endPrice)} <span className="text-xs font-normal text-slate-500">{unit}</span>
          </span>
          <span className={cn('tabular text-sm font-medium', trendColor(periodChange))}>
            {up ? '+' : ''}
            {periodChange.toFixed(2)}%
          </span>
          <span className="text-[11px] text-slate-600">seçili dönem</span>
        </div>
        <div className="flex flex-wrap gap-1">
          {ranges.map((r) => (
            <button
              key={r.key}
              onClick={() => setRange(r.key)}
              className={cn(
                'rounded-md px-2.5 py-1 text-xs font-medium transition-colors',
                range === r.key
                  ? 'bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-500/30'
                  : 'bg-ink-850 text-slate-500 hover:bg-ink-800 hover:text-slate-300',
              )}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {/* Fiyat alan grafiği */}
      <div style={{ width: '100%', height }}>
        <ResponsiveContainer>
          <AreaChart data={sliced} margin={{ top: 8, right: 8, left: 4, bottom: 0 }}>
            <defs>
              <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={lineColor} stopOpacity="0.3" />
                <stop offset="100%" stopColor={lineColor} stopOpacity="0" />
              </linearGradient>
            </defs>
            <CartesianGrid stroke={chartTheme.grid} strokeDasharray="2 4" vertical={false} />
            <XAxis
              dataKey="date"
              tickFormatter={formatMonth}
              tick={{ fill: chartTheme.axis, fontSize: 11, fontFamily: 'JetBrains Mono, monospace' }}
              tickLine={false}
              axisLine={{ stroke: chartTheme.grid }}
              minTickGap={32}
            />
            <YAxis
              domain={yDomain}
              tickFormatter={(v: number) => v.toLocaleString('tr-TR')}
              tick={{ fill: chartTheme.axis, fontSize: 11, fontFamily: 'JetBrains Mono, monospace' }}
              tickLine={false}
              axisLine={false}
              width={52}
              orientation="right"
            />
            <Tooltip content={<CustomTooltip unit={unit} />} />
            <ReferenceLine y={startPrice} stroke="#3a485c" strokeDasharray="4 4" />
            <Area
              type="monotone"
              dataKey="price"
              stroke={lineColor}
              strokeWidth={2}
              fill={`url(#${gradId})`}
              activeDot={{ r: 4, fill: lineColor, stroke: '#0a0f16', strokeWidth: 2 }}
              isAnimationActive={false}
            />
            {showBrush && (
              <Brush
                dataKey="date"
                height={22}
                stroke={lineColor}
                fill="#0d131b"
                travellerWidth={10}
                tickFormatter={formatMonth}
                startIndex={0}
                endIndex={sliced.length - 1}
              />
            )}
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Hacim grafiği */}
      {showVolume && (
        <div className="mt-2" style={{ width: '100%', height: 64 }}>
          <ResponsiveContainer>
            <BarChart data={sliced} margin={{ top: 0, right: 8, left: 4, bottom: 0 }}>
              <defs>
                <linearGradient id={volGradId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={lineColor} stopOpacity="0.55" />
                  <stop offset="100%" stopColor={lineColor} stopOpacity="0.12" />
                </linearGradient>
              </defs>
              <XAxis dataKey="date" hide />
              <YAxis hide domain={[0, 'dataMax']} />
              <Bar dataKey="volume" fill={`url(#${volGradId})`} radius={[2, 2, 0, 0]} isAnimationActive={false} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
