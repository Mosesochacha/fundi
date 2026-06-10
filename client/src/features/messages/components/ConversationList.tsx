"use client";

import { Search } from "lucide-react";
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
    <div className="msg-list">
      <div className="msg-list-head">
        <h2 className="msg-list-title">Messages</h2>
        <div className="msg-search">
          <Search size={14} className="msg-search-icon" />
          <input
            className="msg-search-input"
            placeholder="Search conversations..."
            value={search}
            onChange={(e) => onSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="msg-list-scroll">
        {loading ? (
          <div className="msg-list-loading">Loading…</div>
        ) : conversations.length === 0 ? (
          <div className="msg-list-empty">No conversations</div>
        ) : (
          conversations.map((c) => {
            const online = isOnline(c, presence);
            const unread = c.unreadCount > 0;
            return (
              <button
                type="button"
                key={c.id}
                className={`msg-conv${selectedId === c.id ? " selected" : ""}`}
                onClick={() => onSelect(c.id)}
              >
                <span className="msg-avatar-wrap">
                  <span
                    className="msg-avatar"
                    style={{ background: c.participant.avatarColor }}
                  >
                    {c.participant.initials}
                  </span>
                  {online && <span className="msg-online-dot" />}
                </span>
                <span className="msg-conv-body">
                  <span className="msg-conv-row1">
                    <span className={`msg-conv-name${unread ? " unread" : ""}`}>
                      {c.participant.name}
                    </span>
                    {c.lastMessage && (
                      <span className="msg-conv-time">
                        {relativeLabel(c.lastMessage.createdAt)}
                      </span>
                    )}
                  </span>
                  <span className="msg-conv-row2">
                    <span
                      className={`msg-conv-preview${unread ? " unread" : ""}`}
                    >
                      {c.lastMessage?.content ?? "No messages yet"}
                    </span>
                  </span>
                  {(c.linkedJob || unread) && (
                    <span className="msg-conv-row3">
                      <span className="msg-conv-tag">
                        {c.linkedJob?.title ?? ""}
                      </span>
                      {unread && (
                        <span className="msg-conv-badge">{c.unreadCount}</span>
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
