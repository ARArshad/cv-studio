import type { Persona } from "./templates";
import type { DetailIcon, SectionType } from "./types";

/**
 * Worked examples, one per kind of job, so a new CV starts from something
 * close to the person's own field. Everyone here is invented: emails are on
 * the reserved example.com domain and phone numbers sit in the 07700 900000
 * block Ofcom keeps aside for drama.
 */

type E = { title: string; subtitle?: string; location?: string; start?: string; end?: string; current?: boolean; description?: string; bullets?: string[] };
type S = { type: SectionType; title?: string; text?: string; entries?: E[]; items?: [string, number][] };
export interface PersonaDef {
  label: string;
  name: string;
  title: string;
  details: [DetailIcon, string][];
  sections: S[];
}

export const PERSONAS: Record<Persona, PersonaDef> = {
  marketing: {
    label: "Marketing",
    name: "Alex Morgan",
    title: "Senior Product Marketing Manager",
    details: [["email", "alex.morgan@example.com"], ["phone", "+44 7700 900461"], ["location", "Manchester, United Kingdom"], ["linkedin", "linkedin.com/in/alexmorgan"], ["website", "alexmorgan.example.com"]],
    sections: [
      { type: "summary", text: "Product marketer with <b>eight years</b> taking B2B software to market, from positioning and pricing to launch and sales enablement. I turn customer research into clear stories that sales teams can use, and I measure everything against pipeline and revenue." },
      { type: "experience", entries: [
        { title: "Senior Product Marketing Manager", subtitle: "Brightline Software", location: "Manchester", start: "2021-03", current: true, bullets: [
          "Led go to market for four product lines with combined annual revenue of <b>£14m</b>.",
          "Rebuilt positioning after 60 customer interviews, lifting demo to close rate by <b>18%</b>.",
          "Launched a usage based pricing tier that brought in 900 new accounts in its first year.",
          "Built the sales enablement programme: battlecards, demo scripts and a monthly win loss review."] },
        { title: "Product Marketing Manager", subtitle: "Northwind Analytics", location: "Leeds", start: "2018-06", end: "2021-02", bullets: [
          "Owned launches for the reporting suite, coordinating product, sales, support and design.",
          "Grew the case study programme from 3 to 28 published customer stories.",
          "Ran pricing research with 400 customers that informed a 12% average price increase."] },
        { title: "Marketing Executive", subtitle: "Fern & Co Digital", location: "Manchester", start: "2016-09", end: "2018-05", bullets: [
          "Planned and ran email and paid social campaigns for twelve retail and software clients.",
          "Cut cost per lead by 35% for the largest client by rebuilding audience targeting."] },
      ] },
      { type: "education", entries: [{ title: "BA (Hons) Marketing and Business", subtitle: "University of Leeds", location: "Leeds", start: "2013", end: "2016", description: "First class honours. Dissertation on pricing psychology in subscription software." }] },
      { type: "awards", entries: [
        { title: "Launch of the Year 2023", description: "Company award for the usage based pricing launch." },
        { title: "30 Under 30 in SaaS Marketing", description: "Named by an industry newsletter for the north of England." }] },
      { type: "skills", items: [["Positioning", 5], ["Go to market", 5], ["Pricing", 4], ["Customer research", 4], ["Sales enablement", 4], ["SQL and analytics", 3]] },
      { type: "certificates", entries: [{ title: "Product Marketing Core", subtitle: "Product Marketing Alliance", end: "2022" }, { title: "Google Analytics Certification", subtitle: "Google", end: "2020" }] },
      { type: "languages", items: [["English", 5], ["Spanish", 4], ["German", 2]] },
      { type: "interests", items: [["Fell running", 0], ["Mentoring", 0], ["Film photography", 0]] },
    ],
  },

  engineer: {
    label: "Software and IT",
    name: "Priya Shah",
    title: "Senior Software Engineer",
    details: [["email", "priya.shah@example.com"], ["phone", "+44 7700 900218"], ["location", "London, United Kingdom"], ["github", "github.com/priyashah"], ["linkedin", "linkedin.com/in/priyashah"]],
    sections: [
      { type: "summary", text: "Backend engineer with <b>seven years</b> building payment and data platforms in TypeScript and Go. I like owning a service end to end, from design reviews to on call, and I care about systems that stay boring under load." },
      { type: "experience", entries: [
        { title: "Senior Software Engineer", subtitle: "Ledgerline Payments", location: "London", start: "2021-01", current: true, bullets: [
          "Led the rebuild of the card authorisation service, cutting p99 latency from 420ms to <b>95ms</b>.",
          "Designed an idempotent event pipeline processing 40 million transactions a day.",
          "Mentored five engineers and introduced design reviews adopted across three teams.",
          "Reduced cloud spend by 28% by right sizing clusters and moving batch jobs to spot capacity."] },
        { title: "Software Engineer", subtitle: "Orbital Data", location: "Bristol", start: "2018-04", end: "2020-12", bullets: [
          "Built REST and GraphQL APIs in Node.js used by 200 enterprise customers.",
          "Introduced contract tests that cut integration bugs reaching production by half.",
          "Migrated a monolith reporting job to a streaming service on Kafka."] },
        { title: "Junior Developer", subtitle: "Kite Studio", location: "Bristol", start: "2016-09", end: "2018-03", bullets: [
          "Shipped features for client web apps in React and Django.",
          "Automated deployments with CI pipelines, ending manual releases."] },
      ] },
      { type: "education", entries: [{ title: "BSc Computer Science", subtitle: "University of Bristol", location: "Bristol", start: "2013", end: "2016", description: "Upper second class honours. Final project on distributed consensus algorithms." }] },
      { type: "projects", entries: [
        { title: "Open source rate limiter", subtitle: "Maintainer", start: "2022", description: "A Go library for distributed rate limiting with 2,300 stars on GitHub." },
        { title: "Hack for Good 2023", subtitle: "Team lead", start: "2023", description: "Built a volunteer scheduling tool for a food bank in 48 hours. Won first prize." }] },
      { type: "skills", items: [["TypeScript", 5], ["Go", 5], ["PostgreSQL", 4], ["Kafka", 4], ["AWS", 4], ["Kubernetes", 3], ["React", 3], ["System design", 5]] },
      { type: "certificates", entries: [{ title: "AWS Solutions Architect Associate", subtitle: "Amazon Web Services", end: "2023" }, { title: "Certified Kubernetes Application Developer", subtitle: "CNCF", end: "2022" }] },
      { type: "languages", items: [["English", 5], ["Gujarati", 5], ["Hindi", 4]] },
    ],
  },

  graduate: {
    label: "Student or graduate",
    name: "Jamie Okafor",
    title: "Graduate Business Analyst",
    details: [["email", "jamie.okafor@example.com"], ["phone", "+44 7700 900734"], ["location", "Birmingham, United Kingdom"], ["linkedin", "linkedin.com/in/jamieokafor"]],
    sections: [
      { type: "summary", text: "Recent economics graduate with a placement year in analytics and a habit of turning messy data into clear decisions. Looking for a graduate analyst role where I can learn fast and own real problems." },
      { type: "education", entries: [
        { title: "BSc Economics with Data Science", subtitle: "University of Birmingham", location: "Birmingham", start: "2020", end: "2024", description: "First class honours. Modules in econometrics, machine learning and public policy. Dissertation on regional house prices." },
        { title: "A Levels", subtitle: "King Edward VI College", location: "Birmingham", start: "2018", end: "2020", description: "Maths A*, Economics A, Geography A." }] },
      { type: "experience", entries: [
        { title: "Data Analyst, Placement Year", subtitle: "Harbour Insurance", location: "Bristol", start: "2022-07", end: "2023-06", bullets: [
          "Built a Power BI dashboard used by 40 managers to track claims backlogs every week.",
          "Cleaned and joined five years of claims data, finding £180k of duplicate payments.",
          "Presented findings to the head of operations, leading to a new triage process."] },
        { title: "Sales Assistant", subtitle: "Bullring Books", location: "Birmingham", start: "2020-10", end: "2022-06", bullets: [
          "Served customers on busy weekends and handled cash and card payments accurately."] },
      ] },
      { type: "projects", entries: [{ title: "Student housing price tracker", subtitle: "Personal project", start: "2023", description: "Scraped and analysed 12,000 listings in Python; shared the results with the students' union." }] },
      { type: "volunteering", entries: [{ title: "Maths Tutor", subtitle: "Access Tutoring Charity", start: "2021-01", end: "2024-06", bullets: ["Tutored six GCSE students weekly; all improved by at least two grades."] }] },
      { type: "skills", items: [["Excel", 5], ["SQL", 4], ["Python", 4], ["Power BI", 4], ["Presenting", 4]] },
      { type: "languages", items: [["English", 5], ["Yoruba", 4], ["French", 2]] },
      { type: "interests", items: [["Debating", 0], ["Five a side football", 0], ["Podcasts", 0]] },
    ],
  },

  executive: {
    label: "Executive",
    name: "Catherine Hale",
    title: "Chief Operating Officer",
    details: [["email", "catherine.hale@example.com"], ["phone", "+44 7700 900587"], ["location", "London, United Kingdom"], ["linkedin", "linkedin.com/in/catherinehale"]],
    sections: [
      { type: "summary", text: "Operations leader with <b>twenty years</b> scaling consumer and logistics businesses. I build accountable teams, simplify how work gets done and turn strategy into measurable results for boards and investors." },
      { type: "experience", entries: [
        { title: "Chief Operating Officer", subtitle: "Parcelwise Group", location: "London", start: "2019-02", current: true, bullets: [
          "Lead 2,400 people across operations, customer service and technology in four countries.",
          "Grew revenue from <b>£180m to £410m</b> while improving operating margin by six points.",
          "Delivered a £35m automation programme on time, cutting cost per parcel by 22%.",
          "Prepared the business for a successful private equity investment in 2023."] },
        { title: "Operations Director", subtitle: "Greenleaf Retail", location: "Reading", start: "2013-05", end: "2019-01", bullets: [
          "Ran supply chain and stores operations for 160 shops and two distribution centres.",
          "Reduced stock loss by 40% with a new forecasting and replenishment model.",
          "Built the leadership team from scratch; three of them now run their own businesses."] },
        { title: "Head of Logistics", subtitle: "Northbound Foods", location: "Leeds", start: "2008-01", end: "2013-04", bullets: [
          "Consolidated six depots into two, saving £9m a year with no loss of service."] },
      ] },
      { type: "education", entries: [{ title: "MBA", subtitle: "London Business School", start: "2010", end: "2012" }, { title: "BA (Hons) Geography", subtitle: "University of Durham", start: "2000", end: "2003" }] },
      { type: "awards", entries: [{ title: "Operations Leader of the Year 2022", subtitle: "UK Logistics Awards" }] },
      { type: "skills", items: [["Strategy and planning", 5], ["P&L ownership", 5], ["Change leadership", 5], ["M&A integration", 4], ["Board reporting", 5]] },
      { type: "organizations", entries: [{ title: "Non executive director", subtitle: "Riverside Housing Trust", start: "2020", current: true }] },
      { type: "languages", items: [["English", 5], ["French", 3]] },
    ],
  },

  designer: {
    label: "Design and creative",
    name: "Leo Martins",
    title: "Product Designer",
    details: [["email", "leo.martins@example.com"], ["phone", "+44 7700 900902"], ["location", "Brighton, United Kingdom"], ["website", "leomartins.example.com"], ["linkedin", "linkedin.com/in/leomartins"]],
    sections: [
      { type: "summary", text: "Product designer who moves easily from research to pixels. Six years designing mobile and web products used by millions, with a soft spot for design systems and accessible interfaces." },
      { type: "experience", entries: [
        { title: "Senior Product Designer", subtitle: "Tidal Travel", location: "Brighton", start: "2021-05", current: true, bullets: [
          "Redesigned booking checkout, lifting mobile conversion by <b>14%</b>.",
          "Built and documented the design system now used by eight product teams.",
          "Ran fortnightly usability tests and made research part of every sprint."] },
        { title: "Product Designer", subtitle: "Pocket Health", location: "London", start: "2018-08", end: "2021-04", bullets: [
          "Designed the appointment app from first sketches to 1.2 million downloads.",
          "Raised the app to WCAG AA, working with clinicians and patients with low vision."] },
        { title: "Junior Designer", subtitle: "Studio Nine", location: "Brighton", start: "2016-09", end: "2018-07", bullets: ["Created brand identities and websites for 20 small businesses."] },
      ] },
      { type: "education", entries: [{ title: "BA (Hons) Graphic Design", subtitle: "University of Brighton", start: "2013", end: "2016" }] },
      { type: "projects", entries: [{ title: "Type Specimen Zine", subtitle: "Self published", start: "2022", description: "A risograph zine on variable fonts, sold out two print runs." }] },
      { type: "skills", items: [["Figma", 5], ["Prototyping", 5], ["User research", 4], ["Design systems", 5], ["Illustration", 4], ["HTML and CSS", 3]] },
      { type: "awards", entries: [{ title: "Design Week Awards finalist", subtitle: "Digital product category", end: "2023" }] },
      { type: "languages", items: [["English", 5], ["Portuguese", 5]] },
      { type: "interests", items: [["Letterpress", 0], ["Surfing", 0], ["Urban sketching", 0]] },
    ],
  },

  nurse: {
    label: "Healthcare",
    name: "Grace Bennett",
    title: "Registered Nurse, Adult Critical Care",
    details: [["email", "grace.bennett@example.com"], ["phone", "+44 7700 900355"], ["location", "Sheffield, United Kingdom"], ["star", "NMC PIN 12A3456E"]],
    sections: [
      { type: "summary", text: "Compassionate registered nurse with <b>six years</b> in adult critical care. Calm under pressure, meticulous with records, and committed to safe, person centred care for patients and their families." },
      { type: "experience", entries: [
        { title: "Senior Staff Nurse, Intensive Care", subtitle: "Northern General Hospital", location: "Sheffield", start: "2021-04", current: true, bullets: [
          "Care for ventilated and multi organ support patients in a 24 bed unit.",
          "Lead shifts as nurse in charge, coordinating a team of up to 12 staff.",
          "Introduced a pressure care checklist that halved hospital acquired pressure ulcers."] },
        { title: "Staff Nurse, Acute Medical Unit", subtitle: "Royal Hallamshire Hospital", location: "Sheffield", start: "2018-09", end: "2021-03", bullets: [
          "Assessed and treated acutely unwell admissions, escalating quickly when needed.",
          "Mentored eight student nurses through their placements."] },
      ] },
      { type: "education", entries: [{ title: "BSc (Hons) Adult Nursing", subtitle: "University of Sheffield", start: "2015", end: "2018" }] },
      { type: "certificates", entries: [
        { title: "Advanced Life Support", subtitle: "Resuscitation Council UK", end: "2024" },
        { title: "Critical Care Course", subtitle: "Sheffield Hallam University", end: "2022" }] },
      { type: "skills", items: [["Critical care", 5], ["Patient assessment", 5], ["Medicines management", 5], ["Leadership", 4], ["Clinical audit", 4]] },
      { type: "softSkills", items: [["Empathy", 0], ["Composure", 0], ["Teamwork", 0], ["Attention to detail", 0]] },
      { type: "languages", items: [["English", 5], ["Polish", 3]] },
    ],
  },
};
