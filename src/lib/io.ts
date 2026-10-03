import { defaultFields, designFor, kindOf, newEntry, newItem, newSection, uid, SECTION_LABELS } from "./sample";
import { TEMPLATE_MAP, defaultColumn } from "./templates";
import { FONTS } from "./fonts";
import { fromMarkdown } from "./rich";
import type { Cv, CvData, Design, Detail, DetailIcon, Entry, Section, SectionType } from "./types";

/**
 * Reading CVs from files and from older saves. Accepts files saved by this
 * app (.json), CVs saved by its first version (plain text with **bold** and
 * "- " bullets), and .cvjson files from the single file CV Studio.
 */

export const FILE_KIND = "cv-studio/cv";

export function exportFile(cv: Cv): string {
  return JSON.stringify({ kind: FILE_KIND, version: 2, cv }, null, 2);
}

export function fileName(cv: Cv, ext: string): string {
  return (cv.title.replace(/[^\w\s-]/g, "").trim() || "CV") + ext;
}

const ICONS: DetailIcon[] = ["email", "phone", "location", "website", "linkedin", "github", "calendar", "flag", "car", "user", "briefcase", "star"];
const TYPES = Object.keys(SECTION_LABELS) as SectionType[];

const str = (v: unknown) => (typeof v === "string" ? v : v == null ? "" : String(v));
const clamp = (n: number, a: number, b: number) => Math.min(b, Math.max(a, n));

/** split first version text into a paragraph and bullets */
function splitOld(desc: string): { description: string; bullets: string[] } {
  const paras: string[] = [], bullets: string[] = [];
  desc.split("\n").map((l) => l.trim()).filter(Boolean).forEach((l) => {
    if (/^([-•*]|\d+\.)\s+/.test(l)) bullets.push(fromMarkdown(l.replace(/^([-•*]|\d+\.)\s+/, "")));
    else if (!/^[-•*]$/.test(l)) paras.push(fromMarkdown(l));
  });
  return { description: paras.join("<br>"), bullets };
}

/** make any parsed object safe for the editor and the templates */
export function normaliseCv(raw: unknown): Cv | null {
  const r = raw as Partial<Cv> & { data?: Partial<CvData> };
  if (!r || typeof r !== "object" || !r.data || !Array.isArray(r.data.sections)) return null;
  const old = (r.schema ?? 1) < 2;
  const p = (r.data.personal ?? {}) as Partial<CvData["personal"]>;
  const tpl = r.design?.template && TEMPLATE_MAP[r.design.template] ? r.design.template : "pulse";
  const base = designFor(tpl);
  const d = { ...base, ...(r.design ?? {}) } as Design;
  if (!FONTS.some((f) => f.key === d.fontBody)) d.fontBody = base.fontBody;
  if (!FONTS.some((f) => f.key === d.fontHeading)) d.fontHeading = base.fontHeading;
  d.fontScale = clamp(Number(d.fontScale) || 1, 0.8, 1.2);
  d.lineHeight = clamp(Number(d.lineHeight) || 1.45, 1.1, 1.9);
  d.letterSpacing = clamp(Number(d.letterSpacing) || 0, -0.03, 0.08);
  d.margin = clamp(Number(d.margin) || base.margin, 16, 72);
  if (d.layout !== "single" && d.layout !== "left" && d.layout !== "right") d.layout = null;
  if (typeof d.sideWidth !== "number") d.sideWidth = null;
  if (!["dots", "bars", "blocks", "rings", "tags", "text"].includes(d.skillStyle)) d.skillStyle = base.skillStyle;

  const sections: Section[] = r.data.sections.map((s0) => {
    const s = s0 as Partial<Section>;
    const type = TYPES.includes(s.type as SectionType) ? (s.type as SectionType) : "custom";
    const kind = kindOf(type);
    const fields = { ...defaultFields(type), ...(s.fields ?? {}) };
    const entries: Entry[] = kind === "entries" ? (Array.isArray(s.entries) ? s.entries : []).map((e) => {
      const desc = str(e.description);
      const split = old ? splitOld(desc) : { description: desc, bullets: Array.isArray(e.bullets) ? e.bullets.map(str) : [] };
      return newEntry({
        id: str(e.id) || uid("e_"), title: str(e.title), subtitle: str(e.subtitle), location: str(e.location),
        startDate: str(e.startDate), endDate: str(e.endDate), current: !!e.current, ...split,
      });
    }) : [];
    if (old) {
      /* the first version showed whatever was filled in */
      fields.description = entries.some((e) => e.description) || (fields.description && !entries.some((e) => e.bullets.length));
      fields.bullets = entries.some((e) => e.bullets.length) || fields.bullets;
    }
    let text = str(s.text);
    if (old && text) {
      const sp = splitOld(text);
      text = [sp.description, ...sp.bullets].filter(Boolean).join("<br>");
    }
    return {
      id: str(s.id) || uid("s_"),
      type,
      title: str(s.title) || SECTION_LABELS[type].title,
      column: s.column === "side" || s.column === "main" ? s.column : defaultColumn(type),
      hidden: !!s.hidden,
      text,
      entries,
      items: kind === "items" ? (Array.isArray(s.items) ? s.items : []).map((i) => ({
        id: str(i.id) || uid("i_"), name: str(i.name), level: clamp(Math.round(Number(i.level) || 0), 0, 5),
      })) : [],
      fields,
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
    schema: 2,
    data: {
      personal: { fullName: str(p.fullName), jobTitle: str(p.jobTitle), photo: str(p.photo), details },
      sections,
    },
    design: d,
  };
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

/** keep the old app's bold and line breaks, drop everything else */
function fromLegacyHtml(h: unknown): string {
  return str(h)
    .replace(/<\s*(b|strong)\s*>/gi, "\u0001").replace(/<\s*\/\s*(b|strong)\s*>/gi, "\u0002")
    .replace(/<br\s*\/?>/gi, "\u0003")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/\u0001/g, "<b>").replace(/\u0002/g, "</b>").replace(/\u0003/g, "<br>")
    .replace(/<b>\s*<\/b>/g, "")
    .trim();
}
const plain = (h: unknown) => fromLegacyHtml(h).replace(/<[^>]+>/g, "").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">");

const LEGACY_ICONS: Record<string, DetailIcon> = {
  mail: "email", phone: "phone", pin: "location", calendar: "calendar", flag: "flag", car: "car",
  web: "website", globe: "website", link: "website", linkedin: "linkedin", github: "github", user: "user",
};

const LEGACY_TEMPLATES: Record<string, Design["template"]> = {
  classic: "aurora", modern: "vertex", executive: "summit", professional: "atlas", minimalist: "linen",
  creative: "prism", timeline: "chronicle", compact: "ledger", elegant: "harbor", bold: "apex",
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
    const title = plain(s.title);
    const type = guessType(title, s.type);
    const sec = newSection(type, { title: title || SECTION_LABELS[type].title, hidden: s.show === false, column: s.col === "side" ? "side" : "main" });
    const items = Array.isArray(s.items) ? s.items : [];
    if (s.type === "text") {
      if (type === "summary") sec.text = fromLegacyHtml(s.body);
      else { sec.entries = [newEntry({ description: fromLegacyHtml(s.body) })]; sec.fields = { ...sec.fields, description: true }; }
    } else if (s.type === "entries") {
      sec.entries = items.map((it) => {
        const e = typeof it === "string" ? { title: it } : it;
        return newEntry({
          title: plain(e.title), subtitle: plain(e.sub), startDate: plain(e.date),
          bullets: (e.pts ?? []).map(fromLegacyHtml).filter(Boolean),
        });
      });
      sec.fields = { ...sec.fields, bullets: true, dates: true, subtitle: true };
    } else if (s.type === "bullets") {
      const lines = items.map((it) => fromLegacyHtml(typeof it === "string" ? it : it.name)).filter(Boolean);
      if (kindOf(type) === "items") sec.items = lines.map((l) => newItem(l.replace(/<[^>]+>/g, "")));
      else { sec.entries = [newEntry({ bullets: lines })]; sec.fields = { subtitle: false, location: false, dates: false, description: false, bullets: true }; }
    } else {
      const list = items.map((it) => (typeof it === "string" ? { name: it, level: 0 } : it));
      if (kindOf(type) === "items") sec.items = list.map((it) => newItem(plain(it.name), Number(it.level) || 0));
      else sec.entries = list.map((it) => newEntry({ title: plain(it.name) }));
    }
    return sec;
  });
  const now = Date.now();
  const name = plain(o.profile.name), role = plain(o.profile.role);
  return {
    id: uid("cv_"),
    title: role || (name ? `${name} CV` : "Imported CV"),
    createdAt: now,
    updatedAt: now,
    schema: 2,
    data: {
      personal: {
        fullName: name,
        jobTitle: role,
        photo: str(o.profile.photo).startsWith("data:image/") ? str(o.profile.photo) : "",
        details: (o.profile.details ?? []).map((d) => ({
          id: uid("d_"), icon: LEGACY_ICONS[str(d.icon)] ?? "user", value: plain(d.text),
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
