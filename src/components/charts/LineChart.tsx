import { useMemo, useState } from 'react';

interface LineChartProps {
  data: number[];
  width?: number;
  height?: number;
  color?: string;
  fill?: boolean;
  showGrid?: boolean;
  showAxis?: boolean;
  strokeWidth?: number;
  className?: string;
}

// Saf SVG çizgi grafiği — bağımlılık yok, tam responsive
export function LineChart({
  data,
  width = 600,
  height = 220,
  color = '#10b981',
  fill = true,
  showGrid = true,
  showAxis = false,
  strokeWidth = 2,
  className,
}: LineChartProps) {
  const [hover, setHover] = useState<number | null>(null);

  const { linePath, areaPath, points, min, max } = useMemo(() => {
    if (data.length < 2) return { linePath: '', areaPath: '', points: [], min: 0, max: 1 };
    const padL = showAxis ? 44 : 8;
    const padR = 8;
    const padT = 10;
    const padB = showAxis ? 22 : 8;
    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;
    const stepX = (width - padL - padR) / (data.length - 1);
    const pts = data.map((v, i) => ({
      x: padL + i * stepX,
      y: padT + (1 - (v - min) / range) * (height - padT - padB),
      v,
    }));
    const line = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(' ');
    const area = `${line} L${pts[pts.length - 1].x.toFixed(2)},${height - padB} L${pts[0].x.toFixed(2)},${height - padB} Z`;
    return { linePath: line, areaPath: area, points: pts, min, max };
  }, [data, width, height, showAxis]);

  const gridLines = useMemo(() => {
    if (!showGrid) return [];
    const padL = showAxis ? 44 : 8;
    const padR = 8;
    const padT = 10;
    const padB = showAxis ? 22 : 8;
    return [0, 0.25, 0.5, 0.75, 1].map((t) => padT + t * (height - padT - padB)).map((y) => ({
      y,
      x1: padL,
      x2: width - padR,
    }));
  }, [showGrid, width, height, showAxis]);

  const handleMove = (e: React.MouseEvent<SVGElement>) => {
    const rect = (e.currentTarget as SVGElement).getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * width;
    const padL = showAxis ? 44 : 8;
    const padR = 8;
    const stepX = (width - padL - padR) / (data.length - 1);
    const idx = Math.round((x - padL) / stepX);
    setHover(Math.max(0, Math.min(data.length - 1, idx)));
  };

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      className={className}
      style={{ width: '100%', height: 'auto' }}
      onMouseMove={handleMove}
      onMouseLeave={() => setHover(null)}
    >
      <defs>
        <linearGradient id={`grad-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.28" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>

      {gridLines.map((g, i) => (
        <line key={i} x1={g.x1} y1={g.y} x2={g.x2} y2={g.y} stroke="#1b2636" strokeWidth="1" strokeDasharray="2 4" />
      ))}

      {showAxis && (
        <text x="6" y="16" fill="#64748b" fontSize="10" fontFamily="JetBrains Mono, monospace">
          {max.toFixed(1)}
        </text>
      )}
      {showAxis && (
        <text x="6" y={height - 8} fill="#64748b" fontSize="10" fontFamily="JetBrains Mono, monospace">
          {min.toFixed(1)}
        </text>
      )}

      {fill && <path d={areaPath} fill={`url(#grad-${color.replace('#', '')})`} />}
      <path d={linePath} fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinejoin="round" strokeLinecap="round" />

      {hover !== null && points[hover] && (
        <g>
          <line
            x1={points[hover].x}
            y1="10"
            x2={points[hover].x}
            y2={height - (showAxis ? 22 : 8)}
            stroke="#3a485c"
            strokeWidth="1"
            strokeDasharray="3 3"
          />
          <circle cx={points[hover].x} cy={points[hover].y} r="4" fill={color} stroke="#0a0f16" strokeWidth="2" />
        </g>
      )}
    </svg>
  );
}

interface SparklineProps {
  data: number[];
  color?: string;
  width?: number;
  height?: number;
}

export function Sparkline({ data, color = '#10b981', width = 90, height = 30 }: SparklineProps) {
  const path = useMemo(() => {
    if (data.length < 2) return '';
    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;
    const stepX = width / (data.length - 1);
    return data
      .map((v, i) => {
        const x = i * stepX;
        const y = (1 - (v - min) / range) * height;
        return `${i === 0 ? 'M' : 'L'}${x.toFixed(2)},${y.toFixed(2)}`;
      })
      .join(' ');
  }, [data, width, height]);

  return (
    <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" style={{ width, height }}>
      <path d={path} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
