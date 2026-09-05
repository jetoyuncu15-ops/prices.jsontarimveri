import type { Trend } from '@/types';

export function formatTRY(value: number, fractionDigits = 2): string {
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY',
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(value);
}

export function formatNumber(value: number, fractionDigits = 0): string {
  return new Intl.NumberFormat('tr-TR', {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(value);
}

export function formatPct(value: number, withSign = true): string {
  const sign = withSign && value > 0 ? '+' : '';
  return `${sign}${value.toFixed(2)}%`;
}

export function trendOf(changePct: number): Trend {
  if (changePct > 0.05) return 'up';
  if (changePct < -0.05) return 'down';
  return 'flat';
}

export function trendColor(changePct: number): string {
  const t = trendOf(changePct);
  if (t === 'up') return 'text-emerald-400';
  if (t === 'down') return 'text-rose-400';
  return 'text-slate-400';
}

export function sparkPath(values: number[], width: number, height: number, pad = 2): string {
  if (values.length < 2) return '';
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const stepX = (width - pad * 2) / (values.length - 1);
  return values
    .map((v, i) => {
      const x = pad + i * stepX;
      const y = pad + (1 - (v - min) / range) * (height - pad * 2);
      return `${i === 0 ? 'M' : 'L'}${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(' ');
}
