import { Menu, Search, Bell, Calendar, LogIn } from 'lucide-react';
import { AuthModal, ProfileMenu, type AuthUser } from '@/components/AuthModal';

interface TopBarProps {
  title: string;
  subtitle: string;
  onMenu: () => void;
  authOpen: boolean;
  onAuthOpen: () => void;
  onAuthClose: () => void;
  onLogin: (user: AuthUser) => void;
  onLogout: () => void;
  user: AuthUser | null;
}

export function TopBar({ title, subtitle, onMenu, authOpen, onAuthOpen, onAuthClose, onLogin, onLogout, user }: TopBarProps) {
  const today = new Date().toLocaleDateString('tr-TR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <>
      <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-ink-700/60 bg-ink-950/80 px-4 py-3 backdrop-blur-md lg:px-6">
        <button
          onClick={onMenu}
          className="rounded-lg p-2 text-slate-400 hover:bg-ink-800 hover:text-white lg:hidden"
          aria-label="Menü"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="min-w-0 flex-1">
          <h1 className="truncate text-base font-semibold text-white lg:text-lg">{title}</h1>
          <p className="hidden truncate text-xs text-slate-500 sm:block">{subtitle}</p>
        </div>

        <div className="hidden items-center gap-2 rounded-lg border border-ink-700 bg-ink-850 px-3 py-1.5 text-xs text-slate-400 md:flex">
          <Calendar className="h-3.5 w-3.5 text-emerald-500/70" />
          <span>{today}</span>
        </div>

        <div className="relative hidden sm:block">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Ürün, borsa veya il ara..."
            className="ring-focus w-44 rounded-lg border border-ink-700 bg-ink-850 py-1.5 pl-9 pr-3 text-sm text-slate-200 placeholder:text-slate-600 lg:w-64"
          />
        </div>

        <button className="relative rounded-lg border border-ink-700 bg-ink-850 p-2 text-slate-400 hover:text-white">
          <Bell className="h-4 w-4" />
          <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-emerald-400" />
        </button>

        {user ? (
          <ProfileMenu user={user} onLogout={onLogout} />
        ) : (
          <button
            onClick={onAuthOpen}
            className="ring-focus flex items-center gap-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-sm font-medium text-emerald-300 transition-all hover:bg-emerald-500/20 hover:text-emerald-200"
          >
            <LogIn className="h-4 w-4" />
            <span className="hidden sm:inline">Giriş Yap</span>
          </button>
        )}
      </header>

      <AuthModal open={authOpen} onClose={onAuthClose} onLogin={onLogin} />
    </>
  );
}
