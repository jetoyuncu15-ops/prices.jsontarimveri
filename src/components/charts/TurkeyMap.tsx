import { useCallback, useMemo, useRef, useState } from 'react';
import { ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';
import type { RegionSupply } from '@/types';
import { cn } from '@/lib/cn';

const MAP_BOUNDS = { minLat: 35.5, maxLat: 42.3, minLng: 25.5, maxLng: 45.0 };
const W = 600;
const H = 360;

function project(lat: number, lng: number): { x: number; y: number } {
  const x = ((lng - MAP_BOUNDS.minLng) / (MAP_BOUNDS.maxLng - MAP_BOUNDS.minLng)) * W;
  const y = ((MAP_BOUNDS.maxLat - lat) / (MAP_BOUNDS.maxLat - MAP_BOUNDS.minLat)) * H;
  return { x, y };
}

interface Cluster {
  type: 'single' | 'group';
  cities: RegionSupply[];
  cx: number;
  cy: number;
  totalSupply: number;
  status: RegionSupply['status'];
}

const statusColor: Record<RegionSupply['status'], string> = {
  surplus: '#10b981',
  deficit: '#f43f5e',
  balanced: '#f59e0b',
};

interface TurkeyMapProps {
  data: RegionSupply[];
  selected: RegionSupply | null;
  onSelect: (r: RegionSupply) => void;
}

export function TurkeyMap({ data, selected, onSelect }: TurkeyMapProps) {
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [hovered, setHovered] = useState<string | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const dragState = useRef<{ startX: number; startY: number; panX: number; panY: number; moved: boolean } | null>(null);

  const maxSupply = useMemo(() => Math.max(...data.map((d) => d.totalSupply), 1), [data]);

  const clusterThreshold = useMemo(() => {
    if (zoom > 2.5) return 0;
    if (zoom > 1.8) return 10;
    if (zoom > 1.3) return 16;
    return 18;
  }, [zoom]);

  const clusters = useMemo<Cluster[]>(() => {
    if (clusterThreshold === 0) {
      return data.map((r) => {
        const p = project(r.lat, r.lng);
        return {
          type: 'single' as const,
          cities: [r],
          cx: p.x,
          cy: p.y,
          totalSupply: r.totalSupply,
          status: r.status,
        };
      });
    }

    const used = new Set<string>();
    const result: Cluster[] = [];
    for (const r of data) {
      if (used.has(r.city)) continue;
      const p1 = project(r.lat, r.lng);
      const group: RegionSupply[] = [r];
      used.add(r.city);
      for (const other of data) {
        if (used.has(other.city)) continue;
        const p2 = project(other.lat, other.lng);
        const dist = Math.hypot(p1.x - p2.x, p1.y - p2.y);
        if (dist < clusterThreshold) {
          group.push(other);
          used.add(other.city);
        }
      }
      const cx = group.reduce((s, g) => s + project(g.lat, g.lng).x, 0) / group.length;
      const cy = group.reduce((s, g) => s + project(g.lat, g.lng).y, 0) / group.length;
      const totalSupply = group.reduce((s, g) => s + g.totalSupply, 0);
      const statusCounts = group.reduce(
        (acc, g) => {
          acc[g.status]++;
          return acc;
        },
        { surplus: 0, deficit: 0, balanced: 0 } as Record<RegionSupply['status'], number>,
      );
      const dominantStatus = Object.entries(statusCounts).sort((a, b) => b[1] - a[1])[0][0] as RegionSupply['status'];
      result.push({
        type: group.length > 1 ? 'group' : 'single',
        cities: group,
        cx,
        cy,
        totalSupply,
        status: dominantStatus,
      });
    }
    return result;
  }, [data, clusterThreshold]);

  const clampPan = useCallback((p: { x: number; y: number }) => {
    const maxX = (W * (zoom - 1)) / 2;
    const maxY = (H * (zoom - 1)) / 2;
    return {
      x: Math.max(-maxX, Math.min(maxX, p.x)),
      y: Math.max(-maxY, Math.min(maxY, p.y)),
    };
  }, [zoom]);

  const handleZoomIn = () => {
    setZoom((z) => Math.min(4, z + 0.5));
    setPan((p) => clampPan(p));
  };
  const handleZoomOut = () => {
    setZoom((z) => Math.max(1, z - 0.5));
    if (zoom <= 1.5) setPan({ x: 0, y: 0 });
    else setPan((p) => clampPan(p));
  };
  const handleReset = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  const zoomTo = useCallback((cx: number, cy: number) => {
    setZoom(3);
    const targetPan = {
      x: -(cx - W / 2) * 2,
      y: -(cy - H / 2) * 2,
    };
    setPan(clampPan(targetPan));
  }, [clampPan]);

  const handleClusterClick = (cluster: Cluster) => {
    if (cluster.type === 'group') {
      zoomTo(cluster.cx, cluster.cy);
    } else {
      onSelect(cluster.cities[0]);
    }
  };

  // Sürükleme ile pan — sadece arka planda, noktalara tıklamayı engellemez
  const handlePointerDown = (e: React.PointerEvent) => {
    if (zoom === 1) return;
    dragState.current = { startX: e.clientX, startY: e.clientY, panX: pan.x, panY: pan.y, moved: false };
  };
  const handlePointerMove = (e: React.PointerEvent) => {
    if (!dragState.current) return;
    const dx = e.clientX - dragState.current.startX;
    const dy = e.clientY - dragState.current.startY;
    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) dragState.current.moved = true;
    const scale = svgRef.current ? W / svgRef.current.clientWidth : 1;
    setPan(clampPan({ x: dragState.current.panX + dx * scale, y: dragState.current.panY + dy * scale }));
  };
  const handlePointerUp = () => {
    dragState.current = null;
  };

  const transform = `translate(${W / 2 + pan.x}, ${H / 2 + pan.y}) scale(${zoom}) translate(${-W / 2}, ${-H / 2})`;

  return (
    <div className="relative">
      <div className="grid-glow relative aspect-[5/3] w-full overflow-hidden rounded-lg border border-ink-700/50 bg-ink-900/40">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${W} ${H}`}
          className="absolute inset-0 h-full w-full"
          preserveAspectRatio="xMidYMid meet"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          style={{ cursor: zoom > 1 ? 'grab' : 'default', touchAction: 'none' }}
        >
          <defs>
            <radialGradient id="map-glow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.04" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
            </radialGradient>
          </defs>
          <rect x="0" y="0" width={W} height={H} fill="url(#map-glow)" />
          <path
            d="M50,180 Q70,100 130,85 Q200,65 260,80 Q330,70 380,100 Q420,120 425,165 Q420,210 385,230 Q335,255 270,260 Q190,265 135,240 Q80,220 55,195 Z"
            fill="#0d131b"
            stroke="#1b2636"
            strokeWidth="1.5"
          />

          <g transform={transform}>
            {clusters.map((cluster, i) => {
              const radius = cluster.type === 'group'
                ? 8 + Math.min(16, Math.sqrt(cluster.cities.length) * 5)
                : 4 + (cluster.totalSupply / maxSupply) * 12;
              const isSelected = cluster.type === 'single' && selected?.city === cluster.cities[0].city;
              const isHovered = hovered === `${cluster.cx}-${cluster.cy}`;
              const color = statusColor[cluster.status];
              return (
                <g
                  key={i}
                  className="cursor-pointer"
                  style={{ pointerEvents: 'all' }}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (dragState.current?.moved) return;
                    handleClusterClick(cluster);
                  }}
                  onPointerEnter={() => setHovered(`${cluster.cx}-${cluster.cy}`)}
                  onPointerLeave={() => setHovered(null)}
                >
                  {/* Halo */}
                  <circle
                    cx={cluster.cx}
                    cy={cluster.cy}
                    r={radius + (isSelected ? 8 : 4)}
                    fill={color}
                    fillOpacity={isSelected ? 0.25 : isHovered ? 0.18 : 0.1}
                    className="transition-all"
                    style={{ pointerEvents: 'all' }}
                  />
                  {/* Core */}
                  <circle
                    cx={cluster.cx}
                    cy={cluster.cy}
                    r={isSelected ? 5 : cluster.type === 'group' ? radius * 0.55 : 3.5}
                    fill={color}
                    stroke="#060a0f"
                    strokeWidth="1.5"
                    className="transition-all"
                    style={{ pointerEvents: 'all' }}
                  />
                  {/* Cluster count */}
                  {cluster.type === 'group' && (
                    <text
                      x={cluster.cx}
                      y={cluster.cy + 3}
                      textAnchor="middle"
                      fill="#e6edf3"
                      fontSize="9"
                      fontWeight="700"
                      fontFamily="JetBrains Mono, monospace"
                      style={{ pointerEvents: 'none' }}
                    >
                      {cluster.cities.length}
                    </text>
                  )}
                  {/* Selected/hovered label */}
                  {(isSelected || isHovered) && cluster.type === 'single' && (
                    <>
                      <rect
                        x={cluster.cx - cluster.cities[0].city.length * 3.2 - 5}
                        y={cluster.cy - radius - 18}
                        width={cluster.cities[0].city.length * 6.4 + 10}
                        height="14"
                        rx="3"
                        fill="#0a0f16"
                        fillOpacity="0.9"
                        style={{ pointerEvents: 'none' }}
                      />
                      <text
                        x={cluster.cx}
                        y={cluster.cy - radius - 8}
                        textAnchor="middle"
                        fill="#e6edf3"
                        fontSize="10"
                        fontWeight="600"
                        style={{ pointerEvents: 'none' }}
                      >
                        {cluster.cities[0].city}
                      </text>
                    </>
                  )}
                </g>
              );
            })}
          </g>
        </svg>

        {/* Zoom kontrolleri */}
        <div className="absolute right-3 top-3 z-10 flex flex-col gap-1.5">
          <button onClick={handleZoomIn} className="ring-focus flex h-8 w-8 items-center justify-center rounded-lg border border-ink-700 bg-ink-900/90 text-slate-400 hover:text-emerald-400" title="Yakınlaştır">
            <ZoomIn className="h-4 w-4" />
          </button>
          <button onClick={handleZoomOut} className="ring-focus flex h-8 w-8 items-center justify-center rounded-lg border border-ink-700 bg-ink-900/90 text-slate-400 hover:text-emerald-400" title="Uzaklaştır">
            <ZoomOut className="h-4 w-4" />
          </button>
          <button onClick={handleReset} className="ring-focus flex h-8 w-8 items-center justify-center rounded-lg border border-ink-700 bg-ink-900/90 text-slate-400 hover:text-emerald-400" title="Sıfırla">
            <Maximize2 className="h-4 w-4" />
          </button>
        </div>

        {/* Lejant */}
        <div className="absolute bottom-3 left-3 z-10 flex items-center gap-3 rounded-lg border border-ink-700/50 bg-ink-900/80 px-3 py-1.5 text-[10px] backdrop-blur">
          <span className="flex items-center gap-1.5 text-slate-400">
            <span className="h-2 w-2 rounded-full" style={{ background: statusColor.surplus }} /> Arz Fazlası
          </span>
          <span className="flex items-center gap-1.5 text-slate-400">
            <span className="h-2 w-2 rounded-full" style={{ background: statusColor.balanced }} /> Dengede
          </span>
          <span className="flex items-center gap-1.5 text-slate-400">
            <span className="h-2 w-2 rounded-full" style={{ background: statusColor.deficit }} /> Arz Açığı
          </span>
        </div>

        {/* Zoom göstergesi */}
        {zoom > 1 && (
          <div className="absolute bottom-3 right-3 z-10 rounded-lg border border-ink-700/50 bg-ink-900/80 px-2.5 py-1 text-[10px] text-slate-400 backdrop-blur tabular">
            {zoom.toFixed(1)}x · sürükleyerek gezin
          </div>
        )}
      </div>

      <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
        <span>{data.length} il · arz-talep dengesi</span>
        <span>Nokta boyutu = toplam arz · kümeye tıkla = zoom</span>
      </div>
    </div>
  );
}
