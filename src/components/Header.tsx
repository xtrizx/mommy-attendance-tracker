import { Shield, Users } from 'lucide-react';

interface HeaderProps {
  view: 'checkin' | 'officer';
  onSwitchView: (v: 'checkin' | 'officer') => void;
  officerUnlocked: boolean;
}

export function Header({ view, onSwitchView, officerUnlocked }: HeaderProps) {
  return (
    <header className="sticky top-0 z-30 border-b border-[var(--color-border-subtle)] bg-[var(--color-bg-base)]/85 backdrop-blur-md">
      <div className="mx-auto max-w-6xl px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <h1
              className="truncate font-[var(--font-display)] text-lg font-bold tracking-wide text-[var(--color-accent)] sm:text-2xl"
              style={{ fontFamily: 'Cinzel, Inter, serif' }}
            >
              Familia
            </h1>
            <p className="truncate text-[11px] font-medium uppercase tracking-[0.18em] text-[var(--color-text-secondary)] sm:text-xs">
              RO New World · Mommy Guild
            </p>
          </div>

          <nav className="flex items-center gap-1 rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-bg-surface)] p-1">
            <button
              onClick={() => onSwitchView('checkin')}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition sm:text-sm ${
                view === 'checkin'
                  ? 'bg-[var(--color-primary)] text-white shadow'
                  : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
              }`}
            >
              <Users size={15} />
              <span className="hidden sm:inline">Check-In</span>
              <span className="sm:hidden">Check-In</span>
            </button>
            <button
              onClick={() => onSwitchView('officer')}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition sm:text-sm ${
                view === 'officer'
                  ? 'bg-[var(--color-accent)] text-[var(--color-bg-base)] shadow'
                  : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
              }`}
            >
              <Shield size={15} />
              <span>Officer</span>
              {officerUnlocked && (
                <span className="ml-0.5 h-1.5 w-1.5 rounded-full bg-[var(--color-success)]" />
              )}
            </button>
          </nav>
        </div>
      </div>
    </header>
  );
}
