import type { CoverLetter, Cv } from "./types";
import { makeCv, uid } from "./sample";
import { escapeHtml, toText } from "./rich";

export function makeLetter(source?: Cv, title?: string): Cv {
  const base = source ?? makeCv({ start: "blank", template: "meridian" });
  const now = Date.now();
  return {
    ...structuredClone(base),
    kind: "letter",
    id: uid("cv_"),
    title:
      title?.trim() ||
      (source ? `${source.title} — cover letter` : "Untitled cover letter"),
    createdAt: now,
    updatedAt: now,
    data: {
      personal: structuredClone(base.data.personal),
      sections: [],
      letter: {
        ...(source && !source.data.letter ? { sourceCvId: source.id } : {}),
        recipient: "",
        company: "",
        address: "",
        date: new Date().toLocaleDateString("en-GB", {
          day: "numeric",
          month: "long",
          year: "numeric",
        }),
        subject: base.data.personal.jobTitle
          ? `Application for ${base.data.personal.jobTitle}`
          : "",
        salutation: "Dear Hiring Manager,",
        paragraphs: Array.from({ length: 3 }, () => ({
          id: uid("p_"),
          text: "",
        })),
        closing: "Kind regards,",
        signature: base.data.personal.fullName,
      },
    },
    design: {
      ...base.design,
      layout: "single",
      showPhoto: false,
      showTitle: false,
      summaryInHeader: false,
    },
  };
}

/** A transparent starting outline using only information already in the CV. */
export function draftLetter(cv: Cv, source?: Cv): CoverLetter["paragraphs"] {
  const letter = cv.data.letter;
  const role = cv.data.personal.jobTitle || "[job title]";
  const company = letter?.company || "[company]";
  const job = source?.data.sections.find(
    (s) => s.type === "experience" && !s.hidden,
  )?.entries[0];
  const achievement = job?.bullets.find((text) => toText(text).trim());
  const skills = source?.data.sections
    .filter((s) => s.type === "skills" && !s.hidden)
    .flatMap((s) => s.items.map((item) => item.name))
    .filter(Boolean)
    .slice(0, 3);
  const texts = [
    `I am writing to apply for the ${escapeHtml(role)} position at ${escapeHtml(company)}. [Explain what interests you about the team and its work.]`,
    achievement
      ? `In my work${job?.subtitle ? ` at ${escapeHtml(job.subtitle)}` : ""}, I have delivered results such as: ${achievement} [Connect this achievement to a requirement in the job description.]`
      : "[Describe one relevant achievement, the action you took, and its result. Use details you can support.]",
    `${skills?.length ? `I would bring experience in ${escapeHtml(skills.join(", "))}. ` : ""}I would welcome the opportunity to discuss how I could contribute to ${escapeHtml(company)}. Thank you for considering my application.`,
  ];
  return texts.map((text) => ({ id: uid("p_"), text }));
}

export function checkLetter(cv: Cv) {
  const l = cv.data.letter;
  const words =
    l?.paragraphs
      .map((p) => toText(p.text))
      .join(" ")
      .trim()
      .split(/\s+/)
      .filter(Boolean).length ?? 0;
  return [
    { ok: !!cv.data.personal.fullName.trim(), title: "Add your full name" },
    {
      ok: cv.data.personal.details.some(
        (d) => d.icon === "email" && d.value.trim(),
      ),
      title: "Include an email address",
    },
    { ok: !!l?.company.trim(), title: "Address the company" },
    { ok: !!l?.subject.trim(), title: "Name the role in the subject" },
    { ok: words >= 150 && words <= 450, title: "Aim for 150–450 words" },
    {
      ok: !l?.paragraphs.some((p) => /\[[^\]]+\]/.test(p.text)),
      title: "Replace every writing prompt",
    },
    { ok: !!l?.signature.trim(), title: "Finish with your name" },
  ];
}

export function documentText(cv: Cv): string {
  const p = cv.data.personal;
  const lines = [
    p.fullName,
    p.jobTitle,
    ...p.details.filter((d) => d.value.trim()).map((d) => d.value),
    "",
  ];
  const l = cv.data.letter;
  if (l)
    lines.push(
      l.date,
      l.recipient,
      l.company,
      l.address,
      "",
      l.subject,
      "",
      l.salutation,
      "",
      ...l.paragraphs.map((p) => `${toText(p.text)}\n`),
      l.closing,
      l.signature,
    );
  else
    for (const section of cv.data.sections.filter((s) => !s.hidden)) {
      lines.push(
        section.title.toUpperCase(),
        toText(section.text),
        ...section.items.map((item) => item.name),
      );
      for (const entry of section.entries)
        lines.push(
          entry.title,
          [entry.subtitle, entry.location].filter(Boolean).join(" · "),
          [entry.startDate, entry.current ? "Present" : entry.endDate]
            .filter(Boolean)
            .join(" – "),
          toText(entry.description),
          ...entry.bullets.map((bullet) => `• ${toText(bullet)}`),
          "",
        );
      lines.push("");
    }
  return lines
    .filter((line, i, all) => line || all[i - 1])
    .join("\n")
    .trim();
}

export function letterExample(source: Cv): Cv {
  const cv = makeLetter(source);
  if (cv.data.letter) {
    cv.data.letter.company = "Northstar Studio";
    cv.data.letter.recipient = "Hiring Team";
    cv.data.letter.paragraphs = draftLetter(cv, source).map((p) => ({
      ...p,
      text: p.text
        .replace(
          /\[Explain what interests you about the team and its work\.\]/g,
          "I am interested in a team that values thoughtful work, clear communication, and measurable outcomes.",
        )
        .replace(
          /\[Connect this achievement to a requirement in the job description\.\]/g,
          "I would bring the same care and ownership to the challenges facing your team.",
        ),
    }));
  }
  return cv;
}
