import { defaultColumn, getTemplate } from "./templates";
import type { Cv, CvData, Design, Entry, Item, Section, SectionType, TemplateId } from "./types";

export function uid(prefix = ""): string {
  const r = typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID().replace(/-/g, "").slice(0, 12)
    : Math.random().toString(36).slice(2, 14);
  return prefix + r;
}

export const SECTION_LABELS: Record<SectionType, { title: string; hint: string; kind: "text" | "entries" | "items" }> = {
  summary: { title: "Profile", hint: "A few lines on who you are and what you bring", kind: "text" },
  experience: { title: "Work Experience", hint: "Jobs, with what you achieved in each", kind: "entries" },
  education: { title: "Education", hint: "Degrees, diplomas and schools", kind: "entries" },
  skills: { title: "Skills", hint: "What you are good at, with a level if you like", kind: "items" },
  languages: { title: "Languages", hint: "Languages and how well you speak them", kind: "items" },
  projects: { title: "Projects", hint: "Things you have built, led or delivered", kind: "entries" },
  certificates: { title: "Certificates", hint: "Licences and certifications", kind: "entries" },
  courses: { title: "Courses", hint: "Training and short courses", kind: "entries" },
  awards: { title: "Awards", hint: "Prizes and recognition", kind: "entries" },
  volunteering: { title: "Volunteering", hint: "Unpaid roles and community work", kind: "entries" },
  interests: { title: "Interests", hint: "Hobbies that say something about you", kind: "items" },
  references: { title: "References", hint: "People who will vouch for you", kind: "entries" },
  custom: { title: "Custom Section", hint: "Anything else, with your own title", kind: "entries" },
};

export function kindOf(type: SectionType) {
  return SECTION_LABELS[type].kind;
}

export function newEntry(p: Partial<Entry> = {}): Entry {
  return { id: uid("e_"), title: "", subtitle: "", location: "", startDate: "", endDate: "", current: false, description: "", ...p };
}

export function newItem(name = "", level = 0): Item {
  return { id: uid("i_"), name, level };
}

export function newSection(type: SectionType, p: Partial<Section> = {}): Section {
  const kind = kindOf(type);
  return {
    id: uid("s_"),
    type,
    title: SECTION_LABELS[type].title,
    column: defaultColumn(type),
    hidden: false,
    text: "",
    entries: kind === "entries" ? [newEntry()] : [],
    items: kind === "items" ? [newItem("", type === "languages" ? 3 : 0)] : [],
    ...p,
  };
}

export function designFor(template: TemplateId, base?: Partial<Design>): Design {
  const t = getTemplate(template);
  return {
    template,
    accent: t.defaults.accent,
    fontBody: t.defaults.fontBody,
    fontHeading: t.defaults.fontHeading,
    fontScale: 1,
    lineHeight: 1.45,
    spacing: "normal",
    margin: template === "ledger" ? 30 : 38,
    pageSize: "A4",
    showPhoto: true,
    photoShape: "circle",
    skillStyle: "dots",
    showIcons: true,
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
        text: "Product marketer with **eight years** taking B2B software to market, from positioning and pricing to launch and sales enablement. I turn customer research into clear stories that sales teams can use, and I measure everything against pipeline and revenue.",
      }),
      newSection("experience", {
        entries: [
          newEntry({
            title: "Senior Product Marketing Manager", subtitle: "Brightline Software", location: "Manchester",
            startDate: "Mar 2021", current: true,
            description: [
              "- Led go to market for four product lines with combined annual revenue of **£14m**.",
              "- Rebuilt positioning and messaging after 60 customer interviews, lifting demo to close rate by 18%.",
              "- Launched a usage based pricing tier that brought in 900 new accounts in its first year.",
              "- Built the sales enablement programme: battlecards, demo scripts and a monthly win loss review.",
            ].join("\n"),
          }),
          newEntry({
            title: "Product Marketing Manager", subtitle: "Northwind Analytics", location: "Leeds",
            startDate: "Jun 2018", endDate: "Feb 2021",
            description: [
              "- Owned launches for the reporting suite, coordinating product, sales, support and design.",
              "- Wrote the case study programme, growing it from 3 to 28 published customer stories.",
              "- Ran pricing research with 400 customers that informed a 12% average price increase.",
            ].join("\n"),
          }),
          newEntry({
            title: "Marketing Executive", subtitle: "Fern & Co Digital", location: "Manchester",
            startDate: "Sep 2016", endDate: "May 2018",
            description: [
              "- Planned and ran email and paid social campaigns for twelve retail and software clients.",
              "- Cut cost per lead by 35% for the largest client by rebuilding audience targeting.",
            ].join("\n"),
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
      newSection("certificates", {
        entries: [
          newEntry({ title: "Product Marketing Core", subtitle: "Product Marketing Alliance", endDate: "2022" }),
          newEntry({ title: "Google Analytics Certification", subtitle: "Google", endDate: "2020" }),
        ],
      }),
      newSection("skills", {
        items: [
          newItem("Positioning and messaging", 5),
          newItem("Go to market strategy", 5),
          newItem("Pricing and packaging", 4),
          newItem("Customer research", 4),
          newItem("Sales enablement", 4),
          newItem("Analytics and SQL", 3),
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
      newSection("skills", { items: [newItem(), newItem(), newItem()] }),
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
    data: opts.start === "blank" ? blankData() : sampleData(),
    design: designFor(opts.template ?? "aurora"),
  };
}
