function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function startDateFromYears(years: number, now = new Date()): string {
  const clamped =
    Number.isFinite(years) && years >= 0 ? Math.floor(years) : 0;
  const date = new Date(now);
  date.setFullYear(date.getFullYear() - clamped);
  return formatDate(date);
}
