/**
 * Export download service — turns a render output into a browser download.
 *
 * Strategy:
 *   1. Resolve the 1-hour presigned URL from the API (`GET /api/exports/{id}/url`).
 *   2. Fetch the object (CORS-enabled R2 bucket) → blob → object URL →
 *      hidden anchor with `download` attribute. Blob URLs are same-origin,
 *      so the `download` attribute is honoured even though the source was
 *      cross-origin and has no `Content-Disposition: attachment` header.
 *   3. Fallback: if the fetch fails (e.g. R2 bucket CORS not enabled yet),
 *      open the presigned URL in a new tab so the user still reaches the file.
 *
 * Returns `true` when a download/open was initiated, `false` when the URL
 * could not be resolved (e.g. no live API connection).
 */
import type { Endpoints } from "@/lib/api/endpoints";

export async function downloadExport(
  endpoints: Endpoints | null,
  renderOutputId: string,
  filename?: string,
): Promise<boolean> {
  if (!endpoints) return false;
  try {
    const { url } = await endpoints.getExportUrl(renderOutputId);
    return await downloadUrl(url, filename);
  } catch {
    return false;
  }
}

/**
 * Trigger a download for a URL using fetch→blob→anchor, falling back to
 * opening the URL in a new tab when the fetch is blocked (CORS/network).
 * Exported separately so it can be unit-tested without an API layer.
 */
export async function downloadUrl(url: string, filename?: string): Promise<boolean> {
  try {
    const res = await fetch(url, { mode: "cors" });
    if (!res.ok) throw new Error(`Download failed (${res.status})`);
    const blob = await res.blob();
    const objectUrl = URL.createObjectURL(blob);

    const anchor = document.createElement("a");
    anchor.href = objectUrl;
    anchor.download = filename ?? "clip.mp4";
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(objectUrl);
    return true;
  } catch {
    // Fallback: browser navigation to the presigned URL.
    const opened = window.open(url, "_blank", "noopener,noreferrer");
    return opened !== null;
  }
}
