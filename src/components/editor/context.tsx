"use client";

import { createContext, useContext } from "react";
import type { Cv } from "@/lib/types";
import type { Draft } from "./ops";

export type { Draft };

export interface EditorCtx {
  cv: Cv;
  /** change the CV; give quick repeated edits the same group to undo them together */
  update: (fn: (d: Draft) => void, group?: string) => void;
  /** the bullet or field that last had focus, so phrases know where to go */
  lastPath: string | null;
}

export const EditorContext = createContext<EditorCtx | null>(null);

export function useEditor(): EditorCtx {
  const c = useContext(EditorContext);
  if (!c) throw new Error("useEditor outside the editor");
  return c;
}
