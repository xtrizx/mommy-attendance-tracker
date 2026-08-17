export type AttendanceStatus = 'checked_in' | 'absent';

export interface Member {
  id: string;
  ign: string;
  job: string;
  position: string;
  field: string; // "Main" | "Sub"
  team_name: string;
  party_number: number; // 1..8
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface GuildEvent {
  id: string;
  title: string;
  scheduled_at: string; // ISO UTC
  created_at: string;
}

export interface Attendance {
  id: string;
  event_id: string;
  member_id: string;
  status: AttendanceStatus;
  reason: string;
  created_at: string;
  updated_at: string;
}

export const FIELD_MAIN = 'Main';
export const FIELD_SUB = 'Sub';

export const POSITIONS = [
  'Defender',
  'Push/Roam',
  'PVP',
  'MVP',
  'Ore Collection/Repair',
  'Backup',
  'Reserve',
] as const;

export const JOBS = [
  'Knight', 'Lord Knight', 'Paladin', 'Crusader',
  'Assassin', 'Assassin Cross', 'Guillotine Cross',
  'Hunter', 'Sniper', 'Ranger',
  'Wizard', 'High Wizard', 'Warlock',
  'Priest', 'High Priest', 'Arch Bishop',
  'Blacksmith', 'Whitesmith', 'Mechanic',
  'Alchemist', 'Creator', 'Genetic',
  'Rogue', 'Stalker', 'Shadow Chaser',
  'Monk', 'Champion', 'Sura',
  'Sage', 'Professor', 'Sorcerer',
  'Bard', 'Clown', 'Minstrel',
  'Dancer', 'Gypsy', 'Wanderer',
  'Ninja', 'Gunslinger', 'Rebellion',
  'Super Novice',
  'Other',
] as const;
