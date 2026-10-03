/**
 * The CV document. Everything the editor changes and every template reads
 * lives in this shape, which is why switching template never loses content.
 *
 * Text that allows formatting (summaries, descriptions, bullets) is a small
 * subset of HTML: <b>, <i>, <u> and <br>. Everything else is plain text.
 */

export type DetailIcon =
  | "email" | "phone" | "location" | "website" | "linkedin" | "github"
  | "calendar" | "flag" | "car" | "user" | "briefcase" | "star";

export interface Detail {
  id: string;
  icon: DetailIcon;
  value: string;
}

export interface Personal {
  fullName: string;
  jobTitle: string;
  /** a data URL or a path under /public; empty means no photo */
  photo: string;
  details: Detail[];
}

/** which optional parts of an entry are shown */
export interface EntryFields {
  subtitle: boolean;
  location: boolean;
  dates: boolean;
  description: boolean;
  bullets: boolean;
}

/** one job, course, project, certificate and so on */
export interface Entry {
  id: string;
  title: string;
  subtitle: string;
  location: string;
  startDate: string;
  endDate: string;
  current: boolean;
  /** a short paragraph, rich text */
  description: string;
  /** bullet points, rich text */
  bullets: string[];
}

/** one skill, language or interest; level 0 means no level shown */
export interface Item {
  id: string;
  name: string;
  level: number;
}

export type SectionKind = "text" | "entries" | "items";

export type SectionType =
  | "summary" | "experience" | "education" | "skills" | "languages"
  | "projects" | "certificates" | "courses" | "awards" | "volunteering"
  | "interests" | "references" | "strengths" | "publications" | "custom";

export type Column = "main" | "side";

export interface Section {
  id: string;
  type: SectionType;
  title: string;
  column: Column;
  hidden: boolean;
  /** rich text, for summary sections */
  text: string;
  entries: Entry[];
  items: Item[];
  /** optional parts of entries in this section */
  fields: EntryFields;
}

export interface CvData {
  personal: Personal;
  sections: Section[];
}

export type TemplateId =
  | "aurora" | "meridian" | "summit" | "atlas" | "harbor"
  | "vertex" | "chronicle" | "ledger" | "linen" | "prism"
  | "cascade" | "monarch" | "horizon" | "pulse" | "mosaic"
  | "nordic" | "apex" | "bloom" | "sterling" | "orbit";

export type FontKey =
  | "inter" | "lato" | "roboto" | "openSans" | "sourceSans" | "montserrat"
  | "raleway" | "poppins" | "nunito" | "workSans" | "dmSans" | "manrope"
  | "merriweather" | "lora" | "playfair" | "ebGaramond" | "crimson" | "libreBaskerville";

export type SkillStyle = "dots" | "bars" | "blocks" | "rings" | "tags" | "text";
export type PhotoShape = "circle" | "rounded" | "square";
export type PageSize = "A4" | "Letter";
export type Spacing = "compact" | "normal" | "relaxed";
export type Layout = "single" | "left" | "right";
export type Backdrop = "none" | "dots" | "grid" | "lines" | "corner" | "wave";

export interface Design {
  template: TemplateId;
  /** main colour */
  accent: string;
  /** second colour: sidebars and bands on templates that use one */
  accent2: string;
  fontBody: FontKey;
  fontHeading: FontKey;
  /** multiplies every type size, 0.85 to 1.15 */
  fontScale: number;
  lineHeight: number;
  /** extra letter spacing in em, -0.02 to 0.06 */
  letterSpacing: number;
  spacing: Spacing;
  /** page margin in px at 96 dpi */
  margin: number;
  pageSize: PageSize;
  /** columns; null keeps the template's own */
  layout: Layout | null;
  /** sidebar width as a share of the page; null keeps the template's own */
  sideWidth: number | null;
  showPhoto: boolean;
  photoShape: PhotoShape;
  showTitle: boolean;
  skillStyle: SkillStyle;
  showIcons: boolean;
  /** small icons beside section headings */
  headingIcons: boolean;
  backdrop: Backdrop;
}

export interface Cv {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  /** document format; 2 has bullets as a list and rich text as HTML */
  schema?: number;
  data: CvData;
  design: Design;
}
