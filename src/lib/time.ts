export function localTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  } catch {
    return 'UTC';
  }
}

export function formatLocal(isoUtc: string): string {
  const d = new Date(isoUtc);
  return d.toLocaleString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

export function formatLocalShort(isoUtc: string): string {
  const d = new Date(isoUtc);
  return d.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

export function formatTimeOnly(isoUtc: string): string {
  const d = new Date(isoUtc);
  return d.toLocaleString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

// Convert a local datetime-local input value + assumed local zone into ISO UTC.
// datetime-local gives us "YYYY-MM-DDTHH:mm" in the user's local time.
export function localInputToUtc(localValue: string): string {
  // new Date() interprets YYYY-MM-DDTHH:mm (no Z) as local time
  return new Date(localValue).toISOString();
}

// Convert ISO UTC into a value suitable for datetime-local input in user's local time
export function utcToLocalInput(isoUtc: string): string {
  const d = new Date(isoUtc);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function relativeTime(isoUtc: string): string {
  const now = Date.now();
  const t = new Date(isoUtc).getTime();
  const diff = t - now;
  const absDiff = Math.abs(diff);
  const min = 60_000, hr = 60 * min, day = 24 * hr;
  const fmt = (v: number, unit: string) => `${Math.round(v)} ${unit}${Math.round(v) === 1 ? '' : 's'}`;
  let str: string;
  if (absDiff < min) str = 'just now';
  else if (absDiff < hr) str = fmt(absDiff / min, 'min');
  else if (absDiff < day) str = fmt(absDiff / hr, 'hr');
  else str = fmt(absDiff / day, 'day');
  if (absDiff < min) return str;
  return diff > 0 ? `in ${str}` : `${str} ago`;
}
