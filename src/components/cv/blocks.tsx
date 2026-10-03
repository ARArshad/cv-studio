import type React from "react";
import type { ReactNode } from "react";
import {
  AtSign, Briefcase, Calendar, Car, Code2, Flag, Globe, MapPin, Phone, Star, User, type LucideProps,
} from "lucide-react";
import type { TemplateDef } from "@/lib/templates";
import type { Cv, Detail, DetailIcon, Entry, Item, Section } from "@/lib/types";

/**
 * Turns a CV into small blocks that pagination can move between pages:
 * a section heading always travels with its first entry, and long entry
 * descriptions can carry their later lines over to the next page.
 */

export interface Block {
  key: string;
  column: "main" | "side";
  sectionId?: string;
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

export const LEVEL_LABELS = ["", "Beginner", "Elementary", "Intermediate", "Advanced", "Expert"];
export const LANGUAGE_LABELS = ["", "Basic", "Conversational", "Proficient", "Fluent", "Native"];

/** **bold** inside a line */
export function Rich({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return (
    <>
      {parts.map((p, i) =>
        p.startsWith("**") && p.endsWith("**") && p.length > 4 ? <strong key={i}>{p.slice(2, -2)}</strong> : <span key={i}>{p}</span>,
      )}
    </>
  );
}

type Line = { kind: "p" | "li"; text: string };

export function parseLines(desc: string): Line[] {
  return desc
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l && !/^[-•*]$/.test(l))
    .map((l) => (/^([-•*]|\d+\.)\s+/.test(l) ? { kind: "li" as const, text: l.replace(/^([-•*]|\d+\.)\s+/, "") } : { kind: "p" as const, text: l }));
}

function Lines({ lines }: { lines: Line[] }) {
  const out: ReactNode[] = [];
  let ul: Line[] = [];
  const flush = (k: number) => {
    if (ul.length) out.push(<ul key={"u" + k} className="e-list">{ul.map((l, i) => <li key={i}><Rich text={l.text} /></li>)}</ul>);
    ul = [];
  };
  lines.forEach((l, i) => {
    if (l.kind === "li") ul.push(l);
    else { flush(i); out.push(<p key={i} className="e-p"><Rich text={l.text} /></p>); }
  });
  flush(lines.length);
  return <>{out}</>;
}

export function dateRange(e: Entry): string {
  const end = e.current ? "Present" : e.endDate.trim();
  const start = e.startDate.trim();
  if (start && end) return `${start} – ${end}`;
  return start || end;
}

function Heading({ s }: { s: Section }) {
  return <div className="cv-h" role="heading" aria-level={2}><span>{s.title}</span></div>;
}

function EntryHead({ e, tpl }: { e: Entry; tpl: TemplateDef }) {
  const dates = dateRange(e);
  const sub = [e.subtitle, tpl.entryStyle === "gutter" ? "" : e.location].filter((x) => x.trim()).join(", ");
  return (
    <>
      {(e.title || (dates && tpl.entryStyle !== "gutter")) && (
        <div className="e-top">
          <div className="e-title">{e.title}</div>
          {tpl.entryStyle !== "gutter" && dates && <div className="e-date">{dates}</div>}
        </div>
      )}
      {sub && <div className="e-sub">{sub}</div>}
    </>
  );
}

function EntryBlock({ e, tpl, lines, head }: { e: Entry; tpl: TemplateDef; lines: Line[]; head?: ReactNode }) {
  const body = (
    <>
      <EntryHead e={e} tpl={tpl} />
      {lines.length > 0 && <div className="e-desc"><Lines lines={lines} /></div>}
    </>
  );
  if (tpl.entryStyle === "gutter") {
    return (
      <>
        {head}
        <div className="entry gutter">
          <div className="e-when">
            <div className="e-date">{dateRange(e)}</div>
            {e.location && <div className="e-loc">{e.location}</div>}
          </div>
          <div className="e-main">{body}</div>
        </div>
      </>
    );
  }
  return <>{head}<div className="entry">{body}</div></>;
}

function Dots({ level }: { level: number }) {
  return (
    <span className="lvl-dots" aria-label={`${level} of 5`}>
      {[1, 2, 3, 4, 5].map((k) => <i key={k} className={k <= level ? "on" : ""} />)}
    </span>
  );
}

function ItemsBlock({ s, cv }: { s: Section; cv: Cv }) {
  const style = s.type === "interests" ? "tags" : cv.design.skillStyle;
  const items = s.items.filter((i) => i.name.trim());
  const label = (i: Item) => (s.type === "languages" ? LANGUAGE_LABELS : LEVEL_LABELS)[i.level] ?? "";
  if (style === "tags") {
    return <div className="tags">{items.map((i) => <span key={i.id} className="tag">{i.name}</span>)}</div>;
  }
  if (style === "text") {
    return (
      <ul className="plain">
        {items.map((i) => <li key={i.id}><span>{i.name}</span>{i.level > 0 && <span className="lvl-text">{label(i)}</span>}</li>)}
      </ul>
    );
  }
  return (
    <ul className={"levels " + style}>
      {items.map((i) => (
        <li key={i.id}>
          <span className="nm">{i.name}</span>
          {i.level > 0 && (style === "bars"
            ? <span className="lvl-bar"><i style={{ width: `${i.level * 20}%` }} /></span>
            : <Dots level={i.level} />)}
        </li>
      ))}
    </ul>
  );
}

export function DetailsList({ details, icons }: { details: Detail[]; icons: boolean }) {
  const list = details.filter((d) => d.value.trim());
  if (!list.length) return null;
  return (
    <ul className="contacts">
      {list.map((d) => {
        const Icon = ICONS[d.icon] ?? User;
        return (
          <li key={d.id}>
            {icons && <Icon className="ic" aria-hidden strokeWidth={2} />}
            <span>{d.value}</span>
          </li>
        );
      })}
    </ul>
  );
}

export function Photo({ cv }: { cv: Cv }) {
  const p = cv.data.personal;
  if (!cv.design.showPhoto || !p.photo) return null;
  return (
    <div className={"photo " + cv.design.photoShape}>
      {/* eslint-disable-next-line @next/next/no-img-element -- data URLs and print need a plain img */}
      <img src={p.photo} alt="" />
    </div>
  );
}

export function Identity({ cv }: { cv: Cv }) {
  const p = cv.data.personal;
  return (
    <div className="who">
      <div className="cv-name">{p.fullName || "Your Name"}</div>
      {p.jobTitle && <div className="cv-title">{p.jobTitle}</div>}
    </div>
  );
}

/** the full width header used by "top" and "banner" templates */
export function Header({ cv, tpl }: { cv: Cv; tpl: TemplateDef }) {
  return (
    <header className={"cv-head" + (tpl.header === "banner" ? " banner" : "")}>
      <Photo cv={cv} />
      <div className="head-text">
        <Identity cv={cv} />
        <DetailsList details={cv.data.personal.details} icons={cv.design.showIcons} />
      </div>
    </header>
  );
}

export function buildBlocks(cv: Cv, tpl: TemplateDef): Block[] {
  const out: Block[] = [];
  const hasSide = tpl.layout !== "single";
  const col = (s: Section) => (hasSide ? s.column : "main");

  if (tpl.header === "side") {
    out.push({
      key: "ident", column: "side",
      node: <div className="side-ident"><Photo cv={cv} /><Identity cv={cv} /></div>,
    });
    out.push({
      key: "contacts", column: "side",
      node: <div className="side-contacts"><DetailsList details={cv.data.personal.details} icons={cv.design.showIcons} /></div>,
    });
  }

  for (const s of cv.data.sections) {
    if (s.hidden) continue;
    const column = col(s);
    const head = <Heading s={s} />;
    const base = { column, sectionId: s.id } as const;

    if (s.type === "summary") {
      if (!s.text.trim()) { out.push({ ...base, key: s.id, node: <div className="sec">{head}</div> }); continue; }
      const lines = parseLines(s.text);
      out.push({ ...base, key: s.id, node: <div className="sec">{head}<div className="summary"><Lines lines={lines} /></div></div> });
      continue;
    }

    if (s.items.length || ["skills", "languages", "interests"].includes(s.type)) {
      out.push({ ...base, key: s.id, node: <div className="sec">{head}<ItemsBlock s={s} cv={cv} /></div> });
      continue;
    }

    const entries = s.entries.length ? s.entries : [];
    if (!entries.length) { out.push({ ...base, key: s.id, node: <div className="sec">{head}</div> }); continue; }
    entries.forEach((e, i) => {
      const lines = parseLines(e.description);
      /* keep the head with its first two lines; later lines may carry over */
      const firstCut = Math.min(lines.length, 2);
      out.push({
        ...base,
        key: `${s.id}:${e.id}`,
        node: (
          <div className={"sec-part" + (i === 0 ? " sec first" : " next")}>
            <EntryBlock e={e} tpl={tpl} lines={lines.slice(0, firstCut)} head={i === 0 ? head : undefined} />
          </div>
        ),
      });
      lines.slice(firstCut).forEach((l, j) => {
        out.push({
          ...base,
          key: `${s.id}:${e.id}:${j}`,
          node: (
            <div className={"cont" + (tpl.entryStyle === "gutter" ? " gutter" : "")}>
              <div className="e-desc"><Lines lines={[l]} /></div>
            </div>
          ),
        });
      });
    });
  }
  return out;
}
