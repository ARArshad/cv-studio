"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Crown } from "lucide-react";
import { CvThumb } from "@/components/cv/CvThumb";
import { Button, Field, Modal, cx, inputCls } from "@/components/ui";
import { PERSONAS } from "@/lib/personas";
import { makeCv } from "@/lib/sample";
import { useLibrary } from "@/lib/store";
import { CATEGORIES, TEMPLATES, getTemplate, type Category, type Persona } from "@/lib/templates";
import type { Cv, TemplateId } from "@/lib/types";

/** one example CV per template, filled with the example that suits it */
export function useTemplateSamples(): Record<TemplateId, Cv> {
  return useMemo(() => Object.fromEntries(TEMPLATES.map((t) => {
    const cv = makeCv({ template: t.id });
    return [t.id, { ...cv, id: "sample-" + t.id, title: t.name, createdAt: 0, updatedAt: 0 }];
  })) as Record<TemplateId, Cv>, []);
}

export function NewCvDialog({ open, onClose, initialTemplate }: { open: boolean; onClose: () => void; initialTemplate?: TemplateId }) {
  const router = useRouter();
  const createCv = useLibrary((s) => s.createCv);
  const samples = useTemplateSamples();
  const [title, setTitle] = useState("");
  const [start, setStart] = useState<"example" | "blank">("example");
  const [template, setTemplate] = useState<TemplateId>(initialTemplate ?? "pulse");
  const [persona, setPersona] = useState<Persona | "auto">("auto");
  const [cat, setCat] = useState<Category | "all" | "premium">("all");

  const list = TEMPLATES.filter((t) => cat === "all" ? true : cat === "premium" ? t.premium : t.categories.includes(cat));
  const usedPersona = persona === "auto" ? getTemplate(template).persona : persona;

  const create = () => {
    const id = createCv({ title, template, start, persona: usedPersona });
    onClose();
    router.push(`/editor/${id}`);
  };

  return (
    <Modal open={open} onClose={onClose} title="Create a new CV" wide>
      <div className="grid gap-4 sm:grid-cols-[1fr_auto_auto]">
        <Field label="Name it so you can find it later">
          <input autoFocus className={inputCls} value={title} onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && create()} placeholder="For example: Marketing roles, London" data-testid="new-title" />
        </Field>
        <Field label="Start from">
          <div className="inline-flex rounded-lg border border-slate-200 p-0.5">
            {(["example", "blank"] as const).map((s) => (
              <button key={s} type="button" onClick={() => setStart(s)} data-start={s}
                className={cx("rounded-md px-3.5 py-1.5 text-sm cursor-pointer", start === s ? "bg-brand-50 font-medium text-brand-700" : "text-slate-600 hover:text-ink")}>
                {s === "example" ? "Example to edit" : "Blank CV"}
              </button>
            ))}
          </div>
        </Field>
        {start === "example" && (
          <Field label="Example for">
            <select className={cx(inputCls, "w-48")} value={persona} onChange={(e) => setPersona(e.target.value as Persona | "auto")} data-testid="new-persona">
              <option value="auto">Suits the template ({PERSONAS[getTemplate(template).persona].label})</option>
              {(Object.keys(PERSONAS) as Persona[]).map((p) => <option key={p} value={p}>{PERSONAS[p].label}</option>)}
            </select>
          </Field>
        )}
      </div>

      <div className="mb-3 mt-6 flex flex-wrap gap-1.5" data-testid="new-categories">
        {([["all", "All"], ["premium", "Premium"], ...CATEGORIES.map((c) => [c.id, c.name])] as [typeof cat, string][]).map(([k, l]) => (
          <button key={k} type="button" onClick={() => setCat(k)} data-cat={k}
            className={cx("rounded-full px-3 py-1 text-xs font-medium cursor-pointer", cat === k ? "bg-ink text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200")}>{l}</button>
        ))}
      </div>
      <div className="grid max-h-[46vh] grid-cols-2 gap-4 overflow-y-auto pr-1 sm:grid-cols-3 md:grid-cols-5">
        {list.map((t) => (
          <button key={t.id} type="button" data-template={t.id} onClick={() => setTemplate(t.id)}
            className={cx("group relative rounded-xl border-2 p-1.5 text-left transition cursor-pointer", template === t.id ? "border-brand-500 bg-brand-50/60" : "border-transparent hover:border-slate-200")}>
            <CvThumb cv={samples[t.id]} className="rounded-md ring-1 ring-slate-200" />
            {t.premium && <span className="absolute left-2.5 top-2.5 inline-flex items-center gap-0.5 rounded-full bg-amber-400 px-1.5 py-0.5 text-[9px] font-bold text-amber-950 shadow"><Crown className="h-2.5 w-2.5" />PREMIUM</span>}
            <div className="mt-1.5 flex items-center justify-between px-0.5">
              <span className="text-[13px] font-medium">{t.name}</span>
              {template === t.id && <Check className="h-4 w-4 text-brand-600" />}
            </div>
          </button>
        ))}
      </div>

      <div className="mt-6 flex items-center justify-between gap-2.5">
        <p className="text-xs text-slate-500">Every template is free, premium ones included. You can switch any time.</p>
        <div className="flex gap-2.5">
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={create} data-testid="new-create">Create CV</Button>
        </div>
      </div>
    </Modal>
  );
}
