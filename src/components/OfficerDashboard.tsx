import { useState } from 'react';
import { LayoutGrid, ListChecks, Calendar, Swords } from 'lucide-react';
import type { Attendance, GuildEvent, Member } from '@/lib/types';
import { RosterManager } from './RosterManager';
import { EventScheduler } from './EventScheduler';
import { FieldBoard } from './FieldBoard';
import { AttendanceSummary } from './AttendanceSummary';

interface OfficerDashboardProps {
  members: Member[];
  events: GuildEvent[];
  attendance: Attendance[];
}

type Tab = 'board' | 'roster' | 'events' | 'summary';

export function OfficerDashboard({ members, events, attendance }: OfficerDashboardProps) {
  const [tab, setTab] = useState<Tab>('summary');

  const tabs: { id: Tab; label: string; icon: typeof LayoutGrid }[] = [
    { id: 'summary', label: 'Summary', icon: ListChecks },
    { id: 'board', label: 'Field Board', icon: Swords },
    { id: 'roster', label: 'Roster', icon: LayoutGrid },
    { id: 'events', label: 'Events', icon: Calendar },
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 py-5">
      <div className="mb-4 flex gap-1 overflow-x-auto rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-surface)] p-1">
        {tabs.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-2 text-xs font-semibold transition sm:text-sm ${
                tab === t.id
                  ? 'bg-[var(--color-accent)] text-[var(--color-bg-base)]'
                  : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
              }`}
            >
              <Icon size={15} />
              {t.label}
            </button>
          );
        })}
      </div>

      <div className="animate-fade-in">
        {tab === 'summary' && <AttendanceSummary members={members} events={events} attendance={attendance} />}
        {tab === 'board' && <FieldBoard members={members} events={events} attendance={attendance} />}
        {tab === 'roster' && <RosterManager members={members} />}
        {tab === 'events' && <EventScheduler events={events} />}
      </div>
    </div>
  );
}
