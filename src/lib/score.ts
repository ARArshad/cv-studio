import { parseLines } from "@/components/cv/blocks";
import type { Cv } from "./types";

export interface Check {
  ok: boolean;
  title: string;
  tip: string;
}

const words = (s: string) => s.replace(/\*\*/g, "").split(/\s+/).filter(Boolean).length;

/** quick, explainable checks; the score is simply the share that pass */
export function checkCv(cv: Cv, pages: number): { score: number; checks: Check[] } {
  const p = cv.data.personal;
  const visible = cv.data.sections.filter((s) => !s.hidden);
  const has = (icon: string) => p.details.some((d) => d.icon === icon && d.value.trim());
  const summary = visible.find((s) => s.type === "summary");
  const jobs = visible.filter((s) => s.type === "experience").flatMap((s) => s.entries).filter((e) => e.title.trim());
  const skills = visible.filter((s) => s.type === "skills").flatMap((s) => s.items).filter((i) => i.name.trim());
  const education = visible.filter((s) => s.type === "education").flatMap((s) => s.entries).filter((e) => e.title.trim());
  const thinJobs = jobs.filter((e) => parseLines(e.description).filter((l) => l.kind === "li").length < 2);
  const placeholders = JSON.stringify(cv.data).match(/\[[a-z£$€ ]{1,12}\]/gi) ?? [];
  const sw = summary ? words(summary.text) : 0;

  const checks: Check[] = [
    { ok: !!p.fullName.trim(), title: "Your name", tip: "Add your full name at the top." },
    { ok: !!p.jobTitle.trim(), title: "Job title", tip: "Add the job title you are applying for, so a reader knows at once." },
    { ok: has("email"), title: "Email address", tip: "Add an email address employers can reply to." },
    { ok: has("phone"), title: "Phone number", tip: "Add a phone number." },
    { ok: has("location"), title: "Location", tip: "Add your town or city. Recruiters often filter by location." },
    { ok: sw >= 30 && sw <= 120, title: "Profile length", tip: sw < 30 ? "Write a profile of 30 to 120 words: who you are, what you bring, what you want." : "Trim your profile to under 120 words. Keep the strongest points." },
    { ok: jobs.length > 0, title: "Work experience", tip: "Add at least one job, placement or volunteer role." },
    { ok: jobs.length > 0 && thinJobs.length === 0, title: "Detail in each job", tip: `Give every job at least two bullet points.${thinJobs.length ? " Check: " + thinJobs.map((e) => e.title).join(", ") + "." : ""}` },
    { ok: education.length > 0, title: "Education", tip: "Add your highest qualification." },
    { ok: skills.length >= 5, title: "Skills", tip: "List at least five skills that match the jobs you want." },
    { ok: placeholders.length === 0, title: "No placeholders left", tip: `Replace text in square brackets such as ${placeholders.slice(0, 2).join(" and ")} with your own details.` },
    { ok: pages <= 2, title: "Length", tip: "Keep it to one or two pages. Try a compact template or smaller text." },
  ];
  const score = Math.round((checks.filter((c) => c.ok).length / checks.length) * 100);
  return { score, checks };
}
