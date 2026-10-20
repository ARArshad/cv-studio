"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Copy, Download, FileUp, MoreHorizontal, PenLine, Plus, Search, Trash2 } from "lucide-react";
import { CvThumb } from "@/components/cv/CvThumb";
import { NewCvDialog, useTemplateSamples } from "@/components/NewCvDialog";
import { Button, IconButton, Logo, Menu, MenuItem, Toast, download, timeAgo, useToast } from "@/components/ui";
import { exportFile, fileName, parseCvFile } from "@/lib/io";
import { useHydrated, useLibrary } from "@/lib/store";
import { TEMPLATES, getTemplate } from "@/lib/templates";
import type { Cv, TemplateId } from "@/lib/types";

export function Dashboard() {
  const hydrated = useHydrated();
  const cvs = useLibrary((s) => s.cvs);
  const params = useSearchParams();
  const router = useRouter();
  const [newOpen, setNewOpen] = useState(false);
  const [newTemplate, setNewTemplate] = useState<TemplateId | undefined>();
  const [toast, showToast] = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const samples = useTemplateSamples();
  const addCv = useLibrary((s) => s.addCv);

  /* /dashboard?new=1&template=summit opens the dialog, as the landing page does */
  const fromLink = !!params.get("new");
  const dialogOpen = newOpen || fromLink;
  const dialogTemplate = fromLink ? ((params.get("template") as TemplateId) || undefined) : newTemplate;
  const closeDialog = () => { setNewOpen(false); if (fromLink) router.replace("/dashboard"); };

  const [q, setQ] = useState("");
  const [sort, setSort] = useState<"recent" | "name" | "created">("recent");
  const all = Object.values(cvs);
  const list = all
    .filter((c) => !q || (c.title + " " + c.data.personal.fullName + " " + c.data.personal.jobTitle).toLowerCase().includes(q.toLowerCase()))
    .sort((a, b) => sort === "name" ? a.title.localeCompare(b.title) : sort === "created" ? b.createdAt - a.createdAt : b.updatedAt - a.updatedAt);

  const onImport = async (f: File) => {
    const cv = parseCvFile(await f.text());
    if (!cv) { showToast("That file is not a CV saved from CV Studio"); return; }
    const id = addCv(cv);
    router.push(`/editor/${id}`);
  };

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4 sm:px-6">
          <Logo />
          <span className="flex-1" />
          <Button onClick={() => fileRef.current?.click()} className="hidden sm:inline-flex" data-testid="import">
            <FileUp className="h-4 w-4" /> Import
          </Button>
          <Button variant="primary" onClick={() => { setNewTemplate(undefined); setNewOpen(true); }} data-testid="new-cv">
            <Plus className="h-4 w-4" /> New CV
          </Button>
          <input
            ref={fileRef}
            type="file"
            accept=".json,.cvjson,application/json"
            hidden
            data-testid="import-file"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) onImport(f); e.target.value = ""; }}
          />
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-[28px] font-semibold tracking-tight">My CVs</h1>
            <p className="mt-1 text-[15px] text-slate-500">
              {hydrated && all.length
                ? `${all.length} CV${all.length > 1 ? "s" : ""}. Keep one for each kind of job you apply for.`
                : "Create your first CV. It takes a few minutes with the example to guide you."}
            </p>
          </div>
          {hydrated && all.length > 1 && (
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search your CVs" aria-label="Search your CVs" data-testid="dash-search"
                  className="h-9.5 w-56 rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-sm outline-none focus:border-brand-500 focus:ring-3 focus:ring-brand-500/15" />
              </div>
              <select value={sort} onChange={(e) => setSort(e.target.value as typeof sort)} aria-label="Sort" data-testid="dash-sort"
                className="h-9.5 rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:border-brand-500">
                <option value="recent">Last edited</option>
                <option value="created">Newest</option>
                <option value="name">Name</option>
              </select>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          <button
            type="button"
            onClick={() => { setNewTemplate(undefined); setNewOpen(true); }}
            className="group flex aspect-[210/297] flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-slate-300 text-slate-500 transition hover:border-brand-500 hover:bg-brand-50/40 hover:text-brand-700 cursor-pointer"
          >
            <span className="grid h-12 w-12 place-items-center rounded-full bg-brand-50 text-brand-600 transition group-hover:bg-brand-100"><Plus className="h-6 w-6" /></span>
            <span className="text-sm font-medium">Create new CV</span>
          </button>

          {hydrated && list.map((cv) => (
            <CvCard key={cv.id} cv={cv} onToast={showToast} />
          ))}
        </div>

        {hydrated && all.length === 0 && (
          <section className="mt-14" data-testid="dash-start">
            <h2 className="text-lg font-semibold">Start from a template</h2>
            <p className="mt-1 text-sm text-slate-500">Pick a design, we fill it with an example you can edit.</p>
            <div className="mt-5 grid grid-cols-2 gap-5 sm:grid-cols-4 lg:grid-cols-6">
              {TEMPLATES.filter((t) => t.premium).slice(0, 6).map((t) => (
                <button key={t.id} type="button" onClick={() => { setNewTemplate(t.id); setNewOpen(true); }} className="group text-left cursor-pointer">
                  <span className="block overflow-hidden rounded-lg shadow-sm ring-1 ring-slate-200 transition group-hover:-translate-y-0.5 group-hover:shadow-lg"><CvThumb cv={samples[t.id]} /></span>
                  <span className="mt-2 block text-[13px] font-medium">{t.name}</span>
                </button>
              ))}
            </div>
          </section>
        )}
        {hydrated && all.length > 0 && list.length === 0 && <p className="mt-10 text-center text-sm text-slate-500">No CVs match &ldquo;{q}&rdquo;.</p>}
      </main>

      <NewCvDialog key={dialogOpen ? "open" + (dialogTemplate ?? "") : "closed"} open={dialogOpen} onClose={closeDialog} initialTemplate={dialogTemplate} />
      <Toast message={toast} />
    </div>
  );
}

function CvCard({ cv, onToast }: { cv: Cv; onToast: (m: string) => void }) {
  const { renameCv, duplicateCv, deleteCv } = useLibrary.getState();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(cv.title);
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => { if (editing) inputRef.current?.select(); }, [editing]);

  const commit = () => { setEditing(false); renameCv(cv.id, name); };

  return (
    <div className="group flex flex-col" data-testid="cv-card" data-id={cv.id}>
      <Link href={`/editor/${cv.id}`} className="relative block overflow-hidden rounded-xl shadow-sm ring-1 ring-slate-200 transition group-hover:shadow-lg group-hover:ring-slate-300">
        <CvThumb cv={cv} />
        <span className="absolute inset-x-0 bottom-3 mx-auto w-max rounded-full bg-slate-900/85 px-3.5 py-1.5 text-xs font-medium text-white opacity-0 transition group-hover:opacity-100">
          Open editor
        </span>
      </Link>
      <div className="mt-3 flex items-start gap-1">
        <div className="min-w-0 flex-1">
          {editing ? (
            <input
              ref={inputRef}
              value={name}
              onChange={(e) => setName(e.target.value)}
              onBlur={commit}
              onKeyDown={(e) => { if (e.key === "Enter") commit(); if (e.key === "Escape") { setName(cv.title); setEditing(false); } }}
              className="w-full rounded-md border border-brand-500 px-1.5 py-0.5 text-[14px] font-medium outline-none"
              data-testid="rename-input"
            />
          ) : (
            <button type="button" onClick={() => { setName(cv.title); setEditing(true); }} className="block max-w-full truncate text-left text-[14px] font-medium hover:text-brand-700 cursor-text" title="Rename" data-testid="cv-title">
              {cv.title}
            </button>
          )}
          <p className="mt-0.5 truncate text-xs text-slate-500">{getTemplate(cv.design.template).name} · Edited {timeAgo(cv.updatedAt)}</p>
        </div>
        <Menu
          trigger={(toggle) => <IconButton label="More actions" onClick={toggle} data-testid="card-menu"><MoreHorizontal className="h-4.5 w-4.5" /></IconButton>}
        >
          {(close) => (
            <>
              <MenuItem icon={<PenLine className="h-4 w-4" />} onClick={() => { close(); setName(cv.title); setEditing(true); }}>Rename</MenuItem>
              <MenuItem icon={<Copy className="h-4 w-4" />} onClick={() => { close(); duplicateCv(cv.id); onToast(`Duplicated "${cv.title}"`); }}>Duplicate</MenuItem>
              <MenuItem icon={<Download className="h-4 w-4" />} onClick={() => { close(); download(fileName(cv, ".json"), exportFile(cv)); }}>Download a copy</MenuItem>
              <div className="my-1 h-px bg-slate-100" />
              <MenuItem danger icon={<Trash2 className="h-4 w-4" />} onClick={() => {
                close();
                if (confirm(`Delete "${cv.title}"? This cannot be undone.`)) { deleteCv(cv.id); onToast(`Deleted "${cv.title}"`); }
              }}>Delete</MenuItem>
            </>
          )}
        </Menu>
      </div>
    </div>
  );
}
