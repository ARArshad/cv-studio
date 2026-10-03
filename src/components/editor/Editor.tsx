"use client";

import Link from "next/link";
import { useCallback, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, ChevronDown, ChevronLeft, ChevronRight, Columns2, Copy, Download, FileJson, LayoutTemplate, ListChecks, Minus, Palette, PanelsTopLeft,
  Bookmark, FileUp, Plus, Redo2, Rows3, ScanSearch, Settings2, Sparkles, Type, Undo2, UserRound, X,
} from "lucide-react";
import { CvDocument, PAGE_PX } from "@/components/cv/CvDocument";
import { EditContext, focusSoon, type Action, type EditApi } from "@/components/cv/edit";
import { byPath, optimize } from "@/lib/optimizer";
import { Toast, cx, download, useToast } from "@/components/ui";
import { exportFile, fileName } from "@/lib/io";
import { SECTION_LABELS } from "@/lib/sample";
import { checkCv } from "@/lib/score";
import { getTemplate } from "@/lib/templates";
import { useHydrated, useLibrary } from "@/lib/store";
import type { Cv, Entry, EntryFields } from "@/lib/types";
import { EditorContext, type Draft } from "./context";
import { AddSectionDrawer, AtsDrawer, ImportDrawer, OptimizerDrawer, PersonalDrawer, PhrasesDrawer, RearrangeDrawer, SavedDrawer, TemplatesDrawer } from "./drawers";
import { DatePicker } from "./DatePicker";
import { PhotoCropper, loadImageFile } from "./PhotoCropper";
import { applyAction, applyPath } from "./ops";
import { FloatingMenu, Popover, Toggle } from "./Popover";
import { FontsPanel, LayoutPanel, PagePanel, ThemesPanel } from "./toolbarPanels";

type DrawerId = "add" | "arrange" | "templates" | "personal" | "phrases" | "optimizer" | "ats" | "import" | "saved";

const TOOLS: ({ id: DrawerId; label: string; icon: ReactNode } | "sep")[] = [
  { id: "ats", label: "ATS checker", icon: <ScanSearch className="h-[18px] w-[18px]" /> },
  { id: "import", label: "Import content", icon: <FileUp className="h-[18px] w-[18px]" /> },
  { id: "templates", label: "Templates", icon: <LayoutTemplate className="h-[18px] w-[18px]" /> },
  { id: "saved", label: "Saved content", icon: <Bookmark className="h-[18px] w-[18px]" /> },
  { id: "optimizer", label: "Optimizer", icon: <ListChecks className="h-[18px] w-[18px]" /> },
  "sep",
  { id: "add", label: "Add section", icon: <Plus className="h-[18px] w-[18px]" /> },
  { id: "arrange", label: "Rearrange", icon: <Rows3 className="h-[18px] w-[18px]" /> },
  { id: "personal", label: "Personal info", icon: <UserRound className="h-[18px] w-[18px]" /> },
  { id: "phrases", label: "Phrases", icon: <Sparkles className="h-[18px] w-[18px]" /> },
];

const DRAWER_TITLES: Record<DrawerId, string> = {
  add: "Add a section", arrange: "Rearrange sections", templates: "Templates", personal: "Personal information",
  phrases: "Ready made phrases", optimizer: "Optimizer", ats: "ATS checker", import: "Import content", saved: "Saved content",
};

export function Editor({ id }: { id: string }) {
  const hydrated = useHydrated();
  const cv = useLibrary((s) => s.cvs[id]);
  const router = useRouter();

  useEffect(() => {
    if (hydrated && !cv) router.replace("/dashboard");
  }, [hydrated, cv, router]);

  if (!hydrated || !cv) {
    return <div className="grid min-h-screen place-items-center bg-[#1c2333] text-sm text-slate-400">Opening your CV…</div>;
  }
  return <EditorInner id={id} />;
}

function EditorInner({ id }: { id: string }) {
  const cv = useLibrary((s) => s.cvs[id])!;
  const canUndo = useLibrary((s) => s.historyFor === id && s.past.length > 0);
  const canRedo = useLibrary((s) => s.historyFor === id && s.future.length > 0);
  const { updateCv, undo, redo, renameCv, startEditing, duplicateCv } = useLibrary.getState();
  const router = useRouter();
  const [drawer, setDrawer] = useState<DrawerId | null>(null);
  const [pages, setPages] = useState(1);
  const [lastPath, setLastPath] = useState<string | null>(null);
  const [entryMenu, setEntryMenu] = useState<{ sid: string; eid: string; anchor: DOMRect } | null>(null);
  const [datePick, setDatePick] = useState<{ sid: string; eid: string; which: "start" | "end"; anchor: DOMRect } | null>(null);
  const [crop, setCrop] = useState<string | null>(null);
  const [optPop, setOptPop] = useState<{ path: string; anchor: DOMRect } | null>(null);
  const [ignored, setIgnored] = useState<Set<string>>(new Set());
  const { addCv } = useLibrary.getState();
  const [toast, showToast] = useToast();
  const photoRef = useRef<HTMLInputElement>(null);

  useEffect(() => { startEditing(id); }, [id, startEditing]);
  useEffect(() => { document.title = `${cv.title} · CV Studio`; }, [cv.title]);

  const update = useCallback((fn: (d: Draft) => void, group?: string) => updateCv(id, fn, group), [id, updateCv]);

  const act = useCallback((a: Action) => {
    if (a.t === "photo") {
      const p = useLibrary.getState().cvs[id]?.data.personal;
      if (p?.photo) setCrop(p.photoSource || p.photo);
      else photoRef.current?.click();
      return;
    }
    if (a.t === "optimizer") { setOptPop({ path: a.path, anchor: a.anchor }); return; }
    if (a.t === "saveEntry") {
      const s = useLibrary.getState().cvs[id]?.data.sections.find((x) => x.id === a.sid);
      const e = s?.entries.find((x) => x.id === a.eid);
      if (s && e) { useLibrary.getState().saveItem({ kind: "entry", entry: e, sectionType: s.type }); showToast("Saved. Find it under Saved content."); }
      return;
    }
    if (a.t === "datePicker") { setDatePick({ sid: a.sid, eid: a.eid, which: a.which, anchor: a.anchor }); return; }
    if (a.t === "entryMenu") { setEntryMenu({ sid: a.sid, eid: a.eid, anchor: a.anchor }); return; }
    if (a.t === "delSection") {
      const s = useLibrary.getState().cvs[id]?.data.sections.find((x) => x.id === a.sid);
      if (s && !confirm(`Delete the ${s.title || "untitled"} section and everything in it?`)) return;
    }
    if (a.t === "hideSection") showToast("Section hidden. Show it again from Rearrange.");
    updateCv(id, (d) => { applyAction(d, a); });
  }, [id, updateCv, showToast]);

  const suggestions = useMemo(() => optimize(cv, pages).filter((x) => !ignored.has(x.id)), [cv, pages, ignored]);
  const issues = useMemo(() => byPath(suggestions), [suggestions]);

  const editApi = useMemo<EditApi>(() => ({
    on: true,
    measure: false,
    set: (path, value) => updateCv(id, (d) => applyPath(d, path, value), "p:" + path),
    act,
    issues,
  }), [id, updateCv, act, issues]);

  const goTo = useCallback((path: string) => {
    if (window.innerWidth < 1024) setDrawer(null);
    const el = document.querySelector<HTMLElement>(`[data-testid=preview] .cv-pages [data-path="${CSS.escape(path)}"]`);
    el?.scrollIntoView({ behavior: "smooth", block: "center" });
    focusSoon(path, "end");
  }, []);

  const ctx = useMemo(() => ({ cv, update, lastPath }), [cv, update, lastPath]);

  /* undo and redo from the keyboard, except while typing (the browser's own undo is better there) */
  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      if (!(e.metaKey || e.ctrlKey) || e.key.toLowerCase() !== "z") return;
      const t = e.target as HTMLElement;
      if (t.closest("input, textarea, select, [contenteditable]")) return;
      e.preventDefault();
      if (e.shiftKey) redo(id); else undo(id);
    };
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [id, undo, redo]);

  const printPdf = () => printCv(cv);

  const issueCount = suggestions.filter((x) => x.level === "fix").length + checkCv(cv, pages).checks.filter((c) => !c.ok).length;

  return (
    <EditorContext.Provider value={ctx}>
      <div className="flex h-screen flex-col bg-[#1c2333] print-reset">
        {/* ---------------- top bar ---------------- */}
        <header className="z-40 flex flex-none items-center gap-2 px-3 py-2.5 no-print sm:px-4">
          <Link href="/dashboard" className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-white/10 px-3 text-sm font-medium text-white hover:bg-white/15" data-testid="back">
            <ArrowLeft className="h-4 w-4" /><span className="hidden md:inline">My CVs</span>
          </Link>
          <TitleInput key={cv.title} value={cv.title} onChange={(v) => renameCv(id, v)} />

          <div className="mx-auto flex items-center gap-0.5 rounded-xl bg-white p-1 shadow-lg">
            <BarBtn label="Undo" disabled={!canUndo} onClick={() => undo(id)} testId="undo"><Undo2 className="h-4 w-4" /></BarBtn>
            <BarBtn label="Redo" disabled={!canRedo} onClick={() => redo(id)} testId="redo"><Redo2 className="h-4 w-4" /></BarBtn>
            <span className="mx-1 h-6 w-px bg-slate-200" />
            <Popover width={340} testId="layout-pop" trigger={(open, toggle) => <BarBtn label="Layout" text active={open} onClick={toggle} testId="tb-layout"><PanelsTopLeft className="h-4 w-4" /></BarBtn>}>{() => <LayoutPanel />}</Popover>
            <Popover width={420} testId="fonts-pop" trigger={(open, toggle) => <BarBtn label="Fonts" text active={open} onClick={toggle} testId="tb-fonts"><Type className="h-4 w-4" /></BarBtn>}>{() => <FontsPanel />}</Popover>
            <Popover width={340} align="center" testId="themes-pop" trigger={(open, toggle) => <BarBtn label="Themes" text active={open} onClick={toggle} testId="tb-themes"><Palette className="h-4 w-4" /></BarBtn>}>{() => <ThemesPanel />}</Popover>
            <Popover width={320} align="right" testId="page-pop" trigger={(open, toggle) => <BarBtn label="Preferences" text active={open} onClick={toggle} testId="tb-page"><Settings2 className="h-4 w-4" /></BarBtn>}>{() => <PagePanel />}</Popover>
          </div>

          <Popover width={260} align="right" trigger={(open, toggle) => (
            <div className="flex overflow-hidden rounded-xl bg-brand-600 shadow-lg">
              <button type="button" onClick={printPdf} className="inline-flex h-10 items-center gap-2 px-4 text-sm font-semibold text-white hover:bg-brand-700 cursor-pointer" data-testid="download-pdf">
                <Download className="h-4 w-4" /><span className="hidden sm:inline">Download PDF</span>
              </button>
              <button type="button" onClick={toggle} aria-label="More download options" className={cx("grid h-10 w-9 place-items-center border-l border-white/20 text-white hover:bg-brand-700 cursor-pointer", open && "bg-brand-700")} data-testid="download-more">
                <ChevronDown className="h-4 w-4" />
              </button>
            </div>
          )}>
            {(close) => (
              <div className="-m-2 space-y-0.5">
                <MenuBtn icon={<Download className="h-4 w-4" />} onClick={() => { close(); printPdf(); }}>PDF</MenuBtn>
                <MenuBtn icon={<FileJson className="h-4 w-4" />} onClick={() => { close(); download(fileName(cv, ".json"), exportFile(cv)); }}>A copy to open later (.json)</MenuBtn>
                <MenuBtn icon={<Copy className="h-4 w-4" />} onClick={() => { close(); const nid = duplicateCv(id); if (nid) { showToast("Opened the copy"); router.push(`/editor/${nid}`); } }}>Duplicate this CV</MenuBtn>
              </div>
            )}
          </Popover>
        </header>

        <div className="relative flex min-h-0 flex-1 print-reset">
          {/* ---------------- tool card ---------------- */}
          <nav className="absolute bottom-3 left-1/2 z-30 flex -translate-x-1/2 gap-1 rounded-2xl bg-white p-1.5 shadow-xl no-print lg:bottom-auto lg:left-4 lg:top-2 lg:translate-x-0 lg:flex-col">
            {TOOLS.map((t, n) => t === "sep" ? <span key={"sep" + n} className="mx-1 my-0.5 w-px bg-slate-200 lg:mx-2 lg:h-px lg:w-auto" /> : (
              <button key={t.id} type="button" onClick={() => setDrawer(drawer === t.id ? null : t.id)} data-tool={t.id} title={t.label}
                className={cx("relative flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-[13px] font-medium cursor-pointer lg:pr-4",
                  drawer === t.id ? "bg-brand-600 text-white" : "text-slate-700 hover:bg-slate-100")}>
                {t.icon}<span className="hidden lg:inline">{t.label}</span>
                {t.id === "optimizer" && issueCount > 0 && (
                  <span className={cx("absolute -right-1 -top-1 grid h-[18px] min-w-[18px] place-items-center rounded-full px-1 text-[10px] font-bold lg:static lg:ml-auto", drawer === "optimizer" ? "bg-white text-brand-700" : "bg-orange-500 text-white")} data-testid="issue-count">{issueCount}</span>
                )}
              </button>
            ))}
          </nav>

          {/* ---------------- drawer ---------------- */}
          {drawer && (
            <aside className="absolute inset-0 z-40 flex flex-col bg-white shadow-2xl no-print lg:inset-auto lg:bottom-4 lg:left-[196px] lg:top-2 lg:w-[400px] lg:rounded-2xl" data-testid="drawer">
              <div className="flex flex-none items-center justify-between border-b border-slate-100 px-5 py-3.5">
                <h2 className="font-semibold">{DRAWER_TITLES[drawer]}</h2>
                <button type="button" onClick={() => setDrawer(null)} aria-label="Close" className="grid h-8 w-8 place-items-center rounded-lg text-slate-500 hover:bg-slate-100 cursor-pointer"><X className="h-4 w-4" /></button>
              </div>
              <div className="min-h-0 flex-1 overflow-y-auto p-5">
                {drawer === "add" && <AddSectionDrawer onDone={() => setDrawer(null)} />}
                {drawer === "arrange" && <RearrangeDrawer />}
                {drawer === "templates" && <TemplatesDrawer />}
                {drawer === "personal" && <PersonalDrawer onPhoto={() => act({ t: "photo" })} />}
                {drawer === "ats" && <AtsDrawer />}
                {drawer === "phrases" && <PhrasesDrawer />}
                {drawer === "optimizer" && <OptimizerDrawer pages={pages} ignored={ignored} onIgnore={(x) => setIgnored((o) => new Set(o).add(x))} onGo={goTo} />}
                {drawer === "import" && <ImportDrawer
                  onReplace={(data) => { update((d) => { d.data = data; }); setDrawer(null); showToast("Imported. Check each section on the page."); }}
                  onNew={(data) => { const nid = addCv({ ...cv, title: data.personal.fullName ? `${data.personal.fullName} (imported)` : "Imported CV", data }); router.push(`/editor/${nid}`); }} />}
                {drawer === "saved" && <SavedDrawer />}
              </div>
            </aside>
          )}

          {/* ---------------- the page ---------------- */}
          <EditContext.Provider value={editApi}>
            <Preview cv={cv} pages={pages} onPages={setPages} onFocusPath={setLastPath} shift={!!drawer} />
          </EditContext.Provider>
        </div>

        {entryMenu && <EntryMenu {...entryMenu} onClose={() => setEntryMenu(null)} />}
        {optPop && (
          <FloatingMenu anchor={optPop.anchor} onClose={() => setOptPop(null)} width={300}>
            <div data-testid="opt-pop" className="space-y-3">
              {(issues.get(optPop.path) ?? []).map((x) => (
                <div key={x.id}>
                  <p className="text-[13.5px] font-semibold">{x.title}</p>
                  <p className="mt-0.5 text-[12.5px] leading-snug text-slate-500">{x.detail}</p>
                  <div className="mt-1.5 flex gap-3">
                    {x.fix && <button type="button" className="text-[12.5px] font-semibold text-brand-600 hover:underline cursor-pointer" data-testid="opt-pop-fix" onClick={() => { update((d) => x.fix!.apply(d)); setOptPop(null); }}>{x.fix.label}</button>}
                    <button type="button" className="text-[12.5px] text-slate-500 hover:text-ink cursor-pointer" onClick={() => setIgnored((o) => new Set(o).add(x.id))}>Ignore</button>
                  </div>
                </div>
              ))}
              {!(issues.get(optPop.path) ?? []).length && <p className="text-[13px] text-emerald-700">All sorted here.</p>}
              <button type="button" className="text-[12.5px] font-medium text-slate-600 hover:text-ink cursor-pointer" onClick={() => { setOptPop(null); setDrawer("optimizer"); }}>See all suggestions</button>
            </div>
          </FloatingMenu>
        )}
        {datePick && (() => {
          const s = cv.data.sections.find((x) => x.id === datePick.sid);
          const e = s?.entries.find((x) => x.id === datePick.eid);
          if (!s || !e) return null;
          const key = datePick.which === "start" ? "startDate" : "endDate";
          const setE = (fn: (x: Entry) => void) => update((d) => { const x = d.data.sections.find((q) => q.id === s.id)?.entries.find((q) => q.id === e.id); if (x) fn(x); });
          return (
            <DatePicker
              key={datePick.sid + datePick.eid + datePick.which}
              anchor={datePick.anchor}
              value={e[key]}
              current={e.current}
              allowCurrent={datePick.which === "end" && !["certificates", "awards", "publications", "honors"].includes(s.type)}
              onChange={(v) => setE((x) => { x[key] = v; if (key === "endDate" && v) x.current = false; })}
              onCurrent={(v) => setE((x) => { x.current = v; })}
              onClose={() => setDatePick(null)}
            />
          );
        })()}
        <PhotoCropper
          open={!!crop}
          src={crop ?? ""}
          shape={cv.design.photoShape}
          onClose={() => setCrop(null)}
          onPickNew={() => photoRef.current?.click()}
          onRemove={() => { update((d) => { d.data.personal.photo = ""; d.data.personal.photoSource = ""; }); setCrop(null); }}
          onSave={(url, source) => { update((d) => { d.data.personal.photo = url; d.data.personal.photoSource = source; d.design.showPhoto = true; }); setCrop(null); }}
        />
        <input ref={photoRef} type="file" accept="image/*" hidden data-testid="photo-file"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) loadImageFile(f, (src) => setCrop(src)); e.target.value = ""; }} />
        <Toast message={toast} />
      </div>
    </EditorContext.Provider>
  );
}

/** print only the CV, at its paper size, with a sensible file name */
function printCv(cv: Cv) {
  (document.activeElement as HTMLElement | null)?.blur?.();
  const size = cv.design.pageSize === "Letter" ? "letter" : "A4";
  let style = document.getElementById("page-size-style");
  if (!style) { style = document.createElement("style"); style.id = "page-size-style"; document.head.appendChild(style); }
  style.textContent = `@page { size: ${size}; margin: 0; }`;
  const old = document.title;
  document.title = cv.data.personal.fullName ? `${cv.data.personal.fullName} CV` : cv.title;
  requestAnimationFrame(() => { window.print(); document.title = old; });
}

function BarBtn({ label, text, active, disabled, onClick, children, testId }: { label: string; text?: boolean; active?: boolean; disabled?: boolean; onClick: () => void; children: ReactNode; testId?: string }) {
  return (
    <button type="button" title={label} aria-label={label} disabled={disabled} onClick={onClick} data-testid={testId}
      className={cx("inline-flex h-9 items-center gap-1.5 rounded-lg px-2.5 text-[13px] font-medium transition cursor-pointer disabled:cursor-default disabled:opacity-30",
        active ? "bg-brand-50 text-brand-700" : "text-slate-700 hover:bg-slate-100")}>
      {children}{text && <span className="hidden md:inline">{label}</span>}
    </button>
  );
}

function MenuBtn({ icon, children, onClick }: { icon: ReactNode; children: ReactNode; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-100 cursor-pointer">
      {icon}{children}
    </button>
  );
}

function TitleInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [v, setV] = useState(value);
  return (
    <input
      value={v}
      onChange={(e) => setV(e.target.value)}
      onBlur={() => onChange(v)}
      onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()}
      aria-label="CV name"
      data-testid="cv-name"
      className="hidden min-w-0 max-w-[14rem] rounded-lg border border-transparent bg-transparent px-2 py-1.5 text-[15px] font-semibold text-white outline-none hover:border-white/20 focus:border-brand-500 sm:block"
    />
  );
}

/** which parts each entry in a section shows, plus "I am still here" */
function EntryMenu({ sid, eid, anchor, onClose }: { sid: string; eid: string; anchor: DOMRect; onClose: () => void }) {
  const ctx = useContext(EditorContext);
  const s = ctx?.cv.data.sections.find((x) => x.id === sid);
  const e = s?.entries.find((x) => x.id === eid);
  if (!ctx || !s || !e) return null;
  const set = (k: keyof EntryFields, v: boolean) => ctx.update((d) => {
    const t = d.data.sections.find((x) => x.id === sid);
    if (!t) return;
    t.fields[k] = v;
    if (k === "bullets" && v) t.entries.forEach((en) => { if (!en.bullets.length) en.bullets.push(""); });
  });
  const labels: Record<keyof EntryFields, string> = { subtitle: "Organisation", location: "Location", dates: "Dates", description: "Description", bullets: "Bullet points" };
  return (
    <FloatingMenu anchor={anchor} onClose={onClose} width={250}>
      <p className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-slate-500">Show in {s.title || SECTION_LABELS[s.type].title}</p>
      <div data-testid="entry-menu">
        {(Object.keys(labels) as (keyof EntryFields)[]).map((k) => (
          <Toggle key={k} label={labels[k]} checked={s.fields[k]} onChange={(v) => set(k, v)} testId={`field-${k}`} />
        ))}
      </div>
      {s.fields.dates && (
        <div className="mt-2 border-t border-slate-100 pt-2">
          <Toggle label="I am still here (shows Present)" checked={e.current} testId="field-current"
            onChange={(v) => ctx.update((d) => { const x = d.data.sections.find((q) => q.id === sid)?.entries.find((q) => q.id === eid); if (x) x.current = v; })} />
        </div>
      )}
    </FloatingMenu>
  );
}

/** move the split between the two columns, like a ruler */
function Balancer({ cv }: { cv: Cv }) {
  const ctx = useContext(EditorContext);
  const tpl = getTemplate(cv.design.template);
  const layout = cv.design.layout ?? tpl.layout;
  if (layout === "single" || !ctx) return null;
  const w = Math.round((cv.design.sideWidth ?? tpl.sideWidth) * 100);
  const set = (v: number) => ctx.update((d) => { d.design.sideWidth = Math.min(46, Math.max(24, v)) / 100; }, "sidew");
  const dir = layout === "left" ? 1 : -1;
  return (
    <div className="flex items-center gap-0.5 rounded-full bg-white/95 p-0.5 shadow" data-testid="balancer" title="Move the column split">
      <button type="button" aria-label="Move split left" onClick={() => set(w - 2 * dir)} className="grid h-7 w-7 place-items-center rounded-full text-slate-600 hover:bg-slate-100 cursor-pointer"><ChevronLeft className="h-3.5 w-3.5" /></button>
      <span className="flex items-center gap-1 px-1 text-xs font-medium tabular-nums text-slate-700"><Columns2 className="h-3.5 w-3.5" />{layout === "left" ? `${w}/${100 - w}` : `${100 - w}/${w}`}</span>
      <button type="button" aria-label="Move split right" onClick={() => set(w + 2 * dir)} className="grid h-7 w-7 place-items-center rounded-full text-slate-600 hover:bg-slate-100 cursor-pointer"><ChevronRight className="h-3.5 w-3.5" /></button>
    </div>
  );
}

function Preview({ cv, pages, onPages, onFocusPath, shift }: { cv: Cv; pages: number; onPages: (n: number) => void; onFocusPath: (p: string) => void; shift: boolean }) {
  const box = useRef<HTMLDivElement>(null);
  const [fit, setFit] = useState(0.8);
  const [zoom, setZoom] = useState<number | "fit">("fit");
  const page = PAGE_PX[cv.design.pageSize] ?? PAGE_PX.A4;

  useLayoutEffect(() => {
    const el = box.current;
    if (!el) return;
    const measure = () => {
      const wide = window.innerWidth >= 1024;
      const room = el.clientWidth - (wide ? 440 : 24);
      setFit(Math.min(1, Math.max(0.3, room / page.w)));
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [page.w]);

  const scale = zoom === "fit" ? fit : zoom;
  const step = (dir: 1 | -1) => setZoom(Math.round(Math.min(1.6, Math.max(0.4, scale + dir * 0.1)) * 10) / 10);
  const totalH = pages * page.h + (pages - 1) * 28;

  return (
    <section
      ref={box}
      className="relative min-w-0 flex-1 overflow-auto print-area"
      data-testid="preview"
      onFocus={(e) => { const p = (e.target as HTMLElement).dataset?.path; if (p) onFocusPath(p); }}
    >
      <div className={cx("flex justify-center px-3 pb-28 pt-3 transition-[padding] print-flat lg:pb-20", shift && "lg:pl-[420px]")}>
        <div className="preview-scale paper-shadow" style={{ width: page.w * scale, height: totalH * scale }}>
          <div style={{ width: page.w, transform: `scale(${scale})`, transformOrigin: "top left" }} className="preview-scale">
            <CvDocument cv={cv} onPageCount={onPages} />
          </div>
        </div>
      </div>
      <div className="fixed bottom-4 right-4 z-30 flex items-center gap-2 no-print max-lg:bottom-20">
        <Balancer cv={cv} />
        <span className="rounded-full bg-white/95 px-3 py-1.5 text-xs font-medium text-slate-700 shadow" data-testid="page-count">{pages} page{pages > 1 ? "s" : ""}</span>
        <div className="flex items-center gap-0.5 rounded-full bg-white/95 p-0.5 shadow">
          <button type="button" aria-label="Zoom out" onClick={() => step(-1)} className="grid h-7 w-7 place-items-center rounded-full text-slate-600 hover:bg-slate-100 cursor-pointer"><Minus className="h-3.5 w-3.5" /></button>
          <button type="button" onClick={() => setZoom("fit")} className="min-w-11 text-xs font-medium tabular-nums text-slate-700 cursor-pointer" title="Fit">{Math.round(scale * 100)}%</button>
          <button type="button" aria-label="Zoom in" onClick={() => step(1)} className="grid h-7 w-7 place-items-center rounded-full text-slate-600 hover:bg-slate-100 cursor-pointer"><Plus className="h-3.5 w-3.5" /></button>
        </div>
      </div>
    </section>
  );
}
