import {
  defaultFields,
  designFor,
  kindOf,
  newEntry,
  newItem,
  newSection,
  uid,
  SECTION_LABELS,
} from "./sample";
import { TEMPLATE_MAP, defaultColumn } from "./templates";
import { FONTS } from "./fonts";
import { fromMarkdown } from "./rich";
import type {
  Cv,
  CvData,
  Design,
  Detail,
  DetailIcon,
  Entry,
  Section,
  SectionType,
} from "./types";

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
  return (
    (cv.title
      .replace(/[^\p{L}\p{N}\s._-]/gu, "")
      .replace(/^[.\s]+|[.\s]+$/g, "")
      .slice(0, 80) || "CV") + ext
  );
}

const ICONS: DetailIcon[] = [
  "email",
  "phone",
  "location",
  "website",
  "linkedin",
  "github",
  "calendar",
  "flag",
  "car",
  "user",
  "briefcase",
  "star",
];
const TYPES = Object.keys(SECTION_LABELS) as SectionType[];

const str = (v: unknown) =>
  typeof v === "string" ? v : v == null ? "" : String(v);
const clamp = (n: number, a: number, b: number) => Math.min(b, Math.max(a, n));

/** split first version text into a paragraph and bullets */
function splitOld(desc: string): { description: string; bullets: string[] } {
  const paras: string[] = [],
    bullets: string[] = [];
  desc
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .forEach((l) => {
      if (/^([-•*]|\d+\.)\s+/.test(l))
        bullets.push(fromMarkdown(l.replace(/^([-•*]|\d+\.)\s+/, "")));
      else if (!/^[-•*]$/.test(l)) paras.push(fromMarkdown(l));
    });
  return { description: paras.join("<br>"), bullets };
}

/** make any parsed object safe for the editor and the templates */
export function normaliseCv(raw: unknown): Cv | null {
  const r = raw as Partial<Cv> & { data?: Partial<CvData> };
  if (!r || typeof r !== "object" || !r.data || !Array.isArray(r.data.sections))
    return null;
  const old = (r.schema ?? 1) < 2;
  const p = (r.data.personal ?? {}) as Partial<CvData["personal"]>;
  const tpl =
    r.design?.template && Object.hasOwn(TEMPLATE_MAP, r.design.template)
      ? r.design.template
      : "pulse";
  const base = designFor(tpl);
  const d = { ...base, ...(r.design ?? {}), template: tpl } as Design;
  if (!FONTS.some((f) => f.key === d.fontBody)) d.fontBody = base.fontBody;
  if (!FONTS.some((f) => f.key === d.fontHeading))
    d.fontHeading = base.fontHeading;
  d.fontScale = clamp(Number(d.fontScale) || 1, 0.8, 1.2);
  d.lineHeight = clamp(Number(d.lineHeight) || 1.45, 1.1, 1.9);
  d.letterSpacing = clamp(Number(d.letterSpacing) || 0, -0.03, 0.08);
  d.margin = clamp(Number(d.margin) || base.margin, 16, 72);
  if (d.layout !== "single" && d.layout !== "left" && d.layout !== "right")
    d.layout = null;
  if (typeof d.sideWidth !== "number") d.sideWidth = null;
  if (
    !["dots", "bars", "blocks", "rings", "tags", "text"].includes(d.skillStyle)
  )
    d.skillStyle = base.skillStyle;

  const enumValue = <T extends string>(
    value: T,
    values: readonly T[],
    fallback: T,
  ) => (values.includes(value) ? value : fallback);
  d.pageSize = enumValue(d.pageSize, ["A4", "Letter"], base.pageSize);
  d.spacing = enumValue(
    d.spacing,
    ["compact", "normal", "relaxed"],
    base.spacing,
  );
  d.photoShape = enumValue(
    d.photoShape,
    ["circle", "square", "rounded"],
    base.photoShape,
  );
  d.backdrop = enumValue(
    d.backdrop,
    ["none", "dots", "grid", "lines", "corner", "wave"],
    base.backdrop,
  );
  d.dateFormat = enumValue(
    d.dateFormat,
    ["mm/yyyy", "mon yyyy", "month yyyy", "yyyy"],
    base.dateFormat,
  );
  d.country = enumValue(
    d.country,
    ["uk", "us", "ca", "au", "ie", "de", "fr", "nl", "in", "pk", "ae", "other"],
    base.country,
  );
  d.level = enumValue(
    d.level,
    ["student", "entry", "mid", "senior", "executive"],
    base.level,
  );
  d.sideWidth =
    d.sideWidth !== null && Number.isFinite(d.sideWidth)
      ? clamp(d.sideWidth, 0.24, 0.46)
      : null;
  d.wordSpacing = Number.isFinite(Number(d.wordSpacing))
    ? clamp(Number(d.wordSpacing), -0.05, 0.25)
    : 0;
  d.summaryInHeader =
    typeof d.summaryInHeader === "boolean" ? d.summaryInHeader : null;
  for (const key of [
    "showPhoto",
    "showTitle",
    "showIcons",
    "headingIcons",
    "pageNumbers",
    "nameOnPages",
  ] as const)
    d[key] = typeof d[key] === "boolean" ? d[key] : base[key];
  for (const key of ["accent", "accent2"] as const) {
    if (
      typeof d[key] !== "string" ||
      !/^#(?:[\da-f]{3}|[\da-f]{6})$/i.test(d[key])
    )
      d[key] = base[key];
    else if (d[key].length === 4)
      d[key] =
        "#" +
        d[key]
          .slice(1)
          .split("")
          .map((char) => char + char)
          .join("");
  }
  const usedIds = new Set<string>();
  const safeId = (value: unknown, prefix: string) => {
    const candidate = str(value);
    const id =
      /^[a-z\d_-]{1,100}$/i.test(candidate) && !usedIds.has(candidate)
        ? candidate
        : uid(prefix);
    usedIds.add(id);
    return id;
  };
  const safePhoto = (value: unknown) => {
    const photo = str(value);
    return /^data:image\/(?:png|jpeg|webp|gif|avif|bmp);base64,[a-z\d+/=\s]+$/i.test(
      photo,
    ) || photo === `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/sample-photo.jpg`
      ? photo
      : "";
  };

  const sections: Section[] = r.data.sections
    .filter((s) => s && typeof s === "object")
    .map((s0) => {
      const s = s0 as Partial<Section>;
      const type = TYPES.includes(s.type as SectionType)
        ? (s.type as SectionType)
        : "custom";
      const kind = kindOf(type);
      const fields = defaultFields(type);
      for (const key of Object.keys(fields) as (keyof typeof fields)[])
        if (typeof s.fields?.[key] === "boolean") fields[key] = s.fields[key];
      const entries: Entry[] =
        kind === "entries"
          ? (Array.isArray(s.entries) ? s.entries : [])
              .filter((e) => e && typeof e === "object")
              .map((e) => {
                const desc = str(e.description);
                const split = old
                  ? splitOld(desc)
                  : {
                      description: desc,
                      bullets: Array.isArray(e.bullets)
                        ? e.bullets.map(str)
                        : [],
                    };
                return newEntry({
                  id: safeId(e.id, "e_"),
                  title: str(e.title),
                  subtitle: str(e.subtitle),
                  location: str(e.location),
                  startDate: str(e.startDate),
                  endDate: str(e.endDate),
                  current: !!e.current,
                  ...split,
                });
              })
          : [];
      if (old) {
        /* the first version showed whatever was filled in */
        fields.description =
          entries.some((e) => e.description) ||
          (fields.description && !entries.some((e) => e.bullets.length));
        fields.bullets =
          entries.some((e) => e.bullets.length) || fields.bullets;
      }
      let text = str(s.text);
      if (old && text) {
        const sp = splitOld(text);
        text = [sp.description, ...sp.bullets].filter(Boolean).join("<br>");
      }
      return {
        id: safeId(s.id, "s_"),
        type,
        title: str(s.title) || SECTION_LABELS[type].title,
        column:
          s.column === "side" || s.column === "main"
            ? s.column
            : defaultColumn(type),
        hidden: !!s.hidden,
        text,
        entries,
        items:
          kind === "items"
            ? (Array.isArray(s.items) ? s.items : [])
                .filter((i) => i && typeof i === "object")
                .map((i) => ({
                  id: safeId(i.id, "i_"),
                  name: str(i.name),
                  level: clamp(Math.round(Number(i.level) || 0), 0, 5),
                }))
            : [],
        fields,
      };
    });

  const details: Detail[] = (Array.isArray(p.details) ? p.details : [])
    .filter((x) => x && typeof x === "object")
    .map((x) => ({
      id: safeId(x.id, "d_"),
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
    kind: r.data.letter ? "letter" : "cv",
    tags: Array.isArray(r.tags)
      ? [
          ...new Set(
            r.tags
              .filter((tag) => typeof tag === "string")
              .map((tag) => tag.trim().slice(0, 30))
              .filter(Boolean),
          ),
        ].slice(0, 12)
      : [],
    data: {
      ...(typeof r.data.jobDescription === "string"
        ? { jobDescription: r.data.jobDescription.slice(0, 30000) }
        : {}),
      ...(r.data.letter && typeof r.data.letter === "object"
        ? {
            letter: {
              sourceCvId: str(r.data.letter.sourceCvId),
              recipient: str(r.data.letter.recipient),
              company: str(r.data.letter.company),
              address: str(r.data.letter.address),
              date: str(r.data.letter.date),
              subject: str(r.data.letter.subject),
              salutation: str(r.data.letter.salutation),
              paragraphs: (Array.isArray(r.data.letter.paragraphs)
                ? r.data.letter.paragraphs
                : []
              )
                .filter((p) => p && typeof p === "object")
                .map((p) => ({ id: safeId(p.id, "p_"), text: str(p.text) })),
              closing: str(r.data.letter.closing),
              signature: str(r.data.letter.signature),
            },
          }
        : {}),
      personal: {
        fullName: str(p.fullName),
        jobTitle: str(p.jobTitle),
        photo: safePhoto(p.photo),
        ...(p.photoSource ? { photoSource: safePhoto(p.photoSource) } : {}),
        details,
      },
      sections,
    },
    design: d,
  };
}

/* ---------------- the earlier single file app ---------------- */

interface LegacyDoc {
  profile: {
    name?: string;
    role?: string;
    photo?: string;
    details?: { icon?: string; text?: string }[];
  };
  sections: {
    type: string;
    title?: string;
    col?: string;
    show?: boolean;
    body?: string;
    items?: (
      | string
      | {
          title?: string;
          sub?: string;
          date?: string;
          pts?: string[];
          name?: string;
          level?: number;
        }
    )[];
  }[];
  design?: { template?: string; showPhoto?: boolean; photoShape?: string };
}

/** keep the old app's bold and line breaks, drop everything else */
function fromLegacyHtml(h: unknown): string {
  return str(h)
    .replace(/<\s*(b|strong)\s*>/gi, "\u0001")
    .replace(/<\s*\/\s*(b|strong)\s*>/gi, "\u0002")
    .replace(/<br\s*\/?>/gi, "\u0003")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\u0001/g, "<b>")
    .replace(/\u0002/g, "</b>")
    .replace(/\u0003/g, "<br>")
    .replace(/<b>\s*<\/b>/g, "")
    .trim();
}
const plain = (h: unknown) =>
  fromLegacyHtml(h)
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");

const LEGACY_ICONS: Record<string, DetailIcon> = {
  mail: "email",
  phone: "phone",
  pin: "location",
  calendar: "calendar",
  flag: "flag",
  car: "car",
  web: "website",
  globe: "website",
  link: "website",
  linkedin: "linkedin",
  github: "github",
  user: "user",
};

const LEGACY_TEMPLATES: Record<string, Design["template"]> = {
  classic: "aurora",
  modern: "vertex",
  executive: "summit",
  professional: "atlas",
  minimalist: "linen",
  creative: "prism",
  timeline: "chronicle",
  compact: "ledger",
  elegant: "harbor",
  bold: "apex",
};

function guessType(title: string, type: string): SectionType {
  const t = title.toLowerCase();
  if (type === "skills") return "skills";
  if (type === "languages") return "languages";
  if (type === "text")
    return /profile|summary|about/.test(t) ? "summary" : "custom";
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
    photoShape:
      o.design?.photoShape === "0px"
        ? "square"
        : o.design?.photoShape === "12px"
          ? "rounded"
          : "circle",
  });
  const sections: Section[] = o.sections.map((s) => {
    const title = plain(s.title);
    const type = guessType(title, s.type);
    const sec = newSection(type, {
      title: title || SECTION_LABELS[type].title,
      hidden: s.show === false,
      column: s.col === "side" ? "side" : "main",
    });
    const items = Array.isArray(s.items) ? s.items : [];
    if (s.type === "text") {
      if (type === "summary") sec.text = fromLegacyHtml(s.body);
      else {
        sec.entries = [newEntry({ description: fromLegacyHtml(s.body) })];
        sec.fields = { ...sec.fields, description: true };
      }
    } else if (s.type === "entries") {
      sec.entries = items.map((it) => {
        const e = typeof it === "string" ? { title: it } : it;
        return newEntry({
          title: plain(e.title),
          subtitle: plain(e.sub),
          startDate: plain(e.date),
          bullets: (e.pts ?? []).map(fromLegacyHtml).filter(Boolean),
        });
      });
      sec.fields = {
        ...sec.fields,
        bullets: true,
        dates: true,
        subtitle: true,
      };
    } else if (s.type === "bullets") {
      const lines = items
        .map((it) => fromLegacyHtml(typeof it === "string" ? it : it.name))
        .filter(Boolean);
      if (kindOf(type) === "items")
        sec.items = lines.map((l) => newItem(l.replace(/<[^>]+>/g, "")));
      else {
        sec.entries = [newEntry({ bullets: lines })];
        sec.fields = {
          subtitle: false,
          location: false,
          dates: false,
          description: false,
          bullets: true,
        };
      }
    } else {
      const list = items.map((it) =>
        typeof it === "string" ? { name: it, level: 0 } : it,
      );
      if (kindOf(type) === "items")
        sec.items = list.map((it) =>
          newItem(plain(it.name), Number(it.level) || 0),
        );
      else sec.entries = list.map((it) => newEntry({ title: plain(it.name) }));
    }
    return sec;
  });
  const now = Date.now();
  const name = plain(o.profile.name),
    role = plain(o.profile.role);
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
        photo: str(o.profile.photo).startsWith("data:image/")
          ? str(o.profile.photo)
          : "",
        details: (o.profile.details ?? []).map((d) => ({
          id: uid("d_"),
          icon: LEGACY_ICONS[str(d.icon)] ?? "user",
          value: plain(d.text),
        })),
      },
      sections,
    },
    design,
  };
}

/** read any supported file; null if it is not a CV */
export function parseCvFile(text: string): Cv | null {
  try {
    const raw = JSON.parse(text) as {
      kind?: string;
      cv?: unknown;
      profile?: unknown;
    };
    if (raw?.kind === FILE_KIND) return normaliseCv(raw.cv);
    if (raw?.profile) {
      const cv = fromLegacy(raw);
      return cv ? normaliseCv(cv) : null;
    }
    return normaliseCv(raw);
  } catch {
    return null;
  }
}
