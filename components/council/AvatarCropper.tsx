"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { WaxButton } from "./WaxButton";

const VIEWPORT = 256; // on-screen crop circle (px)
const OUTPUT = 512; // exported image size (px)

type Props = {
  file: File;
  onCancel: () => void;
  onConfirm: (blob: Blob) => void | Promise<void>;
};

/**
 * Circular avatar cropper: drag to pan, slide to zoom. Exports a square
 * JPEG of the visible region so the chosen part of the photo becomes the
 * avatar.
 */
export function AvatarCropper({ file, onCancel, onConfirm }: Props) {
  const [url, setUrl] = useState<string | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const [nat, setNat] = useState<{ w: number; h: number } | null>(null);
  const [minScale, setMinScale] = useState(1);
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [busy, setBusy] = useState(false);
  const drag = useRef<{ x: number; y: number; ox: number; oy: number } | null>(
    null,
  );

  useEffect(() => {
    const objectUrl = URL.createObjectURL(file);
    setUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [file]);

  const clampOffset = useCallback(
    (x: number, y: number, s: number, w: number, h: number) => {
      const minX = VIEWPORT - w * s;
      const minY = VIEWPORT - h * s;
      return {
        x: Math.min(0, Math.max(minX, x)),
        y: Math.min(0, Math.max(minY, y)),
      };
    },
    [],
  );

  function onImgLoad(e: React.SyntheticEvent<HTMLImageElement>) {
    const img = e.currentTarget;
    const w = img.naturalWidth;
    const h = img.naturalHeight;
    const cover = Math.max(VIEWPORT / w, VIEWPORT / h);
    setNat({ w, h });
    setMinScale(cover);
    setScale(cover);
    setOffset({ x: (VIEWPORT - w * cover) / 2, y: (VIEWPORT - h * cover) / 2 });
  }

  function onPointerDown(e: React.PointerEvent) {
    e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = { x: e.clientX, y: e.clientY, ox: offset.x, oy: offset.y };
  }
  function onPointerMove(e: React.PointerEvent) {
    if (!drag.current || !nat) return;
    const nx = drag.current.ox + (e.clientX - drag.current.x);
    const ny = drag.current.oy + (e.clientY - drag.current.y);
    setOffset(clampOffset(nx, ny, scale, nat.w, nat.h));
  }
  function onPointerUp() {
    drag.current = null;
  }

  function onZoom(e: React.ChangeEvent<HTMLInputElement>) {
    if (!nat) return;
    const next = Number(e.target.value);
    // Keep the viewport center anchored while zooming.
    const c = VIEWPORT / 2;
    const ratio = next / scale;
    const nx = c - (c - offset.x) * ratio;
    const ny = c - (c - offset.y) * ratio;
    setScale(next);
    setOffset(clampOffset(nx, ny, next, nat.w, nat.h));
  }

  async function confirm() {
    if (!imgRef.current || !nat) return;
    setBusy(true);
    try {
      const canvas = document.createElement("canvas");
      canvas.width = OUTPUT;
      canvas.height = OUTPUT;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Canvas not supported.");
      const sW = VIEWPORT / scale;
      const sH = VIEWPORT / scale;
      const sx = -offset.x / scale;
      const sy = -offset.y / scale;
      ctx.drawImage(imgRef.current, sx, sy, sW, sH, 0, 0, OUTPUT, OUTPUT);
      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, "image/jpeg", 0.9),
      );
      if (!blob) throw new Error("Could not process image.");
      await onConfirm(blob);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        aria-label="Cancel"
        className="absolute inset-0 bg-ink/50 backdrop-blur-sm"
        onClick={onCancel}
      />
      <div className="relative w-full max-w-sm rounded-xl border border-hairline bg-surface p-6 shadow-parchment">
        <h2 className="text-center font-display text-xl text-ink">
          Position your portrait
        </h2>
        <p className="mt-1 text-center font-body text-xs text-ink-soft">
          Drag to move, slide to zoom.
        </p>

        <div className="mt-5 flex justify-center">
          <div
            className="relative overflow-hidden rounded-full border-2 border-dm-gold bg-parchment touch-none"
            style={{ width: VIEWPORT, height: VIEWPORT }}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
          >
            {url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                ref={imgRef}
                src={url}
                alt="Portrait to crop"
                onLoad={onImgLoad}
                draggable={false}
                className="absolute max-w-none cursor-grab select-none active:cursor-grabbing"
                style={
                  nat
                    ? {
                        width: nat.w * scale,
                        height: nat.h * scale,
                        left: offset.x,
                        top: offset.y,
                      }
                    : { visibility: "hidden" }
                }
              />
            )}
          </div>
        </div>

        <input
          type="range"
          min={minScale}
          max={minScale * 4}
          step={minScale / 100}
          value={scale}
          onChange={onZoom}
          className="mt-5 w-full accent-wine"
          aria-label="Zoom"
        />

        <div className="mt-5 flex justify-end gap-2">
          <WaxButton variant="outline" onClick={onCancel} disabled={busy}>
            Cancel
          </WaxButton>
          <WaxButton onClick={confirm} disabled={busy || !nat}>
            {busy ? "Saving..." : "Use photo"}
          </WaxButton>
        </div>
      </div>
    </div>
  );
}
