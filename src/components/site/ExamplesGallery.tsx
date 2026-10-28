"use client";
import Link from "next/link";
import { useMemo } from "react";
import { ArrowUpRight } from "lucide-react";
import { PERSONAS } from "@/lib/personas";
import { makeCv } from "@/lib/sample";
import type { Persona } from "@/lib/templates";
import type { TemplateId } from "@/lib/types";
import { CvThumb } from "@/components/cv/CvThumb";
const designs: Record<Persona, TemplateId> = {
  marketing: "meridian",
  engineer: "silicon",
  graduate: "campus",
  executive: "sterling",
  designer: "canvas",
  nurse: "linen",
};
export function ExamplesGallery() {
  const examples = useMemo(
    () =>
      (Object.keys(PERSONAS) as Persona[]).map((persona) => ({
        persona,
        cv: makeCv({ persona, template: designs[persona] }),
        info: PERSONAS[persona],
      })),
    [],
  );
  return (
    <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
      {examples.map(({ persona, cv, info }) => (
        <article
          key={persona}
          className="overflow-hidden rounded-xl border border-slate-200 bg-white"
        >
          <div className="template-stage px-10 pt-8">
            <CvThumb cv={cv} className="shadow-md" />
          </div>
          <div className="p-6">
            <p className="eyebrow">{info.label}</p>
            <h2 className="mt-3 text-xl font-semibold">{info.title}</h2>
            <p className="mt-3 text-sm leading-6 text-slate-500">
              See how a focused profile, relevant experience, and clear
              achievements fit together. Replace the example with your own
              story.
            </p>
            <Link
              className="mt-5 inline-flex items-center gap-4 text-sm font-semibold text-brand-700"
              href={`/dashboard?new=1&start=example&persona=${persona}&template=${designs[persona]}`}
            >
              Start with this example <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>
        </article>
      ))}
    </div>
  );
}
