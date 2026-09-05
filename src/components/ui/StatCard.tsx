interface StatCardProps {
  label: string;
  value: string;
  unit?: string;
  sub?: React.ReactNode;
  accent?: 'emerald' | 'rose' | 'slate' | 'amber';
  className?: string;
}

const accentMap = {
  emerald: 'text-emerald-400',
  rose: 'text-rose-400',
  slate: 'text-slate-300',
  amber: 'text-amber-400',
};

export function StatCard({ label, value, unit, sub, accent = 'slate', className = '' }: StatCardProps) {
  return (
    <div className={`card card-hover p-4 ${className}`}>
      <div className="stat-label mb-1.5">{label}</div>
      <div className="flex items-baseline gap-1">
        <span className={`text-xl font-semibold tabular ${accentMap[accent]}`}>{value}</span>
        {unit && <span className="text-xs text-slate-500">{unit}</span>}
      </div>
      {sub && <div className="mt-2 text-xs text-slate-500">{sub}</div>}
    </div>
  );
}
