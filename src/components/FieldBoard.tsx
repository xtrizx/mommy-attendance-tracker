import { useMemo, useState } from 'react';
import { ChevronDown, GripVertical, Search, UserPlus, X } from 'lucide-react';
import type { Attendance, GuildEvent, Member } from '@/lib/types';
import { FIELD_MAIN, FIELD_SUB } from '@/lib/types';
import { supabase } from '@/lib/supabase';

interface FieldBoardProps {
  members: Member[];
  events: GuildEvent[];
  attendance: Attendance[];
}

interface GroupKey {
  field: string;
  team: string;
  party: number;
}

// Tactical structure:
// Main Field: Team 1 (Defender), Team 2 (Push/Roam)
// Sub Field: Team 1 (PVP), combined Team (MVP + Ore), Backups/Reserves
const STRUCTURE: { field: string; label: string; teams: { name: string; position: string }[] }[] = [
  {
    field: FIELD_MAIN,
    label: 'Main Field',
    teams: [
      { name: 'Team 1', position: 'Defender' },
      { name: 'Team 2', position: 'Push/Roam' },
    ],
  },
  {
    field: FIELD_SUB,
    label: 'Sub Field',
    teams: [
      { name: 'Team 1', position: 'PVP' },
      { name: 'MVP Team', position: 'MVP' },
      { name: 'Ore Team', position: 'Ore Collection/Repair' },
      { name: 'Backups', position: 'Backup' },
      { name: 'Reserves', position: 'Reserve' },
    ],
  },
];

const PARTY_COUNT = 8;
const PARTY_SIZE = 5;

export function FieldBoard({ members, events, attendance }: FieldBoardProps) {
  const [selectedEventId, setSelectedEventId] = useState<string>('');
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [search, setSearch] = useState('');
  const [dragId, setDragId] = useState<string | null>(null);
  const [dragOverKey, setDragOverKey] = useState<string | null>(null);
  const [assigning, setAssigning] = useState<{ field: string; team: string; party: number } | null>(null);

  const sortedEvents = useMemo(
    () => [...events].sort((a, b) => new Date(b.scheduled_at).getTime() - new Date(a.scheduled_at).getTime()),
    [events],
  );

  const activeEvent = events.find((e) => e.id === selectedEventId) ?? null;

  // Group members by field/team/party
  const grouped = useMemo(() => {
    const map = new Map<string, Member[]>();
    for (const m of members) {
      const key = `${m.field}||${m.team_name}||${m.party_number}`;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(m);
    }
    // sort each group by display_order
    for (const [k, arr] of map) {
      arr.sort((a, b) => a.display_order - b.display_order);
      map.set(k, arr);
    }
    return map;
  }, [members]);

  const unassigned = useMemo(() => {
    const q = search.trim().toLowerCase();
    return members
      .filter((m) => !m.field || !m.team_name)
      .filter((m) => !q || m.ign.toLowerCase().includes(q))
      .sort((a, b) => a.ign.localeCompare(b.ign));
  }, [members, search]);

  const eventAttendance = useMemo(() => {
    if (!activeEvent) return new Map<string, Attendance>();
    return new Map(attendance.filter((a) => a.event_id === activeEvent.id).map((a) => [a.member_id, a]));
  }, [activeEvent, attendance]);

  const moveMember = async (member: Member, field: string, team: string, party: number) => {
    // Find the target group to compute display_order
    const targetKey = `${field}||${team}||${party}`;
    const targetGroup = grouped.get(targetKey) ?? [];
    const newOrder = targetGroup.length;
    await supabase
      .from('members')
      .update({ field, team_name: team, party_number: party, display_order: newOrder })
      .eq('id', member.id);
  };

  const handleDrop = (field: string, team: string, party: number) => {
    if (!dragId) return;
    const member = members.find((m) => m.id === dragId);
    if (member) {
      // If already in this exact slot, no-op
      if (member.field === field && member.team_name === team && member.party_number === party) {
        setDragId(null);
        setDragOverKey(null);
        return;
      }
      moveMember(member, field, team, party);
    }
    setDragId(null);
    setDragOverKey(null);
  };

  const assignFromPool = async (member: Member, field: string, team: string, party: number) => {
    await moveMember(member, field, team, party);
    setAssigning(null);
  };

  const toggleCollapse = (key: string) => setCollapsed((c) => ({ ...c, [key]: !c[key] }));

  return (
    <div className="rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-surface)]">
      <div className="border-b border-[var(--color-border-subtle)] px-4 py-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-sm font-bold text-[var(--color-text-primary)]">Tactical Field Board</h3>
          <select
            value={selectedEventId}
            onChange={(e) => setSelectedEventId(e.target.value)}
            className="rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-bg-base)] px-3 py-1.5 text-xs text-[var(--color-text-primary)] outline-none focus:border-[var(--color-primary)]"
          >
            <option value="">No event filter</option>
            {sortedEvents.map((e) => (
              <option key={e.id} value={e.id}>{e.title}</option>
            ))}
          </select>
        </div>
        <p className="mt-1 text-[11px] text-[var(--color-text-muted)]">
          Drag members between slots, or tap a slot's + to assign from the pool. 5 members per party, 8 parties max.
        </p>
      </div>

      {/* Unassigned pool */}
      <div className="border-b border-[var(--color-border-subtle)] bg-[var(--color-bg-base)] p-3">
        <div className="mb-2 flex items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-secondary)]">Unassigned Pool</span>
          <span className="rounded-full bg-[var(--color-bg-surface-3)] px-2 py-0.5 text-[11px] text-[var(--color-text-muted)]">{unassigned.length}</span>
        </div>
        <div className="mb-2 flex items-center gap-2 rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-bg-surface)] px-2.5 py-1.5">
          <Search size={14} className="text-[var(--color-text-muted)]" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filter pool…"
            className="flex-1 bg-transparent text-sm text-[var(--color-text-primary)] outline-none placeholder:text-[var(--color-text-muted)]"
          />
          {search && <button onClick={() => setSearch('')}><X size={14} className="text-[var(--color-text-muted)]" /></button>}
        </div>
        <div className="flex flex-wrap gap-1.5">
          {unassigned.length === 0 ? (
            <span className="text-xs text-[var(--color-text-muted)]">All members are assigned.</span>
          ) : (
            unassigned.map((m) => (
              <div
                key={m.id}
                draggable
                onDragStart={() => setDragId(m.id)}
                onDragEnd={() => { setDragId(null); setDragOverKey(null); }}
                className={`flex cursor-grab items-center gap-1 rounded-md border border-[var(--color-border-subtle)] bg-[var(--color-bg-surface-2)] px-2.5 py-1.5 text-xs font-medium text-[var(--color-text-primary)] transition hover:border-[var(--color-accent)] ${dragId === m.id ? 'dragging' : ''}`}
              >
                <GripVertical size={12} className="text-[var(--color-text-muted)]" />
                {m.ign}
                <span className="text-[var(--color-text-muted)]">{m.job && `· ${m.job}`}</span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Fields */}
      <div className="p-3 space-y-3">
        {STRUCTURE.map((section) => {
          const isMain = section.field === FIELD_MAIN;
          return (
            <div key={section.field} className={`rounded-xl border ${isMain ? 'border-[var(--color-primary)]/30' : 'border-[var(--color-accent)]/25'} bg-[var(--color-bg-base)]`}>
              <div className={`flex items-center gap-2 px-3 py-2 ${isMain ? 'bg-[var(--color-primary-soft)]' : 'bg-[var(--color-accent-soft)]'} rounded-t-xl`}>
                <span className={`text-xs font-bold uppercase tracking-wider ${isMain ? 'text-[var(--color-primary-strong)]' : 'text-[var(--color-accent-strong)]'}`}>
                  {section.label}
                </span>
              </div>
              <div className="space-y-2 p-2.5">
                {section.teams.map((team) => {
                  const teamKey = `${section.field}||${team.name}`;
                  const isCol = collapsed[teamKey];
                  return (
                    <div key={teamKey} className="rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-bg-surface)]">
                      <button
                        onClick={() => toggleCollapse(teamKey)}
                        className="flex w-full items-center justify-between px-3 py-2"
                      >
                        <div className="flex items-center gap-2">
                          <ChevronDown size={14} className={`text-[var(--color-text-muted)] transition ${isCol ? '-rotate-90' : ''}`} />
                          <span className="text-sm font-semibold text-[var(--color-text-primary)]">{team.name}</span>
                          <span className="rounded-full bg-[var(--color-bg-surface-3)] px-2 py-0.5 text-[10px] text-[var(--color-text-muted)]">{team.position}</span>
                        </div>
                        <span className="text-[11px] text-[var(--color-text-muted)]">
                          {countInTeam(grouped, section.field, team.name)} members
                        </span>
                      </button>

                      {!isCol && (
                        <div className="grid grid-cols-2 gap-2 p-2.5 pt-0 sm:grid-cols-4">
                          {Array.from({ length: PARTY_COUNT }, (_, i) => i + 1).map((partyNum) => {
                            const key = `${section.field}||${team.name}||${partyNum}`;
                            const slotMembers = grouped.get(key) ?? [];
                            const dropKey = key;
                            return (
                              <div
                                key={partyNum}
                                onDragOver={(e) => { e.preventDefault(); setDragOverKey(dropKey); }}
                                onDragLeave={() => setDragOverKey((k) => (k === dropKey ? null : k))}
                                onDrop={(e) => { e.preventDefault(); handleDrop(section.field, team.name, partyNum); }}
                                className={`rounded-lg border bg-[var(--color-bg-base)] p-1.5 transition ${
                                  dragOverKey === dropKey ? 'drag-over' : 'border-[var(--color-border-subtle)]'
                                }`}
                              >
                                <div className="mb-1 flex items-center justify-between">
                                  <span className="text-[10px] font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">P{partyNum}</span>
                                  {slotMembers.length < PARTY_SIZE && (
                                    <button
                                      onClick={() => setAssigning({ field: section.field, team: team.name, party: partyNum })}
                                      className="rounded p-0.5 text-[var(--color-text-muted)] hover:bg-[var(--color-bg-surface-2)] hover:text-[var(--color-success)]"
                                    >
                                      <UserPlus size={12} />
                                    </button>
                                  )}
                                </div>
                                <div className="space-y-1">
                                  {slotMembers.slice(0, PARTY_SIZE).map((m) => (
                                    <MemberCard
                                      key={m.id}
                                      member={m}
                                      attendance={eventAttendance.get(m.id) ?? null}
                                      onDragStart={() => setDragId(m.id)}
                                      onDragEnd={() => { setDragId(null); setDragOverKey(null); }}
                                      dragging={dragId === m.id}
                                    />
                                  ))}
                                  {slotMembers.length === 0 && (
                                    <div className="rounded border border-dashed border-[var(--color-border-subtle)] py-2 text-center text-[10px] text-[var(--color-text-muted)]">
                                      Empty
                                    </div>
                                  )}
                                  {slotMembers.length > PARTY_SIZE && (
                                    <div className="text-[10px] text-[var(--color-warning)]">+{slotMembers.length - PARTY_SIZE} overflow</div>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {assigning && (
        <AssignModal
          members={members.filter((m) => !m.field || !m.team_name)}
          target={assigning}
          onAssign={(m) => assignFromPool(m, assigning.field, assigning.team, assigning.party)}
          onClose={() => setAssigning(null)}
        />
      )}
    </div>
  );
}

function countInTeam(grouped: Map<string, Member[]>, field: string, team: string): number {
  let n = 0;
  for (const [k, arr] of grouped) {
    const [f, t] = k.split('||');
    if (f === field && t === team) n += arr.length;
  }
  return n;
}

function MemberCard({
  member,
  attendance,
  onDragStart,
  onDragEnd,
  dragging,
}: {
  member: Member;
  attendance: Attendance | null;
  onDragStart: () => void;
  onDragEnd: () => void;
  dragging: boolean;
}) {
  const statusColor = attendance?.status === 'checked_in'
    ? 'border-l-[var(--color-success)]'
    : attendance?.status === 'absent'
      ? 'border-l-[var(--color-error)]'
      : 'border-l-[var(--color-border-subtle)]';

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      className={`cursor-grab rounded-md border border-[var(--color-border-subtle)] border-l-2 ${statusColor} bg-[var(--color-bg-surface-2)] px-2 py-1.5 ${dragging ? 'dragging' : ''}`}
    >
      <div className="flex items-center gap-1">
        <GripVertical size={10} className="shrink-0 text-[var(--color-text-muted)]" />
        <span className="truncate text-xs font-semibold text-[var(--color-text-primary)]">{member.ign}</span>
      </div>
      {member.job && <div className="ml-3 truncate text-[10px] text-[var(--color-text-muted)]">{member.job}</div>}
    </div>
  );
}

function AssignModal({
  members,
  target,
  onAssign,
  onClose,
}: {
  members: Member[];
  target: { field: string; team: string; party: number };
  onAssign: (m: Member) => void;
  onClose: () => void;
}) {
  const [q, setQ] = useState('');
  const filtered = members.filter((m) => m.ign.toLowerCase().includes(q.trim().toLowerCase())).slice(0, 40);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-sm rounded-2xl border border-[var(--color-border-strong)] bg-[var(--color-bg-surface)] p-4 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-[var(--color-text-primary)]">Assign to {target.team} · P{target.party}</h3>
            <p className="text-[11px] text-[var(--color-text-muted)]">{target.field} Field</p>
          </div>
          <button onClick={onClose} className="rounded-md p-1 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]">
            <X size={18} />
          </button>
        </div>
        <input
          autoFocus
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search unassigned members…"
          className="mb-3 w-full rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-bg-base)] px-3 py-2 text-sm text-[var(--color-text-primary)] outline-none focus:border-[var(--color-primary)] placeholder:text-[var(--color-text-muted)]"
        />
        <div className="max-h-64 space-y-1 overflow-y-auto">
          {filtered.length === 0 ? (
            <p className="py-4 text-center text-sm text-[var(--color-text-muted)]">No unassigned members.</p>
          ) : (
            filtered.map((m) => (
              <button
                key={m.id}
                onClick={() => onAssign(m)}
                className="flex w-full items-center justify-between rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-bg-surface-2)] px-3 py-2 text-left transition hover:border-[var(--color-success)] hover:bg-[var(--color-bg-surface-3)]"
              >
                <span className="text-sm font-medium text-[var(--color-text-primary)]">{m.ign}</span>
                <span className="text-xs text-[var(--color-text-muted)]">{m.job || '—'}</span>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
