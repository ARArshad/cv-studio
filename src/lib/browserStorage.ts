"use client";

import { useSyncExternalStore } from "react";

let problem: string | null = null;
let unreadable: string | null = null;
let validated: string | null | undefined;
export const getStorageProblem = () => problem;
export const getUnreadableStorage = () => unreadable;
const listeners = new Set<() => void>();
function report(message: string | null) {
  problem = message;
  listeners.forEach((listener) => listener());
}

/** Keep the editor usable when private mode or a full disk prevents saving. */
export const browserStorage = {
  getItem(name: string) {
    let raw: string | null = null;
    try {
      raw = window.localStorage.getItem(name);
      if (raw && raw !== validated) {
        const parsed = JSON.parse(raw);
        if (
          !parsed ||
          typeof parsed !== "object" ||
          !parsed.state ||
          typeof parsed.state !== "object" ||
          (parsed.version ?? 0) > 2
        )
          throw new Error("Unsupported library");
      }
      validated = raw;
      return raw;
    } catch {
      unreadable = raw;
      report(
        "Your saved library could not be read. The original data has been preserved. Download a copy of the original data and back up any new CVs before closing this tab.",
      );
      return null;
    }
  },
  setItem(name: string, value: string) {
    if (unreadable !== null) {
      report(
        "Your saved library is unreadable. The original data has been preserved; new changes are kept only in this tab. Download a CV backup before leaving.",
      );
      return;
    }
    try {
      window.localStorage.setItem(name, value);
      report(null);
    } catch {
      report(
        "Changes could not be saved in this browser. Keep this tab open and download a JSON backup from the CV menu before leaving.",
      );
    }
  },
  removeItem(name: string) {
    try {
      window.localStorage.removeItem(name);
    } catch {
      report(
        "Browser storage is unavailable. Download a backup before leaving this page.",
      );
    }
  },
};

export function useStorageProblem() {
  return useSyncExternalStore(
    (callback) => {
      listeners.add(callback);
      return () => {
        listeners.delete(callback);
      };
    },
    () => problem,
    () => null,
  );
}
