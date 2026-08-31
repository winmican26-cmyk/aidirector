import { describe, it, expect, vi, afterEach } from "vitest";
import { downloadUrl } from "./export-download";

describe("downloadUrl", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("downloads via fetch→blob→anchor when fetch succeeds", async () => {
    const blob = new Blob(["video-bytes"], { type: "video/mp4" });
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(new Response(blob, { status: 200 }));
    const createObjectURL = vi
      .spyOn(URL, "createObjectURL")
      .mockReturnValue("blob:mock");
    const revoke = vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => {});

    const clicked = vi.fn();
    const anchorClick = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(clicked);

    const result = await downloadUrl("https://r2.example/clip.mp4", "clip.mp4");

    expect(fetchMock).toHaveBeenCalledWith("https://r2.example/clip.mp4", { mode: "cors" });
    expect(createObjectURL).toHaveBeenCalledWith(expect.any(Blob));
    expect(anchorClick).toHaveBeenCalled();
    expect(revoke).toHaveBeenCalled();
    expect(result).toBe(true);
  });

  it("falls back to window.open when fetch fails", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new TypeError("Failed to fetch"));
    const openMock = vi.spyOn(window, "open").mockReturnValue({} as Window);

    const result = await downloadUrl("https://r2.example/clip.mp4");

    expect(openMock).toHaveBeenCalledWith("https://r2.example/clip.mp4", "_blank", "noopener,noreferrer");
    expect(result).toBe(true);
  });

  it("returns false when fetch fails and window.open is blocked", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new TypeError("Failed to fetch"));
    vi.spyOn(window, "open").mockReturnValue(null);

    const result = await downloadUrl("https://r2.example/clip.mp4");

    expect(result).toBe(false);
  });

  it("falls back to window.open when fetch returns a non-ok response", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(null, { status: 403 }));
    const openMock = vi.spyOn(window, "open").mockReturnValue({} as Window);

    const result = await downloadUrl("https://r2.example/clip.mp4", "clip.mp4");

    expect(openMock).toHaveBeenCalled();
    expect(result).toBe(true);
  });
});
