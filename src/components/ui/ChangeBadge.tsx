import { ArrowDownRight, ArrowUpRight, Minus } from 'lucide-react';
import { trendOf } from '@/lib/format';
import type { Trend } from '@/types';

interface ChangeBadgeProps {
  value: number;
  size?: 'sm' | 'md';
  withIcon?: boolean;
  className?: string;
}

const trendStyles: Record<Trend, { text: string; bg: string; Icon: typeof ArrowUpRight }> = {
  up: { text: 'text-emerald-400', bg: 'bg-emerald-500/10', Icon: ArrowUpRight },
  down: { text: 'text-rose-400', bg: 'bg-rose-500/10', Icon: ArrowDownRight },
  flat: { text: 'text-slate-400', bg: 'bg-slate-500/10', Icon: Minus },
};

export function ChangeBadge({ value, size = 'sm', withIcon = true, className = '' }: ChangeBadgeProps) {
  const t = trendOf(value);
  const { text, bg, Icon } = trendStyles[t];
  const sign = value > 0 ? '+' : '';
  return (
    <span
      className={`inline-flex items-center gap-0.5 rounded-md font-mono font-medium tabular-nums ${bg} ${text} ${size === 'sm' ? 'px-1.5 py-0.5 text-xs' : 'px-2 py-1 text-sm'} ${className}`}
    >
      {withIcon && <Icon className={size === 'sm' ? 'h-3 w-3' : 'h-3.5 w-3.5'} />}
      {sign}
      {value.toFixed(2)}%
    </span>
  );
}
