"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  Check,
  ChevronDown,
  FileText,
  LayoutTemplate,
  Pencil,
  RotateCcw,
  ShieldCheck,
} from "lucide-react";
import { CvThumb } from "@/components/cv/CvThumb";
import { useTemplateSamples } from "@/components/NewCvDialog";
import type { TemplateId } from "@/lib/types";
import { escapeHtml } from "@/lib/rich";

const designs: { id: TemplateId; name: string; colour: string }[] = [
  { id: "signature", name: "Signature", colour: "#147d76" },
  { id: "boardroom", name: "Boardroom", colour: "#172b3a" },
  { id: "clarity", name: "Clarity", colour: "#334155" },
];
export function BuilderShowcase() {
  const samples = useTemplateSamples();
  const [design, setDesign] = useState<TemplateId>("signature");
  const [tab, setTab] = useState("Design");
  const [name, setName] = useState("Alex Morgan");
  const [role, setRole] = useState("Senior Product Marketing Manager");
  const [bullet, setBullet] = useState(
    "Led go-to-market strategy for a product launch across three markets.",
  );
  const [colour, setColour] = useState("#147d76");
  const cv = useMemo(() => {
    const original = samples[design];
    const content = samples.signature.data;
    const firstExperience = content.sections.find(
      (section) => section.type === "experience",
    )?.entries[0]?.id;
    return {
      ...original,
      design: { ...original.design, accent: colour },
      data: {
        ...content,
        personal: { ...content.personal, fullName: name, jobTitle: role },
        sections: content.sections.map((section) => ({
          ...section,
          entries: section.entries.map((entry) => {
            if (section.type !== "experience" || entry.id !== firstExperience)
              return entry;
            return {
              ...entry,
              bullets: [escapeHtml(bullet), ...entry.bullets.slice(1)],
            };
          }),
        })),
      },
    };
  }, [samples, design, name, role, bullet, colour]);
  return (
    <div className="showcase-shell" data-testid="builder-showcase">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#e3e9ea] bg-white px-5 py-4 sm:px-7">
        <div className="flex items-center gap-3 text-sm font-semibold">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-[#e9f5ef] text-brand-700">
            <FileText size={17} />
          </span>{" "}
          My next chapter{" "}
          <span className="hidden rounded-full bg-[#f0f7f2] px-2 py-1 text-[10px] font-medium text-brand-700 sm:inline-flex">
            <Check size={12} className="mr-1" /> Example preview
          </span>
        </div>
        <Link
          href={`/dashboard?new=1&template=${design}`}
          className="inline-flex items-center gap-2 rounded-lg bg-[#153f38] px-3 py-2 text-xs font-semibold text-white"
        >
          Open full builder <ArrowUpRight size={14} />
        </Link>
      </div>
      <div className="grid md:grid-cols-[290px_1fr] lg:grid-cols-[340px_1fr]">
        <div className="border-b border-[#e3e9ea] bg-white p-5 text-left md:border-b-0 md:border-r sm:p-7">
          <p className="text-[10px] font-semibold uppercase tracking-[.16em] text-slate-400">
            Try it for yourself
          </p>
          <h2 className="mt-2 text-xl font-semibold tracking-tight">
            Small edits. Big difference.
          </h2>
          <div
            className="mt-6 flex gap-1 rounded-lg bg-slate-100 p-1"
            role="tablist"
            aria-label="Preview editing tools"
          >
            {["Design", "Profile", "Experience"].map((t) => (
              <button
                key={t}
                role="tab"
                id={`demo-tab-${t}`}
                aria-controls={`demo-panel-${t}`}
                aria-selected={tab === t}
                tabIndex={tab === t ? 0 : -1}
                onClick={() => setTab(t)}
                onKeyDown={(event) => {
                  const tabs = ["Design", "Profile", "Experience"];
                  const index = tabs.indexOf(t);
                  const next =
                    event.key === "ArrowRight"
                      ? (index + 1) % 3
                      : event.key === "ArrowLeft"
                        ? (index + 2) % 3
                        : event.key === "Home"
                          ? 0
                          : event.key === "End"
                            ? 2
                            : -1;
                  if (next < 0) return;
                  event.preventDefault();
                  setTab(tabs[next]);
                  document.getElementById(`demo-tab-${tabs[next]}`)?.focus();
                }}
                className={`min-w-0 flex-1 cursor-pointer rounded-md px-2 py-2 text-[11px] font-semibold ${tab === t ? "bg-white text-brand-700 shadow-sm" : "text-slate-500"}`}
              >
                {t}
              </button>
            ))}
          </div>
          <div
            className="mt-6 min-h-[270px]"
            role="tabpanel"
            id={`demo-panel-${tab}`}
            aria-labelledby={`demo-tab-${tab}`}
          >
            {tab === "Design" ? (
              <>
                <p className="mb-3 text-xs font-medium text-slate-600">
                  Choose a layout
                </p>
                <div className="grid gap-2">
                  {designs.map((d) => (
                    <button
                      key={d.id}
                      aria-pressed={design === d.id}
                      onClick={() => {
                        setDesign(d.id);
                        setColour(d.colour);
                      }}
                      className={`flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 text-left text-xs ${design === d.id ? "border-brand-500 bg-brand-50" : "border-slate-200 bg-white"}`}
                    >
                      <span
                        className="grid h-9 w-7 place-items-center rounded border border-slate-200 bg-white"
                        style={{ color: d.colour }}
                      >
                        <LayoutTemplate size={18} />
                      </span>
                      <span className="flex-1 font-semibold">{d.name}</span>
                      {design === d.id ? (
                        <Check size={15} className="text-brand-600" />
                      ) : (
                        <ChevronDown
                          size={14}
                          className="-rotate-90 text-slate-300"
                        />
                      )}
                    </button>
                  ))}
                </div>
                <p className="mb-3 mt-5 text-xs font-medium text-slate-600">
                  Add your colour
                </p>
                <div className="flex gap-3">
                  {["#147d76", "#3154a0", "#a74726", "#6352a3", "#334155"].map(
                    (c) => (
                      <button
                        key={c}
                        aria-label={`Preview colour ${c}`}
                        aria-pressed={colour === c}
                        onClick={() => setColour(c)}
                        style={{ background: c }}
                        className="grid h-7 w-7 cursor-pointer place-items-center rounded-full ring-2 ring-white ring-offset-1"
                      >
                        {colour === c && <Check size={14} color="white" />}
                      </button>
                    ),
                  )}
                </div>
              </>
            ) : tab === "Profile" ? (
              <div className="space-y-4">
                <label className="block text-xs font-medium text-slate-600">
                  Your name
                  <input
                    aria-label="Preview name"
                    maxLength={65}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="mt-2 w-full rounded-lg border border-slate-200 p-3 text-sm"
                  />
                </label>
                <label className="block text-xs font-medium text-slate-600">
                  Professional title
                  <input
                    aria-label="Preview professional title"
                    maxLength={100}
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="mt-2 w-full rounded-lg border border-slate-200 p-3 text-sm"
                  />
                </label>
                <p className="text-xs leading-5 text-slate-400">
                  See how your details feel on the page. These are temporary
                  preview edits.
                </p>
              </div>
            ) : (
              <div>
                <label className="block text-xs font-medium text-slate-600">
                  An achievement to be proud of
                  <textarea
                    aria-label="Preview achievement"
                    maxLength={220}
                    value={bullet}
                    onChange={(e) => setBullet(e.target.value)}
                    className="mt-2 min-h-32 w-full rounded-lg border border-slate-200 p-3 text-sm leading-6"
                  />
                </label>
                <p className="mt-3 text-xs leading-5 text-slate-400">
                  Start with what you did, then add the difference it made. The
                  first experience bullet updates live.
                </p>
              </div>
            )}
          </div>
          <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-5">
            <span className="flex items-center gap-1.5 text-[10px] text-slate-400">
              <ShieldCheck size={13} /> Private by design
            </span>
            <button
              onClick={() => {
                setName("Alex Morgan");
                setRole("Senior Product Marketing Manager");
                setBullet(
                  "Led go-to-market strategy for a product launch across three markets.",
                );
                setDesign("signature");
                setColour("#147d76");
              }}
              aria-label="Reset example preview"
              className="cursor-pointer text-slate-400 hover:text-brand-700"
            >
              <RotateCcw size={14} />
            </button>
          </div>
        </div>
        <div className="relative flex min-w-0 flex-col items-center overflow-hidden bg-[#edf1f1] px-7 pb-7 pt-5 sm:px-12">
          <div className="mb-4 flex w-full max-w-[365px] items-center justify-between text-[10px] font-medium text-slate-400">
            <span className="flex items-center gap-1.5">
              <Pencil size={11} /> Live document preview
            </span>
            <span>A4 · Page 1</span>
          </div>
          <div
            className="w-full max-w-[365px] overflow-hidden rounded-sm bg-white shadow-[0_10px_40px_#153c3420]"
            data-testid="showcase-document"
          >
            <CvThumb cv={cv} />
          </div>
        </div>
      </div>
    </div>
  );
}
