import { PERSONAS } from "./personas";
import { defaultColumn, getTemplate, type Persona } from "./templates";
import type { Cv, CvData, Design, Entry, EntryFields, Item, Section, SectionType, TemplateId } from "./types";

export function uid(prefix = ""): string {
  const r = typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID().replace(/-/g, "").slice(0, 12)
    : Math.random().toString(36).slice(2, 14);
  return prefix + r;
}

type Kind = "text" | "entries" | "items";

export const SECTION_LABELS: Record<SectionType, { title: string; hint: string; kind: Kind }> = {
  summary: { title: "Summary", hint: "A few lines on who you are and what you bring", kind: "text" },
  experience: { title: "Experience", hint: "Jobs, with what you achieved in each", kind: "entries" },
  education: { title: "Education", hint: "Degrees, diplomas and schools", kind: "entries" },
  skills: { title: "Skills", hint: "What you are good at, with a level if you like", kind: "items" },
  languages: { title: "Languages", hint: "Languages and how well you speak them", kind: "items" },
  projects: { title: "Projects", hint: "Things you have built, led or delivered", kind: "entries" },
  certificates: { title: "Certifications", hint: "Licences and certifications", kind: "entries" },
  courses: { title: "Courses", hint: "Training and short courses", kind: "entries" },
  awards: { title: "Achievements", hint: "Awards, prizes and results you are proud of", kind: "entries" },
  volunteering: { title: "Volunteering", hint: "Unpaid roles and community work", kind: "entries" },
  strengths: { title: "Strengths", hint: "What sets you apart, in a few words each", kind: "entries" },
  publications: { title: "Publications", hint: "Articles, papers and talks", kind: "entries" },
  softSkills: { title: "Soft Skills", hint: "Personal qualities such as teamwork or composure", kind: "items" },
  organizations: { title: "Organisations", hint: "Boards, committees and memberships", kind: "entries" },
  conferences: { title: "Conferences", hint: "Talks given and events attended", kind: "entries" },
  teaching: { title: "Teaching Experience", hint: "Courses taught and students supported", kind: "entries" },
  freelance: { title: "Freelance Projects", hint: "Client work outside a regular job", kind: "entries" },
  testimonials: { title: "Testimonials", hint: "Short quotes from people you worked with", kind: "entries" },
  honors: { title: "Honours and Awards", hint: "Scholarships, prizes and distinctions", kind: "entries" },
  interests: { title: "Interests", hint: "Hobbies that say something about you", kind: "items" },
  references: { title: "References", hint: "People who will vouch for you", kind: "entries" },
  custom: { title: "Custom Section", hint: "Anything else, with your own title", kind: "entries" },
};

const FIELDS: Partial<Record<SectionType, EntryFields>> = {
  experience: { subtitle: true, location: true, dates: true, description: false, bullets: true },
  education: { subtitle: true, location: true, dates: true, description: true, bullets: false },
  projects: { subtitle: true, location: false, dates: true, description: true, bullets: true },
  certificates: { subtitle: true, location: false, dates: true, description: false, bullets: false },
  courses: { subtitle: true, location: false, dates: true, description: false, bullets: false },
  awards: { subtitle: false, location: false, dates: false, description: true, bullets: false },
  volunteering: { subtitle: true, location: true, dates: true, description: false, bullets: true },
  strengths: { subtitle: false, location: false, dates: false, description: true, bullets: false },
  publications: { subtitle: true, location: false, dates: true, description: false, bullets: false },
  references: { subtitle: true, location: false, dates: false, description: true, bullets: false },
  organizations: { subtitle: true, location: false, dates: true, description: false, bullets: false },
  conferences: { subtitle: true, location: true, dates: true, description: false, bullets: false },
  teaching: { subtitle: true, location: true, dates: true, description: false, bullets: true },
  freelance: { subtitle: true, location: false, dates: true, description: true, bullets: true },
  testimonials: { subtitle: true, location: false, dates: false, description: true, bullets: false },
  honors: { subtitle: true, location: false, dates: true, description: false, bullets: false },
  custom: { subtitle: true, location: false, dates: true, description: true, bullets: false },
};

export function defaultFields(type: SectionType): EntryFields {
  return { ...(FIELDS[type] ?? { subtitle: true, location: false, dates: true, description: true, bullets: false }) };
}

export function kindOf(type: SectionType): Kind {
  return SECTION_LABELS[type].kind;
}

export function newEntry(p: Partial<Entry> = {}): Entry {
  return { id: uid("e_"), title: "", subtitle: "", location: "", startDate: "", endDate: "", current: false, description: "", bullets: [], ...p };
}

export function newItem(name = "", level = 0): Item {
  return { id: uid("i_"), name, level };
}

/** a fresh section with one empty entry or item ready to type into */
export function newSection(type: SectionType, p: Partial<Section> = {}): Section {
  const kind = kindOf(type);
  const fields = defaultFields(type);
  return {
    id: uid("s_"),
    type,
    title: SECTION_LABELS[type].title,
    column: defaultColumn(type),
    hidden: false,
    text: "",
    entries: kind === "entries" ? [newEntry({ bullets: fields.bullets ? [""] : [] })] : [],
    items: kind === "items" ? [newItem("", type === "languages" ? 3 : type === "skills" ? 3 : 0)] : [],
    fields,
    ...p,
  };
}

export function designFor(template: TemplateId, base?: Partial<Design>): Design {
  const t = getTemplate(template);
  return {
    template,
    accent: t.defaults.accent,
    accent2: t.defaults.accent2,
    fontBody: t.defaults.fontBody,
    fontHeading: t.defaults.fontHeading,
    fontScale: 1,
    lineHeight: 1.45,
    letterSpacing: 0,
    spacing: "normal",
    margin: t.defaults.margin,
    pageSize: "A4",
    layout: null,
    sideWidth: null,
    showPhoto: true,
    photoShape: t.defaults.photoShape,
    showTitle: true,
    skillStyle: t.defaults.skillStyle,
    showIcons: true,
    headingIcons: t.defaults.headingIcons,
    backdrop: t.defaults.backdrop,
    dateFormat: "mon yyyy",
    wordSpacing: 0,
    summaryInHeader: null,
    pageNumbers: false,
    nameOnPages: false,
    country: "uk",
    level: "mid",
    ...base,
  };
}

/** a worked example for a kind of job; see personas.ts */
export function sampleData(persona: Persona = "marketing"): CvData {
  const p = PERSONAS[persona] ?? PERSONAS.marketing;
  return {
    personal: {
      fullName: p.name,
      jobTitle: p.title,
      photo: "/sample-photo.jpg",
      details: p.details.map(([icon, value]) => ({ id: uid("d_"), icon, value })),
    },
    sections: p.sections.map((x) => newSection(x.type, {
      ...(x.title ? { title: x.title } : {}),
      text: x.text ?? "",
      entries: (x.entries ?? []).map((e) => newEntry({
        title: e.title, subtitle: e.subtitle ?? "", location: e.location ?? "", startDate: e.start ?? "",
        endDate: e.end ?? "", current: !!e.current, description: e.description ?? "", bullets: e.bullets ?? [],
      })),
      items: (x.items ?? []).map(([n, l]) => newItem(n, l)),
    })).map((sec) => {
      /* show what the example fills in */
      if (sec.entries.some((e) => e.description)) sec.fields.description = true;
      if (sec.entries.some((e) => e.bullets.length)) sec.fields.bullets = true;
      return sec;
    }),
  };
}

/**
 * A blank CV: the same shape as an example, with every field empty so the
 * placeholders show where things go.
 */
export function blankData(): CvData {
  const entry = (type: SectionType) => newEntry({ bullets: defaultFields(type).bullets ? ["", ""] : [] });
  return {
    personal: {
      fullName: "",
      jobTitle: "",
      photo: "",
      details: (["email", "phone", "location", "linkedin"] as const).map((icon) => ({ id: uid("d_"), icon, value: "" })),
    },
    sections: [
      newSection("summary"),
      newSection("experience", { entries: [entry("experience"), entry("experience")] }),
      newSection("education", { entries: [entry("education")] }),
      newSection("skills", { items: [newItem("", 3), newItem("", 3), newItem("", 3), newItem("", 3)] }),
      newSection("languages", { items: [newItem("", 5), newItem("", 3)] }),
      newSection("certificates", { entries: [entry("certificates")] }),
    ],
  };
}

/** put sections in the order a template prefers, keeping any it does not mention at the end */
function ordered(data: CvData, order?: SectionType[]): CvData {
  if (!order) return data;
  const rank = (t: SectionType) => { const i = order.indexOf(t); return i < 0 ? 99 : i; };
  return { ...data, sections: [...data.sections].sort((a, b) => rank(a.type) - rank(b.type)) };
}

export function makeCv(opts: { title?: string; template?: TemplateId; start?: "example" | "blank"; persona?: Persona } = {}): Cv {
  const now = Date.now();
  const tpl = getTemplate(opts.template ?? "pulse");
  const data = opts.start === "blank" ? blankData() : sampleData(opts.persona ?? tpl.persona);
  return {
    id: uid("cv_"),
    title: opts.title?.trim() || (opts.start === "blank" ? "Untitled CV" : "My CV"),
    createdAt: now,
    updatedAt: now,
    schema: 2,
    data: ordered(data, tpl.order),
    design: designFor(tpl.id),
  };
}
