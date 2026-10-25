import { describe, it, expect, vi } from "vitest";
import {
  boardRevisionListenerCount,
  boardStreamCount,
  publishBoardRevision,
  reserveBoardStream,
  subscribeBoardRevision,
} from "../board-events.server";

/**
 * The revision bus is the accelerator under the stream: a bridge push nudges
 * every open stream in the same process so the board moves immediately instead
 * of waiting for the stream's next database tick. Nothing here may ever throw
 * into the bridge — a listener that breaks must not cost the bot its push.
 */

describe("board revision bus", () => {
  it("delivers a published stamp to every subscriber", () => {
    const seen: Array<string | null> = [];
    const stopA = subscribeBoardRevision((stamp) => seen.push(stamp));
    const stopB = subscribeBoardRevision((stamp) => seen.push(stamp));

    publishBoardRevision("2026-10-26T02:00:00.000Z");

    expect(seen).toEqual(["2026-10-26T02:00:00.000Z", "2026-10-26T02:00:00.000Z"]);
    stopA();
    stopB();
    expect(boardRevisionListenerCount()).toBe(0);
  });

  it("stops delivering after unsubscribe", () => {
    const seen: Array<string | null> = [];
    const stop = subscribeBoardRevision((stamp) => seen.push(stamp));
    stop();

    publishBoardRevision("2026-10-26T02:00:00.000Z");

    expect(seen).toEqual([]);
  });

  it("keeps the other subscribers when one listener throws", () => {
    const seen: string[] = [];
    const stopBad = subscribeBoardRevision(() => {
      throw new Error("this stream is broken");
    });
    const stopGood = subscribeBoardRevision((stamp) => seen.push(String(stamp)));
    const quiet = vi.spyOn(console, "error").mockImplementation(() => {});

    publishBoardRevision("2026-10-26T02:00:00.000Z");

    expect(seen).toHaveLength(1);
    expect(quiet).toHaveBeenCalled();
    stopBad();
    stopGood();
    quiet.mockRestore();
  });

  it("unsubscribes safely more than once", () => {
    const stop = subscribeBoardRevision(() => {});
    expect(boardRevisionListenerCount()).toBe(1);
    stop();
    stop();
    expect(boardRevisionListenerCount()).toBe(0);
  });
});

describe("stream slots", () => {
  /** Fill the process cap and hand back the releases. */
  function fill(): Array<() => void> {
    const releases: Array<() => void> = [];
    for (let slot = reserveBoardStream(); slot; slot = reserveBoardStream()) {
      releases.push(slot);
    }
    return releases;
  }

  it("caps the streams one process will hold", () => {
    const releases = fill();
    try {
      expect(releases.length).toBeGreaterThan(0);
      expect(reserveBoardStream()).toBeNull();
      expect(boardStreamCount()).toBe(releases.length);
    } finally {
      for (const release of releases) release();
    }
    expect(boardStreamCount()).toBe(0);
  });

  it("counts a slot once, however many times it is released", () => {
    const release = reserveBoardStream()!;
    expect(boardStreamCount()).toBe(1);
    release();
    release();
    expect(boardStreamCount()).toBe(0);
  });
});
