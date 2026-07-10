/** French weekday abbreviations (Sunday = 0). */
const FR_WEEKDAY = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'] as const;

/** Build day column labels from API date keys (YYYY-MM-DD, Europe/Paris). */
export function dayLabelsFromDates(dailyKeys: string[]): string[] {
  return dailyKeys.map((key, index) => {
    if (index === 0) return 'Auj.';
    const [year, month, day] = key.split('-').map(Number);
    const weekday = new Date(year, month - 1, day).getDay();
    return FR_WEEKDAY[weekday];
  });
}

export function hourFromIso(isoTime: string): number {
  return Number(isoTime.slice(11, 13));
}

const DETAIL_DISPLAY_HOURS = [6, 8, 10, 12, 14, 16, 18, 20] as const;

export function displayHourForNow(now = new Date()): number {
  const h = now.getHours();
  let chosen: number = DETAIL_DISPLAY_HOURS[0];
  for (const slot of DETAIL_DISPLAY_HOURS) {
    if (slot <= h) chosen = slot;
  }
  return chosen;
}

export function defaultDetailHour(dayIndex: number, now = new Date()): number {
  return dayIndex === 0 ? displayHourForNow(now) : 12;
}
