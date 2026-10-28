export const GUIDES = [
  {
    id: "start",
    label: "Getting started",
    title: "Build a CV from the ground up",
    intro: "Focus on the role, then choose what belongs on the page.",
    steps: [
      "Choose New document in your workspace. Start blank for your own content, or choose a worked example to understand the structure.",
      "Add your name, target job title, and contact details. A town or city is usually enough location detail; include contact information you are comfortable sharing.",
      "Add your most relevant experience, education, and skills. Use the section controls to move, hide, and reorder content.",
      "Read the finished CV aloud, check names and dates, and download a backup before moving to another device.",
    ],
  },
  {
    id: "achievements",
    label: "Writing",
    title: "Turn a responsibility into an achievement",
    intro: "Make it clear what you did and why it mattered.",
    steps: [
      "Start with a specific action: built, improved, organised, researched, or delivered. Choose the verb that accurately describes your contribution.",
      "Add context: the team, customer problem, process, product, or scale of the work. Help the reader picture your role.",
      "Explain the result. Include a number only when you can support it. A clearer process, a completed launch, or improved feedback can also show impact.",
      "For example: ‘Organised weekly handovers for a six-person support team, making outstanding requests easier to track.’ Adapt the pattern to your own work.",
    ],
  },
  {
    id: "tailoring",
    label: "Job applications",
    title: "Tailor a CV to a specific role",
    intro: "Give the reader the evidence most relevant to this application.",
    steps: [
      "Duplicate your CV from its dashboard menu so the original stays available for other applications. Give the copy a clear name.",
      "Open ATS checker in the editor and paste the job description. It is saved with that CV, so you can revisit the same application.",
      "Review the found and missing terms. This is a keyword comparison, not an employer’s ATS score. Add a term only if it genuinely describes your experience.",
      "Move relevant skills and achievements earlier. Use tags for the company, role, language, or stage to find the right document later.",
    ],
  },
  {
    id: "letter",
    label: "Cover letters",
    title: "Write a letter that complements your CV",
    intro: "Connect your experience to the work this employer needs done.",
    steps: [
      "Choose Matching cover letter from your CV’s dashboard menu. Your personal details, fonts, and colours carry over.",
      "Add the company, recipient, date, and application subject. Explain what interests you about this particular role.",
      "Choose one or two relevant achievements and explain their connection to the job. The on-device outline provides a starting structure; it does not verify facts or create new achievements.",
      "Finish with a clear invitation to talk, your name, and a careful proofread. Replace every prompt in square brackets before sending.",
    ],
  },
  {
    id: "layout",
    label: "Design",
    title: "Choose a clear and readable layout",
    intro:
      "Let the content do the work and use design to make it easy to follow.",
    steps: [
      "Choose a template with a clear hierarchy. For a straightforward reading order, start with a single-column layout.",
      "Keep font sizes and spacing consistent. If a page feels crowded, shorten or remove less relevant content before reducing the text size.",
      "Use headings that describe the content. Place recent and relevant experience where it is easy to find, and avoid decorative elements that distract from it.",
      "Review each page at a readable zoom. Check that contact details, dates, and achievement statements are easy to scan.",
    ],
  },
  {
    id: "export",
    label: "Saving & exporting",
    title: "Keep your work safe and export it well",
    intro: "Browser storage is convenient. A backup makes it portable.",
    steps: [
      "Your documents save automatically in this browser profile. They are not synchronised to an account or another device. A save warning means changes need a downloaded backup.",
      "Use Back up all documents in the dashboard to save a portable JSON collection. Import it on another device and review the restoration preview.",
      "Download PDF opens your browser’s print window. Select Save as PDF, use the paper size shown in the editor, and turn off browser headers and footers.",
      "Check the downloaded file before applying. Confirm the page count, selected text, contact details, and links. Deleted documents can be recovered from Recently deleted until permanently removed.",
    ],
  },
] as const;
