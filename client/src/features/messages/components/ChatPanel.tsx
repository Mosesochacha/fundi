"use client";

import {
  Briefcase,
  Check,
  CheckCheck,
  ChevronLeft,
  ImagePlus,
  MessageSquare,
  MoreHorizontal,
  Paperclip,
  Phone,
  Send,
  User,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { Conversation, JobStatus, Message } from "../types";
import { groupByDay, initialsOf, jobScheduleLabel, timeLabel } from "./helpers";

type Role = "worker" | "employer";

interface Props {
  conversation: Conversation;
  messages: Message[];
  myProfileId: string | null;
  myName: string;
  role: Role;
  online: boolean;
  othersTyping: boolean;
  loadingMessages: boolean;
  onSend: (content: string) => void;
  onJobAction: (action: "accept" | "decline" | "complete" | "cancel") => void;
  onTypingChange: (isTyping: boolean) => void;
  onBack: () => void;
}

const BANNER_VISIBLE: JobStatus[] = ["pending", "accepted"];

export default function ChatPanel({
  conversation,
  messages,
  myProfileId,
  myName,
  role,
  online,
  othersTyping,
  loadingMessages,
  onSend,
  onJobAction,
  onTypingChange,
  onBack,
}: Props) {
  const { participant, linkedJob } = conversation;
  const [text, setText] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLTextAreaElement>(null);
  const typingTimer = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  );

  // Scroll to newest on message change / typing.
  // biome-ignore lint/correctness/useExhaustiveDependencies: messages/othersTyping are intentional scroll triggers
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, othersTyping]);

  // Auto-resize the textarea up to its max height.
  // biome-ignore lint/correctness/useExhaustiveDependencies: `text` drives the resize each keystroke
  useEffect(() => {
    const el = textRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 70)}px`;
  }, [text]);

  const emitTyping = (value: boolean) => onTypingChange(value);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
    emitTyping(true);
    clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => emitTyping(false), 1500);
  };

  const submit = () => {
    const content = text.trim();
    if (!content) return;
    setText("");
    emitTyping(false);
    clearTimeout(typingTimer.current);
    onSend(content);
  };

  const subtitle = [
    participant.role
      ? participant.role[0].toUpperCase() + participant.role.slice(1)
      : null,
    online ? "Online" : "Offline",
    // location isn't on the conversation payload yet — omitted gracefully.
  ].filter(Boolean);

  const showBanner = linkedJob && BANNER_VISIBLE.includes(linkedJob.status);
  const groups = groupByDay(messages);

  return (
    <div className="msg-chat">
      {/* ── Header ── */}
      <div className="msg-chat-head">
        <div className="msg-chat-head-left">
          <button
            type="button"
            className="msg-back"
            onClick={onBack}
            aria-label="Back"
          >
            <ChevronLeft size={20} />
          </button>
          <span className="msg-avatar-wrap">
            <span
              className="msg-avatar sm"
              style={{ background: participant.avatarColor }}
            >
              {participant.initials}
            </span>
            {online && <span className="msg-online-dot" />}
          </span>
          <div>
            <div className="msg-chat-name">{participant.name}</div>
            <div className="msg-chat-sub">
              {subtitle.map((s, i) => (
                <span
                  key={s}
                  className={s === "Online" ? "msg-online-text" : undefined}
                >
                  {i > 0 && <span className="msg-sub-dot" />}
                  {s}
                </span>
              ))}
            </div>
          </div>
        </div>
        <div className="msg-chat-head-actions">
          <button
            type="button"
            className="msg-icon-btn"
            aria-label="View profile"
          >
            <User size={15} />
          </button>
          <button type="button" className="msg-icon-btn" aria-label="Call">
            <Phone size={15} />
          </button>
          <button type="button" className="msg-icon-btn" aria-label="More">
            <MoreHorizontal size={15} />
          </button>
        </div>
      </div>

      {/* ── Job context banner ── */}
      {showBanner && linkedJob && (
        <div className="msg-banner">
          <div className="msg-banner-left">
            <span className="msg-banner-icon">
              <Briefcase size={14} />
            </span>
            <div>
              <div className="msg-banner-title">
                {linkedJob.title} · {linkedJob.location}
              </div>
              <div className="msg-banner-sub">
                {[
                  jobScheduleLabel(linkedJob.scheduledAt),
                  bannerStatusText(linkedJob.status, role),
                ]
                  .filter(Boolean)
                  .join(" · ")}
              </div>
            </div>
          </div>
          <div className="msg-banner-actions">
            {renderBannerActions(linkedJob.status, role, onJobAction)}
          </div>
        </div>
      )}

      {/* ── Messages ── */}
      <div className="msg-thread">
        {loadingMessages ? (
          <div className="msg-thread-loading">Loading…</div>
        ) : messages.length === 0 ? (
          <div className="msg-empty-inner">
            <MessageSquare size={40} className="msg-empty-icon" />
            <p className="msg-empty-sub">
              Send a message to start the conversation.
            </p>
          </div>
        ) : (
          groups.map((group) => (
            <div key={group.key} className="msg-day-group">
              <div className="msg-day-sep">
                <span className="msg-day-line" />
                <span className="msg-day-label">{group.label}</span>
                <span className="msg-day-line" />
              </div>
              {group.messages.map((m) => {
                if (m.type === "system") {
                  return (
                    <div key={m.id} className="msg-system">
                      <span className="msg-system-pill">{m.content}</span>
                    </div>
                  );
                }
                const mine = m.senderId === myProfileId;
                const read = !!m.readAt;
                return (
                  <div key={m.id} className={`msg-row${mine ? " mine" : ""}`}>
                    <span
                      className={`msg-avatar xs${mine ? " navy" : ""}`}
                      style={
                        mine
                          ? undefined
                          : { background: participant.avatarColor }
                      }
                    >
                      {mine ? initialsOf(myName) : participant.initials}
                    </span>
                    <div className="msg-bubble-wrap">
                      <div className={`msg-bubble${mine ? " mine" : ""}`}>
                        {m.content}
                      </div>
                      <div className={`msg-meta${mine ? " mine" : ""}`}>
                        <span>{timeLabel(m.createdAt)}</span>
                        {mine && (
                          <CheckCheck
                            size={13}
                            className={`msg-receipt${read ? " read" : ""}`}
                          />
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ))
        )}

        {othersTyping && (
          <div className="msg-row">
            <span
              className="msg-avatar xs"
              style={{ background: participant.avatarColor }}
            >
              {participant.initials}
            </span>
            <div className="msg-bubble typing">
              <span className="msg-dot" />
              <span className="msg-dot" />
              <span className="msg-dot" />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* ── Input ── */}
      <div className="msg-input-area">
        <div className="msg-input-wrap">
          <button
            type="button"
            className="msg-input-icon"
            aria-label="Attach file"
          >
            <Paperclip size={16} />
          </button>
          <button
            type="button"
            className="msg-input-icon"
            aria-label="Attach photo"
          >
            <ImagePlus size={16} />
          </button>
          <textarea
            ref={textRef}
            className="msg-textarea"
            rows={1}
            placeholder="Type a message..."
            value={text}
            onChange={handleChange}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                submit();
              }
            }}
          />
          <button
            type="button"
            className="msg-send"
            onClick={submit}
            disabled={!text.trim()}
            aria-label="Send"
          >
            <Send size={15} />
          </button>
        </div>
      </div>
    </div>
  );
}

function bannerStatusText(status: JobStatus, role: Role): string {
  if (status === "accepted") return "Accepted";
  if (status === "pending")
    return role === "worker"
      ? "Awaiting your response"
      : "Awaiting their response";
  return status;
}

function renderBannerActions(
  status: JobStatus,
  role: Role,
  onJobAction: Props["onJobAction"],
) {
  if (role === "worker") {
    if (status === "pending") {
      return (
        <>
          <button
            type="button"
            className="msg-btn ghost"
            onClick={() => onJobAction("decline")}
          >
            Decline
          </button>
          <button
            type="button"
            className="msg-btn gold"
            onClick={() => onJobAction("accept")}
          >
            <Check size={13} /> Accept job
          </button>
        </>
      );
    }
    // accepted
    return (
      <button
        type="button"
        className="msg-btn gold"
        onClick={() => onJobAction("complete")}
      >
        <Check size={13} /> Mark complete
      </button>
    );
  }
  // employer
  if (status === "pending") {
    return (
      <>
        <button type="button" className="msg-btn outline">
          View request
        </button>
        <button
          type="button"
          className="msg-btn ghost"
          onClick={() => onJobAction("cancel")}
        >
          Cancel request
        </button>
      </>
    );
  }
  return <span className="msg-banner-status">Accepted</span>;
}
