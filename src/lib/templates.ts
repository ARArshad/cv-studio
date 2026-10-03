import type { Backdrop, Column, FontKey, Layout, PhotoShape, SectionType, SkillStyle, TemplateId } from "./types";

/**
 * A template is a layout plus a look. The layout says where the columns are
 * and where your name goes; the look lives in src/app/cv.css under
 * `.tpl-<id>`. Every template reads the same document.
 */
export interface TemplateDef {
  id: TemplateId;
  name: string;
  blurb: string;
  /** single column, or a sidebar on one side */
  layout: Layout;
  /** sidebar width as a share of the page */
  sideWidth: number;
  /** where name, title, photo and contact details go */
  header: "banner" | "side" | "top";
  /** the sidebar is filled with the second colour */
  darkSide: boolean;
  /** the header band is filled with a colour */
  darkHeader: boolean;
  /** standard: dates beside the title; gutter: dates in their own column; timeline: a rail down the entries */
  entryStyle: "standard" | "gutter" | "timeline";
  tags: string[];
  /** shown with a premium badge in galleries; every template is free */
  premium: boolean;
  defaults: {
    accent: string;
    accent2: string;
    fontBody: FontKey;
    fontHeading: FontKey;
    skillStyle: SkillStyle;
    photoShape: PhotoShape;
    headingIcons: boolean;
    backdrop: Backdrop;
    margin: number;
  };
}

const T = (t: Omit<TemplateDef, "defaults"> & { defaults: Partial<TemplateDef["defaults"]> & Pick<TemplateDef["defaults"], "accent" | "fontBody" | "fontHeading"> }): TemplateDef => ({
  ...t,
  defaults: {
    accent2: "#1e293b", skillStyle: "dots", photoShape: "circle", headingIcons: false, backdrop: "none", margin: 38,
    ...t.defaults,
  },
});

export const TEMPLATES: TemplateDef[] = [
  /* ---------------- the premium set ---------------- */
  T({
    id: "pulse", name: "Pulse", premium: true,
    blurb: "A deep colour header with a curved edge, icons on every heading and skills as tags. Confident and modern.",
    layout: "right", sideWidth: 0.36, header: "banner", darkSide: false, darkHeader: true, entryStyle: "standard",
    tags: ["Two columns", "Icons", "Modern"],
    defaults: { accent: "#0f766e", accent2: "#1f2937", fontBody: "nunito", fontHeading: "poppins", headingIcons: true, skillStyle: "tags" },
  }),
  T({
    id: "cascade", name: "Cascade", premium: true,
    blurb: "A flowing wave across the top with your photo set into it. Friendly, polished and memorable.",
    layout: "left", sideWidth: 0.34, header: "banner", darkSide: false, darkHeader: true, entryStyle: "standard",
    tags: ["Photo", "Two columns", "Creative"],
    defaults: { accent: "#2563eb", accent2: "#1e3a8a", fontBody: "dmSans", fontHeading: "poppins", skillStyle: "bars" },
  }),
  T({
    id: "monarch", name: "Monarch", premium: true,
    blurb: "A monogram crest, fine double rules and refined serif type. For senior and client facing roles.",
    layout: "single", sideWidth: 0, header: "top", darkSide: false, darkHeader: false, entryStyle: "standard",
    tags: ["Executive", "One column", "ATS friendly"],
    defaults: { accent: "#8a6d3b", accent2: "#1c1917", fontBody: "crimson", fontHeading: "libreBaskerville", skillStyle: "text", margin: 52 },
  }),
  T({
    id: "horizon", name: "Horizon", premium: true,
    blurb: "A full height colour panel for your photo and details beside a clean, spacious main column.",
    layout: "left", sideWidth: 0.35, header: "side", darkSide: true, darkHeader: false, entryStyle: "timeline",
    tags: ["Photo", "Two columns", "Timeline"],
    defaults: { accent: "#e76f51", accent2: "#264653", fontBody: "workSans", fontHeading: "montserrat", skillStyle: "rings", photoShape: "rounded" },
  }),
  T({
    id: "mosaic", name: "Mosaic", premium: true,
    blurb: "Each section sits on its own soft card, with a bold name block. Fresh and very easy to scan.",
    layout: "right", sideWidth: 0.37, header: "top", darkSide: false, darkHeader: false, entryStyle: "standard",
    tags: ["Two columns", "Creative", "Icons"],
    defaults: { accent: "#7c3aed", accent2: "#f5f3ff", fontBody: "manrope", fontHeading: "manrope", headingIcons: true, skillStyle: "blocks", backdrop: "dots" },
  }),
  T({
    id: "nordic", name: "Nordic", premium: true,
    blurb: "Calm Scandinavian minimalism: a light stone sidebar, airy type and a large initial watermark.",
    layout: "left", sideWidth: 0.32, header: "side", darkSide: false, darkHeader: false, entryStyle: "standard",
    tags: ["Minimal", "Two columns", "Photo"],
    defaults: { accent: "#475569", accent2: "#f1f0ec", fontBody: "inter", fontHeading: "inter", skillStyle: "bars", photoShape: "square" },
  }),
  T({
    id: "apex", name: "Apex", premium: true,
    blurb: "A strong black header with a bright accent stripe. Clear hierarchy that recruiters read in seconds.",
    layout: "right", sideWidth: 0.33, header: "banner", darkSide: false, darkHeader: true, entryStyle: "standard",
    tags: ["Two columns", "Bold", "ATS friendly"],
    defaults: { accent: "#f59e0b", accent2: "#111827", fontBody: "roboto", fontHeading: "montserrat", skillStyle: "blocks" },
  }),
  T({
    id: "bloom", name: "Bloom", premium: true,
    blurb: "Soft overlapping circles in the corner and a gentle tinted sidebar. Warm without losing professionalism.",
    layout: "left", sideWidth: 0.34, header: "top", darkSide: false, darkHeader: false, entryStyle: "standard",
    tags: ["Photo", "Creative", "Two columns"],
    defaults: { accent: "#db2777", accent2: "#fdf2f8", fontBody: "nunito", fontHeading: "poppins", skillStyle: "dots", backdrop: "corner" },
  }),
  T({
    id: "sterling", name: "Sterling", premium: true,
    blurb: "Navy and silver executive design with icon headings and a timeline. Built for leadership CVs.",
    layout: "right", sideWidth: 0.32, header: "banner", darkSide: false, darkHeader: true, entryStyle: "timeline",
    tags: ["Executive", "Two columns", "Icons"],
    defaults: { accent: "#1e3a5f", accent2: "#c0c7d1", fontBody: "sourceSans", fontHeading: "merriweather", headingIcons: true, skillStyle: "bars" },
  }),
  T({
    id: "orbit", name: "Orbit", premium: true,
    blurb: "Skill rings, round photo badge and a split header. A tech forward look for product and engineering roles.",
    layout: "left", sideWidth: 0.33, header: "side", darkSide: true, darkHeader: false, entryStyle: "standard",
    tags: ["Photo", "Tech", "Two columns"],
    defaults: { accent: "#22d3ee", accent2: "#0b1220", fontBody: "dmSans", fontHeading: "dmSans", skillStyle: "rings", headingIcons: true },
  }),

  /* ---------------- the classic set ---------------- */
  T({
    id: "aurora", name: "Aurora", premium: false,
    blurb: "A coloured sidebar with your photo and details, and plenty of room for experience.",
    layout: "left", sideWidth: 0.34, header: "side", darkSide: true, darkHeader: false, entryStyle: "standard",
    tags: ["Photo", "Two columns"],
    defaults: { accent: "#1f4e79", accent2: "#1f4e79", fontBody: "lato", fontHeading: "lato" },
  }),
  T({
    id: "meridian", name: "Meridian", premium: false,
    blurb: "Clean single column with a centred header. Reads well everywhere and passes applicant tracking systems.",
    layout: "single", sideWidth: 0.34, header: "top", darkSide: false, darkHeader: false, entryStyle: "standard",
    tags: ["ATS friendly", "One column"],
    defaults: { accent: "#0f766e", fontBody: "sourceSans", fontHeading: "sourceSans" },
  }),
  T({
    id: "summit", name: "Summit", premium: false,
    blurb: "A bold colour banner across the top, with skills in a tinted column on the right.",
    layout: "right", sideWidth: 0.32, header: "banner", darkSide: false, darkHeader: true, entryStyle: "standard",
    tags: ["Photo", "Two columns"],
    defaults: { accent: "#2b4c7e", accent2: "#2b4c7e", fontBody: "openSans", fontHeading: "montserrat" },
  }),
  T({
    id: "atlas", name: "Atlas", premium: false,
    blurb: "Strong name, crisp section rules and a light sidebar. A confident modern look.",
    layout: "right", sideWidth: 0.31, header: "top", darkSide: false, darkHeader: false, entryStyle: "standard",
    tags: ["Two columns", "Modern"],
    defaults: { accent: "#c2410c", fontBody: "inter", fontHeading: "inter" },
  }),
  T({
    id: "harbor", name: "Harbor", premium: false,
    blurb: "Serif type, small caps headings and a centred name. Suits senior, legal and academic roles.",
    layout: "single", sideWidth: 0.34, header: "top", darkSide: false, darkHeader: false, entryStyle: "standard",
    tags: ["ATS friendly", "Executive"],
    defaults: { accent: "#7c2d12", fontBody: "lora", fontHeading: "playfair", skillStyle: "text" },
  }),
  T({
    id: "vertex", name: "Vertex", premium: false,
    blurb: "A deep charcoal sidebar with bright accents and a timeline down your jobs.",
    layout: "left", sideWidth: 0.33, header: "side", darkSide: true, darkHeader: false, entryStyle: "timeline",
    tags: ["Photo", "Creative"],
    defaults: { accent: "#0ea5a4", accent2: "#1e2530", fontBody: "raleway", fontHeading: "montserrat" },
  }),
  T({
    id: "chronicle", name: "Chronicle", premium: false,
    blurb: "Dates in their own column so a career reads at a glance. Calm and very readable.",
    layout: "single", sideWidth: 0.34, header: "top", darkSide: false, darkHeader: false, entryStyle: "gutter",
    tags: ["ATS friendly", "Timeline"],
    defaults: { accent: "#4338ca", fontBody: "inter", fontHeading: "inter" },
  }),
  T({
    id: "ledger", name: "Ledger", premium: false,
    blurb: "Compact type and two balanced columns, for long careers that need to fit on fewer pages.",
    layout: "left", sideWidth: 0.38, header: "top", darkSide: false, darkHeader: false, entryStyle: "standard",
    tags: ["Compact", "Two columns"],
    defaults: { accent: "#334155", fontBody: "roboto", fontHeading: "roboto", margin: 30 },
  }),
  T({
    id: "linen", name: "Linen", premium: false,
    blurb: "Quiet and minimal. Generous white space, fine lines, headings in the margin.",
    layout: "single", sideWidth: 0.34, header: "top", darkSide: false, darkHeader: false, entryStyle: "standard",
    tags: ["Minimal", "ATS friendly"],
    defaults: { accent: "#57534e", fontBody: "openSans", fontHeading: "ebGaramond" },
  }),
  T({
    id: "prism", name: "Prism", premium: false,
    blurb: "An angled colour header and a tinted sidebar. Stands out without shouting.",
    layout: "left", sideWidth: 0.33, header: "banner", darkSide: false, darkHeader: true, entryStyle: "standard",
    tags: ["Photo", "Creative"],
    defaults: { accent: "#9d174d", accent2: "#9d174d", fontBody: "montserrat", fontHeading: "montserrat" },
  }),
];

export const TEMPLATE_MAP = Object.fromEntries(TEMPLATES.map((t) => [t.id, t])) as Record<TemplateId, TemplateDef>;

export function getTemplate(id: string): TemplateDef {
  return TEMPLATE_MAP[id as TemplateId] ?? TEMPLATES[0];
}

/** the column a section prefers when a template has a sidebar */
export function defaultColumn(type: SectionType): Column {
  return ["skills", "languages", "interests", "certificates", "references", "strengths"].includes(type) ? "side" : "main";
}

/** colour themes: main colour and second colour */
export const THEMES: { name: string; accent: string; accent2: string }[] = [
  { name: "Ocean", accent: "#2563eb", accent2: "#1e3a8a" },
  { name: "Navy", accent: "#1f4e79", accent2: "#0f2942" },
  { name: "Teal", accent: "#0f766e", accent2: "#1f2937" },
  { name: "Emerald", accent: "#059669", accent2: "#064e3b" },
  { name: "Forest", accent: "#3f6212", accent2: "#1a2e05" },
  { name: "Indigo", accent: "#4338ca", accent2: "#1e1b4b" },
  { name: "Violet", accent: "#7c3aed", accent2: "#2e1065" },
  { name: "Berry", accent: "#be185d", accent2: "#500724" },
  { name: "Crimson", accent: "#b91c1c", accent2: "#3f0d0d" },
  { name: "Coral", accent: "#e76f51", accent2: "#264653" },
  { name: "Amber", accent: "#d97706", accent2: "#111827" },
  { name: "Gold", accent: "#8a6d3b", accent2: "#1c1917" },
  { name: "Cyan", accent: "#0891b2", accent2: "#0b1220" },
  { name: "Slate", accent: "#334155", accent2: "#0f172a" },
  { name: "Graphite", accent: "#404040", accent2: "#171717" },
  { name: "Mono", accent: "#111827", accent2: "#111827" },
];
