import { useMemo, useState } from 'react';
import { CalendarPlus, Clock, Trash2, X } from 'lucide-react';
import type { GuildEvent } from '@/lib/types';
import { formatLocal, localTimezone, utcToLocalInput } from '@/lib/time';
import { supabase } from '@/lib/supabase';

interface EventSchedulerProps {
  events: GuildEvent[];
}

export function EventScheduler({ events }: EventSchedulerProps) {
  const [title, setTitle] = useState('');
  const [when, setWhen] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sorted = useMemo(
    () => [...events].sort((a, b) => new Date(b.scheduled_at).getTime() - new Date(a.scheduled_at).getTime()),
    [events],
  );

  const create = async () => {
    if (!title.trim() || !when) {
      setError('Title and date/time are required.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const isoUtc = new Date(when).toISOString();
      const { error } = await supabase.from('events').insert({ title: title.trim(), scheduled_at: isoUtc });
      if (error) throw error;
      setTitle('');
      setWhen('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create event');
    } finally {
      setBusy(false);
    }
  };

  const del = async (id: string) => {
    await supabase.from('events').delete().eq('id', id);
  };

  return (
    <div className="rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-surface)]">
      <div className="border-b border-[var(--color-border-subtle)] px-4 py-3">
        <h3 className="text-sm font-bold text-[var(--color-text-primary)]">Event Scheduler</h3>
        <p className="text-[11px] text-[var(--color-text-muted)]">Create events with custom dates & times. Shown in {localTimezone()}.</p>
      </div>

      <div className="p-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_auto_auto]">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Event title (e.g. Guild War)"
            className="rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-bg-base)] px-3 py-2.5 text-sm text-[var(--color-text-primary)] outline-none focus:border-[var(--color-primary)] placeholder:text-[var(--color-text-muted)]"
          />
          <input
            type="datetime-local"
            value={when}
            onChange={(e) => setWhen(e.target.value)}
            className="rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-bg-base)] px-3 py-2.5 text-sm text-[var(--color-text-primary)] outline-none focus:border-[var(--color-primary)] [color-scheme:dark]"
          />
          <button
            onClick={create}
            disabled={busy}
            className="flex items-center justify-center gap-2 rounded-lg bg-[var(--color-primary)] px-4 py-2.5 text-sm font-bold text-white transition hover:opacity-90 disabled:opacity-50"
          >
            <CalendarPlus size={16} /> {busy ? '…' : 'Create'}
          </button>
        </div>
        {error && <p className="mt-2 text-sm font-medium text-[var(--color-error)]">{error}</p>}

        <div className="mt-4 space-y-1.5">
          {sorted.length === 0 ? (
            <p className="py-4 text-center text-sm text-[var(--color-text-muted)]">No events scheduled.</p>
          ) : (
            sorted.map((e) => (
              <div
                key={e.id}
                className="flex items-center justify-between gap-2 rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-bg-surface-2)] px-3 py-2.5"
              >
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold text-[var(--color-text-primary)]">{e.title}</div>
                  <div className="mt-0.5 flex items-center gap-1 text-[11px] text-[var(--color-text-muted)]">
                    <Clock size={11} /> {formatLocal(e.scheduled_at)}
                  </div>
                </div>
                <button
                  onClick={() => del(e.id)}
                  className="rounded-md p-1.5 text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-surface-3)] hover:text-[var(--color-error)]"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
