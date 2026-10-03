"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Check } from "lucide-react";
import { CvThumb } from "@/components/cv/CvThumb";
import { Button, Field, Modal, cx, inputCls } from "@/components/ui";
import { designFor, sampleData } from "@/lib/sample";
import { useLibrary } from "@/lib/store";
import { TEMPLATES } from "@/lib/templates";
import type { Cv, TemplateId } from "@/lib/types";

/** one example CV per template, shared by the dialog and the landing page */
export function useTemplateSamples(): Record<TemplateId, Cv> {
  return useMemo(() => {
    const data = sampleData();
    return Object.fromEntries(TEMPLATES.map((t) => [t.id, {
      id: "sample-" + t.id, title: t.name, createdAt: 0, updatedAt: 0, data, design: designFor(t.id),
    }])) as Record<TemplateId, Cv>;
  }, []);
}

export function NewCvDialog({ open, onClose, initialTemplate }: { open: boolean; onClose: () => void; initialTemplate?: TemplateId }) {
  const router = useRouter();
  const createCv = useLibrary((s) => s.createCv);
  const samples = useTemplateSamples();
  const [title, setTitle] = useState("");
  const [start, setStart] = useState<"example" | "blank">("example");
  const [template, setTemplate] = useState<TemplateId>(initialTemplate ?? "pulse");

  const create = () => {
    const id = createCv({ title, template, start });
    onClose();
    router.push(`/editor/${id}`);
  };

  return (
    <Modal open={open} onClose={onClose} title="Create a new CV" wide>
      <div className="grid gap-5 sm:grid-cols-[1fr_auto]">
        <Field label="Name it so you can find it later">
          <input
            autoFocus
            className={inputCls}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && create()}
            placeholder="For example: Marketing roles, London"
            data-testid="new-title"
          />
        </Field>
        <Field label="Start from">
          <div className="inline-flex rounded-lg border border-slate-200 p-0.5">
            {(["example", "blank"] as const).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setStart(s)}
                data-start={s}
                className={cx("rounded-md px-3.5 py-1.5 text-sm cursor-pointer", start === s ? "bg-brand-50 font-medium text-brand-700" : "text-slate-600 hover:text-ink")}
              >
                {s === "example" ? "Example to edit" : "Blank CV"}
              </button>
            ))}
          </div>
        </Field>
      </div>

      <p className="mb-3 mt-6 text-[12.5px] font-medium text-slate-600">Pick a template. You can switch any time without losing what you write.</p>
      <div className="grid max-h-[46vh] grid-cols-2 gap-4 overflow-y-auto pr-1 sm:grid-cols-3 md:grid-cols-5">
        {TEMPLATES.map((t) => (
          <button
            key={t.id}
            type="button"
            data-template={t.id}
            onClick={() => setTemplate(t.id)}
            className={cx("group relative rounded-xl border-2 p-1.5 text-left transition cursor-pointer", template === t.id ? "border-brand-500 bg-brand-50/60" : "border-transparent hover:border-slate-200")}
          >
            <CvThumb cv={samples[t.id]} className="rounded-md ring-1 ring-slate-200" />
            <div className="mt-1.5 flex items-center justify-between px-0.5">
              <span className="text-[13px] font-medium">{t.name}</span>
              {template === t.id && <Check className="h-4 w-4 text-brand-600" />}
            </div>
          </button>
        ))}
      </div>

      <div className="mt-6 flex justify-end gap-2.5">
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="primary" onClick={create} data-testid="new-create">Create CV</Button>
      </div>
    </Modal>
  );
}
