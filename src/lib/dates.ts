const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

/** "2025-07" → "Jul 2025" */
export function formatMonth(value: string): string {
  const [year, month] = value.split("-").map(Number);
  if (!year || !month || month < 1 || month > 12)
    throw new Error(`Invalid month: ${value}`);
  return `${MONTHS[month - 1]} ${year}`;
}

/** ("2024-10", "2025-06") → "Oct 2024 – Jun 2025"; no end → "… – Present" */
export function formatRange(start: string, end?: string): string {
  return `${formatMonth(start)} – ${end ? formatMonth(end) : "Present"}`;
}
