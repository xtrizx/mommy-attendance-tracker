import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from './supabase';
import type { Attendance, GuildEvent, Member } from './types';

export interface AppData {
  members: Member[];
  events: GuildEvent[];
  attendance: Attendance[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useAppData(): AppData {
  const [members, setMembers] = useState<Member[]>([]);
  const [events, setEvents] = useState<GuildEvent[]>([]);
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mounted = useRef(true);

  const refresh = useCallback(async () => {
    try {
      const [m, e, a] = await Promise.all([
        supabase.from('members').select('*').order('created_at', { ascending: true }),
        supabase.from('events').select('*').order('scheduled_at', { ascending: false }),
        supabase.from('attendance').select('*'),
      ]);
      if (m.error) throw m.error;
      if (e.error) throw e.error;
      if (a.error) throw a.error;
      if (!mounted.current) return;
      setMembers(m.data ?? []);
      setEvents(e.data ?? []);
      setAttendance(a.data ?? []);
      setError(null);
    } catch (err) {
      if (mounted.current) setError(err instanceof Error ? err.message : String(err));
    } finally {
      if (mounted.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    mounted.current = true;
    refresh();

    const handleChange = () => refresh();
    const ch = supabase
      .channel('familia-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'members' }, handleChange)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'events' }, handleChange)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'attendance' }, handleChange)
      .subscribe();

    return () => {
      mounted.current = false;
      supabase.removeChannel(ch);
    };
  }, [refresh]);

  return { members, events, attendance, loading, error, refresh };
}
