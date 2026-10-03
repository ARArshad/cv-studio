"use client";

import type React from "react";
import { Check, PanelLeft, PanelRight, RotateCcw, Square } from "lucide-react";
import { cx } from "@/components/ui";
import { FONTS } from "@/lib/fonts";
import { designFor } from "@/lib/sample";
import { THEMES, getTemplate } from "@/lib/templates";
import { inputCls } from "@/components/ui";
import { SECTION_LABELS } from "@/lib/sample";
import type { Backdrop, Country, Design, FontKey, Layout, SectionType } from "@/lib/types";
import { useEditor } from "./context";
import { PanelLabel, Seg, Slider, Toggle } from "./Popover";

function useDesign() {
  const { cv, update } = useEditor();
  const set = <K extends keyof Design>(k: K, v: Design[K], group?: string) => update((x) => { x.design[k] = v; }, group);
  return { d: cv.design, set, update, cv };
}

/* ---------------- Layout ---------------- */

export function LayoutPanel() {
  const { d, set, update } = useDesign();
  const tpl = getTemplate(d.template);
  const layout = d.layout ?? tpl.layout;
  const side = d.sideWidth ?? (tpl.layout === "single" ? 0.34 : tpl.sideWidth);
  const options: { v: Layout; label: string; icon: React.ReactNode }[] = [
    { v: "single", label: "One column", icon: <Square className="h-5 w-5" /> },
    { v: "left", label: "Sidebar left", icon: <PanelLeft className="h-5 w-5" /> },
    { v: "right", label: "Sidebar right", icon: <PanelRight className="h-5 w-5" /> },
  ];
  return (
    <div data-testid="layout-panel">
      <PanelLabel>Columns</PanelLabel>
      <div className="grid grid-cols-3 gap-2">
        {options.map((o) => (
          <button key={o.v} type="button" data-layout={o.v}
            onClick={() => update((x) => { x.design.layout = o.v === tpl.layout ? null : o.v; })}
            className={cx("flex flex-col items-center gap-1.5 rounded-xl border-2 px-2 py-3 text-xs cursor-pointer", layout === o.v ? "border-brand-500 bg-brand-50 text-brand-700" : "border-slate-200 text-slate-600 hover:border-slate-300")}>
            {o.icon}{o.label}
          </button>
        ))}
      </div>
      {layout !== "single" && (
        <div className="mt-4">
          <Slider label="Sidebar width" value={Math.round(side * 100)} min={24} max={46} step={1} format={(v) => `${v}%`} onChange={(v) => set("sideWidth", v / 100, "sidew")} testId="side-width" />
          <p className="-mt-1 text-xs text-slate-500">Use the arrows on each section heading to move it between columns.</p>
        </div>
      )}
      <PanelLabel>Section arrangement</PanelLabel>
      <div className="grid grid-cols-3 gap-2" data-testid="presets">
        {PRESETS.map((pr) => (
          <button key={pr.id} type="button" data-preset={pr.id} title={pr.name}
            onClick={() => update((x) => {
              const rank = (t: string) => { const i = pr.order.indexOf(t as never); return i < 0 ? 50 : i; };
              x.data.sections = [...x.data.sections].sort((a, b) => rank(a.type) - rank(b.type));
              x.data.sections.forEach((sec) => { sec.column = pr.side.includes(sec.type) ? "side" : "main"; });
            })}
            className="rounded-xl border-2 border-slate-200 p-1.5 text-left hover:border-brand-500 cursor-pointer">
            <PresetDiagram main={pr.order.filter((t) => !pr.side.includes(t)).slice(0, 4)} side={layout === "single" ? [] : pr.side.slice(0, 4)} left={layout === "left"} />
            <span className="mt-1 block text-center text-[11px] text-slate-600">{pr.name}</span>
          </button>
        ))}
      </div>
      <PanelLabel>Header</PanelLabel>
      <Toggle label="Show photo" checked={d.showPhoto} onChange={(v) => set("showPhoto", v)} testId="toggle-photo" />
      <Toggle label="Show job title" checked={d.showTitle} onChange={(v) => set("showTitle", v)} />
      <Toggle label="Summary in the header" checked={d.summaryInHeader ?? !!tpl.summaryInHeader} onChange={(v) => set("summaryInHeader", v)} testId="toggle-summary-header" />
      <Toggle label="Icons beside contact details" checked={d.showIcons} onChange={(v) => set("showIcons", v)} />
      <Toggle label="Icons beside section headings" checked={d.headingIcons} onChange={(v) => set("headingIcons", v)} testId="toggle-heading-icons" />
      <PanelLabel>Footer</PanelLabel>
      <Toggle label="Page numbers" checked={!!d.pageNumbers} onChange={(v) => set("pageNumbers", v)} testId="toggle-page-numbers" />
      <Toggle label="Your name on later pages" checked={!!d.nameOnPages} onChange={(v) => set("nameOnPages", v)} />
      {d.showPhoto && (
        <>
          <PanelLabel>Photo shape</PanelLabel>
          <Seg value={d.photoShape} onChange={(v) => set("photoShape", v)} testId="photo-shape"
            options={[{ v: "circle", label: "Circle" }, { v: "rounded", label: "Rounded" }, { v: "square", label: "Square" }]} />
        </>
      )}
    </div>
  );
}

const PRESETS: { id: string; name: string; order: SectionType[]; side: SectionType[] }[] = [
  { id: "experience", name: "Experience first", order: ["summary", "experience", "education", "projects", "awards", "volunteering", "skills", "softSkills", "certificates", "languages", "interests"], side: ["skills", "softSkills", "certificates", "languages", "interests", "references"] },
  { id: "skills", name: "Skills first", order: ["summary", "skills", "strengths", "experience", "projects", "education", "certificates", "languages", "interests"], side: ["skills", "strengths", "certificates", "languages", "interests"] },
  { id: "education", name: "Education first", order: ["summary", "education", "projects", "experience", "volunteering", "skills", "languages", "interests"], side: ["skills", "languages", "interests", "certificates"] },
  { id: "balanced", name: "Balanced", order: ["summary", "experience", "projects", "education", "certificates", "skills", "languages", "awards", "interests"], side: ["education", "certificates", "skills", "languages", "awards", "interests"] },
  { id: "achievements", name: "Results first", order: ["summary", "awards", "experience", "skills", "education", "certificates", "languages"], side: ["skills", "education", "certificates", "languages"] },
  { id: "main", name: "All in main", order: ["summary", "experience", "education", "projects", "skills", "certificates", "languages", "interests"], side: [] },
];

function PresetDiagram({ main, side, left }: { main: SectionType[]; side: SectionType[]; left: boolean }) {
  const col = (list: SectionType[], w: string) => (
    <div className="flex flex-col gap-0.5" style={{ width: w }}>
      {list.map((t, i) => <span key={t + i} className="block truncate rounded-[3px] bg-slate-200 px-1 py-[3px] text-[8px] leading-none text-slate-600">{SECTION_LABELS[t].title}</span>)}
    </div>
  );
  return (
    <div className={cx("flex gap-1 rounded-md bg-slate-50 p-1", left && "flex-row-reverse")}>
      {col(main, side.length ? "62%" : "100%")}
      {side.length > 0 && col(side, "38%")}
    </div>
  );
}

/* ---------------- Fonts ---------------- */

export function FontsPanel() {
  const { d, set } = useDesign();
  const list = (k: "fontHeading" | "fontBody") => (
    <div className="max-h-56 space-y-0.5 overflow-y-auto rounded-xl border border-slate-200 p-1" data-testid={k}>
      {FONTS.map((f) => (
        <button key={f.key} type="button" data-font={f.key} onClick={() => set(k, f.key as FontKey)}
          className={cx("flex w-full items-center justify-between rounded-lg px-3 py-1.5 text-left cursor-pointer", d[k] === f.key ? "bg-brand-50 text-brand-700" : "hover:bg-slate-50")}
          style={{ fontFamily: f.css }}>
          <span className="text-[15px]">{f.name}</span>
          {d[k] === f.key ? <Check className="h-4 w-4" /> : <span className="text-[11px] text-slate-400" style={{ fontFamily: "inherit" }}>{f.kind}</span>}
        </button>
      ))}
    </div>
  );
  return (
    <div data-testid="fonts-panel">
      <div className="grid grid-cols-2 gap-3">
        <div><PanelLabel>Headings</PanelLabel>{list("fontHeading")}</div>
        <div><PanelLabel>Body text</PanelLabel>{list("fontBody")}</div>
      </div>
      <PanelLabel>Size and spacing</PanelLabel>
      <Slider label="Text size" value={d.fontScale} min={0.85} max={1.15} step={0.01} format={(v) => `${Math.round(v * 100)}%`} onChange={(v) => set("fontScale", v, "fs")} testId="font-scale" />
      <Slider label="Line spacing" value={d.lineHeight} min={1.2} max={1.8} step={0.05} format={(v) => v.toFixed(2)} onChange={(v) => set("lineHeight", v, "lh")} />
      <Slider label="Word spacing" value={d.wordSpacing ?? 0} min={-0.05} max={0.25} step={0.01} format={(v) => (v >= 0 ? "+" : "") + v.toFixed(2)} onChange={(v) => set("wordSpacing", v, "ws")} testId="word-spacing" />
      <Slider label="Letter spacing" value={d.letterSpacing} min={-0.02} max={0.06} step={0.005} format={(v) => (v >= 0 ? "+" : "") + v.toFixed(3)} onChange={(v) => set("letterSpacing", v, "ls")} />
    </div>
  );
}

/* ---------------- Themes ---------------- */

const BACKDROPS: { v: Backdrop; label: string }[] = [
  { v: "none", label: "Plain" }, { v: "dots", label: "Dots" }, { v: "grid", label: "Grid" },
  { v: "lines", label: "Lines" }, { v: "corner", label: "Circles" }, { v: "wave", label: "Wave" },
];

export function ThemesPanel() {
  const { d, update, set } = useDesign();
  return (
    <div data-testid="themes-panel">
      <PanelLabel>Colour themes</PanelLabel>
      <div className="grid grid-cols-4 gap-2.5">
        {THEMES.map((t) => {
          const on = d.accent.toLowerCase() === t.accent && d.accent2.toLowerCase() === t.accent2;
          return (
            <button key={t.name} type="button" title={t.name} data-theme={t.name}
              onClick={() => update((x) => { x.design.accent = t.accent; x.design.accent2 = t.accent2; })}
              className={cx("group flex flex-col items-center gap-1 rounded-xl p-1.5 cursor-pointer", on ? "bg-brand-50 ring-2 ring-brand-500" : "hover:bg-slate-50")}>
              <span className="relative block h-9 w-9 overflow-hidden rounded-full ring-1 ring-slate-200">
                <span className="absolute inset-0" style={{ background: t.accent2 }} />
                <span className="absolute inset-y-0 left-0 w-1/2" style={{ background: t.accent }} />
              </span>
              <span className="text-[11px] text-slate-600">{t.name}</span>
            </button>
          );
        })}
      </div>
      <PanelLabel>Your own colours</PanelLabel>
      <div className="grid grid-cols-2 gap-3">
        <label className="flex items-center gap-2 text-[13px] text-slate-600">
          <input type="color" value={d.accent} onChange={(e) => set("accent", e.target.value, "accent")} className="h-9 w-11 cursor-pointer rounded-md border border-slate-200 bg-white p-1" data-testid="accent-custom" />
          Main
        </label>
        <label className="flex items-center gap-2 text-[13px] text-slate-600">
          <input type="color" value={d.accent2} onChange={(e) => set("accent2", e.target.value, "accent2")} className="h-9 w-11 cursor-pointer rounded-md border border-slate-200 bg-white p-1" data-testid="accent2-custom" />
          Second
        </label>
      </div>
      <PanelLabel>Background</PanelLabel>
      <div className="grid grid-cols-3 gap-2" data-testid="backdrops">
        {BACKDROPS.map((b) => (
          <button key={b.v} type="button" data-backdrop={b.v} onClick={() => set("backdrop", b.v)}
            className={cx("rounded-lg border-2 px-2 py-2 text-xs cursor-pointer", d.backdrop === b.v ? "border-brand-500 bg-brand-50 text-brand-700" : "border-slate-200 text-slate-600 hover:border-slate-300")}>
            {b.label}
          </button>
        ))}
      </div>
    </div>
  );
}

/* ---------------- Page ---------------- */

const COUNTRIES: { v: Country; label: string }[] = [
  { v: "uk", label: "United Kingdom" }, { v: "us", label: "United States" }, { v: "ca", label: "Canada" }, { v: "au", label: "Australia" },
  { v: "ie", label: "Ireland" }, { v: "de", label: "Germany" }, { v: "fr", label: "France" }, { v: "nl", label: "Netherlands" },
  { v: "in", label: "India" }, { v: "pk", label: "Pakistan" }, { v: "ae", label: "United Arab Emirates" }, { v: "other", label: "Somewhere else" },
];

export function PagePanel() {
  const { d, set, update } = useDesign();
  const tpl = getTemplate(d.template);
  return (
    <div data-testid="page-panel">
      <PanelLabel>Applying in</PanelLabel>
      <select className={inputCls} value={d.country ?? "uk"} data-testid="country"
        onChange={(e) => {
          const v = e.target.value as Country;
          update((x) => { x.design.country = v; if (v === "us" || v === "ca") x.design.pageSize = "Letter"; else if (x.design.pageSize === "Letter") x.design.pageSize = "A4"; });
        }}>
        {COUNTRIES.map((c) => <option key={c.v} value={c.v}>{c.label}</option>)}
      </select>
      <PanelLabel>Experience level</PanelLabel>
      <Seg value={d.level ?? "mid"} onChange={(v) => set("level", v)} testId="level"
        options={[{ v: "student", label: "Student" }, { v: "entry", label: "Entry" }, { v: "mid", label: "Mid" }, { v: "senior", label: "Senior" }, { v: "executive", label: "Exec" }]} />
      <p className="mt-1.5 text-xs text-slate-500">These tune the Optimizer&apos;s advice on photos, personal details, paper and length.</p>
      <PanelLabel>Paper size</PanelLabel>
      <Seg value={d.pageSize} onChange={(v) => set("pageSize", v)} testId="page-size" options={[{ v: "A4", label: "A4 (UK, Europe)" }, { v: "Letter", label: "Letter (US)" }]} />
      <PanelLabel>Spacing</PanelLabel>
      <Seg value={d.spacing} onChange={(v) => set("spacing", v)} options={[{ v: "compact", label: "Compact" }, { v: "normal", label: "Normal" }, { v: "relaxed", label: "Relaxed" }]} />
      <div className="mt-3">
        <Slider label="Page margins" value={d.margin} min={20} max={64} step={1} format={(v) => `${Math.round(v * 0.2646)} mm`} onChange={(v) => set("margin", v, "margin")} />
      </div>
      <PanelLabel>Dates</PanelLabel>
      <Seg value={d.dateFormat ?? "mon yyyy"} onChange={(v) => set("dateFormat", v)} testId="date-format"
        options={[{ v: "mm/yyyy", label: "03/2021" }, { v: "mon yyyy", label: "Mar 2021" }, { v: "month yyyy", label: "March 2021" }, { v: "yyyy", label: "2021" }]} />
      <PanelLabel>Skill and language levels</PanelLabel>
      <Seg value={d.skillStyle} onChange={(v) => set("skillStyle", v)} testId="skill-style"
        options={[{ v: "dots", label: "Dots" }, { v: "bars", label: "Bars" }, { v: "blocks", label: "Blocks" }]} />
      <div className="mt-1.5">
        <Seg value={d.skillStyle} onChange={(v) => set("skillStyle", v)} testId="skill-style-2"
          options={[{ v: "rings", label: "Rings" }, { v: "tags", label: "Tags" }, { v: "text", label: "Text" }]} />
      </div>
      <button type="button" className="mt-5 inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-[13px] text-slate-700 hover:bg-slate-50 cursor-pointer"
        onClick={() => update((x) => { x.design = { ...designFor(d.template), pageSize: d.pageSize, country: d.country, level: d.level, dateFormat: d.dateFormat }; })}>
        <RotateCcw className="h-4 w-4" /> Reset design to {tpl.name}
      </button>
    </div>
  );
}

