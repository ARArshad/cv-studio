"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { cx } from "@/components/ui";

/** a panel that drops from a toolbar button and closes on any click outside */
export function Popover({
  trigger,
  children,
  align = "left",
  width = 320,
  testId,
  label,
}: {
  trigger: (open: boolean, toggle: () => void) => ReactNode;
  children: (close: () => void) => ReactNode;
  align?: "left" | "right" | "center";
  width?: number;
  testId?: string;
  label?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const h = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const k = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        ref.current?.querySelector<HTMLElement>("button")?.focus();
      }
    };
    document.addEventListener("mousedown", h);
    document.addEventListener("keydown", k);
    return () => {
      document.removeEventListener("mousedown", h);
      document.removeEventListener("keydown", k);
    };
  }, [open]);
  return (
    <div ref={ref} className="relative">
      {trigger(open, () => setOpen((o) => !o))}
      {open && (
        <div
          data-testid={testId}
          role="dialog"
          aria-label={label}
          style={{ width }}
          className={cx(
            "editor-toolbar-popover absolute top-full z-50 mt-2 max-h-[calc(100vh-90px)] overflow-y-auto rounded-2xl border border-slate-200 bg-white p-4 text-ink shadow-2xl",
            align === "left"
              ? "left-0"
              : align === "right"
                ? "right-0"
                : "left-1/2 md:-translate-x-1/2",
          )}
        >
          {children(() => setOpen(false))}
        </div>
      )}
    </div>
  );
}

/** a popover placed at a point on screen, for menus opened from inside the page */
export function FloatingMenu({
  anchor,
  onClose,
  children,
  width = 240,
}: {
  anchor: DOMRect;
  onClose: () => void;
  children: ReactNode;
  width?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) onClose();
    };
    const k = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    const t = setTimeout(() => document.addEventListener("mousedown", h), 0);
    document.addEventListener("keydown", k);
    return () => {
      clearTimeout(t);
      document.removeEventListener("mousedown", h);
      document.removeEventListener("keydown", k);
    };
  }, [onClose]);
  const fittedWidth = Math.min(width, window.innerWidth - 24);
  const left = Math.max(
    12,
    Math.min(window.innerWidth - fittedWidth - 12, anchor.right - fittedWidth),
  );
  const top = Math.max(
    12,
    Math.min(window.innerHeight - 280, anchor.bottom + 8),
  );
  return createPortal(
    <div
      ref={ref}
      data-floating-menu
      style={{
        left,
        top,
        width: fittedWidth,
        maxHeight: Math.max(0, window.innerHeight - top - 12),
        overflowY: "auto",
      }}
      className="fixed z-[70] rounded-xl border border-slate-200 bg-white p-3 text-ink shadow-2xl no-print"
    >
      {children}
    </div>,
    document.body,
  );
}

export function PanelLabel({ children }: { children: ReactNode }) {
  return (
    <h4 className="mb-2 mt-4 text-[11px] font-semibold uppercase tracking-wider text-slate-500 first:mt-0">
      {children}
    </h4>
  );
}

export function Seg<T extends string>({
  value,
  options,
  onChange,
  testId,
}: {
  value: T;
  options: { v: T; label: string }[];
  onChange: (v: T) => void;
  testId?: string;
}) {
  return (
    <div
      className="grid rounded-lg bg-slate-100 p-0.5"
      style={{ gridTemplateColumns: `repeat(${options.length}, 1fr)` }}
      data-testid={testId}
    >
      {options.map((o) => (
        <button
          key={o.v}
          type="button"
          data-value={o.v}
          aria-pressed={value === o.v}
          onClick={() => onChange(o.v)}
          className={cx(
            "rounded-md px-2 py-1.5 text-[12.5px] cursor-pointer",
            value === o.v
              ? "bg-white font-medium text-ink shadow-sm"
              : "text-slate-600 hover:text-ink",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function Slider({
  label,
  value,
  min,
  max,
  step,
  format,
  onChange,
  testId,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  format: (v: number) => string;
  onChange: (v: number) => void;
  testId?: string;
}) {
  return (
    <label className="mb-3 block">
      <span className="mb-1 flex justify-between text-[13px] text-slate-600">
        <span>{label}</span>
        <span className="tabular-nums text-slate-500">{format(value)}</span>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-brand-600"
        data-testid={testId}
      />
    </label>
  );
}

export function Toggle({
  label,
  checked,
  onChange,
  testId,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  testId?: string;
}) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-3 py-1.5 text-[13px] text-slate-700">
      {label}
      <button
        type="button"
        role="switch"
        aria-label={label}
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        data-testid={testId}
        className={cx(
          "relative h-5 w-9 flex-none rounded-full transition cursor-pointer",
          checked ? "bg-brand-600" : "bg-slate-300",
        )}
      >
        <span
          className={cx(
            "absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition",
            checked ? "left-[18px]" : "left-0.5",
          )}
        />
      </button>
    </label>
  );
}
