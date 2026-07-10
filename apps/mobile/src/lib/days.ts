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
