import { designFor, kindOf, newEntry, newItem, newSection, uid, SECTION_LABELS } from "./sample";
import { TEMPLATE_MAP, defaultColumn } from "./templates";
import { FONTS } from "./fonts";
import type { Cv, CvData, Design, Detail, DetailIcon, Section, SectionType } from "./types";

/**
 * Reading CVs from files. Accepts files saved by this app (.json) and
 * .cvjson files saved by the earlier single file CV Studio.
 */

export const FILE_KIND = "cv-studio/cv";

export function exportFile(cv: Cv): string {
  return JSON.stringify({ kind: FILE_KIND, version: 1, cv }, null, 2);
}

export function fileName(cv: Cv, ext: string): string {
  return (cv.title.replace(/[^\w\s-]/g, "").trim() || "CV") + ext;
}

const ICONS: DetailIcon[] = ["email", "phone", "location", "website", "linkedin", "github", "calendar", "flag", "car", "user", "briefcase", "star"];
const TYPES = Object.keys(SECTION_LABELS) as SectionType[];

const str = (v: unknown) => (typeof v === "string" ? v : v == null ? "" : String(v));

/** make any parsed object safe for the editor and the templates */
export function normaliseCv(raw: unknown): Cv | null {
  const r = raw as Partial<Cv> & { data?: Partial<CvData> };
  if (!r || typeof r !== "object" || !r.data || !Array.isArray(r.data.sections)) return null;
  const p = (r.data.personal ?? {}) as Partial<CvData["personal"]>;
  const tpl = r.design?.template && TEMPLATE_MAP[r.design.template] ? r.design.template : "aurora";
  const base = designFor(tpl);
  const d = { ...base, ...(r.design ?? {}) } as Design;
  if (!FONTS.some((f) => f.key === d.fontBody)) d.fontBody = base.fontBody;
  if (!FONTS.some((f) => f.key === d.fontHeading)) d.fontHeading = base.fontHeading;
  d.fontScale = clamp(Number(d.fontScale) || 1, 0.8, 1.2);
  d.lineHeight = clamp(Number(d.lineHeight) || 1.45, 1.1, 1.9);
  d.margin = clamp(Number(d.margin) || base.margin, 16, 72);

  const sections: Section[] = r.data.sections.map((s0) => {
    const s = s0 as Partial<Section>;
    const type = TYPES.includes(s.type as SectionType) ? (s.type as SectionType) : "custom";
    const kind = kindOf(type);
    return {
      id: str(s.id) || uid("s_"),
      type,
      title: str(s.title) || SECTION_LABELS[type].title,
      column: s.column === "side" || s.column === "main" ? s.column : defaultColumn(type),
      hidden: !!s.hidden,
      text: str(s.text),
      entries: kind === "entries" ? (Array.isArray(s.entries) ? s.entries : []).map((e) => newEntry({
        id: str(e.id) || uid("e_"), title: str(e.title), subtitle: str(e.subtitle), location: str(e.location),
        startDate: str(e.startDate), endDate: str(e.endDate), current: !!e.current, description: str(e.description),
      })) : [],
      items: kind === "items" ? (Array.isArray(s.items) ? s.items : []).map((i) => ({
        id: str(i.id) || uid("i_"), name: str(i.name), level: clamp(Math.round(Number(i.level) || 0), 0, 5),
      })) : [],
    };
  });

  const details: Detail[] = (Array.isArray(p.details) ? p.details : []).map((x) => ({
    id: str(x.id) || uid("d_"),
    icon: ICONS.includes(x.icon) ? x.icon : "user",
    value: str(x.value),
  }));

  const now = Date.now();
  return {
    id: str(r.id) || uid("cv_"),
    title: str(r.title) || "Imported CV",
    createdAt: Number(r.createdAt) || now,
    updatedAt: Number(r.updatedAt) || now,
    data: {
      personal: { fullName: str(p.fullName), jobTitle: str(p.jobTitle), photo: str(p.photo), details },
      sections,
    },
    design: d,
  };
}

function clamp(n: number, a: number, b: number) {
  return Math.min(b, Math.max(a, n));
}

/* ---------------- the earlier single file app ---------------- */

interface LegacyDoc {
  profile: { name?: string; role?: string; photo?: string; details?: { icon?: string; text?: string }[] };
  sections: {
    type: string; title?: string; col?: string; show?: boolean; body?: string;
    items?: (string | { title?: string; sub?: string; date?: string; pts?: string[]; name?: string; level?: number })[];
  }[];
  design?: { template?: string; showPhoto?: boolean; photoShape?: string };
}

/** turn the old rich text (with <b> and <br>) into this app's plain text with **bold** */
function fromHtml(h: unknown): string {
  return str(h)
    .replace(/<\s*(b|strong)\s*>/gi, "**").replace(/<\s*\/\s*(b|strong)\s*>/gi, "**")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/\*\*\s*\*\*/g, "")
    .trim();
}

const LEGACY_ICONS: Record<string, DetailIcon> = {
  mail: "email", phone: "phone", pin: "location", calendar: "calendar", flag: "flag", car: "car",
  web: "website", globe: "website", link: "website", linkedin: "linkedin", github: "github", user: "user",
};

const LEGACY_TEMPLATES: Record<string, Design["template"]> = {
  classic: "aurora", modern: "vertex", executive: "summit", professional: "atlas", minimalist: "linen",
  creative: "prism", timeline: "chronicle", compact: "ledger", elegant: "harbor", bold: "summit",
};

function guessType(title: string, type: string): SectionType {
  const t = title.toLowerCase();
  if (type === "skills") return "skills";
  if (type === "languages") return "languages";
  if (type === "text") return /profile|summary|about/.test(t) ? "summary" : "custom";
  if (/employ|experience|work|career/.test(t)) return "experience";
  if (/educat|qualif|school/.test(t)) return "education";
  if (/project/.test(t)) return "projects";
  if (/course|training/.test(t)) return "courses";
  if (/certif|licen/.test(t)) return "certificates";
  if (/award|achiev/.test(t)) return "awards";
  if (/volunt/.test(t)) return "volunteering";
  if (/interest|hobb/.test(t)) return "interests";
  if (/referen/.test(t)) return "references";
  return "custom";
}

export function fromLegacy(raw: unknown): Cv | null {
  const o = raw as LegacyDoc;
  if (!o || !o.profile || !Array.isArray(o.sections)) return null;
  const tpl = LEGACY_TEMPLATES[str(o.design?.template)] ?? "aurora";
  const design = designFor(tpl, {
    showPhoto: o.design?.showPhoto !== false,
    photoShape: o.design?.photoShape === "0px" ? "square" : o.design?.photoShape === "12px" ? "rounded" : "circle",
  });
  const sections: Section[] = o.sections.map((s) => {
    const title = fromHtml(s.title);
    const type = guessType(title, s.type);
    const sec = newSection(type, { title: title || SECTION_LABELS[type].title, hidden: s.show === false, column: s.col === "side" ? "side" : "main" });
    const items = Array.isArray(s.items) ? s.items : [];
    if (s.type === "text") {
      if (type === "summary") sec.text = fromHtml(s.body);
      else sec.entries = [newEntry({ description: fromHtml(s.body) })];
    } else if (s.type === "entries") {
      sec.entries = items.map((it) => {
        const e = typeof it === "string" ? { title: it } : it;
        return newEntry({
          title: fromHtml(e.title), subtitle: fromHtml(e.sub), startDate: fromHtml(e.date),
          description: (e.pts ?? []).map((pt) => "- " + fromHtml(pt)).filter((l) => l.length > 2).join("\n"),
        });
      });
    } else if (s.type === "bullets") {
      const lines = items.map((it) => "- " + fromHtml(typeof it === "string" ? it : it.name)).filter((l) => l.length > 2);
      if (kindOf(type) === "items") sec.items = lines.map((l) => newItem(l.slice(2)));
      else sec.entries = [newEntry({ description: lines.join("\n") })];
    } else {
      const list = items.map((it) => (typeof it === "string" ? { name: it, level: 0 } : it));
      if (kindOf(type) === "items") sec.items = list.map((it) => newItem(fromHtml(it.name), Number(it.level) || 0));
      else sec.entries = list.map((it) => newEntry({ title: fromHtml(it.name) }));
    }
    return sec;
  });
  const now = Date.now();
  const name = fromHtml(o.profile.name), role = fromHtml(o.profile.role);
  return {
    id: uid("cv_"),
    title: role || (name ? `${name} CV` : "Imported CV"),
    createdAt: now,
    updatedAt: now,
    data: {
      personal: {
        fullName: name,
        jobTitle: role,
        photo: str(o.profile.photo).startsWith("data:image/") ? str(o.profile.photo) : "",
        details: (o.profile.details ?? []).map((d) => ({
          id: uid("d_"), icon: LEGACY_ICONS[str(d.icon)] ?? "user", value: fromHtml(d.text),
        })),
      },
      sections,
    },
    design,
  };
}

/** read any supported file; null if it is not a CV */
export function parseCvFile(text: string): Cv | null {
  let raw: unknown;
  try { raw = JSON.parse(text); } catch { return null; }
  const o = raw as { kind?: string; cv?: unknown; profile?: unknown };
  if (o && o.kind === FILE_KIND) return normaliseCv(o.cv);
  if (o && o.profile) return fromLegacy(raw);
  return normaliseCv(raw);
}
