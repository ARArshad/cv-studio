import { defaultColumn, getTemplate } from "./templates";
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
    ...base,
  };
}

/**
 * The example CV. Nobody real: the email is on the reserved example.com
 * domain and the phone number sits in the 07700 900000 block Ofcom keeps
 * aside for drama, so neither can reach a person.
 */
export function sampleData(): CvData {
  return {
    personal: {
      fullName: "Alex Morgan",
      jobTitle: "Senior Product Marketing Manager",
      photo: "/sample-photo.jpg",
      details: [
        { id: uid("d_"), icon: "email", value: "alex.morgan@example.com" },
        { id: uid("d_"), icon: "phone", value: "+44 7700 900461" },
        { id: uid("d_"), icon: "location", value: "Manchester, United Kingdom" },
        { id: uid("d_"), icon: "linkedin", value: "linkedin.com/in/alexmorgan" },
        { id: uid("d_"), icon: "website", value: "alexmorgan.example.com" },
      ],
    },
    sections: [
      newSection("summary", {
        text: "Product marketer with <b>eight years</b> taking B2B software to market, from positioning and pricing to launch and sales enablement. I turn customer research into clear stories that sales teams can use, and I measure everything against pipeline and revenue.",
      }),
      newSection("experience", {
        entries: [
          newEntry({
            title: "Senior Product Marketing Manager", subtitle: "Brightline Software", location: "Manchester",
            startDate: "03/2021", current: true,
            bullets: [
              "Led go to market for four product lines with combined annual revenue of <b>£14m</b>.",
              "Rebuilt positioning after 60 customer interviews, lifting demo to close rate by <b>18%</b>.",
              "Launched a usage based pricing tier that brought in 900 new accounts in its first year.",
              "Built the sales enablement programme: battlecards, demo scripts and a monthly win loss review.",
            ],
          }),
          newEntry({
            title: "Product Marketing Manager", subtitle: "Northwind Analytics", location: "Leeds",
            startDate: "06/2018", endDate: "02/2021",
            bullets: [
              "Owned launches for the reporting suite, coordinating product, sales, support and design.",
              "Grew the case study programme from 3 to 28 published customer stories.",
              "Ran pricing research with 400 customers that informed a 12% average price increase.",
            ],
          }),
          newEntry({
            title: "Marketing Executive", subtitle: "Fern & Co Digital", location: "Manchester",
            startDate: "09/2016", endDate: "05/2018",
            bullets: [
              "Planned and ran email and paid social campaigns for twelve retail and software clients.",
              "Cut cost per lead by 35% for the largest client by rebuilding audience targeting.",
            ],
          }),
        ],
      }),
      newSection("education", {
        entries: [
          newEntry({
            title: "BA (Hons) Marketing and Business", subtitle: "University of Leeds", location: "Leeds",
            startDate: "2013", endDate: "2016",
            description: "First class honours. Dissertation on pricing psychology in subscription software.",
          }),
        ],
      }),
      newSection("awards", {
        entries: [
          newEntry({ title: "Launch of the Year 2023", description: "Company award for the usage based pricing launch." }),
          newEntry({ title: "Top 10 Women in SaaS Marketing", description: "Named by an industry newsletter for the north of England." }),
        ],
      }),
      newSection("skills", {
        items: [
          newItem("Positioning", 5), newItem("Go to market", 5), newItem("Pricing", 4),
          newItem("Customer research", 4), newItem("Sales enablement", 4), newItem("SQL and analytics", 3),
        ],
      }),
      newSection("certificates", {
        entries: [
          newEntry({ title: "Product Marketing Core", subtitle: "Product Marketing Alliance", endDate: "2022" }),
          newEntry({ title: "Google Analytics Certification", subtitle: "Google", endDate: "2020" }),
        ],
      }),
      newSection("languages", {
        items: [newItem("English", 5), newItem("Spanish", 4), newItem("German", 2)],
      }),
      newSection("interests", {
        items: [newItem("Fell running"), newItem("Mentoring"), newItem("Film photography")],
      }),
    ],
  };
}

export function blankData(): CvData {
  return {
    personal: {
      fullName: "",
      jobTitle: "",
      photo: "",
      details: [
        { id: uid("d_"), icon: "email", value: "" },
        { id: uid("d_"), icon: "phone", value: "" },
        { id: uid("d_"), icon: "location", value: "" },
      ],
    },
    sections: [
      newSection("summary"),
      newSection("experience"),
      newSection("education"),
      newSection("skills", { items: [newItem("", 3), newItem("", 3), newItem("", 3)] }),
      newSection("languages"),
    ],
  };
}

export function makeCv(opts: { title?: string; template?: TemplateId; start?: "example" | "blank" } = {}): Cv {
  const now = Date.now();
  return {
    id: uid("cv_"),
    title: opts.title?.trim() || (opts.start === "blank" ? "Untitled CV" : "My CV"),
    createdAt: now,
    updatedAt: now,
    schema: 2,
    data: opts.start === "blank" ? blankData() : sampleData(),
    design: designFor(opts.template ?? "pulse"),
  };
}
