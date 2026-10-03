import type { Column, FontKey, SectionType, TemplateId } from "./types";

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
  layout: "single" | "left" | "right";
  /** sidebar width as a share of the page */
  sideWidth: number;
  /** where name, title, photo and contact details go */
  header: "banner" | "side" | "top";
  /** the sidebar is filled with the accent colour rather than a tint */
  darkSide: boolean;
  /** the header band is filled with the accent colour */
  darkHeader: boolean;
  /** standard: dates beside the title; gutter: dates in their own left column */
  entryStyle: "standard" | "gutter";
  tags: string[];
  defaults: { accent: string; fontBody: FontKey; fontHeading: FontKey };
}

export const TEMPLATES: TemplateDef[] = [
  {
    id: "aurora", name: "Aurora",
    blurb: "A coloured sidebar with your photo and details, and plenty of room for experience.",
    layout: "left", sideWidth: 0.34, header: "side", darkSide: true, darkHeader: false, entryStyle: "standard",
    tags: ["Photo", "Two columns"],
    defaults: { accent: "#1f4e79", fontBody: "lato", fontHeading: "lato" },
  },
  {
    id: "meridian", name: "Meridian",
    blurb: "Clean single column with a centred header. Reads well everywhere and passes applicant tracking systems.",
    layout: "single", sideWidth: 0, header: "top", darkSide: false, darkHeader: false, entryStyle: "standard",
    tags: ["ATS friendly", "One column"],
    defaults: { accent: "#0f766e", fontBody: "sourceSans", fontHeading: "sourceSans" },
  },
  {
    id: "summit", name: "Summit",
    blurb: "A bold colour banner across the top, with skills in a tinted column on the right.",
    layout: "right", sideWidth: 0.32, header: "banner", darkSide: false, darkHeader: true, entryStyle: "standard",
    tags: ["Photo", "Two columns"],
    defaults: { accent: "#2b4c7e", fontBody: "openSans", fontHeading: "montserrat" },
  },
  {
    id: "atlas", name: "Atlas",
    blurb: "Strong name, crisp section rules and a light sidebar. A confident modern look.",
    layout: "right", sideWidth: 0.31, header: "top", darkSide: false, darkHeader: false, entryStyle: "standard",
    tags: ["Two columns", "Modern"],
    defaults: { accent: "#c2410c", fontBody: "inter", fontHeading: "inter" },
  },
  {
    id: "harbor", name: "Harbor",
    blurb: "Serif type, small caps headings and a centred name. Suits senior, legal and academic roles.",
    layout: "single", sideWidth: 0, header: "top", darkSide: false, darkHeader: false, entryStyle: "standard",
    tags: ["ATS friendly", "Executive"],
    defaults: { accent: "#7c2d12", fontBody: "lora", fontHeading: "playfair" },
  },
  {
    id: "vertex", name: "Vertex",
    blurb: "A deep charcoal sidebar with bright accents and a timeline down your jobs.",
    layout: "left", sideWidth: 0.33, header: "side", darkSide: true, darkHeader: false, entryStyle: "standard",
    tags: ["Photo", "Creative"],
    defaults: { accent: "#0ea5a4", fontBody: "raleway", fontHeading: "montserrat" },
  },
  {
    id: "chronicle", name: "Chronicle",
    blurb: "Dates in their own column so a career reads at a glance. Calm and very readable.",
    layout: "single", sideWidth: 0, header: "top", darkSide: false, darkHeader: false, entryStyle: "gutter",
    tags: ["ATS friendly", "Timeline"],
    defaults: { accent: "#4338ca", fontBody: "inter", fontHeading: "inter" },
  },
  {
    id: "ledger", name: "Ledger",
    blurb: "Compact type and two balanced columns, for long careers that need to fit on fewer pages.",
    layout: "left", sideWidth: 0.4, header: "top", darkSide: false, darkHeader: false, entryStyle: "standard",
    tags: ["Compact", "Two columns"],
    defaults: { accent: "#334155", fontBody: "roboto", fontHeading: "roboto" },
  },
  {
    id: "linen", name: "Linen",
    blurb: "Quiet and minimal. Generous white space, fine lines, no colour blocks.",
    layout: "single", sideWidth: 0, header: "top", darkSide: false, darkHeader: false, entryStyle: "standard",
    tags: ["Minimal", "ATS friendly"],
    defaults: { accent: "#57534e", fontBody: "openSans", fontHeading: "ebGaramond" },
  },
  {
    id: "prism", name: "Prism",
    blurb: "An angled colour header and a tinted sidebar. Stands out without shouting.",
    layout: "left", sideWidth: 0.33, header: "banner", darkSide: false, darkHeader: true, entryStyle: "standard",
    tags: ["Photo", "Creative"],
    defaults: { accent: "#9d174d", fontBody: "montserrat", fontHeading: "montserrat" },
  },
];

export const TEMPLATE_MAP = Object.fromEntries(TEMPLATES.map((t) => [t.id, t])) as Record<TemplateId, TemplateDef>;

export function getTemplate(id: string): TemplateDef {
  return TEMPLATE_MAP[id as TemplateId] ?? TEMPLATES[0];
}

/** the column a section prefers when a template has a sidebar */
export function defaultColumn(type: SectionType): Column {
  return ["skills", "languages", "interests", "certificates", "references"].includes(type) ? "side" : "main";
}

export const ACCENTS = [
  "#1f4e79", "#2b4c7e", "#0f766e", "#15803d", "#4338ca", "#6d28d9",
  "#9d174d", "#b91c1c", "#c2410c", "#a16207", "#334155", "#111827",
];
