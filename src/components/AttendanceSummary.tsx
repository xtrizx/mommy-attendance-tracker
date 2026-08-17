import { useMemo, useState } from 'react';
import { Activity, Check, Filter, UserMinus } from 'lucide-react';
import type { Attendance, GuildEvent, Member } from '@/lib/types';
import { formatLocal, localTimezone, relativeTime } from '@/lib/time';

interface AttendanceSummaryProps {
  members: Member[];
  events: GuildEvent[];
  attendance: Attendance[];
}

export function AttendanceSummary({ members, events, attendance }: AttendanceSummaryProps) {
  const [eventId, setEventId] = useState<string>('');

  const sortedEvents = useMemo(
    () => [...events].sort((a, b) => new Date(b.scheduled_at).getTime() - new Date(a.scheduled_at).getTime()),
    [events],
  );

  const activeEvent = events.find((e) => e.id === eventId) ?? sortedEvents[0] ?? null;

  const { checkedIn, absent, pending, absentList, checkedInList } = useMemo(() => {
    if (!activeEvent) return { checkedIn: 0, absent: 0, pending: 0, absentList: [], checkedInList: [] };
    const eventAtt = attendance.filter((a) => a.event_id === activeEvent.id);
    const byMember = new Map(eventAtt.map((a) => [a.member_id, a]));
    const checkedInList: Member[] = [];
    const absentList: { member: Member; reason: string }[] = [];
    for (const m of members) {
      const a = byMember.get(m.id);
      if (a?.status === 'checked_in') checkedInList.push(m);
      else if (a?.status === 'absent') absentList.push({ member: m, reason: a.reason });
    }
    return {
      checkedIn: checkedInList.length,
      absent: absentList.length,
      pending: members.length - checkedInList.length - absentList.length,
      checkedInList,
      absentList,
    };
  }, [activeEvent, attendance, members]);

  return (
    <div className="rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-surface)]">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--color-border-subtle)] px-4 py-3">
        <div className="flex items-center gap-2">
          <Activity size={16} className="text-[var(--color-success)]" />
          <h3 className="text-sm font-bold text-[var(--color-text-primary)]">Attendance Summary</h3>
        </div>
        <div className="flex items-center gap-2">
          <Filter size={13} className="text-[var(--color-text-muted)]" />
          <select
            value={eventId}
            onChange={(e) => setEventId(e.target.value)}
            className="rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-bg-base)] px-3 py-1.5 text-xs text-[var(--color-text-primary)] outline-none focus:border-[var(--color-primary)]"
          >
            {sortedEvents.map((e) => (
              <option key={e.id} value={e.id}>{e.title}</option>
            ))}
          </select>
        </div>
      </div>

      {!activeEvent ? (
        <div className="p-6 text-center text-sm text-[var(--color-text-muted)]">No events to summarize.</div>
      ) : (
        <div className="p-4">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold text-[var(--color-text-primary)]">{activeEvent.title}</div>
              <div className="text-[11px] text-[var(--color-text-muted)]">
                {formatLocal(activeEvent.scheduled_at)} · {relativeTime(activeEvent.scheduled_at)}
              </div>
            </div>
            <div className="text-[11px] text-[var(--color-text-muted)]">{localTimezone()}</div>
          </div>

          {/* Big stats */}
          <div className="mb-4 grid grid-cols-4 gap-2">
            <BigStat label="Total" value={members.length} color="var(--color-text-primary)" />
            <BigStat label="Confirmed" value={checkedIn} color="var(--color-success)" />
            <BigStat label="Absent" value={absent} color="var(--color-error)" />
            <BigStat label="Pending" value={pending} color="var(--color-warning)" />
          </div>

          {/* Progress bar */}
          <div className="mb-4 h-2 overflow-hidden rounded-full bg-[var(--color-bg-base)]">
            <div className="flex h-full">
              <div className="bg-[var(--color-success)]" style={{ width: `${pct(checkedIn, members.length)}%` }} />
              <div className="bg-[var(--color-error)]" style={{ width: `${pct(absent, members.length)}%` }} />
              <div className="bg-[var(--color-warning)]" style={{ width: `${pct(pending, members.length)}%` }} />
            </div>
          </div>

          {/* Lists */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-bg-base)] p-3">
              <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-[var(--color-success)]">
                <Check size={13} /> Confirmed ({checkedIn})
              </div>
              {checkedInList.length === 0 ? (
                <p className="text-xs text-[var(--color-text-muted)]">No check-ins yet.</p>
              ) : (
                <div className="flex flex-wrap gap-1">
                  {checkedInList.map((m) => (
                    <span key={m.id} className="rounded-md bg-[var(--color-success-soft)] px-2 py-1 text-[11px] font-medium text-[var(--color-success)]">
                      {m.ign}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-bg-base)] p-3">
              <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-[var(--color-error)]">
                <UserMinus size={13} /> Absent ({absent})
              </div>
              {absentList.length === 0 ? (
                <p className="text-xs text-[var(--color-text-muted)]">No absences.</p>
              ) : (
                <div className="space-y-1.5">
                  {absentList.map(({ member, reason }) => (
                    <div key={member.id} className="rounded-md bg-[var(--color-error-soft)] px-2 py-1.5">
                      <div className="text-xs font-semibold text-[var(--color-error)]">{member.ign}</div>
                      {reason && <div className="mt-0.5 text-[11px] italic text-[var(--color-text-muted)]">"{reason}"</div>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function pct(v: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((v / total) * 100);
}

function BigStat({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-base)] p-2.5 text-center">
      <div className="text-xl font-bold" style={{ color }}>{value}</div>
      <div className="mt-0.5 text-[10px] font-medium uppercase tracking-wide text-[var(--color-text-muted)]">{label}</div>
    </div>
  );
}
