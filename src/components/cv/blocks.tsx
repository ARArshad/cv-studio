"use client";

import type React from "react";
import type { ReactNode } from "react";
import {
  ArrowDown, ArrowLeftRight, ArrowUp, AtSign, Award, BadgeCheck, BookOpen, Briefcase, Building2, Calendar, Car, Code2,
  EyeOff, Flag, FolderKanban, Globe, GraduationCap, HandHeart, Heart, Languages, Laptop, MapPin, Mic, Newspaper, Phone,
  Plus, Presentation, Quote, Settings2, Smile, Star, Trash2, Trophy, User, Users, Wrench, X, Zap, type LucideProps,
} from "lucide-react";
import type { TemplateDef } from "@/lib/templates";
import { formatDate } from "@/lib/dates";
import { kindOf } from "@/lib/sample";
import type { Cv, DateFormat, Detail, DetailIcon, Entry, Item, Section, SectionType } from "@/lib/types";
import { Ed, splitAtCaret, useEdit } from "./edit";

/**
 * Turns a CV into small blocks that pagination can move between pages:
 * a section heading always travels with its first entry, and long entries
 * can carry their later bullets over to the next page.
 */

export interface Block {
  key: string;
  column: "main" | "side";
  sectionId?: string;
  /** where this block sits in its section, for spacing and card styles */
  pos?: "first" | "mid" | "last" | "only";
  /** first block of an entry that is not the section's first */
  entryStart?: boolean;
  node: ReactNode;
}

/* a plain "in" mark; brand logos are not part of the icon set */
function InMark({ className }: LucideProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden fill="currentColor">
      <path d="M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5ZM3 9.75h4v11H3v-11Zm6.5 0h3.8v1.6h.06c.53-.95 1.83-1.95 3.77-1.95 4.03 0 4.77 2.5 4.77 5.76v5.59h-4v-4.96c0-1.18-.02-2.7-1.7-2.7-1.7 0-1.96 1.28-1.96 2.61v5.05h-4v-11Z" />
    </svg>
  );
}

const ICONS: Record<DetailIcon, (p: LucideProps) => React.ReactNode> = {
  email: AtSign, phone: Phone, location: MapPin, website: Globe, linkedin: InMark, github: Code2,
  calendar: Calendar, flag: Flag, car: Car, user: User, briefcase: Briefcase, star: Star,
};

export const SECTION_ICONS: Record<SectionType, (p: LucideProps) => React.ReactNode> = {
  summary: User, experience: Briefcase, education: GraduationCap, skills: Wrench, languages: Languages,
  projects: FolderKanban, certificates: BadgeCheck, courses: BookOpen, awards: Trophy, volunteering: HandHeart,
  strengths: Zap, publications: Newspaper, interests: Heart, references: Users, custom: Star,
  softSkills: Smile, organizations: Building2, conferences: Mic, teaching: Presentation, freelance: Laptop,
  testimonials: Quote, honors: Award,
};

export const LEVEL_LABELS = ["", "Beginner", "Elementary", "Intermediate", "Advanced", "Expert"];
export const LANGUAGE_LABELS = ["", "Basic", "Conversational", "Proficient", "Fluent", "Native"];

export function dateRange(e: Entry, fmt: DateFormat = "mon yyyy"): string {
  const end = e.current ? "Present" : formatDate(e.endDate, fmt);
  const start = formatDate(e.startDate, fmt);
  if (start && end) return `${start} – ${end}`;
  return start || end;
}

/* ---------------- small editing controls, never measured, never printed ---------------- */

function Tool({ label, onClick, children, danger }: { label: string; onClick: (e: React.MouseEvent<HTMLButtonElement>) => void; children: ReactNode; danger?: boolean }) {
  return (
    <button type="button" className={"tb" + (danger ? " danger" : "")} title={label} aria-label={label}
      onMouseDown={(e) => e.preventDefault()} onClick={(e) => { e.stopPropagation(); onClick(e); }}>
      {children}
    </button>
  );
}

function SectionBar({ s, cv, tpl }: { s: Section; cv: Cv; tpl: TemplateDef }) {
  const ed = useEdit();
  if (!ed?.on || ed.measure) return null;
  const twoCols = (cv.design.layout ?? tpl.layout) !== "single";
  const kind = kindOf(s.type);
  return (
    <div className="edit-ui sec-bar" data-testid="section-bar">
      {kind !== "text" && (
        <Tool label={kind === "items" ? "Add item" : "Add entry"} onClick={() => ed.act(kind === "items" ? { t: "addItem", sid: s.id } : { t: "addEntry", sid: s.id })}>
          <Plus /><span>{kind === "items" ? "Item" : "Entry"}</span>
        </Tool>
      )}
      <Tool label="Move section up" onClick={() => ed.act({ t: "moveSection", sid: s.id, dir: -1 })}><ArrowUp /></Tool>
      <Tool label="Move section down" onClick={() => ed.act({ t: "moveSection", sid: s.id, dir: 1 })}><ArrowDown /></Tool>
      {twoCols && <Tool label={s.column === "side" ? "Move to main column" : "Move to sidebar"} onClick={() => ed.act({ t: "colSection", sid: s.id })}><ArrowLeftRight /></Tool>}
      <Tool label="Hide section" onClick={() => ed.act({ t: "hideSection", sid: s.id })}><EyeOff /></Tool>
      <Tool label="Delete section" danger onClick={() => ed.act({ t: "delSection", sid: s.id })}><Trash2 /></Tool>
    </div>
  );
}

function EntryBar({ s, e }: { s: Section; e: Entry }) {
  const ed = useEdit();
  if (!ed?.on || ed.measure) return null;
  return (
    <div className="edit-ui entry-bar" data-testid="entry-bar">
      <Tool label="Add entry below" onClick={() => ed.act({ t: "addEntry", sid: s.id, after: e.id })}><Plus /></Tool>
      {s.fields.bullets && <Tool label="Add bullet" onClick={() => ed.act({ t: "addBullet", sid: s.id, eid: e.id })}><span className="tb-txt">•+</span></Tool>}
      <Tool label="Move up" onClick={() => ed.act({ t: "moveEntry", sid: s.id, eid: e.id, dir: -1 })}><ArrowUp /></Tool>
      <Tool label="Move down" onClick={() => ed.act({ t: "moveEntry", sid: s.id, eid: e.id, dir: 1 })}><ArrowDown /></Tool>
      <Tool label="Show or hide parts" onClick={(ev) => ed.act({ t: "entryMenu", sid: s.id, eid: e.id, anchor: ev.currentTarget.getBoundingClientRect() })}><Settings2 /></Tool>
      <Tool label="Delete entry" danger onClick={() => ed.act({ t: "delEntry", sid: s.id, eid: e.id })}><Trash2 /></Tool>
    </div>
  );
}

/* ---------------- headings ---------------- */

function Heading({ s, cv, tpl }: { s: Section; cv: Cv; tpl: TemplateDef }) {
  const Icon = SECTION_ICONS[s.type] ?? Star;
  return (
    <div className="cv-h" role="heading" aria-level={2}>
      {cv.design.headingIcons && <span className="h-ic"><Icon aria-hidden strokeWidth={2} /></span>}
      <Ed path={`sec:${s.id}:title`} value={s.title} ph="Section title" className="h-tx" />
      <SectionBar s={s} cv={cv} tpl={tpl} />
    </div>
  );
}

/* ---------------- entries ---------------- */

function BulletLine({ s, e, i }: { s: Section; e: Entry; i: number }) {
  const ed = useEdit();
  return (
    <li>
      <Ed
        path={`bul:${s.id}:${e.id}:${i}`}
        value={e.bullets[i] ?? ""}
        rich
        ph="Describe an achievement"
        onEnter={(el) => { const { before, after } = splitAtCaret(el); ed?.act({ t: "splitBullet", sid: s.id, eid: e.id, idx: i, before, after }); }}
        onBackspaceEmpty={() => ed?.act({ t: "delBullet", sid: s.id, eid: e.id, idx: i })}
      />
    </li>
  );
}

type Line = { kind: "desc" } | { kind: "bul"; i: number };

function linesOf(s: Section, e: Entry, editing: boolean): Line[] {
  const out: Line[] = [];
  if (s.fields.description && (e.description || editing)) out.push({ kind: "desc" });
  if (s.fields.bullets) e.bullets.forEach((b, i) => { if (b || editing) out.push({ kind: "bul", i }); });
  return out;
}

function Lines({ s, e, lines }: { s: Section; e: Entry; lines: Line[] }) {
  const out: ReactNode[] = [];
  let run: number[] = [];
  const flush = (k: string) => {
    if (run.length) out.push(<ul key={k} className="e-list">{run.map((i) => <BulletLine key={i} s={s} e={e} i={i} />)}</ul>);
    run = [];
  };
  lines.forEach((l, n) => {
    if (l.kind === "bul") run.push(l.i);
    else { flush("u" + n); out.push(<Ed key={"d" + n} as="p" className="e-p" path={`ent:${s.id}:${e.id}:description`} value={e.description} rich ph="Short description" />); }
  });
  flush("end");
  return <>{out}</>;
}

const TITLE_PH: Partial<Record<SectionType, string>> = {
  experience: "Job title", education: "Degree or qualification", projects: "Project name", certificates: "Certificate",
  courses: "Course", awards: "Achievement", volunteering: "Role", strengths: "Strength", publications: "Title", references: "Name",
};
const SUB_PH: Partial<Record<SectionType, string>> = {
  experience: "Company", education: "School or university", projects: "Your role", certificates: "Issued by",
  courses: "Provider", volunteering: "Organisation", publications: "Publisher", references: "Job title and company",
};
const SINGLE_DATE: SectionType[] = ["certificates", "awards", "publications", "honors"];

/** dates open a picker in the editor; elsewhere they are plain text */
function DateText({ s, e, which, fmt }: { s: Section; e: Entry; which: "start" | "end"; fmt: DateFormat }) {
  const ed = useEdit();
  const raw = which === "start" ? e.startDate : e.endDate;
  const text = which === "end" && e.current ? "Present" : formatDate(raw, fmt);
  const live = !!ed?.on && !ed.measure;
  if (!ed?.on) return text ? <span>{text}</span> : null;
  return (
    <span
      className={"ed-date" + (text ? "" : " empty")}
      data-ph={which === "start" ? "Start" : SINGLE_DATE.includes(s.type) ? "Date" : "End"}
      role={live ? "button" : undefined}
      tabIndex={live ? 0 : undefined}
      data-date={live ? `${s.id}:${e.id}:${which}` : undefined}
      onMouseDown={live ? (ev) => ev.preventDefault() : undefined}
      onClick={live ? (ev) => { ev.stopPropagation(); ed.act({ t: "datePicker", sid: s.id, eid: e.id, which, anchor: ev.currentTarget.getBoundingClientRect() }); } : undefined}
    >{text}</span>
  );
}

function Dates({ s, e, editing, fmt }: { s: Section; e: Entry; editing: boolean; fmt: DateFormat }) {
  if (!s.fields.dates || (!editing && !dateRange(e, fmt))) return null;
  if (SINGLE_DATE.includes(s.type)) return <span className="e-date"><DateText s={s} e={e} which="end" fmt={fmt} /></span>;
  return (
    <span className="e-date">
      <DateText s={s} e={e} which="start" fmt={fmt} />
      {(editing || (e.startDate && (e.endDate || e.current))) && <span className="e-dash"> – </span>}
      <DateText s={s} e={e} which="end" fmt={fmt} />
    </span>
  );
}

function EntryHead({ s, e, tpl, editing, fmt }: { s: Section; e: Entry; tpl: TemplateDef; editing: boolean; fmt: DateFormat }) {
  const f = s.fields;
  const p = (k: string) => `ent:${s.id}:${e.id}:${k}`;
  const gutter = tpl.entryStyle === "gutter";
  const sub = f.subtitle && (editing || e.subtitle) ? <Ed path={p("subtitle")} value={e.subtitle} ph={SUB_PH[s.type] ?? "Organisation"} className="e-org" /> : null;
  const loc = f.location && !gutter && (editing || e.location) ? <Ed path={p("location")} value={e.location} ph="City" className="e-loc" /> : null;
  return (
    <>
      <div className="e-top">
        <Ed path={p("title")} value={e.title} ph={TITLE_PH[s.type] ?? "Title"} className="e-title" />
        {!gutter && <Dates s={s} e={e} editing={editing} fmt={fmt} />}
      </div>
      {(sub || loc) && <div className="e-sub">{sub}{sub && loc && <span className="e-sep" />}{loc}</div>}
    </>
  );
}

function EntryView({ s, e, tpl, lines, editing, head, fmt }: { s: Section; e: Entry; tpl: TemplateDef; lines: Line[]; editing: boolean; head?: ReactNode; fmt: DateFormat }) {
  const body = (
    <>
      <EntryHead s={s} e={e} tpl={tpl} editing={editing} fmt={fmt} />
      {lines.length > 0 && <div className="e-desc"><Lines s={s} e={e} lines={lines} /></div>}
    </>
  );
  if (tpl.entryStyle === "gutter") {
    return (
      <>
        {head}
        <div className="entry gutter">
          <div className="e-when">
            <Dates s={s} e={e} editing={editing} fmt={fmt} />
            {s.fields.location && (editing || e.location) && <Ed as="div" path={`ent:${s.id}:${e.id}:location`} value={e.location} ph="City" className="e-loc" />}
          </div>
          <div className="e-main">{body}</div>
          <EntryBar s={s} e={e} />
        </div>
      </>
    );
  }
  return <>{head}<div className={"entry" + (tpl.entryStyle === "timeline" ? " tl" : "")}>{body}<EntryBar s={s} e={e} /></div></>;
}

/* ---------------- skills, languages, interests ---------------- */

function Ring({ level }: { level: number }) {
  const c = 2 * Math.PI * 15;
  return (
    <svg className="ring" viewBox="0 0 36 36" aria-hidden>
      <circle cx="18" cy="18" r="15" className="ring-bg" />
      <circle cx="18" cy="18" r="15" className="ring-fg" strokeDasharray={`${(c * level) / 5} ${c}`} transform="rotate(-90 18 18)" />
    </svg>
  );
}

function Levels({ s, it, style }: { s: Section; it: Item; style: string }) {
  const ed = useEdit();
  const live = !!ed?.on && !ed.measure;
  const set = (k: number) => { if (live) ed!.act({ t: "level", sid: s.id, iid: it.id, level: it.level === k ? 0 : k }); };
  if (!it.level && !ed?.on) return null;
  if (style === "bars") {
    return (
      <span className="lvl-bar">
        <i style={{ width: `${it.level * 20}%` }} />
        {live && [1, 2, 3, 4, 5].map((k) => <button key={k} type="button" className="lvl-hit" style={{ left: `${(k - 1) * 20}%` }} onMouseDown={(e) => e.preventDefault()} onClick={() => set(k)} aria-label={`Level ${k}`} />)}
      </span>
    );
  }
  return (
    <span className={style === "blocks" ? "lvl-blocks" : "lvl-dots"} aria-label={`${it.level} of 5`}>
      {[1, 2, 3, 4, 5].map((k) => live
        ? <button key={k} type="button" className={k <= it.level ? "on" : ""} onMouseDown={(e) => e.preventDefault()} onClick={() => set(k)} aria-label={`Level ${k}`} />
        : <i key={k} className={k <= it.level ? "on" : ""} />)}
    </span>
  );
}

function ItemsBlock({ s, cv }: { s: Section; cv: Cv }) {
  const ed = useEdit();
  const editing = !!ed?.on;
  const live = editing && !ed!.measure;
  const base = cv.design.skillStyle;
  const style = s.type === "interests" || s.type === "softSkills" ? "tags" : base;
  const items = s.items.filter((i) => editing || i.name.trim());
  const labels = s.type === "languages" ? LANGUAGE_LABELS : LEVEL_LABELS;
  const name = (it: Item) => (
    <Ed path={`item:${s.id}:${it.id}`} value={it.name} ph={s.type === "languages" ? "Language" : s.type === "interests" ? "Interest" : "Skill"} className="nm"
      onEnter={() => ed?.act({ t: "addItem", sid: s.id, after: it.id })}
      onBackspaceEmpty={() => ed?.act({ t: "delItem", sid: s.id, iid: it.id })} />
  );
  const del = (it: Item) => live && (
    <button type="button" className="edit-ui item-x" aria-label="Remove" onMouseDown={(e) => e.preventDefault()} onClick={() => ed!.act({ t: "delItem", sid: s.id, iid: it.id })}><X /></button>
  );
  if (style === "tags") {
    return <div className="tags">{items.map((it) => <span key={it.id} className="tag">{name(it)}{del(it)}</span>)}</div>;
  }
  if (style === "text") {
    return (
      <ul className="plain">
        {items.map((it) => <li key={it.id}>{name(it)}{it.level > 0 && <span className="lvl-text">{labels[it.level]}</span>}{del(it)}</li>)}
      </ul>
    );
  }
  if (style === "rings") {
    return (
      <ul className="levels rings">
        {items.map((it) => (
          <li key={it.id}>
            <span className="ring-wrap" onClick={live ? () => ed!.act({ t: "level", sid: s.id, iid: it.id, level: it.level >= 5 ? 1 : it.level + 1 }) : undefined}>
              <Ring level={it.level} />
            </span>
            {name(it)}{del(it)}
          </li>
        ))}
      </ul>
    );
  }
  return (
    <ul className={"levels " + style}>
      {items.map((it) => (
        <li key={it.id}>
          {name(it)}
          <Levels s={s} it={it} style={style} />
          {del(it)}
        </li>
      ))}
    </ul>
  );
}

/* ---------------- identity ---------------- */

const DETAIL_PH: Partial<Record<DetailIcon, string>> = {
  email: "Email", phone: "Phone", location: "City, Country", website: "Website", linkedin: "LinkedIn", github: "Portfolio",
  calendar: "Date of birth", flag: "Nationality", car: "Driving licence",
};

export function DetailsList({ details, icons }: { details: Detail[]; icons: boolean }) {
  const ed = useEdit();
  const list = details.filter((d) => ed?.on || d.value.trim());
  if (!list.length) return null;
  return (
    <ul className="contacts">
      {list.map((d) => {
        const Icon = ICONS[d.icon] ?? User;
        return (
          <li key={d.id}>
            {icons && <Icon className="ic" aria-hidden strokeWidth={2} />}
            <Ed path={`detail:${d.id}`} value={d.value} ph={DETAIL_PH[d.icon] ?? "Detail"} />
          </li>
        );
      })}
    </ul>
  );
}

export function Photo({ cv }: { cv: Cv }) {
  const ed = useEdit();
  const p = cv.data.personal;
  const live = !!ed?.on && !ed.measure;
  if (!cv.design.showPhoto || (!p.photo && !ed?.on)) return null;
  return (
    <div className={"photo " + cv.design.photoShape + (p.photo ? "" : " empty")} onClick={live ? () => ed!.act({ t: "photo" }) : undefined}>
      {p.photo
        // eslint-disable-next-line @next/next/no-img-element -- data URLs and print need a plain img
        ? <img src={p.photo} alt="" />
        : <span className="photo-ph"><User aria-hidden /></span>}
      {live && <span className="edit-ui photo-edit">{p.photo ? "Change photo" : "Add photo"}</span>}
    </div>
  );
}

export function initials(name: string): string {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]?.toUpperCase()).join("") || "CV";
}

export function Identity({ cv }: { cv: Cv }) {
  const p = cv.data.personal;
  return (
    <div className="who">
      <Ed as="div" path="name" value={p.fullName} ph="Your Name" className="cv-name" />
      {cv.design.showTitle && <Ed as="div" path="title" value={p.jobTitle} ph="Job title you want" className="cv-title" />}
    </div>
  );
}

/** the full width header used by "top" and "banner" templates */
export function Header({ cv, tpl }: { cv: Cv; tpl: TemplateDef }) {
  const summary = tpl.summaryInHeader ? cv.data.sections.find((x) => x.type === "summary" && !x.hidden) : undefined;
  return (
    <header className={"cv-head" + (tpl.header === "banner" ? " banner" : "") + (summary ? " with-summary" : "")}>
      <span className="monogram" aria-hidden><span>{initials(cv.data.personal.fullName)}</span></span>
      <Photo cv={cv} />
      <div className="head-text">
        <Identity cv={cv} />
        {summary && <Ed as="div" className="head-summary" path={`sec:${summary.id}:text`} value={summary.text} rich ph="Two to four lines on who you are and what you bring." />}
        <DetailsList details={cv.data.personal.details} icons={cv.design.showIcons} />
      </div>
      <svg className="head-wave" viewBox="0 0 800 60" preserveAspectRatio="none" aria-hidden>
        <path d="M0,0 L800,0 L800,22 C620,70 420,-10 230,30 C130,52 50,40 0,26 Z" />
      </svg>
    </header>
  );
}

/* ---------------- blocks ---------------- */

export function buildBlocks(cv: Cv, tpl: TemplateDef, editing: boolean): Block[] {
  const out: Block[] = [];
  const layout = cv.design.layout ?? tpl.layout;
  const hasSide = layout !== "single";
  const col = (s: Section) => (hasSide ? s.column : "main");

  if (tpl.header === "side" && hasSide) {
    out.push({ key: "ident", column: "side", node: <div className="side-ident"><Photo cv={cv} /><Identity cv={cv} /></div> });
    out.push({ key: "contacts", column: "side", node: <div className="side-contacts"><DetailsList details={cv.data.personal.details} icons={cv.design.showIcons} /></div> });
  }

  const summaryUp = tpl.summaryInHeader && !(tpl.header === "side" && hasSide);
  let summarySkipped = false;
  for (const s of cv.data.sections) {
    if (s.hidden) continue;
    if (summaryUp && s.type === "summary" && !summarySkipped) { summarySkipped = true; continue; }
    const column = col(s);
    const head = <Heading s={s} cv={cv} tpl={tpl} />;
    const base = { column, sectionId: s.id } as const;
    const startAt = out.length;

    if (s.type === "summary") {
      out.push({ ...base, key: s.id, node: <div className="sec">{head}<Ed as="div" className="summary" path={`sec:${s.id}:text`} value={s.text} rich ph="Two to four lines on who you are and what you bring." /></div> });
    } else if (kindOf(s.type) === "items") {
      out.push({ ...base, key: s.id, node: <div className="sec">{head}<ItemsBlock s={s} cv={cv} /></div> });
    } else if (!s.entries.length) {
      out.push({ ...base, key: s.id, node: <div className="sec">{head}</div> });
    } else {
      s.entries.forEach((e, i) => {
        const lines = linesOf(s, e, editing);
        /* keep the head with its first two lines; later lines may carry over */
        const cut = Math.min(lines.length, 2);
        out.push({
          ...base,
          key: `${s.id}:${e.id}`,
          entryStart: i > 0,
          node: (
            <div className={(i === 0 ? "sec" : "sec-part") + " t-" + s.type}>
              <EntryView s={s} e={e} tpl={tpl} lines={lines.slice(0, cut)} editing={editing} head={i === 0 ? head : undefined} fmt={cv.design.dateFormat ?? "mon yyyy"} />
            </div>
          ),
        });
        lines.slice(cut).forEach((l, j) => {
          out.push({
            ...base,
            key: `${s.id}:${e.id}:${l.kind === "bul" ? "b" + l.i : "d"}:${j}`,
            node: (
              <div className={"cont" + (tpl.entryStyle === "gutter" ? " gutter" : tpl.entryStyle === "timeline" ? " tl" : "")}>
                <div className="e-desc"><Lines s={s} e={e} lines={[l]} /></div>
              </div>
            ),
          });
        });
      });
    }
    const n = out.length - startAt;
    out.slice(startAt).forEach((b, k) => { b.pos = n === 1 ? "only" : k === 0 ? "first" : k === n - 1 ? "last" : "mid"; });
  }
  return out;
}
