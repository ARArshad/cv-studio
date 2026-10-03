"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { CvDocument, PAGE_PX } from "./CvDocument";
import type { Cv } from "@/lib/types";

/** the first page of a CV, scaled to fit the width it is given */
export function CvThumb({ cv, className }: { cv: Cv; className?: string }) {
  const page = PAGE_PX[cv.design.pageSize] ?? PAGE_PX.A4;
  const box = useRef<HTMLDivElement>(null);
  const [w, setW] = useState(0);
  useLayoutEffect(() => {
    const el = box.current;
    if (!el) return;
    setW(el.clientWidth);
    const ro = new ResizeObserver(() => setW(el.clientWidth));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const scale = w / page.w;
  return (
    <div ref={box} className={"relative w-full overflow-hidden bg-white " + (className ?? "")} style={{ aspectRatio: `${page.w} / ${page.h}` }}>
      {w > 0 && (
        <div className="pointer-events-none absolute left-0 top-0 origin-top-left" style={{ width: page.w, transform: `scale(${scale})` }} aria-hidden>
          <CvDocument cv={cv} maxPages={1} />
        </div>
      )}
    </div>
  );
}
