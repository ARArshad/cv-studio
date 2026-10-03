"use client";

import { useEffect, useRef, useState } from "react";
import { ImagePlus, RotateCw, Trash2, ZoomIn, ZoomOut } from "lucide-react";
import { Button, Modal, cx } from "@/components/ui";
import type { PhotoShape } from "@/lib/types";

const BOX = 300;
const OUT = 600;

/** read a picked file, keeping a copy no larger than 1400px to crop from */
export function loadImageFile(f: File, done: (src: string) => void) {
  const reader = new FileReader();
  reader.onload = () => {
    const img = new Image();
    img.onload = () => {
      const k = Math.min(1, 1400 / Math.max(img.width, img.height));
      const c = document.createElement("canvas");
      c.width = Math.round(img.width * k);
      c.height = Math.round(img.height * k);
      c.getContext("2d")!.drawImage(img, 0, 0, c.width, c.height);
      done(c.toDataURL("image/jpeg", 0.9));
    };
    img.src = reader.result as string;
  };
  reader.readAsDataURL(f);
}

interface Props {
  open: boolean;
  src: string;
  shape: PhotoShape;
  onClose: () => void;
  onSave: (cropped: string, source: string) => void;
  onRemove: () => void;
  onPickNew: () => void;
}

/**
 * Frame a photo: drag to move, slider or wheel to zoom, rotate in quarter
 * turns. The result is a 600px square; the shape on the CV comes from the
 * design, so it can still be changed later without cropping again.
 */
export function PhotoCropper({ open, src, shape, onClose, onSave, onRemove, onPickNew }: Props) {
  const [img, setImg] = useState<HTMLImageElement | null>(null);
  const [zoom, setZoom] = useState(1);
  const [rot, setRot] = useState(0);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const drag = useRef<{ x: number; y: number; px: number; py: number } | null>(null);

  useEffect(() => {
    if (!src) return;
    const i = new Image();
    i.onload = () => { setImg(i); setZoom(1); setRot(0); setPos({ x: 0, y: 0 }); };
    i.src = src;
  }, [src]);

  /* the image's width and height once rotated */
  const w = img ? (rot % 180 === 0 ? img.width : img.height) : 1;
  const h = img ? (rot % 180 === 0 ? img.height : img.width) : 1;
  const cover = Math.max(BOX / w, BOX / h);
  const scale = cover * zoom;
  const clamp = (p: { x: number; y: number }, s = scale) => {
    const mx = Math.max(0, (w * s - BOX) / 2), my = Math.max(0, (h * s - BOX) / 2);
    return { x: Math.max(-mx, Math.min(mx, p.x)), y: Math.max(-my, Math.min(my, p.y)) };
  };
  const setZoomClamped = (z: number) => {
    const nz = Math.max(1, Math.min(4, z));
    setZoom(nz);
    setPos((p) => clamp(p, cover * nz));
  };

  const save = () => {
    if (!img) return;
    const c = document.createElement("canvas");
    c.width = c.height = OUT;
    const g = c.getContext("2d")!;
    const k = OUT / BOX;
    g.fillStyle = "#fff";
    g.fillRect(0, 0, OUT, OUT);
    g.translate(OUT / 2 + pos.x * k, OUT / 2 + pos.y * k);
    g.rotate((rot * Math.PI) / 180);
    g.scale(scale * k, scale * k);
    g.drawImage(img, -img.width / 2, -img.height / 2);
    onSave(c.toDataURL("image/jpeg", 0.9), src);
  };

  return (
    <Modal open={open} onClose={onClose} title="Adjust your photo">
      <div className="flex flex-col items-center" data-testid="cropper">
        <div
          className="relative cursor-grab touch-none select-none overflow-hidden rounded-xl bg-slate-900 active:cursor-grabbing"
          style={{ width: BOX, height: BOX }}
          onPointerDown={(e) => { (e.target as HTMLElement).setPointerCapture(e.pointerId); drag.current = { x: e.clientX, y: e.clientY, px: pos.x, py: pos.y }; }}
          onPointerMove={(e) => { const d = drag.current; if (d) setPos(clamp({ x: d.px + e.clientX - d.x, y: d.py + e.clientY - d.y })); }}
          onPointerUp={() => { drag.current = null; }}
          onWheel={(e) => setZoomClamped(zoom - e.deltaY * 0.002)}
          data-testid="crop-area"
        >
          {img && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={src}
              alt=""
              draggable={false}
              className="pointer-events-none absolute left-1/2 top-1/2 max-w-none"
              style={{ width: img.width, height: img.height, transform: `translate(-50%, -50%) translate(${pos.x}px, ${pos.y}px) rotate(${rot}deg) scale(${scale})` }}
            />
          )}
          {/* the frame the CV will show */}
          <div
            className={cx("pointer-events-none absolute inset-0", shape === "circle" ? "rounded-full" : shape === "rounded" ? "rounded-[16%]" : "")}
            style={{ boxShadow: "0 0 0 9999px rgba(15, 23, 42, 0.55)", outline: "2px solid rgba(255,255,255,.9)", outlineOffset: -2 }}
          />
        </div>

        <div className="mt-5 flex w-full items-center gap-3">
          <button type="button" aria-label="Zoom out" onClick={() => setZoomClamped(zoom - 0.2)} className="text-slate-500 hover:text-ink cursor-pointer"><ZoomOut className="h-5 w-5" /></button>
          <input type="range" min={1} max={4} step={0.01} value={zoom} onChange={(e) => setZoomClamped(Number(e.target.value))} className="flex-1 accent-brand-600" aria-label="Zoom" data-testid="crop-zoom" />
          <button type="button" aria-label="Zoom in" onClick={() => setZoomClamped(zoom + 0.2)} className="text-slate-500 hover:text-ink cursor-pointer"><ZoomIn className="h-5 w-5" /></button>
          <button type="button" aria-label="Rotate" onClick={() => { setRot((r) => (r + 90) % 360); setPos({ x: 0, y: 0 }); }} className="ml-2 text-slate-500 hover:text-ink cursor-pointer"><RotateCw className="h-5 w-5" /></button>
        </div>
        <p className="mt-2 text-xs text-slate-500">Drag the photo to move it. Zoom with the slider or your mouse wheel.</p>

        <div className="mt-6 flex w-full flex-wrap items-center gap-2">
          <Button size="sm" onClick={onPickNew}><ImagePlus className="h-4 w-4" /> Another photo</Button>
          <Button size="sm" variant="ghost" onClick={onRemove} className="text-red-600 hover:bg-red-50 hover:text-red-700"><Trash2 className="h-4 w-4" /> Remove</Button>
          <span className="flex-1" />
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={save} data-testid="crop-save">Save photo</Button>
        </div>
      </div>
    </Modal>
  );
}
