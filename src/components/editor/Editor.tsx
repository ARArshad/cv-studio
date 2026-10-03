"use client";

import Link from "next/link";
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, CheckCircle2, Circle, Copy, Download, Eye, FileJson, Minus, MoreHorizontal, PenLine, Plus, Redo2, Undo2,
} from "lucide-react";
import { CvDocument, PAGE_PX } from "@/components/cv/CvDocument";
import { Button, IconButton, Menu, MenuItem, Toast, cx, download, useToast } from "@/components/ui";
import { exportFile, fileName } from "@/lib/io";
import { checkCv } from "@/lib/score";
import { useHydrated, useLibrary } from "@/lib/store";
import { ContentPanel } from "./ContentPanel";
import { EditorContext, type Draft } from "./context";
import { DesignPanel } from "./DesignPanel";
import { TemplatePanel } from "./TemplatePanel";

type Tab = "content" | "design" | "templates";

export function Editor({ id }: { id: string }) {
  const hydrated = useHydrated();
  const cv = useLibrary((s) => s.cvs[id]);
  const router = useRouter();

  useEffect(() => {
    if (hydrated && !cv) router.replace("/dashboard");
  }, [hydrated, cv, router]);

  if (!hydrated || !cv) {
    return <div className="grid min-h-screen place-items-center text-sm text-slate-500">Opening your CV…</div>;
  }
  return <EditorInner id={id} />;
}

function EditorInner({ id }: { id: string }) {
  const cv = useLibrary((s) => s.cvs[id])!;
  const canUndo = useLibrary((s) => s.historyFor === id && s.past.length > 0);
  const canRedo = useLibrary((s) => s.historyFor === id && s.future.length > 0);
  const { updateCv, undo, redo, renameCv, startEditing, duplicateCv } = useLibrary.getState();
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("content");
  const [openSection, setOpenSection] = useState<string | null>(null);
  const [pages, setPages] = useState(1);
  const [mobilePreview, setMobilePreview] = useState(false);
  const [toast, showToast] = useToast();

  useEffect(() => { startEditing(id); }, [id, startEditing]);
  useEffect(() => { document.title = `${cv.title} · CV Studio`; }, [cv.title]);

  const update = useCallback((fn: (d: Draft) => void, group?: string) => updateCv(id, fn, group), [id, updateCv]);
  const ctx = useMemo(() => ({ cv, update, openSection, setOpenSection }), [cv, update, openSection]);

  /* Cmd Z and Shift Cmd Z, except while typing in a field (the browser's own undo is better there) */
  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      if (!(e.metaKey || e.ctrlKey) || e.key.toLowerCase() !== "z") return;
      const t = e.target as HTMLElement;
      if (t.closest("input, textarea, select")) return;
      e.preventDefault();
      if (e.shiftKey) redo(id); else undo(id);
    };
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [id, undo, redo]);

  const printPdf = () => {
    const size = cv.design.pageSize === "Letter" ? "letter" : "A4";
    let style = document.getElementById("page-size-style");
    if (!style) { style = document.createElement("style"); style.id = "page-size-style"; document.head.appendChild(style); }
    style.textContent = `@page { size: ${size}; margin: 0; }`;
    const old = document.title;
    document.title = cv.data.personal.fullName ? `${cv.data.personal.fullName} CV` : cv.title;
    setMobilePreview(true);
    requestAnimationFrame(() => {
      window.print();
      document.title = old;
    });
  };

  const { score, checks } = useMemo(() => checkCv(cv, pages), [cv, pages]);

  const selectSection = useCallback((sid: string) => {
    setTab("content");
    setOpenSection(sid);
    setMobilePreview(false);
  }, []);

  return (
    <EditorContext.Provider value={ctx}>
      <div className="flex h-screen flex-col print-reset">
        {/* ---------------- top bar ---------------- */}
        <header className="flex h-14 flex-none items-center gap-2 border-b border-slate-200 bg-white px-3 sm:px-4 no-print">
          <Link href="/dashboard" className="inline-flex h-9 items-center gap-1.5 rounded-lg px-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-ink" data-testid="back">
            <ArrowLeft className="h-4 w-4" /><span className="hidden sm:inline">My CVs</span>
          </Link>
          <div className="mx-1 h-6 w-px bg-slate-200" />
          <TitleInput key={cv.title} value={cv.title} onChange={(v) => renameCv(id, v)} />
          <span className="hidden text-xs text-slate-400 md:inline" data-testid="saved">Saved</span>
          <span className="flex-1" />
          <IconButton label="Undo" disabled={!canUndo} onClick={() => undo(id)} data-testid="undo"><Undo2 className="h-4 w-4" /></IconButton>
          <IconButton label="Redo" disabled={!canRedo} onClick={() => redo(id)} data-testid="redo"><Redo2 className="h-4 w-4" /></IconButton>
          <ScoreBadge score={score} checks={checks} />
          <Menu trigger={(toggle) => <IconButton label="More" onClick={toggle} data-testid="editor-menu"><MoreHorizontal className="h-4.5 w-4.5" /></IconButton>}>
            {(close) => (
              <>
                <MenuItem icon={<FileJson className="h-4 w-4" />} onClick={() => { close(); download(fileName(cv, ".json"), exportFile(cv)); }}>Download a copy (.json)</MenuItem>
                <MenuItem icon={<Copy className="h-4 w-4" />} onClick={() => { close(); const nid = duplicateCv(id); if (nid) { showToast("Opened the copy"); router.push(`/editor/${nid}`); } }}>Duplicate this CV</MenuItem>
              </>
            )}
          </Menu>
          <Button variant="primary" onClick={printPdf} data-testid="download-pdf">
            <Download className="h-4 w-4" /><span className="hidden sm:inline">Download PDF</span>
          </Button>
        </header>

        <div className="flex min-h-0 flex-1 print-reset">
          {/* ---------------- side panel ---------------- */}
          <aside className={cx("flex w-full flex-none flex-col border-r border-slate-200 bg-slate-50/70 lg:w-[460px] xl:w-[500px] no-print", mobilePreview && "hidden lg:flex")}>
            <nav className="flex flex-none gap-1 border-b border-slate-200 bg-white px-3 pt-2">
              {(["content", "design", "templates"] as Tab[]).map((t) => (
                <button key={t} type="button" onClick={() => setTab(t)} data-tab={t}
                  className={cx("relative px-3.5 pb-2.5 pt-1.5 text-sm font-medium capitalize cursor-pointer", tab === t ? "text-brand-700" : "text-slate-500 hover:text-ink")}>
                  {t}
                  {tab === t && <span className="absolute inset-x-2 -bottom-px h-0.5 rounded bg-brand-600" />}
                </button>
              ))}
            </nav>
            <div key={tab} className="min-h-0 flex-1 overflow-y-auto" data-testid="panel">
              {tab === "content" && <ContentPanel />}
              {tab === "design" && <DesignPanel />}
              {tab === "templates" && <TemplatePanel />}
            </div>
          </aside>

          {/* ---------------- preview ---------------- */}
          <Preview hidden={!mobilePreview} cv={cv} pages={pages} onPages={setPages} onSelect={selectSection} />
        </div>

        <button type="button" onClick={() => setMobilePreview((m) => !m)}
          className="fixed bottom-5 right-5 z-30 inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-3 text-sm font-medium text-white shadow-lg lg:hidden no-print">
          {mobilePreview ? <><PenLine className="h-4 w-4" /> Edit</> : <><Eye className="h-4 w-4" /> Preview</>}
        </button>
        <Toast message={toast} />
      </div>
    </EditorContext.Provider>
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
      className="min-w-0 max-w-[16rem] flex-shrink rounded-md border border-transparent px-2 py-1 text-[15px] font-semibold outline-none hover:border-slate-200 focus:border-brand-500"
    />
  );
}

function ScoreBadge({ score, checks }: { score: number; checks: { ok: boolean; title: string; tip: string }[] }) {
  const color = score >= 85 ? "text-emerald-700 bg-emerald-50 ring-emerald-200" : score >= 60 ? "text-amber-700 bg-amber-50 ring-amber-200" : "text-red-700 bg-red-50 ring-red-200";
  return (
    <Menu trigger={(toggle) => (
      <button type="button" onClick={toggle} className={cx("hidden h-8 items-center gap-1.5 rounded-full px-3 text-xs font-semibold ring-1 sm:inline-flex cursor-pointer", color)} data-testid="score">
        CV score {score}%
      </button>
    )}>
      {() => (
        <div className="w-80 p-2">
          <p className="mb-2 px-1 text-sm font-semibold">How your CV is doing</p>
          <ul className="max-h-96 space-y-1.5 overflow-y-auto">
            {checks.map((c) => (
              <li key={c.title} className="flex gap-2 rounded-lg px-1 py-1">
                {c.ok ? <CheckCircle2 className="mt-0.5 h-4 w-4 flex-none text-emerald-600" /> : <Circle className="mt-0.5 h-4 w-4 flex-none text-amber-500" />}
                <div>
                  <p className="text-[13px] font-medium">{c.title}</p>
                  {!c.ok && <p className="text-xs leading-snug text-slate-500">{c.tip}</p>}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </Menu>
  );
}

function Preview({ cv, pages, onPages, onSelect, hidden }: { cv: ReturnType<typeof useLibrary.getState>["cvs"][string]; pages: number; onPages: (n: number) => void; onSelect: (id: string) => void; hidden: boolean }) {
  const box = useRef<HTMLDivElement>(null);
  const [fit, setFit] = useState(0.8);
  const [zoom, setZoom] = useState<number | "fit">("fit");
  const page = PAGE_PX[cv.design.pageSize] ?? PAGE_PX.A4;

  useLayoutEffect(() => {
    const el = box.current;
    if (!el) return;
    const measure = () => setFit(Math.min(0.95, Math.max(0.3, (el.clientWidth - 56) / page.w)));
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [page.w]);

  const scale = zoom === "fit" ? fit : zoom;
  const step = (dir: 1 | -1) => setZoom(Math.round(Math.min(1.5, Math.max(0.4, scale + dir * 0.1)) * 10) / 10);
  const totalH = pages * page.h + (pages - 1) * 28;

  return (
    <section ref={box} className={cx("relative min-w-0 flex-1 overflow-auto bg-[#e9edf3] print-area", hidden && "hidden lg:block")} data-testid="preview">
      <div className="sticky top-0 z-10 flex items-center justify-between gap-2 px-4 py-2.5 no-print">
        <span className="rounded-full bg-white/90 px-3 py-1 text-xs font-medium text-slate-600 shadow-sm" data-testid="page-count">
          {pages} page{pages > 1 ? "s" : ""}
        </span>
        <div className="flex items-center gap-0.5 rounded-full bg-white/90 p-0.5 shadow-sm">
          <IconButton label="Zoom out" className="h-7 w-7 rounded-full" onClick={() => step(-1)}><Minus className="h-3.5 w-3.5" /></IconButton>
          <button type="button" onClick={() => setZoom("fit")} className="min-w-12 text-xs font-medium tabular-nums text-slate-600 cursor-pointer" title="Fit to width">
            {Math.round(scale * 100)}%
          </button>
          <IconButton label="Zoom in" className="h-7 w-7 rounded-full" onClick={() => step(1)}><Plus className="h-3.5 w-3.5" /></IconButton>
        </div>
      </div>
      <div className="flex justify-center px-6 pb-16 pt-2 print-flat">
        <div className="preview-scale paper-shadow cv-clickable" style={{ width: page.w * scale, height: totalH * scale }}>
          <div style={{ width: page.w, transform: `scale(${scale})`, transformOrigin: "top left" }} className="preview-scale">
            <CvDocument cv={cv} onPageCount={onPages} onSelectSection={onSelect} />
          </div>
        </div>
      </div>
    </section>
  );
}
