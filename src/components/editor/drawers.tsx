"use client";

import { useMemo, useState } from "react";
import {
  DndContext, KeyboardSensor, PointerSensor, closestCenter, useSensor, useSensors, type DragEndEvent,
} from "@dnd-kit/core";
import { SortableContext, arrayMove, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ArrowLeftRight, Camera, Check, CheckCircle2, Circle, Crown, Eye, EyeOff, GripVertical, Plus, Trash2, X } from "lucide-react";
import { SECTION_ICONS } from "@/components/cv/blocks";
import { CvThumb } from "@/components/cv/CvThumb";
import { focusSoon } from "@/components/cv/edit";
import { IconButton, cx, inputCls } from "@/components/ui";
import { PHRASES } from "@/lib/phrases";
import { SECTION_LABELS, designFor, newSection, uid } from "@/lib/sample";
import { checkCv } from "@/lib/score";
import { CATEGORIES, TEMPLATES, getTemplate, type Category } from "@/lib/templates";
import type { Cv, DetailIcon, Section, SectionType, TemplateId } from "@/lib/types";
import { useEditor } from "./context";

/* ---------------- add section ---------------- */

export function AddSectionDrawer({ onDone }: { onDone: () => void }) {
  const { cv, update } = useEditor();
  const have = new Set(cv.data.sections.map((s) => s.type));
  const add = (type: SectionType) => {
    const s = newSection(type);
    update((d) => { d.data.sections.push(s); });
    focusSoon(`sec:${s.id}:title`, "end");
    onDone();
    requestAnimationFrame(() => document.querySelector(`.cv-pages [data-section="${s.id}"]`)?.scrollIntoView({ behavior: "smooth", block: "center" }));
  };
  return (
    <div className="grid grid-cols-2 gap-2.5" data-testid="add-section-drawer">
      {(Object.keys(SECTION_LABELS) as SectionType[]).map((t) => {
        const Icon = SECTION_ICONS[t];
        return (
          <button key={t} type="button" onClick={() => add(t)} data-add={t}
            className="group flex flex-col items-start gap-2 rounded-xl border border-slate-200 bg-white p-3 text-left transition hover:border-brand-500 hover:shadow-md cursor-pointer">
            <span className="flex w-full items-center justify-between">
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand-50 text-brand-600 group-hover:bg-brand-600 group-hover:text-white"><Icon className="h-4 w-4" /></span>
              {have.has(t) && <span className="text-[10.5px] font-medium text-slate-400">Added</span>}
            </span>
            <span className="text-[13.5px] font-semibold">{SECTION_LABELS[t].title}</span>
            <span className="text-xs leading-snug text-slate-500">{SECTION_LABELS[t].hint}</span>
          </button>
        );
      })}
    </div>
  );
}

/* ---------------- rearrange ---------------- */

function Row({ s, twoCols, onToggle, onCol, onDel }: { s: Section; twoCols: boolean; onToggle: () => void; onCol: () => void; onDel: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: s.id });
  const Icon = SECTION_ICONS[s.type];
  return (
    <div ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition }} data-testid="arrange-row"
      className={cx("flex items-center gap-1.5 rounded-lg border bg-white py-1.5 pl-1 pr-1.5", isDragging ? "z-10 border-brand-500 shadow-lg" : "border-slate-200", s.hidden && "opacity-55")}>
      <button type="button" {...attributes} {...listeners} aria-label="Drag to reorder" className="grid h-7 w-6 cursor-grab place-items-center text-slate-400 active:cursor-grabbing"><GripVertical className="h-4 w-4" /></button>
      <Icon className="h-4 w-4 flex-none text-slate-400" />
      <span className="min-w-0 flex-1 truncate text-[13px] font-medium">{s.title || SECTION_LABELS[s.type].title}</span>
      {twoCols && <IconButton label={s.column === "side" ? "Move to main column" : "Move to sidebar"} className="h-7 w-7" onClick={onCol}><ArrowLeftRight className="h-3.5 w-3.5" /></IconButton>}
      <IconButton label={s.hidden ? "Show" : "Hide"} className="h-7 w-7" onClick={onToggle} data-testid="arrange-hide">{s.hidden ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}</IconButton>
      <IconButton label="Delete" className="h-7 w-7" onClick={onDel}><Trash2 className="h-3.5 w-3.5" /></IconButton>
    </div>
  );
}

export function RearrangeDrawer() {
  const { cv, update } = useEditor();
  const tpl = getTemplate(cv.design.template);
  const twoCols = (cv.design.layout ?? tpl.layout) !== "single";
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));
  const cols = twoCols ? (["main", "side"] as const) : (["main"] as const);
  const set = (id: string, fn: (s: Section) => void) => update((d) => { const s = d.data.sections.find((x) => x.id === id); if (s) fn(s); });

  const onDragEnd = (e: DragEndEvent) => {
    if (!e.over || e.active.id === e.over.id) return;
    update((d) => {
      const from = d.data.sections.findIndex((s) => s.id === e.active.id);
      const to = d.data.sections.findIndex((s) => s.id === e.over!.id);
      const target = d.data.sections[to];
      d.data.sections = arrayMove(d.data.sections, from, to);
      const moved = d.data.sections.find((s) => s.id === e.active.id);
      if (moved && twoCols) moved.column = target.column;
    });
  };

  return (
    <div data-testid="rearrange-drawer">
      <p className="mb-4 text-[13px] leading-relaxed text-slate-500">Drag sections to change their order. {twoCols ? "Use the arrows to move a section between the main column and the sidebar." : ""} Hidden sections stay saved.</p>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <div className={cx("grid gap-4", twoCols && "grid-cols-1")}>
          {cols.map((c) => {
            const list = cv.data.sections.filter((s) => !twoCols || s.column === c);
            return (
              <div key={c}>
                {twoCols && <h4 className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500">{c === "main" ? "Main column" : "Sidebar"}</h4>}
                <SortableContext items={list.map((s) => s.id)} strategy={verticalListSortingStrategy}>
                  <div className="space-y-1.5">
                    {list.map((s) => (
                      <Row key={s.id} s={s} twoCols={twoCols}
                        onToggle={() => set(s.id, (x) => { x.hidden = !x.hidden; })}
                        onCol={() => set(s.id, (x) => { x.column = x.column === "side" ? "main" : "side"; })}
                        onDel={() => { if (confirm(`Delete the ${s.title} section?`)) update((d) => { d.data.sections = d.data.sections.filter((x) => x.id !== s.id); }); }} />
                    ))}
                    {!list.length && <p className="rounded-lg border border-dashed border-slate-300 p-3 text-center text-xs text-slate-400">Nothing here yet</p>}
                  </div>
                </SortableContext>
              </div>
            );
          })}
        </div>
      </DndContext>
    </div>
  );
}

/* ---------------- personal details ---------------- */

export const DETAIL_KINDS: { icon: DetailIcon; label: string; placeholder: string }[] = [
  { icon: "email", label: "Email", placeholder: "you@example.com" },
  { icon: "phone", label: "Phone", placeholder: "+44 7700 900000" },
  { icon: "location", label: "Location", placeholder: "City, Country" },
  { icon: "linkedin", label: "LinkedIn", placeholder: "linkedin.com/in/you" },
  { icon: "website", label: "Website", placeholder: "yourname.com" },
  { icon: "github", label: "Portfolio or GitHub", placeholder: "github.com/you" },
  { icon: "calendar", label: "Date of birth", placeholder: "4 March 1994" },
  { icon: "flag", label: "Nationality", placeholder: "British" },
  { icon: "car", label: "Driving licence", placeholder: "Full UK driving licence" },
  { icon: "briefcase", label: "Availability", placeholder: "Available immediately" },
  { icon: "star", label: "Highlight", placeholder: "Security cleared" },
  { icon: "user", label: "Other", placeholder: "Anything else" },
];

export function PersonalDrawer({ onPhoto }: { onPhoto: () => void }) {
  const { cv, update } = useEditor();
  const p = cv.data.personal;
  return (
    <div className="space-y-5" data-testid="personal-drawer">
      <div className="flex items-center gap-4">
        <button type="button" onClick={onPhoto} className="group relative grid h-20 w-20 flex-none place-items-center overflow-hidden rounded-full bg-slate-100 ring-1 ring-slate-200 cursor-pointer" title="Upload photo">
          {p.photo
            // eslint-disable-next-line @next/next/no-img-element
            ? <img src={p.photo} alt="" className="h-full w-full object-cover" />
            : <Camera className="h-6 w-6 text-slate-400" />}
        </button>
        <div className="space-y-1 text-sm">
          <button type="button" onClick={onPhoto} className="font-medium text-brand-600 hover:underline cursor-pointer">{p.photo ? "Change photo" : "Upload a photo"}</button>
          {p.photo && <button type="button" onClick={() => update((d) => { d.data.personal.photo = ""; })} className="block text-slate-500 hover:text-red-600 cursor-pointer">Remove photo</button>}
          <p className="text-xs text-slate-500">Usual in much of Europe and Asia; usually left off in the UK, US and Canada.</p>
        </div>
      </div>

      <label className="block">
        <span className="mb-1.5 block text-[12.5px] font-medium text-slate-600">Full name</span>
        <input className={inputCls} value={p.fullName} data-testid="full-name" onChange={(e) => update((d) => { d.data.personal.fullName = e.target.value; }, "name")} />
      </label>
      <label className="block">
        <span className="mb-1.5 block text-[12.5px] font-medium text-slate-600">Job title</span>
        <input className={inputCls} value={p.jobTitle} data-testid="job-title" onChange={(e) => update((d) => { d.data.personal.jobTitle = e.target.value; }, "jobtitle")} />
      </label>

      <div>
        <span className="mb-1.5 block text-[12.5px] font-medium text-slate-600">Contact details</span>
        <div className="space-y-2">
          {p.details.map((det, i) => {
            const meta = DETAIL_KINDS.find((x) => x.icon === det.icon) ?? DETAIL_KINDS[11];
            return (
              <div key={det.id} className="grid grid-cols-[8.5rem_minmax(0,1fr)_2rem] items-center gap-2">
                <select className={cx(inputCls, "px-2")} value={det.icon} aria-label="Kind of detail"
                  onChange={(e) => update((d) => { d.data.personal.details[i].icon = e.target.value as DetailIcon; })}>
                  {DETAIL_KINDS.map((x) => <option key={x.icon} value={x.icon}>{x.label}</option>)}
                </select>
                <input className={inputCls} value={det.value} placeholder={meta.placeholder} data-testid={`detail-${det.icon}`}
                  onChange={(e) => update((d) => { d.data.personal.details[i].value = e.target.value; }, "detail" + det.id)} />
                <IconButton label="Remove detail" onClick={() => update((d) => { d.data.personal.details.splice(i, 1); })}><X className="h-4 w-4" /></IconButton>
              </div>
            );
          })}
        </div>
        <button type="button" className="mt-2 inline-flex items-center gap-1.5 text-sm font-medium text-brand-600 hover:underline cursor-pointer"
          onClick={() => {
            const used = new Set(p.details.map((x) => x.icon));
            const icon = DETAIL_KINDS.find((x) => !used.has(x.icon))?.icon ?? "user";
            update((d) => { d.data.personal.details.push({ id: uid("d_"), icon, value: "" }); });
          }}>
          <Plus className="h-4 w-4" /> Add detail
        </button>
      </div>
    </div>
  );
}

/* ---------------- CV check ---------------- */

export function CheckDrawer({ pages }: { pages: number }) {
  const { cv } = useEditor();
  const { score, checks } = useMemo(() => checkCv(cv, pages), [cv, pages]);
  const color = score >= 85 ? "#059669" : score >= 60 ? "#d97706" : "#dc2626";
  return (
    <div data-testid="check-drawer">
      <div className="mb-5 flex items-center gap-4 rounded-xl bg-slate-50 p-4">
        <div className="relative h-16 w-16 flex-none">
          <svg viewBox="0 0 36 36" className="h-full w-full -rotate-90">
            <circle cx="18" cy="18" r="15" fill="none" stroke="#e2e8f0" strokeWidth="3.5" />
            <circle cx="18" cy="18" r="15" fill="none" stroke={color} strokeWidth="3.5" strokeLinecap="round" strokeDasharray={`${(94.2 * score) / 100} 94.2`} />
          </svg>
          <span className="absolute inset-0 grid place-items-center text-sm font-bold" data-testid="score-value">{score}%</span>
        </div>
        <div>
          <p className="font-semibold">CV score</p>
          <p className="text-[13px] text-slate-500">{score >= 85 ? "Strong. A few final touches below." : score >= 60 ? "Getting there. Fix the items below." : "Fill in the essentials below first."}</p>
        </div>
      </div>
      <ul className="space-y-2.5">
        {checks.map((c) => (
          <li key={c.title} className="flex gap-2.5">
            {c.ok ? <CheckCircle2 className="mt-0.5 h-4.5 w-4.5 flex-none text-emerald-600" /> : <Circle className="mt-0.5 h-4.5 w-4.5 flex-none text-amber-500" />}
            <div>
              <p className="text-[13.5px] font-medium">{c.title}</p>
              {!c.ok && <p className="text-[12.5px] leading-snug text-slate-500">{c.tip}</p>}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ---------------- ready made phrases ---------------- */

export function PhrasesDrawer() {
  const { cv, update, lastPath } = useEditor();
  const [cat, setCat] = useState(Object.keys(PHRASES)[0]);

  /* add to the job that was being edited, or the first job */
  const add = (text: string) => {
    const m = lastPath?.match(/^(?:bul|ent):([^:]+):([^:]+)/);
    let sid = m?.[1], eid = m?.[2];
    if (!sid || !eid) {
      const s = cv.data.sections.find((x) => x.type === "experience" && x.entries.length);
      sid = s?.id; eid = s?.entries[0]?.id;
    }
    if (!sid || !eid) return;
    let idx = 0;
    update((d) => {
      const s = d.data.sections.find((x) => x.id === sid);
      const e = s?.entries.find((x) => x.id === eid);
      if (!s || !e) return;
      s.fields.bullets = true;
      const empty = e.bullets.findIndex((b) => !b.trim());
      if (empty >= 0) e.bullets[empty] = text; else e.bullets.push(text);
      idx = empty >= 0 ? empty : e.bullets.length - 1;
    });
    focusSoon(`bul:${sid}:${eid}:${idx}`, "end");
  };

  const entryName = (() => {
    const m = lastPath?.match(/^(?:bul|ent):([^:]+):([^:]+)/);
    const s = cv.data.sections.find((x) => x.id === m?.[1]);
    return s?.entries.find((e) => e.id === m?.[2])?.title;
  })();

  return (
    <div data-testid="phrases-drawer">
      <p className="mb-3 text-[13px] text-slate-500">
        Click a line to add it as a bullet to {entryName ? <b className="text-ink">{entryName}</b> : "the job you were last editing"}. Replace anything in [square brackets] with your own details.
      </p>
      <div className="mb-3 flex flex-wrap gap-1.5">
        {Object.keys(PHRASES).map((c) => (
          <button key={c} type="button" onClick={() => setCat(c)}
            className={cx("rounded-full px-2.5 py-1 text-xs cursor-pointer", cat === c ? "bg-brand-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200")}>{c}</button>
        ))}
      </div>
      <ul className="space-y-1.5">
        {PHRASES[cat].map((p) => (
          <li key={p}>
            <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => add(p)} data-testid="phrase"
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-left text-[13px] leading-snug text-slate-700 hover:border-brand-500 cursor-pointer">
              <span className="mr-1.5 font-bold text-brand-600">+</span>{p}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ---------------- templates ---------------- */

export function TemplatesDrawer() {
  const { cv, update } = useEditor();
  const [filter, setFilter] = useState<"all" | "premium" | Category>("all");
  const previews = useMemo(
    () => Object.fromEntries(TEMPLATES.map((t) => [t.id, {
      ...cv,
      design: { ...designFor(t.id), pageSize: cv.design.pageSize, showPhoto: cv.design.showPhoto },
    } satisfies Cv])) as Record<TemplateId, Cv>,
    [cv],
  );
  const list = TEMPLATES.filter((t) => filter === "all" ? true : filter === "premium" ? t.premium : t.categories.includes(filter));

  const choose = (id: TemplateId) =>
    update((d) => {
      /* the new template brings its own look; content and your choices about photo and paper stay */
      d.design = { ...designFor(id), pageSize: d.design.pageSize, showPhoto: d.design.showPhoto, showTitle: d.design.showTitle, showIcons: d.design.showIcons };
    });

  return (
    <div data-testid="templates-drawer">
      <div className="mb-4 flex flex-wrap gap-1.5">
        {([["all", "All"], ["premium", "Premium"], ...CATEGORIES.map((c) => [c.id, c.name])] as [typeof filter, string][]).map(([k, l]) => (
          <button key={k} type="button" onClick={() => setFilter(k)}
            className={cx("rounded-full px-3 py-1 text-xs font-medium cursor-pointer", filter === k ? "bg-ink text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200")}>{l}</button>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-4">
        {list.map((t) => {
          const on = cv.design.template === t.id;
          return (
            <button key={t.id} type="button" onClick={() => choose(t.id)} data-template={t.id}
              className={cx("group relative rounded-xl border-2 p-1.5 text-left transition cursor-pointer", on ? "border-brand-500 bg-brand-50/60" : "border-transparent hover:border-slate-200")}>
              <CvThumb cv={previews[t.id]} className="rounded-md ring-1 ring-slate-200" />
              {t.premium && <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-amber-400 px-2 py-0.5 text-[10px] font-bold text-amber-950 shadow"><Crown className="h-3 w-3" />PREMIUM</span>}
              <div className="mt-2 flex items-center gap-2 px-1">
                <span className="text-sm font-semibold">{t.name}</span>
                {on && <Check className="h-4 w-4 text-brand-600" />}
              </div>
              <div className="mt-1 flex flex-wrap gap-1 px-1 pb-1">
                {t.tags.map((tag) => <span key={tag} className="rounded bg-slate-100 px-1.5 py-0.5 text-[10.5px] font-medium text-slate-600">{tag}</span>)}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ---------------- ATS checker ---------------- */

const STOP = new Set(("a about above after again all also am an and any are as at be because been before being below between both but by can could did do does doing down during each few for from further had has have having he her here hers him his how i if in into is it its itself just me more most my no nor not of off on once only or other our ours out over own same she should so some such than that the their them then there these they this those through to too under until up very was we were what when where which while who whom why will with would you your yours "
  + "hiring hire essential opportunity salary benefits apply role's job role team work working company candidate candidates experience years year ability strong excellent good great new including within across ensure ensuring responsible responsibilities required requirements preferred plus etc us our we'll you'll you're will must able join looking seeking based help day days per across key well using use").split(" "));

function keywords(text: string): string[] {
  const words = text.toLowerCase().replace(/[^a-z0-9+#.\s-]/g, " ").split(/\s+/).map((w) => w.replace(/^[-.]+|[-.]+$/g, "")).filter((w) => w.length > 2 && !STOP.has(w) && !/^\d+$/.test(w));
  const count = new Map<string, number>();
  words.forEach((w) => count.set(w, (count.get(w) ?? 0) + 1));
  for (let i = 0; i < words.length - 1; i++) {
    const bi = words[i] + " " + words[i + 1];
    count.set(bi, (count.get(bi) ?? 0) + 1.5);
  }
  return [...count.entries()]
    .filter(([k, n]) => (k.includes(" ") ? n >= 3 : n >= 1))
    .sort((a, b) => b[1] - a[1])
    .map(([k]) => k)
    .filter((k, i, all) => !all.slice(0, i).some((o) => o.includes(" ") && o.split(" ").includes(k)))
    .slice(0, 24);
}

export function AtsDrawer() {
  const { cv } = useEditor();
  const [ad, setAd] = useState("");
  const tpl = getTemplate(cv.design.template);
  const cvText = useMemo(() => {
    const p = cv.data.personal;
    const parts = [p.fullName, p.jobTitle, ...cv.data.sections.filter((s) => !s.hidden).flatMap((s) => [s.title, s.text, ...s.items.map((i) => i.name), ...s.entries.flatMap((e) => [e.title, e.subtitle, e.description, ...e.bullets])])];
    return parts.join(" ").replace(/<[^>]+>/g, " ").toLowerCase();
  }, [cv]);
  const words = useMemo(() => keywords(ad), [ad]);
  const found = words.filter((w) => cvText.includes(w));
  const missing = words.filter((w) => !cvText.includes(w));
  const pct = words.length ? Math.round((found.length / words.length) * 100) : 0;
  const layout = cv.design.layout ?? tpl.layout;
  const tips = [
    { ok: layout === "single", text: layout === "single" ? "One column layout: the safest choice for older tracking systems." : "Two column layout: modern systems read it fine; for strict ones, try a one column template." },
    { ok: cv.data.personal.details.some((d) => d.icon === "email" && d.value) && cv.data.personal.details.some((d) => d.icon === "phone" && d.value), text: "Email and phone are in the header as text." },
    { ok: cv.data.sections.some((s) => s.type === "experience" && !s.hidden) && cv.data.sections.some((s) => s.type === "education" && !s.hidden), text: "Standard Experience and Education sections are present." },
    { ok: true, text: "Your PDF is real, selectable text, so systems can read every word." },
  ];
  return (
    <div data-testid="ats-drawer">
      <p className="mb-2 text-[13px] text-slate-500">Paste the job advert. We will pick out its key words and show which ones your CV already uses.</p>
      <textarea className={cx(inputCls, "h-36 resize-y")} value={ad} onChange={(e) => setAd(e.target.value)} placeholder="Paste the job description here" data-testid="ats-input" />
      {words.length > 0 && (
        <div className="mt-4">
          <div className="mb-3 flex items-center gap-3 rounded-xl bg-slate-50 p-3">
            <span className={cx("text-2xl font-bold", pct >= 70 ? "text-emerald-600" : pct >= 45 ? "text-amber-600" : "text-red-600")} data-testid="ats-score">{pct}%</span>
            <span className="text-[13px] text-slate-600">of the advert&apos;s key words appear in your CV. Aim for 70% or more, using the words honestly where they fit.</span>
          </div>
          {missing.length > 0 && <>
            <h4 className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-500">Missing</h4>
            <div className="mb-3 flex flex-wrap gap-1.5" data-testid="ats-missing">{missing.map((w) => <span key={w} className="rounded-full bg-red-50 px-2.5 py-1 text-xs text-red-700 ring-1 ring-red-200">{w}</span>)}</div>
          </>}
          {found.length > 0 && <>
            <h4 className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-500">Already in your CV</h4>
            <div className="flex flex-wrap gap-1.5" data-testid="ats-found">{found.map((w) => <span key={w} className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs text-emerald-700 ring-1 ring-emerald-200">{w}</span>)}</div>
          </>}
        </div>
      )}
      <h4 className="mb-2 mt-6 text-[11px] font-semibold uppercase tracking-wider text-slate-500">Format</h4>
      <ul className="space-y-2">
        {tips.map((t) => (
          <li key={t.text} className="flex gap-2 text-[13px]">
            {t.ok ? <CheckCircle2 className="mt-0.5 h-4 w-4 flex-none text-emerald-600" /> : <Circle className="mt-0.5 h-4 w-4 flex-none text-amber-500" />}
            {t.text}
          </li>
        ))}
      </ul>
    </div>
  );
}
