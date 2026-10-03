import { focusSoon, type Action } from "@/components/cv/edit";
import { defaultColumn } from "@/lib/templates";
import { newEntry, newItem } from "@/lib/sample";
import type { CvData, Design, Entry } from "@/lib/types";

export type Draft = { data: CvData; design: Design };

/**
 * Writes a value typed on the page back into the document. Paths come
 * from the <Ed> fields in src/components/cv/blocks.tsx.
 */
export function applyPath(d: Draft, path: string, value: string) {
  const [kind, a, b, c] = path.split(":");
  const sec = (id: string) => d.data.sections.find((s) => s.id === id);
  const ent = (sid: string, eid: string) => sec(sid)?.entries.find((e) => e.id === eid);
  switch (kind) {
    case "name": d.data.personal.fullName = value; break;
    case "title": d.data.personal.jobTitle = value; break;
    case "detail": { const x = d.data.personal.details.find((x) => x.id === a); if (x) x.value = value; break; }
    case "sec": { const s = sec(a); if (s && (b === "title" || b === "text")) s[b] = value; break; }
    case "ent": {
      const e = ent(a, b);
      if (e && ["title", "subtitle", "location", "startDate", "endDate", "description"].includes(c)) (e as unknown as Record<string, string>)[c] = value;
      break;
    }
    case "bul": { const e = ent(a, b); if (e) e.bullets[Number(c)] = value; break; }
    case "item": { const it = sec(a)?.items.find((i) => i.id === b); if (it) it.name = value; break; }
  }
}

/** structural changes from the toolbars on the page; returns false if nothing happened */
export function applyAction(d: Draft, act: Action): boolean {
  const sections = d.data.sections;
  const si = "sid" in act ? sections.findIndex((s) => s.id === act.sid) : -1;
  const s = si >= 0 ? sections[si] : undefined;
  const ei = s && "eid" in act ? s.entries.findIndex((e) => e.id === act.eid) : -1;
  const e: Entry | undefined = s && ei >= 0 ? s.entries[ei] : undefined;

  switch (act.t) {
    case "addEntry": {
      if (!s) return false;
      const n = newEntry({ bullets: s.fields.bullets ? [""] : [] });
      const at = act.after ? s.entries.findIndex((x) => x.id === act.after) + 1 : s.entries.length;
      s.entries.splice(at, 0, n);
      focusSoon(`ent:${s.id}:${n.id}:title`, "start");
      return true;
    }
    case "moveEntry": {
      if (!s || !e) return false;
      const to = ei + act.dir;
      if (to < 0 || to >= s.entries.length) return false;
      s.entries.splice(ei, 1);
      s.entries.splice(to, 0, e);
      return true;
    }
    case "delEntry":
      if (!s || ei < 0) return false;
      s.entries.splice(ei, 1);
      return true;
    case "splitBullet":
      if (!e) return false;
      e.bullets[act.idx] = act.before;
      e.bullets.splice(act.idx + 1, 0, act.after);
      focusSoon(`bul:${s!.id}:${e.id}:${act.idx + 1}`, "start");
      return true;
    case "addBullet":
      if (!e) return false;
      if (!s!.fields.bullets) s!.fields.bullets = true;
      e.bullets.push("");
      focusSoon(`bul:${s!.id}:${e.id}:${e.bullets.length - 1}`, "start");
      return true;
    case "delBullet":
      if (!e) return false;
      e.bullets.splice(act.idx, 1);
      if (act.idx > 0) focusSoon(`bul:${s!.id}:${e.id}:${act.idx - 1}`, "end");
      else focusSoon(`ent:${s!.id}:${e.id}:title`, "end");
      return true;
    case "addItem": {
      if (!s) return false;
      const n = newItem("", s.type === "interests" ? 0 : 3);
      const at = act.after ? s.items.findIndex((x) => x.id === act.after) + 1 : s.items.length;
      s.items.splice(at, 0, n);
      focusSoon(`item:${s.id}:${n.id}`, "start");
      return true;
    }
    case "delItem": {
      if (!s) return false;
      const i = s.items.findIndex((x) => x.id === act.iid);
      if (i < 0) return false;
      s.items.splice(i, 1);
      if (i > 0) focusSoon(`item:${s.id}:${s.items[i - 1].id}`, "end");
      return true;
    }
    case "level": {
      const it = s?.items.find((x) => x.id === act.iid);
      if (!it) return false;
      it.level = act.level;
      return true;
    }
    case "moveSection": {
      if (!s) return false;
      /* move past the next visible section in the same column */
      let to = si + act.dir;
      while (to >= 0 && to < sections.length && (sections[to].hidden || sections[to].column !== s.column)) to += act.dir;
      if (to < 0 || to >= sections.length) return false;
      sections.splice(si, 1);
      sections.splice(to, 0, s);
      return true;
    }
    case "delSection":
      if (!s) return false;
      sections.splice(si, 1);
      return true;
    case "hideSection":
      if (!s) return false;
      s.hidden = !s.hidden;
      return true;
    case "colSection":
      if (!s) return false;
      s.column = s.column === "side" ? "main" : "side";
      return true;
    default:
      return false;
  }
}

export { defaultColumn };
