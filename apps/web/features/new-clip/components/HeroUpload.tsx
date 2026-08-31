"use client";

import { LogoMark } from "@/components/brand/LogoMark";
import { UploadDropzone } from "./UploadDropzone";

interface HeroUploadProps {
  file: File | null;
  onFileSelected: (file: File | null) => void;
}

/**
 * Hero section — large centered logo, title, subtitle, and upload dropzone.
 * The first thing users see. Must communicate the product within 10 seconds.
 */
export function HeroUpload({ file, onFileSelected }: HeroUploadProps) {
  return (
    <section className="text-center rounded-3xl border border-[color:var(--color-border-soft)] bg-[color:var(--color-surface-1)] px-6 py-12 md:px-12 md:py-16 shadow-[var(--shadow-card)]">
      {/* Logo */}
      <div className="flex justify-center">
        <div className="inline-flex items-center gap-3 rounded-full border border-[color:var(--color-border-strong)] bg-[color:var(--color-surface-2)] px-5 py-3">
          <LogoMark className="h-8 w-8 text-[color:var(--color-accent-blue)]" />
          <span className="text-xl font-bold text-[color:var(--color-text-primary)] tracking-tight">
            AI Director
          </span>
        </div>
      </div>

      {/* Title */}
      <h1 className="mt-8 text-[48px] font-bold leading-tight tracking-tight text-[color:var(--color-text-primary)]">
        Turn one video into professional clips
        <br />
        for every platform.
      </h1>

      {/* Subtitle */}
      <p className="mt-4 text-lg text-[color:var(--color-text-secondary)] max-w-xl mx-auto leading-relaxed">
        Upload once. Our AI finds the best moments, creates vertical clips,
        adds captions, and prepares everything ready to share.
      </p>

      {/* Upload area */}
      <div className="mt-10">
        <UploadDropzone onFileSelected={onFileSelected} file={file} />
      </div>
    </section>
  );
}
