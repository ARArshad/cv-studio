"use client";

import { useSyncExternalStore } from "react";
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { normaliseCv } from "./io";
import { makeCv, uid } from "./sample";
import type { Persona } from "./templates";
import type { Cv, CvData, Design, Entry, SectionType, TemplateId } from "./types";

/**
 * Every CV the person has, kept in the browser's local storage.
 *
 * This is the only module that knows where CVs live. To add accounts, keep
 * the same actions and have them write through to a server as well (see
 * README, "Accounts and payments").
 */

type Snapshot = { data: CvData; design: Design };

/** a bullet, entry or summary kept to reuse in any CV */
export interface SavedItem {
  id: string;
  kind: "bullet" | "entry" | "summary";
  sectionType?: SectionType;
  /** rich text for bullets and summaries */
  text?: string;
  entry?: Entry;
  createdAt: number;
}

interface LibraryState {
  cvs: Record<string, Cv>;
  /** undo and redo for the CV open in the editor; not saved */
  past: Snapshot[];
  future: Snapshot[];
  historyFor: string | null;

  createCv: (opts?: { title?: string; template?: TemplateId; start?: "example" | "blank"; persona?: Persona }) => string;
  addCv: (cv: Cv) => string;
  duplicateCv: (id: string) => string | null;
  renameCv: (id: string, title: string) => void;
  deleteCv: (id: string) => void;
  /** change a CV; `group` merges quick changes (typing) into one undo step */
  updateCv: (id: string, fn: (s: Snapshot) => void, group?: string) => void;
  undo: (id: string) => void;
  redo: (id: string) => void;
  startEditing: (id: string) => void;

  saved: SavedItem[];
  saveItem: (item: Omit<SavedItem, "id" | "createdAt">) => void;
  removeSaved: (id: string) => void;
}

const HISTORY_LIMIT = 100;
let lastGroup = "";
let lastGroupAt = 0;

function clone<T>(v: T): T {
  return JSON.parse(JSON.stringify(v));
}

export const useLibrary = create<LibraryState>()(
  persist(
    (set, get) => ({
      cvs: {},
      past: [],
      future: [],
      historyFor: null,

      createCv: (opts) => {
        const cv = makeCv(opts);
        set((s) => ({ cvs: { ...s.cvs, [cv.id]: cv } }));
        return cv.id;
      },

      addCv: (cv) => {
        const id = uid("cv_");
        const now = Date.now();
        set((s) => ({ cvs: { ...s.cvs, [id]: { ...cv, id, createdAt: now, updatedAt: now } } }));
        return id;
      },

      duplicateCv: (id) => {
        const src = get().cvs[id];
        if (!src) return null;
        return get().addCv({ ...clone(src), title: `Copy of ${src.title}` });
      },

      renameCv: (id, title) =>
        set((s) => {
          const cv = s.cvs[id];
          if (!cv) return s;
          return { cvs: { ...s.cvs, [id]: { ...cv, title: title.trim() || "Untitled CV", updatedAt: Date.now() } } };
        }),

      deleteCv: (id) =>
        set((s) => {
          const next = { ...s.cvs };
          delete next[id];
          return { cvs: next };
        }),

      updateCv: (id, fn, group) =>
        set((s) => {
          const cv = s.cvs[id];
          if (!cv) return s;
          const before: Snapshot = { data: cv.data, design: cv.design };
          const draft: Snapshot = clone(before);
          fn(draft);
          const now = Date.now();
          const merge = group && group === lastGroup && now - lastGroupAt < 1200;
          lastGroup = group ?? "";
          lastGroupAt = now;
          const past = s.historyFor === id ? s.past : [];
          return {
            cvs: { ...s.cvs, [id]: { ...cv, data: draft.data, design: draft.design, updatedAt: now } },
            past: merge ? past : [...past, before].slice(-HISTORY_LIMIT),
            future: [],
            historyFor: id,
          };
        }),

      undo: (id) =>
        set((s) => {
          const cv = s.cvs[id];
          if (!cv || s.historyFor !== id || !s.past.length) return s;
          const prev = s.past[s.past.length - 1];
          lastGroup = "";
          return {
            cvs: { ...s.cvs, [id]: { ...cv, ...prev, updatedAt: Date.now() } },
            past: s.past.slice(0, -1),
            future: [{ data: cv.data, design: cv.design }, ...s.future],
          };
        }),

      redo: (id) =>
        set((s) => {
          const cv = s.cvs[id];
          if (!cv || s.historyFor !== id || !s.future.length) return s;
          const next = s.future[0];
          lastGroup = "";
          return {
            cvs: { ...s.cvs, [id]: { ...cv, ...next, updatedAt: Date.now() } },
            past: [...s.past, { data: cv.data, design: cv.design }],
            future: s.future.slice(1),
          };
        }),

      saved: [],
      saveItem: (item) => set((s) => ({ saved: [{ ...clone(item), id: uid("sv_"), createdAt: Date.now() }, ...s.saved].slice(0, 300) })),
      removeSaved: (id) => set((s) => ({ saved: s.saved.filter((x) => x.id !== id) })),

      startEditing: (id) =>
        set((s) => (s.historyFor === id ? s : { past: [], future: [], historyFor: id })),
    }),
    {
      name: "cv-studio:library",
      version: 2,
      /* version 1 kept bullets as "- " lines with **bold**; bring those across */
      migrate: (persisted, from) => {
        const st = persisted as { cvs?: Record<string, unknown> };
        if (from < 2 && st?.cvs) {
          const next: Record<string, Cv> = {};
          for (const [k, v] of Object.entries(st.cvs)) { const cv = normaliseCv(v); if (cv) next[k] = { ...cv, id: k }; }
          return { ...st, cvs: next } as never;
        }
        return persisted as never;
      },
      /* window.localStorage, so the server (where Node may have its own) never touches it */
      storage: createJSONStorage(() => window.localStorage),
      partialize: (s) => ({ cvs: s.cvs, saved: s.saved }),
    },
  ),
);

/** true once the saved CVs have been read from local storage */
export function useHydrated(): boolean {
  return useSyncExternalStore(
    (cb) => useLibrary.persist.onFinishHydration(cb),
    () => useLibrary.persist.hasHydrated(),
    () => false,
  );
}
