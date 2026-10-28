"use client";

import Link from "next/link";
import {
  cloneElement,
  isValidElement,
  useEffect,
  useId,
  useRef,
  useState,
  type ButtonHTMLAttributes,
  type ReactNode,
} from "react";
import { X } from "lucide-react";

export function cx(...c: (string | false | null | undefined)[]) {
  return c.filter(Boolean).join(" ");
}

export function Logo({
  href = "/",
  className,
}: {
  href?: string;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={cx(
        "flex shrink-0 items-center gap-2.5 whitespace-nowrap font-semibold tracking-tight text-ink",
        className,
      )}
    >
      <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand-600 text-white shadow-sm">
        <svg
          viewBox="0 0 24 24"
          className="h-[18px] w-[18px]"
          fill="none"
          stroke="currentColor"
          strokeWidth={2.2}
          strokeLinecap="round"
          aria-hidden
        >
          <path d="M7 4h7l4 4v12H7z" />
          <path d="M14 4v4h4" />
          <path d="M10 13h5M10 16.5h3.5" />
        </svg>
      </span>
      <span className="text-[17px]">CV Studio</span>
    </Link>
  );
}

type Variant = "primary" | "secondary" | "ghost" | "danger";
const VARIANTS: Record<Variant, string> = {
  primary: "bg-brand-600 text-white hover:bg-brand-700 shadow-sm",
  secondary:
    "bg-white text-ink border border-slate-200 hover:border-slate-300 hover:bg-slate-50 shadow-xs",
  ghost: "text-slate-600 hover:bg-slate-100 hover:text-ink",
  danger: "bg-red-600 text-white hover:bg-red-700",
};

export function Button({
  variant = "secondary",
  size = "md",
  className,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: "sm" | "md" | "lg";
}) {
  const sizes = {
    sm: "h-8 px-3 text-[13px]",
    md: "h-9.5 px-4 text-sm",
    lg: "h-12 px-6 text-[15px]",
  };
  return (
    <button
      type="button"
      {...rest}
      className={cx(
        "inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer",
        VARIANTS[variant],
        sizes[size],
        className,
      )}
    />
  );
}

export function IconButton({
  label,
  className,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { label: string }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      {...rest}
      className={cx(
        "grid h-8 w-8 place-items-center rounded-md text-slate-500 transition-colors hover:bg-slate-100 hover:text-ink disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer",
        className,
      )}
    />
  );
}

export function Modal({
  open,
  onClose,
  title,
  children,
  wide,
  initialFocus,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  wide?: boolean;
  initialFocus?: string;
}) {
  const panel = useRef<HTMLDivElement>(null);
  const closeRef = useRef(onClose);
  useEffect(() => {
    closeRef.current = onClose;
  }, [onClose]);
  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const focusable = () =>
      Array.from(
        panel.current?.querySelectorAll<HTMLElement>(
          'a[href],button:not(:disabled),input:not(:disabled),select,textarea,[tabindex="0"]',
        ) ?? [],
      ).filter((el) => el.getClientRects().length > 0);
    const frame = requestAnimationFrame(() => {
      if (!panel.current?.contains(document.activeElement))
        (
          panel.current?.querySelector<HTMLElement>(
            initialFocus ?? "[data-initial-focus]",
          ) ??
          focusable()[0] ??
          panel.current
        )?.focus();
    });
    const k = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        closeRef.current();
      }
      if (e.key === "Tab") {
        const items = focusable();
        const first = items[0],
          last = items[items.length - 1];
        if (!first) {
          e.preventDefault();
          panel.current?.focus();
          return;
        }
        if (
          e.shiftKey &&
          (document.activeElement === first ||
            !panel.current?.contains(document.activeElement))
        ) {
          e.preventDefault();
          last.focus();
        } else if (
          !e.shiftKey &&
          (document.activeElement === last ||
            !panel.current?.contains(document.activeElement))
        ) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    window.addEventListener("keydown", k);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("keydown", k);
      document.body.style.overflow = overflow;
      previous?.focus();
    };
  }, [open, initialFocus]);
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-900/45 p-4 pt-[6vh] backdrop-blur-[2px] no-print"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        ref={panel}
        tabIndex={-1}
        role="dialog"
        aria-modal
        aria-label={title}
        className={cx(
          "w-full rounded-2xl bg-white shadow-2xl",
          wide ? "max-w-4xl" : "max-w-md",
        )}
      >
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <h2 className="text-lg font-semibold">{title}</h2>
          <IconButton label="Close" onClick={onClose}>
            <X className="h-4.5 w-4.5" />
          </IconButton>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

/** a small dropdown anchored to its trigger */
export function Menu({
  trigger,
  children,
  align = "right",
}: {
  trigger: (toggle: () => void, open: boolean, id: string) => ReactNode;
  children: (close: () => void) => ReactNode;
  align?: "left" | "right";
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const id = useId();
  useEffect(() => {
    if (!open) return;
    const previous = ref.current?.querySelector<HTMLElement>("button");
    const frame = requestAnimationFrame(() =>
      panel.current?.querySelector<HTMLElement>("button")?.focus(),
    );
    const outside = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        setOpen(false);
        previous?.focus();
      }
      const items = Array.from(
        panel.current?.querySelectorAll<HTMLButtonElement>(
          "button:not(:disabled)",
        ) ?? [],
      );
      const index = items.indexOf(document.activeElement as HTMLButtonElement);
      if (["ArrowDown", "ArrowUp", "Home", "End"].includes(e.key)) {
        e.preventDefault();
        const next =
          e.key === "Home"
            ? 0
            : e.key === "End"
              ? items.length - 1
              : (index + (e.key === "ArrowDown" ? 1 : -1) + items.length) %
                items.length;
        items[next]?.focus();
      }
      if (e.key === "Tab") {
        e.preventDefault();
        const all = Array.from(
          document.querySelectorAll<HTMLElement>(
            'a[href],button:not(:disabled),input:not(:disabled),select,textarea,[tabindex="0"]',
          ),
        ).filter(
          (el) => el.getClientRects().length && !panel.current?.contains(el),
        );
        const next = all.indexOf(previous!) + (e.shiftKey ? -1 : 1);
        setOpen(false);
        (all[next] ?? previous)?.focus();
      }
    };
    document.addEventListener("mousedown", outside);
    ref.current?.addEventListener("keydown", key);
    const wrapper = ref.current;
    return () => {
      cancelAnimationFrame(frame);
      document.removeEventListener("mousedown", outside);
      wrapper?.removeEventListener("keydown", key);
    };
  }, [open]);
  return (
    <div ref={ref} className="relative">
      {trigger(() => setOpen((value) => !value), open, id)}
      {open && (
        <div
          ref={panel}
          id={id}
          role="menu"
          aria-label="CV actions"
          className={cx(
            "absolute z-40 mt-1.5 min-w-48 rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl",
            align === "right" ? "right-0" : "left-0",
          )}
        >
          {children(() => setOpen(false))}
        </div>
      )}
    </div>
  );
}

export function MenuItem({
  icon,
  children,
  onClick,
  danger,
}: {
  icon?: ReactNode;
  children: ReactNode;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      role="menuitem"
      onClick={onClick}
      className={cx(
        "flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm cursor-pointer",
        danger
          ? "text-red-600 hover:bg-red-50"
          : "text-slate-700 hover:bg-slate-100",
      )}
    >
      {icon}
      {children}
    </button>
  );
}

export function Field({
  label,
  children,
  className,
}: {
  label: string;
  children: ReactNode;
  className?: string;
}) {
  const id = useId();
  const nativeControl =
    isValidElement<{ id?: string }>(children) &&
    typeof children.type === "string" &&
    ["input", "select", "textarea"].includes(children.type);
  return (
    <div
      className={cx("block", className)}
      role={nativeControl ? undefined : "group"}
      aria-label={nativeControl ? undefined : label}
    >
      {nativeControl ? (
        <>
          <label
            htmlFor={children.props.id ?? id}
            className="mb-1.5 block text-[12.5px] font-medium text-slate-600"
          >
            {label}
          </label>
          {cloneElement(children, { id: children.props.id ?? id })}
        </>
      ) : (
        <>
          <span className="mb-1.5 block text-[12.5px] font-medium text-slate-600">
            {label}
          </span>
          {children}
        </>
      )}
    </div>
  );
}

export const inputCls =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-ink shadow-xs outline-none transition placeholder:text-slate-400 focus:border-brand-500 focus:ring-3 focus:ring-brand-500/15";

export function Toast({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <div
      className="fixed bottom-6 left-1/2 z-[60] w-max max-w-[calc(100vw-24px)] -translate-x-1/2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm text-white shadow-lg no-print"
      role="status"
    >
      {message}
    </div>
  );
}

export function useToast(): [string | null, (m: string) => void] {
  const [msg, setMsg] = useState<string | null>(null);
  const t = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => {
      if (t.current) clearTimeout(t.current);
    },
    [],
  );
  const show = (m: string) => {
    setMsg(m);
    if (t.current) clearTimeout(t.current);
    t.current = setTimeout(() => setMsg(null), 2400);
  };
  return [msg, show];
}

export function download(
  name: string,
  text: string,
  type = "application/json",
) {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    URL.revokeObjectURL(url);
    a.remove();
  }, 500);
}

export function timeAgo(t: number): string {
  const s = Math.round((Date.now() - t) / 1000);
  if (s < 60) return "just now";
  const m = Math.round(s / 60);
  if (m < 60) return `${m} min ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h} hour${h > 1 ? "s" : ""} ago`;
  const d = Math.round(h / 24);
  if (d < 8) return `${d} day${d > 1 ? "s" : ""} ago`;
  return new Date(t).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
