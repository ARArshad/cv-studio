import type { DateFormat } from "./types";

export const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

/**
 * Dates picked in the editor are stored as "2021-03" or "2021" and written
 * out in the format chosen under Page. Anything typed by hand, such as
 * "Summer 2019", is shown exactly as typed.
 */
export function formatDate(v: string, fmt: DateFormat): string {
  const m = v.trim().match(/^(\d{4})-(\d{2})$/);
  if (m) {
    const y = m[1], mo = Number(m[2]);
    if (mo < 1 || mo > 12) return v;
    switch (fmt) {
      case "mm/yyyy": return `${m[2]}/${y}`;
      case "mon yyyy": return `${MONTHS[mo - 1].slice(0, 3)} ${y}`;
      case "month yyyy": return `${MONTHS[mo - 1]} ${y}`;
      case "yyyy": return y;
    }
  }
  return v.trim();
}

export function parseDate(v: string): { year: number | null; month: number | null } {
  const m = v.trim().match(/^(\d{4})(?:-(\d{2}))?$/);
  if (!m) return { year: null, month: null };
  return { year: Number(m[1]), month: m[2] ? Number(m[2]) : null };
}
