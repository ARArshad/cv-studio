"use client";

import { createContext, useContext } from "react";
import type { Cv, CvData, Design } from "@/lib/types";

export type Draft = { data: CvData; design: Design };

export interface EditorCtx {
  cv: Cv;
  /** change the CV; give quick repeated edits the same group to undo them together */
  update: (fn: (d: Draft) => void, group?: string) => void;
  openSection: string | null;
  setOpenSection: (id: string | null) => void;
}

export const EditorContext = createContext<EditorCtx | null>(null);

export function useEditor(): EditorCtx {
  const c = useContext(EditorContext);
  if (!c) throw new Error("useEditor outside the editor");
  return c;
}
