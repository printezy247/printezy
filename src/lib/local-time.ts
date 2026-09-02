/**
 * Timezone helpers.
 *
 * The MacroTrader bot schedules everything in America/New_York wall-clock time
 * (see scheduler/tasks.py). On the web we author the same New York wall-clock
 * values and convert them to the visitor's own timezone after mount, so SSR
 * never bakes in the server's timezone.
 */

import { useEffect, useState } from "react";

export const NY_TZ = "America/New_York";

/** Minutes New York is offset from UTC at the given instant (e.g. -240 in EDT). */
function nyOffsetMinutes(at: Date): number {
  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone: NY_TZ,
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  const parts = Object.fromEntries(dtf.formatToParts(at).map((p) => [p.type, p.value]));
  const asUtc = Date.UTC(
    Number(parts.year),
    Number(parts.month) - 1,
    Number(parts.day),
    Number(parts.hour) === 24 ? 0 : Number(parts.hour),
    Number(parts.minute),
    Number(parts.second),
  );
  return Math.round((asUtc - at.getTime()) / 60000);
}

/** Turn a "HH:MM" New York wall-clock time (today) into a real Date. */
export function nyWallClockToDate(hhmm: string, reference: Date = new Date()): Date {
  const [hour, minute] = hhmm.split(":").map(Number);
  const dtf = new Intl.DateTimeFormat("en-CA", {
    timeZone: NY_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const [y, m, d] = dtf.format(reference).split("-").map(Number);
  const offset = nyOffsetMinutes(reference);
  return new Date(Date.UTC(y, m - 1, d, hour, minute) - offset * 60000);
}

/** 24h clock string in the browser's own timezone. */
export function formatLocalTime(date: Date): string {
  return date.toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

/** "GMT+7", "GMT+5:30", "GMT-4", "GMT" — derived from the browser offset. */
export function gmtOffsetLabel(date: Date = new Date()): string {
  const minutes = -date.getTimezoneOffset();
  if (minutes === 0) return "GMT";
  const sign = minutes > 0 ? "+" : "-";
  const abs = Math.abs(minutes);
  const hours = Math.floor(abs / 60);
  const mins = abs % 60;
  return `GMT${sign}${hours}${mins ? `:${String(mins).padStart(2, "0")}` : ""}`;
}

export type LocalClock = {
  /** False during SSR and first paint — New York values are shown until then. */
  ready: boolean;
  /** "GMT±H" for the visitor, "EST" before hydration. */
  tzLabel: string;
  /** Convert a New York wall-clock "HH:MM" to the visitor's local clock. */
  toLocal: (nyTime: string) => string;
};

/**
 * Same hydration-safe pattern as useBotLink(): render the New York value on the
 * first paint, then swap to the visitor's timezone once mounted.
 */
export function useLocalClock(): LocalClock {
  const [ready, setReady] = useState(false);
  const [tzLabel, setTzLabel] = useState("EST");

  useEffect(() => {
    setTzLabel(gmtOffsetLabel());
    setReady(true);
  }, []);

  return {
    ready,
    tzLabel,
    toLocal: (nyTime: string) => (ready ? formatLocalTime(nyWallClockToDate(nyTime)) : nyTime),
  };
}
