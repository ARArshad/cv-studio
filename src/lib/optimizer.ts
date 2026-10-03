import { toText } from "./rich";
import type { Cv, CvData } from "./types";

/**
 * Line by line suggestions shown on the page as small markers. Each one
 * points at the field it is about (the same path the editor uses) and,
 * where a fix is safe to make automatically, carries it.
 */
export interface Suggestion {
  id: string;
  /** the field it is about, e.g. "bul:<section>:<entry>:2" */
  path: string;
  level: "fix" | "tip";
  title: string;
  detail: string;
  fix?: { label: string; apply: (d: { data: CvData }) => void };
}

const WEAK: [RegExp, string][] = [
  [/^responsible for\s+/i, "Led "],
  [/^in charge of\s+/i, "Ran "],
  [/^duties included\s+/i, ""],
  [/^tasked with\s+/i, ""],
  [/^helped (to )?/i, "Supported "],
  [/^assisted (with |in )?/i, "Supported "],
  [/^worked on\s+/i, "Delivered "],
  [/^was involved in\s+/i, "Contributed to "],
  [/^participated in\s+/i, "Contributed to "],
  [/^handled\s+/i, "Managed "],
];

const words = (s: string) => toText(s).trim().split(/\s+/).filter(Boolean);
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export function optimize(cv: Cv, pages = 1): Suggestion[] {
  const out: Suggestion[] = [];
  const add = (x: Suggestion) => out.push(x);
  const d = cv.design;
  const p = cv.data.personal;
  const usStyle = ["us", "ca", "au", "uk", "ie"].includes(d.country);

  /* contact details */
  const has = (icon: string) => p.details.some((x) => x.icon === icon && x.value.trim());
  if (!p.fullName.trim()) add({ id: "name", path: "name", level: "fix", title: "Add your name", detail: "Your full name goes at the top of the page." });
  if (!has("email")) add({ id: "email", path: "name", level: "fix", title: "Add an email address", detail: "Employers need a way to reply. Add it under Personal info." });
  if (!has("phone")) add({ id: "phone", path: "name", level: "tip", title: "Add a phone number", detail: "Many recruiters call before they email." });
  const dob = p.details.find((x) => x.icon === "calendar" && x.value.trim());
  if (dob && usStyle) {
    add({
      id: "dob", path: `detail:${dob.id}`, level: "fix", title: "Leave out your date of birth",
      detail: "In the UK, Ireland, the US, Canada and Australia, age is not expected on a CV and can invite bias.",
      fix: { label: "Remove it", apply: (x) => { x.data.personal.details = x.data.personal.details.filter((q) => q.id !== dob.id); } },
    });
  }
  if (cv.design.showPhoto && p.photo && ["us", "ca", "uk", "ie", "au"].includes(d.country)) {
    add({ id: "photo", path: "name", level: "tip", title: "Consider leaving the photo off", detail: "Photos are usually left off CVs in the UK, Ireland, the US, Canada and Australia. Hide it under Layout." });
  }
  if (d.country === "us" || d.country === "ca") {
    if (d.pageSize !== "Letter") add({ id: "letter", path: "name", level: "tip", title: "Use US Letter paper", detail: "Employers in the US and Canada print on Letter, not A4. Change it under Page." });
  }

  for (const s of cv.data.sections) {
    if (s.hidden) continue;
    if (s.type === "summary") {
      const n = words(s.text).length;
      const path = `sec:${s.id}:text`;
      if (n === 0) add({ id: "sum0", path, level: "fix", title: "Write a short summary", detail: "Two to four lines on who you are, your strongest experience and what you want next." });
      else if (n < 25) add({ id: "sum-short", path, level: "tip", title: "Say a little more", detail: "A summary of 30 to 80 words gives a reader enough to want the rest." });
      else if (n > 110) add({ id: "sum-long", path, level: "tip", title: "Trim your summary", detail: `It is ${n} words. Keep it under 100 so it is read in full.` });
      if (/\[[^\]]{1,14}\]/.test(s.text)) add({ id: "sum-ph", path, level: "fix", title: "Fill in the placeholder", detail: "Replace the text in square brackets with your own details." });
      continue;
    }
    for (const e of s.entries) {
      const base = `ent:${s.id}:${e.id}`;
      if (!e.title.trim()) add({ id: base + ":t", path: `${base}:title`, level: "fix", title: "Add a title", detail: "Every entry needs a title, such as a job title or qualification." });
      if (s.fields.dates && !e.startDate && !e.endDate && !e.current && ["experience", "education", "volunteering", "projects"].includes(s.type)) {
        add({ id: base + ":d", path: `${base}:title`, level: "fix", title: "Add dates", detail: "Recruiters look for dates first. Click the date on the page to pick them." });
      }
      if (s.type === "experience" && e.title.trim()) {
        const real = e.bullets.filter((b) => toText(b).trim());
        if (real.length < 2 && words(e.description).length < 20) {
          add({ id: base + ":few", path: `${base}:title`, level: "fix", title: "Add more detail", detail: "Give each job at least two bullet points about what you achieved." });
        }
        if (real.length > 7) add({ id: base + ":many", path: `${base}:title`, level: "tip", title: "Fewer, stronger bullets", detail: `This job has ${real.length} bullets. Keep the five or six with the most impact.` });
      }
      const starts = new Map<string, number>();
      e.bullets.forEach((b, i) => {
        const t = toText(b).trim();
        if (!t) return;
        const path = `bul:${s.id}:${e.id}:${i}`;
        for (const [re, rep] of WEAK) {
          if (re.test(t)) {
            add({
              id: path + ":weak", path, level: "fix", title: "Start with a strong action word",
              detail: `"${t.split(/\s+/).slice(0, 3).join(" ")}…" describes a duty, not a result. Lead with what you did.`,
              fix: {
                label: "Rewrite the opening",
                apply: (x) => {
                  const be = x.data.sections.find((q) => q.id === s.id)?.entries.find((q) => q.id === e.id);
                  if (!be) return;
                  const plain = toText(be.bullets[i]).trim().replace(re, rep);
                  be.bullets[i] = cap(plain.trim());
                },
              },
            });
            break;
          }
        }
        if (/\b(I|my|me)\b/.test(t)) add({ id: path + ":i", path, level: "tip", title: "Drop the first person", detail: "CV bullets read better without I, me or my." });
        if (s.type === "experience" && !/\d/.test(t)) add({ id: path + ":num", path, level: "tip", title: "Add a number", detail: "Numbers prove impact: how many, how much, how fast, what percentage." });
        const n = words(t).length;
        if (n > 32) add({ id: path + ":long", path, level: "tip", title: "Shorten this bullet", detail: `${n} words. Aim for one or two lines.` });
        if (/\[[^\]]{1,14}\]/.test(t)) add({ id: path + ":ph", path, level: "fix", title: "Fill in the placeholder", detail: "Replace the text in square brackets with your own details." });
        const first = t.split(/\s+/)[0].toLowerCase();
        starts.set(first, (starts.get(first) ?? 0) + 1);
        if (starts.get(first) === 2 && first.length > 2) add({ id: path + ":rep", path, level: "tip", title: `"${cap(first)}" again`, detail: "Two bullets in this job start with the same word. Vary them." });
      });
    }
  }

  /* length for the level */
  if (pages > 1 && (d.level === "student" || d.level === "entry")) {
    add({ id: "len", path: "name", level: "tip", title: "Aim for one page", detail: "At the start of a career, one page is plenty. Try Compact spacing or fewer bullets." });
  }
  return out;
}

/** suggestions grouped by the field they point at, for markers on the page */
export function byPath(list: Suggestion[]): Map<string, Suggestion[]> {
  const m = new Map<string, Suggestion[]>();
  for (const s of list) m.set(s.path, [...(m.get(s.path) ?? []), s]);
  return m;
}
