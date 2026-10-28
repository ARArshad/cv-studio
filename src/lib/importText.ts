import { escapeHtml } from "./rich";
import {
  SECTION_LABELS,
  kindOf,
  newEntry,
  newItem,
  newSection,
  uid,
} from "./sample";
import type { CvData, DetailIcon, Entry, Section, SectionType } from "./types";

/**
 * Turns the text of an old CV into sections. It is a best guess: headings
 * are recognised by common names, contact details by their shape, and job
 * lines by dates. The person reviews the result on the page afterwards.
 */

const HEADINGS: [RegExp, SectionType][] = [
  [
    /^(professional |personal |career )?(summary|profile|objective|about( me)?)$/i,
    "summary",
  ],
  [
    /^(work |professional |employment |career )?(experience|history|employment)( history)?$/i,
    "experience",
  ],
  [
    /^(education|qualifications|academic background|education and training)$/i,
    "education",
  ],
  [
    /^(technical |key |core )?(skills|competencies|expertise|skills and abilities)$/i,
    "skills",
  ],
  [/^soft skills$/i, "softSkills"],
  [/^languages?$/i, "languages"],
  [/^(personal |key )?projects$/i, "projects"],
  [
    /^(certifications?|certificates|licen[cs]es( and certifications)?)$/i,
    "certificates",
  ],
  [/^(courses|training)$/i, "courses"],
  [/^(achievements|accomplishments|awards|honou?rs( and awards)?)$/i, "awards"],
  [/^(volunteering|volunteer experience)$/i, "volunteering"],
  [/^(publications)$/i, "publications"],
  [/^(interests|hobbies|hobbies and interests)$/i, "interests"],
  [/^references?$/i, "references"],
  [/^(organi[sz]ations|memberships)$/i, "organizations"],
];

const MONTH =
  "(jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*\\.?";
const MONTH_NC =
  "(?:jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*\\.?";
const DATE = `(?:${MONTH_NC}\\s*\\d{4}|\\d{1,2}[/.]\\d{4}|\\d{4})`;
const RANGE = new RegExp(
  `(${DATE})\\s*(?:-|–|—|to|until)\\s*(${DATE}|present|current|now|today)`,
  "i",
);
const SINGLE = new RegExp(`\\b(${DATE})\\b`, "i");
const BULLET = /^\s*([•●▪◦·*\-–]|\d+[.)])\s+/;

function headingType(line: string): SectionType | null {
  const t = line.replace(/[:|]+$/, "").trim();
  if (t.length > 40) return null;
  for (const [re, type] of HEADINGS) if (re.test(t)) return type;
  return null;
}

function toIso(d: string): string {
  const m = d.toLowerCase().match(new RegExp(`^${MONTH}\\s*(\\d{4})$`));
  const months = [
    "jan",
    "feb",
    "mar",
    "apr",
    "may",
    "jun",
    "jul",
    "aug",
    "sep",
    "oct",
    "nov",
    "dec",
  ];
  if (m)
    return `${m[2]}-${String(months.indexOf(m[1].slice(0, 3)) + 1).padStart(2, "0")}`;
  const n = d.match(/^(\d{1,2})[/.](\d{4})$/);
  if (n) return `${n[2]}-${n[1].padStart(2, "0")}`;
  return d;
}

export function parseCvText(text: string): CvData {
  const lines = text
    .replace(/\r/g, "")
    .split("\n")
    .map((l) => l.replace(/\s+/g, " ").trim())
    .filter(Boolean);
  const details: { id: string; icon: DetailIcon; value: string }[] = [];
  const addDetail = (icon: DetailIcon, value: string) => {
    if (!details.some((d) => d.value === value))
      details.push({ id: uid("d_"), icon, value });
  };

  /* contact details anywhere in the first lines, and the name and title before the first heading */
  let i = 0;
  const head: string[] = [];
  for (; i < lines.length && !headingType(lines[i]); i++) {
    let line = lines[i];
    line.match(/[\w.+-]+@[\w-]+\.[\w.-]+/g)?.forEach((m) => {
      addDetail("email", m);
      line = line.replace(m, " ");
    });
    line.match(/(?:linkedin\.com\/in\/[\w-]+)/gi)?.forEach((m) => {
      addDetail("linkedin", m);
      line = line.replace(m, " ");
    });
    line.match(/(?:github\.com\/[\w-]+)/gi)?.forEach((m) => {
      addDetail("github", m);
      line = line.replace(m, " ");
    });
    line.match(/\+?\d[\d\s().-]{7,}\d/g)?.forEach((m) => {
      addDetail("phone", m.trim());
      line = line.replace(m, " ");
    });
    line
      .match(
        /\b(?:https?:\/\/)?(?:www\.)?[\w-]+\.(?:com|co\.uk|io|dev|me|net|org)(?:\/[\w-]*)?\b/gi,
      )
      ?.forEach((m) => {
        addDetail("website", m);
        line = line.replace(m, " ");
      });
    const parts = line
      .split(/\s*[|•·]\s*/)
      .map((x) => x.trim())
      .filter(Boolean);
    const loc = parts.find(
      (x) => /^[A-Z][\w .'-]+,\s*[A-Z][\w .'-]+$/.test(x) && x.length < 50,
    );
    if (loc && head.length > 0) {
      addDetail("location", loc);
      line = line.replace(loc, " ");
    }
    line = line
      .replace(/[|•·]+/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    if (line) head.push(line);
  }
  const name = head[0] ?? "";
  const jobTitle = head[1] && head[1].length < 70 ? head[1] : "";
  const maybeLocation = head
    .slice(2)
    .find((l) => /^[A-Z][\w\s.'-]+,\s*[A-Z][\w\s.'-]+$/.test(l));
  if (maybeLocation) addDetail("location", maybeLocation);

  const sections: Section[] = [];
  let cur: Section | null = null;
  let entry: Entry | null = null;
  const flushEntry = () => {
    if (
      cur &&
      entry &&
      (entry.title || entry.bullets.length || entry.description)
    )
      cur.entries.push(entry);
    entry = null;
  };

  for (; i < lines.length; i++) {
    const line = lines[i];
    const type = headingType(line);
    if (type) {
      flushEntry();
      cur = newSection(type, {
        title: SECTION_LABELS[type].title,
        entries: [],
        items: [],
        text: "",
      });
      sections.push(cur);
      continue;
    }
    if (!cur) continue;
    const kind = kindOf(cur.type);
    if (kind === "text") {
      cur.text =
        (cur.text ? cur.text + " " : "") + escapeHtml(line.replace(BULLET, ""));
      continue;
    }
    if (kind === "items") {
      line
        .replace(BULLET, "")
        .split(/\s*[,;•|·]\s*/)
        .map((x) => x.trim())
        .filter((x) => x && x.length < 50)
        .forEach((x) => {
          const lvl = x.match(/\(([^)]+)\)$/);
          cur!.items.push(
            newItem(
              x.replace(/\s*\([^)]*\)$/, ""),
              lvl ? 3 : cur!.type === "languages" ? 3 : 0,
            ),
          );
        });
      continue;
    }
    /* entries */
    if (BULLET.test(line)) {
      if (!entry) entry = newEntry();
      entry.bullets.push(escapeHtml(line.replace(BULLET, "")));
      cur.fields.bullets = true;
      continue;
    }
    const range = line.match(RANGE);
    const single = !range && line.length < 90 ? line.match(SINGLE) : null;
    const rest = line
      .replace(range?.[0] ?? single?.[0] ?? "", "")
      .replace(/[|,–—-]\s*$/, "")
      .replace(/^\s*[|,–—-]/, "")
      .trim();
    if (range || (single && !entry?.title)) {
      if (entry && (entry.startDate || entry.endDate || entry.bullets.length))
        flushEntry();
      if (!entry) entry = newEntry();
      if (range) {
        entry.startDate = toIso(range[1]);
        if (/present|current|now|today/i.test(range[2])) entry.current = true;
        else entry.endDate = toIso(range[2]);
      } else if (single) entry.endDate = toIso(single[1]);
      if (rest) {
        if (!entry.title) entry.title = rest;
        else if (!entry.subtitle) entry.subtitle = rest;
      }
      continue;
    }
    if (!entry || entry.bullets.length) {
      flushEntry();
      entry = newEntry({ title: line });
      continue;
    }
    if (!entry.title) entry.title = line;
    else if (!entry.subtitle && line.length < 80) entry.subtitle = line;
    else {
      entry.description =
        (entry.description ? entry.description + " " : "") + escapeHtml(line);
      cur.fields.description = true;
    }
  }
  flushEntry();

  /* "Job title, Company" or "Job title at Company" on one line */
  for (const sec of sections)
    for (const e of sec.entries) {
      if (e.subtitle || !e.title) continue;
      const m = e.title.match(
        /^(.{3,60}?)\s*(?:,| at | @ | \| | – | — | - )\s*(.{2,60})$/,
      );
      if (m) {
        e.title = m[1];
        e.subtitle = m[2];
      }
    }

  return {
    personal: { fullName: name, jobTitle, photo: "", details },
    sections: sections.filter(
      (s) => s.text || s.entries.length || s.items.length,
    ),
  };
}

/** the text of a PDF, line by line, read in the browser */
export async function pdfText(file: File): Promise<string> {
  const pdfjs = await import("pdfjs-dist");
  pdfjs.GlobalWorkerOptions.workerSrc = `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/pdf.worker.min.mjs`;
  const task = pdfjs.getDocument({
    data: new Uint8Array(await file.arrayBuffer()),
  });
  try {
    const doc = await task.promise;
    if (doc.numPages > 100)
      throw new Error("Please import a PDF with 100 pages or fewer.");
    const out: string[] = [];
    for (let n = 1; n <= doc.numPages; n++) {
      const page = await doc.getPage(n);
      const content = await page.getTextContent();
      /* group text runs into lines by their vertical position */
      const rows = new Map<number, { x: number; s: string }[]>();
      for (const it of content.items) {
        if (!("str" in it) || !it.str.trim()) continue;
        const y = Math.round(it.transform[5] / 2) * 2;
        const row = rows.get(y) ?? [];
        row.push({ x: it.transform[4], s: it.str });
        rows.set(y, row);
      }
      [...rows.entries()]
        .sort((a, b) => b[0] - a[0])
        .forEach(([, row]) => {
          out.push(
            row
              .sort((a, b) => a.x - b.x)
              .map((r) => r.s)
              .join(" ")
              .replace(/\s+/g, " ")
              .trim(),
          );
        });
    }
    return out.join("\n");
  } finally {
    await task.destroy();
  }
}
