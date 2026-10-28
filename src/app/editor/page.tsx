import type { Metadata } from "next";
import { Suspense } from "react";
import { EditorFromQuery } from "./EditorFromQuery";

export const metadata: Metadata = { title: "Editor" };

// The CV id lives in the query string (/editor?id=...) so the editor can be
// exported as a single static page: CVs are created in the browser, so their
// ids can't be known at build time.
export default function EditorPage() {
  return (
    <Suspense
      fallback={
        <div
          role="status"
          className="grid min-h-dvh place-items-center bg-[#1c2333] text-sm text-slate-300"
        >
          Opening your document…
        </div>
      }
    >
      <EditorFromQuery />
    </Suspense>
  );
}
