"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cx, inputCls } from "@/components/ui";
import { MONTHS, parseDate } from "@/lib/dates";
import { FloatingMenu, Toggle } from "./Popover";

/**
 * Month and year, or just a year, or free text such as "Summer 2019".
 * Picked dates are stored as "2021-03" so the Page panel can change how
 * every date is written in one go.
 */
export function DatePicker({ anchor, value, current, allowCurrent, onChange, onCurrent, onClose }: {
  anchor: DOMRect;
  value: string;
  current: boolean;
  allowCurrent: boolean;
  onChange: (v: string) => void;
  onCurrent: (v: boolean) => void;
  onClose: () => void;
}) {
  const parsed = parseDate(value);
  const [year, setYear] = useState(parsed.year ?? new Date().getFullYear());
  const [text, setText] = useState(parsed.year ? "" : value);
  const pick = (m: number | null) => { onChange(m ? `${year}-${String(m).padStart(2, "0")}` : String(year)); onClose(); };

  return (
    <FloatingMenu anchor={anchor} onClose={onClose} width={268}>
      <div data-testid="date-picker">
        {allowCurrent && (
          <div className="mb-2 border-b border-slate-100 pb-2">
            <Toggle label="I am still here (Present)" checked={current} onChange={(v) => { onCurrent(v); if (v) onClose(); }} testId="date-current" />
          </div>
        )}
        <div className="mb-2 flex items-center justify-between">
          <button type="button" aria-label="Previous year" onClick={() => setYear((y) => y - 1)} className="grid h-8 w-8 place-items-center rounded-lg hover:bg-slate-100 cursor-pointer"><ChevronLeft className="h-4 w-4" /></button>
          <input
            type="number"
            value={year}
            onChange={(e) => setYear(Number(e.target.value) || year)}
            className="w-20 rounded-md border border-transparent text-center text-[15px] font-semibold outline-none hover:border-slate-200 focus:border-brand-500"
            aria-label="Year"
            data-testid="date-year"
          />
          <button type="button" aria-label="Next year" onClick={() => setYear((y) => y + 1)} className="grid h-8 w-8 place-items-center rounded-lg hover:bg-slate-100 cursor-pointer"><ChevronRight className="h-4 w-4" /></button>
        </div>
        <div className="grid grid-cols-4 gap-1">
          {MONTHS.map((m, i) => (
            <button key={m} type="button" onClick={() => pick(i + 1)} data-month={i + 1}
              className={cx("rounded-lg py-1.5 text-[13px] cursor-pointer", parsed.year === year && parsed.month === i + 1 ? "bg-brand-600 text-white" : "hover:bg-slate-100")}>
              {m.slice(0, 3)}
            </button>
          ))}
        </div>
        <button type="button" onClick={() => pick(null)} data-testid="date-year-only"
          className={cx("mt-1.5 w-full rounded-lg py-1.5 text-[13px] cursor-pointer", parsed.year === year && !parsed.month ? "bg-brand-600 text-white" : "bg-slate-50 hover:bg-slate-100")}>
          Year only: {year}
        </button>
        <div className="mt-3 border-t border-slate-100 pt-3">
          <span className="mb-1 block text-[11.5px] text-slate-500">Or write it your way</span>
          <div className="flex gap-1.5">
            <input className={cx(inputCls, "py-1.5")} value={text} placeholder="Summer 2019" onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") { onChange(text); onClose(); } }} />
            <button type="button" onClick={() => { onChange(text); onClose(); }} className="rounded-lg bg-slate-900 px-3 text-[13px] font-medium text-white cursor-pointer">Set</button>
          </div>
          <button type="button" onClick={() => { onChange(""); onCurrent(false); onClose(); }} className="mt-2 text-[12.5px] text-slate-500 hover:text-red-600 cursor-pointer">Clear date</button>
        </div>
      </div>
    </FloatingMenu>
  );
}
