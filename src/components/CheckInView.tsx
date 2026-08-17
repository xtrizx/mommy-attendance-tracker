import { useMemo, useState } from 'react';
import { Calendar, Check, ChevronDown, Clock, Search, UserMinus, UserCheck, X } from 'lucide-react';
import type { Attendance, GuildEvent, Member } from '@/lib/types';
import { formatLocal, localTimezone, relativeTime } from '@/lib/time';
import { supabase } from '@/lib/supabase';

interface CheckInViewProps {
  members: Member[];
  events: GuildEvent[];
  attendance: Attendance[];
}

export function CheckInView({ members, events, attendance }: CheckInViewProps) {
  const [selectedEventId, setSelectedEventId] = useState<string>('');
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const [pickedMember, setPickedMember] = useState<Member | null>(null);
  const [absentReason, setAbsentReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ ok: boolean; msg: string } | null>(null);

  const sortedEvents = useMemo(
    () => [...events].sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime()),
    [events],
  );

  const upcomingEvents = useMemo(() => {
    const now = Date.now();
    return sortedEvents.filter((e) => new Date(e.scheduled_at).getTime() >= now - 24 * 3600_000);
  }, [sortedEvents]);

  const activeEvent = useMemo(
    () => events.find((e) => e.id === selectedEventId) ?? null,
    [events, selectedEventId],
  );

  const filteredMembers = useMemo(() => {
    const q = search.trim().toLowerCase();
    const sorted = [...members].sort((a, b) => a.ign.localeCompare(b.ign));
    if (!q) return sorted.slice(0, 30);
    return sorted.filter((m) => m.ign.toLowerCase().includes(q)).slice(0, 30);
  }, [members, search]);

  const myAttendance = useMemo(
    () => (pickedMember && activeEvent
      ? attendance.find((a) => a.member_id === pickedMember.id && a.event_id === activeEvent.id) ?? null
      : null),
    [attendance, pickedMember, activeEvent],
  );

  const stats = useMemo(() => {
    if (!activeEvent) return { checkedIn: 0, absent: 0, pending: 0 };
    const eventAtt = attendance.filter((a) => a.event_id === activeEvent.id);
    const checkedIn = eventAtt.filter((a) => a.status === 'checked_in').length;
    const absent = eventAtt.filter((a) => a.status === 'absent').length;
    return { checkedIn, absent, pending: members.length - checkedIn - absent };
  }, [activeEvent, attendance, members]);

  const handleCheckIn = async () => {
    if (!pickedMember || !activeEvent) return;
    setSubmitting(true);
    setFeedback(null);
    try {
      const { error } = await supabase
        .from('attendance')
        .upsert(
          { event_id: activeEvent.id, member_id: pickedMember.id, status: 'checked_in', reason: '' },
          { onConflict: 'event_id,member_id' },
        );
      if (error) throw error;
      setFeedback({ ok: true, msg: `Checked in as ${pickedMember.ign}` });
    } catch (err) {
      setFeedback({ ok: false, msg: err instanceof Error ? err.message : 'Failed to check in' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleAbsent = async () => {
    if (!pickedMember || !activeEvent) return;
    if (!absentReason.trim()) {
      setFeedback({ ok: false, msg: 'A reason is required for absence.' });
      return;
    }
    setSubmitting(true);
    setFeedback(null);
    try {
      const { error } = await supabase
        .from('attendance')
        .upsert(
          { event_id: activeEvent.id, member_id: pickedMember.id, status: 'absent', reason: absentReason.trim() },
          { onConflict: 'event_id,member_id' },
        );
      if (error) throw error;
      setFeedback({ ok: true, msg: `Marked absent: ${pickedMember.ign}` });
    } catch (err) {
      setFeedback({ ok: false, msg: err instanceof Error ? err.message : 'Failed to mark absent' });
    } finally {
      setSubmitting(false);
    }
  };

  const reset = () => {
    setPickedMember(null);
    setSearch('');
    setAbsentReason('');
    setFeedback(null);
    setOpen(false);
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-5">
      {/* Event selector */}
      <section className="mb-5 rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-surface)] p-4">
        <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[var(--color-text-secondary)]">
          <Calendar size={14} /> Select Event
        </div>
        {events.length === 0 ? (
          <p className="py-3 text-sm text-[var(--color-text-muted)]">No events scheduled yet. Check back later.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {(upcomingEvents.length > 0 ? upcomingEvents : sortedEvents).map((e) => {
              const active = e.id === selectedEventId;
              return (
                <button
                  key={e.id}
                  onClick={() => { setSelectedEventId(e.id); reset(); }}
                  className={`rounded-lg border px-3 py-2 text-left transition ${
                    active
                      ? 'border-[var(--color-primary)] bg-[var(--color-primary-soft)]'
                      : 'border-[var(--color-border-subtle)] bg-[var(--color-bg-surface-2)] hover:border-[var(--color-border-strong)]'
                  }`}
                >
                  <div className="text-sm font-semibold text-[var(--color-text-primary)]">{e.title}</div>
                  <div className="mt-0.5 flex items-center gap-1 text-[11px] text-[var(--color-text-muted)]">
                    <Clock size={11} />
                    {formatLocal(e.scheduled_at)}
                  </div>
                </button>
              );
            })}
          </div>
        )}
        <div className="mt-2 text-[11px] text-[var(--color-text-muted)]">
          Times shown in your timezone: <span className="font-medium text-[var(--color-text-secondary)]">{localTimezone()}</span>
        </div>
      </section>

      {!activeEvent ? (
        <div className="rounded-2xl border border-dashed border-[var(--color-border-subtle)] p-8 text-center">
          <p className="text-sm text-[var(--color-text-muted)]">Pick an event above to check in.</p>
        </div>
      ) : (
        <>
          {/* Summary chips */}
          <div className="mb-4 grid grid-cols-3 gap-2">
            <StatChip label="Checked In" value={stats.checkedIn} color="success" />
            <StatChip label="Absent" value={stats.absent} color="error" />
            <StatChip label="Pending" value={stats.pending} color="warning" />
          </div>

          {/* Searchable dropdown */}
          <section className="mb-4 rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-surface)] p-4">
            <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-[var(--color-text-secondary)]">
              Find Your Name
            </label>
            <div className="relative">
              <button
                onClick={() => setOpen((o) => !o)}
                className="flex w-full items-center justify-between rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-bg-base)] px-3 py-3 text-left transition hover:border-[var(--color-border-strong)]"
              >
                <span className={`text-sm ${pickedMember ? 'text-[var(--color-text-primary)]' : 'text-[var(--color-text-muted)]'}`}>
                  {pickedMember ? pickedMember.ign : 'Search roster…'}
                </span>
                <ChevronDown size={16} className={`text-[var(--color-text-muted)] transition ${open ? 'rotate-180' : ''}`} />
              </button>

              {open && (
                <div className="absolute z-20 mt-1 w-full rounded-lg border border-[var(--color-border-strong)] bg-[var(--color-bg-surface-2)] shadow-xl">
                  <div className="flex items-center gap-2 border-b border-[var(--color-border-subtle)] px-3 py-2">
                    <Search size={14} className="text-[var(--color-text-muted)]" />
                    <input
                      autoFocus
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Type your IGN…"
                      className="flex-1 bg-transparent text-sm text-[var(--color-text-primary)] outline-none placeholder:text-[var(--color-text-muted)]"
                    />
                    {search && (
                      <button onClick={() => setSearch('')} className="text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]">
                        <X size={14} />
                      </button>
                    )}
                  </div>
                  <div className="max-h-64 overflow-y-auto">
                    {filteredMembers.length === 0 ? (
                      <div className="px-3 py-4 text-center text-sm text-[var(--color-text-muted)]">No members found.</div>
                    ) : (
                      filteredMembers.map((m) => (
                        <button
                          key={m.id}
                          onClick={() => { setPickedMember(m); setOpen(false); setSearch(''); setFeedback(null); }}
                          className="flex w-full items-center justify-between px-3 py-2.5 text-left transition hover:bg-[var(--color-bg-surface-3)]"
                        >
                          <span className="text-sm font-medium text-[var(--color-text-primary)]">{m.ign}</span>
                          <span className="text-xs text-[var(--color-text-muted)]">{m.job || '—'}</span>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {pickedMember && (
              <div className="mt-3 rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-bg-surface-2)] p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-bold text-[var(--color-text-primary)]">{pickedMember.ign}</div>
                    <div className="text-xs text-[var(--color-text-secondary)]">
                      {[pickedMember.job, pickedMember.position, pickedMember.team_name].filter(Boolean).join(' · ') || 'Unassigned'}
                    </div>
                  </div>
                  {myAttendance && (
                    <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                      myAttendance.status === 'checked_in'
                        ? 'bg-[var(--color-success-soft)] text-[var(--color-success)]'
                        : 'bg-[var(--color-error-soft)] text-[var(--color-error)]'
                    }`}>
                      {myAttendance.status === 'checked_in' ? 'Checked In' : 'Absent'}
                    </span>
                  )}
                </div>
                {myAttendance?.status === 'absent' && myAttendance.reason && (
                  <p className="mt-1.5 text-xs italic text-[var(--color-text-muted)]">"{myAttendance.reason}"</p>
                )}
              </div>
            )}
          </section>

          {/* Actions */}
          {pickedMember && (
            <section className="space-y-3 rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-surface)] p-4">
              <div className="flex gap-2">
                <button
                  onClick={handleCheckIn}
                  disabled={submitting}
                  className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-[var(--color-success)] py-3 text-sm font-bold text-[var(--color-bg-base)] transition hover:opacity-90 disabled:opacity-50"
                >
                  <UserCheck size={17} /> Check In
                </button>
                <button
                  onClick={handleAbsent}
                  disabled={submitting}
                  className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-[var(--color-error)] bg-[var(--color-error-soft)] py-3 text-sm font-bold text-[var(--color-error)] transition hover:bg-[var(--color-error)] hover:text-[var(--color-bg-base)] disabled:opacity-50"
                >
                  <UserMinus size={17} /> Absent
                </button>
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-[var(--color-text-secondary)]">
                  Absence reason <span className="text-[var(--color-error)]">*</span>
                </label>
                <input
                  value={absentReason}
                  onChange={(e) => setAbsentReason(e.target.value)}
                  placeholder="Required if marking absent…"
                  className="w-full rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-bg-base)] px-3 py-2.5 text-sm text-[var(--color-text-primary)] outline-none transition focus:border-[var(--color-error)] placeholder:text-[var(--color-text-muted)]"
                />
              </div>

              {feedback && (
                <div className={`flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium ${
                  feedback.ok
                    ? 'bg-[var(--color-success-soft)] text-[var(--color-success)]'
                    : 'bg-[var(--color-error-soft)] text-[var(--color-error)]'
                }`}>
                  {feedback.ok ? <Check size={15} /> : <X size={15} />}
                  {feedback.msg}
                </div>
              )}
            </section>
          )}
        </>
      )}
    </div>
  );
}

function StatChip({ label, value, color }: { label: string; value: number; color: 'success' | 'error' | 'warning' }) {
  const colorMap = {
    success: 'var(--color-success)',
    error: 'var(--color-error)',
    warning: 'var(--color-warning)',
  };
  const softMap = {
    success: 'var(--color-success-soft)',
    error: 'var(--color-error-soft)',
    warning: 'var(--color-warning-soft)',
  };
  return (
    <div className="rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-surface)] p-3 text-center">
      <div className="text-2xl font-bold" style={{ color: colorMap[color] }}>{value}</div>
      <div className="mt-0.5 text-[11px] font-medium uppercase tracking-wide text-[var(--color-text-muted)]">{label}</div>
    </div>
  );
}
