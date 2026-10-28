"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  ArrowUpRight,
  Copy,
  Download,
  FileText,
  FileUp,
  FolderOpen,
  LayoutTemplate,
  MoreHorizontal,
  PenLine,
  Plus,
  Search,
  ShieldCheck,
  Trash2,
  RotateCcw,
  Mail,
  Tags,
} from "lucide-react";
import { SaveStatus } from "@/components/SaveStatus";
import { CvThumb } from "@/components/cv/CvThumb";
import { NewCvDialog, useTemplateSamples } from "@/components/NewCvDialog";
import {
  Button,
  IconButton,
  Logo,
  Menu,
  MenuItem,
  Modal,
  Toast,
  download,
  timeAgo,
  useToast,
} from "@/components/ui";
import { exportCollection, parseCollection } from "@/lib/collection";
import { parseCvText, pdfText } from "@/lib/importText";
import { makeCv } from "@/lib/sample";
import { exportFile, fileName, parseCvFile } from "@/lib/io";
import { useHydrated, useLibrary } from "@/lib/store";
import { PERSONAS } from "@/lib/personas";
import { TEMPLATES, getTemplate, type Persona } from "@/lib/templates";
import type { Cv, CvData, TemplateId } from "@/lib/types";

function tagClass(tag: string) {
  const colours = [
    "bg-emerald-50 text-emerald-700",
    "bg-sky-50 text-sky-700",
    "bg-violet-50 text-violet-700",
    "bg-amber-50 text-amber-700",
    "bg-rose-50 text-rose-700",
    "bg-slate-100 text-slate-700",
  ];
  return colours[
    Array.from(tag).reduce(
      (hash, char) => hash + (char.codePointAt(0) ?? 0),
      0,
    ) % colours.length
  ];
}

export function Dashboard() {
  const hydrated = useHydrated();
  const cvs = useLibrary((s) => s.cvs);
  const trash = useLibrary((s) => s.trash);
  const [trashOpen, setTrashOpen] = useState(false);
  const { restoreCv, purgeCv } = useLibrary.getState();
  const params = useSearchParams();
  const router = useRouter();
  const [newOpen, setNewOpen] = useState(false);
  const [newTemplate, setNewTemplate] = useState<TemplateId | undefined>();
  const [toast, showToast] = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const samples = useTemplateSamples();
  const addCv = useLibrary((s) => s.addCv);
  const addCvs = useLibrary((s) => s.addCvs);
  const [view, setView] = useState<"all" | "cv" | "letter">("all");
  const [tag, setTag] = useState("");
  const [tagging, setTagging] = useState<Cv | null>(null);
  const [tagDraft, setTagDraft] = useState("");
  const [importOpen, setImportOpen] = useState(false);
  const [importBusy, setImportBusy] = useState(false);
  const [importText, setImportText] = useState("");
  const [importData, setImportData] = useState<CvData | null>(null);
  const importRun = useRef(0);
  const importFromLink = params.get("import") === "1";
  const closeImport = () => {
    importRun.current++;
    setImportBusy(false);
    setImportOpen(false);
    setImportData(null);
    setImportText("");
    if (importFromLink) router.replace("/dashboard");
  };
  const [restore, setRestore] = useState<Cv[] | null>(null);

  /* /dashboard?new=1&template=summit opens the dialog, as the landing page does */
  const fromLink = !!params.get("new");
  const dialogOpen = hydrated && (newOpen || fromLink);
  const dialogTemplate = fromLink
    ? (params.get("template") as TemplateId) || undefined
    : newTemplate;
  const closeDialog = () => {
    setNewOpen(false);
    if (fromLink) router.replace("/dashboard");
  };

  const [q, setQ] = useState("");
  const [sort, setSort] = useState<"recent" | "name" | "created">("recent");
  const all = Object.values(cvs);
  const tagNames = [...new Set(all.flatMap((cv) => cv.tags ?? []))].sort(
    (a, b) => a.localeCompare(b),
  );
  const list = all
    .filter(
      (cv) =>
        (view === "all" || (cv.data.letter ? "letter" : "cv") === view) &&
        (!tag || cv.tags?.includes(tag)),
    )
    .filter(
      (c) =>
        !q ||
        (
          c.title +
          " " +
          c.data.personal.fullName +
          " " +
          c.data.personal.jobTitle +
          " " +
          (c.tags ?? []).join(" ")
        )
          .toLowerCase()
          .includes(q.trim().toLowerCase()),
    )
    .sort((a, b) =>
      sort === "name"
        ? a.title.localeCompare(b.title)
        : sort === "created"
          ? b.createdAt - a.createdAt
          : b.updatedAt - a.updatedAt,
    );

  const onImport = async (f: File) => {
    if (f.size > 50 * 1024 * 1024) {
      showToast("Please choose a CV backup smaller than 50 MB.");
      return;
    }
    if (f.type === "application/pdf" || /\.(pdf|txt)$/i.test(f.name)) {
      const run = ++importRun.current;
      setImportOpen(true);
      setImportBusy(true);
      setImportData(null);
      try {
        const text =
          f.type === "application/pdf" || /\.pdf$/i.test(f.name)
            ? await pdfText(f)
            : await f.text();
        if (run !== importRun.current) return;
        if (text.trim().length < 30) {
          showToast(
            "No usable text was found. Scanned PDFs need text recognition first; you can paste your CV below.",
          );
          return;
        }
        setImportText(text);
        setImportData(parseCvText(text));
      } catch {
        if (run === importRun.current)
          showToast(
            "This file could not be read. Try a text-based PDF or paste the CV text.",
          );
      } finally {
        if (run === importRun.current) setImportBusy(false);
      }
      return;
    }
    let cv;
    try {
      const text = await f.text();
      const collection = parseCollection(text);
      if (collection) {
        closeImport();
        setRestore(collection);
        return;
      }
      cv = parseCvFile(text);
    } catch {
      showToast(
        "Could not read that file. Please try a CV Studio JSON backup.",
      );
      return;
    }
    if (!cv) {
      showToast("That file is not a CV saved from CV Studio");
      return;
    }
    const id = addCv(cv);
    closeImport();
    router.push(`/editor?id=${id}`);
  };

  return (
    <div className="min-h-screen bg-[#f6f7f4]">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[248px] flex-col overflow-y-auto border-r border-slate-200 bg-white px-5 py-8 lg:flex">
        <Logo />
        <p className="mb-3 mt-14 px-3 text-[10px] font-semibold uppercase tracking-[.15em] text-slate-400">
          Your workspace
        </p>
        <nav aria-label="Workspace" className="space-y-2 text-sm">
          <Link
            href="/dashboard"
            aria-current="page"
            className="flex items-center gap-3 rounded-lg bg-brand-50 px-3 py-3 font-semibold text-brand-700"
          >
            <FolderOpen className="h-4 w-4" /> My documents{" "}
            <span className="ml-auto text-xs">
              {hydrated ? all.length : "—"}
            </span>
          </Link>
          <Link
            href="/templates"
            className="flex items-center gap-3 rounded-lg px-3 py-3 text-slate-500 hover:bg-slate-50"
          >
            <LayoutTemplate className="h-4 w-4" /> Template library{" "}
            <ArrowUpRight className="ml-auto h-3.5 w-3.5" />
          </Link>
          <button
            onClick={() => fileRef.current?.click()}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-slate-500 hover:bg-slate-50"
          >
            <FileUp className="h-4 w-4" />
            <span className="hidden sm:inline">Import</span> a backup
          </button>
          <button
            disabled={!hydrated || !all.length}
            onClick={() =>
              download("CV Studio backup.json", exportCollection(all))
            }
            className="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-slate-500 hover:bg-slate-50 disabled:opacity-40"
          >
            <Download className="h-4 w-4" /> Back up all documents
          </button>
        </nav>
        <nav
          aria-label="Writing resources"
          className="mt-6 space-y-2 border-t border-slate-100 pt-5 text-xs text-slate-500"
        >
          <Link
            href="/cover-letters"
            className="block rounded-lg px-3 py-2 hover:bg-slate-50"
          >
            Cover letter templates
          </Link>
          <Link
            href="/examples"
            className="block rounded-lg px-3 py-2 hover:bg-slate-50"
          >
            CV examples
          </Link>
          <Link
            href="/guides"
            className="block rounded-lg px-3 py-2 hover:bg-slate-50"
          >
            Writing guides
          </Link>
        </nav>
        <div className="mt-auto rounded-xl bg-[#f1f5eb] p-4">
          <ShieldCheck className="h-5 w-5 text-brand-600" />
          <p className="mt-3 text-sm font-semibold">A space of your own</p>
          <p className="mt-2 text-xs leading-5 text-slate-500">
            Your documents stay in this browser. Download a backup before
            changing devices or clearing browser data.
          </p>
        </div>
        <Link
          href="/"
          className="mt-6 px-3 text-xs text-slate-500 hover:text-brand-600"
        >
          ← Back to CV Studio
        </Link>
      </aside>
      <div className="workspace-main">
        <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/90 backdrop-blur">
          <div className="mx-auto flex h-16 items-center gap-2 px-5 sm:gap-3 sm:px-10">
            <div className="lg:hidden">
              <Logo />
            </div>
            <p className="hidden text-xs text-slate-500 lg:block">
              Workspace <span className="mx-3 text-slate-300">/</span>
              <span className="font-medium text-ink">My documents</span>
            </p>
            <span className="flex-1" />
            <div className="hidden lg:block">
              <SaveStatus />
            </div>
            <Button
              onClick={() => fileRef.current?.click()}
              aria-label="Import CV backup"
              data-testid="import"
            >
              <FileUp className="h-4 w-4" />
              <span className="hidden sm:inline">Import</span>
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                setNewTemplate(undefined);
                setNewOpen(true);
              }}
              data-testid="new-cv"
            >
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">New document</span>
              <span className="sm:hidden">New</span>
            </Button>
            <input
              ref={fileRef}
              type="file"
              accept=".json,.cvjson,.pdf,.txt,application/json,application/pdf,text/plain"
              hidden
              data-testid="import-file"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) onImport(f);
                e.target.value = "";
              }}
            />
          </div>
        </header>

        <main className="mx-auto max-w-[1500px] px-5 py-10 sm:px-10 lg:py-12">
          <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="eyebrow mb-3">Make your next move</p>
              <h1 className="editorial-title text-4xl font-medium sm:text-5xl">
                My documents<span className="text-brand-600">.</span>
              </h1>
              <p className="mt-1 text-[15px] text-slate-500">
                {hydrated && all.length
                  ? `${all.length} document${all.length === 1 ? "" : "s"}. Keep your CVs and cover letters ready for the next opportunity.`
                  : "Your next opportunity starts here. Create a document and make it your own."}
              </p>
            </div>
            {hydrated && all.length > 0 && (
              <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    placeholder="Search documents"
                    aria-label="Search documents"
                    data-testid="dash-search"
                    className="h-9.5 w-full sm:w-56 rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-sm outline-none focus:border-brand-500 focus:ring-3 focus:ring-brand-500/15"
                  />
                </div>
                <select
                  value={sort}
                  onChange={(e) => setSort(e.target.value as typeof sort)}
                  aria-label="Sort documents"
                  data-testid="dash-sort"
                  className="h-9.5 rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:border-brand-500"
                >
                  <option value="recent">Last edited</option>
                  <option value="created">Newest</option>
                  <option value="name">Name</option>
                </select>
              </div>
            )}
          </div>

          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <div
              className="flex gap-1 rounded-lg border border-slate-200 bg-white p-1"
              role="group"
              aria-label="Document view"
            >
              {(
                [
                  ["all", "All documents"],
                  ["cv", "CVs"],
                  ["letter", "Cover letters"],
                ] as const
              ).map(([value, label]) => (
                <button
                  className={`rounded-md px-3 py-2 text-xs font-semibold ${view === value ? "bg-brand-50 text-brand-700" : "text-slate-500 hover:bg-slate-50"}`}
                  key={value}
                  aria-pressed={view === value}
                  onClick={() => setView(value)}
                >
                  {label}
                </button>
              ))}
            </div>
            {tagNames.length > 0 && (
              <select
                aria-label="Filter by tag"
                value={tag}
                onChange={(e) => setTag(e.target.value)}
                className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-xs"
              >
                <option value="">All tags</option>
                {tagNames.map((name) => (
                  <option key={name}>{name}</option>
                ))}
              </select>
            )}
          </div>
          {hydrated && all.length > 0 && (
            <div className="mb-5 flex items-center justify-between gap-3 lg:hidden">
              <span className="text-xs text-slate-500">
                Private on this device
              </span>
              <Button
                size="sm"
                onClick={() =>
                  download("CV Studio backup.json", exportCollection(all))
                }
              >
                <Download className="h-3.5 w-3.5" />
                Back up all documents
              </Button>
            </div>
          )}
          <div className="mb-8 flex flex-wrap items-center gap-3 rounded-xl border border-[#dce5d5] bg-[#edf2e7] px-5 py-4">
            <FileText className="h-5 w-5 flex-none text-brand-600" />
            <p className="flex-1 text-sm text-slate-600">
              <strong className="font-semibold text-ink">
                One application. A complete story.
              </strong>{" "}
              Create a CV for each role and pair it with a matching cover
              letter.
            </p>
            <Link
              href="/templates"
              className="flex items-center gap-2 text-xs font-semibold text-brand-700"
            >
              Find a template <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>
          {hydrated && (
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-3">
                {" "}
                <p className="text-xs text-slate-500" role="status">
                  {q.trim()
                    ? `${list.length} of ${all.length} documents match your search`
                    : `${all.length} document${all.length === 1 ? "" : "s"} in your library`}
                </p>
                <SaveStatus />
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setTrashOpen(true)}
                data-testid="recently-deleted"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Recently deleted
                {Object.keys(trash).length
                  ? ` (${Object.keys(trash).length})`
                  : ""}
              </Button>
            </div>
          )}
          {!hydrated && (
            <div
              role="status"
              className="mb-6 rounded-xl border border-slate-200 bg-white p-8 text-sm text-slate-500"
            >
              Loading your document library…
            </div>
          )}
          <div className="grid grid-cols-1 gap-6 min-[440px]:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            <button
              type="button"
              onClick={() => {
                setNewTemplate(undefined);
                setNewOpen(true);
              }}
              className="group flex min-h-72 flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-[#c7d5c7] bg-white/50 text-slate-500 transition hover:border-brand-500 hover:bg-brand-50/40 hover:text-brand-700 cursor-pointer"
            >
              <span className="grid h-12 w-12 place-items-center rounded-full bg-brand-50 text-brand-600 transition group-hover:bg-brand-100">
                <Plus className="h-6 w-6" />
              </span>
              <span className="text-sm font-semibold">Create a document</span>
              <span className="max-w-40 text-center text-xs leading-5 text-slate-400">
                A fresh start for your next opportunity
              </span>
            </button>

            {hydrated &&
              list.map((cv) => (
                <CvCard
                  key={cv.id}
                  cv={cv}
                  onToast={showToast}
                  onTags={() => {
                    setTagging(cv);
                    setTagDraft((cv.tags ?? []).join(", "));
                  }}
                />
              ))}
          </div>

          {hydrated && all.length === 0 && (
            <section className="mt-14" data-testid="dash-start">
              <h2 className="text-lg font-semibold">Start from a template</h2>
              <p className="mt-1 text-sm text-slate-500">
                Choose a design, then start fresh or use an example to guide
                you.
              </p>
              <div className="mt-5 grid grid-cols-2 gap-5 sm:grid-cols-4">
                {TEMPLATES.filter((t) =>
                  ["nordic", "meridian", "sterling", "linen"].includes(t.id),
                ).map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => {
                      setNewTemplate(t.id);
                      setNewOpen(true);
                    }}
                    className="group text-left cursor-pointer"
                  >
                    <span className="block overflow-hidden rounded-lg shadow-sm ring-1 ring-slate-200 transition group-hover:-translate-y-0.5 group-hover:shadow-lg">
                      <CvThumb cv={samples[t.id]} />
                    </span>
                    <span className="mt-2 block text-[13px] font-medium">
                      {t.name}
                    </span>
                  </button>
                ))}
              </div>
            </section>
          )}
          {hydrated && all.length > 0 && list.length === 0 && (
            <div className="mt-10 rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center">
              <p className="text-sm text-slate-500">
                No documents match your current filters.
              </p>
              <Button
                className="mt-4"
                onClick={() => {
                  setQ("");
                  setView("all");
                  setTag("");
                }}
              >
                Clear filters
              </Button>
            </div>
          )}
        </main>
      </div>
      <NewCvDialog
        key={
          dialogOpen
            ? "open" +
              (dialogTemplate ?? "") +
              params.get("kind") +
              params.get("persona")
            : "closed"
        }
        open={dialogOpen}
        onClose={closeDialog}
        initialTemplate={dialogTemplate}
        initialKind={params.get("kind") === "letter" ? "letter" : "cv"}
        initialStart={params.get("start") === "example" ? "example" : "blank"}
        initialPersona={
          Object.hasOwn(PERSONAS, params.get("persona") ?? "")
            ? (params.get("persona") as Persona)
            : undefined
        }
      />
      <Modal
        open={importOpen || importFromLink}
        onClose={closeImport}
        title="Import an existing CV"
        wide
      >
        <p className="text-sm leading-6 text-slate-500">
          Upload a text-based PDF, a text file, or a CV Studio backup.
          Everything is processed in your browser. Review the extracted content
          before creating a new CV.
        </p>
        <Button
          className="mt-4"
          disabled={importBusy}
          onClick={() => fileRef.current?.click()}
        >
          <FileUp className="h-4 w-4" />
          {importBusy
            ? "Reading your file…"
            : "Choose a PDF, text file, or backup"}
        </Button>
        <label className="mt-5 block text-xs font-medium text-slate-600">
          Or paste the text of your CV
          <textarea
            className="mt-2 min-h-40 w-full rounded-lg border border-slate-200 p-3 text-sm font-normal"
            value={importText}
            maxLength={200000}
            disabled={importBusy}
            onChange={(e) => {
              const text = e.target.value;
              setImportText(text);
              setImportData(text.trim().length > 30 ? parseCvText(text) : null);
            }}
            data-testid="dashboard-import-text"
          />
        </label>
        {importBusy && (
          <p className="mt-3 text-sm text-brand-700" role="status">
            Reading the document and finding its sections…
          </p>
        )}
        {importData && (
          <div
            data-testid="dashboard-import-preview"
            className="mt-4 rounded-xl bg-brand-50 p-4 text-sm"
          >
            <p className="font-semibold">
              {importData.personal.fullName ||
                "Name not found — you can add it in the editor"}
            </p>
            <p className="mt-1 text-slate-500">
              {importData.personal.jobTitle}
            </p>
            <ul className="mt-3 flex flex-wrap gap-2 text-xs text-brand-700">
              {importData.sections.map((section) => (
                <li
                  className="rounded-full bg-white px-2 py-1"
                  key={section.id}
                >
                  {section.title}
                </li>
              ))}
            </ul>
          </div>
        )}
        <div className="mt-6 flex justify-end gap-2">
          <Button onClick={closeImport}>Cancel</Button>
          <Button
            variant="primary"
            disabled={!importData || importBusy}
            data-testid="dashboard-import-create"
            onClick={() => {
              if (!importData) return;
              const cv = makeCv({
                start: "blank",
                template: "meridian",
                title: importData.personal.fullName
                  ? `${importData.personal.fullName} CV`
                  : "Imported CV",
              });
              const id = addCv({ ...cv, data: importData });
              closeImport();
              router.push(`/editor?id=${id}`);
            }}
          >
            Create CV from import
          </Button>
        </div>
      </Modal>
      <Modal
        open={tagging !== null}
        onClose={() => setTagging(null)}
        title="Organise with tags"
        initialFocus="[data-testid=tag-input]"
      >
        <p className="mb-4 text-sm leading-6 text-slate-500">
          Use tags for a job, company, language, or application stage. Separate
          tags with commas.
        </p>
        <label className="block text-sm font-medium">
          Tags
          <input
            value={tagDraft}
            onChange={(e) => setTagDraft(e.target.value)}
            maxLength={500}
            data-testid="tag-input"
            className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2"
            placeholder="Design, English, Ready to send"
          />
        </label>
        <div className="mt-6 flex justify-end gap-2">
          <Button onClick={() => setTagging(null)}>Cancel</Button>
          <Button
            variant="primary"
            onClick={() => {
              if (tagging)
                useLibrary.getState().tagCv(tagging.id, tagDraft.split(","));
              setTagging(null);
            }}
          >
            Save tags
          </Button>
        </div>
      </Modal>
      <Modal
        open={restore !== null}
        onClose={() => setRestore(null)}
        title="Restore CV backup"
      >
        <p className="text-sm leading-6 text-slate-600">
          This backup contains {restore?.length} CV
          {restore?.length === 1 ? "" : "s"}. Each one will be added as a new
          copy. Your existing CVs will stay in your library.
        </p>
        <ul className="mt-4 max-h-56 space-y-2 overflow-y-auto rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm">
          {restore?.map((cv, i) => (
            <li key={i} className="truncate">
              {cv.title}
            </li>
          ))}
        </ul>
        <div className="mt-6 flex justify-end gap-2">
          <Button onClick={() => setRestore(null)}>Cancel</Button>
          <Button
            variant="primary"
            onClick={() => {
              if (!restore) return;
              addCvs(restore);
              setQ("");
              setRestore(null);
              showToast(
                `Restored ${restore.length} CV${restore.length === 1 ? "" : "s"}`,
              );
            }}
            data-testid="restore-confirm"
          >
            Restore CVs
          </Button>
        </div>
      </Modal>
      <Modal
        open={trashOpen}
        onClose={() => setTrashOpen(false)}
        title="Recently deleted"
        wide
      >
        <p className="text-sm leading-6 text-slate-500">
          Deleted CVs stay here until you remove them permanently. Restore a CV
          to bring it back to your library. These CVs are not included in your
          active CV backup.
        </p>
        {Object.keys(trash).length === 0 ? (
          <div className="py-12 text-center text-sm text-slate-500">
            No deleted CVs. Your library is up to date.
          </div>
        ) : (
          <ul className="mt-5 max-h-[50vh] divide-y divide-slate-100 overflow-y-auto">
            {Object.entries(trash)
              .sort(([, a], [, b]) => b.deletedAt - a.deletedAt)
              .map(([id, item]) => (
                <li
                  key={id}
                  className="flex flex-wrap items-center gap-3 py-4"
                  data-testid="deleted-cv"
                >
                  <div className="min-w-0 flex-1 basis-40">
                    <p className="truncate text-sm font-semibold">
                      {item.cv.title}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      Deleted {timeAgo(item.deletedAt)}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => {
                      restoreCv(id);
                      showToast(`Restored "${item.cv.title}"`);
                    }}
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    Restore
                  </Button>
                  <IconButton
                    label={`Download ${item.cv.title} backup`}
                    onClick={() =>
                      download(fileName(item.cv, ".json"), exportFile(item.cv))
                    }
                  >
                    <Download className="h-4 w-4" />
                  </IconButton>
                  <IconButton
                    label={`Permanently delete ${item.cv.title}`}
                    onClick={() => {
                      if (
                        confirm(
                          `Permanently delete "${item.cv.title}"? Download a backup first if you need to keep it. This cannot be undone.`,
                        )
                      )
                        purgeCv(id);
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </IconButton>
                </li>
              ))}
          </ul>
        )}
        <div className="mt-5 flex justify-end">
          <Button onClick={() => setTrashOpen(false)}>Done</Button>
        </div>
      </Modal>
      <Toast message={toast} />
    </div>
  );
}

function CvCard({
  cv,
  onToast,
  onTags,
}: {
  cv: Cv;
  onToast: (m: string) => void;
  onTags: () => void;
}) {
  const router = useRouter();
  const { renameCv, duplicateCv, deleteCv } = useLibrary.getState();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(cv.title);
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (editing) inputRef.current?.select();
  }, [editing]);

  const commit = () => {
    setEditing(false);
    renameCv(cv.id, name);
  };

  return (
    <div
      className="group min-w-0 rounded-xl border border-slate-200 bg-white p-4 transition hover:border-brand-200 hover:shadow-md"
      data-testid="cv-card"
      data-id={cv.id}
    >
      <Link
        href={`/editor?id=${cv.id}`}
        aria-label={`Open ${cv.title}`}
        className="template-stage relative block overflow-hidden rounded-lg border border-slate-100 px-[12%] pt-6"
      >
        <CvThumb cv={cv} className="shadow-md" />
        <span className="absolute inset-x-0 bottom-3 mx-auto w-max rounded-full bg-slate-900/85 px-3.5 py-1.5 text-xs font-medium text-white opacity-100 transition sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100">
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
              onKeyDown={(e) => {
                if (e.key === "Enter") commit();
                if (e.key === "Escape") {
                  setName(cv.title);
                  setEditing(false);
                }
              }}
              className="w-full rounded-md border border-brand-500 px-1.5 py-0.5 text-[14px] font-medium outline-none"
              aria-label="CV title"
              maxLength={150}
              data-testid="rename-input"
            />
          ) : (
            <button
              type="button"
              onClick={() => {
                setName(cv.title);
                setEditing(true);
              }}
              className="block max-w-full truncate text-left text-[14px] font-medium hover:text-brand-700 cursor-text"
              title="Rename"
              data-testid="cv-title"
            >
              {cv.title}
            </button>
          )}
          <p className="mt-0.5 truncate text-xs text-slate-500">
            {cv.data.letter ? "Cover letter" : "CV"} ·{" "}
            {getTemplate(cv.design.template).name} · Edited{" "}
            {timeAgo(cv.updatedAt)}
          </p>
          {!!cv.tags?.length && (
            <div className="mt-2 flex flex-wrap gap-1">
              {cv.tags.map((tag) => (
                <span
                  key={tag}
                  className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${tagClass(tag)}`}
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
        <Menu
          trigger={(toggle, open, menuId) => (
            <IconButton
              label={`More actions for ${cv.title}`}
              aria-haspopup="menu"
              aria-expanded={open}
              aria-controls={menuId}
              onClick={toggle}
              data-testid="card-menu"
            >
              <MoreHorizontal className="h-4.5 w-4.5" />
            </IconButton>
          )}
        >
          {(close) => (
            <>
              <MenuItem
                icon={<PenLine className="h-4 w-4" />}
                onClick={() => {
                  close();
                  setName(cv.title);
                  setEditing(true);
                }}
              >
                Rename
              </MenuItem>
              <MenuItem
                icon={<Copy className="h-4 w-4" />}
                onClick={() => {
                  close();
                  duplicateCv(cv.id);
                  onToast(`Duplicated "${cv.title}"`);
                }}
              >
                Duplicate
              </MenuItem>
              <MenuItem
                icon={<Download className="h-4 w-4" />}
                onClick={() => {
                  close();
                  download(fileName(cv, ".json"), exportFile(cv));
                }}
              >
                Download a copy
              </MenuItem>
              <MenuItem
                icon={<Tags className="h-4 w-4" />}
                onClick={() => {
                  close();
                  onTags();
                }}
              >
                Manage tags
              </MenuItem>
              {!cv.data.letter && (
                <MenuItem
                  icon={<Mail className="h-4 w-4" />}
                  onClick={() => {
                    close();
                    const id = useLibrary.getState().createLetter(cv.id);
                    router.push(`/editor?id=${id}`);
                  }}
                >
                  Matching cover letter
                </MenuItem>
              )}
              <div className="my-1 h-px bg-slate-100" />
              <MenuItem
                danger
                icon={<Trash2 className="h-4 w-4" />}
                onClick={() => {
                  close();
                  deleteCv(cv.id);
                  onToast(`Moved "${cv.title}" to Recently deleted`);
                }}
              >
                Delete
              </MenuItem>
            </>
          )}
        </Menu>
      </div>
    </div>
  );
}
