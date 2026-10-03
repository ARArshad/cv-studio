"use client";

import Link from "next/link";
import { Crown } from "lucide-react";
import { CvThumb } from "@/components/cv/CvThumb";
import { useTemplateSamples } from "@/components/NewCvDialog";
import { useState } from "react";
import { CATEGORIES, TEMPLATES, type Category } from "@/lib/templates";
import type { TemplateId } from "@/lib/types";

export function TemplateGallery({ limit, filterable }: { limit?: number; filterable?: boolean }) {
  const samples = useTemplateSamples();
  const [cat, setCat] = useState<Category | "all" | "premium">("all");
  const list = TEMPLATES.filter((t) => cat === "all" ? true : cat === "premium" ? t.premium : t.categories.includes(cat)).slice(0, limit);
  return (
    <>
    {filterable && (
      <div className="mb-10 flex flex-wrap gap-2" data-testid="gallery-categories">
        {([["all", "All templates"], ["premium", "Premium"], ...CATEGORIES.map((c) => [c.id, c.name])] as [typeof cat, string][]).map(([k, l]) => (
          <button key={k} type="button" onClick={() => setCat(k)}
            className={"rounded-full px-4 py-2 text-sm font-medium transition cursor-pointer " + (cat === k ? "bg-ink text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200")}>{l}</button>
        ))}
      </div>
    )}
    <div className="grid grid-cols-2 gap-x-5 gap-y-8 sm:grid-cols-3 lg:grid-cols-5">
      {list.map((t) => (
        <div key={t.id} className="group">
          <div className="relative overflow-hidden rounded-xl shadow-md ring-1 ring-slate-200 transition group-hover:-translate-y-1 group-hover:shadow-xl">
            <CvThumb cv={samples[t.id]} />
            {t.premium && <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-amber-400 px-2 py-0.5 text-[10px] font-bold text-amber-950 shadow"><Crown className="h-3 w-3" />PREMIUM, FREE</span>}
            <div className="absolute inset-0 flex items-end justify-center bg-gradient-to-t from-slate-900/40 to-transparent p-4 opacity-0 transition group-hover:opacity-100">
              <Link href={`/dashboard?new=1&template=${t.id}`} className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white shadow hover:bg-brand-700">
                Use this template
              </Link>
            </div>
          </div>
          <div className="mt-3">
            <h3 className="font-semibold">{t.name}</h3>
            <p className="mt-0.5 text-[13px] leading-snug text-slate-500">{t.blurb}</p>
          </div>
        </div>
      ))}
    </div>
    </>
  );
}

/** three CVs fanned out, for the hero */
export function HeroStack() {
  const samples = useTemplateSamples();
  const ids: TemplateId[] = ["monarch", "pulse", "horizon"];
  return (
    <div className="relative mx-auto h-[420px] w-full max-w-[520px] sm:h-[520px]">
      {ids.map((id, i) => (
        <div
          key={id}
          className="absolute top-0 w-[58%] overflow-hidden rounded-lg shadow-2xl ring-1 ring-slate-900/5"
          style={{
            left: `${[0, 21, 42][i]}%`,
            top: `${[40, 0, 40][i]}px`,
            transform: `rotate(${[-6, 0, 6][i]}deg)`,
            zIndex: i === 1 ? 3 : 1,
          }}
        >
          <CvThumb cv={samples[id]} />
        </div>
      ))}
    </div>
  );
}
