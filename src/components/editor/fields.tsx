"use client";

import { useEffect, useRef, useState, type TextareaHTMLAttributes } from "react";
import { Bold, List, Sparkles } from "lucide-react";
import { PHRASES } from "@/lib/phrases";
import { cx, inputCls } from "@/components/ui";

/** a textarea that grows with its content */
export function AutoTextarea({ className, value, ref: outer, ...rest }: TextareaHTMLAttributes<HTMLTextAreaElement> & { value: string; ref?: React.RefObject<HTMLTextAreaElement | null> }) {
  const own = useRef<HTMLTextAreaElement>(null);
  const ref = outer ?? own;
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = el.scrollHeight + 2 + "px";
  }, [value, ref]);
  return <textarea ref={ref} value={value} rows={3} {...rest} className={cx(inputCls, "resize-none leading-relaxed", className)} />;
}

/**
 * The description box: plain text where lines starting with "- " become
 * bullets and **this** becomes bold, with buttons so nobody has to know that.
 */
export function RichTextArea({ value, onChange, placeholder, testId }: { value: string; onChange: (v: string) => void; placeholder?: string; testId?: string }) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const [phrasesOpen, setPhrasesOpen] = useState(false);
  const [cat, setCat] = useState(Object.keys(PHRASES)[0]);

  const bold = () => {
    const el = ref.current;
    if (!el) return;
    const { selectionStart: a, selectionEnd: b } = el;
    const sel = value.slice(a, b) || "bold text";
    onChange(value.slice(0, a) + "**" + sel + "**" + value.slice(b));
    requestAnimationFrame(() => { el.focus(); el.setSelectionRange(a + 2, a + 2 + sel.length); });
  };

  const bullet = () => {
    const el = ref.current;
    if (!el) return;
    const a = el.selectionStart;
    const lineStart = value.lastIndexOf("\n", a - 1) + 1;
    const line = value.slice(lineStart, value.indexOf("\n", a) === -1 ? undefined : value.indexOf("\n", a));
    if (!line.trim()) {
      onChange(value.slice(0, lineStart) + "- " + value.slice(lineStart));
      requestAnimationFrame(() => { el.focus(); el.setSelectionRange(lineStart + 2, lineStart + 2); });
    } else if (/^[-•*]\s/.test(line)) {
      onChange(value.slice(0, lineStart) + line.replace(/^[-•*]\s/, "") + value.slice(lineStart + line.length));
    } else {
      onChange(value.slice(0, lineStart) + "- " + value.slice(lineStart));
    }
  };

  const addPhrase = (p: string) => {
    const next = value.trim() ? value.replace(/\s+$/, "") + "\n- " + p : "- " + p;
    onChange(next);
  };

  /* Enter inside a bullet starts the next bullet */
  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key !== "Enter" || e.shiftKey) return;
    const el = e.currentTarget;
    const a = el.selectionStart;
    const lineStart = value.lastIndexOf("\n", a - 1) + 1;
    const line = value.slice(lineStart, a);
    if (/^[-•*]\s/.test(line)) {
      e.preventDefault();
      if (line.trim() === "-" || line.trim() === "•") {
        onChange(value.slice(0, lineStart) + value.slice(a));
        return;
      }
      const ins = "\n- ";
      onChange(value.slice(0, a) + ins + value.slice(el.selectionEnd));
      requestAnimationFrame(() => el.setSelectionRange(a + ins.length, a + ins.length));
    }
  };

  return (
    <div>
      <div className="mb-1.5 flex items-center gap-1">
        <ToolBtn onClick={bold} label="Bold"><Bold className="h-3.5 w-3.5" /></ToolBtn>
        <ToolBtn onClick={bullet} label="Bullet point"><List className="h-3.5 w-3.5" /></ToolBtn>
        <span className="flex-1" />
        <button
          type="button"
          onClick={() => setPhrasesOpen((o) => !o)}
          className={cx("inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium cursor-pointer", phrasesOpen ? "bg-brand-50 text-brand-700" : "text-brand-600 hover:bg-brand-50")}
        >
          <Sparkles className="h-3.5 w-3.5" /> Ready made phrases
        </button>
      </div>
      <AutoTextarea ref={ref} value={value} onChange={(e) => onChange(e.target.value)} onKeyDown={onKeyDown} placeholder={placeholder} data-testid={testId} />
      {phrasesOpen && (
        <div className="mt-2 rounded-lg border border-slate-200 bg-slate-50 p-2.5">
          <select className={cx(inputCls, "mb-2 py-1.5 text-[13px]")} value={cat} onChange={(e) => setCat(e.target.value)}>
            {Object.keys(PHRASES).map((c) => <option key={c}>{c}</option>)}
          </select>
          <ul className="max-h-56 space-y-1 overflow-y-auto">
            {PHRASES[cat].map((p) => (
              <li key={p}>
                <button type="button" onClick={() => addPhrase(p)} className="w-full rounded-md bg-white px-2.5 py-1.5 text-left text-[12.5px] leading-snug text-slate-700 ring-1 ring-slate-200 hover:ring-brand-500 cursor-pointer">
                  <span className="mr-1 font-semibold text-brand-600">+</span>{p}
                </button>
              </li>
            ))}
          </ul>
          <p className="mt-2 text-[11.5px] text-slate-500">Replace anything in [square brackets] with your own details.</p>
        </div>
      )}
    </div>
  );
}

function ToolBtn({ onClick, label, children }: { onClick: () => void; label: string; children: React.ReactNode }) {
  return (
    <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={onClick} title={label} aria-label={label}
      className="grid h-7 w-7 place-items-center rounded-md text-slate-500 hover:bg-slate-100 hover:text-ink cursor-pointer">
      {children}
    </button>
  );
}

/** five dots to pick a level; clicking the current level clears it */
export function LevelPicker({ value, onChange, labels }: { value: number; onChange: (v: number) => void; labels: string[] }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((k) => (
          <button
            key={k}
            type="button"
            title={labels[k]}
            aria-label={labels[k]}
            onClick={() => onChange(value === k ? 0 : k)}
            className={cx("h-3.5 w-3.5 rounded-full transition cursor-pointer", k <= value ? "bg-brand-600" : "bg-slate-200 hover:bg-slate-300")}
          />
        ))}
      </div>
      <span className="w-24 text-xs text-slate-500">{value ? labels[value] : "No level"}</span>
    </div>
  );
}
