export function getDayKey(date: Date | string) {
  const d = typeof date === "string" ? new Date(date) : date;

  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export function formatDayLabel(dayKey: string) {
  const d = new Date(`${dayKey}T00:00:00`);

  return d.toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "short",
  });
}

export function formatMonthLabel(date: Date) {
  return date.toLocaleDateString("en-GB", {
    month: "long",
    year: "numeric",
  });
}

export const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export type CalendarCell = {
  date: Date;
  dayKey: string;
  dayNumber: number;
  inCurrentMonth: boolean;
};

export function getMonthGrid(monthDate: Date): CalendarCell[][] {
  const year = monthDate.getFullYear();
  const month = monthDate.getMonth();

  const firstOfMonth = new Date(year, month, 1);
  const startWeekday = firstOfMonth.getDay();

  const gridStart = new Date(year, month, 1 - startWeekday);

  const weeks: CalendarCell[][] = [];

  for (let week = 0; week < 6; week++) {
    const row: CalendarCell[] = [];

    for (let day = 0; day < 7; day++) {
      const cellDate = new Date(gridStart);
      cellDate.setDate(gridStart.getDate() + week * 7 + day);

      row.push({
        date: cellDate,
        dayKey: getDayKey(cellDate),
        dayNumber: cellDate.getDate(),
        inCurrentMonth: cellDate.getMonth() === month,
      });
    }

    weeks.push(row);
  }

  return weeks;
}