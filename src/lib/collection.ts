import { normaliseCv } from "./io";
import type { Cv } from "./types";

const COLLECTION_KIND = "cv-studio/collection";

/** Portable CVs only. Restores receive fresh IDs and never replace existing CVs. */
export function exportCollection(cvs: Cv[]): string {
  return JSON.stringify({ kind: COLLECTION_KIND, version: 1, cvs }, null, 2);
}

/** Reject a damaged collection as a whole rather than silently losing its records. */
export function parseCollection(text: string): Cv[] | null {
  try {
    const raw = JSON.parse(text);
    if (
      raw?.kind !== COLLECTION_KIND ||
      raw.version !== 1 ||
      !Array.isArray(raw.cvs) ||
      !raw.cvs.length
    )
      return null;
    const cvs = raw.cvs.map((item: unknown) => normaliseCv(item));
    return cvs.every((cv: Cv | null) => cv !== null) ? cvs : null;
  } catch {
    return null;
  }
}
