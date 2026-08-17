import { useMemo, useState } from 'react';
import { Check, Edit3, Plus, Search, Trash2, Upload, X } from 'lucide-react';
import type { Member } from '@/lib/types';
import { FIELD_MAIN, FIELD_SUB, JOBS, POSITIONS } from '@/lib/types';
import { supabase } from '@/lib/supabase';

interface RosterManagerProps {
  members: Member[];
}

export function RosterManager({ members }: RosterManagerProps) {
  const [tab, setTab] = useState<'list' | 'batch' | 'add'>('list');
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState<Member | null>(null);

  const sorted = useMemo(
    () => [...members].sort((a, b) => a.ign.localeCompare(b.ign)),
    [members],
  );
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return sorted;
    return sorted.filter((m) =>
      m.ign.toLowerCase().includes(q) ||
      m.job.toLowerCase().includes(q) ||
      m.position.toLowerCase().includes(q) ||
      m.team_name.toLowerCase().includes(q),
    );
  }, [sorted, search]);

  return (
    <div className="rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-surface)]">
      <div className="flex items-center justify-between border-b border-[var(--color-border-subtle)] px-4 py-3">
        <h3 className="text-sm font-bold text-[var(--color-text-primary)]">Roster Management</h3>
        <span className="text-xs text-[var(--color-text-muted)]">{members.length} / 145 members</span>
      </div>

      <div className="flex gap-1 border-b border-[var(--color-border-subtle)] px-4 py-2">
        <TabBtn active={tab === 'list'} onClick={() => setTab('list')}>List</TabBtn>
        <TabBtn active={tab === 'batch'} onClick={() => setTab('batch')}>Batch Import</TabBtn>
        <TabBtn active={tab === 'add'} onClick={() => setTab('add')}>Add Member</TabBtn>
      </div>

      {tab === 'list' && (
        <div className="p-4">
          <div className="mb-3 flex items-center gap-2 rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-bg-base)] px-3 py-2">
            <Search size={15} className="text-[var(--color-text-muted)]" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by IGN, job, position, team…"
              className="flex-1 bg-transparent text-sm text-[var(--color-text-primary)] outline-none placeholder:text-[var(--color-text-muted)]"
            />
            {search && <button onClick={() => setSearch('')}><X size={15} className="text-[var(--color-text-muted)]" /></button>}
          </div>

          {members.length === 0 ? (
            <p className="py-6 text-center text-sm text-[var(--color-text-muted)]">
              No members yet. Use Batch Import or Add Member to populate the roster.
            </p>
          ) : (
            <div className="max-h-[420px] space-y-1.5 overflow-y-auto">
              {filtered.map((m) => (
                <div
                  key={m.id}
                  className="flex items-center justify-between gap-2 rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-bg-surface-2)] px-3 py-2"
                >
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-semibold text-[var(--color-text-primary)]">{m.ign}</div>
                    <div className="truncate text-[11px] text-[var(--color-text-muted)]">
                      {[m.job, m.position, m.field && `${m.field} Field`, m.team_name, m.party_number && `Party ${m.party_number}`]
                        .filter(Boolean).join(' · ') || 'Unassigned'}
                    </div>
                  </div>
                  <div className="flex shrink-0 gap-1">
                    <button
                      onClick={() => setEditing(m)}
                      className="rounded-md p-1.5 text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-surface-3)] hover:text-[var(--color-primary)]"
                    >
                      <Edit3 size={15} />
                    </button>
                    <DeleteBtn member={m} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'batch' && <BatchImport />}
      {tab === 'add' && (
        <MemberForm
          onDone={() => setTab('list')}
          existingCount={members.length}
        />
      )}

      {editing && (
        <MemberForm
          member={editing}
          onDone={() => { setEditing(null); setTab('list'); }}
          existingCount={members.length}
        />
      )}
    </div>
  );
}

function TabBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-md px-3 py-1.5 text-xs font-semibold transition ${
        active
          ? 'bg-[var(--color-primary)] text-white'
          : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
      }`}
    >
      {children}
    </button>
  );
}

function DeleteBtn({ member }: { member: Member }) {
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);

  const del = async () => {
    setBusy(true);
    await supabase.from('members').delete().eq('id', member.id);
    setBusy(false);
    setConfirming(false);
  };

  if (confirming) {
    return (
      <div className="flex items-center gap-1">
        <button
          onClick={del}
          disabled={busy}
          className="rounded-md bg-[var(--color-error)] px-2 py-1 text-[11px] font-bold text-[var(--color-bg-base)] disabled:opacity-50"
        >
          {busy ? '…' : 'Delete'}
        </button>
        <button onClick={() => setConfirming(false)} className="rounded-md p-1 text-[var(--color-text-muted)]">
          <X size={13} />
        </button>
      </div>
    );
  }
  return (
    <button
      onClick={() => setConfirming(true)}
      className="rounded-md p-1.5 text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-surface-3)] hover:text-[var(--color-error)]"
    >
      <Trash2 size={15} />
    </button>
  );
}

function BatchImport() {
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; msg: string } | null>(null);

  const importNames = async () => {
    const names = text.split('\n').map((l) => l.trim()).filter(Boolean);
    if (names.length === 0) {
      setResult({ ok: false, msg: 'Paste at least one name.' });
      return;
    }
    setBusy(true);
    setResult(null);
    try {
      const rows = names.map((ign, i) => ({
        ign,
        job: '',
        position: '',
        field: '',
        team_name: '',
        party_number: 1,
        display_order: i,
      }));
      const { error, count } = await supabase.from('members').insert(rows);
      if (error) throw error;
      setResult({ ok: true, msg: `Imported ${count ?? names.length} members.` });
      setText('');
    } catch (err) {
      setResult({ ok: false, msg: err instanceof Error ? err.message : 'Import failed' });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="p-4">
      <p className="mb-2 text-xs text-[var(--color-text-secondary)]">
        Paste a list of in-game names (one per line). They'll be added to the roster unassigned — you can edit details after.
      </p>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={8}
        placeholder={'PlayerOne\nPlayerTwo\nPlayerThree'}
        className="w-full resize-y rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-bg-base)] px-3 py-2.5 font-mono text-sm text-[var(--color-text-primary)] outline-none transition focus:border-[var(--color-primary)] placeholder:text-[var(--color-text-muted)]"
      />
      <button
        onClick={importNames}
        disabled={busy}
        className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg bg-[var(--color-primary)] py-2.5 text-sm font-bold text-white transition hover:opacity-90 disabled:opacity-50"
      >
        <Upload size={16} /> {busy ? 'Importing…' : 'Import Names'}
      </button>
      {result && (
        <div className={`mt-3 rounded-lg px-3 py-2 text-sm font-medium ${
          result.ok ? 'bg-[var(--color-success-soft)] text-[var(--color-success)]' : 'bg-[var(--color-error-soft)] text-[var(--color-error)]'
        }`}>
          {result.msg}
        </div>
      )}
    </div>
  );
}

function MemberForm({ member, onDone, existingCount }: { member?: Member; onDone: () => void; existingCount: number }) {
  const [ign, setIgn] = useState(member?.ign ?? '');
  const [job, setJob] = useState(member?.job ?? '');
  const [position, setPosition] = useState(member?.position ?? '');
  const [field, setField] = useState(member?.field ?? '');
  const [teamName, setTeamName] = useState(member?.team_name ?? '');
  const [partyNumber, setPartyNumber] = useState(member?.party_number ?? 1);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEdit = !!member;

  const save = async () => {
    if (!ign.trim()) {
      setError('IGN is required.');
      return;
    }
    if (!isEdit && existingCount >= 145) {
      setError('Roster is full (145 members max).');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const payload = {
        ign: ign.trim(),
        job: job || '',
        position: position || '',
        field: field || '',
        team_name: teamName || '',
        party_number: Math.min(8, Math.max(1, partyNumber)),
        display_order: member?.display_order ?? existingCount,
      };
      if (isEdit && member) {
        const { error } = await supabase.from('members').update(payload).eq('id', member.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('members').insert(payload);
        if (error) throw error;
      }
      onDone();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="p-4">
      <div className="mb-3 flex items-center gap-2">
        {isEdit ? <Edit3 size={16} className="text-[var(--color-primary)]" /> : <Plus size={16} className="text-[var(--color-primary)]" />}
        <h4 className="text-sm font-bold text-[var(--color-text-primary)]">{isEdit ? 'Edit Member' : 'Add Member'}</h4>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field label="IGN *">
          <input value={ign} onChange={(e) => setIgn(e.target.value)} className={inputCls} placeholder="In-game name" />
        </Field>
        <Field label="Job">
          <select value={job} onChange={(e) => setJob(e.target.value)} className={inputCls}>
            <option value="">—</option>
            {JOBS.map((j) => <option key={j} value={j}>{j}</option>)}
          </select>
        </Field>
        <Field label="Position">
          <select value={position} onChange={(e) => setPosition(e.target.value)} className={inputCls}>
            <option value="">—</option>
            {POSITIONS.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
        </Field>
        <Field label="Field">
          <select value={field} onChange={(e) => setField(e.target.value)} className={inputCls}>
            <option value="">—</option>
            <option value={FIELD_MAIN}>Main</option>
            <option value={FIELD_SUB}>Sub</option>
          </select>
        </Field>
        <Field label="Team Name">
          <input value={teamName} onChange={(e) => setTeamName(e.target.value)} className={inputCls} placeholder="e.g. Team 1" />
        </Field>
        <Field label="Party # (1–8)">
          <input
            type="number"
            min={1}
            max={8}
            value={partyNumber}
            onChange={(e) => setPartyNumber(Number(e.target.value))}
            className={inputCls}
          />
        </Field>
      </div>

      {error && <p className="mt-3 text-sm font-medium text-[var(--color-error)]">{error}</p>}

      <div className="mt-4 flex gap-2">
        <button
          onClick={save}
          disabled={busy}
          className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-[var(--color-success)] py-2.5 text-sm font-bold text-[var(--color-bg-base)] disabled:opacity-50"
        >
          <Check size={16} /> {busy ? 'Saving…' : isEdit ? 'Save Changes' : 'Add Member'}
        </button>
        <button
          onClick={onDone}
          className="rounded-lg border border-[var(--color-border-subtle)] px-4 py-2.5 text-sm font-semibold text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

const inputCls =
  'w-full rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-bg-base)] px-3 py-2.5 text-sm text-[var(--color-text-primary)] outline-none transition focus:border-[var(--color-primary)] placeholder:text-[var(--color-text-muted)]';

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-[var(--color-text-secondary)]">{label}</span>
      {children}
    </label>
  );
}
