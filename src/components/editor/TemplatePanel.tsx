"use client";

import { useMemo } from "react";
import { Check } from "lucide-react";
import { CvThumb } from "@/components/cv/CvThumb";
import { cx } from "@/components/ui";
import { designFor } from "@/lib/sample";
import { TEMPLATES } from "@/lib/templates";
import type { Cv, TemplateId } from "@/lib/types";
import { useEditor } from "./context";

/** every template, drawn with the person's own CV */
export function TemplatePanel() {
  const { cv, update } = useEditor();
  const previews = useMemo(
    () => Object.fromEntries(TEMPLATES.map((t) => [t.id, { ...cv, design: { ...designFor(t.id), pageSize: cv.design.pageSize, showPhoto: cv.design.showPhoto, skillStyle: cv.design.skillStyle } } satisfies Cv])) as Record<TemplateId, Cv>,
    [cv],
  );

  const choose = (id: TemplateId) =>
    update((d) => {
      /* the new template brings its own colour and fonts; your content and
         your choices about photo, paper and levels stay */
      d.design = { ...designFor(id), pageSize: d.design.pageSize, showPhoto: d.design.showPhoto, photoShape: d.design.photoShape, skillStyle: d.design.skillStyle, showIcons: d.design.showIcons };
    });

  return (
    <div className="p-4 sm:p-5">
      <p className="mb-4 text-sm text-slate-500">Switching keeps everything you have written. Colours and fonts change to suit the template, and you can adjust them in Design.</p>
      <div className="grid grid-cols-2 gap-4">
        {TEMPLATES.map((t) => {
          const on = cv.design.template === t.id;
          return (
            <button key={t.id} type="button" onClick={() => choose(t.id)} data-template={t.id}
              className={cx("group rounded-xl border-2 p-1.5 text-left transition cursor-pointer", on ? "border-brand-500 bg-brand-50/50" : "border-transparent hover:border-slate-200")}>
              <CvThumb cv={previews[t.id]} className="rounded-md ring-1 ring-slate-200" />
              <div className="mt-2 flex items-center gap-2 px-1">
                <span className="text-sm font-semibold">{t.name}</span>
                {on && <Check className="h-4 w-4 text-brand-600" />}
              </div>
              <div className="mt-1 flex flex-wrap gap-1 px-1 pb-1">
                {t.tags.map((tag) => <span key={tag} className="rounded bg-slate-100 px-1.5 py-0.5 text-[10.5px] font-medium text-slate-600">{tag}</span>)}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
