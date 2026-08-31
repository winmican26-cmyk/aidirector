import { describe, expect, it } from "vitest";
import { Fixtures } from "@/lib/api";
import {
  findExportLinkForCandidate,
  mapJobViewToClips,
  mapJobViewToProject,
} from "./map-job-view";

const view = Fixtures.FIXTURE_JOB_VIEW;

describe("mapJobViewToClips", () => {
  it("produces one clip per candidate", () => {
    const clips = mapJobViewToClips(view);
    expect(clips).toHaveLength(view.candidates.length);
  });

  it("maps scores onto a 0–10 scale", () => {
    const clips = mapJobViewToClips(view);
    for (const clip of clips) {
      expect(clip.score).toBeGreaterThanOrEqual(0);
      expect(clip.score).toBeLessThanOrEqual(10);
    }
    // final_rank_score 0.49 → 4.9
    expect(clips[0].score).toBe(4.9);
  });

  it("marks a candidate with an export as ready and one without as processing", () => {
    const clips = mapJobViewToClips(view);
    const withExport = clips.find((c) => c.id === view.candidates[0].id);
    const withoutExport = clips.find((c) => c.id === view.candidates[1].id);
    expect(withExport?.status).toBe("ready");
    expect(withoutExport?.status).toBe("processing");
  });

  it("derives a readable title from the scene kind", () => {
    const clips = mapJobViewToClips(view);
    expect(clips[0].title).toMatch(/Goal/i);
  });

  it("maps platforms from the director plan variants", () => {
    const clips = mapJobViewToClips(view);
    expect(clips[0].platforms).toContain("youtube_shorts");
    expect(clips[0].platforms).toContain("tiktok");
    expect(clips[0].platforms).toContain("instagram_reels");
  });
});

describe("mapJobViewToProject", () => {
  it("uses the upload filename and candidate count", () => {
    const project = mapJobViewToProject(view);
    expect(project.videoName).toBe(view.upload.filename);
    expect(project.clipCount).toBe(view.candidates.length);
  });

  it("maps platforms from the director plan targets", () => {
    const project = mapJobViewToProject(view);
    expect(project.platforms).toEqual(view.director_plan?.platform_targets);
  });
});

describe("findExportLinkForCandidate", () => {
  it("resolves the render output id and filename for an exported candidate", () => {
    const link = findExportLinkForCandidate(view, view.candidates[0].id);
    expect(link).not.toBeNull();
    expect(link?.renderOutputId).toBe(view.render_outputs[0].id);
    expect(link?.filename).toBe(view.exports[0].filename);
  });

  it("returns null for a candidate with no export", () => {
    const link = findExportLinkForCandidate(view, view.candidates[1].id);
    expect(link).toBeNull();
  });

  it("returns null for an unknown candidate id", () => {
    expect(findExportLinkForCandidate(view, "candidate_missing")).toBeNull();
  });
});
