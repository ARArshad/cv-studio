"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { fontCss } from "@/lib/fonts";
import { getTemplate, type TemplateDef } from "@/lib/templates";
import type { Cv } from "@/lib/types";
import { buildBlocks, Header, initials, type Block } from "./blocks";
import { EditContext, useEdit } from "./edit";

/* 210 x 297 mm and 8.5 x 11 in at 96 px per inch; exact, so printed sheets do not spill */
export const PAGE_PX = { A4: { w: 793.7, h: 1122.5 }, Letter: { w: 816, h: 1056 } } as const;
const SPACING = { compact: 12, normal: 18, relaxed: 26 } as const;

export function pageVars(cv: Cv, tpl: TemplateDef): CSSProperties {
  const d = cv.design;
  const size = PAGE_PX[d.pageSize] ?? PAGE_PX.A4;
  const side = d.sideWidth ?? (tpl.layout === "single" ? 0.34 : tpl.sideWidth);
  return {
    "--accent": d.accent,
    "--accent2": d.accent2,
    "--font-body": fontCss(d.fontBody),
    "--font-head": fontCss(d.fontHeading),
    "--fs": `${(tpl.id === "ledger" ? 11.4 : 12.2) * d.fontScale}px`,
    "--lh": d.lineHeight,
    "--ls": `${d.letterSpacing}em`,
    "--gap": `${SPACING[d.spacing] ?? 18}px`,
    "--m": `${d.margin}px`,
    "--side-w": `${side * 100}%`,
    "--page-w": `${size.w}px`,
    "--page-h": `${size.h}px`,
  } as CSSProperties;
}

interface Props {
  cv: Cv;
  /** draw only this many pages (thumbnails) */
  maxPages?: number;
  onPageCount?: (n: number) => void;
  className?: string;
}

/**
 * Lays the CV out on real pages. Every block is rendered once off screen to
 * be measured, then dealt onto pages column by column. Page capacity is read
 * from two empty measuring pages, so templates are free to pad their columns
 * however they like.
 */
export function CvDocument({ cv, maxPages, onPageCount, className }: Props) {
  const ed = useEdit();
  const editing = !!ed?.on;
  const tpl = getTemplate(cv.design.template);
  const layoutMode = cv.design.layout ?? tpl.layout;
  const blocks = useMemo(() => buildBlocks(cv, tpl, editing), [cv, tpl, editing]);
  const vars = useMemo(() => pageVars(cv, tpl), [cv, tpl]);
  const measureCtx = useMemo(() => (ed ? { ...ed, measure: true } : null), [ed]);
  const measureRef = useRef<HTMLDivElement>(null);
  /* which block keys go on which page and column; the blocks themselves are
     always taken fresh from this render so edits show at once */
  const [layout, setLayout] = useState<{ sig: string; pages: string[][][] } | null>(null);
  const hasSide = layoutMode !== "single";
  const fullHeader = tpl.header !== "side" || !hasSide;

  /* Measure, and measure again whenever anything in the measuring layer
     changes size: fonts arriving, a photo loading, styles applying late. */
  const measure = useCallback(() => {
    const root = measureRef.current;
    if (!root) return;
    const cap = (sel: string) => {
      const col = root.querySelector<HTMLElement>(sel);
      if (!col) return 0;
      const cs = getComputedStyle(col);
      return col.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom);
    };
    const caps = {
      first: { main: cap(".m-first .col.main"), side: cap(".m-first .col.side") },
      rest: { main: cap(".m-rest .col.main"), side: cap(".m-rest .col.side") },
    };
    const heights = new Map<string, number>();
    const flow = root.querySelector<HTMLElement>(".m-flow");
    const scale = flow ? scaleOf(flow) : 1;
    root.querySelectorAll<HTMLElement>(".m-flow [data-bk]").forEach((el) => {
      heights.set(el.dataset.bk!, el.getBoundingClientRect().height / scale);
    });

    const result: Block[][][] = [];
    for (const column of ["main", "side"] as const) {
      let page = 0, used = 0;
      for (const b of blocks.filter((x) => x.column === column)) {
        const h = heights.get(b.key) ?? 0;
        const limit = page === 0 ? caps.first[column] : caps.rest[column];
        if (used > 0 && used + h > limit + 0.5) { page += 1; used = 0; }
        result[page] ??= [[], []];
        result[page][column === "main" ? 0 : 1].push(b);
        used += h;
      }
    }
    if (!result.length) result.push([[], []]);
    for (let i = 0; i < result.length; i++) result[i] ??= [[], []];
    const keys = result.map(([m, sd]) => [m.map((x) => x.key), sd.map((x) => x.key)]);
    const sig = JSON.stringify(keys);
    setLayout((prev) => (prev && prev.sig === sig ? prev : { sig, pages: keys }));
  }, [blocks]);

  useLayoutEffect(() => {
    measure();
    const root = measureRef.current;
    if (!root || typeof ResizeObserver === "undefined") return;
    let raf = 0;
    const ro = new ResizeObserver(() => { cancelAnimationFrame(raf); raf = requestAnimationFrame(measure); });
    root.querySelectorAll(".m-flow .col, .m-first .col, .m-rest .col").forEach((el) => ro.observe(el));
    document.fonts?.ready.then(() => measure());
    return () => { ro.disconnect(); cancelAnimationFrame(raf); };
  }, [measure, vars]);

  const count = layout?.pages.length ?? 1;
  useEffect(() => { onPageCount?.(count); }, [count, onPageCount]);

  const pageClass = `cv-page tpl-${tpl.id} layout-${layoutMode} head-${fullHeader ? (tpl.header === "side" ? "top" : tpl.header) : "side"}`
    + (tpl.darkSide ? " dark-side" : "") + (tpl.darkHeader ? " dark-head" : "")
    + ` entries-${tpl.entryStyle} bd-${cv.design.backdrop}`
    + (cv.design.showIcons ? "" : " no-icons")
    + (cv.design.headingIcons ? " h-icons" : "")
    + (editing ? " editing" : "");

  const renderBlock = (b: Block) => (
    <div
      key={b.key}
      className={"blk" + (b.pos ? " s-" + b.pos : "") + (b.entryStart ? " e-start" : "")}
      data-bk={b.key}
      data-section={b.sectionId}
    >
      <div className="bin">{b.node}</div>
    </div>
  );

  const cols = (main: Block[], side: Block[]) => (
    <div className="cols">
      {hasSide && layoutMode === "left" && <div className="col side">{side.map(renderBlock)}</div>}
      <div className="col main">{main.map(renderBlock)}</div>
      {hasSide && layoutMode === "right" && <div className="col side">{side.map(renderBlock)}</div>}
    </div>
  );

  const renderPage = (index: number, main: Block[], side: Block[], extra?: string) => (
    <div key={(extra ?? "p") + index} className={pageClass + (extra ? " " + extra : "") + (index === 0 ? " first" : " rest")} style={vars}>
      <div className="page-art" aria-hidden>
        <div className="art-side" />
        <div className="art-deco" />
        {index === 0 && <div className="watermark">{initials(cv.data.personal.fullName).slice(0, 1)}</div>}
      </div>
      <div className="sheet">
        {index === 0 && fullHeader && <Header cv={cv} tpl={tpl} />}
        {cols(main, side)}
      </div>
    </div>
  );

  const byKey = new Map(blocks.map((b) => [b.key, b]));
  const pick = (keys: string[]) => keys.map((k) => byKey.get(k)).filter((b): b is Block => !!b);
  const shown = (layout
    ? layout.pages.map(([m, sd]) => [pick(m), pick(sd)])
    : [[blocks.filter((b) => b.column === "main"), blocks.filter((b) => b.column === "side")]]
  ).slice(0, maxPages ?? Infinity);

  return (
    <div className={"cv-doc " + (className ?? "")}>
      {/* measuring layer: the same markup, never editable, never visible, never printed */}
      <EditContext.Provider value={measureCtx}>
        <div ref={measureRef} className="cv-measure" aria-hidden>
          {renderPage(0, [], [], "m-first")}
          {renderPage(1, [], [], "m-rest")}
          <div className={pageClass + " m-flow"} style={vars}>
            <div className="sheet">
              {cols(blocks.filter((b) => b.column === "main"), blocks.filter((b) => b.column === "side"))}
            </div>
          </div>
        </div>
      </EditContext.Provider>
      <div className="cv-pages">
        {shown.map(([main, side], i) => renderPage(i, main, side))}
      </div>
    </div>
  );
}

/** heights are read in page pixels even when a parent is scaled */
function scaleOf(el: HTMLElement): number {
  const r = el.getBoundingClientRect().width;
  return r && el.offsetWidth ? r / el.offsetWidth : 1;
}
