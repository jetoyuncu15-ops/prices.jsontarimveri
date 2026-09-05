import { useState } from 'react';
import { ChevronDown, Save, Trash2, X, MousePointer2 } from 'lucide-react';
import { DRAW_TOOLS, TOOL_CATEGORIES, type ToolCategory } from '@/lib/drawingTools';
import { cn } from '@/lib/cn';

interface DrawingToolbarProps {
  activeTool: string;
  onSelectTool: (tool: string) => void;
  onSave: () => void;
  onClear: () => void;
  drawingCount: number;
  savedCount: number;
}

export function DrawingToolbar({
  activeTool,
  onSelectTool,
  onSave,
  onClear,
  drawingCount,
  savedCount,
}: DrawingToolbarProps) {
  const [openCats, setOpenCats] = useState<Set<ToolCategory>>(new Set(['trend-seviye']));
  const [showAll, setShowAll] = useState(false);

  const toggleCat = (cat: ToolCategory) => {
    setOpenCats((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  };

  return (
    <div className="card overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-ink-700/60 px-4 py-2.5">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Gelişmiş Çizim Araçları
          </span>
          {drawingCount > 0 && (
            <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-medium text-amber-300">
              {drawingCount} çizim
            </span>
          )}
          {savedCount > 0 && (
            <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-medium text-emerald-300">
              {savedCount} kayıtlı
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={onSave}
            disabled={drawingCount === 0}
            className={cn(
              'flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-colors',
              drawingCount > 0
                ? 'bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-500/30 hover:bg-emerald-500/25'
                : 'cursor-not-allowed bg-ink-850 text-slate-600',
            )}
            title="Çizimleri tarayıcı belleğine kaydet"
          >
            <Save className="h-3.5 w-3.5" /> Grafiği Kaydet
          </button>
          {drawingCount > 0 && (
            <button
              onClick={onClear}
              className="flex items-center gap-1.5 rounded-md bg-ink-850 px-2.5 py-1 text-xs font-medium text-rose-400/70 hover:bg-rose-500/10 hover:text-rose-400"
            >
              <Trash2 className="h-3.5 w-3.5" /> Temizle
            </button>
          )}
        </div>
      </div>

      {/* No-tool (cursor) button */}
      <div className="flex items-center gap-1.5 border-b border-ink-800/50 px-4 py-2">
        <button
          onClick={() => onSelectTool('none')}
          className={cn(
            'flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors',
            activeTool === 'none'
              ? 'bg-slate-500/15 text-slate-200 ring-1 ring-slate-500/30'
              : 'bg-ink-850 text-slate-400 hover:bg-ink-800 hover:text-slate-200',
          )}
        >
          <MousePointer2 className="h-3.5 w-3.5" /> İmleç (Çizim Kapalı)
        </button>
        <button
          onClick={() => setShowAll((v) => !v)}
          className="ml-auto rounded-md px-2.5 py-1.5 text-xs font-medium text-slate-400 hover:text-slate-200"
        >
          {showAll ? 'Kategorileri Daralt' : 'Tümünü Genişlet'}
        </button>
      </div>

      {/* Categorized tool list */}
      <div className="max-h-[320px] overflow-y-auto">
        {TOOL_CATEGORIES.map((cat) => {
          const tools = DRAW_TOOLS.filter((t) => t.category === cat.id);
          const isOpen = showAll || openCats.has(cat.id);
          const CatIcon = cat.icon;
          return (
            <div key={cat.id} className="border-b border-ink-800/40 last:border-0">
              <button
                onClick={() => toggleCat(cat.id)}
                className="flex w-full items-center gap-2 px-4 py-2 text-left transition-colors hover:bg-ink-800/30"
              >
                <CatIcon className="h-3.5 w-3.5 text-slate-500" />
                <span className="text-xs font-semibold text-slate-300">{cat.label}</span>
                <span className="ml-1 text-[10px] text-slate-600">({tools.length})</span>
                <ChevronDown
                  className={cn(
                    'ml-auto h-3.5 w-3.5 text-slate-600 transition-transform',
                    isOpen && 'rotate-180',
                  )}
                />
              </button>
              {isOpen && (
                <div className="grid grid-cols-2 gap-1.5 px-3 pb-3 sm:grid-cols-3 lg:grid-cols-4">
                  {tools.map((t) => {
                    const Icon = t.icon;
                    const isActive = activeTool === t.id;
                    return (
                      <button
                        key={t.id}
                        onClick={() => onSelectTool(isActive ? 'none' : t.id)}
                        title={t.hint}
                        className={cn(
                          'flex items-center gap-1.5 rounded-md px-2 py-1.5 text-[11px] font-medium transition-all',
                          isActive
                            ? 'bg-amber-500/15 text-amber-300 ring-1 ring-amber-500/30'
                            : 'bg-ink-850 text-slate-400 hover:bg-ink-800 hover:text-slate-200',
                        )}
                      >
                        <Icon className="h-3 w-3 shrink-0" style={{ color: isActive ? undefined : t.color }} />
                        <span className="truncate">{t.shortLabel}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Active tool hint */}
      {activeTool !== 'none' && (
        <div className="border-t border-ink-700/60 bg-amber-500/5 px-4 py-2">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
            <span className="text-xs text-amber-200">
              {DRAW_TOOLS.find((t) => t.id === activeTool)?.hint ?? activeTool}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
