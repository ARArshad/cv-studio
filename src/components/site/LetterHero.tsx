"use client";
import { useMemo } from "react";
import { Check } from "lucide-react";
import { CvThumb } from "@/components/cv/CvThumb";
import { makeCv } from "@/lib/sample";
import { letterExample } from "@/lib/letters";
export function LetterHero() {
  const { cv, letter } = useMemo(() => {
    const cv = makeCv({ template: "sterling", persona: "engineer" });
    return { cv, letter: letterExample(cv) };
  }, []);
  return (
    <div
      className="relative mx-auto min-h-[420px] w-full max-w-[520px] sm:min-h-[540px]"
      aria-label="A CV and its matching cover letter"
    >
      <div className="absolute left-0 top-12 w-[55%] -rotate-6 overflow-hidden rounded-md shadow-xl ring-1 ring-slate-900/5">
        <CvThumb cv={cv} />
      </div>
      <div className="absolute right-0 top-0 w-[65%] rotate-3 overflow-hidden rounded-md shadow-2xl ring-1 ring-slate-900/5">
        <CvThumb cv={letter} />
      </div>
      <div className="absolute bottom-0 right-0 flex items-center gap-3 rounded-xl border border-white bg-white/95 px-5 py-4 shadow-lg">
        <span className="grid h-9 w-9 place-items-center rounded-full bg-brand-50 text-brand-600">
          <Check className="h-4 w-4" />
        </span>
        <div>
          <p className="text-sm font-semibold">Made to go together</p>
          <p className="mt-0.5 text-xs text-slate-500">
            Your details. One consistent style.
          </p>
        </div>
      </div>
    </div>
  );
}
