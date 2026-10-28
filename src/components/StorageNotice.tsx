"use client";
import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { download } from "./ui";
import { syncLibraryFromBrowser } from "@/lib/store";
import { getUnreadableStorage, useStorageProblem } from "@/lib/browserStorage";

export function StorageNotice() {
  const problem = useStorageProblem();
  const [expanded, setExpanded] = useState(true);
  useEffect(() => {
    const sync = (event: StorageEvent) => {
      if (event.key === "cv-studio:library" || event.key === null)
        syncLibraryFromBrowser();
    };
    const show = () => setExpanded(true);
    window.addEventListener("storage", sync);
    window.addEventListener("cv-studio:show-save-warning", show);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener("cv-studio:show-save-warning", show);
    };
  }, []);
  if (!problem || !expanded) return null;
  return (
    <div
      role="alert"
      className="fixed inset-x-3 bottom-3 z-40 mx-auto max-w-3xl rounded-xl border border-amber-300 bg-amber-50 p-4 pr-11 text-sm leading-6 text-amber-950 shadow-lg no-print"
    >
      <strong>Save warning: </strong>
      {problem}
      <button
        aria-label="Minimise save warning"
        title="The save status stays visible. Click it to reopen this warning."
        onClick={() => setExpanded(false)}
        className="absolute right-3 top-3 rounded p-1 hover:bg-amber-100"
      >
        <X className="h-4 w-4" />
      </button>
      {getUnreadableStorage() !== null && (
        <button
          className="mt-2 block font-semibold underline"
          onClick={() =>
            download(
              "CV Studio original data.json",
              getUnreadableStorage() ?? "",
            )
          }
        >
          Download original data
        </button>
      )}
    </div>
  );
}
