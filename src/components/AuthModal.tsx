import { useState, useEffect, useRef } from 'react';
import { X, Mail, Lock, User, LogOut, Eye, EyeOff } from 'lucide-react';
import { cn } from '@/lib/cn';

export interface AuthUser {
  name: string;
  email: string;
}

interface AuthModalProps {
  open: boolean;
  onClose: () => void;
  onLogin: (user: AuthUser) => void;
}

export function AuthModal({ open, onClose, onLogin }: AuthModalProps) {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const firstInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setError(null);
      setTimeout(() => firstInputRef.current?.focus(), 100);
    }
  }, [open, mode]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  if (!open) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (mode === 'register' && name.trim().length < 2) {
      setError('Lütfen adınızı girin (en az 2 karakter).');
      return;
    }
    if (!email.includes('@') || email.trim().length < 5) {
      setError('Geçerli bir e-posta adresi girin.');
      return;
    }
    if (password.length < 4) {
      setError('Şifre en az 4 karakter olmalı.');
      return;
    }

    setLoading(true);
    setTimeout(() => {
      const displayName = mode === 'register' ? name.trim() : email.split('@')[0];
      onLogin({ name: displayName, email: email.trim() });
      setLoading(false);
      setPassword('');
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-md overflow-visible rounded-2xl border border-ink-700 bg-ink-900 shadow-2xl">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-1.5 text-slate-500 transition-colors hover:bg-ink-800 hover:text-slate-300"
          aria-label="Kapat"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="px-6 pt-7 pb-2 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 shadow-lg shadow-emerald-500/20">
            <Lock className="h-6 w-6 text-white" />
          </div>
          <h2 className="text-lg font-bold text-white">
            {mode === 'login' ? 'Giriş Yap' : 'Üye Ol'}
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            {mode === 'login'
              ? 'Hesabınıza giriş yaparak tüm özelliklere erişin'
              : 'Ücretsiz hesap oluşturun ve analiz yapmaya başlayın'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="px-6 pb-6 pt-4">
          {mode === 'register' && (
            <div className="mb-3">
              <label className="mb-1 block text-[11px] font-medium text-slate-400">Ad Soyad</label>
              <div className="relative">
                <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-600" />
                <input
                  ref={mode === 'register' ? firstInputRef : undefined}
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Adınız Soyadınız"
                  className="ring-focus w-full rounded-lg border border-ink-700 bg-ink-850 py-2.5 pl-10 pr-3 text-sm text-slate-200 placeholder:text-slate-600"
                />
              </div>
            </div>
          )}

          <div className="mb-3">
            <label className="mb-1 block text-[11px] font-medium text-slate-400">E-posta</label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-600" />
              <input
                ref={mode === 'login' ? firstInputRef : undefined}
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ornek@email.com"
                className="ring-focus w-full rounded-lg border border-ink-700 bg-ink-850 py-2.5 pl-10 pr-3 text-sm text-slate-200 placeholder:text-slate-600"
              />
            </div>
          </div>

          <div className="mb-4">
            <label className="mb-1 block text-[11px] font-medium text-slate-400">Şifre</label>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-600" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="ring-focus w-full rounded-lg border border-ink-700 bg-ink-850 py-2.5 pl-10 pr-10 text-sm text-slate-200 placeholder:text-slate-600"
              />
              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-600 transition-colors hover:text-slate-400"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {error && (
            <div className="mb-3 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs text-rose-300">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="ring-focus w-full rounded-lg bg-gradient-to-r from-emerald-500 to-emerald-600 py-2.5 text-sm font-semibold text-white shadow-lg shadow-emerald-500/20 transition-all hover:from-emerald-400 hover:to-emerald-500 disabled:opacity-60"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                İşleniyor...
              </span>
            ) : mode === 'login' ? 'Giriş Yap' : 'Hesap Oluştur'}
          </button>

          <div className="mt-4 text-center text-xs text-slate-500">
            {mode === 'login' ? (
              <>
                Hesabınız yok mu?{' '}
                <button type="button" onClick={() => setMode('register')} className="font-medium text-emerald-400 hover:text-emerald-300">
                  Üye olun
                </button>
              </>
            ) : (
              <>
                Zaten hesabınız var mı?{' '}
                <button type="button" onClick={() => setMode('login')} className="font-medium text-emerald-400 hover:text-emerald-300">
                  Giriş yapın
                </button>
              </>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}

export function ProfileMenu({ user, onLogout }: { user: AuthUser; onLogout: () => void }) {
  const [open, setOpen] = useState(false);
  const initials = user.name
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  useEffect(() => {
    if (!open) return;
    const handler = () => setOpen(false);
    window.addEventListener('click', handler);
    return () => window.removeEventListener('click', handler);
  }, [open]);

  return (
    <div className="relative" onClick={(e) => e.stopPropagation()}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="ring-focus flex items-center gap-2 rounded-lg border border-ink-700 bg-ink-850 py-1 pl-1 pr-2.5 transition-colors hover:border-ink-600"
      >
        <span className="flex h-7 w-7 items-center justify-center rounded-md bg-gradient-to-br from-emerald-500 to-emerald-700 text-xs font-bold text-white">
          {initials}
        </span>
        <span className="hidden text-sm font-medium text-slate-200 sm:block">{user.name.split(' ')[0]}</span>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-[99998]" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full z-[99999] mt-2 w-64 overflow-visible rounded-lg border border-ink-700 bg-ink-900 shadow-2xl pointer-events-auto">
            <div className="border-b border-ink-700/60 px-4 py-3">
              <div className="text-sm font-semibold text-white">{user.name}</div>
              <div className="mt-0.5 truncate text-xs text-slate-500">{user.email}</div>
            </div>
            <div className="p-1.5">
              <button
                onClick={() => {
                  setOpen(false);
                  onLogout();
                }}
                className="ring-focus flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm text-rose-400 transition-colors hover:bg-rose-500/10"
              >
                <LogOut className="h-4 w-4" />
                Çıkış Yap
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
