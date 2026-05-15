export function convertDeadlineToUTC(
  deadlineDate: Date | string | null,
  deadlineTime: string | null,
  deadlineTimezone: string | null
): Date | null {
  if (!deadlineDate) return null;
  const date = deadlineDate instanceof Date ? deadlineDate : new Date(deadlineDate);
  if (isNaN(date.getTime())) return null;

  const year = date.getUTCFullYear();
  const month = date.getUTCMonth();
  const day = date.getUTCDate();
  let hours = 23, minutes = 59;
  if (deadlineTime) {
    const [h, m] = deadlineTime.split(':').map(Number);
    if (!isNaN(h) && !isNaN(m)) { hours = h; minutes = m; }
  }

  const tz = deadlineTimezone || 'UTC';
  if (tz === 'UTC') return new Date(Date.UTC(year, month, day, hours, minutes, 0));

  try {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: tz,
      hour12: false,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
    
    for (let offsetHours = -12; offsetHours <= 14; offsetHours++) {
      const candidateUTC = new Date(Date.UTC(year, month, day, hours - offsetHours, minutes, 0));
      const parts = formatter.formatToParts(candidateUTC);
      const tzYear = parseInt(parts.find(p => p.type === 'year')?.value || '0');
      const tzMonth = parseInt(parts.find(p => p.type === 'month')?.value || '0') - 1;
      const tzDay = parseInt(parts.find(p => p.type === 'day')?.value || '0');
      const tzHour = parseInt(parts.find(p => p.type === 'hour')?.value || '0');
      const tzMin = parseInt(parts.find(p => p.type === 'minute')?.value || '0');
      
      if (tzYear === year && tzMonth === month && tzDay === day && tzHour === hours && tzMin === minutes) {
        return candidateUTC;
      }
    }
    
    return new Date(Date.UTC(year, month, day, hours, minutes, 0));
  } catch {
    return new Date(Date.UTC(year, month, day, hours, minutes, 0));
  }
}

export function isDeadlineExpired(
  deadline: Date | string | null,
  deadlineTime: string | null,
  deadlineTimezone: string | null,
  now: Date = new Date()
): boolean {
  const deadlineUTC = convertDeadlineToUTC(deadline, deadlineTime, deadlineTimezone);
  return deadlineUTC ? deadlineUTC < now : false;
}
