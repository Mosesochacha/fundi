/**
 * Format a date string or Date object into a human-readable format
 * @param date Date string or Date object
 * @param format Format string (default: 'MMM d, yyyy')
 * @returns Formatted date string
 */
export function formatDate(date: string | Date, format: string = 'MMM d, yyyy'): string {
  if (!date) return '';
  
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';
  
  const months = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ];
  
  const day = d.getDate();
  const month = months[d.getMonth()];
  const monthNum = d.getMonth() + 1;
  const year = d.getFullYear();
  
  return format
    .replace('yyyy', String(year))
    .replace('yy', String(year).slice(-2))
    .replace('MMM', month)
    .replace('MM', String(monthNum).padStart(2, '0'))
    .replace('M', String(monthNum))
    .replace('dd', String(day).padStart(2, '0'))
    .replace('d', String(day));
}

/**
 * Parse a date string from environment variable into a Date object
 * Supports multiple date formats
 */
export function parseCutoffDateFromEnv(value: string | undefined): Date | null {
  if (!value) return null;

  try {
    let cutoffDate: Date;

    if (value.match(/^\d{4}-\d{2}-\d{2}:\d{2}:\d{2}:\d{2}$/)) {
      cutoffDate = new Date(value.replace(/^(\d{4}-\d{2}-\d{2}):/, '$1T'));
    } else if (value.includes('T')) {
      cutoffDate = new Date(value);
    } else if (value.includes(' ')) {
      cutoffDate = new Date(value.replace(' ', 'T'));
    } else {
      cutoffDate = new Date(value);
    }

    if (isNaN(cutoffDate.getTime())) {
      return null;
    }

    return cutoffDate;
  } catch {
    return null;
  }
}

