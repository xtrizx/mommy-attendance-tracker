/*
# Familia RO Attendance Tracker - Schema

## Overview
Single-tenant schema for a Ragnarok guild event attendance tracker. No multi-account
auth; the app uses a single master passcode enforced in the frontend. All tables are
intentionally shared/public, so RLS policies allow anon + authenticated CRUD.

## Tables

### members
- id (uuid, pk)
- ign (text, not null) - in-game name
- job (text) - character job/class
- position (text) - e.g. Defender, Push/Roam, PVP, MVP, Backup
- field (text) - "Main" or "Sub"
- team_name (text) - team label
- party_number (int 1-8) - party slot
- display_order (int) - ordering within a group
- created_at, updated_at (timestamptz)

### events
- id (uuid, pk)
- title (text, not null)
- scheduled_at (timestamptz, not null) - event start time in UTC
- created_at (timestamptz)

### attendance
- id (uuid, pk)
- event_id (uuid, FK events, cascade delete)
- member_id (uuid, FK members, cascade delete)
- status (text: 'checked_in' | 'absent')
- reason (text) - mandatory when absent
- created_at, updated_at (timestamptz)
- unique (event_id, member_id)

## Security
- RLS enabled on all tables.
- All tables allow anon + authenticated full CRUD (intentionally shared data).
*/

CREATE TABLE IF NOT EXISTS members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ign text NOT NULL,
  job text NOT NULL DEFAULT '',
  position text NOT NULL DEFAULT '',
  field text NOT NULL DEFAULT '',
  team_name text NOT NULL DEFAULT '',
  party_number int NOT NULL DEFAULT 1,
  display_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_members" ON members;
CREATE POLICY "anon_select_members" ON members FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_members" ON members;
CREATE POLICY "anon_insert_members" ON members FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_members" ON members;
CREATE POLICY "anon_update_members" ON members FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_members" ON members;
CREATE POLICY "anon_delete_members" ON members FOR DELETE
  TO anon, authenticated USING (true);

CREATE INDEX IF NOT EXISTS members_field_team_idx ON members (field, team_name, party_number, display_order);

CREATE TABLE IF NOT EXISTS events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  scheduled_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_events" ON events;
CREATE POLICY "anon_select_events" ON events FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_events" ON events;
CREATE POLICY "anon_insert_events" ON events FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_events" ON events;
CREATE POLICY "anon_update_events" ON events FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_events" ON events;
CREATE POLICY "anon_delete_events" ON events FOR DELETE
  TO anon, authenticated USING (true);

CREATE TABLE IF NOT EXISTS attendance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  member_id uuid NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'checked_in',
  reason text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (event_id, member_id)
);

ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_attendance" ON attendance;
CREATE POLICY "anon_select_attendance" ON attendance FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_attendance" ON attendance;
CREATE POLICY "anon_insert_attendance" ON attendance FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_attendance" ON attendance;
CREATE POLICY "anon_update_attendance" ON attendance FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_attendance" ON attendance;
CREATE POLICY "anon_delete_attendance" ON attendance FOR DELETE
  TO anon, authenticated USING (true);

CREATE INDEX IF NOT EXISTS attendance_event_idx ON attendance (event_id);
CREATE INDEX IF NOT EXISTS attendance_member_idx ON attendance (member_id);

-- updated_at auto-maintenance trigger
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS members_set_updated_at ON members;
CREATE TRIGGER members_set_updated_at BEFORE UPDATE ON members
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS attendance_set_updated_at ON attendance;
CREATE TRIGGER attendance_set_updated_at BEFORE UPDATE ON attendance
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE members;
ALTER PUBLICATION supabase_realtime ADD TABLE events;
ALTER PUBLICATION supabase_realtime ADD TABLE attendance;
