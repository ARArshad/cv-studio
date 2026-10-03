"use client";

import { createContext, useContext, useLayoutEffect, useRef, type ElementType } from "react";
import { escapeHtml, sanitize } from "@/lib/rich";

/**
 * Editing straight on the page.
 *
 * Every piece of text in a template is an <Ed>. Outside the editor it is
 * plain markup. Inside, it becomes contenteditable and reports changes by
 * path. The measuring copy of the page renders the same markup, including
 * placeholders for empty fields, but is never editable, so pagination sees
 * exactly what the person sees.
 */

export type Path = string;

export type Action =
  | { t: "addEntry"; sid: string; after?: string }
  | { t: "moveEntry"; sid: string; eid: string; dir: -1 | 1 }
  | { t: "delEntry"; sid: string; eid: string }
  | { t: "splitBullet"; sid: string; eid: string; idx: number; before: string; after: string }
  | { t: "addBullet"; sid: string; eid: string }
  | { t: "delBullet"; sid: string; eid: string; idx: number }
  | { t: "addItem"; sid: string; after?: string }
  | { t: "delItem"; sid: string; iid: string }
  | { t: "level"; sid: string; iid: string; level: number }
  | { t: "moveSection"; sid: string; dir: -1 | 1 }
  | { t: "delSection"; sid: string }
  | { t: "hideSection"; sid: string }
  | { t: "colSection"; sid: string }
  | { t: "entryMenu"; sid: string; eid: string; anchor: DOMRect }
  | { t: "datePicker"; sid: string; eid: string; which: "start" | "end"; anchor: DOMRect }
  | { t: "photo" };

export interface EditApi {
  /** show editing affordances (placeholders, toolbars) */
  on: boolean;
  /** this copy is for measuring only: same markup, never editable */
  measure: boolean;
  set: (path: Path, value: string) => void;
  act: (a: Action) => void;
}

export const EditContext = createContext<EditApi | null>(null);
export const useEdit = () => useContext(EditContext);

/* ---------------- keeping the caret where it was ----------------
   A block can move to another page while someone types, which remounts
   it. We remember which field had focus and where the caret was, and the
   new copy picks it back up. */
let focusState: { path: string; offset: number; at: number } | null = null;
let pending: { path: string; at: "start" | "end" | number } | null = null;

/** ask a field to take focus as soon as it appears */
export function focusSoon(path: string, at: "start" | "end" | number = "end") {
  pending = { path, at };
  requestAnimationFrame(() => {
    const el = document.querySelector<HTMLElement>(`.cv-pages [data-path="${CSS.escape(path)}"]`);
    if (el && pending?.path === path) { placeCaret(el, at); pending = null; }
  });
}

function caretOffset(el: HTMLElement): number {
  const sel = window.getSelection();
  if (!sel || !sel.rangeCount) return 0;
  const r = document.createRange();
  r.selectNodeContents(el);
  try { r.setEnd(sel.getRangeAt(0).endContainer, sel.getRangeAt(0).endOffset); } catch { return 0; }
  return r.toString().length;
}

function placeCaret(el: HTMLElement, at: "start" | "end" | number) {
  el.focus({ preventScroll: true });
  const sel = window.getSelection();
  if (!sel) return;
  const r = document.createRange();
  if (at === "start" || at === "end") {
    r.selectNodeContents(el);
    r.collapse(at === "start");
  } else {
    const walk = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    let left = at, n: Node | null, done = false;
    while ((n = walk.nextNode())) {
      const len = n.textContent?.length ?? 0;
      if (len >= left) { r.setStart(n, left); r.collapse(true); done = true; break; }
      left -= len;
    }
    if (!done) { r.selectNodeContents(el); r.collapse(false); }
  }
  sel.removeAllRanges();
  sel.addRange(r);
}

interface EdProps {
  path: Path;
  value: string;
  /** allows bold, italic, underline and line breaks */
  rich?: boolean;
  ph?: string;
  className?: string;
  as?: ElementType;
  onEnter?: (el: HTMLElement) => void;
  onBackspaceEmpty?: () => void;
}

export function Ed({ path, value, rich, ph, className, as: Tag = "span", onEnter, onBackspaceEmpty }: EdProps) {
  const ed = useEdit();
  const ref = useRef<HTMLElement>(null);
  const emitted = useRef<string | null>(null);
  const html = rich ? value : escapeHtml(value);
  const live = !!ed?.on && !ed.measure;

  /* write the DOM ourselves so typing never fights React */
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const focused = document.activeElement === el;
    if (!focused || (emitted.current !== null && emitted.current !== value)) {
      if (el.innerHTML !== html) el.innerHTML = html;
    }
    emitted.current = null;
    if (!live) return;
    if (pending?.path === path) { placeCaret(el, pending.at); pending = null; }
    else if (focusState?.path === path && Date.now() - focusState.at < 600 && (!document.activeElement || document.activeElement === document.body)) {
      placeCaret(el, focusState.offset);
    }
  });

  if (!ed?.on) {
    if (!value) return null;
    return <Tag className={className} dangerouslySetInnerHTML={{ __html: html }} />;
  }

  const emit = (el: HTMLElement) => {
    const v = rich ? sanitize(el.innerHTML) : (el.textContent ?? "").replace(/\n/g, " ");
    emitted.current = v;
    focusState = { path, offset: caretOffset(el), at: Date.now() };
    ed.set(path, v);
  };

  return (
    <Tag
      ref={ref}
      className={(className ? className + " " : "") + "ed"}
      data-path={live ? path : undefined}
      data-ph={ph}
      contentEditable={live ? (rich ? true : "plaintext-only") : undefined}
      suppressContentEditableWarning
      spellCheck={live}
      onInput={live ? (e: React.FormEvent<HTMLElement>) => emit(e.currentTarget) : undefined}
      onKeyUp={live ? (e: React.KeyboardEvent<HTMLElement>) => { if (focusState?.path === path) focusState.offset = caretOffset(e.currentTarget); } : undefined}
      onPaste={live ? (e: React.ClipboardEvent<HTMLElement>) => {
        e.preventDefault();
        const text = e.clipboardData.getData("text/plain").replace(/\s*\n\s*/g, rich ? "\n" : " ");
        document.execCommand("insertText", false, text);
      } : undefined}
      onKeyDown={live ? (e: React.KeyboardEvent<HTMLElement>) => {
        const el = e.currentTarget;
        if (e.key === "Enter" && !e.shiftKey) {
          e.preventDefault();
          if (onEnter) onEnter(el);
          return;
        }
        if (e.key === "Enter" && e.shiftKey && !rich) { e.preventDefault(); return; }
        if (e.key === "Backspace" && onBackspaceEmpty && !(el.textContent ?? "").length) {
          e.preventDefault();
          onBackspaceEmpty();
          return;
        }
        if ((e.metaKey || e.ctrlKey) && !rich && ["b", "i", "u"].includes(e.key.toLowerCase())) e.preventDefault();
      } : undefined}
    />
  );
}

/** split a bullet at the caret: what is before stays, what is after moves to a new bullet */
export function splitAtCaret(el: HTMLElement): { before: string; after: string } {
  const sel = window.getSelection();
  if (!sel || !sel.rangeCount) return { before: sanitize(el.innerHTML), after: "" };
  const caret = sel.getRangeAt(0);
  const tail = document.createRange();
  tail.selectNodeContents(el);
  try { tail.setStart(caret.endContainer, caret.endOffset); } catch { return { before: sanitize(el.innerHTML), after: "" }; }
  const box = document.createElement("div");
  box.appendChild(tail.cloneContents());
  const head = document.createRange();
  head.selectNodeContents(el);
  head.setEnd(caret.startContainer, caret.startOffset);
  const box2 = document.createElement("div");
  box2.appendChild(head.cloneContents());
  return { before: sanitize(box2.innerHTML), after: sanitize(box.innerHTML) };
}
