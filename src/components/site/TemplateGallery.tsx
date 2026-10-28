"use client";

import Link from "next/link";
import { ArrowUpRight, Search, Check, Eye } from "lucide-react";
import { CvThumb } from "@/components/cv/CvThumb";
import { useTemplateSamples } from "@/components/NewCvDialog";
import { Modal } from "@/components/ui";
import { letterExample } from "@/lib/letters";
import { useMemo, useState } from "react";
import {
  CATEGORIES,
  TEMPLATES,
  STUDIO_TEMPLATE_IDS,
  type Category,
} from "@/lib/templates";
import type { TemplateId } from "@/lib/types";

export function TemplateGallery({
  limit,
  filterable,
  kind = "cv",
  ids,
}: {
  limit?: number;
  filterable?: boolean;
  kind?: "cv" | "letter";
  ids?: TemplateId[];
}) {
  const originals = useTemplateSamples();
  const samples = useMemo(
    () =>
      kind === "letter"
        ? (Object.fromEntries(
            TEMPLATES.map((template) => [
              template.id,
              letterExample(originals[template.id]),
            ]),
          ) as typeof originals)
        : originals,
    [kind, originals],
  );
  const [cat, setCat] = useState<Category | "all" | "premium" | "studio">(
    "all",
  );
  const [query, setQuery] = useState("");
  const [preview, setPreview] = useState<TemplateId | null>(null);
  const selected = TEMPLATES.find((t) => t.id === preview);
  const list = TEMPLATES.filter(
    (t) =>
      (!ids || ids.includes(t.id)) &&
      (cat === "all" ||
        (cat === "premium"
          ? t.premium
          : cat === "studio"
            ? STUDIO_TEMPLATE_IDS.includes(t.id)
            : t.categories.includes(cat))) &&
      `${t.name} ${t.blurb} ${t.tags.join(" ")}`
        .toLowerCase()
        .includes(query.trim().toLowerCase()),
  ).slice(0, limit);
  return (
    <>
      {filterable && (
        <div className="mb-9 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
              <input
                aria-label="Search templates"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Find your style…"
                className="h-11 w-full rounded-lg border border-slate-200 bg-white pl-10 pr-4 text-sm"
              />
            </div>
            <p role="status" className="text-xs text-slate-500">
              {list.length} templates · all free to use
            </p>
          </div>
          <div
            className="flex flex-wrap gap-2"
            data-testid="gallery-categories"
          >
            {(
              [
                ["all", "All templates"],
                ["studio", "Studio collection · New"],
                ["premium", "Premium"],
                ...CATEGORIES.map((c) => [c.id, c.name]),
              ] as [typeof cat, string][]
            ).map(([k, l]) => (
              <button
                key={k}
                type="button"
                aria-pressed={cat === k}
                onClick={() => setCat(k)}
                className={
                  "cursor-pointer rounded-lg border px-3.5 py-2 text-xs font-medium transition " +
                  (cat === k
                    ? "border-brand-600 bg-brand-600 text-white"
                    : "border-slate-200 bg-white text-slate-600 hover:border-brand-500")
                }
              >
                {l}
              </button>
            ))}
          </div>
        </div>
      )}
      <div className="grid grid-cols-1 gap-x-7 gap-y-10 min-[440px]:grid-cols-2 lg:grid-cols-3">
        {list.map((t) => (
          <article key={t.id} className="group min-w-0">
            <div className="template-stage relative rounded-xl border border-slate-200/70 px-[12%] pb-0 pt-8 transition group-hover:border-brand-200">
              <button
                aria-label={`Preview ${t.name} template`}
                onClick={() => setPreview(t.id)}
                className="block w-full cursor-pointer overflow-hidden rounded-t-sm shadow-[0_5px_20px_#182b261a] transition duration-300 group-hover:-translate-y-1"
              >
                <CvThumb cv={samples[t.id]} />
              </button>
              <span className="absolute left-3 top-3 rounded-md bg-white/95 px-2 py-1 text-[9px] font-semibold tracking-wider text-brand-700">
                {STUDIO_TEMPLATE_IDS.includes(t.id)
                  ? "NEW · STUDIO COLLECTION"
                  : "FREE TEMPLATE"}
              </span>
              <button
                onClick={() => setPreview(t.id)}
                aria-label={`Expand ${t.name} preview`}
                className="absolute right-3 top-3 rounded-md bg-white p-1.5 text-slate-500 shadow-sm hover:text-brand-600"
              >
                <Eye className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-4 flex items-start justify-between gap-3">
              <div>
                <h3 className="text-base font-semibold">{t.name}</h3>
                <p className="mt-1 text-[10px] font-medium uppercase tracking-wider text-brand-700">
                  {t.layout === "single" ? "Single column" : "Two columns"} ·
                  Fully editable
                </p>
                <p className="mt-1 text-xs leading-5 text-slate-500">
                  {t.blurb}
                </p>
              </div>
              <Link
                href={`/dashboard?new=1&template=${t.id}&kind=${kind}`}
                aria-label={`Use ${t.name} template`}
                className="mt-0.5 grid h-9 w-9 flex-none place-items-center rounded-full border border-slate-200 bg-white text-brand-700 transition hover:border-brand-600 hover:bg-brand-600 hover:text-white"
              >
                <ArrowUpRight className="h-4 w-4" />
              </Link>
            </div>
          </article>
        ))}
      </div>
      {list.length === 0 && (
        <div className="rounded-xl border border-dashed border-slate-300 py-16 text-center">
          <p className="font-medium">No templates found</p>
          <p className="mt-2 text-sm text-slate-500">
            Try another search or category.
          </p>
          <button
            className="mt-5 text-sm font-semibold text-brand-700"
            onClick={() => {
              setQuery("");
              setCat("all");
            }}
          >
            Reset filters
          </button>
        </div>
      )}
      <Modal
        open={!!selected}
        onClose={() => setPreview(null)}
        title={selected ? `${selected.name} template` : "Template preview"}
        wide
      >
        {selected && (
          <div className="grid items-start gap-6 sm:grid-cols-[1.3fr_1fr]">
            <div className="max-h-[65vh] overflow-y-auto rounded-lg border border-slate-200">
              <CvThumb cv={samples[selected.id]} />
            </div>
            <div>
              <p className="eyebrow">Make it yours</p>
              <h3 className="editorial-title mt-3 text-3xl">{selected.name}</h3>
              <p className="mt-4 text-sm leading-6 text-slate-500">
                {selected.blurb}
              </p>
              <div className="mt-6 space-y-3 text-sm text-slate-600">
                {[
                  "Edit every word and colour",
                  "Switch templates any time",
                  "Free PDF with no watermark",
                ].map((t) => (
                  <p key={t} className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-brand-600" />
                    {t}
                  </p>
                ))}
              </div>
              <Link
                href={`/dashboard?new=1&template=${selected.id}&kind=${kind}`}
                className="mt-8 inline-flex h-11 items-center gap-4 rounded-lg bg-brand-600 px-5 text-sm font-semibold text-white hover:bg-brand-700"
              >
                Use this template <ArrowUpRight className="h-4 w-4" />
              </Link>
              <p className="mt-4 text-xs leading-5 text-slate-500">
                The preview uses example content. Start blank or personalise an
                example in the next step.
              </p>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}

/** three CVs fanned out, for the hero */
export function HeroStack() {
  const samples = useTemplateSamples();
  const ids: TemplateId[] = ["meridian", "nordic", "sterling"];
  return (
    <div className="relative mx-auto h-[360px] w-full max-w-[520px] sm:h-[520px]">
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
