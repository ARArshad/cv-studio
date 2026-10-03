/**
 * The CV document. Everything the editor changes and every template reads
 * lives in this shape, which is why switching template never loses content.
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

/** one job, course, project, certificate and so on */
export interface Entry {
  id: string;
  title: string;
  subtitle: string;
  location: string;
  startDate: string;
  endDate: string;
  current: boolean;
  /** free text; lines starting with "- " or "• " render as bullets, **bold** is bold */
  description: string;
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
  | "interests" | "references" | "custom";

export type Column = "main" | "side";

export interface Section {
  id: string;
  type: SectionType;
  title: string;
  column: Column;
  hidden: boolean;
  text: string;
  entries: Entry[];
  items: Item[];
}

export interface CvData {
  personal: Personal;
  sections: Section[];
}

export type TemplateId =
  | "aurora" | "meridian" | "summit" | "atlas" | "harbor"
  | "vertex" | "chronicle" | "ledger" | "linen" | "prism";

export type FontKey =
  | "inter" | "lato" | "roboto" | "openSans" | "sourceSans" | "montserrat"
  | "raleway" | "merriweather" | "lora" | "playfair" | "ebGaramond";

export type SkillStyle = "dots" | "bars" | "tags" | "text";
export type PhotoShape = "circle" | "rounded" | "square";
export type PageSize = "A4" | "Letter";
export type Spacing = "compact" | "normal" | "relaxed";

export interface Design {
  template: TemplateId;
  accent: string;
  fontBody: FontKey;
  fontHeading: FontKey;
  /** multiplies every type size, 0.85 to 1.15 */
  fontScale: number;
  lineHeight: number;
  spacing: Spacing;
  /** page margin in px at 96 dpi */
  margin: number;
  pageSize: PageSize;
  showPhoto: boolean;
  photoShape: PhotoShape;
  skillStyle: SkillStyle;
  showIcons: boolean;
}

export interface Cv {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  data: CvData;
  design: Design;
}
