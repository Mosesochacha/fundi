import type { Message } from "../types";

export const initialsOf = (n: string) =>
  (n || "")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("") || "?";

const AVATAR_COLORS = [
  "#c9a84c",
  "#0d1b2a",
  "#3b7d6e",
  "#9c5b3b",
  "#5a4b8a",
  "#a8872e",
  "#2f6f9e",
];

/** Deterministic avatar colour derived from a display name. */
export const avatarColorOf = (name: string) => {
  const seed = (name || "?")
    .split("")
    .reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  return AVATAR_COLORS[seed % AVATAR_COLORS.length];
};

/** "9:14 AM" */
export const timeLabel = (iso: string) =>
  new Date(iso).toLocaleTimeString("en-GB", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

const isSameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

/** "Today" / "Yesterday" / "3 Jun 2026" for date separators. */
export function dayLabel(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (isSameDay(d, now)) return "Today";
  if (isSameDay(d, yesterday)) return "Yesterday";
  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/** Compact label for the conversation-list row: time today, "Yesterday", weekday, or date. */
export function relativeLabel(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (isSameDay(d, now))
    return d.toLocaleTimeString("en-GB", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  if (isSameDay(d, yesterday)) return "Yesterday";
  const diffDays = (now.getTime() - d.getTime()) / 86_400_000;
  if (diffDays < 7) return d.toLocaleDateString("en-GB", { weekday: "short" });
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

/** "Sat 7 Jun · 9:00am" for the job banner sub-line. */
export function jobScheduleLabel(iso: string | null): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  const date = d.toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
  const time = d
    .toLocaleTimeString("en-GB", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    })
    .toLowerCase()
    .replace(" ", "");
  return `${date} · ${time}`;
}

export interface MessageGroup {
  key: string;
  label: string;
  messages: Message[];
}

/** Group a chronologically-sorted message list into day buckets for date separators. */
export function groupByDay(messages: Message[]): MessageGroup[] {
  const groups: MessageGroup[] = [];
  for (const m of messages) {
    const label = dayLabel(m.createdAt);
    const last = groups[groups.length - 1];
    if (last && last.label === label) last.messages.push(m);
    else groups.push({ key: `${label}-${m.id}`, label, messages: [m] });
  }
  return groups;
}
