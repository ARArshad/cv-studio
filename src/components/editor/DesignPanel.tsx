"use client";

import type { ReactNode } from "react";
import { Check, RotateCcw } from "lucide-react";
import { Button, cx, inputCls } from "@/components/ui";
import { FONTS } from "@/lib/fonts";
import { designFor } from "@/lib/sample";
import { ACCENTS, getTemplate } from "@/lib/templates";
import type { Design, FontKey } from "@/lib/types";
import { useEditor } from "./context";

function Group({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="border-b border-slate-100 px-4 py-5 sm:px-5">
      <h3 className="mb-3 text-[12px] font-semibold uppercase tracking-wider text-slate-500">{title}</h3>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

function Segmented<T extends string>({ value, options, onChange, testId }: { value: T; options: { v: T; label: string }[]; onChange: (v: T) => void; testId?: string }) {
  return (
    <div className="grid rounded-lg bg-slate-100 p-0.5" style={{ gridTemplateColumns: `repeat(${options.length}, 1fr)` }} data-testid={testId}>
      {options.map((o) => (
        <button key={o.v} type="button" data-value={o.v} onClick={() => onChange(o.v)}
          className={cx("rounded-md px-2 py-1.5 text-[13px] cursor-pointer", value === o.v ? "bg-white font-medium text-ink shadow-sm" : "text-slate-600 hover:text-ink")}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

function Slider({ label, value, min, max, step, format, onChange, testId }: { label: string; value: number; min: number; max: number; step: number; format: (v: number) => string; onChange: (v: number) => void; testId?: string }) {
  return (
    <label className="block">
      <span className="mb-1 flex justify-between text-[13px] text-slate-600"><span>{label}</span><span className="tabular-nums text-slate-500">{format(value)}</span></span>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} className="w-full accent-brand-600" data-testid={testId} />
    </label>
  );
}

export function DesignPanel() {
  const { cv, update } = useEditor();
  const d = cv.design;
  const tpl = getTemplate(d.template);
  const set = <K extends keyof Design>(k: K, v: Design[K], group?: string) => update((x) => { x.design[k] = v; }, group);

  const fontSelect = (k: "fontBody" | "fontHeading", label: string) => (
    <label className="block">
      <span className="mb-1 block text-[13px] text-slate-600">{label}</span>
      <select className={inputCls} value={d[k]} onChange={(e) => set(k, e.target.value as FontKey)} data-testid={k}>
        {(["Sans", "Serif"] as const).map((kind) => (
          <optgroup key={kind} label={kind === "Sans" ? "Sans serif" : "Serif"}>
            {FONTS.filter((f) => f.kind === kind).map((f) => <option key={f.key} value={f.key}>{f.name}</option>)}
          </optgroup>
        ))}
      </select>
    </label>
  );

  return (
    <div>
      <Group title="Colour">
        <div className="grid grid-cols-6 gap-2.5" data-testid="accents">
          {ACCENTS.map((c) => (
            <button key={c} type="button" aria-label={`Colour ${c}`} data-color={c} onClick={() => set("accent", c)}
              className="grid aspect-square place-items-center rounded-full ring-offset-2 transition hover:scale-105 cursor-pointer"
              style={{ background: c, boxShadow: d.accent.toLowerCase() === c ? `0 0 0 2px #fff, 0 0 0 4px ${c}` : undefined }}>
              {d.accent.toLowerCase() === c && <Check className="h-4 w-4 text-white" />}
            </button>
          ))}
        </div>
        <label className="flex items-center gap-3 text-[13px] text-slate-600">
          <input type="color" value={d.accent} onChange={(e) => set("accent", e.target.value, "accent")} className="h-9 w-12 cursor-pointer rounded-md border border-slate-200 bg-white p-1" data-testid="accent-custom" />
          Any colour you like
        </label>
      </Group>

      <Group title="Typography">
        <div className="grid grid-cols-2 gap-3">
          {fontSelect("fontHeading", "Headings")}
          {fontSelect("fontBody", "Body text")}
        </div>
        <Slider label="Text size" value={d.fontScale} min={0.85} max={1.15} step={0.01} format={(v) => `${Math.round(v * 100)}%`} onChange={(v) => set("fontScale", v, "fs")} testId="font-scale" />
        <Slider label="Line spacing" value={d.lineHeight} min={1.2} max={1.8} step={0.05} format={(v) => v.toFixed(2)} onChange={(v) => set("lineHeight", v, "lh")} />
      </Group>

      <Group title="Layout">
        <div>
          <span className="mb-1.5 block text-[13px] text-slate-600">Space between sections</span>
          <Segmented value={d.spacing} onChange={(v) => set("spacing", v)} options={[{ v: "compact", label: "Compact" }, { v: "normal", label: "Normal" }, { v: "relaxed", label: "Relaxed" }]} />
        </div>
        <Slider label="Page margins" value={d.margin} min={20} max={64} step={1} format={(v) => `${Math.round(v * 0.2646)} mm`} onChange={(v) => set("margin", v, "margin")} />
        <div>
          <span className="mb-1.5 block text-[13px] text-slate-600">Paper size</span>
          <Segmented value={d.pageSize} onChange={(v) => set("pageSize", v)} testId="page-size" options={[{ v: "A4", label: "A4 (UK, Europe)" }, { v: "Letter", label: "Letter (US)" }]} />
        </div>
      </Group>

      <Group title="Details">
        <div>
          <span className="mb-1.5 block text-[13px] text-slate-600">Skill and language levels</span>
          <Segmented value={d.skillStyle} onChange={(v) => set("skillStyle", v)} testId="skill-style" options={[{ v: "dots", label: "Dots" }, { v: "bars", label: "Bars" }, { v: "tags", label: "Tags" }, { v: "text", label: "Text" }]} />
        </div>
        <div>
          <span className="mb-1.5 block text-[13px] text-slate-600">Photo</span>
          <Segmented<"off" | Design["photoShape"]>
            value={d.showPhoto ? d.photoShape : "off"}
            onChange={(v) => update((x) => { if (v === "off") x.design.showPhoto = false; else { x.design.showPhoto = true; x.design.photoShape = v; } })}
            testId="photo-shape"
            options={[{ v: "circle", label: "Circle" }, { v: "rounded", label: "Rounded" }, { v: "square", label: "Square" }, { v: "off", label: "Hide" }]}
          />
          {!cv.data.personal.photo && d.showPhoto && <p className="mt-1.5 text-xs text-slate-500">Add a photo under Personal details in Content.</p>}
        </div>
        <label className="flex items-center justify-between text-[13px] text-slate-600">
          Icons next to contact details
          <input type="checkbox" className="h-4 w-4 accent-brand-600" checked={d.showIcons} onChange={(e) => set("showIcons", e.target.checked)} />
        </label>
      </Group>

      <div className="px-4 py-5 sm:px-5">
        <Button onClick={() => update((x) => { x.design = { ...designFor(d.template), pageSize: d.pageSize, showPhoto: d.showPhoto }; })}>
          <RotateCcw className="h-4 w-4" /> Reset to {tpl.name} defaults
        </Button>
      </div>
    </div>
  );
}
