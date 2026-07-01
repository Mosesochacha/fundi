"use client";

import { Search } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Conversation } from "../types";
import { relativeLabel } from "./helpers";

interface Props {
  conversations: Conversation[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  search: string;
  onSearch: (v: string) => void;
  presence: Record<string, boolean>;
  loading: boolean;
}

function isOnline(c: Conversation, presence: Record<string, boolean>) {
  const uid = c.participant.userId;
  if (uid && uid in presence) return presence[uid];
  return c.participant.isOnline;
}

export default function ConversationList({
  conversations,
  selectedId,
  onSelect,
  search,
  onSearch,
  presence,
  loading,
}: Props) {
  return (
    <div className="flex flex-col overflow-hidden bg-white border-r-[0.5px] border-border min-w-0 group-[.has-selection]:hidden lg:!flex">
      <div className="px-4 py-3.5 border-b-[0.5px] border-border shrink-0">
        <h2 className="text-sm font-medium text-ink m-0 mb-2.5">Messages</h2>
        <div className="relative flex items-center">
          <Search
            size={14}
            className="absolute left-[9px] text-ink-3 pointer-events-none"
          />
          <input
            className="w-full border-[0.5px] border-border rounded-lg bg-cream py-[7px] pl-[30px] pr-2.5 text-sm text-ink outline-none placeholder:text-ink-3 focus:border-gold"
            placeholder="Search conversations..."
            aria-label="Search conversations"
            type="search"
            value={search}
            onChange={(e) => onSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="px-4 py-6 text-sm text-ink-3 text-center">
            Loading…
          </div>
        ) : conversations.length === 0 ? (
          <div className="px-4 py-6 text-sm text-ink-3 text-center">
            No conversations
          </div>
        ) : (
          conversations.map((c) => {
            const online = isOnline(c, presence);
            const unread = c.unreadCount > 0;
            return (
              <button
                type="button"
                key={c.id}
                className={cn(
                  "w-full flex gap-2.5 items-start text-left px-3.5 py-[11px] border-b-[0.5px] border-cream-2 border-l-2 cursor-pointer",
                  selectedId === c.id
                    ? "bg-gold-light border-l-gold"
                    : "bg-white border-l-transparent hover:bg-cream",
                )}
                onClick={() => onSelect(c.id)}
              >
                <span className="relative shrink-0 inline-flex">
                  <span
                    className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold text-white"
                    style={{ background: c.participant.avatarColor }}
                  >
                    {c.participant.initials}
                  </span>
                  {online && (
                    <span className="absolute -right-px -bottom-px w-[9px] h-[9px] rounded-full bg-green-400 border-2 border-white" />
                  )}
                </span>
                <span className="flex-1 min-w-0 flex flex-col gap-0.5">
                  <span className="flex items-baseline justify-between gap-2">
                    <span
                      className={cn(
                        "text-sm whitespace-nowrap overflow-hidden text-ellipsis",
                        unread ? "font-medium text-ink" : "text-ink-2",
                      )}
                    >
                      {c.participant.name}
                    </span>
                    {c.lastMessage && (
                      <span className="text-[10px] text-ink-3 shrink-0">
                        {relativeLabel(c.lastMessage.createdAt)}
                      </span>
                    )}
                  </span>
                  <span className="flex min-w-0">
                    <span
                      className={cn(
                        "text-[11px] whitespace-nowrap overflow-hidden text-ellipsis",
                        unread ? "text-ink-2 font-medium" : "text-ink-3",
                      )}
                    >
                      {c.lastMessage?.content ?? "No messages yet"}
                    </span>
                  </span>
                  {(c.linkedJob || unread) && (
                    <span className="flex items-center justify-between gap-2 mt-px">
                      <span className="text-[10px] text-ink-3 whitespace-nowrap overflow-hidden text-ellipsis">
                        {c.linkedJob?.title ?? ""}
                      </span>
                      {unread && (
                        <span className="shrink-0 min-w-[16px] h-4 px-1 rounded-lg bg-gold text-navy text-[9px] font-semibold inline-flex items-center justify-center">
                          {c.unreadCount}
                        </span>
                      )}
                    </span>
                  )}
                </span>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
