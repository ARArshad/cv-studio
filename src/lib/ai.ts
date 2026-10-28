import type { Cv } from "./types";
import { toText } from "./rich";

export const AI_MODEL = "onnx-community/Qwen2.5-0.5B-Instruct";
export const AI_REVISION = "22942cb7d7ba4cc81bb4673549ca4d4614469b5e";
export const AI_CACHE = "cv-studio-ai-v1";
export type AiTask = "rewrite" | "shorten" | "profile" | "letter" | "translate";
export type AiRequest =
  | { type: "load" }
  | { type: "generate"; text: string; task: AiTask; language?: string };
export type AiResponse =
  | { type: "progress"; progress?: number; text: string }
  | { type: "ready" }
  | { type: "token"; text: string }
  | { type: "complete"; text: string }
  | { type: "error"; message: string }
  | { type: "cache-warning" };

export function aiTargets(cv: Cv) {
  const targets: { path: string; label: string; value: string }[] = [];
  if (cv.data.letter)
    return cv.data.letter.paragraphs.map((p, i) => ({
      path: `letterp:${p.id}`,
      label: `Letter paragraph ${i + 1}`,
      value: p.text,
    }));
  for (const section of cv.data.sections.filter((section) => !section.hidden)) {
    if (section.type === "summary")
      targets.push({
        path: `sec:${section.id}:text`,
        label: section.title,
        value: section.text,
      });
    for (const entry of section.entries) {
      if (section.fields.description)
        targets.push({
          path: `ent:${section.id}:${entry.id}:description`,
          label: `${section.title} · ${entry.title || "Entry"} · Description`,
          value: entry.description,
        });
      if (section.fields.bullets)
        entry.bullets.forEach((bullet, i) =>
          targets.push({
            path: `bul:${section.id}:${entry.id}:${i}`,
            label: `${entry.title || section.title} · Bullet ${i + 1}`,
            value: bullet,
          }),
        );
    }
  }
  return targets;
}

export function cvFacts(cv: Cv) {
  return [
    cv.data.personal.jobTitle,
    ...cv.data.sections
      .filter((section) => !section.hidden)
      .flatMap((section) => [
        toText(section.text),
        ...section.items.map((item) => item.name),
        ...section.entries.flatMap((entry) => [
          entry.title,
          entry.subtitle,
          toText(entry.description),
          ...entry.bullets.map(toText),
        ]),
      ]),
  ]
    .filter(Boolean)
    .join("\n")
    .slice(0, 6000);
}

export function aiInstruction(task: AiTask, language = "English") {
  const instructions: Record<AiTask, string> = {
    rewrite:
      "Rewrite the supplied CV text in a clear, professional tone. Use active verbs. Keep its meaning and approximate length.",
    shorten:
      "Shorten the supplied text to about half its length. Keep the important facts and results.",
    profile:
      "Write a professional CV profile of 40 to 70 words using only the supplied facts. Do not add a number of years, qualification, achievement or skill that was not supplied.",
    letter:
      "Write one concise cover-letter paragraph using only the supplied experience and facts. Explain the contribution the person could make. Do not invent a company, recipient or job requirement.",
    translate: `Translate the supplied text into ${["English", "Spanish", "French", "German", "Arabic", "Urdu"].includes(language) ? language : "English"}. Preserve names, dates, qualifications and numbers.`,
  };
  return instructions[task] ?? instructions.rewrite;
}

export function unexpectedNumbers(source: string, suggestion: string) {
  const numbers = (text: string) =>
    text.match(/\d+(?:[.,]\d+)*(?:%|\+)?/g) ?? [];
  const known = new Set(numbers(source));
  return [
    ...new Set(numbers(suggestion).filter((number) => !known.has(number))),
  ];
}
