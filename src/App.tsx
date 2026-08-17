import { useState } from 'react';
import { Header } from '@/components/Header';
import { CheckInView } from '@/components/CheckInView';
import { OfficerDashboard } from '@/components/OfficerDashboard';
import { PasscodeLock } from '@/components/PasscodeLock';
import { useAppData } from '@/lib/useAppData';
import { useOfficerLock } from '@/lib/useOfficerLock';

function App() {
  const [view, setView] = useState<'checkin' | 'officer'>('checkin');
  const [lockOpen, setLockOpen] = useState(false);
  const { members, events, attendance, loading, error } = useAppData();
  const { unlocked, tryUnlock } = useOfficerLock();

  const handleSwitchView = (v: 'checkin' | 'officer') => {
    if (v === 'officer' && !unlocked) {
      setLockOpen(true);
    } else {
      setView(v);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--color-accent)] border-t-transparent" />
          <p className="text-sm text-[var(--color-text-muted)]">Loading Familia…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--color-bg-base)]">
      <Header view={view} onSwitchView={handleSwitchView} officerUnlocked={unlocked} />

      {error && (
        <div className="mx-auto max-w-6xl px-4 py-3">
          <div className="rounded-lg bg-[var(--color-error-soft)] px-4 py-3 text-sm font-medium text-[var(--color-error)]">
            Connection issue: {error}. Changes will sync when reconnected.
          </div>
        </div>
      )}

      {view === 'checkin' && (
        <CheckInView members={members} events={events} attendance={attendance} />
      )}

      {view === 'officer' && unlocked && (
        <OfficerDashboard members={members} events={events} attendance={attendance} />
      )}

      <PasscodeLock
        open={lockOpen}
        onClose={() => setLockOpen(false)}
        onUnlock={(code: string) => {
          const ok = tryUnlock(code);
          if (ok) setView('officer');
          return ok;
        }}
      />

      <footer className="mx-auto max-w-6xl px-4 py-6 text-center text-[11px] text-[var(--color-text-muted)]">
        Familia · RO New World · Mommy Guild
      </footer>
    </div>
  );
}

export default App;
