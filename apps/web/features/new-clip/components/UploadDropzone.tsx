"use client";

import { useRef, useState, useCallback, type DragEvent } from "react";
import { motion } from "framer-motion";
import { AppIcon } from "@/features/design-system";
import { cn } from "@/features/design-system/utils/cn";

interface UploadDropzoneProps {
  onFileSelected: (file: File | null) => void;
  /** Currently selected file, if any */
  file: File | null;
}

/**
 * Large friendly drag-and-drop upload area.
 *
 * Improvements from v1:
 * - Larger cloud upload icon above text
 * - Friendlier copy: "Drop your video here" / "Browse Computer"
 * - Estimated processing time: "3–8 minutes"
 *
 * Supports: drag & drop, browse button, click anywhere.
 * Shows supported formats (MP4, MOV, MKV) and max size (2.2 GB).
 * Fully accessible — keyboard navigable, screen-reader labels.
 * Never mentions codecs, ffmpeg, or rendering.
 */
export function UploadDropzone({ onFileSelected, file }: UploadDropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const handleFiles = useCallback(
    (files: FileList | null) => {
      if (!files || files.length === 0) return;
      const f = files[0];
      if (f.type.startsWith("video/")) {
        onFileSelected(f);
      }
    },
    [onFileSelected],
  );

  const onDragOver = useCallback((e: DragEvent) => {
    e.preventDefault();
    setDragging(true);
  }, []);

  const onDragLeave = useCallback(() => {
    setDragging(false);
  }, []);

  const onDrop = useCallback(
    (e: DragEvent) => {
      e.preventDefault();
      setDragging(false);
      handleFiles(e.dataTransfer?.files ?? null);
    },
    [handleFiles],
  );

  const onClick = useCallback(() => {
    inputRef.current?.click();
  }, []);

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        inputRef.current?.click();
      }
    },
    [],
  );

  return (
    <div className="w-full max-w-2xl mx-auto">
      <input
        ref={inputRef}
        id="video-upload"
        type="file"
        accept="video/mp4,video/quicktime,video/x-matroska"
        className="sr-only"
        aria-hidden="true"
        tabIndex={-1}
        onChange={(e) => handleFiles(e.target.files)}
      />

      {file ? (
        /* Selected file state */
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.2 }}
          className="rounded-2xl border border-[color:var(--color-border-accent)] bg-[color:var(--color-surface-2)] p-8 flex flex-col items-center justify-center text-center"
        >
          <div className="h-14 w-14 rounded-xl bg-[color:var(--color-accent-green)]/15 border border-[color:var(--color-border-accent)] flex items-center justify-center">
            <AppIcon name="fileVideo" size="lg" className="text-[color:var(--color-accent-green)]" strokeWidth={2} />
          </div>
          <p className="mt-4 text-base font-medium text-[color:var(--color-text-primary)]">{file.name}</p>
          <p className="mt-1 text-sm text-[color:var(--color-text-secondary)]">
            {(file.size / (1024 * 1024)).toFixed(1)} MB
          </p>
          <button
            type="button"
            onClick={() => onFileSelected(null)}
            className="mt-4 text-sm font-medium text-[color:var(--color-accent-blue)] hover:text-white transition-colors underline underline-offset-2"
          >
            Choose a different file
          </button>
        </motion.div>
      ) : (
        /* Empty drop zone — friendlier design */
        <motion.div
          initial={false}
          animate={dragging ? { scale: 1.01 } : { scale: 1 }}
          transition={{ duration: 0.2, ease: [0.2, 0.8, 0.2, 1] }}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          onClick={onClick}
          onKeyDown={onKeyDown}
          role="button"
          tabIndex={0}
          aria-label="Upload video file. Click or drag and drop to upload."
          className={cn(
            "cursor-pointer rounded-2xl border-2 border-dashed p-12 flex flex-col items-center justify-center text-center transition-colors min-h-[280px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-accent-green)]/50",
            dragging
              ? "border-[color:var(--color-accent-blue)] bg-[color:var(--color-accent-blue)]/10"
              : "border-[color:var(--color-border-strong)] bg-[color:var(--color-surface-2)] hover:border-[color:var(--color-accent-blue)] hover:bg-[color:var(--color-surface-3)]",
          )}
        >
          {/* Large cloud upload icon */}
          <div className="h-24 w-24 rounded-full bg-[color:var(--color-accent-green)]/10 border-2 border-[color:var(--color-border-accent)] flex items-center justify-center">
            <AppIcon name="cloudUpload" size="3xl" className="text-[color:var(--color-accent-green)]" strokeWidth={1.5} />
          </div>

          <p className="mt-6 text-lg font-semibold text-[color:var(--color-text-primary)]">
            Drop your video here
          </p>
          <p className="mt-1.5 text-sm text-[color:var(--color-text-secondary)]">
            or{" "}
            <label
              htmlFor="video-upload"
              onClick={(e) => e.stopPropagation()}
              className="cursor-pointer font-medium text-[color:var(--color-accent-blue)] underline underline-offset-2 hover:text-white transition-colors"
            >
              Browse Computer
            </label>
          </p>

          <div className="mt-6 flex items-center gap-2 text-xs text-[color:var(--color-text-tertiary)]">
            <span>MP4 · MOV · MKV</span>
            <span className="text-[color:var(--color-border-strong)]">|</span>
            <span>Up to 2.2 GB</span>
          </div>

          {/* Estimated processing time */}
          <p className="mt-5 text-sm text-[color:var(--color-text-tertiary)] flex items-center justify-center gap-1.5">
            <AppIcon name="zap" size="sm" className="text-[color:var(--color-accent-blue)]" strokeWidth={2} />
            Typical processing time: 3–8 minutes
          </p>
        </motion.div>
      )}
    </div>
  );
}
