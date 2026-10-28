"use client";
import { CircleCheck, TriangleAlert } from "lucide-react";
import { useStorageProblem } from "@/lib/browserStorage";
import { useHydrated } from "@/lib/store";
export function SaveStatus({ dark = false }: { dark?: boolean }) {
  const problem = useStorageProblem();
  const hydrated = useHydrated();
  const Icon = problem ? TriangleAlert : CircleCheck;
  const classes = `inline-flex items-center gap-1.5 text-left text-[11px] ${problem ? "text-amber-500" : dark ? "text-slate-300" : "text-slate-500"}`;
  if (problem)
    return (
      <button
        className={classes}
        title="Changes have not saved. Open the warning for recovery and backup options."
        onClick={() =>
          window.dispatchEvent(new Event("cv-studio:show-save-warning"))
        }
        data-testid="save-status"
      >
        <Icon className="h-3 w-3 flex-none" />
        Not saved · View details
      </button>
    );
  return (
    <span
      className={classes}
      title="Saved automatically on this device. Download a JSON backup before clearing browser data."
      data-testid="save-status"
    >
      <Icon className="h-3 w-3 flex-none" />
      {hydrated ? "Saved in this browser" : "Loading your library…"}
    </span>
  );
}
