"use client";

import { useSyncExternalStore } from "react";
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { browserStorage, getStorageProblem } from "./browserStorage";
import { makeLetter } from "./letters";
import { normaliseCv } from "./io";
import { makeCv, newEntry, SECTION_LABELS, uid } from "./sample";
import type { Persona } from "./templates";
import type {
  Cv,
  CvData,
  Design,
  Entry,
  SectionType,
  TemplateId,
} from "./types";

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

export interface DeletedCv {
  cv: Cv;
  deletedAt: number;
}

interface LibraryState {
  createLetter: (sourceId?: string) => string;
  tagCv: (id: string, tags: string[]) => void;
  cvs: Record<string, Cv>;
  trash: Record<string, DeletedCv>;
  restoreCv: (id: string) => void;
  purgeCv: (id: string) => void;
  /** undo and redo for the CV open in the editor; not saved */
  past: Snapshot[];
  future: Snapshot[];
  historyFor: string | null;

  createCv: (opts?: {
    title?: string;
    template?: TemplateId;
    start?: "example" | "blank";
    persona?: Persona;
    kind?: "cv" | "letter";
    fullName?: string;
    jobTitle?: string;
  }) => string;
  addCv: (cv: Cv) => string;
  addCvs: (cvs: Cv[]) => string[];
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

// A tab reads the latest library before changing it, so an older dashboard cannot
// overwrite CVs created in another tab. Failed writes keep their in-memory data.
let lastDiskValue: string | null | undefined;
function normaliseLibrary(persisted: unknown) {
  const stored = persisted as
    | {
        cvs?: Record<string, unknown>;
        saved?: SavedItem[];
        trash?: Record<string, DeletedCv>;
      }
    | undefined;
  const cvs: Record<string, Cv> = {};
  const trash: Record<string, DeletedCv> = {};
  for (const [id, value] of Object.entries(stored?.cvs ?? {})) {
    try {
      const cv = normaliseCv(value);
      if (cv)
        Object.defineProperty(cvs, id, {
          value: { ...cv, id },
          enumerable: true,
          writable: true,
          configurable: true,
        });
    } catch {
      /* Isolate damaged records. */
    }
  }
  for (const [id, item] of Object.entries(stored?.trash ?? {})) {
    try {
      const cv = normaliseCv(item?.cv);
      if (cv && Number.isFinite(item.deletedAt))
        Object.defineProperty(trash, id, {
          value: { cv: { ...cv, id }, deletedAt: item.deletedAt },
          enumerable: true,
          writable: true,
          configurable: true,
        });
    } catch {
      /* Isolate damaged records. */
    }
  }
  const saved: SavedItem[] = [];
  for (const item of Array.isArray(stored?.saved)
    ? stored.saved.slice(0, 300)
    : []) {
    if (!item || typeof item.id !== "string") continue;
    const common = {
      id: item.id,
      createdAt: Number.isFinite(item.createdAt) ? item.createdAt : 0,
      sectionType:
        item.sectionType && Object.hasOwn(SECTION_LABELS, item.sectionType)
          ? item.sectionType
          : ("custom" as SectionType),
    };
    if (item.kind === "entry" && item.entry && typeof item.entry === "object") {
      const entry = newEntry();
      for (const key of [
        "title",
        "subtitle",
        "location",
        "startDate",
        "endDate",
        "description",
      ] as const)
        entry[key] = typeof item.entry[key] === "string" ? item.entry[key] : "";
      entry.id = typeof item.entry.id === "string" ? item.entry.id : item.id;
      entry.current = !!item.entry.current;
      entry.bullets = Array.isArray(item.entry.bullets)
        ? item.entry.bullets.filter((bullet) => typeof bullet === "string")
        : [];
      saved.push({ ...common, kind: "entry", entry });
    } else if (
      (item.kind === "bullet" || item.kind === "summary") &&
      typeof item.text === "string"
    )
      saved.push({ ...common, kind: item.kind, text: item.text });
  }
  return { cvs, trash, saved };
}

function mergeLibrary(persisted: unknown, current: LibraryState): LibraryState {
  const library = normaliseLibrary(persisted);
  const fingerprint = (cv: Cv | undefined) =>
    JSON.stringify(cv, (_, value) =>
      value && typeof value === "object" && !Array.isArray(value)
        ? Object.fromEntries(
            Object.keys(value)
              .sort()
              .map((key) => [key, value[key]]),
          )
        : value,
    );
  const changed =
    current.historyFor &&
    fingerprint(current.cvs[current.historyFor]) !==
      fingerprint(library.cvs[current.historyFor]);
  if (changed) {
    lastGroup = "";
    lastGroupAt = 0;
  }
  return {
    ...current,
    ...library,
    ...(changed ? { past: [], future: [], historyFor: null } : {}),
  };
}

function latestLibrary(current: LibraryState): LibraryState {
  if (typeof window === "undefined" || getStorageProblem()) return current;
  const raw = browserStorage.getItem("cv-studio:library");
  if (getStorageProblem() || raw === lastDiskValue) return current;
  lastDiskValue = raw;
  try {
    return mergeLibrary(raw ? JSON.parse(raw).state : undefined, current);
  } catch {
    return current;
  }
}

export const useLibrary = create<LibraryState>()(
  persist(
    (persistSet, get) => {
      const set = (
        update: (state: LibraryState) => Partial<LibraryState> | LibraryState,
      ) =>
        persistSet((state) => {
          const latest = latestLibrary(state);
          return { ...latest, ...update(latest) };
        });
      return {
        cvs: {},
        trash: {},
        past: [],
        future: [],
        historyFor: null,

        createCv: (opts) => {
          const cv =
            opts?.kind === "letter"
              ? makeLetter(makeCv(opts), opts.title || "Untitled cover letter")
              : makeCv(opts);
          set((s) => ({ cvs: { ...s.cvs, [cv.id]: cv } }));
          return cv.id;
        },

        createLetter: (sourceId) => {
          const source = sourceId
            ? latestLibrary(get()).cvs[sourceId]
            : undefined;
          const cv = makeLetter(source);
          set((s) => ({ cvs: { ...s.cvs, [cv.id]: cv } }));
          return cv.id;
        },
        tagCv: (id, tags) =>
          set((s) =>
            Object.hasOwn(s.cvs, id)
              ? {
                  cvs: {
                    ...s.cvs,
                    [id]: {
                      ...s.cvs[id],
                      tags: [
                        ...new Set(
                          tags
                            .map((tag) => tag.trim().slice(0, 30))
                            .filter(Boolean),
                        ),
                      ].slice(0, 12),
                      updatedAt: Date.now(),
                    },
                  },
                }
              : s,
          ),

        addCv: (cv) => get().addCvs([cv])[0],

        addCvs: (cvs) => {
          const now = Date.now();
          const copies = cvs.map((cv) => ({
            ...clone(cv),
            id: uid("cv_"),
            createdAt: now,
            updatedAt: now,
          }));
          set((s) => ({
            cvs: {
              ...s.cvs,
              ...Object.fromEntries(copies.map((cv) => [cv.id, cv])),
            },
          }));
          return copies.map((cv) => cv.id);
        },

        duplicateCv: (id) => {
          const src = latestLibrary(get()).cvs[id];
          if (!src) return null;
          return get().addCv({ ...clone(src), title: `Copy of ${src.title}` });
        },

        renameCv: (id, title) =>
          set((s) => {
            const cv = s.cvs[id];
            if (!cv) return s;
            return {
              cvs: {
                ...s.cvs,
                [id]: {
                  ...cv,
                  title: title.trim() || "Untitled CV",
                  updatedAt: Date.now(),
                },
              },
            };
          }),

        deleteCv: (id) =>
          set((s) => {
            if (!Object.hasOwn(s.cvs, id)) return s;
            const next = { ...s.cvs };
            delete next[id];
            return {
              cvs: next,
              trash: {
                ...s.trash,
                [id]: { cv: s.cvs[id], deletedAt: Date.now() },
              },
              ...(s.historyFor === id
                ? { past: [], future: [], historyFor: null }
                : {}),
            };
          }),

        restoreCv: (id) =>
          set((s) => {
            const item = s.trash[id];
            if (!Object.hasOwn(s.trash, id) || !item) return s;
            const trash = { ...s.trash };
            delete trash[id];
            const restoredId = Object.hasOwn(s.cvs, id) ? uid("cv_") : id;
            return {
              trash,
              cvs: {
                ...s.cvs,
                [restoredId]: {
                  ...item.cv,
                  id: restoredId,
                  updatedAt: Date.now(),
                },
              },
            };
          }),
        purgeCv: (id) =>
          set((s) => {
            const trash = { ...s.trash };
            delete trash[id];
            return { trash };
          }),

        updateCv: (id, fn, group) =>
          set((s) => {
            const cv = s.cvs[id];
            if (!cv) return s;
            const before: Snapshot = { data: cv.data, design: cv.design };
            const draft: Snapshot = clone(before);
            fn(draft);
            const now = Date.now();
            const merge =
              s.historyFor === id &&
              group &&
              group === lastGroup &&
              now - lastGroupAt < 1200;
            lastGroup = group ?? "";
            lastGroupAt = now;
            const past = s.historyFor === id ? s.past : [];
            return {
              cvs: {
                ...s.cvs,
                [id]: {
                  ...cv,
                  data: draft.data,
                  design: draft.design,
                  updatedAt: now,
                },
              },
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
              cvs: {
                ...s.cvs,
                [id]: { ...cv, ...prev, updatedAt: Date.now() },
              },
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
              cvs: {
                ...s.cvs,
                [id]: { ...cv, ...next, updatedAt: Date.now() },
              },
              past: [...s.past, { data: cv.data, design: cv.design }],
              future: s.future.slice(1),
            };
          }),

        saved: [],
        saveItem: (item) =>
          set((s) => ({
            saved: [
              { ...clone(item), id: uid("sv_"), createdAt: Date.now() },
              ...s.saved,
            ].slice(0, 300),
          })),
        removeSaved: (id) =>
          set((s) => ({ saved: s.saved.filter((x) => x.id !== id) })),

        startEditing: (id) => {
          if (get().historyFor !== id) {
            lastGroup = "";
            lastGroupAt = 0;
          }
          set((s) =>
            s.historyFor === id ? s : { past: [], future: [], historyFor: id },
          );
        },
      };
    },
    {
      name: "cv-studio:library",
      version: 2,
      migrate: (persisted) => normaliseLibrary(persisted),
      storage: createJSONStorage(() => {
        if (typeof window === "undefined")
          throw new Error("Browser storage only");
        return {
          getItem: (name: string) => {
            const raw = browserStorage.getItem(name);
            lastDiskValue = raw;
            return raw;
          },
          setItem: (name: string, value: string) => {
            browserStorage.setItem(name, value);
            if (!getStorageProblem()) lastDiskValue = value;
          },
          removeItem: (name: string) => browserStorage.removeItem(name),
        };
      }),
      merge: mergeLibrary,
      partialize: (s) => ({ cvs: s.cvs, saved: s.saved, trash: s.trash }),
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

/** Keep other open windows current without writing a storage-event feedback loop. */
export function syncLibraryFromBrowser() {
  if (!getStorageProblem()) void useLibrary.persist.rehydrate();
}
