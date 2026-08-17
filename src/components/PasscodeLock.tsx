import { useState } from 'react';
import { Lock, X } from 'lucide-react';

interface PasscodeLockProps {
  open: boolean;
  onClose: () => void;
  onUnlock: (code: string) => boolean;
}

export function PasscodeLock({ open, onClose, onUnlock }: PasscodeLockProps) {
  const [code, setCode] = useState('');
  const [error, setError] = useState(false);
  const [shake, setShake] = useState(false);

  if (!open) return null;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const ok = onUnlock(code);
    if (ok) {
      setCode('');
      setError(false);
      onClose();
    } else {
      setError(true);
      setShake(true);
      setTimeout(() => setShake(false), 400);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div
        className={`w-full max-w-sm rounded-2xl border border-[var(--color-border-strong)] bg-[var(--color-bg-surface)] p-6 shadow-2xl ${shake ? 'animate-pulse-glow' : ''}`}
        style={shake ? { animation: 'fadeIn 0.1s' } : undefined}
      >
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-accent-soft)]">
              <Lock size={18} className="text-[var(--color-accent)]" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[var(--color-text-primary)]">Officer Access</h2>
              <p className="text-xs text-[var(--color-text-muted)]">Enter master passcode</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-[var(--color-text-muted)] hover:bg-[var(--color-bg-surface-2)] hover:text-[var(--color-text-primary)]"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={submit} className="space-y-3">
          <input
            type="password"
            autoFocus
            value={code}
            onChange={(e) => {
              setCode(e.target.value);
              setError(false);
            }}
            placeholder="Passcode"
            className={`w-full rounded-lg border bg-[var(--color-bg-base)] px-4 py-3 text-sm text-[var(--color-text-primary)] outline-none transition placeholder:text-[var(--color-text-muted)] ${
              error
                ? 'border-[var(--color-error)] ring-1 ring-[var(--color-error)]'
                : 'border-[var(--color-border-subtle)] focus:border-[var(--color-accent)]'
            }`}
          />
          {error && (
            <p className="text-xs font-medium text-[var(--color-error)]">Incorrect passcode. Try again.</p>
          )}
          <button
            type="submit"
            className="w-full rounded-lg bg-[var(--color-accent)] py-3 text-sm font-bold text-[var(--color-bg-base)] transition hover:bg-[var(--color-accent-strong)]"
          >
            Unlock Dashboard
          </button>
        </form>
      </div>
    </div>
  );
}
