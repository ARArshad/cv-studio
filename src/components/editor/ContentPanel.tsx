"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  DndContext, KeyboardSensor, PointerSensor, closestCenter, useSensor, useSensors, type DragEndEvent,
} from "@dnd-kit/core";
import { SortableContext, arrayMove, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  ArrowDown, ArrowLeftRight, ArrowUp, Camera, ChevronDown, Eye, EyeOff, GripVertical, Plus, Trash2, X,
} from "lucide-react";
import { LANGUAGE_LABELS, LEVEL_LABELS } from "@/components/cv/blocks";
import { Field, IconButton, Menu, cx, inputCls } from "@/components/ui";
import { SECTION_LABELS, kindOf, newEntry, newItem, newSection, uid } from "@/lib/sample";
import { getTemplate } from "@/lib/templates";
import type { DetailIcon, Entry, Section, SectionType } from "@/lib/types";
import { useEditor } from "./context";
import { LevelPicker, RichTextArea } from "./fields";

const DETAIL_ICONS: { icon: DetailIcon; label: string; placeholder: string }[] = [
  { icon: "email", label: "Email", placeholder: "you@example.com" },
  { icon: "phone", label: "Phone", placeholder: "+44 7700 900000" },
  { icon: "location", label: "Location", placeholder: "City, Country" },
  { icon: "linkedin", label: "LinkedIn", placeholder: "linkedin.com/in/you" },
  { icon: "website", label: "Website", placeholder: "yourname.com" },
  { icon: "github", label: "GitHub or portfolio", placeholder: "github.com/you" },
  { icon: "calendar", label: "Date of birth", placeholder: "4 March 1994" },
  { icon: "flag", label: "Nationality", placeholder: "British" },
  { icon: "car", label: "Driving licence", placeholder: "Full UK driving licence" },
  { icon: "briefcase", label: "Availability", placeholder: "Available immediately" },
  { icon: "user", label: "Other", placeholder: "Anything else" },
  { icon: "star", label: "Highlight", placeholder: "Security cleared" },
];

const ENTRY_LABELS: Partial<Record<SectionType, { title: string; subtitle: string; dates: "range" | "single" | "none"; desc: string }>> = {
  experience: { title: "Job title", subtitle: "Employer", dates: "range", desc: "What you did and achieved" },
  education: { title: "Degree or qualification", subtitle: "School or university", dates: "range", desc: "Grades, modules, achievements" },
  projects: { title: "Project", subtitle: "Your role or organisation", dates: "range", desc: "What it was and what you delivered" },
  certificates: { title: "Certificate", subtitle: "Issued by", dates: "single", desc: "Details (optional)" },
  courses: { title: "Course", subtitle: "Provider", dates: "range", desc: "What you learned (optional)" },
  awards: { title: "Award", subtitle: "Awarded by", dates: "single", desc: "What it was for (optional)" },
  volunteering: { title: "Role", subtitle: "Organisation", dates: "range", desc: "What you did" },
  references: { title: "Name", subtitle: "Job title and company", dates: "none", desc: "Contact details" },
  custom: { title: "Title", subtitle: "Subtitle", dates: "range", desc: "Description" },
};

export function ContentPanel() {
  const { cv, update, openSection, setOpenSection } = useEditor();
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));

  const onDragEnd = (e: DragEndEvent) => {
    if (!e.over || e.active.id === e.over.id) return;
    update((d) => {
      const from = d.data.sections.findIndex((s) => s.id === e.active.id);
      const to = d.data.sections.findIndex((s) => s.id === e.over!.id);
      d.data.sections = arrayMove(d.data.sections, from, to);
    });
  };

  const addSection = (type: SectionType) => {
    const s = newSection(type);
    update((d) => { d.data.sections.push(s); });
    setOpenSection(s.id);
  };

  return (
    <div className="space-y-3 p-4 sm:p-5">
      <PersonalCard />
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <SortableContext items={cv.data.sections.map((s) => s.id)} strategy={verticalListSortingStrategy}>
          {cv.data.sections.map((s) => (
            <SectionCard key={s.id} section={s} open={openSection === s.id} onToggle={() => setOpenSection(openSection === s.id ? null : s.id)} />
          ))}
        </SortableContext>
      </DndContext>

      <Menu
        align="left"
        trigger={(toggle) => (
          <button type="button" onClick={toggle} data-testid="add-section"
            className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-300 py-3.5 text-sm font-medium text-slate-600 transition hover:border-brand-500 hover:text-brand-700 cursor-pointer">
            <Plus className="h-4 w-4" /> Add section
          </button>
        )}
      >
        {(close) => (
          <div className="grid w-[min(420px,80vw)] grid-cols-2 gap-1">
            {(Object.keys(SECTION_LABELS) as SectionType[]).map((t) => (
              <button key={t} type="button" onClick={() => { close(); addSection(t); }} data-add={t}
                className="rounded-lg px-3 py-2 text-left hover:bg-slate-100 cursor-pointer">
                <span className="block text-sm font-medium">{SECTION_LABELS[t].title}</span>
                <span className="block text-xs leading-snug text-slate-500">{SECTION_LABELS[t].hint}</span>
              </button>
            ))}
          </div>
        )}
      </Menu>
    </div>
  );
}

function Card({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cx("rounded-xl border border-slate-200 bg-white shadow-xs", className)}>{children}</div>;
}

/* ---------------- personal details ---------------- */

function PersonalCard() {
  const { cv, update } = useEditor();
  const p = cv.data.personal;
  const fileRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(true);

  const onPhoto = (f: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        /* square crop from the centre, 480px, so local storage stays small */
        const side = Math.min(img.width, img.height), size = Math.min(480, side);
        const c = document.createElement("canvas");
        c.width = c.height = size;
        c.getContext("2d")!.drawImage(img, (img.width - side) / 2, (img.height - side) / 2, side, side, 0, 0, size, size);
        const url = c.toDataURL("image/jpeg", 0.88);
        update((d) => { d.data.personal.photo = url; d.design.showPhoto = true; });
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(f);
  };

  return (
    <Card>
      <button type="button" onClick={() => setOpen((o) => !o)} className="flex w-full items-center gap-3 px-4 py-3.5 text-left cursor-pointer">
        <span className="flex-1 font-semibold">Personal details</span>
        <ChevronDown className={cx("h-4 w-4 text-slate-400 transition", open && "rotate-180")} />
      </button>
      {open && (
        <div className="space-y-4 border-t border-slate-100 px-4 pb-4 pt-4">
          <div className="flex items-center gap-4">
            <button type="button" onClick={() => fileRef.current?.click()} className="group relative grid h-20 w-20 flex-none place-items-center overflow-hidden rounded-full bg-slate-100 ring-1 ring-slate-200 cursor-pointer" title="Upload photo">
              {p.photo
                // eslint-disable-next-line @next/next/no-img-element
                ? <img src={p.photo} alt="" className="h-full w-full object-cover" />
                : <Camera className="h-6 w-6 text-slate-400" />}
              <span className="absolute inset-0 grid place-items-center bg-slate-900/50 text-[11px] font-medium text-white opacity-0 transition group-hover:opacity-100">Change</span>
            </button>
            <div className="space-y-1 text-sm">
              <button type="button" onClick={() => fileRef.current?.click()} className="font-medium text-brand-600 hover:underline cursor-pointer">{p.photo ? "Change photo" : "Upload a photo"}</button>
              {p.photo && <button type="button" onClick={() => update((d) => { d.data.personal.photo = ""; })} className="block text-slate-500 hover:text-red-600 cursor-pointer">Remove photo</button>}
              <p className="text-xs text-slate-500">Optional. Usual in the UK and Europe, usually left off in the US.</p>
            </div>
            <input ref={fileRef} type="file" accept="image/*" hidden data-testid="photo-file" onChange={(e) => { const f = e.target.files?.[0]; if (f) onPhoto(f); e.target.value = ""; }} />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Full name">
              <input className={inputCls} value={p.fullName} placeholder="Alex Morgan" data-testid="full-name"
                onChange={(e) => update((d) => { d.data.personal.fullName = e.target.value; }, "name")} />
            </Field>
            <Field label="Job title">
              <input className={inputCls} value={p.jobTitle} placeholder="Marketing Manager" data-testid="job-title"
                onChange={(e) => update((d) => { d.data.personal.jobTitle = e.target.value; }, "jobtitle")} />
            </Field>
          </div>

          <div>
            <span className="mb-1.5 block text-[12.5px] font-medium text-slate-600">Contact details</span>
            <div className="space-y-2">
              {p.details.map((det, i) => {
                const meta = DETAIL_ICONS.find((x) => x.icon === det.icon) ?? DETAIL_ICONS[10];
                return (
                  <div key={det.id} className="grid grid-cols-[8.5rem_minmax(0,1fr)_2rem] items-center gap-2">
                    <select className={cx(inputCls, "px-2")} value={det.icon} aria-label="Kind of detail"
                      onChange={(e) => update((d) => { d.data.personal.details[i].icon = e.target.value as DetailIcon; })}>
                      {DETAIL_ICONS.map((x) => <option key={x.icon} value={x.icon}>{x.label}</option>)}
                    </select>
                    <input className={inputCls} value={det.value} placeholder={meta.placeholder} data-testid={`detail-${det.icon}`}
                      onChange={(e) => update((d) => { d.data.personal.details[i].value = e.target.value; }, "detail" + det.id)} />
                    <IconButton label="Remove detail" onClick={() => update((d) => { d.data.personal.details.splice(i, 1); })}>
                      <X className="h-4 w-4" />
                    </IconButton>
                  </div>
                );
              })}
            </div>
            <button type="button" className="mt-2 inline-flex items-center gap-1.5 text-sm font-medium text-brand-600 hover:underline cursor-pointer"
              onClick={() => {
                const used = new Set(p.details.map((x) => x.icon));
                const icon = DETAIL_ICONS.find((x) => !used.has(x.icon))?.icon ?? "user";
                update((d) => { d.data.personal.details.push({ id: uid("d_"), icon, value: "" }); });
              }}>
              <Plus className="h-4 w-4" /> Add detail
            </button>
          </div>
        </div>
      )}
    </Card>
  );
}

/* ---------------- sections ---------------- */

function SectionCard({ section: s, open, onToggle }: { section: Section; open: boolean; onToggle: () => void }) {
  const { cv, update } = useEditor();
  const tpl = getTemplate(cv.design.template);
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: s.id });
  const ref = useRef<HTMLDivElement | null>(null);
  const kind = kindOf(s.type);
  const idx = cv.data.sections.findIndex((x) => x.id === s.id);
  const count = kind === "entries" ? s.entries.length : kind === "items" ? s.items.filter((i) => i.name.trim()).length : 0;

  useEffect(() => {
    if (open) ref.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [open]);

  const set = (fn: (x: Section) => void, group?: string) =>
    update((d) => { const t = d.data.sections.find((x) => x.id === s.id); if (t) fn(t); }, group);

  return (
    <div
      ref={(el) => { setNodeRef(el); ref.current = el; }}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cx("rounded-xl border bg-white shadow-xs", isDragging ? "z-10 border-brand-500 shadow-lg" : "border-slate-200", s.hidden && "opacity-60")}
      data-testid="section-card"
      data-section-id={s.id}
    >
      <div className="flex items-center gap-1 py-2 pl-2 pr-2">
        <button type="button" {...attributes} {...listeners} aria-label="Drag to reorder" className="grid h-8 w-6 cursor-grab place-items-center text-slate-300 hover:text-slate-500 active:cursor-grabbing">
          <GripVertical className="h-4 w-4" />
        </button>
        <button type="button" onClick={onToggle} className="flex min-w-0 flex-1 items-center gap-2 py-1.5 text-left cursor-pointer" data-testid="section-toggle">
          <span className="truncate font-semibold">{s.title || SECTION_LABELS[s.type].title}</span>
          {count > 0 && <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-500">{count}</span>}
          {s.hidden && <span className="text-xs text-slate-400">Hidden</span>}
        </button>
        {tpl.layout !== "single" && (
          <IconButton label={s.column === "side" ? "Move to main column" : "Move to sidebar"} onClick={() => set((x) => { x.column = x.column === "side" ? "main" : "side"; })}>
            <ArrowLeftRight className="h-4 w-4" />
          </IconButton>
        )}
        <IconButton label={s.hidden ? "Show section" : "Hide section"} onClick={() => set((x) => { x.hidden = !x.hidden; })} data-testid="section-hide">
          {s.hidden ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </IconButton>
        <IconButton label="Delete section" data-testid="section-delete" onClick={() => {
          if (confirm(`Delete the ${s.title} section?`)) update((d) => { d.data.sections.splice(idx, 1); });
        }}>
          <Trash2 className="h-4 w-4" />
        </IconButton>
        <button type="button" onClick={onToggle} aria-label={open ? "Collapse" : "Expand"} className="grid h-8 w-8 place-items-center text-slate-400 cursor-pointer">
          <ChevronDown className={cx("h-4 w-4 transition", open && "rotate-180")} />
        </button>
      </div>

      {open && (
        <div className="space-y-4 border-t border-slate-100 p-4">
          <Field label="Section title">
            <input className={inputCls} value={s.title} data-testid="section-title" onChange={(e) => set((x) => { x.title = e.target.value; }, "title" + s.id)} />
          </Field>
          {kind === "text" && (
            <RichTextArea value={s.text} onChange={(v) => set((x) => { x.text = v; }, "text" + s.id)} testId="summary-text"
              placeholder="Two to four sentences: who you are, your strongest experience, and what you are looking for." />
          )}
          {kind === "entries" && <EntriesEditor s={s} set={set} />}
          {kind === "items" && <ItemsEditor s={s} set={set} />}
        </div>
      )}
    </div>
  );
}

type SetSection = (fn: (x: Section) => void, group?: string) => void;

function EntriesEditor({ s, set }: { s: Section; set: SetSection }) {
  const [open, setOpen] = useState<string | null>(s.entries.length === 1 ? s.entries[0].id : null);
  const labels = ENTRY_LABELS[s.type] ?? ENTRY_LABELS.custom!;
  return (
    <div className="space-y-2">
      {s.entries.map((e, i) => (
        <div key={e.id} className="rounded-lg border border-slate-200" data-testid="entry">
          <div className="flex items-center gap-1 pl-3 pr-1">
            <button type="button" onClick={() => setOpen(open === e.id ? null : e.id)} className="min-w-0 flex-1 py-2.5 text-left cursor-pointer" data-testid="entry-toggle">
              <span className="block truncate text-sm font-medium">{e.title || <span className="text-slate-400">({labels.title})</span>}</span>
              <span className="block truncate text-xs text-slate-500">{[e.subtitle, [e.startDate, e.current ? "Present" : e.endDate].filter(Boolean).join(" – ")].filter(Boolean).join(" · ")}</span>
            </button>
            <IconButton label="Move up" disabled={i === 0} onClick={() => set((x) => { x.entries = arrayMove(x.entries, i, i - 1); })}><ArrowUp className="h-3.5 w-3.5" /></IconButton>
            <IconButton label="Move down" disabled={i === s.entries.length - 1} onClick={() => set((x) => { x.entries = arrayMove(x.entries, i, i + 1); })}><ArrowDown className="h-3.5 w-3.5" /></IconButton>
            <IconButton label="Delete" onClick={() => set((x) => { x.entries.splice(i, 1); })}><Trash2 className="h-3.5 w-3.5" /></IconButton>
          </div>
          {open === e.id && <EntryForm e={e} labels={labels} set={(fn, g) => set((x) => { const t = x.entries.find((y) => y.id === e.id); if (t) fn(t); }, g)} />}
        </div>
      ))}
      <button type="button" data-testid="add-entry" className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-600 hover:underline cursor-pointer"
        onClick={() => { const n = newEntry(); set((x) => { x.entries.push(n); }); setOpen(n.id); }}>
        <Plus className="h-4 w-4" /> Add {labels.title.toLowerCase()}
      </button>
    </div>
  );
}

function EntryForm({ e, labels, set }: { e: Entry; labels: NonNullable<(typeof ENTRY_LABELS)["custom"]>; set: (fn: (x: Entry) => void, group?: string) => void }) {
  const g = (f: string) => f + e.id;
  return (
    <div className="space-y-3 border-t border-slate-100 p-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label={labels.title}><input className={inputCls} value={e.title} data-testid="entry-title" onChange={(v) => set((x) => { x.title = v.target.value; }, g("t"))} /></Field>
        <Field label={labels.subtitle}><input className={inputCls} value={e.subtitle} data-testid="entry-subtitle" onChange={(v) => set((x) => { x.subtitle = v.target.value; }, g("s"))} /></Field>
      </div>
      {labels.dates !== "none" && (
        <div className={cx("grid gap-3", labels.dates === "range" ? "sm:grid-cols-3" : "sm:grid-cols-2")}>
          {labels.dates === "range" && (
            <Field label="Start"><input className={inputCls} value={e.startDate} placeholder="Mar 2021" onChange={(v) => set((x) => { x.startDate = v.target.value; }, g("sd"))} /></Field>
          )}
          <Field label={labels.dates === "range" ? "End" : "Date"}>
            <input className={inputCls} value={e.current ? "Present" : e.endDate} disabled={e.current} placeholder={labels.dates === "range" ? "Jun 2024" : "2023"}
              onChange={(v) => set((x) => { x.endDate = v.target.value; }, g("ed"))} />
          </Field>
          <Field label="Location"><input className={inputCls} value={e.location} placeholder="City" onChange={(v) => set((x) => { x.location = v.target.value; }, g("l"))} /></Field>
        </div>
      )}
      {labels.dates === "range" && (
        <label className="flex items-center gap-2 text-sm text-slate-600">
          <input type="checkbox" className="h-4 w-4 accent-brand-600" checked={e.current} onChange={(v) => set((x) => { x.current = v.target.checked; })} />
          I am currently here
        </label>
      )}
      <div>
        <span className="mb-1.5 block text-[12.5px] font-medium text-slate-600">{labels.desc}</span>
        <RichTextArea value={e.description} onChange={(v) => set((x) => { x.description = v; }, g("d"))} testId="entry-description"
          placeholder={"- Start each line with a dash for a bullet point\n- Lead with what you achieved, with numbers where you can"} />
      </div>
    </div>
  );
}

function ItemsEditor({ s, set }: { s: Section; set: SetSection }) {
  const labels = s.type === "languages" ? LANGUAGE_LABELS : LEVEL_LABELS;
  const levels = s.type !== "interests";
  return (
    <div className="space-y-2">
      {s.items.map((it, i) => (
        <div key={it.id} className="flex flex-wrap items-center gap-x-3 gap-y-1.5" data-testid="item">
          <input className={cx(inputCls, "min-w-40 flex-1")} value={it.name} placeholder={s.type === "languages" ? "Language" : s.type === "interests" ? "Interest" : "Skill"}
            data-testid="item-name"
            onChange={(v) => set((x) => { x.items[i].name = v.target.value; }, "item" + it.id)}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); set((x) => { x.items.splice(i + 1, 0, newItem("", s.type === "languages" ? 3 : 0)); }); } }} />
          {levels && <LevelPicker value={it.level} labels={labels} onChange={(v) => set((x) => { x.items[i].level = v; })} />}
          <IconButton label="Remove" onClick={() => set((x) => { x.items.splice(i, 1); })}><X className="h-4 w-4" /></IconButton>
        </div>
      ))}
      <button type="button" data-testid="add-item" className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-600 hover:underline cursor-pointer"
        onClick={() => set((x) => { x.items.push(newItem("", s.type === "languages" ? 3 : 0)); })}>
        <Plus className="h-4 w-4" /> Add {s.type === "languages" ? "language" : s.type === "interests" ? "interest" : "skill"}
      </button>
      {s.type === "skills" && <p className="text-xs text-slate-500">Choose how levels look (dots, bars, tags or plain) in Design.</p>}
    </div>
  );
}

